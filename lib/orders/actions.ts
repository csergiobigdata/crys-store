"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { notifyAdminNewPixOrder } from "@/lib/email/notify-admin";
import { sendOrderCreatedEmail } from "@/lib/email/notify-customer";
import { isCardPaymentEnabled } from "@/lib/mercadopago/card-enabled";
import { type CepAddress, lookupCepAddress } from "@/lib/orders/cep-lookup";
import { getShippingOptions, type ShippingOption } from "@/lib/orders/shipping";
import { cartHasTestProduct } from "@/lib/orders/test-products";
import { createPixPaymentForOrder } from "@/lib/pix/create-payment";
import { getPixExpirationHours } from "@/lib/pix/settings";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { type CheckoutInput, checkoutSchema } from "@/lib/validations/checkout";

export type CheckoutFormState = { error: string } | undefined;

async function clientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export type CepQuote = {
  address: CepAddress | null;
  /** Preenchido quando o endereço não pôde ser localizado automaticamente. */
  addressError: string | null;
  /** Opções de envio (origem Atibaia-SP) para este destino. */
  options: ShippingOption[];
};

/**
 * Resolve o endereço do CEP e as opções de frete em uma só chamada. O frete
 * depende do CEP (estado) e da cidade (Atibaia e região têm entrega local);
 * se a consulta de endereço falhar, ainda calculamos pelo CEP e o cliente
 * preenche o endereço à mão.
 */
export async function getCepQuote(
  cep: string,
  totalUnits: number,
  variantIds: string[] = [],
): Promise<CepQuote | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const allowed = await checkRateLimit({
    bucket: "cep_lookup",
    identifier: await clientIp(),
    maxAttempts: 40,
    windowMinutes: 10,
  });
  const lookup = allowed ? await lookupCepAddress(digits) : ({ status: "unavailable" } as const);

  const city = lookup.status === "ok" ? lookup.address.city : undefined;
  const hasTestProduct = await cartHasTestProduct(variantIds);
  const quote = getShippingOptions({ cep: digits, city, totalUnits, hasTestProduct });
  if (!quote) {
    return { address: null, addressError: "CEP não encontrado.", options: [] };
  }

  if (lookup.status === "ok") {
    return { address: lookup.address, addressError: null, options: quote.options };
  }
  return {
    address: null,
    addressError: !allowed
      ? "Muitas consultas de CEP. Preencha o endereço manualmente."
      : lookup.status === "not_found"
        ? "CEP não encontrado. Confira o número ou preencha o endereço manualmente."
        : "Não conseguimos buscar o endereço agora. Preencha manualmente — o frete já foi calculado.",
    options: quote.options,
  };
}

export async function createOrder(
  _prevState: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const ip = await clientIp();
  const allowed = await checkRateLimit({
    bucket: "checkout",
    identifier: ip,
    maxAttempts: 10,
    windowMinutes: 15,
  });
  if (!allowed) {
    return {
      error: "Muitas tentativas de finalizar pedido. Aguarde alguns minutos e tente novamente.",
    };
  }

  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Carrinho inválido. Atualize a página e tente novamente." };
  }

  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    cep: formData.get("cep"),
    street: formData.get("street"),
    number: formData.get("number"),
    complement: formData.get("complement"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state"),
    paymentMethod: formData.get("paymentMethod"),
    shippingMethod: formData.get("shippingMethod"),
    couponCode: formData.get("couponCode") || undefined,
    items,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revise os dados do formulário." };
  }

  const data = parsed.data;
  if (data.paymentMethod === "cartao" && !isCardPaymentEnabled()) {
    return { error: "Pagamento por cartão indisponível no momento. Escolha Pix." };
  }
  const user = await getCurrentUser();
  const [cityLookup, pixExpirationHours] = await Promise.all([
    lookupCepAddress(data.cep),
    data.paymentMethod === "pix" ? getPixExpirationHours() : Promise.resolve(0),
  ]);

  // O frete é recalculado aqui no servidor: o cliente só escolhe o serviço, nunca
  // envia o valor. A cidade vem da consulta do CEP (com a digitada como reserva).
  const totalUnits = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const quote = getShippingOptions({
    cep: data.cep,
    city: cityLookup.status === "ok" ? cityLookup.address.city : data.city,
    totalUnits,
    hasTestProduct: await cartHasTestProduct(data.items.map((item) => item.variantId)),
  });
  const shippingOption = quote?.options.find((option) => option.id === data.shippingMethod);
  if (!shippingOption) {
    return {
      error: "A opção de envio escolhida não está disponível. Selecione outra e tente novamente.",
    };
  }
  const shippingCost = shippingOption.price;
  const supabase = createAdminClient();

  const { data: rows, error } = await supabase.rpc("checkout_create_order", {
    p_profile_id: user?.id ?? null,
    p_guest_name: data.fullName,
    p_guest_email: data.email,
    p_guest_phone: data.phone,
    p_guest_cpf: data.cpf,
    p_shipping_address: {
      cep: data.cep,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      shipping_method: shippingOption.id,
      shipping_method_label: shippingOption.label,
      shipping_deadline: shippingOption.deadline,
    },
    p_shipping_cost: shippingCost,
    p_items: data.items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
    p_payment_method: data.paymentMethod,
    p_coupon_code: data.couponCode ?? null,
    p_pix_expiration_hours: pixExpirationHours,
  });

  if (error || !rows || rows.length === 0) {
    // Mostra a causa real no log do servidor; ao cliente vai a mensagem amigável.
    console.error("Falha ao criar pedido (checkout_create_order):", error?.message ?? "sem linhas");
    return { error: mapCheckoutError(error?.message) };
  }

  if (user) {
    await supabase.from("cart_items").delete().eq("profile_id", user.id);
    await saveCustomerDefaults(supabase, user.id, data);
  }

  const order = rows[0];
  const total = Number(order.total);

  if (data.paymentMethod === "pix") {
    await createPixPaymentForOrder({
      orderId: order.order_id,
      orderNumber: order.order_number,
      total,
      payerEmail: data.email,
      payerName: data.fullName,
      payerCpf: data.cpf,
      expiresAt: new Date(Date.now() + pixExpirationHours * 36e5),
    });
    await notifyAdminNewPixOrder({
      orderNumber: order.order_number,
      total,
      customerName: data.fullName,
    });
  }

  await sendOrderCreatedEmail({
    to: data.email,
    orderNumber: order.order_number,
    accessToken: order.access_token,
    total,
  });

  redirect(`/pedidos/${order.order_number}?token=${order.access_token}`);
}

/**
 * Guarda CPF, telefone e endereço do primeiro pedido no perfil, para que os
 * próximos checkouts já venham preenchidos. Nunca sobrescreve o que o
 * cliente já tem salvo e nunca derruba o pedido se algo falhar.
 */
async function saveCustomerDefaults(
  supabase: ReturnType<typeof createAdminClient>,
  profileId: string,
  data: CheckoutInput,
) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("cpf, phone")
      .eq("id", profileId)
      .maybeSingle();

    const profileUpdate: { cpf?: string; phone?: string } = {};
    if (!profile?.cpf) profileUpdate.cpf = data.cpf;
    if (!profile?.phone) profileUpdate.phone = data.phone;
    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from("profiles").update(profileUpdate).eq("id", profileId);
    }

    const { count } = await supabase
      .from("addresses")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId);
    if (!count) {
      await supabase.from("addresses").insert({
        profile_id: profileId,
        label: "Entrega",
        cep: data.cep,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        is_default: true,
      });
    }
  } catch (error) {
    console.error("Não foi possível salvar os dados do cliente:", error);
  }
}

function mapCheckoutError(message?: string): string {
  if (!message) return "Não foi possível finalizar o pedido. Tente novamente.";
  if (message.startsWith("insufficient_stock")) {
    return "Um dos itens do carrinho não tem mais estoque suficiente. Ajuste o carrinho e tente novamente.";
  }
  if (message.startsWith("variant_not_found")) {
    return "Um dos itens do carrinho não está mais disponível.";
  }
  if (message === "invalid_coupon") {
    return "Cupom inválido, expirado ou não aplicável a este pedido.";
  }
  if (message === "empty_cart") {
    return "Seu carrinho está vazio.";
  }
  return "Não foi possível finalizar o pedido. Tente novamente.";
}

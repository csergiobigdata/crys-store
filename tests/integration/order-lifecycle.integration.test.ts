/**
 * Testes de integração contra um projeto Supabase real, com as migrações
 * de supabase/migrations/ aplicadas. Não rodam em CI nem no dia a dia —
 * só quando SUPABASE_TEST_URL e SUPABASE_TEST_SERVICE_ROLE_KEY existem.
 *
 * IMPORTANTE: nunca aponte isso para o projeto de produção. Use um
 * projeto Supabase dedicado a testes (o plano gratuito já serve).
 *
 *   SUPABASE_TEST_URL=https://xxxx.supabase.co \
 *   SUPABASE_TEST_SERVICE_ROLE_KEY=... \
 *   SUPABASE_TEST_ANON_KEY=... \
 *   npx vitest run tests/integration
 *
 * Este arquivo nunca foi executado contra um banco real — foi escrito e
 * revisado com cuidado, mas só a primeira execução real vai confirmar que
 * bate com o schema. Ver README.md > Testes.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const SUPABASE_TEST_URL = process.env.SUPABASE_TEST_URL;
const SUPABASE_TEST_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const SUPABASE_TEST_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY;

const hasTestEnv = Boolean(SUPABASE_TEST_URL && SUPABASE_TEST_SERVICE_ROLE_KEY);

describe.skipIf(!hasTestEnv)("ciclo de vida do pedido (integração real)", () => {
  let admin: SupabaseClient;
  let categoryId: string;
  let productId: string;
  let variantId: string;

  const uniqueSuffix = Date.now();

  beforeAll(async () => {
    admin = createClient(SUPABASE_TEST_URL!, SUPABASE_TEST_SERVICE_ROLE_KEY!);

    const { data: category, error: categoryError } = await admin
      .from("categories")
      .insert({ name: `Teste ${uniqueSuffix}`, slug: `teste-${uniqueSuffix}` })
      .select("id")
      .single();
    if (categoryError) throw categoryError;
    categoryId = category.id;

    const { data: product, error: productError } = await admin
      .from("products")
      .insert({
        category_id: categoryId,
        name: `Produto de teste ${uniqueSuffix}`,
        slug: `produto-teste-${uniqueSuffix}`,
        base_price: 100,
      })
      .select("id")
      .single();
    if (productError) throw productError;
    productId = product.id;

    const { data: variant, error: variantError } = await admin
      .from("product_variants")
      .insert({
        product_id: productId,
        sku: `SKU-TESTE-${uniqueSuffix}`,
        stock_quantity: 1,
      })
      .select("id")
      .single();
    if (variantError) throw variantError;
    variantId = variant.id;
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.from("product_variants").delete().eq("product_id", productId);
    await admin.from("products").delete().eq("id", productId);
    await admin.from("categories").delete().eq("id", categoryId);
  });

  function checkoutPayload(paymentMethod: "pix" | "cartao") {
    return {
      p_profile_id: null,
      p_guest_name: "Cliente de Teste",
      p_guest_email: "teste@example.com",
      p_guest_phone: "11999999999",
      p_guest_cpf: "52998224725",
      p_shipping_address: {
        cep: "01310100",
        street: "Av. Paulista",
        number: "1000",
        complement: "",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
      },
      p_shipping_cost: 10,
      p_items: [{ variant_id: variantId, quantity: 1 }],
      p_payment_method: paymentMethod,
      p_coupon_code: null,
      p_pix_expiration_hours: 24,
    };
  }

  it("recalcula o total a partir do preço no banco, ignorando qualquer valor externo", async () => {
    const { data, error } = await admin.rpc(
      "checkout_create_order",
      checkoutPayload("pix"),
    );
    expect(error).toBeNull();
    const order = data![0];
    // base_price=100 + frete=10, nenhum valor de preço é aceito como parâmetro
    expect(Number(order.total)).toBe(110);

    await admin.from("orders").delete().eq("id", order.order_id);
  });

  it("impede duas compras simultâneas de levarem a última unidade", async () => {
    const [first, second] = await Promise.all([
      admin.rpc("checkout_create_order", checkoutPayload("pix")),
      admin.rpc("checkout_create_order", checkoutPayload("pix")),
    ]);

    const results = [first, second];
    const succeeded = results.filter((r) => !r.error);
    const failed = results.filter((r) => r.error);

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].error?.message).toContain("insufficient_stock");

    const orderId = succeeded[0].data![0].order_id;
    await admin.from("orders").delete().eq("id", orderId);

    const { data: variant } = await admin
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", variantId)
      .single();
    expect(variant?.stock_quantity).toBe(0);

    // Devolve o estoque para não quebrar os próximos testes deste arquivo.
    await admin.from("product_variants").update({ stock_quantity: 1 }).eq("id", variantId);
  });

  it("expira um pedido Pix vencido e libera o estoque reservado", async () => {
    const { data, error } = await admin.rpc(
      "checkout_create_order",
      checkoutPayload("pix"),
    );
    expect(error).toBeNull();
    const order = data![0];

    await admin
      .from("orders")
      .update({ pix_expires_at: new Date(Date.now() - 60_000).toISOString() })
      .eq("id", order.order_id);

    const { data: expired } = await admin.rpc("expire_pix_order", {
      p_order_id: order.order_id,
    });
    expect(expired).toBe(true);

    const { data: refreshedOrder } = await admin
      .from("orders")
      .select("status")
      .eq("id", order.order_id)
      .single();
    expect(refreshedOrder?.status).toBe("expirado");

    const { data: variant } = await admin
      .from("product_variants")
      .select("stock_quantity")
      .eq("id", variantId)
      .single();
    expect(variant?.stock_quantity).toBe(1);

    await admin.from("orders").delete().eq("id", order.order_id);
  });

  it("notificação de pagamento Mercado Pago duplicada não reprocessa o pedido", async () => {
    const { data, error } = await admin.rpc(
      "checkout_create_order",
      checkoutPayload("cartao"),
    );
    expect(error).toBeNull();
    const order = data![0];
    const idempotencyKey = `test-${uniqueSuffix}`;

    const firstResult = await admin.rpc("record_mercadopago_payment_result", {
      p_order_id: order.order_id,
      p_mp_payment_id: `mp-${uniqueSuffix}`,
      p_status: "approved",
      p_status_detail: "accredited",
      p_idempotency_key: idempotencyKey,
      p_installments: 1,
      p_raw_payload: null,
    });
    expect(firstResult.data).toBe("pago");

    // Mesma notificação chegando de novo (webhook duplicado) — idempotente.
    const secondResult = await admin.rpc("record_mercadopago_payment_result", {
      p_order_id: order.order_id,
      p_mp_payment_id: `mp-${uniqueSuffix}`,
      p_status: "approved",
      p_status_detail: "accredited",
      p_idempotency_key: idempotencyKey,
      p_installments: 1,
      p_raw_payload: null,
    });
    expect(secondResult.data).toBe("pago");

    const { count } = await admin
      .from("order_status_history")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.order_id)
      .eq("to_status", "pago");
    expect(count).toBe(1);

    await admin.from("mercadopago_payments").delete().eq("order_id", order.order_id);
    await admin.from("orders").delete().eq("id", order.order_id);
  });

  it("RLS impede que um usuário anônimo leia audit_log ou mercadopago_payments", async () => {
    if (!SUPABASE_TEST_ANON_KEY) {
      return;
    }
    const anon = createClient(SUPABASE_TEST_URL!, SUPABASE_TEST_ANON_KEY);

    const auditResult = await anon.from("audit_log").select("id").limit(1);
    const mpResult = await anon.from("mercadopago_payments").select("id").limit(1);

    expect(auditResult.data ?? []).toHaveLength(0);
    expect(mpResult.data ?? []).toHaveLength(0);
  });
});

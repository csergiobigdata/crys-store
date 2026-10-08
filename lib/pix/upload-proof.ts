"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { notifyAdminPixProofUploaded } from "@/lib/email/notify-admin";
import { getOrderForViewing } from "@/lib/orders/get-order";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeFileExtension } from "@/lib/utils/safe-extension";

export type UploadProofState = { error?: string; success?: boolean } | undefined;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function uploadPixProof(
  _prevState: UploadProofState,
  formData: FormData,
): Promise<UploadProofState> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const token = String(formData.get("token") ?? "");
  const file = formData.get("file");

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const allowed = await checkRateLimit({
    bucket: "pix_proof_upload",
    identifier: ip,
    maxAttempts: 10,
    windowMinutes: 60,
  });
  if (!allowed) {
    return { error: "Muitas tentativas de envio. Aguarde um pouco e tente novamente." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo (imagem ou PDF)." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Envie uma imagem (JPEG, PNG, WebP) ou um PDF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "O arquivo deve ter até 5 MB." };
  }

  const order = await getOrderForViewing(orderNumber, token);
  if (!order) {
    return { error: "Pedido não encontrado." };
  }
  if (order.payment_method !== "pix" || !["aguardando_pagamento", "em_analise"].includes(order.status)) {
    return { error: "Este pedido não está mais aguardando comprovante." };
  }

  const supabase = createAdminClient();
  const extension = safeFileExtension(file.name, "bin");
  const path = `${order.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: "Não foi possível enviar o arquivo. Tente novamente." };
  }

  await supabase
    .from("pix_payments")
    .update({
      proof_file_path: path,
      proof_uploaded_at: new Date().toISOString(),
      review_status: "em_analise",
    })
    .eq("order_id", order.id);

  if (order.status === "aguardando_pagamento") {
    await supabase
      .from("orders")
      .update({ status: "em_analise" })
      .eq("id", order.id);

    await supabase.from("order_status_history").insert({
      order_id: order.id,
      from_status: "aguardando_pagamento",
      to_status: "em_analise",
      note: "Comprovante de pagamento Pix enviado pelo cliente.",
    });
  }

  await notifyAdminPixProofUploaded({ orderNumber: order.order_number });

  revalidatePath(`/pedidos/${order.order_number}`);

  return { success: true };
}

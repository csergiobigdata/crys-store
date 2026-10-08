import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const SECRET = "test-webhook-secret";

function sign(manifest: string) {
  return createHmac("sha256", SECRET).update(manifest).digest("hex");
}

function buildHeader(ts: string, v1: string) {
  return `ts=${ts},v1=${v1}`;
}

describe("verifyWebhookSignature", () => {
  let verifyWebhookSignature: typeof import("./verify-webhook-signature").verifyWebhookSignature;

  beforeAll(async () => {
    // Variáveis precisam existir antes do primeiro import (getMpEnv faz
    // cache na primeira chamada).
    process.env.NEXT_PUBLIC_MP_PUBLIC_KEY = "pub-test";
    process.env.MP_ACCESS_TOKEN = "access-test";
    process.env.MP_WEBHOOK_SECRET = SECRET;
    process.env.MP_MAX_INSTALLMENTS = "6";

    ({ verifyWebhookSignature } = await import("./verify-webhook-signature"));
  });

  it("aceita uma assinatura calculada corretamente com o manifesto oficial", () => {
    const dataId = "123456789";
    const xRequestId = "req-abc-123";
    const ts = String(Math.floor(Date.now() / 1000));
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    const result = verifyWebhookSignature({
      xSignature: buildHeader(ts, sign(manifest)),
      xRequestId,
      dataId,
    });

    expect(result).toBe(true);
  });

  it("rejeita quando o hash não corresponde (segredo errado ou payload adulterado)", () => {
    const dataId = "123456789";
    const xRequestId = "req-abc-123";
    const ts = String(Math.floor(Date.now() / 1000));
    const wrongManifest = `id:${dataId};request-id:${xRequestId};ts:${ts};EXTRA`;

    const result = verifyWebhookSignature({
      xSignature: buildHeader(ts, sign(wrongManifest)),
      xRequestId,
      dataId,
    });

    expect(result).toBe(false);
  });

  it("rejeita quando data.id foi trocado após a assinatura ser calculada", () => {
    const xRequestId = "req-abc-123";
    const ts = String(Math.floor(Date.now() / 1000));
    const manifest = `id:111111111;request-id:${xRequestId};ts:${ts};`;

    const result = verifyWebhookSignature({
      xSignature: buildHeader(ts, sign(manifest)),
      xRequestId,
      dataId: "222222222", // não é o id usado no manifesto assinado
    });

    expect(result).toBe(false);
  });

  it("rejeita quando o header x-signature está ausente", () => {
    const result = verifyWebhookSignature({
      xSignature: null,
      xRequestId: "req-abc-123",
      dataId: "123456789",
    });

    expect(result).toBe(false);
  });

  it("rejeita um timestamp muito antigo (fora da tolerância de replay)", () => {
    const dataId = "123456789";
    const xRequestId = "req-abc-123";
    const oldTs = String(Math.floor(Date.now() / 1000) - 3600); // 1h atrás
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${oldTs};`;

    const result = verifyWebhookSignature({
      xSignature: buildHeader(oldTs, sign(manifest)),
      xRequestId,
      dataId,
    });

    expect(result).toBe(false);
  });
});

import type { NextConfig } from "next";

// Payment Brick do Mercado Pago carrega um script remoto e abre iframes
// próprios para o fluxo de cartão — por isso script-src/frame-src/connect-src
// precisam liberar os domínios deles. [REVISAR] Se o checkout com cartão
// falhar silenciosamente em produção, confira o console do navegador por
// bloqueios de CSP primeiro: a lista abaixo cobre os domínios documentados,
// mas o Mercado Pago pode usar subdomínios adicionais não testados aqui
// (não há como validar isso sem credenciais reais de sandbox).
const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://sdk.mercadopago.com https://http2.mlstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://picsum.photos https://images.pexels.com https://http2.mlstatic.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://events.mercadopago.com https://http2.mlstatic.com",
  "frame-src 'self' https://www.mercadopago.com https://www.mercadopago.com.br",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
        ],
      },
    ];
  },
  // Cache Components (PPR) do Next.js 16 exigiria envolver em <Suspense> +
  // "use cache: private" toda leitura de sessão (cookies()) — ou seja,
  // praticamente todo Server Component deste app, já que carrinho, conta,
  // checkout e admin dependem do usuário logado. Mantemos o modelo de
  // renderização dinâmica tradicional (como em versões anteriores do
  // Next.js) para não pagar essa complexidade em todas as próximas etapas.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        // Fotos de exemplo do catálogo (Pexels, licença livre p/ uso comercial).
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/**",
      },
      {
        // Fotos de produto vêm do bucket público do Supabase Storage
        // (<project-ref>.supabase.co/storage/v1/object/public/...).
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

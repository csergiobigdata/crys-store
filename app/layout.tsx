import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { PresenceTracker } from "@/components/site/presence-tracker";
import { getCurrentUser } from "@/lib/auth/session";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// A loja tem uma única paleta (clara). "only light" avisa o navegador do celular
// para NÃO escurecer as cores automaticamente (modo escuro forçado em sites).
export const viewport: Viewport = {
  colorScheme: "only light",
};

export const metadata: Metadata = {
  title: {
    default: "Chrys Store",
    template: "%s | Chrys Store",
  },
  description:
    "Chrys Store — joias artesanais, caixas de presente, decorações e bijuterias com entrega para todo o Brasil. Pague no Pix ou no cartão de crédito.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${playfairDisplay.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <CartProvider isLoggedIn={Boolean(user)}>
          <Header user={user} />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieBanner />
          <PresenceTracker isLoggedIn={Boolean(user)} />
        </CartProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CookieBanner } from "@/components/legal/cookie-banner";
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
        </CartProvider>
      </body>
    </html>
  );
}

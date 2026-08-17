import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductIconDefs } from "@/components/ProductIcon";
import { fetchTheme, type Theme } from "@/lib/api";

export const metadata: Metadata = {
  title: {
    default: "The Knitted Cloud Company — Handknitted Toys, Blankets & Nursery Textiles",
    template: "%s | The Knitted Cloud Company",
  },
  description:
    "Hand-knitted teddy bears, blankets and nursery textiles made slowly in small batches from natural fibres. Every piece passes through one knitter's hands from cast-on to bind-off.",
};

// Maps admin-configurable theme fields to the CSS custom properties they
// override — see globals.css for the defaults these replace.
const THEME_VAR_MAP: Record<string, string> = {
  buttonColor: '--color-gold',
  textColor: '--color-ink',
  popupColor: '--color-popup',
  headerColor: '--color-header',
  footerColor: '--color-footer',
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await fetchTheme().catch((): Theme => ({}));
  const overrides = Object.entries(theme)
    .filter(([key, value]) => value && THEME_VAR_MAP[key])
    .map(([key, value]) => `${THEME_VAR_MAP[key]}: ${value};`)
    .join(' ');

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* Next.js App Router manages <head> itself via the `metadata` export
            above — manually rendering a <head> element here causes a
            server/client hydration mismatch. A <style> tag works fine placed
            in <body> instead, so the dynamic theme override lives here. */}
        {overrides && <style>{`:root { ${overrides} }`}</style>}
        <AuthProvider>
          <CartProvider>
            <ProductIconDefs />
            <Header logoUrl={theme.logoUrl} />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

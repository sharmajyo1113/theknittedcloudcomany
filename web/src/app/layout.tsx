import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductIconDefs } from "@/components/ProductIcon";

export const metadata: Metadata = {
  title: {
    default: "The Knitted Cloud Company — Handknitted Toys, Blankets & Nursery Textiles",
    template: "%s | The Knitted Cloud Company",
  },
  description:
    "Hand-knitted teddy bears, blankets and nursery textiles made slowly in small batches from natural fibres. Every piece passes through one knitter's hands from cast-on to bind-off.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AuthProvider>
          <CartProvider>
            <ProductIconDefs />
            <Header />
            <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

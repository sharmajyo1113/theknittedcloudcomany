'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Product } from '@/lib/api';

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  icon: string;
  imagePath: string | null;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'knittedcloud-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt/blocked localStorage — just start with an empty cart.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value: CartContextValue = {
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    addItem(product, quantity = 1) {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        const cappedQty = Math.min((existing?.quantity || 0) + quantity, product.stock);
        if (existing) {
          return prev.map((i) => (i.productId === product.id ? { ...i, quantity: cappedQty } : i));
        }
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            icon: product.icon,
            imagePath: product.imagePath,
            stock: product.stock,
            quantity: Math.min(quantity, product.stock),
          },
        ];
      });
    },
    updateQuantity(productId, quantity) {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i))
      );
    },
    removeItem(productId) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    },
    clear() {
      setItems([]);
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

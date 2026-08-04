'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/lib/api';

export function AddToCartForm({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (product.stock === 0) {
    return <p className="mt-4 font-semibold text-danger">Out of stock — check back soon.</p>;
  }

  return (
    <div className="mt-6 flex items-end gap-3">
      <div>
        <label htmlFor="qty" className="mb-1 block text-sm font-semibold">
          Quantity
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          max={product.stock}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
          className="w-20 rounded border border-line bg-transparent px-3 py-2"
        />
      </div>
      <button
        onClick={() => {
          addItem(product, quantity);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="rounded-full bg-ink px-6 py-2.5 font-semibold text-fog-card"
      >
        {added ? 'Added ✓' : 'Add to Cart'}
      </button>
    </div>
  );
}

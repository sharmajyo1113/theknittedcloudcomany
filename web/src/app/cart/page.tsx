'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ProductIcon } from '@/components/ProductIcon';
import { money, shippingFeeFor, FREE_SHIPPING_THRESHOLD } from '@/lib/api';

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const shipping = shippingFeeFor(subtotal);
  const total = subtotal + shipping;

  return (
    <div>
      <h1 className="text-3xl">Your Cart</h1>

      {items.length === 0 ? (
        <div className="py-16 text-center text-ink-soft">
          <h3 className="text-lg text-ink">Your cart is empty.</h3>
          <Link href="/shop" className="mt-2 inline-block underline">
            Continue shopping →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 rounded-lg bg-fog-card p-4">
                <Link href={`/products/${item.slug}`} className="flex h-16 w-16 flex-none items-center justify-center rounded bg-fog">
                  {item.imagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imagePath} alt={item.name} className="h-full w-full rounded object-cover" />
                  ) : (
                    <ProductIcon icon={item.icon} size={44} />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/products/${item.slug}`} className="font-semibold">
                    {item.name}
                  </Link>
                  <div className="text-sm text-ink-soft">{money(item.price)} each</div>
                  {item.quantity >= item.stock && (
                    <div className="text-xs text-gold">Max available: {item.stock}</div>
                  )}
                </div>

                <input
                  type="number"
                  min={0}
                  max={item.stock}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, Math.max(0, Number(e.target.value) || 0))}
                  className="w-16 rounded border border-line bg-transparent px-2 py-1.5 text-center"
                />

                <div className="w-24 flex-none text-right font-semibold text-sky-deep">
                  {money(item.price * item.quantity)}
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Remove ${item.name}`}
                  className="flex-none text-ink-soft hover:text-danger"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}

            <Link href="/shop" className="inline-block pt-2 text-sm underline">
              ← Continue Shopping
            </Link>
          </div>

          <div className="h-fit rounded-lg bg-fog-card p-6">
            <h2 className="text-lg">Order Summary</h2>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-ink-soft">Shipping</span>
              <span>{shipping > 0 ? money(shipping) : 'Free'}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
            {shipping > 0 && (
              <p className="mt-3 text-xs text-ink-soft">
                Add {money(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping.
              </p>
            )}
            <Link
              href="/checkout"
              className="mt-5 block rounded-full bg-ink py-2.5 text-center font-semibold text-fog-card"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

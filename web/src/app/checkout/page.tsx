'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { createOrder, money, shippingFeeFor } from '@/lib/api';
import { stripeConfigured } from '@/lib/stripe';
import { CheckoutPaymentForm } from '@/components/CheckoutPaymentForm';

export default function CheckoutPage() {
  const { user, loading, getToken } = useAuth();
  const { items, subtotal } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({ name: '', address: '', city: '', postcode: '', phone: '', notes: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<{ orderId: string; clientSecret: string } | null>(null);

  const shipping = shippingFeeFor(subtotal);
  const total = subtotal + shipping;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setForm((f) => ({ ...f, name: f.name || user.displayName || '' }));
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && items.length === 0 && !orderResult) {
      router.push('/cart');
    }
  }, [loading, items.length, orderResult, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    for (const field of ['name', 'address', 'city', 'postcode', 'phone'] as const) {
      if (!form[field].trim()) {
        setError(`Please fill in your ${field}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('You need to be logged in to check out.');
      const result = await createOrder(
        token,
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        form
      );
      setOrderResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div>
      <h1 className="text-3xl">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          {error && <div className="mb-4 rounded border border-danger px-4 py-3 text-sm text-danger">{error}</div>}

          {orderResult ? (
            stripeConfigured ? (
              <CheckoutPaymentForm clientSecret={orderResult.clientSecret} orderId={orderResult.orderId} />
            ) : (
              <div className="rounded border border-line p-6">
                <h3 className="text-lg">Order placed — payment pending</h3>
                <p className="mt-2 text-sm text-ink-soft">
                  Your order #{orderResult.orderId} has been created, but online payment isn&apos;t
                  configured on this site yet (no Stripe keys set up). Nothing has been charged.
                </p>
                <Link href={`/account/orders/${orderResult.orderId}`} className="mt-4 inline-block underline">
                  View order details →
                </Link>
              </div>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-semibold">Recipient Name</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded border border-line bg-transparent px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="address" className="mb-1 block text-sm font-semibold">Address</label>
                <input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded border border-line bg-transparent px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="mb-1 block text-sm font-semibold">City</label>
                  <input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded border border-line bg-transparent px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="postcode" className="mb-1 block text-sm font-semibold">Postcode</label>
                  <input
                    id="postcode"
                    value={form.postcode}
                    onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                    className="w-full rounded border border-line bg-transparent px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-semibold">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded border border-line bg-transparent px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="notes" className="mb-1 block text-sm font-semibold">Order Notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded border border-line bg-transparent px-3 py-2"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-ink py-2.5 font-semibold text-fog-card disabled:opacity-60"
              >
                {submitting ? 'Placing Order…' : `Continue to Payment — ${money(total)}`}
              </button>
            </form>
          )}
        </div>

        <div className="h-fit rounded-lg bg-fog-card p-6">
          <h2 className="text-lg">Order Summary</h2>
          {items.map((item) => (
            <div key={item.productId} className="mt-3 flex justify-between text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span>{money(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="mt-4 flex justify-between border-t border-line pt-3 text-sm">
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
        </div>
      </div>
    </div>
  );
}

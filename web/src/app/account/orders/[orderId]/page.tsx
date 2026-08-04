'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchOrder, money, type Order } from '@/lib/api';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, loading, getToken } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const { order } = await fetchOrder(token, orderId);
        setOrder(order);
      } catch {
        setOrder(null);
      }
    })();
  }, [loading, user, orderId, getToken]);

  if (loading || order === undefined) return <p className="text-ink-soft">Loading…</p>;
  if (!user) return <p className="text-ink-soft">Please log in to view this order.</p>;
  if (order === null) {
    return (
      <div className="py-16 text-center text-ink-soft">
        <h3 className="text-lg text-ink">We couldn&apos;t find that order.</h3>
        <Link href="/account/orders" className="mt-2 inline-block underline">
          Back to order history
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/account/orders" className="text-sm underline">
        ← Order History
      </Link>

      {order.status === 'PENDING' && (
        <div className="mt-6 rounded border border-line px-4 py-3 text-sm text-ink-soft">
          Order placed — payment is still processing or hasn&apos;t been completed.
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h1 className="text-2xl">Order #{order.id.slice(-8).toUpperCase()}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-ink-soft">Placed {new Date(order.createdAt).toLocaleDateString()}</p>

      <div className="mt-6 rounded-lg bg-fog-card p-6">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between py-1.5 text-sm">
            <span>{item.productName} × {item.quantity}</span>
            <span>{money(item.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm">
          <span className="text-ink-soft">Subtotal</span>
          <span>{money(order.subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-ink-soft">Shipping</span>
          <span>{order.shippingFee > 0 ? money(order.shippingFee) : 'Free'}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold">
          <span>Total</span>
          <span>{money(order.total)}</span>
        </div>
      </div>

      <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-ink-soft">Shipping To</h3>
      <p className="mt-2 text-sm">
        {order.shippingName}
        <br />
        {order.shippingAddress}
        <br />
        {order.shippingCity} {order.shippingPostcode}
        <br />
        {order.shippingPhone}
      </p>

      {order.notes && (
        <>
          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-ink-soft">Notes</h3>
          <p className="mt-2 whitespace-pre-line text-sm">{order.notes}</p>
        </>
      )}
    </div>
  );
}

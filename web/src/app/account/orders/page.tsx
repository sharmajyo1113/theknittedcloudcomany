'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchOrders, money, type Order } from '@/lib/api';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

export default function OrderHistoryPage() {
  const { user, loading, getToken } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const { orders } = await fetchOrders(token);
      setOrders(orders);
    })();
  }, [loading, user, getToken]);

  if (loading || orders === null) return <p className="text-ink-soft">Loading…</p>;
  if (!user) return <p className="text-ink-soft">Please log in to view your orders.</p>;

  return (
    <div>
      <h1 className="text-3xl">Order History</h1>

      {orders.length === 0 ? (
        <div className="py-16 text-center text-ink-soft">
          <h3 className="text-lg text-ink">No orders yet</h3>
          <Link href="/shop" className="mt-2 inline-block underline">
            Start shopping →
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg bg-fog-card p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="font-semibold">Order #{order.id.slice(-8).toUpperCase()}</span>
                  <span className="ml-2 text-sm text-ink-soft">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-sky-deep">{money(order.total)}</span>
                <Link href={`/account/orders/${order.id}`} className="text-sm underline">
                  View details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

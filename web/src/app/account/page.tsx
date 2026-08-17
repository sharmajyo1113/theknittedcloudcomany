'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchOrders, checkIsAdmin, money, type Order } from '@/lib/api';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

export default function AccountPage() {
  const { user, loading, getToken } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const token = await getToken();
      if (!token) return;

      // Independent of each other — a failure fetching orders shouldn't
      // block the admin check (or vice versa) from ever resolving.
      checkIsAdmin(token).then(setIsAdmin);
      try {
        const { orders } = await fetchOrders(token);
        setOrders(orders.slice(0, 5));
      } catch {
        setOrders([]);
      }
    })();
  }, [loading, user, getToken]);

  if (loading) return <p className="text-ink-soft">Loading…</p>;
  if (!user) return <p className="text-ink-soft">Please log in to view your account.</p>;

  return (
    <div>
      <h1 className="text-3xl">My Account</h1>
      <p className="mt-1 text-ink-soft">
        Signed in as <strong>{user.displayName || user.email}</strong> ({user.email})
      </p>

      {isAdmin && (
        <Link
          href="/admin"
          className="mt-4 inline-block rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink"
        >
          Go to Admin Portal →
        </Link>
      )}

      <div className="mt-8 flex items-end justify-between border-b border-line pb-4">
        <h2 className="text-xl">Recent Orders</h2>
        <Link href="/account/orders" className="text-sm underline">
          View all →
        </Link>
      </div>

      {orders === null ? (
        <p className="mt-6 text-ink-soft">Loading orders…</p>
      ) : orders.length === 0 ? (
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

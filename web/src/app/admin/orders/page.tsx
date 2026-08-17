'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminOrders, updateAdminOrderStatus, money, type AdminOrder } from '@/lib/api';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';

const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load(status?: string) {
    const token = await getToken();
    if (!token) return;
    const { orders } = await fetchAdminOrders(token, status || undefined);
    setOrders(orders);
    setLoaded(true);
  }

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getToken, filter]);

  async function handleStatusChange(order: AdminOrder, status: string) {
    setUpdating(order.id);
    const token = await getToken();
    if (!token) return;
    const { order: updated } = await updateAdminOrderStatus(token, order.id, status);
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)));
    setUpdating(null);
  }

  if (!loaded) return <p className="text-ink-soft">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Orders ({orders.length})</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded border border-line bg-fog px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-ink-soft">No orders yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg bg-fog-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-semibold">Order #{order.id.slice(-8).toUpperCase()}</span>
                  <span className="ml-2 text-sm text-ink-soft">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <div className="text-sm text-ink-soft">
                    {order.user?.name || 'Unknown'} — {order.user?.email || order.userId}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sky-deep">{money(order.total)}</span>
                  <OrderStatusBadge status={order.status} />
                  <select
                    value={order.status}
                    disabled={updating === order.id}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                    className="rounded border border-line bg-fog px-2 py-1 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setExpanded((id) => (id === order.id ? null : order.id))}
                    className="text-sm underline"
                  >
                    {expanded === order.id ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>

              {expanded === order.id && (
                <div className="mt-4 border-t border-line pt-4 text-sm">
                  <p>
                    <strong>{order.shippingName}</strong>
                    <br />
                    {order.shippingAddress}, {order.shippingCity} {order.shippingPostcode}
                    <br />
                    {order.shippingPhone}
                  </p>
                  {order.notes && <p className="mt-2 text-ink-soft">Note: {order.notes}</p>}
                  <ul className="mt-3 space-y-1">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span>
                          {item.productName} × {item.quantity}
                        </span>
                        <span>{money(item.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

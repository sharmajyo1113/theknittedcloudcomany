'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminCustomers, money, type AdminCustomer } from '@/lib/api';

export default function AdminCustomersPage() {
  const { getToken } = useAuth();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const { customers } = await fetchAdminCustomers(token);
      setCustomers(customers);
      setLoaded(true);
    })();
  }, [getToken]);

  if (!loaded) return <p className="text-ink-soft">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl">Customers ({customers.length})</h1>

      {customers.length === 0 ? (
        <p className="mt-8 text-ink-soft">No customers yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="py-2 pr-4 font-semibold">Name</th>
                <th className="py-2 pr-4 font-semibold">Email</th>
                <th className="py-2 pr-4 font-semibold">Joined</th>
                <th className="py-2 pr-4 font-semibold">Orders</th>
                <th className="py-2 font-semibold">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line">
                  <td className="py-3 pr-4">{c.name}</td>
                  <td className="py-3 pr-4 text-ink-soft">{c.email}</td>
                  <td className="py-3 pr-4 text-ink-soft">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 pr-4">{c.orderCount}</td>
                  <td className="py-3 font-semibold text-sky-deep">{money(c.totalSpent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

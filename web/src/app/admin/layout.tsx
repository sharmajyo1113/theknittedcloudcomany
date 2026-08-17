'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { checkIsAdmin } from '@/lib/api';

const NAV = [
  { href: '/admin', label: 'Products' },
  { href: '/admin/config', label: 'Application Configuration' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [status, setStatus] = useState<'checking' | 'denied' | 'ready'>('checking');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStatus('denied');
      return;
    }
    (async () => {
      const token = await user.getIdToken();
      const admin = await checkIsAdmin(token);
      setStatus(admin ? 'ready' : 'denied');
    })();
  }, [user, loading]);

  if (status === 'checking') {
    return <p className="text-ink-soft">Checking access…</p>;
  }

  if (status === 'denied') {
    return (
      <div>
        <h1 className="text-2xl">Admin</h1>
        <p className="mt-3 text-ink-soft">
          You need to be signed in with an admin account to view this page.{' '}
          <Link href="/login" className="underline">
            Log in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <nav className="flex gap-1 border-b border-line pb-2">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              pathname === n.href ? 'bg-ink text-fog-card' : 'text-ink-soft hover:bg-fog-card'
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { TopBar } from '@/components/TopBar';

export function Header({ logoUrl }: { logoUrl?: string | null }) {
  const { user, signOut } = useAuth();
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 bg-header">
      <TopBar />
      <div className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-6 px-6 py-5 sm:grid-cols-[1fr_auto_1fr]">
          <Link href="/" className="flex items-center gap-3 text-xl font-semibold">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-10 w-auto object-contain" />
            )}
            The Knitted Cloud Co.
          </Link>

          <nav className="hidden gap-8 text-sm sm:flex">
            <Link href="/shop">Catalog</Link>
            <Link href="/about">About</Link>
            {user ? (
              <Link href="/account">My Account</Link>
            ) : (
              <Link href="/login">Log In</Link>
            )}
          </nav>

          <div className="flex items-center justify-end gap-5 text-sm">
            {user && (
              <button onClick={() => signOut()} className="hidden cursor-pointer sm:inline">
                Log Out
              </button>
            )}
            <Link href="/cart" className="flex items-center gap-2 font-semibold">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
              </svg>
              Cart
              {count > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs text-ink">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

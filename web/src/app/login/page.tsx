'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl">Log In</h1>
      <div className="mt-6 max-w-md rounded border border-line p-8">
        {error && <div className="mb-4 rounded border border-danger px-4 py-3 text-sm text-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold">Email</label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-line bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-line bg-transparent px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ink px-6 py-2.5 font-semibold text-fog-card disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log In'}
          </button>
        </form>
        <p className="mt-5 text-sm">
          New here? <Link href="/register" className="underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await signUp(name, email, password);
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl">Create an Account</h1>
      <div className="mt-6 max-w-md rounded border border-line p-8">
        {error && <div className="mb-4 rounded border border-danger px-4 py-3 text-sm text-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold">Full Name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-line bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold">Email</label>
            <input
              id="email"
              type="email"
              required
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-line bg-transparent px-3 py-2"
            />
            <p className="mt-1 text-xs text-ink-soft">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-semibold">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded border border-line bg-transparent px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-ink px-6 py-2.5 font-semibold text-fog-card disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="mt-5 text-sm">
          Already have an account? <Link href="/login" className="underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

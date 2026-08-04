'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { useCart } from '@/context/CartContext';

function PaymentFormInner({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clear } = useCart();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError('');
    setSubmitting(true);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/account/orders/${orderId}` },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    clear();
    router.push(`/account/orders/${orderId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded border border-danger px-4 py-3 text-sm text-danger">{error}</div>}
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-full bg-ink py-2.5 font-semibold text-fog-card disabled:opacity-60"
      >
        {submitting ? 'Processing…' : 'Pay Now'}
      </button>
    </form>
  );
}

export function CheckoutPaymentForm({ clientSecret, orderId }: { clientSecret: string; orderId: string }) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      <PaymentFormInner orderId={orderId} />
    </Elements>
  );
}

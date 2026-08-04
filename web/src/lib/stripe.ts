import { loadStripe, type Stripe } from '@stripe/stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const stripeConfigured = Boolean(publishableKey);

let stripePromise: Promise<Stripe | null> | null = null;

// loadStripe() with an empty/invalid key resolves to null rather than throwing,
// so this is safe to call even before real Stripe keys are configured.
export function getStripe(): Promise<Stripe | null> {
  if (!publishableKey) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

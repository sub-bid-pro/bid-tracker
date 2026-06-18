import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY is not set — billing calls will fail until it is.');
}

// Lazy singleton: constructing Stripe with an empty key throws, which would
// crash the whole server at import time if billing isn't configured yet. We
// defer construction to first use so the rest of the app still boots; an
// unconfigured key then surfaces as a caught error inside billing handlers.
let _stripe: Stripe | null = null;
const getStripe = (): Stripe => {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _stripe = new Stripe(key, { apiVersion: '2026-05-27.dahlia' });
  return _stripe;
};

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
});

// The single $299/mo Price created in the Stripe dashboard.
export const PRICE_ID = process.env.STRIPE_PRICE_ID || '';

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

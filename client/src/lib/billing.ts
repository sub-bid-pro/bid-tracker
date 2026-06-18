import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/** POSTs to a billing endpoint with the Supabase JWT and returns the Stripe URL. */
const postForUrl = async (path: 'session' | 'portal'): Promise<string> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const res = await fetch(`${API_URL}/api/billing/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!res.ok) throw new Error(`Billing request failed (${res.status})`);

  const { url } = (await res.json()) as { url?: string };
  if (!url) throw new Error('No URL returned');
  return url;
};

/**
 * Mints a Stripe billing session (subscription Checkout or card-update setup —
 * the backend decides based on state) and redirects the browser to it.
 */
export const startBillingSession = async (): Promise<void> => {
  window.location.href = await postForUrl('session');
};

/** Opens the Stripe Customer Portal (manage card / invoices / cancel). */
export const openBillingPortal = async (): Promise<void> => {
  window.location.href = await postForUrl('portal');
};

/**
 * Self-healing reconcile: asks the backend to pull the live subscription state
 * from Stripe and correct the profile. Safe to call on billing-page load and
 * after returning from checkout. Silent no-op on failure.
 */
export const syncBilling = async (): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return;

  await fetch(`${API_URL}/api/billing/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });
};

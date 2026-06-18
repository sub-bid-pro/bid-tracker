import { ServerClient } from 'postmark';
import dotenv from 'dotenv';
import { FRONTEND_URL } from './stripe';

dotenv.config();

const token = process.env.POSTMARK_SERVER_TOKEN || '';
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || 'billing@example.com';

if (!token) {
  console.warn('[postmark] POSTMARK_SERVER_TOKEN is not set — reminder emails will fail.');
}

// Lazy singleton — ServerClient('') throws, so defer construction to first send
// (keeps the server booting when email isn't configured yet).
let _client: ServerClient | null = null;
const getClient = (): ServerClient => {
  if (_client) return _client;
  if (!token) throw new Error('POSTMARK_SERVER_TOKEN is not set');
  _client = new ServerClient(token);
  return _client;
};

interface TrialReminderInput {
  to: string;
  firstName?: string | null;
  trialEndsAt: Date;
}

/**
 * Sends the single pre-trial-end courtesy email carrying the Checkout CTA.
 * The CTA points at the frontend, which calls POST /api/billing/session to mint
 * the actual Stripe Checkout URL (so the link never goes stale).
 */
export const sendTrialReminder = async ({ to, firstName, trialEndsAt }: TrialReminderInput) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const endsLabel = trialEndsAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const ctaUrl = `${FRONTEND_URL}/subscribe`;

  await getClient().sendEmail({
    From: FROM_EMAIL,
    To: to,
    Subject: 'Your trial ends in 3 days — add a card to keep access',
    MessageStream: 'outbound',
    HtmlBody: `
      <p>${greeting}</p>
      <p>Your free trial ends on <strong>${endsLabel}</strong>. Add a payment method
      now to keep uninterrupted access — you won't be charged until your trial ends.</p>
      <p><a href="${ctaUrl}"
        style="display:inline-block;padding:12px 20px;background:#104680;color:#fff;
        text-decoration:none;font-weight:600;border-radius:6px;">Continue to checkout</a></p>
      <p style="color:#666;font-size:13px;">If the button doesn't work, paste this link:
      <br>${ctaUrl}</p>
    `,
    TextBody:
      `${greeting}\n\nYour free trial ends on ${endsLabel}. Add a payment method now ` +
      `to keep access — you won't be charged until your trial ends.\n\n${ctaUrl}\n`,
  });
};

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { ButtonLoader } from '../../../components/buttonLoader/ButtonLoader';
import { startBillingSession, openBillingPortal, syncBilling } from '../../../lib/billing';
import type { AccessState } from '../../../contexts/AuthContext';

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

interface StatusArgs {
  state: AccessState;
  hasSub: boolean;
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
  periodEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
}

/** Human-readable status line + a CSS modifier for the pill colour. */
const describeStatus = ({
  state,
  hasSub,
  trialEndsAt,
  graceEndsAt,
  periodEnd,
  cancelAtPeriodEnd,
}: StatusArgs): { label: string; detail: string | null; tone: 'ok' | 'warn' | 'bad' | 'muted' } => {
  switch (state) {
    case 'active':
      // Scheduled to cancel: still active, but won't renew.
      if (cancelAtPeriodEnd) {
        return {
          label: 'Canceling',
          detail: `Active until ${fmtDate(periodEnd)} · won’t renew`,
          tone: 'warn',
        };
      }
      return {
        label: 'Active',
        detail: periodEnd ? `Sub Bid Pro — $299/month · renews ${fmtDate(periodEnd)}` : 'Sub Bid Pro — $299/month',
        tone: 'ok',
      };
    case 'trialing':
      return hasSub
        ? { label: 'Trial', detail: `Card on file · billing starts ${fmtDate(trialEndsAt)}`, tone: 'ok' }
        : { label: 'Free trial', detail: `Ends ${fmtDate(trialEndsAt)}`, tone: 'warn' };
    case 'past_due':
      return {
        label: 'Payment failed',
        detail: graceEndsAt ? `Access until ${fmtDate(graceEndsAt)}` : 'Update your card to keep access',
        tone: 'warn',
      };
    case 'expired':
      return { label: 'Expired', detail: 'Subscribe to restore access', tone: 'bad' };
    case 'canceled':
      return { label: 'Canceled', detail: 'Subscribe to restore access', tone: 'muted' };
    default:
      return { label: '—', detail: null, tone: 'muted' };
  }
};

export const BillingSettings = () => {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const handledReturn = useRef(false);
  const synced = useRef(false);

  // Self-heal on load: reconcile the profile against Stripe's live state, then
  // refresh. This corrects the UI even if a webhook was missed.
  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    syncBilling().finally(() => refreshProfile());
  }, [refreshProfile]);

  // Handle the redirect back from Stripe Checkout / Portal (toast + clean URL).
  useEffect(() => {
    if (handledReturn.current) return;
    const billing = searchParams.get('billing');
    if (!billing) return;
    handledReturn.current = true;

    if (billing === 'success') {
      showToast('Subscription updated.', 'success');
    } else if (billing === 'cancelled') {
      showToast('Checkout cancelled.', 'info');
    }
    searchParams.delete('billing');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, showToast]);

  const state: AccessState = profile?.access_state ?? 'trialing';
  const hasSub = !!profile?.stripe_subscription_id;
  const status = describeStatus({
    state,
    hasSub,
    trialEndsAt: profile?.trial_ends_at,
    graceEndsAt: profile?.grace_ends_at,
    periodEnd: profile?.current_period_end,
    cancelAtPeriodEnd: profile?.cancel_at_period_end,
  });

  // Active subscribers (and card-on-file trialers) manage via the Portal;
  // everyone else goes through Checkout / card-update via the session endpoint.
  const canManage = state === 'active' || (state === 'trialing' && hasSub);
  const action = canManage ? openBillingPortal : startBillingSession;
  const buttonLabel = canManage
    ? 'Manage subscription'
    : state === 'past_due'
      ? 'Update payment method'
      : 'Subscribe — $299/mo';

  const run = async () => {
    setLoading(true);
    try {
      await action(); // redirects on success
    } catch {
      showToast('Could not open billing. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="geometric-container settings-card">
      <h3>Subscription</h3>
      <p>Manage your Sub Bid Pro plan and payment method.</p>

      <div className="sub-status">
        <span className={`sub-status__pill sub-status__pill--${status.tone}`}>{status.label}</span>
        {status.detail && <span className="sub-status__detail">{status.detail}</span>}
      </div>

      <div className="integration-btn-container">
        <button
          onClick={run}
          disabled={loading}
          className={`primary-btn ${loading ? 'loading' : ''}`}
        >
          <span className="btn-text">{buttonLabel}</span>
          {loading && (
            <span className="loader-overlay">
              <ButtonLoader />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

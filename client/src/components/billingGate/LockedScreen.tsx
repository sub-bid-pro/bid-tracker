import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { startBillingSession } from '../../lib/billing';
import type { AccessState } from '../../contexts/AuthContext';

const COPY: Record<string, { title: string; sub: string }> = {
  expired: { title: 'Your trial has ended', sub: 'Keep tracking bids without limits.' },
  canceled: { title: 'Your subscription was canceled', sub: 'Reactivate anytime — your data is right where you left it.' },
  past_due: { title: 'There’s a problem with your payment', sub: 'Update your card to restore full access.' },
  default: { title: 'Subscribe to continue', sub: 'Unlock the full Sub Bid Pro experience.' },
};

/**
 * The full-page locked state shown when access_state resolves to a wall.
 * Friendly, value-forward, and NOT a dead-end — the navbar stays available and
 * there are links out to Help/FAQ/Demos/Pricing/Settings.
 */
export const LockedScreen = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const state: AccessState = profile?.access_state ?? 'expired';
  const copy = COPY[state] ?? COPY.default;
  const ctaLabel = state === 'past_due' ? 'Update payment method' : 'Subscribe — $299/mo';

  const go = async () => {
    setLoading(true);
    try {
      await startBillingSession(); // redirects on success
    } catch {
      showToast('Could not start checkout. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="locked-screen">
      <div className="locked-card">
        <span className="locked-eyebrow">Sub Bid Pro</span>
        <h1>{copy.title}</h1>
        <p className="locked-sub">{copy.sub}</p>

        <ul className="locked-benefits">
          <li>Unlimited bid sync from Gmail</li>
          <li>Annual &amp; monthly analytics</li>
          <li>Google Drive attachment storage</li>
          <li>Everything in one dashboard</li>
        </ul>

        <button className="billing-cta" onClick={go} disabled={loading}>
          {loading ? 'Redirecting…' : ctaLabel}
        </button>

        <p className="locked-links">
          Questions? <Link to="/help">Help</Link> · <Link to="/faq">FAQ</Link> ·{' '}
          <Link to="/demos">Demos</Link> · <Link to="/pricing">Pricing</Link>
        </p>
        <p className="locked-secondary">
          <Link to="/settings">Account settings</Link>
        </p>
      </div>
    </div>
  );
};

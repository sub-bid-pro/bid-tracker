import { useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { resolveView } from '../../lib/access';
import { startBillingSession } from '../../lib/billing';
import { LockedScreen } from './LockedScreen';
import './styles.scss';

/**
 * Wraps the gated app. Renders:
 *   - the friendly full-page LockedScreen when access is gone,
 *   - a dunning warning banner above the app during grace,
 *   - children untouched otherwise.
 */
export const BillingGate = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const view = resolveView(profile);
  const [loading, setLoading] = useState(false);

  if (view === 'wall') {
    return <LockedScreen />;
  }

  const go = async () => {
    setLoading(true);
    try {
      await startBillingSession();
    } catch {
      showToast('Could not start checkout. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <>
      {view === 'banner' && (
        <div className="billing-banner" role="alert">
          <span className="billing-banner__text">
            Your last payment failed. Update your card to avoid losing access.
          </span>
          <button className="billing-banner__cta" onClick={go} disabled={loading}>
            {loading ? 'Redirecting…' : 'Update payment'}
          </button>
        </div>
      )}
      {children}
    </>
  );
};

import { useEffect, useRef, useState } from 'react';
import { startBillingSession } from '../../lib/billing';
import { PageLoader } from '../../components/pageLoader/PageLoader';

/**
 * Landing target for the trial-reminder email CTA. Immediately mints a Stripe
 * session and redirects. Authenticated (sits under ProtectedRoute) so the
 * session token is available. Shows a manual retry if the redirect fails.
 */
export const Subscribe = () => {
  const [error, setError] = useState(false);
  const started = useRef(false);

  const run = async () => {
    setError(false);
    try {
      await startBillingSession(); // navigates away on success
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    if (started.current) return; // guard React 18 StrictMode double-invoke
    started.current = true;
    run();
  }, []);

  if (error) {
    return (
      <div style={{ maxWidth: 420, margin: '15vh auto', textAlign: 'center', padding: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Couldn’t open checkout</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Something went wrong starting your subscription.
        </p>
        <button className="billing-cta" onClick={run} style={{ maxWidth: 240 }}>
          Try again
        </button>
      </div>
    );
  }

  return <PageLoader />;
};

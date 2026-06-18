import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InfoPage } from './InfoPage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { startBillingSession } from '../../lib/billing';

const BENEFITS = [
  'Unlimited bid sync from Gmail',
  'Annual & monthly analytics',
  'Google Drive attachment storage',
  'Everything in one dashboard',
  '30-day free trial — no card to start',
];

export const Pricing = () => {
  const { session } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onCta = async () => {
    // Logged out → send them to sign up; logged in → start checkout
    // (the backend routes active subscribers to the portal automatically).
    if (!session) {
      navigate('/auth');
      return;
    }
    setLoading(true);
    try {
      await startBillingSession();
    } catch {
      showToast('Could not start checkout. Please try again.', 'error');
      setLoading(false);
    }
  };

  return (
    <InfoPage title="Pricing" subtitle="One simple plan. Everything included.">
      <div className="pricing-card">
        <div className="price">
          $299<span>/month</span>
        </div>
        <ul className="pricing-benefits">
          {BENEFITS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <button className="billing-cta" onClick={onCta} disabled={loading}>
          {loading ? 'Redirecting…' : session ? 'Subscribe — $299/mo' : 'Start free trial'}
        </button>
      </div>
    </InfoPage>
  );
};

import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { ButtonLoader } from '../../../components/buttonLoader/ButtonLoader';

export const IntegrationSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const isConnected = profile?.gmail_connected;

  const handleConnectGmail = () => {
    if (!user) return showToast('You must be logged in to connect Gmail.', 'error');
    setIsConnecting(true);
    window.location.href = `${API_URL}/api/auth/google?userId=${user.id}`;
  };

  const handleDisconnectGmail = async () => {
    if (!user) return;
    setIsDisconnecting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/google/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        await refreshProfile();
        showToast('Gmail account disconnected.', 'info');
      } else {
        showToast('Failed to disconnect account.', 'error');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      showToast('Network error while disconnecting.', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="geometric-container settings-card">
      <h3>Email Integrations</h3>
      <p>Connect your account to automatically pull in new bids.</p>

      <div className="integration-btn-container">
        {isConnected ? (
          <button
            onClick={handleDisconnectGmail}
            disabled={isDisconnecting}
            className={`danger-btn ${isDisconnecting ? 'loading' : ''}`}
          >
            <span className="btn-text">Disconnect Gmail Account</span>
            {isDisconnecting && (
              <span className="loader-overlay">
                <ButtonLoader />
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={handleConnectGmail}
            disabled={isConnecting}
            className={`primary-btn ${isConnecting ? 'loading' : ''}`}
          >
            <span className="btn-text">Connect Gmail Account</span>
            {isConnecting && (
              <span className="loader-overlay">
                <ButtonLoader />
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

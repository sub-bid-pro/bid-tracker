import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ButtonLoader } from '../../components/buttonLoader/ButtonLoader';
import './styles.scss';

export const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false); // New state for connect delay
  const { showToast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const handleConnectGmail = () => {
    if (!user) return showToast('You must be logged in to connect Gmail.', 'error');
    setIsConnecting(true); // Spin the button while the browser handles the redirect
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

  const isConnected = profile?.gmail_connected;

  return (
    <div className="settings-wrapper">
      <h1>Settings</h1>

      <div className="geometric-container integration-card">
        <h3>Email Integrations</h3>
        <p>Connect your account to automatically pull in new bids.</p>

        {isConnected ? (
          <button
            onClick={handleDisconnectGmail}
            disabled={isDisconnecting}
            className={`disconnect-btn ${isDisconnecting ? 'loading' : ''}`}
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
            className={`connect-btn ${isConnecting ? 'loading' : ''}`}
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

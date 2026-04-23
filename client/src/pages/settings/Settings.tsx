import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './styles.scss';

export const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const handleConnectGmail = () => {
    if (!user) return alert('You must be logged in to connect Gmail.');
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
        await refreshProfile(); // Refresh context to instantly update the UI
      } else {
        alert('Failed to disconnect account.');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Network error while disconnecting.');
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
            className="disconnect-btn"
          >
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect Gmail Account'}
          </button>
        ) : (
          <button onClick={handleConnectGmail} className="connect-btn">
            Connect Gmail Account
          </button>
        )}
      </div>
    </div>
  );
};

import { ButtonLoader } from '../../../../../components/buttonLoader/ButtonLoader';
import { useAuth } from '../../../../../contexts/AuthContext';

interface Props {
  isSyncing: boolean;
  handleSync: () => void;
  gmailConnected: boolean;
  isFullView: boolean;
  setIsFullView: (val: boolean) => void;
}

export const SidebarActions = ({
  isSyncing,
  handleSync,
  gmailConnected,
  isFullView,
  setIsFullView,
}: Props) => {
  const { user } = useAuth();

  const handleConnectGmail = () => {
    if (!user) return alert('You must be logged in to connect Gmail.');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    window.location.href = `${API_URL}/api/auth/google?userId=${user.id}`;
  };

  return (
    <div className="sidebar-section">
      {gmailConnected ? (
        <button
          className={`geometric-sync-btn ${isSyncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={isSyncing}
        >
          <span className="btn-text">
            <div className="triangle-icon" />
            PULL NEW BIDS
          </span>

          {isSyncing && (
            <span className="loader-overlay">
              <ButtonLoader />
            </span>
          )}
        </button>
      ) : (
        <button className="geometric-sync-btn" onClick={handleConnectGmail}>
          <span className="btn-text">CONNECT GMAIL</span>
        </button>
      )}

      {/* True Switch Toggle for View Mode */}
      <div className="view-toggle">
        <span className="toggle-label">Detailed Data View</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={isFullView}
            onChange={(e) => setIsFullView(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
};

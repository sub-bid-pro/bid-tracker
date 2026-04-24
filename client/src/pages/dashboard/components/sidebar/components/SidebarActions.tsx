import { ButtonLoader } from '../../../../../components/buttonLoader/ButtonLoader';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useToast } from '../../../../../contexts/ToastContext';

interface Props {
  isSyncing: boolean;
  // Updated to expect a promise that returns the number of new bids
  handleSync: () => Promise<number>;
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
  const { showToast } = useToast();

  const handleConnectGmail = () => {
    if (!user) return showToast('You must be logged in to connect Gmail.', 'warning');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    window.location.href = `${API_URL}/api/auth/google?userId=${user.id}`;
  };

  const onSyncClick = async () => {
    try {
      // Capture the returned number from your API logic
      const newBidsAdded = await handleSync();

      // Determine the correct message
      if (newBidsAdded > 0) {
        showToast(
          `Successfully pulled ${newBidsAdded} new ${newBidsAdded === 1 ? 'bid' : 'bids'}!`,
          'success',
        );
      } else {
        showToast('Sync complete. No new bids found.', 'info'); // 'info' styling usually fits better for a neutral result
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error syncing bids:', error);
      showToast(error.message || 'Failed to pull new bids.', 'error');
    }
  };

  return (
    <div className="sidebar-section">
      {gmailConnected ? (
        <button
          className={`geometric-sync-btn ${isSyncing ? 'syncing' : ''}`}
          onClick={onSyncClick}
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

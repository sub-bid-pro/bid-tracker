import { ButtonLoader } from '../../../../../components/buttonLoader/ButtonLoader';

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
  return (
    <div className="sidebar-section">
      {gmailConnected ? (
        <button
          className={`geometric-sync-btn ${isSyncing ? 'syncing' : ''}`}
          onClick={handleSync}
          disabled={isSyncing}
        >
          {/* Keep the triangle and text together in the invisible wrapper */}
          <span className="btn-text">
            <div className="triangle-icon" />
            PULL NEW BIDS
          </span>

          {/* Loader sits on top */}
          {isSyncing && (
            <span className="loader-overlay">
              <ButtonLoader />
            </span>
          )}
        </button>
      ) : (
        <div className="warning-box">Connect Gmail in Settings to pull bids.</div>
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

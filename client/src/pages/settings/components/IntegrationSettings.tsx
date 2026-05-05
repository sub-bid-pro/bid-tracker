import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { ButtonLoader } from '../../../components/buttonLoader/ButtonLoader';
import { supabase } from '../../../lib/supabase';

export const IntegrationSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Storage Settings State
  const [folderName, setFolderName] = useState('');
  const [storagePreference, setStoragePreference] = useState('none');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const isConnected = profile?.gmail_connected;

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFolderName(profile.drive_root_folder_name || 'Bid Tracker App');
      setStoragePreference(profile.storage_preference || 'none');
    }
  }, [profile]);

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

  // NEW: Save both preferences
  const handleSaveStorageSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingSettings(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        drive_root_folder_name: folderName,
        storage_preference: storagePreference,
      })
      .eq('id', user.id);

    if (error) {
      showToast(error.message, 'error');
    } else {
      await refreshProfile();
      showToast('Storage configuration updated!', 'success');
    }
    setIsSavingSettings(false);
  };

  return (
    <div className="geometric-container settings-card">
      <h3>Email & Storage Integrations</h3>
      <p>Connect your account to automatically pull in new bids and organize attachments.</p>

      <div
        className="integration-btn-container"
        style={{ marginBottom: isConnected ? '16px' : '0' }}
      >
        {isConnected ? (
          <button
            onClick={handleDisconnectGmail}
            disabled={isDisconnecting}
            className={`danger-btn ${isDisconnecting ? 'loading' : ''}`}
          >
            <span className="btn-text">Disconnect Gmail & Drive</span>
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
            <span className="btn-text">Connect Gmail & Drive</span>
            {isConnecting && (
              <span className="loader-overlay">
                <ButtonLoader />
              </span>
            )}
          </button>
        )}
      </div>

      {isConnected && (
        <>
          <hr className="divider" />
          <div className="drive-settings" style={{ marginTop: '8px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>File Storage Provider</h4>
            <p style={{ marginBottom: '16px' }}>
              Choose where you want to automatically save your bid attachments.
            </p>

            <form onSubmit={handleSaveStorageSettings}>
              <div className="input-group">
                <label>Storage Location</label>
                <select
                  value={storagePreference}
                  onChange={(e) => setStoragePreference(e.target.value)}
                >
                  <option value="none">Do Not Save Attachments</option>
                  <option value="google_drive">Google Drive</option>
                </select>
              </div>

              {/* ONLY SHOW FOLDER INPUT IF GOOGLE DRIVE IS SELECTED */}
              {storagePreference === 'google_drive' && (
                <div className="input-group">
                  <label>Drive Root Folder Name</label>
                  <input
                    required
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="e.g., Bid Tracker App"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isSavingSettings || (storagePreference === 'google_drive' && !folderName.trim())
                }
                className={`primary-btn ${isSavingSettings ? 'loading' : ''}`}
                style={{ alignSelf: 'flex-start', padding: '10px 16px', fontSize: '0.85rem' }}
              >
                <span className="btn-text">Save Storage Settings</span>
                {isSavingSettings && (
                  <span className="loader-overlay">
                    <ButtonLoader />
                  </span>
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

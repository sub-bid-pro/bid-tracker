import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { ButtonLoader } from '../../../components/buttonLoader/ButtonLoader';

export const ProfileSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    company: '',
    phone: '',
    business_phone: '',
  });

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        username: profile.username || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        company: profile.company || '',
        phone: profile.phone || '',
        business_phone: profile.business_phone || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase.from('profiles').update(formData).eq('id', user?.id);

    if (error) {
      showToast(error.message, 'error');
    } else {
      await refreshProfile();
      showToast('Account information updated successfully.', 'success');
    }
    setIsSaving(false);
  };

  return (
    <div className="geometric-container settings-card">
      <h3>Profile Details</h3>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Username</label>
          <input
            required
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>

        <div className="row">
          <div className="input-group">
            <label>First Name</label>
            <input
              required
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Last Name</label>
            <input
              required
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Company</label>
          <input
            required
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
        </div>

        <div className="row">
          <div className="input-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Business Phone</label>
            <input
              type="tel"
              value={formData.business_phone}
              onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={`primary-btn ${isSaving ? 'loading' : ''}`}
        >
          <span className="btn-text">Save Changes</span>
          {isSaving && (
            <span className="loader-overlay">
              <ButtonLoader />
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

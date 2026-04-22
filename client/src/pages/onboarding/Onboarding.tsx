import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './styles.scss';

export const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    company: '',
    phone: '',
    business_phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('profiles').insert([{ id: user?.id, ...formData }]);

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      await refreshProfile();
      navigate('/');
    }
  };

  return (
    <div className="onboarding-wrapper">
      <div className="onboarding-card">
        <h1>Complete Profile</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input
              required
              type="text"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div className="row">
            <div className="input-group">
              <label>First Name</label>
              <input
                required
                type="text"
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input
                required
                type="text"
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Company</label>
            <input
              required
              type="text"
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div className="row">
            <div className="input-group">
              <label>Phone (Optional)</label>
              <input
                type="tel"
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Business Phone (Optional)</label>
              <input
                type="tel"
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

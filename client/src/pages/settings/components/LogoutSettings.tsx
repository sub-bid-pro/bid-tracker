import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';

export const LogoutSettings = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="geometric-container settings-card">
      <h3>Account Access</h3>

      <div className="pref-row">
        <div className="pref-info">
          <h4>Sign Out</h4>
          <p>Safely sign out of your current session.</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
};

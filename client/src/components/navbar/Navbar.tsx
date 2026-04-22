import { NavLink, Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../themeToggle/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './styles.scss';

const Navbar = () => {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        BID_TRACKER
      </Link>

      <div className="nav-links">
        {/* Change profile to profile.onboarding_complete */}
        {session && profile?.onboarding_complete && (
          <>
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/account">Account</NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </>
        )}
      </div>

      <div className="nav-actions">
        {/* Show logout button as long as a session exists */}
        {session && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;

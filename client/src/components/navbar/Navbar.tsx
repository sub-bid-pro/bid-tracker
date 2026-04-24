import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './styles.scss';

const Navbar = () => {
  const { session, profile } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        BID_TRACKER
      </Link>

      <div className="nav-links">
        {session && profile?.onboarding_complete && (
          <>
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/settings">Settings</NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

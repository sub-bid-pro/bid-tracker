import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NavDrawer } from './NavDrawer';
import './styles.scss';

const Navbar = () => {
  const { session, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Determine if we should show the navigation tools
  const showNav = session && profile?.onboarding_complete;

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          {showNav && (
            <button className="hamburger" onClick={toggleMenu} aria-label="Open Navigation Menu">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
        </div>

        <Link to="/" className="nav-brand" onClick={closeMenu}>
          Sub Bid Pro
        </Link>
      </nav>

      {/* Render the extracted drawer conditionally */}
      {showNav && <NavDrawer isOpen={isOpen} onClose={closeMenu} />}
    </>
  );
};

export default Navbar;

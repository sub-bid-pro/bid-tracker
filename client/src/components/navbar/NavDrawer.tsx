import { NavLink } from 'react-router-dom';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NavDrawer = ({ isOpen, onClose }: NavDrawerProps) => {
  return (
    <>
      {/* Clicking this background overlay closes the menu */}
      <div className={`nav-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      {/* The actual sliding menu */}
      <div className={`nav-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Menu</span>
          <button className="close-btn" onClick={onClose} aria-label="Close Menu">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="nav-links">
          {/* Clicking a link auto-closes the menu */}
          <NavLink to="/" end onClick={onClose}>
            Dashboard
          </NavLink>
          <NavLink to="/settings" onClick={onClose}>
            Settings
          </NavLink>
        </div>
      </div>
    </>
  );
};

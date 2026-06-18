import { NavLink } from 'react-router-dom';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// 1. Define the shape of our navigation data
interface NavItem {
  path: string;
  label: string;
  exact?: boolean; // Used to apply the 'end' prop for exact route matching
}

const now = new Date();
const currentMonthPath = `/monthly/${now.getFullYear()}/${now.getMonth() + 1}`;

// 2. Create the data-driven configuration arrays
const APP_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', exact: true },
  { path: '/tracker', label: 'Bid Tracker' },
  { path: '/annual-breakdown', label: 'Annual Breakdown' },
  { path: currentMonthPath, label: 'Monthly View' },
  { path: '/settings', label: 'Settings' },
];

// Non-gated info/marketing pages — always reachable, even when locked.
const INFO_ITEMS: NavItem[] = [
  { path: '/welcome', label: 'Overview' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/help', label: 'Help' },
  { path: '/faq', label: 'FAQ' },
  { path: '/demos', label: 'Demos' },
];

export const NavDrawer = ({ isOpen, onClose }: NavDrawerProps) => {
  return (
    <>
      <div className={`nav-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

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
          {APP_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.exact} onClick={onClose}>
              {item.label}
            </NavLink>
          ))}

          <span className="nav-section-label">Resources</span>
          {INFO_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.exact} onClick={onClose}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

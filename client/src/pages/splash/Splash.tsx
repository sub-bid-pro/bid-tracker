import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './styles.scss';

export const Splash = () => {
  const { session } = useAuth();

  // If a user is already logged in, seamlessly push them to the dashboard
  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="splash-wrapper">
      {/* Background visual flair */}
      <div className="geometric-bg-pattern"></div>

      <div className="splash-container">
        {/* HERO SECTION */}
        <header className="hero-section text-center">
          {/* replace with wordmark logo and badge */}
          <h1 className="hero-title">SUB BID PRO</h1>
          {/* 1. Added Sub Bid Pro Branding */}
          <div className="badge">Built for Subcontractors</div>
          <h1 className="hero-title">
            Stop digging through your inbox. <br />
            <span className="text-accent">Start winning more bids.</span>
          </h1>
          <p className="hero-subtitle">
            Sub Bid Pro connects directly to your Gmail to instantly extract, organize, and track
            your subcontracting bids. Move from a messy inbox to a streamlined pipeline.
          </p>

          <div className="hero-actions">
            {/* 2. Directing to the signup view specifically */}
            <Link to="/auth?tab=signup" className="primary-btn pulse-hover">
              <span className="btn-text">Get Started for Free</span>
            </Link>
            <a href="#features" className="secondary-btn">
              See How It Works
            </a>
          </div>
        </header>

        {/* FEATURES GRID */}
        <section id="features" className="features-section">
          <div className="feature-card geometric-container">
            <div className="icon-wrapper">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h3>Real-Time Gmail Sync</h3>
            <p>
              Bypass manual data entry. Our direct integration catches bid invitations and ITBs the
              second they hit your inbox.
            </p>
          </div>

          <div className="feature-card geometric-container">
            <div className="icon-wrapper">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 10 10H12V2zM21.18 8.02c-1-2.34-2.77-4.11-5.11-5.11l-4.05 9.16z"></path>
              </svg>
            </div>
            <h3>Smart Email Parsing</h3>
            <p>
              Advanced extraction automatically pulls out the Project Name, General Contractor, Due
              Dates, and Scopes of Work.
            </p>
          </div>

          <div className="feature-card geometric-container">
            <div className="icon-wrapper">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
              </svg>
            </div>
            <h3>Pipeline Tracking</h3>
            <p>
              Manage your entire pipeline from "Needs Review" to "Won" with a dedicated dashboard.
              Never miss a deadline again.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

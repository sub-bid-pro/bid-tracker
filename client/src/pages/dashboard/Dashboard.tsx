import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import './styles.scss';

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    needsReview: 0,
    winRate: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;

      try {
        // Optimization: We only need the 'status' column to calculate all these metrics
        const { data, error } = await supabase.from('bids').select('status').eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          let activeCount = 0;
          let reviewCount = 0;
          let wonCount = 0;
          let lostCount = 0;

          data.forEach((bid) => {
            // "Needs Review" goes into both its own bucket and the "Active" bucket
            if (bid.status === 'Needs Review') reviewCount++;

            // Define what makes a bid "Active" (i.e., not decided yet)
            if (['Needs Review', 'Pending', 'Submitted'].includes(bid.status)) {
              activeCount++;
            }

            if (bid.status === 'Won') wonCount++;
            if (bid.status === 'Lost') lostCount++;
          });

          // Calculate win rate (only factor in bids that have been decided)
          const totalDecided = wonCount + lostCount;
          const calculatedWinRate =
            totalDecided > 0 ? Math.round((wonCount / totalDecided) * 100) : 0;

          setStats({
            active: activeCount,
            needsReview: reviewCount,
            winRate: calculatedWinRate,
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]);

  return (
    <div className="home-dashboard-wrapper">
      <header className="dashboard-header geometric-container">
        <h1>Welcome back, {profile?.first_name || 'Builder'}!</h1>
        <p>Overview for {profile?.company || 'your company'}</p>
      </header>

      <div className="dashboard-content">
        <Link to="/tracker" className="app-card geometric-container">
          <div className="card-header">
            <h2>Bid Tracker</h2>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="arrow-icon"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>

          <div className="metrics-grid">
            <div className="metric-item">
              <h3>Active Bids</h3>
              <p className="metric-value">{isLoading ? '--' : stats.active}</p>
              <span className="metric-label">Currently in pipeline</span>
            </div>

            <div className="metric-item">
              <h3>Needs Review</h3>
              <p className={`metric-value ${stats.needsReview > 0 ? 'text-accent' : ''}`}>
                {isLoading ? '--' : stats.needsReview}
              </p>
              <span className="metric-label">Awaiting your action</span>
            </div>

            <div className="metric-item">
              <h3>Win Rate</h3>
              <p className={`metric-value ${stats.winRate > 0 ? 'text-success' : ''}`}>
                {isLoading ? '--' : `${stats.winRate}%`}
              </p>
              <span className="metric-label">Last 30 days</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

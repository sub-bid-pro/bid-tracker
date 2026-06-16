import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from '../../components/statusBadge/StatusBadge';
import { BidDetailModal } from '../../components/bidDetailModal/BidDetailModal';
import './styles.scss';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bid = any;

const formatVolume = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

const formatShortDate = (dateStr: string) => {
  // Full ISO timestamps already include time; date-only strings need a noon anchor to avoid UTC offset shifting the day
  const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    const fetchBids = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('bids')
          .select(
            'id, status, final_bid_amount, job_name, general_contractor, email_received_at, bid_due_date',
          )
          .eq('user_id', user.id)
          .order('email_received_at', { ascending: false });
        if (error) throw error;
        if (data) setBids(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBids();
  }, [user]);

  const stats = useMemo(() => {
    let active = 0,
      needsReviewCount = 0,
      wonCount = 0,
      lostCount = 0,
      ytdVolume = 0;
    bids.forEach((bid) => {
      if (bid.status === 'Needs Review') needsReviewCount++;
      if (['Needs Review', 'Pending', 'Submitted'].includes(bid.status)) active++;
      if (bid.status === 'Won') {
        wonCount++;
        ytdVolume += Number(bid.final_bid_amount) || 0;
      }
      if (bid.status === 'Lost') lostCount++;
    });
    const totalDecided = wonCount + lostCount;
    return {
      active,
      needsReviewCount,
      winRate: totalDecided > 0 ? Math.round((wonCount / totalDecided) * 100) : 0,
      ytdVolume,
    };
  }, [bids]);

  const needsReviewBids = useMemo(
    () => bids.filter((b) => b.status === 'Needs Review').slice(0, 6),
    [bids],
  );

  const upcomingBids = useMemo(() => {
    const thirtyDaysOut = new Date(today);
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    return bids
      .filter((b) => {
        if (!b.bid_due_date) return false;
        if (['Won', 'Lost'].includes(b.status)) return false;
        const due = new Date(b.bid_due_date + 'T12:00:00');
        return due >= today && due <= thirtyDaysOut;
      })
      .sort(
        (a, b) =>
          new Date(a.bid_due_date + 'T12:00:00').getTime() -
          new Date(b.bid_due_date + 'T12:00:00').getTime(),
      )
      .slice(0, 6);
  }, [bids, today]);

  const recentBids = bids.slice(0, 6);

  const getDaysUntil = (dateStr: string) => {
    const due = new Date(dateStr + 'T12:00:00');
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return '1d';
    return `${diff}d`;
  };

  return (
    <div className="dashboard-v2">
      <header className="dash-header">
        <div>
          <h1>Welcome back, {profile?.first_name || 'Builder'}</h1>
          <p>{profile?.company || 'Your Company'}</p>
        </div>
        <span className="dash-date">{todayLabel}</span>
      </header>

      <section className="kpi-strip">
        <div className="kpi-tile">
          <span className="kpi-val">{isLoading ? '--' : stats.active}</span>
          <span className="kpi-label">Active Bids</span>
        </div>
        <div className={`kpi-tile ${!isLoading && stats.needsReviewCount > 0 ? 'kpi-alert' : ''}`}>
          <span className="kpi-val">{isLoading ? '--' : stats.needsReviewCount}</span>
          <span className="kpi-label">Needs Review</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-val">{isLoading ? '--' : `${stats.winRate}%`}</span>
          <span className="kpi-label">Win Rate</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-val">{isLoading ? '--' : formatVolume(stats.ytdVolume)}</span>
          <span className="kpi-label">YTD Volume</span>
        </div>
      </section>

      <div className="dash-panels">
        <section className="dash-panel geometric-container">
          <div className="panel-head">
            <h2>Needs Review</h2>
            <Link to="/tracker" className="panel-link">
              View All →
            </Link>
          </div>
          {isLoading ? (
            <p className="panel-empty">Loading…</p>
          ) : needsReviewBids.length === 0 ? (
            <p className="panel-empty">No bids need review.</p>
          ) : (
            <ul className="panel-list">
              {needsReviewBids.map((bid) => (
                <li key={bid.id} className="panel-row">
                  <span className="row-primary">{bid.job_name || 'Untitled'}</span>
                  <span className="row-secondary">{bid.general_contractor || '--'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-panel geometric-container">
          <div className="panel-head">
            <h2>Due Soon</h2>
            <Link to="/tracker" className="panel-link">
              View All →
            </Link>
          </div>
          {isLoading ? (
            <p className="panel-empty">Loading…</p>
          ) : upcomingBids.length === 0 ? (
            <p className="panel-empty">No upcoming due dates in the next 30 days.</p>
          ) : (
            <ul className="panel-list">
              {upcomingBids.map((bid) => (
                <li key={bid.id} className="panel-row">
                  <span className="due-date">{formatShortDate(bid.bid_due_date)}</span>
                  <span className="row-primary">{bid.job_name || 'Untitled'}</span>
                  <span className="due-badge">{getDaysUntil(bid.bid_due_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="dash-panel geometric-container">
        <div className="panel-head">
          <h2>Recent Activity</h2>
          <Link to="/tracker" className="panel-link">
            View All →
          </Link>
        </div>
        {isLoading ? (
          <p className="panel-empty">Loading…</p>
        ) : recentBids.length === 0 ? (
          <p className="panel-empty">No bids found. Sync your Gmail to get started.</p>
        ) : (
          <table className="activity-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Received</th>
                <th>Job Name</th>
                <th>General Contractor</th>
                <th className="col-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBids.map((bid) => (
                <tr key={bid.id} className="clickable-row" onClick={() => setSelectedBid(bid)}>
                  <td>
                    <StatusBadge status={bid.status} />
                  </td>
                  <td className="col-date">
                    {bid.email_received_at ? formatShortDate(bid.email_received_at) : '--'}
                  </td>
                  <td className="col-bold">{bid.job_name || '--'}</td>
                  <td>{bid.general_contractor || '--'}</td>
                  <td className="col-right">
                    {bid.final_bid_amount ? `$${bid.final_bid_amount.toLocaleString()}` : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="dash-nav-cards">
        <Link to="/tracker" className="dash-nav-card geometric-container">
          <span>Bid Tracker</span>
          <span className="card-arrow">→</span>
        </Link>
        <Link
          to={`/monthly/${today.getFullYear()}/${today.getMonth() + 1}`}
          className="dash-nav-card geometric-container"
        >
          <span>This Month</span>
          <span className="card-arrow">→</span>
        </Link>
        <Link to="/annual-breakdown" className="dash-nav-card geometric-container">
          <span>Annual Breakdown</span>
          <span className="card-arrow">→</span>
        </Link>
      </div>

      {selectedBid && (
        <BidDetailModal bid={selectedBid} handleModal={() => setSelectedBid(null)} />
      )}
    </div>
  );
};

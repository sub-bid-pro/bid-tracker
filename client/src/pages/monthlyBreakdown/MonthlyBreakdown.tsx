import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from '../../components/statusBadge/StatusBadge';
import { BidDetailModal } from '../../components/bidDetailModal/BidDetailModal';
import { PageLoader } from '../../components/pageLoader/PageLoader';
import './styles.scss';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bid = any;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_ORDER = ['Won', 'Submitted', 'Pending', 'Needs Review', 'Lost'];
const STATUS_SEG_CLASS: Record<string, string> = {
  'Won': 'seg-won',
  'Submitted': 'seg-submitted',
  'Pending': 'seg-pending',
  'Needs Review': 'seg-review',
  'Lost': 'seg-lost',
};
const STATUS_DOT_CLASS: Record<string, string> = {
  'Won': 'dot-won',
  'Submitted': 'dot-submitted',
  'Pending': 'dot-pending',
  'Needs Review': 'dot-review',
  'Lost': 'dot-lost',
};

const formatVolume = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return v > 0 ? `$${v}` : '--';
};

const formatShortDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const MonthlyBreakdown = () => {
  const { year: yearParam, month: monthParam } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const now = new Date();
  const year = parseInt(yearParam || String(now.getFullYear()));
  const month = parseInt(monthParam || String(now.getMonth() + 1)); // 1-indexed

  const [isLoading, setIsLoading] = useState(true);
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  const monthName = MONTH_NAMES[month - 1] || 'Unknown';

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const isFutureMonth = new Date(year, month - 1) > new Date(now.getFullYear(), now.getMonth());

  useEffect(() => {
    const fetchMonthData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 1).toISOString();

        const { data, error } = await supabase
          .from('bids')
          .select('*')
          .eq('user_id', user.id)
          .gte('email_received_at', startDate)
          .lt('email_received_at', endDate)
          .order('email_received_at', { ascending: false });

        if (error) throw error;
        setBids(data || []);
      } catch (err) {
        console.error('Failed to fetch monthly data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthData();
  }, [user, year, month]);

  const stats = useMemo(() => {
    let submitted = 0, volume = 0, awards = 0, losses = 0;
    const statusCounts: Record<string, number> = {};

    bids.forEach((bid) => {
      statusCounts[bid.status] = (statusCounts[bid.status] || 0) + 1;
      if (['Submitted', 'Won', 'Lost'].includes(bid.status)) {
        submitted++;
        volume += Number(bid.final_bid_amount) || 0;
        if (bid.status === 'Won') awards++;
        else if (bid.status === 'Lost') losses++;
      }
    });

    const decided = awards + losses;
    return {
      total: bids.length,
      submitted,
      volume,
      awards,
      losses,
      winRate: decided > 0 ? Math.round((awards / decided) * 100) : 0,
      statusCounts,
    };
  }, [bids]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="monthly-wrapper">
      <header className="monthly-header">
        <div className="monthly-title-row">
          <div>
            <h1>
              {monthName} {year}
              {isCurrentMonth && <span className="current-badge">Current Month</span>}
            </h1>
            <Link to="/annual-breakdown" className="back-link">
              ↑ Annual Breakdown
            </Link>
          </div>
          <div className="month-nav">
            <button
              className="month-nav-btn"
              onClick={() => navigate(`/monthly/${prev.year}/${prev.month}`)}
            >
              ← {MONTH_NAMES[prev.month - 1]}
            </button>
            <div className="month-nav-selects">
              <select
                className="nav-select"
                value={month}
                onChange={(e) => navigate(`/monthly/${year}/${e.target.value}`)}
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
              <select
                className="nav-select"
                value={year}
                onChange={(e) => navigate(`/monthly/${e.target.value}/${month}`)}
              >
                {Array.from(
                  { length: now.getFullYear() - 2019 },
                  (_, i) => now.getFullYear() - i,
                ).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            {!isFutureMonth && (
              <button
                className="month-nav-btn"
                onClick={() => navigate(`/monthly/${next.year}/${next.month}`)}
              >
                {MONTH_NAMES[next.month - 1]} →
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="monthly-kpi-strip">
        <div className="kpi-tile">
          <span className="kpi-val">{stats.total}</span>
          <span className="kpi-label">Total Bids</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-val">{stats.submitted}</span>
          <span className="kpi-label">Submitted</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-val">{formatVolume(stats.volume)}</span>
          <span className="kpi-label">Dollar Volume</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-val">{stats.awards}</span>
          <span className="kpi-label">Awards</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-val">{stats.losses}</span>
          <span className="kpi-label">Losses</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-val">{stats.winRate > 0 ? `${stats.winRate}%` : '--'}</span>
          <span className="kpi-label">Win Rate</span>
        </div>
      </section>

      {stats.total > 0 && (
        <section className="monthly-distribution geometric-container">
          <h2 className="monthly-section-title">Status Distribution</h2>
          <div className="dist-bar">
            {STATUS_ORDER.filter((s) => stats.statusCounts[s] > 0).map((status) => (
              <div
                key={status}
                className={`dist-seg ${STATUS_SEG_CLASS[status]}`}
                style={{ width: `${(stats.statusCounts[status] / stats.total) * 100}%` }}
                title={`${status}: ${stats.statusCounts[status]}`}
              />
            ))}
          </div>
          <div className="dist-legend">
            {STATUS_ORDER.filter((s) => stats.statusCounts[s] > 0).map((status) => (
              <span key={status} className="leg-item">
                <i className={`leg-dot ${STATUS_DOT_CLASS[status]}`} />
                {stats.statusCounts[status]} {status}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="monthly-bids geometric-container">
        <h2 className="monthly-section-title">
          {stats.total > 0 ? `${stats.total} Bid${stats.total !== 1 ? 's' : ''} This Month` : 'Bids This Month'}
        </h2>
        {bids.length === 0 ? (
          <p className="monthly-empty">
            No bids received in {monthName} {year}.
          </p>
        ) : (
          <div className="table-scroll-wrap">
            <table className="monthly-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Date Received</th>
                  <th>Job Name</th>
                  <th>General Contractor</th>
                  <th>Bid Due Date</th>
                  <th className="col-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid) => (
                  <tr
                    key={bid.id}
                    className="clickable-row"
                    onClick={() => setSelectedBid(bid)}
                  >
                    <td>
                      <StatusBadge status={bid.status} />
                    </td>
                    <td className="col-date">
                      {bid.email_received_at ? formatShortDate(bid.email_received_at) : '--'}
                    </td>
                    <td className="col-bold">{bid.job_name || '--'}</td>
                    <td>{bid.general_contractor || '--'}</td>
                    <td>{bid.bid_due_date || '--'}</td>
                    <td className="col-right">
                      {bid.final_bid_amount
                        ? `$${Number(bid.final_bid_amount).toLocaleString()}`
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedBid && (
        <BidDetailModal bid={selectedBid} handleModal={() => setSelectedBid(null)} />
      )}
    </div>
  );
};

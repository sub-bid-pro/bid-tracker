import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PageLoader } from '../../components/pageLoader/PageLoader';
import './styles.scss';

interface MonthData {
  name: string;
  newBids: number;
  submitted: number;
  volume: number;
  awards: number;
  losses: number;
  winRate: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatVolume = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return v > 0 ? `$${v}` : '--';
};

export const AnnualBreakdown = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<MonthData[]>([]);
  const [ytdTotals, setYtdTotals] = useState<MonthData | null>(null);
  const [kpis, setKpis] = useState({
    totalBids: 0, submitted: 0, dollarVolume: 0, awards: 0, openBids: 0, winRate: 0,
  });
  const [statusCounts, setStatusCounts] = useState({
    won: 0, lost: 0, submitted: 0, pending: 0, needsReview: 0,
  });

  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];

  useEffect(() => {
    const fetchAndAggregateData = async () => {
      if (!user) return;

      try {
        const startOfYear = new Date(`${currentYear}-01-01`).toISOString();

        const { data: bids, error } = await supabase
          .from('bids')
          .select('*')
          .eq('user_id', user.id)
          .gte('email_received_at', startOfYear);

        if (error) throw error;

        const months: MonthData[] = MONTH_NAMES.map((name) => ({
          name, newBids: 0, submitted: 0, volume: 0, awards: 0, losses: 0, winRate: 0,
        }));

        let topTotalBids = 0, topSubmitted = 0, topVolume = 0;
        let topAwards = 0, topLosses = 0, topOpen = 0;
        const sc = { won: 0, lost: 0, submitted: 0, pending: 0, needsReview: 0 };

        if (bids) {
          bids.forEach((bid) => {
            topTotalBids++;

            const dateStr = bid.email_received_at || bid.created_at;
            const bucket = months[new Date(dateStr).getMonth()];
            bucket.newBids++;

            if (bid.status === 'Won') sc.won++;
            else if (bid.status === 'Lost') sc.lost++;
            else if (bid.status === 'Submitted') sc.submitted++;
            else if (bid.status === 'Pending') sc.pending++;
            else if (bid.status === 'Needs Review') sc.needsReview++;

            if (['Needs Review', 'Pending'].includes(bid.status)) topOpen++;

            if (['Submitted', 'Won', 'Lost'].includes(bid.status)) {
              bucket.submitted++;
              topSubmitted++;

              const amount = Number(bid.final_bid_amount) || 0;
              bucket.volume += amount;
              topVolume += amount;

              if (bid.status === 'Won') { bucket.awards++; topAwards++; }
              else if (bid.status === 'Lost') { bucket.losses++; topLosses++; }
            }
          });
        }

        months.forEach((m) => {
          const decided = m.awards + m.losses;
          m.winRate = decided > 0 ? Math.round((m.awards / decided) * 100) : 0;
        });

        const ytdDecided = topAwards + topLosses;
        const topWinRate = ytdDecided > 0 ? Math.round((topAwards / ytdDecided) * 100) : 0;

        setMonthlyStats(months);
        setStatusCounts(sc);
        setYtdTotals({
          name: 'YTD TOTAL', newBids: topTotalBids, submitted: topSubmitted,
          volume: topVolume, awards: topAwards, losses: topLosses, winRate: topWinRate,
        });
        setKpis({
          totalBids: topTotalBids, submitted: topSubmitted, dollarVolume: topVolume,
          awards: topAwards, openBids: topOpen, winRate: topWinRate,
        });
      } catch (error) {
        console.error('Error fetching breakdown:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndAggregateData();
  }, [user]);

  const maxBids = useMemo(
    () => Math.max(...monthlyStats.map((m) => m.newBids), 1),
    [monthlyStats],
  );

  if (isLoading) return <PageLoader />;

  const total = kpis.totalBids;

  return (
    <div className="breakdown-wrapper">
      <header className="ab-header">
        <div>
          <h1>Annual Breakdown</h1>
          <p>Year-to-date performance summary</p>
        </div>
        <span className="ab-year">{currentYear}</span>
      </header>

      <section className="ab-kpi-strip">
        <div className="ab-kpi-tile">
          <span className="kpi-val">{kpis.totalBids}</span>
          <span className="kpi-label">Total Bids</span>
        </div>
        <div className="ab-kpi-tile">
          <span className="kpi-val">{kpis.submitted}</span>
          <span className="kpi-label">Submitted</span>
        </div>
        <div className="ab-kpi-tile">
          <span className="kpi-val">{formatVolume(kpis.dollarVolume)}</span>
          <span className="kpi-label">Dollar Volume</span>
        </div>
        <div className="ab-kpi-tile">
          <span className="kpi-val">{kpis.awards}</span>
          <span className="kpi-label">Awards</span>
        </div>
        <div className="ab-kpi-tile">
          <span className="kpi-val">{kpis.openBids}</span>
          <span className="kpi-label">Open Bids</span>
        </div>
        <div className="ab-kpi-tile">
          <span className="kpi-val">{kpis.winRate > 0 ? `${kpis.winRate}%` : '--'}</span>
          <span className="kpi-label">Win Rate</span>
        </div>
      </section>

      {total > 0 && (
        <section className="ab-distribution geometric-container">
          <h2 className="ab-section-title">Status Distribution</h2>
          <div className="dist-bar">
            {statusCounts.won > 0 && (
              <div className="dist-seg seg-won" style={{ width: `${(statusCounts.won / total) * 100}%` }} title={`Won: ${statusCounts.won}`} />
            )}
            {statusCounts.submitted > 0 && (
              <div className="dist-seg seg-submitted" style={{ width: `${(statusCounts.submitted / total) * 100}%` }} title={`Submitted: ${statusCounts.submitted}`} />
            )}
            {statusCounts.pending > 0 && (
              <div className="dist-seg seg-pending" style={{ width: `${(statusCounts.pending / total) * 100}%` }} title={`Pending: ${statusCounts.pending}`} />
            )}
            {statusCounts.needsReview > 0 && (
              <div className="dist-seg seg-review" style={{ width: `${(statusCounts.needsReview / total) * 100}%` }} title={`Needs Review: ${statusCounts.needsReview}`} />
            )}
            {statusCounts.lost > 0 && (
              <div className="dist-seg seg-lost" style={{ width: `${(statusCounts.lost / total) * 100}%` }} title={`Lost: ${statusCounts.lost}`} />
            )}
          </div>
          <div className="dist-legend">
            {statusCounts.won > 0 && (
              <span className="leg-item"><i className="leg-dot dot-won" />{statusCounts.won} Won</span>
            )}
            {statusCounts.submitted > 0 && (
              <span className="leg-item"><i className="leg-dot dot-submitted" />{statusCounts.submitted} Submitted</span>
            )}
            {statusCounts.pending > 0 && (
              <span className="leg-item"><i className="leg-dot dot-pending" />{statusCounts.pending} Pending</span>
            )}
            {statusCounts.needsReview > 0 && (
              <span className="leg-item"><i className="leg-dot dot-review" />{statusCounts.needsReview} Needs Review</span>
            )}
            {statusCounts.lost > 0 && (
              <span className="leg-item"><i className="leg-dot dot-lost" />{statusCounts.lost} Lost</span>
            )}
          </div>
        </section>
      )}

      <section className="ab-chart geometric-container">
        <h2 className="ab-section-title">Monthly New Bids</h2>
        <div className="bar-chart">
          {monthlyStats.map((month, i) => (
            <div
              key={month.name}
              className={`bar-col clickable${month.name === currentMonthName ? ' current' : ''}`}
              onClick={() => navigate(`/monthly/${currentYear}/${i + 1}`)}
              title={`View ${month.name} ${currentYear}`}
            >
              <span className="bar-count">{month.newBids > 0 ? month.newBids : ''}</span>
              <div className="bar-inner">
                <div
                  className="bar-fill"
                  style={{ height: `${Math.round((month.newBids / maxBids) * 100)}%` }}
                />
              </div>
              <span className="bar-label">{MONTH_SHORT[i]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="table-container geometric-container">
        <div className="table-header-banner">Monthly Breakdown</div>
        <div className="table-scroll-wrap">
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>New Bids</th>
                <th>Submitted</th>
                <th>Dollar Volume</th>
                <th>Awards</th>
                <th>Losses</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map((row, i) => {
                const hasDecided = row.awards + row.losses > 0;
                const wrClass = !hasDecided
                  ? ''
                  : row.winRate >= 60
                  ? 'wr-high'
                  : row.winRate >= 30
                  ? 'wr-mid'
                  : 'wr-low';
                return (
                  <tr
                    key={row.name}
                    className={`clickable-row${row.name === currentMonthName ? ' current-month-row' : ''}`}
                    onClick={() => navigate(`/monthly/${currentYear}/${i + 1}`)}
                    title={`View ${row.name} ${currentYear}`}
                  >
                    <td className="fw-bold">{row.name}</td>
                    <td>{row.newBids || '--'}</td>
                    <td>{row.submitted || '--'}</td>
                    <td>{formatVolume(row.volume)}</td>
                    <td>{row.awards || '--'}</td>
                    <td>{row.losses || '--'}</td>
                    <td className={`wr-cell ${wrClass}`}>
                      {hasDecided ? `${row.winRate}%` : '--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {ytdTotals && (
              <tfoot>
                <tr className="ytd-row">
                  <td>{ytdTotals.name}</td>
                  <td>{ytdTotals.newBids || '--'}</td>
                  <td>{ytdTotals.submitted || '--'}</td>
                  <td>{formatVolume(ytdTotals.volume)}</td>
                  <td>{ytdTotals.awards || '--'}</td>
                  <td>{ytdTotals.losses || '--'}</td>
                  <td className="wr-cell">{ytdTotals.winRate > 0 ? `${ytdTotals.winRate}%` : '--'}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
};

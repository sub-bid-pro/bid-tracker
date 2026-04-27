import { useState, useEffect } from 'react';
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
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const AnnualBreakdown = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [monthlyStats, setMonthlyStats] = useState<MonthData[]>([]);
  const [ytdTotals, setYtdTotals] = useState<MonthData | null>(null);

  const [kpis, setKpis] = useState({
    totalBids: 0,
    submitted: 0,
    dollarVolume: 0,
    awards: 0,
    openBids: 0,
    winRate: 0,
  });

  // Determine the current month name for highlighting
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];

  useEffect(() => {
    const fetchAndAggregateData = async () => {
      if (!user) return;

      try {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(`${currentYear}-01-01`).toISOString();

        const { data: bids, error } = await supabase
          .from('bids')
          .select('*')
          .eq('user_id', user.id)
          .gte('email_received_at', startOfYear);

        if (error) throw error;

        const months: MonthData[] = MONTH_NAMES.map((name) => ({
          name,
          newBids: 0,
          submitted: 0,
          volume: 0,
          awards: 0,
          losses: 0,
          winRate: 0,
        }));

        let topTotalBids = 0;
        let topSubmitted = 0;
        let topVolume = 0;
        let topAwards = 0;
        let topLosses = 0;
        let topOpen = 0;

        if (bids) {
          bids.forEach((bid) => {
            topTotalBids++;

            const dateStr = bid.email_received_at || bid.created_at;
            const monthIndex = new Date(dateStr).getMonth();
            const bucket = months[monthIndex];

            bucket.newBids++;

            if (['Needs Review', 'Pending'].includes(bid.status)) {
              topOpen++;
            }

            if (['Submitted', 'Won', 'Lost'].includes(bid.status)) {
              bucket.submitted++;
              topSubmitted++;

              const amount = Number(bid.final_bid_amount) || 0;
              bucket.volume += amount;
              topVolume += amount;

              if (bid.status === 'Won') {
                bucket.awards++;
                topAwards++;
              } else if (bid.status === 'Lost') {
                bucket.losses++;
                topLosses++;
              }
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
        setYtdTotals({
          name: 'YTD TOTAL',
          newBids: topTotalBids,
          submitted: topSubmitted,
          volume: topVolume,
          awards: topAwards,
          losses: topLosses,
          winRate: topWinRate,
        });

        setKpis({
          totalBids: topTotalBids,
          submitted: topSubmitted,
          dollarVolume: topVolume,
          awards: topAwards,
          openBids: topOpen,
          winRate: topWinRate,
        });
      } catch (error) {
        console.error('Error fetching breakdown:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndAggregateData();
  }, [user]);

  if (isLoading) return <PageLoader />;

  return (
    <div className="breakdown-wrapper">
      <header className="page-header">
        <h1>Bid Tracker Dashboard — YTD {new Date().getFullYear()}</h1>
      </header>

      <section className="kpi-bar geometric-container">
        <div className="kpi-item">
          <span className="kpi-label">Total Bids</span>
          <span className="kpi-value">{kpis.totalBids}</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-label">Submitted</span>
          <span className="kpi-value">{kpis.submitted}</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-label">Dollar Volume</span>
          <span className="kpi-value">${kpis.dollarVolume.toLocaleString()}</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-label">Awards</span>
          <span className="kpi-value">{kpis.awards}</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-label">Open Bids</span>
          <span className="kpi-value">{kpis.openBids}</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-label">Win Rate</span>
          <span className="kpi-value">{kpis.winRate}%</span>
        </div>
      </section>

      <section className="table-container geometric-container">
        <div className="table-header-banner">MONTHLY BREAKDOWN</div>
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
              {monthlyStats.map((row) => (
                <tr
                  key={row.name}
                  // Dynamically apply the current-month-row class
                  className={row.name === currentMonthName ? 'current-month-row' : ''}
                >
                  <td className="fw-bold">{row.name}</td>
                  <td>{row.newBids}</td>
                  <td>{row.submitted}</td>
                  <td>${row.volume.toLocaleString()}</td>
                  <td>{row.awards}</td>
                  <td>{row.losses}</td>
                  <td>{row.winRate}%</td>
                </tr>
              ))}
            </tbody>
            {ytdTotals && (
              <tfoot>
                <tr className="ytd-row">
                  <td>{ytdTotals.name}</td>
                  <td>{ytdTotals.newBids}</td>
                  <td>{ytdTotals.submitted}</td>
                  <td>${ytdTotals.volume.toLocaleString()}</td>
                  <td>{ytdTotals.awards}</td>
                  <td>{ytdTotals.losses}</td>
                  <td>{ytdTotals.winRate}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
};

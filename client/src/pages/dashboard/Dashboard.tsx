import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { AppCard, type MetricItem } from './components/appCard/AppCard';
import './styles.scss';

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    needsReview: 0,
    winRate: 0,
    awards: 0,
    ytdVolume: 0,
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('bids')
          .select('status, final_bid_amount')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          let activeCount = 0;
          let reviewCount = 0;
          let wonCount = 0;
          let lostCount = 0;
          let currentVolume = 0;

          data.forEach((bid) => {
            if (bid.status === 'Needs Review') reviewCount++;
            if (['Needs Review', 'Pending', 'Submitted'].includes(bid.status)) {
              activeCount++;
            }
            if (bid.status === 'Won') {
              wonCount++;
              currentVolume += Number(bid.final_bid_amount) || 0;
            }
            if (bid.status === 'Lost') lostCount++;
          });

          const totalDecided = wonCount + lostCount;
          const calculatedWinRate =
            totalDecided > 0 ? Math.round((wonCount / totalDecided) * 100) : 0;

          setStats({
            active: activeCount,
            needsReview: reviewCount,
            winRate: calculatedWinRate,
            awards: wonCount,
            ytdVolume: currentVolume,
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

  // Define the metrics for the Bid Tracker Card
  const trackerMetrics: MetricItem[] = [
    { label: 'Active Bids', value: stats.active, sublabel: 'Currently in pipeline' },
    {
      label: 'Needs Review',
      value: stats.needsReview,
      sublabel: 'Awaiting your action',
      valueClass: stats.needsReview > 0 ? 'text-accent' : '',
    },
    {
      label: 'Win Rate',
      value: `${stats.winRate}%`,
      sublabel: 'Last 30 days',
      valueClass: stats.winRate > 0 ? 'text-success' : '',
    },
  ];

  // Define the metrics for the new Annual Breakdown Card
  const annualMetrics: MetricItem[] = [
    { label: 'YTD Awards', value: stats.awards, sublabel: 'Total jobs won' },
    {
      label: 'YTD Volume',
      value: `$${stats.ytdVolume.toLocaleString()}`,
      sublabel: 'Total awarded value',
      valueClass: stats.ytdVolume > 0 ? 'text-success' : '',
    },
    { label: 'YTD Win Rate', value: `${stats.winRate}%`, sublabel: 'Overall success' },
  ];

  return (
    <div className="home-dashboard-wrapper">
      <header className="dashboard-header geometric-container">
        <h1>Welcome back, {profile?.first_name || 'Builder'}!</h1>
        <p>Overview for {profile?.company || 'your company'}</p>
      </header>

      <div className="dashboard-content">
        <AppCard to="/tracker" title="Bid Tracker" metrics={trackerMetrics} isLoading={isLoading} />
        <AppCard
          to="/annual-breakdown"
          title="YTD Annual Breakdown"
          metrics={annualMetrics}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

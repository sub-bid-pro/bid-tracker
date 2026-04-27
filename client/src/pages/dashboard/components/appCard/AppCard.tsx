import { Link } from 'react-router-dom';

export interface MetricItem {
  label: string;
  value: string | number;
  sublabel: string;
  valueClass?: string;
}

interface AppCardProps {
  to: string;
  title: string;
  metrics: MetricItem[];
  isLoading: boolean;
}

export const AppCard = ({ to, title, metrics, isLoading }: AppCardProps) => {
  return (
    <Link to={to} className="app-card geometric-container">
      <div className="card-header">
        <h2>{title}</h2>
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
        {metrics.map((metric, idx) => (
          <div className="metric-item" key={idx}>
            <h3>{metric.label}</h3>
            <p className={`metric-value ${metric.valueClass || ''}`}>
              {isLoading ? '--' : metric.value}
            </p>
            <span className="metric-label">{metric.sublabel}</span>
          </div>
        ))}
      </div>
    </Link>
  );
};

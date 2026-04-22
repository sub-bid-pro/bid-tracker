import './styles.scss';

interface Props {
  status: string;
}

export const StatusBadge = ({ status }: Props) => {
  // Helper to map the string to a specific CSS modifier
  const getModifier = (statusString: string) => {
    const lower = statusString.toLowerCase();
    if (lower.includes('review')) return 'review';
    if (lower.includes('pending')) return 'pending';
    if (lower.includes('submitted')) return 'submitted';
    if (lower.includes('won')) return 'won';
    if (lower.includes('lost')) return 'lost';
    return 'default';
  };

  const modifier = getModifier(status);

  return <span className={`status-badge badge-${modifier}`}>{status}</span>;
};

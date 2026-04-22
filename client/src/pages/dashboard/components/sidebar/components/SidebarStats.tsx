interface Props {
  bidsCount: number;
  needsReviewCount: number;
}

export const SidebarStats = ({ bidsCount, needsReviewCount }: Props) => {
  return (
    <div className="sidebar-section">
      <h3>Overview</h3>
      <div className="stat-group">
        <span className="stat-label">Total Bids</span>
        <span className="stat-value">{bidsCount}</span>
      </div>
      <div className="stat-group">
        <span className="stat-label">Needs Review</span>
        <span className="stat-value text-accent">{needsReviewCount}</span>
      </div>
    </div>
  );
};

import './styles.scss';

interface Props {
  searchTerm: string;
  clearSearch: () => void;
  selectedStatuses: string[];
  removeStatus: (status: string) => void;
}

export const FilterBubbles = ({
  searchTerm,
  clearSearch,
  selectedStatuses,
  removeStatus,
}: Props) => {
  if (!searchTerm && selectedStatuses.length === 0) return null;

  return (
    <div className="filter-bubbles-container">
      <span className="bubbles-label">Active Filters:</span>

      {searchTerm && (
        <div className="bubble">
          <span className="bubble-text">Search: "{searchTerm}"</span>
          <button className="bubble-close" onClick={clearSearch}>
            ×
          </button>
        </div>
      )}

      {selectedStatuses.map((status) => (
        <div className="bubble" key={status}>
          <span className="bubble-text">Status: {status}</span>
          <button className="bubble-close" onClick={() => removeStatus(status)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

import './styles.scss';

interface Props {
  searchTerm: string;
  clearSearch: () => void;
  selectedStatuses: string[];
  removeStatus: (status: string) => void;
  clearAll: () => void; // <-- ADD PROP
}

export const FilterBubbles = ({
  searchTerm,
  clearSearch,
  selectedStatuses,
  removeStatus,
  clearAll, // <-- DESTRUCTURE PROP
}: Props) => {
  if (!searchTerm && selectedStatuses.length === 0) return null;

  // Optional: Only show "Clear All" if there are at least 2 filters active
  // so it doesn't just duplicate the single "x" button functionality.
  const activeFilterCount = (searchTerm ? 1 : 0) + selectedStatuses.length;

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

      {/* CLEAR ALL BUTTON */}
      {activeFilterCount > 1 && (
        <button className="clear-all-btn" onClick={clearAll}>
          Clear All
        </button>
      )}
    </div>
  );
};

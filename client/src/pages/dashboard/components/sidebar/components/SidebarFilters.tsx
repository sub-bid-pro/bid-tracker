interface Props {
  selectedStatuses: string[];
  toggleStatus: (status: string) => void;
}

const AVAILABLE_STATUSES = ['Needs Review', 'Pending', 'Submitted', 'Won', 'Lost'];

export const SidebarFilters = ({ selectedStatuses, toggleStatus }: Props) => {
  return (
    <div className="sidebar-section" style={{ borderBottom: 'none' }}>
      <h3>Status</h3>
      <div className="checkbox-list">
        {AVAILABLE_STATUSES.map((status) => (
          <label key={status} className="checkbox-item">
            <input
              type="checkbox"
              checked={selectedStatuses.includes(status)}
              onChange={() => toggleStatus(status)}
            />
            <span className="custom-checkbox"></span>
            {status}
          </label>
        ))}
      </div>
    </div>
  );
};

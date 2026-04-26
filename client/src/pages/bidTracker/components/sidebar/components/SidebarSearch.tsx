interface Props {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
}

export const SidebarSearch = ({ searchTerm, setSearchTerm }: Props) => {
  return (
    <div className="sidebar-section">
      <h3>Search</h3>
      <input
        type="text"
        className="sidebar-input"
        placeholder="Job Name or GC..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

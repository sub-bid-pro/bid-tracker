import { SidebarActions } from './components/SidebarActions';
import { SidebarStats } from './components/SidebarStats';
import { SidebarSearch } from './components/SidebarSearch';
import { SidebarFilters } from './components/SidebarFilters';
import './styles.scss';

interface Props {
  isSyncing: boolean;
  handleSync: () => Promise<number>;
  gmailConnected: boolean;
  bidsCount: number;
  needsReviewCount: number;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedStatuses: string[];
  toggleStatus: (status: string) => void;
  isFullView: boolean;
  setIsFullView: (val: boolean) => void;
}

export const Sidebar = ({
  isSyncing,
  handleSync,
  gmailConnected,
  bidsCount,
  needsReviewCount,
  searchTerm,
  setSearchTerm,
  selectedStatuses,
  toggleStatus,
  isFullView,
  setIsFullView,
}: Props) => {
  return (
    <aside className="dashboard-sidebar">
      <SidebarActions
        isSyncing={isSyncing}
        handleSync={handleSync}
        gmailConnected={gmailConnected}
        isFullView={isFullView}
        setIsFullView={setIsFullView}
      />

      <SidebarStats bidsCount={bidsCount} needsReviewCount={needsReviewCount} />

      <SidebarSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <SidebarFilters selectedStatuses={selectedStatuses} toggleStatus={toggleStatus} />
    </aside>
  );
};

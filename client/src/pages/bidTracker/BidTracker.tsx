import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BidDetailModal } from './components/bidDetailModal/BidDetailModal';
import { Sidebar } from './components/sidebar/Sidebar';
import { FilterBubbles } from './components/filterBubbles/FilterBubbles';
import { BidsTable } from './components/bidsTable/BidsTable'; // <-- Import the new component
import { filterAndSortBids } from './utils';
import './styles.scss';
import { useToast } from '../../contexts/ToastContext';

export const BidTracker = () => {
  const { user, profile } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bids, setBids] = useState<any[]>([]);

  // Filtering, Sorting, & View State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({
    key: 'email_received_at',
    direction: 'desc',
  });
  const [isFullView, setIsFullView] = useState(false);

  // Modal State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { showToast } = useToast();

  const fetchBids = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('user_id', user.id)
      .order('email_received_at', { ascending: false });

    if (error) {
      console.error('Error fetching bids:', error);
      return [];
    } else if (data) {
      setBids(data);
      return data;
    }

    return [];
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBids();
  }, [user]);

  const handleSync = async (): Promise<number> => {
    if (!user) return 0;
    setIsSyncing(true);

    try {
      const existingBidIds = new Set(bids.map((bid) => bid.id));
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      const response = await fetch(`${API_URL}/api/bids/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Sync failed on the server.');
      }

      const updatedBids = await fetchBids();
      const newBidsAdded = updatedBids.filter((bid) => !existingBidIds.has(bid.id)).length;

      return newBidsAdded;
    } catch (error) {
      console.error('Error syncing:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  const handleSort = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      setSortConfig({ key, direction: 'asc' });
    } else if (sortConfig.direction === 'asc') {
      setSortConfig({ key, direction: 'desc' });
    } else {
      setSortConfig(null);
    }
  };

  const processedBids = useMemo(() => {
    return filterAndSortBids(bids, searchTerm, selectedStatuses, sortConfig);
  }, [bids, searchTerm, selectedStatuses, sortConfig]);

  const needsReviewCount = bids.filter((b) => b.status === 'Needs Review').length;

  const copyTableToClipboard = () => {
    const headers = [
      'Status',
      'Date Received',
      'Job Name',
      'General Contractor',
      'Amount',
      'Due Date',
    ];

    const rows = processedBids.map((bid) => [
      bid.status,
      new Date(bid.email_received_at).toLocaleDateString(),
      bid.job_name,
      bid.general_contractor,
      bid.final_bid_amount ? `$${bid.final_bid_amount.toLocaleString()}` : 'TBD',
      bid.bid_due_date || '--',
    ]);

    // Join with Tabs (\t) for columns and Newlines (\n) for rows
    const tsvContent = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');

    navigator.clipboard.writeText(tsvContent);
    showToast('Table copied to clipboard!', 'success');
  };

  return (
    <div className="dashboard-wrapper">
      <Sidebar
        isSyncing={isSyncing}
        handleSync={handleSync}
        gmailConnected={!!profile?.gmail_connected}
        bidsCount={bids.length}
        needsReviewCount={needsReviewCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatuses={selectedStatuses}
        toggleStatus={toggleStatus}
        isFullView={isFullView}
        setIsFullView={setIsFullView}
        onCopyTable={copyTableToClipboard}
      />

      <main className="main-content">
        <FilterBubbles
          searchTerm={searchTerm}
          clearSearch={() => setSearchTerm('')}
          selectedStatuses={selectedStatuses}
          removeStatus={toggleStatus}
          clearAll={() => {
            setSearchTerm('');
            setSelectedStatuses([]);
          }}
        />

        {/* The entire table block is now perfectly encapsulated here */}
        <BidsTable
          bids={processedBids}
          isFullView={isFullView}
          sortConfig={sortConfig}
          onSort={handleSort}
          onRowClick={(bid) => {
            setSelectedBid(bid);
            setIsModalOpen(true);
          }}
        />
      </main>

      {isModalOpen && selectedBid && (
        <BidDetailModal bid={selectedBid} handleModal={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

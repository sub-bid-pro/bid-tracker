import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BidDetailModal } from './components/bidDetailModal/BidDetailModal';
import { Sidebar } from './components/sidebar/Sidebar';
import { FilterBubbles } from './components/filterBubbles/FilterBubbles';
import { filterAndSortBids } from './utils';
import './styles.scss';
import { StatusBadge } from '../../components/statusBadge/StatusBadge';

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [bids, setBids] = useState<any[]>([]);

  // Filtering, Sorting, & View State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null,
  );
  const [isFullView, setIsFullView] = useState(false); // <-- NEW STATE

  // Modal State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBids = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching bids:', error);
    else if (data) setBids(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBids();
  }, [user]);

  const handleSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      // 1. Define the dynamic URL
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

      // 2. Use it in the fetch call using template literals (backticks)
      const response = await fetch(`${API_URL}/api/bids/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (response.ok) await fetchBids();
      else alert('Sync failed.');
    } catch (error) {
      console.error('Error syncing:', error);
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

  // Uses our new util function!
  const processedBids = useMemo(() => {
    return filterAndSortBids(bids, searchTerm, selectedStatuses, sortConfig);
  }, [bids, searchTerm, selectedStatuses, sortConfig]);

  const renderSortIndicator = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return <span className="sort-indicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  const needsReviewCount = bids.filter((b) => b.status === 'Needs Review').length;

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

        <div className="bids-container">
          {bids.length > 0 ? (
            <table className="bids-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('status')} className="sortable-header">
                    Status {renderSortIndicator('status')}
                  </th>
                  <th onClick={() => handleSort('job_name')} className="sortable-header">
                    Job Name {renderSortIndicator('job_name')}
                  </th>
                  <th onClick={() => handleSort('general_contractor')} className="sortable-header">
                    General Contractor {renderSortIndicator('general_contractor')}
                  </th>

                  {/* EXTRA COLUMNS FOR FULL VIEW */}
                  {isFullView && (
                    <>
                      <th onClick={() => handleSort('gc_contact')} className="sortable-header">
                        GC Contact {renderSortIndicator('gc_contact')}
                      </th>
                      <th onClick={() => handleSort('location')} className="sortable-header">
                        Location {renderSortIndicator('location')}
                      </th>
                      <th onClick={() => handleSort('sqft')} className="sortable-header">
                        SqFt {renderSortIndicator('sqft')}
                      </th>
                      <th onClick={() => handleSort('labor_type')} className="sortable-header">
                        Labor {renderSortIndicator('labor_type')}
                      </th>
                      <th onClick={() => handleSort('rfi_due_date')} className="sortable-header">
                        RFI Due {renderSortIndicator('rfi_due_date')}
                      </th>
                      <th onClick={() => handleSort('award_date')} className="sortable-header">
                        Award Date {renderSortIndicator('award_date')}
                      </th>
                    </>
                  )}

                  <th onClick={() => handleSort('bid_due_date')} className="sortable-header">
                    Bid Due Date {renderSortIndicator('bid_due_date')}
                  </th>

                  {isFullView && (
                    <th onClick={() => handleSort('bid_result')} className="sortable-header">
                      Bid Result {renderSortIndicator('bid_result')}
                    </th>
                  )}

                  <th
                    onClick={() => handleSort('final_bid_amount')}
                    className="sortable-header text-right"
                  >
                    Amount {renderSortIndicator('final_bid_amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedBids.length > 0 ? (
                  processedBids.map((bid) => (
                    <tr
                      key={bid.id}
                      onClick={() => {
                        setSelectedBid(bid);
                        setIsModalOpen(true);
                      }}
                      className="clickable-row"
                    >
                      <td>
                        <StatusBadge status={bid.status} />
                      </td>
                      <td className="fw-bold">{bid.job_name}</td>
                      <td>{bid.general_contractor}</td>

                      {/* EXTRA COLUMNS FOR FULL VIEW */}
                      {isFullView && (
                        <>
                          <td>{bid.gc_contact || '--'}</td>
                          <td>{bid.location || '--'}</td>
                          <td>{bid.sqft || '--'}</td>
                          <td>{bid.labor_type || '--'}</td>
                          <td>{bid.rfi_due_date || '--'}</td>
                          <td>{bid.award_date || '--'}</td>
                        </>
                      )}

                      <td>{bid.bid_due_date || 'TBD'}</td>

                      {isFullView && <td>{bid.bid_result || '--'}</td>}

                      <td className="text-right">
                        {bid.final_bid_amount ? `$${bid.final_bid_amount.toLocaleString()}` : '--'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    {/* Adjust colSpan based on view mode so the empty state stretches all the way across */}
                    <td
                      colSpan={isFullView ? 12 : 5}
                      className="empty-state text-center"
                      style={{ padding: '32px' }}
                    >
                      No bids match your active filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ margin: '24px' }}>
              <p>No bids loaded yet. Press pull to fetch from Gmail.</p>
            </div>
          )}
        </div>
      </main>

      {isModalOpen && selectedBid && (
        <BidDetailModal bid={selectedBid} handleModal={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

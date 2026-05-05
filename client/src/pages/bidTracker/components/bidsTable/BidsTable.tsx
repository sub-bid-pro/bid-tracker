import { StatusBadge } from '../../../../components/statusBadge/StatusBadge';

// Helper function to handle character limits
const truncateText = (text: string | null | undefined, limit: number) => {
  if (!text) return '--';
  if (text.length <= limit) return text;
  return `${text.substring(0, limit).trim()}...`;
};

interface BidsTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bids: any[];
  isFullView: boolean;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowClick: (bid: any) => void;
}

export const BidsTable = ({ bids, isFullView, sortConfig, onSort, onRowClick }: BidsTableProps) => {
  const renderSortIndicator = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return <span className="sort-indicator">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="bids-container">
      {bids.length > 0 ? (
        <table className="bids-table">
          <thead>
            <tr>
              <th onClick={() => onSort('status')} className="sortable-header">
                Status {renderSortIndicator('status')}
              </th>
              <th onClick={() => onSort('email_received_at')} className="sortable-header">
                Received {renderSortIndicator('email_received_at')}
              </th>
              <th onClick={() => onSort('job_name')} className="sortable-header">
                Job Name {renderSortIndicator('job_name')}
              </th>
              <th onClick={() => onSort('general_contractor')} className="sortable-header">
                General Contractor {renderSortIndicator('general_contractor')}
              </th>

              {isFullView && (
                <>
                  <th onClick={() => onSort('gc_contact')} className="sortable-header">
                    GC Contact {renderSortIndicator('gc_contact')}
                  </th>
                  <th onClick={() => onSort('location')} className="sortable-header">
                    Location {renderSortIndicator('location')}
                  </th>
                  <th onClick={() => onSort('sqft')} className="sortable-header">
                    SqFt {renderSortIndicator('sqft')}
                  </th>
                  <th onClick={() => onSort('labor_type')} className="sortable-header">
                    Labor {renderSortIndicator('labor_type')}
                  </th>
                  <th onClick={() => onSort('rfi_due_date')} className="sortable-header">
                    RFI Due {renderSortIndicator('rfi_due_date')}
                  </th>
                  <th onClick={() => onSort('award_date')} className="sortable-header">
                    Award Date {renderSortIndicator('award_date')}
                  </th>
                </>
              )}

              <th onClick={() => onSort('bid_due_date')} className="sortable-header">
                Bid Due Date {renderSortIndicator('bid_due_date')}
              </th>

              {isFullView && (
                <th onClick={() => onSort('bid_result')} className="sortable-header">
                  Bid Result {renderSortIndicator('bid_result')}
                </th>
              )}

              <th onClick={() => onSort('final_bid_amount')} className="sortable-header text-right">
                Amount {renderSortIndicator('final_bid_amount')}
              </th>

              {/* NEW: Action Column Header */}
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => (
              <tr key={bid.id} onClick={() => onRowClick(bid)} className="clickable-row">
                <td>
                  <StatusBadge status={bid.status} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {bid.email_received_at
                    ? new Date(bid.email_received_at).toLocaleDateString()
                    : '--'}
                </td>

                <td className="fw-bold" title={bid.job_name}>
                  {isFullView ? bid.job_name || '--' : truncateText(bid.job_name, 35)}
                </td>
                <td title={bid.general_contractor}>
                  {isFullView
                    ? bid.general_contractor || '--'
                    : truncateText(bid.general_contractor, 30)}
                </td>

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

                {/* NEW: Gmail Link Cell */}
                <td>
                  {bid.thread_id ? (
                    <a
                      href={`https://mail.google.com/mail/u/0/#all/${bid.thread_id}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()} // Crucial: Prevents the row click from firing
                      style={{
                        color: 'var(--accent)',
                        textDecoration: 'underline',
                        fontSize: '0.85rem',
                      }}
                    >
                      View Email
                    </a>
                  ) : (
                    '--'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state text-center" style={{ margin: '32px' }}>
          No bids match your active filters or no bids loaded yet.
        </div>
      )}
    </div>
  );
};

import { StatusBadge } from '../../../../components/statusBadge/StatusBadge';
import EmailIcon from '@mui/icons-material/Email';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FolderSharedIcon from '@mui/icons-material/FolderShared';

// Helper function to handle character limits
const truncateText = (text: string | null | undefined, limit: number) => {
  if (!text) return '--';
  if (text.length <= limit) return text;
  return `${text.substring(0, limit).trim()}...`;
};

// NEW: Helper component using SCSS classes instead of inline styles
const IconLink = ({
  url,
  Icon,
  title,
}: {
  url: string | null | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: any;
  title: string;
}) => {
  if (!url) {
    return (
      <span
        title={`No ${title} available`}
        className="icon-link disabled"
        onClick={(e) => e.stopPropagation()} // Prevent row click when clicking disabled icon
      >
        <Icon sx={{ fontSize: 20 }} />
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={title}
      className="icon-link active"
      onClick={(e) => e.stopPropagation()} // Crucial: Prevents the row click from firing
    >
      <Icon sx={{ fontSize: 20 }} />
    </a>
  );
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

              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => {
              // Calculate links dynamically for the current row
              const gmailLink = bid.thread_id
                ? `https://mail.google.com/mail/u/0/#all/${bid.thread_id}`
                : null;
              const driveLink =
                bid.drive_folder_link ||
                (bid.drive_folder_id
                  ? `https://drive.google.com/drive/folders/${bid.drive_folder_id}`
                  : null);

              return (
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

                  {/* Cleaned up container class */}
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="icon-links-container">
                      <IconLink url={gmailLink} Icon={EmailIcon} title="Gmail Thread" />
                      <IconLink
                        url={bid.attachment_url}
                        Icon={AttachFileIcon}
                        title="Primary PDF"
                      />
                      <IconLink
                        url={driveLink}
                        Icon={FolderSharedIcon}
                        title="Google Drive Folder"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No bids match your active filters or no bids loaded yet.</div>
      )}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bid = any;

// Helper to standardise all data pairs
const DataGroup = ({
  label,
  value,
  linkText,
  fullWidth,
}: {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  linkText?: string;
  fullWidth?: boolean;
}) => (
  <div className={`data-group ${fullWidth ? 'full-width' : ''}`}>
    <label>{label}</label>
    {linkText && value ? (
      <a href={value} target="_blank" rel="noreferrer">
        {linkText}
      </a>
    ) : (
      <p>{value || '--'}</p>
    )}
  </div>
);

export const SummaryBlock = ({ summary }: { summary: string }) => {
  if (!summary) return null;
  return (
    <div className="summary-block">
      <label>Project Summary</label>
      <p>{summary}</p>
    </div>
  );
};

export const CoreDetails = ({ bid }: { bid: Bid }) => (
  <section className="modal-section">
    <h3>Core Details</h3>
    <div className="modal-grid">
      <DataGroup fullWidth label="Job Name" value={bid.job_name} />
      <DataGroup label="General Contractor" value={bid.general_contractor} />
      <DataGroup label="GC Contact Name" value={bid.gc_contact} />
      <DataGroup fullWidth label="GC Contact Email" value={bid.gc_contact_email} />
      <DataGroup label="Location" value={bid.location} />
      <DataGroup label="Distance" value={bid.distance} />
      <DataGroup label="SqFt" value={bid.sqft} />
      <DataGroup label="Labor Type" value={bid.labor_type} />
    </div>
  </section>
);

export const StatusFinancials = ({ bid }: { bid: Bid }) => (
  <section className="modal-section">
    <h3>Status & Financials</h3>
    <div className="modal-grid">
      <DataGroup
        label="Final Bid Amount"
        value={bid.final_bid_amount ? `$${bid.final_bid_amount.toLocaleString()}` : ''}
      />
      <DataGroup label="Bid Result" value={bid.bid_result} />
      <DataGroup label="Actively Bidding" value={bid.send_invite ? 'Yes' : 'No'} />
      <DataGroup label="Flagged Due Soon" value={bid.due_soon ? 'Yes' : 'No'} />
    </div>
  </section>
);

export const DatesDeadlines = ({ bid }: { bid: Bid }) => (
  <section className="modal-section">
    <h3>Dates & Deadlines</h3>
    <div className="modal-grid">
      <DataGroup label="Bid Due Date" value={bid.bid_due_date} />
      <DataGroup label="RFI Due Date" value={bid.rfi_due_date} />
      <DataGroup label="Email Received Date" value={bid.email_date} />
      <DataGroup label="Bid Submitted Date" value={bid.bid_submitted_date} />
      <DataGroup label="Award Date" value={bid.award_date} />
    </div>
  </section>
);

export const LinksMetadata = ({ bid }: { bid: Bid }) => (
  <section className="modal-section">
    <h3>Links & Metadata</h3>
    <div className="modal-grid">
      <DataGroup linkText="Open Portal ↗" label="Portal Link" value={bid.portal_link} />
      <DataGroup linkText="Open Drive ↗" label="Drive Folder" value={bid.drive_folder_link} />
      <DataGroup label="Row Helper" value={bid.row_helper} />
      <DataGroup label="Heal Status" value={bid.heal_status} />
      <DataGroup fullWidth label="Addendum" value={bid.addendum} />
      <DataGroup fullWidth label="Search Keywords" value={bid.search_keywords} />
    </div>
  </section>
);

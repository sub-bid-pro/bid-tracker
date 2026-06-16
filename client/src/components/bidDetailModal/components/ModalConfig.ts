// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Bid = any;

// 1. EXPLICITLY DEFINE THE FIELD SHAPE
export interface FieldConfig {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValue: (bid: Bid) => any;
  fullWidth?: boolean; // The "?" tells TypeScript this is optional!
}

// 2. EXPLICITLY DEFINE THE SECTION SHAPE
export interface SectionConfig {
  title: string;
  fields: FieldConfig[];
}

// 3. APPLY THE TYPE TO THE CONFIGURATION
export const BID_SECTIONS_CONFIG: Record<string, SectionConfig> = {
  core: {
    title: 'Core Details',
    fields: [
      { label: 'Job Name', getValue: (bid: Bid) => bid.job_name, fullWidth: true },
      { label: 'General Contractor', getValue: (bid: Bid) => bid.general_contractor },
      { label: 'GC Contact Name', getValue: (bid: Bid) => bid.gc_contact },
      { label: 'GC Contact Email', getValue: (bid: Bid) => bid.gc_contact_email, fullWidth: true },
      { label: 'Location', getValue: (bid: Bid) => bid.location },
      { label: 'Distance', getValue: (bid: Bid) => bid.distance },
      { label: 'SqFt', getValue: (bid: Bid) => bid.sqft },
      { label: 'Labor Type', getValue: (bid: Bid) => bid.labor_type },
    ],
  },
  financials: {
    title: 'Status & Financials',
    fields: [
      {
        label: 'Final Bid Amount',
        getValue: (bid: Bid) =>
          bid.final_bid_amount ? `$${bid.final_bid_amount.toLocaleString()}` : 'TBD',
      },
      { label: 'Bid Result', getValue: (bid: Bid) => bid.bid_result },
      {
        label: 'Actively Bidding',
        getValue: (bid: Bid) => (bid.send_invite || bid.final_bid_amount ? 'Yes' : 'No'),
      },
      { label: 'Flagged Due Soon', getValue: (bid: Bid) => (bid.due_soon ? 'Yes' : 'No') },
    ],
  },
  dates: {
    title: 'Dates & Deadlines',
    fields: [
      { label: 'Bid Due Date', getValue: (bid: Bid) => bid.bid_due_date },
      { label: 'RFI Due Date', getValue: (bid: Bid) => bid.rfi_due_date },
      {
        label: 'Email Received Date',
        getValue: (bid: Bid) =>
          bid.email_received_at ? new Date(bid.email_received_at).toLocaleDateString() : '',
      },
      {
        label: 'Bid Submitted Date',
        getValue: (bid: Bid) =>
          bid.bid_submitted_date ? new Date(bid.bid_submitted_date).toLocaleDateString() : '',
      },
      { label: 'Award Date', getValue: (bid: Bid) => bid.award_date },
    ],
  },
  metadata: {
    title: 'Additional Metadata',
    fields: [
      { label: 'Addendum', getValue: (bid: Bid) => bid.addendum, fullWidth: true },
      { label: 'Search Keywords', getValue: (bid: Bid) => bid.search_keywords, fullWidth: true },
    ],
  },
};

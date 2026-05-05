import { BID_SECTIONS_CONFIG, type Bid } from './ModalConfig';

const DataGroup = ({
  label,
  value,
  fullWidth,
}: {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  fullWidth?: boolean;
}) => (
  <div className={`data-group ${fullWidth ? 'full-width' : ''}`}>
    <label>{label}</label>
    <p>{value || '--'}</p>
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

export const DynamicSection = ({
  configKey,
  bid,
}: {
  configKey: keyof typeof BID_SECTIONS_CONFIG;
  bid: Bid;
}) => {
  const section = BID_SECTIONS_CONFIG[configKey];

  return (
    <section className="modal-section">
      <h3>{section.title}</h3>
      <div className="modal-grid">
        {section.fields.map((field, idx) => (
          <DataGroup
            key={idx}
            label={field.label}
            value={field.getValue(bid)}
            fullWidth={field.fullWidth}
          />
        ))}
      </div>
    </section>
  );
};

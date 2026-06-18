import { InfoPage } from './InfoPage';

const DEMOS = [
  { h: 'Product tour', p: 'A 3-minute walkthrough of the dashboard, tracker, and analytics.' },
  { h: 'Connecting Gmail', p: 'See how bid emails sync in automatically once you connect your inbox.' },
  { h: 'Reading your analytics', p: 'Turn your bid history into win-rate and volume insights.' },
  { h: 'Managing attachments', p: 'How Drive storage keeps every bid’s files organized.' },
];

export const Demos = () => (
  <InfoPage title="Demos" subtitle="Short videos showing Sub Bid Pro in action.">
    <div className="info-grid">
      {DEMOS.map((d) => (
        <div className="info-card demo-tile" key={d.h}>
          <div className="demo-thumb">▶ Coming soon</div>
          <h3>{d.h}</h3>
          <p>{d.p}</p>
        </div>
      ))}
    </div>
  </InfoPage>
);

import { InfoPage } from './InfoPage';

const TOPICS = [
  { h: 'Getting started', p: 'Connect Gmail, complete onboarding, and run your first sync to pull bids in automatically.' },
  { h: 'Syncing bids', p: 'How automatic email sync works, how often it runs, and how to trigger a manual sync.' },
  { h: 'Attachments & Drive', p: 'Configure Google Drive storage so bid attachments are saved and organized for you.' },
  { h: 'Analytics', p: 'Read the dashboard, annual breakdown, and monthly views to track win rate and volume.' },
  { h: 'Billing', p: 'Manage your subscription, update your card, or cancel from Settings → Subscription.' },
  { h: 'Contact support', p: 'Still stuck? Reach the team at support@subbidpro.com and we’ll help you out.' },
];

export const Help = () => (
  <InfoPage title="Help Center" subtitle="Guides and answers to get the most out of Sub Bid Pro.">
    <div className="info-grid">
      {TOPICS.map((t) => (
        <div className="info-card" key={t.h}>
          <h3>{t.h}</h3>
          <p>{t.p}</p>
        </div>
      ))}
    </div>
  </InfoPage>
);

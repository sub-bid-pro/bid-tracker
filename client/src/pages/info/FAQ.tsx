import { InfoPage } from './InfoPage';

const FAQS = [
  { q: 'How much does Sub Bid Pro cost?', a: 'It’s $299/month for a single plan with everything included. You start with a 30-day free trial — no card required up front.' },
  { q: 'Do I need a credit card to start the trial?', a: 'No. Your trial begins as soon as you connect your account, and you’ll only be asked for a card when you’re ready to subscribe.' },
  { q: 'When am I charged?', a: 'If you add a card during your trial, your first charge is scheduled for the end of your trial — never before. You’re never billed for unused trial days.' },
  { q: 'What happens if my payment fails?', a: 'If you’re an established subscriber, you keep full access during a short grace period while we retry. New customers whose first charge fails are asked to update their card.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from Settings → Subscription. You keep access until the end of your current billing period.' },
  { q: 'Is my data safe if I cancel?', a: 'Your data stays intact. If you resubscribe, everything is right where you left it.' },
];

export const FAQ = () => (
  <InfoPage title="Frequently Asked Questions" subtitle="The short answers to the things people ask most.">
    <div className="info-card">
      {FAQS.map((f) => (
        <div className="faq-item" key={f.q}>
          <div className="faq-q">{f.q}</div>
          <div className="faq-a">{f.a}</div>
        </div>
      ))}
    </div>
  </InfoPage>
);

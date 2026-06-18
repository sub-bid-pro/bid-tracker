import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './styles.scss';

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Shared layout for the marketing/info pages (Help, FAQ, Demos, Pricing). */
export const InfoPage = ({ title, subtitle, children }: Props) => (
  <div className="info-page">
    <div className="info-inner">
      <header className="info-header">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      <div className="info-body">{children}</div>

      <footer className="info-footer">
        <Link to="/help">Help</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/demos">Demos</Link>
        <Link to="/pricing">Pricing</Link>
      </footer>
    </div>
  </div>
);

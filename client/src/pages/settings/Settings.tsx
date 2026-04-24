import { useState, useEffect } from 'react';
import { ProfileSettings } from './components/ProfileSettings';
import { IntegrationSettings } from './components/IntegrationSettings';
import { PreferenceSettings } from './components/PreferenceSettings';
import { LogoutSettings } from './components/LogoutSettings';
import { SettingsSidebar } from './components/SettingsSidebar';
import { SettingsContent } from './components/SettingsContent';
import './styles.scss';

// --- SETTINGS CONFIGURATION ---
const SETTINGS_CONFIG = [
  {
    id: 'profile',
    label: 'Profile Details',
    component: <ProfileSettings />,
  },
  {
    id: 'preferences',
    label: 'App Preferences',
    component: <PreferenceSettings />,
  },
  {
    id: 'integrations',
    label: 'Email Integrations',
    component: <IntegrationSettings />,
  },
  {
    id: 'logout',
    label: 'Logout',
    component: <LogoutSettings />,
  },
];

export const Settings = () => {
  const [activeSection, setActiveSection] = useState(SETTINGS_CONFIG[0].id);

  // --- SCROLL SPY LOGIC ---
  useEffect(() => {
    const sections = document.querySelectorAll('.settings-section');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // --- SMOOTH SCROLL HANDLER ---
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-layout">
        <SettingsSidebar
          sections={SETTINGS_CONFIG}
          activeSection={activeSection}
          onNavigate={scrollToSection}
        />

        <SettingsContent sections={SETTINGS_CONFIG} />
      </div>
    </div>
  );
};

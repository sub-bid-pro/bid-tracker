import type { ReactNode } from 'react';

interface ContentConfig {
  id: string;
  component: ReactNode;
}

interface Props {
  sections: ContentConfig[];
}

export const SettingsContent = ({ sections }: Props) => {
  return (
    <div className="settings-content">
      <div className="settings-content-inner">
        <div className="settings-header">
          <h1>Settings</h1>
        </div>

        <div className="settings-components-container">
          {/* DYNAMICALLY MAPPING THE CONTENT SECTIONS */}
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="settings-section">
              {section.component}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

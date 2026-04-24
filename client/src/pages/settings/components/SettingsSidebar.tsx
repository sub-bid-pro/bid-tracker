interface SectionConfig {
  id: string;
  label: string;
}

interface Props {
  sections: SectionConfig[];
  activeSection: string;
  onNavigate: (id: string) => void;
}

export const SettingsSidebar = ({ sections, activeSection, onNavigate }: Props) => {
  return (
    <aside className="settings-sidebar">
      <nav>
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => onNavigate(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};
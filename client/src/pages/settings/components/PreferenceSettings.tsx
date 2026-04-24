import ThemeToggle from '../../../components/themeToggle/ThemeToggle';

export const PreferenceSettings = () => {
  return (
    <div className="geometric-container settings-card preferences-card">
      <h3>App Preferences</h3>

      <div className="pref-row">
        <div className="pref-info">
          <h4>Theme</h4>
          <p>Switch between light and dark mode.</p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
};

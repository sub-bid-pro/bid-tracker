import { useTheme } from '../../contexts/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import './styles.scss';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className={`theme-toggle ${theme}`} onClick={toggleTheme} aria-label="Toggle Theme">
      {theme === 'light' ? <LightModeIcon /> : <DarkModeIcon />}
    </button>
  );
};

export default ThemeToggle;

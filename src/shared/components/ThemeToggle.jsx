import { useEffect, useState } from 'react';
import { getThemeChoice, onThemeChange, resolvedTheme, setThemeChoice } from '../lib/theme.js';
import { sfx } from '../lib/sound.js';

// ☀️ / 🌙 button: switches between light and dark.
export default function ThemeToggle() {
  const [, force] = useState(0);
  useEffect(() => onThemeChange(() => force((n) => n + 1)), []);
  const dark = resolvedTheme() === 'dark';
  return (
    <button
      className="theme-toggle"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => {
        sfx('click');
        setThemeChoice(dark ? 'light' : 'dark');
      }}
      data-choice={getThemeChoice()}
    >
      <span className="theme-toggle__icon">{dark ? '🌙' : '☀️'}</span>
    </button>
  );
}

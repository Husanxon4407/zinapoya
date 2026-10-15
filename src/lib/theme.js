// Light / dark theme and the moving background, remembered per browser.
const read = (k, d) => {
  try {
    return localStorage.getItem(k) ?? d;
  } catch {
    return d;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

const listeners = new Set();
const media = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export const getThemeChoice = () => read('su_theme', 'auto'); // 'auto' | 'light' | 'dark'
export const resolvedTheme = () => {
  const c = getThemeChoice();
  return c === 'auto' ? (media?.matches ? 'dark' : 'light') : c;
};
export const motionOn = () => read('su_motion', 'on') === 'on' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function applyTheme() {
  document.documentElement.dataset.theme = resolvedTheme();
  document.documentElement.dataset.motion = motionOn() ? 'on' : 'off';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme() === 'dark' ? '#0b0c1d' : '#4f46e5');
  listeners.forEach((cb) => cb());
}

export function setThemeChoice(choice) {
  write('su_theme', choice);
  applyTheme();
}
export function setMotion(on) {
  write('su_motion', on ? 'on' : 'off');
  applyTheme();
}
export function onThemeChange(cb) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

media?.addEventListener?.('change', () => getThemeChoice() === 'auto' && applyTheme());

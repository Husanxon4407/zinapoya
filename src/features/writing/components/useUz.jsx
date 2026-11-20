import { useCallback, useSyncExternalStore } from 'react';
import { getLang } from '../../../i18n/index.js';

// Feedback is in simple English with an "O‘zbekcha" switch (plan section 5). The choice is remembered
// on this device; the first time, it follows the site language.
const KEY = 'zp_writing_uz';
const listeners = new Set();

function read() {
  try {
    const v = localStorage.getItem(KEY);
    if (v === '1' || v === '0') return v === '1';
  } catch {
    /* storage blocked */
  }
  return getLang() === 'uz';
}

export function useUz() {
  const uz = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => false,
  );
  const set = useCallback((next) => {
    try {
      localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      /* storage blocked */
    }
    listeners.forEach((cb) => cb());
  }, []);
  return [uz, set];
}

/** The EN | O‘zbekcha switch. */
export function UzToggle() {
  const [uz, setUz] = useUz();
  return (
    <div className="w-langswitch" role="group" aria-label="Explanation language">
      <button type="button" className={!uz ? 'is-on' : ''} aria-pressed={!uz} onClick={() => setUz(false)}>
        English
      </button>
      <button type="button" className={uz ? 'is-on' : ''} aria-pressed={uz} onClick={() => setUz(true)}>
        O‘zbekcha
      </button>
    </div>
  );
}

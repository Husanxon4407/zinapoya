import { useEffect, useState } from 'react';
import { currentSubscription, disableReminders, enableReminders, isIOS, isStandalone, pushSupported, useInstall } from '../lib/pwa.js';

export function InstallSteps() {
  return (
    <ol className="install-steps">
      <li>
        Tap the <strong>Share</strong> button <span aria-hidden="true">⬆️</span> at the bottom of Safari.
      </li>
      <li>
        Choose <strong>Add to Home Screen</strong>.
      </li>
      <li>
        Tap <strong>Add</strong>. SpeakUp now opens like an app!
      </li>
    </ol>
  );
}

export default function AppSettings() {
  const { state, install } = useInstall();
  const [reminder, setReminder] = useState(null); // null = checking
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showSteps, setShowSteps] = useState(false);
  const canPush = pushSupported();
  const iosNeedsInstall = isIOS() && !isStandalone();

  useEffect(() => {
    currentSubscription()
      .then((s) => setReminder(!!s))
      .catch(() => setReminder(false));
  }, []);

  async function toggle() {
    setBusy(true);
    setError('');
    try {
      if (reminder) await disableReminders();
      else await enableReminders();
      setReminder(!reminder);
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card app-settings">
      <h3>📱 App & reminders</h3>

      <div className="setting">
        <div>
          <strong>Install SpeakUp on your phone</strong>
          <small>Opens full screen from your home screen, like a real app.</small>
        </div>
        {state === 'installed' && <span className="setting__ok">✅ Installed</span>}
        {state === 'prompt' && (
          <button className="btn btn--small" onClick={install}>
            📲 Install
          </button>
        )}
        {state === 'ios' && (
          <button className="btn btn--small btn--ghost" onClick={() => setShowSteps(!showSteps)}>
            How?
          </button>
        )}
        {state === 'none' && <small className="muted">Open this site on your phone in Chrome or Safari to install it.</small>}
      </div>
      {state === 'ios' && showSteps && <InstallSteps />}

      <div className="setting">
        <div>
          <strong>🔔 Daily reminder at 19:00</strong>
          <small>Only on days when you have not practised yet.</small>
        </div>
        {iosNeedsInstall ? (
          <small className="muted">On iPhone, install the app first (above), then turn this on inside the app.</small>
        ) : !canPush ? (
          <small className="muted">Not available in this browser.</small>
        ) : (
          <button
            className={`toggle-switch ${reminder ? 'toggle-switch--on' : ''}`}
            role="switch"
            aria-checked={!!reminder}
            aria-label="Daily reminder"
            disabled={busy || reminder === null}
            onClick={toggle}
          >
            <span />
          </button>
        )}
      </div>
      {error && <p className="notice notice--warn">{error}</p>}
    </div>
  );
}

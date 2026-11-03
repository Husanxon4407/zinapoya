import { useEffect, useState } from 'react';
import LangSwitch from './LangSwitch.jsx';
import { translate, useT } from '../i18n/index.js';
import { currentSubscription, disableReminders, enableReminders, isIOS, isStandalone, pushSupported, useInstall } from '../lib/pwa.js';

export function InstallSteps() {
  const t = useT();
  return (
    <ol className="install-steps">
      <li>
        {t('Tap the Share button at the bottom of Safari.')} <span aria-hidden="true">⬆️</span>
      </li>
      <li>
        {t('Choose “Add to Home Screen”.')}
      </li>
      <li>
        {t('Tap “Add”. Zinapoya now opens like an app!')}
      </li>
    </ol>
  );
}

export default function AppSettings() {
  const { state, install } = useInstall();
  const t = useT();
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
      setError(e.message || translate('Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card app-settings">
      <h3>📱 {t('App & reminders')}</h3>

      <div className="setting">
        <div>
          <strong>🌐 {t('Language')}</strong>
          <small>{t('Menus and instructions. Practice stays in English.')}</small>
        </div>
        <LangSwitch full />
      </div>

      <div className="setting">
        <div>
          <strong>{t('Install Zinapoya on your phone')}</strong>
          <small>{t('Opens full screen from your home screen, like a real app.')}</small>
        </div>
        {state === 'installed' && <span className="setting__ok">✅ {t('Installed')}</span>}
        {state === 'prompt' && (
          <button className="btn btn--small" onClick={install}>
            📲 {t('Install')}
          </button>
        )}
        {state === 'ios' && (
          <button className="btn btn--small btn--ghost" onClick={() => setShowSteps(!showSteps)}>
            {t('How?')}
          </button>
        )}
        {state === 'none' && <small className="muted">{t('Open this site on your phone in Chrome or Safari to install it.')}</small>}
      </div>
      {state === 'ios' && showSteps && <InstallSteps />}

      <div className="setting">
        <div>
          <strong>🔔 {t('Daily reminder at 19:00')}</strong>
          <small>{t('Only on days when you have not practised yet.')}</small>
        </div>
        {iosNeedsInstall ? (
          <small className="muted">{t('On iPhone, install the app first (above), then turn this on inside the app.')}</small>
        ) : !canPush ? (
          <small className="muted">{t('Not available in this browser.')}</small>
        ) : (
          <button
            className={`toggle-switch ${reminder ? 'toggle-switch--on' : ''}`}
            role="switch"
            aria-checked={!!reminder}
            aria-label={t('Daily reminder')}
            disabled={busy || reminder === null}
            onClick={toggle}
          >
            <span />
          </button>
        )}
      </div>
      {error && <p className="notice notice--warn">{t(error)}</p>}
    </div>
  );
}

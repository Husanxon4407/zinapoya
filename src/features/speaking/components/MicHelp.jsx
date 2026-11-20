import { useState } from 'react';
import { inAppBrowser, isIOS } from '../../../shared/lib/speech.js';
import { useT } from '../../../i18n/index.js';

const isAndroid = () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');

/** Buttons that leave Telegram/Instagram's small browser and open this page in the real browser. */
export function OpenInBrowser() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const noScheme = url.replace(/^https?:\/\//, '');
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <div className="open-browser">
      {isAndroid() && (
        <a className="btn btn--small" href={`intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`}>
          🌐 {t('Open in Chrome')}
        </a>
      )}
      {isIOS() && (
        <a className="btn btn--small" href={`x-safari-https://${noScheme}`}>
          🧭 {t('Open in Safari')}
        </a>
      )}
      <button type="button" className="btn btn--ghost btn--small" onClick={copy}>
        {copied ? `✓ ${t('Link copied')}` : `🔗 ${t('Copy the link')}`}
      </button>
    </div>
  );
}

/** Warning shown before recording when the page is open inside an app (Telegram, Instagram…). */
export function InAppWarning() {
  const t = useT();
  const app = inAppBrowser();
  if (!app) return null;
  return (
    <div className="notice notice--warn mic-help">
      <b>⚠️ {app === 'app' ? t('You opened Zinapoya inside another app.') : t('You opened Zinapoya inside {app}.', { app })}</b>{' '}
      {t('The microphone often does not work here.')}{' '}
      {isIOS() ? t('Tap ••• or the compass icon and choose “Open in Safari”.') : t('Tap ⋮ (top right) and choose “Open in Chrome” or “Open in browser”.')}
      <OpenInBrowser />
    </div>
  );
}

/** What to do when the microphone could not be opened. status: blocked | no-mic | busy | unsupported | error */
export default function MicHelp({ status, onRetry, onSkip }) {
  const t = useT();
  const app = inAppBrowser();
  let title;
  let how;
  if (status === 'blocked') {
    title = t('The microphone is blocked for this website.');
    how = isIOS()
      ? t('iPhone: tap “aA” in the address bar → Website Settings → Microphone → Allow. Then reload the page.')
      : isAndroid()
        ? t('Android: tap the icon left of the address → Permissions → Microphone → Allow. Then reload the page.')
        : t('Computer: click the icon left of the address → Microphone → Allow. Then reload the page.');
  } else if (status === 'no-mic') {
    title = t('No microphone was found.');
    how = t('Connect a microphone or headphones with a microphone, or use your phone.');
  } else if (status === 'busy') {
    title = t('Another app is using the microphone.');
    how = t('Close calls, Zoom, Telegram voice chats or other recording apps, then try again.');
  } else if (status === 'unsupported') {
    title = t('This browser cannot record your voice.');
    how = t('Please open Zinapoya in Google Chrome (Android, computer) or Safari (iPhone).');
  } else {
    title = t('The microphone could not be started.');
    how = t('Reload the page and try again. If it still does not work, open Zinapoya in Google Chrome or Safari.');
  }
  return (
    <div className="notice notice--warn mic-help">
      <b>🎙️ {title}</b>
      <p>{how}</p>
      {app && <p>{t('You are inside {app}: opening the site in your normal browser usually fixes this.', { app: app === 'app' ? t('another app') : app })}</p>}
      {app && <OpenInBrowser />}
      <div className="open-browser">
        {onRetry && (
          <button type="button" className="btn btn--small" onClick={onRetry}>
            ↻ {t('Try again')}
          </button>
        )}
        {onSkip && (
          <button type="button" className="btn btn--ghost btn--small" onClick={onSkip}>
            {t('Continue without recording')}
          </button>
        )}
      </div>
    </div>
  );
}

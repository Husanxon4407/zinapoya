import { CONTACTS } from '../../data/site.js';
import { useT } from '../../i18n/index.js';
import { isIOS } from '../../lib/pwa.js';

// iPhone/iPad don't hand a t.me link opened in a new tab (or from the Home Screen app) to Telegram,
// so there we open the app itself and fall back to the web page if Telegram isn't installed.
function openApp(e, c) {
  if (!c.app || !isIOS()) return;
  e.preventDefault();
  const fallback = setTimeout(() => {
    if (!document.hidden) window.location.href = c.href;
  }, 1500);
  document.addEventListener('visibilitychange', () => clearTimeout(fallback), { once: true });
  window.location.href = c.app;
}

export default function Contacts() {
  const t = useT();
  return (
    <section className="home-sec" id="contacts" aria-labelledby="contacts-title">
      <div className="home-sec__head reveal">
        <span className="eyebrow">{t('Contacts')}</span>
        <h2 id="contacts-title">{t('Get in touch')}</h2>
      </div>
      <div className="contacts-grid">
        {CONTACTS.map((c, i) => (
          <a
            key={c.id}
            className="contact-tile reveal"
            style={{ '--d': i }}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => openApp(e, c)}
          >
            <span className="contact-tile__emoji">{c.emoji}</span>
            <span className="contact-tile__label">{t(c.label)}</span>
            <span className="contact-tile__value">{c.value}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

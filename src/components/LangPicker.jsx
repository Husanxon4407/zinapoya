import { useEffect, useRef, useState } from 'react';
import { deviceLang, langAsked, LANGS, loadLang, savedLang, setLang } from '../i18n/index.js';
import Logo from './Logo.jsx';

// First visit only: "Choose your language" before anything else, written in all three languages,
// because some visitors cannot read English yet. The saved (or phone) language is highlighted.
// Later the language is changed with the 🌐 switch at the top of every page.
// Styled like the homepage hero: dark space, stars, the Zinapoya logo.
const WORDS = {
  en: { pick: 'Choose your language', go: 'Continue in English', welcome: 'Welcome!' },
  uz: { pick: 'Tilni tanlang', go: 'O‘zbek tilida davom etish', welcome: 'Xush kelibsiz!' },
  ru: { pick: 'Выберите язык', go: 'Продолжить на русском', welcome: 'Добро пожаловать!' },
};

export default function LangPicker() {
  const [open, setOpen] = useState(() => !langAsked());
  const [busy, setBusy] = useState(null);
  const [suggested] = useState(() => savedLang() || deviceLang());
  const firstRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    loadLang(suggested); // most likely choice: have its words ready so the switch is instant
    firstRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, suggested]);

  if (!open) return null;

  async function choose(id) {
    setBusy(id);
    await setLang(id);
    setOpen(false);
  }

  // The suggested language goes first.
  const order = [...LANGS].sort((a, b) => (a.id === suggested ? -1 : b.id === suggested ? 1 : 0));

  return (
    <div className="langpick-overlay">
      <div className="langpick" role="dialog" aria-modal="true" aria-labelledby="langpick-title" translate="no">
        <div className="langpick__sky" aria-hidden="true" />

        <div className="langpick__brand logo logo--light">
          <Logo size={44} />
        </div>
        <p className="langpick__welcome">
          {order.map((l, i) => (
            <span key={l.id} lang={l.id}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              {WORDS[l.id].welcome}
            </span>
          ))}
        </p>

        <h2 id="langpick-title" className="langpick__title">
          {order.map((l) => (
            <span key={l.id} lang={l.id}>
              {WORDS[l.id].pick}
            </span>
          ))}
        </h2>

        <div className="langpick__list">
          {order.map((l, i) => (
            <button
              key={l.id}
              ref={i === 0 ? firstRef : null}
              type="button"
              lang={l.id}
              className={`langpick__btn ${l.id === suggested ? 'is-suggested' : ''}`}
              onClick={() => choose(l.id)}
              disabled={!!busy}
            >
              <span className="langpick__badge" aria-hidden="true">
                {l.label}
              </span>
              <span className="langpick__name">
                <strong>{l.name}</strong>
                <small>{WORDS[l.id].go}</small>
              </span>
              <span className="langpick__arrow" aria-hidden="true">
                {busy === l.id ? <span className="spinner spinner--small" /> : '→'}
              </span>
            </button>
          ))}
        </div>

        <p className="langpick__note">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <span>EN · O‘Z · РУ</span>
        </p>
      </div>
    </div>
  );
}

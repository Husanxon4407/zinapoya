import { useEffect, useRef, useState } from 'react';
import { LANGS, setLang, useLang, useT } from '../i18n/index.js';

// 🌐 Language switch: changes menus and instructions, not the English practice itself.
// - default: a small pill in the top bar that opens a menu of the three languages.
// - full:    all three languages side by side (login / sign-up pages), no menu to find.
export default function LangSwitch({ full = false }) {
  const lang = useLang();
  const t = useT();
  const [busy, setBusy] = useState(null);

  async function choose(id) {
    if (id === lang) return;
    setBusy(id);
    await setLang(id);
    setBusy(null);
  }

  if (full) {
    return (
      <div className="lang-seg" role="radiogroup" aria-label={t('Language')} translate="no">
        {LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            lang={l.id}
            aria-checked={l.id === lang}
            className={`lang-seg__btn ${l.id === lang ? 'is-on' : ''} ${busy === l.id ? 'is-busy' : ''}`}
            onClick={() => choose(l.id)}
          >
            {l.name}
          </button>
        ))}
      </div>
    );
  }

  return <LangMenu lang={lang} t={t} choose={choose} busy={busy} />;
}

function LangMenu({ lang, t, choose, busy }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const btnRef = useRef(null);
  const current = LANGS.find((l) => l.id === lang) || LANGS[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    boxRef.current?.querySelector('.lang-menu__item.is-on')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Arrow keys move between the languages.
  function onListKey(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...boxRef.current.querySelectorAll('.lang-menu__item')];
    const i = items.indexOf(document.activeElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  }

  return (
    <div className={`lang-switch ${open ? 'is-open' : ''}`} ref={boxRef} translate="no">
      <button
        ref={btnRef}
        type="button"
        className="lang-switch__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('Language')}: ${current.name}`}
        title={t('Language')}
        onClick={() => setOpen((o) => !o)}
      >
        <svg className="lang-switch__globe" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        <span className="lang-switch__code">{current.label}</span>
        <svg className="lang-switch__chev" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="lang-menu" role="menu" aria-label={t('Language')} onKeyDown={onListKey}>
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="menuitemradio"
              aria-checked={l.id === lang}
              lang={l.id}
              className={`lang-menu__item ${l.id === lang ? 'is-on' : ''}`}
              onClick={async () => {
                await choose(l.id);
                setOpen(false);
                btnRef.current?.focus();
              }}
            >
              <span className="lang-menu__badge" aria-hidden="true">
                {l.label}
              </span>
              <span className="lang-menu__name">{l.name}</span>
              <span className="lang-menu__mark" aria-hidden="true">
                {busy === l.id ? <span className="spinner spinner--small" /> : l.id === lang ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { deviceLang, hasChosenLang, LANGS, loadLang, setLang } from '../i18n/index.js';

// First visit only: "Choose your language" before anything else, written in all three languages,
// because some visitors cannot read English yet. The phone's language is highlighted.
// Later the language is changed with the 🌐 switch at the top of every page.
const WORDS = {
  en: { hello: 'Hello!', pick: 'Choose your language' },
  uz: { hello: 'Salom!', pick: 'Tilni tanlang' },
  ru: { hello: 'Привет!', pick: 'Выберите язык' },
};

export default function LangPicker() {
  const [open, setOpen] = useState(() => !hasChosenLang());
  const [busy, setBusy] = useState(null);
  const [suggested] = useState(deviceLang);
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
      <div className="card langpick" role="dialog" aria-modal="true" aria-labelledby="langpick-title" translate="no">
        <span className="langpick__icon" aria-hidden="true">
          🌐
        </span>
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
                <small>{WORDS[l.id].hello}</small>
              </span>
              {busy === l.id && <span className="spinner spinner--small" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

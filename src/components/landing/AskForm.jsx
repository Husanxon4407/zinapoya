import { useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { useT } from '../../i18n/index.js';

export default function AskForm() {
  const t = useT();
  const [form, setForm] = useState({ name: '', contact: '', message: '', website: '' });
  // When the form was shown: a bot fills it in instantly, a person takes a few seconds.
  const shownAt = useRef(Date.now());
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!form.message.trim() || state === 'sending') return;
    setState('sending');
    setError('');
    try {
      await api.submitQuestion({ ...form, elapsed: Date.now() - shownAt.current });
      setState('sent');
      setForm({ name: '', contact: '', message: '', website: '' });
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  }

  return (
    <section className="home-sec" id="ask" aria-labelledby="ask-title">
      <div className="home-sec__head reveal">
        <span className="eyebrow">{t('Ask us')}</span>
        <h2 id="ask-title">{t('Have a question?')}</h2>
        <p>{t('Ask us anything about the exam or the website — we’ll get back to you.')}</p>
      </div>
      {state === 'sent' ? (
        <div className="card ask-thanks">
          <span className="ask-thanks__icon">✅</span>
          <h3>{t('Thank you!')}</h3>
          <p>{t('We received your question and will reply soon.')}</p>
          <button
            className="btn btn--ghost btn--small"
            onClick={() => {
              shownAt.current = Date.now();
              setState('idle');
            }}
          >
            {t('Ask another')}
          </button>
        </div>
      ) : (
        <form className="card ask-form" onSubmit={submit}>
          {/* Trap for spam bots: hidden from people (and screen readers), bots fill it in. */}
          <input
            className="ask-form__trap"
            name="website"
            value={form.website}
            onChange={set('website')}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <div className="ask-form__row">
            <label>
              <span>{t('Your name')}</span>
              <input value={form.name} onChange={set('name')} maxLength={80} placeholder={t('Optional')} />
            </label>
            <label>
              <span>{t('Telegram / phone / email')}</span>
              <input value={form.contact} onChange={set('contact')} maxLength={120} placeholder={t('So we can reply')} />
            </label>
          </div>
          <label>
            <span>{t('Your question')}</span>
            <textarea value={form.message} onChange={set('message')} rows={4} maxLength={2000} required placeholder={t('Type your question here…')} />
          </label>
          {error && <p className="notice notice--warn">{t(error)}</p>}
          <button className="btn" disabled={state === 'sending' || !form.message.trim()}>
            {state === 'sending' ? t('Sending…') : `📨 ${t('Send question')}`}
          </button>
        </form>
      )}
    </section>
  );
}

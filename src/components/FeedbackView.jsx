import { speak } from '../lib/speech.js';
import { useT } from '../i18n/index.js';

const CRITERIA = [
  ['fluency', 'Fluency', '🌊'],
  ['vocabulary', 'Vocabulary', '📚'],
  ['grammar', 'Grammar', '🧱'],
  ['task', 'Answered the task', '🎯'],
];

export default function FeedbackView({ feedback, scores }) {
  const t = useT();
  if (!feedback) return null;
  return (
    <div className="feedback">
      <div className="feedback__top">
        <div className="level-badge">
          <small>{t('Estimated level')}</small>
          <strong>{scores?.level || feedback.level}</strong>
          <span>{scores?.overall}/100</span>
        </div>
        <div className="bars">
          {CRITERIA.map(([k, name, icon]) => {
            const v = scores?.[k] ?? 0;
            return (
              <div className="bar" key={k}>
                <span className="bar__label">
                  {icon} {t(name)}
                </span>
                <span className="bar__track">
                  <span className="bar__fill" style={{ width: `${v * 10}%`, background: v >= 7 ? 'var(--good)' : v >= 5 ? 'var(--amber)' : 'var(--bad)' }} />
                </span>
                <span className="bar__value">{v}/10</span>
              </div>
            );
          })}
        </div>
      </div>

      {feedback.strengths?.length > 0 && (
        <section>
          <h4>👏 {t('What you did well')}</h4>
          <ul className="tick-list">
            {feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {feedback.corrections?.length > 0 && (
        <section>
          <h4>🛠️ {t('Fix these sentences')}</h4>
          {feedback.corrections.map((c, i) => (
            <div className="correction" key={i}>
              <p className="correction__bad">✗ {c.original}</p>
              <p className="correction__good">
                ✓ {c.better}{' '}
                <button className="icon-btn" title={t('Listen')} onClick={() => speak(c.better)}>
                  🔊
                </button>
              </p>
              {c.why && <p className="correction__why">{c.why}</p>}
            </div>
          ))}
        </section>
      )}

      {feedback.better_phrases?.length > 0 && (
        <section>
          <h4>🚀 {t('Upgrade your words')}</h4>
          <div className="upgrades">
            {feedback.better_phrases.map((p, i) => (
              <div className="upgrade" key={i}>
                <span className="upgrade__old">{p.instead_of}</span>
                <span>→</span>
                <strong>{p.try}</strong>
                <button className="icon-btn" onClick={() => speak(p.try)} title={t('Listen')}>
                  🔊
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {feedback.tip && (
        <section className="tip">
          <h4>🎯 {t('Next time, try this')}</h4>
          <p>{feedback.tip}</p>
        </section>
      )}

      {feedback.improved_answer && (
        <details className="improved">
          <summary>✨ {t('Your answer, upgraded')}</summary>
          <p>{feedback.improved_answer}</p>
          <button className="btn btn--ghost btn--small" onClick={() => speak(feedback.improved_answer)}>
            🔊 {t('Listen')}
          </button>
        </details>
      )}
    </div>
  );
}

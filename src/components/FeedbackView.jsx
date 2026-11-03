import { speak } from '../lib/speech.js';
import { useT } from '../i18n/index.js';

const CRITERIA = [
  ['fluency', 'Fluency', '🌊'],
  ['vocabulary', 'Vocabulary', '📚'],
  ['grammar', 'Grammar', '🧱'],
  ['task', 'Answered the task', '🎯'],
];

function Listen({ text }) {
  const t = useT();
  if (!text) return null;
  return (
    <button className="icon-btn" title={t('Listen')} onClick={() => speak(text)}>
      🔊
    </button>
  );
}

// Works for the new detailed feedback (version 2) and for older, shorter feedback.
export default function FeedbackView({ feedback, scores }) {
  const t = useT();
  if (!feedback) return null;
  const notes = feedback.score_notes || {};
  const praise = feedback.praise || [];
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
              <div className="bar-wrap" key={k}>
                <div className="bar">
                  <span className="bar__label">
                    {icon} {t(name)}
                  </span>
                  <span className="bar__track">
                    <span className="bar__fill" style={{ width: `${v * 10}%`, background: v >= 7 ? 'var(--good)' : v >= 5 ? 'var(--amber)' : 'var(--bad)' }} />
                  </span>
                  <span className="bar__value">{v}/10</span>
                </div>
                {notes[k] && <p className="bar__note">{notes[k]}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {feedback.summary && (
        <section className="fb-summary">
          <p>{feedback.summary}</p>
        </section>
      )}

      {praise.length > 0 ? (
        <section>
          <h4>👏 {t('What you did well')}</h4>
          <div className="praise-list">
            {praise.map((p, i) => (
              <div className="praise" key={i}>
                {p.type && <span className="praise__type">{p.type}</span>}
                <p className="praise__quote">“{p.quote}”</p>
                <p className="praise__why">{p.why}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        feedback.strengths?.length > 0 && (
          <section>
            <h4>👏 {t('What you did well')}</h4>
            <ul className="tick-list">
              {feedback.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        )
      )}

      {feedback.corrections?.length > 0 && (
        <section>
          <h4>🛠️ {t('Fix these sentences')}</h4>
          {feedback.corrections.map((c, i) => (
            <div className="correction" key={i}>
              {c.type && <span className="correction__type">{c.type}</span>}
              <p className="correction__bad">✗ {c.original}</p>
              <p className="correction__good">
                ✓ {c.better} <Listen text={c.better} />
              </p>
              {c.why && <p className="correction__why">💡 {c.why}</p>}
              {c.tip && <p className="correction__tip">🧠 {c.tip}</p>}
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
                <div className="upgrade__row">
                  <span className="upgrade__old">{p.instead_of}</span>
                  <span>→</span>
                  <strong>{p.try}</strong>
                  <Listen text={p.try} />
                </div>
                {p.example && (
                  <p className="upgrade__example">
                    {p.example} <Listen text={p.example} />
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {feedback.structure && (
        <section>
          <h4>🧩 {t('How your answer was organised')}</h4>
          <p>{feedback.structure}</p>
        </section>
      )}

      {feedback.next_steps?.length > 0 ? (
        <section className="tip">
          <h4>🎯 {t('Practise this today')}</h4>
          <ol className="next-steps">
            {feedback.next_steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
      ) : (
        feedback.tip && (
          <section className="tip">
            <h4>🎯 {t('Next time, try this')}</h4>
            <p>{feedback.tip}</p>
          </section>
        )
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

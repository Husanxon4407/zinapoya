import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AREAS, areaPath } from '../../../shared/data/areas.js';
import { AGES, GOALS, LEVELS, daysUntil, optionOf } from '../../../shared/data/about.js';
import { useApp } from '../../../app/state.jsx';
import { useT } from '../../../i18n/index.js';
import { areaStyle } from './AreaLanding.jsx';
import '../../../styles/areas.css';

// "My learning": one account, every area. The areas the student joined, one tap to join another,
// and the "About you" answers.
export default function MyLearning() {
  const t = useT();
  const navigate = useNavigate();
  const { user, profile, areas, joinArea, stats } = useApp();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const first = (profile?.name || user.name).split(' ')[0];
  const mine = AREAS.filter((a) => areas.includes(a.id));
  const others = AREAS.filter((a) => !areas.includes(a.id));

  const goal = optionOf(GOALS, profile?.goal);
  const level = optionOf(LEVELS, profile?.level);
  const age = optionOf(AGES, profile?.age_range);
  const days = daysUntil(profile?.exam_date);
  const hasAbout = 'onboarded_at' in (profile || {});

  async function join(id) {
    setBusy(id);
    setError('');
    try {
      await joinArea(id);
      navigate(areaPath(id));
    } catch (e) {
      setError(e.message);
      setBusy('');
    }
  }

  return (
    <div className="mylearn">
      <header className="mylearn__head">
        <div>
          <span className="eyebrow">{t('My learning')}</span>
          <h1>{t('Hi, {name}! What are we learning today?', { name: first })}</h1>
        </div>
        {(goal || level || days !== null) && (
          <div className="mylearn__chips">
            {goal && (
              <span className="chip">
                {goal.emoji} {t(goal.label)}
              </span>
            )}
            {level && (
              <span className="chip">
                {level.emoji} {t(level.label)}
              </span>
            )}
            {days !== null && (
              <span className="chip chip--hot">📅 {days === 0 ? t('Exam today — good luck!') : t('Exam in {n} days', { n: days })}</span>
            )}
          </div>
        )}
      </header>

      <section aria-labelledby="my-areas">
        <h2 id="my-areas">{t('My areas')}</h2>
        <div className="mylearn__grid">
          {mine.map((a) => (
            <Link key={a.id} to={areaPath(a.id)} className="mycard" style={areaStyle(a)}>
              <span className="mycard__emoji" aria-hidden="true">
                {a.emoji}
              </span>
              <span className="mycard__body">
                <strong>{t(a.name)}</strong>
                <small>
                  {a.ready
                    ? a.id === 'cefr' && stats.total > 0
                      ? t('{n} answers · 🔥 {d} days', { n: stats.total, d: stats.streak })
                      : t('Open now')
                    : t('Opening soon')}
                </small>
              </span>
              <span className="mycard__go" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="more-areas">
          <h2 id="more-areas">{t('Add another area')}</h2>
          <p className="muted">{t('Same account, no new registration — just tap Join.')}</p>
          {error && <p className="notice notice--warn">{error}</p>}
          <div className="mylearn__grid">
            {others.map((a) => (
              <div key={a.id} className="mycard mycard--add" style={areaStyle(a)}>
                <span className="mycard__emoji" aria-hidden="true">
                  {a.emoji}
                </span>
                <span className="mycard__body">
                  <strong>{t(a.name)}</strong>
                  <small>{a.ready ? t('Open now') : t('Opening soon')}</small>
                </span>
                <span className="mycard__actions">
                  <Link to={`/learn/${a.id}`} className="btn btn--ghost btn--small">
                    {t('Look')}
                  </Link>
                  <button type="button" className="btn btn--small" onClick={() => join(a.id)} disabled={!!busy}>
                    {busy === a.id ? t('Joining…') : t('Join')}
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasAbout && (
        <section className="card mylearn__about" aria-labelledby="about-title">
          <div>
            <h2 id="about-title">📝 {t('About you')}</h2>
            <p className="muted">
              {[goal && t(goal.label), level && t(level.label), age && t(age.label), profile?.phone].filter(Boolean).join(' · ') ||
                t('Tell us your goal and level so we can suggest the right practice.')}
            </p>
          </div>
          <Link to="/welcome?edit=1&next=%2Fmy" className="btn btn--ghost btn--small">
            {t('Edit')}
          </Link>
        </section>
      )}
    </div>
  );
}

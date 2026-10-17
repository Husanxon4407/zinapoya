import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state.jsx';
import { PARTS, PART_KEYS } from '../data/parts.js';
import { PART_TOTALS } from '../lib/steps.js';
import ProgressRing from '../components/ProgressRing.jsx';
import { useMistakes } from './Mistakes.jsx';
import { dailyDoneToday, dailyQuestion } from '../lib/daily.js';
import { TopThree, useLeaderboard } from '../components/Leaderboard.jsx';
import { InstallSteps } from '../components/AppSettings.jsx';
import { useInstall } from '../lib/pwa.js';
import { useT } from '../i18n/index.js';

const HIDE_INSTALL = 'su_hide_install';

function InstallBanner() {
  const { state, install } = useInstall();
  const t = useT();
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem(HIDE_INSTALL) === '1';
    } catch {
      return false;
    }
  });
  const [steps, setSteps] = useState(false);
  if (hidden || (state !== 'prompt' && state !== 'ios')) return null;
  const hide = () => {
    setHidden(true);
    try {
      localStorage.setItem(HIDE_INSTALL, '1');
    } catch {
      /* ignore */
    }
  };
  return (
    <section className="card side-card install-card">
      <button className="icon-btn install-card__hide" aria-label={t('Hide')} title={t('Hide')} onClick={hide}>
        ✕
      </button>
      <h3>📲 {t('Put SpeakUp on your home screen')}</h3>
      <p className="muted small">{t('Practise in one tap, like a real app.')}</p>
      {steps && <InstallSteps />}
      {state === 'prompt' ? (
        <button className="btn btn--small" onClick={install}>
          {t('Install')}
        </button>
      ) : (
        !steps && (
          <button className="btn btn--small" onClick={() => setSteps(true)}>
            {t('How?')}
          </button>
        )
      )}
    </section>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { user, profile, stats, attempts } = useApp();
  const weak = PARTS[stats.weakest];
  const mistakes = useMistakes();
  const daily = dailyQuestion();
  const dailyDone = dailyDoneToday(attempts);
  const dailyPart = PARTS[daily.part];
  const board = useLeaderboard();
  const { me } = board;
  const t = useT();

  return (
    <div className="home">
      <div className="home__main">
        <section className="welcome">
          <div>
            <h1>
              {t(greeting())}, {(profile?.name || user.name).split(' ')[0]}! 👋
            </h1>
            <p className="muted">
              {stats.todayCount === 0 ? t('Ready for today’s speaking practice?') : t('Answers today: {n}. Keep going!', { n: stats.todayCount })}
            </p>
          </div>
          <div className="welcome__stats">
            <div className="stat">
              <strong>🔥 {stats.streak}</strong>
              <small>{t('day streak')}</small>
            </div>
            <div className="stat">
              <strong>🎤 {stats.total}</strong>
              <small>{t('answers')}</small>
            </div>
            <div className="stat">
              <strong>⏱️ {stats.minutes}</strong>
              <small>{t('minutes')}</small>
            </div>
          </div>
        </section>

        <Link
          to={`/practice/${daily.part}/${daily.id}?daily=1`}
          className={`daily ${dailyDone ? 'daily--done' : ''}`}
          style={{ '--pc': dailyPart.color }}
        >
          <span className="daily__emoji">{dailyDone ? '✅' : '🌟'}</span>
          <div className="daily__body">
            <small>
              {t('Today’s challenge')} · {dailyPart.emoji} {t(dailyPart.name)} · {dailyDone ? t('done! Try it again any time') : t('+20 bonus points')}
            </small>
            <h3>{daily.text}</h3>
          </div>
          {me && me.points > 0 && (
            <span className="daily__rank" title={t('Your place on this week’s leaderboard')}>
              🏆 #{me.rank}
              <small>{t('{n} pts', { n: me.points })}</small>
            </span>
          )}
        </Link>

        <section className="quick">
          <Link to="/workout" className="quick__card quick__card--workout">
            <span className="quick__emoji">⚡</span>
            <div>
              <h3>{t('Daily 10-minute workout')}</h3>
              <p>{t('3 quick questions + one task from your weakest part.')}</p>
            </div>
          </Link>
          <Link to="/mock" className="quick__card quick__card--mock">
            <span className="quick__emoji">🎓</span>
            <div>
              <h3>{t('Full mock exam')}</h3>
              <p>{t('All four parts, real timing, about 15 minutes.')}</p>
            </div>
          </Link>
        </section>

        {stats.total > 0 && (
          <Link to={`/part/${weak.key}`} className="suggest" style={{ '--pc': weak.color, color: weak.ink }}>
            💡 {t('Suggestion: practise')} <strong>{t(weak.name)} — {t(weak.title)}</strong>. {t('It’s your weakest part right now.')} →
          </Link>
        )}

        <h2 className="section-title">{t('Exam map')}</h2>
        <section className="part-grid">
          {PART_KEYS.map((k) => {
            const p = PARTS[k];
            const s = stats.parts[k];
            return (
              <Link key={k} to={`/part/${k}`} className="part-card" style={{ '--pc': p.color, '--ps': p.soft }}>
                <div className="part-card__top">
                  <span className="part-card__emoji">{p.emoji}</span>
                  <ProgressRing value={s.unique} max={PART_TOTALS[k]} color={p.color} />
                </div>
                <h3 style={{ color: p.ink }}>
                  {t(p.name)} · {t(p.title)}
                </h3>
                <p>{t(p.what)}</p>
                <div className="part-card__meta">
                  <span>⏱️ {t(p.timing)}</span>
                  <span>
                    {t('{a}/{b} questions', { a: s.unique, b: PART_TOTALS[k] })}
                    {s.avg !== null && ` · ${t('avg {n}', { n: s.avg })}`}
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      </div>

      <aside className="home__side" aria-label={t('More')}>
        <TopThree board={board} />

        {mistakes.ready && mistakes.todo.length > 0 && (
          <Link to="/mistakes" className="card side-card mistakes-card">
            <h3>📒 {t('My mistakes')}</h3>
            <p>
              {t('Mistakes to review:')} <strong>{mistakes.todo.length}</strong>
            </p>
            <span className="side-card__link">{t('Fix them before the exam!')} →</span>
          </Link>
        )}

        <InstallBanner />
      </aside>
    </div>
  );
}

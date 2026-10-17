import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state.jsx';
import { PARTS, PART_KEYS } from '../data/parts.js';
import { PART_TOTALS } from '../lib/steps.js';
import ProgressRing from '../components/ProgressRing.jsx';
import { useMistakes } from './Mistakes.jsx';
import { dailyDoneToday, dailyQuestion } from '../lib/daily.js';
import { useLeaderboard } from '../components/Leaderboard.jsx';
import { InstallSteps } from '../components/AppSettings.jsx';
import { useInstall } from '../lib/pwa.js';

const HIDE_INSTALL = 'su_hide_install';

function InstallBanner() {
  const { state, install } = useInstall();
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
    <div className="install-banner">
      <span className="install-banner__icon">📲</span>
      <div>
        <strong>Put SpeakUp on your home screen</strong>
        <small>Practise in one tap, like a real app.</small>
        {steps && <InstallSteps />}
      </div>
      {state === 'prompt' ? (
        <button className="btn btn--small" onClick={install}>
          Install
        </button>
      ) : (
        !steps && (
          <button className="btn btn--small" onClick={() => setSteps(true)}>
            How?
          </button>
        )
      )}
      <button className="icon-btn" aria-label="Hide" title="Hide" onClick={hide}>
        ✕
      </button>
    </div>
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
  const { me } = useLeaderboard();

  return (
    <div className="home">
      <section className="welcome">
        <div>
          <h1>
            {greeting()}, {(profile?.name || user.name).split(' ')[0]}! 👋
          </h1>
          <p className="muted">
            {stats.todayCount === 0 ? 'Ready for today’s speaking practice?' : `You’ve answered ${stats.todayCount} question${stats.todayCount > 1 ? 's' : ''} today. Keep going!`}
          </p>
        </div>
        <div className="welcome__stats">
          <div className="stat">
            <strong>🔥 {stats.streak}</strong>
            <small>day streak</small>
          </div>
          <div className="stat">
            <strong>🎤 {stats.total}</strong>
            <small>answers</small>
          </div>
          <div className="stat">
            <strong>⏱️ {stats.minutes}</strong>
            <small>minutes</small>
          </div>
        </div>
      </section>

      <InstallBanner />

      <Link
        to={`/practice/${daily.part}/${daily.id}?daily=1`}
        className={`daily ${dailyDone ? 'daily--done' : ''}`}
        style={{ '--pc': dailyPart.color }}
      >
        <span className="daily__emoji">{dailyDone ? '✅' : '🌟'}</span>
        <div className="daily__body">
          <small>
            Today’s challenge · {dailyPart.emoji} {dailyPart.name} · {dailyDone ? 'done! Try it again any time' : '+20 bonus points'}
          </small>
          <h3>{daily.text}</h3>
        </div>
        {me && me.points > 0 && (
          <span className="daily__rank" title="Your place on this week’s leaderboard">
            🏆 #{me.rank}
            <small>{me.points} pts</small>
          </span>
        )}
      </Link>

      <section className="quick">
        <Link to="/workout" className="quick__card quick__card--workout">
          <span className="quick__emoji">⚡</span>
          <div>
            <h3>Daily 10-minute workout</h3>
            <p>3 quick questions + one task from your weakest part.</p>
          </div>
        </Link>
        <Link to="/mock" className="quick__card quick__card--mock">
          <span className="quick__emoji">🎓</span>
          <div>
            <h3>Full mock exam</h3>
            <p>All four parts, real timing, about 15 minutes.</p>
          </div>
        </Link>
      </section>

      {stats.total > 0 && (
        <Link to={`/part/${weak.key}`} className="suggest" style={{ '--pc': weak.color, color: weak.ink }}>
          💡 Suggestion: practise <strong>{weak.name} — {weak.title}</strong>. It’s your weakest part right now. →
        </Link>
      )}

      {mistakes.ready && mistakes.todo.length > 0 && (
        <Link to="/mistakes" className="suggest suggest--mistakes">
          📒 You have <strong>{mistakes.todo.length} mistake{mistakes.todo.length > 1 ? 's' : ''}</strong> to review. Fix them before the exam! →
        </Link>
      )}

      <h2 className="section-title">Exam map</h2>
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
                {p.name} · {p.title}
              </h3>
              <p>{p.what}</p>
              <div className="part-card__meta">
                <span>⏱️ {p.timing}</span>
                <span>
                  {s.unique}/{PART_TOTALS[k]} questions
                  {s.avg !== null && ` · avg ${s.avg}`}
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

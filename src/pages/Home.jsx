import { Link } from 'react-router-dom';
import { useApp } from '../state.jsx';
import { PARTS, PART_KEYS } from '../data/parts.js';
import { PART_TOTALS } from '../lib/steps.js';
import ProgressRing from '../components/ProgressRing.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { user, stats } = useApp();
  const weak = PARTS[stats.weakest];

  return (
    <div className="home">
      <section className="welcome">
        <div>
          <h1>
            {greeting()}, {user.name.split(' ')[0]}! 👋
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
        <Link to={`/part/${weak.key}`} className="suggest" style={{ background: weak.soft, color: weak.color }}>
          💡 Suggestion: practise <strong>{weak.name} — {weak.title}</strong>. It’s your weakest part right now. →
        </Link>
      )}

      <h2 className="section-title">Exam map</h2>
      <section className="part-grid">
        {PART_KEYS.map((k) => {
          const p = PARTS[k];
          const s = stats.parts[k];
          return (
            <Link key={k} to={`/part/${k}`} className="part-card" style={{ background: p.soft }}>
              <div className="part-card__top">
                <span className="part-card__emoji">{p.emoji}</span>
                <ProgressRing value={s.unique} max={PART_TOTALS[k]} color={p.color} />
              </div>
              <h3 style={{ color: p.color }}>
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

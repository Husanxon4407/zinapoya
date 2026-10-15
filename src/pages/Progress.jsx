import { Link } from 'react-router-dom';
import { useApp } from '../state.jsx';
import { PARTS, PART_KEYS } from '../data/parts.js';
import { BADGES, levelFromScore } from '../lib/progress.js';

function ScoreChart({ points }) {
  if (points.length < 2) {
    return <p className="muted">Get AI feedback on at least two answers to see your score line here.</p>;
  }
  const W = 600;
  const H = 200;
  const pad = 28;
  const x = (i) => pad + (i * (W - pad * 2)) / (points.length - 1);
  const y = (v) => H - pad - (v / 100) * (H - pad * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Score over time">
      {[45, 65, 85].map((v) => (
        <g key={v}>
          <line x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} className="chart__grid" />
          <text x={W - pad + 4} y={y(v) + 4} className="chart__label">
            {levelFromScore(v)}
          </text>
        </g>
      ))}
      <path d={`${path} L${x(points.length - 1)},${H - pad} L${x(0)},${H - pad} Z`} className="chart__area" />
      <path d={path} className="chart__line" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r="5" fill={PARTS[p.part].color} stroke="#fff" strokeWidth="2">
          <title>
            {PARTS[p.part].name}: {p.value} ({new Date(p.date).toLocaleDateString()})
          </title>
        </circle>
      ))}
    </svg>
  );
}

function Calendar({ attempts }) {
  const days = [];
  const counts = {};
  for (const a of attempts) {
    const k = new Date(a.created_at).toDateString();
    counts[k] = (counts[k] || 0) + 1;
  }
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ d, n: counts[d.toDateString()] || 0 });
  }
  return (
    <div className="calendar">
      {days.map(({ d, n }) => (
        <span key={d.toDateString()} className={`calendar__day lvl-${Math.min(3, Math.ceil(n / 3))}`} title={`${d.toLocaleDateString()}: ${n} answers`}>
          {d.getDate()}
        </span>
      ))}
    </div>
  );
}

export default function Progress() {
  const { stats, attempts } = useApp();
  const weak = PARTS[stats.weakest];
  const avgAll = stats.scoreTrend.length ? Math.round(stats.scoreTrend.reduce((s, p) => s + p.value, 0) / stats.scoreTrend.length) : null;

  return (
    <div className="progress-page">
      <h1>📈 My progress</h1>

      <div className="stat-row">
        <div className="card big-stat">
          <span>🔥</span>
          <strong>{stats.streak}</strong>
          <small>day streak</small>
        </div>
        <div className="card big-stat">
          <span>🎤</span>
          <strong>{stats.total}</strong>
          <small>answers</small>
        </div>
        <div className="card big-stat">
          <span>⏱️</span>
          <strong>{stats.minutes}</strong>
          <small>minutes speaking</small>
        </div>
        <div className="card big-stat">
          <span>⭐</span>
          <strong>{levelFromScore(avgAll)}</strong>
          <small>{avgAll === null ? 'no AI scores yet' : `average ${avgAll}/100`}</small>
        </div>
      </div>

      <div className="card">
        <h3>Score over time</h3>
        <ScoreChart points={stats.scoreTrend} />
      </div>

      <div className="two-col">
        <div className="card">
          <h3>By exam part</h3>
          {PART_KEYS.map((k) => {
            const p = PARTS[k];
            const s = stats.parts[k];
            return (
              <div key={k} className="part-row">
                <span className="part-row__name" style={{ color: p.color }}>
                  {p.emoji} {p.name}
                </span>
                <span className="bar__track">
                  <span className="bar__fill" style={{ width: `${s.avg ?? 0}%`, background: p.color }} />
                </span>
                <span className="part-row__nums">
                  {s.count} answers · {s.avg === null ? '—' : `${levelFromScore(s.avg)} ${s.avg}`}
                </span>
              </div>
            );
          })}
          {stats.total > 0 && (
            <Link to={`/part/${weak.key}`} className="btn" style={{ background: weak.color, marginTop: 12 }}>
              Practise my weakest part: {weak.name} →
            </Link>
          )}
        </div>
        <div className="card">
          <h3>Last 4 weeks</h3>
          <Calendar attempts={attempts} />
          <p className="muted small">Darker = more answers that day. Practise a little every day to keep your streak!</p>
        </div>
      </div>

      <div className="card">
        <h3>🏅 Badges</h3>
        <div className="badges">
          {BADGES.map((b) => {
            const got = b.test(stats);
            return (
              <div key={b.id} className={`badge ${got ? 'badge--got' : ''}`}>
                <span>{got ? b.emoji : '🔒'}</span>
                <strong>{b.name}</strong>
                <small>{b.desc}</small>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

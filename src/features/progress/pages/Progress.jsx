import { Link } from 'react-router-dom';
import { useApp } from '../../../app/state.jsx';
import { PARTS, PART_KEYS } from '../../speaking/data/parts.js';
import { BADGES, levelFromScore } from '../../../shared/lib/progress.js';
import Leaderboard from '../components/Leaderboard.jsx';
import { dateLocale, useT } from '../../../i18n/index.js';

export function ScoreChart({ points, emptyText = 'Get AI feedback on at least two answers to see your score line here.' }) {
  const t = useT();
  if (points.length < 2) {
    return <p className="muted">{t(emptyText)}</p>;
  }
  const W = 600;
  const H = 200;
  const pad = 28;
  const x = (i) => pad + (i * (W - pad * 2)) / (points.length - 1);
  const y = (v) => H - pad - (v / 100) * (H - pad * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={t('Score over time')}>
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
            {t(PARTS[p.part].name)}: {p.value} ({new Date(p.date).toLocaleDateString(dateLocale())})
          </title>
        </circle>
      ))}
    </svg>
  );
}

export function Calendar({ attempts }) {
  const t = useT();
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
        <span key={d.toDateString()} className={`calendar__day lvl-${Math.min(3, Math.ceil(n / 3))}`} title={`${d.toLocaleDateString(dateLocale())}: ${t('{n} answers', { n })}`}>
          {d.getDate()}
        </span>
      ))}
    </div>
  );
}

export function PartBars({ stats }) {
  const t = useT();
  return (
    <>
      {PART_KEYS.map((k) => {
        const p = PARTS[k];
        const s = stats.parts[k];
        return (
          <div key={k} className="part-row">
            <span className="part-row__name" style={{ color: p.ink }}>
              {p.emoji} {t(p.name)}
            </span>
            <span className="bar__track">
              <span className="bar__fill" style={{ width: `${s.avg ?? 0}%`, background: p.color }} />
            </span>
            <span className="part-row__nums">
              {t('{n} answers', { n: s.count })} · {s.avg === null ? '—' : `${levelFromScore(s.avg)} ${s.avg}`}
            </span>
          </div>
        );
      })}
    </>
  );
}

export default function Progress() {
  const { stats, attempts } = useApp();
  const weak = PARTS[stats.weakest];
  const t = useT();
  const avgAll = stats.scoreTrend.length ? Math.round(stats.scoreTrend.reduce((s, p) => s + p.value, 0) / stats.scoreTrend.length) : null;

  return (
    <div className="progress-page">
      <h1>📈 {t('My progress')}</h1>

      <div className="stat-row">
        <div className="card big-stat">
          <span>🔥</span>
          <strong>{stats.streak}</strong>
          <small>{t('day streak')}</small>
        </div>
        <div className="card big-stat">
          <span>🎤</span>
          <strong>{stats.total}</strong>
          <small>{t('answers')}</small>
        </div>
        <div className="card big-stat">
          <span>⏱️</span>
          <strong>{stats.minutes}</strong>
          <small>{t('minutes speaking')}</small>
        </div>
        <div className="card big-stat">
          <span>⭐</span>
          <strong>{levelFromScore(avgAll)}</strong>
          <small>{avgAll === null ? t('no AI scores yet') : t('average {n}/100', { n: avgAll })}</small>
        </div>
      </div>

      <div className="card">
        <h3>{t('Score over time')}</h3>
        <ScoreChart points={stats.scoreTrend} />
      </div>

      <div className="two-col">
        <div className="card">
          <h3>{t('By exam part')}</h3>
          <PartBars stats={stats} />
          {stats.total > 0 && (
            <Link to={`/part/${weak.key}`} className="btn" style={{ background: weak.color, marginTop: 12 }}>
              {t('Practise my weakest part:')} {t(weak.name)} →
            </Link>
          )}
        </div>
        <div className="card">
          <h3>{t('Last 4 weeks')}</h3>
          <Calendar attempts={attempts} />
          <p className="muted small">{t('Darker = more answers that day. Practise a little every day to keep your streak!')}</p>
        </div>
      </div>

      <Leaderboard />

      <Link to="/mistakes" className="card mistakes-link">
        <span>📒</span>
        <div>
          <h3>{t('My mistakes notebook')}</h3>
          <p className="muted">{t('All your AI corrections in one place, with a quick review game.')}</p>
        </div>
        <strong>→</strong>
      </Link>

      <div className="card">
        <h3>🏅 {t('Badges')}</h3>
        <div className="badges">
          {BADGES.map((b) => {
            const got = b.test(stats);
            return (
              <div key={b.id} className={`badge ${got ? 'badge--got' : ''}`}>
                <span>{got ? b.emoji : '🔒'}</span>
                <strong>{t(b.name)}</strong>
                <small>{t(b.desc)}</small>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

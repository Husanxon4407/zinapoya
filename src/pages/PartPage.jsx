import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PARTS } from '../data/parts.js';
import { PART1_1, TOPICS } from '../data/part1_1.js';
import { PART1_2 } from '../data/part1_2.js';
import { PART2 } from '../data/part2.js';
import { PART3 } from '../data/part3.js';
import { useApp } from '../state.jsx';
import { levelFromScore } from '../lib/progress.js';

function itemsFor(key) {
  if (key === '1.1') return PART1_1.map((q) => ({ id: q.id, title: q.text, group: q.topic, match: [q.id] }));
  if (key === '1.2') return PART1_2.map((s) => ({ id: s.id, title: s.title, sub: `${s.q5} · ${s.q6}`, image: s.image, match: ['q4', 'q5', 'q6'].map((q) => `${s.id}-${q}`) }));
  if (key === '2') return PART2.map((c) => ({ id: c.id, title: c.title, sub: c.questions[0], image: c.image, emoji: c.emoji, match: [c.id] }));
  return PART3.map((t) => ({ id: t.id, title: t.statement, sub: `${t.for.length} for · ${t.against.length} against`, match: [t.id] }));
}

export default function PartPage() {
  const { key } = useParams();
  const { attempts } = useApp();
  const [filter, setFilter] = useState('all');
  const part = PARTS[key];

  const best = useMemo(() => {
    const m = {};
    for (const a of attempts) {
      if (a.part !== key) continue;
      const cur = m[a.question_id] || { count: 0, best: null };
      cur.count++;
      if (typeof a.scores?.overall === 'number') cur.best = Math.max(cur.best ?? 0, a.scores.overall);
      m[a.question_id] = cur;
    }
    return m;
  }, [attempts, key]);

  if (!part) return <Navigate to="/" replace />;

  const items = itemsFor(key).map((it) => {
    const hits = it.match.map((id) => best[id]).filter(Boolean);
    const bestScore = hits.reduce((mx, h) => (h.best !== null && h.best > (mx ?? -1) ? h.best : mx), null);
    return { ...it, done: hits.length > 0, count: hits.reduce((s, h) => s + h.count, 0), best: bestScore };
  });
  const shown = items.filter((it) => filter === 'all' || (filter === 'new' ? !it.done : filter === 'done' ? it.done : it.group === filter));

  return (
    <div className="part-page">
      <section className="part-hero" style={{ backgroundImage: `linear-gradient(${part.soft}, ${part.soft})` }}>
        <div>
          <span className="part-hero__emoji">{part.emoji}</span>
          <h1 style={{ color: part.ink }}>
            {part.name}: {part.title}
          </h1>
          <p>{part.what}</p>
          <p className="muted">⏱️ {part.timing}</p>
        </div>
        <div className="part-hero__tips">
          <h4>What the examiner wants</h4>
          <ol>
            {part.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <Link to={`/practice/${key}/random`} className="btn btn--big" style={{ background: part.color }}>
            🎲 Random {key === '1.1' ? '3 questions' : 'task'}
          </Link>
        </div>
      </section>

      <div className="filters">
        {[['all', 'All'], ['new', 'Not tried yet'], ['done', 'Practised']].map(([v, l]) => (
          <button key={v} className={`filter ${filter === v ? 'filter--on' : ''}`} onClick={() => setFilter(v)}>
            {l}
          </button>
        ))}
        {key === '1.1' &&
          Object.entries(TOPICS).map(([k, t]) => (
            <button key={k} className={`filter ${filter === k ? 'filter--on' : ''}`} onClick={() => setFilter(k)}>
              {t.emoji} {t.label}
            </button>
          ))}
      </div>

      <div className={`q-list ${key === '1.2' || key === '2' ? 'q-list--cards' : ''}`}>
        {shown.map((it) => (
          <Link key={it.id} to={`/practice/${key}/${it.id}`} className={`q-item ${it.done ? 'q-item--done' : ''}`}>
            {it.image && <img src={it.image} alt="" loading="lazy" />}
            {!it.image && it.emoji && <span className="q-item__emoji" style={{ background: part.soft }}>{it.emoji}</span>}
            <div className="q-item__text">
              <strong>{it.title}</strong>
              {it.sub && <small>{it.sub}</small>}
            </div>
            <div className="q-item__status">
              {it.done ? (
                <>
                  <span className="check" style={{ background: part.color }}>✓</span>
                  <small>
                    {it.count}× {it.best !== null && `· ${levelFromScore(it.best)}`}
                  </small>
                </>
              ) : (
                <span className="arrow">→</span>
              )}
            </div>
          </Link>
        ))}
        {shown.length === 0 && <p className="muted">Nothing here yet.</p>}
      </div>
    </div>
  );
}

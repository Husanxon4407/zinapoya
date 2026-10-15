import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state.jsx';
import { PARTS, PART_KEYS } from '../data/parts.js';
import AnswerReview, { MetricChips, useRecordingUrl } from '../components/AnswerReview.jsx';

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

function ThenNowSide({ title, attempt }) {
  const url = useRecordingUrl(attempt);
  return (
    <div className="thennow__side">
      <h4>
        {title} <small>{new Date(attempt.created_at).toLocaleDateString()}</small>
      </h4>
      {typeof attempt.scores?.overall === 'number' && (
        <p className="score-pill">
          {attempt.scores.level} · {attempt.scores.overall}
        </p>
      )}
      {url && <audio controls src={url} className="audio" />}
      <MetricChips attempt={attempt} />
      <p className="thennow__text">{attempt.transcript || <i className="muted">No transcript</i>}</p>
    </div>
  );
}

function ThenVsNow({ attempts }) {
  const pairs = useMemo(() => {
    const by = {};
    for (const a of attempts) (by[a.question_id] ||= []).push(a);
    return Object.values(by)
      .filter((list) => list.length >= 2)
      .map((list) => ({ first: list[list.length - 1], latest: list[0], count: list.length }));
  }, [attempts]);

  if (!pairs.length) {
    return (
      <div className="card empty">
        <p>🔁 Answer the same question twice to see how much you improved.</p>
        <p className="muted">Tip: open any question you already practised and try it again.</p>
      </div>
    );
  }
  return pairs.map(({ first, latest, count }) => (
    <div key={latest.id} className="card thennow">
      <p className="thennow__q">
        <span style={{ color: PARTS[latest.part].ink }}>{PARTS[latest.part].emoji} {PARTS[latest.part].name}</span> · {latest.question_text}{' '}
        <small className="muted">({count} tries)</small>
      </p>
      <div className="thennow__grid">
        <ThenNowSide title="🌱 First try" attempt={first} />
        <ThenNowSide title="🌳 Latest" attempt={latest} />
      </div>
    </div>
  ));
}

export default function History() {
  const { attempts, attemptsReady } = useApp();
  const [view, setView] = useState('all');
  const [part, setPart] = useState('all');
  const [limit, setLimit] = useState(30);

  const list = attempts.filter((a) => part === 'all' || a.part === part);
  const groups = [];
  for (const a of list.slice(0, limit)) {
    const label = dayLabel(a.created_at);
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(a);
    else groups.push({ label, items: [a] });
  }

  return (
    <div>
      <h1>🗂️ My history</h1>
      <div className="tabs">
        <button className={`tab ${view === 'all' ? 'tab--on' : ''}`} onClick={() => setView('all')}>
          All answers
        </button>
        <button className={`tab ${view === 'thennow' ? 'tab--on' : ''}`} onClick={() => setView('thennow')}>
          🔁 Then vs Now
        </button>
      </div>

      <div className="filters">
        <button className={`filter ${part === 'all' ? 'filter--on' : ''}`} onClick={() => setPart('all')}>
          All parts
        </button>
        {PART_KEYS.map((k) => (
          <button key={k} className={`filter ${part === k ? 'filter--on' : ''}`} onClick={() => setPart(k)}>
            {PARTS[k].emoji} {PARTS[k].name}
          </button>
        ))}
      </div>

      {!attemptsReady ? (
        <div className="spinner" />
      ) : view === 'thennow' ? (
        <ThenVsNow attempts={list} />
      ) : list.length === 0 ? (
        <div className="card empty">
          <p>No answers yet. Your recordings, transcripts and feedback will appear here.</p>
          <Link to="/" className="btn">
            Start practising
          </Link>
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <section key={g.label}>
              <h3 className="day-label">{g.label}</h3>
              {g.items.map((a) => (
                <AnswerReview key={a.id} attempt={a} defaultOpen={false} />
              ))}
            </section>
          ))}
          {list.length > limit && (
            <button className="btn btn--ghost btn--block" onClick={() => setLimit(limit + 30)}>
              Show older answers
            </button>
          )}
        </>
      )}
    </div>
  );
}

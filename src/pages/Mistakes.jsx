import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state.jsx';
import { api } from '../lib/api.js';
import { PARTS } from '../data/parts.js';
import { speak } from '../lib/speech.js';
import { shuffle } from '../lib/steps.js';
import { collectMistakes } from '../lib/mistakes.js';
import { useT } from '../i18n/index.js';

const REVIEW_SIZE = 5;
const KNEW_TO_MASTER = 2;

// "Mastered" marks are saved bookmarks (kind 'mistake'), so they follow the student to any device.
export function useMistakes() {
  const { attempts } = useApp();
  const [marks, setMarks] = useState(null);
  const all = useMemo(() => collectMistakes(attempts), [attempts]);

  useEffect(() => {
    api
      .listBookmarks()
      .then((b) => setMarks(b.filter((x) => x.kind === 'mistake')))
      .catch(() => setMarks([]));
  }, []);

  const markOf = (key) => marks?.find((m) => m.text === key);

  async function setMastered(key, on) {
    const existing = markOf(key);
    if (on && !existing) {
      const row = await api.addBookmark({ kind: 'mistake', text: key }).catch(() => null);
      if (row) setMarks((m) => [row, ...m]);
    } else if (!on && existing) {
      setMarks((m) => m.filter((x) => x.id !== existing.id));
      await api.removeBookmark(existing.id).catch(() => {});
    }
  }

  const todo = all.filter((m) => !markOf(m.key));
  const done = all.filter((m) => markOf(m.key));
  return { ready: marks !== null, all, todo, done, setMastered };
}

// Small per-browser counter: a mistake is mastered after "I knew it" twice in review.
const knewKey = 'su_mistake_knew';
function bumpKnew(key) {
  let map = {};
  try {
    map = JSON.parse(localStorage.getItem(knewKey)) || {};
  } catch {
    /* ignore */
  }
  map[key] = (map[key] || 0) + 1;
  try {
    localStorage.setItem(knewKey, JSON.stringify(map));
  } catch {
    /* ignore */
  }
  return map[key];
}

function MistakeCard({ m, mastered, onToggle }) {
  const t = useT();
  return (
    <div className="mistake">
      <div className="mistake__meta">
        <span className="mistake__tag" style={{ background: PARTS[m.part]?.soft, color: PARTS[m.part]?.ink }}>
          {PARTS[m.part]?.emoji} {t(PARTS[m.part]?.name || '')}
        </span>
        <span>
          {m.category.emoji} {t(m.category.name)}
        </span>
        {m.times > 1 && <span className="mistake__times">×{m.times}</span>}
      </div>
      <p className="correction__bad">✗ {m.original}</p>
      <p className="correction__good">
        ✓ {m.better}{' '}
        <button className="icon-btn" title={t('Listen')} onClick={() => speak(m.better)}>
          🔊
        </button>
      </p>
      {m.why && <p className="correction__why">{m.why}</p>}
      <button className={`btn btn--small ${mastered ? 'btn--ghost' : ''}`} onClick={onToggle}>
        {mastered ? `↩ ${t('Review again')}` : `${t('Got it')} ✓`}
      </button>
    </div>
  );
}

function Review({ items, onDone, onKnew }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [score, setScore] = useState(0);
  const m = items[i];
  const t = useT();

  if (!m) {
    return (
      <div className="card review-box">
        <h2>🎉 {t('Review finished!')}</h2>
        <p>{t('You knew {a} of {b}. Mistakes you know twice move to “Mastered”.', { a: score, b: items.length })}</p>
        <button className="btn" onClick={onDone}>
          {t('Back to my mistakes')}
        </button>
      </div>
    );
  }

  function next(knew) {
    if (knew) {
      setScore((s) => s + 1);
      onKnew(m);
    }
    setShown(false);
    setI(i + 1);
  }

  return (
    <div className="card review-box">
      <p className="muted">
        {i + 1} / {items.length} · {t('Say this sentence correctly, out loud. Then check.')}
      </p>
      <p className="review-box__bad">✗ {m.original}</p>
      {shown ? (
        <>
          <p className="correction__good review-box__good">
            ✓ {m.better}{' '}
            <button className="icon-btn" title={t('Listen')} onClick={() => speak(m.better)}>
              🔊
            </button>
          </p>
          {m.why && <p className="correction__why">{m.why}</p>}
          <div className="again">
            <button className="btn" onClick={() => next(true)}>
              😎 {t('I knew it')}
            </button>
            <button className="btn btn--ghost" onClick={() => next(false)}>
              🤔 {t('Not yet')}
            </button>
          </div>
        </>
      ) : (
        <button className="btn" onClick={() => setShown(true)}>
          👀 {t('Show the right sentence')}
        </button>
      )}
    </div>
  );
}

export default function Mistakes() {
  const { ready, all, todo, done, setMastered } = useMistakes();
  const [tab, setTab] = useState('todo');
  const [cat, setCat] = useState('all');
  const [review, setReview] = useState(null);
  const t = useT();

  if (review) {
    return (
      <div className="mistakes">
        <h1>🔁 {t('Quick review')}</h1>
        <Review
          items={review}
          onDone={() => setReview(null)}
          onKnew={(m) => {
            if (bumpKnew(m.key) >= KNEW_TO_MASTER) setMastered(m.key, true);
          }}
        />
      </div>
    );
  }

  const list = (tab === 'todo' ? todo : done).filter((m) => cat === 'all' || m.category.id === cat);
  const cats = [...new Map(all.map((m) => [m.category.id, m.category])).values()];
  const countIn = (id) => (tab === 'todo' ? todo : done).filter((m) => m.category.id === id).length;

  return (
    <div className="mistakes">
      <h1>📒 {t('My mistakes')}</h1>
      <p className="muted">{t('Every sentence the AI coach corrected for you, in one place. Learn them and stop making them in the exam!')}</p>

      {!ready && <div className="spinner" />}

      {ready && all.length === 0 && (
        <div className="card">
          <p>{t('No mistakes collected yet. Record an answer and press “✨ Get AI feedback”. Your corrections will appear here.')}</p>
          <Link className="btn" to="/">
            {t('Start practising')}
          </Link>
        </div>
      )}

      {ready && all.length > 0 && (
        <>
          {todo.length > 0 && (
            <button className="btn btn--ai review-start" onClick={() => setReview(shuffle(todo).slice(0, REVIEW_SIZE))}>
              🔁 {t('Quick review')} ({Math.min(REVIEW_SIZE, todo.length)})
            </button>
          )}

          <div className="tabs">
            <button className={`tab ${tab === 'todo' ? 'tab--on' : ''}`} onClick={() => setTab('todo')}>
              {t('To review')} ({todo.length})
            </button>
            <button className={`tab ${tab === 'done' ? 'tab--on' : ''}`} onClick={() => setTab('done')}>
              {t('Mastered')} ({done.length})
            </button>
          </div>

          <div className="filters">
            <button className={`filter ${cat === 'all' ? 'filter--on' : ''}`} onClick={() => setCat('all')}>
              {t('All')}
            </button>
            {cats.map((c) => (
              <button key={c.id} className={`filter ${cat === c.id ? 'filter--on' : ''}`} onClick={() => setCat(c.id)}>
                {c.emoji} {t(c.name)} ({countIn(c.id)})
              </button>
            ))}
          </div>

          {list.length === 0 && <p className="muted">{tab === 'todo' ? `🎉 ${t('Nothing left to review here!')}` : t('Nothing mastered here yet.')}</p>}
          <div className="mistake-list">
            {list.map((m) => (
              <MistakeCard key={m.key} m={m} mastered={tab === 'done'} onToggle={() => setMastered(m.key, tab === 'todo')} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

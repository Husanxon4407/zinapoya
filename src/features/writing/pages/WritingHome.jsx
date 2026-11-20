import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../lib/api.js';
import { useApp } from '../../../state.jsx';
import { useT } from '../../../i18n/index.js';
import { GENRES, part1Sets, part2Prompts } from '../data/index.js';
import { PARTS, PART_KEYS, bandLabel } from '../rules.js';
import { PART_COLORS } from '../components/TaskCard.jsx';
import { typeName } from '../components/MarkedText.jsx';
import { saveDoneFrom } from '../lib/done.js';
import '../writing.css';

const FILTERS = [
  ['all', 'All'],
  ['new', 'Not done yet'],
  ['zinapoya', 'Zinapoya tasks'],
  ['book', 'Exam-book tests'],
];

export default function WritingHome() {
  const t = useT();
  const { user } = useApp();
  const [tab, setTab] = useState('1');
  const [filter, setFilter] = useState('all');
  const [attempts, setAttempts] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.writing
      .list()
      .then((rows) => {
        setAttempts(rows);
        saveDoneFrom(rows);
      })
      .catch((e) => setLoadError(e.message));
    api.writing
      .mistakes()
      .then(setMistakes)
      .catch(() => {});
  }, [user]);

  // Best band per part + task, to mark cards.
  const best = useMemo(() => {
    const m = {};
    for (const a of attempts) {
      const k = `${a.part}|${a.task_id}`;
      if (m[k] === undefined || Number(a.band) > m[k]) m[k] = Number(a.band);
    }
    return m;
  }, [attempts]);

  const topMistakes = useMemo(() => {
    const byType = {};
    for (const m of mistakes) if (!m.mastered) byType[m.type] = (byType[m.type] || 0) + 1;
    return Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [mistakes]);

  const keep = (x, parts) =>
    filter === 'all' || (filter === 'new' ? parts.every((p) => best[`${p}|${x.id}`] === undefined) : x.source === filter);
  const sets = part1Sets().filter((s) => keep(s, ['1.1', '1.2']));
  const prompts = part2Prompts().filter((p) => keep(p, ['2']));
  const hasBook = part1Sets().some((s) => s.source === 'book');

  return (
    <div className="w-page w-home">
      <section className="card w-hero">
        <div>
          <small className="w-hero__kicker">CEFR Multilevel · {t('new format (2025)')}</small>
          <h1>✍️ {t('Writing')}</h1>
          <p>{t('Three tasks in 60 minutes, scored like the real exam: Task 1.1 and 1.2 out of 5, Part 2 out of 6 — together a score out of 75.')}</p>
          <p className="muted small">{t('Tip: about 25 minutes for both emails, 35 minutes for Part 2.')}</p>
        </div>
        <div className="w-hero__parts">
          {PART_KEYS.map((k) => {
            const p = PARTS[k];
            const n = attempts.filter((a) => a.part === k).length;
            return (
              <Link key={k} to={`/writing/${k}/random`} className="w-partcard" style={{ '--wc': PART_COLORS[k] }}>
                <strong>{t(p.name)}</strong>
                <span>{t(p.kind)}</span>
                <small className="muted">
                  {k === '1.1' ? t('about 50 words') : t('{a}–{b} words', { a: p.min, b: p.max })} · {p.level} · 0–{p.maxBand}
                </small>
                {user && n > 0 && <small>{t('Done: {n}', { n })}</small>}
                <span className="w-partcard__go">🎲 {t('Random task')} →</span>
              </Link>
            );
          })}
        </div>
      </section>

      {loadError && <p className="w-error">{loadError}</p>}

      {user && (attempts.length > 0 || topMistakes.length > 0) && (
        <div className="w-home__row">
          {attempts.length > 0 && (
            <section className="card w-recent">
              <h2 className="w-section-title">🗂️ {t('Your recent answers')}</h2>
              <ul>
                {attempts.slice(0, 6).map((a) => (
                  <li key={a.id}>
                    <Link to={`/writing/result/${a.id}`}>
                      <span className="w-recent__band" style={{ '--wc': PART_COLORS[a.part] }}>
                        {Number(a.band)}/{PARTS[a.part].maxBand}
                      </span>
                      <span className="w-recent__title">
                        {t(PARTS[a.part].name)} · {a.task_title || a.task_id}
                        <small className="muted">
                          {t(bandLabel(a.part, Number(a.band)))} · {new Date(a.created_at).toLocaleDateString()}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {topMistakes.length > 0 && (
            <section className="card w-topmistakes">
              <h2 className="w-section-title">📒 {t('Your top mistakes')}</h2>
              <ul>
                {topMistakes.map(([type, n]) => (
                  <li key={type}>
                    <strong>{t(typeName(type))}</strong> <span className="muted">· {t('{n} times', { n })}</span>
                  </li>
                ))}
              </ul>
              <p className="muted small">{t('Every mistake is saved. Games built from your own mistakes are coming next.')}</p>
            </section>
          )}
        </div>
      )}

      <section className="w-library">
        <div className="w-library__head">
          <h2 className="section-title">{t('All tasks')}</h2>
          <div className="w-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === '1'} className={tab === '1' ? 'is-on' : ''} onClick={() => setTab('1')}>
              ✉️ {t('Part 1 · Emails')} <small>({part1Sets().length})</small>
            </button>
            <button type="button" role="tab" aria-selected={tab === '2'} className={tab === '2' ? 'is-on' : ''} onClick={() => setTab('2')}>
              📝 {t('Part 2 · Posts')} <small>({part2Prompts().length})</small>
            </button>
          </div>
          <div className="w-filters">
            {FILTERS.filter(([id]) => (id === 'new' ? !!user : id !== 'book' && id !== 'zinapoya' ? true : hasBook)).map(([id, label]) => (
              <button key={id} type="button" className={`chip ${filter === id ? 'is-on' : ''}`} onClick={() => setFilter(id)}>
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        {tab === '1' ? (
          <div className="w-grid">
            {sets.map((s) => (
              <article key={s.id} className="card w-item">
                <div className="w-item__top">
                  <span className="w-item__emoji" aria-hidden="true">
                    {s.emoji}
                  </span>
                  {s.source === 'book' && <span className="w-chip w-chip--muted" title={s.ref}>📘 {t('Test')}</span>}
                </div>
                <h3>{t(s.title)}</h3>
                <p className="muted small">{t(s.topic)}</p>
                <div className="w-item__actions">
                  {['1.1', '1.2'].map((k) => {
                    const b = best[`${k}|${s.id}`];
                    return (
                      <Link key={k} to={`/writing/${k}/${s.id}`} className="w-item__btn" style={{ '--wc': PART_COLORS[k] }}>
                        {k === '1.1' ? `1.1 · ${t('Friend')}` : `1.2 · ${t('Formal')}`}
                        {b !== undefined && <span className="w-item__best">✓ {b}/5</span>}
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
            {!sets.length && <p className="muted">{t('Nothing here — try another filter.')}</p>}
          </div>
        ) : (
          <div className="w-grid">
            {prompts.map((p) => {
              const b = best[`2|${p.id}`];
              return (
                <Link key={p.id} to={`/writing/2/${p.id}`} className="card w-item w-item--link">
                  <div className="w-item__top">
                    <span className="w-item__emoji" aria-hidden="true">
                      {p.emoji}
                    </span>
                    <span className="w-chip">
                      {GENRES[p.genre].emoji} {t(GENRES[p.genre].name)}
                    </span>
                    {p.source === 'book' && <span className="w-chip w-chip--muted" title={p.ref}>📘 {t('Test')}</span>}
                  </div>
                  <h3>{t(p.title)}</h3>
                  <p className="muted small">{t(p.topic)}</p>
                  {b !== undefined && <span className="w-item__best">✓ {b}/6</span>}
                </Link>
              );
            })}
            {!prompts.length && <p className="muted">{t('Nothing here — try another filter.')}</p>}
          </div>
        )}
      </section>

      <p className="muted small w-home__note">🤖 {t('Scores are AI estimates using the official UzBMB criteria, not official results.')}</p>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../state.jsx';
import { api } from '../lib/api.js';
import { PARTS } from '../data/parts.js';
import { computeStats, levelFromScore, overallScore } from '../lib/progress.js';
import Avatar from '../components/Avatar.jsx';
import AnswerReview from '../components/AnswerReview.jsx';
import { Calendar, PartBars, ScoreChart } from './Progress.jsx';

const SITE_URL = 'https://speakup-multilevel.vercel.app';

// Share the site with the full https:// address: Telegram on iPhone only makes it tappable then.
function ShareLink() {
  const [done, setDone] = useState('');
  async function share() {
    const text = 'Zinapoya — practise for the Multilevel exam';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Zinapoya', text, url: SITE_URL });
        return;
      } catch (e) {
        if (e?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${SITE_URL}`);
      setDone('Link copied — paste it into your Telegram group.');
    } catch {
      setDone(`Copy this link: ${SITE_URL}`);
    }
  }
  return (
    <div className="card share-link">
      <div>
        <b>📣 Share Zinapoya with students</b>
        <p className="muted">
          Always send the full link <code>{SITE_URL}</code> (with https://) so it can be tapped on iPhones too.
        </p>
        {done && <p className="share-link__done">{done}</p>}
      </div>
      <button className="btn" onClick={share}>
        🔗 Share link
      </button>
    </div>
  );
}

const DAY = 864e5;

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
}

function ago(date) {
  if (!date) return 'never';
  const days = Math.floor((Date.now() - new Date(date)) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// Average of the last 10 AI scores.
function recentAvg(attempts) {
  const s = attempts.map(overallScore).filter((v) => v !== null).slice(0, 10);
  return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null;
}

function useTeacherGuard() {
  const { profile } = useApp();
  if (!profile) return 'loading';
  return profile.role === 'teacher' ? 'ok' : 'no';
}

const SORTS = {
  inactive: ['Least active first', (a, b) => (a.lastTs ?? 0) - (b.lastTs ?? 0)],
  active: ['Most active this week', (a, b) => b.week - a.week],
  score: ['Highest score', (a, b) => (b.avg ?? -1) - (a.avg ?? -1)],
  name: ['Name A–Z', (a, b) => a.name.localeCompare(b.name)],
};

function QuestionsPanel() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    api.teacher.listQuestions().then(setList).catch((e) => setError(e.message));
  }, []);

  async function answer(q) {
    try {
      await api.teacher.answerQuestion(q.id, reply.trim() || null);
      setList((l) => l.map((x) => (x.id === q.id ? { ...x, answered: true, answer: reply.trim() || null } : x)));
      setOpenId(null);
      setReply('');
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) return <p className="notice notice--warn">{error}</p>;
  if (!list) return null;
  const unanswered = list.filter((q) => !q.answered).length;

  return (
    <div className="card questions-panel">
      <h2>
        💬 Questions from the website {unanswered > 0 && <span className="q-badge">{unanswered}</span>}
      </h2>
      {list.length === 0 && <p className="muted">No questions yet.</p>}
      <div className="q-list">
        {list.map((q) => (
          <div key={q.id} className={`q-item ${q.answered ? 'q-item--done' : ''}`}>
            <div className="q-item__head">
              <strong>{q.name || 'Someone'}</strong>
              {q.contact && <span className="q-item__contact">{q.contact}</span>}
              <span className="q-item__time">{ago(new Date(q.created_at))}</span>
              {q.answered && <span className="q-item__tag">✓ answered</span>}
            </div>
            <p className="q-item__msg">{q.message}</p>
            {q.answered ? (
              q.answer && <p className="q-item__answer">↳ {q.answer}</p>
            ) : openId === q.id ? (
              <div className="q-item__reply">
                <textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a note (optional) and mark as answered" />
                <div className="open-browser">
                  <button className="btn btn--small" onClick={() => answer(q)}>✓ Mark answered</button>
                  <button className="btn btn--ghost btn--small" onClick={() => { setOpenId(null); setReply(''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn btn--ghost btn--small" onClick={() => { setOpenId(q.id); setReply(''); }}>Reply / mark done</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Teacher() {
  const guard = useTeacherGuard();
  const [students, setStudents] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('inactive');

  useEffect(() => {
    if (guard !== 'ok') return;
    Promise.all([api.teacher.listStudents(), api.teacher.listAttempts()])
      .then(([s, a]) => {
        setStudents(s);
        setAttempts(a);
      })
      .catch((e) => setError(e.message));
  }, [guard]);

  const rows = useMemo(() => {
    if (!students) return [];
    const byUser = {};
    for (const a of attempts) (byUser[a.user_id] ||= []).push(a);
    const week = startOfWeek();
    return students.map((s) => {
      const list = byUser[s.id] || [];
      const stats = computeStats(list);
      const avg = recentAvg(list);
      return {
        ...s,
        list,
        last: list[0]?.created_at,
        lastTs: list[0] ? new Date(list[0].created_at).getTime() : null,
        week: list.filter((a) => new Date(a.created_at) >= week).length,
        streak: stats.streak,
        avg,
        weakest: list.length ? stats.weakest : null,
      };
    });
  }, [students, attempts]);

  if (guard === 'loading') return <div className="spinner" />;
  if (guard === 'no') return <Navigate to="/" replace />;

  const q = query.trim().toLowerCase();
  const shown = rows.filter((r) => r.name.toLowerCase().includes(q)).sort(SORTS[sort][1]);
  const week = startOfWeek();
  const weekAttempts = attempts.filter((a) => new Date(a.created_at) >= week);
  const activeThisWeek = rows.filter((r) => r.week > 0).length;
  const classAvg = recentAvg(attempts.filter((a) => new Date(a.created_at) >= new Date(Date.now() - 30 * DAY)));
  const sleeping = rows.filter((r) => !r.lastTs || Date.now() - r.lastTs > 3 * DAY).length;

  return (
    <div className="teacher">
      <h1>🧑‍🏫 My class</h1>
      <ShareLink />
      <QuestionsPanel />
      {error && <p className="notice notice--warn">{error}</p>}
      {!students && !error && <div className="spinner" />}

      {students && (
        <>
          <div className="stat-row">
            <div className="card big-stat">
              <span>👥</span>
              <strong>{rows.length}</strong>
              <small>students</small>
            </div>
            <div className="card big-stat">
              <span>✅</span>
              <strong>{activeThisWeek}</strong>
              <small>active this week</small>
            </div>
            <div className="card big-stat">
              <span>🎤</span>
              <strong>{weekAttempts.length}</strong>
              <small>answers this week</small>
            </div>
            <div className="card big-stat">
              <span>⭐</span>
              <strong>{levelFromScore(classAvg)}</strong>
              <small>{classAvg === null ? 'no AI scores yet' : `class average ${classAvg}/100`}</small>
            </div>
          </div>

          {sleeping > 0 && <p className="notice notice--warn">😴 {sleeping} student{sleeping > 1 ? 's have' : ' has'} not practised for 3+ days.</p>}

          <div className="card">
            <div className="teacher__tools">
              <input type="search" placeholder="🔍 Find a student…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort students">
                {Object.entries(SORTS).map(([k, [label]]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {shown.length === 0 && <p className="muted">{rows.length ? 'No student with that name.' : 'No students yet. Share the site link with your class!'}</p>}

            <div className="roster">
              <div className="roster__row roster__head" aria-hidden="true">
                <span>Student</span>
                <span>Last active</span>
                <span>This week</span>
                <span>Streak</span>
                <span>Level</span>
                <span>Weakest</span>
              </div>
              {shown.map((r) => {
                const asleep = !r.lastTs || Date.now() - r.lastTs > 3 * DAY;
                return (
                  <Link key={r.id} to={`/teacher/${r.id}`} className={`roster__row ${asleep ? 'roster__row--asleep' : ''}`}>
                    <span className="roster__who">
                      <Avatar name={r.name} url={r.avatar_url} size={36} />
                      <strong>{r.name}</strong>
                    </span>
                    <span data-label="Last active">{ago(r.last)}</span>
                    <span data-label="This week">{r.week} answer{r.week === 1 ? '' : 's'}</span>
                    <span data-label="Streak">🔥 {r.streak}</span>
                    <span data-label="Level">{r.avg === null ? '—' : `${levelFromScore(r.avg)} · ${r.avg}`}</span>
                    <span data-label="Weakest">{r.weakest ? `${PARTS[r.weakest].emoji} ${PARTS[r.weakest].name}` : '—'}</span>
                  </Link>
                );
              })}
            </div>
            <p className="muted small">Numbers use the last 60 days. Level = average of the last 10 AI scores.</p>
          </div>
        </>
      )}
    </div>
  );
}

export function TeacherStudent() {
  const guard = useTeacherGuard();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [attempts, setAttempts] = useState(null);
  const [error, setError] = useState('');
  const [onlyFeedback, setOnlyFeedback] = useState(false);

  useEffect(() => {
    if (guard !== 'ok') return;
    Promise.all([api.teacher.listStudents(), api.teacher.listStudentAttempts(id)])
      .then(([s, a]) => {
        setStudent(s.find((x) => x.id === id) || { id, name: 'Student', avatar_url: null });
        setAttempts(a);
      })
      .catch((e) => setError(e.message));
  }, [guard, id]);

  const stats = useMemo(() => computeStats(attempts || []), [attempts]);

  if (guard === 'loading') return <div className="spinner" />;
  if (guard === 'no') return <Navigate to="/" replace />;

  const avg = recentAvg(attempts || []);
  const list = (attempts || []).filter((a) => !onlyFeedback || a.feedback);

  return (
    <div className="teacher">
      <Link to="/teacher" className="back">
        ← My class
      </Link>
      {error && <p className="notice notice--warn">{error}</p>}
      {!attempts && !error && <div className="spinner" />}

      {student && attempts && (
        <>
          <div className="teacher__student">
            <Avatar name={student.name} url={student.avatar_url} size={64} />
            <div>
              <h1>{student.name}</h1>
              <p className="muted">
                Last active {ago(attempts[0]?.created_at)} · joined {new Date(student.created_at || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

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
              <strong>{levelFromScore(avg)}</strong>
              <small>{avg === null ? 'no AI scores yet' : `recent average ${avg}/100`}</small>
            </div>
          </div>

          <div className="card">
            <h3>Score over time</h3>
            <ScoreChart points={stats.scoreTrend} emptyText="This student has fewer than two AI scores so far." />
          </div>

          <div className="two-col">
            <div className="card">
              <h3>By exam part</h3>
              <PartBars stats={stats} />
            </div>
            <div className="card">
              <h3>Last 4 weeks</h3>
              <Calendar attempts={attempts} />
            </div>
          </div>

          <div className="teacher__answers-head">
            <h2>Answers</h2>
            <label className="teacher__filter">
              <input type="checkbox" checked={onlyFeedback} onChange={(e) => setOnlyFeedback(e.target.checked)} /> Only answers with AI feedback
            </label>
          </div>
          {list.length === 0 && <p className="muted">No answers here yet.</p>}
          {list.map((a) => (
            <AnswerReview key={a.id} attempt={a} defaultOpen={false} readOnly />
          ))}
        </>
      )}
    </div>
  );
}

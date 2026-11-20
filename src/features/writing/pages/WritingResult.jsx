import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../shared/lib/api.js';
import { useT } from '../../../i18n/index.js';
import { PageLoading } from '../../../app/App.jsx';
import { getTask } from '../data/index.js';
import { PARTS } from '../rules.js';
import TaskCard from '../components/TaskCard.jsx';
import Checklist from '../components/Checklist.jsx';
import ScoreCard, { Subskills } from '../components/ScoreCard.jsx';
import MarkedText, { MarkSheet, buildMarks } from '../components/MarkedText.jsx';
import SampleAnswer from '../components/SampleAnswer.jsx';
import { UzToggle, useUz } from '../components/useUz.jsx';
import { markDone } from '../lib/done.js';
import '../writing.css';

/** Feedback screen (plan 6.5): score → points → top 3 actions → marked text → skills → next steps. */
export default function WritingResult() {
  const { attemptId } = useParams();
  const { state } = useLocation();
  const t = useT();
  const [attempt, setAttempt] = useState(state?.attempt?.result ? state.attempt : null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (attempt || attemptId === 'unsaved') return;
    api.writing
      .get(attemptId)
      .then((a) => (a?.result ? setAttempt(a) : setError(t('This answer was not found.'))))
      .catch((e) => setError(e.message));
  }, [attempt, attemptId, t]);

  useEffect(() => {
    if (attempt?.id) markDone(attempt.part, attempt.task_id);
  }, [attempt]);

  if (attemptId === 'unsaved' && !attempt) return <Navigate to="/writing" replace />;
  if (error)
    return (
      <div className="w-page">
        <div className="card">
          <p>{error}</p>
          <Link className="btn" to="/writing">
            {t('Back to Writing')}
          </Link>
        </div>
      </div>
    );
  if (!attempt) return <PageLoading />;
  return <Result attempt={attempt} />;
}

function Result({ attempt }) {
  const t = useT();
  const navigate = useNavigate();
  const [uz] = useUz();
  const r = attempt.result;
  const task = useMemo(() => getTask(attempt.part, attempt.task_id), [attempt]);
  const marks = useMemo(() => buildMarks(r), [r]);
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState({ open: false, reason: '', sent: false, busy: false });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const errorCount = (r.errors || []).length;
  const counts = (r.errors || []).reduce((m, e) => ({ ...m, [e.severity]: (m[e.severity] || 0) + 1 }), {});

  async function sendReport() {
    setReport((s) => ({ ...s, busy: true }));
    try {
      await api.writing.reportScore(attempt.id, report.reason);
      setReport({ open: false, reason: '', sent: true, busy: false });
    } catch {
      setReport((s) => ({ ...s, busy: false }));
    }
  }

  async function remove() {
    await api.writing.remove(attempt.id).catch(() => {});
    navigate('/writing', { replace: true });
  }

  return (
    <div className="w-page w-result">
      <nav className="w-crumbs">
        <Link to="/writing">✍️ {t('Writing')}</Link> <span aria-hidden="true">›</span> <span>{t('Feedback')}</span>
      </nav>

      <div className="w-result__grid">
        <div className="w-result__main">
          <ScoreCard attempt={attempt} />
          <UzToggle />
          {task && <Checklist task={task} result={r} />}

          {r.top_actions?.length > 0 && (
            <section className="card w-actions">
              <h2 className="w-section-title">🎯 {t('Do these next time')}</h2>
              <ol>
                {r.top_actions.map((a, i) => (
                  <li key={i}>{uz ? a.text_uz || a.text : a.text}</li>
                ))}
              </ol>
            </section>
          )}

          <section className="card w-textcard">
            <div className="w-textcard__head">
              <h2 className="w-section-title">{t('Your text')}</h2>
              <span className="muted small">
                {t('{n} words', { n: attempt.word_count ?? r.words })} · {errorCount ? t('{n} mistakes', { n: errorCount }) : t('No mistakes found')}
              </span>
            </div>
            <div className="w-legend" aria-hidden="true">
              {counts.blocks_meaning > 0 && <span className="w-mark w-mark--red">{t('blocks meaning')}</span>}
              {counts.noticeable > 0 && <span className="w-mark w-mark--orange">{t('mistake')}</span>}
              {counts.small > 0 && <span className="w-mark w-mark--yellow">{t('small slip')}</span>}
              {r.better_words?.length > 0 && <span className="w-mark w-mark--blue">{t('better word')}</span>}
              {r.strengths?.length > 0 && <span className="w-mark w-mark--green">{t('strength')}</span>}
            </div>
            <MarkedText text={attempt.body} marks={marks} selected={selected} onSelect={setSelected} />
            {selected !== null ? (
              <MarkSheet marks={marks} selected={selected} onSelect={setSelected} onClose={() => setSelected(null)} />
            ) : (
              errorCount > 0 && (
                <button type="button" className="btn btn--small w-textcard__start" onClick={() => setSelected(marks.findIndex((m) => m.kind === 'error'))}>
                  {t('Go through my mistakes')} →
                </button>
              )
            )}
          </section>

          {r.register?.note && (
            <section className={`card w-register ${r.register.ok ? 'is-ok' : 'is-bad'}`}>
              <h2 className="w-section-title">{r.register.ok ? '✅' : '⚠️'} {t('Style (register)')}</h2>
              <p>{uz ? r.register.note_uz || r.register.note : r.register.note}</p>
            </section>
          )}

          {r.strengths?.length > 0 && (
            <section className="card w-strengths">
              <h2 className="w-section-title">💪 {t('What you did well')}</h2>
              <ul>
                {r.strengths.map((s, i) => (
                  <li key={i}>
                    <strong>“{s.quote}”</strong> — {uz ? s.why_uz || s.why : s.why}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Subskills subskills={r.subskills} />
          {task?.sample && <SampleAnswer task={task} />}

          <section className="w-next">
            {task && (
              <button type="button" className="btn btn--big" onClick={() => navigate(`/writing/${attempt.part}/${attempt.task_id}`, { state: { text: attempt.body } })}>
                ✏️ {t('Improve it and check again')}
              </button>
            )}
            <Link className="btn btn--ghost" to={`/writing/${attempt.part}/random`}>
              🎲 {t('Try another task')}
            </Link>
            {task?.other && (
              <Link className="btn btn--ghost" to={`/writing/${task.other}/${task.id}`}>
                {t('Write Task {p} for this email', { p: task.other })}
              </Link>
            )}
          </section>

          {attempt.id && (
            <section className="w-meta">
              {report.sent ? (
                <p className="muted small">✅ {t('Thank you! A teacher will look at this score.')}</p>
              ) : report.open ? (
                <div className="card w-report">
                  <label htmlFor="w-report">{t('Why does the score feel wrong? (optional)')}</label>
                  <textarea id="w-report" rows={3} value={report.reason} onChange={(e) => setReport((s) => ({ ...s, reason: e.target.value.slice(0, 500) }))} />
                  <div className="w-report__actions">
                    <button type="button" className="btn btn--small" onClick={sendReport} disabled={report.busy}>
                      {t('Send')}
                    </button>
                    <button type="button" className="btn btn--ghost btn--small" onClick={() => setReport((s) => ({ ...s, open: false }))}>
                      {t('Cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="w-linkbtn small" onClick={() => setReport((s) => ({ ...s, open: true }))}>
                  🤔 {t('This score feels wrong')}
                </button>
              )}
              {confirmDelete ? (
                <span className="small">
                  {t('Delete this answer for ever?')}{' '}
                  <button type="button" className="w-linkbtn small w-danger" onClick={remove}>
                    {t('Yes, delete')}
                  </button>{' '}
                  <button type="button" className="w-linkbtn small" onClick={() => setConfirmDelete(false)}>
                    {t('Cancel')}
                  </button>
                </span>
              ) : (
                <button type="button" className="w-linkbtn small" onClick={() => setConfirmDelete(true)}>
                  🗑️ {t('Delete this answer')}
                </button>
              )}
            </section>
          )}
        </div>

        {task && (
          <aside className="w-result__side">
            <TaskCard task={task} compact />
            <p className="muted small">
              {t(PARTS[attempt.part].name)} · {new Date(attempt.created_at).toLocaleString()}
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

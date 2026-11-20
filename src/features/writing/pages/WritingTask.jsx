import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../lib/api.js';
import { useApp } from '../../../state.jsx';
import { useT } from '../../../i18n/index.js';
import { getTask, nextTask, taskForServer } from '../data/index.js';
import { PARTS, countWords } from '../rules.js';
import { precheck } from '../precheck.js';
import TaskCard from '../components/TaskCard.jsx';
import WordBar from '../components/WordBar.jsx';
import Checklist from '../components/Checklist.jsx';
import { useUz, UzToggle } from '../components/useUz.jsx';
import SampleAnswer from '../components/SampleAnswer.jsx';
import { readDone } from '../lib/done.js';
import '../writing.css';

const draftKey = (part, id) => `zp_wdraft_${part}_${id}`;
const STEPS = ['Reading your text…', 'Checking the task points…', 'Checking grammar and words…', 'Comparing with the official criteria…', 'Almost done…'];

const readDraft = (part, id) => {
  try {
    return localStorage.getItem(draftKey(part, id)) || '';
  } catch {
    return '';
  }
};
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function WritingTask() {
  const { part, id } = useParams();
  if (id === 'random') {
    const pick = nextTask(part, readDone(part));
    return <Navigate to={pick ? `/writing/${part}/${pick.id}` : '/writing'} replace />;
  }
  // A new key per task resets the editor when the student moves to another task.
  return <TaskScreen key={`${part}-${id}`} part={part} id={id} />;
}

function TaskScreen({ part, id }) {
  const t = useT();
  const navigate = useNavigate();
  const { state, pathname } = useLocation();
  const { user } = useApp();
  const [uz] = useUz();
  const task = useMemo(() => getTask(part, id), [part, id]);
  const [text, setText] = useState(() => state?.text ?? readDraft(part, id));
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [checking, setChecking] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const saveTimer = useRef(null);
  const deferred = useDeferredValue(text);
  const pre = useMemo(() => precheck(part, deferred, { source: task?.input }), [part, deferred, task]);
  const words = countWords(text);

  // Autosave on this device a moment after typing stops.
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        if (text.trim()) localStorage.setItem(draftKey(part, id), text);
        else localStorage.removeItem(draftKey(part, id));
      } catch {
        /* storage full or blocked */
      }
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [text, part, id]);

  // A soft timer that starts with the first letter.
  useEffect(() => {
    if (!startedAt) return undefined;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [startedAt]);

  // Progress messages while the AI works, so the screen never looks frozen.
  useEffect(() => {
    if (!checking) return undefined;
    setStep(0);
    const s = setInterval(() => setStep((n) => Math.min(n + 1, STEPS.length - 1)), 5000);
    return () => clearInterval(s);
  }, [checking]);

  if (!task) return <Navigate to="/writing" replace />;
  const p = PARTS[part];
  const elapsed = startedAt ? Math.round((now - startedAt) / 1000) : 0;
  const overTime = elapsed > p.minutes * 60;

  function onChange(e) {
    if (!startedAt) setStartedAt(Date.now());
    setText(e.target.value);
    setError('');
  }

  async function check() {
    setChecking(true);
    setError('');
    try {
      const { attempt } = await api.writing.check({ part, text, task: taskForServer(task), mode: 'quick', timeSpent: elapsed || null });
      try {
        localStorage.removeItem(draftKey(part, id));
      } catch {
        /* ignore */
      }
      navigate(`/writing/result/${attempt.id || 'unsaved'}`, { state: { attempt } });
    } catch (e) {
      setError(e.message || t('Something went wrong. Please try again.'));
      setChecking(false);
    }
  }

  return (
    <div className="w-page w-taskpage">
      <nav className="w-crumbs">
        <Link to="/writing">✍️ {t('Writing')}</Link> <span aria-hidden="true">›</span> <span>{t(p.name)}</span>
      </nav>

      <div className="w-taskpage__grid">
        <div className="w-taskpage__side">
          <TaskCard task={task} />
          <Checklist task={task} />
          <UzToggle />
        </div>

        <div className="w-taskpage__main">
          <section className="card w-editor">
            <div className="w-editor__top">
              <h2 className="w-section-title">{t('Your answer')}</h2>
              <span className={`w-timer ${overTime ? 'is-over' : ''}`} title={t('Suggested time: {n} minutes', { n: p.minutes })}>
                ⏱️ {fmt(elapsed)} <span className="muted">/ {p.minutes}:00</span>
              </span>
            </div>
            <textarea
              className="w-editor__area"
              value={text}
              onChange={onChange}
              disabled={checking}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="sentences"
              rows={part === '1.1' ? 9 : part === '1.2' ? 14 : 18}
              placeholder={part === '1.1' ? 'Hi …,\n\n…\n\nTake care,\n…' : part === '1.2' ? 'Dear …,\n\nI am writing to …\n\nYours faithfully,\n…' : t('Start with your opinion, then give reasons and examples…')}
              aria-label={t('Your answer')}
            />
            <WordBar part={part} words={words} paragraphs={pre.paragraphs} />

            {pre.hints.length > 0 && (
              <ul className="w-hints" aria-live="polite">
                {pre.hints.map((h) => (
                  <li key={h.id} className={`w-hint w-hint--${h.tone}`}>
                    {h.tone === 'warn' ? '⚠️' : '💡'} {uz ? h.text_uz : h.text}
                  </li>
                ))}
              </ul>
            )}

            {error && <p className="w-error">{error}</p>}

            {checking ? (
              <div className="w-checking" role="status">
                <div className="spinner" />
                <div>
                  <strong>{t(STEPS[step])}</strong>
                  <small className="muted">{t('This usually takes 15–30 seconds.')}</small>
                </div>
              </div>
            ) : user ? (
              <button type="button" className="btn btn--big w-editor__check" onClick={check} disabled={words < 5}>
                ✅ {t('Check my writing')}
              </button>
            ) : (
              // Guests can write; checking needs a free account. The draft stays on this device meanwhile.
              <Link className="btn btn--big w-editor__check" to={`/signup?next=${encodeURIComponent(pathname)}`}>
                🔐 {t('Create a free account to check it')}
              </Link>
            )}
            <p className="muted small w-editor__note">💾 {t('Your text is saved on this device while you write.')}</p>
          </section>

          {task.sample && <SampleAnswer task={task} hideFirst />}

          {task.other && (
            <Link className="w-other" to={`/writing/${task.other}/${task.id}`}>
              {task.other === '1.2' ? t('Same email, formal letter: Task 1.2 →') : t('Same email, letter to a friend: Task 1.1 →')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

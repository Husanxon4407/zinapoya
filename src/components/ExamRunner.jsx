import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QuestionView from './QuestionView.jsx';
import TimerRing from './TimerRing.jsx';
import AnswerReview from './AnswerReview.jsx';
import useCountdown from './useCountdown.js';
import { PARTS } from '../data/parts.js';
import { beep, createSpeakingSession, recognitionSupported, speak, stopSpeaking } from '../lib/speech.js';
import { analyse, countWords } from '../lib/metrics.js';
import { api } from '../lib/api.js';
import { useApp } from '../state.jsx';

/**
 * Runs answers exactly like the exam: question is read aloud → preparation timer → speaking timer.
 * Every answer is saved as soon as it is recorded. mode: 'practice' | 'mock' | 'workout' | 'game' | 'guest'
 */
export default function ExamRunner({ steps, mode = 'practice', title, intro, onComplete, renderExtra, liveExtra, hideNotes = false }) {
  const { addAttempt } = useApp() || {};
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | listen | prep | speak | saving | done
  const [live, setLive] = useState({ final: '', interim: '' });
  const [results, setResults] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const sessionRef = useRef(null);
  const cancelled = useRef(false);

  const step = steps[index];
  const part = PARTS[step.part];

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
      stopSpeaking();
      sessionRef.current?.stop();
    };
  }, []);

  async function beginStep(i) {
    setIndex(i);
    setNotes('');
    setPhase('listen');
    await speak(steps[i].tts);
    if (cancelled.current) return;
    setPhase('prep');
  }

  function startSpeaking() {
    if (phase !== 'prep') return;
    stopSpeaking();
    beep(880);
    setLive({ final: '', interim: '' });
    const s = createSpeakingSession({ onTranscript: (final, interim) => setLive({ final, interim }) });
    sessionRef.current = s;
    s.start();
    setPhase('speak');
  }

  async function finishSpeaking() {
    if (phase !== 'speak') return;
    beep(520, 260);
    setPhase('saving');
    const { blob, transcript, duration } = await sessionRef.current.stop();
    sessionRef.current = null;
    if (cancelled.current) return;
    const m = analyse(transcript, duration, step.speak);
    const attempt = {
      part: step.part,
      question_id: step.questionId,
      question_text: step.questionText,
      mode,
      transcript,
      duration_sec: duration,
      target_sec: step.speak,
      word_count: m.words,
      wpm: m.wpm,
      filler_count: m.fillers,
    };
    let row;
    if (mode === 'guest') {
      row = { ...attempt, id: `guest-${index}`, localBlob: blob, created_at: new Date().toISOString() };
    } else {
      try {
        row = await api.saveAttempt(attempt, blob);
        addAttempt?.(row);
      } catch (e) {
        setError(`Could not save this answer: ${e.message}`);
        row = { ...attempt, id: `unsaved-${index}`, localBlob: blob, created_at: new Date().toISOString() };
      }
      if (blob && row.recording_path) row = { ...row, localBlob: blob };
    }
    const next = [...results, { step, row }];
    setResults(next);
    if (index + 1 < steps.length) beginStep(index + 1);
    else {
      setPhase('done');
      onComplete?.(next);
    }
  }

  const prepLeft = useCountdown(step.prep, phase === 'prep', startSpeaking);
  const speakLeft = useCountdown(step.speak, phase === 'speak', finishSpeaking);

  if (phase === 'ready') {
    return (
      <div className="card runner-ready">
        <h1>{title}</h1>
        {intro}
        <ol className="runner-plan">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="dot" style={{ background: PARTS[s.part].color }} />
              {PARTS[s.part].name} · {s.label}
              <small>
                {s.prep}s prep · {s.speak >= 60 ? `${s.speak / 60} min` : `${s.speak}s`} talk
              </small>
            </li>
          ))}
        </ol>
        {!recognitionSupported() && (
          <p className="notice notice--warn">
            Your browser can record you but cannot turn speech into text. For transcripts and AI feedback, please use Google Chrome or Microsoft Edge.
          </p>
        )}
        <p className="muted">🎧 Find a quiet place. The examiner voice will read each question, then the timer starts.</p>
        <button className="btn btn--big" style={{ background: part.color }} onClick={() => beginStep(0)}>
          ▶ Start
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="runner-done">
        <div className="card celebrate">
          <div className="celebrate__emoji">🎉</div>
          <h1>Well done!</h1>
          <p>
            You answered {results.length} question{results.length > 1 ? 's' : ''} and spoke for{' '}
            {Math.round(results.reduce((s, r) => s + (r.row.duration_sec || 0), 0))} seconds.
          </p>
          {mode === 'guest' ? (
            <Link className="btn btn--big" to="/signup">
              Create a free account to save your progress
            </Link>
          ) : (
            <p className="muted">Listen to yourself below and ask the AI coach for feedback.</p>
          )}
        </div>
        {error && <p className="notice notice--warn">{error}</p>}
        {renderExtra?.(results)}
        {results.map(({ step: s, row }, i) => (
          <AnswerReview key={i} step={s} attempt={row} guest={mode === 'guest'} />
        ))}
      </div>
    );
  }

  const words = countWords(live.final + ' ' + live.interim);
  const showNotes = step.prep >= 30;

  return (
    <div className="runner">
      <div className="runner__progress">
        {steps.map((s, i) => (
          <span key={i} className={i < index ? 'done' : i === index ? 'now' : ''} style={i <= index ? { background: PARTS[s.part].color } : undefined} />
        ))}
      </div>

      <div className="runner__grid">
        <div className="card">
          <QuestionView step={step} />
        </div>

        <div className="card runner__side">
          {phase === 'listen' && (
            <div className="runner__state">
              <div className="pulse-icon">🔊</div>
              <p>Listen to the question…</p>
              <button className="btn btn--ghost" onClick={() => { stopSpeaking(); setPhase('prep'); }}>
                Skip
              </button>
            </div>
          )}

          {phase === 'prep' && (
            <div className="runner__state">
              <TimerRing remaining={prepLeft} total={step.prep} color="var(--amber)" label="prepare" />
              <p className="runner__hint">Think about what you will say.</p>
              <button className="btn" style={{ background: part.color }} onClick={startSpeaking}>
                🎤 I’m ready — start talking
              </button>
            </div>
          )}

          {phase === 'speak' && (
            <div className="runner__state">
              <TimerRing remaining={speakLeft} total={step.speak} color={part.color} label="speak" />
              <div className="rec-dot">● Recording</div>
              <p className="live-words">{words} words</p>
              <p className="live-transcript">
                {live.final} <i>{live.interim}</i>
              </p>
              <button className="btn btn--ghost" onClick={finishSpeaking}>
                ■ I’ve finished
              </button>
            </div>
          )}

          {phase === 'saving' && (
            <div className="runner__state">
              <div className="spinner" />
              <p>Saving your answer…</p>
            </div>
          )}

          {liveExtra && (phase === 'prep' || phase === 'speak') && liveExtra(`${live.final} ${live.interim}`, phase)}

          {showNotes && !hideNotes && (phase === 'prep' || phase === 'speak' || phase === 'listen') && (
            <label className="notes">
              <span>📝 Your notes (only key words!)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder={step.part === '3' ? 'Intro…\nFor…\nAgainst…\nMy opinion…' : 'When? Where? Who?\nWhat happened?\nHow did I feel?'} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

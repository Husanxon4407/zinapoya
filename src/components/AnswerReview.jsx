import { useEffect, useState } from 'react';
import { PARTS } from '../data/parts.js';
import { analyse, paceLabel } from '../lib/metrics.js';
import { aiEnabled, api } from '../lib/api.js';
import { useApp } from '../state.jsx';
import FeedbackView from './FeedbackView.jsx';
import { recognitionSupported } from '../lib/speech.js';

export function useRecordingUrl(attempt, enabled = true) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let revoked = null;
    let alive = true;
    if (!enabled) return undefined;
    if (attempt.localBlob) {
      revoked = URL.createObjectURL(attempt.localBlob);
      setUrl(revoked);
    } else if (attempt.recording_path) {
      api.getRecordingUrl(attempt).then((u) => {
        if (alive) setUrl(u);
      });
    }
    return () => {
      alive = false;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [attempt.id, attempt.localBlob, attempt.recording_path, enabled]);
  return url;
}

export function MetricChips({ attempt }) {
  const m = analyse(attempt.transcript || '', attempt.duration_sec || 0, attempt.target_sec);
  const pace = paceLabel(m.wpm);
  return (
    <div className="chips">
      <span className="chip">🗣️ {m.words} words</span>
      <span className={`chip chip--${pace.tone}`} title={pace.text}>
        ⚡ {m.wpm} wpm · {pace.text}
      </span>
      <span className={`chip ${m.fillers > 3 ? 'chip--warn' : 'chip--good'}`}>😶 {m.fillers} fillers (um, eh…)</span>
      {m.usedTime !== null && (
        <span className={`chip ${m.usedTime < 70 ? 'chip--warn' : 'chip--good'}`}>⏱️ used {m.usedTime}% of the time</span>
      )}
    </div>
  );
}

export default function AnswerReview({ step, attempt, guest = false, defaultOpen = true }) {
  const { patchAttempt } = useApp() || {};
  const [row, setRow] = useState(attempt);
  const [transcript, setTranscript] = useState(attempt.transcript || '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [model, setModel] = useState('');
  const [open, setOpen] = useState(defaultOpen);
  const url = useRecordingUrl(row, open);
  const part = PARTS[row.part];
  const saved = !guest && !String(row.id).startsWith('unsaved');

  useEffect(() => {
    setRow(attempt);
  }, [attempt]);

  async function getFeedback() {
    setBusy('feedback');
    setError('');
    try {
      const res = await api.requestFeedback(row.id, transcript);
      const patch = { feedback: res.feedback, scores: res.scores, transcript };
      setRow((r) => ({ ...r, ...patch }));
      patchAttempt?.(row.id, patch);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function getModel() {
    setBusy('model');
    setError('');
    try {
      setModel(await api.getModelAnswer({ question_id: row.question_id, part: row.part, question_text: row.question_text }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  const title = step?.label ? `${part.name} · ${step.label}` : part.name;

  return (
    <div className="card review" style={{ borderTopColor: part.color }}>
      <button className="review__head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="review__tag" style={{ background: part.soft, color: part.ink }}>
          {part.emoji} {title}
        </span>
        <span className="review__q">{step?.prompt || row.question_text}</span>
        {typeof row.scores?.overall === 'number' && <span className="score-pill">{row.scores.level} · {row.scores.overall}</span>}
        <span className="review__toggle">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="review__body">
          {url ? <audio controls src={url} className="audio" /> : row.recording_path || row.localBlob ? <p className="muted">Loading recording…</p> : null}

          <MetricChips attempt={{ ...row, transcript }} />

          <label className="transcript">
            <span>What you said {recognitionSupported() ? '(fix any words the computer misheard)' : '(type what you said)'}</span>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={Math.min(8, Math.max(3, Math.ceil(transcript.length / 90)))}
              placeholder="No speech was detected. You can type what you said here."
              readOnly={!!row.feedback}
            />
          </label>

          {error && <p className="notice notice--warn">{error}</p>}

          {row.feedback ? (
            <FeedbackView feedback={row.feedback} scores={row.scores} />
          ) : !aiEnabled ? (
            <p className="notice">🎧 Listen to your recording and read what you said. Could you say it better? Try the question again!</p>
          ) : guest ? (
            <p className="notice">✨ Sign up for free to get AI feedback on your answers.</p>
          ) : (
            saved && (
              <button className="btn btn--ai" disabled={busy === 'feedback' || transcript.trim().split(/\s+/).length < 5} onClick={getFeedback}>
                {busy === 'feedback' ? 'The coach is listening…' : '✨ Get AI feedback'}
              </button>
            )
          )}

          {!guest && aiEnabled && (
            <div className="model">
              {model ? (
                <div className="model__answer">
                  <h4>💡 Model answer (B2 level)</h4>
                  <p>{model}</p>
                </div>
              ) : (
                <button className="btn btn--ghost" disabled={busy === 'model'} onClick={getModel}>
                  {busy === 'model' ? 'Writing…' : '💡 Show a model answer'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

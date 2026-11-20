import { useEffect, useRef, useState } from 'react';
import { PARTS } from '../data/parts.js';
import { analyse, paceLabel } from '../lib/metrics.js';
import { aiEnabled, api } from '../../../shared/lib/api.js';
import { useApp } from '../../../app/state.jsx';
import FeedbackView from './FeedbackView.jsx';
import TranscriptView from './TranscriptView.jsx';
import { transcriber, useTranscription } from '../lib/transcriber.js';
import { segmentsText } from '../lib/wordDiff.js';
import { stepLabel, translate, useT } from '../../../i18n/index.js';

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
  const t = useT();
  return (
    <div className="chips">
      <span className="chip">🗣️ {t('{n} words', { n: m.words })}</span>
      <span className={`chip chip--${pace.tone}`} title={t(pace.text)}>
        ⚡ {t('{n} words/min', { n: m.wpm })} · {t(pace.text)}
      </span>
      <span className={`chip ${m.fillers > 3 ? 'chip--warn' : 'chip--good'}`}>😶 {t('{n} fillers (um, eh…)', { n: m.fillers })}</span>
      {m.usedTime !== null && (
        <span className={`chip ${m.usedTime < 70 ? 'chip--warn' : 'chip--good'}`}>⏱️ {t('used {n}% of the time', { n: m.usedTime })}</span>
      )}
    </div>
  );
}

const RECENT_MS = 2 * 3600 * 1000;

// MediaRecorder files often have no length written in them, so the browser cannot jump to a moment.
// Asking for a far-away position makes it read the whole file once; after that, jumping works.
function fixDuration(e) {
  const a = e.currentTarget;
  if (a.duration !== Infinity) return;
  const back = () => {
    a.removeEventListener('timeupdate', back);
    a.currentTime = 0;
  };
  a.addEventListener('timeupdate', back);
  a.currentTime = 1e101;
}

// readOnly: the teacher looking at a student's answer (no AI buttons, nothing can be changed).
export default function AnswerReview({ step, attempt, guest = false, defaultOpen = true, readOnly = false }) {
  const t = useT();
  const { patchAttempt } = useApp() || {};
  const [row, setRow] = useState(attempt);
  const [transcript, setTranscript] = useState(attempt.transcript || '');
  const [segments, setSegments] = useState(attempt.transcript_segments?.length ? attempt.transcript_segments : null);
  // The live text, kept to cross-check the AI transcript word by word.
  const [liveText] = useState(() => attempt.browser_transcript ?? (attempt.transcript_segments ? '' : attempt.transcript || ''));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [model, setModel] = useState('');
  const [open, setOpen] = useState(defaultOpen);
  const audioRef = useRef(null);
  const url = useRecordingUrl(row, open);
  const part = PARTS[row.part];
  const saved = !guest && !readOnly && !row.saving && !/^(unsaved|guest)/.test(String(row.id));
  const job = useTranscription(saved ? row.id : null);
  const checking = job?.status === 'waiting' || job?.status === 'working';

  useEffect(() => {
    setRow(attempt);
  }, [attempt]);

  // The careful AI transcript arrived.
  const applied = useRef(null);
  useEffect(() => {
    const res = job?.status === 'done' ? job.result : null;
    if (!res || applied.current === res) return;
    applied.current = res;
    setSegments(res.segments?.length ? res.segments : null);
    const patch = { transcript_segments: res.segments, transcript_source: 'ai' };
    if (!row.feedback) {
      Object.assign(patch, { transcript: res.transcript, word_count: res.word_count, wpm: res.wpm, filler_count: res.filler_count });
      setTranscript(res.transcript);
      setEditing(false);
      if (!res.transcript) setError(translate('The AI could not hear any speech in this recording. Please try speaking louder or closer to the microphone.'));
    }
    setRow((r) => ({ ...r, ...patch }));
    patchAttempt?.(row.id, patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const hasRecording = !!(row.localBlob || row.recording_path);
  const canTranscribe = aiEnabled && saved && hasRecording && (row.duration_sec || 0) >= 2;

  function startCheck(force = false) {
    setError('');
    transcriber.enqueue(
      row.id,
      {
        blob: row.localBlob,
        loadBlob: async () => {
          const signed = await api.getRecordingUrl(row);
          return signed ? (await fetch(signed)).blob() : null;
        },
        browserTranscript: liveText,
      },
      { force },
    );
  }

  // Answers that were never checked (older ones, or the page was reloaded): check them when opened.
  useEffect(() => {
    if (!open || !canTranscribe || job || segments || row.feedback || row.transcript_source === 'ai') return;
    const recent = Date.now() - new Date(row.created_at || 0).getTime() < RECENT_MS;
    if (!transcript.trim() || recent) startCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canTranscribe]);

  function playFrom(sec) {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.currentTime = Math.max(0, (sec || 0) - 0.3);
    } catch {
      /* not ready yet */
    }
    a.play().catch(() => {});
  }

  async function getFeedback() {
    setBusy('feedback');
    setError('');
    try {
      const res = await api.requestFeedback(row.id, transcript);
      const patch = { feedback: res.feedback, scores: res.scores, transcript };
      setRow((r) => ({ ...r, ...patch }));
      patchAttempt?.(row.id, patch);
      setEditing(false);
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

  const title = step?.label ? `${t(part.name)} · ${stepLabel(t, step.label)}` : t(part.name);
  const edited = !!segments && transcript.trim() !== segmentsText(segments);
  const showChecked = !!segments && !editing && !edited;
  const locked = readOnly || !!row.feedback;
  const source = checking
    ? { cls: 'checking', text: t('Writing down what you said…') }
    : showChecked
      ? { cls: 'ai', text: t('Checked by AI ✓') }
      : edited
        ? { cls: 'edited', text: t('Fixed by you ✎') }
        : transcript.trim()
          ? { cls: 'draft', text: t('Live draft') }
          : null;

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
          {url ? (
            <audio ref={audioRef} controls preload="auto" src={url} className="audio" onLoadedMetadata={fixDuration} />
          ) : hasRecording ? (
            <p className="muted">{t('Loading recording…')}</p>
          ) : null}

          <MetricChips attempt={{ ...row, transcript }} />

          <div className="transcript">
            <div className="transcript__head">
              <span>{readOnly ? t('What they said') : t('What you said')}</span>
              {source && <span className={`tsource tsource--${source.cls}`}>{source.text}</span>}
            </div>

            {checking && (
              <p className="notice transcript__wait">
                <span className="spinner spinner--small" /> {t('The AI is listening to your recording and writing down every word. This takes about 10–15 seconds…')}
              </p>
            )}
            {row.saving && (
              <p className="notice transcript__wait">
                <span className="spinner spinner--small" /> {t('Saving your answer…')}
              </p>
            )}
            {row.offline && <p className="notice">📴 {t('No internet: this answer is saved on your phone. It will be uploaded and written down automatically when you are online again — you will find it in History.')}</p>}

            {showChecked ? (
              <TranscriptView segments={segments} compareWith={liveText} onPlayFrom={url ? playFrom : undefined} />
            ) : (
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={Math.min(8, Math.max(3, Math.ceil(transcript.length / 90)))}
                placeholder={checking ? t('Listening to your recording…') : t('No text yet. You can type what you said here.')}
                readOnly={locked || checking}
              />
            )}

            {!locked && (
              <div className="transcript__actions">
                {showChecked && (
                  <button className="btn btn--ghost btn--small" onClick={() => setEditing(true)}>
                    ✏️ {t('Fix the text')}
                  </button>
                )}
                {segments && !showChecked && (
                  <button
                    className="btn btn--ghost btn--small"
                    onClick={() => {
                      setTranscript(segmentsText(segments));
                      setEditing(false);
                    }}
                  >
                    {edited ? `↩ ${t('Back to the AI text')}` : `✓ ${t('Done')}`}
                  </button>
                )}
                {canTranscribe && !checking && (
                  <button className="btn btn--ghost btn--small" onClick={() => startCheck(true)}>
                    ✍️ {segments ? t('Check my recording again') : t('Write down what I said (AI)')}
                  </button>
                )}
              </div>
            )}
          </div>

          {job?.status === 'error' && <p className="notice notice--warn">{job.error}</p>}
          {error && <p className="notice notice--warn">{error}</p>}

          {row.feedback ? (
            <FeedbackView feedback={row.feedback} scores={row.scores} />
          ) : readOnly ? (
            <p className="muted">{t('No AI feedback on this answer yet.')}</p>
          ) : !aiEnabled ? (
            <p className="notice">🎧 {t('Listen to your recording and read what you said. Could you say it better? Try the question again!')}</p>
          ) : guest ? (
            <p className="notice">✨ {t('Sign up for free to get AI feedback on your answers.')}</p>
          ) : (
            saved && (
              <button className="btn btn--ai" disabled={busy === 'feedback' || checking || transcript.trim().split(/\s+/).length < 5} onClick={getFeedback}>
                {busy === 'feedback' ? t('The coach is listening…') : checking ? t('Wait for the checked text…') : `✨ ${t('Get AI feedback')}`}
              </button>
            )
          )}

          {!guest && !readOnly && aiEnabled && (
            <div className="model">
              {model ? (
                <div className="model__answer">
                  <h4>💡 {t('Model answer (B2 level)')}</h4>
                  <p>{model}</p>
                </div>
              ) : (
                <button className="btn btn--ghost" disabled={busy === 'model'} onClick={getModel}>
                  {busy === 'model' ? t('Writing…') : `💡 ${t('Show a model answer')}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

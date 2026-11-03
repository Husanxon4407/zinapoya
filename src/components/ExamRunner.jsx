import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QuestionView from './QuestionView.jsx';
import TimerRing from './TimerRing.jsx';
import AnswerReview from './AnswerReview.jsx';
import useCountdown from './useCountdown.js';
import { PARTS } from '../data/parts.js';
import MicMeter from './MicMeter.jsx';
import MicHelp, { InAppWarning } from './MicHelp.jsx';
import { beep, checkMicrophone, createSpeakingSession, speak, stopSpeaking, unlockAudio } from '../lib/speech.js';
import { analyse, countWords } from '../lib/metrics.js';
import { aiEnabled, api } from '../lib/api.js';
import { transcriber } from '../lib/transcriber.js';
import { useApp } from '../state.jsx';
import { duckMusic, sfx } from '../lib/sound.js';
import { stepLabel, translate, useT } from '../i18n/index.js';

/**
 * Runs answers exactly like the exam: question is read aloud → preparation timer → speaking timer.
 * Every answer is saved as soon as it is recorded. mode: 'practice' | 'mock' | 'workout' | 'game' | 'guest'
 */
export default function ExamRunner({ steps, mode = 'practice', title, intro, onComplete, renderExtra, liveExtra, hideNotes = false }) {
  const t = useT();
  const { addAttempt } = useApp() || {};
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | listen | prep | speak | saving | done
  const [live, setLive] = useState({ final: '', interim: '' });
  const [results, setResults] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [mic, setMic] = useState({ level: 0, silent: 0 });
  const [liveSource, setLiveSource] = useState('none');
  const [micProblem, setMicProblem] = useState(''); // '' | blocked | no-mic | busy | unsupported | error
  const [checkingMic, setCheckingMic] = useState(false);
  const sessionRef = useRef(null);
  const cancelled = useRef(false);
  const liveBoxRef = useRef(null);
  const useAi = aiEnabled && mode !== 'guest';

  const step = steps[index];
  const part = PARTS[step.part];

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
      stopSpeaking();
      sessionRef.current?.stop();
      duckMusic(false);
    };
  }, []);

  // Keep the background music quiet while the examiner talks and while recording.
  useEffect(() => {
    duckMusic(phase === 'listen' || phase === 'speak' || phase === 'saving');
    if (phase === 'done') sfx('star');
  }, [phase]);

  async function beginStep(i) {
    setIndex(i);
    setNotes('');
    setPhase('listen');
    await speak(steps[i].tts);
    if (cancelled.current) return;
    setPhase('prep');
  }

  // Keep the newest live words in view.
  useEffect(() => {
    const el = liveBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [live]);

  // "Start": unlock sound and ask for the microphone now, not in the middle of the first answer.
  async function begin() {
    sfx('start');
    unlockAudio();
    setCheckingMic(true);
    const status = await checkMicrophone();
    setCheckingMic(false);
    if (cancelled.current) return;
    if (status !== 'ok') {
      setMicProblem(status);
      return;
    }
    setMicProblem('');
    beginStep(0);
  }

  function startSpeaking() {
    if (phase !== 'prep') return;
    stopSpeaking();
    beep(880);
    setLive({ final: '', interim: '' });
    setMic({ level: 0, silent: 0 });
    setLiveSource('none');
    setMicProblem('');
    let lastLevelAt = 0;
    const s = createSpeakingSession({
      onTranscript: (final, interim) => setLive({ final, interim }),
      onLevel: (level, silent) => {
        const now = Date.now();
        if (now - lastLevelAt < 90) return; // ~11 updates a second is plenty
        lastLevelAt = now;
        setMic({ level, silent });
      },
      onLiveSource: setLiveSource,
      liveTranscribe: useAi ? (audio, previous) => api.liveTranscribe(audio, previous) : undefined,
    });
    sessionRef.current = s;
    setPhase('speak');
    s.start().then(({ status }) => {
      if (cancelled.current || sessionRef.current !== s) return;
      if (status !== 'ok' && status !== 'cancelled') setMicProblem(status);
    });
  }

  async function finishSpeaking() {
    if (phase !== 'speak') return;
    beep(520, 260);
    setPhase('saving');
    const { blob, wav, transcript, duration } = await sessionRef.current.stop();
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
        setError(`${translate('Could not save this answer:')} ${e.message}`);
        row = { ...attempt, id: `unsaved-${index}`, localBlob: blob, created_at: new Date().toISOString() };
      }
      if (blob) row = { ...row, localBlob: blob };
      row = { ...row, browser_transcript: transcript };
      // The careful AI transcript starts now, in the background, while the next question runs.
      if (useAi && !String(row.id).startsWith('unsaved') && (wav || blob) && duration >= 2) {
        transcriber.enqueue(row.id, { wav, blob, browserTranscript: transcript });
      }
    }
    const next = [...results, { step, row }];
    setResults(next);
    if (index + 1 < steps.length) beginStep(index + 1);
    else finishAll(next);
  }

  // Games score the words you used, so they wait for the careful transcript (live text as backup).
  async function finishAll(list) {
    let final = list;
    if (mode === 'game' && useAi && list.some(({ row }) => transcriber.get(row.id))) {
      setPhase('checking');
      final = await Promise.all(
        list.map(async (r) => {
          const res = await transcriber.wait(r.row.id, 40000);
          return res?.transcript ? { ...r, row: { ...r.row, transcript: res.transcript, transcript_segments: res.segments, transcript_source: 'ai' } } : r;
        }),
      );
      if (cancelled.current) return;
      setResults(final);
    }
    setPhase('done');
    onComplete?.(final);
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
              {t(PARTS[s.part].name)} · {stepLabel(t, s.label)}
              <small>
                {t('{prep}s to prepare · {talk} to talk', { prep: s.prep, talk: s.speak >= 60 ? t('{n} min', { n: s.speak / 60 }) : `${s.speak}s` })}
              </small>
            </li>
          ))}
        </ol>
        <InAppWarning />
        {micProblem && (
          <MicHelp
            status={micProblem}
            onRetry={begin}
            onSkip={() => {
              setMicProblem('');
              beginStep(0);
            }}
          />
        )}
        <p className="muted">🎧 {t('Find a quiet place. The examiner voice will read each question, then the timer starts.')}</p>
        <button className="btn btn--big" style={{ background: part.color }} disabled={checkingMic} onClick={begin}>
          {checkingMic ? `🎙️ ${t('Checking the microphone…')}` : `▶ ${t('Start')}`}
        </button>
        {checkingMic && <p className="notice">👆 {t('If your browser asks to use the microphone, tap “Allow”.')}</p>}
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="runner-done">
        <div className="card celebrate">
          <div className="celebrate__emoji">🎉</div>
          <h1>{t('Well done!')}</h1>
          <p>
            {t('Answers: {n} · Speaking time: {sec} seconds', {
              n: results.length,
              sec: Math.round(results.reduce((s, r) => s + (r.row.duration_sec || 0), 0)),
            })}
          </p>
          {mode === 'guest' ? (
            <Link className="btn btn--big" to="/signup">
              {t('Create a free account to save your progress')}
            </Link>
          ) : (
            <p className="muted">{t('Listen to yourself below and ask the AI coach for feedback.')}</p>
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
              <p>{t('Listen to the question…')}</p>
              <button className="btn btn--ghost" onClick={() => { stopSpeaking(); setPhase('prep'); }}>
                {t('Skip')}
              </button>
            </div>
          )}

          {phase === 'prep' && (
            <div className="runner__state">
              <TimerRing remaining={prepLeft} total={step.prep} color="var(--amber)" label={t('prepare')} />
              <p className="runner__hint">{t('Think about what you will say.')}</p>
              <button className="btn" style={{ background: part.color }} onClick={startSpeaking}>
                🎤 {t('I’m ready — start talking')}
              </button>
            </div>
          )}

          {phase === 'speak' && (
            <div className="runner__state">
              <TimerRing remaining={speakLeft} total={step.speak} color={part.color} label={t('speak')} />
              {micProblem ? (
                <MicHelp status={micProblem} />
              ) : (
                <>
                  <div className="rec-row">
                    <span className="rec-dot">● {t('Recording')}</span>
                    <MicMeter level={mic.level} silent={mic.silent > 6} />
                  </div>
                  {mic.silent > 6 && <p className="notice notice--warn mic-silent">🔇 {t('We can’t hear you. Speak louder, or check that your microphone is not muted or covered.')}</p>}
                </>
              )}
              <div className="live-box">
                <div className="live-box__head">
                  <span className="live-words">{t('{n} words', { n: words })}</span>
                  <span className={`live-source live-source--${liveSource}`}>
                    {liveSource === 'browser'
                      ? t('Live text')
                      : liveSource === 'ai'
                        ? t('Live text (AI, every few seconds)')
                        : liveSource === 'paused'
                          ? t('Live text paused')
                          : t('Listening…')}
                  </span>
                </div>
                <p className="live-transcript" ref={liveBoxRef}>
                  {live.final || live.interim ? (
                    <>
                      {live.final} <i>{live.interim}</i>
                    </>
                  ) : (
                    <span className="live-transcript__empty">
                      {liveSource === 'ai'
                        ? t('Keep talking — your words will appear here in a few seconds.')
                        : liveSource === 'paused' || (liveSource === 'none' && !useAi)
                          ? t('Keep talking — your full text will appear after you finish.')
                          : t('Start talking — your words will appear here.')}
                    </span>
                  )}
                </p>
              </div>
              <button className="btn btn--ghost" onClick={finishSpeaking}>
                ■ {t('I’ve finished')}
              </button>
            </div>
          )}

          {phase === 'saving' && (
            <div className="runner__state">
              <div className="spinner" />
              <p>{t('Saving your answer…')}</p>
            </div>
          )}

          {phase === 'checking' && (
            <div className="runner__state">
              <div className="spinner" />
              <p>{t('Checking your words carefully…')}</p>
            </div>
          )}

          {liveExtra && (phase === 'prep' || phase === 'speak') && liveExtra(`${live.final} ${live.interim}`, phase)}

          {showNotes && !hideNotes && (phase === 'prep' || phase === 'speak' || phase === 'listen') && (
            <label className="notes">
              <span>📝 {t('Your notes (only key words!)')}</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} placeholder={step.part === '3' ? 'Intro…\nFor…\nAgainst…\nMy opinion…' : 'When? Where? Who?\nWhat happened?\nHow did I feel?'} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QuestionView from './QuestionView.jsx';
import TimerRing from './TimerRing.jsx';
import AnswerReview from './AnswerReview.jsx';
import useCountdown from './useCountdown.js';
import { PARTS } from '../data/parts.js';
import MicMeter from './MicMeter.jsx';
import MicHelp, { InAppWarning } from './MicHelp.jsx';
import MicTest, { micTestedToday } from './MicTest.jsx';
import { beep, checkMicrophone, createSpeakingSession, primeSpeech, speak, stopSpeaking, unlockAudio } from '../../../shared/lib/speech.js';
import { analyse } from '../lib/metrics.js';
import { aiEnabled, api } from '../../../shared/lib/api.js';
import { transcriber } from '../lib/transcriber.js';
import { isOfflineError, queueAttempt } from '../lib/offline.js';
import { useApp } from '../../../app/state.jsx';
import { duckMusic, sfx } from '../../../shared/lib/sound.js';
import { stepLabel, translate, useT } from '../../../i18n/index.js';

/**
 * Runs answers exactly like the exam: question is read aloud → preparation timer → speaking timer.
 * Every answer is saved as soon as it is recorded. mode: 'practice' | 'mock' | 'workout' | 'game' | 'guest'
 */
export default function ExamRunner({ steps, mode = 'practice', title, intro, onComplete, renderExtra, liveExtra, hideNotes = false }) {
  const t = useT();
  const { addAttempt } = useApp() || {};
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | listen | prep | speak | saving | done
  const [results, setResults] = useState([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [mic, setMic] = useState({ level: 0, silent: 0 });
  const [micProblem, setMicProblem] = useState(''); // '' | blocked | no-mic | busy | unsupported | error
  const [checkingMic, setCheckingMic] = useState(false);
  const sessionRef = useRef(null);
  const resultsRef = useRef([]); // same as `results`, readable from background saves
  const savesRef = useRef([]); // answers still being saved
  const cancelled = useRef(false);
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

  // "Start": unlock sound and ask for the microphone now, not in the middle of the first answer.
  async function begin() {
    sfx('start');
    unlockAudio();
    primeSpeech(); // must happen inside the tap, or iPhones stay silent
    // First exam of the day: the "say this sentence" microphone check.
    if (!micTestedToday()) {
      setMicProblem('');
      setPhase('mictest');
      return;
    }
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
    setMic({ level: 0, silent: 0 });
    setMicProblem('');
    let lastLevelAt = 0;
    const s = createSpeakingSession({
      onLevel: (level, silent) => {
        const now = Date.now();
        if (now - lastLevelAt < 90) return; // ~11 updates a second is plenty
        lastLevelAt = now;
        setMic({ level, silent });
      },
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
    const { blob, getWav, transcript, duration } = await sessionRef.current.stop();
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
    const created_at = new Date().toISOString();
    let item;
    if (mode === 'guest') {
      item = { key: `guest-${index}`, step, row: { ...attempt, id: `guest-${index}`, localBlob: blob, created_at } };
    } else {
      // Go on at once; the answer is saved (and then written down by the AI) in the background.
      const id = crypto.randomUUID();
      item = { key: id, step, row: { ...attempt, id, created_at, localBlob: blob, saving: true } };
      savesRef.current.push(saveInBackground(id, attempt, blob, getWav, duration));
    }
    resultsRef.current = [...resultsRef.current, item];
    setResults(resultsRef.current);
    if (index + 1 < steps.length) beginStep(index + 1);
    else finishAll();
  }

  function patchResult(key, patch) {
    resultsRef.current = resultsRef.current.map((it) => (it.key === key ? { ...it, row: { ...it.row, ...patch } } : it));
    if (!cancelled.current) setResults(resultsRef.current);
  }

  async function saveInBackground(id, attempt, blob, getWav, duration) {
    try {
      const saved = await api.saveAttempt(attempt, blob, id);
      addAttempt?.(saved);
      if (useAi && (blob || getWav) && duration >= 2) transcriber.enqueue(id, { getWav, blob });
      patchResult(id, { ...saved, saving: false });
    } catch (e) {
      const patch = { saving: false, id: `unsaved-${id}` };
      // No internet: keep the answer on this phone and upload it automatically later.
      if (isOfflineError(e)) {
        try {
          await queueAttempt(attempt, blob, null);
          patch.offline = true;
        } catch {
          setError(`${translate('Could not save this answer:')} ${e.message}`);
        }
      } else setError(`${translate('Could not save this answer:')} ${e.message}`);
      patchResult(id, patch);
    }
  }

  // Games score the words you used, so they wait for the saves and the AI transcript.
  async function finishAll() {
    if (mode === 'game' && useAi) {
      setPhase('checking');
      await Promise.all(savesRef.current);
      const final = await Promise.all(
        resultsRef.current.map(async (r) => {
          const res = transcriber.get(r.row.id) ? await transcriber.wait(r.row.id, 40000) : null;
          return res?.transcript ? { ...r, row: { ...r.row, transcript: res.transcript, transcript_segments: res.segments, transcript_source: 'ai' } } : r;
        }),
      );
      if (cancelled.current) return;
      resultsRef.current = final;
      setResults(final);
    }
    setPhase('done');
    onComplete?.(resultsRef.current);
  }

  const prepLeft = useCountdown(step.prep, phase === 'prep', startSpeaking);
  const speakLeft = useCountdown(step.speak, phase === 'speak', finishSpeaking);

  if (phase === 'mictest') {
    return (
      <div className="card runner-ready">
        <MicTest
          onDone={() => beginStep(0)}
          onSkip={() => beginStep(0)}
          onCancel={() => setPhase('ready')}
        />
      </div>
    );
  }

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
        <button className="btn btn--ghost btn--small mictest-link" onClick={() => setPhase('mictest')}>
          🎙️ {t('Test my microphone')}
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
        {results.map(({ step: s, row, key }) => (
          <AnswerReview key={key} step={s} attempt={row} guest={mode === 'guest'} />
        ))}
      </div>
    );
  }

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
              <p className="rec-saved">
                💾 {t('Your voice is being recorded and saved. Just keep talking!')}
                <br />
                <small>{useAi ? t('Your text will appear about 10–15 seconds after you finish.') : t('You can listen to your recording after you finish.')}</small>
              </p>
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

          {liveExtra && (phase === 'prep' || phase === 'speak') && liveExtra('', phase)}

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

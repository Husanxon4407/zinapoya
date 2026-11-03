import { useEffect, useRef, useState } from 'react';
import MicMeter from './MicMeter.jsx';
import MicHelp, { InAppWarning } from './MicHelp.jsx';
import { checkMicrophone, createSpeakingSession, inAppBrowser, primeSpeech, unlockAudio } from '../lib/speech.js';
import { useT } from '../i18n/index.js';

const KEY = 'su_mic_ok';
const PHRASE = 'Hello, I am ready for my speaking test.';
const MAX_SEC = 6;

const today = () => new Date().toISOString().slice(0, 10);
/** The microphone test runs once a day, before the first exam of the day. */
export function micTestedToday() {
  try {
    return localStorage.getItem(KEY) === today();
  } catch {
    return false;
  }
}
function rememberPass() {
  try {
    localStorage.setItem(KEY, today());
  } catch {
    /* storage blocked */
  }
}

/**
 * "Say this phrase" microphone check. Everything happens on the phone (instant, works offline):
 * did the mic hear speech, was it loud enough, was it too loud — then the student hears the
 * recording back to judge if it sounds clear.
 * onDone() = start the exam. onSkip() = continue without a working test.
 */
export default function MicTest({ onDone, onSkip, onCancel }) {
  const t = useT();
  const [stage, setStage] = useState('intro'); // intro | recording | result | bad-sound | blocked
  const [result, setResult] = useState(null); // { ok, issue: 'silent'|'quiet'|'loud'|null }
  const [blocked, setBlocked] = useState('');
  const [level, setLevel] = useState(0);
  const [left, setLeft] = useState(MAX_SEC);
  const [url, setUrl] = useState(null);
  const sessionRef = useRef(null);
  const audioRef = useRef(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      sessionRef.current?.stop();
    };
  }, []);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  async function startTest() {
    unlockAudio();
    primeSpeech();
    setResult(null);
    setUrl(null);
    setLevel(0);
    setLeft(MAX_SEC);
    const status = await checkMicrophone();
    if (!alive.current) return;
    if (status !== 'ok') {
      setBlocked(status);
      setStage('blocked');
      return;
    }
    let spoke = 0; // seconds of speech so far
    let lastAt = Date.now();
    let stopping = false;
    const session = createSpeakingSession({
      onLevel: (lv, silent) => {
        const now = Date.now();
        if (lv > 0.15) spoke += (now - lastAt) / 1000;
        lastAt = now;
        setLevel(lv);
        // Finished speaking: some speech, then a short pause.
        if (!stopping && spoke > 1.2 && silent > 1.1) {
          stopping = true;
          finish();
        }
      },
    });
    sessionRef.current = session;
    setStage('recording');
    const started = Date.now();
    const timer = setInterval(() => {
      const remaining = Math.max(0, MAX_SEC - Math.floor((Date.now() - started) / 1000));
      setLeft(remaining);
      if (remaining === 0 && !stopping) {
        stopping = true;
        finish();
      }
    }, 250);
    const { status: s } = await session.start();
    if (s !== 'ok' && s !== 'cancelled') {
      clearInterval(timer);
      sessionRef.current = null;
      setBlocked(s);
      setStage('blocked');
      return;
    }
    async function finish() {
      clearInterval(timer);
      const rec = await session.stop();
      sessionRef.current = null;
      if (!alive.current) return;
      let issue = null;
      if (rec.measured) {
        if (rec.loudSeconds < 0.5) issue = 'silent';
        else if (rec.maxRms < 0.035) issue = 'quiet';
        else if (rec.maxRms > 0.6) issue = 'loud';
      } else if (!rec.blob) issue = 'silent';
      setResult({ ok: issue !== 'silent', issue });
      setStage('result');
      if (rec.blob && issue !== 'silent') {
        const u = URL.createObjectURL(rec.blob);
        setUrl(u);
        setTimeout(() => audioRef.current?.play().catch(() => {}), 150);
      }
    }
  }

  function pass() {
    rememberPass();
    unlockAudio();
    primeSpeech(); // this tap also lets the examiner voice speak on iPhones
    onDone();
  }

  const app = inAppBrowser();

  return (
    <div className="mictest">
      <h2>🎙️ {t('Microphone check')}</h2>

      {stage === 'intro' && (
        <>
          <p>{t('Before the test, let’s check that we can hear you. Tap the button and read this sentence aloud:')}</p>
          <p className="mictest__phrase">“{PHRASE}”</p>
          <InAppWarning />
          <div className="mictest__actions">
            <button className="btn btn--big" onClick={startTest}>
              🎙️ {t('Start the microphone check')}
            </button>
            {onCancel && (
              <button className="btn btn--ghost" onClick={onCancel}>
                {t('Back')}
              </button>
            )}
          </div>
        </>
      )}

      {stage === 'recording' && (
        <>
          <p>{t('Read aloud now:')}</p>
          <p className="mictest__phrase mictest__phrase--live">“{PHRASE}”</p>
          <div className="mictest__meter">
            <span className="rec-dot">● {t('Listening')}</span>
            <MicMeter level={level} />
            <span className="mictest__left">{left}s</span>
          </div>
        </>
      )}

      {stage === 'result' && result && (
        <>
          {result.issue === 'silent' ? (
            <div className="notice notice--warn mic-help">
              <b>🔇 {t('We could not hear you.')}</b>
              <p>{t('Please check:')}</p>
              <ul className="mictest__causes">
                <li>{t('Your microphone is not covered by your finger or phone case, and the phone is not muted.')}</li>
                <li>{t('Bluetooth earphones are connected? Their microphone may be off or far away — disconnect them or speak into them.')}</li>
                <li>{t('A call, Zoom, Telegram voice chat or another recording app may be using the microphone — close it.')}</li>
                <li>{t('On a computer: the right microphone is chosen and not muted in the sound settings.')}</li>
                {app && <li>{t('You are inside {app}: open Zinapoya in Chrome or Safari.', { app: app === 'app' ? t('another app') : app })}</li>}
                <li>{t('Speak a little louder and closer to the phone.')}</li>
              </ul>
              <div className="open-browser">
                <button className="btn btn--small" onClick={startTest}>
                  ↻ {t('Try again')}
                </button>
                <button className="btn btn--ghost btn--small" onClick={onSkip}>
                  {t('Continue anyway')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mictest__ok">✅ {t('Your microphone works!')}</p>
              {result.issue === 'quiet' && <p className="notice notice--warn">🔉 {t('Your voice is very quiet. Speak louder or hold the phone closer, so the AI can understand every word.')}</p>}
              {result.issue === 'loud' && <p className="notice notice--warn">📢 {t('Your voice is very loud and may sound broken. Hold the phone a little further away.')}</p>}
              {url && (
                <div className="mictest__play">
                  <p>{t('Listen to yourself. Is your voice clear?')}</p>
                  <audio ref={audioRef} controls src={url} className="audio" />
                </div>
              )}
              <div className="mictest__actions">
                <button className="btn btn--big" onClick={pass}>
                  👍 {t('Yes, it’s clear — start the test')}
                </button>
                <button className="btn btn--ghost" onClick={() => setStage('bad-sound')}>
                  👎 {t('No, it sounds bad')}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {stage === 'bad-sound' && (
        <div className="notice mic-help">
          <b>🛠️ {t('Let’s make it clearer:')}</b>
          <ul className="mictest__causes">
            <li>{t('Go to a quieter place, away from TV, music and other people talking.')}</li>
            <li>{t('Hold the phone about 20 cm (one hand) from your mouth, not too close.')}</li>
            <li>{t('Earphones with a microphone often sound clearer than the phone.')}</li>
            <li>{t('Don’t cover the bottom of the phone — the microphone is there.')}</li>
          </ul>
          <div className="open-browser">
            <button className="btn btn--small" onClick={startTest}>
              ↻ {t('Try again')}
            </button>
            <button className="btn btn--ghost btn--small" onClick={pass}>
              {t('Start the test anyway')}
            </button>
          </div>
        </div>
      )}

      {stage === 'blocked' && <MicHelp status={blocked} onRetry={startTest} onSkip={onSkip} />}
    </div>
  );
}

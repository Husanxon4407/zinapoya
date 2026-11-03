// Browser speech helpers: text-to-speech, speech recognition, recording and beeps.
import { PcmCollector, RATE, wavBase64 } from './audio.js';

export function speak(text, { rate = 0.95 } = {}) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    u.rate = rate;
    const voice = pickVoice();
    if (voice) u.voice = voice;
    // Some browsers never fire onend; never block the exam on it.
    const fallback = setTimeout(resolve, Math.max(3000, text.length * 90));
    u.onend = u.onerror = () => {
      clearTimeout(fallback);
      resolve();
    };
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /en-GB/i.test(v.lang) && /female|google|natural/i.test(v.name)) ||
    voices.find((v) => /en-GB/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null
  );
}

// One shared AudioContext for beeps and the microphone meter. Browsers only allow sound after a tap,
// so call unlockAudio() from a click (the exam "Start" button) before it is needed.
let audioCtx;
function sharedCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx || audioCtx.state === 'closed') audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}
export function unlockAudio() {
  try {
    sharedCtx();
  } catch {
    /* sound is optional */
  }
}

export function beep(freq = 880, ms = 180) {
  try {
    const ctx = sharedCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
  } catch {
    /* sound is optional */
  }
}

export const recognitionSupported = () =>
  typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export const recordingSupported = () =>
  typeof window !== 'undefined' && !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

/** Telegram, Instagram, Facebook… open links in their own small browser, where the microphone often fails. */
export function inAppBrowser() {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/Telegram/i.test(ua) || typeof window.TelegramWebviewProxy !== 'undefined') return 'Telegram';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook';
  // iOS app webviews have no "Safari" in the user agent.
  if (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua)) return 'app';
  if (/; wv\)/.test(ua)) return 'app';
  return null;
}

export const isIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent || '');

const MIC_CONSTRAINTS = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } };

function micError(err) {
  const name = err?.name || '';
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'blocked';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || name === 'OverconstrainedError') return 'no-mic';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy';
  return 'error';
}

/**
 * Asks for the microphone once (on the exam "Start" tap), so the permission question never appears
 * in the middle of an answer and a blocked microphone is found before the exam begins.
 * Resolves to 'ok' | 'blocked' | 'no-mic' | 'busy' | 'unsupported' | 'error'.
 */
export async function checkMicrophone() {
  if (!recordingSupported()) return 'unsupported';
  try {
    const stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
    stream.getTracks().forEach((t) => t.stop());
    return 'ok';
  } catch (err) {
    console.warn('Microphone check failed', err);
    return micError(err);
  }
}

const LOUD = 0.012; // RMS above this counts as "the student is making sound"
const LIVE_EVERY_SEC = 10; // AI live text: send a new piece of sound this often
const LIVE_MIN_SEC = 2.5;

/**
 * Records one answer.
 * - The microphone is opened once; the same sound feeds the recording file, the level meter and
 *   the raw 16 kHz copy the AI uses for the accurate transcript.
 * - Live words come from the browser's speech recognition. If it does not exist or stops working
 *   (common on phones and in Telegram), `liveTranscribe(wavBase64, previousText)` is used instead:
 *   a new piece of sound is sent to the AI about every 10 seconds.
 *
 * Callbacks:
 *   onTranscript(finalText, interimText)
 *   onLevel(level 0..1, silentSeconds)
 *   onLiveSource('browser' | 'ai' | 'none' | 'paused')
 */
export function createSpeakingSession({ onTranscript, onLevel, onLiveSource, liveTranscribe } = {}) {
  let stream, recorder, recognition, source, processor, sink, pcm;
  const chunks = [];
  let browserFinal = '';
  let browserInterim = '';
  let aiText = '';
  let active = false;
  let startedAt = 0;
  let liveSource = 'none';
  let lastLoudAt = 0;
  let loudSeconds = 0;
  let browserResults = 0;
  let browserErrors = 0;
  let restarts = 0;
  let liveOffset = 0;
  let livePending = false;
  let liveFailures = 0;
  let healthTimer = null;
  let liveTimer = null;

  const usingAi = () => liveSource === 'ai' || (liveSource === 'paused' && aiText);
  const shownText = () => (usingAi() ? aiText : browserFinal).trim();
  const emit = () => onTranscript?.(shownText(), liveSource === 'browser' ? browserInterim.trim() : '');
  const setSource = (s) => {
    if (liveSource === s) return;
    liveSource = s;
    onLiveSource?.(s);
    emit();
  };

  // ---------- browser speech recognition ----------
  function startRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    try {
      recognition = new SR();
    } catch {
      return false;
    }
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) browserFinal += r[0].transcript.trim() + ' ';
        else interim += r[0].transcript;
      }
      browserInterim = interim;
      browserResults++;
      browserErrors = 0;
      if (liveSource === 'none') setSource('browser');
      emit();
    };
    recognition.onerror = (e) => {
      browserErrors++;
      // These never fix themselves during this answer: stop trying and use the AI live text.
      if (['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported'].includes(e.error)) failBrowser();
      else if (e.error === 'network' && browserErrors >= 2) failBrowser();
    };
    // Chrome stops after a pause. Keep the words it was still working on, then listen again.
    recognition.onend = () => {
      if (browserInterim.trim()) {
        browserFinal += browserInterim.trim() + ' ';
        browserInterim = '';
        emit();
      }
      if (!active || !recognition) return;
      restarts++;
      if (restarts > 60 || browserErrors > 6) return failBrowser();
      const r = recognition;
      setTimeout(() => {
        if (!active || recognition !== r) return;
        try {
          r.start();
        } catch {
          /* already running */
        }
      }, Math.min(1500, 150 * browserErrors));
    };
    try {
      recognition.start();
      return true;
    } catch {
      recognition = null;
      return false;
    }
  }

  function failBrowser() {
    const r = recognition;
    recognition = null;
    clearInterval(healthTimer);
    try {
      r?.abort();
    } catch {
      /* ignore */
    }
    if (active && !usingAi()) startAiLive();
  }

  // ---------- AI live text (fallback) ----------
  function startAiLive() {
    if (!liveTranscribe || !pcm) {
      setSource(browserFinal ? 'browser' : 'none');
      return;
    }
    // Words the browser already wrote stay on screen; the AI continues from here.
    if (browserInterim.trim()) browserFinal += browserInterim.trim() + ' ';
    browserInterim = '';
    aiText = browserFinal.trim();
    liveOffset = pcm.length;
    setSource('ai');
    clearInterval(liveTimer);
    liveTimer = setInterval(sendLivePiece, 1000);
  }

  async function sendLivePiece() {
    if (!active || livePending || !pcm || liveSource !== 'ai') return;
    const available = (pcm.length - liveOffset) / RATE;
    if (available < LIVE_EVERY_SEC) return;
    const cut = pcm.quietCut(1.5);
    const samples = pcm.slice(liveOffset, cut);
    if (samples.length / RATE < LIVE_MIN_SEC) return;
    liveOffset = cut;
    // Skip silent pieces: no request for nothing.
    let sq = 0;
    for (let i = 0; i < samples.length; i++) sq += samples[i] * samples[i];
    if (Math.sqrt(sq / samples.length) < LOUD / 3) return;
    livePending = true;
    try {
      const text = await liveTranscribe(wavBase64(samples), aiText.split(/\s+/).slice(-25).join(' '));
      liveFailures = 0;
      if (text) {
        aiText = `${aiText} ${text}`.trim();
        emit();
      }
    } catch (e) {
      liveFailures++;
      console.warn('Live text failed', e);
      // Daily limit or Google's limit: stop sending for this answer, the full text comes after.
      if (e?.status === 429 || liveFailures >= 3) {
        clearInterval(liveTimer);
        setSource('paused');
      }
    } finally {
      livePending = false;
    }
  }

  // Browser recognition "works" only if it writes something while the student is talking.
  function checkHealth() {
    if (!active || liveSource !== 'none' && liveSource !== 'browser') return;
    if (browserResults > 0) return;
    if (loudSeconds >= 4) failBrowser();
  }

  async function start() {
    active = true;
    startedAt = Date.now();
    lastLoudAt = Date.now();
    if (!recordingSupported()) {
      // Very old browsers: no recording, maybe browser text only.
      startRecognition();
      return { status: 'unsupported' };
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
    } catch (err) {
      console.warn('Microphone unavailable', err);
      active = false;
      return { status: micError(err) };
    }
    if (!active) {
      // Stopped while the microphone was opening.
      stream.getTracks().forEach((t) => t.stop());
      return { status: 'cancelled' };
    }
    startedAt = Date.now();

    try {
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'].find((m) => MediaRecorder.isTypeSupported?.(m));
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.start(1000);
    } catch (err) {
      console.warn('MediaRecorder failed', err);
      recorder = null;
    }

    // Raw sound for the level meter, the silence warning and the AI.
    try {
      const ctx = sharedCtx();
      if (ctx) {
        if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
        pcm = new PcmCollector(ctx.sampleRate);
        source = ctx.createMediaStreamSource(stream);
        processor = ctx.createScriptProcessor(4096, 1, 1);
        sink = ctx.createGain();
        sink.gain.value = 0; // the processor must be connected to run, but nobody should hear themselves
        processor.onaudioprocess = (e) => {
          if (!active) return;
          const input = e.inputBuffer.getChannelData(0);
          const rms = pcm.push(input);
          const now = Date.now();
          if (rms > LOUD) {
            lastLoudAt = now;
            loudSeconds += input.length / ctx.sampleRate;
          }
          onLevel?.(Math.min(1, rms * 12), (now - lastLoudAt) / 1000);
        };
        source.connect(processor);
        processor.connect(sink).connect(ctx.destination);
      }
    } catch (err) {
      console.warn('Level meter unavailable', err);
      pcm = null;
    }

    if (startRecognition()) healthTimer = setInterval(checkHealth, 1000);
    else startAiLive();
    return { status: recorder || pcm ? 'ok' : 'error' };
  }

  function stop() {
    const wasRecognising = !!recognition;
    active = false;
    clearInterval(healthTimer);
    clearInterval(liveTimer);
    const duration = Math.round((Date.now() - startedAt) / 1000);
    const r = recognition;
    recognition = null;
    try {
      r?.stop();
    } catch {
      /* ignore */
    }
    try {
      processor?.disconnect();
      source?.disconnect();
      sink?.disconnect();
    } catch {
      /* ignore */
    }
    return new Promise((resolve) => {
      const finish = () => {
        stream?.getTracks().forEach((t) => t.stop());
        const blob = chunks.length ? new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }) : null;
        // Give the browser a moment to deliver its last words.
        setTimeout(
          () => {
            const browserText = `${browserFinal} ${browserInterim}`.trim();
            const transcript = usingAi() ? aiText.trim() : browserText;
            let wav = null;
            try {
              if (pcm && pcm.seconds() >= 1) wav = wavBase64(pcm.slice());
            } catch (e) {
              console.warn('Could not prepare audio for the AI', e);
            }
            resolve({ blob, wav, transcript, duration, liveSource, heardSound: pcm ? loudSeconds >= 1 : true });
          },
          wasRecognising ? 700 : 50,
        );
      };
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = finish;
        try {
          recorder.stop();
        } catch {
          finish();
        }
      } else finish();
    });
  }

  return { start, stop };
}

/**
 * Listens for one short phrase (a word or a sentence) and returns what the browser heard.
 * Gives several guesses, because a slightly unclear word is often the 2nd or 3rd guess.
 * Returns { result: Promise<string[]>, stop() }.
 */
export function listenOnce({ timeoutMs = 8000, lang = 'en-US' } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let finish = () => {};
  const result = new Promise((resolve, reject) => {
    if (!SR) {
      reject(new Error('This browser cannot listen to speech. Please use Chrome, Edge or Safari.'));
      return;
    }
    recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    const heard = [];
    let done = false;
    const timer = setTimeout(() => finish(), timeoutMs);
    finish = (err) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
      if (err) reject(err);
      else resolve(heard);
    };
    recognition.onresult = (e) => {
      for (const res of e.results) for (let i = 0; i < res.length; i++) heard.push(res[i].transcript);
      finish();
    };
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') finish(new Error('The microphone is blocked. Allow the microphone for this site, then try again.'));
      else finish();
    };
    recognition.onend = () => finish();
    try {
      recognition.start();
    } catch (e) {
      finish(e);
    }
  });
  return { result, stop: () => finish() };
}

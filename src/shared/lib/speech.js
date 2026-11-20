// Browser speech helpers: text-to-speech, recording, microphone checks, beeps and one-phrase listening.
import { PcmCollector, wavBase64 } from '../../features/speaking/lib/audio.js';

/**
 * The examiner voice. Never makes the student wait:
 * - prefers voices that live on the phone/computer (they start at once and work offline);
 * - if speech has not started after 2.5 s (blocked, no voice, slow internet voice), it gives up
 *   and the exam goes on — the question is on the screen anyway.
 */
export function speak(text, { rate = 0.95 } = {}) {
  return new Promise((resolve) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return resolve();
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    u.rate = rate;
    const voice = pickVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    let done = false;
    let started = false;
    let endTimer = null;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(startTimer);
      clearTimeout(endTimer);
      resolve();
    };
    const begin = () => {
      if (started) return;
      started = true;
      // Some browsers never fire onend; never block the exam on it.
      endTimer = setTimeout(finish, (text.length * 85) / rate + 3000);
    };
    const startTimer = setTimeout(() => {
      if (synth.speaking) return begin(); // speaking, just no onstart event
      synth.cancel();
      finish();
    }, 2500);
    u.onstart = begin;
    u.onend = finish;
    u.onerror = finish;
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}

/**
 * iPhones only allow speech that starts from a tap. Call this inside a click handler
 * (the exam "Start" button) and later questions can be read aloud automatically.
 */
export function primeSpeech() {
  try {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech is optional */
  }
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  const en = voices.filter((v) => /^en/i.test(v.lang));
  const local = en.filter((v) => v.localService);
  return (
    local.find((v) => /en[-_]GB/i.test(v.lang) && /female|natural|serena|kate|daniel|libby|sonia/i.test(v.name)) ||
    local.find((v) => /en[-_]GB/i.test(v.lang)) ||
    local.find((v) => /en[-_]US/i.test(v.lang)) ||
    local[0] ||
    en.find((v) => /en[-_]GB/i.test(v.lang)) ||
    en[0] ||
    null
  );
}
// Voices load a moment after the page opens in Chrome.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.getVoices();

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

/**
 * Records one answer. The microphone is opened once; the same sound feeds the recording file,
 * the level meter (so students see they are heard) and a raw 16 kHz copy for the AI transcript.
 * No live speech-to-text runs at the same time: on phones it fights with the recording.
 *
 * onLevel(level 0..1, silentSeconds)
 */
export function createSpeakingSession({ onLevel } = {}) {
  let stream, recorder, source, processor, sink, pcm;
  const chunks = [];
  let active = false;
  let startedAt = 0;
  let lastLoudAt = 0;
  let loudSeconds = 0;
  let maxRms = 0;

  async function start() {
    active = true;
    startedAt = Date.now();
    lastLoudAt = Date.now();
    if (!recordingSupported()) return { status: 'unsupported' };
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
    lastLoudAt = Date.now();

    try {
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'].find((m) => MediaRecorder.isTypeSupported?.(m));
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
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
          if (rms > maxRms) maxRms = rms;
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
    return { status: recorder || pcm ? 'ok' : 'error' };
  }

  function stop() {
    active = false;
    const duration = Math.round((Date.now() - startedAt) / 1000);
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
        // The big WAV copy is only made if the AI ever needs it (usually it reads the small saved file).
        const samples = pcm && pcm.seconds() >= 1 ? pcm : null;
        const getWav = samples
          ? () => {
              try {
                return wavBase64(samples.slice());
              } catch (e) {
                console.warn('Could not prepare audio for the AI', e);
                return null;
              }
            }
          : null;
        resolve({ blob, getWav, transcript: '', duration, heardSound: pcm ? loudSeconds >= 1 : true, loudSeconds, maxRms, measured: !!pcm });
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

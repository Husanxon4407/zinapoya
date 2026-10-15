// Browser speech helpers: text-to-speech, speech recognition, recording and beeps.

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

let audioCtx;
export function beep(freq = 880, ms = 180) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch {
    /* sound is optional */
  }
}

export const recognitionSupported = () =>
  typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export const recordingSupported = () =>
  typeof window !== 'undefined' && !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

/**
 * Records audio and transcribes it at the same time.
 * onTranscript(finalText, interimText) is called as words arrive.
 */
export function createSpeakingSession({ onTranscript } = {}) {
  let stream, recorder, recognition;
  let chunks = [];
  let finalText = '';
  let active = false;
  let startedAt = 0;

  async function start() {
    active = true;
    startedAt = Date.now();
    finalText = '';
    chunks = [];

    if (recordingSupported()) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported?.(m));
        recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        recorder.start(1000);
      } catch (err) {
        console.warn('Microphone recording unavailable', err);
      }
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      recognition = new SR();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript.trim() + ' ';
          else interim += r[0].transcript;
        }
        onTranscript?.(finalText.trim(), interim.trim());
      };
      // Chrome stops listening after silences; keep it going while recording.
      recognition.onend = () => {
        if (active) {
          try {
            recognition.start();
          } catch {
            /* already started */
          }
        }
      };
      recognition.onerror = (e) => {
        if (e.error === 'not-allowed') active = false;
      };
      try {
        recognition.start();
      } catch {
        /* ignore */
      }
    }
  }

  function stop() {
    active = false;
    const duration = Math.round((Date.now() - startedAt) / 1000);
    try {
      recognition?.stop();
    } catch {
      /* ignore */
    }
    return new Promise((resolve) => {
      const finish = () => {
        stream?.getTracks().forEach((t) => t.stop());
        const blob = chunks.length ? new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }) : null;
        // Give recognition a moment to deliver its last words.
        setTimeout(() => resolve({ blob, transcript: finalText.trim(), duration }), 600);
      };
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = finish;
        recorder.stop();
      } else finish();
    });
  }

  return { start, stop };
}

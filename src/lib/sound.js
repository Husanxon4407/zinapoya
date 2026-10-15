// All sounds are generated in the browser with the Web Audio API:
// no audio files to download and no copyright issues.

let ctx;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  },
};

/* ------------------------------------------------------------------ */
/* Sound effects                                                       */
/* ------------------------------------------------------------------ */
let sfxOn = store.get('su_sfx', true);
export const sfxEnabled = () => sfxOn;
export function setSfx(on) {
  sfxOn = on;
  store.set('su_sfx', on);
}

function tone(freq, start, dur, { type = 'sine', vol = 0.18, slide } = {}) {
  const c = ac();
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(start, dur, vol = 0.08, freq = 2000) {
  const c = ac();
  const t = c.currentTime + start;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

const SOUNDS = {
  click: () => tone(660, 0, 0.06, { type: 'triangle', vol: 0.1 }),
  tick: () => tone(1200, 0, 0.03, { type: 'square', vol: 0.04 }),
  correct: () => {
    tone(784, 0, 0.12, { type: 'triangle' });
    tone(1175, 0.09, 0.22, { type: 'triangle' });
  },
  wrong: () => {
    tone(220, 0, 0.18, { type: 'sawtooth', vol: 0.08, slide: 150 });
    tone(196, 0.12, 0.25, { type: 'sawtooth', vol: 0.07, slide: 120 });
  },
  pop: () => tone(500, 0, 0.12, { type: 'sine', vol: 0.2, slide: 1100 }),
  combo: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.15, { type: 'triangle', vol: 0.12 })),
  whoosh: () => noise(0, 0.35, 0.12, 900),
  coin: () => {
    tone(988, 0, 0.08, { type: 'square', vol: 0.06 });
    tone(1319, 0.08, 0.3, { type: 'square', vol: 0.06 });
  },
  star: () => [880, 1109, 1319].forEach((f, i) => tone(f, i * 0.12, 0.3, { type: 'sine', vol: 0.14 })),
  win: () => {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.22, { type: 'triangle', vol: 0.14 }));
    noise(0.55, 0.4, 0.05, 4000);
  },
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.3, { type: 'triangle', vol: 0.12 })),
  start: () => [392, 523, 659].forEach((f, i) => tone(f, i * 0.08, 0.14, { type: 'triangle', vol: 0.12 })),
  flip: () => [0, 0.08, 0.16, 0.24].forEach((s) => noise(s, 0.06, 0.08, 3000)),
};

export function sfx(name) {
  if (!sfxOn) return;
  try {
    SOUNDS[name]?.();
  } catch {
    /* sound is optional */
  }
}

/* ------------------------------------------------------------------ */
/* Background study music: a soft, slowly changing lo-fi loop          */
/* ------------------------------------------------------------------ */
const CHORDS = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 349.23], // G7
];
const MELODY = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C pentatonic
const BEAT = 60 / 68; // slow tempo

const music = {
  playing: false,
  ducked: false,
  volume: store.get('su_music_vol', 0.5),
  master: null,
  timer: null,
  nextTime: 0,
  bar: 0,
  listeners: new Set(),
};

export const musicState = () => ({ playing: music.playing, volume: music.volume });
export function onMusicChange(cb) {
  music.listeners.add(cb);
  return () => {
    music.listeners.delete(cb);
  };
}
const notify = () => music.listeners.forEach((cb) => cb(musicState()));

function targetGain() {
  return music.ducked ? 0 : music.volume * 0.35;
}

function pad(freq, t, dur) {
  const c = ac();
  const o1 = c.createOscillator();
  const o2 = c.createOscillator();
  o1.type = 'sine';
  o2.type = 'triangle';
  o1.frequency.value = freq;
  o2.frequency.value = freq * 1.003; // gentle chorus
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.05, t + 1.2);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o1.connect(g);
  o2.connect(g);
  g.connect(music.filter);
  o1.start(t);
  o2.start(t);
  o1.stop(t + dur + 0.1);
  o2.stop(t + dur + 0.1);
}

function bell(freq, t) {
  const c = ac();
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  o.connect(g);
  g.connect(music.filter);
  g.connect(music.delay);
  o.start(t);
  o.stop(t + 2);
}

function softKick(t) {
  const c = ac();
  const o = c.createOscillator();
  o.frequency.setValueAtTime(120, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
  const g = c.createGain();
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(music.master);
  o.start(t);
  o.stop(t + 0.35);
}

function scheduleBar(t) {
  const chord = CHORDS[music.bar % CHORDS.length];
  const barLen = BEAT * 4;
  chord.forEach((f) => pad(f / 2, t, barLen + 0.8));
  pad(chord[0] / 4, t, barLen + 0.8); // bass
  softKick(t);
  softKick(t + BEAT * 2.5);
  // A few random melody notes per bar.
  for (let i = 0; i < 4; i++) {
    if (Math.random() < 0.55) bell(MELODY[Math.floor(Math.random() * MELODY.length)], t + i * BEAT + (Math.random() < 0.3 ? BEAT / 2 : 0));
  }
  music.bar++;
}

export function startMusic() {
  const c = ac();
  if (music.playing) return;
  music.master = c.createGain();
  music.master.gain.setValueAtTime(0.0001, c.currentTime);
  music.master.gain.linearRampToValueAtTime(targetGain(), c.currentTime + 2);
  music.filter = c.createBiquadFilter();
  music.filter.type = 'lowpass';
  music.filter.frequency.value = 1400;
  music.delay = c.createDelay();
  music.delay.delayTime.value = BEAT * 0.75;
  const fb = c.createGain();
  fb.gain.value = 0.35;
  music.delay.connect(fb).connect(music.delay);
  music.delay.connect(music.filter);
  music.filter.connect(music.master).connect(c.destination);

  music.nextTime = c.currentTime + 0.1;
  music.timer = setInterval(() => {
    while (music.nextTime < ac().currentTime + 1.5) {
      scheduleBar(music.nextTime);
      music.nextTime += BEAT * 4;
    }
  }, 300);
  music.playing = true;
  store.set('su_music', true);
  notify();
}

export function stopMusic() {
  if (!music.playing) return;
  const c = ac();
  clearInterval(music.timer);
  const m = music.master;
  m.gain.cancelScheduledValues(c.currentTime);
  m.gain.setValueAtTime(m.gain.value, c.currentTime);
  m.gain.linearRampToValueAtTime(0.0001, c.currentTime + 0.8);
  setTimeout(() => m.disconnect(), 1000);
  music.playing = false;
  store.set('su_music', false);
  notify();
}

export function setMusicVolume(v) {
  music.volume = v;
  store.set('su_music_vol', v);
  if (music.playing) music.master.gain.setTargetAtTime(targetGain(), ac().currentTime, 0.2);
  notify();
}

// Silence the music while the examiner speaks or the student records.
export function duckMusic(on) {
  music.ducked = on;
  if (music.playing) music.master.gain.setTargetAtTime(targetGain(), ac().currentTime, on ? 0.1 : 0.8);
}

export const musicWanted = () => store.get('su_music', false);

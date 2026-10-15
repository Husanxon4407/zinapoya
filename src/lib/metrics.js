// Free, instant speaking metrics calculated in the browser.

const FILLER_RE = /\b(um+|umm+|uh+|uhm+|er+|erm+|eh+|e+e+|ah+|hmm+|like|you know|i mean)\b/gi;

export function countWords(text) {
  return (text.match(/[A-Za-z']+/g) || []).length;
}

export function analyse(transcript, durationSec, targetSec) {
  const words = countWords(transcript);
  const minutes = Math.max(durationSec, 1) / 60;
  const wpm = Math.round(words / minutes);
  const fillers = (transcript.match(FILLER_RE) || []).length;
  const usedTime = targetSec ? Math.min(100, Math.round((durationSec / targetSec) * 100)) : null;
  return { words, wpm, fillers, durationSec, usedTime };
}

export function paceLabel(wpm) {
  if (!wpm) return { text: 'No speech detected', tone: 'muted' };
  if (wpm < 70) return { text: 'Too slow — try to keep talking', tone: 'warn' };
  if (wpm < 100) return { text: 'A little slow', tone: 'ok' };
  if (wpm <= 160) return { text: 'Great pace', tone: 'good' };
  return { text: 'Very fast — slow down a bit', tone: 'ok' };
}

// Words that show the past tense was used (for the Part 2 story game).
const IRREGULAR = 'was were had did went saw made took came got gave felt thought told said found knew left met began became brought bought taught caught kept lost won ran spent sat stood understood wrote spoke broke chose drove ate drank forgot heard paid sent slept'.split(' ');
export function pastTenseWords(text) {
  const words = (text.toLowerCase().match(/[a-z']+/g) || []);
  const found = new Set();
  for (const w of words) {
    if (IRREGULAR.includes(w) || (w.length > 4 && w.endsWith('ed') && !['need', 'feed', 'speed', 'seed'].includes(w))) found.add(w);
  }
  return [...found];
}

export function phrasesUsed(text, phrases) {
  const t = ` ${text.toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ')} `;
  return phrases.filter((p) => t.includes(` ${p.toLowerCase()} `));
}

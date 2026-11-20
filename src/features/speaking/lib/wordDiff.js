// Cross-check two transcripts of the same answer: the careful AI transcript and the live text the
// browser (or the live AI captions) wrote. Words the two heard differently, and words the AI itself
// marked as unclear ([[word]]), are the ones the student should listen to again.

const FILLER = /^(um+|uh+|er+|erm+|eh+|ah+|hmm+|mm+)$/;
export const norm = (w) => w.toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z0-9']/g, '');

/**
 * segments: [{ start_sec, text }] (text may contain [[unclear]] words)
 * otherText: the live transcript to compare with ('' = nothing to compare)
 * Returns [{ start_sec, tokens: [{ text, unclear, differs, alt, index }] }]
 * where `index` numbers the words across the whole transcript.
 */
export function checkWords(segments = [], otherText = '') {
  const out = [];
  const flat = [];
  for (const seg of segments) {
    const tokens = [];
    // Keep "[[two words]]" together, otherwise split on spaces.
    const parts = String(seg.text || '').match(/\[\[[^\]]*\]\]\S*|\S+/g) || [];
    for (const raw of parts) {
      const m = raw.match(/^\[\[([^\]]*)\]\](\S*)$/);
      const words = m ? `${m[1]}${m[2]}`.split(/\s+/) : [raw];
      for (const text of words) {
        if (!text) continue;
        const tok = { text, unclear: !!m, differs: false, alt: null, index: flat.length };
        tokens.push(tok);
        flat.push(tok);
      }
    }
    out.push({ start_sec: Number(seg.start_sec) || 0, tokens });
  }

  const other = (otherText.match(/\S+/g) || []).map((t) => norm(t)).filter(Boolean);
  if (other.length < 5) return out; // nothing worth comparing

  const a = flat.map((t) => norm(t.text));
  const n = a.length;
  const m = other.length;
  if (!n || n * m > 600000) return out; // very long answers: skip the check rather than freeze the phone

  // Longest common subsequence of words.
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] && a[i] === other[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Walk through; between two matching words, the AI words and the live words that don't match
  // are "heard differently".
  let i = 0;
  let j = 0;
  let runA = [];
  let runB = [];
  const flush = () => {
    const alt = runB.slice(0, 5).join(' ');
    for (const k of runA) {
      if (!a[k] || FILLER.test(a[k])) continue;
      flat[k].differs = true;
      flat[k].alt = alt || null; // null: the live text missed this word
    }
    runA = [];
    runB = [];
  };
  while (i < n && j < m) {
    if (a[i] && a[i] === other[j]) {
      flush();
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) runA.push(i++);
    else runB.push(other[j++]);
  }
  while (i < n) runA.push(i++);
  while (j < m) runB.push(other[j++]);
  flush();

  // A single missing word with no alternative is usually just the live text being slow: only flag
  // words the live text actually heard as something else, plus the AI's own unclear words.
  for (const t of flat) if (t.differs && !t.alt) t.differs = false;
  return out;
}

/** Plain text from segments (removes the [[ ]] marks). */
export const segmentsText = (segments = []) =>
  segments
    .map((s) => s.text)
    .join(' ')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

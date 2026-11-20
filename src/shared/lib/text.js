// Find where a vocabulary term appears in a sentence: returns [start, end] or null.
export function findTerm(text, term) {
  const clean = term.replace(/\(.*?\)/g, '').trim();
  const i = text.toLowerCase().indexOf(clean.toLowerCase());
  if (i >= 0) {
    // Include word endings, e.g. cram → Cramming.
    let end = i + clean.length;
    while (end < text.length && /[a-z]/i.test(text[end])) end++;
    return [i, end];
  }
  // Otherwise match the word that starts like the term (memorise → memorising, apply for → applied for).
  const [firstRaw, ...rest] = clean.toLowerCase().split(/\s+/);
  const first = firstRaw.replace(/[^a-z-]/g, '');
  if (!first) return null;
  let stem = first;
  if (stem.length > 5) stem = stem.slice(0, -2);
  else if (/[ey]$/.test(stem) && stem.length > 3) stem = stem.slice(0, -1);
  const tail = rest.length ? `(?:\\s+${rest.join('\\s+')})?` : '';
  let m = new RegExp(`\\b${stem}[a-z]*${tail}`, 'i').exec(text);
  // Irregular phrasal verbs (bring up → brought up, take up → took up).
  if (!m && rest.length && rest.every((w) => PARTICLES.includes(w))) m = new RegExp(`\\b[a-z]+\\s+${rest.join('\\s+')}\\b`, 'i').exec(text);
  return m ? [m.index, m.index + m[0].length] : null;
}

const PARTICLES = ['up', 'down', 'out', 'on', 'off', 'for', 'after', 'in', 'away', 'back'];

// Does the spoken text contain this word (allowing simple endings like -s, -ed, -ing)?
export function saidWord(spoken, term) {
  const clean = term.replace(/\(.*?\)/g, '').trim().toLowerCase();
  const words = clean.split(/\s+/).map((w) => w.replace(/[^a-z']/g, ''));
  const last = words.pop();
  const stem = last.length > 4 && last.endsWith('e') ? last.slice(0, -1) : last;
  const pattern = [...words, `${stem}[a-z]{0,4}`].join("[\\s-]+");
  return new RegExp(`\\b${pattern}\\b`, 'i').test(spoken.replace(/[’]/g, "'"));
}

// Pronunciation checks: which words of the target did the browser hear?

const NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

export function words(text) {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9' -]+/g, ' ')
    .split(/[\s-]+/)
    .map((w) => w.replace(/'/g, '')) // it's = its: the browser often drops apostrophes
    .map((w) => (/^\d+$/.test(w) && NUMBERS[Number(w)] ? NUMBERS[Number(w)] : w))
    .filter(Boolean);
}

// The same word, allowing a plural -s / -es (the browser often adds or drops it).
const same = (a, b) => a === b || a === `${b}s` || b === `${a}s` || a === `${b}es` || b === `${a}es`;

// Marks each target word true/false using the longest common subsequence with what was heard.
function matchWords(target, heard) {
  const n = target.length;
  const m = heard.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) dp[i][j] = same(target[i], heard[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const marks = new Array(n).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (same(target[i], heard[j])) {
      marks[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return marks;
}

/**
 * Compares the target text with the browser's guesses and keeps the best one.
 * Returns { marks: boolean[] per target word, score: 0..1, heard: string }.
 */
export function checkSaid(target, guesses) {
  const t = words(target);
  let best = { marks: new Array(t.length).fill(false), score: 0, heard: guesses[0] || '' };
  guesses.forEach((g, i) => {
    const marks = matchWords(t, words(g));
    // The browser's first guess is what it really heard; a match only in a backup guess counts as "almost".
    const score = (t.length ? marks.filter(Boolean).length / t.length : 0) * (i === 0 ? 1 : 0.85);
    if (score > best.score) best = { marks, score, heard: g };
  });
  return best;
}

// Sounds that are often hard for Uzbek and Russian speakers, with a short tip for each.
export const TRICKY = [
  { text: 'think', tip: 'TH: put the tip of your tongue between your teeth and blow softly. Not “sink” or “fink”.' },
  { text: 'three', tip: 'TH + R: tongue between your teeth for TH, then a soft R. Not “tree”.' },
  { text: 'thank you', tip: 'TH: tongue between your teeth. Not “sank you”.' },
  { text: 'weather', tip: 'Voiced TH (like a buzzing D). W: round your lips, don’t touch your teeth.' },
  { text: 'clothes', tip: 'Ends with a buzzing TH + Z. One syllable: “clohthz”.' },
  { text: 'month', tip: 'End with TH, tongue between your teeth.' },
  { text: 'very well', tip: 'V: top teeth on your bottom lip. W: round lips, no teeth.' },
  { text: 'village', tip: 'V: top teeth touch your bottom lip.' },
  { text: 'wonderful', tip: 'W: start with round lips, like “oo”. Not “vonderful”.' },
  { text: 'world', tip: 'W + “er” + L + D: “wurld”. Round your lips first.' },
  { text: 'sheep', tip: 'Long “ee”: smile and hold it. Different from “ship”.' },
  { text: 'ship', tip: 'Short “i”: quick and relaxed. Different from “sheep”.' },
  { text: 'live', tip: 'Short “i” (to live). “Leave” has a long “ee”.' },
  { text: 'leave', tip: 'Long “ee” (to leave). “Live” has a short “i”.' },
  { text: 'full', tip: 'Short “u”, like “book”. “Fool” has a long “oo”.' },
  { text: 'worked', tip: '-ed sounds like T here: “workt”, one syllable.' },
  { text: 'asked', tip: '-ed sounds like T: “askt”. Don’t add an extra vowel.' },
  { text: 'comfortable', tip: 'Stress the first part: COMF-ta-ble (3 syllables).' },
  { text: 'vegetables', tip: 'Stress the first part: VEJ-ta-bles.' },
  { text: 'interesting', tip: 'Stress the first part: IN-tres-ting.' },
  { text: 'environment', tip: 'Stress the 2nd part: en-VI-ron-ment.' },
  { text: 'technology', tip: 'Stress the 2nd part: tech-NO-lo-gy.' },
  { text: 'photographer', tip: 'Stress the 2nd part: pho-TO-gra-pher (but PHO-to-graph).' },
  { text: 'I think the weather is very warm this month.', tip: 'TH, V and W in one sentence. Go slowly first.' },
  { text: 'My brother works in a big village with three schools.', tip: 'Watch TH, W and V.' },
  { text: 'We would rather live in the countryside than leave our village.', tip: 'Short “i” in live, long “ee” in leave.' },
  { text: 'There are three thousand people in this town.', tip: 'Many TH sounds: tongue between your teeth every time.' },
  { text: 'I asked my teacher and she helped me.', tip: '-ed sounds like T: “askt”, “helpt”.' },
  { text: 'Vegetables are very good for your health.', tip: 'VEJ-ta-bles, V in very, TH at the end of health.' },
  { text: 'I feel comfortable when the weather is warm.', tip: 'COMF-ta-ble, voiced TH in weather, W in warm.' },
  { text: 'Technology has changed the world we live in.', tip: 'tech-NO-lo-gy, W in world, short “i” in live.' },
];

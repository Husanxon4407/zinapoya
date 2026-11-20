// Official CEFR Multilevel WRITING rules (UzBMB, new format from October 2025).
// One source of truth for every number: bands, length rules, the 0–16 → 0–75 table, level cut-offs.
//
// Checked against the official documents (Nov 2026):
//   Task details: https://api-portal.gov.uz/uploads/165/2025/10/13/99dfbb36-0f1d-2c70-8a4e-e1382a5f255b_media_.pdf
//   Criteria:     https://api-portal.gov.uz/uploads/165/2025/10/13/b260e792-2fc6-630d-5bfe-399a2a0e55b6_media_.pdf
// When anything here disagrees with those PDFs, the PDFs win.
//
// ⚠️ The grading server (supabase/functions/writing/index.ts) has its own copy of countWords() and
// applyLengthCap(), because Edge Functions are deployed as one file. Change both together.

export const PARTS = {
  '1.1': { key: '1.1', name: 'Task 1.1', kind: 'Informal email', reader: 'A friend', register: 'informal', min: 40, max: 60, target: 50, maxBand: 5, level: 'B1', minutes: 10 },
  '1.2': { key: '1.2', name: 'Task 1.2', kind: 'Formal email', reader: 'A manager or organisation', register: 'formal', min: 120, max: 150, target: 135, maxBand: 5, level: 'B2', minutes: 15 },
  '2': { key: '2', name: 'Part 2', kind: 'Blog, forum post or article', reader: 'Online readers', register: 'neutral', min: 180, max: 200, target: 190, maxBand: 6, level: 'C1', minutes: 35 },
};
export const PART_KEYS = ['1.1', '1.2', '2'];

// Official advice: the whole paper is 60 minutes, about 25 for Part 1 (both emails) and 35 for Part 2.
export const PAPER_MINUTES = 60;
export const PART1_MINUTES = 25;
export const PART2_MINUTES = 35;

// What each band means (official descriptors, short labels).
export const BAND_LABELS = {
  '1.1': ['No answer', 'A1 or below', 'A2', 'Lower B1', 'Upper B1', 'B2 or above'],
  '1.2': ['Below A2', 'A2', 'B1', 'Lower B2', 'Upper B2', 'C1 or above'],
  '2': ['Below A2', 'A2', 'B1', 'Lower B2', 'Upper B2', 'C1', 'Above C1'],
};

/** Label for a part band; x.5 bands (two checks averaged) read "between". */
export function bandLabel(part, band) {
  const labels = BAND_LABELS[part];
  if (!labels || band == null) return '';
  if (Number.isInteger(band)) return labels[band] ?? '';
  return `${labels[Math.floor(band)]} – ${labels[Math.ceil(band)]}`;
}

// Official UzBMB table: raw total (1.1 + 1.2 + Part 2, max 16, steps of 0.5) → standard score 0–75. Do not change.
export const WRITING_RAW_TO_75 = {
  16: 75, 15.5: 72, 15: 69, 14.5: 67, 14: 65, 13.5: 64, 13: 63, 12.5: 62, 12: 61, 11.5: 59, 11: 57,
  10.5: 55, 10: 53, 9.5: 51, 9: 50, 8.5: 48, 8: 47, 7.5: 45, 7: 43, 6.5: 41, 6: 40, 5.5: 38, 5: 37,
  4.5: 35, 4: 33, 3.5: 31, 3: 28, 2.5: 25, 2: 21, 1.5: 17, 1: 14, 0.5: 10, 0: 0,
};

const roundHalf = (n) => Math.round(n * 2) / 2;
const clampRaw = (n) => Math.max(0, Math.min(16, roundHalf(n)));

/** 0–16 raw → 0–75. */
export const rawTo75 = (raw) => WRITING_RAW_TO_75[clampRaw(raw)];

/** Level on the 0–75 scale (UzBMB cut-offs). This is the WRITING level, not the CEFR certificate level. */
export function levelFrom75(score) {
  if (score >= 65) return 'C1';
  if (score >= 51) return 'B2';
  if (score >= 38) return 'B1';
  return 'Below B1';
}

/** Full paper: the three part bands → raw, /75, level and an honest range (±0.5 raw). */
export function paperScore({ p11, p12, p2 }) {
  const raw = clampRaw(p11 + p12 + p2);
  const score = rawTo75(raw);
  return { raw, score, level: levelFrom75(score), low: rawTo75(raw - 0.5), high: rawTo75(raw + 0.5) };
}

/* ------------------------------------------------------------------ */
/* Word counting and the official length rules                          */
/* ------------------------------------------------------------------ */
// Sign-off lines of a letter ("Best wishes," "Yours faithfully,") — they and the name after them are not counted.
const SIGN_OFF =
  /^(best( wishes| regards)?|kind regards|warm regards|regards|yours (faithfully|sincerely|truly)|sincerely( yours)?|cheers|take care|love|all the best|see you( soon)?|talk soon|speak soon|write (back )?soon|thanks( again)?|thank you|many thanks|hugs|bye|with best wishes)[,!.]?$/i;

/** The text without the closing sign-off line and the name lines under it. */
export function stripSignature(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 4); i--) {
    if (SIGN_OFF.test(lines[i].trim())) return lines.slice(0, i).join('\n');
  }
  return lines.join('\n');
}

/**
 * Exam-style word count: words are split by spaces; "well-known" and "don't" count as one word;
 * numbers count; dashes and lone punctuation don't. The sign-off and name are not counted.
 */
export function countWords(text, { signature = false } = {}) {
  const body = signature ? String(text || '') : stripSignature(text);
  return body.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/**
 * Official length rules from the criteria PDF. Returns { band, cappedBy } — the band after the cap,
 * and a short reason when the cap lowered it.
 *   1.1: 50% of the length or less (≤ 25 words) → band 2 at most.
 *   1.2: 25–60 words → band 2 at most; 24 words or fewer → band 1 at most.
 *   Part 2: 38–90 words → band 2 at most; 37 words or fewer → band 1 at most.
 */
export function applyLengthCap(part, band, words) {
  let cap = null;
  if (words === 0) cap = 0;
  else if (part === '1.1' && words <= 25) cap = 2;
  else if (part === '1.2' && words <= 24) cap = 1;
  else if (part === '1.2' && words <= 60) cap = 2;
  else if (part === '2' && words <= 37) cap = 1;
  else if (part === '2' && words <= 90) cap = 2;
  if (cap === null || band <= cap) return { band, cappedBy: null };
  return { band: cap, cappedBy: words === 0 ? 'empty' : 'length' };
}

/** Where the word count sits for the editor's word bar: 'short' | 'low' | 'ok' | 'long'. */
export function lengthZone(part, words) {
  const p = PARTS[part];
  if (!p) return 'ok';
  const hardShort = part === '1.1' ? 25 : part === '1.2' ? 60 : 90;
  if (words <= hardShort) return 'short';
  if (words < p.min) return 'low';
  if (words > p.max) return 'long';
  return 'ok';
}

/** Single-part practice: the part band as a level name — never invent a /75 from one part. */
export function partSummary(part, band) {
  return { band, max: PARTS[part]?.maxBand ?? 5, label: bandLabel(part, band) };
}

// Checks every writing task against the official task rules (plan section 12, content QA).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PART1_SETS } from './part1Sets.js';
import { PART2_PROMPTS, GENRES } from './part2Prompts.js';
import { getTask } from './index.js';
import { countWords, PARTS } from '../rules.js';

// The input email without its greeting line and sender line.
const emailBody = (email) => {
  const lines = email.split('\n').filter((l) => l.trim());
  return lines.filter((l, i) => !(i === 0 && /^dear\b/i.test(l)) && !(i === lines.length - 1 && l.split(' ').length <= 6)).join(' ');
};

test('ids are unique', () => {
  const ids = [...PART1_SETS, ...PART2_PROMPTS].map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('bank size: 20 Part 1 sets and 20 Part 2 prompts (10 our own + 10 test books each)', () => {
  for (const list of [PART1_SETS, PART2_PROMPTS]) {
    assert.equal(list.length, 20);
    assert.equal(list.filter((x) => x.source === 'zinapoya').length, 10);
    assert.equal(list.filter((x) => x.source === 'book').length, 10);
    assert.ok(list.filter((x) => x.source === 'book').every((x) => x.ref), 'book content names its source');
  }
});

test('Part 1: exactly 3 action points (EN + UZ), both task instructions present', () => {
  for (const s of PART1_SETS) {
    assert.equal(s.points.length, 3, s.id);
    for (const p of s.points) assert.ok(p.text && p.uz, `${s.id}: point text and Uzbek`);
    assert.match(s.task11, /friend|family/i, s.id);
    assert.match(s.task12, /120/, s.id);
  }
});

test('our own Part 1 input emails are 50–80 words (official rule)', () => {
  for (const s of PART1_SETS.filter((x) => x.source === 'zinapoya')) {
    const n = countWords(emailBody(s.email), { signature: true });
    assert.ok(n >= 50 && n <= 80, `${s.id}: ${n} words`);
  }
});

test('our own Part 2 prompts are 30–50 words and have a question', () => {
  for (const p of PART2_PROMPTS.filter((x) => x.source === 'zinapoya')) {
    const n = countWords(p.prompt, { signature: true });
    assert.ok(n >= 30 && n <= 50, `${p.id}: ${n} words`);
    assert.match(p.prompt, /\?/, p.id);
    assert.ok(GENRES[p.genre], p.id);
  }
});

test('every sample answer outside the official length is flagged', () => {
  const check = (part, id, text, note) => {
    const n = countWords(text);
    const { min, max } = PARTS[part];
    // Task 1.1 asks for "about 50": allow 45–55 without a note.
    const ok = part === '1.1' ? n >= 45 && n <= 55 : n >= min && n <= max;
    if (!ok) assert.ok(note, `${id} ${part}: ${n} words needs a wordsNote`);
  };
  for (const s of PART1_SETS) for (const part of ['1.1', '1.2']) if (s.samples?.[part]) check(part, s.id, s.samples[part], s.wordsNote?.[part]);
  for (const p of PART2_PROMPTS) if (p.sample) check('2', p.id, p.sample, p.wordsNote);
});

test('getTask builds all three parts', () => {
  const t = getTask('1.2', 'phone-repair-delay');
  assert.equal(t.points.length, 3);
  assert.match(t.instruction, /120–150/);
  assert.equal(getTask('2', 'ai-tools-students').points.length, 0);
  assert.equal(getTask('2', 'nope'), null);
});

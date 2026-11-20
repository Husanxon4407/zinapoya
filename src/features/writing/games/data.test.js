import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGISTER_ITEMS, REGISTER_PAIRS, LETTERS, FIXES, POINT_ASKS } from './data.js';
import { PART1_SETS } from '../data/part1Sets.js';

test('Register Switch: enough items of both kinds, each explained in EN + UZ', () => {
  const formal = REGISTER_ITEMS.filter((x) => x.register === 'formal');
  const informal = REGISTER_ITEMS.filter((x) => x.register === 'informal');
  assert.ok(formal.length >= 25 && informal.length >= 25, `${formal.length} formal / ${informal.length} informal`);
  for (const x of REGISTER_ITEMS) assert.ok(x.text && x.why && x.uz, x.text);
  assert.equal(new Set(REGISTER_ITEMS.map((x) => x.text)).size, REGISTER_ITEMS.length, 'no duplicates');
  for (const p of REGISTER_PAIRS) assert.ok(p.formal && p.informal && p.formal !== p.informal);
});

test('Letter Puzzle: every letter has 5–7 blocks with a role, starting with a greeting and ending with a sign-off', () => {
  for (const l of LETTERS) {
    assert.ok(l.blocks.length >= 5 && l.blocks.length <= 7, l.id);
    assert.equal(l.blocks[0].role, 'Greeting', l.id);
    assert.equal(l.blocks.at(-1).role, 'Sign-off', l.id);
    assert.equal(new Set(l.blocks.map((b) => b.text)).size, l.blocks.length, `${l.id}: blocks are different`);
  }
  assert.ok(LETTERS.some((l) => l.register === 'formal') && LETTERS.some((l) => l.register === 'informal'));
});

test('Fix the Mistake: the wrong part is in the sentence, the fix differs, options are unique', () => {
  assert.ok(FIXES.length >= 40, `${FIXES.length} items`);
  for (const f of FIXES) {
    assert.ok(f.sentence.includes(f.wrong), `"${f.wrong}" in "${f.sentence}"`);
    assert.notEqual(f.options[0], f.wrong, f.sentence);
    assert.equal(new Set(f.options).size, f.options.length, f.sentence);
    assert.ok(f.explain && f.uz, f.sentence);
  }
});

test('Point Hunter: every asking sentence is really in that email', () => {
  for (const [id, asks] of Object.entries(POINT_ASKS)) {
    const set = PART1_SETS.find((s) => s.id === id);
    assert.ok(set, id);
    for (const a of asks) assert.ok(set.email.includes(a), `${id}: "${a}"`);
  }
  assert.ok(Object.keys(POINT_ASKS).length >= 10);
});

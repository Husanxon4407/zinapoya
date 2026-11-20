// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WRITING_RAW_TO_75, rawTo75, levelFrom75, paperScore, applyLengthCap, countWords, stripSignature, bandLabel, lengthZone } from './rules.js';

const OFFICIAL = [
  [16, 75], [15.5, 72], [15, 69], [14.5, 67], [14, 65], [13.5, 64], [13, 63], [12.5, 62], [12, 61], [11.5, 59], [11, 57],
  [10.5, 55], [10, 53], [9.5, 51], [9, 50], [8.5, 48], [8, 47], [7.5, 45], [7, 43], [6.5, 41], [6, 40], [5.5, 38], [5, 37],
  [4.5, 35], [4, 33], [3.5, 31], [3, 28], [2.5, 25], [2, 21], [1.5, 17], [1, 14], [0.5, 10], [0, 0],
];

test('conversion table has exactly the 33 official rows', () => {
  assert.equal(Object.keys(WRITING_RAW_TO_75).length, 33);
  for (const [raw, score] of OFFICIAL) assert.equal(rawTo75(raw), score, `raw ${raw}`);
});

test('level cut-offs', () => {
  const cases = [[0, 'Below B1'], [37, 'Below B1'], [38, 'B1'], [50, 'B1'], [51, 'B2'], [64, 'B2'], [65, 'C1'], [75, 'C1']];
  for (const [s, level] of cases) assert.equal(levelFrom75(s), level, `score ${s}`);
});

test('full paper score and range', () => {
  assert.deepEqual(paperScore({ p11: 3, p12: 3.5, p2: 3.5 }), { raw: 10, score: 53, level: 'B2', low: 51, high: 55 });
  assert.deepEqual(paperScore({ p11: 5, p12: 5, p2: 6 }), { raw: 16, score: 75, level: 'C1', low: 72, high: 75 });
  assert.deepEqual(paperScore({ p11: 0, p12: 0, p2: 0 }), { raw: 0, score: 0, level: 'Below B1', low: 0, high: 10 });
});

test('length caps at the official edges', () => {
  // 1.1: ≤ 25 words → max 2
  assert.equal(applyLengthCap('1.1', 4, 25).band, 2);
  assert.equal(applyLengthCap('1.1', 4, 26).band, 4);
  // 1.2: ≤ 24 → max 1; 25–60 → max 2; 61+ → no cap
  assert.equal(applyLengthCap('1.2', 4, 24).band, 1);
  assert.equal(applyLengthCap('1.2', 4, 25).band, 2);
  assert.equal(applyLengthCap('1.2', 4, 60).band, 2);
  assert.equal(applyLengthCap('1.2', 4, 61).band, 4);
  // Part 2: ≤ 37 → max 1; 38–90 → max 2; 91+ → no cap
  assert.equal(applyLengthCap('2', 5, 37).band, 1);
  assert.equal(applyLengthCap('2', 5, 38).band, 2);
  assert.equal(applyLengthCap('2', 5, 90).band, 2);
  assert.equal(applyLengthCap('2', 5, 91).band, 5);
  // A cap never raises a band, and says why it lowered one.
  assert.deepEqual(applyLengthCap('2', 1, 50), { band: 1, cappedBy: null });
  assert.deepEqual(applyLengthCap('1.2', 3, 40), { band: 2, cappedBy: 'length' });
  assert.deepEqual(applyLengthCap('1.1', 3, 0), { band: 0, cappedBy: 'empty' });
});

test('word count: hyphens and contractions are one word, sign-off and name are not counted', () => {
  assert.equal(countWords("I don't think it's a well-known café."), 7);
  assert.equal(countWords('Dear Sir or Madam,\n\nI am writing to complain.\n\nYours faithfully,\nAziz Karimov'), 9);
  assert.equal(countWords('Hi Jake!\nGuess what — we won 2 games!\nCheers,\nLola'), 8);
  assert.equal(countWords('   '), 0);
  assert.equal(stripSignature('Hello\nBest wishes,\nNodira').trim(), 'Hello');
});

test('band labels and word zones', () => {
  assert.equal(bandLabel('1.2', 3), 'Lower B2');
  assert.equal(bandLabel('2', 5.5), 'C1 – Above C1');
  assert.equal(lengthZone('1.2', 60), 'short');
  assert.equal(lengthZone('1.2', 100), 'low');
  assert.equal(lengthZone('1.2', 140), 'ok');
  assert.equal(lengthZone('1.2', 170), 'long');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { precheck, copiedShare, countParagraphs } from './precheck.js';

const ids = (r) => r.hints.map((h) => h.id).sort();

test('formal email: catches "Hi", a friendly sign-off and contractions, but not possessives', () => {
  const r = precheck('1.2', "Hi,\n\nI'm writing about the club's new rules. We don't like them.\n\nCheers,\nAziz");
  assert.deepEqual(ids(r), ['contractions', 'register', 'register-end']);
  assert.match(r.hints.find((h) => h.id === 'contractions').text, /I'm, don't/);
  assert.doesNotMatch(r.hints.find((h) => h.id === 'contractions').text, /club's/);
});

test('formal email done right has no warnings', () => {
  const r = precheck('1.2', 'Dear Sir or Madam,\n\nI am writing to complain about the changes.\n\nYours faithfully,\nAziz Karimov');
  assert.deepEqual(ids(r), []);
});

test('faithfully / sincerely rule', () => {
  assert.deepEqual(ids(precheck('1.2', 'Dear Sir or Madam,\n\nI am writing.\n\nYours sincerely,\nAziz')), ['faithfully']);
  assert.deepEqual(ids(precheck('1.2', 'Dear Ms Karimova,\n\nI am writing.\n\nYours faithfully,\nAziz')), ['faithfully']);
});

test('informal email to a friend with formal phrases', () => {
  const r = precheck('1.1', 'Dear Sir or Madam,\n\nThe gym is closed.\n\nYours faithfully,\nAziz');
  assert.deepEqual(ids(r), ['register', 'register-end']);
});

test('first language and copying', () => {
  assert.ok(ids(precheck('2', 'Men bu fikr bilan rozi emas, chunki bu yaxshi emas va kerak emas.')).includes('l1'));
  assert.ok(ids(precheck('2', 'Я думаю что это хорошо')).includes('l1'));
  const task = 'Is it better to live in a big city or a small town? Post your response giving reasons and examples.';
  assert.ok(copiedShare('Is it better to live in a big city or a small town? I think so.', task) > 0.3);
  assert.equal(copiedShare('I prefer quiet places because they help me relax after school.', task), 0);
});

test('paragraph counting', () => {
  assert.equal(countParagraphs('One.\n\nTwo.\n\nThree.'), 3);
  assert.equal(countParagraphs('Just one block of text.'), 1);
});

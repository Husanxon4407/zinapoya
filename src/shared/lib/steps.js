// Builds the list of "steps" (one step = one spoken answer) for each kind of practice.
import { PART1_1 } from '../../features/speaking/data/part1_1.js';
import { PART1_2 } from '../../features/speaking/data/part1_2.js';
import { PART2 } from '../../features/speaking/data/part2.js';
import { PART3 } from '../../features/speaking/data/part3.js';
import { TIMING } from '../../features/speaking/data/parts.js';

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function stepsP11(questions) {
  return questions.map((q, i) => ({
    part: '1.1',
    questionId: q.id,
    questionText: q.text,
    label: `Question ${i + 1}`,
    prompt: q.text,
    tts: q.text,
    ...TIMING.p11,
  }));
}

export function stepsP12(set) {
  const base = { part: '1.2', image: set.image, setTitle: set.title };
  return [
    { ...base, questionId: `${set.id}-q4`, questionText: `Describe and compare the two pictures (${set.title}). ${set.q4}`, label: 'Question 4', prompt: set.q4, tts: `Look at the pictures. ${set.q4}`, ...TIMING.p12q4 },
    { ...base, questionId: `${set.id}-q5`, questionText: set.q5, label: 'Question 5', prompt: set.q5, tts: set.q5, ...TIMING.p12q56 },
    { ...base, questionId: `${set.id}-q6`, questionText: set.q6, label: 'Question 6', prompt: set.q6, tts: set.q6, ...TIMING.p12q56 },
  ];
}

export function stepsP2(card) {
  return [
    {
      part: '2',
      questionId: card.id,
      questionText: card.questions.join(' '),
      label: card.title,
      prompt: 'Look at the card. Talk about your experience and answer all three questions.',
      list: card.questions,
      image: card.image,
      emoji: card.emoji,
      tts: `Part two. ${card.questions.join(' ')} You have one minute to prepare.`,
      ...TIMING.p2,
    },
  ];
}

export function stepsP3(topic) {
  return [
    {
      part: '3',
      questionId: topic.id,
      questionText: `Discuss the statement: "${topic.statement}" Arguments for: ${topic.for.join(' ')} Arguments against: ${topic.against.join(' ')}`,
      label: 'Part 3',
      prompt: topic.statement,
      table: { for: topic.for, against: topic.against },
      tts: `Part three. ${topic.statement} Talk about both sides and give your opinion. You have one minute to prepare.`,
      ...TIMING.p3,
    },
  ];
}

export function stepsForQuestion(part, id) {
  if (part === '1.1') {
    const q = PART1_1.find((x) => x.id === id);
    return q ? stepsP11([q]) : null;
  }
  if (part === '1.2') {
    const s = PART1_2.find((x) => x.id === id);
    return s ? stepsP12(s) : null;
  }
  if (part === '2') {
    const c = PART2.find((x) => x.id === id);
    return c ? stepsP2(c) : null;
  }
  if (part === '3') {
    const t = PART3.find((x) => x.id === id);
    return t ? stepsP3(t) : null;
  }
  return null;
}

export function randomSteps(part) {
  if (part === '1.1') return stepsP11(shuffle(PART1_1).slice(0, 3));
  if (part === '1.2') return stepsP12(pick(PART1_2));
  if (part === '2') return stepsP2(pick(PART2));
  return stepsP3(pick(PART3));
}

export function mockExamSteps() {
  return [...randomSteps('1.1'), ...randomSteps('1.2'), ...randomSteps('2'), ...randomSteps('3')];
}

export function workoutSteps(weakest) {
  const extra = weakest === '1.1' ? stepsP11(shuffle(PART1_1).slice(3, 6)) : randomSteps(weakest);
  return [...stepsP11(shuffle(PART1_1).slice(0, 3)), ...extra];
}

// How many distinct questions each part has (for progress rings).
export const PART_TOTALS = {
  '1.1': PART1_1.length,
  '1.2': PART1_2.length * 3,
  2: PART2.length,
  3: PART3.length,
};

// Exam structure and timings (Multilevel CEFR speaking exam).
export const PARTS = {
  '1.1': {
    key: '1.1',
    name: 'Part 1.1',
    title: 'About you',
    emoji: '🙋',
    color: 'var(--p11)',
    soft: 'var(--p11-soft)',
    timing: '3 questions · 30 sec each',
    what: 'Short personal questions. Answer directly, give a reason and an example.',
    tips: ['Answer the question in the first sentence.', 'Add a reason: “…because…”.', 'Add an example: “For example, last week I…”.'],
  },
  '1.2': {
    key: '1.2',
    name: 'Part 1.2',
    title: 'Compare pictures',
    emoji: '🖼️',
    color: 'var(--p12)',
    soft: 'var(--p12-soft)',
    timing: 'Q4 45 sec · Q5 & Q6 30 sec',
    what: 'Describe and compare two pictures, then answer two questions about the topic.',
    tips: ['Describe both pictures, not just one.', 'Use comparison words: “whereas”, “while”, “both”.', 'Say which one you prefer and why.'],
  },
  2: {
    key: '2',
    name: 'Part 2',
    title: 'Tell a story',
    emoji: '📖',
    color: 'var(--p2)',
    soft: 'var(--p2-soft)',
    timing: '1 min to prepare · 2 min to talk',
    what: 'Talk about a personal experience. Answer all three questions on the card.',
    tips: ['Cover all three questions.', 'Tell it like a story: when, where, who, what happened.', 'Use past tenses and finish with how you felt or what you learned.'],
  },
  3: {
    key: '3',
    name: 'Part 3',
    title: 'Argue a point',
    emoji: '⚖️',
    color: 'var(--p3)',
    soft: 'var(--p3-soft)',
    timing: '1 min to prepare · 2 min to talk',
    what: 'Discuss a statement using the For and Against arguments, then give your opinion.',
    tips: ['Introduce the topic in one sentence.', 'Explain arguments from both sides with linking words.', 'Finish with a clear conclusion and your own view.'],
  },
};

export const PART_KEYS = ['1.1', '1.2', '2', '3'];

// Prep and speaking seconds for each kind of question.
export const TIMING = {
  p11: { prep: 5, speak: 30 },
  p12q4: { prep: 10, speak: 45 },
  p12q56: { prep: 5, speak: 30 },
  p2: { prep: 60, speak: 120 },
  p3: { prep: 60, speak: 120 },
};

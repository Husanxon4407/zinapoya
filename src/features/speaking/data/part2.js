// Part 2 — a story about your own experience. Cards from Part 2.docx
// (6 written cards + 16 picture cards that were inside the document's images).
const textCards = [
  ['⚖️', 'Being honest', ['Tell me about a moment when you had to be honest although it was difficult.', 'How did the other person react to your honesty?', 'Why do you think it is important to be honest, even in challenging situations?']],
  ['🏆', 'An achievement', ['Tell me about a time when you achieved something important.', 'How did this achievement make you feel?', 'What do you think are the key factors to achieving success in life?']],
  ['💬', 'A piece of advice', ['Tell me about a time when you received a piece of advice.', 'How did this advice help you?', 'Do you think it is better to get advice from family or friends?']],
  ['🧗', 'A difficult task', ['Tell me about a difficult task you had to do.', 'How did you handle the task?', 'What are some common challenges that people face in their daily lives?']],
  ['🧭', 'An independent decision', ['Tell me about an important decision you made independently.', 'How did this decision impact your life?', 'How important is it to get advice while making a decision?']],
  ['🌱', 'A failure', ['Tell me about a time when you did something but failed.', 'How did this failure impact your life?', 'Is failure important for people to grow?']],
];

const pictureCards = [
  ['Your first phone', ['Describe a time when you first used your phone.', 'Is having a cell phone a good or bad thing?', 'Do most people in your country use mobile phones?']],
  ['Sport', ['Describe a sport which you have played or seen on TV.', 'Which do you prefer?', 'Do you think watching sports is as useful as playing them?']],
  ['The best book', ['Describe the best book that you have read.', 'How did it benefit you?', 'Would you recommend it to others?']],
  ['A critical decision', ['Tell me about a critical decision you have made.', 'How has this decision influenced you and your life?', 'What factors have the highest impact on the decisions people make?']],
  ['A special meal', ['Describe a special meal that someone prepared for you.', 'Who cooked it for you?', 'How did you feel about it?']],
  ['A great goal', ['Describe a time when you achieved a great goal.', 'Describe a person who influenced you.', 'How did you feel about this achievement?']],
  ['Sharing a secret', ['Describe a time when you shared a secret with others.', 'Describe the situation that led to sharing the secret.', 'Mention the people involved in the secret-sharing and the consequences.']],
  ['Feeling happy', ['Describe a time when you felt happy.', 'Why is it important to have a good mood?', 'Can money make people happy?']],
  ['A disagreement', ['Describe a time when you had a disagreement with someone.', 'When do people usually argue with each other?', 'What suggestions can you give to solve disagreements?']],
  ['A traditional occasion', ['Describe a traditional occasion which you are proud of.', 'Give me some information about the promotion of these holidays.', 'How can traditions be protected in an age of globalization?']],
  ['A family tradition', ['Describe a cultural or family tradition that you enjoy.', 'Why do you remember this event so well?', 'Is it important to learn about traditional festivals?']],
  ['Taking a risk', ['Describe a time when you took a big risk.', 'How did you feel about it?', 'Do you prefer taking risks or playing it safe?']],
  ['A new environment', ['Describe a time when you had to adapt to a new environment.', 'How did it change you?', 'Do younger or older people adapt more easily to changes?']],
  ['Lost trust', ['Describe a time you lost trust in a relative.', 'What happened after that?', 'Do people trust others as much as they used to in the past?']],
  ['A book that impressed you', ['Describe a book that left a strong impression on you.', 'What kind of books can have a positive influence on people?', 'How is reading a book different from watching a movie?']],
  ['A new skill', ['Describe a skill that you have learned recently.', 'How often do you use this new skill?', 'Do you believe that some skills are more important to learn than others?']],
];

export const PART2 = [
  ...textCards.map(([emoji, title, questions], i) => ({
    id: `p2-t${i + 1}`,
    title,
    emoji,
    image: null,
    questions,
  })),
  ...pictureCards.map(([title, questions], i) => ({
    id: `p2-p${String(i + 1).padStart(2, '0')}`,
    title,
    emoji: null,
    image: `/images/part2/card${String(i + 1).padStart(2, '0')}.jpg`,
    questions,
  })),
];

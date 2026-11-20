// Which parts of Zinapoya are free and which will need a paid plan.
// Everything is free for now. When payment arrives: switch a feature to 'paid' here and give
// accounts a `plan` — every locked part then shows an "Upgrade" card instead (components/Gate.jsx).
export const FEATURES = {
  'cefr.speaking': 'free',
  'cefr.mock': 'free',
  'cefr.ai-feedback': 'free',
  'cefr.games': 'free',
  'cefr.words': 'free',
  'cefr.writing': 'free',
};

export const hasAccess = (feature, plan = 'free') => !feature || (FEATURES[feature] ?? 'free') === 'free' || plan === 'pro';

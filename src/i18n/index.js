// Interface language: English, Uzbek (Latin) or Russian.
// The English text is the key, so anything without a translation simply stays in English.
// Exam questions, vocabulary and AI feedback are not translated: students practise those in English.
import { useCallback, useSyncExternalStore } from 'react';

export const LANGS = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'uz', label: 'O‘Z', name: 'O‘zbekcha' },
  { id: 'ru', label: 'РУ', name: 'Русский' },
];
// Each translation file is downloaded only when that language is used (keeps the first load small).
const DICTS = {};
const LOADERS = { uz: () => import('./uz.js'), ru: () => import('./ru.js') };

export async function loadLang(id) {
  if (!LOADERS[id] || DICTS[id]) return;
  try {
    DICTS[id] = (await LOADERS[id]()).default;
  } catch {
    /* offline and not cached yet: the text stays in English */
  }
}
const KEY = 'su_lang';

function readSaved() {
  try {
    const saved = localStorage.getItem(KEY);
    if (LANGS.some((l) => l.id === saved)) return saved;
  } catch {
    /* storage blocked */
  }
  return 'en';
}

// The first-visit language popup (LangPicker) is shown once per device, to new and existing
// visitors alike; after any choice (popup or 🌐 switch) it never comes back.
const ASKED = 'zp_lang_asked';
export function langAsked() {
  try {
    return localStorage.getItem(ASKED) === '1';
  } catch {
    return true; // storage blocked: the answer could not be remembered, so do not ask on every page
  }
}
function markAsked() {
  try {
    localStorage.setItem(ASKED, '1');
  } catch {
    /* storage blocked */
  }
}
// Saved language, if the visitor ever chose one (to highlight it in the popup).
export function savedLang() {
  try {
    const saved = localStorage.getItem(KEY);
    return LANGS.some((l) => l.id === saved) ? saved : null;
  } catch {
    return null;
  }
}

// The phone/browser language, when it is one we have (to pre-select it in the popup).
export function deviceLang() {
  const list = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
  for (const l of list) {
    const id = String(l || '').slice(0, 2).toLowerCase();
    if (LANGS.some((x) => x.id === id)) return id;
  }
  return 'en';
}

let lang = readSaved();
const listeners = new Set();
if (typeof document !== 'undefined') document.documentElement.lang = lang;

export const getLang = () => lang;

export async function setLang(id) {
  await loadLang(id); // switch only once the words are here, so the page never flashes English
  lang = id;
  markAsked();
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage blocked */
  }
  document.documentElement.lang = id;
  listeners.forEach((l) => l());
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// translate('Hello {name}', { name: 'Aziza' })
export function translate(text, vars, id = lang) {
  let s = (id !== 'en' && DICTS[id]?.[text]) || text;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

export function useLang() {
  return useSyncExternalStore(subscribe, getLang, () => 'en');
}

// const t = useT();  t('Home')
export function useT() {
  const id = useLang();
  return useCallback((text, vars) => translate(text, vars, id), [id]);
}

// A skill or subject name ("Listening", "Math"…). Uses the "Skill: …" translation when there is
// one, because a plain word like "Listening" is also the app's "Listening…" recording status.
export function skillName(t, name) {
  const key = `Skill: ${name}`;
  const out = t(key);
  return out === key ? t(name) : out;
}

// Step labels such as "Question 4" have a number inside.
export function stepLabel(t, label = '') {
  const m = /^Question (\d+)$/.exec(label);
  return m ? t('Question {n}', { n: m[1] }) : t(label);
}

// For toLocaleDateString: dates follow the chosen language.
export const dateLocale = (id = lang) => ({ en: 'en-GB', uz: 'uz-Latn-UZ', ru: 'ru-RU' })[id] || 'en-GB';

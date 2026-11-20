// Instant checks without AI (plan section 6.2). They run in the editor while the student types
// and again before the AI check. Each hint has English + Uzbek text.
import { countWords, PARTS } from './rules.js';

const INFORMAL_GREETING = /^(hi|hey|hello|hiya|dear\s+\p{Lu}\p{L}+(?!\s+(sir|madam)))\b/iu;
const FORMAL_GREETING = /^(dear\s+(sir|madam|sir or madam|sir\/madam|mr\.?|mrs\.?|ms\.?|miss|dr\.?|manager|president|team|customer service|club|secretary|organi[sz]ers?|librarian|committee|editor|director|principal|all)\b|to whom it may concern)/i;
const FORMAL_SIGNOFF = /^(yours (faithfully|sincerely)|kind regards|best regards|regards|sincerely)[,.]?$/i;
const INFORMAL_SIGNOFF = /^(best( wishes)?|cheers|take care|love|see you( soon)?|talk soon|speak soon|write (back )?soon|bye|hugs|all the best)[,!.]?$/i;
// Contractions in a formal letter. Possessives ("the club's") are fine, so "'s" is only flagged after pronouns.
const CONTRACTION = /\b(\w+n['’]t|(i|you|we|they|he|she|it|that|there|what|who|let)['’](m|re|ve|ll|d|s))\b/gi;
// A few very common Uzbek words written in Latin letters (a sign of writing in the first language).
const UZBEK_WORDS = /\b(va|uchun|bilan|lekin|emas|kerak|men|sizga|bu|shu|qilish|bo['’‘]?lib|bo['’‘]?ladi|yaxshi|rahmat|salom|ham|endi|chunki)\b/gi;

const lines = (text) => String(text || '').replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);

/** Paragraphs = blocks separated by an empty line (or single lines, if the student never leaves one). */
export function countParagraphs(text) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.length > 1 ? blocks.length : lines(text).length > 2 ? lines(text).length : blocks.length;
}

/** Share of the student's 5-word chunks that also appear in the task text (copying the prompt). */
export function copiedShare(text, source) {
  const words = (s) => String(s || '').toLowerCase().match(/[\p{L}\p{N}'’]+/gu) || [];
  const grams = (w) => new Set(w.slice(0, Math.max(0, w.length - 4)).map((_, i) => w.slice(i, i + 5).join(' ')));
  const mine = grams(words(text));
  if (mine.size < 3) return 0;
  const theirs = grams(words(source));
  let hit = 0;
  for (const g of mine) if (theirs.has(g)) hit++;
  return hit / mine.size;
}

/**
 * All instant checks for one text. Returns { words, paragraphs, hints: [{ id, tone, text, text_uz }] }.
 * tone: 'warn' (likely to cost marks) | 'tip' (worth fixing) | 'good'.
 */
export function precheck(part, text, { source = '' } = {}) {
  const words = countWords(text);
  const paragraphs = countParagraphs(text);
  const hints = [];
  const add = (id, tone, en, uz) => hints.push({ id, tone, text: en, text_uz: uz });
  const ls = lines(text);
  const first = ls[0] || '';
  const signOff = ls.slice(-3).find((l) => FORMAL_SIGNOFF.test(l) || INFORMAL_SIGNOFF.test(l)) || '';
  const p = PARTS[part];

  if (!words) return { words, paragraphs, hints };

  const letters = (String(text).match(/\p{L}/gu) || []).length;
  const cyrillic = (String(text).match(/\p{Script=Cyrillic}/gu) || []).length;
  const uzbek = (String(text).match(UZBEK_WORDS) || []).length;
  if (cyrillic > letters * 0.2 || uzbek >= Math.max(3, words * 0.08)) {
    add('l1', 'warn', 'Write in English only. Answers mostly in another language get band 0–1.', 'Faqat ingliz tilida yozing. Asosan boshqa tilda yozilgan javob 0–1 ball oladi.');
  }

  if (part === '1.1' || part === '1.2') {
    if (!FORMAL_GREETING.test(first) && !INFORMAL_GREETING.test(first)) {
      add('greeting', 'tip', 'Start with a greeting on its own line (for example "Dear Sir or Madam," or "Hi Aziz,").', 'Xatni alohida qatordagi salomlashuvdan boshlang (masalan "Dear Sir or Madam," yoki "Hi Aziz,").');
    }
    if (!signOff) {
      add('signoff', 'tip', 'End with a sign-off and your name (for example "Yours faithfully," or "Take care,").', 'Xatni xayrlashuv so‘zi va ismingiz bilan tugating (masalan "Yours faithfully," yoki "Take care,").');
    }
  }

  if (part === '1.1') {
    if (FORMAL_GREETING.test(first) && /sir|madam|manager|president|team/i.test(first)) {
      add('register', 'warn', 'This email is to a friend: use a friendly greeting like "Hi …," instead.', 'Bu xat do‘stga: "Hi …," kabi samimiy salomlashuvdan foydalaning.');
    }
    if (FORMAL_SIGNOFF.test(signOff) && /yours/i.test(signOff)) {
      add('register-end', 'warn', '"Yours faithfully/sincerely" is for formal letters. To a friend, write "Take care," or "Best,".', '"Yours faithfully/sincerely" rasmiy xat uchun. Do‘stga "Take care," yoki "Best," deb yozing.');
    }
  }

  if (part === '1.2') {
    if (/^(hi|hey|hello)\b/i.test(first)) {
      add('register', 'warn', 'A formal email should not start with "Hi". Use "Dear Sir or Madam," or "Dear Mr/Ms …,".', 'Rasmiy xat "Hi" bilan boshlanmaydi. "Dear Sir or Madam," yoki "Dear Mr/Ms …," yozing.');
    }
    if (INFORMAL_SIGNOFF.test(signOff)) {
      add('register-end', 'warn', `"${signOff.replace(/[,!.]$/, '')}" is too friendly for a formal email. Use "Yours faithfully," or "Kind regards,".`, `"${signOff.replace(/[,!.]$/, '')}" rasmiy xat uchun juda samimiy. "Yours faithfully," yoki "Kind regards," yozing.`);
    }
    if (/dear sir or madam|dear sir\/madam/i.test(first) && /yours sincerely/i.test(signOff)) {
      add('faithfully', 'tip', 'After "Dear Sir or Madam", end with "Yours faithfully". "Yours sincerely" goes with a name (Dear Ms Karimova).', '"Dear Sir or Madam"dan keyin "Yours faithfully" yoziladi. "Yours sincerely" ism bilan murojaatda (Dear Ms Karimova) ishlatiladi.');
    } else if (/^dear\s+(mr|mrs|ms|miss|dr)\b/i.test(first) && /yours faithfully/i.test(signOff)) {
      add('faithfully', 'tip', 'When you use the person’s name (Dear Mr Aliev), end with "Yours sincerely".', 'Ism bilan murojaat qilsangiz (Dear Mr Aliev), "Yours sincerely" bilan tugating.');
    }
    const seen = new Set();
    const found = (String(text).match(CONTRACTION) || []).filter((c) => !seen.has(c.toLowerCase()) && seen.add(c.toLowerCase()));
    if (found.length) {
      add('contractions', 'tip', `Formal emails usually avoid short forms: ${found.slice(0, 4).join(', ')}. Write them in full (don't → do not).`, `Rasmiy xatda qisqartmalar ishlatilmaydi: ${found.slice(0, 4).join(', ')}. To‘liq yozing (don't → do not).`);
    }
  }

  if (part === '2') {
    if (paragraphs < 3 && words > 90) {
      add('paragraphs', 'tip', 'Split your post into paragraphs: introduction with your opinion, reasons with examples, conclusion.', 'Matnni paragraflarga bo‘ling: fikringiz bilan kirish, sabablar va misollar, xulosa.');
    }
  }

  if (copiedShare(text, source) > 0.3) {
    add('copy', 'warn', 'Large parts of your text repeat the task. Use your own words — copied text does not count.', 'Matningizning katta qismi topshiriqni takrorlaydi. O‘z so‘zlaringiz bilan yozing — ko‘chirilgan matn hisobga olinmaydi.');
  }

  if (p && words > p.max + 15) {
    add('long', 'tip', `Over ${p.max} words. Extra words often mean extra mistakes — try to stay within ${p.min}–${p.max}.`, `${p.max} so‘zdan oshdi. Ortiqcha so‘z ko‘pincha ortiqcha xato degani — ${p.min}–${p.max} oralig‘ida yozing.`);
  }

  return { words, paragraphs, hints };
}

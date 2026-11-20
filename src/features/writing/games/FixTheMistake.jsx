// Fix the Mistake (plan 7 #3): find the wrong word, then choose the fix.
// Your own mistakes from the Mistake Bank come first, then common mistakes of Uzbek learners.
import { useMemo, useState } from 'react';
import { useApp } from '../../../app/state.jsx';
import { api } from '../../../shared/lib/api.js';
import { useT } from '../../../i18n/index.js';
import { sfx } from '../../../shared/lib/sound.js';
import { shuffle } from '../../../shared/lib/steps.js';
import useCountdown from '../../speaking/components/useCountdown.js';
import { useUz } from '../components/useUz.jsx';
import { FIXES } from './data.js';
import { GameEnd, GameIntro, Hud, comboPoints, starsFor } from './GameFrame.jsx';

const GAME = 'w-fix';
const ITEMS = 8;
const MINE = 4; // at most this many from the student's own mistakes
const SECONDS = 150;
const COLOR = '#ea580c';

/** A Mistake Bank row → a game item, if its sentence still contains the mistake. */
function fromBank(m) {
  const sentence = (m.sentence || '').trim();
  if (!sentence || !m.original || !m.suggestion || !sentence.includes(m.original) || sentence.length > 220) return null;
  // Only short word/phrase fixes make a good game question (not "delete this sentence" notes).
  if (m.original.length > 60 || m.suggestion.startsWith('(') || m.suggestion === m.original) return null;
  return { id: m.id, mine: true, sentence, wrong: m.original, options: [m.suggestion, m.original], explain: m.explain, uz: m.explain_uz };
}

const tokens = (s) => [...s.matchAll(/\S+/g)].map((m) => ({ text: m[0], start: m.index, end: m.index + m[0].length }));

export default function FixTheMistake() {
  const t = useT();
  const [uz] = useUz();
  const { user } = useApp();
  const [stage, setStage] = useState('intro');
  const [items, setItems] = useState([]);
  const [i, setI] = useState(0);
  const [step, setStep] = useState('find'); // find | fix | done
  const [misses, setMisses] = useState(0);
  const [missed, setMissed] = useState([]); // token indexes tapped wrongly
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [review, setReview] = useState([]);
  const [mineCount, setMineCount] = useState(0);
  const seconds = useCountdown(SECONDS, stage === 'play', () => setStage('end'));
  const item = items[i];

  const span = useMemo(() => {
    if (!item) return null;
    const s = item.sentence.indexOf(item.wrong);
    return [s, s + item.wrong.length];
  }, [item]);
  const toks = useMemo(() => (item ? tokens(item.sentence) : []), [item]);
  const inSpan = (tk) => span && tk.start < span[1] && tk.end > span[0];

  async function begin() {
    sfx('start');
    let mine = [];
    if (user) {
      try {
        const rows = await api.writing.mistakes();
        mine = shuffle(rows.filter((m) => !m.mastered).map(fromBank).filter(Boolean)).slice(0, MINE);
      } catch {
        /* no bank yet: use the common mistakes */
      }
    }
    const common = shuffle(FIXES)
      .slice(0, ITEMS - mine.length)
      .map((f) => ({ ...f, mine: false }));
    setItems(shuffle([...mine, ...common]).map((x) => ({ ...x, choices: shuffle(x.options) })));
    setMineCount(mine.length);
    setI(0);
    setStep('find');
    setMisses(0);
    setMissed([]);
    setPicked(null);
    setScore(0);
    setCombo(0);
    setReview([]);
    setStage('play');
  }

  function tapToken(k) {
    if (step !== 'find') return;
    if (inSpan(toks[k])) {
      sfx('pop');
      if (misses === 0) setScore((s) => s + 10);
      setStep('fix');
      return;
    }
    sfx('wrong');
    const m = misses + 1;
    setMisses(m);
    setMissed((x) => [...x, k]);
    if (m >= 2) setStep('fix'); // show where it is after two misses
  }

  function choose(option) {
    if (step !== 'fix') return;
    const ok = option === item.options[0];
    const perfect = ok && misses === 0;
    const newCombo = ok ? combo + 1 : 0;
    sfx(ok ? 'correct' : 'wrong');
    if (ok) setScore((s) => s + comboPoints(10, newCombo));
    if (ok && newCombo % 3 === 0) sfx('combo');
    setCombo(newCombo);
    setPicked(option);
    setStep('done');
    setReview((r) => [
      ...r,
      {
        ok: perfect,
        title: `${item.mine ? '📒 ' : ''}${item.sentence.replace(item.wrong, `[${item.wrong} → ${item.options[0]}]`)}`,
        detail: item.explain,
        detail_uz: item.uz,
      },
    ]);
    // Your own mistake, found and fixed at once: it leaves the "to review" list.
    if (perfect && item.mine) api.writing.setMastered(item.id, true).catch(() => {});
  }

  function next() {
    if (i + 1 >= items.length) {
      setStage('end');
      return;
    }
    setI((n) => n + 1);
    setStep('find');
    setMisses(0);
    setMissed([]);
    setPicked(null);
  }

  if (stage === 'intro')
    return (
      <GameIntro
        emoji="🔧"
        title="Fix the Mistake"
        skill="Grammar and accuracy"
        color={COLOR}
        onStart={begin}
        rules={[
          'Each sentence has ONE mistake. Tap the wrong word.',
          'Then choose the correct version.',
          'Your own mistakes from your writing checks come first (📒). Fix one perfectly and it is marked as learned.',
          '8 sentences. Find it on the first tap for extra points!',
        ]}
      >
        {!user && <p className="muted small">{t('Log in to practise your own mistakes too.')}</p>}
      </GameIntro>
    );

  if (stage === 'end')
    return (
      <GameEnd
        game={GAME}
        score={score}
        stars={starsFor(score, ITEMS * 22)}
        title={mineCount ? t('Fix the Mistake — {n} of your own mistakes', { n: mineCount }) : t('Fix the Mistake')}
        review={review}
        onAgain={begin}
        color={COLOR}
      />
    );

  return (
    <div className="wg-page" style={{ '--gc': COLOR }}>
      <Hud score={score} combo={combo} seconds={seconds} totalSeconds={SECONDS} step={i} steps={items.length} color={COLOR} />
      <p className="wg-ask">
        {item.mine && <span className="wg-mine">📒 {t('Your mistake')}</span>}{' '}
        {step === 'find' ? t('Tap the wrong word') : step === 'fix' ? t('Choose the correct version') : ''}
      </p>
      <section className="card wg-sentence">
        {toks.map((tk, k) => {
          const show = step !== 'find' && inSpan(tk);
          return (
            <button
              key={k}
              type="button"
              className={`wg-token ${show ? 'is-wrong-word' : ''} ${missed.includes(k) ? 'is-missed' : ''}`}
              onClick={() => tapToken(k)}
              disabled={step !== 'find'}
            >
              {tk.text}
            </button>
          );
        })}
      </section>

      {step !== 'find' && (
        <div className="wg-options">
          {item.choices.map((o) => {
            const state = step === 'done' ? (o === item.options[0] ? 'is-right' : o === picked ? 'is-wrong' : 'is-dim') : '';
            return (
              <button key={o} type="button" className={`wg-option ${state}`} onClick={() => choose(o)} disabled={step === 'done'}>
                {item.sentence.slice(0, span[0])}
                <strong>{o}</strong>
                {item.sentence.slice(span[1])}
              </button>
            );
          })}
        </div>
      )}

      {step === 'done' && (
        <>
          {item.explain && <p className="wg-feedback card">💡 {(uz && item.uz) || item.explain}</p>}
          <button type="button" className="btn btn--big wg-next" onClick={next} style={{ background: COLOR }}>
            {i + 1 >= items.length ? t('See results') : t('Next')} →
          </button>
        </>
      )}
    </div>
  );
}

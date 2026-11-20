// Letter Puzzle (plan 7 #2): put the parts of a letter in order. Trains organisation.
// Tap-to-place instead of drag-and-drop: it works the same on every phone and with a keyboard.
import { useState } from 'react';
import { useT } from '../../../i18n/index.js';
import { sfx } from '../../../shared/lib/sound.js';
import { shuffle } from '../../../shared/lib/steps.js';
import useCountdown from '../../speaking/components/useCountdown.js';
import { LETTERS } from './data.js';
import { GameEnd, GameIntro, Hud, starsFor } from './GameFrame.jsx';

const GAME = 'w-puzzle';
const SECONDS = 120;
const ROUNDS = 3;
const COLOR = '#0d9488';

const newLetter = (l) => ({ ...l, pool: shuffle(l.blocks.map((b, i) => ({ ...b, i }))), placed: [], mistakes: 0, shake: null });

export default function LetterPuzzle() {
  const t = useT();
  const [stage, setStage] = useState('intro');
  const [letters, setLetters] = useState([]);
  const [r, setR] = useState(0);
  const [score, setScore] = useState(0);
  const [review, setReview] = useState([]);
  const [solved, setSolved] = useState(false);
  const seconds = useCountdown(SECONDS, stage === 'play', () => setStage('end'));
  const cur = letters[r];

  function begin() {
    sfx('start');
    // Always at least one formal and one informal letter.
    const formal = shuffle(LETTERS.filter((l) => l.register === 'formal'));
    const informal = shuffle(LETTERS.filter((l) => l.register === 'informal'));
    setLetters(shuffle([formal[0], informal[0], formal[1]]).map(newLetter));
    setR(0);
    setScore(0);
    setReview([]);
    setSolved(false);
    setStage('play');
  }

  function tap(block) {
    if (solved) return;
    const expected = cur.placed.length;
    if (block.i !== expected) {
      sfx('wrong');
      setLetters((ls) => ls.map((l, k) => (k === r ? { ...l, mistakes: l.mistakes + 1, shake: block.i } : l)));
      setTimeout(() => setLetters((ls) => ls.map((l, k) => (k === r ? { ...l, shake: null } : l))), 450);
      return;
    }
    sfx('pop');
    const placed = [...cur.placed, block];
    const pool = cur.pool.filter((b) => b.i !== block.i);
    setLetters((ls) => ls.map((l, k) => (k === r ? { ...l, placed, pool } : l)));
    if (!pool.length) {
      const points = Math.max(5, 30 - cur.mistakes * 6) + (cur.mistakes === 0 ? 10 : 0);
      sfx(cur.mistakes === 0 ? 'combo' : 'coin');
      setScore((s) => s + points);
      setReview((rv) => [
        ...rv,
        {
          ok: cur.mistakes === 0,
          title: `${t(cur.title)} — ${cur.mistakes ? t('{n} wrong taps', { n: cur.mistakes }) : t('perfect')}`,
          detail: cur.blocks.map((b) => b.role).join(' → '),
        },
      ]);
      setSolved(true);
    }
  }

  function nextLetter() {
    setSolved(false);
    if (r + 1 >= letters.length) setStage('end');
    else setR((n) => n + 1);
  }

  if (stage === 'intro')
    return (
      <GameIntro
        emoji="🧩"
        title="Letter Puzzle"
        skill="Organisation"
        color={COLOR}
        onStart={begin}
        rules={[
          'A letter is cut into blocks and mixed up.',
          'Tap the blocks in the right order: greeting first, sign-off last.',
          'Each placed block shows its job (purpose, feelings, suggestion…). Learn the pattern!',
          '3 letters in 2 minutes. No wrong taps = bonus points.',
        ]}
      />
    );

  if (stage === 'end') return <GameEnd game={GAME} score={score} stars={starsFor(score, ROUNDS * 40)} title={t('Letter Puzzle')} review={review} onAgain={begin} color={COLOR} />;

  return (
    <div className="wg-page" style={{ '--gc': COLOR }}>
      <Hud score={score} seconds={seconds} totalSeconds={SECONDS} step={r} steps={letters.length} color={COLOR} />
      <p className="wg-ask">
        {cur.register === 'formal' ? '✉️' : '💬'} {t(cur.title)}
      </p>

      <section className="card wg-letter" aria-label={t('Your letter')}>
        {cur.placed.map((b) => (
          <div key={b.i} className="wg-letter__block">
            <small>{t(b.role)}</small>
            <p>{b.text}</p>
          </div>
        ))}
        {!solved && <div className="wg-letter__next">{cur.placed.length === 0 ? t('Tap the first block…') : t('What comes next?')}</div>}
      </section>

      {solved ? (
        <button type="button" className="btn btn--big wg-next" onClick={nextLetter} style={{ background: COLOR }}>
          {r + 1 >= letters.length ? t('See results') : t('Next letter')} →
        </button>
      ) : (
        <div className="wg-pool">
          {cur.pool.map((b) => (
            <button key={b.i} type="button" className={`wg-pool__block ${cur.shake === b.i ? 'is-shake' : ''}`} onClick={() => tap(b)}>
              {b.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

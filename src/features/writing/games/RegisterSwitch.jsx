// Register Switch (plan 7 #1): formal or informal? Trains the style difference between Task 1.1 and 1.2.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useT } from '../../../i18n/index.js';
import { sfx } from '../../../shared/lib/sound.js';
import { shuffle } from '../../../shared/lib/steps.js';
import useCountdown from '../../speaking/components/useCountdown.js';
import { useUz } from '../components/useUz.jsx';
import { REGISTER_ITEMS, REGISTER_PAIRS } from './data.js';
import { GameEnd, GameIntro, Hud, comboPoints, starsFor } from './GameFrame.jsx';

const GAME = 'w-register';
const SECONDS = 60;
const COLOR = '#7c3aed';

function makeDeck() {
  const items = shuffle(REGISTER_ITEMS).map((x) => ({ kind: 'single', ...x }));
  const pairs = shuffle(REGISTER_PAIRS).map((p) => ({ kind: 'pair', ...p, options: shuffle([p.formal, p.informal]) }));
  const deck = [];
  items.forEach((x, i) => {
    deck.push(x);
    if (i % 4 === 3 && pairs.length) deck.push(pairs.shift());
  });
  return deck;
}

export default function RegisterSwitch() {
  const t = useT();
  const [uz] = useUz();
  const [stage, setStage] = useState('intro');
  const [deck, setDeck] = useState([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [answer, setAnswer] = useState(null); // { ok, picked }
  const [review, setReview] = useState([]);
  const [drag, setDrag] = useState(0);
  const start = useRef(null);
  const next = useRef(null);
  const seconds = useCountdown(SECONDS, stage === 'play', () => finish());
  const item = deck[i];

  function begin() {
    sfx('start');
    setDeck(makeDeck());
    setI(0);
    setScore(0);
    setCombo(0);
    setAnswer(null);
    setReview([]);
    setStage('play');
  }

  function finish() {
    clearTimeout(next.current);
    setStage('end');
  }

  const choose = useCallback(
    (picked) => {
      if (!item || answer) return;
      const ok = item.kind === 'pair' ? picked === item.formal : picked === item.register;
      sfx(ok ? 'correct' : 'wrong');
      const newCombo = ok ? combo + 1 : 0;
      if (ok) setScore((s) => s + comboPoints(item.kind === 'pair' ? 15 : 10, newCombo));
      if (ok && newCombo > 0 && newCombo % 3 === 0) sfx('combo');
      setCombo(newCombo);
      setAnswer({ ok, picked });
      setReview((r) => [
        ...r,
        item.kind === 'pair'
          ? { ok, title: `✉️ ${item.formal}`, detail: `Formal: "${item.formal}" — not "${item.informal}".`, detail_uz: `Rasmiy: "${item.formal}" — "${item.informal}" emas.` }
          : { ok, title: `“${item.text}” → ${item.register === 'formal' ? 'Formal' : 'Informal'}`, detail: item.why, detail_uz: item.uz },
      ]);
      next.current = setTimeout(
        () => {
          setAnswer(null);
          setDrag(0);
          if (i + 1 >= deck.length) finish();
          else setI((n) => n + 1);
        },
        ok ? 650 : 1900,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item, answer, combo, i, deck.length],
  );

  // Arrow keys: ← informal, → formal.
  useEffect(() => {
    if (stage !== 'play' || item?.kind !== 'single') return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') choose('informal');
      if (e.key === 'ArrowRight') choose('formal');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, item, choose]);

  useEffect(() => () => clearTimeout(next.current), []);

  if (stage === 'intro')
    return (
      <GameIntro
        emoji="🔀"
        title="Register Switch"
        skill="Formal or informal style"
        color={COLOR}
        onStart={begin}
        rules={[
          'A sentence appears. Is it right for a FORMAL email (Task 1.2) or only for a friend (Task 1.1)?',
          'Tap Formal or Informal — or swipe the card right (formal) or left (informal).',
          'Every few cards: pick the formal version of two sentences.',
          'You have 60 seconds. Right answers in a row give bonus points!',
        ]}
      />
    );

  if (stage === 'end') {
    return <GameEnd game={GAME} score={score} stars={starsFor(score, 220)} title={t('Register Switch')} review={review} onAgain={begin} color={COLOR} />;
  }

  // Swipe on the card (pointer events work for mouse and touch).
  const onDown = (e) => {
    if (answer || item.kind !== 'single') return;
    start.current = e.clientX;
  };
  const onMove = (e) => start.current != null && setDrag(e.clientX - start.current);
  const onUp = () => {
    if (start.current == null) return;
    start.current = null;
    if (drag > 70) choose('formal');
    else if (drag < -70) choose('informal');
    else setDrag(0);
  };

  return (
    <div className="wg-page" style={{ '--gc': COLOR }}>
      <Hud score={score} combo={combo} seconds={seconds} totalSeconds={SECONDS} color={COLOR} />
      {item.kind === 'single' ? (
        <>
          <p className="wg-ask">{t('Is this right for a formal email?')}</p>
          <div
            className={`card wg-swipe ${answer ? (answer.ok ? 'is-right' : 'is-wrong') : ''}`}
            style={{ transform: `translateX(${drag}px) rotate(${drag / 25}deg)` }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <p className="wg-swipe__text">{item.text}</p>
            {answer && (
              <p className="wg-feedback">
                {answer.ok ? '✅ ' : '❌ '}
                <strong>{item.register === 'formal' ? t('Formal') : t('Informal')}</strong> — {(uz && item.uz) || item.why}
              </p>
            )}
          </div>
          <div className="wg-choice">
            <button type="button" className="wg-choice__btn wg-choice__btn--informal" onClick={() => choose('informal')} disabled={!!answer}>
              ← 💬 {t('Informal')}
            </button>
            <button type="button" className="wg-choice__btn wg-choice__btn--formal" onClick={() => choose('formal')} disabled={!!answer}>
              ✉️ {t('Formal')} →
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="wg-ask">⭐ {t('Bonus: which one fits a formal email?')}</p>
          <div className="wg-options">
            {item.options.map((o) => {
              const state = answer ? (o === item.formal ? 'is-right' : o === answer.picked ? 'is-wrong' : 'is-dim') : '';
              return (
                <button key={o} type="button" className={`wg-option ${state}`} onClick={() => choose(o)} disabled={!!answer}>
                  {o}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

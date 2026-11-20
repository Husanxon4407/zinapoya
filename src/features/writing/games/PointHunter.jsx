// Point Hunter (plan 7 #4): find what the input email asks for. Missing a point is the No. 1 way
// students lose Task marks in Part 1, so this trains reading the email before writing.
// Step 1: tap the sentence(s) that ask you to do something. Step 2: pick the email's 3 points.
import { useMemo, useState } from 'react';
import { useT } from '../../../i18n/index.js';
import { sfx } from '../../../shared/lib/sound.js';
import { shuffle } from '../../../shared/lib/steps.js';
import useCountdown from '../../speaking/components/useCountdown.js';
import { part1Sets } from '../data/index.js';
import { useUz } from '../components/useUz.jsx';
import { POINT_ASKS } from './data.js';
import { GameEnd, GameIntro, Hud, starsFor } from './GameFrame.jsx';

const GAME = 'w-points';
const ROUNDS = 3;
const SECONDS = 150;
const COLOR = '#2563eb';

/** The email split into lines; body lines are split into sentences that can be tapped. */
function splitEmail(email, asks) {
  const lines = email.split('\n').filter((l) => l.trim());
  return lines.map((line, li) => {
    // Greeting, sign-off ("Regards,") and sender name are the letter's frame, not sentences to tap.
    const isFrame = (li === 0 && /^dear\b/i.test(line)) || (li >= lines.length - 2 && line.split(' ').length <= 6 && !/[?]/.test(line));
    if (isFrame) return { frame: true, text: line };
    // A sentence ends at . ! ? followed by a space and a capital letter — but not after "Mr." or "Dr.",
    // and "6 p.m. instead" stays one sentence (lower-case word after it).
    const parts = line.split(/(?<!\b(?:Mr|Mrs|Ms|Dr|St|No)\.)(?<=[.!?]["”’]?)\s+(?=["“‘]?[A-Z])/);
    return { frame: false, sentences: parts.map((s) => s.trim()).filter(Boolean).map((s) => ({ text: s, target: asks.some((a) => s.includes(a) || a.includes(s.replace(/[.?!]$/, ''))) })) };
  });
}

function makeRounds() {
  const sets = part1Sets().filter((s) => POINT_ASKS[s.id]);
  const chosen = shuffle(sets).slice(0, ROUNDS);
  return chosen.map((s) => {
    const others = shuffle(sets.filter((o) => o.id !== s.id).flatMap((o) => o.points));
    // Distractors must not repeat a real point's wording (several emails ask "how you feel").
    const fake = [];
    for (const p of others) {
      if (fake.length === 3) break;
      if (![...s.points, ...fake].some((x) => x.text === p.text)) fake.push(p);
    }
    let k = 0;
    const lines = splitEmail(s.email, POINT_ASKS[s.id]).map((l) => (l.frame ? l : { ...l, sentences: l.sentences.map((x) => ({ ...x, k: k++ })) }));
    return {
      set: s,
      lines,
      cards: shuffle([...s.points.map((p) => ({ ...p, real: true })), ...fake.map((p) => ({ ...p, real: false }))]),
    };
  });
}

export default function PointHunter() {
  const t = useT();
  const [uz] = useUz();
  const [stage, setStage] = useState('intro');
  const [rounds, setRounds] = useState([]);
  const [r, setR] = useState(0);
  const [step, setStep] = useState('tap'); // tap | tapped | cards | checked
  const [tapped, setTapped] = useState([]);
  const [cards, setCards] = useState([]);
  const [score, setScore] = useState(0);
  const [review, setReview] = useState([]);
  const seconds = useCountdown(SECONDS, stage === 'play', () => setStage('end'));
  const round = rounds[r];
  const sentences = useMemo(() => (round ? round.lines.flatMap((l) => (l.frame ? [] : l.sentences)) : []), [round]);

  function begin() {
    sfx('start');
    setRounds(makeRounds());
    setR(0);
    setStep('tap');
    setTapped([]);
    setCards([]);
    setScore(0);
    setReview([]);
    setStage('play');
  }

  function toggleSentence(k) {
    if (step !== 'tap') return;
    sfx('click');
    setTapped((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]));
  }

  function checkSentences() {
    const targets = sentences.filter((s) => s.target).map((s) => s.k);
    const right = tapped.filter((k) => targets.includes(k)).length;
    const wrong = tapped.length - right;
    const missed = targets.length - right;
    const pts = Math.max(0, right * 10 - wrong * 5);
    sfx(missed === 0 && wrong === 0 ? 'correct' : 'wrong');
    setScore((s) => s + pts);
    setReview((rv) => [
      ...rv,
      {
        ok: missed === 0 && wrong === 0,
        title: `${round.set.emoji} ${round.set.title}: ${t('asking sentences {a}/{b}', { a: right, b: targets.length })}`,
        detail: sentences.filter((s) => s.target).map((s) => `“${s.text}”`).join(' '),
      },
    ]);
    setStep('tapped');
  }

  function toggleCard(i) {
    if (step !== 'cards') return;
    sfx('click');
    setCards((x) => (x.includes(i) ? x.filter((y) => y !== i) : x.length < 3 ? [...x, i] : x));
  }

  function checkCards() {
    const right = cards.filter((i) => round.cards[i].real).length;
    sfx(right === 3 ? 'combo' : right === 2 ? 'coin' : 'wrong');
    setScore((s) => s + right * 10 + (right === 3 ? 10 : 0));
    setReview((rv) => [
      ...rv,
      {
        ok: right === 3,
        title: `${round.set.emoji} ${round.set.title}: ${t('points {a}/3', { a: right })}`,
        detail: round.set.points.map((p, n) => `${n + 1}. ${p.text}`).join(' '),
        detail_uz: round.set.points.map((p, n) => `${n + 1}. ${p.uz}`).join(' '),
      },
    ]);
    setStep('checked');
  }

  function next() {
    if (r + 1 >= rounds.length) {
      setStage('end');
      return;
    }
    setR((n) => n + 1);
    setStep('tap');
    setTapped([]);
    setCards([]);
  }

  if (stage === 'intro')
    return (
      <GameIntro
        emoji="🎯"
        title="Point Hunter"
        skill="Task achievement"
        color={COLOR}
        onStart={begin}
        rules={[
          'Read the email from the exam (Part 1).',
          'Step 1: tap every sentence that asks you to DO or SAY something.',
          'Step 2: pick the 3 points your answer must cover — 3 of the 6 cards are from other emails!',
          '3 emails. In the exam, every missed point costs marks.',
        ]}
      />
    );

  if (stage === 'end') return <GameEnd game={GAME} score={score} stars={starsFor(score, ROUNDS * 55)} title={t('Point Hunter')} review={review} onAgain={begin} color={COLOR} />;

  return (
    <div className="wg-page" style={{ '--gc': COLOR }}>
      <Hud score={score} seconds={seconds} totalSeconds={SECONDS} step={r} steps={rounds.length} color={COLOR} />
      <p className="wg-ask">
        {step === 'tap' || step === 'tapped' ? t('Step 1: tap the sentences that ask you to do something') : t('Step 2: choose the 3 points your answer must cover')}
      </p>

      <section className="card wg-email">
        <small className="muted">{round.set.role}</small>
        <div className="w-email">
          <div className="w-email__from">✉️ {round.set.from}</div>
          <div className="w-email__body wg-email__body">
            {round.lines.map((l, li) =>
              l.frame ? (
                <p key={li} className="wg-email__frame">
                  {l.text}
                </p>
              ) : (
                <p key={li}>
                  {l.sentences.map((s) => {
                    const on = tapped.includes(s.k);
                    const shown = step !== 'tap';
                    const cls = shown ? (s.target ? (on ? 'is-right' : 'is-missed') : on ? 'is-wrong' : '') : on ? 'is-on' : '';
                    return (
                      <button key={s.k} type="button" className={`wg-sent ${cls}`} onClick={() => toggleSentence(s.k)} disabled={step !== 'tap'} aria-pressed={on}>
                        {s.text}
                      </button>
                    );
                  })}
                </p>
              ),
            )}
          </div>
        </div>
      </section>

      {step === 'tap' && (
        <button type="button" className="btn btn--big wg-next" onClick={checkSentences} disabled={!tapped.length} style={{ background: COLOR }}>
          ✅ {t('Check')}
        </button>
      )}
      {step === 'tapped' && (
        <>
          <p className="wg-feedback card">💡 {t('Green = asking sentences you found. Orange = ones you missed. Red = not a request.')}</p>
          <button type="button" className="btn btn--big wg-next" onClick={() => setStep('cards')} style={{ background: COLOR }}>
            {t('Step 2')} →
          </button>
        </>
      )}

      {(step === 'cards' || step === 'checked') && (
        <>
          <div className="wg-cards">
            {round.cards.map((c, i) => {
              const on = cards.includes(i);
              const cls = step === 'checked' ? (c.real ? (on ? 'is-right' : 'is-missed') : on ? 'is-wrong' : 'is-dim') : on ? 'is-on' : '';
              return (
                <button key={i} type="button" className={`wg-card ${cls}`} onClick={() => toggleCard(i)} disabled={step === 'checked'} aria-pressed={on}>
                  {(uz && c.uz) || c.text}
                </button>
              );
            })}
          </div>
          {step === 'cards' ? (
            <button type="button" className="btn btn--big wg-next" onClick={checkCards} disabled={cards.length !== 3} style={{ background: COLOR }}>
              ✅ {t('Check ({n}/3 chosen)', { n: cards.length })}
            </button>
          ) : (
            <button type="button" className="btn btn--big wg-next" onClick={next} style={{ background: COLOR }}>
              {r + 1 >= rounds.length ? t('See results') : t('Next email')} →
            </button>
          )}
        </>
      )}
    </div>
  );
}

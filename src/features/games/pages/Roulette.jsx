import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../../speaking/components/ExamRunner.jsx';
import GameResult from '../components/GameResult.jsx';
import { sfx } from '../../../shared/lib/sound.js';
import { PART1_1, TOPICS } from '../../speaking/data/part1_1.js';
import { shuffle, stepsP11 } from '../../../shared/lib/steps.js';
import { countWords } from '../../speaking/lib/metrics.js';

const COLORS = ['#14b8a6', '#8b5cf6', '#f97316', '#f43f5e', '#3b82f6', '#eab308', '#22c55e', '#ec4899'];
const SEG = 360 / COLORS.length;

function areCheck(text) {
  const t = text.toLowerCase();
  return {
    answer: countWords(text) >= 8,
    reason: /\b(because|since|the reason|that's why|so that|as i|as it)\b/.test(t),
    example: /\b(for example|for instance|such as|i remember|last (week|weekend|year|month|summer|time)|yesterday|once)\b/.test(t),
  };
}

function AreBoard({ text, live = false }) {
  const c = areCheck(text);
  const count = [c.answer, c.reason, c.example].filter(Boolean).length;
  const prev = useRef(0);
  useEffect(() => {
    if (live && count > prev.current) sfx(count === 3 ? 'combo' : 'pop');
    prev.current = count;
  }, [count, live]);
  return (
    <div className="are">
      {[
        ['answer', 'A', 'Answer'],
        ['reason', 'R', 'Reason'],
        ['example', 'E', 'Example'],
      ].map(([k, letter, label]) => (
        <div key={k} className={`are__item ${c[k] ? 'are__item--on' : ''}`}>
          <strong>{letter}</strong>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}

export default function Roulette() {
  const [wheel, setWheel] = useState(() => shuffle(PART1_1).slice(0, COLORS.length));
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [round, setRound] = useState(0);

  function spin() {
    if (spinning) return;
    const idx = Math.floor(Math.random() * wheel.length);
    const target = 360 - (idx * SEG + SEG / 2);
    const base = angle - (angle % 360);
    setAngle(base + 360 * 5 + target);
    setSpinning(true);
    setChosen(null);
    sfx('whoosh');
    // Ticks that slow down with the wheel.
    for (let t = 0, gap = 45; t < 3000; t += gap, gap *= 1.11) setTimeout(() => sfx('tick'), t);
    setTimeout(() => {
      sfx('coin');
      setSpinning(false);
      setChosen(wheel[idx]);
      setRound((r) => r + 1);
    }, 3200);
  }

  function newWheel() {
    setWheel(shuffle(PART1_1).slice(0, COLORS.length));
    setChosen(null);
  }

  const gradient = `conic-gradient(${COLORS.map((c, i) => `${c} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(', ')})`;

  return (
    <div>
      <Link to="/games" className="back">
        ← Games
      </Link>
      <h1>🎡 Question Roulette</h1>
      <p className="muted">
        Spin, then answer in 30 seconds using <strong>A-R-E</strong>: <b>A</b>nswer the question, give a <b>R</b>eason, give an <b>E</b>xample. Get all three letters!
      </p>

      {!chosen && (
        <div className="roulette">
          <div className="roulette__pointer">▼</div>
          <div className="roulette__wheel" style={{ background: gradient, transform: `rotate(${angle}deg)` }}>
            {wheel.map((q, i) => (
              <span key={q.id} className="roulette__label" style={{ transform: `rotate(${i * SEG + SEG / 2}deg) translateY(-105px)` }}>
                {TOPICS[q.topic].emoji}
              </span>
            ))}
          </div>
          <div className="roulette__buttons">
            <button className="btn btn--big" onClick={spin} disabled={spinning}>
              {spinning ? 'Spinning…' : '🎡 Spin!'}
            </button>
            <button className="btn btn--ghost" onClick={newWheel} disabled={spinning}>
              New questions
            </button>
          </div>
        </div>
      )}

      {chosen && (
        <ExamRunner
          key={round}
          steps={stepsP11([chosen])}
          mode="game"
          title="Your question is…"
          intro={<p className="roulette__chosen">“{chosen.text}”</p>}
          liveExtra={(text, phase) => (phase === 'speak' ? <AreBoard text={text} live /> : <p className="muted">Remember: Answer · Reason · Example</p>)}
          renderExtra={(results) => {
            const t = results[0].row.transcript || '';
            const c = areCheck(t);
            const stars = [c.answer, c.reason, c.example].filter(Boolean).length;
            return (
              <GameResult game="roulette" score={stars * 100 + Math.min(countWords(t), 80) * 2} stars={stars} title={stars === 3 ? 'Perfect A-R-E answer! 🏆' : 'Nice spin!'} detail={{ question: chosen.id }}>
                <AreBoard text={t} />
                <p>{stars === 3 ? 'You answered, gave a reason and an example. That’s exactly what examiners want.' : !c.reason ? 'Add a reason with “because…” next time.' : 'Add an example: “For example, last weekend I…”'}</p>
                <button className="btn" onClick={() => { setChosen(null); spin(); }}>
                  🎡 Spin again
                </button>
              </GameResult>
            );
          }}
        />
      )}
    </div>
  );
}

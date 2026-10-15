import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../../components/ExamRunner.jsx';
import { PART1_1, TOPICS } from '../../data/part1_1.js';
import { shuffle, stepsP11 } from '../../lib/steps.js';
import { countWords } from '../../lib/metrics.js';

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

function AreBoard({ text }) {
  const c = areCheck(text);
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
    setTimeout(() => {
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
          liveExtra={(text, phase) => (phase === 'speak' ? <AreBoard text={text} /> : <p className="muted">Remember: Answer · Reason · Example</p>)}
          renderExtra={(results) => {
            const c = areCheck(results[0].row.transcript || '');
            const stars = [c.answer, c.reason, c.example].filter(Boolean).length;
            return (
              <div className="card game-result">
                <div className="stars">{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
                <AreBoard text={results[0].row.transcript || ''} />
                <p>{stars === 3 ? 'Perfect A-R-E answer! 🏆' : !c.reason ? 'Add a reason with “because…” next time.' : 'Add an example: “For example, last weekend I…”'}</p>
                <button className="btn" onClick={() => { setChosen(null); spin(); }}>
                  🎡 Spin again
                </button>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../../components/ExamRunner.jsx';
import { PART3 } from '../../data/part3.js';
import { DEBATE_LINKERS } from '../../data/phrases.js';
import { pick, shuffle } from '../../lib/steps.js';
import { phrasesUsed } from '../../lib/metrics.js';

function newRound() {
  const topic = pick(PART3);
  const cards = shuffle([...topic.for.map((t) => ({ t, side: 'for' })), ...topic.against.map((t) => ({ t, side: 'against' }))]);
  return { topic, cards, answers: {}, side: null };
}

function Linkers({ text }) {
  const used = new Set(phrasesUsed(text, DEBATE_LINKERS));
  return (
    <div className="linkers">
      {DEBATE_LINKERS.map((l) => (
        <span key={l} className={`chip ${used.has(l) ? 'chip--good' : ''}`}>
          {l}
        </span>
      ))}
    </div>
  );
}

export default function DebateArena() {
  const [game, setGame] = useState(newRound);
  const [stage, setStage] = useState('sort'); // sort | coin | speak
  const [flipping, setFlipping] = useState(false);
  const [round, setRound] = useState(0);

  const { topic, cards, answers, side } = game;
  const sorted = Object.keys(answers).length;
  const correct = cards.filter((c, i) => answers[i] === c.side).length;
  const checked = sorted === cards.length;

  function answer(i, s) {
    if (answers[i]) return;
    setGame({ ...game, answers: { ...answers, [i]: s } });
  }

  function flip() {
    setFlipping(true);
    setTimeout(() => {
      setGame((g) => ({ ...g, side: Math.random() < 0.5 ? 'for' : 'against' }));
      setFlipping(false);
    }, 1600);
  }

  function restart() {
    setGame(newRound());
    setStage('sort');
    setRound(round + 1);
  }

  const sideArgs = side === 'for' ? topic.for : topic.against;
  const step = side && {
    part: '3',
    questionId: topic.id,
    questionText: `Argue ${side.toUpperCase()} the statement: "${topic.statement}" Arguments: ${sideArgs.join(' ')}`,
    label: `Argue ${side === 'for' ? 'FOR 👍' : 'AGAINST 👎'}`,
    prompt: topic.statement,
    table: { for: topic.for, against: topic.against },
    tts: `${topic.statement} Argue ${side}.`,
    prep: 30,
    speak: 60,
  };

  return (
    <div>
      <Link to="/games" className="back">
        ← Games
      </Link>
      <h1>⚔️ Debate Arena</h1>

      {stage === 'sort' && (
        <div className="card">
          <p className="muted">Round 1 — Argument Sort. Is each argument FOR or AGAINST the statement?</p>
          <h2 className="debate-statement">“{topic.statement}”</h2>
          <div className="sort-list">
            {cards.map((c, i) => {
              const a = answers[i];
              return (
                <div key={c.t} className={`sort-item ${a ? (a === c.side ? 'sort-item--right' : 'sort-item--wrong') : ''}`}>
                  <p>{c.t}</p>
                  <div className="sort-item__btns">
                    <button className="btn btn--small btn--for" disabled={!!a} onClick={() => answer(i, 'for')}>
                      👍 For
                    </button>
                    <button className="btn btn--small btn--against" disabled={!!a} onClick={() => answer(i, 'against')}>
                      👎 Against
                    </button>
                  </div>
                  {a && <span className="sort-item__mark">{a === c.side ? '✓' : `✗ It’s ${c.side}`}</span>}
                </div>
              );
            })}
          </div>
          {checked && (
            <div className="game-result">
              <div className="stars">
                {correct}/{cards.length} correct
              </div>
              <button className="btn btn--big" onClick={() => setStage('coin')}>
                Round 2: Debate →
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'coin' && (
        <div className="card coin-stage">
          <p className="muted">Round 2 — The coin decides which side you defend. 30 seconds to prepare, 1 minute to convince the examiner!</p>
          <div className={`coin ${flipping ? 'coin--flip' : ''}`}>{side ? (side === 'for' ? '👍' : '👎') : '🪙'}</div>
          {side ? (
            <>
              <h2>
                You argue <span className={side === 'for' ? 'txt-for' : 'txt-against'}>{side.toUpperCase()}</span>!
              </h2>
              <button className="btn btn--big" onClick={() => setStage('speak')}>
                ⚔️ Enter the arena
              </button>
            </>
          ) : (
            <button className="btn btn--big" onClick={flip} disabled={flipping}>
              {flipping ? 'Flipping…' : 'Flip the coin'}
            </button>
          )}
        </div>
      )}

      {stage === 'speak' && step && (
        <ExamRunner
          key={round}
          steps={[step]}
          mode="game"
          title={`Argue ${side.toUpperCase()}`}
          intro={<p>Use linking words: on the one hand, however, moreover, to sum up…</p>}
          liveExtra={(text) => <Linkers text={text} />}
          renderExtra={(results) => {
            const used = phrasesUsed(results[0].row.transcript || '', DEBATE_LINKERS);
            return (
              <div className="card game-result">
                <h3>🔗 You used {used.length} linking phrases</h3>
                <Linkers text={results[0].row.transcript || ''} />
                <p>{used.length >= 4 ? 'Persuasive and well organised! 🏆' : 'Organise your ideas with: firstly, moreover, however, to sum up.'}</p>
                <button className="btn" onClick={restart}>
                  ⚔️ New debate
                </button>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}

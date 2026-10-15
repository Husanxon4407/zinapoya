import { useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../../components/ExamRunner.jsx';
import { PART1_2 } from '../../data/part1_2.js';
import { BINGO_LINKERS } from '../../data/phrases.js';
import { pick, shuffle } from '../../lib/steps.js';
import { phrasesUsed } from '../../lib/metrics.js';

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function newGame() {
  const set = pick(PART1_2);
  return {
    set,
    board: shuffle(BINGO_LINKERS).slice(0, 9),
    step: {
      part: '1.2',
      questionId: `${set.id}-q4`,
      questionText: `Describe and compare the two pictures (${set.title}). What do you see in these pictures?`,
      label: 'Linker Bingo',
      prompt: 'Describe and compare these two pictures.',
      image: set.image,
      setTitle: set.title,
      tts: 'Look at the pictures. Describe and compare them.',
      prep: 10,
      speak: 60,
    },
  };
}

function Board({ board, text }) {
  const used = new Set(phrasesUsed(text, board));
  const hit = board.map((w) => used.has(w));
  const lines = LINES.filter((l) => l.every((i) => hit[i])).length;
  return (
    <div>
      <div className="bingo">
        {board.map((w, i) => (
          <div key={w} className={`bingo__cell ${hit[i] ? 'bingo__cell--on' : ''}`}>
            {w}
          </div>
        ))}
      </div>
      {lines > 0 && <p className="bingo__win">🎉 BINGO × {lines}!</p>}
    </div>
  );
}

export default function LinkerBingo() {
  const [game, setGame] = useState(newGame);
  const [round, setRound] = useState(0);

  return (
    <div>
      <Link to="/games" className="back">
        ← Games
      </Link>
      <h1>🎯 Linker Bingo</h1>
      <p className="muted">Compare the two pictures for 1 minute. Every word or phrase from the card you say lights up. Get a full line for BINGO!</p>
      <ExamRunner
        key={round}
        steps={[game.step]}
        mode="game"
        title="Your bingo card"
        intro={<Board board={game.board} text="" />}
        liveExtra={(text) => <Board board={game.board} text={text} />}
        renderExtra={(results) => {
          const used = phrasesUsed(results[0].row.transcript || '', game.board);
          return (
            <div className="card game-result">
              <Board board={game.board} text={results[0].row.transcript || ''} />
              <p>
                You used <strong>{used.length}</strong> of 9 phrases.{' '}
                {used.length >= 5 ? 'Excellent linking! 🔗' : 'Try to use “whereas”, “while” and “both” next time.'}
              </p>
              <button
                className="btn"
                onClick={() => {
                  setGame(newGame());
                  setRound(round + 1);
                }}
              >
                🎯 New card
              </button>
            </div>
          );
        }}
      />
    </div>
  );
}

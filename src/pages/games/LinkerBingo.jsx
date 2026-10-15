import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ExamRunner from '../../components/ExamRunner.jsx';
import GameResult from '../../components/GameResult.jsx';
import { PART1_2 } from '../../data/part1_2.js';
import { BINGO_LINKERS } from '../../data/phrases.js';
import { pick, shuffle } from '../../lib/steps.js';
import { phrasesUsed } from '../../lib/metrics.js';
import { sfx } from '../../lib/sound.js';

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

function check(board, text) {
  const used = new Set(phrasesUsed(text, board));
  const hit = board.map((w) => used.has(w));
  return { hit, count: hit.filter(Boolean).length, lines: LINES.filter((l) => l.every((i) => hit[i])).length };
}

function Board({ board, text, live = false }) {
  const { hit, count, lines } = check(board, text);
  const prev = useRef({ count: 0, lines: 0 });
  useEffect(() => {
    if (live) {
      if (lines > prev.current.lines) sfx('win');
      else if (count > prev.current.count) sfx('pop');
    }
    prev.current = { count, lines };
  }, [count, lines, live]);

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
        liveExtra={(text, phase) => <Board board={game.board} text={text} live={phase === 'speak'} />}
        renderExtra={(results) => {
          const t = results[0].row.transcript || '';
          const { count, lines } = check(game.board, t);
          const stars = lines >= 2 ? 3 : lines === 1 ? 2 : count >= 3 ? 1 : 0;
          return (
            <GameResult game="bingo" score={count * 100 + lines * 300} stars={stars} title={lines ? `BINGO × ${lines}! 🎉` : `${count} of 9 phrases`} detail={{ set: game.set.id, count, lines }}>
              <Board board={game.board} text={t} />
              <p>{count >= 5 ? 'Excellent linking! 🔗' : 'Try to use “whereas”, “while” and “both” next time.'}</p>
              <button
                className="btn"
                onClick={() => {
                  setGame(newGame());
                  setRound(round + 1);
                }}
              >
                🎯 New card
              </button>
            </GameResult>
          );
        }}
      />
    </div>
  );
}

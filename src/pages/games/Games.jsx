import { Link } from 'react-router-dom';
import { PARTS } from '../../data/parts.js';

const GAMES = [
  { to: '/games/roulette', part: '1.1', emoji: '🎡', name: 'Question Roulette', text: 'Spin the wheel, then answer with the A-R-E rule: Answer + Reason + Example in 30 seconds.' },
  { to: '/games/bingo', part: '1.2', emoji: '🎯', name: 'Linker Bingo', text: 'Compare two pictures. Every comparison word you say lights up a bingo square!' },
  { to: '/games/story', part: '2', emoji: '📖', name: 'Story Builder', text: 'Plan your story in 6 quick steps, then tell it. We count your past-tense verbs.' },
  { to: '/games/debate', part: '3', emoji: '⚔️', name: 'Debate Arena', text: 'Sort the arguments into For and Against, then defend the side the coin chooses.' },
];

export default function Games() {
  return (
    <div>
      <h1>🎮 Speaking games</h1>
      <p className="muted">Short, fun challenges that train one exam skill at a time.</p>
      <div className="games-grid">
        {GAMES.map((g) => {
          const p = PARTS[g.part];
          return (
            <Link key={g.to} to={g.to} className="game-card" style={{ background: p.soft }}>
              <span className="game-card__emoji">{g.emoji}</span>
              <span className="game-card__part" style={{ color: p.color }}>
                {p.name}
              </span>
              <h3>{g.name}</h3>
              <p>{g.text}</p>
              <span className="btn btn--small" style={{ background: p.color }}>
                Play →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

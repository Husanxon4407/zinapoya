import { useEffect, useRef, useState } from 'react';
import Confetti from './Confetti.jsx';
import { sfx } from '../lib/sound.js';
import { useApp } from '../state.jsx';

/**
 * End-of-game card: animated stars, points, personal best, sound and confetti.
 * The score is saved once, when the card first appears.
 */
export default function GameResult({ game, score, stars, title, detail, children }) {
  const { addGameScore } = useApp();
  const [best, setBest] = useState(null);
  const [confetti, setConfetti] = useState(0);
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    addGameScore(game, score, detail).then((b) => {
      setBest(b);
      if (stars === 3 || (score > b && score > 0)) {
        sfx('win');
        setConfetti(Date.now());
      } else sfx(stars >= 1 ? 'star' : 'lose');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="card game-result">
      <Confetti fire={confetti} />
      <div className="stars stars--big">
        {[0, 1, 2].map((n) => (
          <span key={n} className={n < stars ? 'on' : ''} style={{ animationDelay: `${n * 0.25}s` }}>
            ★
          </span>
        ))}
      </div>
      {title && <h2>{title}</h2>}
      <p className="game-result__points">
        ⭐ {score} points
        {best !== null && (score > best && score > 0 ? <span className="record"> 🥇 New record!</span> : best > 0 ? <span className="muted"> · best {best}</span> : null)}
      </p>
      {children}
    </div>
  );
}

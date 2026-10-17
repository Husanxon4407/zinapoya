import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useApp } from '../state.jsx';
import Avatar from './Avatar.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];

export function useLeaderboard() {
  const { attempts, gameScores } = useApp();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  // Reload when the student earns new points.
  useEffect(() => {
    api
      .weeklyLeaderboard()
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [attempts.length, gameScores.length]);
  return { rows, error, me: rows?.find((r) => r.is_me) };
}

export default function Leaderboard() {
  const { rows, error, me } = useLeaderboard();

  return (
    <div className="card leaderboard">
      <div className="leaderboard__head">
        <h3>🏆 This week’s top 10</h3>
        <small className="muted">Resets every Monday</small>
      </div>
      {error && <p className="muted">The leaderboard is not available right now.</p>}
      {!rows && !error && <div className="spinner" />}
      {rows && rows.filter((r) => r.points > 0).length === 0 && <p className="muted">No points yet this week. Be the first!</p>}
      {rows && (
        <ol className="leaderboard__list">
          {rows
            .filter((r) => r.points > 0)
            .map((r, i) => (
              <li key={`${r.rank}-${r.name}-${i}`} className={r.is_me ? 'leaderboard__me' : ''}>
                <span className="leaderboard__rank">{MEDALS[r.rank - 1] || `#${r.rank}`}</span>
                <Avatar name={r.name} url={r.avatar_url} size={34} />
                <span className="leaderboard__name">
                  {r.name}
                  {r.is_me && <small> (you)</small>}
                </span>
                <strong>{r.points} pts</strong>
              </li>
            ))}
        </ol>
      )}
      {me && me.points === 0 && <p className="leaderboard__you">You have 0 points this week. Answer one question to get on the board!</p>}
      <p className="muted small">
        Points: 10 per answer · +5 for Part 2 and 3 · +20 for the daily challenge · game points ÷ 10
      </p>
    </div>
  );
}

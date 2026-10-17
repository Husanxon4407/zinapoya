import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useApp } from '../state.jsx';
import Avatar from './Avatar.jsx';
import { useT } from '../i18n/index.js';

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
  const t = useT();

  return (
    <div className="card leaderboard" id="leaderboard">
      <div className="leaderboard__head">
        <h3>🏆 {t('This week’s top 10')}</h3>
        <small className="muted">{t('Resets every Monday')}</small>
      </div>
      {error && <p className="muted">{t('The leaderboard is not available right now.')}</p>}
      {!rows && !error && <div className="spinner" />}
      {rows && rows.filter((r) => r.points > 0).length === 0 && <p className="muted">{t('No points yet this week. Be the first!')}</p>}
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
                  {r.is_me && <small> ({t('you')})</small>}
                </span>
                <strong>{t('{n} pts', { n: r.points })}</strong>
              </li>
            ))}
        </ol>
      )}
      {me && me.points === 0 && <p className="leaderboard__you">{t('You have 0 points this week. Answer one question to get on the board!')}</p>}
      <p className="muted small">
        {t('Points: 10 per answer · +5 for Part 2 and 3 · +20 for the daily challenge · game points ÷ 10')}
      </p>
    </div>
  );
}

// Compact top 3 for the Home side column, plus the student's own place.
export function TopThree({ board }) {
  const { rows, error, me } = board;
  const t = useT();
  if (error) return null;
  const top = (rows || []).filter((r) => r.points > 0).slice(0, 3);
  const meInTop = top.some((r) => r.is_me);

  return (
    <section className="card side-card top3" aria-labelledby="top3-title">
      <h3 id="top3-title">🏆 {t('This week’s top 3')}</h3>
      {!rows && <div className="spinner" />}
      {rows && top.length === 0 && <p className="muted small">{t('No points yet this week. Be the first!')}</p>}
      {top.length > 0 && (
        <ol className="top3__list">
          {top.map((r) => (
            <li key={`${r.rank}-${r.name}`} className={r.is_me ? 'top3__me' : ''}>
              <span className="top3__medal">{MEDALS[r.rank - 1] || `#${r.rank}`}</span>
              <Avatar name={r.name} url={r.avatar_url} size={32} />
              <span className="top3__name">{r.is_me ? t('You') : r.name.split(' ')[0]}</span>
              <strong>{r.points}</strong>
            </li>
          ))}
        </ol>
      )}
      {rows && !meInTop && me && (
        <p className="top3__you">
          {me.points > 0 ? t('You are #{rank} with {n} pts. Keep going!', { rank: me.rank, n: me.points }) : t('Answer a question to get on the board!')}
        </p>
      )}
      <Link to="/progress#leaderboard" className="side-card__link">
        {t('See top 10')} →
      </Link>
    </section>
  );
}

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

// Small podium for the Home page: this week's top 3, plus the student's own place.
export function TopThree({ board }) {
  const { rows, me } = board;
  const t = useT();
  const top = (rows || []).filter((r) => r.points > 0).slice(0, 3);
  if (top.length === 0) return null;
  // 2nd, 1st, 3rd so the winner stands in the middle.
  const podium = [top[1], top[0], top[2]].filter(Boolean);
  const meInTop = top.some((r) => r.is_me);

  return (
    <Link to="/progress#leaderboard" className="card podium" aria-label={t('This week’s top 3. Open the full leaderboard.')}>
      <div className="podium__head">
        <h3>🏆 {t('This week’s top 3')}</h3>
        <small className="muted">{t('See top 10')} →</small>
      </div>
      <ol className="podium__places">
        {podium.map((r) => (
          <li key={`${r.rank}-${r.name}`} className={`podium__place podium__place--${r.rank} ${r.is_me ? 'podium__place--me' : ''}`}>
            <span className="podium__medal">{MEDALS[r.rank - 1] || `#${r.rank}`}</span>
            <Avatar name={r.name} url={r.avatar_url} size={r.rank === 1 ? 56 : 44} />
            <strong>{r.is_me ? t('You') : r.name.split(' ')[0]}</strong>
            <small>{t('{n} pts', { n: r.points })}</small>
          </li>
        ))}
      </ol>
      {!meInTop && me && (
        <p className="podium__me">
          {me.points > 0 ? t('You are #{rank} with {n} pts. Keep going!', { rank: me.rank, n: me.points }) : t('Answer a question to get on the board!')}
        </p>
      )}
    </Link>
  );
}

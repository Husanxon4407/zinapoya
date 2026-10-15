import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './lib/api.js';
import { computeStats, computeXp } from './lib/progress.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [attemptsReady, setAttemptsReady] = useState(false);
  const [gameScores, setGameScores] = useState([]);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    api.getUser().then((u) => {
      setUser(u);
      setAuthReady(true);
    });
    return api.onAuthChange((u, event) => {
      setUser(u);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
    });
  }, []);

  const refreshAttempts = useCallback(async () => {
    if (!user) return;
    try {
      setAttempts(await api.listAttempts());
    } finally {
      setAttemptsReady(true);
    }
    api.listGameScores().then(setGameScores).catch(() => setGameScores([]));
  }, [user]);

  useEffect(() => {
    setAttempts([]);
    setGameScores([]);
    setAttemptsReady(false);
    if (user) refreshAttempts();
  }, [user, refreshAttempts]);

  const addAttempt = useCallback((row) => setAttempts((list) => [row, ...list]), []);
  const patchAttempt = useCallback((id, patch) => setAttempts((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a))), []);

  // Save a finished game and return the best previous score for that game.
  const addGameScore = useCallback(
    async (game, score, detail) => {
      const best = Math.max(0, ...gameScores.filter((g) => g.game === game).map((g) => g.score));
      try {
        const row = await api.saveGameScore({ game, score, detail });
        setGameScores((list) => [row, ...list]);
      } catch (e) {
        console.warn('Could not save game score', e);
      }
      return best;
    },
    [gameScores],
  );

  const stats = useMemo(() => computeStats(attempts), [attempts]);
  const xp = useMemo(() => computeXp(attempts, gameScores), [attempts, gameScores]);

  const value = { user, authReady, attempts, attemptsReady, stats, xp, gameScores, addGameScore, refreshAttempts, addAttempt, patchAttempt, recovering, setRecovering };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);

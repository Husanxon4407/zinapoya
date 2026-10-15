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
  const [loadError, setLoadError] = useState('');

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
    // Load answers and game scores together so pages never flash empty numbers.
    const [a, g] = await Promise.allSettled([api.listAttempts(), api.listGameScores()]);
    if (a.status === 'fulfilled') setAttempts(a.value);
    else setLoadError('We could not load your progress. Check your internet connection and refresh the page.');
    if (g.status === 'fulfilled') setGameScores(g.value);
    setAttemptsReady(true);
  }, [user]);

  useEffect(() => {
    setAttempts([]);
    setGameScores([]);
    setAttemptsReady(false);
    setLoadError('');
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

  const value = { user, authReady, attempts, attemptsReady, loadError, stats, xp, gameScores, addGameScore, refreshAttempts, addAttempt, patchAttempt, recovering, setRecovering };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);

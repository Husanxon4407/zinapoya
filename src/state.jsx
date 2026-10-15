import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './lib/api.js';
import { computeStats } from './lib/progress.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [attemptsReady, setAttemptsReady] = useState(false);
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
  }, [user]);

  useEffect(() => {
    setAttempts([]);
    setAttemptsReady(false);
    if (user) refreshAttempts();
  }, [user, refreshAttempts]);

  const addAttempt = useCallback((row) => setAttempts((list) => [row, ...list]), []);
  const patchAttempt = useCallback((id, patch) => setAttempts((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a))), []);

  const stats = useMemo(() => computeStats(attempts), [attempts]);

  const value = { user, authReady, attempts, attemptsReady, stats, refreshAttempts, addAttempt, patchAttempt, recovering, setRecovering };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);

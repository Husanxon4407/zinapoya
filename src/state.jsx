import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './lib/api.js';
import { computeStats, computeXp } from './lib/progress.js';
import { dataUrlToBlob } from './lib/image.js';
import { flushQueue } from './lib/offline.js';
import { takePendingArea } from './lib/area.js';
import { markReturning } from './lib/returning.js';
import { DEFAULT_AREA, isArea } from './data/areas.js';

export const PENDING_AVATAR = 'su_pending_avatar';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [attemptsReady, setAttemptsReady] = useState(false);
  const [gameScores, setGameScores] = useState([]);
  const [recovering, setRecovering] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.getUser().then((u) => {
      setUser(u);
      if (u) markReturning();
      setAuthReady(true);
    });
    return api.onAuthChange((u, event) => {
      setUser(u);
      if (u) markReturning();
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
    setLoadError('');
    // Guests have nothing to load: their pages show at once.
    setAttemptsReady(!user);
    if (user) refreshAttempts();
  }, [user, refreshAttempts]);

  // Profile (name, photo, role). A photo picked at signup waits in this browser until the first login.
  useEffect(() => {
    setProfile(null);
    if (!user) return;
    let alive = true;
    (async () => {
      let p = await api.getProfile(user).catch(() => null);
      const pending = localStorage.getItem(PENDING_AVATAR);
      if (pending) {
        try {
          p = await api.uploadAvatar(await dataUrlToBlob(pending));
          localStorage.removeItem(PENDING_AVATAR);
        } catch (e) {
          console.warn('Could not upload the signup photo', e);
        }
      }
      if (alive) setProfile(p || { id: user.id, name: user.name, avatar_url: null, role: 'student' });
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  // The areas this student joined. Accounts from before areas existed are in CEFR Multilevel.
  const savedAreas = (user?.areas || []).filter(isArea);
  const areas = user ? (savedAreas.length ? savedAreas : [DEFAULT_AREA]) : [];
  const areasKey = areas.join(',');
  // The area opened last (the default for "Home" links).
  const area = user && isArea(user.area) && areas.includes(user.area) ? user.area : areas[0] || DEFAULT_AREA;

  // Join one more area (one tap, no new registration) or replace the whole list ("About you").
  const saveAreas = useCallback(async (list, current) => {
    const clean = [...new Set(list.filter(isArea))];
    if (!clean.length) return;
    const u = await api.saveAreas(clean, clean.includes(current) ? current : clean[0]);
    if (u) setUser(u);
  }, []);
  const joinArea = useCallback(
    (id) => (isArea(id) ? saveAreas([...areasKey.split(',').filter(Boolean), id], id) : Promise.resolve()),
    [areasKey, saveAreas],
  );

  // An area picked before logging in (area page, sign-up, Google) is joined now.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const pending = takePendingArea();
    if (pending && !(user.areas || []).includes(pending)) {
      const list = (user.areas || []).filter(isArea);
      saveAreas([...(list.length ? list : user.area ? [user.area] : []), pending], pending).catch((e) =>
        console.warn('Could not save the chosen area', e),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // New students answer a few quick "About you" questions once (the teacher never does).
  // Only when the database has those fields (migration 09), so nothing breaks before it runs.
  const needsAbout = !!profile && profile.role !== 'teacher' && 'onboarded_at' in profile && !profile.onboarded_at;
  const saveAbout = useCallback(async (answers) => {
    const p = await api.updateProfile({ ...answers, onboarded_at: new Date().toISOString() });
    setProfile(p);
    return p;
  }, []);

  const addAttempt = useCallback((row) => setAttempts((list) => [row, ...list]), []);

  // Answers recorded offline: upload them now and whenever the internet comes back.
  useEffect(() => {
    if (!user || !attemptsReady) return undefined;
    const flush = () => flushQueue(addAttempt);
    flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [user, attemptsReady, addAttempt]);
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

  const value = { user, area, areas, joinArea, saveAreas, needsAbout, saveAbout, profile, setProfile, authReady, attempts, attemptsReady, loadError, stats, xp, gameScores, addGameScore, refreshAttempts, addAttempt, patchAttempt, recovering, setRecovering };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);

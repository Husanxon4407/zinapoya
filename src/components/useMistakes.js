import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../state.jsx';
import { api } from '../lib/api.js';
import { collectMistakes } from '../lib/mistakes.js';

// "Mastered" marks are saved bookmarks (kind 'mistake'), so they follow the student to any device.
// Used by Home (the count) and the Mistakes page.
export function useMistakes() {
  const { attempts } = useApp();
  const [marks, setMarks] = useState(null);
  const all = useMemo(() => collectMistakes(attempts), [attempts]);

  useEffect(() => {
    api
      .listBookmarks()
      .then((b) => setMarks(b.filter((x) => x.kind === 'mistake')))
      .catch(() => setMarks([]));
  }, []);

  const markOf = (key) => marks?.find((m) => m.text === key);

  async function setMastered(key, on) {
    const existing = markOf(key);
    if (on && !existing) {
      const row = await api.addBookmark({ kind: 'mistake', text: key }).catch(() => null);
      if (row) setMarks((m) => [row, ...m]);
    } else if (!on && existing) {
      setMarks((m) => m.filter((x) => x.id !== existing.id));
      await api.removeBookmark(existing.id).catch(() => {});
    }
  }

  const todo = all.filter((m) => !markOf(m.key));
  const done = all.filter((m) => markOf(m.key));
  return { ready: marks !== null, all, todo, done, setMastered };
}

import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Saved (starred) words and phrases, shared by the Vocabulary and Phrases pages.
export default function useSaved() {
  const [saved, setSaved] = useState([]);
  useEffect(() => {
    api.listBookmarks().then(setSaved).catch(() => {});
  }, []);

  const find = (text) => saved.find((b) => b.text === text);

  async function toggle(text, ref) {
    const existing = find(text);
    if (existing) {
      setSaved((s) => s.filter((b) => b.id !== existing.id));
      await api.removeBookmark(existing.id).catch(() => {});
    } else {
      const row = await api.addBookmark({ kind: 'phrase', ref, text }).catch(() => null);
      if (row) setSaved((s) => [row, ...s]);
    }
  }

  return { saved, isSaved: (t) => !!find(t), toggle };
}

import { useEffect, useState } from 'react';
import { PHRASE_GROUPS } from '../data/phrases.js';
import { PARTS } from '../../speaking/data/parts.js';
import { speak } from '../../../shared/lib/speech.js';
import { api } from '../../../shared/lib/api.js';

export default function Phrases() {
  const [tab, setTab] = useState('1.1');
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    api.listBookmarks().then(setSaved).catch(() => {});
  }, []);

  const savedFor = (text) => saved.find((b) => b.kind === 'phrase' && b.text === text);

  async function toggle(text, part) {
    const existing = savedFor(text);
    if (existing) {
      setSaved((s) => s.filter((b) => b.id !== existing.id));
      await api.removeBookmark(existing.id).catch(() => {});
    } else {
      const row = await api.addBookmark({ kind: 'phrase', ref: part, text }).catch(() => null);
      if (row) setSaved((s) => [row, ...s]);
    }
  }

  const group = PHRASE_GROUPS.find((g) => g.part === tab);
  const part = PARTS[tab];
  const mine = saved.filter((b) => b.kind === 'phrase');

  return (
    <div>
      <h1>💬 Phrase bank</h1>
      <p className="muted">Tap 🔊 to hear a phrase, ☆ to save it. Learn 3 new phrases a day and use them in your next answer!</p>

      {mine.length > 0 && (
        <div className="card saved-phrases">
          <h3>⭐ My saved phrases</h3>
          <div className="phrase-chips">
            {mine.map((b) => (
              <span key={b.id} className="phrase-chip">
                <button className="icon-btn" onClick={() => speak(b.text)}>
                  🔊
                </button>
                {b.text}
                <button className="icon-btn" title="Remove" onClick={() => toggle(b.text, b.ref)}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="tabs">
        {PHRASE_GROUPS.map((g) => (
          <button key={g.part} className={`tab ${tab === g.part ? 'tab--on' : ''}`} style={tab === g.part ? { background: PARTS[g.part].color } : undefined} onClick={() => setTab(g.part)}>
            {PARTS[g.part].emoji} {PARTS[g.part].name}
          </button>
        ))}
      </div>

      <h2 style={{ color: part.ink }}>{group.title}</h2>
      <div className="phrase-groups">
        {group.groups.map((g) => (
          <div key={g.name} className="card phrase-group" style={{ borderTopColor: part.color }}>
            <h3>{g.name}</h3>
            <ul>
              {g.items.map((p) => (
                <li key={p}>
                  <button className="icon-btn" onClick={() => speak(p)} title="Listen">
                    🔊
                  </button>
                  <span>{p}</span>
                  <button className={`icon-btn star ${savedFor(p) ? 'star--on' : ''}`} onClick={() => toggle(p, tab)} title="Save">
                    {savedFor(p) ? '★' : '☆'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

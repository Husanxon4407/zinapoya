import { useMemo } from 'react';

const ICONS = ['🎤', '📚', '✏️', '💬', '🎧', '🗣️', '⭐', '📖', '🧠', '🌍', 'A', 'B2', 'C1', '“ ”', '?', '!'];

// Fixed, decorative background: slowly drifting "prism" light blobs and
// floating study icons. Pure CSS animation, hidden from screen readers.
export default function Backdrop() {
  const floaters = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        icon: ICONS[i % ICONS.length],
        left: (i * 61) % 100,
        size: 16 + ((i * 7) % 18),
        dur: 26 + ((i * 13) % 22),
        delay: -((i * 17) % 40),
        drift: ((i % 2 ? 1 : -1) * (20 + ((i * 11) % 50))),
      })),
    [],
  );
  return (
    <div className="backdrop" aria-hidden>
      <span className="prism prism--1" />
      <span className="prism prism--2" />
      <span className="prism prism--3" />
      <span className="prism prism--4" />
      <div className="backdrop__grid" />
      {floaters.map((f, i) => (
        <span
          key={i}
          className="floater"
          style={{
            left: `${f.left}%`,
            fontSize: f.size,
            animationDuration: `${f.dur}s`,
            animationDelay: `${f.delay}s`,
            '--drift': `${f.drift}px`,
          }}
        >
          {f.icon}
        </span>
      ))}
    </div>
  );
}

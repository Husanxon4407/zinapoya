import { useEffect, useRef, useState } from 'react';
import { langAsked } from '../../i18n/index.js';
import { LANG_PICKED } from '../LangPicker.jsx';

// The hero headline types itself letter by letter: each letter comes out of a soft blur and rises
// into place while a small cursor runs along (each letter shows it while it is being typed); the red
// dot pops in last and the cursor blinks after it a few times.
// It waits until the visitor has picked a language in the first-visit popup (so it types in their
// language), and types again whenever the language changes. Letters are only hidden, never removed,
// so the line widths (and useFitText's sizing) never jump. Screen readers get the plain sentence.
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// onDone: called once the headline has finished typing (the 3D staircase waits for it, so its
// heavy start-up never makes the typing stutter).
export default function TypeTitle({ lines, lang, titleRef, className = '', onDone }) {
  const [go, setGo] = useState(() => langAsked());

  useEffect(() => {
    if (go) return undefined;
    const start = () => setGo(true);
    window.addEventListener(LANG_PICKED, start);
    return () => window.removeEventListener(LANG_PICKED, start);
  }, [go]);

  const total = lines.reduce((n, l) => n + Array.from(l).length, 0);
  // About 1.4 s for the whole headline, whatever the language (longer words type a bit faster).
  const step = Math.min(70, Math.max(38, 1400 / Math.max(1, total)));
  const LINE_PAUSE = 140;
  const still = reduced();
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  let t = 240; // small breath before the first letter
  const rendered = lines.map((line, li) => {
    const chars = Array.from(line).map((ch, ci) => {
      if (ch === ' ') {
        t += step * 0.6;
        return ' ';
      }
      const delay = t;
      t += step;
      return (
        <span key={ci} className="tchar" style={{ '--td': `${delay}ms`, '--ts': `${step}ms` }}>
          {ch}
        </span>
      );
    });
    t += LINE_PAUSE;
    return (
      <span key={li} className="fit-line">
        {chars}
        {li === lines.length - 1 && (
          <span className="hero3d__dot tdot" style={{ '--td': `${t}ms` }}>
            .
          </span>
        )}
      </span>
    );
  });

  const end = t;
  useEffect(() => {
    if (!go && !still) return undefined;
    const id = setTimeout(() => doneRef.current?.(), still ? 0 : end + 250);
    return () => clearTimeout(id);
  }, [go, still, end, lang]);

  return (
    <h1
      id="hero-title"
      ref={titleRef}
      className={`hero3d__title ${className} ${still ? '' : go ? 'is-typing' : 'is-waiting'}`}
      aria-label={lines.join(' ') + '.'}
    >
      {/* new key = the letters mount again, so the typing replays (after the popup, on a language change) */}
      <span key={`${lang}-${go}`} aria-hidden="true">
        {rendered}
      </span>
    </h1>
  );
}

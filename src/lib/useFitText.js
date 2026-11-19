import { useLayoutEffect, useRef } from 'react';

// Makes a headline made of one-line parts (<span class="fit-line">) as big as possible without any
// line overflowing its box. Uzbek and Russian words are longer than English ones, so a fixed font
// size that fits English would spill into the picture next to it.
// `maxVh`: also never taller than this share of the window height (a 3-line title must leave room
// for the rest of the opening screen on short laptop screens).
// `deps` should include the language, so it refits after a language change.
export function useFitText({ max = 92, min = 26, maxVh = 0 } = {}, deps = []) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      const top = maxVh ? Math.max(min, Math.min(max, (window.innerHeight * maxVh) / 100)) : max;
      el.style.fontSize = `${top}px`;
      const width = el.clientWidth;
      const lines = [...el.querySelectorAll('.fit-line')];
      const widest = Math.max(1, ...lines.map((l) => l.scrollWidth));
      const size = Math.max(min, Math.min(top, Math.floor((top * width) / widest) - 1));
      el.style.fontSize = `${size}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    // Web fonts change the width once they arrive.
    document.fonts?.ready.then(fit).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, min, maxVh, ...deps]);

  return ref;
}

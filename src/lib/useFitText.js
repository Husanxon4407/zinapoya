import { useLayoutEffect, useRef } from 'react';

// Makes a headline made of one-line parts (<span class="fit-line">) as big as possible without any
// line overflowing its box. Uzbek and Russian words are longer than English ones, so a fixed font
// size that fits English would spill into the picture next to it.
// `deps` should include the language, so it refits after a language change.
export function useFitText({ max = 92, min = 26 } = {}, deps = []) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      el.style.fontSize = `${max}px`;
      const width = el.clientWidth;
      const lines = [...el.querySelectorAll('.fit-line')];
      const widest = Math.max(1, ...lines.map((l) => l.scrollWidth));
      const size = Math.max(min, Math.min(max, Math.floor((max * width) / widest) - 1));
      el.style.fontSize = `${size}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // Web fonts change the width once they arrive.
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, min, ...deps]);

  return ref;
}

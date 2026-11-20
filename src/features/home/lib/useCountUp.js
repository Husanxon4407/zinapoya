import { useEffect, useRef, useState } from 'react';

// Counts up to `target` once the element is in view. If `target` changes later (e.g. the real
// number arrives from the server after the animation already ran), it animates to the new value.
// Respects "reduce motion" (jumps straight to the number).
export function useCountUp(target, { duration = 1400 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const [visible, setVisible] = useState(false);
  const fromRef = useRef(0);

  // Reveal when scrolled into view (once).
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  // Animate to the target whenever it changes (once visible).
  useEffect(() => {
    const end = Number(target) || 0;
    if (!visible) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = fromRef.current;
    if (reduce || end === from) {
      fromRef.current = end;
      setValue(end);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out
      const v = Math.round(from + (end - from) * eased);
      setValue(v);
      fromRef.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = end;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, visible, duration]);

  return [ref, value];
}

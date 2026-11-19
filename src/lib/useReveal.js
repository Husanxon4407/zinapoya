import { useEffect } from 'react';

// Fade-and-rise elements with the `reveal` class as they scroll into view (once).
// Without IntersectionObserver, or with "reduce motion", everything is simply shown.
// Elements that appear later (another area opened on the same page, content that loads after)
// are picked up too, so nothing stays invisible until a refresh.
export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const canWatch = 'IntersectionObserver' in window && !reduce;

    const io = canWatch
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add('is-in');
                io.unobserve(e.target);
              }
            }),
          { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
        )
      : null;

    const watch = (el) => {
      if (el.classList.contains('is-in')) return;
      if (io) io.observe(el);
      else el.classList.add('is-in');
    };
    const scan = (node) => {
      if (!(node instanceof Element)) return;
      if (node.classList.contains('reveal')) watch(node);
      node.querySelectorAll('.reveal').forEach(watch);
    };

    scan(root);
    const mo = new MutationObserver((records) =>
      records.forEach((r) => {
        r.addedNodes.forEach(scan);
        // React may rewrite a reused element's class list (dropping "is-in"): watch it again.
        if (r.type === 'attributes' && r.target.classList.contains('reveal')) watch(r.target);
      }),
    );
    mo.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, [rootRef]);
}

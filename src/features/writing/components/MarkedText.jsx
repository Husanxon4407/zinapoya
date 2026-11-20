import { useEffect, useMemo, useRef } from 'react';
import { useT } from '../../../i18n/index.js';
import { useUz } from './useUz.jsx';

// Colours (plan 6.5): red = blocks meaning · orange = noticeable · yellow = small slip ·
// blue = better word idea · green underline = strength.
export const SEVERITY = {
  blocks_meaning: { cls: 'w-mark--red', label: 'Blocks meaning' },
  noticeable: { cls: 'w-mark--orange', label: 'Mistake' },
  small: { cls: 'w-mark--yellow', label: 'Small slip' },
};

const TYPE_NAMES = {
  grammar: 'Grammar', vocabulary: 'Vocabulary', spelling: 'Spelling', punctuation: 'Punctuation', register: 'Style (register)',
  linking: 'Linking words', word_order: 'Word order', article: 'Articles', preposition: 'Prepositions', tense: 'Tenses', agreement: 'Subject–verb agreement',
};
export const typeName = (type) => TYPE_NAMES[type] || 'Grammar';

/** All marks in reading order: errors and better-word ideas (never overlapping), plus strengths where free. */
export function buildMarks(result) {
  const marks = [
    ...(result.errors || []).map((e) => ({ ...e, kind: 'error' })),
    ...(result.better_words || []).map((b) => ({ ...b, kind: 'better' })),
  ].sort((a, b) => a.start - b.start);
  const overlaps = (s, e) => marks.some((m) => s < m.end && e > m.start);
  for (const s of result.strengths || []) {
    if (s.start != null && !overlaps(s.start, s.end)) marks.push({ ...s, kind: 'strength' });
  }
  return marks.sort((a, b) => a.start - b.start);
}

/** The student's text with tappable coloured marks. `selected` = index into `marks`. */
export default function MarkedText({ text, marks, selected, onSelect }) {
  const t = useT();
  const parts = useMemo(() => {
    const out = [];
    let pos = 0;
    marks.forEach((m, i) => {
      if (m.start < pos) return; // safety: skip anything overlapping
      if (m.start > pos) out.push({ text: text.slice(pos, m.start) });
      out.push({ text: text.slice(m.start, m.end), mark: m, index: i });
      pos = m.end;
    });
    if (pos < text.length) out.push({ text: text.slice(pos) });
    return out;
  }, [text, marks]);

  return (
    <div className="w-marked" aria-label={t('Your text with marks')}>
      {parts.map((p, k) => {
        if (!p.mark) return <span key={k}>{p.text}</span>;
        const m = p.mark;
        const cls = m.kind === 'error' ? SEVERITY[m.severity]?.cls : m.kind === 'better' ? 'w-mark--blue' : 'w-mark--green';
        const label = m.kind === 'error' ? `${t(SEVERITY[m.severity]?.label)}: ${m.original} → ${m.suggestion}` : m.kind === 'better' ? t('Better word idea') : t('Strength');
        return (
          <button
            key={k}
            type="button"
            className={`w-mark ${cls} ${selected === p.index ? 'is-selected' : ''}`}
            onClick={() => onSelect(p.index)}
            aria-label={label}
          >
            {p.text}
          </button>
        );
      })}
    </div>
  );
}

/** The explanation panel for one mark, with Previous / Next mistake. */
export function MarkSheet({ marks, selected, onSelect, onClose }) {
  const t = useT();
  const [uz] = useUz();
  const ref = useRef(null);
  const m = marks[selected];
  useEffect(() => {
    ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);
  if (!m) return null;
  const errorIdx = marks.map((x, i) => (x.kind === 'error' ? i : -1)).filter((i) => i >= 0);
  const pos = errorIdx.indexOf(selected);
  const next = errorIdx.find((i) => i > selected);
  const prev = [...errorIdx].reverse().find((i) => i < selected);
  return (
    <div className="card w-sheet" ref={ref} role="region" aria-live="polite">
      <button type="button" className="icon-btn w-sheet__close" onClick={onClose} aria-label={t('Close')}>
        ✕
      </button>
      {m.kind === 'error' && (
        <>
          <small className={`w-sheet__kind ${SEVERITY[m.severity]?.cls}`}>
            {t(SEVERITY[m.severity]?.label)} · {t(typeName(m.type))}
            {pos >= 0 && <span className="muted"> · {t('{a} of {b}', { a: pos + 1, b: errorIdx.length })}</span>}
          </small>
          <p className="w-sheet__fix">
            <s>{m.original}</s> <span aria-hidden="true">→</span> <strong>{m.suggestion}</strong>
          </p>
          <p>{uz ? m.explain_uz || m.explain : m.explain}</p>
        </>
      )}
      {m.kind === 'better' && (
        <>
          <small className="w-sheet__kind w-mark--blue">
            {t('Better word idea')} · {m.level}
          </small>
          <p className="w-sheet__fix">
            “{m.original}” <span aria-hidden="true">→</span> <strong>{m.ideas.join(' / ')}</strong>
          </p>
          <p className="muted small">{t('Not a mistake — a way to sound more advanced.')}</p>
        </>
      )}
      {m.kind === 'strength' && (
        <>
          <small className="w-sheet__kind w-mark--green">💪 {t('Strength')}</small>
          <p className="w-sheet__fix">“{m.quote}”</p>
          <p>{uz ? m.why_uz || m.why : m.why}</p>
        </>
      )}
      <div className="w-sheet__nav">
        <button type="button" className="btn btn--ghost btn--small" disabled={prev === undefined} onClick={() => onSelect(prev)}>
          ← {t('Previous')}
        </button>
        <button type="button" className="btn btn--small" disabled={next === undefined} onClick={() => onSelect(next)}>
          {t('Next mistake')} →
        </button>
      </div>
    </div>
  );
}

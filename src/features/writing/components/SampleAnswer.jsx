import { useState } from 'react';
import { useT } from '../../../i18n/index.js';
import { countWords } from '../rules.js';

/** A sample answer with its word count. `hideFirst`: closed, with a nudge to try writing first. */
export default function SampleAnswer({ task, hideFirst = false }) {
  const t = useT();
  const [open, setOpen] = useState(!hideFirst);
  if (!task.sample) return null;
  return (
    <section className="card w-sample">
      <div className="w-sample__head">
        <h2 className="w-section-title">📄 {t('Sample answer')}</h2>
        {!open && (
          <button type="button" className="btn btn--ghost btn--small" onClick={() => setOpen(true)}>
            {t('Show')}
          </button>
        )}
      </div>
      {!open ? (
        <p className="muted small">{t('Try writing your own answer first — then compare.')}</p>
      ) : (
        <>
          <div className="w-sample__text">{task.sample}</div>
          <p className="muted small">
            {t('{n} words', { n: countWords(task.sample) })}
            {task.sampleNote && <> · ⚠️ {t(task.sampleNote)} {t('In the exam, keep to the official length.')}</>}
            {task.source === 'book' && <> · 📘 {t('From an exam book, for testing.')}</>}
          </p>
        </>
      )}
    </section>
  );
}

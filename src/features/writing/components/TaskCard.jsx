import { useT } from '../../../i18n/index.js';
import { PARTS } from '../rules.js';

export const PART_COLORS = { '1.1': 'var(--p11)', '1.2': 'var(--p12)', 2: 'var(--p2)' };

/** "Task 1.2 · Formal email · 120–150 words" chip. */
export function PartChip({ part }) {
  const t = useT();
  const p = PARTS[part];
  if (!p) return null;
  return (
    <span className="w-chip" style={{ '--wc': PART_COLORS[part] }}>
      {t(p.name)} · {t(p.kind)} · {part === '1.1' ? t('about 50 words') : t('{a}–{b} words', { a: p.min, b: p.max })}
    </span>
  );
}

/** The task as the exam shows it: the situation, the input email (or prompt) and the instruction. */
export default function TaskCard({ task, compact = false }) {
  const t = useT();
  const isEmail = task.part !== '2';
  return (
    <section className={`card w-task ${compact ? 'w-task--compact' : ''}`}>
      <div className="w-task__head">
        <PartChip part={task.part} />
        {task.source === 'book' && (
          <span className="w-chip w-chip--muted" title={task.ref}>
            📘 {t('Test task from an exam book')}
          </span>
        )}
      </div>
      <h1 className="w-task__title">
        <span aria-hidden="true">{task.emoji}</span> {t(task.title)}
      </h1>
      {task.context && isEmail && <p className="w-task__context">{task.context}</p>}
      {isEmail ? (
        <div className="w-email" aria-label={t('The email you received')}>
          {task.from && (
            <div className="w-email__from">
              <span aria-hidden="true">✉️</span> {task.from}
            </div>
          )}
          <div className="w-email__body">{task.input}</div>
        </div>
      ) : (
        <div className="w-prompt">
          <span className="w-prompt__genre">{t(task.context)}</span>
          <p>{task.input}</p>
        </div>
      )}
      <p className="w-task__instruction">
        <strong>{t('Your task:')}</strong> {task.instruction}
      </p>
    </section>
  );
}

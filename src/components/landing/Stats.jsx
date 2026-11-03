import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { QUESTION_COUNT } from '../../data/site.js';
import { useCountUp } from '../../lib/useCountUp.js';
import { useT } from '../../i18n/index.js';

function Stat({ value, label, suffix = '' }) {
  const [ref, n] = useCountUp(value);
  return (
    <div className="stat-tile" ref={ref}>
      <strong className="stat-tile__num">
        {n.toLocaleString('en-US')}
        {suffix}
      </strong>
      <span className="stat-tile__label">{label}</span>
    </div>
  );
}

export default function Stats() {
  const t = useT();
  const [s, setS] = useState({ students: 0, answers: 0, active_week: 0 });

  useEffect(() => {
    let alive = true;
    api
      .publicStats()
      .then((d) => alive && setS(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="stats-row" aria-label={t('Our results so far')}>
      <Stat value={s.students} label={t('Students learning')} suffix="+" />
      <Stat value={s.answers} label={t('Answers practised')} suffix="+" />
      <Stat value={s.active_week} label={t('Active this week')} />
      <Stat value={QUESTION_COUNT} label={t('Exam questions')} />
    </section>
  );
}

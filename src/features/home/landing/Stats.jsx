import { useEffect, useState } from 'react';
import { api } from '../../../shared/lib/api.js';
import { QUESTION_COUNT } from '../../../shared/data/site.js';
import { useCountUp } from '../lib/useCountUp.js';
import { useT } from '../../../i18n/index.js';

function Stat({ value, label, note, suffix = '', i }) {
  const [ref, n] = useCountUp(value);
  return (
    <div className="stat-card reveal" ref={ref} style={{ '--d': i }}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__num">
        {n.toLocaleString('en-US')}
        {suffix}
      </strong>
      <span className="stat-card__note">{note}</span>
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
    <section className="home-sec" aria-labelledby="stats-title">
      <div className="home-sec__head reveal">
        <span className="eyebrow">{t('In numbers')}</span>
        <h2 id="stats-title">{t('Our results so far')}</h2>
      </div>
      <div className="stats-grid">
        <Stat i={0} value={s.students} label={t('Students learning')} note={t('with a free account')} suffix="+" />
        <Stat i={1} value={s.answers} label={t('Answers practised')} note={t('recorded and checked')} suffix="+" />
        <Stat i={2} value={s.active_week} label={t('Active this week')} note={t('practised in the last 7 days')} />
        <Stat i={3} value={QUESTION_COUNT} label={t('Exam questions')} note={t('in the Speaking bank')} />
      </div>
    </section>
  );
}

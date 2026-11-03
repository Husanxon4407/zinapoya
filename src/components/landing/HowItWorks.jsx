import { STEPS, RULES } from '../../data/site.js';
import { useT } from '../../i18n/index.js';

export default function HowItWorks() {
  const t = useT();
  return (
    <section className="how" id="how">
      <h2 className="section-title">{t('How it works')}</h2>
      <div className="how-steps">
        {STEPS.map((step, i) => (
          <div className="how-step" key={step.title}>
            <span className="how-step__num">{i + 1}</span>
            <span className="how-step__emoji">{step.emoji}</span>
            <h3>{t(step.title)}</h3>
            <p>{t(step.text)}</p>
          </div>
        ))}
      </div>
      <div className="card rules">
        <h3>📋 {t('Exam rules (Speaking)')}</h3>
        <ul>
          {RULES.map((r) => (
            <li key={r}>{t(r)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

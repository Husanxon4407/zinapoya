import { STEPS } from '../../../shared/data/site.js';
import { useT } from '../../../i18n/index.js';

export default function HowItWorks() {
  const t = useT();
  return (
    <section className="home-sec" id="how" aria-labelledby="how-title">
      <div className="home-sec__head reveal">
        <span className="eyebrow">{t('How it works')}</span>
        <h2 id="how-title">{t('Four steps to your next level')}</h2>
      </div>
      <div className="how-grid">
        {STEPS.map((step, i) => (
          <div className="how-card reveal" key={step.title} style={{ '--d': i }}>
            <div className="how-card__head">
              <span className="how-card__emoji" aria-hidden="true">
                {step.emoji}
              </span>
              <span className="how-card__num">{i + 1}</span>
            </div>
            <h3>{t(step.title)}</h3>
            <p>{t(step.text)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

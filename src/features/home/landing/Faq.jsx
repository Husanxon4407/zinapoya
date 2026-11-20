import { useState } from 'react';
import { FAQ } from '../../../shared/data/site.js';
import { useT } from '../../../i18n/index.js';

export default function Faq() {
  const t = useT();
  const [open, setOpen] = useState(0);
  return (
    <section className="home-sec home-qa__faq" id="faq" aria-labelledby="faq-title">
      <div className="home-sec__head reveal">
        <span className="eyebrow">{t('FAQ')}</span>
        <h2 id="faq-title">{t('Frequently asked questions')}</h2>
        <p>{t('Quick answers to what new students ask most.')}</p>
      </div>
      <div className="faq-list reveal">
        {FAQ.map((item, i) => (
          <div className={`faq-item ${open === i ? 'is-open' : ''}`} key={item.q}>
            <button className="faq-item__q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
              <span>{t(item.q)}</span>
              <span className="faq-item__icon" aria-hidden="true" />
            </button>
            {open === i && <p className="faq-item__a">{t(item.a)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

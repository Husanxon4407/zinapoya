import { useState } from 'react';
import { FAQ } from '../../data/site.js';
import { useT } from '../../i18n/index.js';

export default function Faq() {
  const t = useT();
  const [open, setOpen] = useState(0);
  return (
    <section className="faq" id="faq">
      <h2 className="section-title">{t('Frequently asked questions')}</h2>
      <div className="faq-list">
        {FAQ.map((item, i) => (
          <div className={`faq-item ${open === i ? 'is-open' : ''}`} key={item.q}>
            <button className="faq-item__q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
              <span>{t(item.q)}</span>
              <span className="faq-item__icon">{open === i ? '–' : '+'}</span>
            </button>
            {open === i && <p className="faq-item__a">{t(item.a)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

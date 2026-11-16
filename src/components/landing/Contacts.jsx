import { CONTACTS } from '../../data/site.js';
import { useT } from '../../i18n/index.js';

export default function Contacts() {
  const t = useT();
  return (
    <section className="home-sec" id="contacts" aria-labelledby="contacts-title">
      <div className="home-sec__head reveal">
        <span className="eyebrow">{t('Contacts')}</span>
        <h2 id="contacts-title">{t('Get in touch')}</h2>
      </div>
      <div className="contacts-grid">
        {CONTACTS.map((c, i) => (
          <a key={c.id} className="contact-tile reveal" style={{ '--d': i }} href={c.href} target="_blank" rel="noreferrer">
            <span className="contact-tile__emoji">{c.emoji}</span>
            <span className="contact-tile__label">{t(c.label)}</span>
            <span className="contact-tile__value">{c.value}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

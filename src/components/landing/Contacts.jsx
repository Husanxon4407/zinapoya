import { CONTACTS } from '../../data/site.js';
import { useT } from '../../i18n/index.js';

export default function Contacts() {
  const t = useT();
  return (
    <section className="contacts" id="contacts">
      <h2 className="section-title">{t('Get in touch')}</h2>
      <div className="contacts-grid">
        {CONTACTS.map((c) => (
          <a key={c.id} className="contact-tile" href={c.href} target="_blank" rel="noreferrer">
            <span className="contact-tile__emoji">{c.emoji}</span>
            <span className="contact-tile__label">{t(c.label)}</span>
            <span className="contact-tile__value">{c.value}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

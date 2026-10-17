import { LANGS, setLang, useLang, useT } from '../i18n/index.js';

// 🌐 EN / OʻZ / РУ: changes menus and instructions, not the English practice itself.
export default function LangSwitch({ full = false }) {
  const lang = useLang();
  const t = useT();
  return (
    <label className="lang-switch" title={t('Language')}>
      <span aria-hidden="true">🌐</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('Language')}>
        {LANGS.map((l) => (
          <option key={l.id} value={l.id}>
            {full ? l.name : l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

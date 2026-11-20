import { useT } from '../../../i18n/index.js';
import { PARTS, lengthZone } from '../rules.js';

const ZONE_TEXT = {
  short: 'Too short — the official rule lowers the score',
  low: 'A little short',
  ok: 'Good length',
  long: 'Over the limit',
};

/** Word count with coloured zones (plan 6.4): red = official length penalty, amber = short/long, green = target. */
export default function WordBar({ part, words, paragraphs }) {
  const t = useT();
  const p = PARTS[part];
  const top = Math.round(p.max * 1.25);
  const zone = lengthZone(part, words);
  const pct = (n) => `${Math.min(100, (n / top) * 100)}%`;
  const hardShort = part === '1.1' ? 25 : part === '1.2' ? 60 : 90;
  return (
    <div className={`w-wordbar w-wordbar--${zone}`}>
      <div className="w-wordbar__track" role="meter" aria-valuemin={0} aria-valuemax={top} aria-valuenow={words} aria-label={t('Word count')}>
        <span className="w-wordbar__zone w-wordbar__zone--short" style={{ width: pct(hardShort) }} />
        <span className="w-wordbar__zone w-wordbar__zone--ok" style={{ left: pct(p.min), width: `calc(${pct(p.max)} - ${pct(p.min)})` }} />
        <span className="w-wordbar__fill" style={{ width: pct(words) }} />
      </div>
      <div className="w-wordbar__info">
        <strong>
          {t('{n} words', { n: words })}
          <span className="muted"> / {part === '1.1' ? '~50' : `${p.min}–${p.max}`}</span>
        </strong>
        <span className="w-wordbar__zone-text">{words ? t(ZONE_TEXT[zone]) : t('Start writing…')}</span>
        {part !== '1.1' && <span className="muted small">{t('Paragraphs: {n}', { n: paragraphs })}</span>}
      </div>
    </div>
  );
}

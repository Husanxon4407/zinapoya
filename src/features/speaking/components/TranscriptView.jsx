import { useMemo, useState } from 'react';
import { checkWords } from '../lib/wordDiff.js';
import { useT } from '../../../i18n/index.js';

/**
 * The checked transcript, sentence by sentence.
 * - Tap a sentence: the recording plays from that moment, so the student can listen and compare.
 * - Words the AI was unsure about, or that the live text heard differently, are underlined.
 *   Tapping one plays its sentence and shows what else was heard.
 */
export default function TranscriptView({ segments, compareWith = '', onPlayFrom }) {
  const t = useT();
  const checked = useMemo(() => checkWords(segments, compareWith), [segments, compareWith]);
  const [picked, setPicked] = useState(null); // token index
  const flagged = checked.reduce((n, s) => n + s.tokens.filter((x) => x.unclear || x.differs).length, 0);
  const pickedTok = picked === null ? null : checked.flatMap((s) => s.tokens).find((x) => x.index === picked);

  return (
    <div className="tview">
      {flagged > 0 ? (
        <p className="tview__hint">
          🔍 {t('{n} words to check. Tap an underlined word to hear that part of your recording.', { n: flagged })}
        </p>
      ) : (
        <p className="tview__hint">🎧 {t('Tap any sentence to hear that part of your recording.')}</p>
      )}
      <div className="tview__text">
        {checked.map((seg, si) => (
          <span key={si} className="tview__seg" role="button" tabIndex={0} onClick={() => onPlayFrom?.(seg.start_sec)} onKeyDown={(e) => e.key === 'Enter' && onPlayFrom?.(seg.start_sec)}>
            {onPlayFrom && <span className="tview__time">{fmt(seg.start_sec)}</span>}
            {seg.tokens.map((tok) =>
              tok.unclear || tok.differs ? (
                <button
                  key={tok.index}
                  type="button"
                  className={`tview__word ${tok.unclear ? 'tview__word--unclear' : 'tview__word--differs'} ${picked === tok.index ? 'is-picked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPicked(picked === tok.index ? null : tok.index);
                    onPlayFrom?.(seg.start_sec);
                  }}
                >
                  {tok.text}
                </button>
              ) : (
                <span key={tok.index}>{tok.text}</span>
              ),
            ).reduce((acc, el, i) => (i ? [...acc, ' ', el] : [el]), [])}{' '}
          </span>
        ))}
      </div>
      {pickedTok && (
        <p className="tview__note">
          <b>“{pickedTok.text}”</b> —{' '}
          {pickedTok.unclear && pickedTok.alt
            ? t('the AI was not sure, and the live text heard “{alt}”.', { alt: pickedTok.alt })
            : pickedTok.unclear
              ? t('the AI was not sure about this word.')
              : t('the live text heard “{alt}”.', { alt: pickedTok.alt })}{' '}
          {t('Listen: if it is wrong, press “Fix the text”. If you really said it unclearly, practise this word!')}
        </p>
      )}
    </div>
  );
}

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

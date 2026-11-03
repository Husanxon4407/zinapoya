// Live microphone level, so the student can SEE that the microphone hears them.
export default function MicMeter({ level = 0, silent = false }) {
  const bars = 12;
  const lit = Math.round(Math.min(1, level) * bars);
  return (
    <div className={`mic-meter ${silent ? 'mic-meter--silent' : ''}`} aria-hidden="true">
      <span className="mic-meter__icon">🎙️</span>
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className={`mic-meter__bar ${i < lit ? 'is-on' : ''}`} style={{ height: `${6 + i * 1.4}px` }} />
      ))}
    </div>
  );
}

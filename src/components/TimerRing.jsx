export default function TimerRing({ remaining, total, color = 'var(--primary)', label, size = 140 }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return (
    <div className="timer-ring" style={{ width: size, height: size }} role="timer" aria-label={`${remaining} seconds left`}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--track)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 0.25s linear' }}
        />
      </svg>
      <div className="timer-ring__text">
        <strong>{mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : secs}</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  );
}

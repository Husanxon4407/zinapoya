import { useEffect, useRef, useState } from 'react';

// Counts down from `seconds` while `running`; calls onEnd once at zero.
export default function useCountdown(seconds, running, onEnd) {
  const [remaining, setRemaining] = useState(seconds);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  useEffect(() => {
    setRemaining(seconds);
    if (!running) return undefined;
    const endsAt = Date.now() + seconds * 1000;
    let done = false;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !done) {
        done = true;
        clearInterval(id);
        endRef.current?.();
      }
    }, 200);
    return () => clearInterval(id);
  }, [seconds, running]);

  return remaining;
}

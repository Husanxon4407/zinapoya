import { useEffect, useState } from 'react';
import { setMotion } from '../lib/theme.js';
import { musicState, musicWanted, onMusicChange, setMusicVolume, setSfx, sfx, sfxEnabled, startMusic, stopMusic } from '../lib/sound.js';

// 🎵 button in the top bar: background music on/off, volume and game sounds.
export default function SoundControls() {
  const [state, setState] = useState(musicState());
  const [effects, setEffects] = useState(sfxEnabled());
  const [hint, setHint] = useState(false);
  const [motion, setMotionState] = useState(() => {
    try {
      return localStorage.getItem('su_motion') !== 'off';
    } catch {
      return true;
    }
  });

  useEffect(() => onMusicChange(setState), []);

  // Browsers only allow sound after a click, so offer to resume the music.
  useEffect(() => {
    if (musicWanted() && !musicState().playing) setHint(true);
  }, []);

  function toggle() {
    setHint(false);
    if (state.playing) stopMusic();
    else startMusic();
  }

  return (
    <details className="soundmenu">
      <summary className={`soundmenu__btn ${state.playing ? 'soundmenu__btn--on' : ''}`} title="Music and sounds">
        {state.playing ? '🎵' : '🔈'}
        {hint && <span className="soundmenu__dot" />}
      </summary>
      <div className="soundmenu__panel">
        <strong>🎧 Music & look</strong>
        <p className="muted small">Calm background music. It pauses automatically while you are recording.</p>
        <button className={`btn btn--small ${state.playing ? 'btn--ghost' : ''}`} onClick={toggle}>
          {state.playing ? '⏸ Pause music' : '▶ Play music'}
        </button>
        <label className="volume">
          <span>🔉</span>
          <input type="range" min="0" max="1" step="0.05" value={state.volume} onChange={(e) => setMusicVolume(Number(e.target.value))} />
          <span>🔊</span>
        </label>
        <label className="switch">
          <input
            type="checkbox"
            checked={effects}
            onChange={(e) => {
              setSfx(e.target.checked);
              setEffects(e.target.checked);
              if (e.target.checked) sfx('correct');
            }}
          />
          <span>Game sounds</span>
        </label>
        <label className="switch">
          <input
            type="checkbox"
            checked={motion}
            onChange={(e) => {
              setMotion(e.target.checked);
              setMotionState(e.target.checked);
            }}
          />
          <span>Moving background</span>
        </label>
      </div>
    </details>
  );
}

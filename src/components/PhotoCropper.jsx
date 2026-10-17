import { useCallback, useEffect, useRef, useState } from 'react';
import { cropToBlob } from '../lib/image.js';

const MAX_ZOOM = 4;
const OUTPUT_SIZE = 320;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Lets the student zoom and move a photo inside a round frame, then saves the visible part.
export default function PhotoCropper({ file, onCancel, onSave }) {
  const frameRef = useRef(null);
  const [img, setImg] = useState(null); // { el, url, w, h }
  const [frame, setFrame] = useState(280);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  // Load the photo (the URL stays alive while the editor is open).
  useEffect(() => {
    let alive = true;
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.onload = () => alive && setImg({ el, url, w: el.naturalWidth, h: el.naturalHeight });
    el.onerror = () => alive && setError('This photo could not be read. Try a JPG or PNG.');
    el.src = url;
    return () => {
      alive = false;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // The frame shrinks on small phones.
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;
    const ro = new ResizeObserver(([e]) => setFrame(Math.round(e.contentRect.width)));
    ro.observe(node);
    return () => ro.disconnect();
  }, [img]);

  // Keep the photo covering the whole frame, whatever the zoom and position.
  const fit = useCallback(
    (v) => {
      if (!img) return v;
      const zoom = clamp(v.zoom, 1, MAX_ZOOM);
      const scale = (frame / Math.min(img.w, img.h)) * zoom;
      const maxX = (img.w * scale - frame) / 2;
      const maxY = (img.h * scale - frame) / 2;
      return { zoom, x: clamp(v.x, -maxX, maxX), y: clamp(v.y, -maxY, maxY) };
    },
    [img, frame],
  );

  const zoomTo = useCallback(
    (z) =>
      setView((v) => {
        const zoom = clamp(z, 1, MAX_ZOOM);
        // Zoom around the centre of the frame.
        return fit({ zoom, x: (v.x * zoom) / v.zoom, y: (v.y * zoom) / v.zoom });
      }),
    [fit],
  );

  useEffect(() => setView((v) => fit(v)), [fit]);

  // Mouse wheel / trackpad zoom (needs a non-passive listener to stop the page scrolling).
  useEffect(() => {
    const node = frameRef.current;
    if (!node) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      setView((v) => {
        const zoom = clamp(v.zoom * Math.exp(-e.deltaY * 0.0015), 1, MAX_ZOOM);
        return fit({ zoom, x: (v.x * zoom) / v.zoom, y: (v.y * zoom) / v.zoom });
      });
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [fit, img]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  useEffect(() => {
    if (img) frameRef.current?.focus();
  }, [img]);

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  function down(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) pinch.current = { dist: distance(), zoom: view.zoom };
  }

  function move(e) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      setView((v) => fit({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (pointers.current.size === 2 && pinch.current) {
      zoomTo((pinch.current.zoom * distance()) / pinch.current.dist);
    }
  }

  function up(e) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }

  function key(e) {
    const step = e.shiftKey ? 40 : 10;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setView((v) => fit({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (e.key === '+' || e.key === '=') {
      zoomTo(view.zoom * 1.15);
    } else if (e.key === '-') {
      zoomTo(view.zoom / 1.15);
    }
  }

  async function save() {
    if (!img) return;
    setSaving(true);
    try {
      const scale = (frame / Math.min(img.w, img.h)) * view.zoom;
      const left = frame / 2 - (img.w * scale) / 2 + view.x;
      const top = frame / 2 - (img.h * scale) / 2 + view.y;
      await onSave(await cropToBlob(img.el, -left / scale, -top / scale, frame / scale, OUTPUT_SIZE));
    } catch (e) {
      setError(e.message || 'This photo could not be saved.');
      setSaving(false);
    }
  }

  const scale = img ? (frame / Math.min(img.w, img.h)) * view.zoom : 1;

  return (
    <div className="cropper-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="card cropper" role="dialog" aria-modal="true" aria-labelledby="cropper-title">
        <h3 id="cropper-title">Adjust your photo</h3>
        <p className="muted small">Drag the photo to move it. Zoom to make your face bigger.</p>

        {error && <p className="notice notice--warn">{error}</p>}

        <div
          ref={frameRef}
          className="cropper__frame"
          tabIndex={0}
          aria-label="Photo position. Use the arrow keys to move and + or - to zoom."
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={key}
        >
          {img ? (
            <img
              src={img.url}
              alt=""
              draggable={false}
              style={{
                width: img.w * scale,
                height: img.h * scale,
                transform: `translate(${frame / 2 - (img.w * scale) / 2 + view.x}px, ${frame / 2 - (img.h * scale) / 2 + view.y}px)`,
              }}
            />
          ) : (
            !error && <div className="spinner" />
          )}
          <span className="cropper__ring" aria-hidden="true" />
        </div>

        <label className="cropper__zoom">
          <span aria-hidden="true">🔍−</span>
          <input
            type="range"
            min="1"
            max={MAX_ZOOM}
            step="0.01"
            value={view.zoom}
            onChange={(e) => zoomTo(Number(e.target.value))}
            aria-label="Zoom"
            disabled={!img}
          />
          <span aria-hidden="true">🔍+</span>
        </label>

        <div className="cropper__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={save} disabled={!img || saving}>
            {saving ? 'Saving…' : '✅ Use this photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

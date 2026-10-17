import { useRef } from 'react';
import Avatar from './Avatar.jsx';
import { squareImage } from '../lib/image.js';

// Shows the photo with "Choose photo" / "Remove" buttons. onPick receives a small square JPEG blob.
export default function AvatarPicker({ name, url, onPick, onRemove, busy = false, onError }) {
  const input = useRef(null);

  async function choose(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await onPick(await squareImage(file));
    } catch (err) {
      onError?.(err.message);
    }
  }

  return (
    <div className="avatar-picker">
      <Avatar name={name || '?'} url={url} size={84} />
      <div className="avatar-picker__actions">
        <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={() => input.current?.click()}>
          📷 {url ? 'Change photo' : 'Add your photo'}
        </button>
        {url && onRemove && (
          <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={onRemove}>
            Remove
          </button>
        )}
        <small className="muted">{busy ? 'Saving…' : 'Optional. A clear photo of your face works best.'}</small>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={choose} />
    </div>
  );
}

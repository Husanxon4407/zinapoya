import { useRef, useState } from 'react';
import Avatar from '../../../shared/components/Avatar.jsx';
import PhotoCropper from './PhotoCropper.jsx';
import { translate, useT } from '../../../i18n/index.js';

// Shows the photo with "Choose photo" / "Remove" buttons. A chosen photo opens the editor first;
// onPick receives the small square JPEG blob of the part the student framed.
export default function AvatarPicker({ name, url, onPick, onRemove, busy = false, onError }) {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const t = useT();

  function choose(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      onError?.(translate('Please choose a photo (JPG or PNG).'));
      return;
    }
    setFile(f);
  }

  async function save(blob) {
    try {
      await onPick(blob);
    } catch (err) {
      onError?.(err.message);
    }
    setFile(null);
  }

  return (
    <div className="avatar-picker">
      <Avatar name={name || '?'} url={url} size={84} />
      <div className="avatar-picker__actions">
        <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={() => input.current?.click()}>
          📷 {url ? t('Change photo') : t('Add your photo')}
        </button>
        {url && onRemove && (
          <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={onRemove}>
            {t('Remove')}
          </button>
        )}
        <small className="muted">{busy ? t('Saving…') : t('Optional. A clear photo of your face works best.')}</small>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={choose} />
      {file && <PhotoCropper file={file} onCancel={() => setFile(null)} onSave={save} />}
    </div>
  );
}

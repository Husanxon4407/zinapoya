// Answers recorded without internet wait here (in this browser) and are uploaded automatically
// as soon as the phone is online again. Then their AI transcript starts like any other answer.
import { api, aiEnabled } from '../../../shared/lib/api.js';
import { transcriber } from './transcriber.js';

const DB = 'speakup-offline';
const STORE = 'pending';

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'key' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function run(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

/** True when an error looks like "no internet" rather than a real problem. */
export function isOfflineError(e) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return /failed to fetch|network|load failed|fetch failed|internet/i.test(e?.message || '');
}

export async function queueAttempt(attempt, blob, wav) {
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await run('readwrite', (s) => s.put({ key, attempt, blob, wav, created_at: new Date().toISOString() }));
  return key;
}

export async function pendingCount() {
  try {
    return (await run('readonly', (s) => s.count())) || 0;
  } catch {
    return 0;
  }
}

let flushing = false;
/** Upload every waiting answer. onSaved(row) is called for each one. */
export async function flushQueue(onSaved) {
  if (flushing || (typeof navigator !== 'undefined' && navigator.onLine === false)) return 0;
  flushing = true;
  let done = 0;
  try {
    const items = (await run('readonly', (s) => s.getAll())) || [];
    for (const item of items) {
      try {
        const row = await api.saveAttempt(item.attempt, item.blob || null);
        await run('readwrite', (s) => s.delete(item.key));
        done++;
        onSaved?.(row);
        if (aiEnabled && (item.wav || item.blob) && (item.attempt.duration_sec || 0) >= 2) {
          transcriber.enqueue(row.id, { wav: item.wav, blob: item.blob });
        }
      } catch (e) {
        console.warn('Offline answer not uploaded yet', e);
        if (isOfflineError(e)) break;
      }
    }
  } catch (e) {
    console.warn('Offline queue unavailable', e);
  } finally {
    flushing = false;
  }
  return done;
}

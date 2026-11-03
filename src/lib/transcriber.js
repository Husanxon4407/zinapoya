// Background queue for the careful AI transcript.
// Every saved answer is sent here as soon as it is recorded, so the student can go on to the next
// question while the AI listens. Answer cards and games subscribe to the result.
import { useSyncExternalStore } from 'react';
import { api } from './api.js';
import { recordingForAI } from './audio.js';

const MAX_PARALLEL = 2;
const jobs = new Map(); // id -> { status: 'waiting'|'working'|'done'|'error', result, error, input, promise }
const queue = [];
const listeners = new Set();
let running = 0;

const notify = () => listeners.forEach((cb) => cb());
function update(id, patch) {
  jobs.set(id, { ...jobs.get(id), ...patch });
  notify();
}

async function work(id) {
  const job = jobs.get(id);
  update(id, { status: 'working', error: '' });
  const { wav, getWav, blob, loadBlob } = job.input;
  // Fastest: the server reads the small saved recording itself, so nothing is uploaded twice.
  try {
    return await api.transcribe(id);
  } catch (e) {
    if (e.code !== 'need_audio') throw e;
  }
  let audio = wav || getWav?.();
  let mime = 'audio/wav';
  if (!audio) {
    const b = blob || (await loadBlob?.());
    if (!b) throw new Error('The recording could not be loaded.');
    ({ audio, mime } = await recordingForAI(b));
  }
  return api.transcribe(id, audio, mime);
}

function pump() {
  while (running < MAX_PARALLEL && queue.length) {
    const id = queue.shift();
    const job = jobs.get(id);
    if (!job) continue;
    running++;
    const attempt = (tries) =>
      work(id)
        .then((result) => {
          update(id, { status: 'done', result });
          job.resolve(result);
        })
        .catch(async (e) => {
          // One quiet retry for a busy moment; limits and missing audio are final.
          if (tries < 1 && !/limit|empty|too long|not found|could not be loaded/i.test(e.message)) {
            await new Promise((r) => setTimeout(r, 3000));
            return attempt(tries + 1);
          }
          update(id, { status: 'error', error: e.message });
          job.resolve(null);
        });
    attempt(0).finally(() => {
      running--;
      pump();
    });
  }
}

export const transcriber = {
  /**
   * Start the careful transcript for a saved answer.
   * input: { wav?: base64, blob?: Blob, loadBlob?: () => Promise<Blob> } — only used when the server
   * cannot read the saved recording itself.
   * Resolves with { transcript, segments, word_count, wpm, filler_count } or null on failure.
   */
  enqueue(id, input, { force = false } = {}) {
    const old = jobs.get(id);
    if (old && !force && old.status !== 'error') return old.promise;
    let resolve;
    const promise = new Promise((r) => (resolve = r));
    jobs.set(id, { status: 'waiting', result: null, error: '', input: { ...old?.input, ...input }, promise, resolve });
    queue.push(id);
    notify();
    pump();
    return promise;
  },
  get: (id) => jobs.get(id) || null,
  /** Wait for the transcript, but never longer than `ms`. Resolves with the result or null. */
  wait(id, ms = 45000) {
    const job = jobs.get(id);
    if (!job) return Promise.resolve(null);
    return Promise.race([job.promise, new Promise((r) => setTimeout(() => r(null), ms))]);
  },
  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

/** React: the transcription job for one answer (or null), re-rendering when it changes. */
export function useTranscription(id) {
  return useSyncExternalStore(
    transcriber.subscribe,
    () => (id ? jobs.get(id) || null : null),
    () => null,
  );
}

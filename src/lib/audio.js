// Turn a recorded answer (webm/mp4) into a small 16 kHz mono WAV, base64-encoded,
// so the AI can write down what was said when the browser's speech-to-text fails.

const RATE = 16000;

function encodeWav(samples) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buffer);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, RATE, true);
  v.setUint32(28, RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// Prepare a recording for the AI: a small WAV when the browser can decode it,
// otherwise the original file (webm/mp4) as it is.
export async function recordingForAI(blob) {
  try {
    return { audio: await blobToWavBase64(blob), mime: 'audio/wav' };
  } catch (e) {
    console.warn('WAV conversion failed, sending the original recording', e);
    return { audio: toBase64(await blob.arrayBuffer()), mime: (blob.type || 'audio/webm').split(';')[0] };
  }
}

export async function blobToWavBase64(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * RATE)), RATE);
    const src = offline.createBufferSource();
    src.buffer = decoded;
    src.connect(offline.destination);
    src.start();
    const rendered = await offline.startRendering();
    return toBase64(encodeWav(rendered.getChannelData(0)));
  } finally {
    ctx.close?.();
  }
}

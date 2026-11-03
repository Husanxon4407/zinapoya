// Audio for the AI: 16 kHz mono WAV, base64-encoded.
// New answers collect raw sound while recording (PcmCollector), so nothing has to be decoded later
// (Safari cannot decode its own webm). Old saved recordings are decoded with blobToWavBase64.

export const RATE = 16000;

/**
 * Collects microphone samples at 16 kHz while recording, and remembers how loud each short
 * block was, so live text can be cut at a quiet moment instead of in the middle of a word.
 */
export class PcmCollector {
  constructor(inputRate) {
    this.ratio = inputRate / RATE;
    this.chunks = [];
    this.length = 0;
    this.blocks = []; // { end, rms } per incoming block, in 16 kHz samples
    this.carry = 0; // fractional position for the resampler
  }

  push(input) {
    // Average the input samples that fall into each output sample (simple low-pass + downsample).
    const out = new Float32Array(Math.floor((input.length - this.carry) / this.ratio) + 1);
    let n = 0;
    let pos = this.carry;
    while (pos + this.ratio <= input.length) {
      const a = Math.floor(pos);
      const b = Math.min(input.length, Math.floor(pos + this.ratio));
      let sum = 0;
      for (let i = a; i < b; i++) sum += input[i];
      out[n++] = sum / Math.max(1, b - a);
      pos += this.ratio;
    }
    this.carry = pos - input.length;
    const chunk = out.subarray(0, n);
    this.chunks.push(chunk);
    this.length += n;
    let sq = 0;
    for (let i = 0; i < input.length; i++) sq += input[i] * input[i];
    const rms = Math.sqrt(sq / Math.max(1, input.length));
    this.blocks.push({ end: this.length, rms });
    return rms;
  }

  /** Samples between two positions (in 16 kHz samples). */
  slice(from = 0, to = this.length) {
    const out = new Float32Array(Math.max(0, to - from));
    let offset = 0;
    for (const c of this.chunks) {
      const start = offset;
      const end = offset + c.length;
      offset = end;
      if (end <= from) continue;
      if (start >= to) break;
      const a = Math.max(from, start) - start;
      const b = Math.min(to, end) - start;
      out.set(c.subarray(a, b), Math.max(from, start) - from);
    }
    return out;
  }

  /** The quietest block boundary in the last `windowSec` seconds — a good place to cut. */
  quietCut(windowSec = 1.5) {
    const min = this.length - windowSec * RATE;
    let best = this.length;
    let bestRms = Infinity;
    for (let i = this.blocks.length - 1; i >= 0 && this.blocks[i].end >= min; i--) {
      if (this.blocks[i].rms < bestRms) {
        bestRms = this.blocks[i].rms;
        best = this.blocks[i].end;
      }
    }
    return best;
  }

  seconds() {
    return this.length / RATE;
  }
}

export function wavBase64(samples) {
  return toBase64(encodeWav(samples));
}

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

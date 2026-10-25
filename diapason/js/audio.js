// Moteur audio : contexte partagé, synthés, micro et détection de hauteur (YIN).
import { ftom } from './music.js';

let ctx = null;
let master = null;
let bus = null;
let noiseBuf = null;

export function audio() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    // iPhone : sans ça, le bouton « silencieux » coupe tout le son de l'app.
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* non pris en charge */ }
    ctx = new C({ latencyHint: 'interactive' });
    // Compresseur doux + gain de rattrapage + limiteur : plus fort, sans saturer
    // (les haut-parleurs de cellulaire en ont besoin).
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    const makeup = ctx.createGain();
    makeup.gain.value = 2;
    bus = ctx.createDynamicsCompressor();
    bus.threshold.value = -3;
    bus.knee.value = 0;
    bus.ratio.value = 20;
    bus.attack.value = 0.002;
    bus.release.value = 0.12;
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(comp).connect(makeup).connect(bus);
    bus.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export const out = () => (audio(), master);
// Sortie finale (après compresseur), pour l'enregistrement.
export const finalOut = () => (audio(), bus);

function noise() {
  if (!noiseBuf) {
    const c = audio();
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

function env(g, t, peak, attack, dur) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

// Note de type piano électrique, pour les claviers.
export function pluck(freq, { when = 0, dur = 1.4, gain = 0.28 } = {}) {
  const c = audio();
  const t = Math.max(when, c.currentTime);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(Math.min(9000, freq * 10), t);
  f.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 2), t + dur);
  const g = c.createGain();
  env(g, t, gain, 0.006, dur);
  const o1 = c.createOscillator();
  o1.type = 'triangle';
  o1.frequency.value = freq;
  const o2 = c.createOscillator();
  o2.type = 'sine';
  o2.frequency.value = freq * 2.001;
  const g2 = c.createGain();
  g2.gain.value = 0.3;
  o1.connect(f);
  o2.connect(g2).connect(f);
  f.connect(g).connect(out());
  [o1, o2].forEach((o) => { o.start(t); o.stop(t + dur + 0.05); });
}

// Note tenue, douce, pour guider la voix.
export function tone(freq, { when = 0, dur = 0.5, gain = 0.16 } = {}) {
  const c = audio();
  const t = Math.max(when, c.currentTime);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.03);
  g.gain.setValueAtTime(gain, t + Math.max(0.04, dur - 0.08));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = Math.min(6000, freq * 5);
  const a = c.createOscillator();
  a.type = 'sawtooth';
  a.frequency.value = freq;
  const b = c.createOscillator();
  b.type = 'triangle';
  b.frequency.value = freq;
  b.detune.value = 6;
  a.connect(f); b.connect(f);
  f.connect(g).connect(out());
  [a, b].forEach((o) => { o.start(t); o.stop(t + dur + 0.05); });
}

export function click(when, accent = false) {
  const c = audio();
  const o = c.createOscillator();
  o.frequency.value = accent ? 1760 : 1180;
  const g = c.createGain();
  env(g, when, accent ? 0.35 : 0.2, 0.002, 0.06);
  o.connect(g).connect(out());
  o.start(when);
  o.stop(when + 0.08);
}

// --- Batterie synthétisée ---
export const drums = {
  kick(t, v = 1) {
    const c = audio();
    const o = c.createOscillator();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    const g = c.createGain();
    env(g, t, 0.9 * v, 0.003, 0.42);
    o.connect(g).connect(out());
    o.start(t); o.stop(t + 0.45);
  },
  snare(t, v = 1) {
    const c = audio();
    const n = c.createBufferSource();
    n.buffer = noise();
    const hp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1400;
    const g = c.createGain();
    env(g, t, 0.45 * v, 0.002, 0.2);
    n.connect(hp).connect(g).connect(out());
    n.start(t); n.stop(t + 0.22);
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    const g2 = c.createGain();
    env(g2, t, 0.35 * v, 0.002, 0.1);
    o.connect(g2).connect(out());
    o.start(t); o.stop(t + 0.12);
  },
  hat(t, v = 1) {
    const c = audio();
    const n = c.createBufferSource();
    n.buffer = noise();
    const hp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 7500;
    const g = c.createGain();
    env(g, t, 0.22 * v, 0.001, 0.05);
    n.connect(hp).connect(g).connect(out());
    n.start(t, Math.random() * 0.5); n.stop(t + 0.06);
  },
  clap(t, v = 1) {
    const c = audio();
    [0, 0.012, 0.025].forEach((d, i) => {
      const n = c.createBufferSource();
      n.buffer = noise();
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 1.2;
      const g = c.createGain();
      env(g, t + d, 0.4 * v, 0.001, i === 2 ? 0.18 : 0.03);
      n.connect(bp).connect(g).connect(out());
      n.start(t + d, Math.random() * 0.5); n.stop(t + d + 0.2);
    });
  },
};

export function pad(freqs, t, dur, gain = 0.05) {
  const c = audio();
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(600, t);
  f.frequency.linearRampToValueAtTime(1800, t + dur * 0.4);
  f.frequency.linearRampToValueAtTime(900, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(1, t + 0.06);
  g.gain.setValueAtTime(1, t + dur - 0.12);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  f.connect(g).connect(out());
  freqs.forEach((fr) => {
    [-7, 7].forEach((det) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = fr;
      o.detune.value = det;
      const og = c.createGain();
      og.gain.value = gain;
      o.connect(og).connect(f);
      o.start(t); o.stop(t + dur + 0.02);
    });
  });
  return g; // pour l'éteindre en douceur quand un autre accord prend le relais
}

export function bass(freq, t, dur = 0.35) {
  const c = audio();
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  const s = c.createOscillator();
  s.type = 'sine';
  s.frequency.value = freq / 2;
  const g = c.createGain();
  env(g, t, 0.5, 0.005, dur);
  o.connect(g); s.connect(g);
  g.connect(out());
  [o, s].forEach((x) => { x.start(t); x.stop(t + dur + 0.02); });
}

// Train d'impulsions : à 2 Hz on entend des clics (un rythme), à 200 Hz une note.
let impulseWave = null;
export function impulseOsc(freq) {
  const c = audio();
  if (!impulseWave) {
    const N = 2048;
    const real = new Float32Array(N);
    const imag = new Float32Array(N);
    for (let n = 1; n < N; n++) real[n] = 1;
    impulseWave = c.createPeriodicWave(real, imag);
  }
  const o = c.createOscillator();
  o.setPeriodicWave(impulseWave);
  o.frequency.value = freq;
  return o;
}

// ---------- Micro + détection de hauteur ----------
const pitchListeners = new Set();
const statusListeners = new Set();
let stream = null;
let source = null;
let analyser = null;
let buf = null;
let yinBuf = null;
let raf = 0;
let hist = [];
let active = false;

export const mic = {
  get active() { return active; },
  get analyser() { return analyser; },
  get source() { return source; },
  current: null,
  level: 0,
};

export async function startMic() {
  if (active) return true;
  const c = audio();
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
  } catch (e) {
    console.warn(e);
    statusListeners.forEach((fn) => fn(false, e));
    return false;
  }
  source = c.createMediaStreamSource(stream);
  analyser = c.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.7;
  source.connect(analyser);
  buf = new Float32Array(analyser.fftSize);
  active = true;
  hist = [];
  loop();
  statusListeners.forEach((fn) => fn(true));
  return true;
}

export function stopMic() {
  if (!active) return;
  stream.getTracks().forEach((t) => t.stop());
  source.disconnect();
  cancelAnimationFrame(raf);
  active = false;
  mic.current = null;
  mic.level = 0;
  pitchListeners.forEach((fn) => fn(null, 0));
  statusListeners.forEach((fn) => fn(false));
}

export const toggleMic = () => (active ? (stopMic(), Promise.resolve(false)) : startMic());
export function onPitch(fn) { pitchListeners.add(fn); return () => pitchListeners.delete(fn); }
export function onMicStatus(fn) { statusListeners.add(fn); return () => statusListeners.delete(fn); }

function loop() {
  analyser.getFloatTimeDomainData(buf);
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  let res = null;
  if (rms > 0.01) {
    const p = yin(buf, ctx.sampleRate);
    if (p && p.freq > 55 && p.freq < 1400) {
      hist.push(ftom(p.freq));
      if (hist.length > 5) hist.shift();
      const sorted = [...hist].sort((a, b) => a - b);
      const midi = sorted[sorted.length >> 1];
      res = { freq: 440 * 2 ** ((midi - 69) / 12), midi, clarity: p.clarity, t: ctx.currentTime };
    }
  } else hist = [];
  mic.current = res;
  mic.level = rms;
  pitchListeners.forEach((fn) => fn(res, rms));
  raf = requestAnimationFrame(loop);
}

// YIN (de Cheveigné & Kawahara, 2002) : robuste pour la voix et beaucoup plus rapide
// que l'autocorrélation complète de la version d'origine.
function yin(data, sr, threshold = 0.15) {
  const W = data.length >> 1;
  const maxTau = Math.min(W - 1, Math.floor(sr / 55));
  const minTau = Math.max(2, Math.floor(sr / 1400));
  if (!yinBuf || yinBuf.length < maxTau + 2) yinBuf = new Float32Array(maxTau + 2);
  const d = yinBuf;
  d[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < W; i++) {
      const diff = data[i] - data[i + tau];
      sum += diff * diff;
    }
    running += sum;
    d[tau] = running ? (sum * tau) / running : 1;
  }
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (d[t] < threshold) {
      while (t + 1 <= maxTau && d[t + 1] < d[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) return null;
  const x0 = d[tau - 1];
  const x1 = d[tau];
  const x2 = tau + 1 <= maxTau ? d[tau + 1] : x1;
  const denom = x0 + x2 - 2 * x1;
  const better = denom ? tau + (x0 - x2) / (2 * denom) : tau;
  return { freq: sr / better, clarity: 1 - x1 };
}

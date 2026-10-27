// Écoute d'instrument : reconnaissance d'accords (chroma) par micro / interface audio, ou par MIDI.
import { audio } from './audio.js';
import { ftom, FR, mod12 } from './music.js';

const QUALS = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10] };
// Profils de tonalité de Krumhansl-Kessler.
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// Le nom d’un accord en français (Do, Lam, Sol7…).
export const chordLabel = (c) => (c ? FR[c.root] + ({ M: '', m: 'm', 7: '7', m7: 'm7' }[c.qual]) : '—');

// Meilleur accord pour un vecteur de 12 classes de hauteur.
export function matchChord(chroma) {
  const norm = Math.hypot(...chroma) || 1;
  let best = null;
  for (let r = 0; r < 12; r++) {
    for (const [q, iv] of Object.entries(QUALS)) {
      const t = new Array(12).fill(0);
      iv.forEach((x, i) => { t[(r + x) % 12] = i === 0 ? 1.15 : 1; });
      let dot = 0;
      for (let k = 0; k < 12; k++) dot += chroma[k] * t[k];
      // Les accords à 4 sons sont légèrement pénalisés : ils n'expliquent souvent qu'une harmonique de plus.
      const score = (dot / (norm * Math.hypot(...t))) - (iv.length > 3 ? 0.02 : 0);
      if (!best || score > best.score) best = { root: r, qual: q, score };
    }
  }
  return best;
}

// Devine la tonalité d’après les notes entendues (comparaison avec les profils de Krumhansl-Kessler, en majeur et en mineur).
export function estimateKey(chroma) {
  const corr = (prof, shift) => {
    const xs = chroma;
    const ys = prof.map((_, i) => prof[(i - shift + 12) % 12]);
    const mx = xs.reduce((a, b) => a + b, 0) / 12;
    const my = ys.reduce((a, b) => a + b, 0) / 12;
    let n = 0; let dx = 0; let dy = 0;
    for (let i = 0; i < 12; i++) { n += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
    return n / Math.sqrt(dx * dy || 1);
  };
  let best = null;
  for (let s = 0; s < 12; s++) {
    for (const [mode, prof] of [['majeur', MAJ], ['mineur', MIN]]) {
      const c = corr(prof, s);
      if (!best || c > best.score) best = { tonic: s, mode, score: c };
    }
  }
  return best;
}

// Suggestions : accords de la tonalité et enchaînements fréquents (en degrés de la gamme majeure relative).
const MAJOR_DEG = [[0, 'M', 'I'], [2, 'm', 'ii'], [4, 'm', 'iii'], [5, 'M', 'IV'], [7, 'M', 'V'], [9, 'm', 'vi']];
const NEXT = { I: ['IV', 'V', 'vi'], ii: ['V', 'IV'], iii: ['vi', 'IV'], IV: ['V', 'I', 'ii'], V: ['I', 'vi', 'IV'], vi: ['IV', 'ii', 'V'] };
// La tonique majeure d’une tonalité (pour La mineur : Do).
export function majorTonic(key) { return key.mode === 'majeur' ? key.tonic : mod12(key.tonic + 3); }
// Les sept accords naturels d’une tonalité, avec leur chiffre romain.
export function diatonic(key) {
  const t = majorTonic(key);
  return MAJOR_DEG.map(([d, q, roman]) => ({ root: mod12(t + d), qual: q, roman, deg: d }));
}
// Propose les accords qui suivent bien celui qu’on joue, dans la tonalité.
export function suggestNext(key, chord) {
  const dia = diatonic(key);
  const cur = chord && dia.find((c) => c.root === chord.root && (c.qual === chord.qual || (chord.qual === '7' && c.qual === 'M') || (chord.qual === 'm7' && c.qual === 'm')));
  if (!cur) return dia.filter((c) => ['I', 'IV', 'V', 'vi'].includes(c.roman));
  return NEXT[cur.roman].map((r) => dia.find((c) => c.roman === r));
}

// Moteur d'écoute audio. onFrame(chroma, rms) à chaque image ; onChord(chord) quand un accord tient.
export function createListener({ deviceId, onFrame, onChord }) {
  let stream = null;
  let raf = 0;
  let src = null;
  const state = { chroma: new Array(12).fill(0), session: new Array(12).fill(0), current: null };
  let candidate = null;
  let since = 0;
  return {
    state,
    async start() {
      const c = audio();
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      src = c.createMediaStreamSource(stream);
      const an = c.createAnalyser();
      an.fftSize = 16384;
      an.smoothingTimeConstant = 0.5;
      src.connect(an);
      const spec = new Float32Array(an.frequencyBinCount);
      const time = new Float32Array(2048);
      const binHz = c.sampleRate / an.fftSize;
      const lo = Math.floor(60 / binHz);
      const hi = Math.ceil(2000 / binHz);
      const loop = () => {
        an.getFloatFrequencyData(spec);
        an.getFloatTimeDomainData(time);
        let rms = 0;
        for (let i = 0; i < time.length; i++) rms += time[i] * time[i];
        rms = Math.sqrt(rms / time.length);
        const frame = new Array(12).fill(0);
        for (let b = lo; b <= hi; b++) {
          const mag = 10 ** (spec[b] / 20);
          // Pic local seulement : on garde les partiels, pas le bruit autour.
          if (spec[b] < spec[b - 1] || spec[b] < spec[b + 1] || spec[b] < -75) continue;
          const midi = ftom(b * binHz);
          const pc = mod12(midi);
          frame[pc] += mag * (b * binHz < 260 ? 1.3 : 1); // un peu plus de poids aux graves (fondamentales)
        }
        const mx = Math.max(...frame) || 1;
        for (let k = 0; k < 12; k++) {
          state.chroma[k] = state.chroma[k] * 0.82 + (frame[k] / mx) * 0.18;
          if (rms > 0.01) state.session[k] += frame[k] / mx;
        }
        onFrame?.(state.chroma, rms);
        if (rms > 0.012) {
          const m = matchChord(state.chroma);
          const now = performance.now();
          if (!candidate || candidate.root !== m.root || candidate.qual !== m.qual) { candidate = m; since = now; }
          else if (now - since > 380 && m.score > 0.72 && (!state.current || state.current.root !== m.root || state.current.qual !== m.qual)) {
            state.current = m;
            onChord?.(m);
          }
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    },
    stop() {
      cancelAnimationFrame(raf);
      src?.disconnect();
      stream?.getTracks().forEach((t) => t.stop());
    },
  };
}

// MIDI : les notes enfoncées forment l'accord, instantanément.
export async function connectMIDI({ onNote, onChord }) {
  if (!navigator.requestMIDIAccess) throw new Error('Ce navigateur ne lit pas le MIDI (essaie Chrome ou Edge).');
  const access = await navigator.requestMIDIAccess();
  const held = new Set();
  let last = null;
  const handler = (e) => {
    const [st, note, vel] = e.data;
    const cmd = st & 0xf0;
    if (cmd === 0x90 && vel > 0) { held.add(note); onNote?.(note, vel, true); }
    else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) { held.delete(note); onNote?.(note, 0, false); }
    if (held.size >= 3) {
      const chroma = new Array(12).fill(0);
      held.forEach((n) => { chroma[n % 12] += 1; });
      chroma[Math.min(...held) % 12] += 0.5; // la basse compte un peu plus
      const m = matchChord(chroma);
      if (!last || last.root !== m.root || last.qual !== m.qual) { last = m; onChord?.(m, chroma); }
    }
  };
  // addEventListener (et non onmidimessage) : la console de Frog peut écouter en même temps.
  const attach = () => [...access.inputs.values()].forEach((i) => { i.removeEventListener('midimessage', handler); i.addEventListener('midimessage', handler); });
  attach();
  access.addEventListener('statechange', attach);
  return {
    names: [...access.inputs.values()].map((i) => i.name),
    stop() { access.removeEventListener('statechange', attach); [...access.inputs.values()].forEach((i) => i.removeEventListener('midimessage', handler)); },
  };
}

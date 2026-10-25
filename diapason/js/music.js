// Utilitaires musicaux et mathématiques partagés.
export const FR = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
export const EN = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

export const mod12 = (m) => ((Math.round(m) % 12) + 12) % 12;
export const isBlack = (m) => [1, 3, 6, 8, 10].includes(mod12(m));
export const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
export const ftom = (f) => 69 + 12 * Math.log2(f / 440);
export const octave = (m) => Math.floor(Math.round(m) / 12) - 1;
export const nameFR = (m) => FR[mod12(m)] + octave(m);
export const nameEN = (m) => EN[mod12(m)] + octave(m);
export const pcFR = (m) => FR[mod12(m)];

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// « 1 octave et 5 demi-tons »
export function spanText(semis) {
  const o = Math.floor(semis / 12);
  const r = semis % 12;
  const parts = [];
  if (o) parts.push(`${o} octave${o > 1 ? 's' : ''}`);
  if (r || !o) parts.push(`${r} demi-ton${r > 1 ? 's' : ''}`);
  return parts.join(' et ');
}

// Écart en demi-tons, en ignorant l'octave (utile quand une voix d'homme chante une octave plus bas).
export function pitchClassDiff(a, b) {
  let d = (a - b) % 12;
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  return d;
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// PRNG déterministe (mulberry32) : même texte → même pochette.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const QUALITY = {
  M: { iv: [0, 4, 7], suf: '' },
  m: { iv: [0, 3, 7], suf: 'm' },
  7: { iv: [0, 4, 7, 10], suf: '7' },
  m7: { iv: [0, 3, 7, 10], suf: 'm7' },
  maj7: { iv: [0, 4, 7, 11], suf: 'maj7' },
  sus2: { iv: [0, 2, 7], suf: 'sus2' },
  sus4: { iv: [0, 5, 7], suf: 'sus4' },
  dim: { iv: [0, 3, 6], suf: 'dim' },
  add9: { iv: [0, 4, 7, 14], suf: 'add9' },
  m9: { iv: [0, 3, 7, 10, 14], suf: 'm9' },
  5: { iv: [0, 7, 12], suf: '5' },
  q: { iv: [0, 5, 10, 15], suf: ' en quartes' },
};
export const chordIntervals = (q) => QUALITY[q].iv;
export const chordName = (root, q) => FR[mod12(root)] + QUALITY[q].suf;

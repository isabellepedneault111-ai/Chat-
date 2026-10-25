// De vrais instruments : un piano à queue enregistré (Salamander), un piano électrique et des voix (FluidR3).
// Chaque note joue l'échantillon le plus proche, accordé à la bonne hauteur. Crédits : data/sons/CREDITS.txt.
import { audio, out, pluck } from './audio.js';
import { mtof } from './music.js';

const NOMS = { C: 0, Ds: 3, Fs: 6, A: 9, Gb: 6 };
const BANQUES = {
  piano: { notes: ['C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6'], gain: 0.9, release: 1.2 },
  rhodes: { notes: ['C2', 'Gb2', 'C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5', 'C6'], gain: 0.8, release: 0.9 },
  voix: { notes: ['C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5'], gain: 0.55, release: 0.5 },
};
const midiDe = (n) => { const m = n.match(/^([A-G][sb]?)(\d)$/); return 12 * (+m[2] + 1) + NOMS[m[1]]; };
const tampons = {}; // banque → [{ midi, buf }]
const charge = {};

export function prechargerSons(liste = Object.keys(BANQUES)) {
  return Promise.all(liste.map((b) => {
    if (!charge[b]) {
      const c = audio();
      charge[b] = Promise.all(BANQUES[b].notes.map(async (n) => {
        const r = await fetch(`data/sons/${b}-${n}.mp3`);
        return { midi: midiDe(n), buf: await c.decodeAudioData(await r.arrayBuffer()) };
      })).then((l) => { tampons[b] = l; }).catch(() => { charge[b] = null; });
    }
    return charge[b];
  }));
}
export const pret = (b) => !!tampons[b];

// Joue une note. vel : 0..1 ; dur : durée tenue avant le relâchement (en secondes).
export function joue(banque, midi, { when = 0, dur = 1, vel = 0.8, dest } = {}) {
  const l = tampons[banque];
  if (!l) return false;
  const c = audio();
  const t = Math.max(when, c.currentTime);
  const s = l.reduce((a, b) => (Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a));
  const src = c.createBufferSource();
  src.buffer = s.buf;
  src.playbackRate.value = 2 ** ((midi - s.midi) / 12);
  const g = c.createGain();
  const B = BANQUES[banque];
  const v = B.gain * vel;
  if (banque === 'voix') { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.12); } else g.gain.setValueAtTime(v, t);
  g.gain.setValueAtTime(v, t + dur);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + B.release);
  src.connect(g).connect(dest || out());
  src.start(t);
  src.stop(t + dur + B.release + 0.05);
  return true;
}
// Un accord, les notes légèrement égrenées comme de vrais doigts.
export function accord(banque, notes, opts = {}) {
  notes.forEach((m, i) => joue(banque, m, { ...opts, when: (opts.when || audio().currentTime) + i * (opts.egrene ?? 0.012), vel: (opts.vel ?? 0.6) * (i === 0 ? 1 : 0.85) }));
}

// Une note de vrai piano si les échantillons sont là ; sinon le son de secours, et on les charge pour la suite.
export function notePiano(midi, { when = 0, dur = 1.2, vel = 0.7 } = {}) {
  if (joue('piano', midi, { when, dur, vel })) return;
  pluck(mtof(midi), { when, dur, gain: 0.28 * vel });
  prechargerSons(['piano']);
}

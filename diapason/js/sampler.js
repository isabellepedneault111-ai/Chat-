// De vrais instruments : un piano à queue enregistré (Salamander), un piano électrique et des voix (FluidR3).
// Chaque note joue l'échantillon le plus proche, accordé à la bonne hauteur. Crédits : data/sons/CREDITS.txt.
import { audio, out, pluck } from './audio.js';
import { mtof } from './music.js';

const NOMS = { C: 0, Ds: 3, Fs: 6, A: 9, Gb: 6 };
const BANQUES = {
  piano: { notes: ['C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6'], gain: 0.9, release: 1.2 },
  rhodes: { notes: ['C2', 'Gb2', 'C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5', 'C6'], gain: 0.8, release: 0.9 },
  voix: { notes: ['C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5'], gain: 0.55, release: 0.5 },
  // L'orchestre (FluidR3 GM, MIT) : de quoi bâtir une cathédrale, à la Wendy Carlos.
  cordes: { notes: ['C2', 'Gb2', 'C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5', 'C6'], gain: 0.6, release: 0.9, boucle: [1.1, 2.9], nom: 'Cordes', famille: 'cordes' },
  pizz: { notes: ['C2', 'Gb2', 'C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5', 'C6'], gain: 0.8, release: 0.25, nom: 'Pizzicati', famille: 'cordes' },
  harpe: { notes: ['C2', 'Gb2', 'C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5', 'C6'], gain: 0.75, release: 1.6, nom: 'Harpe', famille: 'cordes' },
  cor: { notes: ['C2', 'Gb2', 'C3', 'Gb3', 'C4', 'Gb4', 'C5'], gain: 0.6, release: 0.5, boucle: [1.1, 2.9], nom: 'Cor', famille: 'cuivres' },
  cuivres: { notes: ['C2', 'Gb2', 'C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5'], gain: 0.5, release: 0.4, boucle: [1.1, 2.9], nom: 'Cuivres', famille: 'cuivres' },
  flute: { notes: ['C4', 'Gb4', 'C5', 'Gb5', 'C6', 'Gb6', 'C7'], gain: 0.6, release: 0.3, boucle: [1.1, 2.9], nom: 'Flûte', famille: 'bois' },
  clarinette: { notes: ['C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5', 'C6'], gain: 0.6, release: 0.3, boucle: [1.1, 2.9], nom: 'Clarinette', famille: 'bois' },
  hautbois: { notes: ['Gb3', 'C4', 'Gb4', 'C5', 'Gb5', 'C6'], gain: 0.55, release: 0.3, boucle: [1.1, 2.9], nom: 'Hautbois', famille: 'bois' },
  choeur: { notes: ['C3', 'Gb3', 'C4', 'Gb4', 'C5', 'Gb5', 'C6'], gain: 0.55, release: 0.8, boucle: [1.1, 2.9], nom: 'Chœur', famille: 'voix' },
  timbales: { notes: ['C2', 'Gb2', 'C3', 'Gb3', 'C4'], gain: 0.9, release: 1.4, nom: 'Timbales', famille: 'percussions' },
  celesta: { notes: ['C4', 'Gb4', 'C5', 'Gb5', 'C6', 'Gb6', 'C7'], gain: 0.6, release: 1.2, nom: 'Célesta', famille: 'percussions' },
};
// La liste des instruments d’orchestre disponibles, avec leur famille et leur étendue (note la plus basse, la plus haute).
export const ORCHESTRE = Object.entries(BANQUES).filter(([, b]) => b.famille).map(([k, b]) => ({ k, nom: b.nom, famille: b.famille, bas: midiDeNom(b.notes[0]), haut: midiDeNom(b.notes.at(-1)) + 6 }));
// « C4 », « Fs3 » → numéro MIDI : lit le nom d’un fichier d’échantillon pour savoir quelle note il contient.
function midiDeNom(n) { const m = n.match(/^([A-G][sb]?)(\d)$/); return 12 * (+m[2] + 1) + { C: 0, Ds: 3, Fs: 6, A: 9, Gb: 6 }[m[1]]; }
const midiDe = (n) => { const m = n.match(/^([A-G][sb]?)(\d)$/); return 12 * (+m[2] + 1) + NOMS[m[1]]; };
const tampons = {}; // banque → [{ midi, buf }]
const charge = {};

// Télécharge et décode les échantillons des instruments demandés (une seule fois chacun) ; renvoie une promesse tenue quand tout est prêt.
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
// Vrai si les échantillons de cet instrument sont déjà chargés.
export const pret = (b) => !!tampons[b];
// Les instruments tenus (cordes, chœur, cuivres, bois) : un échantillon dure ~3 s ; pour une note plus longue,
// on fait tourner le milieu du son en boucle, là où il ne bouge plus.
// La jointure de la boucle est fondue : les 120 dernières millisecondes avant la fin de la boucle glissent vers
// ce qui précède son début. Au saut, l'onde continue sans rupture (sinon : un petit « coche » à chaque tour).
const fondus = new WeakMap();
// Fabrique (une fois, puis garde en mémoire) une copie de l’échantillon dont la jointure de boucle est fondue : plus de clic quand une note tenue tourne en boucle.
function tamponBoucle(buf, a, b, ctx) {
  const deja = fondus.get(buf); if (deja && deja.sampleRate === ctx.sampleRate) return deja;
  const sr = buf.sampleRate; const ia = Math.round(a * sr); const ib = Math.round(b * sr); const xf = Math.min(Math.round(0.12 * sr), ia, ib - ia - 1);
  const out = ctx.createBuffer(buf.numberOfChannels, ib, sr);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c); const o = out.getChannelData(c); o.set(d.subarray(0, ib));
    for (let i = 0; i < xf; i++) { const w = i / xf; const k = ib - xf + i; o[k] = d[k] * Math.cos(w * Math.PI / 2) + d[ia - xf + i] * Math.sin(w * Math.PI / 2); }
  }
  fondus.set(buf, out); return out;
}
// Donne son échantillon à la note (le playbackRate doit déjà être réglé) : tel quel, ou fondu en boucle si la note dure.
export function boucler(src, B, dur, buf) {
  if (!B.boucle || dur * src.playbackRate.value < buf.duration - 0.4) { src.buffer = buf; return; }
  const a = B.boucle[0]; const b = Math.min(B.boucle[1], buf.duration - 0.1);
  src.buffer = tamponBoucle(buf, a, b, src.context);
  src.loop = true; src.loopStart = a; src.loopEnd = b;
}
// Pour rendre hors ligne (un fichier WAV) : les échantillons d'une banque, et ses réglages.
export const echantillons = (b) => tampons[b] || null;
// Les réglages d’un instrument (volume, relâchement, boucle, nom, famille).
export const reglage = (b) => BANQUES[b];

// Joue une note. vel : 0..1 ; dur : durée tenue avant le relâchement (en secondes).
export function joue(banque, midi, { when = 0, dur = 1, vel = 0.8, dest } = {}) {
  const l = tampons[banque];
  if (!l) return false;
  const c = audio();
  const t = Math.max(when, c.currentTime);
  const s = l.reduce((a, b) => (Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a));
  const src = c.createBufferSource();
  src.playbackRate.value = 2 ** ((midi - s.midi) / 12);
  const g = c.createGain();
  const B = BANQUES[banque];
  boucler(src, B, dur, s.buf);
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

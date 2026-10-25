// Les sons de la visite : courts, doux, joués par l'app elle-même (pas d'enregistrement, pas de voix de synthèse).
// Chacun illustre ce qu'on voit à l'écran. On peut les couper d'une touche.
import { audio, drums, pluck, pad, impulseOsc, out } from './audio.js';
import { mtof, chordIntervals } from './music.js';
import { store } from './ui.js';

const chord = (root, q, t, dur, g = 0.04) => pad(chordIntervals(q).map((iv) => mtof(root + iv)), t, dur, g);
const phrase = (notes, t, step = 0.24, g = 0.2) => notes.forEach((n, i) => pluck(mtof(n), { when: t + i * step, dur: 0.9, gain: g }));

const SONS = {
  accord: (t) => chord(48, 'M', t, 2.4),
  note: (t) => pluck(mtof(64), { when: t, dur: 1.6, gain: 0.18 }),
  tic: (t) => { drums.hat(t, 0.5); drums.hat(t + 0.5, 0.3); },
  riff: (t) => phrase([62, 66, 69, 71, 69], t),
  reponse: (t) => phrase([74, 71, 69, 66, 69], t, 0.22, 0.17),
  carillon: (t) => phrase([79, 84, 88], t, 0.16, 0.12),
  beat: (t) => {
    const s = 60 / 92 / 4;
    const k = '1000001010000010'; const r = '1001001000101000';
    for (let bar = 0; bar < 2; bar++) for (let i = 0; i < 16; i++) {
      const w = t + (bar * 16 + i) * s;
      if (k[i] === '1') drums.kick(w, 0.7);
      if (r[i] === '1') drums.snare(w, 0.25);
      if (i % 2 === 0) drums.hat(w, 0.22);
    }
    chord(50, 'm7', t, 2.6, 0.03);
  },
  // Le cœur du labo : des clics qui accélèrent jusqu'à devenir une note.
  labo: (t) => {
    const c = audio(); const o = impulseOsc(3); const g = c.createGain();
    o.frequency.setValueAtTime(3, t); o.frequency.exponentialRampToValueAtTime(196, t + 3);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.1); g.gain.setValueAtTime(0.5, t + 2.4); g.gain.exponentialRampToValueAtTime(0.06, t + 3); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(g).connect(out()); o.start(t); o.stop(t + 3.3);
  },
  trois: (t) => { phrase([60, 64, 67, 69], t, 0.25, 0.18); phrase([69, 65, 62, 60], t + 1.25, 0.25, 0.16); },
  grimoire: (t) => { chord(45, 'sus2', t, 2.8, 0.035); phrase([81, 76], t + 0.6, 0.5, 0.1); },
  pochette: (t) => { chord(53, 'maj7', t, 2.6, 0.035); phrase([72, 77, 81], t + 0.3, 0.2, 0.12); },
};

export const sonActif = () => store.get('visiteSon', true);
export function basculerSon() { const v = !sonActif(); store.set('visiteSon', v); return v; }
export function jouer(nom) {
  if (!nom || !sonActif() || !SONS[nom]) return;
  try { SONS[nom](audio().currentTime + 0.04); } catch { /* le son n'est pas essentiel */ }
}

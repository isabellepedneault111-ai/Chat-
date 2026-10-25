// La bande-son de la visite : de vrais instruments (piano à queue, piano électrique, voix) qui JOUENT
// ce que l'écran montre. Chaque scène est une petite séance : des accords, une voix qui se pose, une réponse.
import { audio, drums, impulseOsc, out, bass } from './audio.js';
import { joue, accord, prechargerSons } from './sampler.js';
import { store } from './ui.js';

const BAR = 3.4; // une mesure par repère : on a le temps d'entendre
const P = (notes, t, o = {}) => accord('piano', notes, { when: t, dur: o.dur ?? BAR * 0.9, vel: o.vel ?? 0.55, egrene: o.egrene ?? 0.018 });
const R = (notes, t, o = {}) => accord('rhodes', notes, { when: t, dur: o.dur ?? BAR * 0.95, vel: o.vel ?? 0.5, egrene: 0.01 });
const V = (seq, t, o = {}) => { let w = t; seq.forEach(([m, d]) => { if (m) joue('voix', m, { when: w, dur: d * 0.92, vel: o.vel ?? 0.7 }); w += d; }); };
const Pm = (seq, t, o = {}) => { let w = t; seq.forEach(([m, d]) => { if (m) joue('piano', m, { when: w, dur: d, vel: o.vel ?? 0.6 }); w += d; }); };
// Un groove doux : grosse caisse, caisse claire feutrée, charley.
function groove(t, bars = 1, bpm = 84, lvl = 1) {
  const s = 60 / bpm / 4;
  for (let b = 0; b < bars; b++) for (let i = 0; i < 16; i++) {
    const w = t + (b * 16 + i) * s;
    if (i === 0 || i === 7 || i === 10) drums.kick(w, 0.55 * lvl);
    if (i === 4 || i === 12) drums.snare(w, 0.22 * lvl);
    if (i % 2 === 0) drums.hat(w, (i % 4 === 0 ? 0.18 : 0.1) * lvl);
  }
}
const q = 60 / 84; // une noire à 84

const SONS = {
  // 1 · Dans la même pièce : Frog joue, la voix de Zaza se pose dans ses accords.
  'piece-0': (t) => P([48, 55, 60, 64], t),
  'piece-1': (t) => { P([48, 55, 60, 64], t, { vel: 0.4 }); V([[64, 1.2], [67, 0.6], [64, 1.4]], t + 0.2); },
  'piece-2': (t) => { P([45, 52, 57, 60, 64], t, { vel: 0.45 }); V([[64, 0.8], [69, 0.8], [67, 1.6]], t + 0.15); },
  'piece-3': (t) => { P([41, 53, 57, 60], t, { vel: 0.45 }); V([[65, 0.8], [69, 1.8]], t + 0.15); },
  'piece-4': (t) => { P([43, 55, 59, 62], t, { vel: 0.45, dur: 1.6 }); V([[67, 0.8], [71, 0.8]], t + 0.1); P([36, 48, 55, 60, 64], t + 1.7, { vel: 0.5, dur: 2.4 }); V([[72, 2.2]], t + 1.75); },
  // 2 · À distance, en même temps : le même groove, les mêmes accords, chez l'un et chez l'autre.
  'distance-0': (t) => { groove(t, 1); R([48, 55, 59, 64], t, { dur: 4 * q * 0.95 }); },
  'distance-1': (t) => { groove(t, 1); R([41, 52, 57, 60], t, { dur: 4 * q * 0.95 }); },
  'distance-2': (t) => { groove(t, 1); R([45, 55, 60, 64], t, { dur: 4 * q * 0.95 }); V([[64, q], [67, q], [69, 2 * q]], t + 0.05, { vel: 0.5 }); },
  'distance-3': (t) => { groove(t, 1); R([43, 55, 57, 62], t, { dur: 4 * q * 0.95 }); },
  // 3 · Chacun son temps : Frog lance un riff, Zaza répond par-dessus, les couches s'empilent.
  'relais-0': (t) => Pm([[62, 0.3], [66, 0.3], [69, 0.3], [74, 0.6], [73, 0.3], [69, 0.9]], t),
  'relais-2': (t) => { Pm([[62, 0.3], [66, 0.3], [69, 0.3], [74, 0.6], [73, 0.3], [69, 0.9]], t, { vel: 0.45 }); V([[0, 0.3], [74, 0.9], [71, 0.6], [69, 1.2]], t, { vel: 0.65 }); },
  'relais-3': (t) => { P([50, 57, 62, 66], t, { vel: 0.45 }); R([47, 54, 59, 62], t + 1.7, { dur: 1.6 }); V([[66, 1.6], [64, 1.6]], t + 0.05); },
  // 4 · Rien ne se perd : deux idées qui ne s'étaient jamais croisées se rencontrent.
  'ciel-2': (t) => { Pm([[60, 0.4], [64, 0.4], [67, 0.8]], t); V([[0, 1.0], [72, 0.6], [69, 1.2]], t); },
  'ciel-4': (t) => { P([36, 48, 55, 59, 64], t, { vel: 0.5, dur: 3 }); R([60, 64, 67, 71], t + 0.05, { vel: 0.3, dur: 3 }); V([[67, 1.2], [71, 1.8]], t + 0.3); },
  // La vitrine
  beat: (t) => { groove(t, 2); R([50, 57, 60, 65], t, { dur: 4 * q }); R([43, 55, 59, 65], t + 4 * q, { dur: 4 * q }); V([[0, q], [62, q * 0.5], [65, q * 0.5], [69, q * 1.5], [0, q * 0.5], [67, q], [65, 2 * q]], t, { vel: 0.55 }); },
  riff: (t) => { groove(t, 2, 92); V([[67, 0.33], [67, 0.33], [69, 0.5], [0, 0.2], [72, 0.66], [69, 0.33], [67, 1.0], [64, 1.2]], t + 0.1, { vel: 0.6 }); R([48, 55, 60, 64], t, { dur: 2.5 }); R([45, 52, 57, 60], t + 2.6, { dur: 2.4 }); },
  // Le labo : une grosse caisse qui accélère… jusqu'à devenir une note, qui se fond dans un accord de piano.
  labo: (t) => {
    let w = t; let gap = 0.5;
    while (gap > 0.045) { drums.kick(w, 0.5); w += gap; gap *= 0.84; }
    const c = audio(); const o = impulseOsc(22); const lp = c.createBiquadFilter(); const g = c.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    o.frequency.setValueAtTime(22, w); o.frequency.exponentialRampToValueAtTime(98, w + 0.9);
    g.gain.setValueAtTime(0.0001, w); g.gain.linearRampToValueAtTime(0.18, w + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, w + 1.4);
    o.connect(lp).connect(g).connect(out()); o.start(w); o.stop(w + 1.5);
    P([43, 55, 59, 62, 67], w + 0.7, { vel: 0.5, dur: 1.8 });
  },
  trois: (t) => { Pm([[60, 0.3], [64, 0.3], [67, 0.3], [69, 0.6]], t); Pm([[69, 0.3], [65, 0.3], [62, 0.3], [60, 0.9]], t + 1.7, { vel: 0.55 }); R([41, 53, 57, 60], t + 1.7, { vel: 0.3, dur: 1.8 }); },
  grimoire: (t) => { R([45, 52, 59, 64], t, { vel: 0.4, dur: 3 }); Pm([[0, 0.6], [81, 0.8], [76, 1.4]], t, { vel: 0.35 }); },
  pochette: (t) => { P([41, 53, 57, 64, 69], t, { vel: 0.5, dur: 3 }); V([[72, 1.4], [76, 1.6]], t + 0.3, { vel: 0.5 }); },
};

// L'entrée : un groove doux et quatre accords qui tournent pendant qu'on lit le mot d'accueil.
const INTRO = [[36, 48, 55, 59, 64], [45, 52, 57, 60, 64], [41, 53, 57, 60, 65], [43, 55, 59, 62, 65]];
const MELO = [[[76, 1.5], [74, 0.5], [72, 2]], [[0, 2], [69, 1], [72, 1]], [[72, 1.5], [71, 0.5], [69, 2]], [[0, 1], [67, 1], [74, 2]]];
let introT = 0;
export function introStart() {
  if (introT || !sonActif()) return;
  const c = audio();
  const go = () => {
    if (introT || c.state !== 'running') return;
    let next = c.currentTime + 0.1; let bar = 0;
    const tick = () => {
      while (next < c.currentTime + 0.6) {
        const lvl = Math.min(1, 0.45 + bar * 0.18);
        groove(next, 1, 84, lvl * 0.8);
        R(INTRO[bar % 4], next, { dur: 4 * q * 0.97, vel: 0.42 });
        if (bar >= 2) Pm(MELO[bar % 4].map(([m, d]) => [m, d * q]), next, { vel: 0.38 });
        next += 4 * q; bar++;
      }
    };
    tick(); introT = setInterval(tick, 200);
  };
  if (c.state === 'running') go();
  else {
    c.resume().then(go).catch(() => {});
    // Arrivée par un lien : le navigateur attend un premier geste pour laisser jouer le son.
    const once = () => { c.resume().then(go).catch(() => {}); };
    addEventListener('pointerdown', once, { once: true });
    addEventListener('keydown', once, { once: true });
  }
}
export function introStop() { clearInterval(introT); introT = 0; }

// Le tour de l'app : un gros beat qui se construit à mesure qu'on découvre. Chaque étape ajoute une couche ;
// à l'étape 1, tout le groupe joue. On entend littéralement l'app se remplir.
const LOURD = { k: [0, 7, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] };
const BASSE = [36, 33, 29, 31]; // Do, La, Fa, Sol (graves)
const NAPPE = [[48, 55, 59, 64], [45, 52, 57, 60], [41, 52, 57, 60], [43, 50, 55, 59]];
const MOTIF = [[[72, 0.5], [71, 0.5], [67, 1], [0, 2]], [[69, 0.5], [67, 0.5], [64, 1], [0, 2]], [[65, 0.5], [67, 0.5], [69, 1], [0, 2]], [[67, 1], [71, 1], [74, 2]]];
let bedT = 0; let couches = 0;
export function bedStart() {
  if (bedT || !sonActif()) return;
  const c = audio(); if (c.state !== 'running') c.resume().catch(() => {});
  const bpm = 86; const s16 = 60 / bpm / 4; const mesure = 16 * s16;
  let next = c.currentTime + 0.15; let bar = 0;
  const tick = () => {
    while (next < c.currentTime + 0.6) {
      const n = couches; const ch = bar % 4;
      for (let i = 0; i < 16; i++) {
        const w = next + i * s16;
        if (LOURD.k.includes(i)) drums.kick(w, i === 0 ? 1 : 0.8);
        if (n >= 1 && LOURD.s.includes(i)) { drums.snare(w, 0.5); drums.clap(w, 0.25); }
        if (n >= 2 && LOURD.h.includes(i)) drums.hat(w, i % 4 === 0 ? 0.16 : 0.09);
      }
      bass(mtofLoc(BASSE[ch]), next, s16 * 6); bass(mtofLoc(BASSE[ch]), next + 10 * s16, s16 * 4);
      if (n >= 3) R(NAPPE[ch], next, { dur: mesure * 0.96, vel: 0.36 });
      if (n >= 5) Pm(MOTIF[ch].map(([m, d]) => [m, d * 4 * s16]), next + 8 * s16 * (ch % 2), { vel: 0.33 });
      if (n >= 9) V([[NAPPE[ch][3] + 12, mesure * 0.45], [NAPPE[ch][2] + 12, mesure * 0.45]], next, { vel: 0.4 });
      next += mesure; bar++;
    }
  };
  tick(); bedT = setInterval(tick, 200);
}
export function bedCouche(i) { couches = i; }
export function bedStop() { clearInterval(bedT); bedT = 0; couches = 0; }
const mtofLoc = (m) => 440 * 2 ** ((m - 69) / 12);

export const sonActif = () => store.get('visiteSon', true);
export function basculerSon() { const v = !sonActif(); store.set('visiteSon', v); return v; }
export const prechargerVisite = () => prechargerSons(['piano', 'rhodes', 'voix']);
export function jouer(nom) {
  if (!nom || !sonActif() || !SONS[nom]) return;
  try { SONS[nom](audio().currentTime + 0.05); } catch { /* le son n'est pas essentiel */ }
}

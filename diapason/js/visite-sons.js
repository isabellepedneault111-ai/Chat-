// La bande-son de la visite : UNE musique continue, du mot d'accueil jusqu'à l'étape 1.
// De vrais instruments (piano à queue, piano électrique, voix) sur un groove qui change d'habit
// selon le moment, sans jamais se couper. Les scènes y posent des phrases, calées sur le temps.
import { audio, drums, impulseOsc, out, bass } from './audio.js';
import { joue, accord, prechargerSons } from './sampler.js';
import { store } from './ui.js';

const R = (notes, t, o = {}) => accord('rhodes', notes, { when: t, dur: o.dur ?? 2, vel: o.vel ?? 0.5, egrene: 0.01 });
// Sur la musique de Frog, chaque note est transposée puis posée sur la gamme de SA pièce, et la voix laisse place au piano.
const note = (m) => {
  const g = lecture && PISTES[lecture.id].gamme; let x = m + decal;
  if (!g) return x;
  for (let d = 0; d < 3; d++) { if (g.includes(((x - d) % 12 + 12) % 12)) return x - d; if (g.includes(((x + d) % 12 + 12) % 12)) return x + d; }
  return x;
};
const V = (seq, t, o = {}) => { let w = t; seq.forEach(([m, d]) => { if (m) { if (lecture) joue('piano', note(m) + 12, { when: w, dur: d, vel: (o.vel ?? 0.7) * 0.6 }); else joue('voix', m + decal, { when: w, dur: d * 0.92, vel: o.vel ?? 0.7 }); } w += d; }); };
const Pm = (seq, t, o = {}) => { let w = t; seq.forEach(([m, d]) => { if (m) joue('piano', note(m), { when: w, dur: d, vel: (o.vel ?? 0.6) * (lecture ? 0.75 : 1) }); w += d; }); };

// Les accents des scènes : des phrases (voix ou piano) dans la gamme de Do. Pas d'accords ici :
// la bande les porte, les accents ne se marchent jamais dessus. b = la durée d'une noire.
const SONS = {
  'piece-0': (t, b) => Pm([[60, b], [64, b], [67, b], [72, 2 * b]], t, { vel: 0.5 }),
  'piece-1': (t, b) => V([[64, 2 * b], [67, b], [64, 2 * b]], t),
  'piece-2': (t, b) => V([[69, b], [67, b], [64, 2 * b]], t),
  'piece-3': (t, b) => V([[65, b], [69, 3 * b]], t),
  'piece-4': (t, b) => V([[67, b], [72, 3 * b]], t),
  'distance-0': (t, b) => Pm([[72, b / 2], [74, b / 2], [76, b]], t, { vel: 0.4 }),
  'distance-1': (t, b) => Pm([[76, b / 2], [74, b / 2], [72, b]], t, { vel: 0.4 }),
  'distance-2': (t, b) => V([[64, b], [67, b], [69, 2 * b]], t, { vel: 0.55 }),
  'distance-3': (t, b) => Pm([[67, b], [72, 2 * b]], t, { vel: 0.4 }),
  'relais-0': (t, b) => Pm([[62, b / 2], [64, b / 2], [67, b / 2], [69, b], [67, b / 2], [64, b]], t, { vel: 0.55 }),
  'relais-2': (t, b) => V([[69, b], [72, b], [69, b], [67, 2 * b]], t),
  'relais-3': (t, b) => { V([[64, 2 * b], [67, 2 * b]], t, { vel: 0.5 }); Pm([[76, b], [74, b], [72, 2 * b]], t + b, { vel: 0.35 }); },
  'ciel-2': (t, b) => { Pm([[60, b / 2], [64, b / 2], [67, b]], t, { vel: 0.45 }); V([[72, b], [69, 2 * b]], t + b); },
  'ciel-4': (t, b) => V([[67, 2 * b], [72, 3 * b]], t, { vel: 0.6 }),
  beat: (t, b) => V([[62, b / 2], [64, b / 2], [67, b], [64, b], [62, 2 * b]], t, { vel: 0.55 }),
  riff: (t, b) => V([[67, b / 3], [67, b / 3], [69, b / 3], [72, b], [69, b / 2], [67, b / 2], [64, 2 * b]], t, { vel: 0.6 }),
  // Le labo : un charley qui accélère jusqu'à devenir une note (Sol), puis le piano la reprend.
  labo: (t, b) => {
    let w = t; let gap = b / 2;
    while (gap > 0.03) { drums.hat(w, 0.35); w += gap; gap *= 0.82; }
    const c = audio(); const o = impulseOsc(30); const lp = c.createBiquadFilter(); const g = c.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    o.frequency.setValueAtTime(30, w); o.frequency.exponentialRampToValueAtTime(392, w + 0.5);
    g.gain.setValueAtTime(0.0001, w); g.gain.linearRampToValueAtTime(0.12, w + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, w + 0.9);
    o.connect(lp).connect(g).connect(out()); o.start(w); o.stop(w + 1);
    Pm([[79, b], [76, b], [72, 2 * b]], w + 0.45, { vel: 0.45 });
  },
  trois: (t, b) => { Pm([[60, b / 2], [64, b / 2], [67, b / 2], [69, b]], t, { vel: 0.5 }); Pm([[69, b / 2], [67, b / 2], [64, b / 2], [60, b]], t + 3 * b, { vel: 0.45 }); },
  grimoire: (t, b) => Pm([[81, 2 * b], [76, 2 * b]], t, { vel: 0.3 }),
  pochette: (t, b) => V([[72, 2 * b], [76, 2 * b]], t, { vel: 0.5 }),
  // Tour de l'app : à chaque étape, un petit beat et trois notes qui montent, comme une porte qui s'ouvre.
  etape: (t, b) => { drums.kick(t, 0.7); drums.clap(t + b, 0.3); drums.hat(t + b / 2, 0.2); drums.hat(t + 1.5 * b, 0.2); Pm([[67, b / 2], [72, b / 2], [76, b]], t + 0.02, { vel: 0.45 }); },
  final: (t, b) => { drums.kick(t, 0.9); drums.snare(t + b, 0.4); drums.kick(t + 1.5 * b, 0.6); drums.clap(t + 2 * b, 0.4); V([[67, b], [72, b], [76, 2 * b]], t, { vel: 0.6 }); Pm([[60, 2 * b], [64, 2 * b], [67, 2 * b]], t, { vel: 0.4 }); },
};

// ---------- La bande ----------
// Do – Lam – Fa – Sol. Accueil : feutré. Scènes : le groove entre. Vitrine : le piano chante.
// Tour de l'app : un gros beat qui gagne une couche à chaque étape ; à l'étape 1, tout le groupe joue.
const BPM = 86; const S16 = 60 / BPM / 4; const MES = 16 * S16; const NOIRE = 4 * S16;
const GRILLE = [[48, 55, 59, 64], [45, 52, 57, 60], [41, 52, 57, 60], [43, 50, 55, 59]];
const BASSE = [36, 33, 29, 31];
const MELO = [[[76, 1.5], [74, 0.5], [72, 2]], [[0, 2], [69, 1], [72, 1]], [[72, 1.5], [71, 0.5], [69, 2]], [[0, 1], [67, 1], [74, 2]]];
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const bande = { t: 0, next: 0, bar: 0, t0: 0, section: 'accueil', couche: 0 };
function mesure(w, n) {
  const sec = bande.section; const ch = n % 4;
  const lourd = sec === 'coach'; const c = bande.couche;
  for (let i = 0; i < 16; i++) {
    const x = w + i * S16;
    if (sec === 'accueil') {
      if (i === 0 || i === 8) drums.kick(x, 0.45);
      if (i % 2 === 0) drums.hat(x, 0.08);
      if (i === 12 && n % 2) drums.snare(x, 0.12);
      continue;
    }
    if (i === 0 || i === 7 || i === 10) drums.kick(x, lourd ? (i ? 0.8 : 1) : 0.6);
    if ((!lourd || c >= 1) && (i === 4 || i === 12)) { drums.snare(x, lourd ? 0.5 : 0.25); if (lourd) drums.clap(x, 0.22); }
    if ((!lourd || c >= 2) && i % 2 === 0) drums.hat(x, i % 4 === 0 ? 0.14 : 0.08);
  }
  if (sec !== 'accueil') { bass(hz(BASSE[ch]), w, S16 * 6); bass(hz(BASSE[ch]), w + 10 * S16, S16 * 4); }
  if (!lourd || c >= 3) R(GRILLE[ch], w, { dur: MES * 0.97, vel: sec === 'accueil' ? 0.42 : 0.32 });
  if ((sec === 'accueil' && n >= 2) || sec === 'vitrine' || (lourd && c >= 5)) Pm(MELO[ch].map(([m, d]) => [m, d * NOIRE]), w, { vel: 0.3 });
  if (lourd && c >= 9) V([[GRILLE[ch][3] + 12, MES * 0.45], [GRILLE[ch][2] + 12, MES * 0.45]], w, { vel: 0.4 });
}
// ---------- La musique de Frog ----------
// Deux pièces de Frog : « Projet 1 » (le passage après le silence) sous les diapos,
// « Joy Walk » pendant le tour de l'app — une promenade. Fondu de l'une à l'autre, boucles invisibles.
// Quand un effet ou un petit beat doit passer, la musique baisse un instant, puis remonte.
const PISTES = {
  // bpm et t1 (un premier temps, en secondes dans le fichier) mesurés par flux spectral ; gamme par chroma.
  projet1: { url: 'data/sons/frog-visite.mp3', boucle: [34.5, 115.51], xf: 0.1, decal: 2, bpm: 120, t1: 34.98, gamme: [2, 5, 7, 9, 0] }, // ré mineur pentatonique
  joywalk: { url: 'data/sons/frog-joywalk.mp3', boucle: [16, 72.58], xf: 1.5, decal: -5, bpm: 116.6, t1: 16.43, gamme: [7, 9, 11, 2, 4] }, // sol majeur pentatonique
};
const bufs = {}; const charges = {};
let decal = 0; // transposition des accents dans la tonalité de la pièce qui joue
let lecture = null;
function chargePiste(id) {
  if (!charges[id]) charges[id] = fetch(PISTES[id].url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())).then((b) => audio().decodeAudioData(b)).then((buf) => { bufs[id] = buf; return buf; }).catch(() => { bufs[id] = false; return false; });
  return charges[id];
}
const pisteDe = (section) => (section === 'coach' ? 'joywalk' : 'projet1');
const niveau = () => (bande.section === 'coach' ? 0.95 : 0.8);
function jouePiste(l, offset, when) {
  const c = audio(); const P = PISTES[l.id];
  const src = c.createBufferSource(); src.buffer = bufs[l.id];
  const g = c.createGain(); src.connect(g).connect(l.master);
  g.gain.setValueAtTime(0.0001, when); g.gain.linearRampToValueAtTime(1, when + Math.max(0.06, P.xf));
  src.start(when, offset);
  l.pos = [...(l.pos || []).slice(-2), { when, offset }];
  const [A, B] = P.boucle;
  const fin = when + (B - offset);
  l.src.push(src);
  l.timer = setTimeout(() => {
    if (lecture !== l) return;
    g.gain.setValueAtTime(1, fin - P.xf); g.gain.linearRampToValueAtTime(0.0001, fin + 0.06);
    src.stop(fin + 0.1);
    jouePiste(l, A - P.xf, fin - P.xf);
  }, Math.max(0, (fin - c.currentTime - 2.5) * 1000));
}
function fondu(l, vers, duree) {
  const c = audio(); const gg = l.master.gain;
  gg.cancelScheduledValues(c.currentTime); gg.setValueAtTime(Math.max(0.0001, gg.value), c.currentTime); gg.linearRampToValueAtTime(vers, c.currentTime + duree);
}
function arretePiste(duree = 1.5) {
  if (!lecture) return;
  const l = lecture; lecture = null;
  clearTimeout(l.timer); fondu(l, 0.0001, duree);
  setTimeout(() => l.src.forEach((x) => { try { x.stop(); } catch { /* déjà arrêtée */ } }), duree * 1000 + 200);
}
function demarrePiste(id) {
  const c = audio();
  if (c.state !== 'running' || !bufs[id] || (lecture && lecture.id === id)) return;
  if (lecture) arretePiste(2);
  const master = c.createGain(); master.gain.value = 0.0001; master.connect(out());
  const l = { id, master, src: [], timer: 0 };
  lecture = l; decal = PISTES[id].decal;
  fondu(l, niveau(), lecture.id === 'joywalk' ? 2 : 0.8);
  jouePiste(l, 0, c.currentTime + 0.05);
}
// Le prochain temps de la pièce de Frog, en heure de l'audio : les accents tombent sur SON temps.
function prochainTemps(t) {
  const P = PISTES[lecture.id]; const per = 60 / P.bpm;
  const p = [...lecture.pos].reverse().find((x) => x.when <= t) || lecture.pos[0];
  const ici = p.offset + (t - p.when);
  return p.when + (P.t1 + Math.ceil((ici - P.t1) / per) * per - p.offset);
}
// La musique se pousse pour laisser passer un effet, puis revient.
function laissePasser(duree = 2.6, creux = 0.32) {
  if (!lecture) return;
  const c = audio(); const gg = lecture.master.gain; const n = niveau();
  gg.cancelScheduledValues(c.currentTime); gg.setValueAtTime(Math.max(0.0001, gg.value), c.currentTime);
  gg.linearRampToValueAtTime(n * creux, c.currentTime + 0.15);
  gg.setValueAtTime(n * creux, c.currentTime + duree); gg.linearRampToValueAtTime(n, c.currentTime + duree + 0.8);
}
function lancerPiste(id) {
  const c = audio();
  const go = () => demarrePiste(id);
  if (c.state === 'running') go();
  else {
    c.resume().then(go).catch(() => {});
    // Arrivée par un lien : le navigateur attend un premier geste pour laisser jouer le son.
    const once = () => { c.resume().then(go).catch(() => {}); };
    addEventListener('pointerdown', once, { once: true });
    addEventListener('keydown', once, { once: true });
  }
}

export function bandeStart(section = 'accueil') {
  bande.section = section;
  if (!sonActif()) return;
  const id = pisteDe(section);
  // La pièce de Frog d'abord ; la bande jouée par l'app seulement si elle manque.
  if (bufs[id] === undefined) { chargePiste(id).then((ok) => { if (ok || !bufs[id]) bandeStart(bande.section); }); return; }
  if (bufs[id]) { if (!lecture || lecture.id !== id) lancerPiste(id); return; }
  if (bande.t) return;
  const c = audio();
  const go = () => {
    if (bande.t || c.state !== 'running') return;
    bande.next = c.currentTime + 0.12; bande.t0 = bande.next; bande.bar = 0;
    const tick = () => { while (bande.next < c.currentTime + 0.6) { mesure(bande.next, bande.bar); bande.next += MES; bande.bar++; } };
    tick(); bande.t = setInterval(tick, 200);
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
export function bandeSection(section, couche = 0) {
  bande.section = section; bande.couche = couche;
  if (lecture && lecture.id !== pisteDe(section)) bandeStart(section);
}
export function bandeStop() { clearInterval(bande.t); bande.t = 0; bande.couche = 0; arretePiste(); }

export const sonActif = () => store.get('visiteSon', true);
export function basculerSon() { const v = !sonActif(); store.set('visiteSon', v); if (!v) bandeStop(); return v; }
export const prechargerVisite = () => { chargePiste('projet1'); chargePiste('joywalk'); return prechargerSons(['piano', 'rhodes', 'voix']); };
export function jouer(nom) {
  if (!nom || !sonActif() || !SONS[nom]) return;
  try {
    const c = audio();
    let t = c.currentTime + 0.05;
    if (lecture) { t = prochainTemps(t + 0.1); laissePasser(2.6, 0.45); SONS[nom](t, 60 / PISTES[lecture.id].bpm); return; } // sur son temps, dans sa gamme
    if (bande.t) t = bande.t0 + Math.ceil((t - bande.t0) / NOIRE) * NOIRE; // calé sur le temps de la bande
    SONS[nom](t, lecture ? 0.5 : NOIRE);
  } catch (e) { console.debug('accent', e); } // le son n'est pas essentiel
}

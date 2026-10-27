// La cathédrale : une clé de voûte (quelques nombres entiers, comme 4:5:6:7) jouée à trois vitesses en même temps.
// Très lente, elle donne la forme (les parties durent 4, 5, 6, 7) ; moyenne, le rythme (4 contre 5 contre 6 contre 7) ;
// rapide, l'harmonie (les mêmes rapports entre les fréquences : un accord en intonation juste, sans arrondi au piano).
// Cowell, New Musical Resources (1930) ; Stockhausen, « …wie die Zeit vergeht… » (1957).
// Le labo propose la cathédrale ; Frog et Zaza décident où mettre la lumière.
import { audio, out, lampeHorsLigne } from './audio.js';
import { joue, prechargerSons, echantillons, reglage, boucler } from './sampler.js';

// Les familles de l’orchestre qu’on peut mettre en lumière sur chaque partie.
export const FAMILLES = [
  ['cordes', 'Les cordes', 'cordes'], ['bois', 'Les bois', 'flute'], ['cuivres', 'Les cuivres', 'cor'],
  ['choeur', 'Le chœur', 'choeur'], ['harpe', 'La harpe', 'harpe'], ['celesta', 'Le célesta', 'celesta'], ['silence', 'Presque rien', null],
];
const RYTHME = ['timbales', 'pizz', 'harpe', 'celesta', 'pizz', 'harpe'];
const BOIS = ['flute', 'hautbois', 'clarinette'];
// Les instruments que la cathédrale charge avant de jouer.
export const BANQUES_UTILES = ['cordes', 'pizz', 'harpe', 'cor', 'cuivres', 'flute', 'clarinette', 'hautbois', 'choeur', 'timbales', 'celesta'];
const CYCLE = 2.4; // un tour de rythme, en secondes
// n frappes réparties au mieux sur len pas (rythme euclidien, Toussaint 2005).
const euclide = (n, len) => Array.from({ length: len }, (_, i) => Math.floor((i * n) / len) !== Math.floor(((i - 1) * n) / len) || i === 0);
// Ramène un intervalle (en demi-tons, fractionnaire) dans l'octave.
const plier = (x) => ((x % 12) + 12) % 12;
// La note la plus proche de « vise » qui garde la même classe de hauteur.
const pres = (classe, vise) => { let m = vise - plier(vise) + classe; if (m - vise > 6) m -= 12; if (vise - m > 6) m += 12; return m; };

// Les liens du labo, dans la cathédrale. Une source (un disque à chacune de ses frappes, la respiration, l'oscillation,
// le hasard, le chaos) agit sur un disque ou sur tout un groupe : volume, hauteur, timbre, place gauche-droite. Ces
// sources-là se calculent : elles sont écrites dans la partition, donc gardées dans le WAV et le MIDI. La voix, le
// clavier et la molette, eux, n'existent qu'en direct : ils agissent pendant l'écoute seulement.
export const SOURCES_VIVES = new Set(['voix', 'clavier', 'molette']);
// Vrai si un lien vise ce disque (directement, ou par son pupitre) ; un disque n’agit jamais sur lui-même.
export const viseLien = (l, j, voix) => (String(l.cible).startsWith('g') ? !!voix[j]?.g && voix[j].g === l.cible.slice(1) : +l.cible === j) && String(j) !== String(l.src);
// Applique les liens à une note : la source (un disque, la respiration, le chaos…) change son volume, sa hauteur, son timbre ou sa place.
export function moduler(n, liens, voix, envDe) {
  liens.forEach((l) => {
    if (n.d == null || !viseLien(l, n.d, voix)) return;
    const env = envDe(l.src, n.t); if (env == null) return; const a = (l.force ?? 0.6) * env; const bas = l.sens === 'baisse'; const p = l.param || 'volume';
    if (p === 'volume') n.vel *= bas ? 1 - a : 1 - (l.force ?? 0.6) + a;
    if (p === 'hauteur') n.midi += (bas ? -1 : 1) * a * 2; // jusqu'à deux demi-tons, comme au labo
    if (p === 'brillance') n.brille = (n.brille ?? 1) * (bas ? 1 - 0.9 * a : 1 + 2.5 * a);
    if (p === 'pan') n.pan = Math.max(-1, Math.min(1, (n.pan || 0) + (bas ? -1 : 1) * a));
  });
}
// Les nombres de la clé toujours rangés du plus petit au plus grand, sans doublon : les réglages des disques et les
// liens suivent leur disque.
export function ranger(cle, voix = [], liens = []) {
  const o = cle.map((n, i) => ({ n: Math.round(n), i })).filter((x) => x.n > 0 && x.n <= 32).sort((a, b) => a.n - b.n).filter((x, k, l) => !k || l[k - 1].n !== x.n);
  const neuf = new Map(o.map((x, k) => [x.i, k])); const re = (x) => (/^\d+$/.test(String(x)) ? (neuf.has(+x) ? String(neuf.get(+x)) : null) : String(x));
  return { cle: o.map((x) => x.n), voix: o.map((x) => voix[x.i] || {}), liens: liens.map((l) => ({ ...l, src: re(l.src), cible: String(l.cible).startsWith('g') ? l.cible : re(l.cible) })).filter((l) => l.src != null && l.cible != null) };
}

// Compose l’œuvre : les parties (la forme), les frappes de chaque disque (le rythme), les accords tenus (l’harmonie), la lumière, les liens et la coda, en une liste de notes datées.
export function composer({ cle, tonique = 50, duree = 120, lumieres = [], axe = 0.5, voix = [], parties = [], liens = [] }) {
  const r = [...new Set(cle.map((x) => Math.round(x)).filter((x) => x > 0 && x <= 32))].sort((a, b) => a - b);
  if (!r.length) return { sections: [], notes: [], duree: 0, r };
  const somme = r.reduce((a, b) => a + b, 0); const ecart = (x) => 12 * Math.log2(x / r[0]);
  const sections = []; let t = 0;
  r.forEach((x, i) => { const d = (duree * x) / somme; sections.push({ i, a: t, b: t + d, ratio: x, racine: tonique + plier(ecart(x)), lumiere: lumieres[i] || FAMILLES[i % 6][0] }); t += d; });
  const coda = 7; const total = t + coda; const notes = [];
  const enveloppe = (u) => 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, u / t)) ** 0.8;
  const pousse = (n) => { if (n.vel > 0.02) notes.push(n); };
  // Les sources qui se calculent, au moment exact de chaque note.
  const chaos = [0.37]; const graine = (b) => { const x = Math.sin(b * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const envCalc = (src, u) => {
    if (SOURCES_VIVES.has(src)) return null;
    if (src === 'souffle') return 0.5 - 0.5 * Math.cos((u * Math.PI * 2) / (4 * CYCLE));
    if (src === 'vibrato') return 0.5 - 0.5 * Math.cos(u * 6 * Math.PI * 2);
    const b = Math.floor((u * r[0]) / CYCLE);
    if (src === 'hasard') return graine(b);
    if (src === 'chaos') { while (chaos.length <= b) chaos.push(3.93 * chaos[chaos.length - 1] * (1 - chaos[chaos.length - 1])); return chaos[b]; }
    const k = +src; if (!(k >= 0 && k < r.length) || voix[k]?.muet) return null; const pas = CYCLE / r[k]; const dep = (((u - (voix[k]?.dec || 0) * pas) % pas) + pas) % pas; return Math.exp(-dep * 9);
  };
  const calcules = liens.filter((l) => !SOURCES_VIVES.has(l.src));
  // Une partie peut se poser sur un accord joué par Frog : sa fondamentale et ses propres rapports.
  parties.forEach((p, i) => { if (p && sections[i]) { sections[i].racine = tonique + plier(p.racine - tonique); sections[i].forme = p; } });
  sections.forEach((s) => {
    const f = s.forme?.cle; const accord = f ? f.map((x) => s.racine + plier(12 * Math.log2(x / f[0]))) : r.map((x) => s.racine + plier(ecart(x)));
    // L'harmonie : l'accord tenu, réarticulé tous les deux tours. Plus l'axe va vers « harmonie », plus il est présent.
    if (axe > 0.12) for (let u = s.a; u < s.b - 0.3; u += CYCLE * 2) {
      const v = (0.12 + 0.3 * axe) * enveloppe(u);
      accord.forEach((m, k) => !voix[k]?.muet && pousse({ t: u + k * 0.02, dur: Math.min(CYCLE * 2.1, s.b - u), banque: 'cordes', midi: pres(plier(m), 55 + k * 4), vel: v }));
      pousse({ t: u, dur: Math.min(CYCLE * 2.1, s.b - u), banque: 'cordes', midi: pres(plier(s.racine), 40), vel: v * 0.9 });
      if (s.lumiere === 'cuivres' || axe > 0.75) pousse({ t: u + 0.05, dur: CYCLE * 1.6, banque: 'cor', midi: pres(plier(accord[1] ?? accord[0]), 57), vel: v * 0.8 });
    }
    // Le rythme : chaque nombre de la clé de voûte frappe autant de fois par tour (4 contre 5 contre 6…).
    if (axe < 0.88) r.forEach((x, j) => {
      if (voix[j]?.muet) return;
      const banque = voix[j]?.banque || RYTHME[j % RYTHME.length]; const v0 = (0.75 - 0.6 * axe) * (j === 0 ? 0.9 : 0.6) * (voix[j]?.vol ?? 1);
      const haut = ({ timbales: 41, celesta: 79, harpe: 64, flute: 76, choeur: 64, cor: 57, cuivres: 57, clarinette: 62, hautbois: 69 }[banque] || 60) + 12 * (voix[j]?.oct || 0);
      // Les réglages ajoutés au disque : décalage (contretemps), aération (des frappes retirées, toujours les mêmes),
      // durée des notes, accent du premier coup, place gauche-droite.
      const V = voix[j] || {}; const pasR = CYCLE / x; const aer = V.aer || 0; let k = 0;
      for (let u = s.a + (V.dec || 0) * pasR; u < s.b - 0.05; u += pasR, k++) {
        if (aer && ((k * 9301 + j * 49297 + 233) % 233280) / 233280 < aer) continue;
        const premier = k % x === 0;
        // Un disque qui respire : son volume monte et descend sur quatre tours, comme au labo.
        const souffle = V.respire ? 0.15 + 0.85 * (0.5 - 0.5 * Math.cos((u * Math.PI * 2) / (4 * CYCLE))) : 1;
        const n = { t: u, dur: V.dur ?? 0.3, banque, midi: pres(plier(accord[j % accord.length] ?? s.racine), haut), pan: V.pan || 0, vel: v0 * souffle * enveloppe(u) * (premier ? 1 + (V.acc ?? 0.15) : 1), d: j };
        if (calcules.length) moduler(n, calcules, voix, envCalc);
        pousse(n);
      }
    });
    // La lumière : une mélodie dans la famille choisie, faite des notes de l'accord, au rythme du nombre de la partie.
    const fam = FAMILLES.find((f) => f[0] === s.lumiere);
    if (fam?.[2]) {
      const banque = fam[0] === 'bois' ? BOIS[s.i % 3] : fam[2]; const pas = (CYCLE * 2) / 16; const motif = euclide(Math.min(16, Math.max(3, s.ratio)), 16);
      const centre = { cordes: 72, flute: 79, hautbois: 74, clarinette: 67, cor: 62, choeur: 69, harpe: 72, celesta: 84 }[banque] || 72;
      let k = 0; let phrase = 0;
      for (let u = s.a + CYCLE; u < s.b - CYCLE * 0.5; u += CYCLE * 2, phrase++) {
        motif.forEach((on, p) => {
          if (!on || u + p * pas > s.b - 0.4) return;
          // Une phrase monte dans l'accord, la suivante redescend.
          const monte = phrase % 2 === 0; const L = accord.length; const m = accord[monte ? k % L : L - 1 - (k % L)];
          const vise = centre + (monte ? 1 : -1) * ((k % 5) - 2) * 2;
          pousse({ t: u + p * pas, dur: pas * (motif.slice(p + 1).indexOf(true) + 1 || 2) * 0.95, banque, midi: pres(plier(m), vise), vel: (0.45 + 0.15 * Math.sin((p / 16) * Math.PI)) * enveloppe(u) });
          k++;
        });
      }
    }
  });
  // La coda : tout l'orchestre se pose sur l'accord de départ, et s'éteint.
  const fin = r.map((x) => tonique + plier(ecart(x)));
  [['cordes', 52], ['choeur', 64], ['cor', 57], ['harpe', 67]].forEach(([b, vise], n) => fin.forEach((m, k) => pousse({ t: t + n * 0.04 + (b === 'harpe' ? k * 0.12 : 0), dur: coda - 1, banque: b, midi: pres(plier(m), vise + k * 3), vel: 0.42 })));
  pousse({ t, dur: 2, banque: 'timbales', midi: pres(plier(tonique), 41), vel: 0.8 });
  pousse({ t, dur: coda - 1, banque: 'cordes', midi: pres(plier(tonique), 38), vel: 0.5 });
  notes.sort((a, b) => a.t - b.t);
  return { sections, notes, duree: total, r, coda: [t, total], liens, voix };
}

// Précharge tous les instruments de l’orchestre.
export const charger = () => prechargerSons(BANQUES_UTILES);
// L’instrument par défaut de chaque disque, dans l’ordre (timbales, pizzicati, harpe…).
export const RYTHME_DEFAUT = RYTHME;

// Un accord joué (sur un clavier MIDI, ou entendu par une entrée audio) devient une clé de voûte : chaque intervalle
// au-dessus de la note la plus grave est lu comme le rapport simple le plus proche (tierce majeure = 5/4, quinte = 3/2,
// septième « naturelle » = 7/4…), puis on ramène le tout à des entiers. Do Mi Sol → 4:5:6 ; Ré Fa La → 10:12:15.
const JUSTE = [[1, 1], [16, 15], [9, 8], [6, 5], [5, 4], [4, 3], [7, 5], [3, 2], [8, 5], [5, 3], [7, 4], [15, 8]];
const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
// Un accord joué devient une clé de voûte : chaque intervalle lu comme le rapport simple le plus proche, ramené à des entiers (Do Mi Sol → 4:5:6).
export function cleDepuisNotes(midis) {
  const l = [...new Set(midis)].sort((a, b) => a - b); if (l.length < 2) return null;
  const bas = l[0]; const fr = l.map((m) => { const d = m - bas; const [n, q] = JUSTE[d % 12]; return [n * 2 ** Math.floor(d / 12), q]; });
  const den = fr.reduce((a, [, q]) => (a * q) / pgcd(a, q), 1); let cle = fr.map(([n, q]) => (n * den) / q);
  const g = cle.reduce((a, b) => pgcd(a, b)); cle = [...new Set(cle.map((x) => x / g))].sort((a, b) => a - b);
  if (cle.some((x) => x > 32)) return null;
  return { cle, tonique: 45 + ((((bas - 45) % 12) + 12) % 12) };
}

// Le jeu de Frog, pris dans le filet : quels accords ont sonné, combien de temps, combien de fois, et dans quel ordre.
// Chaque accord est ramené en position serrée au-dessus de sa basse (les rapports restent petits), puis lu en nombres.
const NOMS = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
const QUALITES = [['M', ''], ['m', 'm'], ['7', '7'], ['m7', 'm7'], ['maj7', 'maj7'], ['sus4', 'sus4'], ['sus2', 'sus2'], ['dim', 'dim']];
const IV = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus4: [0, 5, 7], sus2: [0, 2, 7], dim: [0, 3, 6] };
// Nomme un accord à partir de ses notes (« Lam/Do », « Sol7 ») ; sinon, la liste de ses notes.
export function nomAccord(pcs, basse) {
  for (const r of pcs) for (const [q, suf] of QUALITES) { const iv = IV[q]; if (iv.length === pcs.length && iv.every((d) => pcs.includes((r + d) % 12))) return `${NOMS[r]}${suf}${r !== basse ? `/${NOMS[basse]}` : ''}`; }
  return pcs.map((x) => NOMS[x]).join('-');
}
// segments : [{ notes: [midi…], a, b }] — d'un clavier MIDI ou de L'oreille.
export function accordsDesSegments(segs) {
  const par = new Map(); let avant = null; let total = 0;
  segs.forEach(({ notes, a, b }) => {
    const d = b - a; if (d < 0.25 || notes.length < 2) { if (d >= 0.25) avant = null; return; }
    const basse = Math.min(...notes); const pcs = [...new Set(notes.map((m) => ((m % 12) + 12) % 12))]; if (pcs.length < 2) return;
    const bpc = ((basse % 12) + 12) % 12; const k = `${bpc}|${[...pcs].sort((x, y) => x - y).join(',')}`;
    let c = par.get(k);
    if (!c) {
      // Position serrée : la basse, puis les autres notes dans l'octave au-dessus. Trop complexe ? on retire une note.
      let serre = [basse, ...pcs.filter((x) => x !== bpc).map((x) => basse + ((x - bpc + 12) % 12)).sort((x, y) => x - y)].slice(0, 6); let cle = null;
      while (serre.length >= 2 && !(cle = cleDepuisNotes(serre))) serre = serre.slice(0, -1);
      if (!cle) return;
      c = { k, nom: nomAccord(pcs, bpc), notes: serre, cle: cle.cle, racine: basse, tonique: cle.tonique, duree: 0, fois: 0, premier: a }; par.set(k, c);
    }
    c.duree += d; total += d; if (avant !== k) c.fois++; avant = k;
  });
  return { accords: [...par.values()].sort((x, y) => y.duree - x.duree), total };
}
// Les notes MIDI du filet → des segments : ce qui sonne entre deux événements (la pédale de sustain compte).
export function segmentsMidi(midi) {
  const ev = [...midi].sort((a, b) => a.t - b.t); const doigts = new Set(); const sonnent = new Set(); let pedale = false; const segs = []; let t0 = null;
  ev.forEach((m) => {
    const c = m.d[0] & 0xf0; const n = m.d[1];
    const avant = [...sonnent];
    if (c === 0x90 && m.d[2]) { doigts.add(n); sonnent.add(n); }
    else if (c === 0x80 || c === 0x90) { doigts.delete(n); if (!pedale) sonnent.delete(n); }
    else if (c === 0xb0 && n === 64) { pedale = m.d[2] >= 64; if (!pedale) [...sonnent].forEach((x) => { if (!doigts.has(x)) sonnent.delete(x); }); }
    else return;
    if (t0 != null && avant.length) segs.push({ notes: avant, a: t0, b: m.t });
    t0 = m.t;
  });
  // Les petits écarts entre les doigts (moins d'un dixième de seconde) ne font pas un nouvel accord.
  const fus = [];
  segs.forEach((s) => { const l = fus[fus.length - 1]; if (l && s.b - s.a < 0.1) { l.b = s.b; return; } if (l && l.notes.join() === s.notes.join() && Math.abs(l.b - s.a) < 0.01) l.b = s.b; else fus.push({ ...s }); });
  return fus;
}
// Ce que le jeu donne à la cathédrale : la clé de voûte de l'accord qui revient le plus, et chaque partie posée sur un
// des accords qui reviennent, dans l'ordre où ils sont apparus. La coda revient à l'accord principal.
export function cathedraleDuJeu({ accords }) {
  if (!accords.length) return null;
  const tete = accords[0]; const n = tete.cle.length;
  const choisis = accords.slice(0, Math.max(n, 1)).sort((a, b) => a.premier - b.premier).slice(0, n);
  return { cle: tete.cle, tonique: tete.tonique, parties: choisis.map((c) => ({ racine: c.racine, cle: c.cle, nom: c.nom })) };
}

// Jouer en direct : on programme les notes un peu à l'avance, au fil de la lecture.
export function jouer(oeuvre, { depuis = 0, onFin, sortie = null, vivant = null } = {}) {
  const c = audio(); const maitre = c.createGain(); maitre.gain.value = 0.42; maitre.connect(out()); /* la sortie de l'app double le volume : on entre plus bas, pour ne pas faire craquer le limiteur */ // par la lampe, si elle est allumée
  const pans = new Map(); const panDe = (p) => { const k = Math.round(p * 10) / 10; if (!pans.has(k)) { const sp = c.createStereoPanner(); sp.pan.value = k; sp.connect(maitre); pans.set(k, sp); } return pans.get(k); };
  // Le timbre (brillance) : un filtre par palier, partagé par les notes qui tombent dedans.
  const filtres = new Map(); const destDe = (n) => { const fin = n.pan ? panDe(n.pan) : maitre; if (n.brille == null || Math.abs(n.brille - 1) < 0.05) return fin; const k = `${Math.round(Math.log2(n.brille) * 6)}|${Math.round((n.pan || 0) * 10)}`; if (!filtres.has(k)) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Math.max(250, Math.min(16000, 2400 * 2 ** (+k.split('|')[0] / 6))); f.connect(fin); filtres.set(k, f); } return filtres.get(k); };
  const vives = (oeuvre.liens || []).filter((l) => SOURCES_VIVES.has(l.src)); const avance = vives.length && vivant ? 0.25 : 0.8;
  const t0 = c.currentTime + 0.15 - depuis; let i = oeuvre.notes.findIndex((n) => n.t >= depuis); if (i < 0) i = oeuvre.notes.length;
  const tic = () => {
    const horizon = c.currentTime + avance;
    while (i < oeuvre.notes.length && t0 + oeuvre.notes[i].t < horizon) {
      let n = oeuvre.notes[i++]; if (vives.length && vivant && n.d != null) { n = { ...n }; moduler(n, vives, oeuvre.voix || [], vivant); }
      joue(n.banque, n.midi, { when: t0 + n.t, dur: n.dur, vel: Math.max(0, n.vel), dest: destDe(n) });
      // Et sur le matériel de Frog : la même note, arrondie au demi-ton (le MIDI ne connaît pas l'intonation juste).
      if (sortie) { const ch = canal(n.banque); const m = Math.max(0, Math.min(127, Math.round(n.midi))); const ts = performance.now() + (t0 + n.t - c.currentTime) * 1000; try { sortie.send([0x90 | ch, m, Math.max(1, Math.min(127, Math.round(n.vel * 140)))], ts); sortie.send([0x80 | ch, m, 0], ts + n.dur * 1000); } catch { /* appareil débranché */ } }
    }
    if (c.currentTime - t0 > oeuvre.duree + 1.5) { arreter(); onFin?.(); }
  };
  if (sortie) Object.entries(PROGRAMMES).forEach(([b, p]) => { try { sortie.send([0xc0 | canal(b), p]); } catch { /* */ } });
  const id = setInterval(tic, 120); tic();
  const arreter = () => { if (sortie) for (let ch = 0; ch < 16; ch++) { try { sortie.send([0xb0 | ch, 123, 0]); } catch { /* */ } } clearInterval(id); maitre.gain.setTargetAtTime(0, c.currentTime, 0.15); setTimeout(() => maitre.disconnect(), 900); };
  return { arreter, position: () => c.currentTime - t0 };
}

// Rendre en fichier : le même orchestre, calculé hors ligne, plus vite que le temps réel.
export async function rendre(oeuvre, onProgres) {
  await charger();
  const sr = 44100; const ctx = new OfflineAudioContext(2, Math.ceil((oeuvre.duree + 1.5) * sr), sr);
  const maitre = ctx.createDynamicsCompressor(); maitre.threshold.value = -14; maitre.ratio.value = 3; maitre.connect(lampeHorsLigne(ctx, ctx.destination));
  oeuvre.notes.forEach((n) => {
    const l = echantillons(n.banque); if (!l) return; const B = reglage(n.banque);
    const s = l.reduce((a, b) => (Math.abs(b.midi - n.midi) < Math.abs(a.midi - n.midi) ? b : a));
    const src = ctx.createBufferSource(); src.playbackRate.value = 2 ** ((n.midi - s.midi) / 12); boucler(src, B, n.dur, s.buf);
    const g = ctx.createGain(); const v = B.gain * n.vel;
    g.gain.setValueAtTime(v, n.t); g.gain.setValueAtTime(v, n.t + n.dur); g.gain.exponentialRampToValueAtTime(0.0001, n.t + n.dur + B.release);
    let fin = maitre; if (n.pan) { const sp = ctx.createStereoPanner(); sp.pan.value = n.pan; sp.connect(maitre); fin = sp; }
    if (n.brille != null && Math.abs(n.brille - 1) >= 0.05) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = Math.max(250, Math.min(16000, 2400 * n.brille)); f.connect(fin); fin = f; }
    src.connect(g).connect(fin);
    src.start(n.t); src.stop(n.t + n.dur + B.release + 0.05);
  });
  onProgres?.(0.5);
  const buf = await ctx.startRendering();
  // Ramené à un niveau franc : le pic à -1 dB.
  let pic = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) pic = Math.max(pic, Math.abs(d[i])); }
  const k = pic > 1e-4 ? 0.89 / pic : 1; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
  return buf;
}

// Le fichier MIDI : une piste par famille (programmes General MIDI), les hauteurs arrondies au demi-ton.
const PROGRAMMES = { cordes: 48, pizz: 45, harpe: 46, cor: 60, cuivres: 61, flute: 73, clarinette: 71, hautbois: 68, choeur: 52, timbales: 47, celesta: 8 };
const canal = (b) => { const k = Object.keys(PROGRAMMES).indexOf(b); return k >= 9 ? k + 1 : Math.max(0, k); }; // le canal 10 est réservé aux batteries
// L’œuvre en événements MIDI : une piste par famille, ses programmes General MIDI, chaque note arrondie au demi-ton.
export function evenementsMidi(oeuvre) {
  const canaux = Object.keys(PROGRAMMES); const can = canal;
  const ev = canaux.map((b) => ({ t: 0, d: [0xc0 | can(b), PROGRAMMES[b]] }));
  oeuvre.notes.forEach((n) => { const ch = can(n.banque); const m = Math.max(0, Math.min(127, Math.round(n.midi))); const v = Math.max(1, Math.min(127, Math.round(n.vel * 140)));
    ev.push({ t: n.t, d: [0x90 | ch, m, v] }, { t: n.t + n.dur, d: [0x80 | ch, m, 0] }); });
  return ev.sort((a, b) => a.t - b.t || (a.d[0] & 0xf0) - (b.d[0] & 0xf0));
}

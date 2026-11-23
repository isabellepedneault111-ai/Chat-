// Habiller une chanson : un orchestre qui suit SES accords, mesure par mesure, à SON tempo, seulement là où on le veut.
// Chaque « habit » est une façon d'écrire pour l'orchestre (des cordes tenues, un chœur au loin, des cuivres qui
// montent…). Les voix bougent le moins possible d'un accord à l'autre (conduite des voix), comme un arrangeur le ferait.
// Le résultat a la forme d'une œuvre de la cathédrale ({ notes, duree }) : elle se joue et se rend avec le même moteur.
import { lireAccord } from './views/mots.js';

const IV = { M: [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7], sus4: [0, 5, 7], dim: [0, 3, 6], add9: [0, 4, 7, 14] };

export const HABITS = [
  { id: 'cordes', nom: 'Cordes douces', idee: 'Un tapis de cordes tenues, la basse en dessous. Sous un couplet, ça porte sans prendre la place.' },
  { id: 'choeur', nom: 'Chœur lointain', idee: 'Des voix sans paroles, très loin derrière. Pour une intro qui flotte, ou un refrain qui s’ouvre.' },
  { id: 'cuivres', nom: 'Cuivres qui montent', idee: 'Cors et cuivres qui grossissent du début à la fin du passage. Pour un pont qui prépare un grand retour.' },
  { id: 'harpe', nom: 'Harpe et flûte', idee: 'La harpe égrène chaque accord, la flûte tient la note du dessus. Léger, lumineux, pour une intro ou une fin.' },
  { id: 'tout', nom: 'Tout l’orchestre', idee: 'Cordes, cors, harpe et timbales ensemble. Pour un sommet, une fin, un moment qui doit tout ouvrir.' },
];

// L'accord qui sonne à chaque temps de la grille (une case vide : l'accord d'avant continue).
function temps(grille) {
  const out = []; let cur = null;
  grille.flat().forEach((x) => { const c = x && x !== '—' ? lireAccord(x) : null; if (c) cur = c; out.push(cur); });
  const premier = out.find(Boolean); return out.map((c) => c || premier || { r: 0, q: 'M' });
}
// Les notes d'un accord dans une zone [bas, haut], placées au plus près de la voix d'avant.
function voicing(c, bas, haut, avant) {
  const pcs = (IV[c.q] || IV.M).map((v) => (c.r + v) % 12);
  const cands = []; for (let m = bas; m <= haut; m++) if (pcs.includes(m % 12)) cands.push(m);
  // On prend une note de chaque son de l'accord, la plus proche de la voix d'avant (ou du centre de la zone).
  const centre = avant?.length ? avant.reduce((s, x) => s + x, 0) / avant.length : (bas + haut) / 2;
  return pcs.map((p) => cands.filter((m) => m % 12 === p).sort((x, y) => Math.abs(x - centre) - Math.abs(y - centre))[0]).filter((x) => x != null).sort((x, y) => x - y);
}

// a, b : de la mesure a à la mesure b (comprises, comptées à partir de 1). niveau : 0 à 1 (le volume de l'orchestre).
export function habiller({ grille, temps: dt, a = 1, b = null, habit = 'cordes', niveau = 0.8 }) {
  const T = temps(grille); const nbMes = Math.ceil(T.length / 4);
  const m0 = Math.max(0, a - 1); const m1 = Math.min(nbMes - 1, (b || nbMes) - 1);
  const notes = []; const N = (banque, midi, t, dur, vel, pan = 0) => notes.push({ banque, midi, t, dur, vel: vel * niveau, pan });
  let haut = null; let bas = null; const debut = m0 * 4 * dt; const total = (m1 - m0 + 1) * 4;
  for (let k = m0 * 4; k < (m1 + 1) * 4; k++) {
    const c = T[k % T.length]; const prec = k > m0 * 4 ? T[(k - 1) % T.length] : null;
    const change = !prec || prec.r !== c.r || prec.q !== c.q; const debutMesure = k % 4 === 0;
    let fin = k + 1; while (fin < (m1 + 1) * 4 && T[fin % T.length] === c) fin++;
    const t = k * dt - debut; const dur = (fin - k) * dt; const prog = (k - m0 * 4) / total; // 0 → 1 dans le passage
    if (habit === 'harpe') {
      // La harpe égrène l'accord en croches, à chaque temps ; la flûte tient la note du dessus à chaque changement.
      const v = voicing(c, 55, 79, haut); haut = v;
      [0, 1].forEach((h) => { const n = v[(k * 2 + h) % v.length]; N('harpe', n + (h ? 12 : 0) - (k % 2 ? 0 : 12), t + h * dt / 2, dt * 1.6, 0.55, h ? 0.3 : -0.2); });
      if (change) N('flute', v[v.length - 1] + 12, t, Math.min(dur, 4 * dt) * 0.95, 0.45, 0.2);
      continue;
    }
    if (!change && !debutMesure) continue; // les autres habits jouent aux changements d'accord (et à chaque mesure)
    const dd = Math.min(dur, 4 * dt);
    if (habit === 'cordes' || habit === 'tout') {
      const v = voicing(c, 55, 74, haut); haut = v; v.forEach((n, i) => N('cordes', n, t, dd * 1.02, 0.42 + 0.1 * Math.sin(Math.PI * prog), (i - 1) * 0.25));
      const basse = 36 + c.r + (c.r > 7 ? -12 : 0); N('cordes', basse + 12, t, dd * 1.02, 0.4, -0.3); bas = basse;
    }
    if (habit === 'choeur') { const v = voicing(c, 57, 72, haut); haut = v; v.forEach((n, i) => N('choeur', n, t + 0.04 * i, dd * 1.02, 0.32, (i - 1) * 0.4)); }
    if (habit === 'cuivres' || habit === 'tout') {
      const v = voicing(c, 48, 67, habit === 'tout' ? null : haut); if (habit === 'cuivres') haut = v; const vel = habit === 'tout' ? 0.42 : 0.25 + 0.5 * prog;
      v.forEach((n, i) => N(i === v.length - 1 && habit === 'cuivres' ? 'cuivres' : 'cor', n, t, dd * 0.98, vel, (i - 1) * 0.2));
      if (habit === 'cuivres') N('cor', 36 + c.r + 12, t, dd * 0.98, vel * 0.8, 0);
    }
    if (habit === 'tout') {
      const v = voicing(c, 60, 79, null); [0, 1, 2, 3].forEach((h) => N('harpe', v[h % v.length], t + h * dt / 2, dt * 1.4, 0.4, 0.3));
      if (debutMesure && (k - m0 * 4) % 16 === 0) N('timbales', 36 + c.r - (c.r > 6 ? 12 : 0), t, dt * 1.5, 0.55, 0);
    }
  }
  return { notes, duree: total * dt + 2, debut, liens: [] };
}

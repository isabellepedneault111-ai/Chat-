// Le dessin d'un accord sur un clavier : les touches exactes à jouer (celles qu'on entend en cliquant ▶), la
// fondamentale en braise, les autres en or, et le nom des notes dessous. Partout où l'on choisit un accord.
import { FR, chordIntervals, mod12 } from './music.js';

// La position jouée à l'écoute : la fondamentale entre Mi 3 et Ré♯ 4, l'accord serré au-dessus.
export const position = (r, q) => chordIntervals(q).map((iv) => 52 + ((mod12(r) + 8) % 12) + iv);
const BLANCHES = [0, 2, 4, 5, 7, 9, 11];
// L'orthographe juste : une tierce mineure de Sol s'écrit Si♭, pas La♯. Chaque intervalle avance d'un nombre de lettres.
const LETTRES = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si']; const PAS = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
const RACINES = { 1: [0, 1], 3: [2, -1], 6: [3, 1], 8: [5, -1], 10: [6, -1] }; // Do♯, Mi♭, Fa♯, La♭, Si♭
const ALT = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };
export function orthographe(midis) {
  const r = mod12(midis[0]); const [l0] = RACINES[r] || [BLANCHES.indexOf(r)];
  return midis.map((m) => { const iv = mod12(m - midis[0]); const l = (l0 + PAS[iv]) % 7; let a = mod12(m) - BLANCHES[l]; if (a > 6) a -= 12; if (a < -6) a += 12; return LETTRES[l] + (ALT[a] ?? ''); });
}
const NOIRES = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 }; // noire → blanche à sa gauche

// midis : les notes absolues. compact : une octave, sans les noms (pour une petite case).
export function clavierAccord(midis, { compact = false, titre = '' } = {}) {
  if (!midis?.length) return '';
  const racine = midis[0]; const bas = Math.floor(Math.min(...midis) / 12) * 12;
  const oct = compact ? 1 : Math.max(2, Math.ceil((Math.max(...midis) - bas + 1) / 12)); // deux octaves : la même échelle partout
  const on = new Set(compact ? midis.map(mod12) : midis); const nomDe = new Map(orthographe(midis).map((n, i) => [mod12(midis[i]), n]));
  const allume = (m) => (compact ? on.has(mod12(m)) : on.has(m));
  const W = 10; const H = compact ? 30 : 40; const nb = 7 * oct; const larg = nb * W;
  let blanches = ''; let noires = ''; let noms = '';
  for (let o = 0; o < oct; o++) {
    BLANCHES.forEach((pc, i) => {
      const m = bas + o * 12 + pc; const x = (o * 7 + i) * W; const a = allume(m); const r = a && mod12(m) === mod12(racine);
      blanches += `<rect x="${x}" y="0" width="${W}" height="${H}" rx="1.2" class="ka-b ${a ? (r ? 'ka-r' : 'ka-on') : ''}"/>`;
      if (a && !compact) noms += `<text x="${x + W / 2}" y="${H + 9}" class="ka-n ${r ? 'r' : ''}">${nomDe.get(pc) || FR[pc]}</text>`;
    });
    Object.entries(NOIRES).forEach(([pc, gauche]) => {
      const m = bas + o * 12 + +pc; const x = (o * 7 + gauche + 1) * W - 3.2; const a = allume(m); const r = a && mod12(m) === mod12(racine);
      noires += `<rect x="${x}" y="0" width="6.4" height="${H * 0.62}" rx="1" class="ka-k ${a ? (r ? 'ka-r' : 'ka-on') : ''}"/>`;
      if (a && !compact) noms += `<text x="${x + 3.2}" y="${H + 9}" class="ka-n ${r ? 'r' : ''}">${nomDe.get(+pc) || FR[pc]}</text>`;
    });
  }
  const notes = orthographe(midis).join(' – ');
  return `<svg class="ka ${compact ? 'ka-c' : ''}" viewBox="-1 -1 ${larg + 2} ${H + (compact ? 2 : 12)}" role="img" aria-label="${titre ? `${titre} : ` : ''}${notes}"><title>${notes}</title>${blanches}${noires}${noms}</svg>`;
}
export const clavierDe = (r, q, o) => clavierAccord(position(r, q), o);

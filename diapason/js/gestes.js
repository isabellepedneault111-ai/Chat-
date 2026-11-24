// Les gestes du cercle, dessinés : une image claire pour chaque son du corps et chaque voix, pour que des élèves
// qui ne lisent pas la musique (ni même bien les mots) voient quoi faire. Des pictogrammes, pas des emojis :
// même dessin partout (cartes, pistes, chef), dans la couleur du groupe.
const T = '#14120f'; // le trait
const PEAU = '#ffd7a6';
const BOIS = '#9a6a3a';

// Une main ouverte, vue de face (paume), doigts vers le haut ; tr = transformation SVG.
const main = (c, tr = '') => `<g transform="${tr}" fill="${c}" stroke="${T}" stroke-width="4" stroke-linejoin="round">
  <rect x="8" y="46" width="14" height="34" rx="7" transform="rotate(-40 15 63)"/>
  <rect x="26" y="10" width="12" height="44" rx="6"/><rect x="39" y="3" width="12" height="50" rx="6"/><rect x="52" y="5" width="12" height="48" rx="6"/><rect x="65" y="14" width="11" height="40" rx="5.5"/>
  <rect x="25" y="40" width="52" height="46" rx="15"/></g>`;
// Des traits d'impact autour d'un point.
const choc = (x, y, r = 10) => `<g stroke="${T}" stroke-width="3.5" stroke-linecap="round">${[-150, -110, -70, -30].map((a) => { const ra = (a * Math.PI) / 180; return `<line x1="${x + Math.cos(ra) * r}" y1="${y + Math.sin(ra) * r}" x2="${x + Math.cos(ra) * (r + 9)}" y2="${y + Math.sin(ra) * (r + 9)}"/>`; }).join('')}</g>`;
const fleche = (x, y1, y2) => `<g stroke="${T}" stroke-width="4" stroke-linecap="round" fill="none"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><polyline points="${x - 7},${y2 - 8} ${x},${y2} ${x + 7},${y2 - 8}"/></g>`;
const bureau = `<rect x="4" y="84" width="92" height="10" rx="3" fill="${BOIS}" stroke="${T}" stroke-width="3"/>`;
const visage = (c, bouche) => `<circle cx="50" cy="52" r="40" fill="${PEAU}" stroke="${c}" stroke-width="7"/><circle cx="36" cy="40" r="4.5" fill="${T}"/><circle cx="64" cy="40" r="4.5" fill="${T}"/>${bouche}`;

const DESSINS = {
  // BOUM : la main à plat (vue de côté) qui descend sur le bureau
  boum: (c) => `${main(c, 'translate(6 1) scale(.92)')}${fleche(88, 8, 40)}${bureau}${choc(20, 84, 6)}${choc(80, 84, 6)}`,
  // TAC : deux mains qui se tapent
  tac: (c) => `${main(c, 'translate(-2 22) scale(.62) rotate(22 50 50)')}${main(c, 'translate(102 22) scale(-.62 .62) rotate(22 50 50)')}${choc(50, 16, 8)}`,
  // TIC : le bout des doigts sur le bureau
  tic: (c) => `${main(c, 'translate(12 -2) scale(.8) rotate(180 50 50)')}${bureau}<g fill="${T}"><circle cx="30" cy="80" r="2.5"/><circle cx="72" cy="80" r="2.5"/></g>`,
  // TSK : claquer des doigts
  tsk: (c) => `${main(c, 'translate(0 14) scale(.86)')}<g stroke="${T}" stroke-width="4" stroke-linecap="round"><line x1="80" y1="18" x2="94" y2="6"/><line x1="84" y1="32" x2="100" y2="30"/><line x1="72" y1="10" x2="74" y2="-2"/></g><circle cx="72" cy="26" r="6" fill="#fff7dc" stroke="${T}" stroke-width="3"/>`,
  // CHHH : frotter les mains l'une contre l'autre
  chhh: (c) => `${main(c, 'translate(2 -6) scale(.62) rotate(90 50 50)')}${main(c, 'translate(38 22) scale(.62) rotate(-90 50 50)')}<g stroke="${T}" stroke-width="4" stroke-linecap="round" fill="none"><polyline points="12,84 4,90 12,96"/><line x1="4" y1="90" x2="38" y2="90"/><polyline points="88,84 96,90 88,96"/><line x1="62" y1="90" x2="96" y2="90"/></g>`,
  // BOUM des pieds : le pied qui frappe le sol
  pieds: (c) => `${fleche(30, 4, 26)}<path d="M18 74 Q16 50 34 50 L46 52 Q52 36 66 38 L72 40 L74 74 Z" fill="${c}" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><rect x="12" y="72" width="76" height="10" rx="5" fill="#4a4438" stroke="${T}" stroke-width="3"/><rect x="2" y="88" width="96" height="6" rx="2" fill="${BOIS}"/>${choc(10, 86, 5)}`,
  // Les voix : la forme de la bouche
  aaa: (c) => visage(c, `<ellipse cx="50" cy="68" rx="12" ry="16" fill="${T}"/><ellipse cx="50" cy="76" rx="7" ry="5" fill="#e5452c"/>`),
  ooo: (c) => visage(c, `<circle cx="50" cy="68" r="9" fill="${T}" stroke="#c0392b" stroke-width="3"/>`),
  mmm: (c) => `${visage(c, `<path d="M38 68 Q50 72 62 68" stroke="${T}" stroke-width="5" fill="none" stroke-linecap="round"/>`)}<g stroke="${T}" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M84 54 q5 -5 10 0 q5 5 10 0"/><path d="M84 66 q5 -5 10 0 q5 5 10 0"/></g>`,
};
// Ce que fait chaque dessin, dit en mots (pour les lecteurs d'écran).
const DIT = { boum: 'la main à plat tape le bureau', tac: 'taper des mains', tic: 'le bout des doigts sur le bureau', tsk: 'claquer des doigts', chhh: 'frotter les mains', pieds: 'le pied frappe le sol', aaa: 'la bouche grande ouverte : AAA', ooo: 'la bouche ronde : OOO', mmm: 'la bouche fermée : MMM' };

// Le dessin, à mettre dans la page.
export function geste(k, couleur, cls = 'geste') {
  const d = DESSINS[k]; if (!d) return '';
  return `<svg class="${cls}" viewBox="-4 -4 108 108" role="img" aria-label="${DIT[k]}">${d(couleur)}</svg>`;
}
// Le même dessin, en image, pour un canevas (gardé en mémoire).
const cache = new Map();
export function gesteImage(k, couleur) {
  const cle = `${k}|${couleur}`; if (cache.has(cle)) return cache.get(cle);
  const im = new Image(); const d = DESSINS[k];
  if (d) im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 108 108" width="216" height="216">${d(couleur)}</svg>`)}`;
  cache.set(cle, im); return im;
}

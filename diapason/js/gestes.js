// Les gestes du cercle : une image claire pour chaque son du corps et chaque voix, pour que des élèves qui ne lisent
// pas la musique voient quoi faire. Deux sources :
//  1) les PHOTOS de la classe : les élèves se photographient en train de faire le geste (la meilleure image qui soit :
//     leurs propres mains), gardées sur l'appareil ;
//  2) sinon, des silhouettes dessinées, d'un seul trait, dans la couleur du groupe.
import { store } from './ui.js';

const T = '#14120f';
const BOIS = '#9a6a3a';
const PEAU = '#ffd7a6';

// Une main droite, paume vers nous, doigts en haut : une seule silhouette (pas des morceaux collés).
const MAIN = 'M40 96 L39 74 C31 68 21 58 15 48 C11 41 17 34 23 39 C28 44 32 50 35 54 L35 22 C35 13 45 13 45 22 L45 47 L46 15 C46 6 56 6 56 15 L56 47 L57 19 C57 11 67 11 67 19 L67 49 L68 30 C68 23 77 23 77 30 L77 60 C77 73 73 81 71 85 L71 96 Z';
const main = (c, tr = '') => `<path transform="${tr}" d="${MAIN}" fill="${c}" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>`;
// Un poing avec l'index tendu (pour TIC : le bout du doigt).
const INDEX = 'M36 96 L36 70 C30 66 28 56 32 50 L42 46 L42 10 C42 3 52 3 52 10 L52 44 C60 42 70 44 72 52 C76 62 72 74 66 78 L66 96 Z';
const traits = (pts) => `<g stroke="${T}" stroke-width="4" stroke-linecap="round">${pts.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`).join('')}</g>`;
const bureau = `<rect x="2" y="86" width="96" height="10" rx="3" fill="${BOIS}" stroke="${T}" stroke-width="3"/>`;
const visage = (c, bouche) => `<circle cx="50" cy="50" r="42" fill="${PEAU}" stroke="${c}" stroke-width="8"/><circle cx="35" cy="38" r="5" fill="${T}"/><circle cx="65" cy="38" r="5" fill="${T}"/>${bouche}`;

const DESSINS = {
  // BOUM : la main qui tape à plat sur le bureau (on la voit d'en haut, posée, avec l'impact)
  boum: (c) => `${main(c, 'translate(10 -6) scale(.86)')}${bureau}${traits([[6, 76, 14, 82], [94, 76, 86, 82], [4, 66, 12, 72], [96, 66, 88, 72]])}`,
  // TAC : deux mains qui se tapent
  tac: (c) => `${main(c, 'translate(-8 14) scale(.7) rotate(16 56 96)')}${main(c, 'translate(108 14) scale(-.7 .7) rotate(16 56 96)')}${traits([[50, 2, 50, 10], [38, 6, 42, 12], [62, 6, 58, 12]])}`,
  // TIC : le bout du doigt sur le bureau
  tic: (c) => `${main(c, 'translate(0 -10) rotate(180 50 50)')}${bureau}${traits([[22, 80, 16, 74], [80, 80, 86, 74]])}`,
  // TSK : claquer des doigts
  tsk: (c) => `${main(c, 'translate(-2 8) scale(.9)')}${traits([[78, 18, 92, 6], [82, 32, 98, 30], [70, 10, 72, -2]])}`,
  // CHHH : les mains qui frottent
  chhh: (c) => `${main(c, 'translate(0 10) scale(.74) rotate(-90 56 56)')}${main(c, 'translate(100 34) scale(-.74 .74) rotate(-90 56 56)')}<g stroke="${T}" stroke-width="4" stroke-linecap="round" fill="none"><polyline points="12,84 4,90 12,96"/><line x1="4" y1="90" x2="40" y2="90"/><polyline points="88,84 96,90 88,96"/><line x1="60" y1="90" x2="96" y2="90"/></g>`,
  // Le pied qui frappe le sol
  pieds: (c) => `<path d="M16 80 C14 62 22 54 34 54 L48 56 C54 42 64 38 74 40 C80 42 82 50 80 80 Z" fill="${c}" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/><rect x="10" y="78" width="78" height="10" rx="5" fill="#4a4438" stroke="${T}" stroke-width="3"/>${bureau.replace('y="86"', 'y="90"').replace('height="10"', 'height="6"')}${traits([[6, 72, 12, 78], [92, 70, 86, 76], [28, 30, 28, 46], [40, 26, 40, 42]])}`,
  // Les voix : la forme de la bouche
  aaa: (c) => visage(c, `<ellipse cx="50" cy="66" rx="13" ry="17" fill="${T}"/><ellipse cx="50" cy="75" rx="8" ry="5" fill="#e5452c"/>`),
  ooo: (c) => visage(c, `<circle cx="50" cy="66" r="10" fill="${T}" stroke="#c0392b" stroke-width="3"/>`),
  mmm: (c) => visage(c, `<path d="M36 66 Q50 71 64 66" stroke="${T}" stroke-width="6" fill="none" stroke-linecap="round"/>`),
  // La pluie (CHHH en vague) et le tonnerre
  pluie: (c) => `<path d="M20 44 C12 44 10 30 22 28 C24 16 40 14 46 22 C52 12 72 14 72 28 C84 28 86 44 76 44 Z" fill="#e6dfc8" stroke="${T}" stroke-width="3.5"/>${[[26, 54], [42, 60], [58, 54], [74, 60], [34, 76], [50, 80], [66, 76]].map(([x, y]) => `<path d="M${x} ${y - 4} q-7 12 0 15 q7 -3 0 -15" fill="${c}" stroke="${T}" stroke-width="2.5"/>`).join('')}`,
  tonnerre: (c) => `<path d="M20 40 C12 40 10 26 22 24 C24 12 40 10 46 18 C52 8 72 10 72 24 C84 24 86 40 76 40 Z" fill="#6b6455" stroke="${T}" stroke-width="3.5"/><path d="M52 40 L38 66 L50 66 L40 96 L66 58 L54 58 L64 40 Z" fill="${c}" stroke="${T}" stroke-width="3.5" stroke-linejoin="round"/>`,
};
const DIT = { boum: 'la main à plat tape le bureau', tac: 'taper des mains', tic: 'le bout du doigt sur le bureau', tsk: 'claquer des doigts', chhh: 'frotter les mains', pieds: 'le pied frappe le sol', aaa: 'la bouche grande ouverte : AAA', ooo: 'la bouche ronde : OOO', mmm: 'la bouche fermée : MMM', pluie: 'la pluie', tonnerre: 'le tonnerre' };
export const GESTES_PHOTO = ['boum', 'tic', 'tac', 'tsk', 'chhh', 'pieds', 'aaa', 'ooo', 'mmm'];

// La photo de la classe pour ce geste, s'il y en a une.
export const photoDe = (k) => store.get(`cerclePhoto-${k}`, null);
export function retirerPhoto(k) { store.set(`cerclePhoto-${k}`, null); cache.clear(); }
// Une photo choisie (ou prise avec la caméra) : réduite à 320 px, carrée, gardée sur l'appareil.
export function garderPhoto(k, fichier) {
  return new Promise((ok, ko) => {
    const im = new Image(); const url = URL.createObjectURL(fichier);
    im.onload = () => {
      const n = 320; const cv = document.createElement('canvas'); cv.width = n; cv.height = n; const x = cv.getContext('2d');
      const cote = Math.min(im.width, im.height); x.drawImage(im, (im.width - cote) / 2, (im.height - cote) / 2, cote, cote, 0, 0, n, n);
      URL.revokeObjectURL(url);
      try { store.set(`cerclePhoto-${k}`, cv.toDataURL('image/jpeg', 0.8)); cache.clear(); ok(); } catch (e) { ko(e); }
    };
    im.onerror = ko; im.src = url;
  });
}

// L'image, à mettre dans la page : la photo de la classe, sinon le dessin.
export function geste(k, couleur, cls = 'geste') {
  const ph = photoDe(k); if (ph) return `<img class="${cls} photo" src="${ph}" alt="${DIT[k] || k}">`;
  const d = DESSINS[k]; if (!d) return '';
  return `<svg class="${cls}" viewBox="-2 -2 104 104" role="img" aria-label="${DIT[k]}">${d(couleur)}</svg>`;
}
// La même image, pour un canevas.
const cache = new Map();
export function gesteImage(k, couleur) {
  const cle = `${k}|${couleur}`; if (cache.has(cle)) return cache.get(cle);
  const im = new Image(); const ph = photoDe(k); const d = DESSINS[k];
  if (ph) im.src = ph;
  else if (d) im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 104 104" width="208" height="208">${d(couleur)}</svg>`)}`;
  cache.set(cle, im); return im;
}

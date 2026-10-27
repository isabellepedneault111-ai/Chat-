// La pièce : le studio de Frog tel qu'il est vraiment. Le plancher, les murs, les meubles, et chaque appareil à sa place,
// à sa couleur, à sa taille. Gardée dans l'appareil ; partagée dans l'espace du duo si on le souhaite, pour que l'autre
// voie le studio où naît la musique.
import { store } from './ui.js';
import { appareils } from './materiel.js';
import { espace, profileOf, saveProfile } from './espace.js';

// Une silhouette par sorte d'appareil, dessinée au trait (viewBox 120 × 60).
export const DESSIN = {
  clavier: `<rect x="2" y="14" width="116" height="34" rx="3" class="m-corps"/><rect x="6" y="18" width="30" height="6" rx="1" class="m-ecran"/>${[...Array(14)].map((_, i) => `<rect x="${6 + i * 7.7}" y="28" width="7" height="17" class="m-blanche"/>`).join('')}${[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map((i) => `<rect x="${11 + i * 7.7}" y="28" width="4.4" height="10" class="m-noire"/>`).join('')}`,
  table: `<rect x="14" y="4" width="92" height="52" rx="4" class="m-corps"/>${[0, 1, 2, 3].map((c) => `${[0, 1, 2].map((r) => `<circle cx="${30 + c * 20}" cy="${12 + r * 8}" r="3" class="m-bouton"/>`).join('')}<rect x="${29 + c * 20}" y="38" width="2" height="14" class="m-rail"/><rect x="${26 + c * 20}" y="${42 - c * 2}" width="8" height="4" rx="1" class="m-fader"/>`).join('')}<rect x="20" y="40" width="3" height="12" class="m-led"/>`,
  interface: `<rect x="10" y="14" width="100" height="32" rx="5" class="m-corps"/><circle cx="30" cy="30" r="8" class="m-bouton"/><circle cx="52" cy="30" r="8" class="m-bouton"/><circle cx="76" cy="30" r="5" class="m-jack"/><circle cx="94" cy="30" r="5" class="m-jack"/><rect x="24" y="18" width="12" height="2" class="m-led"/>`,
  synthe: `<rect x="10" y="8" width="100" height="44" rx="4" class="m-corps"/>${[...Array(8)].map((_, i) => `<rect x="${18 + (i % 4) * 14}" y="${16 + Math.floor(i / 4) * 14}" width="11" height="11" rx="2" class="m-pad"/>`).join('')}<circle cx="88" cy="22" r="6" class="m-bouton"/><circle cx="88" cy="40" r="6" class="m-bouton"/>`,
  platine: `<rect x="14" y="4" width="92" height="52" rx="4" class="m-corps"/><circle cx="52" cy="30" r="22" class="m-disque"/><circle cx="52" cy="30" r="7" class="m-etiquette"/><circle cx="52" cy="30" r="1.2" class="m-noire"/><path d="M96 10v24l-14 10" class="m-bras"/><circle cx="96" cy="10" r="4" class="m-bouton"/><rect x="88" y="46" width="12" height="4" rx="1" class="m-fader"/>`,
  guitare: `<path d="M16 30c0-12 18-14 26-8 6-6 18-6 22 2 4 8-2 16-10 16-6 6-20 8-28 2C18 38 16 34 16 30z" class="m-corps"/><circle cx="40" cy="30" r="5" class="m-noire"/><rect x="58" y="27.5" width="50" height="5" class="m-manche"/><rect x="106" y="25" width="10" height="10" rx="2" class="m-corps"/><path d="M24 30h84" class="m-cordes"/>`,
  micro: `<rect x="50" y="4" width="20" height="30" rx="10" class="m-corps"/><path d="M54 14h12M54 20h12M54 26h12" class="m-grille"/><path d="M44 26a16 16 0 0 0 32 0M60 42v12M48 56h24" class="m-pied"/>`,
  enceinte: `<rect x="38" y="2" width="44" height="56" rx="4" class="m-corps"/><circle cx="60" cy="16" r="6" class="m-bouton"/><circle cx="60" cy="38" r="13" class="m-bouton"/><circle cx="60" cy="38" r="4" class="m-noire"/>`,
  ordi: `<rect x="22" y="6" width="76" height="40" rx="3" class="m-corps"/><rect x="27" y="11" width="66" height="30" class="m-ecran"/><path d="M12 50h96l-6 6H18z" class="m-corps"/><text x="60" y="30" text-anchor="middle" class="m-txt">FLIP</text>`,
  ecoute: `<path d="M30 40V30a30 30 0 0 1 60 0v10" class="m-pied"/><rect x="22" y="36" width="14" height="20" rx="5" class="m-corps"/><rect x="84" y="36" width="14" height="20" rx="5" class="m-corps"/>`,
  autre: `<rect x="20" y="12" width="80" height="36" rx="5" class="m-corps"/><circle cx="40" cy="30" r="6" class="m-bouton"/><rect x="56" y="26" width="34" height="8" rx="2" class="m-ecran"/>`,
};
// Le dessin d’un appareil vu d’en haut (clavier, table, enceinte…), à sa couleur.
export const dessin = (s, couleur) => `<svg viewBox="0 0 120 60" class="m-svg" aria-hidden="true"${couleur ? ` style="${COULEURS[couleur]?.[1] || ''}"` : ''}>${DESSIN[s] || DESSIN.autre}</svg>`;

// Les couleurs du matériel : le corps et son contour (des variables CSS lues par .m-corps).
export const COULEURS = {
  noir: ['Noir', '--corps:#2a2620;--trait:#8a7f6c'], blanc: ['Blanc', '--corps:#e9e4d8;--trait:#8a7f6c'],
  argent: ['Argent', '--corps:#a9aaa6;--trait:#5d5e5a'], bois: ['Bois', '--corps:#8a5a32;--trait:#d9a56e'],
  rouge: ['Rouge', '--corps:#a3271b;--trait:#f0875a'], bleu: ['Bleu', '--corps:#24456e;--trait:#7fb1f0'],
  vert: ['Vert', '--corps:#2f5a3a;--trait:#93b08e'], creme: ['Crème', '--corps:#d8c7a0;--trait:#8a6d3c'],
};

// Les couleurs des meubles : quelques teintes de bois et de tissu ; on peut aussi en choisir une libre.
export const TEINTES = { '': ['Comme il vient', ''], chene: ['Chêne clair', '#c9a26b'], noyer: ['Noyer', '#6b4423'], noir: ['Noir', '#2a2620'], blanc: ['Blanc', '#e9e4d8'], gris: ['Gris', '#8d8a84'], vin: ['Rouge vin', '#6d1f2a'], nuit: ['Bleu nuit', '#24345a'], foret: ['Vert forêt', '#2f5a3a'], moutarde: ['Moutarde', '#c89b2b'], terre: ['Terracotta', '#b5603c'], rose: ['Vieux rose', '#c98f95'] };
const valTeinte = (t) => (t ? TEINTES[t]?.[1] || (/^#[0-9a-f]{6}$/i.test(t) ? t : '') : '');
// Un meuble, avec sa couleur s'il en a une : le corps prend la teinte, les coussins et les motifs une teinte plus claire.
export const teinteG = (m) => { const v = valTeinte(m.teinte); const d = MEUBLES[m.sorte]?.[3] || ''; return v ? `<g class="teinte" style="--t:${v}">${d}</g>` : d; };

// Les meubles et le décor, vus d'en haut (viewBox 100 × 100, étirés à la taille choisie).
export const MEUBLES = {
  bureau: ['Bureau', 34, 16, '<rect x="1" y="1" width="98" height="98" rx="4" class="p-bois"/><rect x="1" y="1" width="98" height="12" class="p-bois-c"/>'],
  table: ['Table', 22, 18, '<rect x="2" y="2" width="96" height="96" rx="8" class="p-bois"/>'],
  etagere: ['Étagère', 26, 6, '<rect x="1" y="1" width="98" height="98" class="p-bois-c"/>' + [20, 40, 60, 80].map((x) => `<rect x="${x}" y="1" width="2" height="98" class="p-ombre"/>`).join('')],
  vinyles: ['Bac à vinyles', 12, 10, '<rect x="1" y="1" width="98" height="98" rx="3" class="p-bois"/>' + [...Array(9)].map((_, i) => `<rect x="${8 + i * 10}" y="8" width="5" height="84" class="p-vinyle"/>`).join('')],
  canape: ['Canapé', 28, 12, '<rect x="1" y="1" width="98" height="98" rx="14" class="p-tissu"/><rect x="8" y="30" width="41" height="62" rx="8" class="p-coussin"/><rect x="51" y="30" width="41" height="62" rx="8" class="p-coussin"/>'],
  fauteuil: ['Fauteuil', 9, 9, '<rect x="2" y="2" width="96" height="96" rx="20" class="p-tissu"/><rect x="18" y="26" width="64" height="64" rx="14" class="p-coussin"/>'],
  chaise: ['Chaise', 6, 6, '<circle cx="50" cy="50" r="46" class="p-tissu"/><circle cx="50" cy="50" r="10" class="p-ombre"/>'],
  tapis: ['Tapis', 30, 24, '<rect x="1" y="1" width="98" height="98" rx="6" class="p-tapis"/><rect x="8" y="8" width="84" height="84" rx="4" class="p-tapis-motif"/>'],
  fenetre: ['Fenêtre', 20, 3, '<rect x="0" y="0" width="100" height="100" class="p-vitre"/><rect x="49" y="0" width="2" height="100" class="p-ombre"/>'],
  porte: ['Porte', 9, 9, '<path d="M2 98V2a96 96 0 0 1 96 96z" class="p-porte"/><path d="M2 98V2" class="p-trait"/>'],
  lampe: ['Lampe', 6, 6, '<circle cx="50" cy="50" r="48" class="p-halo"/><circle cx="50" cy="50" r="18" class="p-lampe"/>'],
  plante: ['Plante', 7, 7, '<circle cx="50" cy="50" r="30" class="p-pot"/>' + [0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="${50 + 26 * Math.cos((a * Math.PI) / 180)}" cy="${50 + 26 * Math.sin((a * Math.PI) / 180)}" rx="22" ry="11" transform="rotate(${a} ${50 + 26 * Math.cos((a * Math.PI) / 180)} ${50 + 26 * Math.sin((a * Math.PI) / 180)})" class="p-feuille"/>`).join('')],
  affiche: ['Affiche au mur', 12, 3, '<rect x="0" y="0" width="100" height="100" class="p-affiche"/>'],
  traitement: ['Panneaux acoustiques', 20, 4, [...Array(5)].map((_, i) => `<rect x="${1 + i * 20}" y="0" width="18" height="100" rx="2" class="p-mousse"/>`).join('')],
};
// Les planchers qu’on peut choisir pour sa pièce.
export const SOLS = { vin: 'Tapis rouge vin', bois: 'Plancher de bois', sombre: 'Bois foncé', beton: 'Béton', tapis: 'Tapis mur à mur', carrelage: 'Carrelage' };
// Les couleurs de murs qu’on peut choisir.
export const MURS = { braise: '#3a2a22', nuit: '#1d2230', foret: '#1f2a22', craie: '#d9d2c3', brique: '#6b3324', noir: '#141210' };

const DEFAUT = { sol: 'bois', mur: 'braise', meubles: [], partage: true, photo: null, photoOpacite: 0.35 };
// Le studio de Frog a un tapis rouge vin au sol : c'est le point de départ, qu'il ajuste.
export const piece = () => ({ ...DEFAUT, sol: espace.me === 'Frog' ? 'vin' : DEFAUT.sol, ...store.get('piece', {}) });
// Change un réglage de la pièce (plancher, murs, meubles, photo) et le garde dans l’appareil.
export function reglerPiece(change) { store.set('piece', { ...piece(), ...change }); }
// Ajoute un meuble dans la pièce, à une place libre, à sa taille habituelle.
export function ajouterMeuble(sorte) {
  const p = piece(); const [, w, h] = MEUBLES[sorte]; const n = p.meubles.length;
  const m = { id: `${sorte}-${Date.now().toString(36)}`, sorte, x: 30 + (n * 9) % 40, y: 35 + (n * 13) % 30, w, h, r: 0 };
  reglerPiece({ meubles: [...p.meubles, m] }); return m;
}
// Change un réglage d’un meuble (place, taille, rotation, couleur).
export function reglerMeuble(id, change) { const p = piece(); reglerPiece({ meubles: p.meubles.map((m) => (m.id === id ? { ...m, ...change } : m)) }); }
// Retire un meuble de la pièce.
export function retirerMeuble(id) { const p = piece(); reglerPiece({ meubles: p.meubles.filter((m) => m.id !== id) }); }

// Le studio en une image (pour l'accueil, ou chez l'autre) : la pièce, les meubles, les appareils, les câbles.
// instantane = { sol, mur, meubles, appareils: [{ nom, sorte, x, y, couleur, taille, rot, lie, actif, hub }] }
export function pieceSVG(st, { titre = '' } = {}) {
  const W = 160; const H = 100; const X = (x) => (x / 100) * W; const Y = (y) => (y / 100) * H;
  const hub = st.appareils.find((a) => a.hub);
  const centre = (a) => [X(a.x ?? 50), Y(a.y ?? 50)];
  const cables = st.appareils.filter((a) => !a.hub && a.x != null).map((a) => {
    const [x1, y1] = centre(a); const cible = (a.lie && st.appareils.find((b) => b.nom === a.lie)) || hub; if (!cible) return '';
    const [x2, y2] = centre(cible); const my = (y1 + y2) / 2 + 6;
    return `<path d="M${x1} ${y1}C${x1} ${my} ${x2} ${my} ${x2} ${y2}" class="ps-cable ${a.actif ? 'on' : ''}"/>`;
  }).join('');
  const meubles = (st.meubles || []).map((m) => { const w = X(m.w); const h = Y(m.h); return `<svg x="${X(m.x) - w / 2}" y="${Y(m.y) - h / 2}" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible"><g transform="rotate(${m.r || 0} 50 50)">${teinteG(m)}</g></svg>`; }).join('');
  const apps = st.appareils.filter((a) => a.x != null).map((a) => { const w = 20 * (a.taille || 1); const h = w / 2; const [cx, cy] = centre(a);
    return `<g transform="rotate(${a.rot || 0} ${cx} ${cy})"><svg x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" viewBox="0 0 120 60" class="m-svg ${a.actif ? 'actif' : ''}" style="${COULEURS[a.couleur]?.[1] || ''}">${DESSIN[a.sorte] || DESSIN.autre}</svg></g>`; }).join('');
  return `<svg class="piece-svg sol-${st.sol || 'bois'}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${titre || 'Le studio, vu d’en haut'}" style="--mur:${MURS[st.mur] || MURS.braise}">
    <defs><pattern id="ps-lattes" width="160" height="7" patternUnits="userSpaceOnUse"><path d="M0 6.5H160M40 0v7M110 0v7" class="ps-latte"/></pattern></defs>
    <rect x="0" y="0" width="${W}" height="${H}" rx="3" class="ps-mur"/><rect x="3" y="3" width="${W - 6}" height="${H - 6}" class="ps-sol"/>${st.sol === 'bois' || st.sol === 'sombre' ? `<rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="url(#ps-lattes)"/>` : ''}
    ${meubles}${cables}${apps}</svg>`;
}

// Le studio tel qu'il est maintenant, en données simples (pour l'accueil et pour le partager à l'autre).
export function studioActuel() {
  const p = piece(); const l = appareils();
  const autres = l.filter((a) => a.k !== 'app');
  return { sol: p.sol, mur: p.mur, meubles: p.meubles, at: Date.now(), appareils: l.map((a) => { const [x, y] = pos(a, autres.indexOf(a), autres.length);
    return { nom: a.nom, sorte: a.sorte, x: +x.toFixed(1), y: +y.toFixed(1), couleur: a.couleur, taille: a.taille, rot: a.rot, lie: a.lie ? l.find((b) => b.k === a.lie)?.nom || '' : '', actif: a.actif && a.branche, hub: a.k === 'app' }; }) };
}
// La place d’un appareil dans la pièce : la sienne s’il a été placé, sinon en cercle autour de l’ordinateur.
export const pos = (a, i, n) => (a.x != null ? [a.x, a.y] : a.k === 'app' ? [50, 50] : [50 + 36 * Math.cos((i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2 + 0.5), 50 + 31 * Math.sin((i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2 + 0.5)]);

// Les fiches : la photo, la marque et le modèle de chaque appareil. Gardées dans le profil (pas dans l'appareil) :
// Frog prend les photos avec son cellulaire, elles apparaissent aussi sur l'ordinateur, et l'autre les voit.
export const cleFiche = (nom) => String(nom || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Les fiches de tous les appareils d’un membre (photo, marque, modèle).
export const fichesDe = (nom) => profileOf(nom)?.studioFiches || {};
// La fiche d’un appareil précis d’un membre.
export const ficheDe = (membre, nomAppareil) => fichesDe(membre)[cleFiche(nomAppareil)] || {};
// Change la fiche d’un appareil (photo, marque, modèle), dans mon profil partagé.
export async function reglerFiche(nomAppareil, change) {
  const k = cleFiche(nomAppareil); if (!k) return;
  await saveProfile((d) => ({ studioFiches: { ...(d.studioFiches || {}), [k]: { ...(d.studioFiches?.[k] || {}), ...change } } }));
}
// Où en est la photo du studio : combien d'appareils ont leur fiche complète (photo + marque ou modèle), et la photo de la pièce.
export function photosDuStudio(membre = espace.me) {
  const p = profileOf(membre); const st = membre === espace.me ? studioActuel() : p?.studio; if (!st) return null;
  const ap = st.appareils.filter((a) => !a.hub);
  const faits = ap.filter((a) => { const f = (p?.studioFiches || {})[cleFiche(a.nom)] || {}; return f.photo && (f.marque || f.modele); });
  return { total: ap.length, faits: faits.length, piece: !!p?.studioPhoto, reste: ap.filter((a) => !faits.includes(a)).map((a) => a.nom) };
}
// Sur un nouvel appareil (le cellulaire de Frog), on retrouve le studio tel qu'il l'a placé ailleurs.
export function restaurerDepuisProfil() {
  const st = profileOf(espace.me)?.studio; const reg = store.get('materiel', null);
  if (!st || (reg && Object.values(reg).some((x) => x.perso || x.x != null)) || store.get('piece', null)) return false;
  const r = reg || { app: { nom: 'Le son de l’app', sorte: 'ordi', actif: true } };
  st.appareils.forEach((a) => { if (a.hub) { r.app = { ...r.app, x: a.x, y: a.y }; return; } r[`perso-${cleFiche(a.nom)}`] = { nom: a.nom, sorte: a.sorte, actif: a.actif, perso: true, x: a.x, y: a.y, couleur: a.couleur, taille: a.taille, rot: a.rot }; });
  store.set('materiel', r); store.set('piece', { sol: st.sol, mur: st.mur, meubles: st.meubles || [] });
  return true;
}
// La couleur d'un appareil, lue sur sa photo : on compte, au centre de l'image (là où est l'appareil), les pixels les plus
// proches de chaque couleur du nuancier, et on garde celle qui domine.
const RGB = { noir: [35, 33, 30], blanc: [230, 228, 222], argent: [165, 166, 162], bois: [140, 92, 52], rouge: [170, 40, 30], bleu: [36, 70, 120], vert: [45, 90, 58], creme: [216, 199, 160] };
// Devine la couleur d’un appareil sur sa photo : compte les pixels du centre de l’image et garde la couleur du nuancier qui domine.
export async function couleurDePhoto(file) {
  const bmp = await createImageBitmap(file); const c = document.createElement('canvas'); c.width = 60; c.height = 60;
  const g = c.getContext('2d'); g.drawImage(bmp, bmp.width * 0.2, bmp.height * 0.2, bmp.width * 0.6, bmp.height * 0.6, 0, 0, 60, 60);
  const d = g.getImageData(0, 0, 60, 60).data; const n = {};
  for (let i = 0; i < d.length; i += 4) { let best = null; let bd = Infinity; for (const [k, [r, v, b]] of Object.entries(RGB)) { const e = (d[i] - r) ** 2 + (d[i + 1] - v) ** 2 + (d[i + 2] - b) ** 2; if (e < bd) { bd = e; best = k; } } n[best] = (n[best] || 0) + 1; }
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0][0];
}

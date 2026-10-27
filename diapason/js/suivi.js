// Le suivi entre nous deux : ce que l'autre a ajouté, si je l'ai vu, et si j'ai fait ce qu'il demandait.
// Gardé dans le profil de chacun (vus, faits) : l'autre sait, sans qu'on ait à le lui dire.
import { espace, profileOf, saveProfile } from './espace.js';
import { MEMBERS } from './duo.js';

// Le nom de l’autre membre.
export const autre = () => (espace.meta?.members || MEMBERS).find((m) => m !== espace.me) || MEMBERS[1];
// Vrai si ce membre a déjà vu cette entrée.
export const vu = (nom, id) => !!profileOf(nom)?.vus?.[id];
// Vrai si ce membre a coché « J’ai fait ça » pour cette entrée.
export const fait = (nom, id) => !!profileOf(nom)?.faits?.[id];
// Marque des entrées comme vues (ou faites) dans mon profil ; l’autre le voit.
export async function marquer(ids, champ, oui = true) {
  if (!ids.length) return;
  await saveProfile((d) => { const m = { ...(d[champ] || {}) }; ids.forEach((id) => { if (oui) m[id] = Date.now(); else delete m[id]; }); return { [champ]: m }; });
}

// Ce qui compte comme une nouvelle : ce qu'une personne a créé, pas les traces techniques.
const CACHES = new Set(['profil', 'parcours', 'trace', 'evaluation']);
// Vrai si une entrée compte comme une nouvelle (ni un exemple, ni un profil, ni une séance pas finie).
export const nouvelle = (e) => e.author && !CACHES.has(e.type) && !e.demo && !e.data?.demo && !(e.type === 'session' && !e.data?.done);
// Les nouvelles ajoutées par l’autre, de la plus récente à la plus ancienne.
export const deLautre = () => espace.entries.filter((e) => nouvelle(e) && e.author === autre()).sort((a, b) => b.createdAt - a.createdAt);
// Ce que j’ai ajouté, du plus récent au plus ancien.
export const deMoi = () => espace.entries.filter((e) => nouvelle(e) && e.author === espace.me).sort((a, b) => b.createdAt - a.createdAt);
// Les nouvelles de l’autre que je n’ai pas encore vues (ce que compte la pastille d’Accueil).
export const aVoir = () => (espace.connected && espace.me ? deLautre().filter((e) => !vu(espace.me, e.id)) : []);

// Une nouvelle en mots : ce que c'est, et où l'ouvrir.
export function decrire(e) {
  const d = e.data || {};
  if (d.relais) return [e.audio ? 'Un son au relais' : 'Des mots au relais', `#/relais/${e.id}`];
  if (e.type === 'chanson') return ['Une chanson (Jouer)', `#/studio?tab=chanson&ch=${e.id}`];
  if (e.type === 'son') return ['Un son de batterie remplacé', '#/studio?tab=beat'];
  if (e.type === 'bravo') return ['Un bravo', `#/?voir=${e.id}`];
  if (e.type === 'session') return ['Une séance terminée', '#/bilan'];
  if (d.etincelle && d.pour === 'app') return ['Une idée pour le labo', `#/ecrire?voir=${e.id}`];
  if (d.journal || d.atelier) return ['Une page du journal', `#/ecrire?voir=${e.id}`];
  if (e.type === 'paroles') return ['Des paroles', '#/paroles'];
  const mur = `#/carnet?voir=${e.id}`; // le mur ouvre directement la fiche de l'idée
  if (d.filet) return ['Un bout pris dans le filet', mur];
  if (d.prise) return ['Une prise enregistrée', mur];
  if (d.cathedrale) return ['Une cathédrale', mur];
  if (e.type === 'audio') return ['Un son au mur', mur];
  if (e.type === 'image') return ['Une image au mur', mur];
  if (e.type === 'lien') return ['Une écoute partagée', mur];
  return ['Une idée au mur', mur];
}

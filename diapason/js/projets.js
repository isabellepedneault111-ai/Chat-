// Les projets : plusieurs murs dans le même espace (l'album, des reprises, un morceau…).
// Le projet choisi s'applique tout seul à ce qu'on crée (idées, sons, pages du journal).
import { espace, updateEspace, uid } from './espace.js';
import { store } from './ui.js';

export const projets = () => espace.meta?.projets || [];
export const projetCourant = () => { const id = store.get('projet', ''); return projets().some((p) => p.id === id) ? id : ''; };
export const setProjet = (id) => store.set('projet', id || '');
export const projetNom = (id) => projets().find((p) => p.id === id)?.nom || '';
export async function creerProjet(nom) {
  const p = { id: uid().slice(0, 10), nom: String(nom).slice(0, 60), at: Date.now() };
  await updateEspace({ projets: [...projets(), p] });
  setProjet(p.id);
  return p;
}

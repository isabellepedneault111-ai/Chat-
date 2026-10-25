// La corbeille commune : rien ne disparaît sur un coup de tête. Jeter, c'est mettre de côté ;
// effacer pour de bon demande l'accord de l'autre.
import { espace, saveEntry, deleteEntry } from './espace.js';
import { MEMBERS } from './duo.js';
import { toast } from './ui.js';

const other = () => (espace.meta?.members || MEMBERS).find((m) => m !== espace.me) || 'l’autre';
async function patch(e, data) {
  const r = await saveEntry({ ...e, data }, { baseUpdatedAt: e.updatedAt });
  if (r.conflict) await saveEntry({ ...r.current, data: { ...r.current.data, corbeille: data.corbeille } }, { baseUpdatedAt: r.current.updatedAt });
}
export async function jeter(e) {
  const { corbeille, ...rest } = e.data || {};
  await patch(e, { ...rest, corbeille: { by: espace.me, at: Date.now() } });
  toast(`À la corbeille. Elle ne s’efface pour de bon que si ${other()} est d’accord.`);
}
export async function restaurer(e) {
  const { corbeille, ...rest } = e.data || {};
  await patch(e, rest);
  toast('Restauré.');
}
// Effacer pour de bon : seulement par celui qui n'a pas jeté (l'accord du deuxième).
export async function effacer(e) {
  if (e.data?.corbeille?.by === espace.me) { toast(`Il faut l’accord de ${other()} pour effacer pour de bon.`); return; }
  await deleteEntry(e.id);
  toast('Effacé pour de bon, d’un commun accord.');
}
export const enAttenteDeMoi = () => espace.trash.filter((e) => e.data?.corbeille?.by && e.data.corbeille.by !== espace.me);

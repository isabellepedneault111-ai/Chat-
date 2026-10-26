// À faire pour moi : les petites tâches personnelles, au même endroit que les nouvelles (la pastille de Plan les compte).
// Chacune dit pourquoi elle est là et mène droit au bon endroit ; elle disparaît d'elle-même quand c'est fait.
import { espace, profileOf } from './espace.js';
import { MEMBERS } from './duo.js';
import { lune, luneCourante } from './lune.js';
import { attendMoi } from './elan.js';

const autreDe = (me) => (espace.meta?.members || MEMBERS).find((m) => m !== me);
const inspirationsDites = (m) => { const l = (profileOf(m)?.artistes || []).filter((a) => a?.nom); return l.length > 0 && l.every((a) => a.aime?.length || a.pourquoi); };

export function mesTaches() {
  if (!espace.connected || !espace.me) return [];
  const me = espace.me; const o = autreDe(me); const t = [];
  if ((profileOf(me)?.artistes || []).some((a) => a?.nom) && !inspirationsDites(me)) {
    t.push({ id: 'inspi', titre: 'Dire pourquoi tes inspirations t’inspirent', pourquoi: `Pour chaque artiste ou morceau : sa rythmique, sa voix, son texte… et le moment précis. ${inspirationsDites(o) ? `${o} l’a fait ✓` : `${o} a la même tâche.`}`, lien: '#/depart?etape=3' });
  }
  attendMoi().slice(0, 3).forEach((e) => t.push({ id: `rep-${e.id}`, titre: `Répondre à « ${e.title || 'sans titre'} »`, pourquoi: `${e.author} te l’a lancé au relais. Quand vous vous répondez, vos fils se rapprochent.`, lien: `#/relais/${e.id}` }));
  const l = lune(); const lm = luneCourante(espace.meta);
  if (!lm.intentions?.[me] && l.age < 18) t.push({ id: 'semer', titre: 'Semer ton intention du cycle', pourquoi: 'Une phrase pour cette lune. On la relira la dernière semaine du cycle.', lien: '#/' });
  if (l.age > 18) {
    if (lm.intentions?.[me] && !lm.relue?.[me]) t.push({ id: 'relire', titre: 'Relire ton intention du cycle', pourquoi: 'C’est la dernière semaine du cycle : tenue, transformée ou lâchée ?', lien: '#/passage' });
    if (!espace.meta?.luneProchaine?.intentions?.[me]) t.push({ id: 'passage', titre: 'Faire le passage de la nouvelle lune', pourquoi: `Fermer ce cycle à deux et semer le suivant${espace.meta?.luneProchaine?.intentions?.[o] ? ` : ${o} a déjà semé le sien` : ''}.`, lien: '#/passage' });
  }
  return t;
}

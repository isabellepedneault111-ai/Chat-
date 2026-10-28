// « On la creuse? » : après l'avoir réécoutée, chacun dit s'il veut la creuser, ou non. Réécouter ne veut pas dire
// vouloir creuser. « À creuser » ne compte dans notre plan que si les deux veulent la creuser.
import { espace } from './espace.js';
import { MEMBERS, memberColor } from './duo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const membres = () => espace.meta?.members || MEMBERS;
export const avisDe = (e, qui) => e?.data?.avis?.[qui]?.v || '';
export const parLesDeux = (e) => membres().every((m) => avisDe(e, m) === 'creuser');

const pastille = (e, m) => { const v = avisDe(e, m); const t = v === 'creuser' ? `✓ ${m} creuse` : v === 'non' ? `✗ ${m} : pas pour moi` : `· ${m} : pas encore dit`; return `<span class="ec-p ${v}" style="--c:${memberColor(m)}">${esc(t)}</span>`; };

// Les avis des deux, et mon geste (je peux changer d'avis).
export function avisHTML(e, { court = false } = {}) {
  const pastilles = membres().map((m) => pastille(e, m)).join('');
  if (court) return `<span class="ec-ps" aria-label="Qui veut la creuser">${pastilles}</span>`;
  const moi = avisDe(e, espace.me);
  return `<div class="ec-bloc"><span class="ec-k">On la creuse?</span>${pastilles}
    <span class="ec-b"><button class="btn small ${moi === 'creuser' ? 'primary' : ''}" data-avis="${esc(e.id)}:creuser" aria-pressed="${moi === 'creuser'}">Oui, je veux la creuser</button><button class="btn small ${moi === 'non' ? 'primary' : ''}" data-avis="${esc(e.id)}:non" aria-pressed="${moi === 'non'}">Pas pour moi</button></span>
    <small class="muted">${parLesDeux(e) ? 'Vous voulez tous les deux la creuser : elle compte dans notre plan.' : 'Réécoute-la d’abord. Elle compte dans notre plan quand vous voulez tous les deux la creuser.'}</small></div>`;
}

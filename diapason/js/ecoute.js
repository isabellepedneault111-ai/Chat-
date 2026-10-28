// Réécoutée, par qui : chacun coche « Je l'ai réécoutée » sur une idée (ou le fait en la faisant rencontrer une autre).
// « À creuser » ne compte dans notre plan qu'une fois réécoutée par les deux : l'étape dit ce qui s'est vraiment passé.
import { espace } from './espace.js';
import { MEMBERS, memberColor } from './duo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const membres = () => espace.meta?.members || MEMBERS;
export const ecoutes = (e) => e?.data?.ecoutes || {};
export const reecouteePar = (e, qui) => !!ecoutes(e)[qui];
export const parLesDeux = (e) => membres().every((m) => reecouteePar(e, m));

// Les deux pastilles (qui l'a réécoutée), et le geste pour moi si ce n'est pas fait.
export function ecoutesHTML(e, { court = false } = {}) {
  const pastilles = membres().map((m) => `<span class="ec-p ${reecouteePar(e, m) ? 'on' : ''}" style="--c:${memberColor(m)}" title="${esc(m)} : ${reecouteePar(e, m) ? 'réécoutée' : 'pas encore'}">${reecouteePar(e, m) ? '✓' : '·'} ${esc(m)}</span>`).join('');
  if (court) return `<span class="ec-ps" aria-label="Réécoutée par">${pastilles}</span>`;
  const moi = reecouteePar(e, espace.me);
  return `<div class="ec-bloc"><span class="ec-k">Réécoutée</span>${pastilles}${moi ? '' : `<button class="btn small" data-reecoute="${esc(e.id)}">Je l’ai réécoutée</button>`}
    <small class="muted">${parLesDeux(e) ? 'Par les deux : elle compte dans notre plan.' : '« À creuser » compte dans notre plan quand vous l’avez réécoutée tous les deux.'}</small></div>`;
}

// Nos nouvelles : tout ce que l'autre a ajouté, au même endroit, avec deux cases. « Vu » quand on l'a regardé,
// « J'ai fait ça » quand on a répondu à ce qu'il demandait. De l'autre côté, on voit ce qu'il a vu et fait de nos envois.
import { espace, onEspace } from '../espace.js';
import { toast } from '../ui.js';
import { memberColor } from '../duo.js';
import { esc, ago, espaceGate } from './carnet.js';
import { asksOf } from './relais.js';
import { autre, vu, fait, marquer, deLautre, deMoi, decrire } from '../suivi.js';
import { mesTaches } from '../taches.js';
import { relanceHTML, brancherRelance } from '../relance.js';

const jour = (t) => new Date(t).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });

export default {
  id: 'nouvelles',
  mount(el) {
    let onglet = 'pour-moi'; let tout = false;
    // Redessine nos nouvelles : ce que l’autre a fait, ce qu’il me demande.
    function rendre() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: rendre }); return; }
      const o = autre(); const me = espace.me;
      const recues = deLautre(); const nonVues = recues.filter((e) => !vu(me, e.id));
      const liste = onglet === 'pour-moi' ? (tout ? recues : nonVues) : deMoi();
      const parJour = []; liste.forEach((e) => { const j = jour(e.createdAt); const g = parJour.at(-1); if (g?.[0] === j) g[1].push(e); else parJour.push([j, [e]]); });
      el.innerHTML = `
        <div class="mod-head"><div>
          <p class="eyebrow">Nos nouvelles</p>
          <h1>${onglet === 'pour-moi' ? `Ce que ${esc(o)} a ajouté` : 'Ce que j’ai envoyé'}</h1>
          <p class="muted"><a href="#/elan">Voir notre élan, la tresse →</a></p><p class="muted">${onglet === 'pour-moi' ? `Coche <b>Vu</b> quand tu l’as regardé, <b>J’ai fait ça</b> quand tu as répondu à ce que ${esc(o)} demandait. ${esc(o)} le verra.` : `Ce que ${esc(o)} a vu et fait de tes envois.`}</p>
        </div></div>
        ${(() => { const t = mesTaches(); return t.length ? `<section class="nv-taches"><div class="nv-t-tete"><h2>Tes prochains pas</h2><a class="small" href="#/calendrier">Tous nos pas, à cocher →</a></div><ul>${t.map((x) => `<li><a href="${x.lien}"><b>${esc(x.titre)}</b><small>${esc(x.pourquoi)}</small><span>→</span></a></li>`).join('')}</ul></section>` : ''; })()}
        <div class="relance-host"></div>
        <p class="nv-maj"><button class="btn small" data-nv="revoir-maj" type="button">Revoir les dernières mises à jour de l’app</button></p>
        <div class="nv-barre">
          <div class="seg-tabs" role="tablist"><button role="tab" data-nv="pour-moi" aria-selected="${onglet === 'pour-moi'}">Pour moi${nonVues.length ? ` <b class="nv-n">${nonVues.length}</b>` : ''}</button><button role="tab" data-nv="de-moi" aria-selected="${onglet === 'de-moi'}">Ce que j’ai envoyé</button></div>
          ${onglet === 'pour-moi' ? `<label class="nv-tout"><input type="checkbox" data-nv="tout" ${tout ? 'checked' : ''}> voir aussi ce que j’ai déjà vu</label>${nonVues.length > 1 ? '<button class="btn small" data-nv="tout-vu">Tout marquer vu</button>' : ''}` : ''}
        </div>
        ${parJour.length ? parJour.map(([j, l]) => `<section class="nv-jour"><h2>${j}</h2><ul class="nv-liste">${l.map((e) => item(e, o)).join('')}</ul></section>`).join('')
          : `<p class="nv-vide">${onglet === 'pour-moi' ? (recues.length ? `Tout est vu. ${esc(o)} sera content·e.` : `${esc(o)} n’a encore rien ajouté.`) : 'Tu n’as encore rien envoyé.'}</p>`}`;
      relanceHTML().then((h) => { const x = el.querySelector('.relance-host'); if (x) x.innerHTML = h; });
      // (Les tâches se recalculent avec les nouvelles : elles s'effacent d'elles-mêmes quand c'est fait.)
    }
    // Une nouvelle : ce qui s’est passé, le lien pour y aller, et les cases à cocher.
    function item(e, o) {
      const [quoi, lien] = decrire(e); const asks = asksOf(e); const me = espace.me;
      const pourMoi = e.author !== me;
      const etat = pourMoi ? '' : `<span class="nv-etat">${vu(o, e.id) ? `<b>${esc(o)} l’a vu ✓</b>` : `${esc(o)} ne l’a pas encore vu`}${asks.length ? (fait(o, e.id) ? ' · <b>l’a fait ✓</b>' : ' · pas encore fait') : ''}</span>`;
      return `<li class="nv-item ${pourMoi && vu(me, e.id) ? 'vu' : ''}" style="--c:${memberColor(e.author)}" data-id="${esc(e.id)}">
        <div class="nv-txt"><small>${quoi} · ${ago(e.createdAt)}</small><a href="${lien}" data-nv-ouvre>${esc(e.title || 'Sans titre')}</a>
          ${asks.length || e.data?.intent ? `<p class="nv-asks">${asks.map((a) => `<span>${esc(a[1])}</span>`).join('')}${e.data?.intent ? `<em>« ${esc(e.data.intent)} »</em>` : ''}</p>` : ''}${etat}</div>
        ${pourMoi ? `<div class="nv-cases"><label><input type="checkbox" data-case="vus" ${vu(me, e.id) ? 'checked' : ''}> Vu</label>${asks.length ? `<label><input type="checkbox" data-case="faits" ${fait(me, e.id) ? 'checked' : ''}> J’ai fait ça</label>` : ''}</div>` : ''}
      </li>`;
    }
    el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-nv=revoir-maj]')) { import('../nouveautes.js').then((n) => n.majAvecAmour({ revoir: true })); return; }
      const t = e.target.closest('[data-nv]')?.dataset.nv;
      if (t === 'pour-moi' || t === 'de-moi') { onglet = t; rendre(); return; }
      if (t === 'tout-vu') { await marquer(deLautre().filter((x) => !vu(espace.me, x.id)).map((x) => x.id), 'vus').catch((err) => toast(err.message)); rendre(); return; }
      // Ouvrir une nouvelle, c'est l'avoir vue.
      const a = e.target.closest('[data-nv-ouvre]'); const li = a?.closest('.nv-item');
      if (li && !vu(espace.me, li.dataset.id) && espace.entries.find((x) => x.id === li.dataset.id)?.author !== espace.me) marquer([li.dataset.id], 'vus').catch(() => {});
    });
    el.addEventListener('change', async (e) => {
      if (e.target.dataset.nv === 'tout') { tout = e.target.checked; rendre(); return; }
      const c = e.target.dataset.case; if (!c) return;
      const id = e.target.closest('.nv-item').dataset.id;
      try {
        await marquer([id], c, e.target.checked);
        if (c === 'faits' && e.target.checked && !vu(espace.me, id)) await marquer([id], 'vus');
        toast(c === 'faits' ? (e.target.checked ? `${autre()} verra que c’est fait.` : 'Décoché.') : e.target.checked ? 'Vu.' : 'Remis à voir.');
      } catch (err) { toast(err.message); }
      rendre();
    });
    brancherRelance(el, rendre, toast);
    const off = onEspace((w) => { if (w === 'entries' && !el.querySelector('.nv-item input:focus')) rendre(); });
    rendre();
    return off;
  },
};

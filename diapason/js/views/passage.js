// Le passage de la nouvelle lune : un rituel à deux pour fermer un cycle avant d'en ouvrir un autre. On relit ce qu'on
// avait semé, on regarde ce que le cycle a donné (nos idées, nos échanges), chacun choisit ce qu'il emporte, puis on
// sème les intentions de la lune qui vient. Les cycles fermés restent : c'est la mémoire du duo, lune après lune.
import { espace, onEspace, updateEspace } from '../espace.js';
import { toast } from '../ui.js';
import { MEMBERS, memberColor, STAGES } from '../duo.js';
import { esc, espaceGate } from './carnet.js';
import { lune, luneSVG, passage, patchLune, numeroLune } from '../lune.js';
import { planStart } from '../plan.js';
import { echanges, lecture } from '../elan.js';

const J = 864e5; const SYN = 29.530588853;
const jour = (d) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
const RELUE = { tenue: 'tenue', transformee: 'transformée', lachee: 'lâchée, sans regret' };
const IDEES = ['note', 'texte', 'audio', 'image', 'lien', 'paroles'];

export default {
  id: 'passage',
  mount(el) {
    // Redessine le passage : les quatre gestes pour fermer une lune et semer la suivante.
    function rendre() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: rendre }); return; }
      const mem = espace.meta.members || MEMBERS; const me = espace.me; const l = lune();
      const p = passage(espace.meta); const ferme = p.ferme; const ouvre = p.ouvre;
      const n = numeroLune(planStart()); const nFerme = p.enAvance ? n : n && n - 1;
      const a = ferme ? new Date(`${ferme.cycle}T00:00`).getTime() : 0; const b = ferme ? (p.enAvance ? Date.now() : a + SYN * J) : 0;
      const ents = espace.entries.filter((e) => !e.demo && !e.data?.demo);
      const idees = ferme ? ents.filter((e) => e.createdAt >= a && e.createdAt < b && IDEES.includes(e.type) && !e.data?.journal) : [];
      const grandi = ferme ? ents.reduce((s, e) => s + (e.data?.moves || []).filter((m) => m.at >= a && m.at < b && m.to > m.from).length, 0) : 0;
      const entendu = ferme ? ents.filter((e) => e.createdAt >= a && e.createdAt < b && (e.data?.prise || e.data?.filet || e.data?.cathedrale || (e.type === 'session' && e.data?.done))).length : 0;
      const ech = ferme ? echanges().filter((x) => x.t1 >= a && x.t1 < b) : [];
      const lec = ferme ? lecture(a).filter(([k]) => k !== 'Ce qui attend') : [];
      const fini = ferme && mem.every((m) => ferme.relue?.[m] || !ferme.intentions?.[m]) && mem.every((m) => ouvre?.intentions?.[m]);
      el.innerHTML = `
        <div class="mod-head pa-tete"><div>
          <p class="eyebrow">Le passage</p>
          <h1>${ferme ? `De la lune ${nFerme || ''} à la lune ${nFerme ? nFerme + 1 : ''}`.replace(/  +/g, ' ') : 'Notre premier passage'}</h1>
          <p class="muted">${ferme ? 'Un rituel à deux, à la nouvelle lune : fermer un cycle avant d’en ouvrir un autre. ' : 'Un rituel à deux, à chaque nouvelle lune. '}${p.enAvance ? `La nouvelle lune arrive le ${jour(p.ouvreDate)} : vous pouvez faire le passage dès maintenant.` : ''}</p>
        </div><div class="pa-lunes" aria-hidden="true"${ferme ? '' : ' hidden'}>${luneSVG(lune(new Date(Date.now() - (p.enAvance ? 0 : l.age * J + J))), 40)}<span>→</span>${luneSVG(lune(p.ouvreDate || new Date()), 40)}</div></div>
        ${fini ? '<p class="pa-fini">☾ Le cycle est fermé, le suivant est semé. Bon voyage à vous deux.</p>' : ''}
        ${!ferme ? `<p class="pa-premier">Pour ce premier cycle, un seul geste : semer chacun son intention. Relire, regarder ce que le cycle a donné et choisir ce qu’on emporte viendront au prochain passage, à la nouvelle lune du ${jour(Date.now() + (SYN - l.age) * J)}.</p>` : ''}
        <ol class="pa-etapes${ferme ? '' : ' pa-seul'}">
          ${ferme ? `<li class="panel"><h2><span>1</span> Ce qu’on avait semé</h2>
            ${ferme && Object.keys(ferme.intentions || {}).length ? mem.map((m) => { const x = ferme.intentions?.[m]; const r = ferme.relue?.[m]; return `<div class="pa-int" style="--c:${memberColor(m)}"><b>${esc(m)}</b>${x ? `<q>${esc(x)}</q>${r ? `<em>${RELUE[r]}</em>` : m === me ? `<p class="pa-relire">Relue, elle a été… <button class="btn small" data-relue="tenue">tenue</button><button class="btn small" data-relue="transformee">transformée</button><button class="btn small" data-relue="lachee">lâchée</button></p>` : '<em class="muted">pas encore relue</em>'}` : '<span class="muted">rien de semé ce cycle-là</span>'}
              ${m === me ? `<textarea class="input pa-mot" data-mot rows="2" maxlength="300" placeholder="Un mot sur ce cycle, pour toi et pour l’autre (facultatif)">${esc(ferme.mots?.[me] || '')}</textarea>` : ferme.mots?.[m] ? `<p class="pa-m">${esc(ferme.mots[m])}</p>` : ''}</div>`; }).join('')
              : '<p class="muted">Pas d’intention semée au cycle précédent. Ce passage sera le premier : semez à l’étape 4.</p>'}
          </li>` : ''}
          ${ferme ? `<li class="panel"><h2><span>2</span> Ce que le cycle a donné</h2>
            ${ferme ? `<p class="pa-chiffres"><span><b>${idees.length}</b> idée${idees.length > 1 ? 's' : ''} semée${idees.length > 1 ? 's' : ''}</span><span><b>${grandi}</b> ${grandi > 1 ? 'ont' : 'a'} grandi</span><span><b>${entendu}</b> entendue${entendu > 1 ? 's' : ''}</span><span><b>${ech.length}</b> échange${ech.length > 1 ? 's' : ''} d’un fil à l’autre</span></p>
              ${idees.length ? `<p class="pa-idees">${idees.slice(0, 12).map((e) => `<a href="#/carnet?voir=${esc(e.id)}" style="--c:${memberColor(e.author)}">${esc((e.title || 'sans titre').slice(0, 40))}<small>${esc(STAGES[e.data?.stage || 0]?.label || '')}</small></a>`).join('')}</p>` : ''}
              ${lec.length ? `<dl class="pa-lec">${lec.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
              <p><a href="#/elan">Voir la tresse de ce cycle →</a></p>` : '<p class="muted">Le premier cycle commence : il n’y a encore rien à regarder en arrière.</p>'}
          </li>` : ''}
          ${ferme ? `<li class="panel"><h2><span>3</span> Ce qu’on emporte</h2>
            <p class="muted small">Une seule idée chacun, celle qui doit traverser la nouvelle lune avec vous.</p>
            ${ferme ? mem.map((m) => { const g = ferme.garde?.[m]; const e = g && espace.entries.find((x) => x.id === g); return `<div class="pa-garde" style="--c:${memberColor(m)}"><b>${esc(m)}</b> ${m === me ? `<select data-garde><option value="">Choisir une idée…</option>${(idees.length ? idees : ents.filter((x) => IDEES.includes(x.type)).slice(-20)).map((x) => `<option value="${esc(x.id)}" ${x.id === g ? 'selected' : ''}>${esc((x.title || 'sans titre').slice(0, 60))}</option>`).join('')}</select>` : e ? `<a href="#/carnet?voir=${esc(e.id)}">${esc(e.title || 'sans titre')}</a>` : '<span class="muted">pas encore choisi</span>'}</div>`; }).join('') : '<p class="muted">Au prochain passage.</p>'}
          </li>` : ''}
          <li class="panel"><h2><span>4</span> Semer la lune qui vient</h2>
            ${mem.map((m) => { const x = ouvre?.intentions?.[m]; return `<div class="pa-int" style="--c:${memberColor(m)}"><b>${esc(m)}</b>${x ? `<q>${esc(x)}</q>` : m === me ? `<form class="pa-semer"><input class="input" data-semer maxlength="140" placeholder="Mon intention pour la lune qui vient"><button class="btn primary small">Semer</button></form>` : '<span class="muted">pas encore semée</span>'}</div>`; }).join('')}
          </li>
        </ol>
        ${(espace.meta.lunes || []).length ? `<section class="panel pa-memoire"><h2>Nos lunes passées</h2>${[...espace.meta.lunes].reverse().map((x) => `<article><p class="pa-date">${luneSVG(lune(new Date(`${x.cycle}T12:00`)), 16)} Nouvelle lune du ${jour(`${x.cycle}T12:00`)}</p>${mem.map((m) => (x.intentions?.[m] ? `<p style="--c:${memberColor(m)}"><b>${esc(m)}</b> « ${esc(x.intentions[m])} »${x.relue?.[m] ? ` · ${RELUE[x.relue[m]]}` : ''}</p>` : '')).join('')}</article>`).join('')}</section>` : ''}`;
    }
    // Écrire dans le cycle qu'on ferme : soit le cycle en cours (passage en avance), soit le précédent (rangé ou non).
    async function ecrireFerme(change) {
      const p = passage(espace.meta); const f = p.ferme; if (!f) return;
      if (espace.meta.lune?.cycle === f.cycle) await updateEspace({ lune: { ...espace.meta.lune, ...change(espace.meta.lune) } });
      else { const lunes = [...(espace.meta.lunes || [])]; const i = lunes.findIndex((x) => x.cycle === f.cycle); if (i >= 0) { lunes[i] = { ...lunes[i], ...change(lunes[i]) }; await updateEspace({ lunes }); } }
    }
    // Sème mon intention pour la lune qui vient.
    async function semer(v) {
      const p = passage(espace.meta); const o = p.ouvre;
      if (o.cycle === lune().cycle) await updateEspace(patchLune(espace.meta, (b) => ({ intentions: { ...b.intentions, [espace.me]: v } })));
      else await updateEspace({ luneProchaine: { ...o, intentions: { ...(o.intentions || {}), [espace.me]: v } } });
    }
    el.addEventListener('click', async (e) => {
      const r = e.target.closest('[data-relue]'); if (!r) return;
      try { await ecrireFerme((x) => ({ relue: { ...(x.relue || {}), [espace.me]: r.dataset.relue } })); toast('Relue.'); rendre(); } catch (err) { toast(err.message); }
    });
    el.addEventListener('change', async (e) => {
      if (e.target.matches('[data-garde]')) { try { await ecrireFerme((x) => ({ garde: { ...(x.garde || {}), [espace.me]: e.target.value } })); toast('Emportée dans la lune qui vient.'); rendre(); } catch (err) { toast(err.message); } }
      if (e.target.matches('[data-mot]')) { try { await ecrireFerme((x) => ({ mots: { ...(x.mots || {}), [espace.me]: e.target.value.trim() } })); toast('Gardé.'); } catch (err) { toast(err.message); } }
    });
    el.addEventListener('submit', async (e) => {
      if (!e.target.matches('.pa-semer')) return; e.preventDefault();
      const v = e.target.querySelector('[data-semer]').value.trim(); if (!v) return;
      try { await semer(v); toast('Semée pour la lune qui vient.'); rendre(); } catch (err) { toast(err.message); }
    });
    const off = onEspace((w) => { if (w === 'meta' && !el.contains(document.activeElement)) rendre(); });
    rendre();
    return off;
  },
};

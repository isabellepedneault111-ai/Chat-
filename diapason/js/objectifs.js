// L'échelle des objectifs : le cap des six mois (on n'y touche presque jamais), le mois (le plan), la semaine (un
// objectif qu'on se fixe à deux, évalué chacun à la fin de la semaine) et la séance (sa cible, évaluée en la rangeant).
// Plus le palier est petit, plus il se vérifie vite : c'est là que l'autoévaluation et la rétroaction ont prise.
import { espace, saveEntry } from './espace.js';
import { memberColor, MEMBERS } from './duo.js';
import { esc } from './views/carnet.js';
import { toast } from './ui.js';

export const VERDICTS = [['atteint', 'Atteint'], ['partie', 'En partie'], ['pas', 'Pas encore']];
const nomV = (k) => VERDICTS.find((x) => x[0] === k)?.[1] || '';
const JOUR = 864e5;
export const lundi = (t = Date.now()) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)).getTime(); };
const idDe = (l) => { const d = new Date(l); return `sem-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const semaine = (l) => espace.entries.find((e) => e.id === idDe(l));
export const semaines = () => espace.entries.filter((e) => e.type === 'semaine' && e.data?.texte).sort((a, b) => b.data.debut - a.data.debut);
const jourCourt = (t) => new Date(t).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
const autre = () => (espace.meta?.members || MEMBERS).find((x) => x !== espace.me);

// Les séances d'une semaine et leurs cibles : ce qui a nourri l'objectif.
const seancesDe = (l) => espace.entries.filter((e) => e.type === 'session' && e.data?.done && e.data.doneAt >= l && e.data.doneAt < l + 7 * JOUR);

function evalHTML(e, moi) {
  const ev = e.data.eval || {}; const mien = ev[moi] || {};
  const autres = Object.entries(ev).filter(([w, x]) => w !== moi && x?.v);
  return `<div class="ob-eval" data-sem="${esc(e.id)}">
    <div class="ob-v" role="radiogroup" aria-label="Pour toi, l’objectif est…">${VERDICTS.map(([k, t]) => `<button role="radio" aria-checked="${mien.v === k}" class="${mien.v === k ? 'on' : ''} v-${k}" data-ob-v="${k}">${t}</button>`).join('')}</div>
    <input class="input" data-ob-mot maxlength="120" value="${esc(mien.mot || '')}" placeholder="Ce qui a aidé, ce qui a bloqué">
    <input class="input" data-ob-retro maxlength="160" value="${esc(mien.retro || '')}" placeholder="Pour ${esc(autre() || 'l’autre')} : ce que tu as vu de son côté">
    ${autres.map(([w, x]) => `<p class="ob-autre" style="--c:${memberColor(w)}"><b>${esc(w)}</b> ${nomV(x.v)}${x.mot ? ` · « ${esc(x.mot)} »` : ''}${x.retro ? `<br><span>Pour toi : « ${esc(x.retro)} »</span>` : ''}</p>`).join('')}
  </div>`;
}

// Sur l'accueil, dans la carte du mois : l'objectif de la semaine, et la semaine passée à évaluer si je ne l'ai pas fait.
export function semaineHTML() {
  const l = lundi(); const e = semaine(l); const avant = semaine(l - 7 * JOUR);
  const aEvaluer = avant?.data?.texte && !avant.data.eval?.[espace.me]?.v;
  return `<div class="ob-sem">
    <p class="ob-tit">Cette semaine, on vise</p>
    ${e?.data?.texte ? `<p class="ob-texte">« ${esc(e.data.texte)} » <button class="linklike small" data-ob-edit>changer</button></p>`
      : `<form class="ob-form"><input class="input" name="t" maxlength="120" placeholder="Un objectif qu’on pourra vérifier dimanche (ex. : finir le refrain de Projet 1)"><button class="btn small">Fixer</button></form>`}
    ${e?.data?.texte && Date.now() > l + 4 * JOUR ? `<details class="ob-fin"><summary>La semaine achève : on l’évalue?</summary>${evalHTML(e, espace.me)}</details>` : ''}
    ${aEvaluer ? `<details class="ob-fin" open><summary>La semaine passée, vous visiez « ${esc(avant.data.texte)} ». Pour toi?</summary>${evalHTML(avant, espace.me)}</details>` : ''}
  </div>`;
}

// Sur « Notre projet » : les quatre paliers, du plus près (la séance) au plus loin (le cap des six mois).
export function echelleHTML(v, m, plan) {
  const l = lundi(); const e = semaine(l);
  const sessions = espace.entries.filter((x) => x.type === 'session' && x.data?.done && x.data.cible).sort((a, b) => b.data.doneAt - a.data.doneAt);
  const der = sessions[0]; const dv = der && Object.entries(der.data.traces || {}).filter(([, t]) => t?.cible);
  const passees = semaines().filter((x) => x.data.debut < l).slice(0, 4);
  return `<ol class="ob-echelle">
    <li><span class="ob-quand">Cette séance</span><b>${der ? `« ${esc(der.data.cible)} »` : '<span class="muted">la cible, choisie en lançant la séance</span>'}</b><small>${dv?.length ? `La dernière : ${dv.map(([w, t]) => `<i style="color:${memberColor(w)}">${esc(w)}</i> ${nomV(t.cible).toLowerCase()}`).join(', ')}` : 'Une seule cible par séance, évaluée en la rangeant.'}</small></li>
    <li><span class="ob-quand">Cette semaine</span><b>${e?.data?.texte ? `« ${esc(e.data.texte)} »` : '<span class="muted">pas encore fixé : sur l’accueil, dans la carte du mois</span>'}</b><small>Fixé à deux, évalué chacun à la fin de la semaine.</small></li>
    <li><span class="ob-quand">Ce mois-ci</span><b>${esc(plan.titre)}</b><small>Sortie visée : ${esc(plan.sortie)}</small></li>
    <li><span class="ob-quand">Dans six mois</span><b>${v.intention ? esc(v.intention) : '<span class="muted">notre cap, à poser ensemble (Modifier, plus bas)</span>'}</b><small>Le cap. Il ne bouge presque pas.</small></li>
  </ol>
  ${passees.length ? `<details class="ob-passees"><summary>Nos semaines passées (${passees.length})</summary>${passees.map((x) => `<div class="ob-p"><p><span class="mono">${jourCourt(x.data.debut)}</span> « ${esc(x.data.texte)} » · ${seancesDe(x.data.debut).length} séance${seancesDe(x.data.debut).length > 1 ? 's' : ''}</p>${evalHTML(x, espace.me)}</div>`).join('')}</details>` : ''}`;
}

// Pour le bilan : chaque semaine, ce qu'on visait et ce qu'on en dit.
export function historiqueHTML() {
  const s = semaines(); if (!s.length) return '';
  const compte = (k) => s.reduce((n, x) => n + Object.values(x.data.eval || {}).filter((y) => y?.v === k).length, 0);
  return `<section class="panel ob-hist"><h2>Ce qu’on visait, semaine après semaine</h2>
    <p class="muted small">${VERDICTS.map(([k, t]) => `${t} : <b>${compte(k)}</b>`).join(' · ')} (une voix par personne et par semaine)</p>
    <ol>${s.map((x) => `<li><span class="mono">${jourCourt(x.data.debut)}</span> <b>« ${esc(x.data.texte)} »</b> ${Object.entries(x.data.eval || {}).filter(([, y]) => y?.v).map(([w, y]) => `<span class="ob-pastille v-${y.v}" style="--c:${memberColor(w)}">${esc(w)} · ${nomV(y.v)}</span>`).join(' ') || '<span class="muted small">pas encore évaluée</span>'}</li>`).join('')}</ol></section>`;
}

// On repart toujours de la version la plus fraîche : l'autre a peut-être évalué entre-temps.
async function majSemaine(id, f) {
  const e = espace.entries.find((x) => x.id === id); if (!e) return;
  try { await saveEntry({ ...e, data: f(e.data) }); } catch (err) { toast(err.message); }
}
export function brancherObjectifs(root, rendre) {
  root.addEventListener('submit', async (ev) => {
    const f = ev.target.closest('.ob-form'); if (!f) return; ev.preventDefault();
    const t = f.t.value.trim(); if (!t) return; const l = lundi(); const e = semaine(l);
    try { await saveEntry({ ...(e || { id: idDe(l), type: 'semaine' }), title: t, data: { ...(e?.data || {}), debut: l, texte: t, par: espace.me } }); rendre?.(); } catch (err) { toast(err.message); }
  });
  root.addEventListener('click', async (ev) => {
    if (ev.target.closest('[data-ob-edit]')) { const p = ev.target.closest('.ob-texte'); const t = semaine(lundi())?.data?.texte || ''; p.outerHTML = `<form class="ob-form"><input class="input" name="t" maxlength="120" value="${esc(t)}"><button class="btn small">Fixer</button></form>`; return; }
    const b = ev.target.closest('[data-ob-v]'); if (!b) return; const id = b.closest('[data-sem]').dataset.sem;
    b.parentElement.querySelectorAll('button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    await majSemaine(id, (d) => ({ ...d, eval: { ...(d.eval || {}), [espace.me]: { ...(d.eval?.[espace.me] || {}), v: b.dataset.obV } } }));
  });
  root.addEventListener('change', async (ev) => {
    const i = ev.target.closest('[data-ob-mot],[data-ob-retro]'); if (!i) return; const id = i.closest('[data-sem]').dataset.sem; const k = 'obMot' in i.dataset ? 'mot' : 'retro';
    await majSemaine(id, (d) => ({ ...d, eval: { ...(d.eval || {}), [espace.me]: { ...(d.eval?.[espace.me] || {}), [k]: i.value.trim() } } }));
  });
}
export const objectifSemaine = () => semaine(lundi())?.data?.texte || '';

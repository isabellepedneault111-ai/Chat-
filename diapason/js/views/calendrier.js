// Notre calendrier sacré : le temps qu'on se donne pour créer. L'un propose une plage (une séance en présence, à
// distance, un moment pour le projet professionnel, un moment pour jouer), l'autre l'approuve : elle prend alors nos deux
// couleurs. En haut, notre rythme de la semaine ; en bas, nos prochains pas, à cocher.
import { espace, onEspace, saveEntry, deleteEntry, uid } from '../espace.js';
import { MEMBERS, memberColor, PLAN } from '../duo.js';
import { esc, espaceGate } from './carnet.js';
import { toast, store } from '../ui.js';
import { lundi, objectifSemaine } from '../objectifs.js';
import { mesTaches } from '../taches.js';
import { currentMonth } from '../plan.js';
import { lune, luneSVG, phasesEntre } from '../lune.js';

const JOUR = 864e5;
// Les sortes de plages : nom, couleur, et ce qu'elles veulent dire.
export const SORTES = {
  presence: ['Séance en présence', '#c9a45c', 'les deux dans la même pièce, sur le projet musical'],
  distance: ['Séance à distance', '#3f8f88', 'chacun chez soi, en direct, sur le projet musical'],
  pro: ['Projet professionnel', '#5a6c8f', 'une plage pour le projet pro'],
  jeu: ['Jeux et amusement', '#c96a8f', 'jouer, rire, essayer sans enjeu'],
  jalon: ['Un repère', '#1b1915', 'une date qui compte : une démo, un spectacle, une échéance'],
};
// Nos rituels lunaires : les quatre moments du cycle, à l'heure exacte (phases astronomiques, heure de l'appareil).
const RITUELS = [['Nouvelle lune', 'Le passage : fermer le cycle, semer nos intentions', '#/passage'], ['Premier quartier', 'Faire grandir : une idée du mur, trois variations', '#/carnet'],
  ['Pleine lune', 'Faire entendre : 60 secondes, à une personne', '#/session'], ['Dernier quartier', 'Laisser aller : relire nos intentions, trier le mur', '#/passage']];
export function rituelDu(jour) {
  const p = phasesEntre(jour, jour + JOUR)[0]; if (!p) return null;
  const [nom, quoi, lien] = RITUELS[p.q]; return [p.t, `${nom}, ${heure(p.t)}`, quoi, lien];
}
// Notre rythme : au moins deux séances en présence et une à distance par semaine.
const RYTHME = { presence: 2, distance: 1 };
const JOURS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
const heure = (t) => new Date(t).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ').replace(/ h 00$/, ' h');
const jourLong = (t) => new Date(t).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
const plages = () => espace.entries.filter((e) => e.type === 'plage' && e.data?.debut && e.data.statut !== 'refuse');
const pas = () => espace.entries.filter((e) => e.type === 'pas').sort((a, b) => (a.data?.fait - b.data?.fait) || b.createdAt - a.createdAt);

// Un fichier .ics : la plage s'ajoute à l'agenda de chacun (Google, Apple, Outlook).
function ics(e) {
  const f = (t) => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const d = e.data; const txt = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Diapason Labo//FLIP//FR\r\nBEGIN:VEVENT\r\nUID:${e.id}@diapason-labo\r\nDTSTAMP:${f(Date.now())}\r\nDTSTART:${f(d.debut)}\r\nDTEND:${f(d.debut + (d.duree || 90) * 60000)}\r\nSUMMARY:FLIP · ${SORTES[d.sorte]?.[0] || 'Plage'}${d.note ? ` · ${d.note.replace(/[\r\n,;]/g, ' ')}` : ''}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); a.download = `FLIP ${new Date(d.debut).toLocaleDateString('fr-CA')}.ics`; document.body.append(a); a.click(); a.remove();
}

export default {
  id: 'calendrier',
  mount(el) {
    let semaine = lundi(); let vue = store.get('calVue', 'semaine'); let mois = new Date(); mois.setDate(1);
    const mem = () => espace.meta?.members || MEMBERS; const autre = () => mem().find((m) => m !== espace.me);

    function chip(e) {
      const d = e.data; const S = SORTES[d.sorte] || SORTES.jalon; const ok = d.statut === 'confirme';
      return `<button class="cl-plage ${ok ? 'ok' : 'propose'}" data-plage="${esc(e.id)}" style="--s:${S[1]};--p:${memberColor(d.par)}" title="${esc(S[0])}${d.note ? ` : ${esc(d.note)}` : ''}">
        <b>${heure(d.debut)}</b><span>${esc(S[0])}</span>${d.note ? `<small>${esc(d.note)}</small>` : ''}<em>${ok ? 'nous deux ✓' : `proposée par ${esc(d.par)}`}</em></button>`;
    }
    function semaineHTML() {
      const fin = semaine + 7 * JOUR; const l = plages().filter((e) => e.data.debut >= semaine && e.data.debut < fin);
      const conf = (s) => l.filter((e) => e.data.sorte === s && e.data.statut === 'confirme').length;
      const prop = (s) => l.filter((e) => e.data.sorte === s && e.data.statut === 'propose').length;
      const rythme = Object.entries(RYTHME).map(([s, n]) => { const c = conf(s); return `<span class="cl-r ${c >= n ? 'atteint' : ''}" style="--s:${SORTES[s][1]}"><b>${c} / ${n}</b> ${SORTES[s][0].toLowerCase()}${prop(s) ? ` <small>(+${prop(s)} proposée${prop(s) > 1 ? 's' : ''})</small>` : ''}</span>`; }).join('')
        + ['pro', 'jeu'].map((s) => `<span class="cl-r libre" style="--s:${SORTES[s][1]}"><b>${conf(s)}</b> ${SORTES[s][0].toLowerCase()}</span>`).join('');
      const obj = semaine === lundi() ? objectifSemaine() : '';
      // Une invitation, pour moi seul : si je n'ai encore rien proposé cette semaine, l'app me tend la main (l'autre ne le voit pas).
      const rienDeMoi = semaine === lundi() && !l.some((e) => e.data.par === espace.me);
      return `<div class="cl-rythme"><span class="cl-r-t">Notre rythme cette semaine :</span>${rythme}</div>
        ${obj ? `<p class="cl-obj">Cette semaine, on vise : <b>« ${esc(obj)} »</b></p>` : ''}
        ${rienDeMoi ? `<p class="cl-invite">Tu n’as encore rien proposé cette semaine. Un moment qui te va ? <button class="linklike" data-proposer>Proposer une plage →</button></p>` : ''}
        <div class="cl-sem">${[...Array(7)].map((_, i) => { const j = semaine + i * JOUR; const auj = j === new Date(new Date().setHours(0, 0, 0, 0)).getTime();
          const du = l.filter((e) => e.data.debut >= j && e.data.debut < j + JOUR).sort((a, b) => a.data.debut - b.data.debut);
          const ri = rituelDu(j);
          return `<div class="cl-jour ${auj ? 'auj' : ''} ${ri ? 'lune' : ''}"><button class="cl-j-t" data-jour="${j}" title="Proposer une plage ce jour-là"><b>${JOURS[i]}</b> ${new Date(j).getDate()}<span>＋</span></button>${ri ? `<a class="cl-rituel" href="${ri[3]}">${luneSVG(lune(new Date(j + JOUR / 2)), 16)}<b>${ri[1]}</b><small>${ri[2]}</small></a>` : ''}${du.map(chip).join('')}</div>`; }).join('')}</div>`;
    }
    function moisHTML() {
      const y = mois.getFullYear(); const m = mois.getMonth(); const debut = lundi(new Date(y, m, 1).getTime()); const l = plages();
      const cases = []; for (let t = debut; t < new Date(y, m + 1, 1).getTime() || new Date(t).getDay() !== 1; t += JOUR) cases.push(t);
      return `<div class="cl-mois"><div class="cl-m-tete">${JOURS.map((j) => `<span>${j}</span>`).join('')}</div><div class="cl-m-grille">${cases.map((t) => { const du = l.filter((e) => e.data.debut >= t && e.data.debut < t + JOUR);
        const ri = rituelDu(t);
        return `<button class="cl-m-j ${new Date(t).getMonth() !== m ? 'hors' : ''}" data-va="${lundi(t)}" ${ri ? `title="${ri[1]} : ${ri[2]}"` : ''}><b>${new Date(t).getDate()}${ri ? ` ${luneSVG(lune(new Date(t + JOUR / 2)), 12)}` : ''}</b><span>${du.map((e) => `<i class="${e.data.statut === 'confirme' ? 'ok' : ''}" style="--s:${SORTES[e.data.sorte]?.[1]};--p:${memberColor(e.data.par)}" title="${esc(SORTES[e.data.sorte]?.[0] || '')} ${heure(e.data.debut)}"></i>`).join('')}</span></button>`; }).join('')}</div>
        ${(() => { const mm = currentMonth(); return mm ? `<p class="muted small">Ce mois-ci, au plan : <b>${esc(PLAN[mm - 1].titre)}</b>.</p>` : ''; })()}</div>`;
    }
    function attenteHTML() {
      const l = plages().filter((e) => e.data.statut === 'propose' && e.data.debut > Date.now() - JOUR).sort((a, b) => a.data.debut - b.data.debut);
      const refus = espace.entries.filter((e) => e.type === 'plage' && e.data?.statut === 'refuse' && e.data.par === espace.me && !e.data.vuRefus);
      const pourMoi = l.filter((e) => e.data.par !== espace.me); const deMoi = l.filter((e) => e.data.par === espace.me);
      if (!pourMoi.length && !deMoi.length && !refus.length) return '';
      return `<section class="panel cl-attente"><h2>En attente</h2>
        ${pourMoi.map((e) => `<div class="cl-a" style="--s:${SORTES[e.data.sorte]?.[1]}"><p><b>${esc(e.data.par)}</b> propose : ${esc(SORTES[e.data.sorte]?.[0] || '')}, <b>${jourLong(e.data.debut)}, ${heure(e.data.debut)}</b> (${e.data.duree} min)${e.data.note ? ` · « ${esc(e.data.note)} »` : ''}</p>
          <div class="cl-a-b"><button class="btn small primary" data-ok="${esc(e.id)}">Approuver</button><input class="input" data-autre-txt="${esc(e.id)}" placeholder="Ou propose autre chose (ex. : plutôt vendredi 19 h)"><button class="btn small" data-non="${esc(e.id)}">Proposer autre chose</button></div></div>`).join('')}
        ${deMoi.map((e) => `<div class="cl-a moi" style="--s:${SORTES[e.data.sorte]?.[1]}"><p>Tu proposes : ${esc(SORTES[e.data.sorte]?.[0] || '')}, <b>${jourLong(e.data.debut)}, ${heure(e.data.debut)}</b>. ${esc(autre())} n’a pas encore répondu.</p><button class="btn small ghost" data-retirer="${esc(e.id)}">Retirer</button></div>`).join('')}
        ${refus.map((e) => `<div class="cl-a refus"><p>${esc(autre())} propose autre chose pour ta plage du ${jourLong(e.data.debut)}${e.data.reponse ? ` : <b>« ${esc(e.data.reponse)} »</b>` : '.'}</p><button class="btn small" data-vu="${esc(e.id)}">Compris</button></div>`).join('')}
      </section>`;
    }
    function pasHTML() {
      const ligne = (x, qui) => `<li class="${x.fait ? 'fait' : ''}">${x.manuel != null ? `<label><input type="checkbox" data-pas="${esc(x.manuel)}" ${x.fait ? 'checked' : ''}> <b>${esc(x.titre)}</b></label>` : `<a href="${x.lien}"><b>${esc(x.titre)}</b></a>`}<small>${esc(x.pourquoi || '')}</small>${x.manuel != null && (x.auteur === espace.me) ? `<button class="icon-btn tiny" data-pas-x="${esc(x.manuel)}" aria-label="Effacer ce pas">×</button>` : ''}</li>`;
      const auto = (qui) => mesTaches(qui).filter((x) => !x.manuel);
      const faits = (qui) => pas().filter((e) => e.data?.fait && (e.data.pour === qui || e.data.pour === 'deux') && Date.now() - (e.data.faitAt || 0) < 7 * JOUR).map((e) => ({ titre: e.title, manuel: e.id, fait: true, auteur: e.author, pourquoi: `fait ${new Date(e.data.faitAt).toLocaleDateString('fr-CA', { weekday: 'long' })}` }));
      const manuels = (qui) => pas().filter((e) => !e.data?.fait && (e.data.pour === qui || e.data.pour === 'deux')).map((e) => ({ titre: e.title, manuel: e.id, auteur: e.author, pourquoi: e.data.pour === 'deux' ? 'pour nous deux' : `ajouté par ${e.author === espace.me ? 'toi' : e.author}` }));
      return `<section class="panel cl-pas"><div class="panel-head"><h2>Nos prochains pas</h2><span class="muted small">ceux que l’app voit, et ceux qu’on se donne</span></div>
        <div class="cl-pas-g">${mem().map((qui) => `<div class="cl-pas-c" style="--c:${memberColor(qui)}"><h3>${esc(qui)}${qui === espace.me ? ' (toi)' : ''}</h3><ul>${[...manuels(qui), ...auto(qui), ...faits(qui)].map((x) => ligne(x, qui)).join('') || '<li class="vide">Rien qui attend.</li>'}</ul></div>`).join('')}</div>
        <form class="cl-pas-f"><input class="input" name="t" maxlength="120" placeholder="Un pas à faire (ex. : apprendre les paroles du refrain)" required><select name="pour" aria-label="Pour qui">${mem().map((m) => `<option value="${esc(m)}" ${m === espace.me ? 'selected' : ''}>pour ${esc(m)}</option>`).join('')}<option value="deux">pour nous deux</option></select><button class="btn small">Ajouter</button></form></section>`;
    }
    function proposerHTML() {
      const d = new Date(); d.setDate(d.getDate() + 1);
      return `<form class="panel cl-prop" hidden><h2>Proposer une plage</h2><div class="cl-prop-g">
        <label class="field"><span>Le jour</span><input type="date" name="jour" value="${d.toISOString().slice(0, 10)}" required></label>
        <label class="field"><span>L’heure</span><input type="time" name="heure" value="19:00" step="900" required></label>
        <label class="field"><span>Durée</span><select name="duree">${[[60, '1 h'], [90, '1 h 30'], [120, '2 h'], [180, '3 h'], [240, '4 h']].map(([v, l]) => `<option value="${v}" ${v === 90 ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field"><span>Quoi</span><select name="sorte">${Object.entries(SORTES).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
        <label class="field cl-note"><span>Un mot (facultatif)</span><input name="note" maxlength="80" placeholder="Ex. : on finit le refrain de Projet 1"></label></div>
        <p class="muted small cl-sorte-aide"></p>
        <div class="cl-prop-b"><button class="btn primary">Proposer à ${esc(autre())}</button><button class="btn ghost" type="button" data-fermer>Annuler</button></div></form>`;
    }
    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      const titreSem = `${new Date(semaine).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })} au ${new Date(semaine + 6 * JOUR).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}`;
      el.innerHTML = `<div class="mod-head"><div><p class="eyebrow">Notre calendrier sacré</p><h1>Le temps qu’on se donne pour créer.</h1>
          <p class="muted">L’un propose une plage, l’autre l’approuve : elle prend alors nos deux couleurs. Notre rythme : au moins deux séances en présence et une à distance par semaine, et de la place pour le projet professionnel et pour jouer. Nos rituels lunaires y sont aussi, à l’heure exacte de chaque phase.</p></div></div>
        ${attenteHTML()}
        <section class="panel cl-cal"><div class="cl-barre">
          <div class="seg-tabs" role="tablist"><button role="tab" data-vue="semaine" aria-selected="${vue === 'semaine'}">Semaine</button><button role="tab" data-vue="mois" aria-selected="${vue === 'mois'}">Mois</button></div>
          <div class="cl-nav"><button class="icon-btn" data-nav="-1" aria-label="${vue === 'semaine' ? 'Semaine précédente' : 'Mois précédent'}">←</button><b>${vue === 'semaine' ? titreSem : mois.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}</b><button class="icon-btn" data-nav="1" aria-label="${vue === 'semaine' ? 'Semaine suivante' : 'Mois suivant'}">→</button>${(vue === 'semaine' ? semaine !== lundi() : mois.getMonth() !== new Date().getMonth()) ? '<button class="btn small ghost" data-nav="0">Aujourd’hui</button>' : ''}</div>
          <button class="btn primary" data-proposer>＋ Proposer une plage</button></div>
          ${vue === 'semaine' ? semaineHTML() : moisHTML()}
          <p class="cl-leg">${Object.entries(SORTES).map(([, [l, c]]) => `<span style="--s:${c}"><i></i>${l}</span>`).join('')}<span class="cl-leg-lune">${luneSVG(lune(), 12)} nos rituels lunaires</span><span class="cl-leg-ok"><i></i>approuvée : nos deux couleurs</span><span class="cl-leg-p"><i></i>proposée, en attente</span></p></section>
        ${proposerHTML()}
        <div class="cl-fiche" hidden></div>
        ${pasHTML()}`;
    }
    const q = (s) => el.querySelector(s);
    function ouvrirProposer(jour) {
      const f = q('.cl-prop'); f.hidden = false; if (jour) f.jour.value = new Date(+jour).toLocaleDateString('fr-CA');
      q('.cl-sorte-aide').textContent = SORTES[f.sorte.value][2]; f.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    function fiche(id) {
      const e = espace.entries.find((x) => x.id === id); if (!e) return; const d = e.data; const S = SORTES[d.sorte] || SORTES.jalon; const fi = q('.cl-fiche');
      fi.hidden = false; fi.innerHTML = `<section class="panel" style="--s:${S[1]}"><div class="panel-head"><h2>${esc(S[0])}</h2><button class="icon-btn tiny" data-fiche-x aria-label="Fermer">✕</button></div>
        <p><b>${jourLong(d.debut)}, ${heure(d.debut)}</b> · ${d.duree} min${d.note ? ` · « ${esc(d.note)} »` : ''}</p>
        <p class="muted small">${d.statut === 'confirme' ? `Proposée par ${esc(d.par)}, approuvée par ${esc(d.approuvePar || autre())} : c’est à nous deux.` : `Proposée par ${esc(d.par)}, en attente de réponse.`}</p>
        <div class="cl-a-b">${d.statut === 'confirme' ? '<button class="btn small" data-ics="' + esc(e.id) + '">📅 Dans mon agenda</button>' : ''}${d.statut === 'propose' && d.par !== espace.me ? `<button class="btn small primary" data-ok="${esc(e.id)}">Approuver</button>` : ''}<button class="btn small ghost" data-retirer="${esc(e.id)}">${d.statut === 'confirme' ? 'Annuler cette plage' : 'Retirer'}</button></div></section>`;
      fi.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const maj = async (id, f) => { const e = espace.entries.find((x) => x.id === id); if (!e) return; try { await saveEntry({ ...e, data: f(e.data) }); } catch (err) { toast(err.message); } };

    el.addEventListener('submit', async (ev) => {
      ev.preventDefault(); const f = ev.target;
      if (f.classList.contains('cl-prop')) {
        const [y, mo, j] = f.jour.value.split('-').map(Number); const [h, mi] = f.heure.value.split(':').map(Number); const debut = new Date(y, mo - 1, j, h, mi).getTime();
        try { await saveEntry({ id: `plage-${uid()}`, type: 'plage', title: SORTES[f.sorte.value][0], data: { debut, duree: +f.duree.value, sorte: f.sorte.value, note: f.note.value.trim(), par: espace.me, statut: 'propose' } });
          semaine = lundi(debut); toast(`Proposée à ${autre()}. Elle prendra vos deux couleurs quand ${autre()} l’aura approuvée.`); } catch (err) { toast(err.message); }
      }
      if (f.classList.contains('cl-pas-f')) { const t = f.t.value.trim(); if (!t) return; try { await saveEntry({ id: `pas-${uid()}`, type: 'pas', title: t, data: { pour: f.pour.value, fait: false } }); } catch (err) { toast(err.message); } }
    });
    el.addEventListener('change', (ev) => {
      if (ev.target.name === 'sorte' && ev.target.closest('.cl-prop')) q('.cl-sorte-aide').textContent = SORTES[ev.target.value][2];
      const p = ev.target.dataset.pas; if (p) maj(p, (d) => ({ ...d, fait: ev.target.checked, faitAt: ev.target.checked ? Date.now() : null }));
    });
    el.addEventListener('click', async (ev) => {
      const t = ev.target.closest('button, [data-va]'); if (!t) return; const ds = t.dataset;
      if (ds.vue) { vue = ds.vue; store.set('calVue', vue); render(); }
      if (ds.nav != null) { const n = +ds.nav; if (vue === 'semaine') semaine = n ? lundi(semaine + n * 7 * JOUR + JOUR) : lundi(); else { mois = n ? new Date(mois.getFullYear(), mois.getMonth() + n, 1) : (() => { const x = new Date(); x.setDate(1); return x; })(); } render(); }
      if (ds.va) { semaine = +ds.va; vue = 'semaine'; store.set('calVue', vue); render(); }
      if ('proposer' in ds) ouvrirProposer();
      if (ds.jour) ouvrirProposer(ds.jour);
      if ('fermer' in ds) q('.cl-prop').hidden = true;
      if (ds.plage) fiche(ds.plage);
      if ('ficheX' in ds) q('.cl-fiche').hidden = true;
      if (ds.ok) { await maj(ds.ok, (d) => ({ ...d, statut: 'confirme', approuvePar: espace.me, approuveAt: Date.now() })); toast('Approuvée : la plage est à vous deux.'); }
      if (ds.non) { const txt = el.querySelector(`[data-autre-txt="${CSS.escape(ds.non)}"]`)?.value.trim(); await maj(ds.non, (d) => ({ ...d, statut: 'refuse', reponse: txt, reponduPar: espace.me })); toast(`${autre()} verra ta réponse.`); }
      if (ds.vu) await maj(ds.vu, (d) => ({ ...d, vuRefus: true }));
      if (ds.retirer) { if (!confirm('Retirer cette plage du calendrier ?')) return; try { await deleteEntry(ds.retirer); } catch (err) { toast(err.message); } }
      if (ds.pasX) { try { await deleteEntry(ds.pasX); } catch (err) { toast(err.message); } }
      if (ds.ics) { const e = espace.entries.find((x) => x.id === ds.ics); if (e) ics(e); }
    });
    render();
    let sig = ''; const off = onEspace((w) => { if (w !== 'entries' && w !== 'meta') return; const s = JSON.stringify(espace.entries.filter((e) => e.type === 'plage' || e.type === 'pas').map((e) => [e.id, e.updatedAt])); if (s !== sig) { sig = s; if (!el.querySelector('.cl-prop:not([hidden]) input:focus, .cl-pas-f input:focus, [data-autre-txt]:focus')) render(); } });
    return () => off?.();
  },
};

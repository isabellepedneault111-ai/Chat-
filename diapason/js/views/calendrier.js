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
import { lune, luneSVG, phasesEntre, CYCLE } from '../lune.js';

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
// Le rituel lunaire d’un jour, s’il y en a un : le moment exact de la phase, son nom, ce qu’elle nous propose et où aller.
export function rituelDu(jour) {
  const p = phasesEntre(jour, jour + JOUR)[0]; if (!p) return null;
  const [nom, quoi, lien] = RITUELS[p.q]; return [p.t, `${nom}, ${heure(p.t)}`, quoi, lien, p.q];
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

    // Une plage dans le calendrier : son heure, sa sorte, son mot, et son état (proposée par l’un, ou à nous deux).
    function chip(e) {
      const d = e.data; const S = SORTES[d.sorte] || SORTES.jalon; const ok = d.statut === 'confirme';
      return `<button class="cl-plage ${ok ? 'ok' : 'propose'}" data-plage="${esc(e.id)}" style="--s:${S[1]};--p:${memberColor(d.par)}" title="${esc(S[0])}${d.note ? ` : ${esc(d.note)}` : ''}">
        <b>${heure(d.debut)} – ${heure(d.debut + d.duree * 6e4)}</b><span>${esc(S[0])}</span>${d.note ? `<small>${esc(d.note)}</small>` : ''}<em>${ok ? 'nous deux ✓' : `proposée par ${esc(d.par)}`}</em></button>`;
    }
    // La vue Semaine : notre rythme, l’objectif de la semaine, et sept jours avec leurs plages et leurs rituels lunaires.
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
        ${(() => {
          // Une échelle d'heures commune aux sept jours (8 h à 23 h, élargie au besoin) : la hauteur d'une plage est sa durée.
          const jours = [...Array(7)].map((_, i) => semaine + i * JOUR); const auj = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
          const dans = l.filter((e) => e.data.debut >= semaine && e.data.debut < semaine + 7 * JOUR);
          const hDe = (t) => new Date(t).getHours() + new Date(t).getMinutes() / 60;
          const h0 = Math.min(8, ...dans.map((e) => Math.floor(hDe(e.data.debut)))); const h1 = Math.max(23, ...dans.map((e) => Math.ceil(hDe(e.data.debut) + e.data.duree / 60)));
          const PX = 18; const haut = (h1 - h0) * PX; const heures = []; for (let h = h0; h <= h1; h += 2) heures.push(h);
          const bloc = (e) => { const d = e.data; const S = SORTES[d.sorte] || SORTES.jalon; const ok = d.statut === 'confirme'; const top = (hDe(d.debut) - h0) * PX; const ht = Math.max(PX, (d.duree / 60) * PX);
            return `<button class="cl-bloc ${ok ? 'ok' : 'propose'} ${ht < 40 ? 'court' : ''}" data-plage="${esc(e.id)}" style="--s:${S[1]};top:${top}px;height:${ht}px" title="${esc(S[0])}, ${heure(d.debut)} à ${heure(d.debut + d.duree * 6e4)}${d.note ? ` · ${esc(d.note)}` : ''} · ${ok ? 'à nous deux' : `proposée par ${esc(d.par)}`}"><b>${heure(d.debut)}–${heure(d.debut + d.duree * 6e4)}</b> <span>${esc(S[0].replace(/^Séance /, ''))}</span>${ht >= 54 && d.note ? `<small>${esc(d.note)}</small>` : ''}</button>`; };
          return `<div class="cl-sem cl-grille" style="--haut:${haut}px">
            <div class="cl-jour cl-gout" aria-hidden="true"><span class="cl-j-t"><b>&nbsp;</b></span><div class="cl-j-lune"></div><div class="cl-g-heures">${heures.map((h) => `<span style="top:${(h - h0) * PX}px">${h} h</span>`).join('')}</div></div>
            ${jours.map((j, i) => { const du = dans.filter((e) => e.data.debut >= j && e.data.debut < j + JOUR).sort((a, b) => a.data.debut - b.data.debut); const ri = rituelDu(j);
              return `<div class="cl-jour ${j === auj ? 'auj' : ''}"><button class="cl-j-t" data-jour="${j}" title="Proposer une plage ce jour-là"><b>${JOURS[i]}</b> ${new Date(j).getDate()}<span>＋</span></button>
                <div class="cl-j-lune">${ri ? `<button type="button" class="cl-rituel" data-rituel="${j}" title="${esc(ri[1])} : ${esc(ri[2])}">${luneSVG(lune(new Date(j + JOUR / 2)), 14)}<b>${esc(ri[1])}</b></button>` : ''}</div>
                <div class="cl-j-heures">${heures.map((h) => `<i style="top:${(h - h0) * PX}px"></i>`).join('')}${du.map(bloc).join('')}</div>
                <div class="cl-j-liste">${du.map(chip).join('')}</div></div>`; }).join('')}</div>`;
        })()}`;
    }
    // La vue Mois : chaque jour avec ses plages en pastilles et ses lunes ; toucher un jour ouvre sa semaine.
    function moisHTML() {
      const y = mois.getFullYear(); const m = mois.getMonth(); const debut = lundi(new Date(y, m, 1).getTime()); const l = plages();
      const cases = []; for (let t = debut; t < new Date(y, m + 1, 1).getTime() || new Date(t).getDay() !== 1; t += JOUR) cases.push(t);
      return `<div class="cl-mois"><div class="cl-m-tete">${JOURS.map((j) => `<span>${j}</span>`).join('')}</div><div class="cl-m-grille">${cases.map((t) => { const du = l.filter((e) => e.data.debut >= t && e.data.debut < t + JOUR);
        const ri = rituelDu(t);
        return `<button class="cl-m-j ${new Date(t).getMonth() !== m ? 'hors' : ''}" data-va="${lundi(t)}" ${ri ? `title="${ri[1]} : ${ri[2]}"` : ''}><b>${new Date(t).getDate()}${ri ? ` ${luneSVG(lune(new Date(t + JOUR / 2)), 12)}` : ''}</b><span>${du.map((e) => `<i class="${e.data.statut === 'confirme' ? 'ok' : ''}" style="--s:${SORTES[e.data.sorte]?.[1]};--p:${memberColor(e.data.par)}" title="${esc(SORTES[e.data.sorte]?.[0] || '')} ${heure(e.data.debut)}"></i>`).join('')}</span></button>`; }).join('')}</div>
        ${(() => { const mm = currentMonth(); return mm ? `<p class="muted small">Ce mois-ci, au plan : <b>${esc(PLAN[mm - 1].titre)}</b>.</p>` : ''; })()}</div>`;
    }
    // Les plages en attente : celles que l’autre me propose (approuver ou proposer autre chose), les miennes sans réponse, et les réponses à mes propositions.
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
    // Nos prochains pas : les deux listes côte à côte (ceux que l’app voit, ceux qu’on se donne à cocher) et le formulaire pour en ajouter.
    function pasHTML() {
      const ligne = (x, qui) => `<li class="${x.fait ? 'fait' : ''}">${x.manuel != null ? `<label><input type="checkbox" data-pas="${esc(x.manuel)}" ${x.fait ? 'checked' : ''}> <b>${esc(x.titre)}</b></label>` : `<a href="${x.lien}"><b>${esc(x.titre)}</b></a>`}<small>${esc(x.pourquoi || '')}</small>${x.manuel != null && (x.auteur === espace.me) ? `<button class="icon-btn tiny" data-pas-x="${esc(x.manuel)}" aria-label="Effacer ce pas">×</button>` : ''}</li>`;
      const auto = (qui) => mesTaches(qui).filter((x) => !x.manuel);
      const faits = (qui) => pas().filter((e) => e.data?.fait && (e.data.pour === qui || e.data.pour === 'deux') && Date.now() - (e.data.faitAt || 0) < 7 * JOUR).map((e) => ({ titre: e.title, manuel: e.id, fait: true, auteur: e.author, pourquoi: `fait ${new Date(e.data.faitAt).toLocaleDateString('fr-CA', { weekday: 'long' })}` }));
      const manuels = (qui) => pas().filter((e) => !e.data?.fait && (e.data.pour === qui || e.data.pour === 'deux')).map((e) => ({ titre: e.title, manuel: e.id, auteur: e.author, pourquoi: e.data.pour === 'deux' ? 'pour nous deux' : `ajouté par ${e.author === espace.me ? 'toi' : e.author}` }));
      return `<section class="panel cl-pas"><div class="panel-head"><h2>Nos prochains pas</h2><span class="muted small">ceux que l’app voit, et ceux qu’on se donne</span></div>
        <div class="cl-pas-g">${mem().map((qui) => `<div class="cl-pas-c" style="--c:${memberColor(qui)}"><h3>${esc(qui)}${qui === espace.me ? ' (toi)' : ''}</h3><ul>${[...manuels(qui), ...auto(qui), ...faits(qui)].map((x) => ligne(x, qui)).join('') || '<li class="vide">Rien qui attend.</li>'}</ul></div>`).join('')}</div>
        <form class="cl-pas-f"><input class="input" name="t" maxlength="120" placeholder="Un pas à faire (ex. : apprendre les paroles du refrain)" required><select name="pour" aria-label="Pour qui">${mem().map((m) => `<option value="${esc(m)}" ${m === espace.me ? 'selected' : ''}>pour ${esc(m)}</option>`).join('')}<option value="deux">pour nous deux</option></select><button class="btn small">Ajouter</button></form></section>`;
    }
    // Le formulaire pour proposer une plage : la sorte en cartes, le jour dans un petit calendrier du mois, l'heure
    // et la durée en pastilles, un mot, et le résumé de ce qu'on s'apprête à proposer.
    function proposerHTML() {
      const d = new Date(); d.setDate(d.getDate() + 1); const jour = d.toLocaleDateString('fr-CA');
      return `<form class="panel cl-prop" hidden><div class="panel-head"><h2>Proposer une plage à ${esc(autre())}</h2><button type="button" class="icon-btn tiny" data-fermer aria-label="Fermer">✕</button></div>
        <p class="cl-p-k">Quoi</p>
        <div class="cl-p-sortes">${Object.entries(SORTES).map(([k, [l, c, quoi]], n) => `<label class="cl-p-sorte" style="--s:${c}"><input type="radio" name="sorte" value="${k}" ${n ? '' : 'checked'}><b>${esc(l)}</b><small>${esc(quoi)}</small></label>`).join('')}</div>
        <div class="cl-p-quand">
          <div><p class="cl-p-k">Quel jour</p><input type="hidden" name="jour" value="${jour}"><div class="cl-mini"></div></div>
          <div><p class="cl-p-k">À quelle heure</p><input type="hidden" name="heure" value="19:00">
            <div class="cl-p-chips" data-groupe="heure">${['09:00', '13:00', '17:00', '19:00', '20:00'].map((h) => `<button type="button" class="${h === '19:00' ? 'on' : ''}" data-h="${h}">${h.replace(':00', ' h').replace(/^0/, '')}</button>`).join('')}<label class="cl-p-autre">autre <input type="time" step="900" data-h-libre></label></div>
            <p class="cl-p-k">Combien de temps</p>
            <div class="cl-p-chips">${[[60, '1 h'], [90, '1 h 30'], [120, '2 h'], [180, '3 h'], [240, '4 h']].map(([v, l]) => `<label><input type="radio" name="duree" value="${v}" ${v === 90 ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
            <p class="cl-p-k">Un mot <small>(facultatif)</small></p><input class="input" name="note" maxlength="80" placeholder="Ex. : on finit le refrain de Projet 1">
          </div>
        </div>
        <div class="cl-p-fin"><p class="cl-p-resume"></p><button class="btn primary">Proposer à ${esc(autre())}</button></div></form>`;
    }
    // Le petit calendrier du formulaire : le mois, les lunes et les plages déjà prévues ; on touche le jour voulu.
    let miniMois = null;
    function miniHTML() {
      const f = q('.cl-prop'); const choisi = f.jour.value; const y = miniMois.getFullYear(); const m = miniMois.getMonth();
      const debut = lundi(new Date(y, m, 1).getTime()); const auj = new Date(new Date().setHours(0, 0, 0, 0)).getTime(); const l = plages();
      const cases = []; for (let t = debut; t < new Date(y, m + 1, 1).getTime() || new Date(t).getDay() !== 1; t += JOUR) cases.push(t);
      return `<div class="cl-mini-t"><button type="button" data-mini="-1" aria-label="Mois précédent">‹</button><b>${miniMois.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}</b><button type="button" data-mini="1" aria-label="Mois suivant">›</button></div>
        <div class="cl-mini-g">${JOURS.map((j) => `<span>${j[0].toUpperCase()}</span>`).join('')}${cases.map((t) => { const iso = new Date(t).toLocaleDateString('fr-CA'); const ri = rituelDu(t); const n = l.filter((e) => e.data.debut >= t && e.data.debut < t + JOUR).length;
          return `<button type="button" data-pj="${iso}" class="${new Date(t).getMonth() !== m ? 'hors' : ''} ${iso === choisi ? 'on' : ''} ${t === auj ? 'auj' : ''}" ${t < auj ? 'disabled' : ''} title="${jourLong(t)}${ri ? ` · ${ri[1]}` : ''}${n ? ` · ${n} plage${n > 1 ? 's' : ''}` : ''}">${new Date(t).getDate()}${ri ? luneSVG(lune(new Date(t + JOUR / 2)), 9) : ''}${n ? '<i></i>' : ''}</button>`; }).join('')}</div>`;
    }
    // Le résumé de la plage en préparation, mis à jour à chaque choix.
    function resume() {
      const f = q('.cl-prop'); if (!f) return; const [y, mo, j] = f.jour.value.split('-').map(Number); const [h, mi] = f.heure.value.split(':').map(Number);
      const t = new Date(y, mo - 1, j, h, mi).getTime(); const dur = +f.duree.value;
      const jl = jourLong(t); q('.cl-p-resume').innerHTML = `<b>${jl[0].toUpperCase() + jl.slice(1)}</b>, ${heure(t)} · ${dur % 60 ? `${Math.floor(dur / 60)} h 30` : `${dur / 60} h`} · ${esc(SORTES[f.sorte.value][0])}`;
    }
    // Dessine toute la page du calendrier.
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
    // Ouvre le formulaire de proposition (au jour touché, s’il y en a un).
    function ouvrirProposer(jour) {
      const f = q('.cl-prop'); f.hidden = false; if (jour) f.jour.value = new Date(+jour).toLocaleDateString('fr-CA');
      const [y, mo] = f.jour.value.split('-').map(Number); miniMois = new Date(y, mo - 1, 1); q('.cl-mini').innerHTML = miniHTML(); resume();
      f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // La fiche d’un rituel lunaire, sur place : quand exactement, ce que ce temps du cycle nous demande, et les outils pour le faire.
    function ficheRituel(jour) {
      const ri = rituelDu(jour); if (!ri) return; const c = CYCLE[[0, 1, 2, 3][ri[4]]]; const fi = q('.cl-fiche');
      fi.hidden = false; fi.innerHTML = `<section class="panel cl-rit"><div class="panel-head"><h2>${luneSVG(lune(new Date(ri[0])), 22)} ${esc(ri[1].split(',')[0])}</h2><button class="icon-btn tiny" data-fiche-x aria-label="Fermer">✕</button></div>
        <p class="cl-rit-q"><b>${jourLong(ri[0])}, ${heure(ri[0])}</b> · notre rituel : <b>${esc(c.phase)}</b></p>
        <p>${esc(c.geste)}</p>
        <p class="cl-p-k">Pour le faire</p>
        <div class="cl-a-b">${c.outils.map(([r, nom], n) => `<a class="btn small ${n ? '' : 'primary'}" href="#/${r}">${esc(nom)}</a>`).join('')}${jour >= new Date(new Date().setHours(0, 0, 0, 0)).getTime() ? `<button class="btn small" data-proposer-jour="${jour}">＋ Réserver une plage ce jour-là</button>` : ''}</div></section>`;
      fi.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // La fiche d’une plage : quand, combien de temps, qui l’a proposée, et les gestes (approuver, l’ajouter à son agenda, retirer).
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
      if (ev.target.closest('.cl-prop')) {
        if ('hLibre' in ev.target.dataset && ev.target.value) { q('.cl-prop').heure.value = ev.target.value; q('[data-groupe=heure]').querySelectorAll('[data-h]').forEach((x) => x.classList.remove('on')); }
        resume();
      }
      const p = ev.target.dataset.pas; if (p) maj(p, (d) => ({ ...d, fait: ev.target.checked, faitAt: ev.target.checked ? Date.now() : null }));
    });
    el.addEventListener('click', async (ev) => {
      const t = ev.target.closest('button, [data-va]'); if (!t) return; const ds = t.dataset;
      if (ds.vue) { vue = ds.vue; store.set('calVue', vue); render(); }
      if (ds.nav != null) { const n = +ds.nav; if (vue === 'semaine') semaine = n ? lundi(semaine + n * 7 * JOUR + JOUR) : lundi(); else { mois = n ? new Date(mois.getFullYear(), mois.getMonth() + n, 1) : (() => { const x = new Date(); x.setDate(1); return x; })(); } render(); }
      if (ds.va) { semaine = +ds.va; vue = 'semaine'; store.set('calVue', vue); render(); }
      // Le petit calendrier du formulaire : changer de mois, choisir le jour ; les pastilles d'heure.
      if (ds.mini) { miniMois = new Date(miniMois.getFullYear(), miniMois.getMonth() + +ds.mini, 1); q('.cl-mini').innerHTML = miniHTML(); return; }
      if (ds.pj) { q('.cl-prop').jour.value = ds.pj; q('.cl-mini').innerHTML = miniHTML(); resume(); return; }
      if (ds.h) { q('.cl-prop').heure.value = ds.h; t.parentElement.querySelectorAll('[data-h]').forEach((x) => x.classList.toggle('on', x === t)); q('[data-h-libre]').value = ''; resume(); return; }
      if (ds.rituel) { ficheRituel(+ds.rituel); return; }
      if (ds.proposerJour) { q('.cl-fiche').hidden = true; ouvrirProposer(ds.proposerJour); return; }
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

// Accueil = le parcours du duo vers son album : objectif, étapes datées, prochaine action.
import { espace, onEspace, renameEspace, saveEntry } from '../espace.js';
import { store, getProfile, toast } from '../ui.js';
import { MODULES, ALBUM_STYLES, buildSteps } from '../data.js';
import { esc } from './carnet.js';

const STATE_ID = 'parcours-etat';
const DAY = 86400000;

export default {
  id: 'home',
  mount(el) {
    const getGoal = () => (espace.connected ? espace.meta.goal : store.get('goal', null));
    const getDone = () => (espace.connected ? espace.entries.find((e) => e.id === STATE_ID)?.data?.done || {} : store.get('done', {}));
    let editing = false;

    async function setGoal(goal) {
      if (espace.connected) await renameEspace(goal.album || null, goal);
      else store.set('goal', goal);
    }
    async function toggleDone(id) {
      const done = { ...getDone() };
      if (done[id]) delete done[id]; else done[id] = { by: espace.me || 'moi', at: Date.now() };
      if (espace.connected) {
        const cur = espace.entries.find((e) => e.id === STATE_ID);
        await saveEntry({ id: STATE_ID, type: 'parcours', title: 'Parcours', data: { done } }, { baseUpdatedAt: cur?.updatedAt, force: true });
      } else store.set('done', done);
      render();
    }

    function setupHTML(g = {}) {
      const soon = new Date(Date.now() + 70 * DAY).toISOString().slice(0, 10);
      return `
        <section class="panel setup">
          <p class="tape">Étape zéro</p>
          <h2>Quel album voulez-vous faire?</h2>
          <p class="muted">Diapason trace ensuite votre chemin, étape par étape, jusqu’à l’écoute de lancement.</p>
          <div class="setup-grid">
            <label class="field col"><span>Titre de travail de l’album</span><input class="input" data-g="album" maxlength="80" value="${esc(g.album || espace.meta?.name || '')}" placeholder="Ex. : Lumières du Nord"></label>
            <label class="field col"><span>Nombre de chansons</span><select data-g="songs">${[1, 2, 3, 4, 5, 6].map((n) => `<option ${n === (g.songs || 3) ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="field col"><span>Date de l’écoute de lancement</span><input class="input" type="date" data-g="deadline" value="${g.deadline || soon}"></label>
            <label class="field col"><span>Couleur musicale</span><select data-g="style">${ALBUM_STYLES.map((s) => `<option ${s === g.style ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
            <label class="field col wide"><span>Pourquoi cet album? Ce que vous voulez que les gens ressentent</span><textarea class="input" data-g="why" rows="2" maxlength="400" placeholder="Ex. : Raconter l’hiver de notre ville, avec de l’espoir dedans.">${esc(g.why || '')}</textarea></label>
          </div>
          <div class="row"><button class="btn primary" data-h="save-goal">Tracer notre parcours</button>${g.album ? '<button class="btn ghost" data-h="cancel">Annuler</button>' : ''}</div>
          ${espace.connected ? '' : '<p class="fineprint">Vous travaillez à deux? <a href="#/carnet">Créez d’abord votre espace partagé</a> : le parcours sera commun.</p>'}
        </section>`;
    }

    function render() {
      const goal = getGoal();
      const profile = getProfile();
      const head = `
        <header class="masthead">
          <p class="eyebrow">${espace.connected ? `Espace · ${esc(espace.meta.name)}` : 'Labo sonore · pour la classe'}</p>
          <h1 class="display">Diapason</h1>
          <p class="lead">Du premier « ahhh » à l’écoute de lancement : le carnet de route de votre album.</p>
        </header>`;
      if (!goal || editing) {
        el.innerHTML = `${head}${setupHTML(goal || {})}${modulesHTML()}`;
        return;
      }
      const steps = buildSteps(goal);
      const done = getDone();
      if (profile && !done['p-voix']) done['p-voix'] = { by: 'auto', at: Date.now() };
      const start = goal.createdAt || Date.now();
      const end = new Date(`${goal.deadline}T12:00`).getTime();
      const totalW = steps.reduce((s, x) => s + x.weight, 0);
      let acc = 0;
      steps.forEach((s) => { acc += s.weight; s.due = start + ((end - start) * acc) / totalW; });
      const next = steps.find((s) => !done[s.id]);
      const nDone = steps.filter((s) => done[s.id]).length;
      const pct = Math.round((nDone / steps.length) * 100);
      const daysLeft = Math.ceil((end - Date.now()) / DAY);
      const late = next && next.due < Date.now();
      let face = '';
      el.innerHTML = `
        ${head}
        <section class="album-hero">
          <div class="album-sleeve">
            <div class="vinyl" style="--p:${pct}"><span>${pct}<small>%</small></span></div>
            <div>
              <p class="tape">L’album</p>
              <h2>${esc(goal.album || 'Sans titre')}</h2>
              <p class="muted">${goal.songs} chanson${goal.songs > 1 ? 's' : ''} · ${esc(goal.style)} · ${daysLeft >= 0 ? `lancement dans <b>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</b>` : 'date de lancement passée'}</p>
              ${goal.why ? `<p class="why">« ${esc(goal.why)} »</p>` : ''}
              <button class="btn small ghost" data-h="edit">Modifier l’objectif</button>
            </div>
          </div>
          ${next ? `
          <div class="next-card ${late ? 'late' : ''}">
            <p class="tape red">Prochaine étape</p>
            <h3>${esc(next.title)}</h3>
            <p>${next.why}</p>
            <p class="muted small">${late ? 'Prévue pour le ' : 'Visée : '}${new Date(next.due).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}${late ? ' — on rattrape?' : ''}</p>
            <div class="row"><a class="btn primary" href="${next.href}">${next.cta}</a><button class="btn" data-done="${next.id}">C’est fait</button></div>
          </div>` : `<div class="next-card"><p class="tape red">Bravo</p><h3>Votre album est terminé.</h3><p>Écoutez-le ensemble, puis gardez une trace dans le carnet : qu’est-ce que vous referiez autrement?</p></div>`}
        </section>

        <section class="tracklist panel">
          <div class="panel-head"><h2>Votre parcours</h2><span class="muted small">${nDone} / ${steps.length} étapes</span></div>
          <ol>${steps.map((s, i) => {
            const d = done[s.id];
            const sep = s.face !== face ? `<li class="face">${esc((face = s.face))}</li>` : '';
            return `${sep}<li class="step ${d ? 'done' : ''} ${s === next ? 'current' : ''}">
              <button class="check" data-done="${s.id}" aria-pressed="${!!d}" aria-label="${d ? 'Marquer à faire' : 'Marquer fait'} : ${esc(s.title)}"></button>
              <span class="num mono">${String(i + 1).padStart(2, '0')}</span>
              <a href="${s.href}" class="step-title">${esc(s.title)}</a>
              <span class="step-meta mono">${d ? `fait${d.by && d.by !== 'auto' ? ` · ${esc(d.by)}` : ''}` : new Date(s.due).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</span>
            </li>`;
          }).join('')}</ol>
        </section>
        ${modulesHTML()}`;
    }

    function modulesHTML() {
      return `
        <section class="modules">
          <p class="tape">L’atelier</p>
          <div class="mod-grid">
            ${MODULES.map((m) => `<a class="mod-card" href="#/${m.id}" style="--c:${m.color}"><span class="mono">${m.num}</span><b>${m.name}</b><small>${m.tagline}</small></a>`).join('')}
          </div>
        </section>`;
    }

    el.addEventListener('click', async (e) => {
      const d = e.target.closest('[data-done]');
      if (d) { await toggleDone(d.dataset.done).catch((err) => toast(err.message)); return; }
      const a = e.target.closest('[data-h]')?.dataset.h;
      if (a === 'edit') { editing = true; render(); }
      if (a === 'cancel') { editing = false; render(); }
      if (a === 'save-goal') {
        const v = (k) => el.querySelector(`[data-g=${k}]`).value.trim();
        const prev = getGoal();
        const goal = { album: v('album'), songs: +v('songs'), deadline: v('deadline'), style: v('style'), why: v('why'), createdAt: prev?.createdAt || Date.now() };
        if (!goal.deadline || new Date(goal.deadline) < new Date(Date.now() - DAY)) { toast('Choisis une date de lancement à venir.'); return; }
        try { await setGoal(goal); } catch (err) { toast(err.message); return; }
        editing = false;
        render();
        toast('Parcours tracé. Première étape en haut!');
      }
    });
    const off = onEspace((what) => { if ((what === 'entries' || what === 'meta') && !editing) render(); });
    render();
    return () => off();
  },
};

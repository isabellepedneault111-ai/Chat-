// Accueil = le plan de match de Zaza & Frog : six mois, des idées brutes à 3 à 5 originaux.
import { espace, onEspace, updateEspace } from '../espace.js';
import { toast } from '../ui.js';
import { MODULES } from '../data.js';
import { PLAN, RYTHME, VISION_FIELDS, STAGES, MEMBERS, memberColor, ROLES } from '../duo.js';
import { currentMonth, planContext, planStart, weekRhythm } from '../plan.js';
import { esc, espaceGate, ago } from './carnet.js';
import { activeSession } from './session.js';

export default {
  id: 'home',
  mount(el) {
    let editingVision = false;

    function render() {
      if (!espace.connected || !espace.me) {
        el.innerHTML = '<header class="masthead"><h1 class="display">Zaza <i>×</i> Frog</h1><p class="lead">Six mois. Deux musiciens. Des morceaux originaux.</p></header><div class="gate-host"></div>';
        espaceGate(el.querySelector('.gate-host'), { onReady: render });
        return;
      }
      const start = planStart();
      const head = `
        <header class="masthead">
          <h1 class="display">Zaza <i>×</i> Frog</h1>
          <p class="lead">Six mois. Deux musiciens. Des morceaux originaux.</p>
          <p class="duo-line">${(espace.meta.members || MEMBERS).map((m) => `<span style="--c:${memberColor(m)}"><b>${esc(m)}</b> ${esc(ROLES[m] || '')}</span>`).join('')}</p>
        </header>`;
      if (!start || editingVision) { el.innerHTML = head + setupHTML(!!start); return; }

      const m = currentMonth();
      const ctx = planContext();
      const r = weekRhythm();
      const goal = PLAN[m - 1];
      const got = goal.mesure(ctx);
      const live = activeSession();
      const mem = espace.meta.members || MEMBERS;
      const next = live ? { label: 'Rejoindre la session en cours', why: `${live.author} a lancé « ${live.data.cible} ».` }
        : r.duo < 2 ? { label: 'Session duo', why: `${r.duo} / 2 cette semaine. Courtes et régulières battent rares et longues.` }
          : r.ecoute === 0 ? { label: 'Écoute commune', why: 'Pas d’écoute depuis 2 semaines : réécoutez vos prises et triez le mur.' }
            : { label: 'Micro-session solo', why: 'Le duo est à jour cette semaine. 20 minutes chacun de son côté.' };
      const last = espace.entries.filter((e) => e.type === 'session' && e.data?.debrief?.prochaine).sort((a, b) => b.data.doneAt - a.data.doneAt)[0];
      const v = espace.meta.vision || {};
      el.innerHTML = `
        ${head}
        <section class="plan-hero">
          <div class="month-now">
            <p class="tape">Mois ${m} sur 6</p>
            <h2>${esc(goal.titre)}</h2>
            <p class="sortie">Sortie visée : <b>${esc(goal.sortie)}</b></p>
            <div class="meter-big" style="--p:${Math.min(100, Math.round((got / goal.cible) * 100))}"><i></i><span class="mono">${Math.min(got, goal.cible)} / ${goal.cible}</span></div>
            <cite>${goal.src}</cite>
          </div>
          <a class="next-card" href="#/session">
            <p class="tape red">${live ? 'En direct' : 'Prochaine séance'}</p>
            <h3>${esc(next.label)}</h3>
            <p>${esc(next.why)}</p>
            ${last ? `<p class="last-target"><span class="mono">La dernière fois, vous vous êtes dit :</span> « ${esc(last.data.debrief.prochaine)} »</p>` : ''}
            <span class="btn primary">● ${live ? 'Rejoindre' : 'Lancer la session'}</span>
          </a>
        </section>

        <section class="panel months">
          <div class="panel-head"><h2>Les six mois</h2><span class="muted small">Départ : ${new Date(start).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          <ol>${PLAN.map((p) => {
            const n = p.mesure(ctx);
            const state = p.n < m ? 'past' : p.n === m ? 'now' : 'next';
            return `<li class="${state} ${n >= p.cible ? 'reached' : ''}"><span class="mono">M${p.n}</span><b>${esc(p.titre)}</b><small>${esc(p.sortie)}</small><em class="mono">${Math.min(n, p.cible)}/${p.cible}</em></li>`;
          }).join('')}</ol>
        </section>

        <div class="home-grid">
          <section class="panel rythme">
            <h2>Le rythme de la semaine</h2>
            <div class="r-row"><span>Sessions duo</span><span class="dots">${[0, 1].map((i) => `<i class="${i < r.duo ? 'on' : ''}"></i>`).join('')}</span><small>${RYTHME[0].duree}</small></div>
            ${mem.map((x) => `<div class="r-row"><span style="color:${memberColor(x)}">Solo ${esc(x)}</span><span class="dots">${[0, 1, 2].map((i) => `<i class="${i < (r.solo[x] || 0) ? 'on' : ''}" style="--c:${memberColor(x)}"></i>`).join('')}</span><small>${RYTHME[1].duree}</small></div>`).join('')}
            <div class="r-row"><span>Écoute commune</span><span class="dots"><i class="${r.ecoute ? 'on' : ''}"></i></span><small>${RYTHME[2].duree}</small></div>
            <cite>${RYTHME.map((x) => x.src).join(' · ')}</cite>
          </section>
          <section class="panel vision">
            <div class="panel-head"><h2>Notre vision</h2><button class="btn small ghost" data-h="edit">Modifier</button></div>
            <dl>${VISION_FIELDS.map(([k, label]) => `<dt>${label}</dt><dd>${v[k] ? esc(v[k]) : '<span class="muted">à décider ensemble</span>'}</dd>`).join('')}</dl>
            <cite>Une vision partagée avant de composer · Merchán-Sánchez-Jara 2023</cite>
          </section>
          <section class="panel funnel-box">
            <h2>Où en sont nos idées</h2>
            <div class="funnel">${STAGES.map((st) => `<div><b>${ctx.stage(st.id)}</b><span>${st.label}</span></div>`).join('<i>→</i>')}</div>
            <a class="btn small" href="#/carnet">Ouvrir le mur</a>
          </section>
        </div>

        <section class="modules">
          <div class="mod-grid">
            ${MODULES.filter((x) => !['session', 'carnet'].includes(x.id)).map((x) => `<a class="mod-card ${x.id === 'labo' ? 'aside' : ''}" href="#/${x.id}" style="--c:${x.color}"><b>${x.name}</b><small>${x.tagline}</small></a>`).join('')}
          </div>
        </section>`;
    }

    function setupHTML(edit) {
      const v = espace.meta.vision || {};
      const today = new Date().toISOString().slice(0, 10);
      return `
        <section class="panel setup">
          <p class="tape">${edit ? 'Notre vision' : 'Avant de composer'}</p>
          <h2>${edit ? 'On ajuste.' : 'D’abord, une vision commune.'}</h2>
          <p class="muted">La recherche est claire : avant de composer à deux, on s’entend sur la tonalité, l’instrumentation, le genre et le style. Remplissez-le ensemble, à voix haute.</p>
          <div class="setup-grid">
            ${VISION_FIELDS.map(([k, label, ph]) => `<label class="field col ${k === 'intention' ? 'wide' : ''}"><span>${label}</span><input class="input" data-v="${k}" maxlength="200" placeholder="${esc(ph)}" value="${esc(v[k] || '')}"></label>`).join('')}
            ${edit ? '' : `<label class="field col"><span>Début du plan</span><input class="input" type="date" data-v="start" value="${today}"></label>`}
          </div>
          <div class="row"><button class="btn primary" data-h="save">${edit ? 'Enregistrer' : 'Lancer nos six mois'}</button>${edit ? '<button class="btn ghost" data-h="cancel">Annuler</button>' : ''}</div>
        </section>`;
    }

    el.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-h]')?.dataset.h;
      if (a === 'edit') { editingVision = true; render(); }
      if (a === 'cancel') { editingVision = false; render(); }
      if (a === 'save') {
        const vision = {};
        VISION_FIELDS.forEach(([k]) => { vision[k] = el.querySelector(`[data-v=${k}]`).value.trim(); });
        const body = { vision };
        const st = el.querySelector('[data-v=start]');
        if (st) body.plan = { start: st.value || new Date().toISOString().slice(0, 10) };
        try { await updateEspace(body); } catch (err) { toast(err.message); return; }
        editingVision = false;
        render();
      }
    });
    const off = onEspace((what) => { if ((what === 'entries' || what === 'meta') && !editingVision && !el.querySelector('.setup')) render(); });
    render();
    return () => off();
  },
};

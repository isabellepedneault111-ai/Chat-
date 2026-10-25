// Accueil = le plan de match de Zaza & Frog : six mois, des idées brutes à 3 à 5 originaux.
import { espace, onEspace, updateEspace, profileOf } from '../espace.js';
import { toast } from '../ui.js';
import { MODULES } from '../data.js';
import { PLAN, RYTHME, VISION_FIELDS, STAGES, MEMBERS, memberColor, ROLES } from '../duo.js';
import { currentMonth, planContext, planStart, weekRhythm } from '../plan.js';
import { esc, espaceGate, ago, embedHTML } from './carnet.js';
import { activeSession } from './session.js';
import { relaisPending, ASKS } from './relais.js';

export default {
  id: 'home',
  mount(el) {
    let editingVision = false;

    // Le truc du jour : UNE action, sa durée, et pourquoi. Toujours tout en haut.
    function todayHTML() {
      const live = activeSession();
      const r = weekRhythm();
      const rp = relaisPending();
      const ask = rp && ASKS.find((x) => x[0] === rp.data?.ask);
      const t = live ? { t: 'Rejoindre la session', d: 'en cours', why: `${live.author} a lancé « ${live.data.cible} ».`, href: '#/session' }
        : rp ? { t: `${rp.author} t’a lancé ${rp.audio ? 'un son' : 'des mots'}`, d: ask ? ask[1] : 'à écouter', why: `« ${rp.title} » : ${ask ? ask[2] : 'écoute, puis réponds par-dessus'}.`, href: `#/relais/${rp.id}` }
        : !profileOf(espace.me)?.doneAt ? { t: 'Ton point de départ', d: '5 min', why: 'Ce que tu veux, ta voix, tes styles : c’est ce qui nourrit notre plan.', href: '#/depart' }
          : r.duo < 2 ? { t: 'Une session duo', d: '60 min', why: `${r.duo} sur 2 cette semaine : courtes et régulières, c’est ce qui fait progresser.`, href: '#/session' }
            : r.ecoute === 0 ? { t: 'Écoute commune', d: '20 min', why: 'Réécouter nos prises et faire avancer les idées sur le mur.', href: '#/session' }
              : { t: 'Voix + piano', d: '10 min', why: 'Frog joue, Zaza chante : la justesse se travaille dans nos vrais accords.', href: '#/accord' };
      return inviteHTML() + `<a class="today" href="${t.href}"><span class="today-k mono">Aujourd’hui · ${esc(t.d)}</span><b>${esc(t.t)}</b><span class="today-why">${esc(t.why)}</span><span class="today-go">→</span></a>`;
    }

    // Tant que l'autre n'est pas entré : le mot secret, prêt en un clic.
    function inviteHTML() {
      const mem = espace.meta.members || MEMBERS;
      const o = mem.find((x) => x !== espace.me) || 'Frog';
      const came = espace.meta.seen?.[o] || espace.meta.tour?.[o] || espace.entries.some((e) => e.author === o);
      if (came) return '';
      return `<section class="invite">
        <p class="invite-k">${esc(o)} n’est pas encore entré</p>
        ${espace.meta.hasSecret ? `<p>Le mot secret est actif. Dis-lui : <b>l’adresse du site</b>, il choisit « ${esc(o)} », puis tape le mot secret. Sa visite démarre toute seule.</p>`
          : `<p>Il va sur l’adresse normale, choisit « ${esc(o)} » et tape ce mot : il entre dans votre espace et sa visite démarre.</p>
        <div class="invite-row"><input class="input" data-h="secret" value="bell" aria-label="Mot secret du duo" autocomplete="off"><button class="btn primary" data-h="set-secret">Activer le mot secret</button></div>`}
      </section>`;
    }

    function render() {
      if (espace.connected && espace.me && !espace.meta.seen?.[espace.me]) updateEspace({ seen: { ...(espace.meta.seen || {}), [espace.me]: Date.now() } }).catch(() => {});
      if (!espace.connected || !espace.me) {
        el.innerHTML = '<header class="masthead"><h1 class="display"><img class="mast-logo" src="img/flip.svg" alt="FLIP"></h1><p class="lead">Six mois. Deux musiciens. Des morceaux originaux.</p></header><div class="gate-host"></div>';
        espaceGate(el.querySelector('.gate-host'), { onReady: render });
        return;
      }
      const start = planStart();
      const head = `
        <header class="masthead">
          <h1 class="display"><img class="mast-logo" src="img/flip.svg" alt="FLIP"></h1>
          <p class="lead">Six mois. Deux musiciens. Des morceaux originaux.</p>
          <p class="duo-line">${(espace.meta.members || MEMBERS).map((m) => `<span style="--c:${memberColor(m)}"><b>${esc(m)}</b> ${esc(ROLES[m] || '')}</span>`).join('')}</p>
        </header>`;
      const mem0 = espace.meta.members || MEMBERS;
      const portraits = mem0.map((m) => ({ m, ok: !!profileOf(m)?.doneAt }));
      const etape1 = portraits.some((x) => !x.ok) ? `
        <a class="etape1" href="#/depart">
          <p class="tape red">Étape 1</p>
          <h2>Notre point de départ</h2>
          <p>Objectifs, voix, styles, besoins : chacun le sien, puis notre portrait commun. C’est lui qui nourrit le plan.</p>
          <span class="e1-who">${portraits.map((x) => `<span style="--c:${memberColor(x.m)}" class="${x.ok ? 'ok' : ''}">${esc(x.m)} ${x.ok ? '✓' : '· à faire'}</span>`).join('')}</span>
        </a>` : '';
      if (!start && !editingVision) { el.innerHTML = todayHTML() + head + etape1 + `<p class="or-vision"><button class="btn ghost" data-h="edit">Ou poser notre vision tout de suite →</button></p>`; return; }
      if (editingVision) { el.innerHTML = head + setupHTML(!!start); return; }

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
        ${todayHTML()}
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

        ${etape1}
        ${(() => {
          const bravos = espace.entries.filter((e) => e.type === 'bravo').slice(0, 3);
          const links = espace.entries.filter((e) => e.type === 'lien').slice(0, 4);
          const arts = mem.flatMap((x) => (profileOf(x)?.artistes || []).filter((a) => a?.nom).map((a) => ({ ...a, by: x })));
          const sessions = espace.entries.filter((e) => e.type === 'session' && e.data?.done);
          const mins = sessions.reduce((sum, e) => sum + Math.max(0, Math.min(240, (e.data.doneAt - e.data.startedAt - (e.data.pausedTotal || 0)) / 60000)), 0);
          return `
          <div class="home-trio">
            <section class="panel bravos">
              <div class="panel-head"><h2>Nos bravos</h2><a class="btn small" href="#/carnet">★ En envoyer un</a></div>
              ${bravos.length ? `<ul>${bravos.map((b) => `<li style="--c:${memberColor(b.author)}"><p>${esc(b.body || b.title)}</p><small><b>${esc(b.author)}</b> → ${esc(b.data?.to || '')} · ${ago(b.createdAt)}</small></li>`).join('')}</ul>` : '<p class="muted small">Le premier bravo est le plus dur. Ce que l’autre a fait de bien, précisément.</p>'}
            </section>
            <section class="panel inspi">
              <div class="panel-head"><h2>Ce qui nous inspire</h2><a class="btn small" href="#/carnet">+ Un lien</a></div>
              ${links[0] ? embedHTML(links[0].data?.url || links[0].body) : ''}
              <ul class="inspi-list">${links.slice(links[0] && embedHTML(links[0].data?.url || links[0].body) ? 1 : 0).map((l) => `<li style="--c:${memberColor(l.author)}"><a href="${esc(l.data?.url || l.body)}" target="_blank" rel="noopener">${esc(l.title)} ↗</a></li>`).join('')}
                ${arts.map((a) => `<li style="--c:${memberColor(a.by)}">${a.lien ? `<a href="${esc(a.lien)}" target="_blank" rel="noopener">${esc(a.nom)} ↗</a>` : esc(a.nom)}</li>`).join('')}</ul>
              ${!links.length && !arts.length ? '<p class="muted small">Collez un lien Spotify ou YouTube dans la capture du mur : il apparaît ici, prêt à écouter.</p>' : ''}
            </section>
            <a class="panel evo-teaser" href="#/bilan">
              <h2>Notre bilan</h2>
              <div class="mini-stats"><div><b>${Math.floor(mins / 60)} h ${String(Math.round(mins % 60)).padStart(2, '0')}</b><span>jouées</span></div><div><b>${sessions.length}</b><span>sessions</span></div><div><b>${espace.entries.filter((e) => e.type === 'evaluation').length}</b><span>autoévaluations</span></div></div>
              <span class="btn small">Où on est rendus →</span>
            </a>
          </div>`;
        })()}
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
      if (a === 'set-secret') {
        try { await updateEspace({ secret: el.querySelector('[data-h=secret]').value }); toast('Mot secret actif.'); } catch (err) { toast(err.message); }
      }
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
    // On ne redessine que si ce que l'accueil montre a changé (un lecteur Spotify en cours ne repart pas à zéro).
    let lastSig = '';
    const sig = () => JSON.stringify([espace.meta, espace.me, espace.entries.filter((e) => e.type !== 'paroles').map((e) => [e.id, e.updatedAt]), espace.entries.filter((e) => e.type === 'paroles').map((e) => [e.id, e.data?.stage])]);
    const off = onEspace((what) => {
      if ((what === 'entries' || what === 'meta') && !editingVision && !el.querySelector('.setup')) {
        const now = sig();
        if (now !== lastSig || el.querySelector('.gate')) { lastSig = now; render(); }
      }
    });
    render();
    return () => off();
  },
};

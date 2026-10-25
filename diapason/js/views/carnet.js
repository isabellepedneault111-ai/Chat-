// Carnet partagé du duo : écrits, audios, bilans, évaluations, essais — un seul fil, synchronisé.
import { espace, onEspace, createEspace, joinEspace, leaveEspace, deleteEspace, updateEspace, saveEntry, deleteEntry, uploadAudio, audioURL } from '../espace.js';
import { toast, store } from '../ui.js';
import { CARNET_TYPES, BILAN_QUESTIONS, EVAL_CRITERES } from '../data.js';
import { MEMBERS, ROLES, memberColor, STAGES, PLAN, EVAL, NIVEAUX } from '../duo.js';
import { planContext, currentMonth } from '../plan.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function ago(t) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 45) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return new Date(t).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
}

// La porte : choisir qui on est (Zaza ou Frog), créer ou rejoindre l'espace.
// Réutilisée par toutes les vues qui ont besoin de l'espace.
export function espaceGate(host, { onReady } = {}) {
  const names = espace.meta?.members || MEMBERS;
  const who = (pre) => `
    <div class="who" role="group" aria-label="Qui es-tu?">
      ${names.map((n) => `<button class="who-btn ${pre === n ? 'on' : ''}" data-who="${esc(n)}" style="--c:${memberColor(n)}"><span>${esc(n)}</span><small>${esc(ROLES[n] || '')}</small></button>`).join('')}
    </div>`;
  if (espace.connected) {
    host.innerHTML = `
      <div class="gate"><div class="gate-card panel">
        <p class="tape">${esc(espace.meta.name)}</p>
        <h2>Qui es-tu?</h2>
        ${who()}
      </div></div>`;
  } else {
    host.innerHTML = `
      <div class="gate"><div class="gate-card panel">
        <p class="tape">Notre espace</p>
        <h2>Zaza × Frog</h2>
        <p>Un seul endroit pour nos idées, nos sessions, nos paroles et nos prises. Ce que l’un ajoute, l’autre le voit en quelques secondes.</p>
        <h3 class="gate-q">Qui es-tu?</h3>
        ${who(espace.me)}
        <div class="gate-actions">
          <div>
            <button class="btn primary" data-g="create">Créer notre espace</button>
            <p class="muted small">Une seule fois. Tu enverras ensuite le lien à l’autre.</p>
          </div>
          <div class="gate-or">ou</div>
          <div>
            <label class="field col"><span>Le lien reçu</span><input class="input" data-g="link" placeholder="Colle le lien ici"></label>
            <button class="btn" data-g="join">Rejoindre</button>
          </div>
        </div>
        <p class="fineprint">Pas de compte, pas de mot de passe : <b>le lien est la clé</b>. Garde-le entre vous deux.</p>
      </div></div>`;
  }
  let me = espace.me && names.includes(espace.me) ? espace.me : '';
  host.querySelector('.gate').addEventListener('click', async (e) => {
    const w = e.target.closest('[data-who]');
    if (w) {
      me = w.dataset.who;
      host.querySelectorAll('[data-who]').forEach((b) => b.classList.toggle('on', b === w));
      if (espace.connected) { espace.me = me; onReady?.(); import('./tour.js').then((t) => t.maybeTour()); }
      return;
    }
    const a = e.target.closest('[data-g]')?.dataset.g;
    if (a !== 'create' && a !== 'join') return;
    if (!me) { toast('Choisis d’abord : Zaza ou Frog?'); return; }
    espace.me = me;
    e.target.disabled = true;
    try {
      if (a === 'create') await createEspace('Zaza × Frog', me);
      else {
        const v = host.querySelector('[data-g=link]').value.trim();
        const id = (v.match(/rejoindre\/([A-Za-z0-9_-]{8,40})/) || v.match(/^([A-Za-z0-9_-]{8,40})$/) || [])[1];
        if (!id) throw new Error('Ce lien ne ressemble pas à un lien d’espace.');
        await joinEspace(id);
      }
      onReady?.();
      import('./tour.js').then((t) => t.maybeTour());
    } catch (err) {
      toast(err.status === 404 ? 'Espace introuvable : vérifie le lien.' : err.message || 'Connexion impossible pour l’instant.');
      e.target.disabled = false;
    }
  });
}

const BOARD_TYPES = new Set(['note', 'texte', 'audio', 'essai', 'paroles', 'lien']);
const URL_RE = /https?:\/\/[^\s<>"]+/i;
export function linkKind(url) {
  if (/open\.spotify\.com/.test(url)) return 'Spotify';
  if (/youtu\.?be/.test(url)) return 'YouTube';
  if (/soundcloud\.com/.test(url)) return 'SoundCloud';
  if (/bandcamp\.com/.test(url)) return 'Bandcamp';
  return 'Lien';
}
// Lecteur intégré quand le service le permet ; sinon un simple lien.
export function embedHTML(url) {
  let m = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
  if (m) return `<iframe class="embed spotify" src="https://open.spotify.com/embed/${m[1]}/${m[2]}" height="${m[1] === 'track' || m[1] === 'episode' ? 152 : 352}" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" title="Lecteur Spotify"></iframe>`;
  m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (m) return `<iframe class="embed yt" src="https://www.youtube-nocookie.com/embed/${m[1]}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Vidéo YouTube"></iframe>`;
  if (/soundcloud\.com/.test(url)) return `<iframe class="embed sc" height="166" loading="lazy" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23d93a24" title="Lecteur SoundCloud"></iframe>`;
  return '';
}
const stageOf = (e) => (e.data && Number.isInteger(e.data.stage) ? e.data.stage : e.type === 'paroles' ? 2 : 0);
const songOf = (e) => (e.type === 'paroles' ? (e.title || 'Sans titre') : e.data?.song || '');
export const allSongs = () => [...new Set(espace.entries.filter((e) => BOARD_TYPES.has(e.type)).map(songOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));

export default {
  id: 'carnet',
  mount(el) {
    let view = store.get('murView', 'etapes');
    let fSong = '';
    let fWho = '';
    let composing = null; // type du composeur complet ouvert, ou null
    let recorder = null;
    let pendingAudio = null;
    let openId = null;
    let detailVersion = 0;

    // Enregistre une modification d'entrée en fusionnant si l'autre a modifié entre-temps.
    async function patch(entry, change) {
      const next = { ...entry, data: { ...(entry.data || {}), ...change(entry.data || {}) } };
      const r = await saveEntry(next, { baseUpdatedAt: entry.updatedAt });
      if (r.conflict) {
        const cur = r.current;
        return saveEntry({ ...cur, data: { ...(cur.data || {}), ...change(cur.data || {}) } }, { baseUpdatedAt: cur.updatedAt });
      }
      return r;
    }

    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Le mur</p>
            <h1>Nos idées, et où elles s’en vont</h1>
            <p class="muted">Tu es <b style="color:${memberColor(espace.me)}">${esc(espace.me)}</b> · <span class="sync-state">synchronisé</span></p>
          </div>
          <div class="actions">
            <button class="btn" data-c="share">Inviter ${esc(other())}</button>
            <button class="btn ghost" data-c="settings" aria-expanded="false">Réglages</button>
          </div>
        </div>
        <div class="panel settings" hidden></div>

        <form class="capture panel" autocomplete="off">
          <input class="input capture-in" data-c="quick" placeholder="Une idée, un accord, un lien Spotify ou YouTube…" aria-label="Idée ou lien">
          <button class="btn primary" type="submit">Ajouter</button>
          <button class="btn rec" type="button" data-c="rec">● Mémo vocal</button>
          <label class="btn">Fichier<input type="file" accept="audio/*,video/*" data-c="file" hidden></label>
          <button class="btn bravo-btn" type="button" data-type="bravo">★ Bravo à ${esc(other())}</button>
          <button class="btn ghost" type="button" data-c="more">Bilan, évaluation…</button>
        </form>
        <div class="composer panel" hidden></div>

        <div class="direction"></div>

        <div class="mur-tools">
          <div class="seg-tabs" role="tablist" aria-label="Vue">
            <button role="tab" data-v="etapes">Étapes</button>
            <button role="tab" data-v="morceaux">Morceaux</button>
            <button role="tab" data-v="fil">Fil</button>
          </div>
          <div class="filters"></div>
          <input class="input search" type="search" placeholder="Chercher" aria-label="Chercher">
        </div>
        <div class="mur"></div>
        <div class="detail-scrim" hidden></div>
        <aside class="detail panel" hidden></aside>`;
      renderSettings();
      lastSig = '';
      renderAll(true);
    }
    const other = () => (espace.meta.members || MEMBERS).find((m) => m !== espace.me) || 'l’autre';

    function renderSettings() {
      const w = espace.meta.welcome || {};
      el.querySelector('.settings').innerHTML = `
        <h2>Réglages</h2>
        <div class="settings-grid">
          <div>
            <label class="field col"><span>Mot d’accueil pour ${esc(other())} (sa première visite)</span><textarea class="input" data-s="welcome" rows="3" placeholder="Forever more…">${esc(w.text || '')}</textarea></label>
            <div class="row">
              <label class="btn small">${w.audio ? 'Remplacer l’audio d’accueil' : 'Ajouter un audio d’accueil'}<input type="file" accept="audio/*" data-s="welcome-audio" hidden></label>
              <button class="btn small" data-c="rec-welcome">● L’enregistrer ici</button>
              ${w.audio ? '<span class="muted small">Audio prêt ✓</span>' : ''}
            </div>
            <button class="btn small ghost" data-c="tour">Voir la visite de ${esc(other())}</button>
          </div>
          <div>
            <label class="field col"><span>Lien de l’espace (garde-le précieusement)</span><input class="input mono" readonly value="${esc(espace.link)}"></label>
            <div class="row">
              <button class="btn" data-c="save-settings">Enregistrer</button>
              <button class="btn ghost" data-c="switch">Je ne suis pas ${esc(espace.me)}</button>
            </div>
            <div class="row">
              <button class="btn ghost" data-c="leave">Oublier sur cet appareil</button>
              <button class="btn danger" data-c="destroy">Tout effacer</button>
            </div>
          </div>
        </div>`;
    }

    function filtered() {
      const qv = (el.querySelector('.search')?.value || '').toLowerCase();
      return espace.entries.filter((e) => !['parcours', 'session', 'profil'].includes(e.type)
        && (!fWho || e.author === fWho)
        && (!fSong || (fSong === '—' ? !songOf(e) : songOf(e) === fSong))
        && (!qv || `${e.title} ${e.body} ${e.author} ${songOf(e)}`.toLowerCase().includes(qv)));
    }

    // Signature de ce qui est visible : si rien de visible n'a changé, on ne touche pas au DOM
    // (un lecteur intégré continue de jouer, une saisie n'est pas perdue).
    let lastSig = '';
    function renderAll(force) {
      if (!el.querySelector('.mur')) return;
      const sig = JSON.stringify([view, fWho, fSong, el.querySelector('.search')?.value, espace.meta.plan, filtered().map((e) => [e.id, e.title, e.author, e.data?.stage, e.data?.song, e.data?.replies?.length, e.audio?.id, e.type === 'paroles' ? '' : e.body])]);
      if (!force && sig === lastSig) return;
      lastSig = sig;
      el.querySelectorAll('[data-v]').forEach((b) => b.setAttribute('aria-selected', b.dataset.v === view));
      const songs = allSongs();
      const mem = espace.meta.members || MEMBERS;
      el.querySelector('.filters').innerHTML = `
        <button class="chip ${!fWho ? 'active' : ''}" data-fw="">Nous deux</button>
        ${mem.map((m) => `<button class="chip who-chip ${fWho === m ? 'active' : ''}" data-fw="${esc(m)}" style="--c:${memberColor(m)}">${esc(m)}</button>`).join('')}
        <span class="sep"></span>
        <button class="chip ${!fSong ? 'active' : ''}" data-fs="">Tous les morceaux</button>
        ${songs.map((s) => `<button class="chip ${fSong === s ? 'active' : ''}" data-fs="${esc(s)}">${esc(s)}</button>`).join('')}
        <button class="chip ${fSong === '—' ? 'active' : ''}" data-fs="—">Sans morceau</button>`;
      renderDirection();
      const list = filtered();
      const mur = el.querySelector('.mur');
      mur.className = `mur view-${view}`;
      if (view === 'fil') {
        mur.innerHTML = list.length ? `<ol class="feed">${list.map(fullHTML).join('')}</ol>` : emptyHTML();
        return;
      }
      const board = list.filter((e) => BOARD_TYPES.has(e.type));
      if (view === 'etapes') {
        mur.innerHTML = `<div class="board">${STAGES.map((st) => {
          const cards = board.filter((e) => stageOf(e) === st.id);
          return `<section class="board-col" data-stage="${st.id}"><header><b>${st.label}</b><span class="mono">${cards.length}</span></header><p class="col-hint">${st.hint}</p><div class="cards">${cards.map(cardHTML).join('')}</div></section>`;
        }).join('')}</div>`;
      } else {
        const groups = [...songs.filter((s) => !fSong || s === fSong), ...(!fSong || fSong === '—' ? ['—'] : [])];
        mur.innerHTML = `<div class="board songs">${groups.map((g) => {
          const cards = board.filter((e) => (g === '—' ? !songOf(e) : songOf(e) === g)).sort((a, b) => stageOf(b) - stageOf(a));
          const top = cards.length ? Math.max(...cards.map(stageOf)) : 0;
          return `<section class="board-col" data-song="${esc(g)}"><header><b>${g === '—' ? 'Sans morceau' : esc(g)}</b><span class="mono">${cards.length}</span></header>
            <div class="song-meter" title="Étape la plus avancée">${STAGES.map((st) => `<i class="${st.id <= top && cards.length ? 'on' : ''}"></i>`).join('')}</div>
            <div class="cards">${cards.map(cardHTML).join('')}</div></section>`;
        }).join('') || emptyHTML()}</div>`;
      }
    }

    // « Vers où ça nous mène » : l'entonnoir et l'objectif du mois.
    function renderDirection() {
      const box = el.querySelector('.direction');
      const board = espace.entries.filter((e) => BOARD_TYPES.has(e.type));
      const ctx = planContext();
      const m = currentMonth();
      const goal = m ? PLAN[m - 1] : null;
      const done = goal ? goal.mesure(ctx) : 0;
      box.innerHTML = `
        <div class="funnel">${STAGES.map((st) => { const n = board.filter((e) => stageOf(e) >= st.id).length; return `<div style="--n:${n}"><b>${n}</b><span>${st.label}</span></div>`; }).join('<i>→</i>')}</div>
        ${goal ? `<a class="month-goal" href="#/"><span class="mono">Mois ${m}</span> ${esc(goal.sortie)} <b>${Math.min(done, goal.cible)} / ${goal.cible}</b><i style="--p:${Math.min(100, Math.round((done / goal.cible) * 100))}"></i></a>` : '<a class="month-goal" href="#/">Lancer notre plan de six mois →</a>'}`;
    }

    function cardHTML(e) {
      const t = CARNET_TYPES.find((x) => x.id === e.type) || { label: e.type === 'paroles' ? 'Paroles' : e.type };
      const st = stageOf(e);
      const n = e.data?.replies?.length || 0;
      return `
        <article class="card-mini type-${e.type}" draggable="true" data-card="${e.id}" style="--c:${memberColor(e.author)}">
          <div class="cm-top"><span class="cm-type">${e.type === 'paroles' ? 'Paroles' : t.label}</span><span class="cm-who">${esc(e.author || '')}</span></div>
          <b class="cm-title">${esc(e.title || (e.body || '').slice(0, 60) || 'Sans titre')}</b>
          ${songOf(e) && view !== 'morceaux' ? `<span class="cm-song">${esc(songOf(e))}</span>` : ''}
          ${view === 'morceaux' ? `<span class="cm-song">${STAGES[st].label}</span>` : ''}
          <div class="cm-bottom">
            ${e.audio ? `<button class="icon-btn tiny" data-play="${e.id}" aria-label="Écouter">▶</button>` : ''}
            ${e.type === 'lien' ? `<a class="cm-link" href="${esc(e.data?.url || e.body)}" target="_blank" rel="noopener">${esc(e.data?.kind || 'Lien')} ↗</a>` : ''}
            ${n ? `<span class="cm-replies">${n} réponse${n > 1 ? 's' : ''}</span>` : ''}
            <span class="spacer"></span>
            <button class="icon-btn tiny" data-move="${e.id}:-1" aria-label="Étape précédente" ${st === 0 ? 'disabled' : ''}>←</button>
            <button class="icon-btn tiny" data-move="${e.id}:1" aria-label="Étape suivante" ${st === 4 ? 'disabled' : ''}>→</button>
          </div>
        </article>`;
    }

    function fullHTML(e) {
      const t = CARNET_TYPES.find((x) => x.id === e.type) || { label: e.type === 'paroles' ? 'Paroles' : e.type };
      let extra = '';
      if (e.type === 'bilan' && e.data?.answers) {
        extra = `<dl class="bilan">${BILAN_QUESTIONS.map((qq, i) => (e.data.answers[i] ? `<dt>${qq}</dt><dd>${esc(e.data.answers[i])}</dd>` : '')).join('')}${e.data.energie ? `<dt>Énergie</dt><dd>${'▮'.repeat(e.data.energie)}${'▯'.repeat(5 - e.data.energie)}</dd>` : ''}</dl>`;
      }
      if (e.type === 'evaluation' && e.data?.v === 2) {
        extra = `<ul class="eval-bars10">${EVAL.map((c) => (e.data.scores[c.id] ? `<li><span>${c.label}</span><i style="--v:${e.data.scores[c.id]}"></i><b class="mono">${e.data.scores[c.id]}</b></li>` : '')).join('')}</ul>${e.data.fierte ? `<p class="fierte">Fierté : ${esc(e.data.fierte)}</p>` : ''}`;
      }
      if (e.type === 'bravo') extra = `<p class="bravo-to">pour <b style="color:${memberColor(e.data?.to)}">${esc(e.data?.to || '')}</b></p>`;
      return `
        <li class="entry type-${e.type}" data-open="${e.id}" style="--c:${memberColor(e.author)}">
          <div class="entry-head">
            <span class="entry-type">${t.label}</span>
            <span class="entry-who"><b>${esc(e.author || '?')}</b> · ${ago(e.createdAt)}${songOf(e) ? ` · ${esc(songOf(e))}` : ''}</span>
          </div>
          ${e.title ? `<h3>${esc(e.title)}</h3>` : ''}
          ${e.audio ? `<div class="entry-audio" data-audio="${e.id}"><button class="btn small" data-play="${e.id}">▶ Écouter</button></div>` : ''}
          ${extra}
          ${e.type === 'lien' ? `${embedHTML(e.data?.url || e.body)}<a class="btn small" href="${esc(e.data?.url || e.body)}" target="_blank" rel="noopener">Ouvrir dans ${esc(e.data?.kind || 'le navigateur')} ↗</a>` : e.body ? `<div class="entry-body">${esc(e.body).replace(/\n/g, '<br>')}</div>` : ''}
          ${e.data?.replies?.length ? `<p class="muted small">${e.data.replies.length} réponse(s) · touche pour voir</p>` : ''}
        </li>`;
    }
    const emptyHTML = () => `<div class="empty-feed"><p><b>Le mur est vide… pour l’instant.</b></p><p class="muted">Lance une session : elle finit toujours par une prise, qui atterrit ici.</p><a class="btn primary" href="#/session">Lancer une session</a></div>`;

    // Fiche détaillée : tout le contenu, l'étape, le morceau, les réponses.
    function openDetail(id) {
      const e = espace.entries.find((x) => x.id === id);
      const d = el.querySelector('.detail');
      if (!e) { closeDetail(); return; }
      openId = id;
      detailVersion = e.updatedAt;
      const songs = allSongs();
      const mine = e.author === espace.me;
      d.innerHTML = `
        <div class="detail-head">
          <span class="entry-type">${e.type === 'paroles' ? 'Paroles' : (CARNET_TYPES.find((x) => x.id === e.type)?.label || e.type)}</span>
          <span class="entry-who"><b style="color:${memberColor(e.author)}">${esc(e.author)}</b> · ${ago(e.createdAt)}</span>
          <button class="icon-btn tiny" data-c="close" aria-label="Fermer">×</button>
        </div>
        <h2>${esc(e.title || 'Sans titre')}</h2>
        ${e.audio ? `<div class="entry-audio" data-audio="${e.id}"><button class="btn small" data-play="${e.id}">▶ Écouter</button></div>` : ''}
        ${e.audio && e.data?.markers?.length ? `<ol class="take-markers">${e.data.markers.map((m) => `<li><button class="btn small mono" data-seek="${e.id}:${m.t}">${Math.floor(m.t / 60)}:${String(Math.floor(m.t % 60)).padStart(2, '0')}</button><b style="color:${memberColor(m.by)}">${esc(m.by)}</b> ${esc(m.text)}</li>`).join('')}</ol>` : ''}
        ${e.type === 'lien' ? `${embedHTML(e.data?.url || e.body)}<a class="btn small" href="${esc(e.data?.url || e.body)}" target="_blank" rel="noopener">Ouvrir dans ${esc(e.data?.kind || 'le navigateur')} ↗</a>` : ''}
        ${e.body && e.type !== 'paroles' && e.type !== 'lien' ? `<div class="entry-body">${esc(e.body).replace(/\n/g, '<br>')}</div>` : ''}
        ${e.type === 'paroles' ? `<pre class="lyrics-preview">${esc(e.body || '')}</pre><a class="btn small" href="#/paroles/${e.id}">Ouvrir dans l’atelier</a>` : ''}
        ${BOARD_TYPES.has(e.type) ? `
        <div class="detail-fields">
          <label class="field col"><span>Étape</span><select data-d="stage">${STAGES.map((st) => `<option value="${st.id}" ${st.id === stageOf(e) ? 'selected' : ''}>${st.label}</option>`).join('')}</select></label>
          ${e.type !== 'paroles' ? `<label class="field col"><span>Morceau</span><select data-d="song"><option value="">— Aucun —</option>${songs.map((s) => `<option ${s === songOf(e) ? 'selected' : ''}>${esc(s)}</option>`).join('')}<option value="__new">+ Nouveau morceau…</option></select></label>` : ''}
        </div>` : ''}
        <h4>Réponses</h4>
        <ol class="replies">${(e.data?.replies || []).map((r) => `<li style="--c:${memberColor(r.by)}"><b>${esc(r.by)}</b> <span class="muted small">${ago(r.at)}</span><p>${esc(r.text)}</p></li>`).join('') || '<li class="muted small">Pas encore de réponse.</li>'}</ol>
        <form class="reply-form"><input class="input" data-d="reply" placeholder="Répondre à ${esc(e.author === espace.me ? other() : e.author)}…" aria-label="Réponse"><button class="btn small" type="submit">Envoyer</button></form>
        ${mine ? `<div class="row"><button class="btn small danger" data-del="${e.id}">Supprimer</button></div>` : ''}`;
      d.hidden = false;
      el.querySelector('.detail-scrim').hidden = false;
    }
    function closeDetail() {
      openId = null;
      el.querySelector('.detail').hidden = true;
      el.querySelector('.detail-scrim').hidden = true;
    }

    function openComposer(type) {
      composing = type;
      const box = el.querySelector('.composer');
      if (!type) { box.hidden = true; return; }
      box.hidden = false;
      const t = CARNET_TYPES.find((x) => x.id === type);
      let fields = '';
      if (type === 'bilan') {
        fields = BILAN_QUESTIONS.map((qq, i) => `<label class="field col"><span>${qq}</span><textarea class="input" data-b="${i}" rows="2"></textarea></label>`).join('')
          + `<div class="scale-row"><span>Énergie du duo</span>${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="energie" value="${n}"><span>${n}</span></label>`).join('')}</div>`;
      } else if (type === 'evaluation') {
        fields = `
          <div class="eval-mode-pick" role="group" aria-label="Qui évalue-t-on?">
            <button type="button" class="chip active" data-about="${esc(espace.me)}">Moi</button>
            <button type="button" class="chip" data-about="${esc(other())}">${esc(other())}</button>
            <button type="button" class="chip" data-about="duo">Nous deux</button>
          </div>
          <div class="sliders">${EVAL.map((c) => `
            <label class="slide"><span class="sl-top"><b>${c.label}</b><small>${c.aide}</small></span>
              <input type="range" min="1" max="10" value="5" data-score="${c.id}" style="--v:5">
              <span class="sl-val"><em class="mono">5</em><i>${NIVEAUX[5]}</i></span></label>`).join('')}</div>
          <label class="field col"><span>Ma fierté de la semaine</span><input class="input" data-e="fierte" maxlength="200" placeholder="Ex. : j’ai tenu le refrain sans forcer"></label>
          <label class="field col"><span>Un bravo pour ${esc(other())}</span><input class="input" data-e="bravo" maxlength="300" placeholder="Ce qu’il ou elle a fait de bien, précisément"></label>`;
      }
      box.innerHTML = `
        <div class="type-tabs" role="tablist">${CARNET_TYPES.filter((x) => x.id !== 'audio').map((x) => `<button role="tab" data-type="${x.id}" aria-selected="${x.id === type}">${x.label}</button>`).join('')}<button class="icon-btn tiny" data-c="close-composer" aria-label="Fermer">×</button></div>
        <p class="muted small">${t.aide}</p>
        <label class="field col"><span>Titre</span><input class="input" data-c="title" maxlength="200" placeholder="${t.placeholder}"></label>
        ${fields}
        <label class="field col"><span>${type === 'bilan' || type === 'evaluation' ? 'Commentaire' : 'Texte'}</span><textarea class="input" data-c="body" rows="${type === 'texte' ? 8 : 3}"></textarea></label>
        <div class="row"><button class="btn primary" data-c="post">Ajouter au mur</button></div>`;
    }

    async function postFull() {
      const box = el.querySelector('.composer');
      const title = box.querySelector('[data-c=title]').value.trim();
      const body = box.querySelector('[data-c=body]').value.trim();
      const entry = { type: composing, title, body, data: { stage: 0 } };
      if (composing === 'bilan') {
        entry.data = { answers: BILAN_QUESTIONS.map((_, i) => box.querySelector(`[data-b="${i}"]`).value.trim()), energie: +(box.querySelector('[name=energie]:checked')?.value || 0) };
        if (!title) entry.title = `Bilan du ${new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}`;
      }
      if (composing === 'evaluation') {
        const about = box.querySelector('[data-about].active')?.dataset.about || espace.me;
        entry.data = { v: 2, about, scores: Object.fromEntries([...box.querySelectorAll('[data-score]')].map((r) => [r.dataset.score, +r.value])), fierte: box.querySelector('[data-e=fierte]').value.trim() };
        if (!entry.title) entry.title = `${about === 'duo' ? 'Nous deux' : about} · ${new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}`;
      }
      if (composing === 'bravo') {
        entry.data = { to: other() };
        if (!entry.title) entry.title = `Bravo ${other()}!`;
      }
      if (!entry.title && !entry.body) { toast('Quelques mots d’abord!'); return; }
      try {
        await saveEntry(entry);
        const bravo = composing === 'evaluation' && box.querySelector('[data-e=bravo]').value.trim();
        if (bravo) await saveEntry({ type: 'bravo', title: `Bravo ${other()}!`, body: bravo, data: { to: other() } });
        toast(`Sur le mur. ${other()} le voit déjà.`);
        openComposer(null);
      } catch (err) { toast(err.message); }
    }

    async function postAudio(blob, title) {
      const st = el.querySelector('.capture');
      const btn = st.querySelector('[data-c=rec]');
      try {
        const audio = await uploadAudio(blob, (p) => { btn.textContent = `Envoi ${Math.round(p * 100)} %`; });
        await saveEntry({ type: 'audio', title: title || blob.name || `Mémo de ${espace.me}`, audio, data: { stage: 0, song: fSong && fSong !== '—' ? fSong : '' } });
        toast(`Mémo sur le mur. ${other()} peut l’écouter.`);
      } catch (err) { toast(err.message); }
      btn.textContent = '● Mémo vocal';
    }

    async function toggleRec(btn, onDone) {
      if (recorder) { recorder.stop(); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = [];
        recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          recorder = null;
          btn.classList.remove('on');
          onDone(blob);
        };
        recorder.start();
        btn.textContent = '■ Arrêter';
        btn.classList.add('on');
      } catch { toast('Micro refusé. Autorise-le dans la barre d’adresse.'); }
    }

    el.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (e.target.classList.contains('capture')) {
        const inp = e.target.querySelector('[data-c=quick]');
        const v = inp.value.trim();
        if (!v) return;
        inp.value = '';
        const url = (v.match(URL_RE) || [])[0];
        const label = url ? v.replace(url, '').trim() : '';
        const entry = url
          ? { type: 'lien', title: label || `${linkKind(url)} · ${new URL(url).hostname.replace('www.', '')}`, body: url, data: { url, kind: linkKind(url), stage: 0, song: fSong && fSong !== '—' ? fSong : '' } }
          : { type: 'note', title: v, data: { stage: 0, song: fSong && fSong !== '—' ? fSong : '' } };
        try { await saveEntry(entry); if (url) toast(`Lien partagé. ${other()} peut l’écouter.`); } catch (err) { toast(err.message); inp.value = v; }
      }
      if (e.target.classList.contains('reply-form')) {
        const inp = e.target.querySelector('[data-d=reply]');
        const v = inp.value.trim();
        const en = espace.entries.find((x) => x.id === openId);
        if (!v || !en) return;
        inp.value = '';
        await patch(en, (d) => ({ replies: [...(d.replies || []), { by: espace.me, at: Date.now(), text: v.slice(0, 2000) }] })).catch((err) => toast(err.message));
        openDetail(openId);
      }
    });

    el.addEventListener('click', async (e) => {
      const v = e.target.closest('[data-v]');
      if (v) { view = v.dataset.v; store.set('murView', view); renderAll(true); return; }
      const fw = e.target.closest('[data-fw]');
      if (fw) { fWho = fw.dataset.fw; renderAll(true); return; }
      const fs = e.target.closest('[data-fs]');
      if (fs) { fSong = fs.dataset.fs; renderAll(true); return; }
      const ab = e.target.closest('[data-about]');
      if (ab) { el.querySelectorAll('[data-about]').forEach((x) => x.classList.toggle('active', x === ab)); return; }
      const tt = e.target.closest('[data-type]');
      if (tt) { openComposer(tt.dataset.type); return; }
      const mv = e.target.closest('[data-move]');
      if (mv) {
        const [id, d] = mv.dataset.move.split(':');
        const en = espace.entries.find((x) => x.id === id);
        await patch(en, () => ({ stage: Math.max(0, Math.min(4, stageOf(en) + +d)) })).catch((err) => toast(err.message));
        return;
      }
      // Un repère de la prise : on charge l'audio au besoin, puis on saute au bon moment.
      const sk = e.target.closest('[data-seek]');
      if (sk) {
        const [id, t] = sk.dataset.seek.split(':');
        const en = espace.entries.find((x) => x.id === id);
        const box = el.querySelector(`.detail [data-audio="${id}"]`);
        try {
          let media = box?.querySelector('audio,video');
          if (!media && box) {
            box.innerHTML = `<audio controls src="${await audioURL(en.audio)}"></audio>`;
            media = box.querySelector('audio');
          }
          const go = () => { media.currentTime = Math.max(0, +t - 1); media.play().catch(() => {}); };
          if (media.readyState >= 1) go(); else media.addEventListener('loadedmetadata', go, { once: true });
        } catch (err) { toast(err.message); }
        return;
      }
      const pl = e.target.closest('[data-play]');
      if (pl) {
        const en = espace.entries.find((x) => x.id === pl.dataset.play);
        pl.textContent = '…';
        try {
          const url = await audioURL(en.audio);
          const box = pl.closest('[data-audio]');
          if (box) { box.innerHTML = en.audio.type?.startsWith('video') ? `<video controls playsinline src="${url}"></video>` : `<audio controls src="${url}"></audio>`; box.querySelector('audio,video').play().catch(() => {}); }
          else { const a = new Audio(url); a.play(); pl.textContent = '♪'; a.onended = () => { pl.textContent = '▶'; }; }
        } catch (err) { toast(err.message); pl.textContent = '▶'; }
        return;
      }
      const del = e.target.closest('[data-del]');
      if (del && confirm('Supprimer pour vous deux?')) { await deleteEntry(del.dataset.del).catch((err) => toast(err.message)); closeDetail(); return; }
      const card = e.target.closest('[data-card], [data-open]');
      if (card && !e.target.closest('button, a, audio, video')) { openDetail(card.dataset.card || card.dataset.open); return; }
      if (e.target.classList.contains('detail-scrim')) { closeDetail(); return; }
      const a = e.target.closest('[data-c]')?.dataset.c;
      if (a === 'close') closeDetail();
      if (a === 'more') openComposer(composing ? null : 'bilan');
      if (a === 'close-composer') openComposer(null);
      if (a === 'post') postFull();
      if (a === 'rec') toggleRec(e.target.closest('[data-c]'), (blob) => postAudio(blob));
      if (a === 'rec-welcome') toggleRec(e.target.closest('[data-c]'), async (blob) => {
        try {
          const audio = await uploadAudio(blob);
          await updateEspace({ welcome: { ...(espace.meta.welcome || {}), audio } });
          toast('Audio d’accueil enregistré.');
          renderSettings();
        } catch (err) { toast(err.message); }
      });
      if (a === 'tour') { const { startTour } = await import('./tour.js'); startTour(true); }
      if (a === 'share') {
        const text = `${other()}, voici notre espace : ${espace.link}`;
        if (navigator.share) navigator.share({ title: 'Zaza × Frog', text, url: espace.link }).catch(() => {});
        else { await navigator.clipboard?.writeText(espace.link); toast(`Lien copié : envoie-le à ${other()}.`); }
      }
      if (a === 'settings') {
        const s = el.querySelector('.settings');
        s.hidden = !s.hidden;
        e.target.setAttribute('aria-expanded', !s.hidden);
      }
      if (a === 'save-settings') {
        await updateEspace({ welcome: { ...(espace.meta.welcome || {}), text: el.querySelector('[data-s=welcome]').value.trim(), by: espace.me } }).catch((err) => toast(err.message));
        toast('Enregistré.');
      }
      if (a === 'switch') { espace.me = ''; render(); }
      if (a === 'leave' && confirm('Cet appareil oubliera l’espace. Garde le lien pour revenir!')) { leaveEspace(); render(); }
      if (a === 'destroy' && confirm('Effacer DÉFINITIVEMENT tout l’espace (idées, audios, paroles, plan) pour vous deux?')) {
        await deleteEspace().catch((err) => toast(err.message));
        render();
      }
    });

    el.addEventListener('change', async (e) => {
      if (e.target.dataset.c === 'file' && e.target.files[0]) postAudio(e.target.files[0], e.target.files[0].name.replace(/\.[^.]+$/, ''));
      if (e.target.dataset.s === 'welcome-audio' && e.target.files[0]) {
        try {
          const audio = await uploadAudio(e.target.files[0]);
          await updateEspace({ welcome: { ...(espace.meta.welcome || {}), audio } });
          toast('Audio d’accueil enregistré.');
          renderSettings();
        } catch (err) { toast(err.message); }
      }
      const en = openId && espace.entries.find((x) => x.id === openId);
      if (en && e.target.dataset.d === 'stage') await patch(en, () => ({ stage: +e.target.value })).catch((err) => toast(err.message));
      if (en && e.target.dataset.d === 'song') {
        let v = e.target.value;
        if (v === '__new') v = (prompt('Nom du nouveau morceau?') || '').trim().slice(0, 60);
        await patch(en, () => ({ song: v })).catch((err) => toast(err.message));
        openDetail(openId);
      }
    });
    el.addEventListener('input', (e) => {
      if (e.target.classList.contains('search')) renderAll();
      if (e.target.dataset.score) {
        const v = +e.target.value;
        e.target.style.setProperty('--v', v);
        const out = e.target.parentElement.querySelector('.sl-val');
        out.innerHTML = `<em class="mono">${v}</em><i>${NIVEAUX[v]}</i>`;
        out.classList.toggle('hot', v >= 9);
      }
    });

    // Glisser-déposer d'une carte vers une autre colonne (étape ou morceau).
    el.addEventListener('dragstart', (e) => { const c = e.target.closest('[data-card]'); if (c) { e.dataTransfer.setData('text/plain', c.dataset.card); c.classList.add('dragging'); } });
    el.addEventListener('dragend', (e) => e.target.closest?.('[data-card]')?.classList.remove('dragging'));
    el.addEventListener('dragover', (e) => { const col = e.target.closest('.board-col'); if (col) { e.preventDefault(); col.classList.add('over'); } });
    el.addEventListener('dragleave', (e) => e.target.closest?.('.board-col')?.classList.remove('over'));
    el.addEventListener('drop', async (e) => {
      const col = e.target.closest('.board-col');
      if (!col) return;
      e.preventDefault();
      col.classList.remove('over');
      const en = espace.entries.find((x) => x.id === e.dataTransfer.getData('text/plain'));
      if (!en) return;
      if (col.dataset.stage != null) await patch(en, () => ({ stage: +col.dataset.stage })).catch((err) => toast(err.message));
      if (col.dataset.song != null && en.type !== 'paroles') await patch(en, () => ({ song: col.dataset.song === '—' ? '' : col.dataset.song })).catch((err) => toast(err.message));
    });

    const offEsp = onEspace((what, extra) => {
      if (what === 'entries') {
        renderAll();
        const oe = openId && espace.entries.find((x) => x.id === openId);
        if (openId && (!oe || oe.updatedAt !== detailVersion)) openDetail(openId);
        extra?.fresh?.forEach((x) => toast(`${x.editedBy || x.author} : ${x.title || 'nouvelle entrée'}`));
      }
      if (what === 'online') {
        const s = el.querySelector('.sync-state');
        if (s) s.textContent = espace.online ? 'synchronisé' : 'hors ligne, on réessaie…';
      }
      if (what === 'meta' && (!el.querySelector('.mur') || !espace.connected)) render();
    });

    render();
    return () => { offEsp(); recorder?.stop(); };
  },
};

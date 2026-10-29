// Carnet partagé du duo : écrits, audios, bilans, évaluations, essais — un seul fil, synchronisé.
import { espace, onEspace, createEspace, joinEspace, findEspace, leaveEspace, deleteEspace, updateEspace, saveEntry, deleteEntry, uploadAudio, uploadImage, audioURL } from '../espace.js';
import { toast, store } from '../ui.js';
import { CARNET_TYPES, BILAN_QUESTIONS, EVAL_CRITERES } from '../data.js';
import { MEMBERS, ROLES, memberColor, STAGES, PLAN, EVAL, NIVEAUX } from '../duo.js';
import { planContext, currentMonth } from '../plan.js';
import { intentsHTML } from './relais.js';
import { impact } from '../impact.js';
import { jeter } from '../corbeille.js';
import { togglePerle } from './coffre.js';
import { projets, projetCourant, setProjet, projetNom, creerProjet } from '../projets.js';
import { skyHTML, rencontres, matches, kindOf, sleepingDays } from '../constellation.js';
import { ouvrirRencontre, nonMerci, refuser } from '../rencontre.js';
import { relanceHTML, brancherRelance } from '../relance.js';
import { avisHTML, avisDe } from '../ecoute.js';
import { creerChanson, nomsDeChansons, chansonNommee } from '../chanson.js';

// Échappe un texte avant de l’afficher dans la page : <, &, " et ' deviennent inoffensifs, pour qu’un mot tapé ne casse jamais l’affichage.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Une date dite comme on parle : « à l’instant », « il y a 5 min », « hier »…
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
        <h2>FLIP</h2>
        <p>Un seul endroit pour nos idées, nos sessions, nos paroles et nos prises. Ce que l’un ajoute, l’autre le voit en quelques secondes.</p>
        <h3 class="gate-q">Qui es-tu?</h3>
        ${who(espace.me)}
        <div class="gate-secret">
          <p class="gate-hint" data-g="hint">Votre espace existe déjà? Entre le mot secret du duo.</p>
          <div class="gate-row"><input class="input" data-g="secret" placeholder="Le mot secret" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn primary" data-g="find">Entrer</button></div>
          <details class="gate-link"><summary>J’ai plutôt un lien</summary>
            <div class="gate-row"><input class="input" data-g="link" placeholder="Colle le lien ici"><button class="btn" data-g="join">Rejoindre</button></div>
          </details>
        </div>
        <p class="gate-first">Première fois pour vous deux? <button class="btn ghost small" data-g="create">Créer notre espace</button></p>
        <p class="fineprint">Pas de compte, pas de mot de passe : <b>le lien est la clé</b>. Garde-le entre vous deux.</p>
      </div></div>`;
  }
  let me = espace.me && names.includes(espace.me) ? espace.me : '';
  host.querySelector('.gate').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.dataset.g === 'secret') host.querySelector('[data-g=find]').click();
  });
  host.querySelector('.gate').addEventListener('click', async (e) => {
    const w = e.target.closest('[data-who]');
    if (w) {
      me = w.dataset.who;
      host.querySelectorAll('[data-who]').forEach((b) => b.classList.toggle('on', b === w));
      const hint = host.querySelector('[data-g=hint]');
      if (hint) { hint.textContent = `${me}, entre le mot secret de votre duo : cet appareil rejoindra votre espace.`; host.querySelector('[data-g=secret]').focus(); }
      if (espace.connected) { espace.me = me; onReady?.(); import('./tour.js').then((t) => t.maybeTour()); }
      return;
    }
    const a = e.target.closest('[data-g]')?.dataset.g;
    if (a !== 'create' && a !== 'join' && a !== 'find') return;
    if (!me) { toast('Choisis d’abord : Zaza ou Frog?'); return; }
    espace.me = me;
    e.target.disabled = true;
    const label = e.target.textContent;
    if (a === 'find') e.target.textContent = 'Un instant…';
    try {
      if (a === 'create') {
        if (!confirm('Créer un NOUVEL espace? Si l’autre en a déjà créé un, entre plutôt son mot secret (sinon vous serez chacun dans le vôtre).')) { e.target.disabled = false; return; }
        await createEspace('FLIP', me);
      } else if (a === 'find') {
        await findEspace(host.querySelector('[data-g=secret]').value);
      } else {
        const v = host.querySelector('[data-g=link]').value.trim();
        const id = (v.match(/rejoindre\/([A-Za-z0-9_-]{8,40})/) || v.match(/^([A-Za-z0-9_-]{8,40})$/) || [])[1];
        if (!id) throw new Error('Ce lien ne ressemble pas à un lien d’espace.');
        await joinEspace(id);
      }
      onReady?.();
      import('./tour.js').then((t) => t.maybeTour());
    } catch (err) {
      e.target.textContent = label;
      toast(a === 'find' ? err.message : err.status === 404 ? 'Espace introuvable : vérifie le lien.' : err.message || 'Connexion impossible pour l’instant.');
      e.target.disabled = false;
    }
  });
}

const BOARD_TYPES = new Set(['note', 'texte', 'audio', 'essai', 'paroles', 'lien', 'image']);
const typeLabel = (e) => (e.data?.rencontre?.length === 2 ? 'Rencontre' : e.type === 'paroles' ? 'Paroles' : e.type === 'image' ? 'Image' : CARNET_TYPES.find((x) => x.id === e.type)?.label || e.type);
// Les images arrivent après le dessin : on les charge une fois, puis elles restent en cache.
export function hydrateImages(root) {
  root.querySelectorAll('[data-img]:not(.loaded)').forEach(async (box) => {
    const en = espace.entries.find((x) => x.id === box.dataset.img);
    if (!en?.image) return;
    box.classList.add('loaded');
    try { box.style.backgroundImage = `url("${await audioURL(en.image)}")`; } catch { box.classList.add('broken'); }
  });
}
const imgBox = (e, cls) => (e.image ? `<div class="${cls}" data-img="${esc(e.id)}" style="aspect-ratio:${e.image.w && e.image.h ? `${e.image.w} / ${e.image.h}` : '4 / 3'}" role="img" aria-label="${esc(e.title || 'Image')}"></div>` : '');
// Le journal et les séances d'atelier vivent dans « Écrire » ; on les envoie au mur d'un geste.
// Une rencontre notée mais jamais faite, dont un parent est jeté : elle ne peut plus se faire, elle ne s'affiche plus.
const renMorte = (e) => e.data?.rencontre?.length === 2 && e.type === 'note' && !e.audio && e.data.rencontre.some((id) => { const x = espace.entries.find((y) => y.id === id); return !x || x.data?.corbeille; });
const onBoard = (e) => BOARD_TYPES.has(e.type) && !e.data?.exemple && !((e.data?.journal || e.data?.atelier || e.data?.etincelle) && !e.data?.aumur) && !renMorte(e);
const URL_RE = /https?:\/\/[^\s<>"]+/i;
// Reconnaît d’où vient un lien (Spotify, YouTube, SoundCloud…) pour l’afficher avec le bon lecteur.
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
// Une idée vit quand on lui répond : couches et réponses au relais, réponses au mur, bravos.
const layersOf = (e) => espace.entries.filter((x) => x.id === e.id || x.data?.thread === (e.data?.thread || e.id)).length;
// Propose la prochaine idée à faire avancer sur le mur : celle qui a le plus d’élan (réponses, couches) sans être finie.
function nextStep(board) {
  const scored = board.filter((e) => stageOf(e) < 3 && e.type !== 'paroles').map((e) => {
    const layers = e.data?.relais ? layersOf(e) - 1 : 0;
    const replies = e.data?.replies?.length || 0;
    const perle = e.data?.perle ? 1 : 0;
    const score = layers * 2 + replies + perle * 2 + (stageOf(e) ? 0.5 : 0);
    const why = [layers ? `${layers} réponse${layers > 1 ? 's' : ''} au relais` : '', replies ? `${replies} commentaire${replies > 1 ? 's' : ''}` : '', perle ? 'elle est au coffre' : ''].filter(Boolean).join(', ');
    return { e, score, why };
  }).filter((x) => x.score >= 1).sort((a, b) => b.score - a.score);
  return scored[0] || null;
}
const stageOf = (e) => (e.data && Number.isInteger(e.data.stage) ? e.data.stage : e.type === 'paroles' ? 2 : 0);
const songOf = (e) => (e.type === 'paroles' ? (e.title || 'Sans titre') : e.data?.song || '');
// Un morceau, c'est un nom partagé par des idées du mur… ou une chanson montée au studio, même encore vide.
export const allSongs = () => [...new Set([...espace.entries.filter(onBoard).map(songOf), ...nomsDeChansons()].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));

export default {
  id: 'carnet',
  mount(el) {
    let view = store.get('murVue', 'ciel');
    let fSong = '';
    let fWho = '';
    let fKind = '';
    let fWhen = '';
    let seed = 0; // « D'autres rencontres » fait tourner le ciel
    let focus = ''; // la rencontre mise en lumière
    let pairs = [];
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

    // Une idée change d'étape : on garde la trace (elle s'inscrit sur Notre route) et on montre ce que ça fait bouger.
    async function setStage(en, stage) {
      const from = stageOf(en);
      if (stage === from) return;
      const before = planContext();
      await patch(en, (d) => ({ stage, moves: [...(d.moves || []), { from, to: stage, at: Date.now(), by: espace.me }].slice(-20) })).catch((err) => toast(err.message));
      if (stage > from) impact(en, from, stage, before);
    }

    // Dessine toute la page du mur : la capture rapide, les filtres, la carte des idées et le détail ouvert.
    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Le mur${projetCourant() ? ` · ${esc(projetNom(projetCourant()))}` : ''}</p>
            <h1>${projetCourant() ? esc(projetNom(projetCourant())) : 'Nos idées, et où elles s’en vont'}</h1>
            <p class="muted">Tu es <b style="color:${memberColor(espace.me)}">${esc(espace.me)}</b> · <span class="sync-state">synchronisé</span></p>
          </div>
          <div class="actions">
            <button class="icon-btn" data-c="settings" aria-expanded="false" aria-label="Réglages, inviter, lexique" title="Réglages, inviter, lexique"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg></button>
          </div>
        </div>
        <div class="panel settings" hidden></div>

        <form class="capture panel" autocomplete="off">
          <input class="input capture-in" data-c="quick" placeholder="Une idée, un accord, un lien Spotify ou YouTube…" aria-label="Idée ou lien">
          <button class="btn primary" type="submit">Ajouter</button>
          <div class="cap-vite" role="group" aria-label="Ajouter autre chose">
            <button class="icon-btn" type="button" data-c="rec" title="Un mémo vocal" aria-label="Un mémo vocal"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
            <label class="icon-btn" title="Un fichier audio" aria-label="Un fichier audio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg><input type="file" accept="audio/*,video/*" data-c="file" hidden></label>
            <label class="icon-btn" title="Une image : photo, dessin, toile" aria-label="Une image"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-6-6-9 9"/></svg><input type="file" accept="image/*" data-c="image" multiple hidden></label>
            <button class="icon-btn" type="button" data-type="bravo" title="Un bravo à ${esc(other())}" aria-label="Un bravo à ${esc(other())}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg></button>
            <button class="icon-btn" type="button" data-c="more" title="Un bilan, une évaluation…" aria-label="Un bilan, une évaluation"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6" class="fill"/><circle cx="12" cy="12" r="1.6" class="fill"/><circle cx="19" cy="12" r="1.6" class="fill"/></svg></button>
          </div>
        </form>
        <div class="composer panel" hidden></div>

        <div class="direction"></div>

        <div class="mur-tools">
          <div class="seg-tabs" role="tablist" aria-label="Vue">
            <button role="tab" data-v="ciel">Le ciel</button>
            <button role="tab" data-v="etapes">Étapes</button>
            <button role="tab" data-v="morceaux">Morceaux</button>
            <button role="tab" data-v="fil">Fil</button>
          </div>
          <input class="input search" type="search" placeholder="Retrouver : un mot, un accord, un nom…" aria-label="Retrouver une idée">
          <button class="btn small" type="button" data-c="filtrer" aria-expanded="false">Filtrer<span class="f-n"></span></button>
        </div>
        <div class="filters" hidden></div>
        <div class="mur"></div>
        <div class="detail-scrim" hidden></div>
        <aside class="detail panel" hidden></aside>`;
      renderSettings();
      lastSig = '';
      renderAll(true);
      // Arrivé depuis Nos nouvelles (« ?voir=… ») : la fiche de l'idée s'ouvre tout de suite.
      const voir = (location.hash.match(/[?&]voir=([\w-]+)/) || [])[1];
      if (voir && espace.entries.some((x) => x.id === voir)) setTimeout(() => openDetail(voir), 50);
    }
    const other = () => (espace.meta.members || MEMBERS).find((m) => m !== espace.me) || 'l’autre';

    // Le panneau des réglages de l’espace : le nom, le mot d’accueil, le mot secret.
    function renderSettings() {
      const w = espace.meta.welcome || {};
      setTimeout(() => relanceHTML().then((h) => { const x = el.querySelector('.settings .relance-host'); if (x) x.innerHTML = h; }), 0);
      el.querySelector('.settings').innerHTML = `
        <h2>Réglages</h2>
        <p class="row"><button class="btn small" data-c="share">Inviter ${esc(other())}</button><a class="btn small ghost" href="#/lexique">Notre lexique</a></p>
        <div class="relance-host"></div>
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
            <label class="field col"><span>Mot secret du duo ${espace.meta.hasSecret ? '<b class="ok-mark">· choisi ✓</b>' : ''}</span><input class="input" data-s="secret" placeholder="${espace.meta.hasSecret ? 'Nouveau mot secret (laisser vide pour garder l’actuel)' : 'Ex. : bell'}" autocomplete="off"></label>
            <p class="muted small">${esc(other())} va sur l’adresse normale du site, choisit son nom et tape ce mot : il entre dans votre espace, et sa visite démarre. 4 lettres minimum.</p>
            <button class="btn small" data-c="secret">Enregistrer le mot secret</button>
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

    // withQuery = false : le ciel garde toutes les idées et met seulement en lumière celles qu'on cherche.
    // « Pas pour moi » : l'idée quitte mon mur (l'autre la voit encore). On peut les revoir d'un clic.
    let voirEcartees = false;
    const ecartees = () => espace.entries.filter((e) => avisDe(e, espace.me) === 'non' && !e.data?.corbeille && onBoard(e));
    function filtered(withQuery = true) {
      const qv = withQuery ? (el.querySelector('.search')?.value || '') : '';
      const since = { semaine: 7, mois: 31 }[fWhen];
      return espace.entries.filter((e) => !['parcours', 'session', 'profil'].includes(e.type)
        && (!projetCourant() || e.data?.projet === projetCourant())
        && (!fWho || e.author === fWho)
        && (!fSong || (fSong === '—' ? !songOf(e) : songOf(e) === fSong))
        && (!fKind || kindOf(e) === fKind)
        && (!since || Date.now() - e.createdAt < since * 864e5) && (fWhen !== 'dort' || sleepingDays(e) >= 21)
        && (voirEcartees || avisDe(e, espace.me) !== 'non')
        && matches(e, qv));
    }

    // Signature de ce qui est visible : si rien de visible n'a changé, on ne touche pas au DOM
    // (un lecteur intégré continue de jouer, une saisie n'est pas perdue).
    let lastSig = '';
    // Redessine les idées du mur seulement si quelque chose a vraiment changé (filtres, idées, recherche) : le mur reste fluide.
    function renderAll(force) {
      if (!el.querySelector('.mur')) return;
      const sig = JSON.stringify([view, fWho, fSong, fKind, fWhen, seed, focus, innerWidth < 700, el.querySelector('.search')?.value, espace.meta.plan, filtered(view !== 'ciel').map((e) => [e.id, e.title, e.author, e.data?.stage, e.data?.song, e.data?.replies?.length, e.data?.perle, e.audio?.id, e.image?.id, e.type === 'paroles' ? '' : e.body])]);
      if (!force && sig === lastSig) return;
      lastSig = sig;
      el.querySelectorAll('[data-v]').forEach((b) => b.setAttribute('aria-selected', b.dataset.v === view));
      const songs = allSongs();
      const mem = espace.meta.members || MEMBERS;
      const nf = [fWho, fSong, fKind, fWhen, projetCourant()].filter(Boolean).length;
      const fn = el.querySelector('.f-n'); if (fn) fn.textContent = nf ? ` · ${nf}` : '';
      el.querySelector('.filters').innerHTML = `
        <label class="projet-sel"><span>Projet</span><select data-projet><option value="">Tous nos projets</option>${projets().map((p) => `<option value="${esc(p.id)}" ${p.id === projetCourant() ? 'selected' : ''}>${esc(p.nom)}</option>`).join('')}<option value="+">+ Nouveau projet…</option></select></label>
        <select class="input f-sel" data-fsel="who" aria-label="De qui"><option value="">Nous deux</option>${mem.map((m) => `<option ${fWho === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>
        <select class="input f-sel" data-fsel="song" aria-label="Morceau"><option value="">Tous les morceaux</option>${songs.map((x) => `<option ${fSong === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}<option value="—" ${fSong === '—' ? 'selected' : ''}>Sans morceau</option></select>
        <select class="input f-sel" data-fsel="kind" aria-label="Quoi"><option value="">Sons, mots, images</option>${[['son', 'Des sons'], ['mots', 'Des mots'], ['image', 'Des images'], ['lien', 'Des écoutes']].map(([v, l]) => `<option value="${v}" ${fKind === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <select class="input f-sel" data-fsel="when" aria-label="Quand"><option value="">Depuis toujours</option>${[['semaine', 'Cette semaine'], ['mois', 'Ce mois-ci'], ['dort', 'Celles qui dorment']].map(([v, l]) => `<option value="${v}" ${fWhen === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
      renderDirection();
      const list = filtered();
      const mur = el.querySelector('.mur');
      mur.className = `mur view-${view}`;
      if (view === 'fil') {
        mur.innerHTML = list.length ? `<ol class="feed">${list.map(fullHTML).join('')}</ol>` : emptyHTML();
        hydrateImages(mur);
        return;
      }
      if (view === 'ciel') { renderSky(mur); hydrateImages(mur); return; }
      const board = list.filter(onBoard);
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
          const ch = g !== '—' && chansonNommee(g);
          return `<section class="board-col" data-song="${esc(g)}"><header><b>${g === '—' ? 'Sans morceau' : esc(g)}</b><span class="mono">${cards.length}</span></header>
            <div class="song-meter" title="Étape la plus avancée">${STAGES.map((st) => `<i class="${st.id <= top && cards.length ? 'on' : ''}"></i>`).join('')}</div>
            ${ch ? `<a class="ch-lien" href="#/studio?tab=chanson&ch=${esc(ch.id)}">♫ Ses parties et ses accords →</a>` : g !== '—' ? `<button class="linklike ch-lien" data-c="song-accords" data-nom="${esc(g)}">♫ Lui donner des parties et des accords</button>` : ''}
            <div class="cards">${cards.map(cardHTML).join('') || (g !== '—' ? '<p class="col-hint">Encore aucune idée. Ouvre une idée du mur et choisis ce morceau.</p>' : '')}</div></section>`;
        }).join('')}
          <section class="board-col ch-new"><header><b>Un nouveau morceau</b></header>
            <div class="ch-new-f"><input class="input" data-c-nom placeholder="Son nom (ex. : Fleuve gelé)" maxlength="60" aria-label="Nom du nouveau morceau"><button type="button" class="btn small primary" data-c="song-creer">Créer</button></div>
            <p class="col-hint">Il naît avec un couplet et un refrain, dans Jouer. Ensuite, chaque idée du mur peut le rejoindre (ouvre-la : « Morceau »).</p></section></div>`;
      }
      hydrateImages(mur);
    }

    // Le ciel : retrouver (on cherche, ça s'allume) et provoquer (des rencontres que personne n'a encore faites).
    function renderSky(mur) {
      const qv = el.querySelector('.search')?.value || '';
      const sky = filtered(false).filter(onBoard);
      if (!sky.length) { mur.innerHTML = emptyHTML(); return; }
      pairs = rencontres(sky, { seed: seed + Math.floor(Date.now() / 864e5), non: nonMerci() });
      const found = qv ? sky.filter((e) => matches(e, qv)) : [];
      const dorment = sky.filter((e) => stageOf(e) < 3 && sleepingDays(e) >= 21).sort((a, b) => a.updatedAt - b.updatedAt).slice(0, 3);
      const idea = (x) => `<button class="ren-idea" data-open-id="${esc(x.id)}" style="--c:${memberColor(x.author)}"><small>${esc(x.author)} · ${esc(STAGES[stageOf(x)].label)}</small>${esc(x.title || 'Sans titre')}</button>`;
      const mem = espace.meta.members || MEMBERS;
      mur.innerHTML = `<div class="sky">
        <div class="sky-map">
          ${skyHTML(sky, { query: qv, pairs, focus, narrow: innerWidth < 700 })}
          <p class="sky-legend"><span><i class="lg z"></i>${esc(mem[0])}</span><span><i class="lg f"></i>${esc(mem[1])}</span><span><i class="lg son"></i>un son</span><span><i class="lg lien"></i>une écoute</span><span><i class="lg img"></i>une image</span><span>✦ au coffre</span><span><i class="lg pair"></i>une rencontre possible</span></p>
          ${qv ? `<p class="sky-found">${found.length ? `${found.length} idée${found.length > 1 ? 's' : ''} retrouvée${found.length > 1 ? 's' : ''} : ${found.slice(0, 5).map((x) => `<button class="linklike" data-open-id="${esc(x.id)}">« ${esc(x.title || 'Sans titre')} »</button>`).join(', ')}` : 'Rien encore avec ces mots. Essaie un accord, un nom, un mot du texte.'}</p>` : ''}
        </div>
        <aside class="sky-side">
          <h2 class="sky-h">Rencontres possibles</h2>
          <p class="muted small">Seulement des paires qui ont une raison de se croiser. « Les faire se rencontrer » ouvre l’exercice ici même (chanter, enchaîner, tresser) ; ce qui en naît va au mur avec ses deux parents. Rien ne s’ajoute tant que rien n’est fait.</p>
          ${pairs.map((p, i) => `
            <article class="ren${focus === String(i) ? ' on' : ''}" data-ren-i="${i}">
              <div class="ren-pair">${idea(p.a)}<span class="ren-x" aria-hidden="true">×</span>${idea(p.b)}</div>
              <p class="ren-why">${esc(p.why.join(' · '))}</p>
              <p class="ren-do">${esc(p.consigne)}</p>
              <div class="ren-acts"><button class="btn small primary" data-ren="${i}">Les faire se rencontrer</button><button class="btn small ghost" data-ren-non="${i}">Pas pour nous</button>${p.a.image || p.b.image ? `<a class="btn small" href="#/studio?tab=cover&img=${esc((p.a.image ? p.a : p.b).id)}&avec=${esc((p.a.image ? p.b : p.a).id)}">En faire une pochette</a>` : ''}</div>
            </article>`).join('') || '<p class="muted small">Aucune paire n’a de vraie raison de se croiser en ce moment. Le ciel en proposera quand un mot, une tonalité ou une idée qui dort les reliera.</p>'}
          ${pairs.length ? '<button class="linklike" data-c="ren-next">D’autres rencontres ↻</button>' : ''}
          ${dorment.length ? `<h2 class="sky-h">Elles dorment</h2><p class="muted small">Pas touchées depuis trois semaines ou plus. Une écoute suffit parfois à les réveiller.</p><div class="sky-dort">${dorment.map(idea).join('')}</div>` : ''}
        </aside>
      </div>`;
    }

    // La rencontre se fait dans l'atelier : rien n'arrive au mur tant que rien n'en est né.
    function meet(p, existant = null) {
      if (p.a.demo || p.b.demo) { toast('C’est un exemple : avec vos vraies idées, l’atelier de la rencontre s’ouvre ici.'); return; }
      ouvrirRencontre({ a: p.a, b: p.b, consigne: p.consigne, existant, onFait: (en) => { focus = ''; renderAll(true); if (en?.id) openDetail(en.id); } });
    }

    // « Vers où ça nous mène » : l'entonnoir et l'objectif du mois.
    function renderDirection() {
      const box = el.querySelector('.direction');
      const board = espace.entries.filter(onBoard);
      const ctx = planContext();
      const m = currentMonth();
      const goal = m ? PLAN[m - 1] : null;
      const done = goal ? goal.mesure(ctx) : 0;
      const next = nextStep(board);
      box.innerHTML = `<div class="dir-line">
        ${goal ? `<span class="dir-goal">Mois ${m} · ${esc(goal.sortie)} <b>${Math.min(done, goal.cible)} / ${goal.cible}</b></span>` : '<a href="#/">Lancer notre plan de six mois →</a>'}
        ${ecartees().length ? `<button class="linklike" data-c="ecartees">${voirEcartees ? 'Cacher' : 'Revoir'} ${ecartees().length > 1 ? `les ${ecartees().length} idées que tu as écartées` : 'l’idée que tu as écartée'}</button>` : ''}
        ${next ? `<span class="dir-next">Prochain pas : <b>« ${esc(next.e.title || 'Sans titre')} »</b> a de la vie (${esc(next.why)}). <button class="linklike strong" data-promote="${esc(next.e.id)}">La faire monter →</button></span>` : ''}
      </div>`;
    }

    // La petite carte d’une idée sur le mur : son type, son étape, son titre, ses réponses.
    function cardHTML(e) {
      const t = CARNET_TYPES.find((x) => x.id === e.type) || { label: e.type === 'paroles' ? 'Paroles' : e.type };
      const st = stageOf(e);
      const n = e.data?.replies?.length || 0;
      return `
        <article class="card-mini type-${e.type}" draggable="true" data-card="${e.id}" style="--c:${memberColor(e.author)}">
          <div class="cm-top"><span class="cm-type">${typeLabel(e)}${!projetCourant() && e.data?.projet && projetNom(e.data.projet) ? ` · ${esc(projetNom(e.data.projet))}` : ''}</span><span class="cm-who">${esc(e.author || '')}</span></div>
          ${imgBox(e, 'cm-img')}
          <b class="cm-title">${esc(e.title || (e.body || '').slice(0, 60) || 'Sans titre')}</b>
          ${e.data?.relais ? `<div class="cm-intents">${intentsHTML(e)}${layersOf(e) > 1 ? `<span class="cm-layers">${layersOf(e)} couches</span>` : ''}</div>` : ''}
          ${songOf(e) && view !== 'morceaux' ? `<span class="cm-song">${esc(songOf(e))}</span>` : ''}
          ${view === 'morceaux' ? `<span class="cm-song">${STAGES[st].label}</span>` : ''}
          ${st === 1 ? avisHTML(e, { court: true }) : ''}
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

    // Le détail complet d’une idée : son contenu, son son, son image, ses réponses, et les gestes pour la faire avancer.
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
            <span class="entry-type">${typeLabel(e)}</span>
            <span class="entry-who"><b>${esc(e.author || '?')}</b> · ${ago(e.createdAt)}${songOf(e) ? ` · ${esc(songOf(e))}` : ''}</span>
          </div>
          ${e.title ? `<h3>${esc(e.title)}</h3>` : ''}
          ${imgBox(e, 'entry-img')}
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
          <span class="entry-type">${typeLabel(e)}</span>
          <span class="entry-who"><b style="color:${memberColor(e.author)}">${esc(e.author)}</b> · ${ago(e.createdAt)}</span>
          <button class="icon-btn tiny" data-c="close" aria-label="Fermer">×</button>
        </div>
        <h2>${esc(e.title || 'Sans titre')}</h2>
        ${originHTML(e)}
        ${imgBox(e, 'detail-img')}
        ${e.audio ? `<div class="entry-audio" data-audio="${e.id}"><button class="btn small" data-play="${e.id}">▶ Écouter</button></div>` : ''}
        ${e.audio && e.data?.markers?.length ? `<ol class="take-markers">${e.data.markers.map((m) => `<li><button class="btn small mono" data-seek="${e.id}:${m.t}">${Math.floor(m.t / 60)}:${String(Math.floor(m.t % 60)).padStart(2, '0')}</button><b style="color:${memberColor(m.by)}">${esc(m.by)}</b> ${esc(m.text)}</li>`).join('')}</ol>` : ''}
        ${e.type === 'lien' ? `${embedHTML(e.data?.url || e.body)}<a class="btn small" href="${esc(e.data?.url || e.body)}" target="_blank" rel="noopener">Ouvrir dans ${esc(e.data?.kind || 'le navigateur')} ↗</a>` : ''}
        ${e.body && e.type !== 'paroles' && e.type !== 'lien' ? `<div class="entry-body">${esc(e.body).replace(/\n/g, '<br>')}</div>` : ''}
        ${e.type === 'paroles' ? `<pre class="lyrics-preview">${esc(e.body || '')}</pre><a class="btn small" href="#/paroles/${e.id}">Ouvrir dans l’atelier</a>` : ''}
        ${BOARD_TYPES.has(e.type) ? `
        <div class="detail-fields">
          <label class="field col"><span>Étape</span><select data-d="stage">${STAGES.map((st) => `<option value="${st.id}" ${st.id === stageOf(e) ? 'selected' : ''}>${st.label}</option>`).join('')}</select></label>
          ${e.type !== 'paroles' ? `<label class="field col"><span>Morceau</span><select data-d="song"><option value="">— Aucun —</option>${songs.map((s) => `<option ${s === songOf(e) ? 'selected' : ''}>${esc(s)}</option>`).join('')}<option value="__new">+ Nouveau morceau…</option></select></label>` : ''}
        </div>${stageOf(e) <= 1 ? avisHTML(e) : ''}` : ''}
        <h4>Réponses</h4>
        <ol class="replies">${(e.data?.replies || []).map((r) => `<li style="--c:${memberColor(r.by)}"><b>${esc(r.by)}</b> <span class="muted small">${ago(r.at)}</span><p>${esc(r.text)}</p></li>`).join('') || '<li class="muted small">Pas encore de réponse.</li>'}</ol>
        <form class="reply-form"><input class="input" data-d="reply" placeholder="Répondre à ${esc(e.author === espace.me ? other() : e.author)}…" aria-label="Réponse"><button class="btn small" type="submit">Envoyer</button></form>
        ${e.image && !e.data?.pochette ? `<a class="btn small" href="#/studio?tab=cover&img=${esc(e.id)}">En faire une pochette</a>` : ''}
        <div class="row"><button class="btn small" data-perle="${esc(e.id)}">${e.data?.perle ? 'Dans le coffre ✦ (l’en sortir)' : '✦ Au coffre'}</button>${mine ? `<button class="btn small danger" data-del="${e.id}">Supprimer</button>` : ''}</div>
        <p class="muted small">Le coffre garde une étoile sur l’idée : elle reste ici, à sa place.</p>`;
      d.hidden = false;
      el.querySelector('.detail-scrim').hidden = false;
      hydrateImages(d);
    }
    // D'où vient une idée, et ce qu'elle a fait naître : on remonte le fil sans jamais se perdre.
    function originHTML(e) {
      const t = (id) => { const x = espace.entries.find((y) => y.id === id); return x && !x.data?.corbeille ? `<button class="linklike" data-open-id="${esc(id)}">« ${esc(x.title || 'Sans titre')} »</button>` : 'une idée jetée depuis'; };
      const enfants = espace.entries.filter((x) => x.data?.rencontre?.includes(e.id));
      // Une rencontre notée mais jamais faite (une simple note, sans son) : on peut enfin la faire.
      const vide = e.data?.rencontre?.length === 2 && e.type === 'note' && !e.audio && e.data.rencontre.every((id) => { const x = espace.entries.find((y) => y.id === id); return x && !x.data?.corbeille; });
      return `${e.data?.rencontre?.length === 2 ? `<p class="ren-origin">${vide ? 'Rencontre notée, pas encore faite' : 'Née de la rencontre'} de ${t(e.data.rencontre[0])} et ${t(e.data.rencontre[1])}.${vide ? ` <button class="btn small primary" data-ren-faire="${esc(e.id)}">Faire la rencontre</button>` : ''}</p>` : ''}${enfants.length ? `<p class="ren-origin">A fait naître ${enfants.map((x) => t(x.id)).join(', ')}.</p>` : ''}`;
    }
    // Ferme le détail d’une idée.
    function closeDetail() {
      openId = null;
      el.querySelector('.detail').hidden = true;
      el.querySelector('.detail-scrim').hidden = true;
    }

    // Ouvre le formulaire pour ajouter une idée d’un type donné (note, texte, son, lien, image).
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

    // Publie l’idée écrite dans le formulaire sur le mur.
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

    // Envoie un son enregistré sur le serveur, puis le publie comme idée sur le mur.
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

    // Notre art sur le mur : une photo, un dessin, une toile. Elle entre comme idée brute et peut monter d'étape.
    async function postImage(file) {
      if (!file?.type?.startsWith('image/')) return;
      toast('Envoi de l’image…');
      try {
        const image = await uploadImage(file);
        const inp = el.querySelector('[data-c=quick]');
        const words = inp?.value.trim();
        if (inp) inp.value = '';
        await saveEntry({ type: 'image', title: words || (file.name && !/^image\.|^IMG_|^\d/.test(file.name) ? file.name.replace(/\.[^.]+$/, '') : `Image de ${espace.me}`), image, data: { stage: 0, song: fSong && fSong !== '—' ? fSong : '' } });
        toast(`Sur le mur. ${other()} la voit déjà.`);
      } catch (err) { toast(err.message || 'Image impossible à lire.'); }
    }
    // Coller une image (capture d'écran, photo copiée) ou la glisser sur la barre d'ajout.
    el.addEventListener('paste', (e) => {
      if (!e.target.closest('.capture')) return;
      const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
      if (f) { e.preventDefault(); postImage(f); }
    });

    // Démarre ou arrête l’enregistrement au micro pour une idée sonore.
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
        try { await saveEntry(entry); toast(url ? `Lien ajouté au mur, en « Idée brute ». ${other()} peut l’écouter.` : `« ${v.slice(0, 40)} » est au mur, en « Idée brute ». ${other()} la voit déjà.`); } catch (err) { toast(err.message); inp.value = v; }
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

    brancherRelance(el, () => renderSettings(), toast); // la relance douce, dans les réglages
    el.addEventListener('click', async (e) => {
      const v = e.target.closest('[data-v]');
      if (v) { view = v.dataset.v; store.set('murVue', view); renderAll(true); return; }
      const oid = e.target.closest('[data-open-id]');
      if (oid) { openDetail(oid.dataset.openId); return; }
      const av = e.target.closest('[data-avis]');
      if (av) {
        const [id, v] = av.dataset.avis.split(':'); const en = espace.entries.find((x) => x.id === id); if (!en) return;
        av.disabled = true;
        const r = await patch(en, (d) => ({ avis: { ...(d.avis || {}), [espace.me]: { v, at: Date.now() } } })).catch((err) => { toast(err.message); return null; });
        if (v !== 'non') { openDetail(en.id); return; }
        // Pas pour moi : elle décrisse de mon mur. Si l'autre a dit la même chose, elle va à la corbeille (récupérable).
        closeDetail();
        const maj = r?.entry || espace.entries.find((x) => x.id === id) || en;
        if (avisDe(maj, other()) === 'non') await jeter(maj).catch((err) => toast(err.message));
        else toast(`Partie de ton mur. ${other()} la voit encore ; « Revoir les idées écartées » la ramène.`);
        renderAll(true); return;
      }
      if (e.target.closest('[data-c=ecartees]')) { voirEcartees = !voirEcartees; renderAll(true); return; }
      const rn = e.target.closest('[data-ren]');
      if (rn) { const p = pairs[+rn.dataset.ren]; if (p) meet(p); return; }
      const rx = e.target.closest('[data-ren-non]');
      if (rx) { const p = pairs[+rx.dataset.renNon]; if (p) { refuser(p.a, p.b); focus = ''; toast('Compris : cette paire ne reviendra plus.'); renderAll(true); } return; }
      const rf = e.target.closest('[data-ren-faire]');
      if (rf) { const en = espace.entries.find((x) => x.id === rf.dataset.renFaire); const [a, b] = (en?.data?.rencontre || []).map((id) => espace.entries.find((x) => x.id === id)); if (en && a && b && !a.data?.corbeille && !b.data?.corbeille) meet({ a, b, consigne: en.data.consigne || en.body || '' }, en); else toast('Un des deux parents a été jeté : la rencontre ne peut plus se faire.'); return; }
      const pp = e.target.closest('[data-pair]');
      if (pp) { focus = focus === pp.dataset.pair ? '' : pp.dataset.pair; renderAll(true); el.querySelector(`[data-ren-i="${focus}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
      if (e.target.closest('[data-c=ren-next]')) { seed++; focus = ''; renderAll(true); return; }
      const fw = e.target.closest('[data-fw]');
      if (fw) { fWho = fw.dataset.fw; renderAll(true); return; }
      const fs = e.target.closest('[data-fs]');
      if (fs) { fSong = fs.dataset.fs; renderAll(true); return; }
      const ab = e.target.closest('[data-about]');
      if (ab) { el.querySelectorAll('[data-about]').forEach((x) => x.classList.toggle('active', x === ab)); return; }
      const tt = e.target.closest('[data-type]');
      if (tt) { openComposer(tt.dataset.type); return; }
      const pr = e.target.closest('[data-promote]');
      if (pr) { const en = espace.entries.find((x) => x.id === pr.dataset.promote); if (en) await setStage(en, Math.min(4, stageOf(en) + 1)); return; }
      const mv = e.target.closest('[data-move]');
      if (mv) {
        const [id, d] = mv.dataset.move.split(':');
        const en = espace.entries.find((x) => x.id === id);
        await setStage(en, Math.max(0, Math.min(4, stageOf(en) + +d)));
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
      const pe = e.target.closest('[data-perle]');
      if (pe) { const en = espace.entries.find((x) => x.id === pe.dataset.perle); if (en) await togglePerle(en).catch((err) => toast(err.message)); return; }
      const del = e.target.closest('[data-del]');
      if (del) { const en = espace.entries.find((x) => x.id === del.dataset.del); if (en) await jeter(en).catch((err) => toast(err.message)); closeDetail(); return; }
      const card = e.target.closest('[data-card], [data-open]');
      if (card && !e.target.closest('button, a, audio, video')) { openDetail(card.dataset.card || card.dataset.open); return; }
      if (e.target.classList.contains('detail-scrim')) { closeDetail(); return; }
      const a = e.target.closest('[data-c]')?.dataset.c;
      if (a === 'close') closeDetail();
      if (a === 'more') openComposer(composing ? null : 'bilan');
      if (a === 'song-creer' || a === 'song-accords') {
        const nom = a === 'song-accords' ? e.target.closest('[data-nom]').dataset.nom : (el.querySelector('[data-c-nom]')?.value || '').trim().slice(0, 60);
        if (!nom) { el.querySelector('[data-c-nom]')?.focus(); toast('Donne-lui un nom.'); return; }
        try { const ch = await creerChanson(nom); toast(`« ${nom} » est né. Ses parties t’attendent dans Jouer.`); if (a === 'song-accords') location.hash = `#/studio?tab=chanson&ch=${ch.id}`; else renderAll(true); } catch (err) { toast(err.message); }
        return;
      }
      if (a === 'filtrer') { const f = el.querySelector('.filters'); f.hidden = !f.hidden; e.target.closest('[data-c]').setAttribute('aria-expanded', !f.hidden); return; }
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
        if (navigator.share) navigator.share({ title: 'FLIP', text, url: espace.link }).catch(() => {});
        else { await navigator.clipboard?.writeText(espace.link); toast(`Lien copié : envoie-le à ${other()}.`); }
      }
      if (a === 'settings') {
        const s = el.querySelector('.settings');
        s.hidden = !s.hidden;
        e.target.setAttribute('aria-expanded', !s.hidden);
      }
      if (a === 'secret') {
        const v = el.querySelector('[data-s=secret]').value;
        if (v.replace(/[^\p{L}\p{N}]/gu, '').length < 4) { toast('4 lettres ou chiffres minimum.'); return; }
        try { await updateEspace({ secret: v }); toast(`Mot secret enregistré. Donne-le à ${other()} de vive voix.`); renderSettings(); } catch (err) { toast(err.message); }
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
      if (e.target.dataset.c === 'image' && e.target.files.length) { for (const f of e.target.files) await postImage(f); e.target.value = ''; }
      if (e.target.dataset.s === 'welcome-audio' && e.target.files[0]) {
        try {
          const audio = await uploadAudio(e.target.files[0]);
          await updateEspace({ welcome: { ...(espace.meta.welcome || {}), audio } });
          toast('Audio d’accueil enregistré.');
          renderSettings();
        } catch (err) { toast(err.message); }
      }
      if (e.target.matches('[data-projet]')) {
        let v = e.target.value;
        if (v === '+') {
          const nom = prompt('Le nom du projet (ex. : Album hiver, Reprises, Forever more) :');
          if (!nom?.trim()) { e.target.value = projetCourant(); return; }
          try { await creerProjet(nom.trim()); toast(`Projet « ${nom.trim()} » : ce que vous créez maintenant s’y range tout seul.`); } catch (err) { toast(err.message); }
        } else setProjet(v);
        render();
        return;
      }
      if (e.target.dataset.fsel === 'who') { fWho = e.target.value; renderAll(true); return; }
      if (e.target.dataset.fsel === 'song') { fSong = e.target.value; renderAll(true); return; }
      if (e.target.dataset.fsel === 'kind') { fKind = e.target.value; renderAll(true); return; }
      if (e.target.dataset.fsel === 'when') { fWhen = e.target.value; renderAll(true); return; }
      const en = openId && espace.entries.find((x) => x.id === openId);
      if (en && e.target.dataset.d === 'stage') await setStage(en, +e.target.value);
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

    // Survoler une rencontre allume son fil sur la carte ; Entrée sur une étoile l'ouvre.
    el.addEventListener('mouseover', (e) => { const r = e.target.closest('[data-ren-i]'); el.querySelectorAll('.sky-pair').forEach((p) => p.classList.toggle('hover', !!r && p.dataset.pair === r.dataset.renI)); });
    el.addEventListener('keydown', (e) => { const n = e.target.closest?.('.sky-node'); if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetail(n.dataset.card); } });
    let rz;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => view === 'ciel' && renderAll(), 200); };
    addEventListener('resize', onResize);

    // Glisser-déposer d'une carte vers une autre colonne (étape ou morceau).
    el.addEventListener('dragstart', (e) => { const c = e.target.closest('[data-card]'); if (c) { e.dataTransfer.setData('text/plain', c.dataset.card); c.classList.add('dragging'); } });
    el.addEventListener('dragend', (e) => e.target.closest?.('[data-card]')?.classList.remove('dragging'));
    el.addEventListener('dragover', (e) => { if (e.dataTransfer?.types?.includes('Files')) { e.preventDefault(); return; } const col = e.target.closest('.board-col'); if (col) { e.preventDefault(); col.classList.add('over'); } });
    el.addEventListener('dragleave', (e) => e.target.closest?.('.board-col')?.classList.remove('over'));
    el.addEventListener('drop', async (e) => {
      const imgs = [...(e.dataTransfer?.files || [])].filter((x) => x.type.startsWith('image/'));
      if (imgs.length) { e.preventDefault(); for (const f of imgs) await postImage(f); return; }
      const col = e.target.closest('.board-col');
      if (!col) return;
      e.preventDefault();
      col.classList.remove('over');
      const en = espace.entries.find((x) => x.id === e.dataTransfer.getData('text/plain'));
      if (!en) return;
      if (col.dataset.stage != null) await setStage(en, +col.dataset.stage);
      if (col.dataset.song != null && en.type !== 'paroles') await patch(en, () => ({ song: col.dataset.song === '—' ? '' : col.dataset.song })).catch((err) => toast(err.message));
    });

    const offEsp = onEspace((what, extra) => {
      if (what === 'entries') {
        renderAll();
        const oe = openId && espace.entries.find((x) => x.id === openId);
        if (openId && (!oe || oe.updatedAt !== detailVersion)) openDetail(openId);
        extra?.fresh?.forEach((x) => toast(`${x.editedBy || x.author} ${x._nouveau ? 'a ajouté' : 'a modifié'} : ${x.title || 'une idée'}`));
      }
      if (what === 'online') {
        const s = el.querySelector('.sync-state');
        if (s) s.textContent = espace.online ? 'synchronisé' : 'hors ligne, on réessaie…';
      }
      if (what === 'meta' && (!el.querySelector('.mur') || !espace.connected)) render();
    });

    render();
    return () => { offEsp(); recorder?.stop(); removeEventListener('resize', onResize); };
  },
};

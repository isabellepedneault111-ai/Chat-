// Accueil = le plan de match de Zaza & Frog : six mois, des idées brutes à 3 à 5 originaux.
import { espace, onEspace, updateEspace, profileOf } from '../espace.js';
import { toast, store } from '../ui.js';
import { MODULES } from '../data.js';
import { PLAN, RYTHME, VISION_FIELDS, STAGES, MEMBERS, memberColor, ROLES, aspect, lienAuMoment } from '../duo.js';
import { currentMonth, planContext, planStart, weekRhythm, planAjuste } from '../plan.js';
import { esc, espaceGate, ago, embedHTML } from './carnet.js';
import { activeSession } from './session.js';
import { relaisPending, asksOf } from './relais.js';
import { pendantHTML } from '../traces.js';
import { enAttenteDeMoi } from '../corbeille.js';
import { lune, luneSVG, TEMPS, CYCLE, prochainTemps, numeroLune, luneCourante, patchLune } from '../lune.js';
import { nouveautesHTML } from '../nouveautes.js';
import { aVoir } from '../suivi.js';
import { mesTaches } from '../taches.js';
import { attendMoi } from '../elan.js';
import { pieceSVG, studioActuel, piece } from '../piece.js';
// Tout en haut de l'accueil : ce que l'autre a ajouté et que je n'ai pas vu. C'est là que mène la pastille de Plan.
const nouvellesBandeau = () => { const n = aVoir(); const t = mesTaches(); if (!n.length && !t.length) return ''; const tot = n.length + t.length;
  const quoi = [n.length ? `${n.length} ${n.length > 1 ? 'nouvelles' : 'nouvelle'} de ${esc(n[0].author)} à voir` : '', t.length ? `${t.length} chose${t.length > 1 ? 's' : ''} à faire pour toi : ${t.slice(0, 2).map((x) => esc(x.titre)).join(', ')}${t.length > 2 ? '…' : ''}` : ''].filter(Boolean).join(' · ');
  return `<a class="nv-bandeau" href="#/nouvelles"><b>${tot}</b><span>${quoi}</span><em>Ouvrir →</em></a>`; };

// Où aller : chaque outil rangé par ce qu'on veut faire, pas par son nom.
// Par où commencer : trois gestes, dans l'ordre, cochés quand ils sont faits. Disparaît quand tout est fait.
// Notre vision, comme un manifeste : les tonalités allumées sur un clavier, nos instruments côte à côte,
// le genre en grand, nos références avec leur pourquoi, et ce qu'on veut faire ressentir.
const NOTES_V = { do: 0, 'do♯': 1, 'ré♭': 1, ré: 2, 'ré♯': 3, 'mi♭': 3, mi: 4, fa: 5, 'fa♯': 6, 'sol♭': 6, sol: 7, 'sol♯': 8, 'la♭': 8, la: 9, 'la♯': 10, 'si♭': 10, si: 11 };
function visionHTML(v, mem) {
  const tons = new Set((v.tonalite || '').toLowerCase().replace(/#/g, '♯').split(/[,·/]+|\s+et\s+/).map((x) => NOTES_V[x.trim().split(/\s+/)[0]]).filter((x) => x != null));
  const blanches = [0, 2, 4, 5, 7, 9, 11]; const noires = [[1, 0], [3, 1], [6, 3], [8, 4], [10, 5]];
  const clavier = `<svg class="vi-kb" viewBox="0 0 140 52" aria-hidden="true">${blanches.map((n, i) => `<rect x="${i * 20}" y="0" width="19" height="52" rx="2" class="${tons.has(n) ? 'on' : ''}"/>`).join('')}${noires.map(([n, i]) => `<rect x="${i * 20 + 13}" y="0" width="12" height="31" rx="2" class="noire ${tons.has(n) ? 'on' : ''}"/>`).join('')}</svg>`;
  const parts = (v.instrumentation || '').split(/\s+·\s+(?=[A-ZÀ-Ý][\wÀ-ÿ]+\s*:)/);
  const inst = mem.map((m) => { const p = parts.find((x) => x.trim().startsWith(m)); return [m, p ? p.replace(new RegExp(`^\\s*${m}\\s*:\\s*`), '').split(/\s*·\s*|,\s*/).filter(Boolean) : []]; });
  const arts = mem.flatMap((m) => (profileOf(m)?.artistes || []).filter((a) => a?.nom).map((a) => ({ ...a, by: m })));
  const refs = (v.style || '').split(/,\s*/).filter(Boolean).map((r) => ({ r, a: arts.find((a) => a.nom === r) }));
  const vide = '<span class="vi-vide">à décider ensemble</span>';
  return `<div class="vi">
    ${v.intention ? `<blockquote class="vi-intention"><small>Ce qu’on veut que les gens ressentent</small>${esc(v.intention)}</blockquote>` : `<blockquote class="vi-intention"><small>Ce qu’on veut que les gens ressentent</small>${vide}</blockquote>`}
    <div class="vi-grille">
      <section class="vi-case vi-ton"><small>Nos tonalités</small>${clavier}<b>${v.tonalite ? esc(v.tonalite) : vide}</b></section>
      <section class="vi-case vi-genre"><small>Notre genre</small><b>${v.genre ? esc(v.genre).replace(/ · /g, '<i>·</i>') : vide}</b></section>
      <section class="vi-case vi-inst"><small>Nos instruments</small>${inst.map(([m, l]) => `<div style="--c:${memberColor(m)}"><b>${esc(m)}</b>${l.length ? l.map((x) => `<span>${esc(x)}</span>`).join('') : '<span class="vi-vide">—</span>'}</div>`).join('')}</section>
      <section class="vi-case vi-refs"><small>Nos références</small>${refs.length ? refs.map(({ r, a }) => `<p style="--c:${a ? memberColor(a.by) : 'var(--ink)'}"><b>${esc(r)}</b>${a?.aime?.length ? `<span>${a.aime.map(aspect).map(esc).join(' · ')}</span>` : a ? '<span class="vi-vide">pourquoi ? à dire</span>' : ''}</p>`).join('') : vide}</section>
    </div></div>`;
}

function commencerHTML() {
  const mem = espace.meta.members || MEMBERS; const frog = espace.me === mem[1];
  const ents = espace.entries.filter((e) => !e.demo && !e.data?.demo);
  const pas = [
    ['Notre première vraie séance', 'Choisir quoi travailler, la musique part, on suit les étapes, on finit par une prise.', '#/session', ents.some((e) => e.type === 'session' && e.data?.done)],
    ['Découvrir nos deux âmes', 'Ce que nos deux étapes 1 donnent ensemble, et nos pistes hors sentier.', '#/ames', store.get('amesVu', false)],
    frog ? ['Monter une chanson et ses accords', 'Studio → Nos chansons : couplet, refrain, pont, chacun avec ses accords. Puis on la joue.', '#/studio?tab=chanson', ents.some((e) => e.type === 'chanson')]
      : ['Placer tes paroles sur Projet 1', 'Écrire → Placer mes paroles : les syllabes, les accents, la note à chanter.', '#/placer', !!store.get('placerTexte', '')],
  ];
  // Dire pourquoi nos inspirations nous inspirent : une tâche pour chacun (on voit où en est l'autre).
  const dit = (m) => { const l = (profileOf(m)?.artistes || []).filter((a) => a?.nom); return l.length > 0 && l.every((a) => a.aime?.length || a.pourquoi); };
  const autre = mem.find((m) => m !== espace.me);
  pas.splice(1, 0, ['Dire pourquoi nos inspirations nous inspirent', `Pour chaque artiste ou morceau : sa rythmique, sa voix, son texte… et le moment précis. ${dit(autre) ? `${autre} l’a fait ✓` : `${autre} aussi a cette tâche.`}`, '#/depart?etape=3', dit(espace.me)]);
  if (pas.every((x) => x[3])) return '';
  const prochain = pas.findIndex((x) => !x[3]);
  return `<section class="commencer" aria-label="Par où commencer"><h2>Par où commencer</h2><ol>${pas.map(([t, d, h, ok], i) => `<li class="${ok ? 'fait' : i === prochain ? 'prochain' : ''}"><a href="${h}"><span class="cm-n">${ok ? '✓' : i + 1}</span><b>${t}</b><small>${d}</small>${i === prochain ? '<em>Maintenant →</em>' : ''}</a></li>`).join('')}</ol></section>`;
}
const OU_ALLER = [
  ['Jouer ensemble', 'Dans la même pièce ou à distance, une séance guidée qui finit par une prise.', [['session', 'Lancer une séance'], ['accord', 'Voix + piano']]],
  ['Entre deux séances', 'Se lancer des sons, répondre par-dessus, garder les perles et les étincelles.', [['relais', 'Le relais'], ['etincelles', 'Nos étincelles'], ['coffre', 'Le coffre']]],
  ['Écrire', 'Notre journal, une séance d’atelier, le grimoire, puis sculpter les textes pour qu’ils se chantent.', [['ecrire', 'Notre journal'], ['atelier', 'Séance d’atelier'], ['jeux', 'Le grimoire'], ['paroles', 'Paroles']]],
  ['Voir le chemin', 'Où on est rendus, ce qui progresse, et ce que la recherche conseille ensuite.', [['bilan', 'Notre bilan'], ['carnet', 'Le mur'], ['evolution', 'Nos courbes'], ['lexique', 'Notre lexique'], ['ames', 'Nos deux âmes'], ['arbre', 'L’arbre de l’architecte']]],
  ['Travailler sa voix, son son', 'Les outils de fond, quand on veut creuser.', [['tessiture', 'Empreinte'], ['gym', 'Gym vocal'], ['miroir', 'Miroir'], ['studio', 'Studio'], ['labo', 'Le labo']]],
];

export default {
  id: 'home',
  mount(el) {
    let editingVision = false;

    // Le truc du jour : UNE action, sa durée, et pourquoi. Toujours tout en haut.
    function todayHTML() {
      const live = activeSession();
      const r = weekRhythm();
      const rp = relaisPending();
      const asks = rp ? asksOf(rp) : [];
      const ask = asks.length ? [null, asks.map((x) => x[1]).join(' · '), [asks.map((x) => x[2]).join(', '), rp.data?.intent].filter(Boolean).join(' · ')] : rp?.data?.intent ? [null, 'Son intention', rp.data.intent] : null;
      const t = live ? { t: 'Rejoindre la session', d: 'en cours', why: `${live.author} a lancé « ${live.data.cible} ».`, href: '#/session' }
        : rp ? { t: `${rp.author} t’a lancé ${rp.audio ? 'un son' : 'des mots'}`, d: ask ? ask[1] : 'à écouter', why: `« ${rp.title} » : ${ask ? ask[2] : 'écoute, puis réponds par-dessus'}.`, href: `#/relais/${rp.id}` }
        : !profileOf(espace.me)?.doneAt ? { t: 'Ton point de départ', d: '5 min', why: 'Ce que tu veux, ta voix, tes styles : c’est ce qui nourrit notre plan.', href: '#/depart' }
          : r.duo < 2 ? { t: 'Une session duo', d: '60 min', why: `${r.duo} sur 2 cette semaine : courtes et régulières, c’est ce qui fait progresser.`, href: '#/session' }
            : r.ecoute === 0 ? { t: 'Écoute commune', d: '20 min', why: 'Réécouter nos prises et faire avancer les idées sur le mur.', href: '#/session' }
              : { t: 'Voix + piano', d: '10 min', why: 'Frog joue, Zaza chante : la justesse se travaille dans nos vrais accords.', href: '#/accord' };
      const cb = enAttenteDeMoi();
      return inviteHTML() + (cb.length ? `<a class="cb-notice" href="#/corbeille">${esc(cb[0].data.corbeille.by)} propose d’effacer ${cb.length} élément${cb.length > 1 ? 's' : ''} : ton accord est nécessaire →</a>` : '') + `<a class="today" href="${t.href}"><span class="today-k mono">Aujourd’hui · ${esc(t.d)}</span><b>${esc(t.t)}</b><span class="today-why">${esc(t.why)}</span><span class="today-go">→</span></a>`;
    }

    // Tant que l'autre n'est pas entré : le mot secret, prêt en un clic.
    // Tant que l'autre n'est pas entré : le mot secret s'active tout seul (bell), et le message est prêt à copier.
    let secretTry = false; let secretErr = '';
    function inviteHTML() {
      const mem = espace.meta.members || MEMBERS;
      const o = mem.find((x) => x !== espace.me) || 'Frog';
      const came = espace.meta.seen?.[o] || espace.meta.tour?.[o] || espace.entries.some((e) => e.author === o);
      if (came) return '';
      if (!espace.meta.hasSecret && !secretTry) {
        secretTry = true;
        updateEspace({ secret: 'bell' }).catch((err) => { secretErr = err.message; render(); });
      }
      const msg = `${o}, notre espace t’attend. Va sur ${location.origin}/ , choisis « ${o} », puis tape le mot secret : bell. La suite démarre toute seule. Prends 4 minutes, avec le son.`;
      return `<section class="invite">
        <p class="invite-k">${esc(o)} n’est pas encore entré</p>
        ${secretErr ? `<p class="invite-err">Le mot secret « bell » n’a pas pu s’activer : ${esc(secretErr)}</p>`
          : `<p>${espace.meta.hasSecret ? '✓ Le mot secret <b>bell</b> est actif pour votre espace.' : 'Activation du mot secret <b>bell</b>…'} Envoie-lui ce message :</p>
        <blockquote class="invite-msg">${esc(msg)}</blockquote>
        <button class="btn primary" data-h="copy-invite" data-msg="${esc(msg)}">Copier le message</button>
        <p class="muted small">Ce cadre disparaît dès que ${esc(o)} est entré.</p>`}
      </section>`;
    }

    // La lune : une ligne, un temps de création, et les intentions du cycle.
    // Notre cycle : la lune comme horloge du processus. Ses quatre temps = nos quatre gestes (créer, façonner,
    // produire, trier et relire). L'intention se sème à la nouvelle lune et se relit la dernière semaine du cycle.
    function cycleHTML() {
      const l = lune(); const ici = CYCLE.findIndex((c) => c.temps === l.temps); const c = CYCLE[ici];
      const lm = luneCourante(espace.meta);
      const mem = espace.meta.members || MEMBERS; const mine = lm.intentions?.[espace.me];
      const pt = prochainTemps(); const n = numeroLune(planStart());
      const debut = new Date(`${l.cycle}T00:00`).getTime(); const ents = espace.entries.filter((e) => !e.demo && !e.data?.demo);
      const semees = ents.filter((e) => e.createdAt >= debut && ['note', 'texte', 'audio', 'image', 'lien', 'paroles'].includes(e.type) && !e.data?.journal).length;
      const grandi = ents.reduce((a, e) => a + (e.data?.moves || []).filter((m) => m.at >= debut && m.to > m.from).length, 0);
      const entendu = ents.filter((e) => e.createdAt >= debut && (e.data?.prise || e.data?.filet || e.data?.cathedrale || (e.type === 'session' && e.data?.done))).length;
      const relues = Object.keys(lm.relue || {}).length;
      const comptes = [`${semees} semée${semees > 1 ? 's' : ''}`, `${grandi} ${grandi > 1 ? 'ont' : 'a'} grandi`, `${entendu} entendue${entendu > 1 ? 's' : ''}`, `${relues} intention${relues > 1 ? 's' : ''} relue${relues > 1 ? 's' : ''}`];
      const R = 62; const C = 80; const pos = (deg, r = R) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];
      const arc = (i) => { const a0 = -135 + i * 90 + 4; const a1 = a0 + 82; const [x0, y0] = pos(a0); const [x1, y1] = pos(a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
      const [px, py] = pos(l.frac * 360 - 90);
      const roue = `<svg class="cy-roue" viewBox="-24 -6 208 172" aria-hidden="true">${CYCLE.map((x, i) => `<path d="${arc(i)}" class="${i === ici ? 'on' : ''}"/>`).join('')}
        ${CYCLE.map((x, i) => { const [tx, ty] = pos(-90 + i * 90, R + 13); return `<text x="${tx.toFixed(1)}" y="${(ty + 3).toFixed(1)}" text-anchor="${i === 1 ? 'start' : i === 3 ? 'end' : 'middle'}" dx="${i === 1 ? -6 : i === 3 ? 6 : 0}" class="${i === ici ? 'on' : ''}">${x.phase.split(' ')[0]}</text>`; }).join('')}
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5" class="cy-ici"/></svg>`;
      const relire = l.temps === 'laisser' && mine && !lm.relue?.[espace.me];
      return `<section class="cycle" aria-label="Notre cycle">
        <div class="cy-gauche">${roue}<div class="cy-lune">${luneSVG(l, 46)}</div></div>
        <div class="cy-droite">
          <p class="cy-k">Notre cycle${n ? ` · lune ${n} de nos six mois` : ''} · ${esc(l.nom.toLowerCase())}</p>
          <h2>Le temps ${c.temps === 'laisser' ? 'de laisser aller' : c.temps === 'semer' ? 'de semer' : c.temps === 'grandir' ? 'de faire grandir' : 'de faire entendre'} <small>${esc(c.phase)} · ${esc(c.periode)}</small></h2>
          <p>${esc(c.geste)}${pt ? ` <span class="muted">Jusqu’au ${pt.date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}, puis le temps ${pt.temps === 'laisser' ? 'de laisser aller' : pt.temps === 'semer' ? 'de semer' : pt.temps === 'grandir' ? 'de faire grandir' : 'de faire entendre'}.</span>` : ''}</p>
          <p class="cy-outils">${c.outils.map(([h, t]) => `<a href="#/${h}">${t}</a>`).join('')}</p>
          <div class="cy-int"><b>Nos intentions de ce cycle</b>
            ${mem.map((m) => { const x = lm.intentions?.[m]; const r = lm.relue?.[m]; return `<p style="--c:${memberColor(m)}"><i>${esc(m)}</i> ${x ? `« ${esc(x)} »${r ? ` <em class="cy-relue">${{ tenue: 'tenue ✓', transformee: 'transformée ↻', lachee: 'lâchée, sans regret' }[r] || ''}</em>` : ''}` : '<span class="muted">pas encore posée</span>'}</p>`; }).join('')}
            ${!mine ? `<form class="lune-form"><input class="input" data-lune maxlength="140" placeholder="${l.temps === 'semer' ? 'Ton intention pour ce cycle' : 'Ton intention, même en cours de route'} (jusqu’à la prochaine nouvelle lune)"><button class="btn small">Semer</button></form>` : ''}
            ${relire ? `<p class="cy-relire">La dernière semaine du cycle : relis ton intention. Elle a été… <button class="btn small" data-relue="tenue">tenue</button><button class="btn small" data-relue="transformee">transformée</button><button class="btn small" data-relue="lachee">lâchée</button></p>` : ''}
          </div>
          <p class="cy-comptes muted small">Ce cycle, jusqu’ici : ${comptes.join(' · ')}.</p>
          ${l.age > 18 || l.age < 4 ? `<a class="cy-passage" href="#/passage">☾ Le passage de la nouvelle lune : fermer ce cycle à deux, semer le suivant →</a>` : `<a class="cy-passage discret" href="#/passage">Nos passages</a>`}
        </div>
      </section>`;
    }

    // Notre fil : de la même pièce à chacun de son côté, le mouvement ne s'arrête jamais.
    function filHTML() {
      const last = (f) => Math.max(0, ...espace.entries.filter(f).map((e) => e.data?.doneAt || e.createdAt));
      const live = activeSession();
      const modes = [
        ['Dans la même pièce', 'Session duo, grand texte, raccourcis clavier : l’app s’efface, on joue.', '#/session', last((e) => e.type === 'session' && e.data?.format?.startsWith('duo') && e.data?.done && (e.data.lieu || 'piece') === 'piece')],
        ['À distance, en même temps', 'La même session sur deux écrans, synchronisée : pause, phases, prises.', '#/session', live && live.data?.lieu === 'distance' ? Date.now() : last((e) => e.type === 'session' && e.data?.done && e.data.lieu === 'distance')],
        ['À distance, chacun son temps', 'Le relais : un son, une couche par-dessus, des mots, un cadavre exquis.', '#/relais', last((e) => e.data?.relais || (e.type === 'jeu' && e.data?.kind === 'cadavre'))],
        ['Seul, pour nous deux', 'Micro-session, ambiances, grimoire : ce qu’on fait seul nourrit le duo.', '#/ambiances', last((e) => (e.type === 'session' && e.data?.format === 'solo') || e.type === 'paroles')],
      ];
      const ens = espace.entries.filter((e) => e.type === 'session' && e.data?.done && e.data.format?.startsWith('duo'));
      const piece = ens.filter((e) => (e.data.lieu || 'piece') === 'piece').length;
      const hrs = Math.round(ens.reduce((t, e) => t + Math.max(0, Math.min(240, (e.data.doneAt - e.data.startedAt - (e.data.pausedTotal || 0)) / 60000)), 0) / 6) / 10;
      return `<section class="fil" aria-label="Notre fil">
        <a class="ensemble" href="#/bilan/seance"><b>${ens.length}</b><span>séance${ens.length > 1 ? 's' : ''} ensemble<small>${piece} dans la même pièce · ${ens.length - piece} à distance · ${hrs} h</small></span></a>
        <p class="fil-k">Notre fil <span>en présence · à distance · en même temps · chacun son temps</span><a class="fil-coffre" href="#/coffre">✦ Le coffre</a></p>
        <div class="fil-row">${modes.map(([t, d, h, at], i) => `<a class="fil-m ${at && Date.now() - at < 7 * 864e5 ? 'warm' : ''}" href="${h}"><span class="fil-n">${i + 1}</span><b>${t}</b><small>${d}</small><em>${live && i === 1 ? 'en ce moment' : at ? ago(at) : 'pas encore'}</em></a>`).join('<i class="fil-link" aria-hidden="true"></i>')}</div>
      </section>`;
    }

    function render() {
      // La dernière visite de chacun, partagée : elle dit à l'autre ce qu'il n'a pas encore vu.
      const vu = espace.meta?.seen?.[espace.me];
      if (espace.connected && espace.me && (!vu || Date.now() - vu > 10 * 60e3)) { nouveautesHTML(); updateEspace({ seen: { ...(espace.meta.seen || {}), [espace.me]: Date.now() } }).catch(() => {}); }
      if (!espace.connected || !espace.me) {
        el.innerHTML = '<header class="masthead"><h1 class="display"><img class="mast-logo" src="img/flip.svg" alt="FLIP"></h1><p class="lead">Six mois. Deux musiciens. Des morceaux originaux.</p></header><div class="gate-host"></div>';
        espaceGate(el.querySelector('.gate-host'), { onReady: render });
        return;
      }
      const start = planStart();
      const head = `
        <header class="masthead">
          <h1 class="display"><img class="mast-logo" src="img/flip.svg" alt="FLIP"></h1>
          <canvas class="mast-wave" aria-hidden="true"></canvas>
          <p class="mast-app"><b>Diapason Labo</b> <span>le laboratoire de FLIP</span></p>
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
      if (!start && !editingVision) { el.innerHTML = head + cycleHTML() + todayHTML() + nouveautesHTML() + filHTML() + pendantHTML() + etape1 + `<p class="or-vision"><button class="btn ghost" data-h="edit">Ou poser notre vision tout de suite →</button></p>`; return; }
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
        ${head}
        ${nouvellesBandeau()}
        ${commencerHTML()}
        <a class="arbre-teaser" href="#/arbre">${espace.me === (espace.meta.members || MEMBERS)[1] ? `Tu as demandé à ${esc((espace.meta.members || MEMBERS)[0])} d’où venaient certains sons et éléments de l’app. <b>Clique ici pour voir son arbre d’architecte d’environnement hybride à l’œuvre →</b>` : '<b>L’arbre de l’architecte</b> : toute l’architecture de Diapason Labo, à admirer →'}</a>
        ${todayHTML()}
        ${nouveautesHTML()}
        ${filHTML()}
        ${pendantHTML()}
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
          ${(() => { const at = attendMoi(); if (!at.length) return ''; const e = at[0]; const j = Math.floor((Date.now() - e.createdAt) / 864e5);
            return `<a class="next-card nc-tresse" href="#/relais/${esc(e.id)}"><p class="tape">La tresse attend ta réponse</p><h3>« ${esc(e.title || 'sans titre')} »</h3><p>${esc(e.author)} te l’a lancé ${j < 1 ? 'aujourd’hui' : j < 2 ? 'hier' : `il y a ${j} jours`}${at.length > 1 ? `, et ${at.length - 1} autre${at.length > 2 ? 's' : ''} attend${at.length > 2 ? 'ent' : ''} aussi` : ''}. Quand vous vous répondez, vos deux fils se rapprochent.</p><span class="btn">Répondre →</span></a>`; })()}
        </section>
        ${studioHTML(mem)}

        ${(() => {
          const aj = planAjuste(PLAN);
          return aj.length ? `<section class="ajuste">
            <div class="ajuste-head"><h2>Le plan s’ajuste à vous</h2><p class="muted small">Le cap des six mois reste. Le chemin suit ce que vous faites : vos séances, vos écrits, votre mur.</p></div>
            <div class="ajuste-grid">${aj.map((a) => `<article class="aj">
              <p class="aj-fait">${esc(a.fait)}</p>
              <h3>${esc(a.titre)}</h3>
              ${a.plan ? `<button class="btn small primary" data-plan="${a.plan}">${esc(a.action)}</button>` : `<a class="btn small primary" href="${a.href}">${esc(a.action)} →</a>`}
              ${a.src ? `<cite>${esc(a.src)}</cite>` : ''}
            </article>`).join('')}</div>
          </section>` : '';
        })()}
        ${etape1}
        ${(() => {
          const bravos = espace.entries.filter((e) => e.type === 'bravo').slice(0, 3);
          const links = espace.entries.filter((e) => e.type === 'lien').slice(0, 4);
          const arts = mem.flatMap((x) => (profileOf(x)?.artistes || []).filter((a) => a?.nom).map((a) => ({ ...a, by: x })));
          const sessions = espace.entries.filter((e) => e.type === 'session' && e.data?.done);
          const mins = sessions.reduce((sum, e) => sum + Math.max(0, Math.min(240, (e.data.doneAt - e.data.startedAt - (e.data.pausedTotal || 0)) / 60000)), 0);
          return `
          <a class="ames-teaser el-teaser" href="#/elan"><b>Notre élan</b><span>La tresse : nos deux fils dans le temps, qui lance, qui répond, ce qui circule entre nous. Pas de score : un mouvement.</span><em>Voir →</em></a>
          ${mem.every((x) => profileOf(x)?.doneAt) ? `<a class="ames-teaser" href="#/ames"><b>Nos deux âmes</b><span>L’arc et le triskel : ce que nos deux étapes 1 donnent ensemble, nos pistes hors sentier, ce que nos traces disent déjà.</span><em>Voir →</em></a>` : ''}
          <div class="home-trio">
            <section class="panel bravos">
              <div class="panel-head"><h2>Nos bravos</h2><a class="btn small" href="#/carnet">★ En envoyer un</a></div>
              ${bravos.length ? `<ul>${bravos.map((b) => `<li style="--c:${memberColor(b.author)}" data-id="${esc(b.id)}"><p>${esc(b.body || b.title)}</p><small><b>${esc(b.author)}</b> → ${esc(b.data?.to || '')} · ${ago(b.createdAt)}</small></li>`).join('')}</ul>` : '<p class="muted small">Le premier bravo est le plus dur. Ce que l’autre a fait de bien, précisément.</p>'}
            </section>
            <section class="panel inspi">
              <div class="panel-head"><h2>Ce qui nous inspire</h2><a class="btn small" href="#/carnet">+ Un lien</a></div>
              ${links[0] ? embedHTML(links[0].data?.url || links[0].body) : ''}
              <ul class="inspi-list">${links.slice(links[0] && embedHTML(links[0].data?.url || links[0].body) ? 1 : 0).map((l) => `<li style="--c:${memberColor(l.author)}"><a href="${esc(l.data?.url || l.body)}" target="_blank" rel="noopener">${esc(l.title)} ↗</a></li>`).join('')}
                ${arts.map((a) => `<li style="--c:${memberColor(a.by)}">${a.lien ? `<a href="${esc(lienAuMoment(a.lien, a.moment))}" target="_blank" rel="noopener">${esc(a.nom)} ↗</a>` : esc(a.nom)}${a.aime?.length ? `<span class="art-aime">${a.aime.map(aspect).map(esc).join(' · ')}</span>` : ''}${a.pourquoi ? `<em class="art-pq">« ${esc(a.pourquoi)} »</em>` : a.by === espace.me && !a.aime?.length ? '<a class="art-dire" href="#/depart?etape=3">Dire pourquoi →</a>' : ''}</li>`).join('')}</ul>
              ${!links.length && !arts.length ? '<p class="muted small">Collez un lien Spotify ou YouTube dans la capture du mur : il apparaît ici, prêt à écouter.</p>' : ''}
            </section>
            <a class="panel evo-teaser" href="#/bilan">
              <h2>Notre bilan</h2>
              <div class="mini-stats"><div><b>${Math.floor(mins / 60)} h ${String(Math.round(mins % 60)).padStart(2, '0')}</b><span>jouées</span></div><div><b>${sessions.length}</b><span>sessions</span></div><div><b>${espace.entries.filter((e) => e.type === 'evaluation').length}</b><span>autoévaluations</span></div></div>
              <span class="btn small">Où on est rendus →</span>
            </a>
          </div>`;
        })()}


        <details class="panel vision-fold"><summary><h2>Notre vision</h2><span class="muted small">tonalité, genre, intention</span></summary>
          ${visionHTML(v, mem)}
          <button class="btn small ghost" data-h="edit">Modifier</button>
          <cite>Une vision partagée avant de composer · Merchán-Sánchez-Jara 2023</cite>
        </details>

        ${cycleHTML()}
        <section class="ou-aller" aria-label="Où aller">
          <h2>Où aller</h2>
          <div class="oa-grid">${OU_ALLER.map(([t, why, links]) => `<div class="oa-g"><h3>${t}</h3><p>${why}</p><div>${links.map(([h, l]) => `<a href="#/${h}">${l}</a>`).join('')}</div></div>`).join('')}</div>
        </section>`;
    }

    // Le studio : le mien (Frog le recrée tel qu'il est), et celui de l'autre s'il le partage.
    function studioHTML(mem) {
      const o = mem.find((x) => x !== espace.me); const chez = o && profileOf(o)?.studio; const moi = studioActuel();
      const fait = moi.meubles.length || moi.appareils.some((a) => !a.hub) || piece().photo;
      const cartes = [];
      if (fait) {
        const n = moi.appareils.filter((a) => !a.hub).length; const act = moi.appareils.filter((a) => !a.hub && a.actif).length;
        cartes.push(`<a class="studio-carte" href="#/materiel">${pieceSVG(moi, { titre: 'Ton studio' })}<div><p class="tape">Ton studio</p><h3>Tel qu’il est branché</h3><p>${n} appareil${n > 1 ? 's' : ''}${act ? `, ${act} actif${act > 1 ? 's' : ''} en ce moment` : ''}${moi.meubles.length ? `, ${moi.meubles.length} meuble${moi.meubles.length > 1 ? 's' : ''}` : ''}. Ce qui est actif, le filet l’écoute.</p><span class="btn small">Entrer dans le studio →</span></div></a>`);
      } else {
        cartes.push(`<a class="studio-carte invite" href="#/materiel">${pieceSVG(moi)}<div><p class="tape">Ton studio, dans l’app</p><h3>Recrée ta pièce, comme elle est</h3><p>Chacun son studio. Branche ton matériel : l’app le reconnaît. Ajoute le reste à la main, place tout comme chez toi (le plancher, les meubles, les couleurs), même par-dessus une photo de la pièce. ${o ? `${esc(o)} pourra le voir, si tu le veux.` : ''}</p><span class="btn small">Brancher et placer →</span></div></a>`);
      }
      if (chez) cartes.push(`<a class="studio-carte" href="#/materiel?chez=${encodeURIComponent(o)}" data-id="studio">${pieceSVG(chez, { titre: `Le studio de ${o}` })}<div><p class="tape">Le studio de ${esc(o)}</p><h3>Là où naît la musique</h3><p>${chez.appareils.filter((a) => !a.hub).map((a) => esc(a.nom)).slice(0, 5).join(', ')}${chez.appareils.length > 6 ? '…' : ''}. Placé par ${esc(o)}, ${ago(chez.at)}.</p></div></a>`);
      return cartes.length ? `<section class="studio-band" aria-label="Le studio">${cartes.join('')}</section>` : '';
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

    el.addEventListener('submit', async (e) => {
      if (!e.target.classList.contains('lune-form')) return;
      e.preventDefault();
      const v = e.target.querySelector('[data-lune]').value.trim();
      if (!v) return;
      try { await updateEspace(patchLune(espace.meta, (b) => ({ intentions: { ...b.intentions, [espace.me]: v } }))); toast('Intention semée. On la relira la dernière semaine du cycle.'); } catch (err) { toast(err.message); }
    });
    el.addEventListener('click', async (e) => {
      const rl = e.target.closest('[data-relue]');
      if (rl) { try { await updateEspace(patchLune(espace.meta, (b) => ({ relue: { ...(b.relue || {}), [espace.me]: rl.dataset.relue } }))); toast('Relue. Le prochain cycle commence à la nouvelle lune.'); } catch (err) { toast(err.message); } return; }
      // Le plan bouge avec vous : avancer d'un mois, ou prendre deux semaines de plus.
      const pl = e.target.closest('[data-plan]');
      if (pl) {
        const st = planStart(); const m = currentMonth();
        const start = pl.dataset.plan === 'avance' ? Date.now() - m * 30.44 * 864e5 + 864e5 : st + 14 * 864e5;
        await updateEspace({ plan: { ...(espace.meta.plan || {}), start: new Date(start).toISOString().slice(0, 10), ajuste: [...(espace.meta.plan?.ajuste || []), { quoi: pl.dataset.plan, at: Date.now(), by: espace.me }].slice(-12) } }).catch((err) => toast(err.message));
        toast(pl.dataset.plan === 'avance' ? `Mois ${m + 1} : en avant.` : 'Deux semaines de plus pour ce mois.');
        return;
      }
      const a = e.target.closest('[data-h]')?.dataset.h;
      if (a === 'edit') { editingVision = true; render(); }
      if (a === 'copy-invite') { const m = e.target.closest('[data-msg]').dataset.msg; try { await navigator.clipboard.writeText(m); toast('Message copié : colle-le à Frog.'); } catch { prompt('Copie ce message :', m); } }
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
    // L'onde de l'atelier : trois sinus qui dérivent lentement, comme un son tenu qui respire.
    let raf = 0;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wave = (now) => {
      raf = requestAnimationFrame(wave);
      const cv = el.querySelector('.mast-wave');
      if (!cv) return;
      const dpr = Math.min(2, devicePixelRatio || 1); const w = cv.clientWidth; const h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr)) { cv.width = w * dpr; cv.height = h * dpr; }
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      const t = calm ? 0 : now / 1000;
      [['rgba(27,25,21,.75)', 1.6, 0], ['rgba(217,58,36,.55)', 1.2, 1.7]].forEach(([col, lw, off]) => {
        c.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const u = x / w;
          const env = Math.sin(Math.PI * u) ** 1.4 * (0.6 + 0.4 * Math.sin(t * 0.5 + off));
          const y = h / 2 + env * h * 0.38 * (Math.sin(u * 22 + t * 1.3 + off) * 0.6 + Math.sin(u * 47 - t * 0.9) * 0.25 + Math.sin(u * 9 + t * 0.4 + off) * 0.35);
          if (x) c.lineTo(x, y); else c.moveTo(x, y);
        }
        c.strokeStyle = col; c.lineWidth = lw; c.stroke();
      });
    };
    raf = requestAnimationFrame(wave);
    render();
    // Le compteur des séances ensemble monte jusqu'à son chiffre, une seule fois.
    const cnt = el.querySelector('.ensemble b');
    if (cnt && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const n = +cnt.textContent; const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 900); cnt.textContent = Math.round(n * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(step); };
      if (n > 0) requestAnimationFrame(step);
    }
    return () => { off(); cancelAnimationFrame(raf); };
  },
};

// Notre bilan : où on est rendus, ce qu'on a fait, ce qui progresse, ce qui coince,
// et les trois prochains exercices, choisis à partir de nos données et appuyés par la recherche.
import { espace, onEspace, profileOf } from '../espace.js';
import { PLAN, EXERCICES, MEMBERS, memberColor, FORMATS, RYTHME } from '../duo.js';
import { FLAME } from '../marque.js';
import { lune, luneSVG } from '../lune.js';
import { exempleHTML, bindExemples } from '../exemples.js';
import { currentMonth, planContext, planStart, weekRhythm } from '../plan.js';
import { esc, espaceGate } from './carnet.js';
import { carte, carteHTML, notesMagiques } from './accord.js';
import { nameFR } from '../music.js';
import { toast } from '../ui.js';
import { historiqueHTML, VERDICTS } from '../objectifs.js';

const DAY = 864e5;
const fmt = (t) => new Date(t).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });

// Pourquoi chaque exercice, en une phrase, pour le mois où il sert.
const WHY = {
  'e-echo': 'Caler un tempo commun et l’écoute de l’autre avant de créer.',
  'i-appel': 'L’appel-réponse construit un vocabulaire à deux, sans pression d’écrire.',
  'i-eco': 'Moins de matériau, plus d’écoute : la contrainte libère les idées.',
  'a-fragment': 'Développer 30 secondes qui vous ont allumés vaut mieux que dix idées neuves.',
  'i-nonrep': 'Changer un seul paramètre à la fois apprend à varier une idée au lieu de la jeter.',
  'f-reecoute': 'Réécouter ensemble fait voir ce qu’on n’entend pas en jouant.',
  'a-zones': 'Fixer les bords, garder le milieu ouvert : jouable sans perdre la magie.',
  'c-entree': 'Un signal d’entrée clair, et vos départs tombent ensemble.',
  'c-reperes': 'Des points de rendez-vous convenus rendent le morceau solide.',
  'i-image': 'Une image concrète guide le timbre de Frog et la couleur de la voix de Zaza.',
  'a-pont': 'Le pont révèle les problèmes d’entrées : c’est le meilleur test de forme.',
  'i-preentendre': 'Entendre la ligne dans sa tête avant de la jouer affine l’oreille.',
  'a-chunks': 'De petits tronçons dans un ordre qui change : la mémoire tient sous pression.',
  'f-passage': 'Jouer d’un bout à l’autre sans s’arrêter : la scène s’entraîne.',
};
const MONTH_EX = { 1: ['e-echo', 'i-appel', 'i-eco'], 2: ['a-fragment', 'i-nonrep', 'f-reecoute'], 3: ['a-zones', 'c-entree', 'c-reperes'], 4: ['i-image', 'a-pont', 'i-preentendre'], 5: ['a-chunks', 'c-entree', 'f-passage'], 6: ['f-passage', 'f-reecoute', 'a-chunks'] };
// Exercices propres à l'app, avec leur appui.
const APP_EX = {
  'x-accord': { nom: 'Voix + piano, mode « Frog donne la note »', duree: 10, href: '#/accord', comment: ['Frog joue une note dans un accord, Zaza la reprend.', 'Visez 75 % du temps juste sur 30 secondes.', 'Puis passez en mode « Dans l’accord ».'], why: 'Un retour visuel en temps réel améliore la justesse du chant.', src: 'Welch, Howard & Rush 1989 · Hoppe et al. 2006' },
  'x-objet': { nom: 'Écriture-objet par les sens', duree: 10, href: '#/ecrire', comment: ['Choisissez un lieu précis (une heure, une lumière).', '10 minutes sans s’arrêter, par les 7 sens.', 'Soulignez les 3 images les plus fortes : c’est la matière du couplet.'], why: 'Écrire par les sens donne des images concrètes, qui font les meilleurs textes chantés.', src: 'Pattison 2009 (Berklee)' },
  'x-relais': { nom: 'Un son par-dessus, au relais', duree: 5, href: '#/relais', comment: ['Un son de 10 à 30 secondes, une touche.', 'L’autre répond par-dessus avant le lendemain.', 'Trois allers-retours dans la semaine.'], why: 'Des contacts courts et rapprochés font plus progresser que de rares longues séances.', src: 'Cepeda et al. 2006' },
};

const TABS = [['seance', 'Séance'], ['semaine', 'Semaine'], ['mois', 'Mois']];
const sessMin = (e) => Math.max(0, Math.min(240, Math.round((e.data.doneAt - e.data.startedAt - (e.data.pausedTotal || 0)) / 60000)));
const flames = (n) => `<span class="feu-mini" aria-label="${n} sur 5">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= n ? 'on' : ''}">${FLAME()}</i>`).join('')}</span>`;

// ---------- La trace de chaque séance ----------
function traceHTML(e) {
  const d = e.data;
  const f = FORMATS.find((x) => x.id === d.format);
  const db = d.debrief || {};
  const takes = (d.takes || []).length;
  return `<article class="trace">
    <header><b>${new Date(d.doneAt).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })}</b><span>${esc((f?.label || d.format).split(' · ')[0])} · ${sessMin(e)} min jouées${takes ? ` · ${takes} prise${takes > 1 ? 's' : ''}` : ''}</span></header>
    ${d.cible ? `<p class="trace-cible">Cible : <b>${esc(d.cible)}</b>${d.song ? ` · ${esc(d.song)}` : ''}</p>` : ''}
    <div class="trace-who">${Object.entries(d.traces || {}).map(([w, t]) => `<p style="--c:${memberColor(w)}"><b>${esc(w)}</b>${flames(t.feu || 0)}${t.cible ? `<span class="ob-pastille v-${t.cible}">cible ${(VERDICTS.find((v) => v[0] === t.cible) || [, ''])[1].toLowerCase()}</span>` : ''}${t.mot ? `<em>« ${esc(t.mot)} »</em>` : ''}</p>`).join('') || '<p class="muted small">Pas de flammes notées pour cette séance.</p>'}</div>
    ${db.intention || db.entendu || db.ecart || db.prochaine ? `<dl class="trace-db">${[['intention', 'On voulait'], ['entendu', 'On a entendu'], ['ecart', 'L’écart'], ['prochaine', 'Prochaine cible']].filter(([k]) => db[k]).map(([k, l]) => `<dt>${l}</dt><dd>${esc(db[k])}</dd>`).join('')}</dl>` : ''}
    ${takes ? '<a class="btn small" href="#/carnet">Réécouter les prises →</a>' : ''}
  </article>`;
}
// L’onglet Séance du bilan : nos dernières séances, ce qu’on visait et ce qu’on en a dit.
function seanceHTML() {
  const list = espace.entries.filter((e) => e.type === 'session' && e.data?.done).sort((a, b) => b.data.doneAt - a.data.doneAt).slice(0, 12);
  if (!list.length) return '<div class="rl-empty"><p>Aucune séance rangée pour l’instant. À la fin de chaque séance, vous notez le feu (1 à 5 flammes) et un mot : la trace arrive ici, avec le debrief et les prises.</p><a class="btn primary" href="#/session">Lancer une séance</a></div>';
  return `<div class="traces">${list.map(traceHTML).join('')}</div>`;
}

// ---------- La semaine ----------
function semaineHTML(mem) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
  const r = weekRhythm();
  const inWeek = (e) => e.createdAt >= monday;
  const sess = espace.entries.filter((e) => e.type === 'session' && e.data?.done && e.data.doneAt >= monday);
  const traces = sess.flatMap((e) => Object.entries(e.data.traces || {}));
  const feu = traces.filter(([, t]) => t.feu).map(([, t]) => t.feu);
  const mots = traces.map(([w, t]) => t.mot && { w, mot: t.mot }).filter(Boolean);
  const relais = espace.entries.filter((e) => e.data?.relais && inWeek(e));
  const bravos = espace.entries.filter((e) => e.type === 'bravo' && inWeek(e));
  const last = espace.entries.filter((e) => e.type === 'session' && e.data?.debrief?.prochaine).sort((a, b) => b.data.doneAt - a.data.doneAt)[0];
  const row = (label, n, goal, c) => `<div class="w-row"><span>${label}</span><span class="dots">${Array.from({ length: Math.max(goal, n) }, (_, i) => `<i class="${i < n ? 'on' : ''}" ${c ? `style="--c:${c}"` : ''}></i>`).join('')}</span><b>${n}/${goal}</b></div>`;
  const focus = r.duo < 2 ? 'Caser la 2e session duo : courtes et régulières, c’est ce qui fait avancer.'
    : !r.ecoute ? 'Une écoute commune de 20 minutes : vos prises attendent d’être triées.'
      : !relais.length ? 'Un son lancé au relais avant dimanche, et une réponse par-dessus.'
        : 'La semaine est complète. Choisissez une idée à faire monter d’une étape au mur.';
  return `
    <section class="panel">
      <div class="panel-head"><h2>La semaine du ${new Date(monday).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}</h2><span class="muted small">${sess.reduce((s, e) => s + sessMin(e), 0)} min jouées</span></div>
      ${row('Sessions duo', r.duo, 2)}
      ${mem.map((x) => row(`Solo ${esc(x)}`, r.solo[x] || 0, 3, memberColor(x))).join('')}
      ${row('Écoute commune (aux 2 semaines)', r.ecoute ? 1 : 0, 1)}
      <cite>${RYTHME.map((x) => x.src).join(' · ')}</cite>
    </section>
    <div class="b-two">
      <section class="panel"><h2>Le feu de la semaine</h2>
        ${feu.length ? `<p class="w-feu">${flames(Math.round(feu.reduce((a, b) => a + b, 0) / feu.length))}<span>${(feu.reduce((a, b) => a + b, 0) / feu.length).toFixed(1)} / 5 en moyenne</span></p>` : '<p class="muted">Notez vos flammes à la fin des séances.</p>'}
        ${mots.length ? `<p class="w-mots">${mots.map((m) => `<span style="--c:${memberColor(m.w)}">${esc(m.mot)}</span>`).join('')}</p>` : ''}
      </section>
      <section class="panel"><h2>Entre les séances</h2>
        <p><b>${relais.length}</b> son${relais.length > 1 ? 's' : ''} ou mots au relais${relais.length ? ` (${mem.map((x) => `${esc(x)} ${relais.filter((e) => e.author === x).length}`).join(', ')})` : ''}.</p>
        <p><b>${bravos.length}</b> bravo${bravos.length > 1 ? 's' : ''} échangé${bravos.length > 1 ? 's' : ''}.</p>
      </section>
    </div>
    <section class="w-focus">
      <p class="eyebrow">Pour la semaine qui vient</p>
      <h2>${esc(focus)}</h2>
      ${last ? `<p>Votre dernière cible : « ${esc(last.data.debrief.prochaine)} »</p>` : ''}
    </section>`;
}

// ---------- Notre route : chaque action laisse sa marque sur le chemin vers l'album ----------
const STAGES_LBL = ['Idée brute', 'À creuser', 'En chantier', 'Fixé', 'Dans le set'];
const KINDS = [
  ['session', 'Séance', (e) => e.type === 'session' && e.data?.done],
  ['relais', 'Son ou mots au relais', (e) => e.data?.relais],
  ['idee', 'Idée au mur', (e) => ['note', 'texte', 'audio', 'essai', 'lien'].includes(e.type) && !e.data?.relais],
  ['paroles', 'Chanson à l’atelier', (e) => e.type === 'paroles'],
  ['bravo', 'Bravo', (e) => e.type === 'bravo'],
  ['jeu', 'Jeu d’écriture', (e) => e.type === 'jeu'],
];
// Notre route : les six mois en une ligne, avec où on est rendus.
function routeHTML(start, mem) {
  const end = start + 6 * 30.44 * DAY;
  const now = Date.now();
  const W = 1000; const H = 250; const X0 = 50; const X1 = 950;
  const pt = (f) => { const x = X0 + f * (X1 - X0); return [x, 125 + 52 * Math.sin(f * Math.PI * 3)]; };
  const path = (a, b) => Array.from({ length: 121 }, (_, i) => pt(a + ((b - a) * i) / 120)).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  const fNow = Math.max(0, Math.min(1, (now - start) / (end - start)));
  const marks = [];
  espace.entries.forEach((e) => {
    const k = KINDS.find(([, , f]) => f(e));
    if (!k) return;
    const t = k[0] === 'session' ? e.data.doneAt : e.createdAt;
    if (t < start || t > end) return;
    const [x, y] = pt((t - start) / (end - start));
    const side = e.author === mem[1] ? 1 : -1; // Zaza au-dessus de la route, Frog en dessous
    const c = memberColor(e.author);
    if (k[0] === 'session') {
      const feux = Object.values(e.data.traces || {}).map((tr) => tr.feu).filter(Boolean);
      const sz = 20 + (feux.length ? feux.reduce((a, b) => a + b, 0) / feux.length : 2) * 4;
      marks.push(`<g transform="translate(${x - sz / 2},${y - sz * 0.86})" class="rt-flame"><svg width="${sz}" height="${sz}" viewBox="0 0 100 100">${FLAME().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><title>Séance · ${fmt(t)}</title></g>`);
    } else {
      const off = side * (k[0] === 'relais' ? 20 : k[0] === 'idee' ? 34 : 46);
      const shape = k[0] === 'relais' ? `<circle cx="${x}" cy="${y + off}" r="5" fill="${c}"/>`
        : k[0] === 'idee' ? `<rect x="${x - 4}" y="${y + off - 4}" width="8" height="8" fill="none" stroke="${c}" stroke-width="2"/>`
          : k[0] === 'paroles' ? `<path d="M${x},${y + off - 6}l6,6l-6,6l-6,-6z" fill="${c}"/>`
            : k[0] === 'bravo' ? `<path d="M${x},${y + off - 7}l2,5h5l-4,3l2,5l-5,-3l-5,3l2,-5l-4,-3h5z" fill="#e3a21f"/>`
              : `<path d="M${x},${y + off - 6}l6,10h-12z" fill="none" stroke="${c}" stroke-width="2"/>`;
      marks.push(`<g>${shape}<title>${k[1]} · ${esc(e.author)} · ${fmt(t)}</title></g>`);
    }
  });
  // les idées qui montent d'étape : une marque dorée sur la route
  espace.entries.forEach((e) => (e.data?.moves || []).filter((mv) => mv.to > mv.from && mv.at >= start && mv.at <= end).forEach((mv) => {
    const [x, y] = pt((mv.at - start) / (end - start));
    marks.push(`<g><circle cx="${x}" cy="${y}" r="9" fill="#d9b56a" stroke="var(--paper)" stroke-width="2"/><path d="M${x},${y - 5}l4,5h-2.5v4h-3v-4h-2.5z" fill="#1b1915"/><title>« ${esc(e.title || '')} » monte : ${esc(STAGES_LBL[mv.to])} · ${fmt(mv.at)}</title></g>`);
  }));
  const months = Array.from({ length: 7 }, (_, i) => { const [x, y] = pt(i / 6); return `<line x1="${x}" x2="${x}" y1="${y - 8}" y2="${y + 8}" class="rt-tick"/><text x="${x}" y="${H - 6}" class="rt-m" text-anchor="middle">${i === 0 ? 'Départ' : i === 6 ? 'Album' : `M${i}`}</text>`; }).join('');
  const [nx, ny] = pt(fNow);
  return `<svg viewBox="0 0 ${W} ${H}" class="route" role="img" aria-label="Notre route : chaque action placée dans le temps">
      <path d="${path(0, 1)}" class="rt-future"/><path d="${path(0, fNow)}" class="rt-done"/>${months}${marks.join('')}
      <g transform="translate(${nx},${ny})"><circle r="11" class="rt-now"/><text y="${ny > 125 ? 34 : -22}" text-anchor="middle" class="rt-today">Aujourd’hui</text></g>
    </svg>
    <div class="rt-legend"><span><i class="lg-flame">${FLAME()}</i>Séance (plus grosse si le feu était fort)</span><span><i class="lg-dot"></i>Son au relais</span><span><i class="lg-sq"></i>Idée au mur</span><span><i class="lg-dia"></i>Chanson</span><span><i class="lg-star">★</i>Bravo</span><span><i class="lg-tri"></i>Jeu d’écriture</span><span><i class="lg-up">↑</i>Une idée qui monte d’étape</span><span class="muted">${esc(mem[0])} au-dessus de la route, ${esc(mem[1])} en dessous</span></div>`;
}
const DONNEES = [
  ['Séances', 'durée, format, cible, flammes et mot de chacun, debrief, repères du matériel', 'le rythme de la semaine, le feu, la route'],
  ['Prises et sons du relais', 'les fichiers audio, qui les a lancés, sur quoi ils sont posés', 'ce qui circule entre les séances'],
  ['Le mur', 'idées, liens, étape de chaque idée (brute → dans le set)', 'les cibles du mois, ce qui coince'],
  ['Paroles et jeux', 'chansons, champ lexical, cadavres exquis, vos ateliers', 'la matière des textes'],
  ['Voix', 'empreintes vocales datées, carte des accords (temps chanté et juste)', 'ce qui progresse'],
  ['Bravos et autoévaluations', 'qui, quoi, quand', 'les courbes d’évolution'],
];

export default {
  id: 'bilan',
  mount(el) {
    // Redessine le bilan selon l’onglet choisi (semaine, mois, séance…).
    function render() {
      if (!espace.connected || !espace.me) { espaceGate(el, { onReady: render }); return; }
      const tab = TABS.find((t) => t[0] === location.hash.split('/')[2])?.[0] || 'semaine';
      const tabs = `<div class="seg-tabs b-tabs" role="tablist">${TABS.map(([id, l]) => `<a role="tab" href="#/bilan/${id}" aria-selected="${id === tab}">${l}</a>`).join('')}<a href="#/evolution" class="b-courbes">Nos courbes →</a></div>`;
      if (tab !== 'mois') {
        el.innerHTML = `<div class="mod-head"><div><p class="eyebrow">Notre bilan</p><h1>${tab === 'seance' ? 'Les traces de nos séances' : 'Notre semaine'}</h1><p class="muted">${tab === 'seance' ? 'Chaque séance laisse sa trace : le feu, un mot, ce qu’on voulait, ce qu’on a entendu, la prochaine cible.' : 'Le rythme, le feu et ce qui s’est passé entre les séances. Une seule chose à viser ensuite.'}</p></div></div>${tabs}${tab === 'seance' ? seanceHTML() : `${semaineHTML(espace.meta.members || MEMBERS)}${historiqueHTML()}`}`;
        return;
      }
      const mem = espace.meta.members || MEMBERS;
      const now = Date.now();
      const start = planStart();
      const m = currentMonth();
      const ctx = planContext();
      const goal = m ? PLAN[m - 1] : null;
      const got = goal ? goal.mesure(ctx) : 0;
      const r = weekRhythm();

      // ---- 30 derniers jours vs les 30 d'avant ----
      const between = (a, b) => (e) => e.createdAt >= now - a * DAY && e.createdAt < now - b * DAY;
      const count = (f, win) => espace.entries.filter((e) => f(e) && win(e)).length;
      const isSession = (e) => e.type === 'session' && e.data?.done;
      const minutes = (win) => espace.entries.filter((e) => isSession(e) && win(e)).reduce((s, e) => s + Math.max(0, Math.min(240, (e.data.doneAt - e.data.startedAt - (e.data.pausedTotal || 0)) / 60000)), 0);
      const now30 = between(30, 0); const prev30 = between(60, 30);
      const stats = [
        ['Sessions', (w) => count(isSession, w)],
        ['Heures jouées', (w) => Math.round(minutes(w) / 6) / 10],
        ['Sons au relais', (w) => count((e) => e.data?.relais, w)],
        ['Idées au mur', (w) => count((e) => ['note', 'texte', 'audio', 'essai'].includes(e.type) && !e.data?.relais, w)],
        ['Bravos', (w) => count((e) => e.type === 'bravo', w)],
      ].map(([label, f]) => ({ label, v: f(now30), d: f(now30) - f(prev30) }));

      // ---- Ce qui progresse ----
      const up = [];
      mem.forEach((x) => {
        const h = profileOf(x)?.voixHist || [];
        if (h.length >= 2) {
          const a = h[0]; const b = h[h.length - 1];
          const gain = (b.high - b.low) - (a.high - a.low);
          up.push(`<b style="color:${memberColor(x)}">${esc(x)}</b> : tessiture ${gain > 0 ? `<b>+${gain} demi-ton${gain > 1 ? 's' : ''}</b>` : 'stable'} depuis le ${fmt(a.at)} (${nameFR(b.low)} → ${nameFR(b.high)}).`);
        }
      });
      const map = carte();
      const tot = map.reduce((s, x) => s + x.s, 0);
      const just = tot ? map.reduce((s, x) => s + x.j * x.s, 0) / tot : null;
      if (just != null) up.push(`Dans les accords de Frog, la voix de Zaza est juste <b>${Math.round(just * 100)} %</b> du temps (${Math.round(tot / 60)} min chantées).`);
      const mg = notesMagiques(3);
      if (mg.length) up.push(`Les notes magiques de la voix : <b>${mg.map((x) => nameFR(x.m)).join(', ')}</b> (les plus stables).`);
      if (ctx.stage(2)) up.push(`<b>${ctx.stage(2)}</b> idée${ctx.stage(2) > 1 ? 's' : ''} en chantier ou plus loin, dont <b>${ctx.stage(3)}</b> jouable${ctx.stage(3) > 1 ? 's' : ''}.`);
      const evals = espace.entries.filter((e) => e.type === 'evaluation').length;
      if (evals) up.push(`<b>${evals}</b> autoévaluation${evals > 1 ? 's' : ''} : <a href="#/evolution">voir les courbes</a>.`);

      // ---- Ce qui coince ----
      const stuck = [];
      if (start && r.duo < 2) stuck.push(`${r.duo} session duo sur 2 cette semaine.`);
      if (start && !r.ecoute) stuck.push('Pas d’écoute commune depuis 2 semaines : vos prises attendent.');
      const old = espace.entries.filter((e) => ['note', 'audio', 'texte'].includes(e.type) && !e.data?.relais && (e.data?.stage || 0) === 0 && now - e.createdAt > 14 * DAY).length;
      if (old >= 3) stuck.push(`${old} idées brutes de plus de 2 semaines n’ont pas bougé : triez-les au mur.`);
      const lastRelais = Math.max(0, ...espace.entries.filter((e) => e.data?.relais).map((e) => e.createdAt));
      if (now - lastRelais > 7 * DAY) stuck.push('Aucun son lancé au relais depuis une semaine.');
      if (just != null && just < 0.6) stuck.push('La justesse dans les accords est sous 60 % : de courtes reprises de notes aideront.');

      // ---- Les 3 prochains exercices ----
      const picks = [];
      if (just == null || just < 0.65) picks.push('x-accord');
      if (now - lastRelais > 5 * DAY) picks.push('x-relais');
      if (m >= 4 && ctx.paroles < 3) picks.push('x-objet');
      // Frog au piano : un exercice du coin piano, différent chaque semaine.
      if (espace.me === (espace.meta.members || ['Zaza', 'Frog'])[1]) { const pn = Object.keys(EXERCICES).filter((k) => k.startsWith('p-')); picks.push(pn[Math.floor(now / (7 * DAY)) % pn.length]); }
      for (const id of MONTH_EX[m || 1]) if (picks.length < 3 && !picks.includes(id)) picks.push(id);
      const ex = picks.slice(0, 3).map((id) => (APP_EX[id] ? { id, ...APP_EX[id] } : { id, ...EXERCICES[id], why: WHY[id] || (id.startsWith('p-') ? 'Pour toi au piano : la voix de Zaza au centre, cette semaine.' : '') }));

      el.innerHTML = `
        <div class="mod-head">
          <div>
            <p class="eyebrow">Notre bilan</p>
            <h1>${goal ? `Mois ${m} sur 6` : 'Le parcours n’a pas encore démarré'}</h1>${goal ? `<p class="b-titre">${esc(goal.titre)}</p>` : ''}
            <p class="muted">${goal ? `Cible du mois : <b>${esc(goal.sortie)}</b>. Vous en êtes à <b>${Math.min(got, goal.cible)} sur ${goal.cible}</b>. Départ le ${fmt(start)}.` : 'Posez votre vision et la date de départ sur l’accueil : le bilan se remplit ensuite tout seul.'}</p>
          </div>
          <div class="actions"><button class="btn" data-b="copy">Copier le bilan</button><button class="btn ghost" data-b="print">Imprimer</button></div>
        </div>
        ${tabs}

        <section class="parcours" aria-label="Les six mois">
          ${PLAN.map((p) => {
            const n = p.mesure(ctx);
            const pct = Math.min(100, Math.round((n / p.cible) * 100));
            const st = !m ? 'next' : p.n < m ? 'past' : p.n === m ? 'now' : 'next';
            return `<div class="pc-month ${st}" style="--p:${st === 'next' ? 0 : pct}%"><span class="pc-n">${p.n}</span><b>${esc(p.titre)}</b><i class="pc-bar"></i><small>${esc(p.sortie)} · ${Math.min(n, p.cible)}/${p.cible}</small></div>`;
          }).join('')}
        </section>

        ${(() => { const l = lune(); const lm = espace.meta.lune; return lm?.cycle === l.cycle && Object.keys(lm.intentions || {}).length ? `<section class="panel lune-bilan"><h2>${luneSVG(l, 22)} Les intentions du cycle</h2>${Object.entries(lm.intentions).map(([w, x]) => `<p><b style="color:${memberColor(w)}">${esc(w)}</b> « ${esc(x)} »</p>`).join('')}<p class="muted small">Depuis la nouvelle lune du ${fmt(new Date(lm.cycle + 'T12:00'))}. ${esc(l.nom)} aujourd’hui.</p></section>` : ''; })()}
        ${start ? `<section class="panel"><div class="panel-head"><h2>Notre route</h2><span class="muted small">Chaque action y laisse sa marque</span></div>${routeHTML(start, mem)}</section>` : ''}

        <section class="panel">
          <div class="panel-head"><h2>Les 30 derniers jours</h2><span class="muted small">comparés aux 30 d’avant</span></div>
          <div class="b-stats">${stats.map((x) => `<div><b>${x.v}</b><span>${x.label}</span>${x.d ? `<small class="${x.d > 0 ? 'up' : 'down'}">${x.d > 0 ? '▲' : '▼'} ${Math.abs(Math.round(x.d * 10) / 10)}</small>` : '<small>=</small>'}</div>`).join('')}</div>
        </section>

        <div class="b-two">
          <section class="panel b-up"><h2>Ce qui progresse</h2>${up.length ? `<ul>${up.map((x) => `<li>${x}</li>`).join('')}</ul>` : '<p class="muted">Les premières traces arrivent avec vos premières sessions, empreintes vocales et minutes de Voix + piano.</p>'}</section>
          <section class="panel b-stuck"><h2>Ce qui coince</h2>${stuck.length ? `<ul>${stuck.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p>Rien qui coince. Gardez le rythme.</p>'}</section>
        </div>

        <section class="b-next">
          <h2>Les 3 prochains exercices</h2>
          <p class="muted">Choisis d’après votre mois et vos données. Chacun dit pourquoi, et sur quelle recherche il s’appuie.</p>
          <div class="b-ex">${ex.map((x, i) => `
            <article class="b-card">
              <span class="b-num">${i + 1}</span>
              <h3>${esc(x.nom)}</h3>
              <p class="b-why">${esc(x.why || '')}</p>
              <ol>${(x.comment || []).map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
              <p class="b-foot"><span>${x.duree} min</span><cite>${esc(x.src || '')}</cite></p>
              ${EXERCICES[x.id] ? `<button class="btn small primary" data-exo="${esc(x.id)}">▶ Faire l’exercice</button>` : ''}
              ${EXERCICES[x.id] ? exempleHTML(x.id, x.nom) : ''}
              ${x.href ? `<a class="btn small" href="${x.href}">Ouvrir →</a>` : '<a class="btn small" href="#/session">Dans une session →</a>'}
            </article>`).join('')}</div>
        </section>

        <section class="panel"><h2>La carte de nos accords</h2>${carteHTML(map)}</section>
        <details class="panel donnees"><summary><h2>Ce que l’app garde, et à quoi ça sert</h2></summary>
          <table><thead><tr><th>Quoi</th><th>Ce qui est gardé</th><th>Ce que ça nourrit</th></tr></thead><tbody>${DONNEES.map(([a, b, c]) => `<tr><th>${a}</th><td>${b}</td><td>${c}</td></tr>`).join('')}</tbody></table>
          <p class="muted small">Tout vit dans votre espace (Netlify), accessible avec votre lien ou votre mot secret. Rien n’est revendu ni analysé ailleurs. Effacer l’espace efface tout.</p>
        </details>`;

      el.dataset.text = [
        'FLIP · notre bilan',
        goal ? `Mois ${m}/6 : ${goal.titre} (${Math.min(got, goal.cible)}/${goal.cible})` : 'Parcours pas encore démarré',
        `30 jours : ${stats.map((x) => `${x.label.toLowerCase()} ${x.v}`).join(', ')}`,
        ...up.map((x) => `+ ${x.replace(/<[^>]+>/g, '')}`),
        ...stuck.map((x) => `! ${x}`),
        `Prochains exercices : ${ex.map((x) => x.nom).join(' · ')}`,
      ].join('\n');
    }
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-b]')?.dataset.b;
      if (b === 'copy') { await navigator.clipboard?.writeText(el.dataset.text || ''); toast('Bilan copié.'); }
      if (b === 'print') window.print();
    });
    bindExemples(el);
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-exo]'); if (b) import('../exercice.js').then((m) => m.faireExercice(b.dataset.exo)); });
    const off = onEspace((w) => { if (w === 'entries' || w === 'meta') render(); });
    const onHash = () => { if (location.hash.startsWith('#/bilan')) render(); };
    window.addEventListener('hashchange', onHash);
    render();
    return () => { off(); window.removeEventListener('hashchange', onHash); };
  },
};

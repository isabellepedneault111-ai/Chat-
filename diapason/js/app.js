// Coquille de l'application de Zaza & Frog : routage, micro, « pourquoi ça marche », contraintes, visite guidée.
import { $, $$, toast, store } from './ui.js';
import { toggleMic, onMicStatus, onPitch } from './audio.js';
import { MODULES } from './data.js';
import { POURQUOI, CONTRAINTES } from './duo.js';
import session, { activeSession } from './views/session.js';
import depart from './views/depart.js';
import evolution from './views/evolution.js';
import accord from './views/accord.js';
import relais from './views/relais.js';
import ambiances from './views/ambiances.js';
import bilan from './views/bilan.js';
import jeux from './views/jeux.js';
import coffre from './views/coffre.js';
import lexique from './views/lexique.js';
import ecrireV from './views/ecrire.js';
import atelier from './views/atelier.js';
import corbeille from './views/corbeille.js';
import etincelles from './views/etincelles.js';
import { initEtincelle } from './etincelle.js';
import { maybeTour } from './views/tour.js';
import home from './views/home.js';
import miroir from './views/miroir.js';
import tessiture from './views/tessiture.js';
import gym from './views/gym.js';
import labo from './views/labo.js';
import studio from './views/studio.js';
import paroles from './views/paroles.js';
import carnet from './views/carnet.js';
import { boot, joinEspace, espace, onEspace } from './espace.js';

// Pourquoi chaque page existe, en une ligne, avec ses appuis.
const APPUIS = {
  home: ['Séances courtes et régulières plutôt que rares et longues ; une vision commune avant de composer.', 'Rohrer 2004 · Merchán-Sánchez-Jara 2023'],
  carnet: ['Une idée passe par générer, écouter, construire, fixer, jouer : la rendre visible la fait avancer.', 'Biasutti 2018 · Aslan 2016'],
  session: ['Exploration, sélection, stabilisation, et toujours une prise ; le debrief nomme l’écart et la prochaine cible.', 'Biasutti 2017 · Montemayor 2014 · Marino 2023'],
  relais: ['Des contacts créatifs courts et rapprochés soutiennent l’élan mieux que de rares longues séances ; l’appel-réponse construit un vocabulaire commun.', 'Cepeda et al. 2006 · Bertolani 2019'],
  accord: ['Un retour visuel en temps réel améliore la justesse ; chanter dans de vrais accords entraîne l’oreille harmonique.', 'Welch, Howard & Rush 1989 · Hoppe et al. 2006'],
  ambiances: ['Partir d’une image concrète guide le timbre et la couleur de la voix ; écrire par les sens donne des images chantables.', 'Biasutti 2017 · MacGlone 2024 · Pattison 2009'],
  jeux: ['La contrainte libère : moins de choix, plus d’invention.', 'De Bruin 2019 · Merchán-Sánchez-Jara 2023 · Oulipo'],
  ecrire: ['Écrire régulièrement, sans juger, nourrit la matière ; trier vient après.', 'Pattison 2009'],
  atelier: ['Écriture libre, puis par les sens, puis sous contrainte, puis tri : de la matière à la ligne qui chante.', 'Pattison 2009 · Breton et Soupault 1919 · Oulipo'],
  bilan: ['Voir ses progrès et nommer la prochaine cible soutient la motivation et la pratique délibérée.', 'Miksza 2023 · Biasutti 2017'],
  paroles: ['Les syllabes chantées et la place des rimes font qu’un texte se chante.', 'Pattison 2009'],
};

const routes = { '': home, miroir, tessiture, gym, labo, studio, paroles, carnet, mur: carnet, session, depart, evolution, accord, relais, ambiances, bilan, jeux, coffre, lexique, ecrire: ecrireV, atelier, corbeille, etincelles };
initEtincelle();
const VOIX = ['accord', 'miroir', 'tessiture', 'gym'];
const view = $('#view');
let cleanup = null;
let currentId = 'home';

async function route() {
  const id = location.hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  // Lien d'invitation : #/rejoindre/<espace>
  // Aperçu de la visite de Frog : elle se joue sans être marquée comme vue pour lui.
  if (id === 'apercu-visite') {
    location.replace('#/');
    // Appareil pas encore connecté : on le dit, et l'aperçu démarrera dès la connexion.
    if (!espace.id) { store.set('apercuApres', true); toast('Pour voir la visite de Frog : choisis ton nom et entre votre mot secret. Elle démarrera toute seule.'); return; }
    import('./views/tour.js').then((t) => { const go = (n = 0) => (espace.meta ? t.startTour(true) : n < 40 && setTimeout(() => go(n + 1), 250)); go(); });
    return;
  }
  if (id === 'rejoindre') {
    const sid = location.hash.split('/')[2];
    try { await joinEspace(sid); } catch { toast('Ce lien d’espace ne fonctionne pas (ou l’espace a été effacé).'); }
    location.replace('#/');
    maybeTour();
    return;
  }
  const v = routes[id] || home;
  cleanup?.();
  cleanup = null;
  // Conteneur neuf à chaque module : ses écouteurs disparaissent avec lui.
  const host = document.createElement('div');
  host.className = `view-${v.id}`;
  view.replaceChildren(host);
  // Voix regroupe les 3 outils vocaux : petite barre d'onglets en haut.
  if (VOIX.includes(v.id)) {
    const sub = document.createElement('nav');
    sub.className = 'subnav';
    sub.setAttribute('aria-label', 'Voix');
    sub.innerHTML = VOIX.map((m) => { const mm = MODULES.find((x) => x.id === m); return `<a href="#/${m}" class="${m === v.id ? 'active' : ''}" style="--c:${mm.color}"><span class="mono">${mm.num}</span>${mm.name}</a>`; }).join('');
    view.prepend(sub);
  }
  const mod = MODULES.find((m) => m.id === v.id);
  view.style.setProperty('--accent', mod ? mod.color : 'var(--rec)');
  currentId = v.id;
  cleanup = v.mount(host) || null;
  const ap = APPUIS[v.id];
  if (ap) { const f = document.createElement('p'); f.className = 'appui'; f.innerHTML = `<span>Pourquoi :</span> ${ap[0]} <cite>${ap[1]}</cite>`; view.appendChild(f); }
  const group = VOIX.includes(v.id) ? 'voix' : v.id === 'ambiances' ? 'relais' : v.id === 'bilan' || v.id === 'evolution' ? 'home' : ['jeux', 'paroles', 'atelier', 'ecrire'].includes(v.id) ? 'ecrire' : v.id;
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.id === group));
  if (v.id === 'carnet') { unseen = 0; showBadge(); }
  document.title = mod ? `${mod.name} · FLIP` : 'FLIP · Zaza & Frog';
  renderPistes();
  window.scrollTo({ top: 0 });
}
window.addEventListener('hashchange', route);
// Le petit secret : FLIP retourné, c'est PLIF. Le bruit d'une goutte. Le feu et l'eau.
document.querySelector('.logo-flip')?.addEventListener('click', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  f.classList.toggle('flipped');
  if (f.classList.contains('flipped')) { toast('FLIP retourné : PLIF. Le bruit d’une goutte. Le feu et l’eau.'); setTimeout(() => f.classList.remove('flipped'), 4000); }
});

// --- Micro global ---
const micBtn = $('#micBtn');
micBtn.addEventListener('click', async () => {
  const ok = await toggleMic();
  if (ok === false && !micBtn.classList.contains('on')) return;
});
onMicStatus((on, err) => {
  micBtn.classList.toggle('on', on);
  micBtn.setAttribute('aria-pressed', on);
  micBtn.querySelector('.mic-label').textContent = on ? 'En écoute' : 'Micro';
  if (err) toast('Micro refusé. Autorise-le dans la barre d’adresse du navigateur.');
});
onPitch((p, rms) => {
  micBtn.style.setProperty('--lvl', Math.min(1, rms * 12).toFixed(3));
});

// --- Pourquoi ça marche : la recherche, section par section ---
const drawer = $('#drawer');
const scrim = $('#scrim');
function renderPistes() {
  const key = VOIX.includes(currentId) ? 'voix' : currentId;
  const p = POURQUOI[key] || POURQUOI.home;
  $('#drawerBody').innerHTML = `
    <p class="drawer-intro">${p.titre}</p>
    <ul class="research">${p.points.map(([t, src]) => `<li><p>${t}</p><cite>${src}</cite></li>`).join('')}</ul>
    <div class="hors"><b>La source</b><p>La recherche Consensus de Zaza : « deux personnes qui souhaitent jouer de la musique ensemble », de la préparation à la composition originale.</p></div>
    <p class="fineprint">Le micro est analysé en direct sur l’appareil. Ce que vous ajoutez au mur est stocké dans votre espace à deux.</p>`;
}
function openDrawer(open) {
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', !open);
  scrim.hidden = !open;
  if (open) $('#drawerClose').focus();
}
$('#pistesBtn').addEventListener('click', () => openDrawer(!drawer.classList.contains('open')));
$('#drawerClose').addEventListener('click', () => openDrawer(false));
scrim.addEventListener('click', () => openDrawer(false));

// --- Contrainte surprise : la contrainte libère ---
const modal = $('#modal');
let lastDefi = -1;
function rollDefi() {
  const pool = CONTRAINTES;
  let i;
  do { i = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && i === lastDefi);
  lastDefi = i;
  const t = $('#modalTitle');
  t.classList.remove('pop');
  void t.offsetWidth;
  t.textContent = pool[i];
  t.classList.add('pop');
}
$('#defiBtn').addEventListener('click', () => { rollDefi(); modal.hidden = false; $('#modalClose').focus(); });
$('#modalAgain').addEventListener('click', rollDefi);
$('#modalClose').addEventListener('click', () => { modal.hidden = true; });
modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { modal.hidden = true; openDrawer(false); }
});

// --- Mode projecteur ---
const projBtn = $('#projBtn');
function setProj(on) {
  document.documentElement.classList.toggle('projector', on);
  projBtn.setAttribute('aria-pressed', on);
  store.set('projector', on);
}
projBtn.addEventListener('click', () => setProj(!document.documentElement.classList.contains('projector')));
setProj(store.get('projector', false));

// Pastille « nouveau » sur Carnet quand le duo ajoute quelque chose ailleurs dans l'app.
let unseen = 0;
function showBadge() {
  const b = $('#nav [data-id=carnet] .badge');
  b.hidden = !unseen;
  b.textContent = unseen > 9 ? '9+' : unseen;
}
onEspace((what, extra) => {
  if (what === 'entries') $('#nav .nav-session').classList.toggle('live', !!activeSession());
  if (what === 'entries' && extra?.fresh?.length && currentId !== 'carnet') {
    unseen += extra.fresh.length;
    showBadge();
    if (!['paroles', 'home', 'session'].includes(currentId) && extra.fresh[0].type !== 'session') toast(`${extra.fresh[0].editedBy || extra.fresh[0].author} a ajouté quelque chose au mur.`);
  }
});

boot().then(() => maybeTour());
route();

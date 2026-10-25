// Coquille de l'application : routage, micro global, pistes, défis, mode projecteur.
import { $, $$, toast, store } from './ui.js';
import { toggleMic, onMicStatus, onPitch } from './audio.js';
import { PISTES, DEFIS_SURPRISE, MODULES } from './data.js';
import home from './views/home.js';
import miroir from './views/miroir.js';
import tessiture from './views/tessiture.js';
import gym from './views/gym.js';
import labo from './views/labo.js';
import studio from './views/studio.js';
import paroles from './views/paroles.js';
import carnet from './views/carnet.js';
import { boot, joinEspace, espace, onEspace } from './espace.js';

const routes = { '': home, miroir, tessiture, gym, labo, studio, paroles, carnet };
const EXPLORER = ['miroir', 'tessiture', 'gym', 'labo'];
const view = $('#view');
let cleanup = null;
let currentId = 'home';

async function route() {
  const id = location.hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  // Lien d'invitation : #/rejoindre/<espace>
  if (id === 'rejoindre') {
    const sid = location.hash.split('/')[2];
    try { await joinEspace(sid); toast(`Bienvenue dans « ${espace.meta.name} »!`); } catch { toast('Ce lien d’espace ne fonctionne pas (ou l’espace a été effacé).'); }
    location.replace('#/carnet');
    return;
  }
  const v = routes[id] || home;
  cleanup?.();
  cleanup = null;
  // Conteneur neuf à chaque module : ses écouteurs disparaissent avec lui.
  const host = document.createElement('div');
  host.className = `view-${v.id}`;
  view.replaceChildren(host);
  // Explorer regroupe les 4 modules de découverte : petite barre d'onglets en haut.
  if (EXPLORER.includes(v.id)) {
    const sub = document.createElement('nav');
    sub.className = 'subnav';
    sub.setAttribute('aria-label', 'Explorer');
    sub.innerHTML = EXPLORER.map((m) => { const mm = MODULES.find((x) => x.id === m); return `<a href="#/${m}" class="${m === v.id ? 'active' : ''}" style="--c:${mm.color}"><span class="mono">${mm.num}</span>${mm.name}</a>`; }).join('');
    view.prepend(sub);
  }
  const mod = MODULES.find((m) => m.id === v.id);
  view.style.setProperty('--accent', mod ? mod.color : 'var(--rec)');
  currentId = v.id;
  cleanup = v.mount(host) || null;
  const group = EXPLORER.includes(v.id) ? 'explorer' : v.id;
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.id === group));
  if (v.id === 'carnet') { unseen = 0; showBadge(); }
  document.title = mod ? `${mod.name} · Diapason` : 'Diapason — le labo où le son devient visible';
  renderPistes();
  window.scrollTo({ top: 0 });
}
window.addEventListener('hashchange', route);

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

// --- Pistes pédagogiques ---
const drawer = $('#drawer');
const scrim = $('#scrim');
function renderPistes() {
  const p = PISTES[currentId] || PISTES.home;
  const li = (arr) => arr.map((x) => `<li>${x}</li>`).join('');
  $('#drawerBody').innerHTML = `
    <p class="drawer-intro">${p.intro}</p>
    <h3>Questions pour faire réfléchir</h3><ul class="q-list">${li(p.questions)}</ul>
    ${p.defis ? `<h3>Défis</h3><ul class="d-list">${li(p.defis)}</ul>` : ''}
    <h3>Liens avec le programme</h3><ul class="tags">${li(p.liens)}</ul>
    <div class="hors"><b>En dehors de la boîte</b><p>${p.hors}</p></div>
    <p class="fineprint">Aucune donnée ne quitte l’appareil : le micro est analysé en direct et les profils restent dans ce navigateur.</p>`;
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

// --- Défi surprise ---
const modal = $('#modal');
let lastDefi = -1;
function rollDefi() {
  const p = PISTES[currentId];
  const pool = [...DEFIS_SURPRISE, ...(p?.defis || [])];
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
  if (what === 'entries' && extra?.fresh?.length && currentId !== 'carnet') {
    unseen += extra.fresh.length;
    showBadge();
    if (currentId !== 'paroles' && currentId !== 'home') toast(`${extra.fresh[0].author} a ajouté quelque chose dans le carnet.`);
  }
});

boot();
route();

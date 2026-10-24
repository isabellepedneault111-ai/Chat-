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

const routes = { '': home, miroir, tessiture, gym, labo, studio };
const view = $('#view');
let cleanup = null;
let currentId = 'home';

function route() {
  const id = location.hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  const v = routes[id] || home;
  cleanup?.();
  cleanup = null;
  // Conteneur neuf à chaque module : ses écouteurs disparaissent avec lui.
  const host = document.createElement('div');
  host.className = `view-${v.id}`;
  view.replaceChildren(host);
  const mod = MODULES.find((m) => m.id === v.id);
  view.style.setProperty('--accent', mod ? mod.color : 'var(--violet)');
  currentId = v.id;
  cleanup = v.mount(host) || null;
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.id === v.id));
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

route();

// Petits outils d'interface partagés.
import { isBlack, mtof, nameFR, nameEN } from './music.js';
import { pluck } from './audio.js';

// Raccourci : le premier élément de la page qui correspond au sélecteur.
export const $ = (sel, root = document) => root.querySelector(sel);
// Raccourci : tous les éléments de la page qui correspondent au sélecteur, en tableau.
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Lit une variable CSS (une couleur, une mesure) définie dans la feuille de style.
export function css(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Canvas net sur écran haute densité, redimensionné automatiquement.
export function autoCanvas(canvas) {
  const s = { w: 0, h: 0, ctx: canvas.getContext('2d') };
  const fit = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // Réassigner canvas.width efface le dessin : on ne le fait que si la taille change vraiment.
    if (Math.abs(r.width - s.w) < 1 && Math.abs(r.height - s.h) < 1 && canvas.width === Math.max(1, Math.round(r.width * dpr))) return;
    s.w = r.width;
    s.h = r.height;
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);
  fit();
  s.dispose = () => ro.disconnect();
  return s;
}

// Boucle d'animation annulable.
export function animate(fn) {
  let id = 0;
  let alive = true;
  const tick = (t) => {
    if (!alive) return;
    fn(t);
    id = requestAnimationFrame(tick);
  };
  id = requestAnimationFrame(tick);
  return () => { alive = false; cancelAnimationFrame(id); };
}

let toastTimer = 0;
// Affiche un petit message en bas de l’écran, qui disparaît tout seul après quelques secondes.
export function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// La mémoire de l’appareil (localStorage, préfixe « diapason: ») : lire et écrire sans planter si le navigateur la refuse.
export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('diapason:' + key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('diapason:' + key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
  },
};

// Le profil gardé dans cet appareil (l’ancien système, avant l’espace partagé).
export const getProfile = () => store.get('profile', null);

// Clavier de piano en DOM, jouable à la souris, au doigt et (optionnellement) au clavier d'ordi.
const PC_KEYS = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k', 'o', 'l', 'p', ';'];
// Dessine un clavier de piano jouable (souris, doigt, et lettres du clavier d’ordi si demandé) dans un élément de la page.
export function keyboard(host, { from = 48, to = 72, labels = true, playable = true, pcKeys = false, onPlay } = {}) {
  const el = document.createElement('div');
  el.className = 'kb';
  const keys = new Map();
  const whites = [];
  for (let m = from; m <= to; m++) if (!isBlack(m)) whites.push(m);
  const wPct = 100 / whites.length;
  for (let m = from; m <= to; m++) {
    const k = document.createElement('button');
    k.type = 'button';
    k.dataset.midi = m;
    k.setAttribute('aria-label', `${nameFR(m)} (${nameEN(m)})`);
    if (isBlack(m)) {
      const idx = whites.findIndex((w) => w > m);
      k.className = 'key black';
      k.style.left = `calc(${idx * wPct}% - ${wPct * 0.31}%)`;
      k.style.width = `${wPct * 0.62}%`;
    } else {
      k.className = 'key white';
      k.style.width = `${wPct}%`;
      if (labels && (m % 12 === 0 || whites.length <= 22)) {
        k.innerHTML = `<span>${nameFR(m)}</span>`;
      }
    }
    keys.set(m, k);
    el.appendChild(k);
  }
  host.appendChild(el);

  const press = (m) => {
    const k = keys.get(m);
    if (!k) return;
    import('./sampler.js').then((sp) => sp.notePiano(m, { when: 0 })).catch(() => pluck(mtof(m)));
    k.classList.add('down');
    setTimeout(() => k.classList.remove('down'), 180);
    onPlay?.(m);
  };
  if (playable) {
    el.addEventListener('pointerdown', (e) => {
      const k = e.target.closest('.key');
      if (k) { e.preventDefault(); press(+k.dataset.midi); }
    });
  }
  let offKeys = () => {};
  if (pcKeys) {
    const base = from % 12 === 0 ? from : from + (12 - (from % 12));
    const onKey = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.target.closest('input,textarea,select')) return;
      const i = PC_KEYS.indexOf(e.key.toLowerCase());
      if (i >= 0) press(base + i);
    };
    window.addEventListener('keydown', onKey);
    offKeys = () => window.removeEventListener('keydown', onKey);
  }

  return {
    el,
    keys,
    press,
    mark(m, cls, on = true) { keys.get(Math.round(m))?.classList.toggle(cls, on); },
    clear(cls) { keys.forEach((k) => k.classList.remove(cls)); },
    only(list, cls) {
      const set = new Set(list.map(Math.round));
      keys.forEach((k, m) => k.classList.toggle(cls, set.has(m)));
    },
    dispose() { offKeys(); el.remove(); },
  };
}

// Un anneau de progression en SVG (pct de 0 à 1) : le cercle se remplit à la proportion donnée.
export function ring(pct, size = 64, stroke = 6) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" class="ring-bg"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" class="ring-fg"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/></svg>`;
}

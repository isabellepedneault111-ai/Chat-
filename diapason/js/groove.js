// Un beat sous la voix, et un phrasé à chanter. Tenir la note quand c'est l'exercice ;
// jouer avec le rythme quand on veut s'amuser : la bande lumineuse dit quand chanter.
import { audio, drums } from './audio.js';
import { DRUM_PRESETS } from './data.js';
import { store } from './ui.js';

const ROWS = { k: 'kick', s: 'snare', h: 'hat', c: 'clap' };
// Les pas (sur 16 doubles-croches, ou 32 pour deux mesures) où la voix chante.
export const PHRASES = {
  libre: { nom: 'Libre', pas: null, aide: 'Chante comme tu veux sur le beat.' },
  tenu: { nom: 'Tenir', pas: [0], len: 16, aide: 'Une note par mesure, tenue jusqu’au bout.' },
  noires: { nom: 'Sur les temps', pas: [0, 4, 8, 12], len: 16, aide: 'Une note sur chaque temps.' },
  croches: { nom: 'Croches', pas: [0, 2, 4, 6, 8, 10, 12, 14], len: 16, aide: 'Deux notes par temps, légères.' },
  syncope: { nom: 'Syncopé 3-3-2', pas: [0, 3, 6, 8, 11, 14], len: 16, aide: 'Le balancement des musiques latines et du pop actuel.' },
  contre: { nom: 'Contretemps', pas: [2, 6, 10, 14], len: 16, aide: 'Entre les temps, comme le reggae.' },
  appel: { nom: 'Appel-réponse', pas: [0, 2, 4, 6, 8, 10], len: 32, aide: 'Une mesure tu chantes, une mesure tu écoutes.' },
};

export function grooveHTML() {
  const st = store.get('groove', { style: 'Pop', bpm: 84, phrase: 'libre' });
  return `<div class="groove" data-groove>
    <button class="btn small groove-play" data-g="play">▶ Beat</button>
    <label><span>Style</span><select data-g="style">${Object.keys(DRUM_PRESETS).filter((k) => k !== 'Vide').map((k) => `<option ${k === st.style ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    <label><span>Tempo</span><input type="range" min="56" max="140" value="${st.bpm}" data-g="bpm"><b class="mono groove-bpm">${st.bpm}</b></label>
    <label><span>Phrasé à chanter</span><select data-g="phrase">${Object.entries(PHRASES).map(([k, p]) => `<option value="${k}" ${k === st.phrase ? 'selected' : ''}>${p.nom}</option>`).join('')}</select></label>
    <div class="groove-strip" aria-hidden="true"></div>
    <p class="groove-aide muted small"></p>
  </div>`;
}

export function bindGroove(root) {
  const box = root.querySelector('[data-groove]');
  if (!box) return () => {};
  const st = store.get('groove', { style: 'Pop', bpm: 84, phrase: 'libre' });
  let on = false; let timer = 0; let next = 0; let step = 0; let raf = 0; let t0 = 0;
  const grid = () => Object.fromEntries(Object.entries(DRUM_PRESETS[st.style] || DRUM_PRESETS.Pop).map(([r, p]) => [r, p.split('').map(Number)]));
  let g = grid();
  const strip = () => {
    const p = PHRASES[st.phrase];
    const len = p.len || 16;
    box.querySelector('.groove-strip').innerHTML = p.pas ? Array.from({ length: len }, (_, i) => `<i class="${p.pas.includes(i) ? 'sing' : ''} ${i % 4 === 0 ? 'temps' : ''} ${len === 32 && i >= 16 ? 'ecoute' : ''}"></i>`).join('') : '';
    box.querySelector('.groove-aide').textContent = p.aide;
  };
  strip();
  const save = () => store.set('groove', st);
  const tick = () => {
    const c = audio();
    while (next < c.currentTime + 0.12) {
      const s = step % 16;
      Object.entries(ROWS).forEach(([r, fn]) => { if (g[r]?.[s]) drums[fn](next, s % 4 === 0 ? 1 : 0.75); });
      next += 60 / st.bpm / 4; step++;
    }
  };
  const draw = () => {
    if (!on || !box.isConnected) return;
    const c = audio(); const len = PHRASES[st.phrase].len || 16;
    const cur = Math.floor((c.currentTime - t0) / (60 / st.bpm / 4));
    box.querySelectorAll('.groove-strip i').forEach((x, i) => x.classList.toggle('now', cur >= 0 && cur % len === i));
    raf = requestAnimationFrame(draw);
  };
  const start = () => { const c = audio(); on = true; step = 0; next = c.currentTime + 0.08; t0 = next; timer = setInterval(tick, 25); tick(); raf = requestAnimationFrame(draw); box.querySelector('[data-g=play]').textContent = '■ Beat'; box.classList.add('on'); };
  const stop = () => { on = false; clearInterval(timer); cancelAnimationFrame(raf); box.querySelector('[data-g=play]').textContent = '▶ Beat'; box.classList.remove('on'); box.querySelectorAll('.groove-strip i.now').forEach((x) => x.classList.remove('now')); };
  box.addEventListener('click', (e) => { if (e.target.closest('[data-g=play]')) (on ? stop : start)(); });
  box.addEventListener('input', (e) => {
    if (e.target.dataset.g === 'bpm') {
      st.bpm = +e.target.value; box.querySelector('.groove-bpm').textContent = st.bpm; save();
      if (on) { const c = audio(); next = c.currentTime + 0.05; t0 = next; step = 0; }
    }
  });
  box.addEventListener('change', (e) => {
    if (e.target.dataset.g === 'style') { st.style = e.target.value; g = grid(); save(); if (on) { step = step - (step % 4); } }
    if (e.target.dataset.g === 'phrase') { st.phrase = e.target.value; save(); strip(); if (on) { const c = audio(); next = c.currentTime + 0.05; t0 = next; step = 0; } }
  });
  return stop;
}

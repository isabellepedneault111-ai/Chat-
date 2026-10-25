// Le tour de l'app : un projecteur sur chaque bouton, une phrase simple, et on voit la page.
// Il finit toujours au même endroit : l'étape 1, le point de départ.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STEPS = [
  { route: '#/', sel: '#nav [data-id=home]', t: 'L’accueil', d: 'Chaque jour : le truc à faire, nos séances ensemble, et ce que l’autre a fait pendant ton absence.' },
  { route: '#/', sel: '.fil', t: 'Ensemble, sans distance', d: 'Dans la même pièce, à distance en même temps, ou chacun son temps : on ne s’arrête plus quand on n’est pas ensemble.' },
  { route: '#/session', sel: '#nav [data-id=session]', t: 'Session', d: 'Le cœur de FLIP : une séance guidée, ensemble ou à distance. Elle finit toujours par un enregistrement.' },
  { route: '#/carnet', sel: '.sky-map, #nav [data-id=carnet]', t: 'Le mur', d: 'Nos idées en un ciel : le centre, c’est l’album. Tu cherches un mot, ça s’allume. Et FLIP propose des rencontres entre tes idées et les miennes.' },
  { route: '#/relais', sel: '#nav [data-id=relais]', t: 'Le relais', d: 'Quand on n’est pas ensemble : un son en une touche. L’autre répond par-dessus, couche après couche.' },
  { route: '#/ecrire', sel: '#nav [data-id=ecrire]', t: 'Écrire', d: 'Notre journal à deux, les séances d’écriture, le grimoire et nos paroles.' },
  { route: '#/accord', sel: '#nav [data-id=voix], .tool-voix', t: 'Voix + clavier', d: 'Tu joues un accord sur ton clavier MIDI (Chrome ou Edge). L’app allume les notes que je peux chanter, dans MA tessiture, celle mesurée au test de l’étape 1. Je chante : elle montre en direct si je tombe dans l’accord et quelle note je tiens. Et à chaque séance, elle retient où ma voix brille : nos notes magiques et la carte de nos accords.' },
  { route: '#/studio', sel: '#nav [data-id=studio]', t: 'Studio', d: 'Beats, grilles d’accords, instrument : pour construire et jouer.' },
  { route: '#/', sel: '.tool-coffre, .fil-coffre', t: 'Le coffre', d: 'Nos perles : le mot d’accueil, la visite, et tout ce qu’on y dépose d’un geste. Rien ne quitte sa place : le coffre garde une étoile dessus.' },
  { route: '#/', sel: '.etincelle', t: 'L’étincelle', d: 'Une idée, même à moitié, pour notre musique ou pour l’app? Touche la flamme, sur n’importe quelle page.' },
  { route: '#/depart', sel: '.mod-head h1, .view h1', t: 'Étape 1 : ton point de départ', d: 'Ce que tu veux, ta voix, tes styles. Cinq minutes. C’est ce qui nourrit notre plan de six mois.', final: true },
];

// Les sélecteurs sont essayés dans l'ordre : le premier visible gagne (la carte du mur avant son bouton).
const visible = (sel) => sel.split(',').map((x) => x.trim()).flatMap((x) => [...document.querySelectorAll(x)]).find((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; });

import { montrerExemples, retirerExemples } from './demo.js';

export function coachTour({ onEnd, premiere = false } = {}) {
  let i = 0;
  montrerExemples();
  const box = document.createElement('div');
  box.className = 'coach';
  box.innerHTML = `<div class="coach-hole"></div><div class="coach-bubble" role="dialog" aria-live="polite"></div>`;
  document.body.appendChild(box);
  const hole = box.querySelector('.coach-hole');
  const bubble = box.querySelector('.coach-bubble');
  const end = (go) => { retirerExemples(); box.remove(); removeEventListener('resize', place); removeEventListener('keydown', key); onEnd?.(); if (go) location.hash = go; };
  function place() {
    const s = STEPS[i];
    const el = visible(s.sel);
    const vw = innerWidth; const vh = innerHeight;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < 70 || r.bottom > vh - 20) { el.scrollIntoView({ block: 'center' }); }
      const q = el.getBoundingClientRect();
      const pad = 8;
      Object.assign(hole.style, { left: `${q.left - pad}px`, top: `${q.top - pad}px`, width: `${q.width + pad * 2}px`, height: `${q.height + pad * 2}px`, opacity: 1 });
      const bh = bubble.offsetHeight || 200;
      const below = q.bottom + 16 + bh < vh;
      const above = q.top - 16 - bh > 60;
      if (!below && !above) { // grand élément : la bulle se pose en bas de l'écran
        const bw2 = Math.min(380, vw - 24);
        Object.assign(bubble.style, { width: `${bw2}px`, left: `${(vw - bw2) / 2}px`, top: 'auto', bottom: '12px' });
        return;
      }
      const bw = Math.min(360, vw - 24);
      const left = Math.max(12, Math.min(vw - bw - 12, q.left + q.width / 2 - bw / 2));
      Object.assign(bubble.style, { width: `${bw}px`, left: `${left}px`, top: below ? `${q.bottom + 16}px` : 'auto', bottom: below ? 'auto' : `${vh - q.top + 16}px` });
    } else {
      Object.assign(hole.style, { opacity: 0 });
      const bw = Math.min(360, vw - 24);
      Object.assign(bubble.style, { width: `${bw}px`, left: `${(vw - bw) / 2}px`, top: `${vh / 2 - 90}px`, bottom: 'auto' });
    }
  }
  function show() {
    const s = STEPS[i];
    if (location.hash !== s.route && !(s.route === '#/' && (location.hash === '' || location.hash === '#'))) location.hash = s.route;
    bubble.innerHTML = `
      <p class="coach-n">${i + 1} / ${STEPS.length} <span class="coach-demo">exemples fictifs, pour voir le rendu</span></p>
      <h3>${esc(s.t)}</h3>
      <p>${esc(s.d)}</p>
      <div class="coach-row">
        ${s.final ? '<button class="btn primary big" data-c="go">Commencer l’étape 1</button>' : `${i ? '<button class="btn ghost small" data-c="prev">←</button>' : ''}<button class="btn primary" data-c="next">Suivant →</button>`}
        ${premiere ? '' : `<button class="coach-skip" data-c="skip">${s.final ? 'Plus tard' : 'Passer le tour'}</button>`}
      </div>`;
    setTimeout(place, 380);
    setTimeout(place, 900);
  }
  function key(e) { if (e.key === 'ArrowRight' && !STEPS[i].final) { i++; show(); } if (e.key === 'ArrowLeft' && i) { i--; show(); } if (e.key === 'Escape' && !premiere) end(); }
  bubble.addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (c === 'next') { i = Math.min(STEPS.length - 1, i + 1); show(); }
    if (c === 'prev') { i = Math.max(0, i - 1); show(); }
    if (c === 'skip') end(STEPS[i].final ? '#/' : null);
    if (c === 'go') end('#/depart');
  });
  addEventListener('resize', place);
  addEventListener('keydown', key);
  show();
}

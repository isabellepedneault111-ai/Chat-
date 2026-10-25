// Le tour de l'app : un projecteur sur chaque bouton, une phrase simple, et on voit la page.
// Il finit toujours au même endroit : l'étape 1, le point de départ.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Une idée par étape, des mots simples. Zaza parle (« je », « ma voix »), Frog lit (« tu », « ton clavier »).
const STEPS = [
  { route: '#/', sel: '#nav [data-id=home]', t: 'L’accueil', d: 'Ce qu’on fait aujourd’hui, et ce que l’autre a fait depuis ta dernière visite.' },
  { route: '#/', sel: '.fil', t: 'Toujours ensemble', d: 'Dans la même pièce, à distance, ou chacun son tour : on continue toujours.' },
  { route: '#/session', sel: '#nav [data-id=session]', t: 'La séance', d: 'Une séance guidée, étape par étape. Elle finit toujours par un enregistrement.' },
  { route: '#/carnet', sel: '.sky-map, #nav [data-id=carnet]', t: 'Le mur', d: 'Toutes nos idées. Au centre, l’album. Plus une idée avance, plus elle s’en approche.' },
  { route: '#/relais', sel: '#nav [data-id=relais]', t: 'Le relais', d: 'Tu m’envoies un son. Je chante par-dessus. Tu ajoutes une couche.' },
  { route: '#/ecrire', sel: '.ec-entry[data-id="demo-j0"], #nav [data-id=ecrire]', t: 'Écrire', d: 'Ta musique joue, je chante sans mots (le mumble), et les paroles viennent après. Ici, sur Projet 1.' },
  { route: '#/accord', sel: '#nav [data-id=voix], .tool-voix', t: 'Ton clavier, ma voix', d: 'Tu joues un accord. Je chante. L’écran montre si ma voix est juste.' },
  { route: '#/studio', sel: '#nav [data-id=studio]', t: 'Le studio', d: 'Des beats, des accords, et ton coin piano.' },
  { route: '#/', sel: '.tool-coffre, .fil-coffre', t: 'Le coffre', d: 'Nos meilleurs moments, gardés à part.' },
  { route: '#/', sel: '.etincelle', t: 'L’étincelle', d: 'Une idée te vient? Touche la flamme, de n’importe où.' },
  { route: '#/depart', sel: '.mod-head h1, .view h1', t: 'À toi : l’étape 1', d: 'Tes goûts, ta voix, tes envies. Cinq minutes. Notre plan part de là.', final: true },
];

// Les sélecteurs sont essayés dans l'ordre : le premier visible gagne (la carte du mur avant son bouton).
const visible = (sel) => sel.split(',').map((x) => x.trim()).flatMap((x) => [...document.querySelectorAll(x)]).find((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; });

import { montrerExemples, retirerExemples } from './demo.js';
import { espace, saveEntry } from './espace.js';
import { bandeStart, bandeSection, bandeStop } from './visite-sons.js';

// apercu : Zaza voit exactement le tour de Frog, avec seulement une sortie discrète.
export function coachTour({ onEnd, premiere = false, apercu = false } = {}) {
  let i = 0;
  montrerExemples();
  const box = document.createElement('div');
  box.className = 'coach';
  box.innerHTML = `<div class="coach-hole"></div><div class="coach-bubble" role="dialog" aria-live="polite"></div>`;
  document.body.appendChild(box);
  const hole = box.querySelector('.coach-hole');
  const bubble = box.querySelector('.coach-bubble');
  const end = (go) => { bandeStop(); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); retirerExemples(); box.remove(); removeEventListener('resize', place); removeEventListener('keydown', key); onEnd?.(); if (go) location.hash = go; };
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
    bandeSection('coach', i);
    // Pas d'effet entre les étapes : la musique de Frog joue d'un bout à l'autre, sans être coupée.
    if (location.hash !== s.route && !(s.route === '#/' && (location.hash === '' || location.hash === '#'))) location.hash = s.route;
    bubble.innerHTML = `
      <p class="coach-n">${i + 1} / ${STEPS.length} <span class="coach-demo">exemples fictifs, pour voir le rendu</span></p>
      <h3>${esc(s.t)}</h3>
      <p>${esc(s.d)}</p>
      <div class="coach-row">
        ${s.final ? '<button class="btn primary big" data-c="go">Commencer l’étape 1</button>' : `${i ? '<button class="btn ghost small" data-c="prev">←</button>' : ''}<button class="btn primary" data-c="next">Suivant →</button>`}
        ${apercu ? '<button class="coach-skip" data-c="skip">Fermer l’aperçu</button>' : premiere ? '' : `<button class="coach-skip" data-c="skip">${s.final ? 'Plus tard' : 'Passer le tour'}</button>`}
      </div>`;
    setTimeout(place, 380);
    setTimeout(place, 900);
  }
  // Le mot de la fin : Projet 1 revient, puis la question de Zaza. La réponse de Frog lui arrive.
  function question() {
    removeEventListener('keydown', key);
    bandeSection('accueil');
    const de = espace.meta?.welcome?.by || espace.meta?.createdBy || 'Zaza';
    box.classList.add('coach-fin');
    box.innerHTML = `<div class="cq" role="dialog" aria-live="polite">
      <p class="cq-1">Et puis…</p>
      <p class="cq-2">Ai-je réussi à te séduire ? ;P</p>
      <p class="cq-sign">— ${esc(de)}</p>
      <div class="cq-rep">
        <button class="btn primary" data-r="Oui.">Oui.</button>
        <button class="btn" data-r="Complètement.">Complètement.</button>
        <button class="btn" data-r="Pas encore… continue.">Pas encore… continue.</button>
      </div>
      <form class="cq-mots"><input name="mots" maxlength="280" placeholder="Ou dis-le avec tes mots…" autocomplete="off"><button class="btn small">Envoyer</button></form>
    </div>`;
    const repondre = async (r, mots = '') => {
      box.querySelector('.cq-rep').innerHTML = `<p class="cq-ok">${apercu ? 'Aperçu : sa réponse t’arrivera dans le journal.' : `Ta réponse part vers ${esc(de)}.`}</p>`;
      box.querySelector('.cq-mots').remove();
      if (!apercu) {
        try { await saveEntry({ type: 'texte', title: `Ai-je réussi à te séduire ? ${r || `« ${mots} »`}`.slice(0, 80), body: mots, data: { journal: true, date: new Date().toISOString().slice(0, 10), reponseVisite: true, stage: 0 } }); } catch { /* elle la verra au prochain essai */ }
      }
      setTimeout(() => end('#/depart'), 2200);
    };
    box.querySelector('.cq-rep').addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) repondre(b.dataset.r); });
    box.querySelector('.cq-mots').addEventListener('submit', (e) => { e.preventDefault(); const m = e.target.mots.value.trim(); if (m) repondre('', m); });
  }
  function key(e) { if (e.key === 'ArrowRight' && !STEPS[i].final) { i++; show(); } if (e.key === 'ArrowLeft' && i) { i--; show(); } if (e.key === 'Escape' && (!premiere || apercu)) end(); }
  bubble.addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (c === 'next') { i = Math.min(STEPS.length - 1, i + 1); show(); }
    if (c === 'prev') { i = Math.max(0, i - 1); show(); }
    if (c === 'skip') end(STEPS[i].final ? '#/' : null);
    if (c === 'go') question();
  });
  addEventListener('resize', place);
  addEventListener('keydown', key);
  bandeStart('coach');
  show();
}

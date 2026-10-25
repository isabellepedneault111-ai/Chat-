// La visite guidée : la première fois que Frog entre, Zaza l'accueille, puis l'app montre son sens.
// Pas des bulles d'aide : des écrans plein format, comme un livret d'album.
import { espace, audioURL, updateEspace } from '../espace.js';
import { store } from '../ui.js';
import { embers } from '../rituel.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const seenKey = () => `tourSeen:${espace.id}:${espace.me}`;
// Vue une fois pour toutes, sur n'importe quel appareil : retenu dans l'espace.
const seenInSpace = () => !!espace.meta?.tour?.[espace.me];

export function maybeTour() {
  if (!espace.connected || !espace.me) return;
  if (store.get('apercuApres', false)) { store.set('apercuApres', false); startTour(true); return; }
  if (espace.meta.createdBy && espace.me === espace.meta.createdBy) return; // celle qui a créé l'espace n'a pas besoin de la visite
  if (store.get(seenKey(), false) || seenInSpace()) return;
  startTour(false);
}

export function startTour(preview) {
  if (document.querySelector('.tour')) return;
  const me = preview ? (espace.meta.members || ['Zaza', 'Frog']).find((m) => m !== espace.me) || 'Frog' : espace.me;
  const from = espace.meta.welcome?.by || espace.meta.createdBy || 'Zaza';
  const welcome = espace.meta.welcome?.text || 'Forever more…';
  const slides = [
    `<div class="t-open">
       <img class="t-logo" src="img/flip-creme.svg" alt="FLIP">
       <p class="t-welcome">${esc(welcome).replace(/\n/g, '<br>')}</p>
       <p class="t-sign">— ${esc(from)}</p>
       <p class="t-auteure">FLIP, un espace imaginé par ${esc(from)}, pour nous deux.</p>
       ${espace.meta.welcome?.audio ? '<button class="t-play" data-t="play">▶ Écouter</button>' : ''}
       <button class="btn big t-start" data-t="next">Commencer · 3 minutes, avec le son</button>
       <p class="t-howto">Ensuite, touche la flèche (ou le côté droit de l’écran) pour avancer.</p>
     </div>`,
    `<p class="t-kicker">Ce que ${esc(from)} a imaginé pour nous</p>
     <h2>Ensemble. <i>Sans distance.</i></h2>
     <div class="t-modes">
       <div><b>Dans la même pièce</b><span>On joue, l’app s’efface : une séance guidée sur un seul écran.</span></div>
       <div><b>À distance, en même temps</b><span>La même séance sur nos deux écrans, qui avance pour les deux.</span></div>
       <div><b>Chacun son temps</b><span>Un son, une réponse par-dessus, une page au journal.</span></div>
       <div><b>Seul, pour nous deux</b><span>Ce que l’un pratique, l’autre le voit, avec des pistes.</span></div>
     </div>
     <p class="t-soon"><b>Nos élans ne s’arrêtent plus quand on n’est pas ensemble.</b></p>`,
    `<p class="t-kicker">${esc(me)}, regarde. Une minute.</p>
     <div class="t-vwrap"><video class="t-video" src="data/demo-frog.mp4" poster="data/demo-frog.jpg" playsinline controls preload="auto"></video><button class="t-unmute" data-t="unmute" hidden>🔊 Activer le son</button></div>
     <p class="t-src">L’app, filmée telle quelle.${preview ? ' <button class="linklike t-skipv" data-t="next">Passer la vidéo →</button>' : ' La suite arrive toute seule à la fin.'}</p>`,
    `<p class="t-kicker">Maintenant, à toi</p>
     <h2>Faisons le tour <i>de l’app.</i></h2>
     <p class="t-soon">Chaque bouton, un à la fois : ce qu’il y a derrière, en une phrase. On finit par ton étape 1, ton point de départ.</p>
     <div class="t-actions"><button class="btn primary big" data-t="coach">Faire le tour de l’app →</button></div>
     <p class="t-src">Cette visite ne reviendra plus. Elle t’attend dans le coffre, avec la vidéo.</p>`,
  ];

  const box = document.createElement('div');
  box.className = 'tour';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Visite guidée');
  box.innerHTML = `
    <canvas class="t-embers" aria-hidden="true"></canvas>
    ${preview ? `<p class="t-apercu">Aperçu : tu vois ce que ${esc(me)} verra. Rien n’est marqué pour ${esc(me)}. <button data-t="end">Fermer l’aperçu</button></p>` : ''}
    <div class="t-progress">${slides.map(() => '<i></i>').join('')}</div>
    ${preview ? '<button class="t-skip" data-t="end">Passer</button>' : ''}
    <div class="t-slide"></div>
    <div class="t-nav"><button data-t="prev" aria-label="Précédent">←</button><button data-t="next" aria-label="Suivant">→</button></div>`;
  document.body.appendChild(box);
  const fx = matchMedia('(prefers-reduced-motion: reduce)').matches ? null : embers(box.querySelector('.t-embers'), { soft: true });
  let i = 0;
  let player = null;
  const show = () => {
    box.querySelectorAll('video').forEach((x) => x.pause());
    box.querySelector('.t-slide').innerHTML = `<div class="t-inner t-${i}">${slides[i]}</div>`;
    box.querySelectorAll('.t-progress i').forEach((b, k) => b.classList.toggle('on', k <= i));
    box.querySelector('[data-t=prev]').disabled = i === 0;
    box.querySelector('[data-t=next]').hidden = i === slides.length - 1;
    const v = box.querySelector('.t-video');
    if (v) {
      const um = box.querySelector('.t-unmute');
      v.muted = false;
      v.play().catch(() => { v.muted = true; um.hidden = false; v.play().catch(() => {}); });
      // à la fin de la vidéo, la visite continue toute seule
      v.onended = () => { if (box.isConnected && box.querySelector('.t-video') === v) go(1); };
    }
  };
  const marquer = () => {
    if (preview) return;
    store.set(seenKey(), true);
    updateEspace({ tour: { ...(espace.meta.tour || {}), [espace.me]: Date.now() } }).catch(() => {});
  };
  const end = (mark = true) => {
    if (mark) marquer();
    player?.pause();
    box.querySelector('video')?.pause();
    box.classList.add('out');
    fx?.stop();
    setTimeout(() => box.remove(), 350);
    window.removeEventListener('keydown', onKey);
  };
  const go = (d) => { i = Math.max(0, Math.min(slides.length - 1, i + d)); show(); };
  const onKey = (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'Escape' && preview) end();
  };
  box.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-t]')?.dataset.t;
    if (t === 'end') { end(); return; }
    // la visite n'est marquée comme vue qu'à la toute fin du tour de l'app
    if (t === 'coach') { end(false); setTimeout(() => import('../coach.js').then((c) => c.coachTour({ premiere: !preview, onEnd: marquer })), 400); return; }
    if (t === 'prev') { go(-1); return; }
    if (t === 'next') { go(1); return; }
    if (t === 'unmute') { const v = box.querySelector('.t-video'); v.muted = false; v.currentTime = 0; v.play(); e.target.hidden = true; return; }
    if (t === 'play') {
      const b = e.target.closest('[data-t]');
      b.textContent = '…';
      try {
        player = new Audio(await audioURL(espace.meta.welcome.audio));
        player.play();
        b.textContent = '♪';
        player.onended = () => { b.textContent = '▶ Réécouter'; };
      } catch { b.textContent = 'Audio indisponible'; }
      return;
    }
    // Toucher le côté droit de l'écran avance, comme une story.
    if (!e.target.closest('a, button, video')) go(e.clientX > window.innerWidth * 0.35 ? 1 : -1);
  });
  window.addEventListener('keydown', onKey);
  show();
}

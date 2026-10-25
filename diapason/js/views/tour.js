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
       ${espace.meta.welcome?.audio ? '<button class="t-play" data-t="play">▶ Écouter</button>' : ''}
     </div>`,
    `<p class="t-kicker">${esc(me)}, regarde. Une minute.</p>
     <video class="t-video" src="data/demo-frog.mp4" poster="data/demo-frog.jpg" playsinline controls preload="auto"></video>
     <p class="t-src">L’app, filmée telle quelle : tes claviers, ma voix, nos sons qui voyagent entre nous.</p>`,
    `<p class="t-kicker">Le truc qui n’existe pas ailleurs</p>
     <h2>Tu joues un accord.<br><i>Ma voix sait où aller.</i></h2>
     <ul class="t-list">
       <li><b>Les notes que je peux chanter s’allument</b> pendant que tu joues.</li>
       <li><b>Tes sons choisissent mon exercice</b> : orgue, piano, Rhodes.</li>
       <li>À l’envers : <b>je chante, tu trouves les accords</b>.</li>
     </ul>
     <div class="t-chords"><span>Do</span><span class="now">Lam</span><span>Fa</span><span>Sol</span></div>`,
    `<p class="t-kicker">Entre deux sessions</p>
     <h2>On se lance <i>des sons.</i></h2>
     <ul class="t-list">
       <li>Ton riff, <b>une touche</b> : il m’arrive, avec ton intention.</li>
       <li>Je chante <b>par-dessus</b>. Tu ajoutes une couche. La chanson grandit entre nous.</li>
       <li>Et quand on veut partir ailleurs : <b>les ambiances, le grimoire</b>.</li>
     </ul>`,
    `<p class="t-kicker">Brancher tes claviers · 2 minutes</p>
     <h2>Un câble, et c’est parti.</h2>
     <ol class="t-steps">
       <li>N’importe quel clavier MIDI (le SV-1, un contrôleur, un synthé) : <b>USB</b> direct, ou <b>MIDI OUT</b> → une interface USB-MIDI → l’ordi. Pour enregistrer le vrai son : les sorties audio → ta carte son.</li>
       <li>Ouvre l’app dans <b>Chrome ou Edge</b> sur l’ordi.</li>
       <li><b>Voix → Voix + piano → Brancher le piano</b> : joue un accord, il apparaît.</li>
     </ol>`,
    `<h2>Par où commencer</h2>
     <div class="t-actions">
       <a class="btn primary big" href="#/accord" data-t="end">① Brancher un clavier et jouer 3 accords pour moi</a>
       <a class="btn big" href="#/relais" data-t="end">② Me lancer un premier son</a>
       <a class="btn big" href="#/depart" data-t="end">③ Ton point de départ (5 min)</a>
       <button class="btn big ghost" data-t="end">Explorer seul</button>
     </div>
     <p class="t-src">Cette visite ne reviendra plus. Elle t’attend dans le coffre (l’icône du petit coffre, en haut), avec la vidéo.</p>`,
  ];

  const box = document.createElement('div');
  box.className = 'tour';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Visite guidée');
  box.innerHTML = `
    <canvas class="t-embers" aria-hidden="true"></canvas>
    <div class="t-progress">${slides.map(() => '<i></i>').join('')}</div>
    <button class="t-skip" data-t="end">Passer</button>
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
    if (v) { v.muted = false; v.play().catch(() => { v.muted = true; v.play().catch(() => {}); }); }
  };
  const end = () => {
    if (!preview) {
      store.set(seenKey(), true);
      updateEspace({ tour: { ...(espace.meta.tour || {}), [espace.me]: Date.now() } }).catch(() => {});
    }
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
    if (e.key === 'Escape') end();
  };
  box.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-t]')?.dataset.t;
    if (t === 'end') { end(); return; }
    if (t === 'prev') { go(-1); return; }
    if (t === 'next') { go(1); return; }
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

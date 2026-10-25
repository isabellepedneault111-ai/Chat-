// La visite guidée : la première fois que Frog entre, Zaza l'accueille, puis l'app montre son sens.
// Pas des bulles d'aide : des écrans plein format, comme un livret d'album.
import { espace, audioURL, updateEspace } from '../espace.js';
import { store } from '../ui.js';
import { PLAN } from '../duo.js';

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
       <p class="t-welcome">${esc(welcome).replace(/\n/g, '<br>')}</p>
       <p class="t-sign">— ${esc(from)}</p>
       ${espace.meta.welcome?.audio ? '<button class="t-play" data-t="play">▶ Écouter</button>' : ''}
     </div>`,
    `<p class="t-kicker">${esc(me)}.</p>
     <h2>Ton SV-1<br>+ ma voix<br>= notre son.</h2>
     <p class="t-text">Aucun piano, aucun looper, aucun DAW ne fait ça : <b>cette app écoute ton clavier et ma voix en même temps</b>, et elle s’en sert pour nous faire progresser tous les deux. Regarde.</p>`,
    `<p class="t-kicker">Une minute, en vrai</p>
     <video class="t-video" src="data/demo-frog.mp4" poster="data/demo-frog.jpg" autoplay muted playsinline loop controls preload="auto"></video>
     <p class="t-src">L’app, enregistrée telle quelle : ton SV-1 en MIDI, ma voix au micro, une session, le mur.</p>`,
    `<p class="t-kicker">Le truc qui n’existe pas</p>
     <h2>Tu joues un accord. Ma voix sait où aller.</h2>
     <ul class="t-list">
       <li><b>Les notes que je peux chanter s’allument</b>, dans MA tessiture, pendant que tu joues.</li>
       <li>L’app me dit si je suis dedans, et laquelle je tiens : <b>la tierce, la quinte</b>…</li>
       <li><b>Tes sons choisissent l’exercice</b> : un orgue tenu travaille ma stabilité, un piano qui s’éteint ma mémoire de la note, un Rhodes ma douceur.</li>
     </ul>
     <div class="t-chords"><span>Do</span><span class="now">Lam</span><span>Fa</span><span>Sol</span></div>`,
    `<p class="t-kicker">Ton matériel, mémoire du duo</p>
     <h2>Ce que tu touches devient une trace.</h2>
     <ul class="t-list">
       <li>Tempo, départs du séquenceur, changements de son : <b>des repères horodatés</b> dans chaque session.</li>
       <li>Sur nos prises, on clique « 0:42 » et on réentend <b>le moment où tu as changé de son</b>.</li>
       <li>L’app peut aussi <b>envoyer son horloge</b> : ta boîte à rythmes suit notre boucle.</li>
     </ul>`,
    `<p class="t-kicker">Le sens</p>
     <h2>Six mois.<br>Trois à cinq originaux.<br>À deux.</h2>
     <ol class="t-months">${PLAN.map((p) => `<li><span>M${p.n}</span>${esc(p.sortie)}</li>`).join('')}</ol>
     <p class="t-src">Un plan tiré de la recherche de ${esc(from)} : séances courtes et régulières, impro d’abord, composition ensuite. Chaque session finit par une prise.</p>`,
    `<p class="t-kicker">Brancher le SV-1 · 2 minutes</p>
     <h2>Un câble, et c’est parti.</h2>
     <ol class="t-steps">
       <li>La prise <b>MIDI OUT</b> du SV-1 → une interface USB-MIDI → l’ordi.</li>
       <li>Ouvre l’app dans <b>Chrome ou Edge</b> (pas Safari, pas l’iPhone).</li>
       <li>Voix → <b>Voix + piano</b> → « Brancher le piano » : joue un accord, il apparaît.</li>
     </ol>`,
    `<h2>Tes 3 premiers gestes</h2>
     <div class="t-actions">
       <a class="btn primary big" href="#/accord" data-t="end">① Brancher le SV-1 et jouer 3 accords pour moi</a>
       <a class="btn big" href="#/depart" data-t="end">② Ton point de départ (5 min)</a>
       <a class="btn big" href="#/session" data-t="end">③ Notre première session</a>
       <button class="btn big ghost" data-t="end">Explorer seul</button>
     </div>`,
  ];

  const box = document.createElement('div');
  box.className = 'tour';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Visite guidée');
  box.innerHTML = `
    <div class="t-progress">${slides.map(() => '<i></i>').join('')}</div>
    <button class="t-skip" data-t="end">Passer</button>
    <div class="t-slide"></div>
    <div class="t-nav"><button data-t="prev" aria-label="Précédent">←</button><button data-t="next" aria-label="Suivant">→</button></div>`;
  document.body.appendChild(box);
  let i = 0;
  let player = null;
  const show = () => {
    box.querySelector('.t-slide').innerHTML = `<div class="t-inner t-${i}">${slides[i]}</div>`;
    box.querySelectorAll('.t-progress i').forEach((b, k) => b.classList.toggle('on', k <= i));
    box.querySelector('[data-t=prev]').disabled = i === 0;
    box.querySelector('[data-t=next]').hidden = i === slides.length - 1;
  };
  const end = () => {
    if (!preview) {
      store.set(seenKey(), true);
      updateEspace({ tour: { ...(espace.meta.tour || {}), [espace.me]: Date.now() } }).catch(() => {});
    }
    player?.pause();
    box.querySelector('video')?.pause();
    box.classList.add('out');
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

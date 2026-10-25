// La visite guidée : la première fois que Frog entre, Zaza l'accueille, puis l'app montre son sens.
// Pas des bulles d'aide : des écrans plein format, comme un livret d'album.
import { espace, audioURL } from '../espace.js';
import { store } from '../ui.js';
import { CONTRAINTES, PLAN, STAGES, FORMATS, PHASES } from '../duo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const seenKey = () => `tourSeen:${espace.id}:${espace.me}`;

export function maybeTour() {
  if (!espace.connected || !espace.me) return;
  if (espace.meta.createdBy && espace.me === espace.meta.createdBy) return; // celle qui a créé l'espace n'a pas besoin de la visite
  if (store.get(seenKey(), false)) return;
  startTour(false);
}

export function startTour(preview) {
  if (document.querySelector('.tour')) return;
  const me = preview ? (espace.meta.members || ['Zaza', 'Frog']).find((m) => m !== espace.me) || 'Frog' : espace.me;
  const from = espace.meta.welcome?.by || espace.meta.createdBy || 'Zaza';
  const welcome = espace.meta.welcome?.text || 'Forever more…';
  const duo60 = FORMATS[0];
  const slides = [
    `<div class="t-open">
       <p class="t-welcome">${esc(welcome).replace(/\n/g, '<br>')}</p>
       <p class="t-sign">— ${esc(from)}</p>
       ${espace.meta.welcome?.audio ? '<button class="t-play" data-t="play">▶ Écouter</button>' : ''}
     </div>`,
    `<p class="t-kicker">${esc(me)}.</p>
     <h2>Ton matériel joue déjà très bien.</h2>
     <p class="t-text">Cette app ne le remplace pas. Elle fait ce qu’aucun pédalier, aucun looper, aucun clavier ne fait : <b>elle se souvient, elle organise, et elle nous mène quelque part.</b></p>`,
    `<p class="t-kicker">Le sens</p>
     <h2>Six mois.<br>Trois à cinq originaux.<br>À deux.</h2>
     <ol class="t-months">${PLAN.map((p) => `<li><span>M${p.n}</span>${esc(p.sortie)}</li>`).join('')}</ol>
     <p class="t-src">Un plan tiré de la recherche que ${esc(from)} a faite : séances courtes et régulières, improvisation d’abord, composition ensuite.</p>`,
    `<p class="t-kicker">Une session</p>
     <h2>60 minutes qui finissent toujours par une prise.</h2>
     <div class="t-phases">${duo60.phases.map(([p, d], i) => `<i style="flex:${d};animation-delay:${i * 0.18}s"><span>${PHASES[p].titre}</span></i>`).join('')}</div>
     <p class="t-text">Un exercice à chaque étape, la grille du jour en boucle, la prise directement sur le mur. <b>Le minuteur est partagé</b> : on voit la même chose, chacun sur son écran.</p>`,
    `<p class="t-kicker">Le mur</p>
     <h2>Chaque idée a une destination.</h2>
     <div class="t-stages">${STAGES.map((s, i) => `<div style="animation-delay:${i * 0.2}s"><b>${s.label}</b><small>${s.hint}</small></div>`).join('')}</div>
     <p class="t-text">Un mémo vocal à 2 h du matin, un riff, un mot : tout atterrit au même endroit, et on voit le global (morceau par morceau) autant que le détail.</p>`,
    `<p class="t-kicker">Ton instrument</p>
     <h2>Joue. L’app écoute.</h2>
     <p class="t-text">Branche le piano en MIDI ou joue devant le micro : l’app reconnaît l’accord et la tonalité, propose la suite, les notes que ${esc(from)} peut chanter, et met ta grille en boucle avec le beat.</p>
     <div class="t-chords"><span>Ré</span><span>La</span><span>Sim</span><span class="now">Sol</span></div>`,
    `<p class="t-kicker">Les paroles</p>
     <h2>Des mots qui tiennent dans le temps.</h2>
     <p class="t-syll">sous la gla·ce le fleu·ve chan·<s>te</s></p>
     <p class="t-text">Syllabes chantées ligne par ligne, rimes, synonymes, trous et passages incertains marqués. On écrit à deux, en même temps.</p>`,
    `<p class="t-kicker">Un dernier truc</p>
     <h2>La contrainte libère.</h2>
     <p class="t-constraint">« ${esc(CONTRAINTES[Math.floor(Math.random() * CONTRAINTES.length)])} »</p>
     <p class="t-text">Le petit dé en haut en tire une nouvelle quand vous tournez en rond.</p>`,
    `<h2>On commence?</h2>
     <div class="t-actions">
       <a class="btn primary big" href="#/session" data-t="end">● Notre première session</a>
       <a class="btn big" href="#/carnet" data-t="end">Voir le mur</a>
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
    if (!preview) store.set(seenKey(), true);
    player?.pause();
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
    if (!e.target.closest('a, button')) go(e.clientX > window.innerWidth * 0.35 ? 1 : -1);
  });
  window.addEventListener('keydown', onKey);
  show();
}

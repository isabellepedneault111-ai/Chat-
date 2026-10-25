// La visite guidée : la première fois que Frog entre, Zaza l'accueille, puis l'app montre son sens.
// Pas des bulles d'aide : des écrans plein format, comme un livret d'album.
import { espace, audioURL, updateEspace } from '../espace.js';
import { store } from '../ui.js';
import { embers } from '../rituel.js';
import { ILLU } from '../illus.js';
import { VISITE } from '../visite-data.js';
import { jouer, sonActif, basculerSon } from '../visite-sons.js';

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
  const [z, f] = espace.meta.members || ['Zaza', 'Frog'];
  // Chaque scène : un titre, une phrase, un dessin qui bouge. Le dessin dit ce que les mots ne disent pas.
  // Chaque scène montre la vraie app (avec des exemples fictifs) et l'explique repère par repère.
  // Un repère : [écran, n° du point dans VISITE, phrase]. Le zoom suit le repère actif.
  const frame = (k, img, d, pts, ratio) => `
    <div class="t-frame t-frame-${k}" style="aspect-ratio:${ratio}">
      <div class="t-zoom"><img src="img/visite/${img}" alt="" draggable="false">
        ${pts.map(([i, n]) => (d[i] ? `<span class="t-pin" data-n="${n}" style="left:${d[i][0]}%;top:${d[i][1]}%"><b>${n + 1}</b></span>` : '')).join('')}
      </div>
    </div>`;
  const shot = (n, titre, quand, frames, steps, sons = []) => `
    <div class="t-shot" data-steps="${steps.length}" data-sons="${sons.join(',')}" data-auto="${steps.length * 3400 + 2200}">
      <header class="t-shot-head">
        <p class="t-kicker">${n} / 4</p>
        <h2>${titre}</h2>
        <p class="t-quand"><b>Quand</b> ${quand}</p>
      </header>
      <div class="t-frames">${frames}</div>
      <ol class="t-caps">${steps.map((t, i) => `<li data-n="${i}"><b>${i + 1}</b><span>${t}</span></li>`).join('')}</ol>
    </div>`;
  const V = VISITE;
  const MONTAGE = [
    ['m-voix.jpg', 'Un beat sous ta voix', 'Quatorze styles, un phrasé à chanter', 'beat'],
    ['m-flux.jpg', 'Écrire sur le beat', 'Chanter des sons sans mots, puis y poser les mots', 'riff'],
    ['m-labo.jpg', 'Un rythme devient une note', 'Accélère… et ça chante', 'labo'],
    ['m-trois.jpg', 'Un troisième musicien', 'Il reprend votre phrase et la transforme', 'trois'],
    ['m-grimoire.jpg', 'Le grimoire', 'Tire une carte, écris vrai', 'grimoire'],
    ['m-pochette.jpg', 'Votre art en pochette', 'Une toile + un vrai son', 'pochette'],
  ];
  const r = (d) => `${Math.round(d.w)} / ${Math.round(d.h)}`;
  const slides = [
    `<div class="t-open">
       ${ILLU.fils}
       <img class="t-logo" src="img/flip-creme.svg" alt="FLIP">
       <p class="t-welcome">${esc(welcome).replace(/\n/g, '<br>')}</p>
       <p class="t-sign">— ${esc(from)}</p>
       <p class="t-auteure">FLIP, un espace imaginé par ${esc(from)}, pour nous deux.</p>
       ${espace.meta.welcome?.audio ? '<button class="t-play" data-t="play">▶ Écouter</button>' : ''}
       <button class="btn big t-start" data-t="next">Commencer · 4 minutes, avec le son</button>
     </div>`,
    `<div class="t-title" data-auto="8000">
       <p class="t-kicker">Ce que ${esc(from)} a imaginé pour nous</p>
       <h2 class="t-huge">La distance<br>ne crée plus<br><i>de distance.</i></h2>
       <p class="t-line">Dans la même pièce ou loin l’un de l’autre, nos élans ne s’arrêtent plus. Voici comment, sur la vraie app, avec des exemples.</p>
     </div>`,
    shot(1, 'Dans la même <i>pièce</i>', `Ensemble. ${esc(f)} au clavier, ${esc(z)} au micro.`,
      frame('voix', 'voix.jpg', V.voix.pts, [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], r(V.voix)), [
        `${esc(f)} joue un accord sur son clavier. FLIP le reconnaît.`,
        `Les notes que ${esc(z)} peut chanter s’allument, dans sa tessiture.`,
        'Sa voix s’affiche en direct : jaune, c’est dans l’accord.',
        'Le temps passé juste, en pourcentage.',
        'Séance après séance, FLIP retient où sa voix brille.',
      ], ['accord', 'note', 'note', '', 'carillon']),
    shot(2, 'À distance, <i>en même temps</i>', 'Chacun chez soi, à la même heure, en appel.',
      frame('z', 'distance-z.jpg', V.distance.pts, [[0, 0], [1, 1], [2, 3]], r(V.distance))
      + frame('f', 'distance-f.jpg', V.distance.fpts, [[0, 2]], `${V.distance.fw} / ${V.distance.fh}`), [
        `${esc(z)} lance la séance : des étapes, une cible, une grille d’accords.`,
        'Le même minuteur, à la seconde, sur les deux écrans.',
        `Sur le cellulaire de ${esc(f)} : la même séance, au même moment.`,
        'La consigne de l’étape. On joue, on n’organise rien.',
      ], ['tic', 'tic', 'tic', '']),
    shot(3, 'Chacun <i>son temps</i>', 'Une idée à 23 h. L’autre l’écoute le lendemain matin.',
      frame('relais', 'relais.jpg', V.relais.pts, [[0, 0], [1, 1], [2, 2], [3, 3]], r(V.relais)), [
        'Une touche : un son part vers l’autre.',
        'Avec une intention : chante dessus, écris dessus.',
        `${esc(z)} répond par-dessus, quand elle veut.`,
        `${esc(f)} trouve les mots. La chanson grandit par couches.`,
      ], ['riff', '', 'reponse', 'carillon']),
    shot(4, 'Rien ne <i>se perd</i>', 'Tout le temps : une idée, même à moitié, va au mur.',
      frame('ciel', 'ciel.jpg', V.ciel.pts, [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], r(V.ciel)), [
        'Le centre, c’est l’album. Plus une idée avance, plus elle s’en approche.',
        `Chaque point est une idée. Rose : ${esc(z)}. Bleu : ${esc(f)}.`,
        'Le pointillé : une rencontre que FLIP propose entre deux idées.',
        'Avec une consigne concrète pour la tenter.',
        'Un clic, et une nouvelle idée naît des deux.',
      ], ['', '', 'carillon', '', 'accord']),
    // Le reste du génie, en vitrine : six vrais écrans, un son chacun, presque pas de mots.
    `<div class="t-montage" data-auto="${MONTAGE.length * 3600 + 1500}">
       <header><p class="t-kicker">Et ce n’est pas tout</p><h2>Ce que FLIP <i>permet aussi</i></h2></header>
       <div class="mt-stage">${MONTAGE.map(([img, t, d], i) => `<figure class="mt-tile" data-n="${i}"><div class="mt-img"><img src="img/visite/${img}" alt=""></div><figcaption><b>${t}</b><span>${d}</span></figcaption></figure>`).join('')}</div>
       <div class="mt-dots">${MONTAGE.map((_, i) => `<i data-n="${i}"></i>`).join('')}</div>
     </div>`,
    `<div class="t-title">
       <p class="t-kicker">Maintenant, à toi</p>
       <h2 class="t-huge">Faisons le tour<br><i>de l’app.</i></h2>
       <p class="t-line">Chaque bouton, un à la fois, avec des exemples pour voir le rendu. On finit par ton étape 1, ton point de départ.</p>
       <div class="t-actions"><button class="btn primary big" data-t="coach">Faire le tour de l’app →</button></div>
     </div>`,
  ];

  const box = document.createElement('div');
  box.className = 'tour';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Visite guidée');
  box.innerHTML = `
    <canvas class="t-embers" aria-hidden="true"></canvas>
    <div class="t-progress">${slides.map(() => '<i></i>').join('')}</div>
    <button class="t-son" data-t="son" aria-pressed="${sonActif()}">${sonActif() ? '♪ Son' : '♪ Muet'}</button>
    <div class="t-slide"></div>
    <div class="t-nav"><button data-t="prev" aria-label="Précédent">←</button>${preview ? `<p class="t-apercu">Aperçu : exactement ce que ${esc(me)} verra. Rien n’est marqué pour lui. <button data-t="end">Fermer l’aperçu</button></p>` : '<span></span>'}<button data-t="next" aria-label="Suivant">→</button></div>`;
  document.body.appendChild(box);
  const fx = matchMedia('(prefers-reduced-motion: reduce)').matches ? null : embers(box.querySelector('.t-embers'), { soft: true });
  let i = 0;
  let player = null;
  let auto = null;
  let stepT = null;
  const show = () => {
    clearTimeout(auto); clearTimeout(stepT);
    box.querySelector('.t-slide').innerHTML = `<div class="t-inner t-${i}">${slides[i]}</div>`;
    const ms = +(box.querySelector('[data-auto]')?.dataset.auto || 0);
    box.querySelectorAll('.t-progress i').forEach((b, k) => { b.classList.toggle('on', k < i || (k === i && !ms)); b.classList.toggle('run', k === i && !!ms); b.style.setProperty('--dur', `${ms}ms`); });
    // Les scènes avancent seules, comme un film ; on peut toujours aller plus vite ou revenir.
    if (ms) auto = setTimeout(() => box.isConnected && go(1), ms);
    // Les repères s'allument un à un ; le cadre s'approche du repère actif.
    const sh = box.querySelector('.t-shot');
    if (sh) {
      const n = +sh.dataset.steps; let k = -1;
      const step = () => {
        if (!sh.isConnected) return;
        k = Math.min(n - 1, k + 1);
        sh.querySelectorAll('[data-n]').forEach((x) => { const j = +x.dataset.n; x.classList.toggle('on', j === k); x.classList.toggle('vu', j < k); });
        sh.querySelectorAll('.t-frame').forEach((fr) => {
          const pin = fr.querySelector(`.t-pin[data-n="${k}"]`);
          const zm = fr.querySelector('.t-zoom');
          if (pin) { zm.style.transformOrigin = `${pin.style.left} ${pin.style.top}`; zm.style.transform = 'scale(1.12)'; fr.classList.add('focus'); } else { zm.style.transform = 'scale(1)'; fr.classList.remove('focus'); }
        });
        jouer((sh.dataset.sons || '').split(',')[k]);
        if (k < n - 1) stepT = setTimeout(step, 3400);
        else stepT = setTimeout(() => sh.querySelectorAll('.t-zoom').forEach((zm) => { zm.style.transform = 'scale(1)'; }), 2400);
      };
      stepT = setTimeout(step, 900);
    }
    const mt = box.querySelector('.t-montage');
    if (mt) {
      let k = -1;
      const next = () => {
        if (!mt.isConnected) return;
        k += 1; if (k >= MONTAGE.length) return;
        mt.querySelectorAll('[data-n]').forEach((x) => { x.classList.toggle('on', +x.dataset.n === k); x.classList.toggle('vu', +x.dataset.n < k); });
        jouer(MONTAGE[k][3]);
        stepT = setTimeout(next, 3600);
      };
      stepT = setTimeout(next, 700);
    }
    box.querySelector('.t-nav [data-t=prev]').disabled = i === 0;
    box.querySelector('.t-nav [data-t=next]').hidden = i === 0 || i === slides.length - 1;
  };
  const marquer = () => {
    if (preview) return;
    store.set(seenKey(), true);
    updateEspace({ tour: { ...(espace.meta.tour || {}), [espace.me]: Date.now() } }).catch(() => {});
  };
  const end = (mark = true) => {
    clearTimeout(auto); clearTimeout(stepT);
    if (mark) marquer();
    player?.pause();
    box.classList.add('out');
    fx?.stop();
    setTimeout(() => box.remove(), 350);
    window.removeEventListener('keydown', onKey);
  };
  const go = (d) => { i = Math.max(0, Math.min(slides.length - 1, i + d)); show(); };
  const onKey = (e) => {
    if ((e.key === 'ArrowRight' || e.key === ' ') && i < slides.length - 1 && i > 0) go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'Escape' && preview) end();
  };
  box.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-t]')?.dataset.t;
    if (t === 'end') { end(); return; }
    // la visite n'est marquée comme vue qu'à la toute fin du tour de l'app
    if (t === 'coach') { end(false); setTimeout(() => import('../coach.js').then((c) => c.coachTour({ premiere: true, apercu: preview, onEnd: marquer })), 400); return; }
    if (t === 'son') { const v = basculerSon(); e.target.textContent = v ? '♪ Son' : '♪ Muet'; e.target.setAttribute('aria-pressed', v); return; }
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
    if (!e.target.closest('a, button, video, .t-apercu') && i > 0 && i < slides.length - 1) go(e.clientX > window.innerWidth * 0.35 ? 1 : -1);
  });
  window.addEventListener('keydown', onKey);
  show();
}

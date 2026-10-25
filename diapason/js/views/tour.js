// La visite guidée : la première fois que Frog entre, Zaza l'accueille, puis l'app montre son sens.
// Pas des bulles d'aide : des écrans plein format, comme un livret d'album.
import { espace, audioURL, updateEspace } from '../espace.js';
import { store } from '../ui.js';
import { embers } from '../rituel.js';
import { VISITE } from '../visite-data.js';
import { jouer, sonActif, basculerSon, prechargerVisite, bandeStart, bandeSection, bandeStop } from '../visite-sons.js';

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
  const frame = (k, img, d, pts, ratio, label = '') => `${label ? `<div class="t-fcol"><p class="t-flabel">${label}</p>` : ''}
    <div class="t-frame t-frame-${k}" style="aspect-ratio:${ratio}">
      <div class="t-zoom"><img src="img/visite/${img}" alt="" draggable="false">
        ${pts.map(([i, n]) => (d[i] ? `<span class="t-pin" data-n="${n}" style="left:${d[i][0]}%;top:${d[i][1]}%"><b>${n + 1}</b></span>` : '')).join('')}
      </div>
    </div>${label ? '</div>' : ''}`;
  const shot = (n, titre, quand, frames, steps, sons = [], r = 1.6, unique = '') => `
    <div class="t-shot" data-steps="${steps.length}" data-sons="${sons.join(',')}" data-auto="${steps.length * 3400 + 2200}">
      <header class="t-shot-head">
        <p class="t-kicker">${n} / 4</p>
        <h2>${titre}</h2>
        <p class="t-quand"><b>Quand</b> ${quand}</p>
      </header>
      <div class="t-frames" style="max-width:calc(var(--hmax) * ${r.toFixed(3)})">${frames}</div>
      <div class="t-side">
        ${unique ? `<p class="t-unique"><b>Nulle part ailleurs</b> ${unique}</p>` : ''}
        <ol class="t-caps">${steps.map((t, i) => `<li data-n="${i}"><b>${i + 1}</b><span>${t}</span></li>`).join('')}</ol>
      </div>
    </div>`;
  const V = VISITE;
  // [image, titre, ce qui n'existe nulle part ailleurs, ce que ça change pour nous, son]
  const MONTAGE = [
    ['m-voix.jpg', 'Un beat sous ta voix', 'Le phrasé à chanter s’allume sur le temps', `${esc(z)} joue avec le rythme, pas seulement la justesse`, 'beat'],
    ['m-flux.jpg', 'Écrire sur le beat', 'Le mumble chanté part avec le texte', `${esc(f)} joue sur ce que ${esc(z)} a chanté`, 'riff'],
    ['m-labo.jpg', 'Un rythme devient une note', 'On entend la frontière entre rythme et harmonie', 'Des beats qu’on n’aurait jamais trouvés', 'labo'],
    ['m-trois.jpg', 'Un troisième musicien', 'Il reprend votre phrase et la transforme', 'Un partenaire d’impro, même à deux', 'trois'],
    ['m-grimoire.jpg', 'Le grimoire', 'Des cartes pour écrire vrai : arcanes, peurs, contraintes', 'Plus jamais la page blanche', 'grimoire'],
    ['m-pochette.jpg', 'Notre art en pochette', 'Une toile et un vrai son deviennent une pochette', 'Notre image, notre son, notre album', 'pochette'],
  ];

  const r = (d) => `${Math.round(d.w)} / ${Math.round(d.h)}`;
  const slides = [
    `<div class="t-open">
       <img class="t-logo" src="img/flip-creme.svg" alt="FLIP">
       <p class="t-welcome">${esc(welcome).replace(/\n/g, '<br>')}</p>
       <p class="t-sign">— ${esc(from)}</p>
       <p class="t-auteure">J’ai imaginé FLIP pour nous deux.</p>
       ${espace.meta.welcome?.audio ? '<button class="t-play" data-t="play">▶ Écouter</button>' : ''}
       <button class="btn big t-start" data-t="next">Commencer · 4 minutes, avec le son</button>
     </div>`,
    `<div class="t-title" data-auto="8000">
       <p class="t-kicker">Ce que j’ai imaginé pour nous deux</p>
       <h2 class="t-huge">La distance<br>ne crée plus<br><i>de distance.</i></h2>
       <p class="t-line">Dans la même pièce ou loin l’un de l’autre, nos élans ne s’arrêtent plus. Voici comment, sur la vraie app, avec des exemples.</p>
     </div>`,
    shot(1, 'Dans la même <i>pièce</i>', `Ensemble. ${esc(f)} au clavier, ${esc(z)} au micro.`,
      frame('voix', 'voix.jpg', V.voix.pts, [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], r(V.voix)), [
        `${esc(f)} joue un accord. FLIP le nomme.`,
        `Les notes que ${esc(z)} peut chanter s’allument.`,
        'Sa voix, en direct. Jaune : c’est juste.',
        'Combien de temps elle chante juste.',
        'FLIP retient où sa voix brille.',
      ], ['piece-0', 'piece-1', 'piece-2', 'piece-3', 'piece-4'], V.voix.w / V.voix.h, `Le clavier de ${esc(f)} devient le coach de la voix de ${esc(z)}, dans sa tessiture à elle.`),
    shot(2, 'À distance, <i>en même temps</i>', 'Chacun chez soi, à la même heure, en appel.',
      frame('z', 'distance-z.jpg', V.distance.pts, [[0, 0], [1, 1], [2, 3]], r(V.distance), `Chez ${esc(z)}`)
      + frame('f', 'distance-f.jpg', V.distance.fpts, [[0, 2]], `${Math.round(V.distance.fw)} / ${Math.round(V.distance.fh)}`, `Chez ${esc(f)}`), [
        `${esc(z)} lance la séance.`,
        'Le même minuteur, à la seconde.',
        `Chez ${esc(f)} : la même séance, au même moment.`,
        'La consigne du moment. On joue, c’est tout.',
      ], ['distance-0', 'distance-1', 'distance-2', 'distance-3'], (V.distance.w / V.distance.h) * 2.1, 'Une vraie séance guidée, partagée à la seconde près sur deux ordinateurs.'),
    shot(3, 'Chacun <i>son temps</i>', 'Une idée à 23 h. L’autre l’écoute le lendemain matin.',
      frame('relais', 'relais.jpg', V.relais.pts, [[0, 0], [1, 1], [2, 2], [3, 3]], r(V.relais)), [
        'Une touche : le son part vers l’autre.',
        'Avec un mot d’ordre : « chante dessus ».',
        `${esc(z)} répond par-dessus, quand elle veut.`,
        `Couche après couche, la chanson grandit.`,
      ], ['relais-0', '', 'relais-2', 'relais-3'], V.relais.w / V.relais.h, 'Chaque son arrive avec ce qu’on attend de l’autre : « chante dessus », « trouve un titre ».'),
    shot(4, 'Rien ne <i>se perd</i>', 'Tout le temps : une idée, même à moitié, va au mur.',
      frame('ciel', 'ciel.jpg', V.ciel.pts, [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], r(V.ciel)), [
        'Au centre : l’album.',
        `Chaque point, une idée. Rose : ${esc(z)}. Bleu : ${esc(f)}.`,
        'Le pointillé : FLIP propose de marier deux idées.',
        'Avec une consigne pour l’essayer.',
        'Un clic : une nouvelle idée naît.',
      ], ['', '', 'ciel-2', '', 'ciel-4'], V.ciel.w / V.ciel.h, 'Le mur propose lui-même de marier nos idées, avec une consigne.'),
    // Le reste du génie, en vitrine : six vrais écrans, un son chacun, presque pas de mots.
    `<div class="t-montage" data-auto="${MONTAGE.length * 3600 + 1500}">
       <header><p class="t-kicker">Et ce n’est pas tout</p><h2>Ce que FLIP <i>permet aussi</i></h2></header>
       <div class="mt-stage">${MONTAGE.map(([img, t, ail, nous], i) => `<figure class="mt-tile" data-n="${i}"><div class="mt-img"><img src="img/visite/${img}" alt=""></div><figcaption><b>${t}</b><span class="mt-ail"><i>Nulle part ailleurs</i> ${ail}</span><span class="mt-nous"><i>Pour nous</i> ${nous}</span></figcaption></figure>`).join('')}</div>
       <div class="mt-dots">${MONTAGE.map((_, i) => `<i data-n="${i}"></i>`).join('')}</div>
     </div>`,
    `<div class="t-title">
       <p class="t-kicker">Maintenant, à toi</p>
       <h2 class="t-huge">Faisons le tour<br><i>de l’app.</i></h2>
       <p class="t-line">Chaque bouton, un à la fois, avec des exemples pour voir le rendu. On finit par ton étape 1, ton point de départ.</p>
       <div class="t-actions"><button class="btn primary big" data-t="coach">Faire le tour de l’app →</button></div>
     </div>`,
  ];

  prechargerVisite(); // les vrais instruments se chargent pendant qu'on lit le mot d'accueil
  const box = document.createElement('div');
  box.className = 'tour';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Visite guidée');
  box.innerHTML = `
    <canvas class="t-embers" aria-hidden="true"></canvas>
    <svg class="t-fils-bg" aria-hidden="true"><path class="fil-z"/><path class="fil-f"/></svg>
    <div class="t-progress">${slides.map(() => '<i></i>').join('')}</div>
    <button class="t-son" data-t="son" aria-pressed="${sonActif()}">${sonActif() ? '♪ Son' : '♪ Muet'}</button>
    <div class="t-slide"></div>
    <div class="t-nav"><button data-t="prev" aria-label="Précédent">←</button>${preview ? `<p class="t-apercu">Aperçu : exactement ce que ${esc(me)} verra. Rien n’est marqué pour lui. <button data-t="end">Fermer l’aperçu</button></p>` : '<span></span>'}<button data-t="next" aria-label="Suivant">→</button></div>`;
  document.body.appendChild(box);
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fx = calme ? null : embers(box.querySelector('.t-embers'), { soft: true });
  // Deux fils, rose et bleu, qui ondulent sans fin d'un bord à l'autre et se rejoignent au centre.
  const fils = box.querySelector('.t-fils-bg');
  let filsRaf = 0;
  const onde = (now) => {
    const W = fils.clientWidth; const H = fils.clientHeight; const cx = W / 2; const cy = H * 0.5;
    const t = calme ? 0 : now / 1000;
    const trace = (ph, sens) => {
      let d = '';
      for (let x = -40; x <= W + 40; x += 16) {
        const u = Math.abs(x - cx) / cx; const A = H * (0.06 + 0.16 * u);
        const y = cy + sens * A * Math.sin(x / (W * 0.16) + t * 0.55 + ph) + H * 0.03 * Math.sin(x / (W * 0.07) - t * 0.8 + ph);
        d += `${x < -30 ? 'M' : 'L'}${x.toFixed(0)} ${y.toFixed(1)}`;
      }
      return d;
    };
    fils.querySelector('.fil-z').setAttribute('d', trace(0, 1));
    fils.querySelector('.fil-f').setAttribute('d', trace(Math.PI, 1));
    if (!calme && box.isConnected) filsRaf = requestAnimationFrame(onde);
  };
  filsRaf = requestAnimationFrame(onde);
  let i = 0;
  let player = null;
  let auto = null;
  let stepT = null;
  const show = () => {
    clearTimeout(auto); clearTimeout(stepT);
    box.querySelector('.t-slide').innerHTML = `<div class="t-inner t-${i}">${slides[i]}</div>`;
    box.classList.toggle('slide0', i === 0); // les deux fils traversent tout l'écran d'accueil
    // Une seule musique, qui change d'habit : feutrée à l'accueil, groove dans les scènes, piano dans la vitrine.
    bandeStart(); bandeSection(i <= 1 ? 'accueil' : box.querySelector('.t-montage') ? 'vitrine' : 'scenes');
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
          // Un projecteur sur le repère : l'image reste entière, rien n'est coupé.
        if (pin) { fr.style.setProperty('--sx', pin.style.left); fr.style.setProperty('--sy', pin.style.top); fr.classList.add('focus'); } else fr.classList.remove('focus');
        });
        jouer((sh.dataset.sons || '').split(',')[k]);
        if (k < n - 1) stepT = setTimeout(step, 3400);
        else stepT = setTimeout(() => sh.querySelectorAll('.t-frame').forEach((fr) => fr.classList.remove('focus')), 2400);
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
        jouer(MONTAGE[k][4]);
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
    clearTimeout(auto); clearTimeout(stepT); cancelAnimationFrame(filsRaf);
    if (mark) bandeStop(); // vers le tour de l'app, la musique continue sans couture
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
    if (t === 'son') { const v = basculerSon(); e.target.textContent = v ? '♪ Son' : '♪ Muet'; e.target.setAttribute('aria-pressed', v); if (v) bandeStart(i <= 1 ? 'accueil' : 'scenes'); return; }
    // Commencer : la visite prend tout l'écran.
    if (t === 'next' && i === 0 && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
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

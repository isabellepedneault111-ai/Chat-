// La visite guidée : la première fois que Frog entre, Zaza l'accueille, puis l'app montre son sens.
// Pas des bulles d'aide : des écrans plein format, comme un livret d'album.
import { espace, audioURL, updateEspace } from '../espace.js';
import { store } from '../ui.js';
import { embers } from '../rituel.js';
import { VISITE } from '../visite-data.js';
import { jouer, sonActif, basculerSon, prechargerVisite, bandeStart, bandeSection, bandeStop } from '../visite-sons.js';
import { laboVivant } from '../labo-vivant.js';
import { visuelVivant, preparerPortrait } from '../visuel-vivant.js';
import { arcSVG, triskelSVG } from '../talismans.js';
import { troisVivant } from '../trois-vivant.js';

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
        ${unique ? `<p class="t-unique"><b>Idée originale : aucune autre app ne fait ça</b> ${unique}</p>` : ''}
        <ol class="t-caps">${steps.map((t, i) => `<li data-n="${i}"><b>${i + 1}</b><span>${t}</span></li>`).join('')}</ol>
      </div>
    </div>`;
  const V = VISITE;
  // [image, titre, ce qui n'existe nulle part ailleurs, ce que ça change pour nous, son]
  const MONTAGE = [
    ['m-voix.jpg', 'Placer ma voix dans le groove', 'FLIP joue un rythme (bossa, pop…) et les cases roses montrent où poser mes mots. La syncope devient un jeu.', 'Je chante avec plus de groove, pas seulement plus juste.', 'beat'],
    ['m-flux.jpg', 'Écrire sur le beat', 'Je chante des sons sans mots sur le beat (le mumble), et l’enregistrement part avec mon texte.', 'Tu entends la mélodie que j’avais en tête.', 'riff'],
    ['m-labo.jpg', 'Un rythme devient un accord', 'Trois rythmes sur ta musique (6, 7 et 9 coups par mesure) accélèrent jusqu’à chanter : un ré mineur plus sombre, qu’aucun piano ne peut jouer.', 'Des accords introuvables autrement, et qui collent à nos chansons.', 'labo'],
    ['m-trois.jpg', 'Un troisième musicien', 'On joue une phrase. Il l’écoute, la transforme et nous la renvoie, dans notre tonalité. Ici : renversée.', 'Un partenaire d’impro, même quand on est juste deux.', 'trois'],
    ['m-grimoire.jpg', 'Le grimoire', 'Des cartes à tirer pour lancer une chanson : un thème, une peur, une contrainte.', 'Fini la page blanche.', 'grimoire'],
    ['m-pochette.jpg', 'Le portrait de notre chanson', 'L’oreille écoute toute la chanson et dessine son portrait : ses parties, son moment fort, sa boucle. Ici : Projet 1, analysé à l’instant, et le trait d’or suit la musique.', 'On voit d’un coup d’œil ce qui brille déjà dans nos chansons, et où on veut les retravailler.', 'pochette'],
  ];

  const r = (d) => `${Math.round(d.w)} / ${Math.round(d.h)}`;
  const SOURCES = [
    ['Pratique distribuée', 'Rohrer 2004 ; Cepeda et al. 2006', 'des petites séances souvent, plutôt qu’une grosse de temps en temps'],
    ['Pipeline créatif et verbalisation guidée', 'Biasutti 2017, 2018 ; Aslan 2016 ; Marino 2023', 'de l’idée brute à la chanson, en se disant ce qu’on cherche'],
    ['La prise en mode spectacle', 'Montemayor 2014', 'enregistrer comme si on jouait devant du monde'],
    ['Retour visuel et justesse du chant', 'Welch, Howard et Rush 1989 ; Hoppe et al. 2006', 'voir sa voix aide à chanter juste'],
    ['Écriture par les sens', 'Pattison 2009 (Berklee)', 'écrire ce qu’on voit, entend et touche'],
    ['Écriture expressive', 'Pennebaker et Beall 1986', 'écrire ce qu’on ressent pour le traverser'],
    ['La contrainte qui libère', 'De Bruin 2019 ; Merchán-Sánchez-Jara 2023 ; Oulipo', 'une règle du jeu, et l’imagination s’emballe'],
    ['Vision commune avant de composer', 'Merchán-Sánchez-Jara 2023', 'savoir ensemble où on va'],
    ['Pratique ciblée et progrès visibles', 'Miksza 2023', 'travailler le bon bout, et voir qu’on avance'],
  ];
  const slides = [
    // La mise en bouche : un mot sur ma façon de faire, nos talismans, et la flèche qui lance la visite.
    `<div class="t-prelude">
       <div class="tp-tal tp-z">${arcSVG()}<p>Mon talisman : la demi-lune devenue arc, la flèche tendue, prête à partir.</p></div>
       <div class="tp-mid">
         <p class="t-kicker">Avant la visite · 4 minutes, avec le son</p>
         <h2>Un mot sur ma façon de faire</h2>
         <p class="tp-mot">Je ne voulais pas une app de plus : je voulais un endroit qui nous ressemble. J’ai lu ce que la recherche sait de la création, de la voix et de la pratique, et je m’en suis servie comme d’un tremplin, jamais comme d’une cage. Chaque idée de FLIP part de là, puis je l’ai tordue pour nous.</p>
         <details class="tp-src"${innerWidth > 860 ? ' open' : ''}><summary>Ce qui a nourri FLIP</summary><ul>${SOURCES.map(([t, ref, sens]) => `<li><b>${t}</b> <span>${sens}</span> <small>${ref}</small></li>`).join('')}</ul></details>
         <button class="btn big t-start t-lancer" data-t="lancer">Lancer la flèche →</button>
       </div>
       <div class="tp-tal tp-f">${triskelSVG()}<p>Le tien : le triskel, la spirale qui tourne, revient et grandit.</p></div>
     </div>`,
    `<div class="t-open">
       <img class="t-logo" src="img/flip-creme.svg" alt="FLIP">
       <p class="t-welcome">${esc(welcome).replace(/\n/g, '<br>')}</p>
       <p class="t-sign">— ${esc(from)}</p>
       <p class="t-auteure">J’ai imaginé FLIP pour nous deux.</p>
       ${espace.meta.welcome?.audio ? '<button class="t-play" data-t="play">▶ Écouter</button>' : ''}
       <button class="btn big t-start" data-t="next">Commencer la visite</button>
     </div>`,
    `<div class="t-title" data-auto="8000">
       <p class="t-kicker">Ce que j’ai imaginé pour nous deux</p>
       <h2 class="t-huge">L’absence<br>ne crée plus<br><i>de distance.</i></h2>
       <p class="t-line">Dans la même pièce ou loin l’un de l’autre, nos élans ne s’arrêtent plus. Voici comment, sur la vraie app, avec des exemples.</p>
     </div>`,
    shot(1, 'Dans la même <i>pièce</i>', 'Ensemble. Toi au clavier, moi au micro.',
      frame('voix', 'voix.jpg', V.voix.pts, [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], r(V.voix)), [
        'Tu joues un accord. FLIP le nomme.',
        'Les notes que je peux chanter s’allument.',
        'Ma voix, en direct. Jaune : c’est juste.',
        'Combien de temps je chante juste.',
        'FLIP retient où ma voix brille.',
      ], ['piece-0', 'piece-1', 'piece-2', 'piece-3', 'piece-4'], V.voix.w / V.voix.h, 'Ton clavier devient le coach de ma voix, dans ma tessiture à moi.'),
    shot(2, 'À distance, <i>en même temps</i>', 'Chacun chez soi, à la même heure, en appel.',
      frame('z', 'distance-z.jpg', V.distance.pts, [[0, 0], [1, 1], [2, 3]], r(V.distance), 'Chez moi')
      + frame('f', 'distance-f.jpg', V.distance.fpts, [[0, 2]], `${Math.round(V.distance.fw)} / ${Math.round(V.distance.fh)}`, 'Chez toi'), [
        'Je lance la séance.',
        'Le même minuteur, à la seconde.',
        'Chez toi : la même séance, au même moment.',
        'La consigne du moment. On joue, c’est tout.',
      ], ['distance-0', 'distance-1', 'distance-2', 'distance-3'], (V.distance.w / V.distance.h) * 2.1, 'Une vraie séance guidée, partagée à la seconde près sur deux ordinateurs.'),
    shot(3, 'Chacun <i>son temps</i>', 'Une idée à 23 h. L’autre l’écoute le lendemain matin.',
      frame('relais', 'relais.jpg', V.relais.pts, [[0, 0], [1, 1], [2, 2], [3, 3]], r(V.relais)), [
        'Une touche : ton son part vers moi.',
        'Avec un mot d’ordre : « chante dessus ».',
        'Je réponds par-dessus, quand je veux.',
        `Couche après couche, la chanson grandit.`,
      ], ['relais-0', '', 'relais-2', 'relais-3'], V.relais.w / V.relais.h, 'Chaque son arrive avec ce qu’on attend de l’autre : « chante dessus », « trouve un titre ».'),
    shot(4, 'Rien ne <i>se perd</i>', 'Tout le temps : une idée, même à moitié, va au mur.',
      frame('ciel', 'ciel.jpg', V.ciel.pts, [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], r(V.ciel)), [
        'Au centre : l’album.',
        'Chaque point, une idée. Rose : moi. Bleu : toi.',
        'Le pointillé : FLIP propose de marier deux idées.',
        'Avec une consigne pour l’essayer.',
        'Un clic : une nouvelle idée naît.',
      ], ['', '', 'ciel-2', '', 'ciel-4'], V.ciel.w / V.ciel.h, 'Le mur propose lui-même de marier nos idées, avec une consigne.'),
    // Le reste du génie, en vitrine : six vrais écrans, un son chacun, presque pas de mots.
    // Une idée à la fois, le temps de lire ; la flèche passe à la suivante, rien ne file tout seul hors de l'écran.
    `<div class="t-montage">
       <header><p class="t-kicker">Et ce n’est pas tout</p><h2>Six idées <i>originales</i></h2><p class="mt-intro">Aucune autre app au monde ne les fait. Je les ai inventées pour nous.</p></header>
       <div class="mt-stage">${MONTAGE.map(([img, t, ail, nous], i) => `<figure class="mt-tile" data-n="${i}"><div class="mt-img">${img === 'm-labo.jpg' ? '<canvas class="mt-live" data-live="labo" aria-label="Trois disques qui accélèrent jusqu’à chanter Fa majeur"></canvas>' : img === 'm-trois.jpg' ? '<canvas class="mt-live" data-live="trois" aria-label="Notre phrase, puis la réponse du troisième musicien, renversée"></canvas>' : img === 'm-pochette.jpg' ? '<canvas class="mt-live" data-live="visuel" aria-label="Le portrait de Projet 1 : ses parties, son moment fort et sa boucle"></canvas>' : `<img src="img/visite/${img}" alt="">`}</div><figcaption><span class="mt-num">${i + 1} / ${MONTAGE.length} · idée originale</span><b>${t}</b><span class="mt-ail">${ail}</span><span class="mt-nous"><i>Pour nous :</i> ${nous}</span></figcaption></figure>`).join('')}</div>
       <div class="mt-dots">${MONTAGE.map((_, i) => `<button type="button" data-n="${i}" aria-label="Idée ${i + 1}"></button>`).join('')}</div>
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
    box.classList.toggle('slide0', i === 1); // les deux fils traversent tout l'écran d'accueil
    // Une seule musique, qui change d'habit : feutrée à l'accueil, groove dans les scènes, piano dans la vitrine.
    bandeStart(); bandeSection(i <= 2 ? 'accueil' : box.querySelector('.t-montage') ? 'vitrine' : 'scenes');
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
      preparerPortrait(); // L'oreille écoute Projet 1 pendant les premières idées
      let k = -1;
      let stopLive = null;
      const montre = (n) => {
        clearTimeout(stepT); k = n; stopLive?.(); stopLive = null;
        mt.querySelectorAll('[data-n]').forEach((x) => { x.classList.toggle('on', +x.dataset.n === k); x.classList.toggle('vu', +x.dataset.n < k); });
        const live = mt.querySelector(`.mt-tile[data-n="${k}"] .mt-live`);
        const vivants = { labo: laboVivant, trois: troisVivant, visuel: visuelVivant };
        if (live) stopLive = vivants[live.dataset.live](live); else jouer(MONTAGE[k][4]); // le visuel : pas d'effet, on regarde sa musique telle quelle
        // Après la dernière idée, la visite continue d'elle-même (la flèche reste là pour aller plus vite).
        stepT = setTimeout(() => mt.isConnected && (k < MONTAGE.length - 1 ? montre(k + 1) : go(1)), live?.dataset.live === 'labo' ? 11500 : 9000);
      };
      mt.montageSuivant = () => { if (k < MONTAGE.length - 1) { montre(k + 1); return true; } return false; };
      mt.querySelector('.mt-dots').addEventListener('click', (e) => { const b = e.target.closest('[data-n]'); if (b) montre(+b.dataset.n); });
      stepT = setTimeout(() => montre(0), 700);
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
    if ((e.key === 'ArrowRight' || e.key === ' ') && i < slides.length - 1 && i > 0) { if (!box.querySelector('.t-montage')?.montageSuivant?.()) go(1); }
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'Escape' && preview) end();
  };
  box.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-t]')?.dataset.t;
    if (t === 'end') { end(); return; }
    // la visite n'est marquée comme vue qu'à la toute fin du tour de l'app
    if (t === 'coach') { end(false); setTimeout(() => import('../coach.js').then((c) => c.coachTour({ premiere: true, apercu: preview, onEnd: marquer })), 400); return; }
    if (t === 'son') { const v = basculerSon(); e.target.textContent = v ? '♪ Son' : '♪ Muet'; e.target.setAttribute('aria-pressed', v); if (v) bandeStart(i <= 2 ? 'accueil' : 'scenes'); return; }
    // Commencer : la visite prend tout l'écran.
    if (t === 'lancer') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
      bandeStart('accueil');
      // La corde se relâche, la flèche file jusqu'au triskel, qui se met à tourner : la visite commence.
      const arc = box.querySelector('.tp-z .tal-arc'); const tri = box.querySelector('.tp-f .tal-triskel');
      const ra = arc.getBoundingClientRect(); const rt = tri.getBoundingClientRect();
      const vol = ((rt.left + rt.width / 2) - (ra.left + ra.width * 0.96)) / (ra.width / 200);
      arc.style.setProperty('--vol', `${calme ? 0 : vol}px`);
      arc.classList.add('lancee');
      setTimeout(() => tri.classList.add('touche'), calme ? 0 : 520);
      setTimeout(() => box.isConnected && go(1), calme ? 200 : 1500);
      return;
    }
    if (t === 'prev') { go(-1); return; }
    if (t === 'next') { if (!box.querySelector('.t-montage')?.montageSuivant?.()) go(1); return; }
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

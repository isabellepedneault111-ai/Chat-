// Le sommaire de chaque page : « Sur cette page », une rangée de liens vers chaque section, construite à partir
// des titres présents. On voit d'un coup d'œil tout ce qu'on peut faire, sans devoir descendre pour le découvrir.
// Le mandat de chaque page, en trois lignes : à quoi elle sert, ce qu'on peut y faire, ce qu'elle nourrit.
const MANDATS = {
  '': ['Savoir où on en est et quoi faire maintenant.', 'Suivre « Par où commencer », lancer une séance, voir ce que l’autre a fait.', 'Tout le reste : c’est d’ici que part chaque séance, et ici que le plan s’ajuste à ce que vous faites.'],
  carnet: ['Garder toutes nos idées au même endroit, et les faire avancer.', 'Ajouter une idée, un son, un lien ; la faire monter d’étape (idée brute → dans le set) ; faire se rencontrer deux idées.', 'Le plan (il compte les idées et leur étape), « Créer → Façonner → Produire », nos chansons.'],
  session: ['Jouer ensemble, guidés, sans se demander quoi faire.', 'Choisir où, combien de temps, sur quoi et sur quels accords ; suivre les étapes ; finir par une prise et un debrief.', 'Le plan (séances par semaine), la prochaine cible (votre debrief devient la séance suivante), le mur (les prises).'],
  relais: ['Créer chacun son tour, à distance.', 'Envoyer un son avec une consigne (« chante dessus »), répondre par-dessus, couche après couche.', 'Le mur (chaque envoi est une idée), l’accueil de l’autre (« nouveau pour toi »).'],
  ecrire: ['Écrire, seul ou à deux, jusqu’à des paroles qui se chantent.', 'Le journal, le mumble sur une musique, l’atelier, le grimoire, Placer mes paroles, Nos idées pour le labo ; double-cliquer un mot pour ses rimes et synonymes.', 'Le plan (pages écrites vs sons), le mur (une page peut y partir), nos chansons.'],
  studio: ['Construire la musique : beat, accords, chansons, prises.', 'Faire tes propres accords, monter une chanson (couplet, refrain, pont), remplacer un son, enregistrer une prise, improviser sur le clavier en couleurs.', 'Les séances (votre grille y est proposée), le mur (prises gardées), la pochette.'],
  oreille: ['Comprendre une pièce en quelques secondes, au lieu d’une heure à l’oreille.', 'Déposer un fichier ou enregistrer ton clavier : tempo, tonalité, parties, moment fort, boucle, accords, ce qui brille et ce qui est à retravailler ; sur une voix seule, les meilleures notes.', 'Le studio (accords envoyés), Écrire (la boucle comme fond), le profil (notes fortes de la voix), Nos deux âmes.'],
  placer: ['Poser des paroles déjà écrites sur une musique de Frog.', 'Écrire tes lignes, voir les syllabes et les accents, comparer 7 placements, écouter avec le guide vocal.', 'Le journal (tes lignes placées), et vos chansons.'],
  ames: ['Voir qui on est, ensemble, comme créateurs.', 'Lire ce qui nous unit, ce que l’un apporte à l’autre, nos frottements féconds et nos pistes hors sentier.', 'Rien à remplir : la page se nourrit de vos étapes 1 et de vos traces, et change avec elles.'],
  materiel: ['Voir ton studio physique dans l’app, et choisir ce qui joue.', 'Détecter tes appareils (audio et MIDI) ; en ajouter à la main ; cocher ce qui est actif ; les placer comme dans ta pièce ; tendre le filet.', 'Le filet (il garde la dernière minute de ce qui est actif), le mur et L’oreille (les bouts gardés).'],
  arbre: ['Admirer l’architecture de Diapason Labo.', 'Toucher un point de l’arbre ou de la généalogie pour lire sa fiche ; relire le journal des versions ; écouter d’où vient chaque son.', 'Rien : ici, on ne touche à rien.'],
  depart: ['Dire chacun d’où on part : objectifs, voix, styles, besoins.', 'Remplir ou relire ton étape 1, voir notre portrait commun, poser notre vision.', 'Le plan, la vision, Nos deux âmes, les tonalités conseillées pour la voix.'],
  accord: ['Chanter juste, accompagnée par le clavier.', 'Frog joue un accord, la voix chante : l’écran montre si c’est juste, en direct.', 'La carte de nos accords, le profil de la voix, le plan (la justesse peut devenir la priorité de la semaine).'],
  tessiture: ['Connaître l’étendue de ta voix.', 'Chanter du plus grave au plus aigu confortable : le labo mesure et nomme ton type de voix.', 'Les tonalités conseillées, le guide vocal de Placer mes paroles, Nos deux âmes.'],
  gym: ['Échauffer et entraîner la voix.', 'Des exercices courts, adaptés à ta tessiture.', 'Ta voix, séance après séance.'],
  miroir: ['Voir sa voix pendant qu’on chante.', 'Chanter et regarder la hauteur se dessiner.', 'La justesse, par le retour visuel.'],
  labo: ['Entendre comment un rythme devient une note, puis un accord.', 'Faire tourner des disques, accélérer, trouver des accords impossibles au piano.', 'Le studio (un rythme du labo peut devenir la grille de batterie).'],
  paroles: ['Sculpter un texte pour qu’il se chante.', 'Compter les syllabes, trouver des rimes et des synonymes, marquer les passages incertains.', 'Nos chansons, le relais (paroles à chanter).'],
  atelier: ['Une séance d’écriture guidée de 25 minutes.', 'Délier la main, écrire par les sens, une contrainte, garder ce qui brille.', 'Le journal, puis nos paroles.'],
  jeux: ['Lancer l’écriture quand la page est blanche.', 'Tirer une carte, jouer au cadavre exquis, explorer notre champ de mots.', 'Le journal et nos paroles.'],
  ambiances: ['Partir ailleurs avant d’écrire ou de jouer.', 'Choisir une ambiance sonore et écrire dedans.', 'Le journal, l’inspiration d’une séance.'],
  coffre: ['Garder nos meilleurs moments à part.', 'Relire et réécouter nos perles.', 'La mémoire du duo, et le bilan.'],
  etincelles: ['Ne perdre aucune idée qui passe.', 'Noter une étincelle de n’importe où (la flamme), pour la musique ou pour l’app.', 'Le mur et Nos idées pour le labo.'],
  bilan: ['Voir où on est rendus.', 'Les heures jouées, les séances, les progrès, la prochaine cible.', 'La motivation, et le plan.'],
  evolution: ['Voir nos courbes dans le temps.', 'Suivre la régularité, la justesse, les idées qui avancent.', 'Le bilan et le plan.'],
};
// Trois petites images, une par case : la cible (ça sert à), la main (tu peux), les racines (ça nourrit).
const ICONES = [
  '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16"/><circle cx="20" cy="20" r="10"/><circle cx="20" cy="20" r="3.5" class="pl"/><path d="M33 7 21 19M33 7v6M33 7h-6"/></svg>',
  '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M13 34V17a2.5 2.5 0 0 1 5 0v9M18 24V9a2.5 2.5 0 0 1 5 0v15M23 24V11a2.5 2.5 0 0 1 5 0v14M28 25v-8a2.5 2.5 0 0 1 5 0v9c0 6-4 9-9 9h-3c-4 0-6-2-8-5l-4-6a2.4 2.4 0 0 1 4-3l2 2"/></svg>',
  '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="11" r="7" class="pl"/><path d="M20 18v8M20 26c-4 0-6 3-9 7M20 26c4 0 6 3 9 7M20 26v8M15 30l-5 1M25 30l5 1"/></svg>',
];
// Une liste qui suit un deux-points reste dans sa puce (« Construire la musique : beat, accords ») ; sinon, une virgule = une puce.
const POINTS = (t) => t.split(/\s*;\s*/).flatMap((x) => (/\s:\s/.test(x) ? [x] : x.split(/\s*,\s+(?![^()]*\))/))).filter(Boolean);
const replie = () => { try { return localStorage.getItem('diapason:mandatReplie') === '1'; } catch { return false; } };
const idDe = () => (location.hash.replace(/^#\/?/, '').split(/[?#]/)[0]) || '';
export function installerSommaire(vue) {
  let t = 0; let sig = '';
  const construire = () => {
    const titres = [...vue.querySelectorAll('h2')].filter((h) => h.offsetParent && !h.closest('.tour, .coach, .sommaire, .mandat, .maj, .bulle-aide, .ar-scene') && h.textContent.trim());
    const s = titres.map((h) => h.textContent.trim()).join('|');
    const id = idDe();
    const manque = (MANDATS[id] && !vue.querySelector('.mandat')) || (titres.length >= 2 && !vue.querySelector('.sommaire'));
    if (`${id}#${s}` === sig && !manque) return;
    sig = `${id}#${s}`;
    vue.querySelector('.sommaire')?.remove(); vue.querySelector('.mandat')?.remove();
    const tete = vue.querySelector('.mod-head, .masthead, .ames-hero');
    const m = MANDATS[id];
    if (m && tete) {
      const box = document.createElement('div'); box.className = `mandat no-aide ${replie() ? 'replie' : ''}`;
      box.innerHTML = ['Ça sert à', 'Tu peux', 'Ça nourrit'].map((t, i) => `<div class="md-case">${ICONES[i]}<div><b>${t}</b><ul>${POINTS(m[i]).map((x) => `<li>${x.replace(/\.$/, '')}</li>`).join('')}</ul></div></div>`).join('')
        + `<button type="button" class="md-plier" data-md="plier" aria-label="${replie() ? 'Déplier' : 'Replier'} le mandat de la page">${replie() ? 'À quoi sert cette page ▾' : '▴'}</button>`;
      tete.after(box);
    }
    if (titres.length < 2) return;
    const nav = document.createElement('nav'); nav.className = 'sommaire no-aide'; nav.setAttribute('aria-label', 'Sur cette page');
    nav.innerHTML = `<span>Sur cette page</span>${titres.map((h, i) => `<button type="button" data-som="${i}">${h.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}</button>`).join('')}`;
    nav._titres = titres;
    const apres = vue.querySelector('.mandat') || tete;
    if (apres) apres.after(nav); else vue.prepend(nav);
  };
  // Au plus une fois toutes les 400 ms, même sur une page qui bouge sans arrêt (Voix + piano, le studio).
  const passe = () => { if (!t) t = setTimeout(() => { t = 0; construire(); }, 400); };
  // Une page qui se redessine en entier (la séance, à chaque choix) perd son mandat : on le remet tout de suite,
  // avant que l'écran ne se peigne, sinon tout le contenu saute deux fois.
  const perdu = () => (MANDATS[idDe()] && !vue.querySelector('.mandat')) || (sig.split('#')[1]?.includes('|') && !vue.querySelector('.sommaire'));
  new MutationObserver((ms) => {
    if (!ms.some((m) => !m.target.closest?.('.sommaire, .mandat'))) return;
    if (perdu() && vue.querySelector('.mod-head, .masthead, .ames-hero')) { clearTimeout(t); t = 0; construire(); } else passe();
  }).observe(vue, { childList: true, subtree: true });
  vue.addEventListener('click', (e) => {
    if (e.target.closest('[data-md=plier]')) {
      const box = e.target.closest('.mandat'); const r = !box.classList.contains('replie'); box.classList.toggle('replie', r);
      try { localStorage.setItem('diapason:mandatReplie', r ? '1' : '0'); } catch { /* tant pis */ }
      const b2 = box.querySelector('[data-md=plier]'); b2.textContent = r ? 'À quoi sert cette page ▾' : '▴'; return;
    }
    const b = e.target.closest('.sommaire [data-som]'); if (!b) return;
    const h = b.closest('.sommaire')._titres[+b.dataset.som];
    const d = h.closest('details'); if (d && !d.open) d.open = true;
    h.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  addEventListener('hashchange', () => { sig = ''; });
  passe();
}

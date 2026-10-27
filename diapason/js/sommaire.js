// Le sommaire de chaque page : « Sur cette page », une rangée de liens vers chaque section, construite à partir
// des titres présents. On voit d'un coup d'œil tout ce qu'on peut faire, sans devoir descendre pour le découvrir.
// Le mandat de chaque page, en trois lignes : à quoi elle sert, ce qu'on peut y faire, ce qu'elle nourrit.
const MANDATS = {
  '': ['Savoir où on en est et quoi faire maintenant.', 'Suivre « Par où commencer », lancer une séance, voir ce que l’autre a fait, semer et relire nos intentions du cycle.', 'Tout le reste : c’est d’ici que part chaque séance, et ici que le plan s’ajuste à ce que vous faites.'],
  projet: ['Voir ce qu’on bâtit à deux : le cap, les intentions, la vision, les inspirations.', 'Relire le plan des six mois ; nos intentions ; modifier notre vision ; écouter ce qui nous inspire ; ouvrir notre élan, nos deux âmes, notre bilan, nos studios.', 'Chaque séance, et l’accueil.'],
  carnet: ['Garder toutes nos idées au même endroit, et les faire avancer.', 'Ajouter une idée, un son, un lien ; la faire monter d’étape (idée brute → dans le set) ; faire se rencontrer deux idées.', 'Le plan (il compte les idées et leur étape), « Créer → Façonner → Produire », nos chansons.'],
  session: ['Jouer ensemble, guidés, sans se demander quoi faire.', 'Choisir où, combien de temps, sur quoi et sur quels accords ; suivre les étapes ; finir par une prise et un debrief.', 'Le plan (séances par semaine), la prochaine cible (votre debrief devient la séance suivante), le mur (les prises).'],
  relais: ['Créer chacun son tour, à distance.', 'Envoyer un son avec une consigne (« chante dessus »), répondre par-dessus, couche après couche.', 'Le mur (chaque envoi est une idée), l’accueil de l’autre (« nouveau pour toi »).'],
  ecrire: ['Écrire, seul ou à deux, jusqu’à des paroles qui se chantent.', 'Le journal, le mumble sur une musique, l’atelier, le grimoire, Placer mes paroles, Nos idées pour le labo ; double-cliquer un mot pour ses rimes et synonymes.', 'Le plan (pages écrites vs sons), le mur (une page peut y partir), nos chansons.'],
  studio: ['Construire la musique : beat, accords, chansons, prises.', 'Faire tes propres accords, monter une chanson (couplet, refrain, pont), remplacer un son, enregistrer une prise, improviser sur le clavier en couleurs.', 'Les séances (votre grille y est proposée), le mur (prises gardées), la pochette.'],
  oreille: ['Comprendre une pièce en quelques secondes, au lieu d’une heure à l’oreille.', 'Déposer un fichier ou enregistrer ton clavier : tempo, tonalité, parties, moment fort, boucle, accords, ce qui brille et ce qui est à retravailler ; sur une voix seule, les meilleures notes.', 'Le studio (accords envoyés), Écrire (la boucle comme fond), le profil (notes fortes de la voix), Nos deux âmes.'],
  placer: ['Poser des paroles déjà écrites sur une musique de Frog.', 'Écrire tes lignes, voir les syllabes et les accents, comparer 7 placements, écouter avec le guide vocal.', 'Le journal (tes lignes placées), et vos chansons.'],
  ames: ['Voir qui on est, ensemble, comme créateurs.', 'Lire ce qui nous unit, ce que l’un apporte à l’autre, nos frottements féconds et nos pistes hors sentier.', 'Rien à remplir : la page se nourrit de vos étapes 1 et de vos traces, et change avec elles.'],
  passage: ['Fermer un cycle à deux, à la nouvelle lune, avant d’en ouvrir un autre.', 'Relire ce qu’on avait semé ; regarder ce que le cycle a donné ; choisir l’idée qu’on emporte ; semer la lune qui vient.', 'Notre cycle (les nouvelles intentions), la mémoire du duo (nos lunes passées), le bilan.'],
  cathedrale: ['Bâtir une œuvre d’orchestre à partir de quelques nombres : la forme, le rythme et l’harmonie viennent de la même clé de voûte.', 'Choisir une clé (ou prendre les disques du labo) et le tour ; toucher une voix pour son instrument, son pupitre, ses liens ; toucher une arche pour sa mélodie et son accord ; écouter.', 'Le mur (l’œuvre gardée), le logiciel de Frog (le MIDI, une famille par piste), vos chansons.'],
  elan: ['Voir le mouvement du duo : qui lance, qui répond, ce qui circule, ce qui monte.', 'Regarder la tresse (deux semaines, un mois, depuis le début) ; toucher un nœud ou un lien pour lire l’histoire ; lire ce que la tresse raconte.', 'Le plan (ce qui attend ta réponse devient ta prochaine chose à faire), Nos deux âmes (ce qui circule entre vous devient une piste), et votre mémoire du duo.'],
  nouvelles: ['Voir d’un coup tout ce que l’autre a ajouté, et lui dire où on en est.', 'Cocher « vu » et « j’ai fait ça » ; ouvrir chaque nouvelle ; voir ce que l’autre a fait de tes envois.', 'Ce que l’autre voit de toi (il sait que c’est vu, que c’est fait), la pastille sur Plan.'],
  materiel: ['Retrouver ton studio dans l’app, tel qu’il est, et choisir ce qui joue.', 'Détecter tes appareils (audio et MIDI) ; ajouter le reste à la main ; placer tout comme dans ta pièce (plancher, murs, meubles, couleurs, tailles) ; photographier chaque appareil ; tendre le filet.', 'Le filet (il garde la dernière minute de ce qui est actif), la cathédrale (ce que tu branches), l’accueil (ton studio, et chez l’autre s’il est partagé).'],
  arbre: ['Admirer l’architecture de Diapason Labo.', 'Toucher un point de l’arbre ou de la généalogie pour lire sa fiche ; relire le journal des versions ; écouter d’où vient chaque son.', 'Rien : ici, on ne touche à rien.'],
  depart: ['Dire chacun d’où on part : objectifs, voix, styles, besoins.', 'Remplir ou relire ton étape 1, voir notre portrait commun, poser notre vision.', 'Le plan, la vision, Nos deux âmes, les tonalités conseillées pour la voix.'],
  accord: ['Chanter juste, accompagnée par le clavier.', 'Frog joue un accord, la voix chante : l’écran montre si c’est juste, en direct.', 'La carte de nos accords, le profil de la voix, le plan (la justesse peut devenir la priorité de la semaine).'],
  tessiture: ['Connaître l’étendue de ta voix.', 'Chanter du plus grave au plus aigu confortable : le labo mesure et nomme ton type de voix.', 'Les tonalités conseillées, le guide vocal de Placer mes paroles, Nos deux âmes.'],
  gym: ['Échauffer et entraîner la voix.', 'Des exercices courts, adaptés à ta tessiture.', 'Ta voix, séance après séance.'],
  miroir: ['Voir sa voix pendant qu’on chante.', 'Chanter et regarder la hauteur se dessiner.', 'La justesse, par le retour visuel.'],
  labo: ['Entendre comment un rythme devient une note, puis un accord.', 'Faire tourner des disques, accélérer, trouver des accords impossibles au piano.', 'Jouer (un rythme du labo peut devenir la grille de batterie).'],
  paroles: ['Sculpter un texte pour qu’il se chante.', 'Compter les syllabes, trouver des rimes et des synonymes, marquer les passages incertains.', 'Nos chansons, le relais (paroles à chanter).'],
  atelier: ['Une séance d’écriture guidée de 25 minutes.', 'Délier la main, écrire par les sens, une contrainte, garder ce qui brille.', 'Le journal, puis nos paroles.'],
  jeux: ['Lancer l’écriture quand la page est blanche.', 'Tirer une carte, jouer au cadavre exquis, explorer notre champ de mots.', 'Le journal et nos paroles.'],
  ambiances: ['Partir ailleurs avant d’écrire ou de jouer.', 'Choisir une ambiance sonore et écrire dedans.', 'Le journal, l’inspiration d’une séance.'],
  calendrier: ['Se donner du temps pour créer, à deux.', 'Proposer une plage (en présence, à distance, projet pro, jeux) ; approuver celle de l’autre ; suivre notre rythme ; cocher nos prochains pas.', 'Les séances, l’objectif de la semaine, l’accueil.'],
  lexique: ['Comprendre les mots de FLIP.', 'Lire ce que veut dire chaque mot de l’app, et ouvrir la page où il vit.', 'Toutes les pages.'],
  corbeille: ['Retrouver ce qu’on a effacé.', 'Restaurer une idée, ou l’effacer pour de bon, à deux.', 'Le mur.'],
  coffre: ['Garder nos meilleurs moments à part.', 'Relire et réécouter nos perles.', 'La mémoire du duo, et le bilan.'],
  etincelles: ['Ne perdre aucune idée qui passe.', 'Noter une étincelle de n’importe où (la flamme), pour la musique ou pour l’app.', 'Le mur et Nos idées pour le labo.'],
  bilan: ['Voir où on est rendus.', 'Les heures jouées, les séances, les progrès, la prochaine cible.', 'La motivation, et le plan.'],
  evolution: ['Voir nos courbes dans le temps.', 'Suivre la régularité, la justesse, les idées qui avancent.', 'Le bilan et le plan.'],
};
// Les mêmes trois cases, en mots-clés : ce qu'on lit d'un coup d'œil (la phrase complète reste au survol).
const MOTS = {
  '': [['où on en est', 'quoi faire maintenant'], ['par où commencer', 'lancer une séance', 'l’objectif de la semaine', 'ce que l’autre a fait', 'nos intentions du cycle'], ['chaque séance', 'le plan qui s’ajuste']],
  projet: [['ce qu’on bâtit à deux'], ['nos objectifs', 'le plan des six mois', 'nos intentions', 'notre vision', 'ce qui nous inspire'], ['l’accueil', 'chaque séance']],
  carnet: [['toutes nos idées', 'les faire avancer'], ['ajouter une idée, un son, un lien', 'monter d’étape', 'faire se rencontrer deux idées'], ['le plan', 'nos chansons']],
  session: [['jouer ensemble, guidés'], ['où, combien de temps', 'sur quels accords', 'suivre les étapes', 'une prise, un debrief'], ['le plan', 'la prochaine cible']],
  relais: [['créer chacun son tour', 'à distance'], ['envoyer un son', 'une consigne', 'répondre par-dessus'], ['le mur', 'nos nouvelles']],
  ecrire: [['écrire, seul ou à deux', 'des paroles qui se chantent'], ['le journal', 'le mumble', 'l’atelier', 'Placer mes paroles', 'rimes et synonymes'], ['le plan', 'nos chansons']],
  studio: [['construire la musique'], ['le beat', 'tes propres accords', 'une chanson entière', 'une prise', 'improviser au clavier'], ['les séances', 'le mur', 'la pochette']],
  oreille: [['comprendre une pièce', 'en quelques secondes'], ['tempo, tonalité', 'les parties', 'la boucle', 'les accords', 'ce qui brille'], ['Jouer', 'le profil de la voix']],
  placer: [['des paroles sur une musique'], ['syllabes et accents', '7 placements', 'le guide vocal'], ['le journal', 'nos chansons']],
  ames: [['qui on est, ensemble'], ['ce qui nous unit', 'nos frottements féconds', 'nos pistes hors sentier'], ['rien à remplir']],
  passage: [['fermer un cycle à deux'], ['relire', 'ce que le cycle a donné', 'l’idée qu’on emporte', 'semer la suivante'], ['notre cycle', 'nos lunes passées']],
  cathedrale: [['une œuvre d’orchestre', 'avec quelques nombres'], ['la clé et le tour', 'la nef', 'une voix', 'une arche', 'ce que Frog branche'], ['le mur', 'le WAV, le MIDI']],
  elan: [['le mouvement du duo'], ['la tresse', 'qui lance, qui répond', 'ce qui circule'], ['le plan', 'nos nouvelles']],
  nouvelles: [['ce que l’autre a ajouté'], ['cocher vu', 'j’ai fait ça', 'ouvrir chaque nouvelle'], ['ce que l’autre voit de toi']],
  materiel: [['ton studio, tel qu’il est'], ['détecter tes appareils', 'placer comme chez toi', 'photographier', 'tendre le filet'], ['le filet', 'la cathédrale', 'l’accueil']],
  arbre: [['l’architecture de l’app'], ['les fichiers', 'la généalogie', 'le journal des versions', 'les sons'], ['rien : on admire']],
  depart: [['d’où on part'], ['ton étape 1', 'notre portrait', 'notre vision'], ['le plan', 'Nos deux âmes', 'les tonalités']],
  accord: [['chanter juste'], ['un accord au clavier', 'la voix en direct'], ['la carte de nos accords', 'le profil de la voix']],
  tessiture: [['l’étendue de ta voix'], ['du grave à l’aigu', 'ton type de voix'], ['les tonalités conseillées', 'le guide vocal']],
  gym: [['échauffer la voix'], ['exercices courts', 'selon ta tessiture'], ['ta voix, séance après séance']],
  miroir: [['voir sa voix'], ['chanter', 'la hauteur dessinée'], ['la justesse']],
  labo: [['un rythme devient une note'], ['les disques', 'les groupes', 'les liens', 'la lampe'], ['Jouer', 'la cathédrale']],
  paroles: [['un texte qui se chante'], ['les syllabes', 'rimes et synonymes', 'les passages incertains'], ['nos chansons', 'le relais']],
  atelier: [['écrire, guidé, 25 minutes'], ['délier la main', 'les sens', 'une contrainte'], ['le journal', 'nos paroles']],
  jeux: [['lancer l’écriture'], ['tirer une carte', 'cadavre exquis', 'notre champ de mots'], ['le journal', 'nos paroles']],
  ambiances: [['partir ailleurs'], ['une ambiance sonore', 'écrire dedans'], ['le journal', 'une séance']],
  calendrier: [['notre temps pour créer'], ['proposer une plage', 'approuver', 'notre rythme', 'nos prochains pas'], ['les séances', 'l’objectif de la semaine']],
  lexique: [['les mots de FLIP'], ['lire un mot', 'ouvrir sa page'], ['toutes les pages']],
  corbeille: [['ce qu’on a effacé'], ['restaurer', 'effacer pour de bon'], ['le mur']],
  coffre: [['nos meilleurs moments'], ['relire', 'réécouter'], ['la mémoire du duo', 'le bilan']],
  etincelles: [['aucune idée perdue'], ['noter de n’importe où'], ['le mur', 'nos idées pour le labo']],
  bilan: [['où on est rendus'], ['heures, séances', 'progrès', 'la prochaine cible'], ['la motivation', 'le plan']],
  evolution: [['nos courbes'], ['régularité', 'justesse', 'idées qui avancent'], ['le bilan', 'le plan']],
};
// Un mot-clé qui nomme une autre page y mène ; un mot-clé qui nomme une partie de la page y amène.
const PAGES = { 'le calendrier': '#/calendrier', 'notre calendrier': '#/calendrier', 'le mur': '#/carnet', jouer: '#/studio', 'la cathédrale': '#/cathedrale', 'le plan': '#/', 'le plan qui s’ajuste': '#/', 'le journal': '#/ecrire', 'nos chansons': '#/studio?tab=chanson', 'une chanson entière': '#/studio?tab=chanson', 'le relais': '#/relais', 'nos nouvelles': '#/nouvelles', 'ce que l’autre a fait': '#/nouvelles', 'le bilan': '#/bilan', 'nos deux âmes': '#/ames', 'l’accueil': '#/', 'notre cycle': '#/', 'chaque séance': '#/session', 'les séances': '#/session', 'lancer une séance': '#/session', 'une séance': '#/session', 'nos paroles': '#/paroles', 'nos idées pour le labo': '#/ecrire', 'placer mes paroles': '#/placer', 'le guide vocal': '#/placer', 'le profil de la voix': '#/tessiture', 'ton type de voix': '#/tessiture', 'ton étape 1': '#/depart', 'notre portrait': '#/depart', 'la pochette': '#/studio?tab=cover', 'le filet': '#/materiel', 'tendre le filet': '#/materiel', 'la carte de nos accords': '#/accord', 'la prochaine cible': '#/bilan', 'notre projet': '#/projet', 'les tonalités': '#/depart', 'les tonalités conseillées': '#/depart', 'nos lunes passées': '#/passage', 'l’atelier': '#/atelier', 'le mumble': '#/ecrire', 'rimes et synonymes': '#/lexique' };
const CIBLES = { 'la clé et le tour': '.nf-commande', 'la nef': '.nf-nef-host', 'une voix': '.nf-voix', 'une arche': '.nf-arche', 'placer comme chez toi': '.m-scene', 'photographier': '.m-scene', 'ton studio, tel qu’il est': '.m-scene', 'détecter tes appareils': '.m-barre', 'proposer une plage': '.cl-barre', 'approuver': '.cl-attente, .cl-cal', 'notre rythme': '.cl-rythme', 'nos prochains pas': '.cl-pas', 'les groupes': '.groupes', 'les liens': '.liens', 'la lampe': '.lampe-ctl', 'les disques': '.tracks-panel', 'la clé de voûte': '.ca-cles', 'ce que frog branche': '.ca-branche', 'la lumière': '.ca-parties', 'la tresse': '.el-scene, .tresse, canvas', 'par où commencer': '.etape1, .commencer, [class*=commencer]', 'nos intentions du cycle': '.cycle, [class*=cycle]', 'le beat': '[data-tab=beat]', 'improviser au clavier': '.kb-legende', 'une chanson entière': '[data-tab=chanson]', 'la pochette': '[data-tab=cover]', 'une prise': '[data-tab=voix]', 'tes propres accords': '[data-act=editer]', 'le plan qui s’ajuste': '.ajuste', 'nos objectifs': '.pj-obj', 'l’objectif de la semaine': '.ob-sem', 'le plan des six mois': '.pj-plan', 'nos intentions': '.pj-int', 'notre vision': '.vision-in', 'ce qui nous inspire': '.inspi', 'où on en est': '.plan-hero', 'quoi faire maintenant': '.next-card', 'ajouter une idée, un son, un lien': '.capture, .cap, [class*=capture]', 'nos lunes passées': '.ps-lunes, [class*=lunes]' };
const norme = (x) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' ').replace(/\b(le|la|les|l|un|une|des|du|de|nos|notre|ton|ta|tes|vos|votre|ses|son|sa|d|a|au|aux)\b/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
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
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Installe le sommaire « Sur cette page » : la liste des sections, et un petit bouton qui la rouvre plus bas.
export function installerSommaire(vue) {
  let t = 0; let sig = ''; let observer = null;
  // Plus bas dans la page : un petit bouton rouvre la même liste, en colonne.
  const flottant = document.createElement('button'); flottant.type = 'button'; flottant.className = 'som-flot no-aide'; flottant.hidden = true;
  flottant.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1.3"/><circle cx="4" cy="12" r="1.3"/><circle cx="4" cy="18" r="1.3"/></svg><span>Sur cette page</span>';
  const pop = document.createElement('nav'); pop.className = 'som-pop no-aide'; pop.hidden = true; pop.setAttribute('aria-label', 'Sur cette page');
  document.body.append(flottant, pop);
  flottant.addEventListener('click', () => { pop.hidden = !pop.hidden; });
  const majFlottant = (titres) => { pop.innerHTML = `<b>Sur cette page</b><ol>${titres.map((h, i) => `<li><button type="button" data-som="${i}">${esc(h.textContent.trim().replace(/\s+/g, ' ').slice(0, 48))}</button></li>`).join('')}</ol>`; if (titres.length < 2) { flottant.hidden = true; pop.hidden = true; } };
  pop.addEventListener('click', (e) => { const b = e.target.closest('[data-som]'); if (!b) return; aller(+b.dataset.som); pop.hidden = true; });
  const aller = (i) => { const h = vue._somTitres?.[i]; if (!h) return; const d = h.closest('details'); if (d && !d.open) d.open = true; h.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  document.addEventListener('click', (e) => { if (!pop.hidden && !e.target.closest('.som-pop, .som-flot')) pop.hidden = true; });
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
      box.innerHTML = ['Ça sert à', 'Tu peux', 'Ça nourrit'].map((t, i) => { const mc = MOTS[id]?.[i] || POINTS(m[i]).map((x) => x.replace(/\.$/, '')); return `<div class="md-case" title="${m[i].replace(/"/g, '&quot;')}">${ICONES[i]}<b>${t}</b><ul class="md-mots">${mc.map((x) => `<li>${x}</li>`).join('')}</ul></div>`; }).join('')
        + `<button type="button" class="md-plier" data-md="plier" aria-label="${replie() ? 'Déplier' : 'Replier'} le mandat de la page">${replie() ? 'À quoi sert cette page ▾' : '▴'}</button>`;
      tete.after(box);
      // Les mots-clés deviennent des liens : vers une partie de cette page si elle existe, sinon vers la page nommée.
      const parties = [...vue.querySelectorAll('h2, h3, summary h2')].filter((h) => h.offsetParent && !h.closest('.mandat, .sommaire, .tour, .coach, .maj'));
      box.querySelectorAll('.md-mots li').forEach((li) => {
        const t = li.textContent.trim(); const n = norme(t); const cle = t.toLowerCase();
        let cible = CIBLES[cle] && vue.querySelector(CIBLES[cle]);
        if (!cible && n.length >= 4) cible = parties.find((h) => { const hn = norme(h.textContent); return hn && (hn.includes(n) || (n.includes(hn) && hn.length >= 5)); });
        if (cible) { li.innerHTML = `<button type="button" class="md-lien" title="Aller à cette partie de la page">${esc(t)}</button>`; li.firstChild._cible = cible; return; }
        const page = PAGES[cle]; if (page && page.split('?')[0] !== `#/${id}`) { li.innerHTML = `<a class="md-lien" href="${page}" title="Ouvrir cette page">${esc(t)} ↗</a>`; return; }
        // Sans cible nommée : on cherche le geste dans les boutons, onglets et étiquettes de la page (« détecter tes
        // appareils » → « Détecter mon matériel ») ; et « Ça sert à » mène à la zone de travail principale.
        const col = [...box.querySelectorAll('.md-case')].indexOf(li.closest('.md-case'));
        const mots = n.split(' ').filter((w) => w.length >= 5).map((w) => w.slice(0, 6));
        let geste = mots.length && [...vue.querySelectorAll('button, summary, label, [role=tab], .tape, .eyebrow, legend, th')].find((x) => x.offsetParent && !x.closest('.mandat, .sommaire, .tour, .coach, .maj, #nav, .subnav') && mots.some((w) => norme(x.textContent).includes(w)));
        if (!geste && col <= 1) geste = [...box.parentElement.children].slice([...box.parentElement.children].indexOf(box) + 1).find((x) => x.offsetParent && !x.matches('.sommaire, .appui, script, style') && x.getBoundingClientRect().height > 40);
        if (geste) { li.innerHTML = `<button type="button" class="md-lien" title="Aller à cette partie de la page">${esc(t)}</button>`; li.firstChild._cible = geste; li.firstChild._sansClic = !geste.matches('[role=tab], [data-tab]'); }
      });
    }
    vue._somTitres = titres;
    majFlottant(titres);
    if (titres.length < 2) return;
    // « Sur cette page », en colonne : la 4e case du mandat, ou une petite carte seule s'il n'y a pas de mandat.
    const nav = document.createElement('nav'); nav.className = 'sommaire no-aide'; nav.setAttribute('aria-label', 'Sur cette page');
    nav.innerHTML = `<b>Sur cette page</b><ol>${titres.map((h, i) => `<li><button type="button" data-som="${i}">${esc(h.textContent.trim().replace(/\s+/g, ' ').slice(0, 48))}</button></li>`).join('')}</ol>`;
    const md = vue.querySelector('.mandat');
    if (titres.length > 4) nav.classList.add('som-2col');
    if (md) { nav.classList.add('md-case', 'md-som'); md.classList.add('avec-som'); md.querySelector('.md-plier').before(nav); } else if (tete) tete.after(nav); else vue.prepend(nav);
    observer?.disconnect(); observer = new IntersectionObserver(([en]) => { flottant.hidden = en.isIntersecting || titres.length < 2; if (en.isIntersecting) pop.hidden = true; }); observer.observe(nav);
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
    const ml = e.target.closest('button.md-lien');
    if (ml?._cible) { const c = ml._cible; const d = c.closest('details'); if (d && !d.open) d.open = true; if (c.matches('[data-tab], button') && !ml._sansClic) c.click(); c.scrollIntoView({ behavior: 'smooth', block: 'start' }); c.classList.add('vise'); setTimeout(() => c.classList.remove('vise'), 2400); return; }
    if (e.target.closest('[data-md=plier]')) {
      const box = e.target.closest('.mandat'); const r = !box.classList.contains('replie'); box.classList.toggle('replie', r);
      try { localStorage.setItem('diapason:mandatReplie', r ? '1' : '0'); } catch { /* tant pis */ }
      const b2 = box.querySelector('[data-md=plier]'); b2.textContent = r ? 'À quoi sert cette page ▾' : '▴'; return;
    }
    const b = e.target.closest('.sommaire [data-som]'); if (!b) return;
    aller(+b.dataset.som);
  });
  addEventListener('hashchange', () => { sig = ''; pop.hidden = true; flottant.hidden = true; });
  passe();
}

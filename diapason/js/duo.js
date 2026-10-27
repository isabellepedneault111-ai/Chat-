// Le contenu de Zaza & Frog : tiré de la recherche Consensus de Zaza
// (« deux personnes qui souhaitent jouer de la musique ensemble »). Chaque élément garde ses sources.

export const MEMBERS = ['Zaza', 'Frog'];
export const ROLES = { Zaza: 'voix · guitare · interprète', Frog: 'son · MIDI · piano · composition' };
export const memberColor = (name) => (name === MEMBERS[1] ? 'var(--frog)' : 'var(--zaza)');

// Le pipeline d'une idée : générer → écouter et évaluer → construire → fixer → jouer (Biasutti 2018, Aslan 2016).
export const STAGES = [
  { id: 0, label: 'Idée brute', hint: 'Sortie d’une impro, d’un mémo, d’un rêve. On garde tout.' },
  { id: 1, label: 'À creuser', hint: 'On l’a réécoutée : il y a quelque chose.' },
  { id: 2, label: 'En chantier', hint: 'Une ébauche : on développe, on varie.' },
  { id: 3, label: 'Fixé', hint: 'Forme, tempo, entrées et rôles décidés : jouable.' },
  { id: 4, label: 'Dans le set', hint: 'Stable, répété, prêt à jouer devant du monde.' },
];

// Plan de six mois : d'idées brutes à 3 à 5 originaux stables.
// mesure(ctx) → nombre atteint ; cible → objectif du mois.
export const PLAN = [
  { n: 1, titre: 'Routines et vocabulaire commun', sortie: '10 à 15 idées enregistrées', cible: 10, mesure: (c) => c.idees, src: 'Chacón-López 2021' },
  { n: 2, titre: 'Trier et développer les meilleures idées', sortie: '2 ébauches de morceaux', cible: 2, mesure: (c) => c.stage(2), src: 'Williamson 2022' },
  { n: 3, titre: 'Fixer forme, tempo, entrées, rôles', sortie: '2 morceaux jouables', cible: 2, mesure: (c) => c.stage(3), src: 'Payne 2018' },
  { n: 4, titre: 'Paroles, hooks, transitions', sortie: '3 morceaux quasi finis', cible: 3, mesure: (c) => c.paroles, src: 'Merchán-Sánchez-Jara 2023' },
  { n: 5, titre: 'Répéter, arranger, simplifier', sortie: 'Un mini-set cohérent', cible: 3, mesure: (c) => c.stage(4), src: 'Lopes 2021' },
  { n: 6, titre: 'Démos et test devant des proches', sortie: '3 à 5 originaux stables', cible: 3, mesure: (c) => Math.min(c.stage(4), c.demos), src: 'Ginsborg 2021' },
];

// Le rythme : séances distribuées plutôt que rares et longues (Rohrer 2004).
export const RYTHME = [
  { id: 'duo', label: 'Sessions duo', parSemaine: 2, duree: '60 à 90 min', src: 'Bishop 2019 · Williamson 2022' },
  { id: 'solo', label: 'Micro-sessions solo (chacun)', parSemaine: 3, duree: '20 à 30 min', src: 'Miksza 2023 · Chacón-López 2021' },
  { id: 'ecoute', label: 'Écoute commune d’un enregistrement', parSemaine: 0.5, duree: 'toutes les 2 semaines', src: 'Ginsborg 2012, 2021' },
];

// La séance type : exploration → sélection → stabilisation, et elle finit toujours par une prise.
export const PHASES = {
  checkin: { titre: 'Check-in et cible', but: 'Une seule cible pour la séance : un groove, un refrain, une ambiance.', pool: [], src: 'Mornell 2020' },
  echauffement: { titre: 'Échauffement', but: 'Baisser la pression, réveiller l’écoute, caler le tempo commun. Aucun enjeu esthétique.', pool: ['e-penta', 'e-echo', 'e-gamme', 'e-regard', 'e-corps'], src: 'Chacón-López 2021 · Edmund 2020' },
  impro: { titre: 'Impro dirigée', but: 'Restreindre les choix pour découvrir des motifs à vous. On enregistre tout.', pool: ['i-appel', 'i-nonrep', 'i-eco', 'i-theme', 'i-image', 'i-degres', 'i-libre'], src: 'Biasutti 2017 · MacGlone 2024' },
  developper: { titre: 'Choisir et développer', but: 'Isoler le fragment qui vous a allumés (10 à 30 s) et en faire trois variations.', pool: ['a-fragment', 'a-syncope', 'i-preentendre'], src: 'Prichard 2021 · Williamson 2022' },
  structure: { titre: 'Fixer la structure', but: 'Passer en mode analytique : forme, entrées, signaux, zones fixes et zones libres.', pool: ['a-abab', 'a-pont', 'a-zones', 'c-entree', 'c-reperes'], src: 'Heil 2017 · Geyer 2025' },
  prise: { titre: 'La prise', but: 'Un passage complet sans s’arrêter, en mode spectacle, et on enregistre.', pool: ['f-passage'], src: 'Montemayor 2014 · Lapicus 2025' },
  debrief: { titre: 'Debrief', but: 'Intention → ce qu’on a entendu → l’écart → la prochaine cible.', pool: ['f-verbal', 'f-reecoute'], src: 'Biasutti 2017 · Marino 2023' },
  cible: { titre: 'Cible', but: 'Une seule chose à travailler seul aujourd’hui.', pool: [], src: 'Miksza 2023' },
  solo: { titre: 'Travail ciblé', but: 'Pré-entendre, varier, préparer sa partie pour la prochaine séance duo.', pool: ['i-preentendre', 'i-eco', 'a-fragment', 'e-gamme'], src: 'Vilnite 2023 · Mornell 2020' },
  memo: { titre: 'Mémo pour le duo', but: 'Une idée enregistrée et une phrase pour l’autre.', pool: [], src: 'Ginsborg 2012' },
  reecoute: { titre: 'Réécouter nos prises', but: 'Les prises des deux dernières semaines, une après l’autre. On parle peu, on note beaucoup.', pool: ['f-reecoute'], src: 'Ginsborg 2012, 2021' },
  tri: { titre: 'Trier vers le mur', but: 'Chaque idée avance d’une étape, reste où elle est, ou part aux archives. Une seule cible pour la prochaine session.', pool: ['f-verbal'], src: 'Biasutti 2018' },
};

export const FORMATS = [
  { id: 'duo60', label: 'Session duo · 60 min', phases: [['checkin', 5], ['echauffement', 8], ['impro', 15], ['developper', 15], ['structure', 5], ['prise', 4], ['debrief', 8]] },
  { id: 'duo90', label: 'Session duo · 90 min', phases: [['checkin', 5], ['echauffement', 10], ['impro', 20], ['developper', 25], ['structure', 10], ['prise', 8], ['debrief', 12]] },
  { id: 'solo', label: 'Micro-session solo · 25 min', phases: [['cible', 2], ['echauffement', 5], ['solo', 13], ['memo', 5]] },
  { id: 'ecoute', label: 'Écoute commune · 20 min', phases: [['reecoute', 12], ['tri', 8]] },
];

export const CIBLES = ['Un groove', 'Un refrain', 'Une ambiance', 'Une transition', 'Les entrées ensemble', 'Le texte d’un couplet', 'Un son d’effet signature', 'La fin d’un morceau'];

// Exercices : z = ce que fait Zaza (voix + guitare), f = ce que fait Frog (piano + effets).
export const EXERCICES = {
  // Le coin piano de Frog : apprendre ET créer, toujours au service de la voix de Zaza.
  'p-renv': { nom: 'Renversements dans la voix de Zaza', duree: 8, comment: ['Do, Fa, Sol : joue chaque accord en position fondamentale.', 'Puis le renversement le plus proche du précédent : les doigts bougent le moins possible.', 'Garde la note du haut dans la tessiture de Zaza : c’est là que sa voix se posera.'], src: 'Piston 1941 · conduite des voix' },
  'p-harmo': { nom: 'Harmoniser le mumble de Zaza', duree: 10, comment: ['Écoute son dernier mumble deux fois, sans jouer.', 'Trouve la note où elle revient le plus : c’est sa maison.', 'Un accord par mesure qui contient sa note longue. Enregistre, lance-le-lui au relais.'], src: 'Pattison 2009 · Burger 2022' },
  'p-comping': { nom: 'Quatre façons d’accompagner', duree: 8, comment: ['Blocs sur les temps : simple, solide.', 'Croches régulières : la nappe qui avance.', 'Charleston 3-3-2 : le balancement.', 'Une seule attaque par mesure : laisse respirer la voix.'], src: 'Levine 1989 · Clauhs 2021' },
  'p-couleurs': { nom: 'Accords sans tierce : la couleur', duree: 6, comment: ['Joue Do – Sol – Ré (quinte et neuvième) au lieu de Do majeur.', 'Promène cette forme sur la gamme : un son ouvert, moderne.', 'Quelle chanson de nous deux vivrait là-dedans?'], src: 'Levine 1989 · voicings ouverts' },
  'p-basse': { nom: 'Une main gauche qui tient tout', duree: 6, comment: ['Pédale : la même basse quatre mesures, la main droite change au-dessus.', 'La basse descend d’un pas par mesure : Do, Si, La, Sol.', 'Un ostinato de trois notes, répété jusqu’à devenir un groove.'], src: 'Burger 2022 · Norgaard 2017' },
  'p-reharmo': { nom: 'Une note, quatre accords', duree: 8, comment: ['Prends une seule note de la mélodie de Zaza : Mi.', 'Quatre accords qui la contiennent : Do, Lam, Mim, Famaj7.', 'La même mélodie sur chacun : la couleur change, l’émotion aussi.'], src: 'Levine 1989 · réharmonisation' },
  'e-penta': { nom: 'Pentatonique sans fausse note', duree: 5, comment: ['Tonalité du jour, gamme pentatonique seulement.', 'Frog sur les notes de la pentatonique (ou les touches noires).', 'Zaza chante des voyelles par-dessus, puis la guitare rejoint.'], src: 'Chacón-López 2021 · Norgaard 2017' },
  'e-echo': { nom: 'Écho rythmique', duree: 4, comment: ['L’un frappe ou joue une mesure, l’autre la répète exactement.', 'Après 8 échanges, on inverse.', 'Puis on monte le tempo de 10 BPM.'], src: 'Edmund 2020 · Nikolaou 2023' },
  'e-gamme': { nom: 'Gamme au métronome', duree: 5, comment: ['La gamme de la tonalité du jour, en noires puis en croches.', 'Ensemble, au métronome, mouvements conjoints.', 'Écoutez les attaques : tombent-elles en même temps?'], src: 'Rotjan 2020 · Zhou 2025' },
  'e-regard': { nom: 'Avec, puis sans se regarder', duree: 5, comment: ['Une boucle simple en se regardant.', 'La même boucle dos à dos.', 'Qu’est-ce qui a changé? Qui a pris le lead?'], src: 'Bishop 2019' },
  'e-corps': { nom: 'Corps et souffle', duree: 3, comment: ['Une consigne de mouvement : balancer, marcher le tempo, respirer ensemble.', 'Épaules basses, mâchoire molle.', 'Le corps prêt avant les doigts et la voix.'], src: 'Siljamäki 2021 · MacGlone 2024' },
  'i-appel': { nom: 'Appel-réponse sur 2 mesures', duree: 8, comment: ['Zaza (voix ou guitare) lance 2 mesures.', 'Frog (piano) répond sur 2 mesures.', 'Après 8 échanges : on inverse les rôles.'], src: 'Bertolani 2019 · Nikolaou 2023' },
  'i-nonrep': { nom: 'Non-répétition', duree: 8, comment: ['Chaque nouveau passage doit changer UN paramètre : rythme, registre, texture, nuance.', 'Interdit de rejouer la même chose.', 'Notez le paramètre qui a le plus surpris.'], src: 'Bertolani 2019' },
  'i-eco': { nom: 'Économie de matériau', duree: 8, comment: ['Limite stricte : une note tenue, OU une cellule de 3 notes, OU un seul intervalle.', 'Tout le reste vient du rythme, du timbre, des effets.', 'Moins de choix = plus d’écoute.'], src: 'De Bruin 2019 · Sayers 2025' },
  'i-theme': { nom: 'Impro sur un thème externe', duree: 10, comment: ['Choisissez un point de départ : une photo, un mot, un souvenir commun.', 'Jouez-le sans en parler.', 'Comparez ensuite : aviez-vous la même image?'], src: 'Price 2026 · Bertolani 2019' },
  'i-image': { nom: 'Image et métaphore', duree: 8, comment: ['Une image concrète : « une rue mouillée à 3 h du matin ».', 'Frog cherche le timbre et la texture dans les effets.', 'Zaza cherche la couleur de la voix et de la guitare.'], src: 'Biasutti 2017 · MacGlone 2024' },
  'i-degres': { nom: 'Degrés 1, 2, 3, 5 sur I–IV–V–I', duree: 8, comment: ['Grille I–IV–V–I en boucle.', 'La voix (ou la main droite) se limite aux degrés 1, 2, 3 et 5.', 'Précision d’abord, liberté ensuite.'], src: 'Clauhs 2021 · Burger 2022' },
  'i-libre': { nom: 'Impro libre', duree: 10, comment: ['Sans plan, sans grille.', 'Enregistrez tout : vous trierez plus tard.', 'Laissez de l’espace à l’autre.'], src: 'Aslan 2016' },
  'i-preentendre': { nom: 'Pré-entendre', duree: 5, comment: ['Humez ou chantez la ligne AVANT de la jouer.', 'Puis jouez-la telle que vous l’avez entendue dans votre tête.', 'L’oreille d’abord, les doigts ensuite.'], src: 'Vilnite 2023' },
  'a-fragment': { nom: 'Un fragment, trois variations', duree: 15, comment: ['Isolez 10 à 30 secondes qui vous ont allumés.', 'Variation 1 : nuances. Variation 2 : accents. Variation 3 : densité (plus plein, plus vide).', 'Enregistrez les trois, gardez la meilleure.'], src: 'Prichard 2021 · Bennett 2021 · Nikolaou 2023' },
  'a-syncope': { nom: 'Le clavier en syncope', duree: 8, comment: ['La guitare tient la pulsation.', 'Frog place des accents syncopés à contretemps.', 'Deux couches qui se superposent au lieu de se doubler.'], src: 'Merchán-Sánchez-Jara 2023' },
  'a-abab': { nom: 'Forme A-B-A-B', duree: 10, comment: ['A : texture dépouillée, guitare et voix.', 'B : les textures et effets du clavier entrent, changement de registre.', 'Idéal pour les premières séances.'], src: 'Spring 1995 · Bertolani 2019' },
  'a-pont': { nom: 'Gabarit avec pont', duree: 10, comment: ['Intro – Couplet A – Couplet B – Pont – Outro.', 'Solo optionnel de 8 mesures après le pont, pas plus.', 'Le pont révèle les problèmes d’entrées : c’est voulu.'], src: 'Carter 2016 · Montemayor 2014' },
  'a-zones': { nom: 'Zones fixes, zones libres', duree: 8, comment: ['Verrouillez le tempo et les transitions aux extrémités.', 'Laissez une zone ouverte à l’impro au milieu.', 'Écrivez sur le mur où sont les zones.'], src: 'Geyer 2025' },
  'a-chunks': { nom: 'Petits tronçons, ordre varié', duree: 10, comment: ['Répétez section par section, courtes.', 'Changez l’ordre des sections chaque semaine.', 'Finissez par un passage complet.'], src: 'Carter 2016 · Veniel-Martí 2026' },
  'c-entree': { nom: 'Le signal d’entrée', duree: 5, comment: ['Désignez qui mène chaque entrée.', 'Le leader fait un hochement de tête ample : il monte, puis ralentit.', 'L’autre attaque pendant le ralenti du geste. Répétez 5 départs.'], src: 'Bishop 2017 · Chang 2017' },
  'c-reperes': { nom: 'Nos repères convenus', duree: 5, comment: ['Notez les respirations, les points d’orgue, les transitions.', 'Ce sont vos points de rendez-vous.', 'Aux transitions et aux notes tenues : regardez-vous.'], src: 'Ginsborg 2006 · Bishop 2019' },
  'f-passage': { nom: 'Le passage en mode spectacle', duree: 4, comment: ['Un passage complet, sans s’arrêter, quoi qu’il arrive.', 'Enregistrez-le.', 'Les conditions de scène ne sont pas celles de la répétition : on s’y entraîne.'], src: 'Montemayor 2014 · Lapicus 2025' },
  'f-verbal': { nom: 'Verbalisation guidée', duree: 6, comment: ['Ce qu’on voulait (intention).', 'Ce qu’on a entendu.', 'L’écart, puis LA prochaine cible. Pas de « j’aime / j’aime pas ».'], src: 'Biasutti 2017 · Marino 2023' },
  'f-reecoute': { nom: 'Réécoute de la prise', duree: 5, comment: ['Réécoutez la prise du jour.', 'Les attaques tombent-elles ensemble? L’équilibre voix / guitare / clavier / effets?', 'Notez une seule chose à corriger.'], src: 'Biasutti 2015 · Kambs 2026' },
};

// Seul, on ne peut pas faire l'écho ni « avec, puis sans se regarder » : la séance solo pioche dans ce qui se fait seul.
export const SOLO_POOLS = { echauffement: ['e-penta', 'e-gamme', 'e-corps'], solo: ['i-preentendre', 'i-eco', 'a-fragment', 'e-gamme'] };
// Les mêmes exercices, dits à la personne qui les fait seule : à la voix (Zaza) ou au clavier (Frog).
// Le clavier de l'app joue la partie de l'autre : on l'entend en boucle, et on chante ou on joue avec lui.
export const SOLO_CONSIGNES = {
  'e-penta': { voix: ['Le clavier de l’app tient un bourdon sur Do et joue la pentatonique : Do, Ré, Mi, Sol, La.', 'Chante seulement ces cinq notes : monte, descends, saute. Aucune ne peut être fausse.', 'Invente une petite phrase de quatre notes et répète-la trois fois.'],
    clavier: ['Seulement Do, Ré, Mi, Sol, La (ou les touches noires) sur le bourdon.', 'Monte, descends, saute : aucune note n’est fausse.', 'Trouve une phrase de quatre notes et répète-la trois fois.'] },
  'e-gamme': { voix: ['Écoute une fois le clavier de l’app jouer la gamme de Do, sur le clic.', 'Chante-la avec lui, une note par clic, en montant puis en descendant. Puis deux notes par clic.', 'Enregistre-toi et réécoute : tes attaques tombent-elles sur le clic?'],
    clavier: ['La gamme de Do, mains séparées puis ensemble.', 'Au métronome : une note par clic, puis deux.', 'Enregistre-toi et réécoute : tes attaques tombent-elles sur le clic?'] },
  'e-corps': { voix: ['Balance-toi sur le tempo, ou marche-le sur place.', 'Épaules basses, mâchoire molle.', 'Respire avec le cercle : le corps prêt avant la voix.'],
    clavier: ['Balance-toi sur le tempo, les mains sur les cuisses.', 'Épaules basses, poignets souples.', 'Respire avec le cercle : le corps prêt avant les doigts.'] },
  'i-preentendre': { voix: ['Le clavier de l’app joue une courte phrase : écoute-la.', 'La mesure suivante, il se tait : chante-la dans ta tête, sans son.', 'Puis chante-la à voix haute, telle que tu l’as entendue. Il recommence avec une autre.'],
    clavier: ['Le clavier de l’app joue une courte phrase : écoute-la.', 'La mesure suivante, entends-la dans ta tête, sans jouer.', 'Puis joue-la telle que tu l’as entendue.'] },
  'i-eco': { voix: ['Une seule note tenue, OU une cellule de trois notes, sur le bourdon du clavier.', 'Tout le reste vient du rythme, des consonnes, du souffle.', 'Enregistre deux minutes et garde ce qui te surprend.'],
    clavier: ['Une seule note tenue, OU une cellule de trois notes, OU un seul intervalle.', 'Tout le reste vient du rythme, du timbre, des effets.', 'Enregistre deux minutes et garde ce qui te surprend.'] },
  'a-fragment': { voix: ['Choisis 10 à 30 secondes d’une prise qui t’a allumée.', 'Variation 1 : nuances. Variation 2 : accents. Variation 3 : densité (plus plein, plus vide).', 'Enregistre les trois, garde la meilleure pour Frog.'],
    clavier: ['Choisis 10 à 30 secondes d’une prise qui t’a allumé.', 'Variation 1 : nuances. Variation 2 : accents. Variation 3 : densité (plus plein, plus vide).', 'Enregistre les trois, garde la meilleure pour Zaza.'] },
};
export function consignesDe(id, { solo = false, moi = '', membres = MEMBERS } = {}) {
  const ex = EXERCICES[id]; if (!ex) return [];
  const v = solo && SOLO_CONSIGNES[id]; return v ? v[moi === membres[1] ? 'clavier' : 'voix'] : ex.comment;
}

// Grilles harmoniques (degrés de la gamme majeure) : un socle stable pour voix et guitare,
// du champ libre pour les textures du clavier.
export const GRILLES = [
  { id: 'vamp', nom: 'Vamp : deux accords en boucle', roman: 'I – IV', chords: [[0, 'M'], [5, 'M'], [0, 'M'], [5, 'M']], usage: 'Deux accords qui se répondent sans fin. Le plus simple : la voix est libre, le clavier explore les sons.', src: 'Norgaard 2017' },
  { id: 'cadence', nom: 'Aller-retour (cadence)', roman: 'I – V – I', chords: [[0, 'M'], [7, 'M'], [0, 'M'], [7, '7']], usage: 'On part de la maison, on se tend, on revient. Parfait pour se répondre l’un l’autre.', src: 'Mazurkiewicz 2024' },
  { id: 'iiVI', nom: 'Boucle jazz', roman: 'ii7 – V7 – Imaj7', chords: [[2, 'm7'], [7, '7'], [0, 'maj7'], [0, 'maj7']], usage: 'Trois accords plus colorés, qui donnent envie de mélodie. Le moteur du jazz.', src: 'McClimon 2017' },
  { id: 'IIVVI', nom: 'La grille des chansons', roman: 'I – IV – V – I', chords: [[0, 'M'], [5, 'M'], [7, 'M'], [0, 'M']], usage: 'Celle de milliers de chansons pop et folk : solide, facile à chanter dessus.', src: 'Heil 2017 · Burger 2022' },
  { id: 'pedale', nom: 'Basse immobile (pédale)', roman: 'I sus2 – I – I sus2 – Imaj7', chords: [[0, 'sus2'], [0, 'M'], [0, 'sus2'], [0, 'maj7']], usage: 'La basse reste sur la même note, la couleur change par-dessus : pour les ambiances et les effets.', src: 'Bian 2023 · Mazurkiewicz 2024' },
];

// Contraintes surprises (le dé) : la contrainte libère (De Bruin 2019, Merchán-Sánchez-Jara 2023).
export const CONTRAINTES = [
  'Trois notes seulement, pour vous deux.',
  'Pas plus de deux accords.',
  'Jouez dos à dos : aucun regard.',
  'Frog ne joue que des sons d’effets, aucune note « propre ».',
  'Zaza chante sans paroles : des voyelles seulement.',
  'Tempo imposé : 64 BPM. Puis 128.',
  'Commencez par le pont.',
  'Chaque phrase dure exactement 2 mesures, et l’autre répond.',
  'Chaque passage change un paramètre. Interdit de répéter.',
  'Jouez « une rue mouillée à 3 h du matin ».',
  'Le silence compte : une mesure sur deux est vide.',
  'Échangez vos rôles : Frog mène, Zaza accompagne.',
  'Une seule note tenue, tout le reste est rythme.',
  'Racontez un souvenir commun sans un mot.',
];

// Vision partagée : tonalité, instrumentation, genre, style (Merchán-Sánchez-Jara 2023).
export const VISION_FIELDS = [
  ['tonalite', 'Tonalités qui nous vont', 'Ex. : Ré, Mi mineur'],
  ['instrumentation', 'Instrumentation', 'Ex. : voix, guitare acoustique, piano, nappes et délais'],
  ['genre', 'Genre', 'Ex. : folk électro'],
  ['style', 'Style, références', 'Ex. : intime, cinématographique'],
  ['intention', 'Notre cap, dans six mois', 'Ex. : deux chansons originales qu’on maîtrise, enregistrées'],
  ['ressenti', 'Ce qu’on veut que les gens ressentent', 'Ex. : l’hiver, mais avec de la lumière dedans'],
];

// « Pourquoi ça marche » : ce que dit la recherche, section par section.
export const POURQUOI = {
  home: { titre: 'L’accueil', points: [
    ['Des séances courtes et régulières battent les rares longues répétitions.', 'Rohrer 2004'],
    ['Un objectif clair et partagé (tonalité, instrumentation, genre, style) est un préalable à la composition à deux.', 'Merchán-Sánchez-Jara 2023'],
    ['Six mois suffisent pour passer d’idées brutes à 3 à 5 morceaux originaux prêts à jouer.', 'Synthèse Consensus'],
  ] },
  session: { titre: 'La séance', points: [
    ['Une bonne séance alterne exploration, sélection et stabilisation.', 'Mornell 2020 · Williamson 2022'],
    ['Les duos efficaces parlent peu, jouent beaucoup, et reviennent sur de courts extraits.', 'Ginsborg 2012'],
    ['Le meilleur matériau naît d’un cycle écouter, répondre, proposer, faire un compromis, puis d’une prise enregistrée.', 'Williamson 2022'],
    ['Une attitude ouverte face aux erreurs stimule la créativité.', 'Murillo 2021'],
  ] },
  carnet: { titre: 'Le mur', points: [
    ['Composer à plusieurs, c’est générer, écouter et évaluer, puis construire.', 'Biasutti 2018'],
    ['L’improvisation génère le matériel ; la sélection et la révision font les morceaux.', 'Aslan 2016'],
    ['Une écoute commune enregistrée toutes les deux semaines ancre les progrès.', 'Ginsborg 2012, 2021'],
  ] },
  paroles: { titre: 'Les paroles', points: [
    ['Les paroles, les hooks et les transitions arrivent au 4e mois, une fois les morceaux fixés.', 'Merchán-Sánchez-Jara 2023'],
    ['Des contraintes claires réduisent la peur de la page blanche.', 'Merchán-Sánchez-Jara 2023'],
  ] },
  studio: { titre: 'Jouer', points: [
    ['La complémentarité des instruments : le clavier en syncope contre la guitare crée des couches.', 'Merchán-Sánchez-Jara 2023'],
    ['Le design sonore numérique fait le pont entre l’acoustique et l’électronique.', 'Bremmer 2024'],
  ] },
  voix: { titre: 'La voix', points: [
    ['Pré-entendre une ligne avant de la chanter améliore la justesse.', 'Vilnite 2023'],
    ['Connaître sa zone confortable permet de choisir les bonnes tonalités pour le duo.', 'Synthèse'],
  ] },
  labo: { titre: 'Le labo', points: [
    ['Les mêmes rapports (2:3, 3:4) organisent les polyrythmes et les intervalles.', 'Acoustique musicale'],
    ['Au-delà d’environ 20 événements par seconde, l’oreille entend une hauteur.', 'Psychoacoustique'],
  ] },
};

// ---------- Étape 1 : notre point de départ ----------
export const OBJECTIFS = ['Finir 3 à 5 originaux', 'Jouer devant du monde', 'Une démo dont on est fiers', 'Composer vraiment à deux', 'Développer ma voix', 'Sculpter notre son', 'Écrire de meilleurs textes', 'Du plaisir, sans pression', 'Trouver notre son à nous', 'Apprendre de l’autre'];
// Ce qu'on aime dans une chanson qui nous inspire : la précision qui rend le portrait utile (on ne copie pas un artiste,
// on cherche sa rythmique, sa voix, sa façon de construire).
export const ASPECTS = [['rythme', 'la rythmique, le groove'], ['voix', 'la voix'], ['texte', 'le texte'], ['melodie', 'la mélodie'], ['accords', 'les accords'], ['son', 'le son, la production'], ['ambiance', 'l’ambiance'], ['energie', 'l’énergie'], ['instrument', 'un instrument, l’arrangement'], ['structure', 'la structure, les surprises'], ['emotion', 'l’émotion']];
export const aspect = (k) => ASPECTS.find(([x]) => x === k)?.[1] || k;
// Un lien YouTube ou Spotify peut s'ouvrir au bon moment (« à 2:14 »).
export function lienAuMoment(lien, moment) {
  const m = String(moment || '').match(/(\d+)\s*[:h]\s*(\d{1,2})/); if (!lien || !m) return lien;
  const s = +m[1] * 60 + +m[2];
  if (/youtu\.?be/.test(lien)) return `${lien}${lien.includes('?') ? '&' : '?'}t=${s}`;
  if (/spotify\.com\/track/.test(lien)) return `${lien.split('#')[0]}#${m[1]}:${m[2].padStart(2, '0')}`;
  return lien;
}
export const STYLES = ['Folk', 'Pop', 'Électro', 'Ambient', 'Rock', 'Indie', 'Soul / R&B', 'Jazz', 'Trip-hop', 'Chanson française', 'Trad québécois', 'Hip-hop', 'Musique de film', 'Expérimental'];
export const BESOINS = [
  ['cadre', 'Un cadre clair', 'De la liberté'],
  ['parole', 'On en parle avant', 'On joue, on verra'],
  ['rythme', 'Lentement, en profondeur', 'Vite, plein d’idées'],
  ['seul', 'Préparer seul d’abord', 'Tout créer ensemble'],
  ['retour', 'Des retours doux', 'Des retours directs'],
];
export const MOTS = [
  ['apporte', 'Ce que j’apporte au duo'],
  ['bloque', 'Ce qui me bloque parfois'],
  ['besoin', 'Ce dont j’ai besoin de toi'],
  ['fierte', 'Dans six mois, je serai fier·e si…'],
];

// Autoévaluation : curseurs de 1 à 10 avec une étiquette qui vit.
export const EVAL = [
  { id: 'voix', label: 'Ma voix ou mon jeu', aide: 'Justesse, contrôle, son' },
  { id: 'ensemble', label: 'Être ensemble', aide: 'Synchro, entrées, écoute' },
  { id: 'invention', label: 'Oser inventer', aide: 'Idées, risques, surprises' },
  { id: 'son', label: 'Notre son', aide: 'Timbres, mix, effets, couleur' },
  { id: 'texte', label: 'Les mots', aide: 'Paroles, images, hooks' },
  { id: 'plaisir', label: 'Le plaisir', aide: 'Est-ce qu’on a eu du fun?' },
];
export const NIVEAUX = ['', 'Pas encore', 'Pas encore', 'Ça germe', 'Ça germe', 'En route', 'En route', 'Solide', 'Solide', 'Wow', 'Feu sacré'];

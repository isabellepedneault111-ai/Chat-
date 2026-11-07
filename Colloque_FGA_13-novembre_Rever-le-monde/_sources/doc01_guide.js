const L = require('./lib');
const { d, C, EMBED, P, label, H1, H2, H3, B, N, BR, SP, note, quote, tbl, img, caption, styles, numbering, footer, cover, save, page } = L;
const OUT = process.argv[2];
const I = __dirname + '/img/';

const kids = [
  ...cover({
    kicker: 'Journée régionale FGA · 13 novembre 2026 · CFGA De Jonquière',
    title: 'RÊVER LE MONDE DE DEMAIN',
    sub: 'De l’idéation à l’action. Engagement citoyen et autodétermination en FGA. Guide d’animation pour la coanimation (90 minutes).',
    image: { path: I + 'nb_mur.jpg', w: 640, h: 360, cap: 'Du « ça me dérange » au « on l’a fait ! »' },
    meta: ['**Isabelle Pedneault**, conseillère pédagogique, CFGA De Jonquière (CSSDLJ)', '**Francis Laroche**, éducateur en citoyenneté mondiale, Centre de solidarité internationale du Saguenay–Lac-Saint-Jean (CSI)', 'Présentation interactive : presentation/index.html (aussi utilisable hors ligne)']
  }),
  L.logos([[I + 'logo_cfga.png', 62, 61], [I + 'logo_csi.png', 230, 50]]),
  BR(),

  label('En un coup d’œil'),
  P('**Le fil rouge.** Des élèves passent de « ça me dérange » à « on l’a fait ! ». Les participants vivent la démarche en accéléré, comme leurs élèves.'),
  P('**L’idée qui surprend.** Le ==résultat== est un **nom** (« la réduction des déchets »), l’==action== est un **verbe** (« installer trois bacs vendredi »). La grammaire devient un outil d’engagement citoyen.'),
  P('**Le conflit cognitif vécu.** Chacun croit écrire une action… et découvre qu’il a écrit un résultat. On ne parle pas de la posture inductive : on la fait vivre.'),
  P('**Ce que chacun emporte.** Le cahier du participant (avec des espaces pour noter), l’aide-mémoire Copilot, les annexes (objectivation, J’ai mon plan, l’engagement, l’autoévaluation des interventions universelles) et la fiche « Mon premier pas » remplie.'),

  H1('01', 'Intentions et objectifs'),
  ...note('Intention générale', ['Faire découvrir comment une démarche d’engagement citoyen (la démarche « de l’idée à l’action ») donne du sens aux apprentissages et soutient l’autodétermination des adultes en formation, puis outiller les participants pour en transposer une partie dans leur contexte, en groupe comme en enseignement individualisé.']),
  tbl(['', 'À la fin, les participants pourront…', 'Ce qu’on observera'], [
    ['1', '**décrire** les étapes de la démarche « de l’idée à l’action », de l’enjeu qui touche les élèves jusqu’au projet réalisé ;', 'Ils replacent les 5 marches dans l’ordre (diapo 10).'],
    ['2', '**reconnaître** les composantes de l’autodétermination mobilisées (choisir, se fixer un but, décider, résoudre, s’autoévaluer) ;', 'Ils relient de vrais mots d’élèves aux 4 besoins (diapo 19).'],
    ['3', '**analyser** les conditions qui facilitent ou freinent le transfert selon leur contexte ;', 'Discussion en îlots regroupés par profil (diapos 11 et 13).'],
    ['4', '**esquisser** un premier pas réaliste à mettre à l’essai avec leurs élèves.', 'Chacun remplit sa fiche « Mon premier pas » : une action, une date, un allié.']
  ], [500, 5500, 4080], { firstAccent: true }),
  P('Les verbes suivent une progression : décrire, reconnaître, analyser, esquisser. On passe de comprendre la démarche à se l’approprier.', { before: 100, run: { italics: true, color: C.grey } }),

  H1('02', 'Qui sera dans la salle'),
  P('D’après le portrait des inscriptions du 4 novembre (146 personnes à la journée, quatre CSS). Les noms restent dans le document interne du comité ; ici, seulement ce qui change notre animation.', { run: { size: 19, color: C.grey } }),
  tbl(['', 'Ce qu’on sait', 'Ce que ça change'], [
    ['**Combien**', '34 personnes ont mis l’atelier en 1er ou 2e choix (19 et 15). 22 autres l’ont en réserve.', 'Prévoir 40 cahiers et 6 ou 7 îlots de 5 ou 6 personnes. Tout le matériel est compté pour 40.'],
    ['**D’où**', 'Les quatre CSS : Rives-du-Saguenay 12, Lac-Saint-Jean 10, De La Jonquière 6, Pays-des-Bleuets 6.', 'Mélanger les centres dans chaque îlot : l’appartenance se construit aussi entre collègues de la région.'],
    ['**Qui**', 'IS et ISP : 11. Mathématiques et sciences : 8. PPS et DHS : 6. Français, orthopédagogie, orientation et CP, direction : 2 chacun. Anglais : 1.', 'La moitié enseigne en PPS, DHS, IS ou ISP : on nomme IS et ISP partout avec PPS et DHS. L’autre moitié compte aussi : un exemple en mathématiques, une porte « Anglais », une porte « Direction · services », et des rôles Copilot pour chacun.']
  ], [1500, 4300, 4280], { firstAccent: true }),
  H3('Ce qu’elles et ils souhaitent aborder, et où on y répond'),
  tbl(['Souhait exprimé à l’inscription', 'Où on y répond'], [
    ['L’autodétermination à travers le programme de participation sociale', 'Les 5 marches et leurs composantes (diapo 10), J’ai mon plan (annexe 07)'],
    ['Des exemples concrets de projets de participation sociale', 'Les projets du CFGA et la vidéo (diapos 10 à 12), la porte IS · ISP (diapo 11)'],
    ['Les partenariats avec la communauté : le rôle de l’enseignant, l’horaire, le terrain', 'Francis et le CSI, la triade (diapo 6), scénario B avec un partenaire (diapo 11)'],
    ['La cohérence du projet PPS avec les cours matières, sans alourdir la tâche', 'Le scénario C, le projet-pont (diapo 11) : les élèves en individualisé contribuent comme « experts »'],
    ['Le DHS, la déficience intellectuelle, le TSA ; des outils pour le DHS', 'Les portes PPS et DHS, la fiche élève en 5 marches (annexe 08), les 4 étapes en îlot'],
    ['Le développement de l’autonomie chez les jeunes de 16 ans', 'Les 4 besoins et les 9 gestes (diapo 7, annexe 09)'],
    ['Le plan d’intervention multidisciplinaire', 'L’annexe 10 : les interventions universelles avant le plan d’intervention'],
    ['L’IA', 'Copilot en îlot (diapo 14) et l’aide-mémoire Copilot (annexe 03)']
  ], [5000, 5080], { firstAccent: true }),
  H3('Une place pour chaque profil'),
  tbl(['Profil', 'Son angle dans l’atelier'], [
    ['**IS, ISP, PPS, DHS**', 'Vivre la démarche avec leur groupe, du début à la fin : c’est leur terrain.'],
    ['**Mathématiques et sciences**', 'Le scénario A : un sondage, une mesure, un budget. Le scénario C : l’« expert » du projet-pont.'],
    ['**Français et anglais**', 'Le résultat (un nom) et l’action (un verbe) : un pont direct avec la grammaire. Une lettre, une affiche bilingue, une capsule.'],
    ['**Orthopédagogie**', 'L’enjeu choisi par l’élève comme texte d’entraînement ; l’annexe 10 sur les interventions universelles.'],
    ['**Orientation et CP**', 'Relier l’enjeu au projet de vie et à J’ai mon plan ; accompagner une équipe qui fait un premier essai.'],
    ['**Directions**', 'Les conditions qui rendent la démarche possible : du **temps protégé** à l’horaire (le cadre d’innovation du CFGA), l’horaire d’un projet-pont, les partenariats avec la communauté.']
  ], [2800, 7280], { firstAccent: true }),
  ...note('Composer les îlots', ['En entrant, chacun prend un post-it de la couleur de son profil : IS, ISP, PPS et DHS ; mathématiques et sciences ; français et anglais ; directions et services (orthopédagogie, orientation, CP). On forme des îlots qui mêlent les CSS et les profils. Les directions et les professionnels se répartissent dans les îlots : leur regard sur les conditions (horaire, partenariats) enrichit chaque projet.'], { before: 160 }),

  H1('03', 'Déroulé minuté'),
  P('Quatre phases : 30, 30, 20 et 10 minutes. Le numéro de diapo renvoie à la présentation (la touche N affiche les notes et le nom de la personne qui anime).'),
  tbl(['Temps', 'Phase', 'Ce que vivent les participants', 'Qui', 'Diapo'], [
    ['0–5', '**Phase 1 · Diagnostic** : accueil et mur d’enjeux', 'En entrant : « Qu’est-ce qui vous dérange dans le monde, ici ou ailleurs ? » Un post-it par personne.', 'Francis', '1–3'],
    ['5–15', '**Phase 1 · Diagnostic** : présentations et intentions', 'Les fiches de présentation d’Isabelle et de Francis, puis les intentions de l’atelier.', 'Isabelle et Francis', '2 et 4'],
    ['15–30', '**Phase 1 · Diagnostic** : monde idéal, triade, engagement et 4 sphères', 'Monde idéal (3 min seul, 5 min en îlot). Triade école-communauté-environnement. L’engagement : vrai ou faux, les 4 besoins, les gestes. Les 4 sphères.', 'Francis, puis Isabelle', '5–8'],
    ['30–45', '**Phase 2 · Pivot stratégique** : résultat ou action', 'Le conflit cognitif : « une action pour mon enjeu ». Résultat ou action : le nom contre le verbe.', 'Isabelle', '9'],
    ['45–60', '**Phase 2 · Pivot stratégique** : la démarche en vrai', 'Les 5 marches, les trois portes d’entrée (PPS et DHS d’abord), la voix des élèves (vidéo).', 'Francis, puis Isabelle', '10–12'],
    ['60–75', '**Phase 3 · Idéation en îlot**', 'Les 4 étapes obligatoires, en équipe : choisir un enjeu du mur, vivre la démarche, l’adapter à ses groupes, s’aider de Copilot.', 'Duo', '13–14'],
    ['75–80', '**Phase 3 · Galerie et vote par jetons**', 'Une personne par îlot reste pour présenter ; les autres circulent et déposent leurs 3 jetons.', 'Duo', '15'],
    ['80–90', '**Phase 4 · Bilan** : mon premier pas et retour sur l’atelier', 'Fiche « Mon premier pas » (3 min) et retour express (2 min). La pyramide : où se situait l’atelier ? (1 min). Objectivation 3-2-1 (3 min). Ce qui reste et merci (1 min).', 'Duo', '16–20']
  ], [800, 2100, 4580, 1500, 1100], { firstAccent: true }),

  H2('Rôles et passages de relais'),
  tbl(['', 'Isabelle', 'Francis'], [
    ['**Porte surtout**', 'L’ancrage pédagogique : autodétermination, 4 sphères, conflit cognitif, individualisé, Copilot, objectivation.', 'Le terrain : la démarche « de l’idée à l’action », les projets vécus au CFGA, les ODD, la parole des élèves.'],
    ['**Pendant que l’autre anime**', 'Circule dans les îlots, photographie le mur d’enjeux, note les citations fortes.', 'Tient le minuteur et prépare le matériel de la phase suivante.'],
    ['**Signal discret**', 'Carton vert : on continue. Jaune : 5 minutes. Rouge : on conclut en une phrase.', 'Même code. Le minuteur reste visible (touche T dans la présentation).']
  ], [2000, 4040, 4040]),

  H2('Plan B chrono · 10 minutes de retard'),
  B('**Couper d’abord** la triade école-communauté-environnement (diapo 6) : 30 secondes, et on renvoie au cahier.'),
  B('**Raccourcir ensuite** la démonstration Copilot : elle devient « à essayer chez vous » avec l’aide-mémoire.'),
  B('**Ne jamais couper** la fiche « Mon premier pas » et l’objectivation. Sans eux, l’atelier reste une belle présentation au lieu d’un engagement.'),
  H2('Plan B technique'),
  B('La présentation est un seul fichier HTML qui fonctionne sans Internet. En copier deux exemplaires sur deux clés USB.'),
  B('La vidéo des élèves doit être enregistrée localement. On la glisse dans la diapo 12 avec le bouton « Choisir une vidéo ».'),
  B('Prévoir des adaptateurs HDMI, USB-C et VGA, et une rallonge.'),
  B('**Aller où on veut :** le bouton « Plan » (touche M) affiche toutes les diapos ; on touche celle qu’on veut, selon les questions de la salle.'),

  H1('04', 'Le script, phase par phase'),
  H2('Phase 1 · Diagnostic et monde idéal (0–30 min)'),
  H3('Accueil et mur d’enjeux · Francis'),
  P('À l’entrée, une grande affiche : « Qu’est-ce qui vous dérange dans le monde, ici ou ailleurs ? » Chaque personne colle un post-it avant de s’asseoir. Dans la présentation, on tape les enjeux en direct : ils viennent s’accrocher à un globe 3D qui tourne.'),
  tbl(['Le mur d’enjeux', 'En bref'], [
    ['**C’est quoi ?**', 'Une grande affiche à l’entrée du local : « Qu’est-ce qui vous dérange dans le monde, ici ou ailleurs ? » Les participants y collent des post-it.'],
    ['**Quand ?**', 'En entrant, avant de s’asseoir (minutes 0 à 5). Une table près de la porte avec les post-it et les marqueurs.'],
    ['**Comment ?**', 'Un enjeu par post-it, en quelques mots. La couleur du post-it indique le profil (voir « Composer les îlots »).'],
    ['**Et ensuite ?**', 'Diapo 3 : Francis tape 4 ou 5 post-it, qui s’accrochent au globe 3D. Phase 3 : chaque îlot vient choisir son enjeu sur le mur. Après : on photographie le mur pour la carte régionale.']
  ], [2200, 7880], { firstAccent: true }),
  SP(100),
  ...note('Phrase d’ouverture', ['« Ce que vous venez de faire en entrant, c’est la première marche de la démarche « de l’idée à l’action ». Nos élèves commencent exactement comme ça : par ce qui les dérange. »']),
  H3('Ce qui reste (à la fin, avant le merci) · Isabelle'),
  P('Isabelle présente de vrais mots reçus d’élèves et de parents. Les noms ont été retirés. On pose la question de vive voix, sans cartes : selon la théorie de l’autodétermination (Deci et Ryan), ce mot nourrit-il l’==autonomie==, la ==compétence== ou l’==appartenance== ? Il n’y a pas de mauvaise réponse. On ne montre pas des compliments : on fait repérer les mots qui parlent de projets, de confiance, de forces et d’appartenance.'),
  tbl(['Parole reçue', 'Lecture possible'], [
    ['« […] redonné envie d’aller à l’école. »', 'Appartenance et compétence. C’est ce qu’on cherche en FGA : le raccrochage.'],
    ['« Il n’y a pas un matin qu’il n’a hâte de se rendre dans sa classe. Il se sent écouté, compris et surtout, accepté. »', 'Appartenance (sphère affective).'],
    ['« […] valoriser leurs forces et améliorer les aspects plus difficiles pour eux, et ça sans jugement. »', 'Compétence (sentiment d’efficacité).'],
    ['« […] multiplier les espaces d’accomplissement, donner envie de faire des projets ! »', 'Autonomie et sphère citoyenne.'],
    ['« Merci de leur permettre de construire leur confiance jour après jour. »', 'Compétence, construite dans la durée.'],
    ['« De la confiance en eux et une meilleure connaissance d’eux-mêmes et de leurs forces. »', 'Autonomie : se connaître pour choisir.']
  ], [6000, 4080]),
  ...note('Question de relance', ['« Ces mots parlent de jeunes élèves. Lequel pourrait avoir été écrit par un adulte de 17 ans au CFGA ? » Réponse attendue : tous. C’est le pont vers le reste de l’atelier.'], { before: 200 }),
  H3('Monde idéal, triade et 4 sphères'),
  B('**Monde idéal (8 min).** 3 minutes seul, puis 5 minutes en îlot : « Nous sommes en 2036. Votre centre est devenu exactement ce que vous souhaitiez. Qu’est-ce qu’on y voit, qu’est-ce qu’on y entend ? »'),
  B('**Triade (3 min).** Chaque îlot place un élément de son monde idéal dans la zone école, communauté ou environnement, ou à une intersection.'),
  B('**L’engagement, un écosystème vivant (5 min).** D’après l’affiche d’Isabelle. Vrai ou faux : « La motivation et l’engagement, c’est la même chose. » Faux : la motivation est la force qui pousse à l’action ; l’engagement est la décision de prendre part activement. Puis les 4 besoins (compétence, autonomie, sens, appartenance) et les 9 gestes qui les nourrissent (questionner, écouter, faire réfléchir, rétroagir, coopérer, donner un défi, raconter, différencier, laisser choisir). Francis ajoute l’engagement citoyen : un acte conscient, délibéré, de bravoure et de courage, pour avancer ensemble.'),
  B('**Les 4 sphères (4 min).** Affective, cognitive, comportementale et citoyenne. Dans la présentation, on clique sur chaque planète 3D pour afficher sa définition et un indice observable.'),
  img(I + 'il_spheres.png', 400, 336, { before: 100 }),

  H2('Phase 2 · Le pivot (30–60 min)'),
  H3('Le conflit cognitif : « mais c’est une action, ça ! »'),
  P('Avant l’enseignement explicite, chaque personne écrit sur un post-it « une action pour mon enjeu ». Isabelle en lit trois à voix haute. La plupart sont en fait des résultats (« plus de respect », « moins de gaspillage »). La déstabilisation est bienveillante, et elle prépare la suite.'),
  H3('Résultat ou action : le nom contre le verbe'),
  P('Enseignement explicite : on modélise, on pratique ensemble, puis chacun essaie seul.'),
  tbl(['Résultat · un nom', 'Action · un verbe'], [
    ['la réduction des déchets à la cafétéria', '==installer== trois bacs de compost vendredi avec le concierge'],
    ['un trajet plus sécuritaire jusqu’au parc', '==cartographier== les trois traverses dangereuses et ==écrire== à la Ville'],
    ['la sécurité alimentaire des élèves', '==sonder== 40 élèves sur leurs déjeuners d’ici le 1er décembre'],
    ['un sentiment d’appartenance au centre', '==organiser== un dîner « recette de chez nous » le 12 décembre'],
    ['une meilleure compréhension du budget familial (mathématiques)', '==comparer== le prix de 10 produits dans deux épiceries et ==calculer== l’écart d’ici vendredi']
  ], [4600, 5480]),
  img(I + 'il_gngv.png', 560, 243, { before: 200 }),
  P('**Le lien avec le français.** Le résultat se dit avec un groupe du nom (noyau et expansions). L’action demande un groupe du verbe conjugué, avec un sujet qui agit. Transformer un GN en GV, c’est passer du rêve à l’action.'),
  H3('La démarche en vrai et l’individualisé'),
  img(I + 'nb_compost.jpg', 560, 315),
  L.caption('De l’idée à l’action : un projet de compostage'),
  img(I + 'il_escalier.png', 480, 248),
  P('Francis présente les 5 marches et les projets en cours au CFGA. Isabelle enchaîne sur les trois portes d’entrée, en commençant par la PPS et le DHS, puis l’IS et l’ISP (le tiers de la salle), puis la question des enseignants matières : « Et moi, en individualisé, avec 20 adultes dans 8 sigles ? » Exemples en PPS : Z107 Alimentation saine (le gaspillage comme contexte), Z128 Consommation (enquêter sur une pub et écrire à l’annonceur). Les trois scénarios sont détaillés dans le cahier du participant : A, l’enjeu comme contexte de tâche ; B, le micro-projet ; C, le projet-pont.'),

  H2('Phase 3 · Idéation en îlot et vote par jetons (60–80 min)'),
  P('**En équipe, c’est plus riche.** Le plan de match parle de co-construction en sous-groupes : on travaille en îlot de 4 à 6 personnes. Les 4 étapes sont **obligatoires** et se font dans l’ordre, avec le minuteur de la diapo 13. Chaque îlot note tout dans son cahier, section « Notre projet d’îlot ».'),
  tbl(['Étape', 'Ce qu’on fait', 'Temps'], [
    ['**1 · Choisir un enjeu du mur**', 'Le mur, c’est l’**affiche physique à l’entrée** où chacun a collé son post-it en arrivant (les mêmes enjeux sont aussi sur le globe 3D, diapo 3). Un membre va la consulter et choisit avec son îlot.', '2 min'],
    ['**2 · Vivre la démarche**', 'Un résultat (un nom), puis 2 ou 3 actions (un verbe, qui, quand).', '5 min'],
    ['**3 · L’adapter à vos groupes**', 'PPS, DHS ou vos sigles : le scénario A, B ou C, en groupe ou en individualisé.', '4 min'],
    ['**4 · S’aider de Copilot**', 'Une invite bâtie par l’îlot (rôle, contexte, tâche, contraintes) pour enrichir une action ou créer une grille.', '4 min']
  ], [2900, 6180, 1000], { firstAccent: true }),
  H3('La modélisation Copilot · Isabelle (diapo 14)'),
  P('Isabelle prend un îlot comme exemple. Dans la diapo, elle choisit le rôle (enseignant·e en PPS ou en DHS, intervenant·e scolaire, enseignant·e en adaptation scolaire), écrit leur groupe et leur enjeu, puis les contraintes que l’îlot dicte. Le bouton « Copier » met l’invite dans le presse-papier : on la colle dans Copilot sur l’ordinateur du TNI et la salle voit la réponse.'),
  P('**Comment les participants y accèdent.** Chacun écrit l’invite de son îlot dans son cahier (section « Notre invite Copilot »), puis la tape dans Copilot sur son appareil, avec son compte du centre de services. Les 5 invites de l’aide-mémoire Copilot sont aussi dans le dossier partagé (code QR) : on les copie-colle et on remplace les crochets.'),
  H3('La galerie et le vote · Duo (diapo 15)'),
  N('Une personne par îlot reste à sa table pour présenter le projet en 30 secondes. Les autres circulent.', 3),
  N('À mi-temps, on change de présentateur pour que celui-ci aille voter à son tour.', 3),
  N('Chaque personne dépose ses 3 jetons sur les projets des autres îlots (pas le sien).', 3),
  N('On saisit les totaux dans la présentation, sous le nom de l’enjeu de chaque îlot : les piles de jetons 3D montent en direct.', 3),
  img(I + 'il_jetons.png', 380, 127, { before: 100 }),
  tbl(['Jeton', 'Question à se poser'], [
    ['**Impact** (jaune)', 'Est-ce que ça changerait vraiment quelque chose pour quelqu’un ?'],
    ['**Faisabilité** (orange)', 'Des adultes en formation pourraient-ils le réaliser en quelques semaines ?'],
    ['**Originalité** (mauve)', 'Est-ce que ça m’a surpris ?']
  ], [2600, 7480]),

  H2('Phase 4 · Bilan (80–90 min)'),
  P('Le plan de match : engagement individuel, retour express en grand groupe, puis l’objectivation. Chaque étape a son moment de réflexion dans le cahier **avant** la diapo suivante.'),
  img(I + 'il_billet.png', 520, 199),
  N('**Mon premier pas, de retour dans mon milieu (3 min, diapo 16).** Chacun remplit sa fiche dans le cahier : une action (un verbe !), une date, un allié. C’est le premier pas du participant. Exemples à l’écran : demander lundi à mon groupe « Qu’est-ce qui vous dérange ? » ; transformer une tâche de mon sigle à partir d’un enjeu choisi par l’élève ; terminer une période par un 3-2-1 ; proposer un projet-pont à une ou un collègue de PPS ou de DHS ; tester une invite Copilot pour bâtir une grille.', 4),
  N('**Retour express (2 min).** Chaque îlot nomme à voix haute un premier pas. On photographie sa fiche avec son téléphone.', 4),
  N('**La pyramide de rétention (1 min, diapo 17).** On touche l’étage : « Où se situait votre dernière formation ? » Puis : « Et l’atelier d’aujourd’hui ? » Il devrait se situer dans le bas : discuter, faire, enseigner aux autres.', 4),
  N('**Objectivation 3-2-1 (3 min, diapo 18).** 3 idées que je retiens, 2 choses que j’essaie, 1 question qui me reste. On modélise ce qu’on propose : voir l’annexe sur l’objectivation.', 4),
  N('**Ce qui reste et merci (1 min, diapos 19 et 20).** Un ou deux vrais mots d’élèves, le besoin qu’ils nourrissent. Le code QR mène au dossier partagé. Annonce de la relance à six semaines : « Avez-vous fait votre premier pas ? »', 4),
  ...note('Le pont avec le cadre d’innovation du CFGA', ['Un premier pas, c’est une petite innovation. Le cadre adapté des COP IA (Giroux, Munger et Pedneault, 2026) repose sur quatre fondations, dont **le droit d’essayer** et **du temps protégé**. Dans la fiche : la date devient du temps protégé, réservé à l’horaire et tenu ; l’allié, c’est la validation par les pairs. Les 6 questions du cadre sont dans le cahier, juste sous la fiche. Aux directions présentes : leur premier pas peut être de protéger ce temps pour une équipe.'], { before: 160 }),
  ...note('La pyramide, sans chiffres', ['Les pourcentages qui circulent avec cette pyramide (10 %, 20 %… 90 %) ne proviennent d’aucune étude solide. On la présente comme un **repère du passif à l’actif**. Le message, lui, est bien appuyé par la recherche : générer, s’expliquer, se rappeler activement et enseigner à un autre aident à apprendre.'], { before: 160 }),
  ...note('Pour aller plus loin', ['L’annexe 10 propose une autoévaluation des interventions universelles, d’après la grille réflexive EN.1.1 de « J’ai MON plan! ». Avant de cibler un élève, on regarde ce qu’on offre à tout le groupe.'], { before: 160 }),

  BR(),
  H1('05', 'Matériel et logistique'),
  tbl(['Quoi', 'Quantité', ''], [
    ['Cahier du participant imprimé (34 inscrits, plus une marge)', '40', '☐'],
    ['Fiches « Mon premier pas » (aussi dans le cahier)', '40', '☐'],
    ['Annexes imprimées (03, 04, 07, 09, 10) ou code QR seulement : à décider', '40', '☐'],
    ['Jetons de vote en 3 couleurs, en sachets par îlot', '3 par personne', '☐'],
    ['Post-it de 4 couleurs (une couleur par profil) et marqueurs noirs', '1 paquet par îlot', '☐'],
    ['Affiche du mur d’enjeux à l’entrée (le « mur » de la phase 3) et grand code QR', '1 de chaque', '☐'],
    ['Cartons de signaux vert, jaune et rouge', '2 jeux', '☐'],
    ['Présentation sur 2 clés USB et vidéo enregistrée localement', '2', '☐'],
    ['Adaptateurs HDMI, USB-C et VGA, rallonge', '1 de chaque', '☐'],
    ['Invites Copilot testées, réponses sauvegardées dans le dossier partagé', '3', '☐']
  ], [7280, 2200, 600]),
  H2('Aménagement'),
  B('Des îlots de 4 à 6 personnes. À chaque place : le cahier du participant et le sachet de jetons.'),
  B('Le mur d’enjeux et le grand code QR à l’entrée.'),
  B('Des îlots qui mêlent les quatre CSS et les profils, avec une direction ou une personne des services dans le plus d’îlots possible.'),

  H1('06', 'Après le colloque'),
  B('**Le mur d’enjeux régional.** Les post-it des quatre CSS deviennent une « carte des préoccupations » du Saguenay–Lac-Saint-Jean, rapportée en classe comme banque d’enjeux.'),
  B('**La relance à six semaines.** Un courriel aux participants (« Avez-vous fait votre premier pas ? ») transforme l’atelier en petite communauté de pratique. On y joint la question 6 du cadre d’innovation : « Qui l’a vue assez de fois pour la refaire sans moi ? »'),
  B('**Le jumelage interprogrammes.** Un groupe PPS ou DHS avec une enseignante matières (scénario C), prêt à démarrer en janvier.'),
  B('**L’accompagnement du CSI.** Un ou deux enseignants qui démarrent une démarche semblable, y compris dans les autres CSS.'),

  H1('07', 'À valider entre nous'),
  B('Des élèves de PPS peuvent-ils témoigner en personne ou en vidéo ? Les autorisations de diffusion sont-elles signées ?'),
  B('Quels outils de la démarche remettons-nous (gabarits, fiches, liens) ? Les déposons-nous dans l’équipe Teams du colloque ?'),
  B('Les deux séances ont-elles lieu le matin et l’après-midi ? Le minutage est-il le même ?'),
  B('Qui fait la relance à six semaines, et à partir de quelle liste ?'),

  H1('08', 'Éthique des exemples concrets'),
  P('Les mots d’élèves et de parents de l’accroche proviennent de la classe d’Isabelle, du temps où elle enseignait. Ils ont été **recadrés et anonymisés** : aucun prénom, aucun nom, aucune signature. On précise à la salle qu’il s’agit de mots reçus, pas de témoignages sollicités.'),
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Guide d’animation · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 1080, bottom: 1080, left: 1260, right: 1080 } } },
    footers: footer('Rêver le monde de demain · guide d’animation'), children: kids }]
});
save(doc, OUT);

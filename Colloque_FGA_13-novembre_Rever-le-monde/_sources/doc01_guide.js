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
  img(I + 'logo_csi.png', 230, 50, { align: L.AlignmentType.LEFT, before: 120 }),
  BR(),

  label('En un coup d’œil'),
  P('**Le fil rouge.** Des élèves passent de « ça me dérange » à « on l’a fait ! ». Les participants vivent la démarche en accéléré, comme leurs élèves.'),
  P('**L’idée qui surprend.** Le ==résultat== est un **nom** (« la réduction des déchets »), l’==action== est un **verbe** (« installer trois bacs vendredi »). La grammaire devient un outil d’engagement citoyen.'),
  P('**Le conflit cognitif vécu.** Chacun croit écrire une action… et découvre qu’il a écrit un résultat. On ne parle pas de la posture inductive : on la fait vivre.'),
  P('**Ce que chacun emporte.** Le cahier du participant (avec des espaces pour noter), l’aide-mémoire Copilot, l’annexe sur l’objectivation et la fiche « Mon premier pas » remplie.'),

  H1('01', 'Intentions et objectifs'),
  ...note('Intention générale', ['Faire découvrir comment une démarche d’engagement citoyen (la démarche « de l’idée à l’action ») donne du sens aux apprentissages et soutient l’autodétermination des adultes en formation, puis outiller les participants pour en transposer une partie dans leur contexte, en groupe comme en enseignement individualisé.']),
  tbl(['', 'À la fin, les participants pourront…', 'Ce qu’on observera'], [
    ['1', '**décrire** les étapes de la démarche « de l’idée à l’action », de l’enjeu qui touche les élèves jusqu’au projet réalisé ;', 'Ils replacent les 5 marches dans l’ordre (diapo 12).'],
    ['2', '**reconnaître** les composantes de l’autodétermination mobilisées (choisir, se fixer un but, décider, résoudre, s’autoévaluer) ;', 'Ils trient de vrais mots d’élèves et de parents (diapo 5).'],
    ['3', '**analyser** les conditions qui facilitent ou freinent le transfert selon leur contexte ;', 'Discussion en îlots regroupés par profil (diapo 13).'],
    ['4', '**esquisser** un premier pas réaliste à mettre à l’essai avec leurs élèves.', 'Chacun remplit sa fiche « Mon premier pas » : une action, une date, un allié.']
  ], [500, 5500, 4080], { firstAccent: true }),
  P('Les verbes suivent une progression : décrire, reconnaître, analyser, esquisser. On passe de comprendre la démarche à se l’approprier.', { before: 100, run: { italics: true, color: C.grey } }),

  H1('02', 'Déroulé minuté'),
  P('Quatre phases : 30, 30, 20 et 10 minutes. Le numéro de diapo renvoie à la présentation (la touche N affiche les notes et le nom de la personne qui anime).'),
  tbl(['Temps', 'Phase', 'Ce que vivent les participants', 'Qui', 'Diapo'], [
    ['0–5', '**Phase 1 · Diagnostic** : accueil et mur d’enjeux', 'En entrant : « Qu’est-ce qui vous dérange dans le monde, ici ou ailleurs ? » Un papillon adhésif par personne.', 'Francis', '1–3'],
    ['5–15', '**Phase 1 · Diagnostic** : ce qui allume un élève', 'De vrais mots d’élèves et de parents (anonymisés), une citation à la fois. De vive voix : autonomie, compétence ou appartenance ?', 'Isabelle', '4'],
    ['15–30', '**Phase 1 · Diagnostic** : monde idéal, triade, engagement et 4 sphères', 'Monde idéal (3 min seul, 5 min en îlot). Triade école-communauté-environnement. L’engagement : vrai ou faux, les 4 besoins, les gestes. Les 4 sphères.', 'Francis, puis Isabelle', '5–9'],
    ['30–45', '**Phase 2 · Pivot stratégique** : pyramide, résultat ou action', 'La pyramide de rétention : où se situait votre dernière formation ? Résultat ou action : le nom contre le verbe.', 'Isabelle', '10–11'],
    ['45–60', '**Phase 2 · Pivot stratégique** : la démarche en vrai', 'Les 5 marches, les projets du CFGA, la voix des élèves (vidéo). Les scénarios A, B et C pour l’individualisé.', 'Francis, puis Isabelle', '12–14'],
    ['60–80', '**Phase 3 · Idéation et vote créatif par jetons**', 'Un enjeu du mur, transformé en actions, enrichi avec Copilot, puis le vote avec 3 jetons.', 'Duo', '15–17'],
    ['80–90', '**Phase 4 · Bilan et dépliant** : mon premier pas', 'Fiche « Mon premier pas ». Objectivation 3-2-1. Cahier et code QR.', 'Duo', '18–20']
  ], [800, 2100, 4580, 1500, 1100], { firstAccent: true }),

  H2('Rôles et passages de relais'),
  tbl(['', 'Isabelle', 'Francis'], [
    ['**Porte surtout**', 'L’ancrage pédagogique : autodétermination, 4 sphères, conflit cognitif, individualisé, Copilot, objectivation.', 'Le terrain : la démarche « de l’idée à l’action », les projets vécus au CFGA, les ODD, la parole des élèves.'],
    ['**Pendant que l’autre anime**', 'Circule dans les îlots, photographie le mur d’enjeux, note les citations fortes.', 'Tient le minuteur et prépare le matériel de la phase suivante.'],
    ['**Signal discret**', 'Carton vert : on continue. Jaune : 5 minutes. Rouge : on conclut en une phrase.', 'Même code. Le minuteur reste visible (touche T dans la présentation).']
  ], [2000, 4040, 4040]),

  H2('Plan B chrono · 10 minutes de retard'),
  B('**Couper d’abord** la triade école-communauté-environnement (diapo 7) : 30 secondes, et on renvoie au cahier.'),
  B('**Raccourcir ensuite** la démonstration Copilot : elle devient « à essayer chez vous » avec l’aide-mémoire.'),
  B('**Ne jamais couper** la fiche « Mon premier pas » et l’objectivation. Sans eux, l’atelier reste une belle présentation au lieu d’un engagement.'),
  H2('Plan B technique'),
  B('La présentation est un seul fichier HTML qui fonctionne sans Internet. En copier deux exemplaires sur deux clés USB.'),
  B('La vidéo des élèves doit être enregistrée localement. On la glisse dans la diapo 14 avec le bouton « Choisir une vidéo ».'),
  B('Prévoir des adaptateurs HDMI, USB-C et VGA, et une rallonge.'),
  B('**Aller où on veut :** le bouton « Plan » (touche M) affiche toutes les diapos ; on touche celle qu’on veut, selon les questions de la salle.'),

  H1('03', 'Le script, phase par phase'),
  H2('Phase 1 · Diagnostic et monde idéal (0–30 min)'),
  H3('Accueil et mur d’enjeux · Francis'),
  P('À l’entrée, une grande affiche : « Qu’est-ce qui vous dérange dans le monde, ici ou ailleurs ? » Chaque personne colle un papillon adhésif avant de s’asseoir. Dans la présentation, on tape les enjeux en direct : ils viennent s’accrocher à un globe 3D qui tourne.'),
  ...note('Phrase d’ouverture', ['« Ce que vous venez de faire en entrant, c’est la première marche de la démarche « de l’idée à l’action ». Nos élèves commencent exactement comme ça : par ce qui les dérange. »']),
  H3('Ce qui allume un élève · Isabelle'),
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
  H3('La pyramide de rétention : du passif à l’actif'),
  img(I + 'il_pyramide.png', 330, 257),
  N('Afficher la pyramide 3D. Elle se construit étage par étage, du passif (écouter) à l’actif (enseigner aux autres).', 2),
  N('Chacun place un jeton virtuel ou un papillon : « Où se situait votre dernière formation ? » Puis : « Où se situe l’atelier d’aujourd’hui ? »', 2),
  N('Relancer : « Et vos élèves, ils passent combien de temps en haut de la pyramide ? » La démarche les fait vivre surtout dans le bas : discuter, faire, enseigner aux autres.', 2),
  ...note('Précision à garder en tête', ['Les pourcentages qui circulent avec cette pyramide (10 %, 20 %… 90 %) ne proviennent d’aucune étude solide. On présente donc la pyramide comme un **repère du passif à l’actif**, sans chiffres. Le message, lui, est bien appuyé par la recherche : générer, s’expliquer, se rappeler activement et enseigner à un autre aident à apprendre.']),
  H3('Le conflit cognitif : « mais c’est une action, ça ! »'),
  P('Avant l’enseignement explicite, chaque personne écrit sur un papillon « une action pour mon enjeu ». Isabelle en lit trois à voix haute. La plupart sont en fait des résultats (« plus de respect », « moins de gaspillage »). La déstabilisation est bienveillante, et elle prépare la suite.'),
  H3('Résultat ou action : le nom contre le verbe'),
  P('Enseignement explicite : on modélise, on pratique ensemble, puis chacun essaie seul.'),
  tbl(['Résultat · un nom', 'Action · un verbe'], [
    ['la réduction des déchets à la cafétéria', '==installer== trois bacs de compost vendredi avec le concierge'],
    ['un trajet plus sécuritaire jusqu’au parc', '==cartographier== les trois traverses dangereuses et ==écrire== à la Ville'],
    ['la sécurité alimentaire des élèves', '==sonder== 40 élèves sur leurs déjeuners d’ici le 1er décembre'],
    ['un sentiment d’appartenance au centre', '==organiser== un dîner « recette de chez nous » le 12 décembre']
  ], [4600, 5480]),
  img(I + 'il_gngv.png', 560, 243, { before: 200 }),
  P('**Le lien avec le français.** Le résultat se dit avec un groupe du nom (noyau et expansions). L’action demande un groupe du verbe conjugué, avec un sujet qui agit. Transformer un GN en GV, c’est passer du rêve à l’action.'),
  H3('La démarche en vrai et l’individualisé'),
  img(I + 'nb_compost.jpg', 560, 315),
  L.caption('De l’idée à l’action : un projet de compostage'),
  img(I + 'il_escalier.png', 480, 248),
  P('Francis présente les 5 marches et les projets en cours au CFGA. Isabelle enchaîne sur la question des enseignants matières : « Et moi, en individualisé, avec 20 adultes dans 8 sigles ? » Exemples en PPS : Z107 Alimentation saine (le gaspillage comme contexte), Z128 Consommation (enquêter sur une pub et écrire à l’annonceur). Les trois scénarios sont détaillés dans le cahier du participant : A, l’enjeu comme contexte de tâche ; B, le micro-projet ; C, le projet-pont.'),

  H2('Phase 3 · Idéation et vote par jetons (60–80 min)'),
  P('**À la carte.** On fait vivre l’autonomie dont on vient de parler : chacun choisit son parcours, seul, en duo ou en îlot (15 min), puis la galerie et les jetons (5 min).'),
  tbl(['Parcours', 'Ce qu’on fait'], [
    ['**1 · Vivre la démarche**', 'Un enjeu du mur, un résultat (un nom), 2 ou 3 actions (un verbe, quand, qui).'],
    ['**2 · L’adapter à mon sigle**', 'Le scénario A, B ou C pour mes élèves, en groupe ou en individualisé.'],
    ['**3 · Préparer avec Copilot**', 'Une invite de l’aide-mémoire pour une tâche, une grille ou des questions d’objectivation.'],
    ['**4 · Mon propre chemin**', 'Une autre idée ? On y va. Seule question en circulant : « Qu’est-ce que tu en retires ? »']
  ], [3000, 7080], { firstAccent: true }),
  P('Le déroulé ci-dessous décrit le parcours 1, le plus guidé.', { before: 100, run: { italics: true, color: C.grey } }),
  N('Chaque îlot choisit un enjeu du mur (2 min).', 3),
  N('Il formule le résultat (GN), puis 2 ou 3 actions (GV, date, responsable) (6 min).', 3),
  N('Il utilise une invite de l’aide-mémoire Copilot pour enrichir ou différencier une action (5 min).', 3),
  N('Galerie : chaque personne dépose ses 3 jetons sur les projets des autres îlots (5 min).', 3),
  N('On saisit les jetons dans la présentation : des piles de jetons 3D montent en direct (2 min).', 3),
  img(I + 'il_jetons.png', 380, 127, { before: 100 }),
  tbl(['Jeton', 'Question à se poser'], [
    ['**Impact** (jaune)', 'Est-ce que ça changerait vraiment quelque chose pour quelqu’un ?'],
    ['**Faisabilité** (orange)', 'Des adultes en formation pourraient-ils le réaliser en quelques semaines ?'],
    ['**Originalité** (mauve)', 'Est-ce que ça m’a surpris ?']
  ], [2600, 7480]),

  H2('Phase 4 · Mon premier pas (80–90 min)'),
  img(I + 'il_billet.png', 520, 199),
  B('**Mon premier pas (4 min).** Une action (un verbe !), une date, un allié. On photographie sa fiche avec son téléphone.'),
  B('**Objectivation 3-2-1 (4 min).** 3 idées que je retiens, 2 choses que j’essaie, 1 question qui me reste. On modélise ce qu’on propose : voir l’annexe sur l’objectivation.'),
  B('**Clôture (2 min).** Cahier, code QR, et l’annonce de la relance à six semaines : « Avez-vous fait votre premier pas ? »'),

  BR(),
  H1('04', 'Matériel et logistique'),
  tbl(['Quoi', 'Quantité', ''], [
    ['Cahier du participant imprimé (prévoir 10 % de plus)', '28', '☐'],
    ['Fiches « Mon premier pas » (aussi dans le cahier)', '28', '☐'],
    ['Jetons de vote en 3 couleurs, en sachets par îlot', '3 par personne', '☐'],
    ['Papillons adhésifs de 4 couleurs et marqueurs noirs à pointe moyenne', '1 paquet par îlot', '☐'],
    ['Affiche du mur d’enjeux et grand code QR à l’entrée', '1 de chaque', '☐'],
    ['Cartons de signaux vert, jaune et rouge', '2 jeux', '☐'],
    ['Présentation sur 2 clés USB et vidéo enregistrée localement', '2', '☐'],
    ['Adaptateurs HDMI, USB-C et VGA, rallonge', '1 de chaque', '☐'],
    ['Invites Copilot testées, réponses sauvegardées dans le dossier partagé', '3', '☐']
  ], [7280, 2200, 600]),
  H2('Aménagement'),
  B('Des îlots de 4 à 6 personnes. À chaque place : le cahier du participant et le sachet de jetons.'),
  B('Le mur d’enjeux et le grand code QR à l’entrée.'),
  B('Pour la phase 2, regrouper les îlots par profil : PPS et DHS, groupes, français et langues, mathématiques et sciences, soutien.'),

  H1('05', 'Après le colloque'),
  B('**Le mur d’enjeux régional.** Les papillons des quatre CSS deviennent une « carte des préoccupations » du Saguenay–Lac-Saint-Jean, rapportée en classe comme banque d’enjeux.'),
  B('**La relance à six semaines.** Un courriel aux participants (« Avez-vous fait votre premier pas ? ») transforme l’atelier en petite communauté de pratique.'),
  B('**Le jumelage interprogrammes.** Un groupe PPS ou DHS avec une enseignante matières (scénario C), prêt à démarrer en janvier.'),
  B('**L’accompagnement du CSI.** Un ou deux enseignants qui démarrent une démarche semblable, y compris dans les autres CSS.'),

  H1('06', 'À valider entre nous'),
  B('Des élèves de PPS peuvent-ils témoigner en personne ou en vidéo ? Les autorisations de diffusion sont-elles signées ?'),
  B('Quels outils de la démarche remettons-nous (gabarits, fiches, liens) ? Les déposons-nous dans l’équipe Teams du colloque ?'),
  B('Les deux séances ont-elles lieu le matin et l’après-midi ? Le minutage est-il le même ?'),
  B('Qui fait la relance à six semaines, et à partir de quelle liste ?'),

  H1('07', 'Éthique des exemples concrets'),
  P('Les mots d’élèves et de parents de l’accroche proviennent de la classe d’Isabelle, du temps où elle enseignait. Ils ont été **recadrés et anonymisés** : aucun prénom, aucun nom, aucune signature. On précise à la salle qu’il s’agit de mots reçus, pas de témoignages sollicités.'),
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Guide d’animation · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 1080, bottom: 1080, left: 1260, right: 1080 } } },
    footers: footer('Rêver le monde de demain · guide d’animation'), children: kids }]
});
save(doc, OUT);

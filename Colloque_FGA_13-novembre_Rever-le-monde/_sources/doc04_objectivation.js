const L = require('./lib');
const { d, C, EMBED, P, label, H1, H2, H3, B, BR, SP, note, quote, tbl, img, caption, styles, numbering, footer, cover, save, page } = L;
const OUT = process.argv[2];
const I = __dirname + '/img/';

const kids = [
  ...cover({
    kicker: 'Annexe · Colloque régional FGA · 13 novembre 2026',
    title: 'L’OBJECTIVATION',
    sub: 'Le temps d’arrêt qui transforme une activité en apprentissage, et un élève en acteur de son parcours.',
    image: { path: I + 'nb_maison.jpg', w: 420, h: 420, cap: 'La maison à trois étages' },
    meta: ['Isabelle Pedneault, conseillère pédagogique, CFGA De Jonquière · d’après sa fiche de classe « L’objectivation »']
  }),
  BR(),

  H1('01', 'C’est quoi ?'),
  P('L’objectivation est un **temps d’arrêt** pris avec les élèves pour porter un regard sur l’activité à venir, celle qu’on est en train de vivre ou celle qu’on vient de terminer. Elle permet d’observer ses processus mentaux, de **faire le ménage dans sa tête** pour classer ce qu’on a appris, de prendre conscience de ses réussites et de ses difficultés. Elle oriente la suite, autant pour l’élève que pour l’enseignant.'),
  ...quote('Le temps consacré à l’objectivation n’est pas perdu : il est gagné.', 'Fiche de classe d’Isabelle', { size: 26 }),
  ...note('Le lien avec l’autodétermination', ['S’autoévaluer est l’une des composantes de l’autodétermination (Wehmeyer). Objectiver, c’est donner à l’adulte les moyens de piloter son propre parcours : savoir où il en est, ce qui l’aide, ce qu’il change. C’est le cœur de « J’ai mon plan » et des rencontres de suivi animées par l’élève.']),

  H1('02', 'Pourquoi objectiver ?'),
  tbl(['Pour…', 'Ce que ça change'], [
    ['**prendre conscience de ses apprentissages**', 'Ce qu’on nomme se mémorise mieux. Les connaissances bien classées se retrouvent quand on en a besoin.'],
    ['**changer un comportement**', 'Demander un changement sans y revenir donne peu. Y revenir chaque jour, en faisant constater les bienfaits, produit des changements rapides.'],
    ['**rassurer l’enseignant**', 'On vérifie la pertinence d’une activité et on repère la notion à revoir.'],
    ['**évaluer certains apprentissages**', 'L’objectivation laisse des traces : billets, carnets, enregistrements.'],
    ['**mesurer l’intérêt**', 'Quand l’intérêt baisse dans un projet, on fait le point avec les élèves et on ajuste avant de repartir.']
  ], [3400, 6640], { firstAccent: true }),

  H1('03', 'Sur quoi objectiver ?'),
  P('Cinq objets d’objectivation, reliés aux quatre sphères de l’engagement vues en atelier.'),
  tbl(['Objet', 'Sphère', 'Une question pour commencer'], [
    ['**Les attitudes**', 'Affective', 'Est-ce que je me crois capable de réaliser la tâche ?'],
    ['**Les apprentissages réalisés**', 'Cognitive', 'Qu’est-ce que je retiens d’aujourd’hui ?'],
    ['**Les comportements**', 'Comportementale', 'Est-ce que j’ai commencé à temps et utilisé tout mon temps ?'],
    ['**Les stratégies**', 'Cognitive', 'Quelle stratégie m’a été utile ? Laquelle je change ?'],
    ['**Les démarches**', 'Citoyenne (en projet)', 'Est-ce que notre action a vraiment changé quelque chose pour quelqu’un ?']
  ], [2800, 2300, 4940], { firstAccent: true }),

  H1('04', 'La maison à trois étages'),
  img(I + 'il_maison.png', 300, 300),
  P('C’est l’image qu’Isabelle utilisait avec ses élèves pour expliquer pourquoi on objective. Le cerveau a trois étages. On ne peut pas atteindre le troisième sans passer par les deux premiers.'),
  B('**Premier étage, les besoins de base.** Si j’ai bien mangé, assez dormi et que je suis en santé, la porte s’ouvre.'),
  B('**Deuxième étage, les émotions.** Si je me sens bien avec les autres, heureux et fier de moi, la porte du troisième s’ouvre.'),
  B('**Troisième étage, les apprentissages.** C’est là que je classe mes connaissances dans des tiroirs, pour les retrouver quand j’en ai besoin.'),
  ...note('En FGA, la maison est plus lourde', ['Un adulte de 17 ou 25 ans arrive parfois avec un emploi de nuit, des enfants, un loyer, un retour aux études après un échec. Le premier étage n’est pas acquis. Objectiver, c’est aussi lui permettre de dire : « Aujourd’hui, je n’ai pas dépassé le premier étage, et voici ce qui m’aiderait. »'], { before: 160 }),

  H1('05', 'Une banque de questions'),
  P('Tirées de la fiche de classe d’Isabelle et reformulées pour des adultes. Choisissez-en deux ou trois, pas plus.'),
  tbl(['Avant', 'Pendant', 'Après'], [[
    ['Est-ce que je comprends l’intention de la tâche ?', 'Qu’est-ce que je sais déjà sur le sujet ?', 'Ai-je tout ce qu’il me faut ?', 'Qu’est-ce qui pourrait m’empêcher de m’y mettre ?', 'Est-ce que je me crois capable ?', 'Est-ce que je pourrais expliquer à quelqu’un ce que je dois faire ?'].map(t => B(t)),
    ['Est-ce que j’ai compris ? Comment je le sais ?', 'Ai-je besoin d’aide ? Qui peut m’aider ?', 'Est-ce que je consulte mes outils de référence ?', 'Ai-je pensé à plusieurs solutions ?', 'Ai-je peur de me tromper ?', 'Est-ce que je m’y prends de la bonne façon ?'].map(t => B(t)),
    ['Qu’est-ce que j’ai appris ? Découvert ?', 'Comment m’y suis-je pris pour réussir ?', 'Si c’était à refaire, qu’est-ce que je ferais autrement ?', 'Quand vais-je me servir de cette notion ?', 'Je félicite… Je remercie… Je suis fier de…', 'Ai-je le goût d’aller plus loin ?'].map(t => B(t))
  ]], [3346, 3347, 3347]),

  H1('06', 'Sept formats à essayer dès lundi'),
  tbl(['Format', 'Comment', 'Durée'], [
    ['**Le 3-2-1**', '3 idées que je retiens, 2 choses que j’essaie, 1 question qui me reste. C’est celui qu’on vit à la fin de l’atelier.', '3 min'],
    ['**La météo intérieure**', 'Soleil, nuages ou orage ? Un mot pour dire pourquoi. Idéal pour le premier étage de la maison.', '1 min'],
    ['**Si c’était à refaire**', 'Une seule question, une seule ligne, après chaque séquence de travail.', '2 min'],
    ['**Le carnet de bord citoyen**', 'Écrit ou audio : l’obstacle franchi, la victoire, la prochaine action. Voir le gabarit plus bas.', '5 min'],
    ['**La ligne d’objectivation**', 'Une ligne vide après chaque bloc de la planification de la semaine, à remplir en fin de journée.', '2 min'],
    ['**Je félicite, je remercie, je suis fier de**', 'Trois débuts de phrase, à l’oral, en cercle. Nourrit l’appartenance.', '5 min'],
    ['**La rencontre de suivi animée par l’élève**', 'L’adulte présente son plan de formation et ses progrès (10 min), dit ce qui l’aide et ce qui bloque (5 min), puis on ajuste le plan ensemble (5 min).', '20 min']
  ], [3000, 5840, 1200], { firstAccent: true }),

  img(I + 'nb_bulletin.jpg', 400, 300, { before: 160 }),
  caption('La rencontre de suivi animée par l’élève'),
  H2('Des exemples vécus'),
  P('**En classe, au primaire (2021).** La planification hebdomadaire des élèves d’Isabelle comportait une ligne « Objectivation » sous chaque matière (mathématiques, écriture, étude), avec une pensée de la semaine : « Un but ne doit pas toujours être atteint, souvent il sert juste à nous donner une direction. »'),
  P('**Entre collègues (août 2025).** Isabelle et Francis ont tenu un tableau de priorités hebdomadaires avec une colonne « Objectivation, à faire après la séquence ». Leur réponse à « Si j’avais à revivre cette activité » : réserver les blocs de travail intensif au travail de profondeur, couper les sonneries, mettre le minuteur sur un autre appareil, faire des blocs plus courts. **On objective aussi entre adultes.**'),

  H1('07', 'Objectiver chaque marche de l’Incubateur'),
  tbl(['Marche', 'Question d’objectivation'], [
    ['1 · Ça me dérange', 'Pourquoi cet enjeu me touche-t-il, moi ?'],
    ['2 · Je rêve', 'Mon monde idéal, est-ce que je le vois assez clairement pour le décrire à quelqu’un ?'],
    ['3 · Je cible', 'Est-ce que j’ai écrit une action (un verbe) ou encore un résultat (un nom) ?'],
    ['4 · J’agis', 'Qu’est-ce qui a bloqué ? Qu’est-ce que j’ai essayé pour débloquer ?'],
    ['5 · Je regarde le chemin', 'Qu’est-ce que j’ai appris sur moi ? Qu’est-ce que je referais ?']
  ], [3000, 7040], { firstAccent: true }),

  H1('08', 'Gabarit · carnet de bord citoyen'),
  tbl(['Date', 'Ce que j’ai fait', 'Ce que j’ai appris', 'Mon obstacle', 'Ma prochaine action'],
    [1, 2, 3, 4, 5].map(() => ['', P(' ', { after: 520 }), '', '', '']), [1200, 2210, 2210, 2210, 2210]),
  SP(160),
  label('Source'),
  P('Pedneault, I. *L’objectivation*, fiche de classe (non publiée). Wehmeyer, M. L. (1999). A functional model of self-determination. *Focus on Autism and Other Developmental Disabilities*, 14(1), 53-61.', { run: { size: 18 } })
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Annexe · L’objectivation', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
    footers: footer('Rêver le monde de demain · annexe : l’objectivation'), children: kids }]
});
save(doc, OUT);

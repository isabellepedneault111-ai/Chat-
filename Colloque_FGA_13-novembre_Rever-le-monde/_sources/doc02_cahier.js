const L = require('./lib');
const { d, C, EMBED, SANS, P, label, H1, H2, H3, B, BR, SP, note, quote, tbl, lines, img, caption, styles, numbering, footer, cover, save, page } = L;
const OUT = process.argv[2];
const I = __dirname + '/img/';
const W = 9900;

// Zone d'écriture : cadre fin, petite étiquette en haut à gauche
function zone(lab, h = 1400, w = W) {
  const bd = { style: d.BorderStyle.SINGLE, size: 6, color: C.ink };
  return new d.Table({ width: { size: w, type: d.WidthType.DXA }, columnWidths: [w], layout: d.TableLayoutType.FIXED,
    rows: [new d.TableRow({ height: { value: Math.round(h * 1.45), rule: d.HeightRule.ATLEAST }, cantSplit: true, children: [new d.TableCell({
      width: { size: w, type: d.WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd }, margins: { top: 80, left: 140, right: 140, bottom: 80 },
      children: [new d.Paragraph({ children: [new d.TextRun({ text: lab, font: SANS, size: 15, smallCaps: true, bold: true, characterSpacing: 30, color: C.accent })] })] })] })] });
}
// Étiquette « Nourrit » : les besoins de l'engagement que l'activité nourrit
function nourrit(...bs) { let mode = null; if (bs[0] === 'EXP' || bs[0] === 'RES') mode = bs.shift(); return new d.Paragraph({ alignment: d.AlignmentType.RIGHT, spacing: { before: 0, after: 100 }, keepNext: true, children: [...(mode ? [new d.TextRun({ text: mode === 'EXP' ? ' ↔ EXPANSION ' : ' → ← RESTRICTION ', font: 'Anton', size: 18, color: mode === 'EXP' ? 'FFFFFF' : C.yellow, shading: { type: d.ShadingType.CLEAR, color: 'auto', fill: mode === 'EXP' ? C.accent : C.ink } }), new d.TextRun({ text: '   ' })] : []), new d.TextRun({ text: 'NOURRIT  ', font: SANS, size: 14, bold: true, characterSpacing: 40, color: C.grey }), ...bs.flatMap((b, i) => [new d.TextRun({ text: ' ' + b.toUpperCase() + ' ', font: 'Anton', size: 18, shading: { type: d.ShadingType.CLEAR, color: 'auto', fill: C.yellow } }), new d.TextRun({ text: i < bs.length - 1 ? '  ' : '' })])] }); }
// Grille de zones côte à côte
function zones(labs, h = 1800) {
  const w = Math.floor(W / labs.length);
  const bd = { style: d.BorderStyle.SINGLE, size: 6, color: C.ink };
  return new d.Table({ width: { size: w * labs.length, type: d.WidthType.DXA }, columnWidths: labs.map(() => w), layout: d.TableLayoutType.FIXED,
    rows: [new d.TableRow({ height: { value: Math.round(h * 1.45), rule: d.HeightRule.ATLEAST }, cantSplit: true, children: labs.map(l => new d.TableCell({
      width: { size: w, type: d.WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd }, margins: { top: 80, left: 140, right: 140, bottom: 80 },
      children: [new d.Paragraph({ children: [new d.TextRun({ text: l, font: SANS, size: 15, smallCaps: true, bold: true, characterSpacing: 30, color: C.accent })] })] })) })] });
}

const kids = [
  ...cover({
    kicker: 'Colloque régional FGA · 13 novembre 2026 · CFGA De Jonquière',
    title: 'CAHIER DU PARTICIPANT',
    sub: 'Rêver le monde de demain… De l’idéation à l’action. Engagement citoyen et autodétermination en FGA.',
    image: { path: I + 'nb_mur.jpg', w: 620, h: 349, cap: 'Du « ça me dérange » au « on l’a fait ! »' },
    meta: []
  }),
  L.logos([[I + 'logo_cfga.png', 62, 61], [I + 'logo_csi.png', 230, 50]]),
  zone('Ce cahier appartient à', 700),
  SP(120),
  P('Ce cahier vous suit pendant tout l’atelier. Tous les documents, en PDF et en Word, sont aussi sur la page Ressources : claude.ai/artifact/SMB1bWSXHDzLNmfYQsGvwG#ressources. Écrivez-y, raturez-y, collez-y des post-it. Il est fait pour être utilisé, pas pour rester propre.', { run: { italics: true, color: C.grey } }),
  P('Isabelle Pedneault, CP, CFGA De Jonquière · Francis Laroche, chargé de projet en éducation citoyenne mondiale, Centre de solidarité internationale du Saguenay–Lac-Saint-Jean', { run: { size: 18, color: C.grey } }),

  H1('01', 'Ce qui me préoccupe dans mon milieu'),
  nourrit('EXP', 'Sens'),
  P('En entrant, notez sur un post-it une chose qui vous préoccupe, vous dérange ou vous manque dans votre milieu. Collez-le au mur, dans le cercle ou la jonction qui lui ressemble : école, communauté, nature, entre deux cercles, ou au centre si ça touche les trois.'),
  zone('Ce qui me préoccupe, me dérange ou me manque dans mon milieu', 1000),

  H1('02', 'Notre pari'),
  nourrit('Sens'),
  P('**Et si le but ultime, c’était l’engagement ?** On fait le pari que si l’engagement est là, tout le reste en découle : la présence, la persévérance, les apprentissages. Aujourd’hui, vous vivez une version accélérée d’une démarche qu’Isabelle a vécue à de nombreuses reprises avec ses élèves, que Francis fait vivre dans ses incubateurs solidaires, et que des élèves ont vécue cette semaine au centre. **Faites-nous confiance :** on a choisi exprès une démarche inductive. Par moments, le sens pourrait vous échapper ; on fait le pari qu’il apparaîtra à la fin, avec quelques surprises.'),
  P('**Motivation et engagement, pas pareil.** La motivation est la ==force== qui pousse à l’action. L’engagement est la ==décision== de prendre part activement à une activité, un projet, une mission.', { run: { size: 19 } }),
  tbl(['Besoin', 'Dans la tête de l’élève'], [
    ['**Compétence**', 'En faisant des efforts et des erreurs, j’apprends et je deviens meilleur.'],
    ['**Autonomie**', 'Je fais des choix en accord avec mes valeurs et mes intérêts.'],
    ['**Sens**', 'Je comprends pourquoi c’est important pour moi.'],
    ['**Appartenance**', 'Je compte pour quelqu’un ici.']
  ], [2400, 7500], { firstAccent: true }),
  P('Tout au long du cahier, l’étiquette **Nourrit** indique le besoin que l’activité nourrit chez vous… et chez vos élèves. L’étiquette **Expansion** signale un moment où l’on ouvre et cherche des idées (avec l’IA, les autres, soi-même) ; **Restriction**, un moment où l’on resserre, choisit et précise.', { before: 80, run: { size: 18, italics: true, color: C.grey } }),

  H1('03', 'Mon monde idéal · pense'),
  nourrit('EXP', 'Autonomie'),
  P('Sans limite de budget ni de ressources matérielles ou humaines, à quoi ressemblerait votre monde idéal ? **Seul, 3 minutes :** des mots-clés dans un ou plusieurs cercles. **Puis 2 minutes :** qu’est-ce qui relie deux cercles ? Écrivez-le dans l’intersection.'),
  img(I + 'venn_cahier.png', 600, 533),
  ...note('Modèle', ['École : *créativité*. Communauté : *collaboration*. Entre les deux : « La communauté entre dans nos murs et fait vivre aux élèves des moments de créativité. »', 'Une erreur, c’est la preuve qu’on est en action. Le « je ne sais pas » et les cases vides sont permis : votre îlot vous aidera.']),

  H1('04', 'Parle et partage, en îlot'),
  nourrit('RES', 'Appartenance', 'Compétence'),
  P('**Parle, 5 minutes.** Chacun partage. Pour chaque cercle, l’îlot garde ce qui revient ; on aide ceux qui n’ont pas trouvé d’intersection. On l’écrit au crayon effaçable sur la surface verticale, sur l’affiche des trois cercles. **Partage, 3 minutes :** chaque îlot nomme ce qu’il a gardé.'),
  tbl(['', 'Ce que notre îlot garde'], [['**École**', P(' ', { after: 420 })], ['**Communauté**', P(' ', { after: 420 })], ['**Nature**', P(' ', { after: 420 })], ['**Les intersections**', P(' ', { after: 420 })]], [2400, 7500], { firstAccent: true }),

  H1('05', 'L’analyse de contexte'),
  nourrit('EXP', 'Compétence', 'Sens'),
  P('Pour ce que j’ai noté dans mon monde idéal : qu’est-ce qui existe déjà ? Des leviers, des personnes, des lieux, des infrastructures, des organismes qui m’aident ou qui y tendent. Et qu’est-ce que je remarque ? Rien n’existe ? Notez de quoi votre centre aurait besoin pour s’y rendre.'),
  tbl(['', '+ Leviers : ce qui existe déjà (forces)', 'Je remarque que… (ce qui manque)'], [
    ['**École**', P(' ', { after: 760 }), P(' ', { after: 760 })],
    ['**Communauté**', P(' ', { after: 760 }), P(' ', { after: 760 })],
    ['**Nature**', P(' ', { after: 760 }), P(' ', { after: 760 })]
  ], [1700, 4100, 4100], { firstAccent: true }),
  P('Modèle. Nature : + un boisé derrière le centre ; je remarque qu’il n’y a pas de verdure autour du stationnement. Communauté : + le Centre de solidarité internationale ; je remarque qu’on fait peu appel aux organismes communautaires.', { before: 80, run: { size: 18, italics: true, color: C.grey } }),

  H1('06', 'Résultat ou action ?'),
  nourrit('RES', 'Compétence'),
  P('Le ==résultat== est ce qu’on souhaite : souvent un **nom**. L’==action== est ce qu’on fait lundi : un **verbe**, avec quelqu’un qui agit et une date. Dans vos cercles, ce qui vous interpelle le plus devient votre résultat. Puis, une ou des actions concrètes qui y mènent.'),
  img(I + 'il_gngv.png', 520, 225, { before: 60 }),
  zone('Mon résultat : ce qui m’interpelle le plus dans mes cercles', 800),
  SP(60),
  zone('Mes actions concrètes (un verbe, qui, quand)', 1300),
  H2('Mon action est-elle SMART ?'),
  tbl(['', 'La question', 'Ma réponse'], [
    ['**Spécifique**', 'Qu’est-ce que je souhaite apprendre ou réaliser ?', ''],
    ['**Mesurable**', 'Comment vais-je savoir que mon objectif est atteint ?', ''],
    ['**Atteignable**', 'Est-ce réalisable, et comment vais-je m’y prendre ?', ''],
    ['**Représentatif**', 'Pourquoi est-ce important pour moi ?', ''],
    ['**Temporel**', 'Quelle est ma date limite ?', '']
  ].map(r => [r[0], r[1], P(' ', { after: 360 })]), [2000, 4100, 3800], { firstAccent: true }),
  P('D’après la fiche « Objectif SMART » d’Isabelle Pedneault.', { before: 60, run: { size: 17, italics: true, color: C.grey } }),

  H1('07', 'Notre projet d’îlot'),
  nourrit('RES', 'Appartenance', 'Autonomie'),
  P('En îlot : ce qui nous interpelle (3 min), des actions concrètes (6 min), un titre (1 min), puis tout au plexiglas, avec l’espace des votes (2 min).'),
  tbl(null, [
    [P('**Le titre de notre projet**', { after: 420 })],
    [P('**Notre résultat** (ce qui nous interpelle dans nos cercles)', { after: 560 })],
    [P('**Nos actions** (un verbe, qui, quand ; le plus SMART possible)', { after: 1100 })]
  ].map(r => [r]), [W]),
  H2('Coup de pouce · les 4 besoins pour agir'),
  P('Un manque relevé dans votre analyse de contexte (vos « je remarque que ») ? Quel besoin touche-t-il ? Choisissez une action qui le nourrit. Une bonne action en nourrit souvent plus d’un.'),
  tbl(['Besoin', 'La question pour agir', 'Notre action'], [
    ['**Compétence**', '« Qu’est-ce qu’on peut réussir, à notre mesure ? »', P('', { after: 560 })],
    ['**Autonomie**', '« Qu’est-ce qu’on laisse choisir ? »', P('', { after: 560 })],
    ['**Sens**', '« À qui ça sert, vraiment ? »', P('', { after: 560 })],
    ['**Appartenance**', '« Avec qui le fait-on ? »', P('', { after: 560 })]
  ], [2000, 3600, 4300], { firstAccent: true }),
  P('*Exemple : « Les projets restent dans une seule classe » touche l’appartenance. Action : « Notre groupe invite la classe voisine à notre présentation, le 12 décembre. »*', { before: 60, run: { size: 19 } }),
  H2('Notre invite Copilot'),
  P('Sur votre ordinateur, ouvrez la page Ressources (claude.ai/artifact/SMB1bWSXHDzLNmfYQsGvwG#ressources), section « Mon invite Copilot ». Choisissez la tâche « micro-actions » et collez vos leviers et vos « je remarque que ». Copilot ne va pas chercher le programme lui-même : collez l’extrait du programme du sigle, ou joignez le PDF avec le trombone.', { run: { size: 19 } }),
  zone('Ce que Copilot a proposé, et ce qu’on garde', 1000),

  H1('08', 'La galerie et les votes'),
  nourrit('RES', 'Autonomie', 'Appartenance'),
  P('Une personne par îlot explique le projet ; les autres circulent. Chacun a 3 post-it, un de chaque couleur, à coller sur le résultat ou sur une action. 1 post-it = 1 point. À mi-temps, on change de rôle.'),
  tbl(['Vote', 'Couleur', 'Ce qu’il veut dire'], [
    ['**Coup de cœur**', 'jaune', '« Ce projet me touche, il a du sens. »'],
    ['**Oui, et…**', 'orange', '« J’aime cette action, et je changerais ceci. » La suggestion s’écrit sur le post-it.'],
    ['**On est capables**', 'mauve', '« Avec nos forces, on peut le réaliser. »']
  ], [2400, 1500, 6000], { firstAccent: true }),
  zone('Mes votes : le titre du projet, et ma suggestion « Oui, et… »', 1100),

  H1('09', 'Mes forces, mes défis'),
  nourrit('Compétence', 'Autonomie'),
  P('Voter « on est capables », c’est savoir ce qu’on peut faire. Avec les élèves : l’empreinte d’apprentissage (« J’ai MON plan! »), la liste des forces et capacités (annexe 07), puis un top 3. Les forces sont des leviers ; les défis deviennent des objectifs SMART, avec des moyens efficaces choisis selon la catégorie du défi (annexe 07).'),
  zones(['Mon top 3 des forces', 'Mon top 3 des défis'], 1300),

  H1('10', 'Un projet, toutes nos disciplines'),
  nourrit('EXP', 'Sens'),
  P('Le projet le plus voté devient celui du groupe. En un clic, Copilot montre ce que chaque discipline présente peut y travailler. Et si ce projet se réalisait dans votre milieu ?'),
  zones(['Le projet du groupe', 'Ce que mon sigle ou ma fonction peut y apporter'], 1300),

  H1('11', 'Mon premier pas, de retour dans mon milieu'),
  nourrit('RES', 'Autonomie'),
  img(I + 'il_billet.png', 560, 214),
  P('Des idées : demander lundi à mon groupe « Qu’est-ce qui vous préoccupe ? » · transformer une tâche de mon sigle à partir d’un enjeu choisi par l’élève · terminer une période par un 3-2-1 · proposer un projet-pont à une ou un collègue de PPS, de DHS, d’IS ou d’ISP · direction ou services : protéger une période commune pour qu’une équipe essaie la démarche.', { run: { size: 19 } }),
  zone('1 · Mon action (un verbe !)', 900),
  SP(60),
  zones(['2 · Quand (mon temps protégé)', '3 · Avec qui (mon allié)'], 700),
  H2('Avant de me lancer : six questions'),
  P('Le cadre d’innovation du CFGA repose sur quatre fondations : la durabilité, **le droit d’essayer**, **du temps protégé** (réservé à l’horaire, et tenu) et la réussite des adultes. Un « non » ne bloque rien : il signale qu’il reste à réfléchir.', { run: { size: 19 } }),
  tbl(['Question', 'Oui', 'Non'], [['Pertinence pédagogique', 'Mon projet a-t-il une pertinence pédagogique ?'], ['Éthique', 'Ai-je réfléchi aux principes éthiques en jeu ?'], ['Cadre légal', 'Mon initiative respecte-t-elle le cadre légal ?'], ['Soutien', 'Ai-je accès au soutien nécessaire pour la mettre en œuvre ?'], ['Validation par les pairs', 'Ai-je consulté mes pairs pour enrichir mon idée et en voir les angles morts ?'], ['Pérennité', 'Peut-elle être maintenue dans le temps et adaptée ailleurs ?']].map(q => ['**' + q[0] + '** · ' + q[1], '☐', '☐']), [8040, 1000, 1000], { firstAccent: true }),
  P('La question qui tranche : « Qui l’a vue assez de fois pour la refaire sans moi ? » Adapté du cadre des COP IA : Giroux, Munger et Pedneault (2026).', { before: 80, run: { size: 17, italics: true, color: C.grey } }),

  H1('12', 'Ce que j’ai vécu sans qu’on le nomme'),
  nourrit('Compétence', 'Sens'),
  P('Cochez celles que vous voulez essayer avec vos élèves.'),
  tbl(['Pratique', 'Où je l’ai vécue', 'Nourrit', 'J’essaie'], [
    ['Pense, parle, partage', 'Le monde idéal, et un peu partout', 'Appartenance', '☐'],
    ['Des îlots hétérogènes, formés exprès', 'Centres, programmes, matières et fonctions différents', 'Appartenance', '☐'],
    ['La classe collabo-réflexive', 'Les surfaces verticales', 'Appartenance', '☐'],
    ['La démarche inductive', 'Vivre d’abord, nommer ensuite', 'Compétence', '☐'],
    ['L’enseignement explicite', 'Résultat ou action : modelage, pratique guidée, pratique autonome', 'Compétence', '☐'],
    ['Le droit à l’erreur et au « je ne sais pas »', 'Tout au long', 'Appartenance', '☐'],
    ['Les objectifs SMART', 'Du résultat aux actions', 'Compétence', '☐'],
    ['Le choix et le vote', 'La galerie', 'Autonomie', '☐'],
    ['La rétroaction par les pairs', 'Le vote « Oui, et… »', 'Compétence', '☐'],
    ['Les forces comme leviers', 'On est capables', 'Autonomie', '☐'],
    ['Expansion et restriction', 'Ouvrir pour chercher, puis resserrer pour choisir', 'Autonomie', '☐'],
    ['L’IA au service du sens et de la créativité', 'L’invite Copilot ; un projet, toutes nos disciplines', 'Sens', '☐'],
    ['L’objectivation', 'Le 3-2-1', 'Compétence', '☐']
  ], [3300, 3500, 1900, 1200], { firstAccent: true }),

  H1('13', 'Décloisonner'),
  nourrit('EXP', 'Sens', 'Appartenance'),
  P('Une histoire vraie : des élèves étaient bons pour faire des décors. À l’Halloween, c’est le comité de vie étudiante qui s’en charge. Francis en parle avec l’enseignante d’arts plastiques, et les élèves ont participé. Ça n’a rien coûté, et tout le monde y a gagné : l’élève y a trouvé du sens.'),
  label('Des pistes à explorer'),
  tbl(['Piste', 'L’idée', 'J’explore'], [
    ['**Des ateliers par besoin**', 'Trois classes de français au même moment : terminaisons des verbes ici, syntaxe là. L’élève va où il en a besoin.', '☐'],
    ['**Une heure sur trois**', 'Sur trois heures de français ou de maths, une heure pour un projet d’engagement. Le pari : elle se regagne par trois, par quatre.', '☐'],
    ['**Le babillard des forces**', 'Chaque élève affiche son top 3 des forces ; les projets y recrutent leurs « experts ».', '☐'],
    ['**Un projet, un partenaire**', 'Chaque projet jumelé à un organisme du quartier, avec l’aide du CSI.', '☐'],
    ['**Enseigner aux autres**', 'Une fois par mois, un groupe présente son projet à un autre groupe.', '☐']
  ], [2600, 6200, 1200], { firstAccent: true }),
  SP(80),
  zone('Ma piste à moi : dans mon centre, je pourrais décloisonner…', 1500),
  SP(60),
  zone('Les incubateurs solidaires, du Saguenay au Sénégal : ce que je retiens', 900),

  H1('14', 'Objectivation 3-2-1'),
  nourrit('RES', 'Compétence'),
  P('On termine comme on aimerait que nos élèves terminent : en regardant le chemin parcouru.'),
  zone('3 idées que je retiens', 1300),
  SP(60),
  zone('2 choses que j’essaie', 1000),
  SP(60),
  zone('1 question qui me reste', 700),

  H1('15', 'Ce qui reste'),
  P('Quand les 4 besoins sont nourris, voici ce qui reste. De vrais mots d’élèves et de parents.'),
  img(I + 'frag_ecole.jpg', 360, 53, { before: 80 }),
  caption('Écriture d’un élève, 2017'),
  ...quote('Il n’y a pas un matin qu’il n’a hâte de se rendre dans sa classe. Il se sent écouté, compris et surtout, accepté.', 'Un parent', { size: 24 }),
  ...quote('[…] donner envie de faire des projets !', 'Des parents', { size: 24 }),

  H1('16', 'Pour aller plus loin'),
  img(I + 'nb_bulletin.jpg', 420, 315),
  caption('La rencontre de suivi animée par l’élève : c’est lui qui mène'),
  B('**« J’ai mon plan ».** Un outil pour que l’adulte s’approprie son parcours de formation : ses cours, ses échéances, ses buts.'),
  B('**La rencontre de suivi animée par l’élève (20 min).** L’adulte présente lui-même son plan de formation (« J’ai mon plan »), les sigles réussis, ce qui l’aide, ce qui bloque et ses prochains objectifs. L’enseignant ou l’intervenant écoute, questionne, puis on ajuste le plan ensemble. On passe de juge à coach.'),
  B('**L’objectivation.** L’annexe remise avec ce cahier propose une banque de questions et 7 formats à essayer dès lundi.'),
  B('**Mes interventions universelles.** L’annexe 10 : une autoévaluation d’après la grille réflexive EN.1.1 de « J’ai MON plan! ». Avant de cibler un élève, regarder ce qu’on offre à tout le groupe.'),
  B('**Le Centre de solidarité internationale (CSI)** accompagne les groupes qui veulent démarrer une démarche semblable, dans les quatre CSS de la région.'),
  SP(200),
  label('Références'),
  P('Deci, E. L. et Ryan, R. M. (2000). The « what » and « why » of goal pursuits: Human needs and the self-determination of behavior. *Psychological Inquiry*, 11(4), 227-268.', { run: { size: 18 } }),
  P('Wehmeyer, M. L. (1999). A functional model of self-determination. *Focus on Autism and Other Developmental Disabilities*, 14(1), 53-61.', { run: { size: 18 } }),
  P('Fredricks, J. A., Blumenfeld, P. C. et Paris, A. H. (2004). School engagement: Potential of the concept, state of the evidence. *Review of Educational Research*, 74(1), 59-109.', { run: { size: 18 } }),
  P('Organisation des Nations unies. Les 17 objectifs de développement durable. sdgs.un.org/fr/goals', { run: { size: 18 } }),

  H1('17', 'La démarche en un coup d’œil'),
  P('Pour celles et ceux qui aiment voir les étapes dans l’ordre : la démarche en mots-clés, à garder sous la main.'),
  img(I + 'infographie_demarche.png', 600, 643, { before: 60 })
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Cahier du participant · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 1000, bottom: 1000, left: 1170, right: 1170 } } },
    footers: footer('Rêver le monde de demain · cahier du participant'), children: kids }]
});
save(doc, OUT);

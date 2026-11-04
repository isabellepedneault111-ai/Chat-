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
  zone('Ce cahier appartient à', 700),
  SP(120),
  P('Ce cahier vous suit pendant tout l’atelier. Écrivez-y, raturez-y, collez-y des papillons. Il est fait pour être utilisé, pas pour rester propre.', { run: { italics: true, color: C.grey } }),
  P('Isabelle Pedneault, CP, CFGA De Jonquière · Francis Laroche, éducateur en citoyenneté mondiale, Centre de solidarité internationale du Saguenay–Lac-Saint-Jean', { run: { size: 18, color: C.grey } }),
  BR(),

  H1('01', 'Ce qui me dérange'),
  P('Première marche de l’Incubateur solidaire : partir de ce qui nous touche. Avant de coller votre papillon au mur, notez-le ici.'),
  zone('Dans le monde, ici ou ailleurs, ce qui me dérange, c’est…', 1300),
  SP(80),
  zone('Les enjeux du mur qui m’ont frappé·e', 1300),

  H1('02', 'Ce qui allume un élève'),
  P('Des mots d’élèves et de parents, reçus au primaire. Repérez ceux qui parlent de projets, de confiance, de forces et d’appartenance.'),
  img(I + 'frag_ecole.jpg', 360, 53, { before: 80 }),
  caption('Écriture d’un élève, 2017'),
  ...quote('Il n’y a pas un matin qu’il n’a hâte de se rendre dans sa classe. Il se sent écouté, compris et surtout, accepté.', 'Un parent', { size: 24 }),
  ...quote('[…] donner envie de faire des projets !', 'Des parents', { size: 24 }),
  P('**En îlot :** classez les cartes-citations selon les trois besoins de base de la théorie de l’autodétermination (Deci et Ryan). Il n’y a pas de mauvaise réponse.'),
  zones(['Autonomie · je choisis', 'Compétence · je suis capable', 'Appartenance · je compte ici'], 2000),
  SP(100),
  zone('Et moi, comme élève, qu’est-ce qui m’a allumé·e ?', 1100),

  H1('03', 'Mon monde idéal'),
  P('Nous sommes en 2036. Votre centre est devenu exactement ce que vous souhaitiez. Qu’est-ce qu’on y voit ? Qu’est-ce qu’on y entend ? Qui y entre ?'),
  zone('Seul·e · 3 minutes', 2200),
  SP(80),
  P('**La triade.** Classez un ou deux éléments de votre monde idéal, ou placez-les à une intersection.'),
  zones(['École', 'Communauté', 'Environnement'], 1500),

  H1('04', 'Les 4 sphères de l’engagement'),
  img(I + 'il_spheres.png', 360, 302),
  tbl(['Sphère', 'De quoi on parle', 'Chez mes élèves, je l’observe quand…'], [
    ['**Affective**', 'Motivation, sentiment de compétence, plaisir.', ''],
    ['**Cognitive**', 'Stratégies actives, liens, questions.', ''],
    ['**Comportementale**', 'Persévérance, régularité, présence.', ''],
    ['**Citoyenne**', 'Action concrète dans son milieu, pour d’autres.', '']
  ].map(r => [r[0], r[1], P(' ', { after: 520 })]), [2100, 3300, 4500], { firstAccent: true }),

  H1('05', 'La pyramide de rétention'),
  img(I + 'il_pyramide.png', 380, 271),
  P('Un repère du passif à l’actif : plus on fait, plus on retient. Les pourcentages qu’on voit souvent avec cette pyramide ne viennent d’aucune étude solide. L’idée, elle, tient : discuter, pratiquer et expliquer à un autre aident à apprendre.', { run: { size: 19 } }),
  zones(['Ma dernière formation se situait…', 'L’atelier d’aujourd’hui se situe…', 'Mes élèves passent surtout leur temps…'], 1300),

  H1('06', 'Résultat ou action ?'),
  zone('Avant d’aller plus loin, écrivez une action pour votre enjeu', 900),
  SP(120),
  P('Le ==résultat== est ce qu’on souhaite. C’est souvent un **nom** : « la réduction des déchets ». L’==action== est ce qu’on fait lundi. C’est un **verbe** conjugué, avec quelqu’un qui agit et une date : « Notre groupe installe trois bacs vendredi. »'),
  img(I + 'il_gngv.png', 560, 243, { before: 80 }),
  P('**Retour sur votre phrase :** est-ce un résultat ou une action ? Transformez-la.', { before: 100 }),
  tbl(['Mon résultat (un nom)', 'Mes actions (un verbe, quand, qui)'],
    [1, 2, 3].map(() => [P(' ', { after: 520 }), P(' ', { after: 520 })]), [4300, 5600]),
  P('**Une action solide est SMART :** spécifique, mesurable, atteignable, réaliste et datée.', { before: 100, run: { size: 19 } }),

  H1('07', 'L’Incubateur solidaire en 5 marches'),
  img(I + 'nb_compost.jpg', 520, 293),
  img(I + 'il_escalier.png', 460, 238),
  tbl(['Marche', 'Composante de l’autodétermination', 'Ce que j’en retiens'], [
    ['1 · Ça me dérange', 'Faire des choix', ''], ['2 · Je rêve', 'Se fixer un but', ''], ['3 · Je cible', 'Prendre des décisions', ''],
    ['4 · J’agis', 'Résoudre des problèmes', ''], ['5 · Je regarde le chemin', 'S’autoévaluer', '']
  ].map(r => [r[0], r[1], P(' ', { after: 360 })]), [2400, 3100, 4400], { firstAccent: true }),
  SP(100),
  zone('Les projets d’élèves du CFGA qui m’ont marqué·e', 1300),

  H1('08', 'Et en individualisé ?'),
  P('Pas de groupe qui avance ensemble ? Trois portes d’entrée.'),
  tbl(['Scénario', 'Comment ça se vit', 'Exemples'], [
    ['**A · L’enjeu comme contexte de tâche**', 'La tâche du sigle (écrire, calculer, lire) se fait à partir d’un enjeu choisi par l’élève.', 'Français : lettre ouverte. Mathématiques : sondage et statistiques, budget. Anglais : affiche bilingue.'],
    ['**B · Le micro-incubateur**', 'Enjeu, idée, petit geste : une version courte, en parallèle du parcours.', 'Une fiche en 4 étapes et un court journal de bord.'],
    ['**C · Le projet-pont**', 'Un groupe PPS ou DHS porte un projet. Des élèves en individualisé y contribuent comme « experts ».', 'Mathématiques : le budget. Français : la lettre de demande. Sciences : valider une donnée.']
  ], [2600, 3700, 3600]),
  SP(120),
  zone('Le scénario qui me parle (A, B ou C), et pourquoi', 1300),

  H1('09', 'Notre projet d’îlot'),
  tbl(null, [
    [P('**Notre enjeu**', { after: 420 })],
    [P('**Notre résultat** (un nom)', { after: 420 })],
    [P('**Nos actions** (un verbe, quand, qui)', { after: 900 })],
    [P('**L’invite Copilot utilisée et ce qu’elle a ajouté**', { after: 700 })]
  ], [W]),
  SP(120),
  img(I + 'il_jetons.png', 330, 110),
  P('**Le vote.** Déposez vos 3 jetons sur les projets des autres îlots : **impact** (ça changerait quelque chose pour quelqu’un), **faisabilité** (des adultes en formation pourraient le réaliser en quelques semaines), **originalité** (ça m’a surpris).', { run: { size: 19 } }),
  zone('Le projet qui m’a le plus inspiré·e', 900),

  H1('10', 'Mon premier pas'),
  img(I + 'il_billet.png', 600, 229),
  P('Remplissez la fiche (aussi en version détachable), puis photographiez-la. Dans six semaines, on vous écrira : « Avez-vous fait votre premier pas ? »', { run: { italics: true, color: C.grey } }),
  zone('1 · Mon action (un verbe !)', 900),
  SP(60),
  zones(['2 · Quand', '3 · Avec qui (mon allié)'], 700),

  BR(),
  H1('11', 'Objectivation 3-2-1'),
  P('On termine comme on aimerait que nos élèves terminent : en regardant le chemin parcouru.'),
  zone('3 idées que je retiens', 1400),
  SP(60),
  zone('2 choses que j’essaie', 1100),
  SP(60),
  zone('1 question qui me reste', 800),

  H1('12', 'Pour aller plus loin'),
  img(I + 'nb_bulletin.jpg', 420, 315),
  caption('La rencontre de suivi animée par l’élève : c’est lui qui mène'),
  B('**« J’ai mon plan ».** Un outil pour que l’adulte s’approprie son parcours de formation : ses cours, ses échéances, ses buts.'),
  B('**La rencontre de suivi animée par l’élève (20 min).** L’adulte présente lui-même son plan de formation (« J’ai mon plan »), les sigles réussis, ce qui l’aide, ce qui bloque et ses prochains objectifs. L’enseignant ou l’intervenant écoute, questionne, puis on ajuste le plan ensemble. On passe de juge à coach.'),
  B('**L’objectivation.** L’annexe remise avec ce cahier propose une banque de questions et 7 formats à essayer dès lundi.'),
  B('**Le Centre de solidarité internationale (CSI)** accompagne les groupes qui veulent démarrer un incubateur, dans les quatre CSS de la région.'),
  SP(200),
  label('Références'),
  P('Deci, E. L. et Ryan, R. M. (2000). The « what » and « why » of goal pursuits: Human needs and the self-determination of behavior. *Psychological Inquiry*, 11(4), 227-268.', { run: { size: 18 } }),
  P('Wehmeyer, M. L. (1999). A functional model of self-determination. *Focus on Autism and Other Developmental Disabilities*, 14(1), 53-61.', { run: { size: 18 } }),
  P('Fredricks, J. A., Blumenfeld, P. C. et Paris, A. H. (2004). School engagement: Potential of the concept, state of the evidence. *Review of Educational Research*, 74(1), 59-109.', { run: { size: 18 } }),
  P('Organisation des Nations unies. Les 17 objectifs de développement durable. sdgs.un.org/fr/goals', { run: { size: 18 } })
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Cahier du participant · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 1000, bottom: 1000, left: 1170, right: 1170 } } },
    footers: footer('Rêver le monde de demain · cahier du participant'), children: kids }]
});
save(doc, OUT);

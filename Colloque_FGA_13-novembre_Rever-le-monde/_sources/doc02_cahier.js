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
  L.logos([[I + 'logo_cfga.png', 62, 61], [I + 'logo_csi.png', 230, 50]]),
  zone('Ce cahier appartient à', 700),
  SP(120),
  P('Ce cahier vous suit pendant tout l’atelier. Écrivez-y, raturez-y, collez-y des post-it. Il est fait pour être utilisé, pas pour rester propre.', { run: { italics: true, color: C.grey } }),
  P('Isabelle Pedneault, CP, CFGA De Jonquière · Francis Laroche, éducateur en citoyenneté mondiale, Centre de solidarité internationale du Saguenay–Lac-Saint-Jean', { run: { size: 18, color: C.grey } }),

  H1('01', 'Ce qui me dérange'),
  P('Première marche de la démarche « de l’idée à l’action » : partir de ce qui nous touche. Avant de coller votre post-it au mur, notez-le ici.'),
  zone('Dans le monde, ici ou ailleurs, ce qui me dérange, c’est…', 1300),
  SP(80),
  zone('Les enjeux du mur qui m’ont frappé·e', 1300),

  H1('02', 'Mon monde idéal'),
  P('Nous sommes en 2036. Votre centre est devenu exactement ce que vous souhaitiez. Qu’est-ce qu’on y voit ? Qu’est-ce qu’on y entend ? Qui y entre ?'),
  zone('Seul·e · 3 minutes', 2200),
  SP(80),
  P('**La triade.** Classez un ou deux éléments de votre monde idéal, ou placez-les à une intersection.'),
  zones(['École', 'Communauté', 'Environnement'], 1500),

  H1('03', 'L’engagement, un écosystème vivant'),
  P('**Motivation ≠ engagement.** La motivation est la ==force== qui pousse à l’action (valeurs, objectifs). Ce n’est pas une question de « j’ai envie » ou « ça me tente ». L’engagement est la ==décision== de prendre part activement à une activité, un projet, une mission.'),
  P('**L’engagement citoyen :** « un acte conscient, délibéré, de bravoure et de courage », pour avancer ensemble dans une trajectoire commune (Centre de solidarité internationale).', { run: { size: 19 } }),
  H2('Les 4 besoins'),
  tbl(['Besoin', 'Dans la tête de l’élève', 'Dans ma classe, je le nourris en…'], [
    ['**Sentiment de compétence**', 'Croire qu’en faisant des efforts et des erreurs, j’apprends et je deviens meilleur.', P(' ', { after: 420 })],
    ['**Autonomie**', 'Je fais des choix en accord avec mes valeurs et mes intérêts.', P(' ', { after: 420 })],
    ['**Sens**', 'Je comprends pourquoi c’est important et en quoi ça a du sens pour moi.', P(' ', { after: 420 })],
    ['**Appartenance**', 'Les émotions et les comportements positifs sont contagieux.', P(' ', { after: 420 })]
  ], [2100, 3800, 4000], { firstAccent: true }),
  H2('Des gestes qui nourrissent l’engagement'),
  P('**Questionner** (susciter la curiosité) · **Écouter** (comprendre) · **Faire réfléchir** (activer la pensée) · **Rétroagir** (faire progresser) · **Coopérer** (apprendre ensemble) · **Donner un défi** (ni trop facile, ni trop difficile) · **Raconter** (donner du sens, créer des liens) · **Différencier** (soutenir chacun selon ses besoins) · **Laisser choisir** (offrir des options)', { run: { size: 19 } }),
  zone('Le geste que je veux faire plus souvent', 900),
  H2('Les 4 sphères de l’engagement'),
  img(I + 'il_spheres.png', 360, 302),
  tbl(['Sphère', 'De quoi on parle', 'Chez mes élèves, je l’observe quand…'], [
    ['**Affective**', 'Motivation, sentiment de compétence, plaisir.', ''],
    ['**Cognitive**', 'Stratégies actives, liens, questions.', ''],
    ['**Comportementale**', 'Persévérance, régularité, présence.', ''],
    ['**Citoyenne**', 'Action concrète dans son milieu, pour d’autres.', '']
  ].map(r => [r[0], r[1], P(' ', { after: 520 })]), [2100, 3300, 4500], { firstAccent: true }),

  H1('04', 'Résultat ou action ?'),
  zone('Avant d’aller plus loin, écrivez une action pour votre enjeu', 900),
  SP(120),
  P('Le ==résultat== est ce qu’on souhaite. C’est souvent un **nom** : « la réduction des déchets ». L’==action== est ce qu’on fait lundi. C’est un **verbe** conjugué, avec quelqu’un qui agit et une date : « Notre groupe installe trois bacs vendredi. »'),
  img(I + 'il_gngv.png', 560, 243, { before: 80 }),
  P('**Retour sur votre phrase :** est-ce un résultat ou une action ? Transformez-la.', { before: 100 }),
  tbl(['Mon résultat (un nom)', 'Mes actions (un verbe, quand, qui)'],
    [1, 2, 3].map(() => [P(' ', { after: 520 }), P(' ', { after: 520 })]), [4300, 5600]),
  P('**Une action solide est SMART :** spécifique, mesurable, atteignable, réaliste et datée.', { before: 100, run: { size: 19 } }),

  H1('05', 'La démarche en 5 marches'),
  img(I + 'nb_compost.jpg', 330, 186),
  img(I + 'il_escalier.png', 330, 171),
  tbl(['Marche', 'Composante de l’autodétermination', 'Ce que j’en retiens'], [
    ['1 · Ça me dérange', 'Faire des choix', ''], ['2 · Je rêve', 'Se fixer un but', ''], ['3 · Je cible', 'Prendre des décisions', ''],
    ['4 · J’agis', 'Résoudre des problèmes', ''], ['5 · Je regarde le chemin', 'S’autoévaluer', '']
  ].map(r => [r[0], r[1], P(' ', { after: 360 })]), [2400, 3100, 4400], { firstAccent: true }),
  SP(100),
  zone('Les projets d’élèves du CFGA qui m’ont marqué·e', 1300),

  H1('06', 'Et en individualisé ?'),
  P('Pas de groupe qui avance ensemble ? Trois portes d’entrée.'),
  tbl(['Scénario', 'Comment ça se vit', 'Exemples'], [
    ['**A · L’enjeu comme contexte de tâche**', 'La tâche du sigle (écrire, calculer, lire) se fait à partir d’un enjeu choisi par l’élève.', 'PPS Z107 : le gaspillage comme contexte de la semaine planifiée. IS : un enjeu du quotidien (transport, épicerie). Mathématiques : sondage, moyenne, budget.'],
    ['**B · Le micro-projet**', 'Enjeu, idée, petit geste : une version courte, en parallèle du parcours.', 'PPS Z128 : enquêter sur une pub qui dérange et écrire à l’annonceur. ISP : un geste avec un partenaire de stage. DHS : un petit geste citoyen présenté au groupe.'],
    ['**C · Le projet-pont**', 'Un groupe PPS, DHS, IS ou ISP porte un projet. Des élèves en individualisé y contribuent comme « experts ».', 'Mathématiques : le budget. Français : la lettre de demande. Sciences : valider une donnée.']
  ], [2600, 3700, 3600]),
  SP(120),
  zone('Le scénario qui me parle (A, B ou C), et pourquoi', 1300),

  H1('07', 'Notre projet d’îlot'),
  P('En équipe, les 4 étapes, dans l’ordre. Le minuteur est à l’écran.'),
  tbl(null, [
    [P('**1 · Notre enjeu** (choisi sur le mur à l’entrée) · 2 min', { after: 480 })],
    [P('**2 · Vivre la démarche** · 5 min', { after: 60 }), P('Notre résultat (un nom) :', { after: 420, run: { size: 19, color: C.grey } }), P('Nos actions (un verbe, qui, quand) :', { after: 900, run: { size: 19, color: C.grey } })],
    [P('**3 · L’adapter à nos groupes** (PPS, DHS, IS, ISP ou nos sigles : scénario A, B ou C) · 4 min', { after: 900 })]
  ].map(r => [r]), [W]),
  SP(120),
  H2('4 · Notre invite Copilot · 4 min'),
  P('On l’écrit ici, puis on la tape dans Copilot sur un appareil de l’îlot (compte du centre de services). Les 5 invites de l’aide-mémoire sont aussi dans le dossier partagé, prêtes à copier.', { run: { size: 19 } }),
  tbl(['', 'Ce que l’îlot écrit'], [
    ['**Rôle**', 'Agis comme… (enseignant·e en PPS, DHS, IS, ISP, mathématiques et sciences, français ou anglais ; orthopédagogue, conseiller·ère d’orientation, direction, intervenant·e scolaire…)'],
    ['**Contexte**', 'Notre groupe : … · Notre enjeu : … · Le sigle ou le cours : …'],
    ['**Programme**', 'Appuie-toi sur le programme d’études officiel de la FGA (ministère de l’Éducation du Québec) pour ce sigle : nomme les compétences, les savoirs et la famille de situations de vie visés.'],
    ['**Tâche**', 'Propose… (enrichir une action, créer une grille, des questions d’objectivation…)'],
    ['**Contraintes**', 'Niveau de lecture, durée, format, ce qu’on ne veut pas…']
  ].map(r => [r[0], P(r[1], { after: 520, run: { size: 18, color: C.grey, italics: true } })]), [1800, 8240], { firstAccent: true }),
  zone('Ce que Copilot a ajouté, et ce qu’on garde', 900),
  SP(120),
  H2('La galerie'),
  P('Une personne par îlot reste pour présenter le projet en 30 secondes ; à mi-temps, on change. Les autres circulent.', { run: { size: 19 } }),
  img(I + 'il_jetons.png', 330, 110),
  P('**Le vote.** Déposez vos 3 jetons sur les projets des autres îlots : **impact** (ça changerait quelque chose pour quelqu’un), **faisabilité** (des adultes en formation pourraient le réaliser en quelques semaines), **originalité** (ça m’a surpris).', { run: { size: 19 } }),
  zone('Le projet qui m’a le plus inspiré·e', 900),

  H1('08', 'Mon premier pas, de retour dans mon milieu'),
  img(I + 'il_billet.png', 600, 229),
  P('Remplissez la fiche (aussi en version détachable), puis photographiez-la. Dans six semaines, on vous écrira : « Avez-vous fait votre premier pas ? »', { run: { italics: true, color: C.grey } }),
  P('Des idées : demander lundi à mon groupe « Qu’est-ce qui vous dérange ? » · transformer une tâche de mon sigle à partir d’un enjeu choisi par l’élève · terminer une période par un 3-2-1 · proposer un projet-pont à une ou un collègue de PPS, de DHS, d’IS ou d’ISP · direction ou services : réserver une période commune pour qu’une équipe essaie la démarche · tester une invite Copilot pour bâtir une grille.', { run: { size: 19 } }),
  zone('1 · Mon action (un verbe !)', 900),
  SP(60),
  zones(['2 · Quand (mon temps protégé)', '3 · Avec qui (mon allié)'], 700),
  SP(100),
  H2('Avant de me lancer : six questions'),
  P('Un premier pas, c’est une petite innovation. Le cadre d’innovation du CFGA repose sur quatre fondations : la durabilité, **le droit d’essayer**, **du temps protégé** (réservé à l’horaire, et tenu) et la réussite des adultes. Un « non » ne bloque rien : il signale qu’il reste à réfléchir.', { run: { size: 19 } }),
  tbl(['Question', 'Oui', 'Non'], [['Pertinence pédagogique', 'Mon projet a-t-il une pertinence pédagogique ?'], ['Éthique', 'Ai-je réfléchi aux principes éthiques en jeu ?'], ['Cadre légal', 'Mon initiative respecte-t-elle le cadre légal ?'], ['Soutien', 'Ai-je accès au soutien nécessaire pour la mettre en œuvre ?'], ['Validation par les pairs', 'Ai-je consulté mes pairs pour enrichir mon idée et en voir les angles morts ?'], ['Pérennité', 'Peut-elle être maintenue dans le temps et adaptée ailleurs ?']].map(q => ['**' + q[0] + '** · ' + q[1], '☐', '☐']), [8040, 1000, 1000], { firstAccent: true }),
  P('La question qui tranche : « Qui l’a vue assez de fois pour la refaire sans moi ? » Adapté du cadre des COP IA : Giroux, Munger et Pedneault (2026).', { before: 80, run: { size: 17, italics: true, color: C.grey } }),

  H1('09', 'Retour sur l’atelier : la pyramide'),
  img(I + 'il_pyramide.png', 340, 243),
  P('Un repère du passif à l’actif : plus on fait, plus on retient. Les pourcentages qu’on voit souvent avec cette pyramide ne viennent d’aucune étude solide. L’idée, elle, tient : discuter, pratiquer et expliquer à un autre aident à apprendre.', { run: { size: 19 } }),
  zones(['Ma dernière formation se situait…', 'L’atelier d’aujourd’hui se situait…'], 900),

  H1('10', 'Objectivation 3-2-1'),
  P('On termine comme on aimerait que nos élèves terminent : en regardant le chemin parcouru.'),
  zone('3 idées que je retiens', 1400),
  SP(60),
  zone('2 choses que j’essaie', 1100),
  SP(60),
  zone('1 question qui me reste', 800),

  H1('11', 'Ce qui reste'),
  P('Quand les 4 besoins sont nourris (compétence, autonomie, sens, appartenance), voici ce qui reste. De vrais mots d’élèves et de parents, sans nom.'),
  img(I + 'frag_ecole.jpg', 360, 53, { before: 80 }),
  caption('Écriture d’un élève, 2017'),
  ...quote('Il n’y a pas un matin qu’il n’a hâte de se rendre dans sa classe. Il se sent écouté, compris et surtout, accepté.', 'Un parent', { size: 24 }),
  ...quote('[…] donner envie de faire des projets !', 'Des parents', { size: 24 }),
  zone('Et moi, comme élève, qu’est-ce qui m’a allumé·e ?', 1100),

  H1('12', 'Pour aller plus loin'),
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
  P('Organisation des Nations unies. Les 17 objectifs de développement durable. sdgs.un.org/fr/goals', { run: { size: 18 } })
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Cahier du participant · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 1000, bottom: 1000, left: 1170, right: 1170 } } },
    footers: footer('Rêver le monde de demain · cahier du participant'), children: kids }]
});
save(doc, OUT);

// Trois annexes : J'ai mon plan (capacités et moyens), fiche élève De l'idée à l'action, aide-mémoire Engagement
const L = require('./lib');
const fs = require('fs');
const { d, C, EMBED, SANS, P, label, H1, H2, H3, B, N, BR, SP, note, quote, tbl, img, caption, styles, numbering, footer, save, page } = L;
const DIR = process.argv[2];
const I = __dirname + '/img/';
const CAP = JSON.parse(fs.readFileSync(__dirname + '/../parcours/capacites.json', 'utf8'));
const NCAP = 11; // les 11 premières catégories : capacités ; les suivantes : moyens
const box = '☐';
const W = 10040;

function titre(k, t, sub) {
  return [label(k, { size: 16 }),
    new d.Paragraph({ spacing: { before: 120, after: 80, line: 900, lineRule: d.LineRuleType.AT_LEAST }, children: [new d.TextRun({ text: t, font: 'Anton', size: 60 })] }),
    P(sub, { run: { italics: true, color: C.grey } })];
}
function zone(lab, h = 1200, w = W) {
  const bd = { style: d.BorderStyle.SINGLE, size: 6, color: C.ink };
  return new d.Table({ width: { size: w, type: d.WidthType.DXA }, columnWidths: [w], layout: d.TableLayoutType.FIXED,
    rows: [new d.TableRow({ height: { value: Math.round(h * 1.6), rule: d.HeightRule.ATLEAST }, cantSplit: true, children: [new d.TableCell({ width: { size: w, type: d.WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd }, margins: { top: 80, left: 140, right: 140, bottom: 80 },
      children: [new d.Paragraph({ children: [new d.TextRun({ text: lab, font: SANS, size: 15, smallCaps: true, bold: true, characterSpacing: 30, color: C.accent })] })] })] })] });
}
const docOf = (title, kids, foot) => new d.Document({ creator: 'Isabelle Pedneault', title, styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 900, bottom: 900, left: 1100, right: 1100 } } }, footers: footer(foot), children: kids }] });

// ===================== 1. J'AI MON PLAN =====================
{
  const kids = [
    ...titre('Annexe · Colloque régional FGA · 13 novembre 2026', 'J’AI MON PLAN', 'Les capacités et les moyens de l’outil « J’ai MON plan! », version FGA (Parcours FGA). Pour que l’adulte fasse son portrait, choisisse un défi et se donne des moyens.'),
    H1('01', 'Le lien avec l’atelier'),
    P('« J’ai mon plan » est la passerelle entre la démarche de l’idée à l’action et le parcours de formation de l’adulte. On y retrouve les mêmes gestes : **choisir** (un défi), **se fixer un but** (un objectif), **décider** (des moyens), **agir**, puis **s’autoévaluer**.'),
    tbl(['Étape', 'Ce que fait l’adulte', 'Composante de l’autodétermination'], [
      ['1 · Mon portrait', 'Il coche ses capacités : fort, capable ou défi.', 'Se connaître'],
      ['2 · Mon défi', 'Il en retient un seul, celui qui compte le plus pour son projet.', 'Faire des choix'],
      ['3 · Mon objectif', 'Il le formule avec un verbe, une mesure et une date.', 'Se fixer un but'],
      ['4 · Mes moyens', 'Il choisit 2 ou 3 moyens dans la banque, ou les invente.', 'Prendre des décisions'],
      ['5 · Mon suivi', 'Il coche ses moyens réalisés et s’autoévalue chaque semaine.', 'S’autoévaluer']
    ], [2300, 4840, 2900], { firstAccent: true }),
    ...note('Lien avec la démarche', ['Un défi tiré du portrait peut devenir l’enjeu de départ d’un micro-projet (scénario B) : « J’ai de la difficulté à demander de l’aide » devient « Notre groupe crée un guide des ressources du centre d’ici le 20 décembre ».'], { before: 160 }),
    H1('02', 'Mon portrait : les capacités'),
    P('Pour chaque énoncé, l’adulte coche une seule case. Source : Parcours FGA, outil « J’ai MON plan! ».', { run: { size: 19, color: C.grey } }),
    ...CAP.slice(0, NCAP).flatMap(c => [H3(c.label), tbl(['Je suis capable de…', 'Fort', 'Capable', 'Défi'], c.items.map(t => [t, box, box, box]), [7040, 1000, 1000, 1000])]),
    BR(),
    H1('03', 'La banque de moyens'),
    P('L’adulte choisit 2 ou 3 moyens pour son défi. Il peut aussi en inventer.', { run: { size: 19, color: C.grey } }),
    ...CAP.slice(NCAP).flatMap(c => [H3(c.label), ...c.items.map(t => P(box + '  ' + t, { after: 40, line: 264, run: { size: 19 } }))]),
    H1('04', 'Mon plan'),
    zone('Mon défi (une capacité cochée « défi »)', 900), SP(80),
    zone('Mon objectif (un verbe, une mesure, une date)', 1000), SP(80),
    zone('Mes moyens (2 ou 3)', 1400), SP(80),
    zone('Mon suivi : ce qui a marché cette semaine, ce que je change', 1400)
  ];
  save(docOf('Annexe · J’ai mon plan', kids, 'Rêver le monde de demain · annexe : J’ai mon plan'), DIR + '/07_Annexe_Jai-mon-plan.docx');
}

// ===================== 2. FICHE ÉLÈVE =====================
{
  const kids = [
    ...titre('Fiche élève · à photocopier', 'DE L’IDÉE À L’ACTION', 'Mon projet en 5 marches. Je remplis une marche à la fois, et je reviens à cette fiche à chaque étape.'),
    img(I + 'il_escalier.png', 520, 269),
    H1('1', 'Ça me dérange'),
    P('Dans le monde, ici ou ailleurs, ce qui me dérange, c’est… Pourquoi ça me touche, moi ?', { run: { size: 19 } }),
    zone('Mon enjeu', 1100),
    H1('2', 'Je rêve'),
    P('Si le problème était réglé, à quoi ça ressemblerait ? Je le décris avec des groupes du nom enrichis.', { run: { size: 19 } }),
    zone('Mon monde idéal', 1300),
    H1('3', 'Je cible'),
    P('Mon **résultat** est un nom (ce que je souhaite). Mes **actions** sont des verbes, avec qui et quand.', { run: { size: 19 } }),
    tbl(['Mon résultat (un nom)', 'Mes actions (un verbe, qui, quand)'], [1, 2, 3].map(() => [P(' ', { after: 700 }), P(' ', { after: 700 })]), [4300, 5740]),
    H1('4', 'J’agis'),
    tbl(['Date', 'Ce que j’ai fait', 'Ce qui a bloqué', 'Ce que j’ai essayé'], [1, 2, 3, 4].map(() => ['', P(' ', { after: 420 }), '', '']), [1300, 2920, 2910, 2910]),
    H1('5', 'Je regarde le chemin'),
    zone('Ce que j’ai appris sur moi', 1000), SP(60),
    zone('Si c’était à refaire, je…', 900), SP(60),
    zone('Je suis fier·ère de…', 800)
  ];
  save(docOf('Fiche élève · De l’idée à l’action', kids, 'Rêver le monde de demain · fiche élève'), DIR + '/08_Fiche-eleve_De-l-idee-a-l-action.docx');
}

// ===================== 3. AIDE-MÉMOIRE ENGAGEMENT =====================
{
  const BES = [['Sentiment de compétence', 'Croire qu’en faisant des efforts et des erreurs, j’apprends et je deviens meilleur.', 'Défi optimal (zone proximale de développement) · mentalité de croissance · rétroaction de qualité · progression visible'],
    ['Autonomie', 'Je fais des choix en accord avec mes valeurs et mes intérêts.', 'Choix · voix et participation · sentiment de contrôle sur la tâche · s’engager volontairement · pouvoir agir selon ses valeurs'],
    ['Sens', 'Je comprends pourquoi c’est important et en quoi ça a du sens pour moi.', 'Utilité · pertinence · but personnel · authenticité · transfert'],
    ['Sentiment d’appartenance', 'Les émotions et les comportements positifs sont contagieux.', 'Relations positives · se sentir important · prendre des nouvelles · temps de qualité · virus de gentillesse · climat sécurisant · plus de commentaires positifs que négatifs']];
  const kids = [
    ...titre('Aide-mémoire · d’après l’affiche d’Isabelle Pedneault', 'L’ENGAGEMENT, UN ÉCOSYSTÈME VIVANT', 'Construire une vie riche de sens. Un moteur invisible qui fait grandir les personnes, les communautés, le monde.'),
    H1('01', 'Motivation et engagement : pas pareil'),
    tbl(['', 'C’est…'], [['**Motivation**', 'la ==force== qui pousse à l’action (valeurs, objectifs…). Ce n’est pas une question de « j’ai envie » ou « ça me tente ».'], ['**Engagement**', 'la ==décision== de prendre part activement à une activité, un projet, une mission.']], [2400, 7640], { firstAccent: true }),
    H1('02', 'Les 4 besoins'),
    tbl(['Besoin', 'Dans la tête de l’élève', 'Ce qui le nourrit'], BES.map(b => ['**' + b[0] + '**', '*' + b[1] + '*', b[2]]), [2300, 3600, 4140], { firstAccent: true }),
    ...note('La rétroaction de qualité', ['Elle est précise et ciblée, porte sur le processus et non sur la personne, indique la prochaine étape et s’appuie sur des critères explicites.'], { before: 160 }),
    H1('03', 'Pourquoi ça compte'),
    B('Il donne une direction à notre énergie.'), B('Il transforme l’intention en action.'), B('Il nourrit notre bien-être.'), B('Il favorise le dépassement de soi.'), B('Il permet de contribuer à plus grand que soi.'), B('Il crée une spirale positive : donner un sens à ses actions, développer son plein potentiel, persévérer malgré les obstacles, grandir grâce aux défis, créer des liens significatifs, ressentir la fierté de l’accomplissement, contribuer au bien commun, transformer le monde.'),
    H1('04', 'Les gestes pédagogiques qui nourrissent'),
    tbl(['Geste', 'Pour…'], [['Questionner', 'susciter la curiosité'], ['Écouter', 'comprendre'], ['Faire réfléchir', 'activer la pensée'], ['Rétroagir', 'faire progresser (rétroaction de qualité)'], ['Coopérer', 'apprendre ensemble'], ['Donner un défi', 'ni trop facile, ni trop difficile'], ['Raconter', 'donner du sens, créer des liens'], ['Différencier', 'soutenir chacun selon ses besoins'], ['Laisser choisir', 'offrir des options']], [3000, 7040], { firstAccent: true }),
    H1('05', 'Trois portes pour engager tout le monde : la CUA'),
    P('Tiré de la Boussole CP (canevas de conception universelle de l’apprentissage, d’après CAST). Le principe qui change tout : **l’outil est offert à tout le groupe**, pas seulement aux élèves qui ont une mesure adaptée.', { run: { size: 19 } }),
    tbl(['Principe', 'La question à se poser', 'Des pistes'], [
      ['**Engagement**\nle pourquoi', 'Pourquoi l’adulte devant moi voudrait-il entrer dans cette tâche ?', 'Ancrer la tâche dans une situation de vie tirée des sigles · offrir un choix de contexte (travail, famille, consommation, santé) · annoncer le but et le critère de réussite dès le départ · terminer par une autoévaluation courte · rendre l’apprentissage visible'],
      ['**Représentation**\nle quoi', 'Par combien de portes d’entrée l’information est-elle disponible ?', 'Le même contenu en texte, en audio et en schéma ou vidéo sous-titrée · préenseigner le vocabulaire · une synthèse visuelle d’une page · des consignes en étapes numérotées · des casques d’écoute dès le départ'],
      ['**Action et expression**\nle comment', 'De combien de façons l’adulte peut-il montrer ce qu’il a compris ?', 'Réponse écrite, dictée, schématisée ou orale · outils d’aide technologique offerts à tous · un gabarit ou un exemple travaillé, retiré peu à peu · une capsule audio comme trace · le choix de travailler seul ou à deux']
    ].map(r => [r[0].split('\\n').map((x, i) => P(i ? '*' + x + '*' : x, { after: 20 })), r[1], r[2]]), [2200, 3300, 4540], { firstAccent: true }),
    H1('06', 'Et l’engagement citoyen ?'),
    P('« Un acte conscient, délibéré, de bravoure et de courage, qui nous permet à toutes et à tous de nous aligner dans une trajectoire commune. Avancer ensemble. » Centre de solidarité internationale du Saguenay–Lac-Saint-Jean.', { run: { italics: true } })
  ];
  save(docOf('Aide-mémoire · L’engagement', kids, 'Rêver le monde de demain · aide-mémoire : l’engagement'), DIR + '/09_Aide-memoire_Engagement.docx');
}
// ANNEXE10

// ===================== 4. AUTOÉVALUATION · INTERVENTIONS UNIVERSELLES =====================
{
  const SRC = 'Gaudreau, N., Duchaine, M.-P. et Bernier, S. Grille réflexive des interventions universelles (EN.1.1), « J’ai MON plan! », Université Laval.';
  const o = '○';
  const BES = [
    ['Compétence', 'Je crois qu’en faisant des efforts, j’apprends.', [
      'J’amène l’élève à s’autoévaluer et à se fixer des objectifs personnels d’apprentissage.',
      'Je segmente les tâches complexes en petites étapes afin de maintenir la motivation de l’élève.',
      'J’offre à l’élève des outils de planification et d’organisation.',
      'Je reconnais les efforts fournis par l’élève en nommant ce qui a été observé.']],
    ['Autonomie', 'Je fais des choix.', [
      'J’offre à l’élève l’occasion de prendre part aux décisions de la classe.',
      'J’offre une structure qui permet aux élèves de s’exprimer (conseil de coopération, journal de classe, blogue, etc.).',
      'J’interviens de manière à ce que l’élève fasse des choix éclairés et en assume les conséquences.',
      'J’attribue des responsabilités à l’élève en tenant compte de ses forces afin de le valoriser en classe.']],
    ['Sens', 'Je comprends pourquoi c’est important pour moi.', [
      'Je communique aux élèves les objectifs d’apprentissage.',
      'J’adapte mon enseignement en fonction des intérêts et des capacités de l’élève.',
      'Je m’intéresse à ce qui fascine l’élève, à ce qui le rend heureux.',
      'Je planifie des activités d’enseignement-apprentissage qui demandent à l’élève d’être actif (autant que possible).']],
    ['Appartenance', 'Je suis important ici.', [
      'Au début du cours, j’accueille les élèves à la porte.',
      'J’incite les élèves à s’entraider et je favorise les échanges entre eux.',
      'J’organise des activités favorisant la création de liens positifs.',
      'Je me préoccupe de la qualité de ma relation avec l’élève.']]
  ];
  const kids = [
    ...titre('Annexe 10 · Colloque régional FGA · 13 novembre 2026', 'MES INTERVENTIONS UNIVERSELLES', 'Une autoévaluation, d’après la grille réflexive EN.1.1 de l’outil « J’ai MON plan! ». Avant de cibler un élève, je regarde ce que j’offre déjà à tout le groupe.'),
    H1('01', 'Pourquoi ici ?'),
    P('Dans l’atelier, on a vu que l’engagement se nourrit de 4 besoins : **compétence**, **autonomie**, **sens** et **appartenance**. La démarche de l’idée à l’action les nourrit pour tout le groupe, pas seulement pour l’élève qui a un plan d’intervention. C’est le principe de la CUA : ce qui est essentiel pour quelques-uns est bon pour tous.'),
    P('La grille réflexive EN.1.1 est l’outil de la recherche « J’ai MON plan! » qui pose exactement cette question à l’enseignant·e : avant d’établir un plan d’intervention, quelles **interventions universelles** sont déjà en place dans ma classe, et lesquelles ajuster d’abord ?'),
    ...note('Pour la FGA', ['Les énoncés parlent de « classe » et d’« élève » : lisez « groupe » ou « local » et « adulte ». En individualisé, pensez à vos rencontres de suivi et à votre façon d’accueillir chaque personne.'], { before: 120 }),
    H1('02', 'Comment l’utiliser'),
    tbl(['Échelle de la grille', 'Je le fais…'], [['**–**', 'rarement ou pas encore'], ['**+**', 'parfois'], ['**++**', 'souvent, c’est une habitude']], [3000, 7040], { firstAccent: true }),
    N('Prenez 10 minutes, seul·e ou avec un·e collègue. Cochez une case par énoncé, sans vous juger.', 5),
    N('Repérez **2 forces** (++) : ce sont vos appuis.', 5),
    N('Choisissez **1 levier** (– ou +) qui nourrirait un besoin peu servi dans votre groupe.', 5),
    N('Transformez ce levier en premier pas : une action (un verbe !), une date, un allié.', 5),
    N('Refaites la grille dans 6 semaines, au moment de la relance de l’atelier.', 5),
    BR(),
    H1('03', 'Ma grille express : 16 énoncés, 4 besoins'),
    P('Les énoncés sont tirés tels quels de la grille EN.1.1. Ils ont été regroupés selon le besoin de l’engagement qu’ils nourrissent le plus.', { run: { size: 19, color: C.grey } }),
    ...BES.flatMap(b => [H3(b[0] + ' · « ' + b[1] + ' »'), tbl(['Énoncé de la grille EN.1.1', '–', '+', '++'], b[2].map(t => [t, o, o, o]), [7340, 900, 900, 900])]),
    H1('04', 'Les 5 domaines de la grille complète'),
    P('La grille complète compte environ 80 énoncés, en 5 domaines. Les énoncés en italique y portent sur vos pratiques envers l’élève ciblé.', { run: { size: 19 } }),
    tbl(['Domaine de la grille', 'Ce qu’on y regarde', 'Besoin surtout nourri'], [
      ['**La gestion des ressources**', 'Le temps, l’horaire, le matériel, l’aménagement, la technologie.', 'Compétence'],
      ['**L’établissement d’attentes claires**', 'Les règles, les routines, les rôles, les objectifs annoncés.', 'Sens et compétence'],
      ['**Le développement de relations sociales positives**', 'L’accueil, le climat, l’entraide, la relation avec l’élève.', 'Appartenance'],
      ['**L’engagement des élèves sur l’objet d’apprentissage**', 'Les activités actives, la variété, l’autoévaluation, les intérêts.', 'Autonomie, sens et compétence'],
      ['**La gestion des comportements d’indiscipline**', 'Les interventions graduelles, calmes, cohérentes et respectueuses.', 'Appartenance (un climat sécurisant)']
    ], [3300, 4440, 2300], { firstAccent: true }),
    P('La grille complète est dans le dossier partagé (code QR de l’atelier), sous le nom « 10b_EN.1.1_Grille-reflexive_Jai-MON-plan.pdf ». Elle existe aussi en versions élève, parent, direction et services complémentaires sur le site de « J’ai MON plan! » : www.fse.ulaval.ca/recherche-ng/jaimonplan', { before: 100, run: { size: 19 } }),
    BR(),
    H1('05', 'Mon bilan'),
    zone('Mes 2 forces (++)', 1100), SP(60),
    zone('Mon levier (– ou +) et le besoin qu’il nourrit', 1100), SP(60),
    zone('De retour dans mon milieu, je… (une action, une date, un allié)', 1200), SP(60),
    zone('Je refais la grille le… et ce qui a changé', 1000),
    SP(200),
    label('Source'),
    P(SRC + ' Tiré de www.fse.ulaval.ca/recherche-ng/jaimonplan', { run: { size: 18 } })
  ];
  save(docOf('Annexe 10 · Mes interventions universelles', kids, 'Rêver le monde de demain · annexe 10 : mes interventions universelles'), DIR + '/10_Annexe_Autoevaluation-interventions-universelles.docx');
}

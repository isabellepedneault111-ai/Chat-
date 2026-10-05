// Génère Projet-Z101.docx : node build.js
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  ShadingType, AlignmentType, HeadingLevel, BorderStyle, LevelFormat, Footer,
  PageNumber, TableLayoutType, VerticalAlign,
} = require('docx');

// Palette claire, lisible à l'écran comme à l'impression
const C = {
  marine: '1D3557', vert: '2F7A2A', vertPale: 'EAF4E4', jaunePale: 'FDF6DD',
  bleuPale: 'E8F0FB', gris: '5A6070', ligne: 'CFD4DC', grisPale: 'F4F5F7', encre: '1A1D24',
};
const FONT = 'Calibri';
const W = 9360; // largeur utile : Letter, marges de 1 po

const t = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [t(runs)], spacing: { after: 120, line: 288 }, ...o });
// **gras** dans une chaîne
const rich = (s, o = {}) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(x =>
  x.startsWith('**') ? t(x.slice(2, -2), { bold: true, ...o }) : t(x, o));
const para = (s, o = {}) => p(rich(s), o);
const serre = { after: 40, line: 264 };
const pc = (s) => para(s, { spacing: serre }); // paragraphe de cellule
const puce = (s) => new Paragraph({ children: rich(s), numbering: { reference: 'puces', level: 0 }, spacing: { after: 80, line: 276 } });
const pucec = (s) => new Paragraph({ children: rich(s), numbering: { reference: 'puces', level: 0 }, spacing: serre });
const num = (s) => new Paragraph({ children: rich(s), numbering: { reference: 'nums', level: 0 }, spacing: { after: 80, line: 276 } });
const h1 = (s, o = {}) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s)], spacing: { before: 360, after: 140 }, keepNext: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.vert, space: 4 } }, ...o });
const h2 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(s)], spacing: { before: 200, after: 80 }, keepNext: true });
const note = (s) => p([t(s, { size: 18, italics: true, color: C.gris })], { spacing: { before: 60, after: 120 } });
const espace = (n = 160) => new Paragraph({ children: [], spacing: { after: n } });

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const fine = { style: BorderStyle.SINGLE, size: 4, color: C.ligne };
const grid = { top: fine, bottom: fine, left: fine, right: fine, insideHorizontal: fine, insideVertical: fine };

const cell = (content, width, o = {}) => new TableCell({
  children: typeof content === 'string' ? content.split('\n').map(pc) : content,
  width: { size: width, type: WidthType.DXA },
  columnSpan: o.span,
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  verticalAlign: o.v || VerticalAlign.TOP,
  borders: o.borders,
});
const enTete = (s, width, o = {}) => cell([p([t(s, { bold: true, color: 'FFFFFF', size: 20 })], { spacing: { after: 0 } })], width, { fill: C.marine, ...o });

// Tableau générique, en-tête marine, première colonne teintée au besoin
const tableau = (widths, head, rows, o = {}) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, borders: grid,
  rows: [
    new TableRow({ tableHeader: true, children: head.map((h, i) => enTete(h, widths[i])) }),
    ...rows.map(r => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], { fill: o.col1 && i === 0 ? o.col1 : undefined })) })),
  ],
});

// Encadré pleine largeur avec barre de couleur à gauche
const encadre = (children, fill, bar) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [W], layout: TableLayoutType.FIXED,
  rows: [new TableRow({ cantSplit: true, children: [new TableCell({
    children, width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill },
    margins: { top: 160, bottom: 120, left: 260, right: 260 },
    borders: { ...noBorders, left: { style: BorderStyle.SINGLE, size: 36, color: bar } },
  })] })],
});

// Chiffres clés
const q = W / 4;
const chiffre = (n, l, fill) => cell([
  p([t(n, { bold: true, size: 60, color: C.marine })], { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 240 } }),
  p([t(l, { size: 19, color: C.gris })], { alignment: AlignmentType.CENTER, spacing: { after: 0, line: 252 } }),
], q, { fill, borders: noBorders, v: VerticalAlign.CENTER });
const chiffres = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [q, q, q, q], layout: TableLayoutType.FIXED,
  borders: { ...noBorders, insideHorizontal: NONE, insideVertical: { style: BorderStyle.SINGLE, size: 36, color: 'FFFFFF' } },
  rows: [new TableRow({ children: [
    chiffre('15', 'élèves inscrits, groupe fermé', C.bleuPale),
    chiffre('9', 'élèves en liste d\'attente', C.jaunePale),
    chiffre('24', 'élèves accueillis avec la formule', C.vertPale),
    chiffre('0', 'embauche et période vide', C.grisPale),
  ] })],
});

// Menu du matin : moment | élèves | enseignante | TES
const mW = [1560, 2600, 2600, 2600];
const mHead = (labels) => new TableRow({ tableHeader: true, children: labels.map((l, i) => enTete(l, mW[i])) });
const mRow = (heure, moment, el, ens, tes, fill) => new TableRow({ cantSplit: true, children: [
  cell([p([t(heure, { bold: true, color: C.marine })], { spacing: { after: 0 } }), p([t(moment, { size: 19, color: C.gris })], { spacing: { after: 0 } })], mW[0], { fill: C.grisPale }),
  cell(el, mW[1], { fill }), cell(ens, mW[2], { fill }), cell(tes, mW[3], { fill }),
] });
const menu = (rows) => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: mW, layout: TableLayoutType.FIXED, borders: grid,
  rows: [mHead(['Moment', 'Les élèves', 'L\'enseignante', 'La TES']), ...rows] });
const menu12 = menu([
  mRow('8 h 30', 'Accueil et briefing', 'Météo d\'équipe. Chacun inscrit sa tâche au registre d\'autonomie. Le leader du jour reçoit son rôle.', 'Présente les objectifs du jour et les ateliers. Forme les sous-groupes A et B.', 'Accueille les élèves un à un. Repère les signes d\'anxiété et prévient les difficultés.', C.jaunePale),
  mRow('9 h 00', 'Bloc 1', '**A :** enseignement direct.\n**B :** ateliers autonomes (cuisine, grenier, chariots TEACCH) avec fiche de tâche et leader.', 'Enseigne le Z101 au sous-groupe A. N\'est pas interrompue : le sous-groupe B applique « 3 avant l\'enseignante ».', 'Accompagne le sous-groupe B en atelier : soutient le leader, aide à régler les blocages, offre des pauses de régulation.'),
  mRow('10 h 05', 'Transition', 'Le leader fait valider la fiche et ranger le poste. Les sous-groupes changent de place.', 'Termine le bloc et accueille le sous-groupe B.', 'Encadre le changement de place pour qu\'il se fasse calmement et rapidement.', C.grisPale),
  mRow('10 h 10', 'Bloc 2', '**B :** enseignement direct.\n**A :** ateliers autonomes avec un nouveau leader.', 'Enseigne le Z101 au sous-groupe B.', 'Accompagne le sous-groupe A en atelier, comme au bloc 1.'),
  mRow('11 h 15', 'Retour et rangement', 'Retour sur ce qui a été appris et sur le travail d\'équipe. Rangement collaboratif.', 'Valide le registre d\'autonomie et note les progrès.', 'Co-anime le retour réflexif : ce qui a aidé, ce qui a bloqué, comment on s\'est réglé.', C.jaunePale),
]);
const menu3 = menu([
  mRow('8 h 30', 'Accueil et briefing', 'Même routine, animée de plus en plus par les élèves leaders.', 'Annonce qui participe aux sous-groupes de besoins du jour.', 'Annonce qui participe à ses ateliers ciblés du jour.', C.jaunePale),
  mRow('9 h 00 à 11 h 15', 'Blocs de travail', 'La majorité travaille en ateliers autonomes. Quelques élèves rejoignent l\'enseignante ou la TES selon leurs besoins.', '**Anime des ateliers en sous-groupes de besoins** (petits groupes formés selon les difficultés observées) en plus de l\'enseignement direct.', '**Anime des ateliers ciblés en petits groupes** : habiletés de vie, gestion des émotions, préparation à l\'emploi.'),
  mRow('11 h 15', 'Retour et rangement', 'Les élèves animent eux-mêmes une partie du retour.', 'Valide le registre.', 'Co-anime le retour réflexif.', C.jaunePale),
]);

// Trois périodes
const pW = [1740, 2540, 2540, 2540];
const periode = (titre, sous) => cell([
  p([t(titre, { bold: true, color: 'FFFFFF', size: 22 })], { spacing: { after: 0 } }),
  p([t(sous, { color: 'FFFFFF', size: 18 })], { spacing: { after: 0 } }),
], 0, { fill: C.marine });
const rowP = (label, a, b, c, fill) => new TableRow({ cantSplit: true, children: [
  cell(`**${label}**`, pW[0], { fill: C.vertPale }), cell(a, pW[1], { fill }), cell(b, pW[2], { fill }), cell(c, pW[3], { fill }),
] });
const periodes = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: pW, layout: TableLayoutType.FIXED, borders: grid,
  rows: [
    new TableRow({ tableHeader: true, children: [
      enTete('', pW[0]),
      new TableCell({ ...{}, children: [p([t('1. Ancrage', { bold: true, color: 'FFFFFF', size: 22 })], { spacing: { after: 0 } }), p([t('On installe', { color: 'FFFFFF', size: 18 })], { spacing: { after: 0 } })], width: { size: pW[1], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.marine }, margins: { top: 100, bottom: 100, left: 140, right: 140 } }),
      new TableCell({ children: [p([t('2. Consolidation', { bold: true, color: 'FFFFFF', size: 22 })], { spacing: { after: 0 } }), p([t('On renforce', { color: 'FFFFFF', size: 18 })], { spacing: { after: 0 } })], width: { size: pW[2], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.marine }, margins: { top: 100, bottom: 100, left: 140, right: 140 } }),
      new TableCell({ children: [p([t('3. Autonomie', { bold: true, color: 'FFFFFF', size: 22 })], { spacing: { after: 0 } }), p([t('On différencie', { color: 'FFFFFF', size: 18 })], { spacing: { after: 0 } })], width: { size: pW[3], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.marine }, margins: { top: 100, bottom: 100, left: 140, right: 140 } }),
    ] }),
    rowP('Objectif',
      'Installer les routines, la cohésion des équipes et les outils d\'autonomie.',
      'Intensifier les ateliers autonomes et suivre les progrès de près.',
      'Les élèves fonctionnent seuls en atelier. Les adultes enseignent de façon ciblée.'),
    rowP('Enseignante',
      'Enseignement direct. Présente les fiches, le registre et le rôle de leader.',
      'Enseignement direct. Ajuste les fiches avec l\'orthopédagogue selon ce qu\'elle observe.',
      '**Anime des ateliers en sous-groupes de besoins**, pendant que les autres élèves travaillent en autonomie.', undefined),
    rowP('TES',
      'Présente sur les plateaux. Modélise le rôle de leader, sécurise les transitions, repère les signes d\'anxiété.',
      'Coache en retrait. Conseille le leader, intervient aux moments critiques, soutient l\'autorégulation.',
      '**Anime des ateliers ciblés en petits groupes** : habiletés de vie, gestion des émotions, préparation à l\'emploi.'),
    rowP('Élèves',
      'Apprennent les routines, suivent la fiche avec de l\'aide, essaient le rôle de leader.',
      'Règlent leurs blocages entre eux (« 3 avant l\'enseignante »). Chacun a été leader au moins une fois.',
      'S\'auto-évaluent, se fixent des défis et transfèrent leurs acquis.'),
    rowP('On passe à la suite quand…',
      'Les équipes suivent une fiche du début à la fin avec peu d\'aide.',
      'Les interventions de la TES diminuent et le registre est rempli sans rappel.',
      '—', C.grisPale),
  ],
});

const doc = new Document({
  creator: 'Conseillère pédagogique, secteur PPS',
  title: 'Projet PPS Z101 : accueillir les élèves en attente',
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: C.encre } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true, color: C.marine }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true, color: C.vert }, paragraph: { outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] },
    { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, bottom: 1200, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      t('Projet PPS Z101 · Proposition à la table des directions · page ', { size: 16, color: C.gris }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.gris }),
    ] })] }) },
    children: [
      // Titre
      p([t('PROPOSITION À LA TABLE DES DIRECTIONS · OCTOBRE 2026', { size: 18, bold: true, color: C.vert, characterSpacing: 30 })], { spacing: { after: 60 } }),
      p([t('Projet PPS Z101', { size: 52, bold: true, color: C.marine })], { spacing: { after: 0, line: 240 } }),
      p([t('Accueillir les 9 élèves en attente grâce à une formule en deux sous-groupes', { size: 28, color: C.marine })], { spacing: { after: 100 } }),
      p([t('Préparé par la conseillère pédagogique, secteur PPS, CFGA', { size: 19, italics: true, color: C.gris })], { spacing: { after: 240 } }),
      chiffres,
      espace(220),
      encadre([
        p([t('En bref', { bold: true, size: 24, color: C.marine })], { spacing: { after: 80 } }),
        para('Le groupe Z101 est complet avec **15 élèves**, et **9 autres élèves attendent** une place. Plusieurs nous sont référés par des enseignantes de la FBC parce que leur profil correspond à PPS.'),
        para('Nous proposons d\'accueillir ces 9 élèves **sans embauche et sans période vide à l\'horaire**. Les 24 élèves seraient répartis en deux sous-groupes qui alternent entre l\'enseignement direct avec l\'enseignante et des ateliers autonomes très structurés.'),
        para('La TES accompagne d\'abord les élèves vers l\'autonomie. Une fois cette autonomie acquise, **l\'enseignante anime des ateliers en sous-groupes de besoins et la TES anime des ateliers ciblés en petits groupes.** La TES a déjà donné son accord.', { spacing: { after: 60 } }),
      ], C.bleuPale, C.marine),

      // 1
      h1('1. La situation et les enjeux'),
      h2('Ce qui se passe actuellement'),
      puce('Les inscriptions au Z101 sont fermées depuis quelques semaines : le groupe compte **15 élèves**.'),
      puce('Depuis, **9 élèves se sont ajoutés à la liste d\'attente**, dont plusieurs référés par des enseignantes de la FBC.'),
      puce('La cohorte actuelle est **très participative et engagée**. C\'est une base solide pour introduire des ateliers autonomes.'),
      h2('Pourquoi c\'est important'),
      tableau([2300, 7060], ['Enjeu', 'Ce qui est en jeu'], [
        ['**Persévérance**', 'Ces élèves sont prêts à s\'engager maintenant. Les faire attendre, c\'est risquer qu\'ils décrochent avant d\'avoir commencé. Pour certains, ce cours peut changer complètement leur parcours scolaire, professionnel et de vie.'],
        ['**Rétention au centre**', 'Les élèves du Z101 poursuivent en **années 2 et 3 en PPS**. Chaque élève accueilli aujourd\'hui, c\'est un parcours de trois ans au centre.'],
        ['**Engagement**', 'Les enseignantes de la FBC voient le Z101 comme un levier de motivation pour ces élèves. C\'est pour cette raison qu\'elles nous les réfèrent.'],
        ['**Innovation**', 'La formule peut devenir un modèle pour d\'autres services du centre (section 7).'],
      ], { col1: C.vertPale }),

      // 2
      h1('2. La formule proposée'),
      para('Les 24 élèves forment **deux sous-groupes de 12 (A et B)**. Pendant que l\'un reçoit l\'enseignement direct du Z101 avec l\'enseignante, l\'autre travaille en **ateliers autonomes**. Les sous-groupes changent de place à mi-parcours. Chaque élève est donc toujours en apprentissage encadré, sans période vide.'),
      h2('Le menu du matin (périodes 1 et 2)'),
      para('Voici comment se déroule une matinée type, et ce que font l\'enseignante et la TES à chaque moment.'),
      menu12,
      note('Les heures sont indicatives et seront ajustées à l\'horaire réel du groupe.'),
      h2('Le menu du matin en période 3, quand l\'autonomie est acquise'),
      para('Quand les élèves fonctionnent seuls en atelier et que la gestion de classe le permet, les adultes ne sont plus nécessaires pour accompagner les ateliers. Ils peuvent alors enseigner de façon ciblée.'),
      menu3,
      espace(120),
      h2('Les outils qui rendent les élèves autonomes'),
      puce('**Fiches de tâches autonomes :** une tâche par fiche, de 1 à 5 étapes illustrées et des critères de réussite pour s\'auto-évaluer.'),
      puce('**Leader tournant :** à chaque atelier, un élève lit la fiche, distribue les rôles et gère le temps. Le rôle tourne pour que chacun l\'exerce.'),
      puce('**Registre d\'autonomie :** chaque élève y inscrit sa tâche en début de matinée, et le leader valide les étapes.'),
      puce('**Règle « 3 avant l\'enseignante » :** relire la fiche, demander à un coéquipier, essayer une autre solution.'),
      puce('**Chariots TEACCH :** des postes de travail visuels et structurés, partagés avec l\'alpha-pré et la DAP.'),

      // 3
      h1('3. Trois périodes pour construire l\'autonomie'),
      para('L\'autonomie se construit graduellement. Le rôle de chaque adulte change d\'une période à l\'autre. On passe à la période suivante quand on observe les signes de réussite, pas à une date fixe.'),
      periodes,
      espace(200),
      encadre([
        p([t('La TES n\'est pas une surveillante', { bold: true, size: 24, color: C.vert })], { spacing: { after: 80 } }),
        para('Son rôle évolue avec les élèves. Elle **installe** les routines, puis elle **coache** en retrait. Quand l\'autonomie et la gestion de classe le permettent, elle **anime des ateliers ciblés auprès de petits groupes d\'élèves**. Ce dernier rôle a été discuté avec elle et elle est d\'accord.'),
        para('Le fait qu\'elle intervienne de moins en moins pendant les ateliers montre que l\'autonomie progresse.', { spacing: { after: 60 } }),
      ], C.vertPale, C.vert),

      // 4
      h1('4. Pourquoi la formule soutient l\'engagement'),
      para('L\'engagement, c\'est **la décision de participer activement**. Il se nourrit de **quatre besoins**. La formule a été pensée pour nourrir chacun d\'eux.'),
      tableau([2500, 6860], ['Besoin', 'Comment la formule le nourrit'], [
        [[pc('**Sentiment de compétence**'), p([t('Défi optimal, rétroaction de qualité, progression visible', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'Des fiches courtes (1 à 5 étapes) adaptées au niveau de l\'élève. Des critères de réussite connus d\'avance pour s\'auto-évaluer. Des étapes validées au registre : l\'élève voit ses progrès.'],
        [[pc('**Autonomie**'), p([t('Choix, voix et participation, contrôle sur la tâche', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'L\'élève choisit sa tâche et s\'inscrit lui-même au registre. Il prend la parole comme leader. Il règle ses blocages avec la règle « 3 avant l\'enseignante ».'],
        [[pc('**Sens**'), p([t('Utilité, but personnel, transfert', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'Des tâches de la vraie vie : cuisiner, gérer un inventaire, faire un budget, choisir un logement. Ce qui est appris sert dès maintenant, puis en années 2 et 3.'],
        [[pc('**Sentiment d\'appartenance**'), p([t('Relations positives, climat sécurisant, temps de qualité', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'Équipes mixtes, entraide et leader tournant : chaque élève compte pour son équipe. La TES veille au climat. Les ateliers en petits groupes offrent du temps de qualité avec un adulte.'],
      ], { col1: C.vertPale }),
      note('Cadre de référence : affiche « L\'engagement » d\'Isabelle Pedneault (CC BY-NC-SA 4.0).'),

      // 5
      h1('5. Réponses aux préoccupations'),
      tableau([3000, 6360], ['Préoccupation', 'Notre réponse'], [
        ['**« Il y aura des trous à l\'horaire. »**', 'Aucune période vide. Chaque bloc est planifié au tableau de programmation : l\'élève est soit avec l\'enseignante, soit en atelier guidé par une fiche.'],
        ['**« Il faudra embaucher une ressource. »**', 'Aucune embauche. L\'enseignante, la TES préventive, l\'orthopédagogue et la CP sont déjà en place. Les chariots TEACCH sont partagés avec l\'alpha-pré et la DAP.'],
        ['**« On l\'a essayé l\'an dernier et des élèves se sont désengagés. »**', 'Après vérification, ce désengagement s\'explique par des cas très particuliers propres à la cohorte de l\'an dernier. Cette année, les élèves sont très participatifs. La formule est aussi différente : fiches de tâches, leader tournant, registre et transition planifiée vers l\'autonomie.'],
        ['**« La TES va devenir une surveillante. »**', 'Non. Elle accompagne la transition vers l\'autonomie, puis anime ses propres ateliers ciblés en petits groupes (section 3).'],
        ['**« Et si ça ne fonctionne pas ? »**', 'Le projet est un pilote avec un bilan à la fin de la période d\'ancrage. Si les indicateurs ne sont pas au rendez-vous, on ajuste ou on revient à la formule actuelle.'],
        ['**« Et si on ne fait rien ? »**', '9 élèves restent à la porte au moment où ils sont prêts à s\'engager. Certains ne reviendront pas.'],
      ], { col1: C.grisPale }),

      // 6
      h1('6. Les ressources et le suivi'),
      h2('Qui fait quoi'),
      tableau([2300, 7060], ['Personne', 'Rôle dans le projet'], [
        ['**Enseignante**', 'Pilote pédagogique : enseignement du Z101, planification, évaluation. En période 3, ateliers en sous-groupes de besoins.'],
        ['**TES préventive**', 'Transition vers l\'autonomie, régulation et transitions. En période 3, ateliers ciblés en petits groupes.'],
        ['**Orthopédagogue**', 'Conception des boîtes TEACCH, adaptation des fiches et du matériel.'],
        ['**Conseillère pédagogique**', 'Accompagnement de l\'équipe, conformité au programme, suivi des indicateurs et bilan.'],
        ['**Élèves leaders**', 'Animation des ateliers selon le rôle tournant.'],
      ], { col1: C.vertPale }),
      h2('Comment on saura que ça fonctionne'),
      puce('**Présence et assiduité** des 24 élèves.'),
      puce('**Tâches complétées et validées** au registre d\'autonomie.'),
      puce('**Interventions de la TES pendant les ateliers**, qui devraient diminuer d\'une période à l\'autre.'),
      puce('**Poursuite en année 2** de PPS à la fin du parcours.'),

      // 7
      h1('7. Au-delà du Z101'),
      para('Cette formule met la collaboration au cœur de l\'apprentissage. Si elle fonctionne en Z101, elle pourrait s\'appliquer en **alpha-pré**, en **francisation**, à la **FBC** et ailleurs au centre : partout où l\'on veut accueillir plus d\'élèves et développer leur autonomie avec les ressources existantes.'),

      // 8
      h1('8. Ce que nous demandons'),
      num('**Rouvrir les inscriptions au Z101** pour accueillir les 9 élèves en attente.'),
      num('**Autoriser la formule en deux sous-groupes** à titre de projet pilote, avec l\'équipe déjà en place.'),
      num('**Prévoir un bilan** à la fin de la période d\'ancrage, à partir des indicateurs de la section 6.'),
      espace(200),
      encadre([
        p([t('« Quand une fleur ne fleurit pas, on corrige l\'environnement dans lequel elle pousse, pas la fleur. »', { italics: true, size: 24, color: C.marine })], { spacing: { after: 60 } }),
        p([t('Paulo Amaro', { size: 19, color: C.gris })], { spacing: { after: 40 } }),
      ], C.jaunePale, 'F5C542'),
    ],
  }],
});

Packer.toBuffer(doc).then(b => {
  fs.writeFileSync(path.join(__dirname, 'Projet-Z101.docx'), b);
  console.log('ok');
});

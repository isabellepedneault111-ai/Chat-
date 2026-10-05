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


// Fiche synthèse : libellé | contenu
const fW = [2400, 6960];
const fiche = (rows) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: fW, layout: TableLayoutType.FIXED, borders: grid,
  rows: rows.map(([l, c]) => new TableRow({ cantSplit: true, children: [cell(`**${l}**`, fW[0], { fill: C.bleuPale }), cell(c, fW[1])] })),
});

// Échéancier de démarrage
const demarrage = tableau([2000, 4960, 2400], ['Quand', 'Étape', 'Responsable'], [
  ['**Semaine 0**', 'Décision de la table des directions. Confirmation des locaux et de l\'horaire de la TES.', 'Direction'],
  ['**Semaine 0**', 'Appel aux 9 élèves en attente et inscription dans le groupe Z101.', 'Secrétariat, CP'],
  ['**Semaine 0**', 'Formation des sous-groupes A et B (mixtes). Préparation des premières fiches de tâches et du registre.', 'Enseignante, orthopédagogue, CP'],
  ['**Semaine 1**', 'Début de la période d\'ancrage avec les 24 élèves.', 'Enseignante, TES'],
  ['**Fin de l\'ancrage**', 'Premier bilan à partir des indicateurs (section 9). Décision : poursuivre, ajuster ou revenir au groupe unique.', 'CP, direction'],
  ['**Fin de l\'année**', 'Bilan final et recommandation sur la transférabilité à d\'autres services.', 'CP, équipe, direction'],
]);

const doc = new Document({
  creator: 'Conseillère pédagogique, secteur PPS',
  title: 'Présentation de projet : PPS Z101',
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
      t('Présentation de projet · PPS Z101 · page ', { size: 16, color: C.gris }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.gris }),
    ] })] }) },
    children: [
      // ── Page 1 : titre et fiche synthèse
      p([t('PRÉSENTATION DE PROJET · TABLE DES DIRECTIONS · OCTOBRE 2026', { size: 18, bold: true, color: C.vert, characterSpacing: 30 })], { spacing: { after: 60 } }),
      p([t('PPS Z101 : un deuxième sous-groupe', { size: 50, bold: true, color: C.marine })], { spacing: { after: 0, line: 240 } }),
      p([t('Accueillir les 9 élèves en attente sans embauche, grâce à une formule d\'ateliers autonomes', { size: 26, color: C.marine })], { spacing: { after: 100 } }),
      p([t('Présenté par la conseillère pédagogique, secteur PPS, CFGA', { size: 19, italics: true, color: C.gris })], { spacing: { after: 220 } }),
      chiffres,
      espace(200),
      h2('Fiche synthèse'),
      fiche([
        ['Problème', 'Le groupe Z101 est complet (15 élèves) et 9 élèves référés attendent une place. Sans solution, ils restent à la porte au moment où ils sont prêts à s\'engager.'],
        ['Solution', 'Accueillir les 24 élèves en **deux sous-groupes de 12** qui alternent entre l\'enseignement direct et des ateliers autonomes structurés.'],
        ['Clientèle', 'Élèves adultes du programme Participation sociale (PPS), dont plusieurs référés par des enseignantes de la FBC.'],
        ['Équipe', 'Enseignante du Z101, TES préventive, orthopédagogue et conseillère pédagogique. Tous déjà en poste.'],
        ['Coût', '**Aucune embauche.** Matériel : fiches plastifiées et chariots TEACCH partagés avec l\'alpha-pré et la DAP.'],
        ['Durée', 'Projet pilote à partir de l\'acceptation, en trois périodes, avec un premier bilan à la fin de la période d\'ancrage.'],
        ['Décision demandée', 'Rouvrir les inscriptions au Z101 et autoriser la formule en deux sous-groupes à titre de projet pilote.'],
      ]),

      // ── 1
      h1('1. Contexte et problématique'),
      puce('Les inscriptions au Z101 sont fermées depuis quelques semaines : le groupe compte **15 élèves**.'),
      puce('Depuis, **9 élèves se sont ajoutés à la liste d\'attente**. Plusieurs sont référés par des enseignantes de la FBC parce que leur profil correspond à PPS et que le Z101 serait pour eux un levier d\'engagement et de motivation.'),
      puce('Les élèves du Z101 **poursuivent ensuite en années 2 et 3 en PPS** au centre.'),
      puce('La direction souhaite éviter les périodes vides à l\'horaire des élèves et ne pas embaucher de ressource supplémentaire. La formule proposée respecte ces deux conditions.'),
      h2('Les enjeux'),
      tableau([2300, 7060], ['Enjeu', 'Ce qui est en jeu'], [
        ['**Persévérance**', 'Ces élèves sont prêts à s\'engager maintenant. Les faire attendre, c\'est risquer qu\'ils décrochent avant d\'avoir commencé. Pour certains, ce cours peut changer complètement leur parcours scolaire, professionnel et de vie.'],
        ['**Rétention au centre**', 'Chaque élève accueilli en Z101 représente un parcours possible de trois ans en PPS au centre.'],
        ['**Équité**', 'Ces élèves ont un profil qui correspond à PPS. Leur offrir une place, c\'est leur offrir le service qui leur convient.'],
        ['**Innovation**', 'La formule peut devenir un modèle pour d\'autres services du centre (section 10).'],
      ], { col1: C.vertPale }),

      // ── 2
      h1('2. Objectifs du projet'),
      para('**Objectif général :** accueillir les 9 élèves en attente au Z101 et développer l\'autonomie de tous les élèves du groupe, sans embauche ni période vide.'),
      h2('Objectifs spécifiques'),
      num('**Retenir** les 24 élèves pendant le projet pilote, dans un environnement sécurisant.'),
      num('**Développer l\'autonomie** des élèves en atelier, au point où les adultes peuvent enseigner de façon ciblée (période 3).'),
      num('**Soutenir l\'engagement** en nourrissant les quatre besoins : compétence, autonomie, sens et appartenance.'),
      num('**Documenter la formule** pour évaluer si elle peut s\'appliquer ailleurs au centre.'),

      // ── 3
      h1('3. Description de la formule'),
      para('Les 24 élèves forment **deux sous-groupes de 12 (A et B)**, composés d\'élèves de profils variés. Pendant que l\'un reçoit l\'enseignement direct du Z101 avec l\'enseignante, l\'autre travaille en **ateliers autonomes**. Les sous-groupes changent de place à mi-matinée. Chaque élève est donc toujours en apprentissage encadré.'),
      h2('Les outils qui rendent les élèves autonomes'),
      puce('**Fiches de tâches autonomes :** une tâche par fiche, de 1 à 5 étapes illustrées, et des critères de réussite pour s\'auto-évaluer.'),
      puce('**Leader tournant :** à chaque atelier, un élève lit la fiche, distribue les rôles et gère le temps. Le rôle tourne pour que chacun l\'exerce.'),
      puce('**Registre d\'autonomie :** chaque élève y inscrit sa tâche en début de matinée, le leader valide les étapes et l\'enseignante fait la validation finale.'),
      puce('**Règle « 3 avant l\'enseignante » :** relire la fiche, demander à un coéquipier, essayer une autre solution.'),
      puce('**Plateaux et chariots TEACCH :** ateliers en cuisine et au grenier, postes de travail visuels et structurés.'),
      puce('**Tableau de programmation :** chaque bloc de la matinée est planifié et affiché. Aucune période n\'est laissée vide.'),

      // ── 4
      h1('4. Le menu du matin'),
      h2('Périodes 1 et 2 : installer et consolider l\'autonomie'),
      menu12,
      note('Heures indicatives, à ajuster à l\'horaire réel du groupe.'),
      h2('Période 3 : quand l\'autonomie est acquise'),
      para('Quand les élèves fonctionnent seuls en atelier et que la gestion de classe le permet, les adultes n\'ont plus besoin d\'accompagner les ateliers. Ils enseignent alors de façon ciblée.'),
      menu3,

      // ── 5
      h1('5. Rôles et responsabilités'),
      tableau([2100, 3630, 3630], ['Personne', 'Périodes 1 et 2', 'Période 3'], [
        ['**Enseignante**\nPilote pédagogique', 'Enseigne le Z101 à chaque sous-groupe. Planifie, évalue et valide le registre. Présente les outils d\'autonomie.', 'Enseigne le Z101 et **anime des ateliers en sous-groupes de besoins** pendant que les autres travaillent en autonomie.'],
        ['**TES préventive**\nTransition vers l\'autonomie', 'Accompagne le sous-groupe en atelier : modélise le rôle de leader, aide à régler les blocages, soutient l\'autorégulation, encadre les transitions. Co-anime le retour réflexif.', '**Anime des ateliers ciblés en petits groupes** : habiletés de vie, gestion des émotions, préparation à l\'emploi. Elle a déjà donné son accord.'],
        ['**Orthopédagogue**', 'Conçoit les boîtes TEACCH. Adapte les fiches et le matériel aux besoins des élèves.', 'Ajuste le matériel selon les besoins observés.'],
        ['**Conseillère pédagogique**', 'Accompagne l\'équipe dans l\'implantation. Assure la conformité au programme. Prépare les outils de suivi.', 'Analyse les indicateurs, rédige le bilan et la recommandation.'],
        ['**Élèves leaders**', 'Lisent la fiche, distribuent les rôles, gèrent le temps, font ranger.', 'Animent aussi une partie de l\'accueil et du retour.'],
        ['**Direction**', 'Autorise le projet, confirme les locaux et l\'horaire de la TES.', 'Reçoit le bilan et décide de la suite.'],
      ], { col1: C.vertPale }),
      espace(160),
      encadre([
        p([t('La TES n\'est pas une surveillante', { bold: true, size: 24, color: C.vert })], { spacing: { after: 80 } }),
        para('Son rôle évolue avec les élèves. Elle **installe** les routines, puis elle **coache** en retrait. Quand l\'autonomie le permet, elle **anime ses propres ateliers ciblés** en petits groupes. Le fait qu\'elle intervienne de moins en moins pendant les ateliers montre que l\'autonomie progresse.', { spacing: { after: 60 } }),
      ], C.vertPale, C.vert),

      // ── 6
      h1('6. Échéancier'),
      h2('Les trois périodes'),
      para('On passe d\'une période à l\'autre quand on observe les signes de réussite, et non à une date fixe.'),
      periodes,
      h2('Démarrage du projet'),
      demarrage,

      // ── 7
      h1('7. Ressources et coûts'),
      tableau([2300, 7060], ['Ressource', 'Détail'], [
        ['**Ressources humaines**', 'Enseignante du Z101, TES préventive, orthopédagogue, conseillère pédagogique. **Aucune embauche.**'],
        ['**Horaire de la TES**', 'Présente pendant les matinées d\'ateliers (8 h 30 à 11 h 45), selon l\'horaire d\'intervention déjà prévu au guide d\'organisation.'],
        ['**Locaux**', 'Classe du Z101 pour l\'enseignement direct. Plateaux cuisine et grenier pour les ateliers.'],
        ['**Matériel**', 'Fiches de tâches plastifiées, registre d\'autonomie, chariots TEACCH partagés avec l\'alpha-pré et la DAP.'],
        ['**Coût supplémentaire**', 'Aucun salaire supplémentaire. Matériel : impression et plastification des fiches.'],
      ], { col1: C.vertPale }),

      // ── 8
      h1('8. Fondements : les quatre besoins de l\'engagement'),
      para('L\'engagement, c\'est **la décision de participer activement**. Il se nourrit de **quatre besoins**, et la formule a été pensée pour nourrir chacun d\'eux.'),
      tableau([2500, 6860], ['Besoin', 'Comment la formule le nourrit'], [
        [[pc('**Sentiment de compétence**'), p([t('Défi optimal, rétroaction de qualité, progression visible', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'Des fiches courtes adaptées au niveau de l\'élève. Des critères de réussite connus d\'avance. Des étapes validées au registre : l\'élève voit ses progrès.'],
        [[pc('**Autonomie**'), p([t('Choix, voix et participation, contrôle sur la tâche', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'L\'élève choisit sa tâche et s\'inscrit au registre. Il prend la parole comme leader. Il règle ses blocages avec la règle « 3 avant l\'enseignante ».'],
        [[pc('**Sens**'), p([t('Utilité, but personnel, transfert', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'Des tâches de la vraie vie : cuisiner, gérer un inventaire, faire un budget, choisir un logement. Ce qui est appris sert dès maintenant.'],
        [[pc('**Sentiment d\'appartenance**'), p([t('Relations positives, climat sécurisant, temps de qualité', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'Équipes mixtes, entraide et leader tournant : chaque élève compte pour son équipe. Les ateliers en petits groupes offrent du temps de qualité avec un adulte.'],
      ], { col1: C.vertPale }),
      note('Cadre de référence : affiche « L\'engagement » d\'Isabelle Pedneault (CC BY-NC-SA 4.0).'),

      // ── 9
      h1('9. Risques et mesures prévues'),
      tableau([3000, 6360], ['Risque ou préoccupation', 'Mesure prévue'], [
        ['**Des périodes vides à l\'horaire**', 'Chaque bloc est planifié au tableau de programmation : l\'élève est soit avec l\'enseignante, soit en atelier guidé par une fiche.'],
        ['**Le besoin d\'embaucher une ressource**', 'L\'équipe est déjà en place. La TES, l\'orthopédagogue et la CP ont des rôles définis dans le projet.'],
        ['**Le désengagement observé l\'an dernier**', 'Après vérification, il s\'explique par des cas très particuliers propres à la cohorte de l\'an dernier. Cette année, les élèves sont très participatifs. La formule est aussi plus structurée : fiches, leader, registre et transition planifiée vers l\'autonomie.'],
        ['**La TES utilisée comme surveillante**', 'Son rôle évolue de l\'accompagnement vers l\'animation d\'ateliers ciblés (section 5). Ses interventions en atelier sont suivies et doivent diminuer.'],
        ['**Un leader qui fait tout le travail**', 'Le rôle tourne à chaque atelier. La fiche précise les tâches de chacun et tous les membres signent l\'auto-évaluation.'],
        ['**Des élèves qui s\'essoufflent**', 'Fiches courtes et visuelles, ajustées par l\'orthopédagogue. La TES repère les signes d\'anxiété dès l\'accueil.'],
        ['**La formule ne fonctionne pas**', 'Bilan à la fin de la période d\'ancrage. Si les indicateurs ne sont pas au rendez-vous, on ajuste ou on revient à la formule actuelle.'],
      ], { col1: C.grisPale }),

      // ── 10
      h1('10. Évaluation et suivi'),
      tableau([2700, 2860, 1900, 1900], ['Indicateur', 'Cible', 'Outil', 'Moment'], [
        ['**Rétention des élèves**', '100 % des 24 élèves toujours inscrits', 'Liste de présence', 'Chaque bilan'],
        ['**Présence**', 'Stable ou en hausse', 'Liste de présence', 'Chaque semaine'],
        ['**Tâches réalisées en autonomie**', 'En hausse d\'une période à l\'autre', 'Registre d\'autonomie', 'Chaque semaine'],
        ['**Interventions de la TES en atelier**', 'En baisse d\'une période à l\'autre', 'Grille d\'observation de la TES', 'Chaque semaine'],
        ['**Rôle de leader**', 'Chaque élève l\'a exercé au moins une fois par période', 'Registre d\'autonomie', 'Fin de période'],
        ['**Poursuite en PPS**', 'Inscription en année 2', 'Inscriptions', 'Fin de l\'année'],
      ], { col1: C.vertPale }),

      // ── 11
      h1('11. Retombées et transférabilité'),
      puce('**Pour les élèves :** une place au moment où ils sont prêts, plus d\'autonomie, de leadership et d\'estime de soi.'),
      puce('**Pour le centre :** des élèves qui poursuivent en PPS, une meilleure réponse aux références de la FBC, et une utilisation optimale des ressources existantes.'),
      puce('**Pour d\'autres services :** une formule où la collaboration est au cœur de l\'apprentissage, qui pourrait s\'appliquer en **alpha-pré**, en **francisation**, à la **FBC** et ailleurs au centre.'),

      // ── 12
      h1('12. Décision demandée et prochaines étapes'),
      para('Nous demandons à la table des directions :'),
      num('**De rouvrir les inscriptions au Z101** pour accueillir les 9 élèves en attente.'),
      num('**D\'autoriser la formule en deux sous-groupes** à titre de projet pilote, avec l\'équipe déjà en place.'),
      num('**De confirmer les locaux et l\'horaire de la TES** pour les matinées d\'ateliers.'),
      num('**De recevoir un bilan** à la fin de la période d\'ancrage.'),
      para('Dès l\'acceptation, l\'équipe peut contacter les élèves et démarrer selon l\'échéancier de la section 6.'),
      espace(160),
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

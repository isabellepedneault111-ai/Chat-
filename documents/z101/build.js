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

// Menu du matin : horaire réel en trois périodes d'une heure
const hW = [1500, 1300, 3280, 3280];
const SG1 = 'Sous-groupe 1 : PPS pur';
const SG2 = 'Sous-groupe 2';
const Z = { c: '**Z101** avec Mme Lisa', f: C.bleuPale };
const AE = { c: '**Atelier exploratoire** avec fiche de tâche et équipe de leaders', f: C.vertPale };
const hRow = (heure, per, a, b) => new TableRow({ cantSplit: true, children: [
  cell(`**${heure}**`, hW[0], { fill: C.grisPale }), cell(per, hW[1], { fill: C.grisPale }), cell(a.c, hW[2], { fill: a.f }), cell(b.c, hW[3], { fill: b.f }),
] });
const hAll = (heure, per, s, fill) => new TableRow({ cantSplit: true, children: [
  cell(`**${heure}**`, hW[0], { fill: C.grisPale }), cell(per, hW[1], { fill: C.grisPale }), cell(s, hW[2] + hW[3], { span: 2, fill }),
] });
const horaire = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: hW, layout: TableLayoutType.FIXED, borders: grid,
  rows: [
    new TableRow({ tableHeader: true, children: [enTete('Heure', hW[0]), enTete('Période', hW[1]), enTete(SG1, hW[2]), enTete(SG2, hW[3])] }),
    hAll('8 h 25 à 9 h 00', '**Période 1**', '**Tout le groupe :** accueil et rassemblement, présentation du menu du matin, formation des équipes de leaders.', C.jaunePale),
    hRow('9 h 00 à 9 h 25', '**Période 1**', Z, { c: '**Atelier exploratoire :** démarrage rapide. Le leader lit la fiche et distribue les rôles.', f: C.vertPale }),
    hAll('9 h 25 à 9 h 35', 'Pause', 'Pause de 10 minutes', 'FFFFFF'),
    hRow('9 h 35 à 10 h 35', '**Période 2**', Z, AE),
    hAll('10 h 35 à 10 h 45', 'Pause', 'Pause de 10 minutes. Les sous-groupes changent de place.', 'FFFFFF'),
    hRow('10 h 45 à 11 h 45', '**Période 3**', AE, Z),
  ],
});
const tempsTotal = tableau([3120, 3120, 3120], ['', 'Temps en Z101', 'Temps en atelier exploratoire'], [
  ['**' + SG1 + '**', '**1 h 25** (9 h 00 à 10 h 35)', '1 h (10 h 45 à 11 h 45)'],
  ['**' + SG2 + '**', '1 h (10 h 45 à 11 h 45)', '**1 h 25** (9 h 00 à 10 h 35)'],
], { col1: C.grisPale });

// Qui fait quoi à chaque moment : moment | enseignante | TES | leaders
const mW = [1560, 2600, 2600, 2600];
const mRow = (heure, moment, ens, tes, lead, fill) => new TableRow({ cantSplit: true, children: [
  cell([p([t(heure, { bold: true, color: C.marine })], { spacing: { after: 0 } }), p([t(moment, { size: 19, color: C.gris })], { spacing: { after: 0 } })], mW[0], { fill: C.grisPale }),
  cell(ens, mW[1], { fill }), cell(tes, mW[2], { fill }), cell(lead, mW[3], { fill }),
] });
const menu = (rows) => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: mW, layout: TableLayoutType.FIXED, borders: grid,
  rows: [new TableRow({ tableHeader: true, children: ['Moment', 'L\'enseignante (Mme Lisa)', 'La TES', 'Les leaders'].map((l, i) => enTete(l, mW[i])) }), ...rows] });
const menu12 = menu([
  mRow('8 h 25', 'Accueil', 'Présente le menu du matin et les objectifs du jour.', 'Accueille les élèves un à un. Repère les signes d\'anxiété et prévient les difficultés.', 'Reçoivent leur rôle et leur atelier. Chaque élève inscrit sa tâche au registre d\'autonomie.', C.jaunePale),
  mRow('9 h 00 à 10 h 35', 'Périodes 1 et 2', 'Enseigne le Z101 au sous-groupe PPS pur. **Circule** aussi vers les ateliers pour s\'assurer de leur bon fonctionnement. En atelier, on applique « 3 avant l\'enseignante ».', 'Accompagne le sous-groupe 2 en atelier exploratoire : soutient discrètement les leaders, aide à régler les blocages, offre des pauses de régulation.', 'Lisent la fiche à voix haute, distribuent les rôles, gèrent le temps, donnent la parole à chacun.'),
  mRow('10 h 35', 'Pause et changement', 'Accueille le sous-groupe 2.', 'Encadre le changement de place pour qu\'il se fasse calmement.', 'Passent en revue les critères de réussite et font ranger le poste.', C.grisPale),
  mRow('10 h 45 à 11 h 45', 'Période 3', 'Enseigne le Z101 au sous-groupe 2. **Circule** vers les ateliers. Valide le registre d\'autonomie.', 'Accompagne le sous-groupe PPS pur en atelier exploratoire, comme aux périodes 1 et 2.', 'Un nouveau leader prend le relais pour le sous-groupe PPS pur.'),
]);
const menu3 = menu([
  mRow('8 h 25', 'Accueil', 'Annonce qui participe aux sous-groupes de besoins du jour.', 'Annonce qui participe à ses ateliers ciblés du jour.', 'Animent une partie de l\'accueil, par exemple la météo d\'équipe.', C.jaunePale),
  mRow('9 h 00 à 11 h 45', 'Périodes 1, 2 et 3', 'Garde le même horaire de Z101 et **anime des ateliers en sous-groupes de besoins** : de petits groupes formés selon les difficultés observées.', '**Anime des ateliers ciblés en petits groupes** : habiletés de vie, gestion des émotions, préparation à l\'emploi. Les ateliers exploratoires fonctionnent sans elle.', 'Font fonctionner les ateliers exploratoires de façon autonome, avec la fiche et le registre.'),
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
      new TableCell({ ...{}, children: [p([t('Étape 1 : ancrage', { bold: true, color: 'FFFFFF', size: 22 })], { spacing: { after: 0 } }), p([t('On installe', { color: 'FFFFFF', size: 18 })], { spacing: { after: 0 } })], width: { size: pW[1], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.marine }, margins: { top: 100, bottom: 100, left: 140, right: 140 } }),
      new TableCell({ children: [p([t('Étape 2 : consolidation', { bold: true, color: 'FFFFFF', size: 22 })], { spacing: { after: 0 } }), p([t('On renforce', { color: 'FFFFFF', size: 18 })], { spacing: { after: 0 } })], width: { size: pW[2], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.marine }, margins: { top: 100, bottom: 100, left: 140, right: 140 } }),
      new TableCell({ children: [p([t('Étape 3 : autonomie', { bold: true, color: 'FFFFFF', size: 22 })], { spacing: { after: 0 } }), p([t('On différencie', { color: 'FFFFFF', size: 18 })], { spacing: { after: 0 } })], width: { size: pW[3], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.marine }, margins: { top: 100, bottom: 100, left: 140, right: 140 } }),
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
      'Présente dans les ateliers. Modélise le rôle de leader, sécurise les transitions, repère les signes d\'anxiété.',
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
  ['**Semaine 0**', 'Formation des deux sous-groupes : PPS pur et sous-groupe 2. Préparation des premières fiches de tâches et du registre.', 'Enseignante, orthopédagogue, CP'],
  ['**Semaine 1**', 'Début de la étape d\'ancrage avec les 24 élèves.', 'Enseignante, TES'],
  ['**Fin de l\'ancrage**', 'Premier bilan à partir des indicateurs (section 11). Décision : poursuivre, ajuster ou revenir au groupe unique.', 'CP, direction'],
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
        ['Solution', 'Accueillir les 24 élèves en **deux sous-groupes** qui alternent entre le Z101 avec l\'enseignante et des ateliers exploratoires structurés. Les élèves en PPS pur, qui ont besoin de plus de soutien, ont plus de temps en Z101.'],
        ['Clientèle', 'Élèves adultes du programme Participation sociale (PPS), dont plusieurs référés par des enseignantes de la FBC.'],
        ['Équipe', 'Enseignante du Z101, TES préventive, orthopédagogue et conseillère pédagogique. Tous déjà en poste.'],
        ['Coût', '**Aucune embauche.** Matériel : fiches plastifiées et chariots TEACCH partagés avec l\'alpha-pré et la DAP.'],
        ['Durée', 'Projet pilote à partir de l\'acceptation, en trois étapes, avec un premier bilan à la fin de la étape d\'ancrage.'],
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
        ['**Innovation**', 'La formule peut devenir un modèle pour d\'autres services du centre (section 12).'],
      ], { col1: C.vertPale }),

      // ── 2
      h1('2. Objectifs du projet'),
      para('**Objectif général :** accueillir les 9 élèves en attente au Z101 et développer l\'autonomie de tous les élèves du groupe, sans embauche ni période vide.'),
      h2('Objectifs spécifiques'),
      num('**Retenir** les 24 élèves pendant le projet pilote, dans un environnement sécurisant.'),
      num('**Développer l\'autonomie** des élèves en atelier, au point où les adultes peuvent enseigner de façon ciblée (étape 3).'),
      num('**Soutenir l\'engagement** en nourrissant les quatre besoins : compétence, autonomie, sens et appartenance.'),
      num('**Documenter la formule** pour évaluer si elle peut s\'appliquer ailleurs au centre.'),

      // ── 3
      h1('3. Description de la formule'),
      para('Les 24 élèves forment **deux sous-groupes**. Le **sous-groupe 1** réunit les élèves en **PPS pur**, qui ont généralement besoin de plus de soutien : ils reçoivent donc plus de temps en Z101. Le **sous-groupe 2** réunit les autres élèves.'),
      para('Pendant que l\'un des sous-groupes est en **Z101 avec l\'enseignante**, l\'autre est en **atelier exploratoire**, guidé par une fiche de tâche et une équipe de leaders. Les sous-groupes changent de place à la troisième période. Chaque élève est donc toujours en apprentissage encadré.'),
      h2('Les outils qui rendent les élèves autonomes'),
      puce('**Fiches de tâches autonomes :** une tâche par fiche, de 1 à 5 étapes illustrées, et des critères de réussite pour s\'auto-évaluer.'),
      puce('**Leader tournant :** à chaque atelier, un élève lit la fiche, distribue les rôles et gère le temps. Le rôle tourne pour que chacun l\'exerce.'),
      puce('**Registre d\'autonomie :** chaque élève y inscrit sa tâche en début de matinée, le leader valide les étapes et l\'enseignante fait la validation finale.'),
      puce('**Règle « 3 avant l\'enseignante » :** relire la fiche, demander à un coéquipier, essayer une autre solution.'),
      puce('**Deux lieux d\'ateliers exploratoires :** le grenier de Maria, juste à côté de la classe de Mme Lisa, et le local d\'arts plastiques, un grand local actuellement libre.'),
      puce('**Chariots TEACCH :** postes de travail visuels et structurés, partagés avec l\'alpha-pré et la DAP.'),
      puce('**Tableau de programmation :** chaque bloc de la matinée est planifié et affiché. Aucun moment n\'est laissé vide.'),

      // ── 4
      h1('4. Le menu du matin'),
      para('La matinée compte **trois périodes d\'une heure**, séparées par deux pauses de 10 minutes.'),
      horaire,
      espace(140),
      tempsTotal,
      h2('Qui fait quoi pendant la matinée (étapes 1 et 2)'),
      menu12,
      h2('Étape 3 : quand l\'autonomie est acquise'),
      para('L\'horaire reste le même. Quand les élèves fonctionnent seuls en atelier et que la gestion de classe le permet, les adultes n\'ont plus besoin d\'accompagner les ateliers. Ils enseignent alors de façon ciblée.'),
      menu3,

      // ── Leaders
      h1('5. Le rôle des leaders'),
      para('Le leader n\'est pas un chef qui fait tout. C\'est un **facilitateur** qui assure la cohésion de son équipe, pour que l\'enseignante puisse enseigner sans être interrompue.'),
      tableau([2100, 7260], ['Moment', 'Ce que fait le leader'], [
        ['**Au début**', 'Rassemble l\'équipe autour de la table. Lit la fiche de tâche lentement, à voix haute. Vérifie que chacun a son matériel.'],
        ['**Pendant**', 'Distribue la parole pour que les plus timides s\'expriment. Gère le temps (« Il nous reste 10 minutes »). Règle les blocages avec la règle « 3 avant l\'enseignante ».'],
        ['**À la fin**', 'Passe en revue les critères de réussite avec l\'équipe. Fait ranger le matériel. Valide les étapes au registre par ses initiales, avant la validation finale de l\'enseignante.'],
      ], { col1: C.vertPale }),
      h2('Les tâches selon le lieu'),
      tableau([2100, 7260], ['Lieu', 'Responsabilités du leader'], [
        ['**Grenier de Maria**', 'Organise le tri, l\'inventaire et la manutention sécuritaire. Répartit les tâches de logistique. Assure le contrôle de la qualité.'],
        ['**Local d\'arts plastiques**', 'Distribue le matériel, fait respecter les consignes de sécurité et veille au rangement du local à la fin de l\'atelier.'],
      ], { col1: C.vertPale }),
      h2('Comment on choisit les leaders'),
      puce('**Rotation :** chaque élève occupe le rôle au moins une fois par étape.'),
      puce('**Volontariat encouragé :** priorité aux élèves qui veulent développer leur leadership.'),
      puce('**Jumelage :** un leader plus réservé peut être jumelé à un co-leader de soutien.'),
      puce('**Soutien de la TES :** elle conseille discrètement le leader pour renforcer sa posture.'),

      // ── 5
      h1('6. Rôles et responsabilités'),
      tableau([2100, 3630, 3630], ['Personne', 'Étapes 1 et 2', 'Étape 3'], [
        ['**Enseignante**\nPilote pédagogique', 'Enseigne le Z101 à chaque sous-groupe et **circule** vers les ateliers pour s\'assurer de leur bon fonctionnement. Planifie, évalue et valide le registre. Présente les outils d\'autonomie.', 'Enseigne le Z101 et **anime des ateliers en sous-groupes de besoins** pendant que les autres travaillent en autonomie.'],
        ['**TES préventive**\nTransition vers l\'autonomie', 'Accompagne le sous-groupe en atelier : modélise le rôle de leader, aide à régler les blocages, soutient l\'autorégulation, encadre les transitions.', '**Anime des ateliers ciblés en petits groupes** : habiletés de vie, gestion des émotions, préparation à l\'emploi. Elle a déjà donné son accord.'],
        ['**Orthopédagogue**', 'Conçoit les boîtes TEACCH. Adapte les fiches et le matériel aux besoins des élèves.', 'Ajuste le matériel selon les besoins observés.'],
        ['**Conseillère pédagogique**', 'Accompagne l\'équipe dans l\'implantation. Assure la conformité au programme. Prépare les outils de suivi.', 'Analyse les indicateurs, rédige le bilan et la recommandation.'],
        ['**Élèves leaders**', 'Lisent la fiche, distribuent les rôles, gèrent le temps, font ranger.', 'Animent aussi une partie de l\'accueil.'],
        ['**Direction**', 'Autorise le projet, confirme les locaux et l\'horaire de la TES.', 'Reçoit le bilan et décide de la suite.'],
      ], { col1: C.vertPale }),
      espace(160),
      encadre([
        p([t('La TES n\'est pas une surveillante', { bold: true, size: 24, color: C.vert })], { spacing: { after: 80 } }),
        para('Son rôle évolue avec les élèves. Elle **installe** les routines, puis elle **coache** en retrait. Quand l\'autonomie le permet, elle **anime ses propres ateliers ciblés** en petits groupes. Le fait qu\'elle intervienne de moins en moins pendant les ateliers montre que l\'autonomie progresse.', { spacing: { after: 60 } }),
      ], C.vertPale, C.vert),

      // ── 6
      h1('7. Échéancier'),
      h2('Les trois étapes'),
      para('Le projet se déroule en trois étapes. On passe d\'une étape à l\'autre quand on observe les signes de réussite.'),
      periodes,
      h2('Démarrage du projet'),
      demarrage,

      // ── 7
      h1('8. Ressources et coûts'),
      tableau([2300, 7060], ['Ressource', 'Détail'], [
        ['**Ressources humaines**', 'Enseignante du Z101, TES préventive, orthopédagogue, conseillère pédagogique. **Aucune embauche.**'],
        ['**Horaire de la TES**', 'Présente pendant les matinées d\'ateliers, de 8 h 25 à 11 h 45. Sa présence a déjà été validée.'],
        ['**Locaux**', 'Classe de Mme Lisa pour le Z101. Pour les ateliers exploratoires : le grenier de Maria, juste à côté de la classe, et le local d\'arts plastiques, un grand local actuellement libre.'],
        ['**Matériel**', 'Fiches de tâches plastifiées, registre d\'autonomie, chariots TEACCH partagés avec l\'alpha-pré et la DAP.'],
        ['**Coût supplémentaire**', 'Aucun salaire supplémentaire. Matériel : impression et plastification des fiches.'],
      ], { col1: C.vertPale }),

      // ── 8
      h1('9. Fondements : les quatre besoins de l\'engagement'),
      para('L\'engagement, c\'est **la décision de participer activement**. Il se nourrit de **quatre besoins**, et la formule a été pensée pour nourrir chacun d\'eux.'),
      tableau([2500, 6860], ['Besoin', 'Comment la formule le nourrit'], [
        [[pc('**Sentiment de compétence**'), p([t('Défi optimal, rétroaction de qualité, progression visible', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'Des fiches courtes adaptées au niveau de l\'élève. Des critères de réussite connus d\'avance. Des étapes validées au registre : l\'élève voit ses progrès.'],
        [[pc('**Autonomie**'), p([t('Choix, voix et participation, contrôle sur la tâche', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'L\'élève choisit sa tâche et s\'inscrit au registre. Il prend la parole comme leader. Il règle ses blocages avec la règle « 3 avant l\'enseignante ».'],
        [[pc('**Sens**'), p([t('Utilité, but personnel, transfert', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'Des tâches de la vraie vie : trier, gérer un inventaire, créer, faire un budget, choisir un logement. Ce qui est appris sert dès maintenant.'],
        [[pc('**Sentiment d\'appartenance**'), p([t('Relations positives, climat sécurisant, temps de qualité', { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })],
          'Équipes mixtes, entraide et leader tournant : chaque élève compte pour son équipe. Les ateliers en petits groupes offrent du temps de qualité avec un adulte.'],
      ], { col1: C.vertPale }),
      note('Cadre de référence : affiche « L\'engagement » d\'Isabelle Pedneault (CC BY-NC-SA 4.0).'),

      // ── 9
      h1('10. Risques et mesures prévues'),
      tableau([3000, 6360], ['Risque ou préoccupation', 'Mesure prévue'], [
        ['**Des périodes vides à l\'horaire**', 'Chaque bloc est planifié au tableau de programmation : l\'élève est soit avec l\'enseignante, soit en atelier guidé par une fiche.'],
        ['**Le besoin d\'embaucher une ressource**', 'L\'équipe est déjà en place. La TES, l\'orthopédagogue et la CP ont des rôles définis dans le projet.'],
        ['**Le désengagement observé l\'an dernier**', 'Après vérification, il s\'explique par des cas très particuliers propres à la cohorte de l\'an dernier. Cette année, les élèves sont très participatifs. La formule est aussi plus structurée : fiches, leader, registre et transition planifiée vers l\'autonomie.'],
        ['**La TES utilisée comme surveillante**', 'Son rôle évolue de l\'accompagnement vers l\'animation d\'ateliers ciblés (section 6). Ses interventions en atelier sont suivies et doivent diminuer.'],
        ['**Des ateliers dans deux locaux en même temps**', 'Le grenier de Maria est juste à côté de la classe de Mme Lisa. L\'enseignante circule pour s\'assurer du bon fonctionnement des ateliers, et la TES les accompagne aux étapes 1 et 2.'],
        ['**Un leader qui fait tout le travail**', 'Le rôle tourne à chaque atelier. La fiche précise les tâches de chacun et tous les membres signent l\'auto-évaluation.'],
        ['**Des élèves qui s\'essoufflent**', 'Fiches courtes et visuelles, ajustées par l\'orthopédagogue. La TES repère les signes d\'anxiété dès l\'accueil.'],
        ['**La formule ne fonctionne pas**', 'Bilan à la fin de la étape d\'ancrage. Si les indicateurs ne sont pas au rendez-vous, on ajuste ou on revient à la formule actuelle.'],
      ], { col1: C.grisPale }),

      // ── 10
      h1('11. Évaluation et suivi'),
      tableau([2700, 2860, 1900, 1900], ['Indicateur', 'Cible', 'Outil', 'Moment'], [
        ['**Rétention des élèves**', '100 % des 24 élèves toujours inscrits', 'Liste de présence', 'Chaque bilan'],
        ['**Présence**', 'Stable ou en hausse', 'Liste de présence', 'Chaque semaine'],
        ['**Tâches réalisées en autonomie**', 'En hausse d\'une étape à l\'autre', 'Registre d\'autonomie', 'Chaque semaine'],
        ['**Interventions de la TES en atelier**', 'En baisse d\'une étape à l\'autre', 'Grille d\'observation de la TES', 'Chaque semaine'],
        ['**Rôle de leader**', 'Chaque élève l\'a exercé au moins une fois par étape', 'Registre d\'autonomie', 'Fin d\'étape'],
        ['**Poursuite en PPS**', 'Inscription en année 2', 'Inscriptions', 'Fin de l\'année'],
      ], { col1: C.vertPale }),

      // ── 11
      h1('12. Retombées et transférabilité'),
      puce('**Pour les élèves :** une place au moment où ils sont prêts, plus d\'autonomie, de leadership et d\'estime de soi.'),
      puce('**Pour le centre :** des élèves qui poursuivent en PPS, une meilleure réponse aux références de la FBC, et une utilisation optimale des ressources existantes.'),
      puce('**Pour d\'autres services :** une formule où la collaboration est au cœur de l\'apprentissage, qui pourrait s\'appliquer en **alpha-pré**, en **francisation**, à la **FBC** et ailleurs au centre.'),

      // ── 12
      h1('13. Décision demandée et prochaines étapes'),
      para('Nous demandons à la table des directions :'),
      num('**De rouvrir les inscriptions au Z101** pour accueillir les 9 élèves en attente.'),
      num('**D\'autoriser la formule en deux sous-groupes** à titre de projet pilote, avec l\'équipe déjà en place.'),
      num('**De confirmer les locaux et l\'horaire de la TES** pour les matinées d\'ateliers.'),
      num('**De recevoir un bilan** à la fin de la étape d\'ancrage.'),
      para('Dès l\'acceptation, l\'équipe peut contacter les élèves et démarrer selon l\'échéancier de la section 7.'),
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

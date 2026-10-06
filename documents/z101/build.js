// Génère Projet-Z101.docx : node build.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  ShadingType, AlignmentType, HeadingLevel, BorderStyle, LevelFormat, Footer,
  PageNumber, TableLayoutType, VerticalAlign, TableOfContents, PageBreak,
} = require('docx');

// Palette sobre : marine institutionnel, vert foncé en accent, gris neutres
const C = {
  marine: '1D3557', marine2: '2C4A75', vert: '2F7A2A', encre: '1A1D24', gris: '596273',
  ligne: 'C9CFD8', fond: 'F2F4F7', blanc: 'FFFFFF', pale: 'D6DEEA', ciel: '8FB5E8',
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
const pc = (s, o = {}) => p(rich(s, o), { spacing: serre });
const puce = (s) => new Paragraph({ children: rich(s), numbering: { reference: 'puces', level: 0 }, spacing: { after: 80, line: 276 } });
const num = (s) => new Paragraph({ children: rich(s), numbering: { reference: 'nums', level: 0 }, spacing: { after: 80, line: 276 } });
const h1 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s)], spacing: { before: 400, after: 160 }, keepNext: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.marine, space: 4 } } });
const h2 = (s) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(s)], spacing: { before: 240, after: 100 }, keepNext: true });
const note = (s) => p([t(s, { size: 18, italics: true, color: C.gris })], { spacing: { before: 60, after: 120 } });
const espace = (n = 160) => new Paragraph({ children: [], spacing: { after: n } });
const saut = () => new Paragraph({ children: [new PageBreak()] });

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const fine = { style: BorderStyle.SINGLE, size: 4, color: C.ligne };
const grid = { top: fine, bottom: fine, left: fine, right: fine, insideHorizontal: fine, insideVertical: fine };

const cell = (content, width, o = {}) => new TableCell({
  children: typeof content === 'string' ? content.split('\n').map(x => pc(x, o.run)) : content,
  width: { size: width, type: WidthType.DXA },
  columnSpan: o.span,
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  verticalAlign: o.v || VerticalAlign.TOP,
  borders: o.borders,
});
const enTete = (s, width) => cell([p([t(s, { bold: true, color: C.blanc, size: 20 })], { spacing: { after: 0 } })], width, { fill: C.marine });
const etiquette = (s, width) => cell(s, width, { run: { color: C.marine } }); // 1re colonne en marine

// Tableau générique : en-tête marine, première colonne en marine
const tableau = (widths, head, rows) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, borders: grid,
  rows: [
    new TableRow({ tableHeader: true, children: head.map((h, i) => enTete(h, widths[i])) }),
    ...rows.map(r => new TableRow({ cantSplit: true, children: r.map((c, i) => i === 0 && typeof c === 'string' ? etiquette(c, widths[i]) : cell(c, widths[i])) })),
  ],
});

// Encadré : barre marine à gauche, fond blanc
const encadre = (titre, lignes) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [W], layout: TableLayoutType.FIXED,
  rows: [new TableRow({ cantSplit: true, children: [new TableCell({
    children: [p([t(titre, { bold: true, size: 24, color: C.marine })], { spacing: { after: 80 } }), ...lignes.map(l => para(l, { spacing: { after: 80, line: 276 } }))],
    width: { size: W, type: WidthType.DXA }, margins: { top: 160, bottom: 100, left: 280, right: 240 },
    borders: { ...noBorders, left: { style: BorderStyle.SINGLE, size: 36, color: C.marine } },
  })] })],
});

// ── Page couverture : bandeau marine et chiffres clés
const q = W / 4;
const chiffre = (n, l) => cell([
  p([t(n, { bold: true, size: 64, color: C.blanc })], { spacing: { after: 0, line: 240 } }),
  p([t(l, { size: 19, color: C.pale })], { spacing: { after: 0, line: 252 } }),
], q, { fill: C.marine2, borders: { ...noBorders, top: { style: BorderStyle.SINGLE, size: 12, color: C.ciel } } });
const bandeau = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: [q, q, q, q], layout: TableLayoutType.FIXED,
  borders: { ...noBorders, insideHorizontal: NONE, insideVertical: NONE },
  rows: [
    new TableRow({ children: [new TableCell({
      columnSpan: 4, width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.marine },
      margins: { top: 480, bottom: 360, left: 400, right: 400 }, borders: noBorders,
      children: [
        p([t('PRÉSENTATION DE PROJET', { size: 18, bold: true, color: C.ciel, characterSpacing: 40 })], { spacing: { after: 160 } }),
        p([t('Projet PPS Z101', { size: 64, bold: true, color: C.blanc })], { spacing: { after: 80, line: 240 } }),
        p([t('Accueillir 9 élèves de plus grâce à une formule en deux sous-groupes', { size: 30, color: C.blanc })], { spacing: { after: 280 } }),
        p([t('Table des directions · Octobre 2026', { size: 20, color: C.pale })], { spacing: { after: 0 } }),
        p([t('Préparé par la conseillère pédagogique, secteur PPS, CFGA', { size: 20, color: C.pale })], { spacing: { after: 0 } }),
      ],
    })] }),
    new TableRow({ children: [
      chiffre('15', 'élèves inscrits au Z101'), chiffre('9', 'élèves en attente d\'une place'),
      chiffre('24', 'élèves accueillis avec la formule'), chiffre('2', 'matinées par semaine'),
    ] }),
  ],
});

// ── Horaire d'une matinée : heure | période | PPS pur | concomitance
const hW = [1700, 1160, 3250, 3250];
const z101 = () => ({ c: '**Z101** avec Mme Lisa', run: { color: C.marine } });
const atelier = (tes) => ({ c: tes ? '**Atelier exploratoire avec la TES**' : '**Atelier exploratoire** en autonomie', run: { color: C.vert } });
const hRow = (heure, per, a, b) => new TableRow({ cantSplit: true, children: [
  cell(`**${heure}**`, hW[0], { fill: C.fond }), cell(per, hW[1], { fill: C.fond }), cell(a.c, hW[2], { run: a.run }), cell(b.c, hW[3], { run: b.run }),
] });
const hTous = (heure, per, s) => new TableRow({ cantSplit: true, children: [
  cell(`**${heure}**`, hW[0], { fill: C.fond }), cell(per, hW[1], { fill: C.fond }), cell(s, hW[2] + hW[3], { span: 2 }),
] });
const horaire = (jour, m) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: hW, layout: TableLayoutType.FIXED, borders: grid,
  rows: [
    new TableRow({ tableHeader: true, children: [enTete(jour, hW[0]), enTete('Période', hW[1]), enTete('Élèves en PPS pur', hW[2]), enTete('Élèves en concomitance', hW[3])] }),
    hTous('8 h 25 à 9 h 00', 'P1', '**Tout le groupe :** rassemblement, présentation du menu du matin, formation des équipes de leaders.'),
    hRow('9 h 00 à 9 h 25', 'P1', m.a, m.b),
    hTous('9 h 25 à 9 h 35', 'Pause', 'Pause de 10 minutes'),
    hRow('9 h 35 à 10 h 35', 'P2', m.a, m.b),
    hTous('10 h 35 à 10 h 45', 'Pause', 'Pause de 10 minutes et changement de lieu'),
    hRow('10 h 45 à 11 h 45', 'P3', m.c, m.d),
  ],
});
const mardi = horaire('Mardi', { a: z101(), b: atelier(false), c: atelier(true), d: z101() });
const jeudi = horaire('Jeudi', { a: atelier(true), b: z101(), c: z101(), d: atelier(false) });

// Qui fait quoi : moment | enseignante | TES | leaders
const mW = [1860, 2500, 2500, 2500];
const qRow = (moment, ens, tes, lead) => new TableRow({ cantSplit: true, children: [etiquette(moment, mW[0]), cell(ens, mW[1]), cell(tes, mW[2]), cell(lead, mW[3])] });
const quiFait = (rows) => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: mW, layout: TableLayoutType.FIXED, borders: grid,
  rows: [new TableRow({ tableHeader: true, children: ['Moment', 'L\'enseignante (Mme Lisa)', 'La TES (Janie-Lee)', 'Les leaders'].map((l, i) => enTete(l, mW[i])) }), ...rows] });

// Trois étapes
const eW = [1740, 2540, 2540, 2540];
const eRow = (label, a, b, c) => new TableRow({ cantSplit: true, children: [etiquette(`**${label}**`, eW[0]), cell(a, eW[1]), cell(b, eW[2]), cell(c, eW[3])] });
const etapes = new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: eW, layout: TableLayoutType.FIXED, borders: grid,
  rows: [
    new TableRow({ tableHeader: true, children: [enTete('', eW[0]), enTete('Étape 1 : ancrage', eW[1]), enTete('Étape 2 : consolidation', eW[2]), enTete('Étape 3 : autonomie', eW[3])] }),
    eRow('Objectif', 'Installer les routines, la cohésion des équipes et les outils d\'autonomie.', 'Intensifier les ateliers exploratoires et suivre les progrès de près.', 'Les élèves fonctionnent seuls en atelier. Les adultes enseignent de façon ciblée.'),
    eRow('Enseignante', 'Enseigne le Z101. Présente les fiches de tâches, le registre et le rôle de leader. Circule vers les ateliers.', 'Enseigne le Z101. Ajuste les fiches de tâches selon ce qu\'elle observe. Circule vers les ateliers.', 'Enseigne le Z101 et **anime des ateliers en sous-groupes de besoins**, pendant que les autres élèves travaillent en autonomie.'),
    eRow('TES', 'Accompagne les élèves en PPS pur en atelier. Modélise le rôle de leader et sécurise les transitions.', 'Fait du coaching en retrait. Conseille le leader, intervient aux moments critiques, soutient l\'autorégulation.', '**Anime des ateliers ciblés en petits groupes** : habiletés de vie, gestion des émotions, préparation à l\'emploi.'),
    eRow('Élèves', 'Apprennent les routines et suivent la fiche avec de l\'aide. Essaient le rôle de leader.', 'Règlent leurs blocages entre eux (« 3 avant l\'enseignante »). Chacun a été leader au moins une fois.', 'S\'auto-évaluent, se fixent des défis et transfèrent leurs acquis.'),
    eRow('On passe à l\'étape suivante quand…', 'Les équipes suivent une fiche du début à la fin avec peu d\'aide.', 'Les interventions de la TES diminuent et le registre est rempli sans rappel.', 'Bilan final et recommandation.'),
  ],
});

const besoin = (nom, sous) => [pc(`**${nom}**`, { color: C.marine }), p([t(sous, { size: 18, italics: true, color: C.gris })], { spacing: { after: 0 } })];

const doc = new Document({
  creator: 'Conseillère pédagogique, secteur PPS',
  title: 'Projet PPS Z101',
  features: { updateFields: true },
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: C.encre } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 32, bold: true, color: C.marine }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true, color: C.marine2 }, paragraph: { outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] },
    { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1200, bottom: 1200, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      t('Projet PPS Z101 · Table des directions · page ', { size: 16, color: C.gris }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.gris }),
    ] })] }) },
    children: [
      // ── Page 1 : couverture et résumé
      bandeau,
      espace(280),
      p([t('En bref', { bold: true, size: 30, color: C.marine })], { spacing: { after: 120 } }),
      tableau([2300, 7060], ['Élément', 'Résumé'], [
        ['**Situation**', 'Le groupe Z101 est complet avec 15 élèves. **9 élèves attendent une place en PPS.** Ils sont déjà inscrits en matières au centre et plusieurs ont été référés par des enseignantes de la FBC.'],
        ['**Proposition**', 'Accueillir les 24 élèves en **deux sous-groupes** qui alternent entre le Z101 avec l\'enseignante et des ateliers exploratoires structurés. Chaque sous-groupe reçoit **le même temps** de Z101 et d\'ateliers dans la semaine.'],
        ['**Quand**', 'Le mardi et le jeudi matin, de 8 h 25 à 11 h 45.'],
        ['**Accompagnement**', 'Mme Lisa, enseignante du Z101, et Janie-Lee, TES. Le projet leur a été présenté et Janie-Lee a accepté son rôle.'],
        ['**Suivi**', 'Projet pilote en trois étapes, avec un bilan à la direction à la fin de chaque étape.'],
        ['**Décision demandée**', '**Ouvrir 9 places supplémentaires au Z101** et autoriser la formule en deux sous-groupes à titre de projet pilote.'],
      ]),
      saut(),

      // ── Page 2 : table des matières
      p([t('Table des matières', { bold: true, size: 32, color: C.marine })], { spacing: { after: 200 } }),
      new TableOfContents('Table des matières', { hyperlink: true, headingStyleRange: '1-1' }),
      saut(),

      // 1
      h1('1. Contexte'),
      puce('Le groupe Z101 compte **15 élèves**. Les inscriptions sont fermées depuis quelques semaines parce que le groupe est complet.'),
      puce('**9 élèves attendent une place en PPS.** Ils sont déjà inscrits en matières au centre et souhaitent entrer en PPS. Plusieurs ont été référés par des enseignantes de la FBC, qui voient que leur profil correspond à PPS et que le Z101 serait pour eux un levier d\'engagement et de motivation.'),
      puce('Les élèves du Z101 **poursuivent ensuite en années 2 et 3 en PPS** au centre.'),
      puce('Les élèves actuels ont été **sondés** sur la formule et sur les compétences qu\'ils souhaitent développer en atelier.'),
      puce('Deux conditions ont été nommées par la direction : **aucune période vide** à l\'horaire des élèves et **aucune ressource supplémentaire**. La formule a été conçue pour respecter ces deux conditions.'),
      h2('Les enjeux'),
      tableau([2300, 7060], ['Enjeu', 'Ce qui est en jeu'], [
        ['**Persévérance**', 'Ces élèves sont motivés à entrer en PPS maintenant. Les faire attendre retarde leur parcours et risque d\'éteindre cette motivation. Pour certains, ce cours peut changer complètement leur parcours scolaire, professionnel et de vie.'],
        ['**Continuité au centre**', 'Chaque élève accueilli en Z101 commence un parcours possible de trois ans en PPS au centre.'],
        ['**Équité**', 'Ces élèves ont un profil qui correspond à PPS. Leur offrir une place, c\'est leur offrir le service qui leur convient.'],
        ['**Innovation**', 'La formule peut devenir un modèle pour d\'autres services du centre (section 12).'],
      ]),

      // 2
      h1('2. Objectifs du projet'),
      para('**Objectif général :** accueillir les 9 élèves en attente au Z101 et développer l\'autonomie de tous les élèves du groupe, sans période vide ni ressource supplémentaire.'),
      h2('Objectifs spécifiques'),
      num('**Retenir** les 24 élèves pendant le projet pilote, dans un environnement sécurisant.'),
      num('**Développer l\'autonomie** des élèves en atelier, au point où les adultes peuvent enseigner de façon ciblée (étape 3).'),
      num('**Soutenir l\'engagement** en nourrissant les quatre besoins : compétence, autonomie, sens et appartenance.'),
      num('**Documenter la formule** pour évaluer si elle peut s\'appliquer ailleurs au centre.'),

      // 3
      h1('3. La formule'),
      para('Les 24 élèves forment **deux sous-groupes** :'),
      puce('**Les élèves en PPS pur**, qui ont généralement besoin de plus de soutien.'),
      puce('**Les élèves en concomitance**, qui suivent aussi d\'autres matières au centre.'),
      para('Pendant qu\'un sous-groupe est en **Z101 avec Mme Lisa**, l\'autre est en **atelier exploratoire**, guidé par une fiche de tâche et une équipe de leaders. Chaque élève est donc toujours en apprentissage encadré.'),
      para('L\'horaire du mardi et celui du jeudi sont inversés. Ainsi, **chaque sous-groupe reçoit le même temps** de Z101 et d\'ateliers dans la semaine. De plus, **les élèves en PPS pur sont toujours accompagnés par la TES** lorsqu\'ils sont en atelier.'),
      h2('Les outils qui rendent les élèves autonomes'),
      puce('**Fiches de tâches autonomes :** une tâche par fiche, de 1 à 5 étapes illustrées, et des critères de réussite pour s\'auto-évaluer.'),
      puce('**Équipes de leaders :** à chaque atelier, un leader lit la fiche, distribue les rôles et gère le temps. Le rôle tourne pour que chacun l\'exerce (section 5).'),
      puce('**Registre d\'autonomie :** chaque élève y inscrit sa tâche en début de matinée, le leader valide les étapes et l\'enseignante fait la validation finale.'),
      puce('**Règle « 3 avant l\'enseignante » :** relire la fiche, demander à un coéquipier, essayer une autre solution.'),
      puce('**Boîtes de découverte TEACCH :** des tâches visuelles et structurées pour travailler l\'autonomie. Un projet de boîtes de découverte avec l\'orthopédagogue est souhaité pour les élèves du centre, notamment en alpha-pré. Si ce projet se réalise, ces boîtes pourraient aussi servir aux élèves du Z101.'),
      puce('**Tableau de programmation :** chaque moment de la matinée est planifié et affiché.'),
      h2('Les ateliers exploratoires'),
      para('Les ateliers s\'appuient sur les suggestions des élèves. En voici des exemples :'),
      puce('**Pré-employabilité**, au grenier de Maria.'),
      puce('**Développement durable**, une suggestion des élèves.'),
      puce('**Entrepreneuriat** : des projets débuteront bientôt en PPS et les élèves pourront les poursuivre en atelier.'),
      para('Les ateliers ont lieu dans **deux locaux** : le grenier de Maria, juste à côté de la classe de Mme Lisa, et le local d\'arts plastiques, un grand local actuellement libre. Le contenu détaillé des ateliers sera précisé avec l\'équipe.'),

      // 4
      h1('4. Le menu du matin'),
      para('La matinée compte **trois périodes d\'une heure** (P1, P2 et P3), séparées par deux pauses de 10 minutes.'),
      h2('Le mardi matin'),
      mardi,
      espace(),
      h2('Le jeudi matin'),
      jeudi,
      espace(),
      h2('Le même temps pour tous'),
      tableau([2900, 2153, 2153, 2154], ['Dans la semaine', 'Z101', 'Atelier exploratoire', 'Soutien de la TES en atelier'], [
        ['**Élèves en PPS pur**', 'Mardi 1 h 25\nJeudi 1 h', 'Mardi 1 h\nJeudi 1 h 25', '**Pendant tout leur temps d\'atelier**'],
        ['**Élèves en concomitance**', 'Mardi 1 h\nJeudi 1 h 25', 'Mardi 1 h 25\nJeudi 1 h', 'Ateliers en autonomie, avec la circulation de Mme Lisa'],
      ]),
      h2('Qui fait quoi pendant la matinée'),
      quiFait([
        qRow('**Rassemblement**\n8 h 25 à 9 h 00', 'Présente le menu du matin et les objectifs du jour. Forme les équipes de leaders.', '—', 'Reçoivent leur rôle et leur atelier. Chaque élève inscrit sa tâche au registre.'),
        qRow('**Z101**', 'Enseigne le Z101 au sous-groupe présent dans sa classe.', '—', '—'),
        qRow('**Ateliers exploratoires**', '**Circule** vers les ateliers pour s\'assurer du bon fonctionnement de la formule, offrir un soutien ponctuel et rediriger les élèves au besoin.', 'Accompagne les élèves en PPS pur : **mardi en P3** (10 h 45 à 11 h 45) et **jeudi en P1 et P2** (9 h 00 à 10 h 35). Soutient les leaders, aide à régler les blocages, offre des pauses de régulation.', 'Lisent la fiche à voix haute, distribuent les rôles, gèrent le temps, donnent la parole à chacun.'),
        qRow('**Transitions**', 'Accueille le sous-groupe qui arrive en Z101.', 'Le jeudi, accompagne la transition du rassemblement vers les ateliers. Le mardi, accompagne l\'arrivée en atelier à la P3.', 'Passent en revue les critères de réussite et font ranger le poste.'),
      ]),
      note('La TES intervient de façon préventive aux moments où les élèves en ont le plus besoin : pendant les transitions et les ateliers.'),
      h2('À l\'étape 3, quand l\'autonomie est acquise'),
      para('L\'horaire reste le même. Quand les élèves fonctionnent seuls en atelier et que la gestion de classe le permet, **Mme Lisa anime des ateliers en sous-groupes de besoins** et **Janie-Lee anime des ateliers ciblés en petits groupes** (habiletés de vie, gestion des émotions, préparation à l\'emploi), pendant ses heures de présence.'),

      // 5
      h1('5. Le rôle des leaders'),
      para('Le leader est un **facilitateur** : il aide son équipe à bien fonctionner pour que l\'enseignante puisse enseigner sans être interrompue. **La gestion de classe demeure la responsabilité des adultes.**'),
      tableau([2100, 7260], ['Moment', 'Ce que fait le leader'], [
        ['**Au début**', 'Rassemble l\'équipe autour de la table. Lit la fiche de tâche lentement, à voix haute. Vérifie que chacun a son matériel.'],
        ['**Pendant**', 'Distribue la parole pour que les plus timides s\'expriment. Gère le temps (« Il nous reste 10 minutes »). Aide à régler les blocages avec la règle « 3 avant l\'enseignante ».'],
        ['**À la fin**', 'Passe en revue les critères de réussite avec l\'équipe. Fait ranger le matériel. Valide les étapes au registre par ses initiales, avant la validation finale de l\'enseignante.'],
      ]),
      h2('Ce que ce rôle apporte aux élèves'),
      puce('**Confiance et autonomie** devant des tâches nouvelles.'),
      puce('**Estime de soi :** l\'élève découvre qu\'il est capable de guider un groupe.'),
      puce('**Habiletés sociales :** écouter, donner la parole, encourager, régler un désaccord.'),
      puce('**Compétences transférables** au travail et dans la vie : organiser, gérer son temps, prendre des responsabilités.'),
      puce('**Appartenance :** chaque membre a un rôle dont l\'équipe a besoin.'),
      h2('Comment on choisit les leaders'),
      puce('**Rotation :** chaque élève occupe le rôle au moins une fois par étape.'),
      puce('**Volontariat encouragé :** priorité aux élèves qui veulent développer leur leadership.'),
      puce('**Jumelage :** un leader plus réservé peut être jumelé à un co-leader.'),
      puce('**Soutien de la TES :** elle conseille discrètement le leader pour renforcer sa posture.'),

      // 6
      h1('6. Rôles et responsabilités'),
      tableau([2100, 3630, 3630], ['Personne', 'Étapes 1 et 2', 'Étape 3'], [
        ['**Enseignante**\nMme Lisa', 'Enseigne le Z101 à chaque sous-groupe. Circule vers les ateliers pour s\'assurer du bon fonctionnement de la formule. Planifie, évalue et valide le registre.', 'Enseigne le Z101 et **anime des ateliers en sous-groupes de besoins** pendant que les autres travaillent en autonomie.'],
        ['**TES**\nJanie-Lee', 'Accompagne les élèves en PPS pur en atelier et pendant les transitions : modélise le rôle de leader, aide à régler les blocages, soutient l\'autorégulation.', '**Anime des ateliers ciblés en petits groupes** : habiletés de vie, gestion des émotions, préparation à l\'emploi.'],
        ['**Élèves leaders**', 'Lisent la fiche, distribuent les rôles, gèrent le temps, font ranger.', 'Animent aussi une partie du rassemblement.'],
        ['**Direction**', 'Autorise le projet et confirme l\'accès au local d\'arts plastiques.', 'Reçoit les bilans et décide de la suite.'],
      ]),
      espace(),
      encadre('La TES n\'est pas une surveillante', [
        'Son rôle évolue avec les élèves. Elle **accompagne** d\'abord les élèves en PPS pur dans les ateliers, puis elle **coache** en retrait. Quand l\'autonomie le permet, elle **anime ses propres ateliers ciblés** en petits groupes.',
        'Ses heures sont placées aux moments où les élèves en ont le plus besoin : les transitions et les ateliers.',
      ]),

      // 7
      h1('7. Échéancier'),
      h2('Les trois étapes'),
      para('Le projet se déroule en trois étapes. On passe d\'une étape à l\'autre quand on observe les signes de réussite. **Un bilan est présenté à la direction à la fin de chaque étape.**'),
      etapes,
      h2('Démarrage du projet'),
      tableau([2100, 4860, 2400], ['Quand', 'Étape', 'Responsable'], [
        ['**Semaine 0**', 'Décision de la table des directions. Confirmation de l\'accès au local d\'arts plastiques.', 'Direction'],
        ['**Semaine 0**', 'Inscription des 9 élèves au Z101.', 'Direction'],
        ['**Semaine 0**', 'Formation des deux sous-groupes. Préparation des premières fiches de tâches et du registre.', 'Mme Lisa, Janie-Lee'],
        ['**Semaine 1**', 'Début de l\'étape 1 avec les 24 élèves.', 'Mme Lisa, Janie-Lee'],
        ['**Fin de chaque étape**', 'Bilan à partir des indicateurs (section 11) et ajustements au besoin.', 'Mme Lisa, Janie-Lee, direction'],
      ]),

      // 8
      h1('8. Ressources'),
      tableau([2300, 7060], ['Ressource', 'Détail'], [
        ['**Personnel**', 'Mme Lisa, enseignante du Z101, et Janie-Lee, TES. La formule ne prévoit pas de personnel supplémentaire.'],
        ['**Horaire de la TES**', '**Mardi matin :** P3, de 10 h 45 à 11 h 45.\n**Jeudi matin :** de la fin du rassemblement à la fin de la P2, de 9 h 00 à 10 h 35.'],
        ['**Locaux**', 'Classe de Mme Lisa pour le Z101. Pour les ateliers exploratoires : le grenier de Maria, juste à côté de la classe, et le local d\'arts plastiques, un grand local actuellement libre.'],
        ['**Matériel**', 'Fiches de tâches plastifiées et registre d\'autonomie. Si le projet de boîtes de découverte TEACCH souhaité avec l\'orthopédagogue se réalise, ces boîtes pourraient aussi être utilisées.'],
      ]),

      // 9
      h1('9. Les quatre besoins de l\'engagement'),
      para('L\'engagement, c\'est **la décision de participer activement**. Il se nourrit de **quatre besoins**, et la formule a été pensée pour nourrir chacun d\'eux.'),
      tableau([2500, 6860], ['Besoin', 'Comment la formule le nourrit'], [
        [besoin('Sentiment de compétence', 'Défi optimal, rétroaction de qualité, progression visible'),
          'Des fiches courtes adaptées au niveau de l\'élève. Des critères de réussite connus d\'avance. Des étapes validées au registre : l\'élève voit ses progrès.'],
        [besoin('Autonomie', 'Choix, voix et participation, contrôle sur la tâche'),
          'Les élèves ont été consultés sur la formule et sur les ateliers. L\'élève choisit sa tâche, s\'inscrit au registre, prend la parole comme leader et règle ses blocages avec la règle « 3 avant l\'enseignante ».'],
        [besoin('Sens', 'Utilité, but personnel, transfert'),
          'Des ateliers proposés par les élèves et liés à leur projet de vie : pré-employabilité, développement durable, entrepreneuriat.'],
        [besoin('Sentiment d\'appartenance', 'Relations positives, climat sécurisant, temps de qualité'),
          'Équipes de leaders et entraide : chaque élève compte pour son équipe. La TES veille au climat et offre du temps de qualité en petits groupes.'],
      ]),
      note('Cadre de référence : affiche « L\'engagement » d\'Isabelle Pedneault (CC BY-NC-SA 4.0).'),

      // 10
      h1('10. Préoccupations et réponses'),
      tableau([3000, 6360], ['Préoccupation', 'Ce qui est prévu'], [
        ['**Des périodes vides à l\'horaire**', 'Chaque moment est planifié au tableau de programmation : l\'élève est soit en Z101, soit en atelier exploratoire guidé par une fiche.'],
        ['**L\'ajout de personnel**', 'La formule a été conçue avec l\'enseignante et la TES qui accompagnent déjà le groupe. Elle ne prévoit pas de personnel supplémentaire.'],
        ['**Le désengagement observé l\'an dernier**', 'Après vérification, il s\'explique par des cas très particuliers propres à la cohorte de l\'an dernier. Cette année, les élèves sont très participatifs. La formule est aussi plus structurée : fiches, leaders, registre et transition planifiée vers l\'autonomie.'],
        ['**La TES utilisée comme surveillante**', 'Son rôle évolue de l\'accompagnement vers l\'animation d\'ateliers ciblés (section 6). Ses heures sont placées pendant les transitions et les ateliers.'],
        ['**Des ateliers dans deux locaux en même temps**', 'Le grenier de Maria est juste à côté de la classe de Mme Lisa, qui circule vers les ateliers. Les élèves en PPS pur sont toujours en atelier avec la TES.'],
        ['**Garder les élèves centrés sur leur tâche**', 'Des fiches courtes et visuelles, une étape à la fois. Des critères de réussite connus d\'avance. Un rôle pour chaque membre de l\'équipe. Le registre pour suivre son avancement. Le soutien de la TES et la circulation de l\'enseignante.'],
        ['**Des résultats moins bons que prévu**', 'Un bilan est fait à la fin de l\'étape 1. Si les indicateurs ne sont pas au rendez-vous, la formule est ajustée avec l\'équipe et la direction.'],
      ]),

      // 11
      h1('11. Évaluation et suivi'),
      para('Les indicateurs sont suivis chaque semaine et présentés à la direction **au bilan de fin de chaque étape**.'),
      tableau([3000, 3460, 2900], ['Indicateur', 'Cible', 'Outil'], [
        ['**Rétention des élèves**', '100 % des 24 élèves toujours inscrits', 'Liste de présence'],
        ['**Présence**', 'Stable ou en hausse', 'Liste de présence'],
        ['**Tâches réalisées en autonomie**', 'En hausse d\'une étape à l\'autre', 'Registre d\'autonomie'],
        ['**Interventions de la TES en atelier**', 'En baisse d\'une étape à l\'autre', 'Grille d\'observation de la TES'],
        ['**Rôle de leader**', 'Chaque élève l\'a exercé au moins une fois par étape', 'Registre d\'autonomie'],
        ['**Poursuite en PPS**', 'Inscription en année 2', 'Inscriptions de fin d\'année'],
      ]),

      // 12
      h1('12. Retombées et transférabilité'),
      puce('**Pour les élèves :** une place en PPS au moment où ils sont motivés, plus d\'autonomie, de leadership et d\'estime de soi.'),
      puce('**Pour le centre :** des élèves qui poursuivent en PPS et une réponse concrète aux références de la FBC.'),
      puce('**Pour d\'autres services :** une formule où la collaboration est au cœur de l\'apprentissage, qui pourrait s\'appliquer en **alpha-pré**, en **francisation**, à la **FBC** et ailleurs au centre.'),

      // 13
      h1('13. Décision demandée'),
      para('Nous demandons à la table des directions :'),
      num('**D\'ouvrir 9 places supplémentaires au Z101** pour les élèves en attente.'),
      num('**D\'autoriser la formule en deux sous-groupes** à titre de projet pilote.'),
      num('**De confirmer l\'accès au local d\'arts plastiques** le mardi et le jeudi matin.'),
      num('**De recevoir un bilan** à la fin de chaque étape.'),
      espace(240),
      new Table({
        width: { size: W, type: WidthType.DXA }, columnWidths: [W], layout: TableLayoutType.FIXED,
        rows: [new TableRow({ cantSplit: true, children: [new TableCell({
          width: { size: W, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.marine },
          margins: { top: 280, bottom: 240, left: 400, right: 400 }, borders: noBorders,
          children: [
            p([t('« Quand une fleur ne fleurit pas, on corrige l\'environnement dans lequel elle pousse, pas la fleur. »', { italics: true, size: 26, color: C.blanc })], { spacing: { after: 80 } }),
            p([t('Paulo Amaro', { size: 19, color: C.pale })], { spacing: { after: 0 } }),
          ],
        })] })],
      }),
    ],
  }],
});

// Garde chaque tableau d'un seul tenant : « paragraphe solidaire du suivant » sur toutes les lignes sauf la dernière
function tablesSolidaires(xml) {
  return xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, tbl => {
    const rows = tbl.split(/(?=<w:tr>|<w:tr )/);
    return rows.map((r, i) => (i === 0 || i === rows.length - 1) ? r : r
      .replace(/<w:p>(?!<w:pPr>)/g, '<w:p><w:pPr><w:keepNext/></w:pPr>')
      .replace(/<w:p><w:pPr>(?!<w:pStyle)/g, '<w:p><w:pPr><w:keepNext/>')
      .replace(/(<w:p><w:pPr><w:pStyle [^>]*\/>)/g, '$1<w:keepNext/>')).join('');
  });
}

Packer.toBuffer(doc).then(b => {
  const out = path.join(__dirname, 'Projet-Z101.docx');
  const tmp = path.join(__dirname, '.build');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp);
  fs.writeFileSync(path.join(tmp, 'in.docx'), b);
  execFileSync('unzip', ['-q', 'in.docx', '-d', 'x'], { cwd: tmp });
  const f = path.join(tmp, 'x', 'word', 'document.xml');
  fs.writeFileSync(f, tablesSolidaires(fs.readFileSync(f, 'utf8')));
  fs.rmSync(out, { force: true });
  execFileSync('zip', ['-qXr', out, '.'], { cwd: path.join(tmp, 'x') });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('ok');
});

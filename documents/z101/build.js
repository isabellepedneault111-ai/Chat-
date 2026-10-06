// Génère Projet-Z101.docx : node build.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  ShadingType, AlignmentType, HeadingLevel, BorderStyle, LevelFormat, Footer,
  PageNumber, TableLayoutType, VerticalAlign, TableOfContents, PageBreak, ImageRun,
} = require('docx');

// Palette du logo CFGA De La Jonquière : bleu et vert lime, gris neutres
const C = {
  marine: '004983', marine2: '1F64A6', vert: '5E8A1E', lime: '7AA32B', encre: '1A1D24', gris: '596273',
  ligne: 'C9CFD8', fond: 'F2F4F7', blanc: 'FFFFFF', pale: 'D6E4F2', ciel: 'B9D37A',
};
const LOGO = fs.readFileSync(path.join(__dirname, 'visuels', 'logo-cfga.png'));
const logo = (px) => new ImageRun({ type: 'png', data: LOGO, transformation: { width: px, height: px } });
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
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.lime, space: 4 } } });
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
], q, { fill: C.marine2, borders: { ...noBorders, top: { style: BorderStyle.SINGLE, size: 24, color: C.lime } } });
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
        p([t('Octobre 2026', { size: 20, color: C.pale })], { spacing: { after: 0 } }),
      ],
    })] }),
    new TableRow({ children: [
      chiffre('15', 'élèves inscrits au Z101'), chiffre('9', 'élèves en attente d\'une place'),
      chiffre('24', 'élèves accueillis avec la formule'), chiffre('2', 'matinées par semaine'),
    ] }),
  ],
});

// ── Visuels graphiques (rendus par visuels/render.js)
const image = (nom, largeur, hauteur) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 160 },
  children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(__dirname, 'visuels', nom + '.png')), transformation: { width: largeur, height: hauteur } })],
});
// largeur utile 6,5 po = 624 px ; hauteur selon les proportions de chaque PNG (2400 px de large)
const visuel = (nom) => {
  const png = fs.readFileSync(path.join(__dirname, 'visuels', nom + '.png'));
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  return image(nom, 624, Math.round(624 * h / w));
};

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
      logo(28), t('   '),
      t('Projet PPS Z101 · page ', { size: 16, color: C.gris }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.gris }),
    ] })] }) },
    children: [
      // ── Page 1 : couverture et résumé
      new Paragraph({ alignment: AlignmentType.LEFT, spacing: { after: 160 }, children: [logo(120)] }),
      bandeau,
      espace(280),
      p([t('En bref', { bold: true, size: 30, color: C.marine })], { spacing: { after: 120 } }),
      tableau([2300, 7060], ['Élément', 'Résumé'], [
        ['**Situation**', 'Groupe Z101 complet (15 élèves). **9 élèves attendent une place en PPS.** Ils sont déjà inscrits en matières au centre.'],
        ['**Proposition**', 'Deux sous-groupes qui alternent entre le **Z101** et des **ateliers exploratoires**. Le même temps pour tous dans la semaine.'],
        ['**Quand**', 'Mardi et jeudi matin, de 8 h 25 à 11 h 45.'],
        ['**Qui**', 'Mme Lisa, enseignante du Z101, et Janie-Lee, TES, qui a accepté son rôle dans le projet.'],
        ['**Suivi**', 'Projet pilote en trois étapes, avec un bilan aux directions à la fin de chaque étape.'],
        ['**Décision**', '**Ouvrir 9 places supplémentaires au Z101.**'],
      ]),
      saut(),

      // ── Page 2 : table des matières
      p([t('Table des matières', { bold: true, size: 32, color: C.marine })], { spacing: { after: 200 } }),
      new TableOfContents('Table des matières', { hyperlink: true, headingStyleRange: '1-1' }),
      saut(),

      // 1
      h1('1. Contexte et enjeux'),
      puce('Le groupe Z101 est **complet avec 15 élèves**.'),
      puce('**9 élèves attendent une place en PPS.** Ils sont déjà en matières au centre. Plusieurs ont été référés par des enseignantes de la FBC.'),
      puce('Les élèves du Z101 **poursuivent en années 2 et 3** en PPS.'),
      puce('Les directions demandent **aucune période vide** et **aucune ressource supplémentaire**. La formule respecte ces deux conditions.'),
      h2('Pourquoi agir maintenant'),
      tableau([2300, 7060], ['Enjeu', 'En une phrase'], [
        ['**Persévérance**', 'Ces élèves sont motivés maintenant. Attendre retarde leur parcours en PPS et peut avoir un impact sur leur engagement dans leur parcours scolaire.'],
        ['**Continuité**', 'Chaque élève accueilli pourra poursuivre en PPS dans les prochaines années.'],
        ['**Innovation**', 'La formule pourrait servir ailleurs : alpha-pré, francisation, FBC, etc.'],
      ]),

      // 2
      h1('2. La formule en bref'),
      tableau([2300, 7060], ['', 'Comment ça fonctionne'], [
        ['**Deux sous-groupes**', '**PPS pur** (plus de soutien) et **concomitance** (élèves qui suivent aussi d\'autres matières).'],
        ['**En alternance**', 'Un sous-groupe est en **Z101 avec Mme Lisa** pendant que l\'autre est en **atelier exploratoire**.'],
        ['**Même temps pour tous**', 'L\'horaire du mardi et celui du jeudi sont inversés (voir visuel).'],
        ['**Soutien de la TES**', 'Les élèves en PPS pur pourront bénéficier de la **présence de Janie-Lee** quand ils sont en ateliers.'],
        ['**Outils d\'autonomie**', 'Fiches de tâches, équipes de leaders, registre d\'autonomie, règle « 3 avant l\'enseignante ». Des boîtes de découverte TEACCH pourraient s\'ajouter si le projet souhaité avec l\'orthopédagogue se réalise.'],
      ]),

      // 3
      h1('3. Le menu du matin'),
      para('Trois périodes d\'une heure (P1, P2, P3) et deux pauses de 10 minutes.'),
      visuel('menu'),

      // 4
      h1('4. Qui fait quoi'),
      tableau([2300, 7060], ['Personne', 'Rôle'], [
        ['**Mme Lisa**\nEnseignante', 'Enseigne le Z101. **Circule** vers les ateliers pour offrir un soutien ponctuel et rediriger les élèves au besoin.'],
        ['**Janie-Lee**\nTES', 'Accompagne les élèves en PPS pur en ateliers et pendant les transitions.\n**Mardi :** P3, de 10 h 45 à 11 h 45.\n**Jeudi :** de 9 h 00 à 10 h 35.'],
        ['**Élèves leaders**', 'Lisent la fiche, distribuent les rôles, gèrent le temps, font ranger.'],
        ['**Directions**', 'Autorisent le projet et confirment l\'accès au local d\'arts plastiques.'],
      ]),
      note('La TES n\'est pas une surveillante : ses heures sont placées pendant les transitions et les ateliers, aux moments où les élèves en ont le plus besoin.'),

      // 5
      h1('5. Le rôle des leaders'),
      para('Le leader aide son équipe à bien fonctionner. **La gestion de classe demeure la responsabilité des adultes.**'),
      tableau([2300, 7060], ['Moment', 'Le leader…'], [
        ['**Au début**', 'Rassemble l\'équipe, lit la fiche à voix haute, vérifie le matériel.'],
        ['**Pendant**', 'Donne la parole à chacun, gère le temps, aide à régler les blocages.'],
        ['**À la fin**', 'Vérifie les critères de réussite, fait ranger, valide au registre.'],
      ]),
      h2('Ce que ce rôle apporte'),
      tableau([3120, 3120, 3120], ['Confiance', 'Habiletés sociales', 'Compétences pour l\'emploi'], [
        ['Estime de soi et autonomie devant des tâches nouvelles.', 'Écouter, encourager, régler un désaccord.', 'Organiser, gérer son temps, prendre des responsabilités.'],
      ]),
      note('Au départ, l\'enseignante forme des équipes hétérogènes et choisit le leader de chaque équipe. Ensuite, chaque élève est leader au moins une fois par étape. Un leader plus réservé peut avoir un co-leader.'),

      // 6
      h1('6. Les ateliers exploratoires'),
      para('Les élèves ont été **sondés** sur la formule et sur ce qu\'ils veulent apprendre. Les ateliers combinent ce qui existe déjà en PPS et leurs propres idées.'),
      visuel('ateliers'),
      encadre('Un démarrage graduel', [
        'Les idées des élèves sont des **propositions** : elles ne sont pas encore confirmées. Si le projet est accepté, nous débuterons avec **un ou deux ateliers exploratoires à la fois**, pour ne pas nous éparpiller.',
      ]),
      h2('Pour aller plus loin'),
      para('Ces pistes ne sont pas encore en place. Elles montrent ce que la formule pourrait permettre :'),
      puce('**Un rôle plus préventif pour la TES.** Quand l\'autonomie et les routines seront bien acquises, les ateliers exploratoires, signifiants et concrets pour les élèves, seront une occasion en or pour faire de la prévention et offrir des ateliers ciblés.'),
      puce('**Des places pour d\'autres élèves du centre.** Par exemple, ouvrir quelques places à des élèves d\'alpha-pré dans un atelier d\'écriture : lecture d\'un album par la conseillère pédagogique, suivie d\'une question de réaction.'),
      puce('**La vie étudiante.** Des ateliers en collaboration avec la technicienne en loisirs.'),

      // 7
      h1('7. Les trois étapes'),
      para('On passe à l\'étape suivante quand on observe les signes de réussite. **Un bilan est présenté aux directions à la fin de chaque étape.**'),
      visuel('etapes'),

      // 8
      h1('8. Pourquoi ça soutient l\'engagement'),
      visuel('besoins'),
      note('Cadre de référence : affiche « L\'engagement » d\'Isabelle Pedneault (CC BY-NC-SA 4.0).'),

      // 9
      h1('9. Préoccupations et réponses'),
      tableau([3200, 6160], ['Préoccupation', 'Réponse'], [
        ['**Des périodes vides**', 'Aucune : chaque élève est en Z101 ou en atelier guidé par une fiche.'],
        ['**L\'ajout de personnel**', 'La formule repose sur l\'enseignante et la TES qui accompagnent déjà le groupe.'],
        ['**Le désengagement de l\'an dernier**', 'Il s\'explique par des cas très particuliers. Cette année, la cohorte est très participative et la formule est plus structurée.'],
        ['**La TES utilisée comme surveillante**', 'Son rôle évolue : elle accompagne, puis coache, puis anime ses propres ateliers.'],
        ['**Deux locaux en même temps**', 'Le grenier est à côté de la classe. Mme Lisa circule. Les élèves en PPS pur bénéficient de la présence de la TES.'],
        ['**Garder les élèves centrés sur leur tâche**', 'Fiches courtes et visuelles, un rôle pour chacun, critères de réussite, registre.'],
        ['**Des résultats moins bons que prévu**', 'Le bilan de l\'étape 1 permet d\'ajuster la formule rapidement.'],
      ]),

      // 10
      h1('10. Suivi'),
      tableau([3200, 3560, 2600], ['Indicateur', 'Cible', 'Outil'], [
        ['**Rétention**', '100 % des 24 élèves', 'Présences'],
        ['**Présence**', 'Stable ou en hausse', 'Présences'],
        ['**Tâches faites en autonomie**', 'En hausse', 'Registre d\'autonomie'],
        ['**Interventions de la TES**', 'En baisse', 'Grille d\'observation'],
        ['**Poursuite en PPS**', 'Inscription en année 2', 'Inscriptions'],
      ]),
      note('Indicateurs suivis chaque semaine et présentés au bilan de fin d\'étape.'),

      // 11
      h1('11. Décision demandée'),
      num('**Ouvrir 9 places supplémentaires au Z101.**'),
      num('**Autoriser la formule en deux sous-groupes** à titre de projet pilote.'),
      num('**Confirmer l\'accès au local d\'arts plastiques** le mardi et le jeudi matin.'),
      h2('Si le projet est accepté'),
      tableau([2300, 4660, 2400], ['Quand', 'Quoi', 'Qui'], [
        ['**Semaine 0**', 'Inscription des 9 élèves.', 'Conseillère pédagogique'],
        ['**Semaine 0**', 'Formation des sous-groupes, premières fiches et registre.', 'Mme Lisa, Janie-Lee'],
        ['**Semaine 1**', 'Début de l\'étape 1.', 'Mme Lisa, Janie-Lee'],
        ['**Fin de chaque étape**', 'Bilan aux directions.', 'Mme Lisa, Janie-Lee, conseillère pédagogique'],
      ]),
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

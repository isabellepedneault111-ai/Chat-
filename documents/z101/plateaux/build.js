// Génère Plateaux-Z101-resume.docx : node build.js
const fs = require('fs'), path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  HeadingLevel, BorderStyle, LevelFormat, Footer, PageNumber, TableLayoutType, ImageRun } = require('docx');

const C = { bleu: '004983', lime: '7AA32B', encre: '1A1D24', gris: '596273', ligne: 'C9CFD8', pale: 'EEF4E4' };
const FONT = 'Calibri', W = 9360;
const t = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
const rich = s => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(x => x.startsWith('**') ? t(x.slice(2, -2), { bold: true }) : t(x));
const p = (s, o = {}) => new Paragraph({ children: typeof s === 'string' ? rich(s) : s, spacing: { after: 100, line: 276 }, ...o });
const puce = s => new Paragraph({ children: rich(s), numbering: { reference: 'puces', level: 0 }, spacing: { after: 60, line: 264 } });
const case_ = s => new Paragraph({ children: [t('☐  ', { color: C.lime, bold: true }), ...rich(s)], spacing: { after: 80 }, indent: { left: 200 } });
const h1 = s => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s)], spacing: { before: 320, after: 120 }, keepNext: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.lime, space: 4 } } });
const h2 = s => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [t(s)], spacing: { before: 160, after: 60 }, keepNext: true });
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const fine = { style: BorderStyle.SINGLE, size: 4, color: C.ligne };

// Tableau des tâches : tâches communes | tâches individuelles
const taches = (communes, indiv) => {
  const w = W / 2, tete = s => new TableCell({ width: { size: w, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.bleu },
    margins: { top: 80, bottom: 80, left: 140, right: 140 }, children: [p([t(s, { bold: true, color: 'FFFFFF' })], { spacing: { after: 0 } })] });
  const corps = l => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 140, right: 140 }, children: l.map(puce) });
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [w, w], layout: TableLayoutType.FIXED,
    borders: { top: fine, bottom: fine, left: fine, right: fine, insideHorizontal: fine, insideVertical: fine },
    rows: [new TableRow({ tableHeader: true, children: [tete('Tâches communes'), tete('Tâches individuelles')] }), new TableRow({ cantSplit: true, children: [corps(communes), corps(indiv)] })] });
};
const espace = () => new Paragraph({ children: [], spacing: { after: 80 } });
const logo = new ImageRun({ type: 'png', data: fs.readFileSync(path.join(__dirname, '..', 'visuels', 'logo-cfga.png')), transformation: { width: 80, height: 80 } });

const doc = new Document({
  creator: 'Conseillère pédagogique, secteur PPS', title: 'Plateaux de travail Z101 : résumé',
  styles: { default: { document: { run: { font: FONT, size: 22, color: C.encre } } }, paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 30, bold: true, color: C.bleu }, paragraph: { outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 23, bold: true, color: '1F64A6' }, paragraph: { outlineLevel: 1 } } ] },
  numbering: { config: [{ reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 300, hanging: 220 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1100, bottom: 1100, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [t('Plateaux de travail Z101 · page ', { size: 16, color: C.gris }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.gris })] })] }) },
    children: [
      new Paragraph({ children: [logo], spacing: { after: 120 } }),
      p([t('PPS Z101 · PLATEAUX DE TRAVAIL', { bold: true, size: 18, color: C.lime, characterSpacing: 30 })], { spacing: { after: 40 } }),
      p([t('Résumé des idées pour les plateaux', { bold: true, size: 44, color: C.bleu })], { spacing: { after: 60 } }),
      p([t('Lancement du 3 novembre 2026', { italics: true, size: 20, color: C.gris })], { spacing: { after: 200 } }),

      h1('La cantine'),
      h2('Les rôles'),
      puce('**Superviseur** : surveille les tâches et les besoins, et s\'assure que le travail à faire est fait.'),
      h2('Les tâches'),
      taches(['**Première chose : le ménage**, avant l\'ouverture.', 'Le ménage après la fermeture.'],
        ['Remplissage des produits.', 'Service aux clients.', 'Remplir les machines à slush.', 'Remplir la caisse.']),
      espace(),
      h2('Ce qu\'on offre'),
      puce('Slush.'), puce('Collations : collations santé et « cochonneries ».'),
      h2('À organiser'),
      puce('Une **liste d\'achats** à faire.'),

      h1('Le grenier de Maria (friperie)'),
      h2('Tâche 1 : mettre de l\'ordre'),
      puce('Vider les sacs.'), puce('Suspendre les vêtements.'), puce('Ranger.'),
      puce('Classer les vêtements **par taille**, sur des supports (racks) de tailles. Les vêtements sont mélangés, et non plus séparés par sexe comme avant, pour qu\'on les trouve plus facilement.'),
      h2('Les rôles'),
      puce('**Secrétaire** : prend en note ce dont on a besoin.'),
      puce('Les besoins sont nommés d\'avance.'),
      h2('Services et projets'),
      puce('Service de couture.'),
      puce('Marché de Noël possible, avec un service d\'emballage.'),
      h2('Visibilité de la friperie'),
      puce('Site Internet.'), puce('Page Facebook.'), puce('Affiches papier et annonces.'),

      h1('L\'ensachage'),
      puce('Organisation des bacs.'),
      puce('**Tous les élèves participent aux tâches.**'),

      h1('Conciergerie et services'),
      puce('Récupérer les canettes.'),
      puce('Remplir les distributeurs de savon et les autres produits.'),
      puce('Avoir un **logo** pour le plateau (voir Véro, en arts).'),

      h1('À faire'),
      case_('Cantine : préparer la liste d\'achats.'),
      case_('Cantine : nommer le superviseur.'),
      case_('Grenier de Maria : nommer le ou la secrétaire et dresser la liste des besoins.'),
      case_('Grenier de Maria : installer les supports par taille.'),
      case_('Grenier de Maria : décider du marché de Noël.'),
      case_('Conciergerie : parler du logo avec Véro, en arts.'),
    ],
  }],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync(path.join(__dirname, 'Plateaux-Z101-resume.docx'), b); console.log('ok'); });

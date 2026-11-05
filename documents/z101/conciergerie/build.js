// Génère les 3 documents de l'équipe Conciergerie et services : node build.js
const fs = require('fs'), path = require('path');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  HeadingLevel, BorderStyle, LevelFormat, Footer, PageNumber, TableLayoutType, ImageRun, PageBreak, VerticalAlign } = require('docx');

const C = { bleu: '004983', bleu2: '1F64A6', lime: '7AA32B', encre: '1A1D24', gris: '596273', ligne: 'C9CFD8', pale: 'EEF4E4', fond: 'F2F4F7' };
const FONT = 'Calibri', W = 9360;
const LOGO = fs.readFileSync(path.join(__dirname, '..', 'visuels', 'logo-cfga.png'));
const t = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
const rich = (s, o = {}) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(x => x.startsWith('**') ? t(x.slice(2, -2), { bold: true, ...o }) : t(x, o));
const p = (s, o = {}) => new Paragraph({ children: typeof s === 'string' ? rich(s) : s, spacing: { after: 100, line: 276 }, ...o });
const puce = (s, o = {}) => new Paragraph({ children: rich(s, o), numbering: { reference: 'puces', level: 0 }, spacing: { after: 60, line: 264 } });
const h1 = s => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(s)], spacing: { before: 280, after: 120 }, keepNext: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.lime, space: 4 } } });
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const fine = { style: BorderStyle.SINGLE, size: 4, color: C.ligne };
const grid = { top: fine, bottom: fine, left: fine, right: fine, insideHorizontal: fine, insideVertical: fine };
const cell = (kids, w, o = {}) => new TableCell({ width: { size: w, type: WidthType.DXA }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined, verticalAlign: o.v || VerticalAlign.CENTER, columnSpan: o.span, borders: o.borders,
  children: typeof kids === 'string' ? [p(kids, { spacing: { after: 0 }, alignment: o.align })] : kids });
const tete = (s, w, align) => cell([p([t(s, { bold: true, color: 'FFFFFF' })], { spacing: { after: 0 }, alignment: align })], w, { fill: C.bleu });
const entete = (sur, titre, sous) => [
  new Paragraph({ children: [new ImageRun({ type: 'png', data: LOGO, transformation: { width: 72, height: 72 } })], spacing: { after: 100 } }),
  p([t(sur, { bold: true, size: 18, color: C.lime, characterSpacing: 30 })], { spacing: { after: 40 } }),
  p([t(titre, { bold: true, size: 42, color: C.bleu })], { spacing: { after: 60 } }),
  ...(sous ? [p([t(sous, { italics: true, size: 20, color: C.gris })], { spacing: { after: 200 } })] : []),
];
const base = (titre, children, pied = true) => new Document({
  creator: 'Conseillère pédagogique, secteur PPS', title: titre,
  styles: { default: { document: { run: { font: FONT, size: 22, color: C.encre } } }, paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 28, bold: true, color: C.bleu }, paragraph: { outlineLevel: 0 } }] },
  numbering: { config: [{ reference: 'puces', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 300, hanging: 220 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 900, bottom: 900, left: 1440, right: 1440 } } },
    footers: pied ? { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [t('Conciergerie et services · PPS Z101 · page ', { size: 16, color: C.gris }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.gris })] })] }) } : undefined,
    children }],
});
const ecrire = (doc, nom) => Packer.toBuffer(doc).then(b => { fs.writeFileSync(path.join(__dirname, nom), b); console.log('ok', nom); });
const $ = n => n.toFixed(2).replace('.', ',') + ' $';

// ── 1. Liste d'achats
const ACHATS = [
  // [article, quantité, prix unitaire moyen, essentiel?]
  ['Gants jetables en nitrile (boîte de 100)', 2, 15, true],
  ['Chiffons en microfibre (paquet de 12)', 2, 14, true],
  ['Vaporisateurs vides de 1 L, à identifier', 4, 3, true],
  ['Nettoyant tout usage concentré (4 L)', 1, 15, true],
  ['Nettoyant à vitres (950 ml)', 2, 5, true],
  ['Savon à mains, format recharge (4 L)', 1, 16, true],
  ['Lingettes désinfectantes (contenant de 80)', 2, 7, true],
  ['Sacs à ordures (boîte de 40)', 1, 12, true],
  ['Sacs de recyclage bleus (boîte de 30)', 1, 10, true],
  ['Bac pour récupérer les canettes (environ 50 L)', 2, 15, true],
  ['Brosses à récurer et éponges (ensemble)', 1, 8, true],
  ['Ruban adhésif de masquage et marqueur permanent', 1, 10, true],
  ['Seau avec essoreuse', 1, 25, false],
  ['Vadrouille en microfibre avec manche', 1, 25, false],
  ['Balai et porte-poussière', 1, 20, false],
  ['Panneau « Attention, plancher mouillé »', 1, 25, false],
];
const aW = [4560, 1000, 1500, 1300, 1000];
const ligneA = ([a, q, pr, ess]) => new TableRow({ cantSplit: true, children: [
  cell(a, aW[0]), cell(String(q), aW[1], { align: AlignmentType.CENTER }), cell($(pr), aW[2], { align: AlignmentType.RIGHT }),
  cell([p([t($(q * pr), { bold: true })], { spacing: { after: 0 }, alignment: AlignmentType.RIGHT })], aW[3]),
  cell([p([t('☐', { size: 26, color: C.lime })], { spacing: { after: 0 }, alignment: AlignmentType.CENTER })], aW[4]) ] });
const totalDe = l => l.reduce((s, [, q, pr]) => s + q * pr, 0);
const tableAchats = (l, titreTotal) => new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: aW, layout: TableLayoutType.FIXED, borders: grid, rows: [
  new TableRow({ tableHeader: true, children: [tete('Article', aW[0]), tete('Qté', aW[1], AlignmentType.CENTER), tete('Prix moyen', aW[2], AlignmentType.RIGHT), tete('Total', aW[3], AlignmentType.RIGHT), tete('Acheté', aW[4], AlignmentType.CENTER)] }),
  ...l.map(ligneA),
  new TableRow({ children: [cell([p([t(titreTotal, { bold: true, color: C.bleu })], { spacing: { after: 0 } })], aW[0] + aW[1] + aW[2], { span: 3, fill: C.pale }),
    cell([p([t($(totalDe(l)), { bold: true, color: C.bleu })], { spacing: { after: 0 }, alignment: AlignmentType.RIGHT })], aW[3], { fill: C.pale }), cell('', aW[4], { fill: C.pale })] }),
] });
const ess = ACHATS.filter(a => a[3]), opt = ACHATS.filter(a => !a[3]);
ecrire(base('Liste d\'achats · Conciergerie et services', [
  ...entete('PPS Z101 · CONCIERGERIE ET SERVICES', 'Liste d\'achats de base', 'Pour démarrer l\'atelier · Prix moyens indicatifs, taxes en sus'),
  p('**Avant d\'acheter :** vérifiez avec le concierge ce que le centre a déjà en réserve (produits, seau, vadrouille). Utilisez seulement des produits identifiés et sans danger.'),
  h1('1. L\'essentiel pour commencer'),
  tableAchats(ess, 'Total de l\'essentiel'),
  h1('2. Si le centre n\'en a pas déjà'),
  tableAchats(opt, 'Total des articles facultatifs'),
  p([t(' ')]),
  p([t('Budget total, si on achète tout : ', { bold: true, size: 26, color: C.bleu }), t($(totalDe(ACHATS)) + ' avant taxes', { bold: true, size: 26, color: C.lime })]),
  p([t('Les prix sont des moyennes observées dans les grandes surfaces et les quincailleries au Québec. Ils peuvent varier selon le magasin et les promotions.', { italics: true, size: 18, color: C.gris })]),
]), 'Conciergerie-liste-achats.docx');

// ── 2. Résumé du travail de l'équipe (à lire aux membres du personnel)
const SERVICES = [
  ['Les classes et les bureaux', ['Nettoyer les tableaux blancs.', 'Essuyer les tables et les bureaux.', 'Placer les chaises et les tables pour une activité ou une réunion.', 'Remettre un local en ordre après une activité.']],
  ['Les produits du quotidien', ['Remplir les distributeurs de savon et de désinfectant.', 'Remplir les distributeurs d\'essuie-mains.', 'Vérifier les produits manquants et les noter.']],
  ['Le recyclage', ['Récupérer les canettes et les bouteilles consignées.', 'Vider les bacs de recyclage.', 'Trier le papier et le carton.']],
  ['La salle du personnel', ['Nettoyer le micro-ondes et les comptoirs.', 'Vider le réfrigérateur des aliments périmés (sur demande).', 'Ranger la vaisselle.']],
  ['Les petits services', ['Livrer du matériel ou du courrier interne d\'un local à l\'autre.', 'Ranger une armoire ou du matériel.', 'Arroser les plantes.', 'Installer des affiches sur les babillards.']],
];
ecrire(base('Notre équipe · Conciergerie et services', [
  ...entete('PPS Z101 · ATELIER EXPLORATOIRE', 'Conciergerie et services', 'Qui nous sommes et ce que nous pouvons faire pour vous'),
  h1('Qui sommes-nous?'),
  p('Nous sommes l\'équipe **Conciergerie et services** du programme PPS Z101. Dans notre atelier exploratoire, nous apprenons un vrai travail : entretenir le centre et rendre service à l\'équipe-école.'),
  h1('Notre rôle dans le centre'),
  puce('Nous gardons le centre **propre, beau et accueillant**.'),
  puce('Nous **rendons service** aux enseignants, aux secrétaires et aux directions.'),
  puce('Nous développons des compétences pour l\'emploi : **organisation, autonomie, travail d\'équipe et service à la clientèle**.'),
  h1('Quand sommes-nous disponibles?'),
  p([t('Le mardi matin et le jeudi matin seulement.', { bold: true, size: 26, color: C.bleu })]),
  h1('Les services que vous pouvez nous demander'),
  ...SERVICES.flatMap(([titre, l]) => [p([t(titre, { bold: true, color: C.bleu2 })], { spacing: { before: 120, after: 40 }, keepNext: true }), ...l.map(s => puce(s))]),
  h1('Comment faire une demande?'),
  puce('Remplissez un **coupon de demande** : sur le babillard des services ou remis en main propre par un élève de l\'équipe.'),
  puce('Indiquez votre **nom**, votre **local**, le **service** demandé et le **moment** : mardi ou jeudi matin.'),
  puce('Déposez le coupon dans la **boîte de l\'équipe** ou remettez-le à un élève de l\'équipe.'),
  h1('Ce que nous ne faisons pas'),
  puce('Utiliser des produits dangereux ou non identifiés.'),
  puce('Monter dans une échelle ou travailler en hauteur.'),
  puce('Manipuler des documents confidentiels.'),
  puce('Remplacer le travail du concierge du centre : nous l\'aidons.'),
  p([t(' ')]),
  p([t('Merci de nous faire confiance : chaque demande nous aide à apprendre un vrai métier!', { italics: true, color: C.lime })]),
]), 'Conciergerie-notre-equipe.docx');

// ── 3. Affiche et coupons pour le babillard
const coupon = () => {
  const lignes = [
    p([t('DEMANDE DE SERVICE', { bold: true, size: 30, color: C.bleu }), t('   Conciergerie et services · PPS Z101', { size: 18, color: C.gris })], { spacing: { after: 120 } }),
    p([t('Nom : ', { bold: true }), t('_______________________________________________')], { spacing: { after: 120 } }),
    p([t('Local : ', { bold: true }), t('____________________   '), t('Date souhaitée : ', { bold: true }), t('_______________')], { spacing: { after: 140 } }),
    p([t('Service demandé :', { bold: true })], { spacing: { after: 40 } }),
    p([t('☐ Nettoyer le tableau ou les tables    ☐ Remplir le savon ou les produits    ☐ Récupérer les canettes')], { spacing: { after: 40 } }),
    p([t('☐ Vider le recyclage    ☐ Placer ou ranger un local    ☐ Livrer du matériel    ☐ Salle du personnel')], { spacing: { after: 80 } }),
    p([t('☐ Autre : ', { bold: true }), t('_____________________________________________________')], { spacing: { after: 140 } }),
    p([t('Moment : ', { bold: true }), t('☐ Mardi matin     ☐ Jeudi matin', { bold: true, color: C.bleu })], { spacing: { after: 140 } }),
    p([t('Réservé à l\'équipe :  Fait le ', { size: 18, color: C.gris }), t('__________', { size: 18, color: C.gris }), t('  par ', { size: 18, color: C.gris }), t('_____________________', { size: 18, color: C.gris })], { spacing: { after: 0 } }),
  ];
  const coupe = { style: BorderStyle.DASHED, size: 12, color: C.gris };
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], layout: TableLayoutType.FIXED,
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: W, type: WidthType.DXA }, margins: { top: 200, bottom: 200, left: 280, right: 280 },
      borders: { top: coupe, bottom: coupe, left: coupe, right: coupe }, children: lignes })] })] });
};
const sep = () => p([t('✂', { size: 22, color: C.gris })], { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 } });
ecrire(base('Babillard · Conciergerie et services', [
  // Affiche
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: LOGO, transformation: { width: 130, height: 130 } })], spacing: { after: 200 } }),
  p([t('BESOIN D\'UN COUP DE MAIN?', { bold: true, size: 64, color: C.bleu })], { alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
  p([t('L\'équipe Conciergerie et services est là pour vous!', { bold: true, size: 32, color: C.lime })], { alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
  ...['Nettoyer un tableau ou des tables', 'Remplir le savon et les produits', 'Récupérer les canettes', 'Préparer ou ranger un local', 'Livrer du matériel', 'Et bien plus!'].map(s =>
    p([t('✔  ', { bold: true, size: 32, color: C.lime }), t(s, { size: 32 })], { alignment: AlignmentType.CENTER, spacing: { after: 80 } })),
  p([t(' ')], { spacing: { after: 160 } }),
  new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [W], layout: TableLayoutType.FIXED, rows: [new TableRow({ children: [
    cell([p([t('Le mardi matin et le jeudi matin', { bold: true, size: 36, color: 'FFFFFF' })], { alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
      p([t('Prenez un coupon, remplissez-le et déposez-le dans notre boîte.', { size: 26, color: 'FFFFFF' })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })], W, { fill: C.bleu, borders: { top: NONE, bottom: NONE, left: NONE, right: NONE } })] })] }),
  p([t('Un atelier exploratoire du programme PPS Z101 · CFGA De La Jonquière', { italics: true, size: 18, color: C.gris })], { alignment: AlignmentType.CENTER, spacing: { before: 300 } }),
  new Paragraph({ children: [new PageBreak()] }),
  // Coupons : 2 par page
  coupon(), sep(), coupon(),
  new Paragraph({ children: [new PageBreak()] }),
  coupon(), sep(), coupon(),
], false), 'Conciergerie-babillard-coupons.docx');

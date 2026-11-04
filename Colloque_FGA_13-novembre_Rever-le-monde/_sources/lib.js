// Mise en page « carnet d'atelier » : typographique, filets fins, une seule couleur d'accent.
const fs = require('fs');
const d = require('docx');
const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, HeadingLevel, ImageRun, PageBreak, ColumnBreak, LevelFormat, Footer,
  PageNumber, VerticalAlign, TableLayoutType } = d;

const SERIF = 'Cambria', SANS = 'Arial', DISPLAY = 'Anton';
const EMBED = [{ name: 'Anton', data: fs.readFileSync(__dirname + '/fonts/Anton-Regular.ttf'), characterSet: d.CharacterSet.ANSI }];
// Palette (remplaçable par les couleurs officielles du CFGA) : mauve = encre, jaune = surligneur
const C = { ink: '1E1A22', accent: '5B2A86', yellow: 'F2C230', lilac: 'EEE6F6', grey: '6B6472', hair: 'C3BACB', paper: 'FBF8EF' };

function runs(t, base = {}) {
  const out = [];
  String(t).split(/(==[^=]+==|\*\*[^*]+\*\*|\*[^*]+\*)/).forEach(s => {
    if (!s) return;
    if (s.startsWith('==')) out.push(new TextRun({ ...base, text: s.slice(2, -2), bold: true, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.yellow } }));
    else if (s.startsWith('**')) out.push(new TextRun({ ...base, text: s.slice(2, -2), bold: true }));
    else if (s.startsWith('*') && s.length > 2) out.push(new TextRun({ ...base, text: s.slice(1, -1), italics: true }));
    else out.push(new TextRun({ ...base, text: s }));
  });
  return out;
}
const P = (t, o = {}) => new Paragraph({ children: runs(t, o.run || {}), spacing: { after: o.after ?? 120, before: o.before ?? 0, line: o.line ?? 288 }, alignment: o.align, keepNext: o.keepNext, indent: o.indent });
// Petite étiquette en petites capitales espacées
const label = (t, o = {}) => new Paragraph({ children: [new TextRun({ text: t, font: SANS, size: o.size || 15, smallCaps: true, bold: true, characterSpacing: 40, color: o.color || C.accent })], spacing: { after: o.after ?? 60, before: o.before ?? 0 }, keepNext: true });

// Titre de section : grand numéro en accent + titre, filet fin dessous
function H1(num, t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, spacing: { before: 420, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.ink, space: 6 } },
    children: [new TextRun({ text: ' ' + num + ' ', color: C.accent, font: DISPLAY, size: 44, shading: { type: ShadingType.CLEAR, color: 'auto', fill: C.yellow } }), new TextRun({ text: '  ' + t })] });
}
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const B = (t, lvl = 0) => new Paragraph({ numbering: { reference: 'dash', level: lvl }, children: runs(t), spacing: { after: 70, line: 276 } });
const N = (t, inst = 1) => new Paragraph({ numbering: { reference: 'num', level: 0, instance: inst }, children: runs(t), spacing: { after: 70, line: 276 } });
const BR = () => new Paragraph({ children: [new PageBreak()] });
const CB = () => new Paragraph({ children: [new ColumnBreak()] });
const SP = (n = 80) => new Paragraph({ children: [], spacing: { after: n } });
const rule = (o = {}) => new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: o.size || 4, color: o.color || C.hair, space: 1 } }, spacing: { after: o.after ?? 160, before: o.before ?? 0 } });

// Note de marge : étiquette + texte en retrait, filet vertical fin en accent (pas d'aplat de couleur)
function note(lab, items, o = {}) {
  const out = [];
  const bd = { left: { style: BorderStyle.SINGLE, size: 8, color: o.color || C.accent, space: 10 } };
  if (lab) out.push(new Paragraph({ border: bd, indent: { left: 240 }, keepNext: true, spacing: { after: 40, before: o.before ?? 80 },
    children: [new TextRun({ text: lab, font: SANS, size: 15, smallCaps: true, bold: true, characterSpacing: 40, color: o.color || C.accent })] }));
  items.forEach((t, i) => out.push(new Paragraph({ border: bd, indent: { left: 240 }, keepNext: i < items.length - 1,
    spacing: { after: i === items.length - 1 ? (o.after ?? 200) : 60, line: 276 }, children: runs(t, o.run || {}) })));
  return out;
}
// Citation : grand guillemet, italique, source en petites capitales
function quote(t, src, o = {}) {
  const out = [new Paragraph({ indent: { left: o.indent ?? 360, right: o.indent ?? 360 }, spacing: { before: 120, after: 40, line: 300 }, keepNext: true,
    children: [new TextRun({ text: '« ', color: C.accent, size: o.size || 30, font: SERIF }), new TextRun({ text: t, italics: true, size: o.size || 30, font: SERIF }), new TextRun({ text: ' »', color: C.accent, size: o.size || 30, font: SERIF })] })];
  if (src) out.push(new Paragraph({ indent: { left: o.indent ?? 360 }, spacing: { after: o.after ?? 200 }, children: [new TextRun({ text: '— ' + src, font: SANS, size: 15, smallCaps: true, characterSpacing: 30, color: C.grey })] }));
  return out;
}

const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const hair = { style: BorderStyle.SINGLE, size: 2, color: C.hair };
const ink = { style: BorderStyle.SINGLE, size: 8, color: C.ink };

function cellContent(x, o = {}) {
  if (x instanceof Paragraph || x instanceof Table) return [x];
  if (Array.isArray(x)) return x.flatMap(y => cellContent(y, o));
  return [new Paragraph({ children: runs(x, o.run || {}), spacing: { after: 40, line: 264 }, alignment: o.align })];
}
// Tableau éditorial : en-tête en petites capitales, filets horizontaux seulement
function tbl(headers, rows, widths, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const R = [];
  if (headers) R.push(new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, margins: { top: 40, bottom: 60, left: i ? 120 : 0, right: 120 },
    borders: { top: none, left: none, right: none, bottom: ink },
    children: [new Paragraph({ children: [new TextRun({ text: h, font: SANS, size: 15, bold: true, smallCaps: true, characterSpacing: 30, color: C.grey })] })] })) }));
  rows.forEach((row, ri) => R.push(new TableRow({ cantSplit: true, children: row.map((x, i) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, margins: { top: 90, bottom: 90, left: i ? 120 : 0, right: 120 }, verticalAlign: VerticalAlign.TOP,
    borders: { top: none, left: none, right: none, bottom: ri === rows.length - 1 ? ink : hair },
    children: cellContent(x, i === 0 && o.firstAccent ? { run: { color: C.accent } } : {}) })) })));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: R, layout: TableLayoutType.FIXED,
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none } });
}
// Cases à remplir : lignes pointillées
function lines(n, w) {
  return Array.from({ length: n }, () => new Paragraph({ children: [], spacing: { after: 0, before: 300 }, border: { bottom: { style: BorderStyle.DOTTED, size: 6, color: C.hair, space: 1 } } }));
}
function img(path, w, h, o = {}) {
  return new Paragraph({ alignment: o.align ?? AlignmentType.CENTER, spacing: { after: o.after ?? 80, before: o.before ?? 0 }, keepNext: o.keepNext,
    children: [new ImageRun({ type: path.endsWith('.png') ? 'png' : 'jpg', data: fs.readFileSync(path), transformation: { width: w, height: h } })] });
}
const caption = t => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: t, font: SANS, size: 15, smallCaps: true, characterSpacing: 30, color: C.grey })] });

function styles() {
  return {
    default: { document: { run: { font: SERIF, size: 21, color: C.ink } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: DISPLAY, size: 40, color: C.ink }, paragraph: { spacing: { before: 420, after: 200 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: DISPLAY, size: 27, color: C.accent }, paragraph: { spacing: { before: 260, after: 100 }, keepNext: true, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SANS, size: 17, bold: true, smallCaps: true, characterSpacing: 30, color: C.accent }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 2 } }
    ]
  };
}
const numbering = { config: [
  { reference: 'dash', levels: [
    { level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { run: { color: C.accent, bold: true }, paragraph: { indent: { left: 300, hanging: 300 } } } },
    { level: 1, format: LevelFormat.BULLET, text: '·', alignment: AlignmentType.LEFT, style: { run: { color: C.grey }, paragraph: { indent: { left: 600, hanging: 260 } } } }] },
  { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1', alignment: AlignmentType.LEFT, style: { run: { color: C.accent, font: SERIF }, paragraph: { indent: { left: 340, hanging: 340 } } } }] }
] };
function footer(txt) {
  return { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [
    new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.accent, font: SERIF }),
    new TextRun({ text: '   ' + txt, size: 14, color: C.grey, font: SANS, smallCaps: true, characterSpacing: 30 })] })] }) };
}
// Page couverture typographique (sans bandeau)
function cover({ kicker, title, sub, meta, image }) {
  const out = [
    label(kicker, { size: 16, after: 0 }), new Paragraph({ children: [new TextRun({ text: ' ', size: 40 })], spacing: { after: 200 } }),
    new Paragraph({ spacing: { before: 120, after: 200, line: 1150, lineRule: d.LineRuleType.AT_LEAST }, children: [new TextRun({ text: title, font: DISPLAY, size: 84, color: C.ink })] }),
    new Paragraph({ spacing: { after: 360 }, children: [new TextRun({ text: sub, font: SERIF, size: 28, italics: true, color: C.grey })] }),
    new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 24, color: C.accent, space: 1 } }, spacing: { after: 360 } })
  ];
  if (image) out.push(img(image.path, image.w, image.h, { align: AlignmentType.LEFT, after: 60 }), caption(image.cap));
  (meta || []).forEach(m => out.push(P(m, { after: 40, run: { size: 19 } })));
  return out;
}
async function save(doc, path) { fs.writeFileSync(path, await d.Packer.toBuffer(doc)); console.log('écrit', path); }
const page = (landscape) => ({ size: { width: 12240, height: 15840, ...(landscape ? { orientation: d.PageOrientation.LANDSCAPE } : {}) } });

module.exports = { EMBED, DISPLAY, d, C, SERIF, SANS, runs, P, label, H1, H2, H3, B, N, BR, CB, SP, rule, note, quote, tbl, lines, img, caption, styles, numbering, footer, cover, save, page, AlignmentType, TextRun, Paragraph };

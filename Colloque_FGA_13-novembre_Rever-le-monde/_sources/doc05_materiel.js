const L = require('./lib');
const { d, C, EMBED, SANS, P, label, H1, BR, SP, img, styles, numbering, footer, save, page } = L;
const OUT = process.argv[2];
const I = __dirname + '/img/';
const W = 10080;
const cut = { style: d.BorderStyle.DASHED, size: 6, color: C.grey };

function grid(cells, cols, h) {
  const w = Math.floor(W / cols);
  const rows = [];
  for (let i = 0; i < cells.length; i += cols) rows.push(new d.TableRow({ height: { value: h, rule: d.HeightRule.EXACT }, cantSplit: true,
    children: cells.slice(i, i + cols).map(c => new d.TableCell({ width: { size: w, type: d.WidthType.DXA }, verticalAlign: d.VerticalAlign.CENTER,
      borders: { top: cut, bottom: cut, left: cut, right: cut }, margins: { top: 120, bottom: 120, left: 220, right: 220 }, children: c })) }));
  return new d.Table({ width: { size: w * cols, type: d.WidthType.DXA }, columnWidths: Array(cols).fill(w), layout: d.TableLayoutType.FIXED, rows });
}
const big = (t, size = 120, color = C.ink, o = {}) => new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { after: o.after ?? 120, line: Math.round(size * 12), lineRule: d.LineRuleType.AT_LEAST },
  children: [new d.TextRun({ text: t, font: 'Anton', size, color })] });

const citations = [
  '[…] redonné envie d’aller à l’école.',
  'Il n’y a pas un matin qu’il n’a hâte de se rendre dans sa classe. Il se sent écouté, compris et surtout, accepté.',
  '[…] valoriser leurs forces et améliorer les aspects plus difficiles pour eux, et ça sans jugement.',
  '[…] ouvrir tous ces possibles, multiplier les espaces d’accomplissement, donner envie de faire des projets !',
  '[…] leur permettre de construire leur confiance jour après jour.',
  '[…] des connaissances, mais aussi de la confiance en eux et une meilleure connaissance d’eux-mêmes et de leurs forces.'
];

const kids = [
  label('Matériel à imprimer · Colloque régional FGA · 13 novembre 2026', { size: 16 }),
  big('MATÉRIEL À IMPRIMER', 64, C.ink, { after: 200 }),
  P('Quatre pièces : l’affiche du mur d’enjeux, les fiches « Mon premier pas », les jetons de vote et les cartons de signaux. Les traits pointillés indiquent où découper.', { run: { italics: true, color: C.grey } }),
  BR(),

  // Affiche
  SP(600),
  big('QU’EST-CE QUI', 110, C.ink, { after: 0 }), big('VOUS DÉRANGE', 150, C.accent, { after: 0 }), big('DANS LE MONDE,', 110, C.ink, { after: 0 }),
  new d.Paragraph({ alignment: d.AlignmentType.CENTER, spacing: { after: 600 }, children: [new d.TextRun({ text: ' ICI OU AILLEURS ? ', font: 'Anton', size: 110, shading: { type: d.ShadingType.CLEAR, color: 'auto', fill: C.yellow } })] }),
  P('Collez votre papillon. Une idée par papillon.', { align: d.AlignmentType.CENTER, run: { font: 'Cambria', italics: true, size: 32, color: C.grey } }),
  BR(),

  // Fiches Mon premier pas
  H1('A', 'Fiches « Mon premier pas » · 3 par page'),
  ...[1, 2, 3].flatMap(() => [img(I + 'il_billet.png', 600, 229, { after: 0 }), new d.Paragraph({ children: [], spacing: { after: 260 }, border: { bottom: cut } })]),
  BR(),

  // Jetons
  H1('B', 'Jetons de vote · 3 par personne'),
  P('À imprimer sur carton. Ou, plus simple : des gommettes de trois couleurs.', { run: { size: 19, color: C.grey } }),
  ...Array(4).fill(0).map(() => img(I + "il_jetons.png", 540, 180, { after: 60 })),
  BR(),

  // Cartons signaux
  H1('C', 'Cartons de signaux · pour la coanimation'),
  grid([['VERT', 'on continue'], ['JAUNE', 'encore 5 minutes'], ['ROUGE', 'on conclut en une phrase']].map(([a, b]) => [
    big(a, 120, C.ink, { after: 0 }), new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [new d.TextRun({ text: b, font: 'Cambria', italics: true, size: 30, color: C.grey })] })
  ]), 1, 3900)
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Matériel à imprimer · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 900, bottom: 900, left: 1080, right: 1080 } } },
    footers: footer('Rêver le monde de demain · matériel à imprimer'), children: kids }]
});
save(doc, OUT);

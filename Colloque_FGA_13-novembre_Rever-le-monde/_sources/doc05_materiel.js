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
  P('Le matériel de l’atelier : l’affiche du mur d’enjeux, les deux affiches de l’îlot pour la surface verticale (« Notre monde idéal » et « Notre projet »), le rappel des trois votes et les cartons de signaux. Les traits pointillés indiquent où découper.', { run: { italics: true, color: C.grey } }),
  BR(),

  // Affiche : la même que le fichier 05b (11 × 17 po), réduite à la page
  img(I + 'affiche_mur.png', 560, 865, { after: 80 }),
  P('Pour l’entrée, imprimez plutôt le fichier 05b en 11 × 17 po, ou faites-le agrandir. Une affiche par séance.', { align: d.AlignmentType.CENTER, run: { italics: true, size: 18, color: C.grey } }),
  BR(),

  // Affiches de l'îlot (surface verticale)
  H1('A', 'Les affiches de l’îlot · surface verticale'),
  P('Une de chaque par îlot (4 îlots), collées derrière le plexiglas. On écrit dessus au crayon effaçable. Fichiers 05c et 05d, en 11 × 17 po.', { run: { size: 19, color: C.grey } }),
  grid([[img(I + 'affiche_monde.jpg', 300, 463, { after: 40 }), P('05c · Notre monde idéal', { align: d.AlignmentType.CENTER, run: { size: 18 } })], [img(I + 'affiche_projet.jpg', 300, 463, { after: 40 }), P('05d · Notre projet', { align: d.AlignmentType.CENTER, run: { size: 18 } })]].map(c => c), 2, 7800),
  BR(),

  // Les votes
  H1('B', 'Les trois votes · des post-it de couleur'),
  P('Trois post-it par personne, un de chaque couleur. 1 post-it = 1 point. On les colle sur le résultat ou sur une action de l’affiche « Notre projet ».', { run: { size: 19, color: C.grey } }),
  grid([['VERT', 'Coup de cœur', 'Ce projet me touche, il a du sens.'], ['JAUNE-BEIGE', 'Oui, et…', 'J’aime cette action, et je changerais ceci. On écrit la suggestion sur le post-it.'], ['ROSE', 'On est capables', 'Avec nos forces, on peut le réaliser.']].map(([a, b, c]) => [
    big(a, 60, C.ink, { after: 0 }), big(b, 90, C.accent, { after: 0 }), new d.Paragraph({ alignment: d.AlignmentType.CENTER, children: [new d.TextRun({ text: c, font: 'Cambria', italics: true, size: 26, color: C.grey })] })
  ]), 1, 3200),
  BR(),

  // Cartons d'îlot
  H1('C', 'Cartons d’îlot · un par table'),
  grid(['1', '2', '3', '4'].map(n => [big('ÎLOT', 70, C.ink, { after: 0 }), big(n, 200, C.accent, { after: 0 })]), 2, 5200),
  BR(),

  // Cartons signaux
  H1('D', 'Cartons de signaux · pour la coanimation'),
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

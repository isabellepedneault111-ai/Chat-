// Modèle « Vérité ou imposteur » : 1 diapo de consignes + 25 diapos élèves, zones de texte bien délimitées
const pptxgen = require('pptxgenjs');
const p = new pptxgen(); p.layout = 'LAYOUT_WIDE'; // 13,33 × 7,5 po
p.title = 'Vérité ou imposteur · Escouade Z101';
const C = { bleu: '004983', lime: '7AA32B', corail: 'E8604C', soleil: 'F2B33D', nuit: '0E2440', creme: 'F7F5EF', gris: '5B6474' };
const F = 'Segoe UI';
const logo = '/home/user/Chat-/documents/z101/lancement/logo-220.png';

// Consignes
let s = p.addSlide(); s.background = { color: C.nuit };
s.addText('VÉRITÉ OU IMPOSTEUR?', { x: .7, y: .6, w: 10, h: 1.1, fontFace: F, bold: true, fontSize: 48, color: 'FFFFFF' });
s.addText('Escouade Z101 · Lancement', { x: .7, y: 1.6, w: 10, h: .5, fontFace: F, fontSize: 20, color: C.soleil, bold: true });
s.addImage({ path: logo, x: 11.4, y: .5, w: 1.3, h: 1.3 });
const etapes = ['Prends une diapo LIBRE (sans prénom).', 'Écris ton prénom en haut.', 'Écris 2 vérités et 1 mensonge, dans le désordre.', 'Garde le secret : ne dis à personne où est ton mensonge!', 'Ne touche pas aux diapos des autres.'];
etapes.forEach((t, k) => {
  s.addShape(p.ShapeType.ellipse, { x: .8, y: 2.55 + k * .85, w: .6, h: .6, fill: { color: [C.bleu, C.lime, C.corail, C.soleil, '1F64A6'][k] } });
  s.addText(String(k + 1), { x: .8, y: 2.55 + k * .85, w: .6, h: .6, align: 'center', valign: 'middle', fontFace: F, bold: true, fontSize: 22, color: 'FFFFFF' });
  s.addText(t, { x: 1.65, y: 2.5 + k * .85, w: 10.5, h: .7, fontFace: F, fontSize: 24, color: 'FFFFFF', valign: 'middle' });
});
s.addText('Écris seulement ce que tu serais à l\'aise de dire à tout le groupe.', { x: .8, y: 6.75, w: 11.5, h: .45, fontFace: F, italic: true, fontSize: 16, color: 'C9D8EA' });

// Diapos élèves
const coul = [C.bleu, C.lime, C.corail];
for (let n = 1; n <= 25; n++) {
  s = p.addSlide(); s.background = { color: C.creme };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.15, fill: { color: C.nuit } });
  s.addText('VÉRITÉ OU IMPOSTEUR?', { x: .5, y: .2, w: 6, h: .75, fontFace: F, bold: true, fontSize: 28, color: 'FFFFFF', valign: 'middle' });
  s.addText('Diapo ' + n, { x: 10.6, y: .2, w: 2.3, h: .75, fontFace: F, fontSize: 16, color: C.soleil, bold: true, align: 'right', valign: 'middle' });
  // Zone du prénom
  s.addText('Mon prénom :', { x: .6, y: 1.45, w: 2.3, h: .7, fontFace: F, fontSize: 22, bold: true, color: C.bleu, valign: 'middle' });
  s.addText('Clique ici et écris ton prénom', { x: 2.9, y: 1.45, w: 6.5, h: .7, fontFace: F, fontSize: 24, color: '8A8F99', italic: true, valign: 'middle', fill: { color: 'FFFFFF' }, line: { color: C.soleil, width: 2.5 }, margin: 10 });
  // Trois affirmations
  [0, 1, 2].forEach(k => {
    const y = 2.5 + k * 1.55;
    s.addShape(p.ShapeType.roundRect, { x: .6, y, w: 1.3, h: 1.3, fill: { color: coul[k] }, rectRadius: .2 });
    s.addText(String(k + 1), { x: .6, y, w: 1.3, h: 1.3, align: 'center', valign: 'middle', fontFace: F, bold: true, fontSize: 54, color: 'FFFFFF' });
    s.addText('Clique ici et écris une affirmation…', { x: 2.1, y, w: 10.6, h: 1.3, fontFace: F, fontSize: 26, color: '8A8F99', italic: true, valign: 'middle', fill: { color: 'FFFFFF' }, line: { color: coul[k], width: 3 }, margin: 14, rectRadius: .15, shape: p.ShapeType.roundRect });
  });
  s.addText('Le groupe vote : 1, 2 ou 3?', { x: 8.3, y: 7.0, w: 4.5, h: .4, fontFace: F, fontSize: 14, color: C.gris, bold: true, align: 'right' });
}
p.writeFile({ fileName: '/home/user/Chat-/documents/z101/lancement/Verite-ou-imposteur.pptx' }).then(f => console.log('ok', f));

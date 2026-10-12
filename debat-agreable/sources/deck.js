const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const { applyTheme } = require("/root/.claude/skills/synced/2159d0f0-c9f4-456a-9726-1684b994a977_c4c777f8-0dfe-457d-9a0d-4ed1c19cf05f/pptx/scripts/apply_theme.js");

const HEX = { ink: "1B1714", paper: "EFE6D1", red: "D2232A", orange: "F0A12E", white: "FFFFFF", brown: "6B4B10" };
const THEME = {
  name: "Confrontation agreable",
  headFontFace: "Rockwell Extra Bold",
  bodyFontFace: "Arial",
  colors: {
    dk1: HEX.ink, lt1: HEX.white, dk2: HEX.brown, lt2: HEX.paper,
    accent1: HEX.red, accent2: HEX.orange, accent3: HEX.ink, accent4: "8C1A1F", accent5: "C9B994", accent6: "3E6E5A",
    hlink: HEX.red, folHlink: HEX.brown,
  },
};

// ---------- silhouettes « risographie » (calque orange décalé + encre) ----------
const P = {
  jump: { h: [54, 14], n: [52, 27], hp: [46, 60], a: [[34, 18], [18, 4]], b: [[68, 20], [86, 8]], c: [[30, 74], [38, 96]], d: [[62, 76], [80, 90]] },
  point: { h: [46, 14], n: [46, 28], hp: [46, 66], a: [[34, 46], [40, 64]], b: [[64, 30], [86, 26]], c: [[40, 90], [36, 116]], d: [[54, 90], [60, 116]] },
  push: { h: [62, 20], n: [56, 32], hp: [40, 66], a: [[72, 42], [90, 40]], b: [[70, 34], [90, 30]], c: [[30, 90], [14, 112]], d: [[52, 90], [58, 116]] },
  fog: { h: [50, 16], n: [50, 30], hp: [50, 68], a: [[30, 30], [18, 14]], b: [[70, 30], [82, 14]], c: [[40, 92], [30, 116]], d: [[60, 92], [72, 116]] },
  prof: { h: [50, 14], n: [50, 28], hp: [50, 68], a: [[36, 48], [42, 62]], b: [[64, 22], [66, 2]], c: [[44, 92], [42, 118]], d: [[56, 92], [58, 118]] },
  shrug: { h: [50, 14], n: [50, 30], hp: [52, 68], a: [[30, 40], [22, 26]], b: [[70, 40], [78, 26]], c: [[44, 92], [38, 118]], d: [[60, 92], [64, 118]] },
  hide: { h: [42, 62], n: [48, 72], hp: [64, 96], a: [[40, 86], [34, 98]], b: [[56, 92], [50, 104]], c: [[48, 104], [40, 118]], d: [[66, 110], [56, 118]] },
  think: { h: [50, 16], n: [50, 30], hp: [50, 68], a: [[36, 50], [58, 52]], b: [[66, 46], [54, 22]], c: [[44, 92], [42, 118]], d: [[58, 92], [62, 118]] },
  walk: { h: [52, 14], n: [50, 28], hp: [48, 66], a: [[38, 46], [30, 62]], b: [[62, 46], [70, 60]], c: [[38, 90], [28, 116]], d: [[58, 90], [70, 114]] },
};
function figSVG(pose, ink = "#" + HEX.ink, mirror = false) {
  const p = P[pose];
  const m = ([x, y]) => [mirror ? 100 - x : x, y];
  const seg = (pts, w, c) => `<polyline points="${pts.map(m).map((q) => q.join(",")).join(" ")}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const draw = (c) => [seg([p.n, p.hp], 17, c), seg([p.n, ...p.a], 8, c), seg([p.n, ...p.b], 8, c), seg([p.hp, ...p.c], 10, c), seg([p.hp, ...p.d], 10, c), `<circle cx="${m(p.h)[0]}" cy="${m(p.h)[1]}" r="9.5" fill="${c}"/>`].join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 106 128" width="530" height="640"><g transform="translate(4,3)">${draw("#" + HEX.orange)}</g><g>${draw(ink)}</g></svg>`;
}
async function fig(pose, opts = {}) {
  const buf = await sharp(Buffer.from(figSVG(pose, opts.ink, opts.mirror))).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
  pres.title = "La confrontation agréable";
  pres.author = "Séminaire pédagonumérique";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  // ---------- layouts ----------
  pres.defineSlideMaster({
    title: "COUVERTURE",
    background: { color: C.background2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.6, y: 2.3, w: 8.4, h: 4.2, fontSize: 66, color: C.accent1, valign: "top", margin: 0, lineSpacingMultiple: 0.85 }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "SECTION",
    background: { color: C.accent1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.6, y: 3.6, w: 8.2, h: 2.4, fontSize: 54, color: C.background2, valign: "top", margin: 0 }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 6.0, w: 8.2, h: 0.8, fontSize: 18, color: C.background2, margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.35, fontFace: "Arial", fontSize: 10, color: C.background2, align: "right" },
  });
  pres.defineSlideMaster({
    title: "CONTENU",
    background: { color: C.background2 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.6, y: 0.4, w: 10.1, h: 0.95, fontSize: 36, color: C.accent1, valign: "top", margin: 0 }, text: "" } },
      { text: { text: "LA CONFRONTATION AGRÉABLE", options: { x: 0.6, y: 6.98, w: 6, h: 0.3, fontFace: "Arial", fontSize: 9, bold: true, color: C.text2, charSpacing: 2, margin: 0 } } },
    ],
    slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.35, fontFace: "Arial", fontSize: 10, color: C.accent1, align: "right" },
  });
  pres.defineSlideMaster({
    title: "NUIT",
    background: { color: C.text1 },
    objects: [
      { placeholder: { options: { name: "title", type: "title", align: "left", x: 0.6, y: 0.4, w: 10.1, h: 0.95, fontSize: 36, color: C.accent2, valign: "top", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.35, fontFace: "Arial", fontSize: 10, color: C.accent2, align: "right" },
  });

  // ---------- helpers ----------
  const T = (s, text, o) => s.addText(text, { isTextBox: true, fontFace: "Arial", color: C.text1, margin: 0, valign: "top", ...o });
  const box = (s, x, y, w, h, o = {}) => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: o.fill || C.background1, transparency: o.tr ?? 0 }, line: { color: o.line || C.text1, width: o.lw ?? 2 }, objectName: o.name });
  const chip = (s, x, y, txt, o = {}) => {
    const w = o.w || 0.6;
    s.addShape(pres.shapes.OVAL, { x, y, w, h: w, fill: { color: o.fill || C.accent1 }, line: { color: C.text1, width: 1.5 } });
    s.addText(txt, { isTextBox: true, x, y, w, h: w, align: "center", valign: "middle", fontFace: THEME.headFontFace, fontSize: o.fs || 20, color: o.color || C.background2, margin: 0 });
  };
  const timer = (s, txt, dark) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 10.9, y: 0.45, w: 1.8, h: 0.5, rectRadius: 0.25, fill: { color: dark ? C.accent2 : C.text1 }, line: { type: "none" } });
    s.addText("⏱ " + txt, { isTextBox: true, x: 10.9, y: 0.45, w: 1.8, h: 0.5, align: "center", valign: "middle", fontSize: 14, bold: true, color: dark ? C.text1 : C.background2, margin: 0 });
  };
  const content = (sec) => pres.addSlide({ masterName: "CONTENU", sectionTitle: sec });
  const night = (sec) => pres.addSlide({ masterName: "NUIT", sectionTitle: sec });
  const section = async (sec, num, title, sub, pose) => {
    const s = pres.addSlide({ masterName: "SECTION", sectionTitle: sec });
    s.addText(num, { isTextBox: true, x: 0.5, y: 0.3, w: 5, h: 3.2, fontFace: THEME.headFontFace, fontSize: 200, color: C.text1, margin: 0, valign: "top" });
    s.addText(title, { placeholder: "title" });
    s.addText(sub, { placeholder: "body" });
    s.addImage({ data: await fig(pose, { ink: "#" + HEX.paper }), x: 8.9, y: 1.0, w: 3.9, h: 4.7, objectName: "silhouette" });
    return s;
  };

  // =====================================================================
  // 1. COUVERTURE
  pres.addSection({ title: "Ouverture" });
  let s = pres.addSlide({ masterName: "COUVERTURE", sectionTitle: "Ouverture" });
  T(s, "SÉMINAIRE · 3 H · ADULTES CURIEUX", { x: 0.6, y: 0.55, w: 7, h: 0.4, fontSize: 14, bold: true, charSpacing: 3 });
  s.addText("LA\nCONFRON-\nTATION\nAGRÉABLE", { placeholder: "title" });
  s.addImage({ data: await fig("jump"), x: 8.3, y: 0.2, w: 4.6, h: 5.55, rotate: 8, objectName: "sauteur" });
  T(s, [
    { text: "Dur sur les idées.", options: { breakLine: true } },
    { text: "Doux avec les gens." },
  ], { x: 9.6, y: 5.75, w: 3.2, h: 1.2, fontSize: 18, bold: true, align: "left" });
  s.addNotes("Accueil. Notre pari : apprendre les coups bas de Schopenhauer pour les reconnaître, puis pratiquer un débat ferme ET agréable : dur sur les idées, doux avec les gens. Durée totale : environ 3 h.");

  // 2. QUESTION D'OUVERTURE
  s = night("Ouverture");
  s.addText("Question d'entrée", { placeholder: "title" });
  T(s, "As-tu déjà gagné un débat…\net perdu un ami?", { x: 0.6, y: 1.9, w: 8.6, h: 2.6, fontFace: THEME.headFontFace, fontSize: 48, color: C.background2, lineSpacingMultiple: 0.95 });
  T(s, "Écris ta réponse sur un papillon adhésif. Pas de nom. On les colle sur le « mur des cicatrices », on les relira à la fin.", { x: 0.6, y: 5.2, w: 7.6, h: 0.9, fontSize: 16, color: C.background2 });
  s.addImage({ data: await fig("point"), x: 9.3, y: 1.6, w: 1.75, h: 2.1 });
  s.addImage({ data: await fig("point", { mirror: true }), x: 11.0, y: 1.6, w: 1.75, h: 2.1 });
  s.addImage({ data: await fig("hide", { ink: "#" + HEX.paper }), x: 10.15, y: 4.0, w: 1.75, h: 2.1 });
  timer(s, "3 min", true);
  s.addNotes("Question d'amorce, anonyme. Le mur des cicatrices sert de fil rouge : à la fin, chacun choisit un papillon et propose ce qu'il aurait fallu faire autrement.");

  // 3. DÉROULEMENT
  s = content("Ouverture");
  s.addText("Le parcours de la séance", { placeholder: "title" });
  const steps = [
    ["0", "Échauffement", "Zine, ligne qui bouge, course à trois jambes", "25 min"],
    ["1", "Les coups bas", "Coche-les, dur/doux, pyramide", "20 min"],
    ["2", "Le bestiaire", "Croquis-éclair, bal masqué, bingo", "40 min"],
    ["3", "Écrire", "Ascenseur, homme d'acier, 39ᵉ stratagème", "35 min"],
    ["4", "L'arène", "Aquarium à jetons", "25 min"],
    ["5", "Repartir avec", "Talisman, mise à jour relationnelle", "35 min"],
  ];
  steps.forEach(([n, h, d, t], i) => {
    const x = 0.6 + i * 2.05;
    chip(s, x + 0.65, 1.75, n, { w: 0.7, fill: i % 2 ? C.accent2 : C.accent1, color: i % 2 ? C.text1 : C.background2, fs: 24 });
    if (i < 5) s.addShape(pres.shapes.LINE, { x: x + 1.4, y: 2.1, w: 1.35, h: 0, line: { color: C.text1, width: 2, dashType: "dash" } });
    box(s, x, 2.75, 1.85, 3.3);
    T(s, h, { x: x + 0.15, y: 2.9, w: 1.55, h: 0.95, fontFace: THEME.headFontFace, fontSize: 15, color: C.accent1 });
    T(s, d, { x: x + 0.15, y: 3.9, w: 1.55, h: 1.4, fontSize: 13 });
    T(s, t, { x: x + 0.15, y: 5.5, w: 1.55, h: 0.4, fontSize: 14, bold: true, color: C.text2 });
  });
  T(s, [{ text: "Règle du joker : ", options: { bold: true, color: C.accent1 } }, { text: "chacun peut passer son tour, à tout moment, sans se justifier." }], { x: 0.6, y: 6.3, w: 12.1, h: 0.45, fontSize: 15 });
  s.addNotes("Aperçu de la séance. Prévoir une pause entre le bestiaire et les ateliers d'écriture. Public : adultes volontaires de tout acabit, sans prérequis. Annoncer la règle du joker dès le départ, et choisir des sujets qui font réfléchir sans viser l'identité ou le vécu intime des personnes présentes.");

  // =====================================================================
  pres.addSection({ title: "Échauffement" });
  await section("Échauffement", "0", "Échauffement", "Trois activités pour entrer dans le jeu sans entrer en guerre", "jump");

  // 5. PLIAGE DU ZINE
  s = content("Échauffement");
  s.addText("Activité 1 · Plie ton zine", { placeholder: "title" });
  timer(s, "7 min");
  const fold = ["Plier en deux sur la longueur", "Plier en 4 sur la largeur : 8 cases", "Couper la fente centrale", "Pousser vers le centre : losange", "Rabattre en livret", "Couverture sur le dessus"];
  fold.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 2.6, y = 1.65 + row * 2.15;
    box(s, x, y, 2.4, 1.9, { fill: C.background1 });
    chip(s, x + 0.15, y + 0.15, String(i + 1), { w: 0.55, fs: 18 });
    T(s, f, { x: x + 0.15, y: y + 0.85, w: 2.1, h: 0.95, fontSize: 15, bold: true });
  });
  box(s, 8.7, 1.65, 4.0, 4.2, { fill: C.text1, line: C.text1 });
  T(s, "Pourquoi commencer par du papier?", { x: 8.95, y: 1.85, w: 3.5, h: 0.9, fontFace: THEME.headFontFace, fontSize: 18, color: C.accent2 });
  T(s, "Un geste manuel ralentit la salle, crée un objet commun et donne à chacun un carnet de 8 activités à remplir en cours de route.", { x: 8.95, y: 2.85, w: 3.5, h: 2.8, fontSize: 15, color: C.background2 });
  s.addNotes("Imprimer la page 1 du PDF du zine (taille réelle) pour chacun, et la page 3 (planche de talismans) pour la fin. Démontrer le pliage une fois, puis laisser les participants s'entraider : premier geste de coopération.");

  // 7. LA LIGNE QUI BOUGE
  s = content("Échauffement");
  s.addText("Activité 2 · La ligne qui bouge", { placeholder: "title" });
  timer(s, "13 min");
  s.addShape(pres.shapes.LINE, { x: 0.9, y: 2.55, w: 11.5, h: 0, line: { color: C.text1, width: 4, beginArrowType: "triangle", endArrowType: "triangle" } });
  T(s, "TOTALEMENT D'ACCORD", { x: 0.6, y: 1.65, w: 4, h: 0.4, fontSize: 13, bold: true, color: C.accent1 });
  T(s, "PAS DU TOUT", { x: 9.7, y: 1.65, w: 3, h: 0.4, fontSize: 13, bold: true, color: C.accent1, align: "right" });
  const statements = ["« Le télétravail devrait être un droit. »", "« On devrait pouvoir parler politique au souper de famille. »", "« Un bon argument peut toujours être dit poliment. »", "« Changer d'avis, c'est perdre la face. »"];
  T(s, "Énoncés possibles", { x: 0.6, y: 3.0, w: 6, h: 0.45, fontFace: THEME.headFontFace, fontSize: 18, color: C.accent1 });
  T(s, statements.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < statements.length - 1 } })), { x: 0.6, y: 3.5, w: 6.2, h: 2.3, fontSize: 16, paraSpaceAfter: 8 });
  box(s, 7.3, 3.0, 5.4, 3.3, { fill: C.text1, line: C.text1 });
  T(s, "La règle surprise", { x: 7.55, y: 3.2, w: 5, h: 0.5, fontFace: THEME.headFontFace, fontSize: 20, color: C.accent2 });
  T(s, "On ne peut bouger que si quelqu'un d'autre nous a fait bouger. Puis, au signal « Change de bord! », chacun va défendre la position opposée à la sienne pendant 1 minute.", { x: 7.55, y: 3.8, w: 4.9, h: 2.3, fontSize: 16, color: C.background2 });
  s.addNotes("Les participants se placent physiquement sur une ligne imaginaire au sol. Chaque déplacement doit être justifié : « Qui t'a fait bouger, et avec quoi? » Le « Change de bord! » prépare l'atelier homme d'acier.");


  // 7b. COURSE À TROIS JAMBES
  s = content("Échauffement");
  s.addText("Activité 3 · La course à trois jambes", { placeholder: "title" });
  timer(s, "12 min");
  const course = [
    ["Duos opposés", "Un de chaque bout de la ligne qui bouge. Bras dessus, bras dessous."],
    ["Départ", "Tous les duos au fond de la salle, face au tableau."],
    ["Un accord = un pas", "Énonce un point d'accord sincère sur le sujet. Si l'autre dit « d'accord », le duo avance d'un pas."],
    ["« Trop facile! »", "Le groupe peut crier « Trop facile! » sur un accord banal (« on veut tous être heureux »). Pas refusé."],
    ["Le mur", "Premier duo arrivé : il écrit sa phrase commune au tableau, puis la lit."],
  ];
  course.forEach(([h, d], i) => {
    const y = 1.45 + i * 1.02;
    chip(s, 0.6, y, String(i + 1), { w: 0.6, fs: 20, fill: i === 2 ? C.accent2 : C.accent1, color: i === 2 ? C.text1 : C.background2 });
    T(s, h, { x: 1.4, y: y + 0.02, w: 2.5, h: 0.55, fontFace: THEME.headFontFace, fontSize: 17, color: C.accent1, valign: "middle" });
    T(s, d, { x: 3.9, y: y - 0.04, w: 4.6, h: 0.95, fontSize: 14, valign: "middle" });
  });
  box(s, 8.9, 1.45, 3.8, 5.0, { fill: C.text1, line: C.text1 });
  s.addImage({ data: await fig("walk", { ink: "#" + HEX.paper }), x: 9.25, y: 1.6, w: 1.2, h: 1.45 });
  s.addImage({ data: await fig("walk", { ink: "#" + HEX.paper, mirror: true }), x: 9.95, y: 1.6, w: 1.2, h: 1.45 });
  T(s, "Pourquoi ça marche", { x: 9.15, y: 3.2, w: 3.3, h: 0.5, fontFace: THEME.headFontFace, fontSize: 18, color: C.accent2 });
  const pq = ["Liés, on ne peut pas s'éloigner de l'autre.", "La course oblige à chercher l'accord vite et fort.", "C'est la règle 2 de Rapoport, vécue avec le corps."];
  T(s, pq.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < pq.length - 1 } })), { x: 9.15, y: 3.75, w: 3.35, h: 2.5, fontSize: 14, color: C.background2, paraSpaceAfter: 8 });
  s.addNotes("Sujet : reprendre un énoncé de la ligne qui bouge. Les accords doivent porter sur le sujet, pas sur la météo. Le « Trop facile! » rend le jeu exigeant et drôle. Inclusion : pour une personne à mobilité réduite, le duo avance un jeton sur une piste dessinée au tableau. Retour : quel accord vous a le plus surpris? Lequel a été le plus difficile à dire?");

  // =====================================================================
  pres.addSection({ title: "Le manuel du tricheur" });
  await section("Le manuel du tricheur", "1", "Le manuel du tricheur", "Apprendre les coups bas pour s'en immuniser", "think");

  // 9. SCHOPENHAUER 38
  s = content("Le manuel du tricheur");
  s.addText("Le guide du tricheur", { placeholder: "title" });
  T(s, "38", { x: 0.5, y: 1.4, w: 5, h: 3.4, fontFace: THEME.headFontFace, fontSize: 220, color: C.accent1 });
  T(s, "stratagèmes pour avoir raison, même quand on a tort", { x: 0.6, y: 4.75, w: 4.8, h: 0.9, fontSize: 18, bold: true });
  T(s, [
    { text: "L'Art d'avoir toujours raison", options: { italic: true, bold: true, breakLine: true } },
    { text: "Écrit vers 1830 par Arthur Schopenhauer.", options: { breakLine: true } },
  ], { x: 6.0, y: 1.6, w: 6.7, h: 1.4, fontSize: 17 });
  box(s, 6.0, 3.1, 6.7, 1.4, { fill: C.accent2 });
  T(s, "« Le débat est un combat d'escrime intellectuel. »", { x: 6.25, y: 3.3, w: 6.2, h: 1.0, fontFace: THEME.headFontFace, fontSize: 21, valign: "middle" });
  T(s, "On les apprend pour s'en protéger. Comme un vaccin.", { x: 6.0, y: 4.85, w: 6.7, h: 0.8, fontFace: THEME.headFontFace, fontSize: 20, color: C.accent1 });
  s.addNotes("Présenter le livre comme un vaccin : connaître les ruses pour les désamorcer. Question à la salle : est-ce éthique d'enseigner ces ruses? Que se passe-t-il si on ne les enseigne pas?");

  // 10. DUR / DOUX
  s = content("Le manuel du tricheur");
  s.addText("Agréable ne veut pas dire mou", { placeholder: "title" });
  T(s, "→ envers les IDÉES", { x: 3.1, y: 1.5, w: 9, h: 0.4, fontSize: 14, bold: true, color: C.text2 });
  T(s, "envers les PERSONNES ↓", { x: 0.6, y: 2.0, w: 2.3, h: 0.5, fontSize: 14, bold: true, color: C.text2 });
  T(s, "doux", { x: 0.6, y: 2.9, w: 2.3, h: 0.5, fontFace: THEME.headFontFace, fontSize: 20, color: C.accent1 });
  T(s, "dur", { x: 0.6, y: 5.0, w: 2.3, h: 0.5, fontFace: THEME.headFontFace, fontSize: 20, color: C.accent1 });
  T(s, "mou", { x: 3.1, y: 1.85, w: 4.5, h: 0.4, fontFace: THEME.headFontFace, fontSize: 18, color: C.accent1, align: "center" });
  T(s, "ferme", { x: 7.9, y: 1.85, w: 4.8, h: 0.4, fontFace: THEME.headFontFace, fontSize: 18, color: C.accent1, align: "center" });
  const quad = [
    [3.1, 2.35, "La Girouette", "Tout le monde a raison. Personne n'apprend rien.", C.background1, C.text1, "shrug"],
    [7.9, 2.35, "Le Bâtisseur", "Exigeant sur le fond, bienveillant avec les gens. LA CIBLE.", C.accent2, C.text1, "jump"],
    [3.1, 4.45, "Le Sniper", "Faible sur les idées, cruel avec les gens. Le pire des deux mondes.", C.background1, C.text1, "point"],
    [7.9, 4.45, "Le Bulldozer", "Gagne les débats, perd les relations.", C.background1, C.text1, "push"],
  ];
  for (const [x, y, h, d, f, c, p] of quad) {
    box(s, x, y, 4.6, 1.95, { fill: f });
    s.addImage({ data: await fig(p), x: x + 3.4, y: y + 0.15, w: 1.05, h: 1.27 });
    T(s, h, { x: x + 0.2, y: y + 0.18, w: 3.1, h: 0.5, fontFace: THEME.headFontFace, fontSize: 19, color: C.accent1 });
    T(s, d, { x: x + 0.2, y: y + 0.75, w: 3.2, h: 1.1, fontSize: 14, color: c });
  }
  s.addNotes("Distinction inspirée de la négociation raisonnée (Fisher et Ury) : dur sur le fond, doux avec les personnes. L'agréabilité est une compétence de fermeté, pas de complaisance. Demander : dans quelle case vous retrouvez-vous quand vous êtes fatigués?");

  // 11. 9 COUPS BAS
  s = content("Le manuel du tricheur");
  s.addText("9 coups bas · coche-les", { placeholder: "title" });
  timer(s, "5 min");
  const coups = [
    ["1", "L'élastique", "Étirer ta thèse jusqu'à l'absurde", "« Ce n'est pas ce que j'ai dit. »"],
    ["8", "L'allumette", "Te mettre en colère", "« Ça monte, je ralentis. »"],
    ["13", "Le faux choix", "« C'est ça ou le chaos »", "« Il existe une 3ᵉ option. »"],
    ["18", "Le coupe-fil", "Interrompre quand on perd", "« Je finis, puis je t'écoute. »"],
    ["29", "La diversion", "Changer de sujet en douce", "« On parlait de… »"],
    ["30", "Le galon", "« Un expert l'a dit »", "« Quelles sont ses raisons? »"],
    ["32", "L'étiquette", "Coller un nom odieux à l'idée", "« Parlons de l'idée, pas du mot. »"],
    ["36", "Le brouillard", "Noyer sous le jargon", "« Dis-le à un enfant de 10 ans. »"],
    ["38", "Le K.-O.", "L'attaque personnelle", "Le calme. Il n'a plus d'arguments."],
  ];
  coups.forEach(([n, h, d, r], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 4.08, y = 1.5 + row * 1.78;
    box(s, x, y, 3.9, 1.6);
    T(s, n, { x: x + 0.12, y: y + 0.12, w: 0.95, h: 0.75, fontFace: THEME.headFontFace, fontSize: 32, color: C.accent1 });
    T(s, h, { x: x + 1.1, y: y + 0.12, w: 2.7, h: 0.4, fontFace: THEME.headFontFace, fontSize: 15 });
    T(s, d, { x: x + 1.1, y: y + 0.5, w: 2.7, h: 0.45, fontSize: 12 });
    T(s, "→ " + r, { x: x + 0.15, y: y + 1.05, w: 3.65, h: 0.45, fontSize: 13, bold: true, color: C.text2 });
  });
  s.addNotes("Les numéros correspondent aux stratagèmes de Schopenhauer. Les surnoms sont les nôtres, pour qu'on les retienne. Activité : dans le zine (p. 2), chacun coche ceux qu'il a subis… et ceux qu'il a faits. Ces 9 cartes deviennent aussi la grille de bingo du bestiaire.");

  // 12. DANS LA VRAIE VIE
  s = content("Le manuel du tricheur");
  s.addText("Les coups bas dans la vraie vie", { placeholder: "title" });
  T(s, "Ils ne restent pas dans les livres de philosophie. On les croise chaque semaine.", { x: 0.6, y: 1.45, w: 12.1, h: 0.6, fontSize: 16 });
  const map = [
    ["Souper de famille", "« Toi, de toute façon, t'as toujours été comme ça. »", "38 · Le K.-O."],
    ["Réunion d'équipe", "« C'est ça ou on ferme le projet. »", "13 · Le faux choix"],
    ["Réseaux sociaux", "« Donc tu veux qu'on abolisse la police? »", "1 · L'élastique"],
    ["Conseil municipal", "« Ça, c'est une idée de radicaux. »", "32 · L'étiquette"],
    ["Entre ami·es", "« Un médecin l'a dit à la télé, c'est réglé. »", "30 · Le galon"],
    ["Couple", "« Pis toi, la semaine passée, hein? »", "29 · La diversion"],
  ];
  T(s, "Où", { x: 0.8, y: 2.2, w: 2.5, h: 0.4, fontSize: 14, bold: true, color: C.text2 });
  T(s, "Ce qu'on entend", { x: 3.6, y: 2.2, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.text2 });
  T(s, "Le coup bas", { x: 9.6, y: 2.2, w: 3, h: 0.4, fontSize: 14, bold: true, color: C.text2 });
  map.forEach(([a, b, c], i) => {
    const y = 2.65 + i * 0.68;
    box(s, 0.6, y, 2.8, 0.56, { fill: C.text1, line: C.text1, lw: 1.5 });
    T(s, a, { x: 0.75, y, w: 2.6, h: 0.56, fontSize: 15, bold: true, color: C.background2, valign: "middle" });
    box(s, 3.4, y, 6.0, 0.56, { fill: C.background1, lw: 1.5 });
    T(s, b, { x: 3.6, y, w: 5.7, h: 0.56, fontSize: 15, italic: true, valign: "middle" });
    box(s, 9.4, y, 3.3, 0.56, { fill: C.accent2, lw: 1.5 });
    T(s, c, { x: 9.6, y, w: 3.0, h: 0.56, fontSize: 15, bold: true, valign: "middle" });
  });
  s.addNotes("Demander aux participants de compléter le tableau avec leurs propres exemples, anonymisés. Où les entendez-vous le plus? Lesquels utilisez-vous vous-même sans vous en rendre compte?");

  // 13. PYRAMIDE GRAHAM
  s = content("Le manuel du tricheur");
  s.addText("Monte la pyramide du désaccord", { placeholder: "title" });
  const lv = [["6", "Réfuter le cœur", "« Ton idée centrale ne tient pas parce que… »"], ["5", "Réfutation", "Citer l'autre et montrer l'erreur"], ["4", "Contre-argument", "Une autre raison, avec preuve"], ["3", "Contradiction", "« Non, c'est faux. » (sans raison)"], ["2", "Critique du ton", "« Calme-toi! »"], ["1", "Ad hominem", "« Tu dis ça parce que t'es de ta génération. »"], ["0", "Insulte", "« T'es niaiseux. »"]];
  lv.forEach(([n, h, d], i) => {
    const w = 2.6 + i * 0.8, y = 1.45 + i * 0.72, x = 4.4 - w / 2;
    const fill = i < 3 ? C.accent1 : i === 3 ? C.accent2 : C.text1;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.68, fill: { color: fill }, line: { type: "none" } });
    T(s, n + " · " + h, { x, y, w, h: 0.68, fontFace: THEME.headFontFace, fontSize: 15, color: i === 3 ? C.text1 : C.background2, align: "center", valign: "middle" });
    T(s, d, { x: 8.3, y, w: 4.4, h: 0.68, fontSize: 13, valign: "middle" });
    s.addShape(pres.shapes.LINE, { x: x + w + 0.1, y: y + 0.34, w: 8.2 - (x + w + 0.1), h: 0, line: { color: C.text2, width: 1, dashType: "sysDot" } });
  });
  T(s, "↑ agréable", { x: 0.6, y: 1.5, w: 1.6, h: 0.4, fontSize: 14, bold: true, color: C.accent1 });
  T(s, "↓ toxique", { x: 0.6, y: 6.5, w: 1.6, h: 0.4, fontSize: 14, bold: true });
  s.addNotes("Hiérarchie du désaccord de Paul Graham (2008). Plus on monte, plus le débat est agréable pour les personnes et dangereux pour les mauvaises idées. Défi : nommer son étage avant de répondre.");

  // 14. RAPOPORT + HOMME D'ACIER
  s = content("Le manuel du tricheur");
  s.addText("Gagner le droit de critiquer", { placeholder: "title" });
  T(s, "Les règles de Rapoport (popularisées par Daniel Dennett)", { x: 0.6, y: 1.4, w: 7, h: 0.4, fontSize: 14, italic: true, color: C.text2 });
  const rap = ["Reformule l'idée de l'autre si bien qu'il dise : « J'aurais aimé le dire comme ça. »", "Nomme tes points d'accord, surtout les surprenants.", "Dis ce que tu as appris de cette personne.", "Seulement là, ta critique."];
  rap.forEach((r, i) => {
    const y = 1.95 + i * 1.08;
    chip(s, 0.6, y, String(i + 1), { w: 0.7, fs: 24, fill: i === 3 ? C.accent2 : C.accent1, color: i === 3 ? C.text1 : C.background2 });
    T(s, r, { x: 1.5, y: y + 0.03, w: 5.9, h: 0.9, fontSize: 16, valign: "middle" });
  });
  box(s, 7.9, 1.45, 4.8, 4.95, { fill: C.text1, line: C.text1 });
  T(s, "Homme de paille", { x: 8.15, y: 1.65, w: 4.3, h: 0.5, fontFace: THEME.headFontFace, fontSize: 20, color: C.background2 });
  T(s, "Affaiblir la thèse adverse pour mieux la frapper.", { x: 8.15, y: 2.2, w: 4.3, h: 0.8, fontSize: 15, color: C.background2 });
  T(s, "↓", { x: 8.15, y: 3.0, w: 4.3, h: 0.6, fontFace: THEME.headFontFace, fontSize: 28, color: C.accent2, align: "center" });
  T(s, "Homme d'acier", { x: 8.15, y: 3.7, w: 4.3, h: 0.5, fontFace: THEME.headFontFace, fontSize: 20, color: C.accent2 });
  T(s, "Rendre la thèse adverse plus forte qu'elle ne l'était, puis l'affronter. Si tu gagnes, tu as vraiment gagné. Si tu perds, tu as appris.", { x: 8.15, y: 4.25, w: 4.3, h: 1.9, fontSize: 15, color: C.background2 });
  s.addNotes("Anatol Rapoport, mathématicien et théoricien des jeux (stratégie « donnant-donnant »). Daniel Dennett a formulé ces règles dans Intuition Pumps (2013). Faire le lien : ces 4 règles sont l'antidote direct des stratagèmes 1, 29 et 38.");

  // =====================================================================
  pres.addSection({ title: "Le bestiaire" });
  await section("Le bestiaire", "2", "Le bestiaire du débat", "Reconnaître les débatteurs… et se reconnaître", "fog");

  // 16. BESTIAIRE (aperçu)
  const BEASTS = [
    { p: "push", n: "Le Bulldozer", sig: "« Laisse-moi finir! » (il parle depuis 3 minutes)",
      coups: "18 Le coupe-fil · 14 Crier victoire", dessous: "La peur de ne pas être entendu, de perdre le contrôle.",
      rep: "« Je t'ai entendu dire X. Maintenant, 1 minute pour moi. »", force: "Conviction et énergie.",
      jouer: "Ne laisse jamais un silence. Reprends ta phrase plus fort." },
    { p: "fog", n: "Le Brouillard", sig: "« Oui, mais le vrai problème, c'est… »",
      coups: "29 La diversion · 36 Le brouillard", dessous: "Éviter de perdre la face sur une question précise.",
      rep: "« Bonne question, on la garde. Mais sur X, ta réponse? »", force: "Voit les liens et le portrait d'ensemble.",
      jouer: "Chaque fois qu'on te coince, élargis le sujet." },
    { p: "point", n: "Le Sniper", sig: "« Venant de toi, franchement… »",
      coups: "38 Le K.-O. · 8 L'allumette · 32 L'étiquette", dessous: "Se sentir menacé, ou déjà blessé.",
      rep: "Le calme. « Admettons. Et l'argument lui-même? »", force: "Un sens critique aiguisé… mal visé.",
      jouer: "Commente la personne, jamais l'idée. Attaques fictives et légères seulement." },
    { p: "prof", n: "Le Professeur", sig: "« Les études montrent que… »",
      coups: "30 Le galon · 36 Le brouillard", dessous: "Le besoin de crédibilité, de statut.",
      rep: "« Lesquelles? Qu'est-ce qu'elles disent exactement? »", force: "Il s'appuie sur des sources.",
      jouer: "Cite des experts vagues. Utilise des mots compliqués." },
    { p: "shrug", n: "La Girouette", sig: "« T'as raison… Toi aussi, t'as raison. »",
      coups: "Aucun : elle les subit (28, rire de la salle)", dessous: "Le besoin d'harmonie, la peur du conflit.",
      rep: "« Si tu devais choisir une seule position? »", force: "Écoute et ouverture.",
      jouer: "Donne raison à la dernière personne qui a parlé." },
    { p: "hide", n: "La Tortue", sig: "« … » ou « Je sais pas » (alors qu'elle sait)",
      coups: "Aucun : elle se retire", dessous: "La peur du jugement, le besoin de sécurité.",
      rep: "Temps d'écriture d'abord, puis une question précise.", force: "Observe et réfléchit : détient souvent la meilleure idée.",
      jouer: "Reste muet·te, sauf si on t'invite très clairement." },
    { p: "think", n: "L'Avocat du diable", sig: "« Juste pour jouer l'avocat du diable… »",
      coups: "1 L'élastique · 13 Le faux choix", dessous: "Le plaisir du jeu, le besoin de stimulation.",
      rep: "« Et toi, tu penses vraiment quoi? »", force: "Teste la solidité des idées. Précieux s'il l'annonce.",
      jouer: "Contredis chaque affirmation, même celles que tu approuves." },
    { p: "jump", n: "Le Bâtisseur", sig: "« Si je te comprends bien, tu dis que… »",
      coups: "Aucun : il applique Rapoport", dessous: "L'envie de comprendre, pas de gagner.",
      rep: "Devenir paillasson à force de douceur.", force: "Il fait progresser tout le groupe.",
      jouer: "Reformule avant chaque prise de parole. Nomme un accord.", piege: true },
  ];
  s = content("Le bestiaire");
  s.addText("8 créatures à reconnaître", { placeholder: "title" });
  for (let i = 0; i < BEASTS.length; i++) {
    const B = BEASTS[i];
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.07, y = 1.45 + row * 2.75;
    box(s, x, y, 2.9, 2.55, { fill: i === 7 ? C.accent2 : C.background1 });
    s.addImage({ data: await fig(B.p), x: x + 0.15, y: y + 0.2, w: 1.05, h: 1.27 });
    T(s, B.n, { x: x + 1.25, y: y + 0.3, w: 1.55, h: 1.0, fontFace: THEME.headFontFace, fontSize: 16, color: C.accent1, valign: "middle" });
    T(s, B.sig, { x: x + 0.15, y: y + 1.6, w: 2.6, h: 0.85, fontSize: 14, italic: true });
  }
  s.addNotes("Aperçu : on reconnaît chaque créature d'abord à sa phrase-signature. Insister : personne n'est une seule créature. On change selon la fatigue, le sujet, le public. Les 4 diapos suivantes sont des fiches d'identité à imprimer : elles servent de cartes-rôles pour le bal masqué.");

  // 17. BAL MASQUÉ
  s = content("Le bestiaire");
  s.addText("Le bal masqué du débat", { placeholder: "title" });
  timer(s, "25 min");
  const bal = [
    ["Tirage", "Groupes de 5 débatteurs. Chacun pioche en secret une carte-créature (la Tortue compte aussi!)."],
    ["Débat", "6 minutes sur un vrai sujet de société. Chacun joue sa créature… sans la nommer."],
    ["Observation", "Les autres participants forment un cercle extérieur : ils cochent leur bingo des coups bas et devinent les créatures."],
    ["Démasquage", "Les observateurs nomment chaque créature et citent la phrase exacte qui l'a trahie."],
    ["Rejouer", "On rejoue 2 minutes : toutes les créatures deviennent des Bâtisseurs. Qu'est-ce qui a changé?"],
  ];
  bal.forEach(([h, d], i) => {
    const y = 1.5 + i * 1.02;
    chip(s, 0.6, y, String(i + 1), { w: 0.6, fs: 20, fill: i === 4 ? C.accent2 : C.accent1, color: i === 4 ? C.text1 : C.background2 });
    T(s, h, { x: 1.4, y: y + 0.02, w: 2.2, h: 0.55, fontFace: THEME.headFontFace, fontSize: 17, color: C.accent1, valign: "middle" });
    T(s, d, { x: 3.6, y: y - 0.04, w: 5.0, h: 0.95, fontSize: 14, valign: "middle" });
  });
  box(s, 9.0, 1.5, 3.7, 4.95, { fill: C.text1, line: C.text1 });
  T(s, "Sujets testés", { x: 9.25, y: 1.7, w: 3.3, h: 0.5, fontFace: THEME.headFontFace, fontSize: 18, color: C.accent2 });
  const sujets = ["La semaine de 4 jours au travail?", "Bannir les cellulaires au restaurant?", "Le pourboire devrait-il disparaître?", "L'IA au travail : outil ou menace?"];
  T(s, sujets.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < sujets.length - 1 } })), { x: 9.25, y: 2.3, w: 3.25, h: 3.9, fontSize: 15, color: C.background2, paraSpaceAfter: 10 });
  s.addNotes("Imprimer les 4 diapos « Fiches d'identité » (en annexe) et les couper en deux : 8 cartes-rôles. Débat en aquarium : 5 au centre, le reste en observation. L'étape 5 (rejouer en Bâtisseurs) est la plus importante : faire nommer la différence d'ambiance.");

  // 18. CARTES + BINGO
  s = content("Le bestiaire");
  s.addText("Bingo des coups bas", { placeholder: "title" });
  const bingo = ["L'élastique", "L'allumette", "Le faux choix", "Le coupe-fil", "★ Une reformulation", "La diversion", "Le galon", "L'étiquette", "Le brouillard"];
  bingo.forEach((b, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.6 + col * 2.2, y = 1.5 + row * 1.65;
    box(s, x, y, 2.1, 1.55, { fill: i === 4 ? C.accent2 : C.background1 });
    T(s, b, { x: x + 0.1, y: y + 0.1, w: 1.9, h: 0.8, fontFace: THEME.headFontFace, fontSize: 15, color: i === 4 ? C.text1 : C.accent1, align: "center", valign: "middle" });
    T(s, "Qui? ______", { x: x + 0.1, y: y + 1.0, w: 1.9, h: 0.4, fontSize: 12, align: "center", color: C.text2 });
  });
  T(s, "Règles", { x: 7.6, y: 1.5, w: 5, h: 0.5, fontFace: THEME.headFontFace, fontSize: 20, color: C.accent1 });
  const br = ["Coche une case quand tu entends le coup. Note qui et la phrase exacte.", "La case centrale est un bon coup : la reformulation loyale. Elle vaut double.", "Ligne complète? Lève la main en silence : le débat continue.", "Surprise : on termine en comptant les reformulations, pas les coups bas."];
  T(s, br.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < br.length - 1 } })), { x: 7.6, y: 2.1, w: 5.1, h: 4.3, fontSize: 16, paraSpaceAfter: 10 });
  s.addNotes("Imprimer cette diapo pour les observateurs. La case étoile oriente l'attention vers les bons comportements : on finit sur ce qui construit.");

  // 19. CROQUIS-ÉCLAIR
  s = content("Le bestiaire");
  s.addText("Croquis-éclair", { placeholder: "title" });
  timer(s, "8 min");
  const cq = [["1", "Ta créature quand tu es à bout"], ["2", "Un coup bas : le groupe devine lequel"], ["3", "Sa parade"]];
  cq.forEach(([n, h], i) => {
    const x = 0.6 + i * 4.08;
    box(s, x, 1.5, 3.9, 3.6, { fill: C.background1 });
    chip(s, x + 0.2, 1.7, n, { w: 0.65, fs: 22, fill: i === 2 ? C.accent2 : C.accent1, color: i === 2 ? C.text1 : C.background2 });
    T(s, "60 s", { x: x + 2.8, y: 1.75, w: 0.9, h: 0.5, fontFace: THEME.headFontFace, fontSize: 18, color: C.text2, align: "right" });
    T(s, h, { x: x + 0.2, y: 5.25, w: 3.5, h: 0.8, fontFace: THEME.headFontFace, fontSize: 18, color: C.accent1 });
  });
  s.addImage({ data: await fig("push"), x: 1.7, y: 2.6, w: 1.6, h: 1.95 });
  s.addImage({ data: await fig("point"), x: 5.8, y: 2.6, w: 1.6, h: 1.95 });
  s.addImage({ data: await fig("jump"), x: 9.9, y: 2.6, w: 1.6, h: 1.95 });
  T(s, "Bonshommes allumettes bienvenus. Aucun talent requis.", { x: 0.6, y: 6.25, w: 12.1, h: 0.5, fontSize: 16, italic: true, color: C.text2 });
  s.addNotes("Zine p. 3 et 4. D'abord, chacun encercle sa créature sous stress (p. 3). Puis trois dessins de 60 secondes (p. 4). Au 2e dessin, on montre son croquis au voisin, qui devine le coup bas. Rire est encouragé : le dessin maladroit désamorce la gêne de se reconnaître.");

  // =====================================================================
  pres.addSection({ title: "Ateliers d'écriture" });
  await section("Ateliers d'écriture", "3", "Ateliers d'écriture", "L'agréabilité se travaille aussi au crayon", "walk");

  // 21. ASCENSEUR
  s = content("Ateliers d'écriture");
  s.addText("Atelier 1 · L'ascenseur", { placeholder: "title" });
  timer(s, "15 min");
  T(s, "Prends une réplique toxique et fais-la monter dans la pyramide, un étage à la fois.", { x: 0.6, y: 1.4, w: 12, h: 0.5, fontSize: 17 });
  const asc = [
    ["0", "« T'es vraiment déconnecté si tu penses que le télétravail marche. »", C.text1, C.background2],
    ["3", "« Non, le télétravail ne marche pas. »", C.accent2, C.text1],
    ["4", "« Le télétravail isole les nouveaux employés : ils apprennent moins vite sans collègues autour. »", C.accent1, C.background2],
    ["6", "« Tu dis que le télétravail rend plus productif. C'est vrai pour le travail concentré. Mais si on gardait deux jours sur place pour l'accueil et la collaboration, ton argument tiendrait-il encore? »", C.accent1, C.background2],
  ];
  asc.forEach(([n, t, f, c], i) => {
    const y = 5.45 - i * 1.15, w = 7.6 + i * 0.4;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y, w, h: 1.0, fill: { color: f }, line: { type: "none" } });
    T(s, n, { x: 0.75, y, w: 0.7, h: 1.0, fontFace: THEME.headFontFace, fontSize: 30, color: c, valign: "middle" });
    T(s, t, { x: 1.5, y: y + 0.05, w: w - 1.05, h: 0.9, fontSize: i === 3 ? 13 : 15, color: c, valign: "middle" });
  });
  box(s, 9.4, 2.15, 3.3, 4.3, { fill: C.background1 });
  T(s, "Consigne", { x: 9.6, y: 2.3, w: 3, h: 0.5, fontFace: THEME.headFontFace, fontSize: 18, color: C.accent1 });
  T(s, "En équipe de 2, choisissez une réplique entendue en ligne, au travail ou en famille. Réécrivez-la aux étages 3, 4 et 6. Lisez l'étage 0 et l'étage 6 à voix haute.", { x: 9.6, y: 2.85, w: 2.95, h: 3.5, fontSize: 15 });
  s.addNotes("Zine p. 5. Lecture à voix haute : faire sentir physiquement la différence de ton. Variante : réécrire un commentaire de réseau social fictif.");

  // 22. HOMME D'ACIER SIGNÉ
  s = content("Ateliers d'écriture");
  s.addText("Atelier 2 · L'homme d'acier signé", { placeholder: "title" });
  timer(s, "15 min");
  const acier = [
    ["Écoute", "A défend sa position pendant 2 minutes. B ne parle pas, il prend des notes."],
    ["Écris", "B rédige en 50 mots la meilleure version possible de l'argument de A. Meilleure que l'original, si possible."],
    ["Signe", "A lit. S'il peut signer « Oui, c'est exactement ce que je pense », B a gagné. Sinon, B réécrit."],
    ["Inverse", "On échange les rôles. Ensuite seulement, chacun a droit à une critique."],
  ];
  acier.forEach(([h, d], i) => {
    const x = 0.6 + i * 3.07;
    box(s, x, 1.55, 2.9, 3.6, { fill: i === 2 ? C.accent2 : C.background1 });
    chip(s, x + 0.2, 1.75, String(i + 1), { w: 0.6, fs: 20 });
    T(s, h, { x: x + 0.95, y: 1.8, w: 1.85, h: 0.5, fontFace: THEME.headFontFace, fontSize: 20, color: C.accent1 });
    T(s, d, { x: x + 0.2, y: 2.6, w: 2.5, h: 2.4, fontSize: 15 });
  });
  box(s, 0.6, 5.4, 12.1, 1.15, { fill: C.text1, line: C.text1 });
  T(s, "Signature : ________________________   « Tu as mieux dit ma pensée que moi. »", { x: 0.9, y: 5.4, w: 11.6, h: 1.15, fontFace: "Courier New", fontSize: 17, color: C.background2, valign: "middle" });
  s.addNotes("Zine p. 6. Version écrite de la règle 1 de Rapoport. Le moment de la signature est souvent émouvant : être bien compris désarme. Afficher les feuilles signées au mur.");

  // 23. 39E STRATAGÈME
  s = content("Ateliers d'écriture");
  s.addText("Atelier 3 · Le 39ᵉ stratagème", { placeholder: "title" });
  timer(s, "15 min");
  T(s, "39", { x: 0.5, y: 1.3, w: 4.4, h: 3.2, fontFace: THEME.headFontFace, fontSize: 200, color: C.accent1 });
  T(s, "Schopenhauer s'est arrêté à 38 coups bas. Invente le 39ᵉ : un coup loyal qui fait gagner tout le monde.", { x: 0.6, y: 4.5, w: 4.4, h: 1.8, fontSize: 17, bold: true });
  box(s, 5.5, 1.5, 7.2, 4.95, { fill: C.background1 });
  T(s, "Gabarit de la fiche", { x: 5.8, y: 1.7, w: 6.6, h: 0.5, fontFace: THEME.headFontFace, fontSize: 19, color: C.accent1 });
  const fiche = [
    ["Nom du stratagème", "un surnom mémorable (ex. « Le parapluie »)"],
    ["Quand l'utiliser", "la situation de débat où il sert"],
    ["Comment faire", "la phrase ou le geste exact"],
    ["Ce qu'il désamorce", "le coup bas (numéro) qu'il neutralise"],
  ];
  fiche.forEach(([h, d], i) => {
    const y = 2.35 + i * 0.97;
    T(s, h, { x: 5.8, y, w: 6.6, h: 0.4, fontSize: 16, bold: true });
    T(s, d, { x: 5.8, y: y + 0.36, w: 6.6, h: 0.35, fontSize: 13, italic: true, color: C.text2 });
    s.addShape(pres.shapes.LINE, { x: 5.8, y: y + 0.82, w: 6.6, h: 0, line: { color: C.text1, width: 1 } });
  });
  s.addNotes("Production finale du séminaire. On compile les stratagèmes du groupe dans un « Manuel du débat loyal » numéroté à partir de 39 : le zine nº 2 du groupe.");

  // =====================================================================
  pres.addSection({ title: "L'arène agréable" });
  await section("L'arène agréable", "4", "L'arène agréable", "Un vrai débat, avec un prix inattendu", "push");

  // 25. AQUARIUM À JETONS
  s = content("L'arène agréable");
  s.addText("L'aquarium à jetons", { placeholder: "title" });
  timer(s, "25 min");
  const aq = [
    ["Le ticket d'entrée", "Pour parler, tu dois d'abord reformuler la personne précédente. Elle dit « oui » ou « presque ». Seul le « oui » ouvre ton micro."],
    ["Les jetons", "3 jetons par personne. Chaque intervention coûte un jeton. Les Bulldozers apprennent à choisir, les Tortues doivent dépenser les leurs."],
    ["La chaise vide", "Une chaise libre dans le cercle : un observateur peut venir y faire une seule intervention, puis repartir."],
  ];
  aq.forEach(([h, d], i) => {
    const y = 1.5 + i * 1.65;
    box(s, 0.6, y, 7.6, 1.45, { fill: C.background1 });
    chip(s, 0.8, y + 0.4, String(i + 1), { w: 0.65, fs: 22 });
    T(s, h, { x: 1.7, y: y + 0.12, w: 6.3, h: 0.45, fontFace: THEME.headFontFace, fontSize: 17, color: C.accent1 });
    T(s, d, { x: 1.7, y: y + 0.55, w: 6.3, h: 0.85, fontSize: 14 });
  });
  box(s, 8.6, 1.5, 4.1, 4.75, { fill: C.accent2 });
  T(s, "Le prix surprise", { x: 8.85, y: 1.7, w: 3.6, h: 0.5, fontFace: THEME.headFontFace, fontSize: 20, color: C.accent1 });
  T(s, "Aucun vainqueur au contenu. Le jury remet deux prix :", { x: 8.85, y: 2.3, w: 3.6, h: 0.8, fontSize: 15 });
  T(s, [
    { text: "L'homme d'acier d'or", options: { bold: true, breakLine: true } },
    { text: "à la meilleure reformulation de l'adversaire", options: { breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "La girouette courageuse", options: { bold: true, breakLine: true } },
    { text: "à la personne qui a changé d'avis, et l'a dit" },
  ], { x: 8.85, y: 3.2, w: 3.6, h: 2.9, fontSize: 15 });
  s.addNotes("Dispositif en aquarium (fishbowl). Les jetons peuvent être des trombones ou des cartes. Le prix « girouette courageuse » renverse le stigmate : changer d'avis devient un exploit.");

  // 26. BOÎTE À PHRASES
  s = content("L'arène agréable");
  s.addText("La boîte à phrases qui désamorcent", { placeholder: "title" });
  const phr = [
    ["Comprendre", "« Si je te comprends bien, tu dis que… c'est ça? »"],
    ["Ouvrir", "« Qu'est-ce qui pourrait te faire changer d'idée? »"],
    ["Cartographier", "« On est d'accord sur ___. On diffère sur ___. »"],
    ["Reconnaître", "« Bon point. Je n'y avais pas pensé. »"],
    ["S'opposer", "« Je vois ça autrement. Je t'explique? »"],
    ["Sonder", "« Sur quoi tu t'appuies? Ça m'intéresse. »"],
    ["Ralentir", "« Je sens que ça monte. On prend 10 secondes? »"],
    ["Céder", "« Je pense que j'avais tort sur ce bout-là. »"],
  ];
  phr.forEach(([h, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.1, y = 1.5 + row * 1.25;
    box(s, x, y, 5.95, 1.1, { fill: i === 7 ? C.accent2 : C.background1, lw: 1.5 });
    T(s, h, { x: x + 0.2, y: y + 0.1, w: 1.9, h: 0.9, fontFace: THEME.headFontFace, fontSize: 15, color: C.accent1, valign: "middle" });
    T(s, d, { x: x + 2.1, y: y + 0.1, w: 3.7, h: 0.9, fontSize: 15, valign: "middle" });
  });
  s.addNotes("À afficher au travail, sur le frigo, ou à garder dans son portefeuille. La dernière phrase (Céder) est la plus difficile et la plus puissante. Défi de la semaine : l'utiliser une fois.");

  // =====================================================================
  pres.addSection({ title: "Repartir avec" });
  await section("Repartir avec", "5", "Repartir avec", "Un objet à garder, une relation à mettre à jour", "jump");

  // 26b. TALISMAN
  s = content("Repartir avec");
  s.addText("Le talisman", { placeholder: "title" });
  timer(s, "15 min");
  s.addShape(pres.shapes.OVAL, { x: 0.9, y: 1.5, w: 4.6, h: 4.6, fill: { color: C.background1 }, line: { color: C.text1, width: 3, dashType: "dash" } });
  s.addShape(pres.shapes.OVAL, { x: 1.9, y: 2.0, w: 2.6, h: 2.0, fill: { color: C.background1 }, line: { color: C.text2, width: 1, dashType: "sysDot" } });
  s.addImage({ data: await fig("jump"), x: 2.65, y: 2.1, w: 1.1, h: 1.35 });
  s.addShape(pres.shapes.LINE, { x: 1.6, y: 4.75, w: 3.2, h: 0, line: { color: C.text1, width: 1.5 } });
  T(s, "« Je t'écoute jusqu'au bout. »", { x: 1.4, y: 4.25, w: 3.6, h: 0.45, fontSize: 15, italic: true, align: "center" });
  const tal = [["Choisis ta phrase-bouclier", "Celle qui te protège de ta créature sous stress."], ["Dessine un symbole", "60 secondes. Simple, à toi."], ["Découpe, garde-le sur toi", "Portefeuille, étui de téléphone, ficelle."], ["Variante : offre-le", "Fais-en un pour ton partenaire, avec la phrase que tu l'as vu bien utiliser."]];
  tal.forEach(([h, t2], i) => {
    const y = 1.5 + i * 1.17;
    chip(s, 6.2, y, String(i + 1), { w: 0.6, fs: 20, fill: i === 3 ? C.accent2 : C.accent1, color: i === 3 ? C.text1 : C.background2 });
    T(s, h, { x: 7.0, y: y - 0.02, w: 5.7, h: 0.45, fontFace: THEME.headFontFace, fontSize: 18, color: C.accent1 });
    T(s, t2, { x: 7.0, y: y + 0.42, w: 5.7, h: 0.6, fontSize: 15 });
  });
  s.addNotes("Zine p. 7 pour l'esquisse, puis planche de talismans (3e page du PDF du zine) à découper. Matériel : ciseaux, crayons-feutres, ficelle ou épingles. Exemples de phrases-boucliers : « Je t'écoute jusqu'au bout. » « Dur sur l'idée, doux avec toi. » « J'ai peut-être tort. » « Qu'est-ce qui te ferait changer d'idée? » La variante « offert » crée un beau moment de reconnaissance mutuelle.");

  // 26c. MISE À JOUR RELATIONNELLE
  s = night("Repartir avec");
  s.addText("Mise à jour relationnelle", { placeholder: "title" });
  timer(s, "15 min", true);
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 6.0, h: 4.9, fill: { color: C.background1 }, line: { color: C.background2, width: 2 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.5, w: 6.0, h: 0.45, fill: { color: C.accent2 }, line: { type: "none" } });
  T(s, "● ● ●   notes_de_version.txt", { x: 0.8, y: 1.5, w: 5.6, h: 0.45, fontFace: "Courier New", fontSize: 14, bold: true, valign: "middle" });
  T(s, "Relation v2.0", { x: 0.9, y: 2.1, w: 5.4, h: 0.5, fontFace: THEME.headFontFace, fontSize: 22, color: C.accent1 });
  ["À :", "Correctif : j'arrête de…", "Nouveauté : je vais essayer…", "Bogue connu :", "Mise à jour demandée : je te demande…"].forEach((l, i) => {
    const y = 2.75 + i * 0.68;
    T(s, l, { x: 0.9, y, w: 5.4, h: 0.4, fontSize: 15, bold: true, color: i === 4 ? C.accent1 : C.text1 });
    s.addShape(pres.shapes.LINE, { x: 0.9, y: y + 0.5, w: 5.4, h: 0, line: { color: C.text1, width: 1 } });
  });
  const mj = ["Pense à une personne avec qui un débat a mal tourné.", "Écris-lui tes notes de version (zine p. 8).", "Ajoute ta demande : ce que tu aimerais qu'elle mette à jour, elle aussi.", "Tu décides : l'envoyer, en parler, ou la garder."];
  mj.forEach((t2, i) => {
    const y = 1.6 + i * 1.15;
    chip(s, 7.1, y, String(i + 1), { w: 0.6, fs: 20, fill: i === 2 ? C.accent2 : C.accent1, color: i === 2 ? C.text1 : C.background2 });
    T(s, t2, { x: 7.9, y: y - 0.05, w: 4.8, h: 0.9, fontSize: 17, color: C.background2, valign: "middle" });
  });
  s.addNotes("Écho à la question d'ouverture (« gagné un débat et perdu un ami? ») et à la bande-annonce, où l'IA fait sa propre mise à jour. Le format des notes de version dédramatise : on parle de correctifs et de bogues, pas de fautes. Rien n'est lu sans accord. Variante à deux : chacun demande à l'autre « Qu'est-ce que je pourrais mettre à jour quand on débat? » et l'inscrit dans son bogue connu.");

  // 27. BILLET 3-2-1
  s = content("Repartir avec");
  s.addText("Billet de sortie 3 · 2 · 1", { placeholder: "title" });
  timer(s, "7 min");
  const exit = [["3", "coups bas que je reconnaîtrai maintenant", C.accent1, C.background2], ["2", "phrases de la boîte que je vais essayer cette semaine", C.accent2, C.text1], ["1", "créature que je veux arrêter d'être", C.text1, C.background2]];
  exit.forEach(([n, d, f, c], i) => {
    const x = 0.6 + i * 4.08;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.6, w: 3.9, h: 4.3, fill: { color: f }, line: { color: C.text1, width: 2 } });
    T(s, n, { x: x + 0.3, y: 1.75, w: 3.3, h: 2.1, fontFace: THEME.headFontFace, fontSize: 130, color: c });
    T(s, d, { x: x + 0.3, y: 4.0, w: 3.3, h: 1.6, fontSize: 19, bold: true, color: c });
  });
  T(s, "Puis : choisis un papillon du mur des cicatrices et écris au verso ce qui aurait pu sauver l'amitié.", { x: 0.6, y: 6.1, w: 12.1, h: 0.6, fontSize: 15, italic: true, color: C.text2 });
  s.addNotes("Retour sur la question d'ouverture. Les papillons réécrits peuvent devenir une affiche collective.");

  // 28. FERMETURE
  s = pres.addSlide({ masterName: "COUVERTURE", sectionTitle: "Repartir avec" });
  s.addText("Dur sur\nles idées.\nDoux avec\nles gens.", { placeholder: "title" });
  s.addImage({ data: await fig("jump"), x: 8.6, y: 0.5, w: 2.1, h: 2.55, rotate: -6 });
  s.addImage({ data: await fig("jump", { mirror: true }), x: 10.6, y: 1.1, w: 2.1, h: 2.55, rotate: 6 });
  T(s, "Le but n'est pas d'avoir raison contre quelqu'un, c'est d'avoir un peu plus raison ensemble.", { x: 0.6, y: 0.6, w: 7.6, h: 1.1, fontSize: 18, bold: true });
  T(s, "Sources : A. Schopenhauer, L'Art d'avoir toujours raison · P. Graham, How to Disagree (2008) · D. Dennett, Intuition Pumps (2013) · R. Fisher et W. Ury, Getting to Yes", { x: 8.6, y: 3.9, w: 4.2, h: 2.9, fontSize: 11, color: C.text2 });
  s.addNotes("Clôture. Rappeler la devise : dur sur les idées, doux avec les gens. Inviter les participants à repartir avec leur zine, leur talisman et, peut-être, une mise à jour envoyée.");

  pres.addSection({ title: "Annexes" });
  // ANNEXE : fiches d'identité imprimables (cartes-rôles du bal masqué)
  // 16b-e. FICHES D'IDENTITÉ (2 par diapo, imprimables comme cartes-rôles)
  for (let k = 0; k < 4; k++) {
    s = content("Annexes");
    s.addText("Fiches d'identité · " + (k + 1) + "/4", { placeholder: "title" });
    for (let j = 0; j < 2; j++) {
      const B = BEASTS[k * 2 + j];
      const x = 0.6 + j * 6.15, y = 1.4;
      box(s, x, y, 5.95, 5.4, { fill: B.piege ? C.accent2 : C.background1 });
      s.addImage({ data: await fig(B.p), x: x + 0.15, y: y + 0.12, w: 0.95, h: 1.15 });
      T(s, B.n, { x: x + 1.2, y: y + 0.15, w: 4.6, h: 0.5, fontFace: THEME.headFontFace, fontSize: 22, color: C.accent1 });
      T(s, B.sig, { x: x + 1.2, y: y + 0.68, w: 4.6, h: 0.6, fontSize: 14, italic: true, bold: true });
      const rows = [["Coups bas favoris", B.coups], ["Ce qui se cache dessous", B.dessous], [B.piege ? "Son piège" : "Comment lui répondre", B.rep], ["Sa force cachée", B.force], ["Pour le jouer au bal masqué", B.jouer]];
      rows.forEach(([l, t], r) => {
        const ry = y + 1.42 + r * 0.79;
        s.addShape(pres.shapes.LINE, { x: x + 0.15, y: ry, w: 5.65, h: 0, line: { color: C.text1, width: 0.75 } });
        T(s, l, { x: x + 0.15, y: ry + 0.06, w: 1.55, h: 0.68, fontSize: 11, bold: true, color: C.text2 });
        T(s, t, { x: x + 1.75, y: ry + 0.06, w: 4.05, h: 0.7, fontSize: 14, bold: r === 2 });
      });
    }
    s.addNotes("Fiches d'identité. Imprimer cette diapo et couper en deux : chaque moitié devient une carte-rôle pour le bal masqué (la dernière ligne dit comment jouer la créature). Les numéros renvoient aux stratagèmes de Schopenhauer; 14 = crier victoire malgré la défaite.");
  }

  await pres.writeFile({ fileName: __dirname + "/deck.pptx" });
  await applyTheme(__dirname + "/deck.pptx", THEME);
  console.log("ok");
})();

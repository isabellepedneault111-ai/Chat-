// Support de présentation · Focus FGA · rencontre Teams de 15 min
// node build-deck.js  →  Focus-FGA-presentation.pptx
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/root/.claude/skills/synced/2159d0f0-c9f4-456a-9726-1684b994a977_c4c777f8-0dfe-457d-9a0d-4ed1c19cf05f/pptx/scripts/apply_theme.js");

const THEME = {
  name: "Focus FGA",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "0B1530", lt1: "FFFFFF", dk2: "050816", lt2: "EEF2F8",
    accent1: "F5C542", accent2: "6CB33F", accent3: "2456B0", accent4: "E8590C", accent5: "4FB3E8", accent6: "8A93B0",
    hlink: "2456B0", folHlink: "6A1B9A",
  },
};

const QA = process.env.QA === "1";
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13,33 × 7,5 po
pres.title = "Focus FGA · Labo techno-IA";
pres.author = "Isabelle Pedneault";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const fs = require("fs");
const cover = (f) => "data:image/jpeg;base64," + fs.readFileSync(f).toString("base64");

// Gabarits
pres.defineSlideMaster({ title: "VIDEO", background: { color: "000000" } });
pres.defineSlideMaster({ title: "IMAGE", background: { color: "050816" } });
pres.defineSlideMaster({
  title: "SOMBRE",
  background: { color: THEME.colors.dk1 },
  objects: [{ text: { text: "FOCUS FGA · CFGA DE LA JONQUIÈRE", options: { x: 0.6, y: 6.95, w: 8, h: 0.3, fontSize: 10, color: C.accent6, charSpacing: 3, isTextBox: true, margin: 0 } } }],
  placeholders: undefined,
});

// 1 · Bande-annonce
pres.addSection({ title: "Ouverture" });
let s = pres.addSlide({ masterName: "VIDEO", sectionTitle: "Ouverture" });
if (QA) s.addImage({ path: "media/focus.jpg", x: 0, y: 0, w: 13.333, h: 7.5, objectName: "Vidéo Focus FGA" }); else s.addMedia({ type: "video", path: "media/focus.mp4", cover: cover("media/focus.jpg"), x: 0, y: 0, w: 13.333, h: 7.5, objectName: "Vidéo Focus FGA" });
s.addNotes("0:00 – 2:00 · BANDE-ANNONCE. Lance la vidéo dès l'ouverture, sans dire un mot avant : l'effet de surprise fait le travail. Rappel Teams : si tu partages ton écran plutôt qu'en PowerPoint Live, coche « Inclure le son de l'ordinateur » (utile si tu as ajouté de la musique).");

// 2 · Qui suis-je
pres.addSection({ title: "Qui suis-je" });
s = pres.addSlide({ masterName: "SOMBRE", sectionTitle: "Qui suis-je" });
s.addShape(pres.shapes.OVAL, { x: 0.8, y: 1.45, w: 2.6, h: 2.6, fill: { color: C.accent1 }, objectName: "Pastille initiales" });
s.addText("IP", { x: 0.8, y: 1.45, w: 2.6, h: 2.6, align: "center", valign: "middle", fontSize: 72, bold: true, color: C.text1, fontFace: "Arial", isTextBox: true, margin: 0 });
s.addText("Allô! Moi, c'est Isabelle", { x: 0.8, y: 4.35, w: 4.9, h: 1.1, fontSize: 30, bold: true, color: C.background1, fontFace: "Arial", isTextBox: true, margin: 0, valign: "top" });
s.addText("Conseillère pédagonumérique · CFGA de la Jonquière", { x: 0.8, y: 5.45, w: 4.4, h: 0.6, fontSize: 15, color: C.accent5, isTextBox: true, margin: 0 });
const cards = [
  ["35", "profs accompagnés dans la CoP IA 2025-2026, avec l'UQAC"],
  ["1", "appli créée pour l'accompagnement des élèves : Mon Parcours"],
  ["0", "jugement sur ta pratique : mon rôle, c'est le coup de main"],
];
cards.forEach(([n, t], i) => {
  const y = 1.0 + i * 1.75;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.9, y, w: 6.7, h: 1.5, rectRadius: 0.15, fill: { color: "16234A" }, line: { color: "2A3A66", width: 1 }, objectName: "Carte " + (i + 1) });
  s.addText(n, { x: 6.15, y, w: 1.4, h: 1.5, fontSize: 54, bold: true, color: C.accent1, fontFace: "Arial", valign: "middle", isTextBox: true, margin: 0 });
  s.addText(t, { x: 7.65, y, w: 4.75, h: 1.5, fontSize: 18, color: C.background1, valign: "middle", isTextBox: true, margin: 0 });
});
s.addText("Un coup de main ciblé : dans ta matière, avec ton groupe, sur tes outils.", { x: 5.9, y: 6.25, w: 6.7, h: 0.5, fontSize: 15, italic: true, color: C.accent2, isTextBox: true, margin: 0 });
s.addNotes("2:00 – 3:30 · QUI SUIS-JE (90 s). Trois chiffres, une promesse. Ajoute UNE anecdote personnelle (pourquoi la FGA te tient à cœur, ou un moment de classe marquant) : c'est elle qu'on retiendra. Phrase de transition : « Avant de parler d'outils, j'ai voulu savoir qui on accueille vraiment. »");

// 3 · Stats
pres.addSection({ title: "Nos élèves" });
s = pres.addSlide({ masterName: "VIDEO", sectionTitle: "Nos élèves" });
if (QA) s.addImage({ path: "media/stats.jpg", x: 0, y: 0, w: 13.333, h: 7.5, objectName: "Vidéo stats clientèle" }); else s.addMedia({ type: "video", path: "media/stats.mp4", cover: cover("media/stats.jpg"), x: 0, y: 0, w: 13.333, h: 7.5, objectName: "Vidéo stats clientèle" });
s.addNotes("3:30 – 6:00 · QUI ACCUEILLONS-NOUS VRAIMENT? Vidéo de 80 s. Ensuite, une seule question dans le clavardage : « En un mot, qu'est-ce qui vous surprend? » Lis 2 ou 3 réponses à voix haute. Message clé : 70 % valorisent déjà plus l'école qu'avant, et ça se joue dans les premières semaines.");

// 4 · Whiteboard
pres.addSection({ title: "Exemple concret" });
s = pres.addSlide({ masterName: "VIDEO", sectionTitle: "Exemple concret" });
if (QA) s.addImage({ path: "media/whiteboard.jpg", x: 0, y: 0, w: 13.333, h: 7.5, objectName: "Vidéo tableau blanc" }); else s.addMedia({ type: "video", path: "media/whiteboard.mp4", cover: cover("media/whiteboard.jpg"), x: 0, y: 0, w: 13.333, h: 7.5, objectName: "Vidéo tableau blanc" });
s.addNotes("6:00 – 8:00 · UN EXEMPLE CONCRET. Vidéo de 54 s. Lien avec le sondage : la formation à distance revient parmi vos défis. L'astuce à répéter de vive voix : ouvrir Whiteboard dans sa propre fenêtre et partager cette fenêtre, sinon l'enregistrement ne capte pas le tableau.");

// 5 · Labo techno-IA
pres.addSection({ title: "Labo techno-IA" });
s = pres.addSlide({ masterName: "IMAGE", sectionTitle: "Labo techno-IA" });
s.addImage({ path: "media/labo.png", x: 0, y: 0, w: 13.333, h: 7.5, altText: "Labo techno-IA : 35 profs, ½ journée par mois, zéro expert au départ. Réalisations de la CoP IA et proposition pour la FGA.", objectName: "Visuel Labo techno-IA" });
s.addNotes("8:00 – 10:30 · LE LABO TECHNO-IA. Raconte la CoP IA en une phrase : 35 profs, ½ journée par mois, un défi personnel chaque mois, zéro expert au départ. Montre UNE réalisation qui te parle. Puis la bascule : « Vous l'avez dit dans le sondage : techno et IA, en petit groupe, mardi ou jeudi après-midi. On le fait. »");

// 6 · Mon Parcours
pres.addSection({ title: "Mon Parcours" });
s = pres.addSlide({ masterName: "IMAGE", sectionTitle: "Mon Parcours" });
s.addImage({ path: "media/parcours.png", x: 0, y: 0, w: 13.333, h: 7.5, altText: "Appel aux volontaires pour tester l'application Mon Parcours avec un ou deux élèves cet automne.", objectName: "Visuel Mon Parcours" });
s.addNotes("10:30 – 12:00 · MON PARCOURS. Je cherche quelques profs pour l'essayer avec un ou deux élèves cet automne. Rien à installer, rien ne sort de l'appareil. Montre le code QR : ils peuvent l'ouvrir pendant que tu parles.");

// 7 · Inscription
pres.addSection({ title: "Inscription" });
s = pres.addSlide({ masterName: "SOMBRE", sectionTitle: "Inscription" });
s.addText("On s'inscrit, là, maintenant", { x: 0.6, y: 0.45, w: 12.1, h: 0.9, fontSize: 40, bold: true, color: C.background1, fontFace: "Arial", isTextBox: true, margin: 0 });
s.addText("Dans le clavardage de la rencontre, ajoute ton nom au tableau Loop", { x: 0.6, y: 1.35, w: 12.1, h: 0.5, fontSize: 18, color: C.accent5, isTextBox: true, margin: 0 });
const rows = [
  [{ text: "Nom", options: { bold: true, color: "0B1530", fill: { color: "F5C542" } } }, { text: "Labo techno-IA", options: { bold: true, color: "0B1530", fill: { color: "F5C542" } } }, { text: "Mon Parcours", options: { bold: true, color: "0B1530", fill: { color: "F5C542" } } }, { text: "Café 1:1", options: { bold: true, color: "0B1530", fill: { color: "F5C542" } } }, { text: "Mon défi en une ligne", options: { bold: true, color: "0B1530", fill: { color: "F5C542" } } }],
  ["Ton nom ici", "✔", "", "✔", "Mes élèves en FAD décrochent après 20 min"],
  ["", "", "✔", "", ""],
  ["", "", "", "", ""],
];
s.addTable(rows, { x: 0.6, y: 2.15, w: 12.1, colW: [2.4, 2.0, 2.0, 1.6, 4.1], rowH: 0.6, fontSize: 16, color: "FFFFFF", fill: { color: "16234A" }, border: { type: "solid", color: "2A3A66", pt: 1 }, valign: "middle", objectName: "Tableau Loop exemple" });
const steps = [["1", "Ouvre le clavardage"], ["2", "Coche ce qui t'intéresse"], ["3", "Écris ton défi : on part de là"]];
steps.forEach(([n, t], i) => {
  const x = 0.6 + i * 4.1;
  s.addShape(pres.shapes.OVAL, { x, y: 5.0, w: 0.8, h: 0.8, fill: { color: C.accent2 }, objectName: "Étape " + n });
  s.addText(n, { x, y: 5.0, w: 0.8, h: 0.8, align: "center", valign: "middle", fontSize: 24, bold: true, color: C.text1, isTextBox: true, margin: 0 });
  s.addText(t, { x: x + 0.95, y: 5.0, w: 3.0, h: 0.8, valign: "middle", fontSize: 17, color: C.background1, isTextBox: true, margin: 0 });
});
s.addText("Pas prêt·e à écrire ton nom devant tout le monde? Écris-moi en privé sur Teams, c'est parfait aussi.", { x: 0.6, y: 6.1, w: 12.1, h: 0.5, fontSize: 15, italic: true, color: C.accent1, isTextBox: true, margin: 0 });
s.addNotes("12:00 – 14:30 · INSCRIPTION EN DIRECT. AVANT la rencontre : dans le clavardage de la rencontre Teams, insère un composant Loop « Tableau » avec ces 5 colonnes, puis épingle le message. Pendant : laisse 90 secondes de silence pendant qu'ils écrivent, et lis les noms qui apparaissent (« Bienvenue Sophie! ») pour créer l'effet d'entraînement. Le tableau reste dans le clavardage après la rencontre : les retardataires peuvent s'ajouter.");

// 8 · Merci
pres.addSection({ title: "Clôture" });
s = pres.addSlide({ masterName: "SOMBRE", sectionTitle: "Clôture" });
s.addText("Les pépites, c'était la bande-annonce.", { x: 0.6, y: 2.2, w: 12.1, h: 0.9, fontSize: 40, bold: true, color: C.background1, fontFace: "Arial", isTextBox: true, margin: 0, align: "center" });
s.addText("Le film, on le fait ensemble.", { x: 0.6, y: 3.1, w: 12.1, h: 0.9, fontSize: 40, bold: true, color: C.accent1, fontFace: "Arial", isTextBox: true, margin: 0, align: "center" });
s.addText("Isabelle Pedneault · Conseillère pédagonumérique · Écris-moi sur Teams", { x: 0.6, y: 4.6, w: 12.1, h: 0.5, fontSize: 18, color: C.accent5, isTextBox: true, margin: 0, align: "center" });
s.addNotes("14:30 – 15:00 · CLÔTURE. Une phrase, un merci, et tu laisses le tableau Loop ouvert. Prochaine étape à annoncer si tu l'as : la première rencontre du Labo (novembre, mardi ou jeudi après-midi selon le sondage).");

(async () => {
  const out = QA ? "qa.pptx" : "Focus-FGA-presentation.pptx";
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("ok");
})();

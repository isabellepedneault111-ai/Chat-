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


const vid = (s, name, label) => {
  if (QA) s.addImage({ path: `media/${name}.jpg`, x: 0, y: 0, w: 13.333, h: 7.5, objectName: label });
  else s.addMedia({ type: "video", path: `media/${name}.mp4`, cover: cover(`media/${name}.jpg`), x: 0, y: 0, w: 13.333, h: 7.5, objectName: label });
};
const title = (s, t, sub) => {
  s.addText(t, { x: 0.6, y: 0.45, w: 12.1, h: 0.85, fontSize: 38, bold: true, color: C.background1, fontFace: "Arial", isTextBox: true, margin: 0 });
  if (sub) s.addText(sub, { x: 0.6, y: 1.3, w: 12.1, h: 0.45, fontSize: 17, color: C.accent5, isTextBox: true, margin: 0 });
};

// 1 · Ordre du jour + intentions (affichée pendant que les gens arrivent)
pres.addSection({ title: "Accueil" });
let s = pres.addSlide({ masterName: "SOMBRE", sectionTitle: "Accueil" });
title(s, "Focus FGA · 15 minutes", "Pendant que tout le monde arrive : voici où on s'en va");
s.addText("NOS INTENTIONS", { x: 0.6, y: 2.0, w: 5.6, h: 0.4, fontSize: 14, bold: true, color: C.accent2, charSpacing: 4, isTextBox: true, margin: 0 });
const intents = [
  ["Connaître", "qui on accueille vraiment… et ce qui fonctionne déjà"],
  ["Découvrir", "des outils Teams et IA concrets pour la FGA"],
  ["Choisir", "comment je veux être accompagné·e cette année"],
];
intents.forEach(([v, t], i) => {
  const y = 2.55 + i * 1.25;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: 5.6, h: 1.05, rectRadius: 0.12, fill: { color: "16234A" }, line: { color: "2A3A66", width: 1 }, objectName: "Intention " + (i + 1) });
  s.addText([{ text: v + "  ", options: { bold: true, color: THEME.colors.accent1, fontSize: 22 } }, { text: t, options: { color: "FFFFFF", fontSize: 16 } }], { x: 0.85, y, w: 5.2, h: 1.05, valign: "middle", isTextBox: true, margin: 0 });
});
s.addText("L'ORDRE DU JOUR", { x: 6.9, y: 2.0, w: 5.8, h: 0.4, fontSize: 14, bold: true, color: C.accent2, charSpacing: 4, isTextBox: true, margin: 0 });
const agenda = [
  ["2 min", "Qui suis-je?"],
  ["3 min", "Qui accueillons-nous vraiment?"],
  ["3 min", "Le Labo techno-IA"],
  ["1 min", "Mon Parcours : volontaires recherchés"],
  ["3 min", "La bande-annonce : 10 pépites Teams"],
  ["2 min", "Je m'inscris, en direct"],
  ["1 min", "Le parcours d'accueil : merci!"],
];
agenda.forEach(([m, t], i) => {
  const y = 2.5 + i * 0.52;
  s.addText(m, { x: 6.9, y, w: 1.2, h: 0.5, fontSize: 16, bold: true, color: C.accent1, valign: "middle", isTextBox: true, margin: 0 });
  s.addText(t, { x: 8.15, y, w: 4.75, h: 0.5, fontSize: 16, color: C.background1, valign: "middle", isTextBox: true, margin: 0 });
});
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 6.25, w: 12.1, h: 0.75, rectRadius: 0.12, fill: { color: THEME.colors.accent1 }, objectName: "Bandeau clavardage" });
s.addText([{ text: "💬 Dans le clavardage : Teams, tu l'utilises pour quoi? Un mot ou plusieurs!", options: { bold: true, fontSize: 16, breakLine: true } }, { text: "Stocker · Collaborer · Partager · Contribuer · Soutenir l'apprentissage · Communiquer…", options: { fontSize: 14 } }], { x: 0.85, y: 6.25, w: 11.7, h: 0.75, color: "0B1530", valign: "middle", isTextBox: true, margin: 0 });
s.addNotes("INTERACTION 1 (pendant l'arrivée) : « Teams, vous l'utilisez pour quoi? Un mot ou plusieurs, dans le clavardage. » Lis quelques réponses à voix haute en accueillant les gens. Ça prépare la bande-annonce (« Teams, c'est pas juste pour les réunions! »). AVANT LE DÉBUT · Affiche cette diapo pendant que les gens se connectent. Dès que tu commences, lis les trois intentions en 20 secondes : « Aujourd'hui, trois choses : connaître, découvrir, choisir. » Rappel : mode « Mis en avant » dans Teams pour qu'on voie ta caméra par-dessus les diapos.");

// 2 · Qui suis-je
pres.addSection({ title: "Qui suis-je" });
s = pres.addSlide({ masterName: "IMAGE", sectionTitle: "Qui suis-je" });
s.addImage({ path: "media/bio.png", x: 0, y: 0, w: 13.333, h: 7.5, altText: "Allô! Moi, c'est Isabelle : parcours, classes et approches.", objectName: "Visuel Qui suis-je" });
s.addNotes("2 MIN · QUI SUIS-JE. Des mots-clés à l'écran, l'histoire dans ta bouche. Parcours : 15 ans en classe au CSS de la Capitale, en milieu très défavorisé (indice 10/10), enseignante associée. Co-chercheuse : texte d'opinion et texte d'information avec l'Université Laval (direction : Érick Falardeau); cyberintimidation et nouveau programme CCQ avec l'UQAM (direction : Stéphane Villeneuve). Contribution au Plan d'action numérique (2018). Conseillance au CFP de Lévis (électromécanique), mentore des classes multiâges. Retour au Saguenay en 2018 : CP maths-sciences, pédagonumérique, maintenant le CFGA. L'an dernier : toute l'année avec Patrick Giroux, directeur du département de recherche en éducation à l'UQAC. Mandat du comité de gouvernance pédagonumérique : produire le cadre réflexif sur l'utilisation de l'IA pour le CSS, et animer plusieurs CoP IA (35 profs au total). Collaboration aussi avec Ève Pouliot, co-titulaire de la Chaire de recherche VISAJ. Pont vers la suite : « Et c'est ce qu'on va faire ensemble ici, avec le Labo techno-IA. » La phrase qui compte : « Je reconnais mes élèves dans les vôtres. » Transition : « Justement, qui accueille-t-on vraiment? »");

// 3 · Stats
pres.addSection({ title: "Nos élèves" });
s = pres.addSlide({ masterName: "VIDEO", sectionTitle: "Nos élèves" });
vid(s, "stats", "Vidéo stats clientèle");
s.addNotes("3 MIN · QUI ACCUEILLONS-NOUS VRAIMENT? Vidéo de 80 s. Ensuite, une seule question dans le clavardage : « En un mot, qu'est-ce qui vous surprend? » Lis 2 ou 3 réponses. INTERACTION 2 : « En un mot, qu'est-ce qui vous surprend? » Laisse 30 secondes, lis 3 mots. Message clé : 70 % valorisent déjà plus l'école qu'avant, et ça se joue dans les premières semaines.");

// 3b · Image fixe pour la discussion
s = pres.addSlide({ masterName: "IMAGE", sectionTitle: "Nos élèves" });
s.addImage({ path: "media/repare.png", x: 0, y: 0, w: 13.333, h: 7.5, altText: "Le CFGA répare déjà : 15 % valorisaient l'école avant, 64 % aujourd'hui, +49 points.", objectName: "Le CFGA répare déjà" });
s.addNotes("À GARDER À L'ÉCRAN pendant la discussion. « 15 % accordaient une grande valeur à l'école avant d'arriver. 64 % aujourd'hui. 43 sur 61 en hausse. Le CFGA répare déjà. Et ça se joue dans les premières semaines. » Plan B si la vidéo ne joue pas : reste sur cette diapo et dis les chiffres.");

// 4 · Labo techno-IA
pres.addSection({ title: "Labo techno-IA" });
s = pres.addSlide({ masterName: "IMAGE", sectionTitle: "Labo techno-IA" });
s.addImage({ path: "media/labo.png", x: 0, y: 0, w: 13.333, h: 7.5, altText: "Labo techno-IA : 35 profs, ½ journée par mois, zéro expert au départ.", objectName: "Visuel Labo techno-IA" });
s.addNotes("3 MIN · LE LABO TECHNO-IA. Rappel du pont : le cadre réflexif IA produit avec l'UQAC sert de base au Labo (pédagogique · éthique · légal, avant, pendant, après). La CoP IA en une phrase : 35 profs, ½ journée par mois, un défi chaque mois, zéro expert au départ. Montre UNE réalisation. INTERACTION 3 : « Si l'IA pouvait t'enlever UNE tâche cette semaine, ce serait laquelle? Écris-la dans le clavardage. » Lis-en 2 ou 3 : ce seront les premiers défis du Labo! Puis : « Vous l'avez dit dans le sondage : techno et IA, en petit groupe, mardi ou jeudi après-midi. On le fait. »");

// 5 · Mon Parcours
pres.addSection({ title: "Mon Parcours" });
s = pres.addSlide({ masterName: "IMAGE", sectionTitle: "Mon Parcours" });
s.addImage({ path: "media/parcours.png", x: 0, y: 0, w: 13.333, h: 7.5, altText: "Appel aux volontaires pour tester l'application Mon Parcours.", objectName: "Visuel Mon Parcours" });
s.addNotes("2 MIN · MON PARCOURS. Je cherche quelques profs pour l'essayer avec un ou deux élèves cet automne. Rien à installer, rien ne sort de l'appareil. Montre le code QR.");

// 6 · Bande-annonce
pres.addSection({ title: "Bande-annonce" });
s = pres.addSlide({ masterName: "VIDEO", sectionTitle: "Bande-annonce" });
vid(s, "focus", "Vidéo Focus FGA");
s.addNotes("3 MIN · LA BANDE-ANNONCE (2 min 36). Phrase d'intro : « Et pour vous donner le goût, voici 10 pépites Teams. » Puis tu lances, sans parler. INTERACTION 4, juste après la vidéo : « Votre pépite préférée? Écrivez son numéro dans le clavardage! » Lis le numéro le plus populaire : ce sera le sujet de la première rencontre du Labo. Les autres pépites : en Pépite express (20 min, à la carte, dans ta classe ou en période libre). Puis enchaîne sur la diapo suivante.");

// 7 · Inscription
pres.addSection({ title: "Inscription" });
s = pres.addSlide({ masterName: "SOMBRE", sectionTitle: "Inscription" });
title(s, "On s'inscrit, là, maintenant", "Dans le clavardage de la rencontre, ajoute ton nom au tableau Loop");
const rows = [
  ["Nom", "Labo techno-IA", "Mon Parcours : je la teste", "Pépite #", "Mon défi en une ligne"].map((t) => ({ text: t, options: { bold: true, color: "0B1530", fill: { color: "F5C542" } } })),
  ["Ton nom ici", "X", "", "7", "Donner une rétroaction plus rapide"],
  ["", "", "X", "2", ""],
  ["", "", "", "", ""],
];
s.addTable(rows, { x: 0.6, y: 2.15, w: 12.1, colW: [2.2, 2.0, 2.7, 1.5, 3.7], rowH: 0.6, fontSize: 16, color: "FFFFFF", fill: { color: "16234A" }, border: { type: "solid", color: "2A3A66", pt: 1 }, valign: "middle", objectName: "Tableau Loop exemple" });
[["1", "Ouvre le clavardage"], ["2", "Un X ou le # de ta pépite"], ["3", "Écris ton défi : on part de là"]].forEach(([n, t], i) => {
  const x = 0.6 + i * 4.1;
  s.addShape(pres.shapes.OVAL, { x, y: 5.0, w: 0.8, h: 0.8, fill: { color: C.accent2 }, objectName: "Étape " + n });
  s.addText(n, { x, y: 5.0, w: 0.8, h: 0.8, align: "center", valign: "middle", fontSize: 24, bold: true, color: C.text1, isTextBox: true, margin: 0 });
  s.addText(t, { x: x + 0.95, y: 5.0, w: 3.0, h: 0.8, valign: "middle", fontSize: 17, color: C.background1, isTextBox: true, margin: 0 });
});
s.addText("Pas prêt·e à écrire ton nom devant tout le monde? Écris-moi en privé sur Teams, c'est parfait aussi.", { x: 0.6, y: 6.1, w: 12.1, h: 0.5, fontSize: 15, italic: true, color: C.accent1, isTextBox: true, margin: 0 });
s.addNotes("2 MIN · INSCRIPTION EN DIRECT. AVANT LA RENCONTRE (5 min, dans le clavardage de la réunion Teams) : 1) clique sur l'icône Loop (ou « + ») sous la zone de message, 2) choisis « Tableau », 3) nomme les colonnes : Nom · Labo techno-IA · Mon Parcours : je la teste · Pépite # · Mon défi en une ligne, 4) envoie, puis épingle le message. Plan B sans Loop : « Écrivez dans le clavardage : Labo, Appli ou Pépite # + votre défi ». Pour l'appli : « Testez-la, brisez-la! Mettez un X dans la colonne Mon Parcours. » Pour les pépites : « Une pépite vous fait de l'œil? Mettez son numéro : je viens vous la montrer en 20 minutes, une Pépite express. » Pendant : 90 secondes de silence, et lis les noms qui apparaissent. Le tableau reste dans le clavardage après la rencontre. Puis passe à la diapo finale : le parcours d'accueil.");

// 7b · Parcours d'accueil (fin)
pres.addSection({ title: "Parcours d'accueil" });
s = pres.addSlide({ masterName: "IMAGE", sectionTitle: "Parcours d'accueil" });
s.addImage({ path: "media/accueil.png", x: 0, y: 0, w: 13.333, h: 7.5, altText: "Le parcours d'accueil EVR-5001 : accueillir, se connaître, s'engager, se fixer un cap, l'entretien EVR. Horaire = autonomie. Merci à toute l'équipe d'accueil.", objectName: "Parcours d'accueil EVR" });
s.addNotes("1 MIN · LE MOT DE LA FIN. Le lien avec les stats : « Tout à l'heure, on a vu que ça se joue dans les premières semaines. Ces premières semaines, on les a déjà : c'est le parcours d'accueil. » EVR-5001, Engagement vers sa réussite : cours obligatoire pour tout nouvel élève, environ 25 h, 8 modules, projet-pilote depuis le 24 août. Le chemin : 1) Accueillir : le centre, ses personnes-ressources, son horaire. 2) Se connaître : selfie d'apprenant et bilan d'accrocheur. 3) S'engager : motivation, persévérance, engagement. 4) Se fixer un cap : objectif professionnel, objectifs SMART. 5) L'entretien EVR avec le tuteur (crédit de 5e secondaire). LE MESSAGE À MARTELER : « Horaire = autonomie. Avancer à son rythme, ça s'apprend, et ça s'apprend dès l'accueil. » Deux rôles qui se parlent : le tuteur suit l'élève dans la durée; le prof de matière supervise le cahier et signale les alertes au tuteur. Nomme et remercie l'équipe d'accueil. Dernière phrase : « Merci. On y est déjà, ensemble. » Laisse cette diapo à l'écran pendant que les gens quittent.");

// 8 · Bonus (à garder sous la main, pas prévu dans les 15 min)
pres.addSection({ title: "Bonus" });
s = pres.addSlide({ masterName: "VIDEO", sectionTitle: "Bonus" });
vid(s, "whiteboard", "Vidéo tableau blanc");
s.addNotes("BONUS, seulement si on te pose la question sur la formation à distance : la vidéo complète du tableau blanc (54 s). Astuce à répéter : ouvrir Whiteboard dans sa propre fenêtre et partager cette fenêtre, sinon l'enregistrement ne capte pas le tableau.");

(async () => {
  const out = QA ? "qa.pptx" : "Focus-FGA-presentation.pptx";
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("ok");
})();

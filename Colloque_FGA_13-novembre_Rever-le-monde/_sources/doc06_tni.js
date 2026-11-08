const L = require('./lib');
const { d, C, EMBED, P, label, H1, H2, B, N, SP, note, tbl, styles, numbering, footer, save, page } = L;
const OUT = process.argv[2];

const kids = [
  label('Colloque régional FGA · 13 novembre 2026', { size: 16 }),
  new d.Paragraph({ spacing: { before: 120, after: 80, line: 900, lineRule: d.LineRuleType.AT_LEAST }, children: [new d.TextRun({ text: 'PRÉSENTER AU TNI', font: 'Anton', size: 64 })] }),
  P('La marche à suivre, étape par étape. À garder imprimée à côté de l’ordinateur.', { run: { italics: true, color: C.grey } }),

  H1('01', 'La veille'),
  N('Copiez le fichier **presentation/index.html** sur deux clés USB. Renommez-le, par exemple « Presentation_Rever-le-monde.html ».', 1),
  N('Sur l’ordinateur branché au TNI, ouvrez le fichier avec **Chrome** ou **Edge** (clic droit, Ouvrir avec). Pas avec Internet Explorer.', 1),
  N('Vérifiez que la 3D bouge à la diapo 2 (le globe) et que la pyramide se construit à la diapo 24. Si l’écran reste blanc, l’ordinateur est trop ancien : prenez votre portable.', 1),
  N('Remplissez la fiche de Francis sur la diapo 3 : appuyez sur **E**, touchez un champ, écrivez, puis **Terminer**.', 1),
  N('Copiez la vidéo des élèves sur l’ordinateur (pas sur une clé, c’est plus fluide).', 1),

  H1('02', 'Le jour J, avant que la salle arrive'),
  N('Ouvrez le fichier. Touchez **F** (ou le bouton F en bas) pour le plein écran.', 2),
  N('Si vous voulez vos notes à l’abri des regards et que l’ordinateur a son propre écran : Windows + P, « Étendre », puis touchez **P**. La fenêtre présentateur s’ouvre : glissez-la sur l’écran de l’ordinateur. Sinon, oubliez cette étape : le guide imprimé contient les mêmes notes.', 2),
  N('Entre les deux séances (11 h 50 à 13 h 30) : à la diapo 2, touchez **Vider** ; à la diapo 17 (votes), **Remettre à zéro** ; à la diapo 24 (pyramide), **Effacer**. Photographiez le mur d’enjeux avant de le défaire.', 2),
  N('Restez sur la diapo 1 pendant que les gens entrent.', 2),

  H1('03', 'Pendant l’atelier'),
  tbl(['Pour…', 'Au TNI (au doigt)', 'Au clavier'], [
    ['Avancer, reculer', 'Boutons ‹ › en bas, ou glisser le doigt vers la gauche ou la droite', 'Flèches, barre d’espace'],
    ['Lancer un minuteur', 'Boutons jaunes « 3 min », « 4 min »… sur la diapo, ou T en bas', 'T'],
    ['Arrêter le minuteur', 'Toucher le minuteur', 'T'],
    ['Accrocher un enjeu au globe', 'Toucher la case, écrire, puis « Accrocher au globe »', 'Écrire, puis Entrée'],
    ['Faire tourner le globe', 'Glisser le doigt sur le globe', '—'],
    ['Voter à la pyramide', 'Toucher un étage', '—'],
    ['Révéler, passer à la suite', 'Toucher le bouton jaune ou la citation', 'Entrée'],
    ['Voir les notes', 'N en bas (la salle les voit)', 'N'],
    ['Modifier un texte', 'E, toucher le texte, Terminer', 'E'],
    ['Plein écran', 'F en bas', 'F'],
  ], [2500, 4600, 2980], { firstAccent: true }),
  SP(120),
  ...note('Pour écrire au TNI', ['Le clavier virtuel du TNI fonctionne, mais c’est plus rapide qu’une personne tape les enjeux et les votes au clavier de l’ordinateur pendant que l’autre anime.']),

  H1('04', 'Si quelque chose ne marche pas'),
  B('**L’écran est blanc ou la 3D ne bouge pas :** ouvrez le fichier avec Chrome. Sinon, utilisez le portable. Le contenu des cartes reste lisible même sans 3D.'),
  B('**Le plein écran ne s’active pas :** touchez F en bas, ou appuyez sur F11.'),
  B('**La vidéo ne joue pas :** à la diapo 22, touchez « Choisir une vidéo » et allez la chercher sur l’ordinateur.'),
  B('**On s’est trompé de diapo :** les boutons ‹ › ramènent où on veut ; rien n’est perdu.'),
  B('**On a modifié un texte par erreur :** E, puis « Tout remettre comme avant ».'),

  H1('05', 'Ce que la salle voit, ce qu’elle ne voit pas'),
  B('**La salle voit :** tout ce qui est sur le TNI, y compris le minuteur (c’est voulu, pour les activités) et les notes si on touche N.'),
  B('**La salle ne voit pas :** la fenêtre présentateur (touche P), si elle est sur l’écran de l’ordinateur, et le guide imprimé.'),
  B('**Ce qui est écrit pendant l’atelier** (enjeux, votes, fiches, textes modifiés) reste sur cet ordinateur seulement.'),
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Présenter au TNI · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 900, bottom: 900, left: 1100, right: 1100 } } },
    footers: footer('Rêver le monde de demain · présenter au TNI'), children: kids }]
});
save(doc, OUT);

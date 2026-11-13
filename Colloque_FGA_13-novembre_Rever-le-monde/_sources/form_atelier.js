// Formulaire d'évaluation · atelier Rêver le monde de demain (format prêt pour l'importation rapide de Microsoft Forms)
const L = require('./lib');
const { d, C, EMBED, SANS, P, label, H1, H2, B, BR, SP, note, tbl, styles, numbering, footer, save, page } = L;
const OUT = process.argv[2];
const W = 9900;
let n = 0;
// Une question : numéro, texte, type entre parenthèses, puis les choix en liste
function Q(texte, type, choix, o = {}) {
  n += 1;
  const out = [new d.Paragraph({ keepNext: true, spacing: { before: 220, after: 60 }, children: [
    new d.TextRun({ text: n + '. ', bold: true, size: 24, color: C.accent }),
    new d.TextRun({ text: texte, bold: true, size: 24, color: C.ink }),
    new d.TextRun({ text: '  (' + type + (o.oblig ? ', obligatoire' : ', facultatif') + ')', size: 19, italics: true, color: C.accent })] })];
  if (o.aide) out.push(new d.Paragraph({ keepNext: true, spacing: { after: 60 }, children: [new d.TextRun({ text: o.aide, italics: true, size: 20, color: C.ink })] }));
  (choix || []).forEach((c, i) => out.push(new d.Paragraph({ keepNext: i < choix.length - 1, spacing: { after: 30 }, indent: { left: 420 },
    children: [new d.TextRun({ text: String.fromCharCode(97 + i) + ') ', color: C.accent, bold: true, size: 21 }), new d.TextRun({ text: c, size: 21, color: C.ink })] })));
  return out;
}
const sec = (t, s) => [new d.Paragraph({ spacing: { before: 360, after: 40 }, keepNext: true, border: { bottom: { style: d.BorderStyle.SINGLE, size: 6, color: C.ink, space: 4 } },
  children: [new d.TextRun({ text: t, font: 'Anton', size: 30, color: C.ink })] }), ...(s ? [P(s, { after: 60, run: { italics: true, size: 20 } })] : [])];


const PE = ['Oui, tout à fait', 'En bonne partie', 'Pas encore'];
const kids = [
  label('Atelier « Rêver le monde de demain » · 13 novembre 2026 · Isabelle Pedneault et Francis Laroche', { size: 18, after: 80 }),
  new d.Paragraph({ spacing: { after: 120 }, children: [new d.TextRun({ text: 'Évaluation de l’atelier', font: 'Anton', size: 56, color: C.ink })] }),
  ...note('Mode d’emploi', [
    '**Importation rapide** : dans Microsoft Forms, « Importation rapide », puis ce fichier Word. Vérifier ensuite le type de chaque question (indiqué entre parenthèses).',
    '**Durée pour la personne qui répond** : 2 minutes. 8 questions, dont 3 facultatives.',
    '**À la fin de l’atelier** : projeter le code QR du formulaire sur la diapo « Merci » et donner 2 minutes, avant que les gens se lèvent.'
  ], { after: 160 }),
  ...sec('Titre et description du formulaire'),
  P('**Titre :** Rêver le monde de demain · Votre avis en 2 minutes', { after: 60 }),
  P('**Description :** Merci d’avoir rêvé avec nous ! Ce formulaire est anonyme : aucun nom ni courriel n’est recueilli (sauf si vous demandez qu’on vous contacte, à la fin). Il n’y a pas de bonne réponse : « pas encore » est une réponse précieuse.', { after: 60 }),

  ...sec('Section 1 · Vous'),
  ...Q('Votre séance', 'Choix unique', ['Le matin (10 h 20)', 'L’après-midi (13 h 30)'], { oblig: true }),
  ...Q('Votre rôle', 'Choix unique', ['Enseignant·e en participation sociale, déficience ou intégration sociale', 'Enseignant·e en intégration socioprofessionnelle', 'Enseignant·e d’une matière (français, mathématiques, sciences, anglais, etc.)', 'Professionnel·le (orthopédagogie, orientation, conseil pédagogique)', 'Direction', 'Autre'], { oblig: true }),

  ...sec('Section 2 · L’atelier'),
  ...Q('Dans l’ensemble, l’atelier vous a…', 'Évaluation, 5 étoiles', [], { oblig: true }),
  ...Q('À la fin de l’atelier, je peux…', 'Likert : Oui, tout à fait · En bonne partie · Pas encore', [
    'décrire la démarche, de l’idée à l’action (rêver, cibler, choisir, s’engager)',
    'reconnaître ce qui nourrit l’engagement : compétence, autonomie, sens, appartenance',
    'analyser ce qui existe déjà et ce qui manque dans mon milieu',
    'esquisser une première action avec mes élèves'], { oblig: true, aide: 'Les quatre intentions de l’atelier. Une ligne par énoncé.' }),
  ...Q('Ce qui vous a le plus servi', 'Choix multiples, 2 réponses au maximum', ['Les trois cercles : école, communauté, nature', 'L’analyse de contexte (leviers, je remarque que…)', 'Résultat ou action ?', 'L’invite Copilot', 'La galerie et les votes', 'Le dévoilement des pratiques vécues', 'Le cahier du participant', 'Les échanges en îlot, avec d’autres centres'], { oblig: true }),

  ...sec('Section 3 · Et maintenant ?'),
  ...Q('Mon élan : une chose que je vais essayer d’ici un mois', 'Texte court', [], { oblig: false, aide: 'Petite, concrète, avec mes élèves.' }),
  ...Q('Une chose à garder, une chose à changer', 'Texte long', [], { oblig: false }),
  ...Q('Aimeriez-vous un accompagnement pour démarrer une démarche semblable ?', 'Choix unique, avec embranchement', ['Oui, contactez-moi (le CSI ou le conseil pédagogique)', 'Non, merci'], { oblig: true, aide: 'Si « Oui » : une question de plus apparaît, « Votre courriel » (texte court, facultatif). C’est la seule donnée personnelle du formulaire.' }),

  ...sec('Message de fin (après l’envoi)'),
  P('Merci ! Les ressources de l’atelier restent en ligne : rever-le-monde.netlify.app · Et dans un an : qu’est-ce qui sera resté ?', { after: 60 }),

  BR(),
  ...sec('Réglages dans Microsoft Forms'),
  tbl(['Réglage', 'Choix', 'Pourquoi'], [
    ['**Qui peut répondre**', 'Tout le monde peut répondre', 'Les participant·es viennent de quatre centres de services.'],
    ['**Enregistrer le nom**', 'Décoché', 'Anonymat réel (Loi 25). Le courriel n’est demandé que si la personne veut être contactée.'],
    ['**Embranchement**', 'Question 8 : « Oui » mène à « Votre courriel » ; « Non » termine', 'Garder l’anonymat de tous les autres.'],
    ['**Date de fin**', '20 novembre 2026', 'Une semaine : la réponse se donne surtout sur place.'],
    ['**Thème**', 'Mauve ou neutre', 'Cohérent avec l’atelier.'],
  ], [2400, 2900, 4600], { firstAccent: true }),
  ...sec('Pour que ce soit utile'),
  B('**Sur place**, à la diapo « Merci » : le code QR à l’écran, 2 minutes, les animateurs se taisent. C’est là qu’on a presque toutes les réponses.'),
  B('**Comparer le matin et l’après-midi** (question 1) : ajuster la deuxième séance si quelque chose accroche le matin.'),
  B('**Les « pas encore »** à la question 4 disent quelle intention renforcer : ce n’est pas un échec, c’est une piste.'),
  B('**Les élans** (question 6) : les relire dans un mois et relancer, en lien avec la dernière page du cahier, « Qu’est-ce qui sera resté ? ».'),
];
const doc = new d.Document({ creator: 'Isabelle Pedneault', title: 'Évaluation de l’atelier · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 1000, bottom: 1000, left: 1170, right: 1170 } } }, footers: footer('Rêver le monde de demain · évaluation de l’atelier'), children: kids }] });
save(doc, OUT);

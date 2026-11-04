const L = require('./lib');
const { d, C, EMBED, SANS, P, label, H1, H2, H3, B, BR, SP, note, tbl, img, styles, numbering, footer, save, page } = L;
const OUT = process.argv[2];

// Bloc d'invite prêt à copier : police à chasse fixe, filet mauve
const prompt = (titre, txt) => [
  label(titre, { before: 160 }),
  ...txt.map((t, i) => new d.Paragraph({ border: { left: { style: d.BorderStyle.SINGLE, size: 12, color: C.accent, space: 10 } }, indent: { left: 240 },
    spacing: { after: i === txt.length - 1 ? 200 : 40, line: 264 }, keepNext: i < txt.length - 1, children: L.runs(t, { font: 'Consolas', size: 18 }) }))
];

const kids = [
  label('Colloque régional FGA · 13 novembre 2026', { size: 16 }),
  new d.Paragraph({ spacing: { before: 120, after: 80, line: 900, lineRule: d.LineRuleType.AT_LEAST }, children: [new d.TextRun({ text: 'AIDE-MÉMOIRE COPILOT', font: 'Anton', size: 64 })] }),
  P('Des invites prêtes à copier pour différencier, préparer et évaluer un projet d’engagement citoyen. Recto-verso, à garder près du clavier.', { run: { italics: true, color: C.grey } }),

  H1('01', 'La formule'),
  tbl(['Ingrédient', 'La question à se poser', 'Exemple'], [
    ['**Rôle**', 'Qui doit répondre ?', 'Tu es conseiller pédagogique en FGA au Québec.'],
    ['**Contexte**', 'Pour qui, dans quelle situation ?', 'Un groupe PPS réalise un projet sur le gaspillage alimentaire.'],
    ['**Tâche**', 'Qu’est-ce que je veux, exactement ?', 'Génère une grille descriptive à 4 niveaux.'],
    ['**Contraintes**', 'Quel format, quelle limite ?', 'Langage simple, tableau, verbes observables, pas de note chiffrée.']
  ], [1800, 3300, 4920], { firstAccent: true }),
  P('Ensuite, **dialoguez** : « Simplifie le niveau 2 », « Ajoute un exemple pour un élève en individualisé », « Reformule au tutoiement ». La première réponse est un brouillon.', { before: 120 }),

  H1('02', 'Cinq invites pour l’atelier et pour lundi'),
  ...prompt('1 · Une grille d’évaluation descriptive', [
    'Tu es conseiller pédagogique en formation générale des adultes au Québec.',
    'Contexte : un groupe d’adultes du programme Participation sociale réalise un projet citoyen sur [l’enjeu].',
    'Tâche : génère une grille d’évaluation descriptive à 4 niveaux pour le cours [sigle], centrée sur la résolution de problèmes dans un projet communautaire.',
    'Contraintes : langage simple que les élèves comprennent, verbes observables, présentation en tableau, aucune note chiffrée.'
  ]),
  ...prompt('2 · Des relances métacognitives (objectivation)', [
    'Tu es un coach pédagogique qui accompagne des adultes de 16 à 25 ans en FGA.',
    'Tâche : propose 8 questions de relance pour aider un élève à évaluer son autonomie dans son projet citoyen : 2 avant, 3 pendant, 3 après.',
    'Contraintes : phrases courtes, au « je », une question au moins pour chaque sphère de l’engagement (affective, cognitive, comportementale, citoyenne).'
  ]),
  ...prompt('3 · D’un résultat à des actions', [
    'Voici un résultat souhaité par mon groupe : « [résultat] ».',
    'Transforme-le en 3 actions SMART formulées avec un verbe conjugué au présent, un responsable et une date.',
    'Si une de mes formulations est encore un résultat plutôt qu’une action, dis-le-moi et explique pourquoi.'
  ]),
  ...prompt('4 · Un enjeu comme contexte de tâche (scénario A)', [
    'Tu es enseignant de mathématiques en FGA, en enseignement individualisé.',
    'Contexte : un élève inscrit en [sigle] veut travailler sur l’enjeu [enjeu].',
    'Tâche : propose une situation d’apprentissage de 3 périodes où il réalise un petit sondage et en analyse les résultats, en 3 niveaux de complexité.',
    'Contraintes : liens explicites avec les savoirs du sigle, liste du matériel, une question d’objectivation à la fin.'
  ]),
  ...prompt('5 · Du GN au GV en français', [
    'Tu es enseignant de français en FGA.',
    'Tâche : crée un court exercice où les élèves décrivent leur « monde idéal » avec des groupes du nom enrichis (noyau et expansions), puis transforment chaque GN en groupe du verbe avec un sujet qui agit et une date.',
    'Contraintes : 6 items, corrigé à part, thème lié à leur centre ou à leur quartier.'
  ]),

  H1('03', 'Les balises'),
  B('**Aucun renseignement personnel** dans une invite : pas de nom d’élève, pas de diagnostic, pas de résultat scolaire identifiable.'),
  B('**Le compte du centre de services** (Copilot avec protection des données d’entreprise), pas un compte personnel.'),
  B('**L’IA propose, l’enseignant dispose.** On vérifie les liens avec le programme, les faits et le niveau de langue.'),
  B('**On le dit aux élèves** quand un outil a été préparé avec l’IA, et on leur montre comment l’utiliser de façon critique.'),
  B('On consulte les balises de son CSS avant tout usage avec les élèves.'),

  H1('04', 'Mes tests'),
  P('Avant l’atelier, essayez une invite et notez ce qui en est sorti.'),
  tbl(['Invite', 'Ce que Copilot a produit', 'Ce que j’ajuste'], [1, 2].map(n => [`n° ${n}`, P(' ', { after: 500 }), P(' ', { after: 500 })]), [1400, 4310, 4310])
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Aide-mémoire Copilot · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 900, bottom: 900, left: 1100, right: 1100 } } },
    footers: footer('Rêver le monde de demain · aide-mémoire Copilot'), children: kids }]
});
save(doc, OUT);

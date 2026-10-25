// Tout le contenu pédagogique et musical est ici, séparé du code.
// Pour ajouter un exercice, une progression, une piste ou un défi : modifier ce fichier seulement.
// (Voir .claude/skills/diapason/SKILL.md pour le format détaillé.)

export const MODULES = [
  { id: 'accord', num: '★', name: 'Voix + piano', color: 'var(--rec)', tagline: 'Les claviers de Frog coachent la voix de Zaza, accord par accord.' },
  { id: 'miroir', num: '01', name: 'Miroir', color: 'var(--c-miroir)', tagline: 'La voix, dessinée en direct.' },
  { id: 'tessiture', num: '02', name: 'Empreinte', color: 'var(--c-empreinte)', tagline: 'L’étendue de chaque voix, et la zone du duo.' },
  { id: 'gym', num: '03', name: 'Gym vocal', color: 'var(--c-gym)', tagline: 'Échauffements transposés, notés en direct.' },
  { id: 'labo', num: '∿', name: 'Le labo', color: 'var(--c-labo)', tagline: 'Rythme ↔ note : quand un polyrythme devient un accord.' },
  { id: 'studio', num: '', name: 'Studio', color: 'var(--c-studio)', tagline: 'Beat, accords, instrument, scène, clip.' },
  { id: 'paroles', num: '', name: 'Paroles', color: 'var(--c-paroles)', tagline: 'Syllabes, rimes, synonymes : écrire pour être chanté.' },
  { id: 'carnet', num: '', name: 'Le mur', color: 'var(--c-carnet)', tagline: 'Toutes nos idées, et où elles s’en vont.' },
  { id: 'relais', num: '', name: 'Relais', color: 'var(--rec)', tagline: 'Se lancer des sons entre deux sessions, et répondre par-dessus.' },
  { id: 'ambiances', num: '', name: 'Ambiances', color: 'var(--rec)', tagline: 'Partir ailleurs avant d’écrire ou de chanter.' },
  { id: 'jeux', num: '', name: 'Le grimoire', color: 'var(--c-paroles)', tagline: 'Rituels d’écriture : nos mots, une carte tirée dans les braises, le cadavre exquis.' },
  { id: 'coffre', num: '', name: 'Le coffre', color: 'var(--rec)', tagline: 'Nos petites perles : la vidéo, le mot d’accueil, ce qu’on y dépose.' },
  { id: 'lexique', num: '', name: 'Notre lexique', color: 'var(--rec)', tagline: 'Les mots de FLIP, et ce qu’ils font bouger.' },
  { id: 'bilan', num: '', name: 'Notre bilan', color: 'var(--rec)', tagline: 'Où on est rendus, et ce que la recherche dit de faire ensuite.' },
  { id: 'session', num: '', name: 'Session', color: 'var(--rec)', tagline: 'La séance guidée, du check-in à la prise.' },
];

// Étendues indicatives (MIDI). Un portrait du jour, jamais une étiquette.
export const VOICE_TYPES = [
  { id: 'basse', name: 'Basse', low: 40, high: 64, desc: 'Une voix qui résonne dans le grave, chaude et profonde. Elle porte l’harmonie comme les fondations d’une maison.' },
  { id: 'baryton', name: 'Baryton', low: 45, high: 69, desc: 'Le registre du milieu des voix graves : polyvalent, idéal en pop, folk et rock. Une voix qui raconte.' },
  { id: 'tenor', name: 'Ténor', low: 48, high: 72, desc: 'Une voix grave qui aime monter. Brillante dans les refrains qui « décollent ».' },
  { id: 'alto', name: 'Alto', low: 53, high: 77, desc: 'Une voix aiguë riche dans le médium, avec de l’épaisseur. Parfaite en soul, R&B et harmonies.' },
  { id: 'mezzo', name: 'Mezzo', low: 57, high: 81, desc: 'Une voix aiguë souple et lumineuse, très mélodique.' },
  { id: 'soprano', name: 'Soprano', low: 60, high: 84, desc: 'Une voix haut perchée et légère, qui brille dans les mélodies aériennes. Le soutien du souffle est sa meilleure amie.' },
];

// pattern : [demi-tons depuis la note de départ, durée en temps]
export const EXERCISES = [
  {
    id: 'sirene', name: 'La sirène', level: 'Échauffement', bpm: 70,
    pattern: [[0, 1], [4, 1], [7, 1], [12, 2], [7, 1], [4, 1], [0, 2]],
    tip: 'Pense « ouuuu » comme une sirène de pompier. Garde le menton à l’horizontale : c’est le son qui monte, pas ta tête.',
  },
  {
    id: 'cinq', name: 'Escalier de 5', level: 'Débutant', bpm: 90,
    pattern: [[0, 1], [2, 1], [4, 1], [5, 1], [7, 2], [5, 1], [4, 1], [2, 1], [0, 2]],
    tip: 'Une syllabe par marche : « ma-mé-mi-mo-mou ». La mâchoire reste molle, comme si tu bâillais un peu.',
  },
  {
    id: 'arpege', name: 'Arpège majeur', level: 'Intermédiaire', bpm: 84,
    pattern: [[0, 1], [4, 1], [7, 1], [12, 2], [7, 1], [4, 1], [0, 2]],
    tip: 'En montant, imagine que le son « plonge » vers l’avant au lieu de grimper. Le ventre soutient, la gorge reste libre.',
  },
  {
    id: 'riff', name: 'Riff R&B', level: 'Avancé', bpm: 100,
    pattern: [[0, 0.5], [3, 0.5], [5, 0.5], [7, 0.5], [10, 1], [7, 0.5], [5, 0.5], [3, 0.5], [0, 2]],
    tip: 'L’agilité vient de la détente. Ne pousse pas plus d’air : pense à de petits rebonds très légers.',
  },
  {
    id: 'trille', name: 'Trille', level: 'Avancé', bpm: 96,
    pattern: [[0, 0.5], [2, 0.5], [0, 0.5], [2, 0.5], [0, 0.5], [2, 0.5], [0, 0.5], [2, 0.5], [0, 2]],
    tip: 'Deux notes voisines, régulières comme un métronome. Si ça bloque, détends la base de la langue.',
  },
  {
    id: 'saut', name: 'Le grand saut', level: 'Défi', bpm: 72,
    pattern: [[0, 1], [12, 1], [11, 1], [7, 1], [4, 1], [0, 2]],
    tip: 'Saut d’octave! Prépare la note du haut dans ta tête avant de la chanter. L’oreille d’abord, la voix ensuite.',
  },
];

// chords : [degré en demi-tons depuis la tonique, qualité]
export const PROGRESSIONS = [
  { id: 'pop', name: 'La pop éternelle', roman: 'I – V – vi – IV', chords: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M']], note: 'Des centaines de succès reposent sur ces 4 accords.' },
  { id: 'emo', name: 'Mélancolie', roman: 'vi – IV – I – V', chords: [[9, 'm'], [5, 'M'], [0, 'M'], [7, 'M']], note: 'Les mêmes accords que la pop… commencés ailleurs. Écoute comme l’humeur change.' },
  { id: 'cinquante', name: 'Années 50', roman: 'I – vi – IV – V', chords: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M']], note: 'La progression « doo-wop ».' },
  { id: 'jazz', name: 'Jazz feutré', roman: 'ii7 – V7 – Imaj7 – Imaj7', chords: [[2, 'm7'], [7, '7'], [0, 'maj7'], [0, 'maj7']], note: 'Le moteur du jazz : tension → résolution.' },
  { id: 'reve', name: 'Rêverie', roman: 'Imaj7 – IVmaj7', chords: [[0, 'maj7'], [5, 'maj7'], [0, 'maj7'], [5, 'maj7']], note: 'Deux accords qui flottent. Parfait pour improviser sans peur.' },
  { id: 'andalouse', name: 'Cadence andalouse', roman: 'vi – V – IV – III', chords: [[9, 'm'], [7, 'M'], [5, 'M'], [4, 'M']], note: 'Flamenco, rock, musique de film : une descente dramatique.' },
];

// Grilles de 16 pas : k = grosse caisse, s = caisse claire, h = charleston, c = claps
export const DRUM_PRESETS = {
  'Pop': { k: '1000000010100000', s: '0000100000001000', h: '1010101010101010', c: '0000000000000000' },
  'Boom bap': { k: '1000000101000000', s: '0000100000001000', h: '1010101010101011', c: '0000000000000000' },
  'Dembow': { k: '1000100010001000', s: '0001001000010010', h: '1111111111111111', c: '0000000000000000' },
  'House': { k: '1000100010001000', s: '0000000000000000', h: '0010001000100010', c: '0000100000001000' },
  'Ballade': { k: '1000000000100000', s: '0000000010000000', h: '1000100010001000', c: '0000000000000000' },
  'Vide': { k: '0000000000000000', s: '0000000000000000', h: '0000000000000000', c: '0000000000000000' },
};

export const RATIO_PRESETS = [
  { id: 'uni', name: 'Une seule pulsation', ratios: [1], label: '1', rhythm: 'Un battement régulier, comme un cœur.', pitch: 'Une seule note.' },
  { id: 'oct', name: 'Octave', ratios: [1, 2], label: '1 : 2', rhythm: 'Un disque tourne deux fois plus vite : noires et croches.', pitch: 'Deux notes si semblables qu’elles portent le même nom.' },
  { id: 'quinte', name: 'Quinte / hémiole', ratios: [2, 3], label: '2 : 3', rhythm: 'Le « 3 contre 2 » des musiques africaines, du flamenco et de la valse.', pitch: 'Une quinte juste : Do et Sol. Le son des chants de puissance.' },
  { id: 'quarte', name: 'Quarte', ratios: [3, 4], label: '3 : 4', rhythm: 'Polyrythme 4 contre 3 : ça tourne, ça déroute.', pitch: 'Une quarte : le début de « Ô Canada » et de nombreux hymnes.' },
  { id: 'maj', name: 'Accord majeur', ratios: [4, 5, 6], label: '4 : 5 : 6', rhythm: 'Trois rythmes qui ne se retrouvent qu’une fois par cycle.', pitch: 'Un accord majeur « pur » : lumineux, stable.' },
  { id: 'min', name: 'Accord mineur', ratios: [10, 12, 15], label: '10 : 12 : 15', rhythm: 'Un polyrythme complexe : ils se retrouvent rarement.', pitch: 'Un accord mineur : plus sombre, plus tendu.' },
  { id: 'triton', name: 'Triton', ratios: [5, 7], label: '5 : 7', rhythm: 'Un 5 contre 7 : presque impossible à taper.', pitch: 'Le « diabolus in musica » : instable, il veut bouger.' },
];


// ---------- Carnet partagé ----------
export const CARNET_TYPES = [
  { id: 'note', label: 'Note', aide: 'Une idée, un lien, une consigne, un mot pour ton duo.', placeholder: 'Ex. : Idée de titre pour la chanson 2' },
  { id: 'texte', label: 'Écrit', aide: 'Un brouillon, un poème, un bout de texte à proposer. Pour écrire une chanson complète, utilise l’atelier de paroles.', placeholder: 'Ex. : Premier jet du couplet' },
  { id: 'audio', label: 'Audio', aide: 'Un mémo vocal du cellulaire, une prise d’instrument, une idée de mélodie. Ton duo peut l’écouter tout de suite.', placeholder: 'Ex. : Riff de guitare pour le refrain' },
  { id: 'essai', label: 'Essai', aide: 'Ce que vous avez tenté : ce qui a marché, ce qui n’a pas marché. Les essais ratés sont précieux.', placeholder: 'Ex. : Refrain une octave plus haut' },
  { id: 'bilan', label: 'Bilan', aide: 'À la fin de chaque séance : 3 minutes, à deux, pour garder la trace et décider de la suite.', placeholder: 'Bilan du jour' },
  { id: 'bravo', label: 'Bravo', aide: 'Un mot positif pour l’autre : ce qu’il ou elle a fait de bien, précisément. Ça compte.', placeholder: 'Ex. : ton intro au Rhodes, wow' },
  { id: 'evaluation', label: 'Évaluation', aide: 'Chacun évalue sur les mêmes critères : comparez, c’est là que ça parle.', placeholder: 'Ex. : Bilan du mois 1' },
];

// Le bilan de séance : on regarde le produit ET la collaboration.
export const BILAN_QUESTIONS = [
  'Qu’avons-nous créé ou appris aujourd’hui?',
  'Un moment où on s’est vraiment écoutés',
  'Ce qui a bloqué (et comment on s’en est sortis)',
  'Notre prochaine étape, concrètement',
];

export const EVAL_CRITERES = [
  { label: 'Justesse et contrôle vocal', aide: 'Je tiens mes notes, je respire, je ne force pas.' },
  { label: 'Rythme et synchronisation', aide: 'On reste ensemble sur le tempo.' },
  { label: 'Écoute mutuelle', aide: 'Je laisse de l’espace, je réponds à ce que j’entends.' },
  { label: 'Invention', aide: 'J’ose des idées, je les transforme.' },
  { label: 'Texte', aide: 'Les mots servent l’émotion et entrent dans la musique.' },
  { label: 'Démarche', aide: 'On fait des essais, on garde des traces, on s’améliore.' },
];

// ---------- Atelier de paroles ----------
export const SECTION_KINDS = [
  { id: 'intro', label: 'Intro', hint: 'Quelques mots pour installer l’ambiance (ou rien du tout!)' },
  { id: 'couplet', label: 'Couplet', numbered: true, hint: 'Le couplet raconte : un lieu, un moment, un détail concret.' },
  { id: 'precouplet', label: 'Pré-refrain', hint: 'La montée : on prépare le refrain, la tension grandit.' },
  { id: 'refrain', label: 'Refrain', hint: 'La phrase que tout le monde va chanter. Courte, répétable, vraie.' },
  { id: 'pont', label: 'Pont', hint: 'Un changement de point de vue, une surprise avant le dernier refrain.' },
  { id: 'outro', label: 'Outro', hint: 'Comment on quitte la chanson.' },
];

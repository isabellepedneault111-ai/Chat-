// Tout le contenu pédagogique et musical est ici, séparé du code.
// Pour ajouter un exercice, une progression, une piste ou un défi : modifier ce fichier seulement.
// (Voir .claude/skills/diapason/SKILL.md pour le format détaillé.)

export const MODULES = [
  {
    id: 'miroir', num: '01', name: 'Miroir', color: 'var(--c-miroir)',
    tagline: 'Ta voix, dessinée en direct.',
    question: 'Ta voix est-elle une ligne droite… ou une montagne?',
  },
  {
    id: 'tessiture', num: '02', name: 'Empreinte', color: 'var(--c-empreinte)',
    tagline: 'Trouve l’étendue de ta voix — et celle du groupe.',
    question: 'Dans quelle tonalité toute la classe peut-elle chanter sans forcer?',
  },
  {
    id: 'gym', num: '03', name: 'Gym vocal', color: 'var(--c-gym)',
    tagline: 'Échauffements sur mesure, notés en direct.',
    question: 'Peut-on « voir » qu’on chante faux avant de l’entendre?',
  },
  {
    id: 'labo', num: '04', name: 'Rythme ↔ Note', color: 'var(--c-labo)',
    tagline: 'Accélère un rythme… jusqu’à ce qu’il chante.',
    question: 'Un accord majeur, est-ce juste un polyrythme très rapide?',
  },
  {
    id: 'studio', num: '05', name: 'Studio', color: 'var(--c-studio)',
    tagline: 'Beat, accords, prise de voix et pochette d’album.',
    question: 'Que manque-t-il à une chanson quand on enlève la batterie?',
  },
  {
    id: 'paroles', num: '06', name: 'Paroles', color: 'var(--c-paroles)',
    tagline: 'Syllabes, rimes, synonymes : écrire pour être chanté.',
    question: 'Pourquoi un refrain se retient-il mieux qu’un couplet?',
  },
  {
    id: 'carnet', num: '07', name: 'Carnet', color: 'var(--c-carnet)',
    tagline: 'Vos écrits, audios, bilans et évaluations, à deux.',
    question: 'Qu’est-ce qu’un essai raté nous apprend?',
  },
];

// Étendues indicatives (MIDI). Un portrait du jour, jamais une étiquette.
export const VOICE_TYPES = [
  { id: 'basse', name: 'Basse', low: 40, high: 64, desc: 'Une voix qui résonne dans le grave, chaude et profonde. Elle porte l’harmonie comme les fondations d’une maison.' },
  { id: 'baryton', name: 'Baryton', low: 45, high: 69, desc: 'Le registre du milieu des voix graves : polyvalent, idéal en pop, folk et rock. Une voix qui raconte.' },
  { id: 'tenor', name: 'Ténor', low: 48, high: 72, desc: 'Une voix grave qui aime monter. Brillante dans les refrains qui « décollent ».' },
  { id: 'alto', name: 'Alto', low: 53, high: 77, desc: 'Une voix aiguë riche dans le médium, avec de l’épaisseur. Parfaite en soul, R&B et harmonies.' },
  { id: 'mezzo', name: 'Mezzo', low: 57, high: 81, desc: 'Le terrain de beaucoup de voix d’enfants et de voix aiguës : souple, lumineuse, très mélodique.' },
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

// Pistes pédagogiques par module. PFEQ : Programme de formation de l'école québécoise.
// CCN : Cadre de référence de la compétence numérique (MEQ).
export const PISTES = {
  home: {
    intro: 'Diapason, c’est un labo : on y observe, on y teste des hypothèses, on y crée. Chaque module ouvre une question plus grande que la musique.',
    questions: [
      'Si tu pouvais voir le son, à quoi ressemblerait le silence?',
      'Qu’est-ce qui rend une voix unique : la hauteur, le timbre, ou ce qu’elle raconte?',
      'Est-ce que la musique, c’est des maths qu’on peut danser?',
    ],
    liens: ['Musique — Inventer, Interpréter, Apprécier', 'CCN — Innover et faire preuve de créativité avec le numérique'],
    hors: 'Commence la période sans rien dire : projette le Miroir, chante une note, et laisse les élèves deviner ce qui se passe.',
  },
  miroir: {
    intro: 'Le Miroir rend visible une chose invisible : la hauteur du son. C’est la porte d’entrée idéale pour apprivoiser sa voix sans jugement.',
    questions: [
      'Quand tu parles, ta voix monte-t-elle à la fin d’une question? Vérifie!',
      'Peux-tu dessiner une montagne, un escalier, une vague… avec ta voix?',
      'Pourquoi la ligne tremble-t-elle un peu même quand tu crois tenir la note?',
      'Siffle, puis chante la même note : est-ce la même hauteur à l’écran?',
    ],
    defis: [
      'Dessine la lettre M avec ta voix.',
      'Tiens une ligne parfaitement droite pendant 5 secondes.',
      'Reproduis la mélodie de la sonnerie de l’école.',
    ],
    liens: ['Musique — Interpréter (justesse, contrôle du souffle)', 'Science et technologie — fréquence et hauteur du son', 'Français — intonation à l’oral'],
    hors: 'Fais lire le même vers par trois élèves : colère, joie, peur. Comparez les dessins. L’émotion a une forme!',
  },
  tessiture: {
    intro: 'L’Empreinte mesure l’étendue confortable d’une voix, puis superpose celles du groupe pour trouver la zone où tout le monde peut chanter ensemble.',
    questions: [
      'Pourquoi les voix changent-elles à l’adolescence (la mue)?',
      'Si la zone commune de la classe est petite, que peut-on faire pour chanter ensemble quand même?',
      'Ton étendue est-elle la même le matin et l’après-midi? Teste!',
      'Pourquoi dit-on qu’un instrument a un « diapason »?',
    ],
    defis: [
      'Trouve une chanson connue qui tient entièrement dans la zone commune du groupe.',
      'Calcule ton étendue en demi-tons, puis en octaves (fraction!).',
    ],
    liens: ['Musique — Interpréter (choix de tonalité)', 'Mathématique — intervalles, fractions, rapports', 'Éducation à la santé — hygiène vocale'],
    hors: 'Construis une « carte météo vocale » du groupe chaque mois : la mue devient un phénomène scientifique qu’on observe, pas une gêne.',
  },
  gym: {
    intro: 'Le Gym vocal transforme l’échauffement en jeu : des exercices transposés à ta voix, avec une rétroaction visuelle immédiate.',
    questions: [
      'Pourquoi commence-t-on un échauffement par le grave et le doux?',
      'Ton score est-il meilleur quand tu écoutes d’abord, ou quand tu chantes tout de suite?',
      'Quelle note te donne le plus de difficulté? Pourquoi celle-là, selon toi?',
    ],
    defis: [
      'Atteins 80 % sur l’Escalier de 5.',
      'Fais le Grand saut les yeux fermés, puis compare ton score.',
      'Invente ton propre exercice (5 notes) et fais-le chanter à un ou une camarade.',
    ],
    liens: ['Musique — Interpréter (justesse, posture, respiration)', 'Éducation physique et à la santé — respiration, posture', 'CCN — Développer sa pensée critique envers le numérique (que mesure vraiment le score?)'],
    hors: 'Débat : un logiciel peut-il juger si on chante « bien »? Qu’est-ce qu’il ne voit pas?',
  },
  labo: {
    intro: 'Le module le plus surprenant : un rythme qui accélère au-delà de ~20 battements par seconde cesse d’être un rythme et devient une note. Les mêmes rapports donnent des polyrythmes… ou des accords.',
    questions: [
      'À partir de combien de battements par seconde ton oreille entend-elle une note plutôt qu’un rythme?',
      'Pourquoi le rapport 2 : 3 sonne-t-il « bien » autant en rythme qu’en harmonie?',
      'Le cinéma montre 24 images par seconde : y a-t-il un lien avec ce seuil?',
      'Un accord, est-ce trois rythmes trop rapides pour être comptés?',
    ],
    defis: [
      'Trouve à l’oreille la vitesse exacte où le rythme « bascule » en note. Comparez vos réponses.',
      'Tape le polyrythme 2 : 3 avec tes deux mains pendant 8 cycles.',
      'Calcule : à 60 BPM, combien de Hz? Et à 240 BPM?',
      'Construis 4 disques 4 : 5 : 6 : 7. Quel accord entends-tu? Coupe un disque à la fois : lequel change le plus la couleur?',
      'Trouve un mélange dont la ligne blanche (la somme) se répète le plus vite possible. Pourquoi?',
    ],
    liens: ['Mathématique — rapports, proportions, fractions, fonctions exponentielles', 'Science et technologie — ondes, fréquence, perception', 'Musique — Apprécier (consonance, dissonance)'],
    hors: 'Faites un « polyrythme humain » : un groupe tape 2, l’autre 3. Puis expliquez que vos claviers font exactement ça, 100 fois plus vite.',
  },
  studio: {
    intro: 'Le Studio est l’endroit où on invente : un beat, une suite d’accords, une prise de voix, une pochette. Assez pour produire une vraie première chanson.',
    questions: [
      'Pourquoi la même suite d’accords peut-elle sonner joyeuse ou triste selon où elle commence?',
      'Quelles notes sont « sûres » pour improviser sur chaque accord? Pourquoi celles-là?',
      'Qu’est-ce qu’une pochette dit de la musique avant même qu’on l’écoute?',
      'En duo, qui décide? Comment partager l’espace sonore?',
      'Regarde la constellation de ta mélodie : monte-t-elle, descend-elle, fait-elle des vagues? Qu’est-ce que ça raconte?',
    ],
    defis: [
      'Crée un beat qui donne envie de marcher vite, puis un beat qui donne envie de dormir.',
      'Écris 4 lignes de texte qui tiennent sur la progression « Mélancolie ».',
      'Enregistre une prise, réécoute, nomme UNE chose à améliorer et refais-la.',
      'Scène en duo : la réponse doit reprendre UNE idée de la question (même rythme ou même note de départ).',
      'Tourne un clip de ta boucle, puis présente-le au groupe en une phrase : « Ma chanson parle de… ».',
    ],
    liens: ['Musique — Inventer des pièces vocales ou instrumentales', 'Musique — Apprécier ses réalisations et celles de ses camarades', 'CCN — Produire du contenu avec le numérique', 'Français — écriture créative (paroles)'],
    hors: 'Lancez une « maison de disques » de classe : chaque duo produit un titre, une pochette et une phrase de présentation. Écoute collective en fin d’étape.',
  },
};

PISTES.paroles = {
  intro: 'L’atelier fait le pont entre le français et la musique : on écrit pour la voix. Les syllabes, le e muet et la rime deviennent des outils de création, pas des règles à réciter.',
  questions: [
    'Pourquoi le e muet se chante-t-il parfois, et parfois non?',
    'Un refrain qui marche : qu’est-ce qui le rend facile à retenir?',
    'Rime riche ou assonance : laquelle sonne le plus « chanson »? Le plus « rap »?',
    'Que faire d’un trou dans le texte : le combler tout de suite, ou le laisser mûrir?',
  ],
  defis: [
    'Écris un refrain de 4 lignes de 8 syllabes chacune, avec un schéma AABB.',
    'Remplace 3 mots par des synonymes plus imagés.',
    'Échange ton couplet avec ton duo : chacun marque un passage [? incertain ?] chez l’autre.',
  ],
  liens: ['Français — Écrire des textes variés (poésie, chanson)', 'Musique — Inventer (texte et mélodie)', 'CCN — Collaborer à l’aide du numérique'],
  hors: 'Lisez le refrain à voix haute en tapant le rythme dans les mains : là où ça accroche, il y a une syllabe de trop.',
};
PISTES.carnet = {
  intro: 'Le carnet garde la trace de la démarche : essais, prises, bilans, évaluations. C’est la mémoire du duo, et une matière riche pour l’évaluation de la compétence.',
  questions: [
    'Qu’est-ce qu’un essai raté vous a appris cette semaine?',
    'Relisez vos trois derniers bilans : qu’est-ce qui revient?',
    'Votre autoévaluation et celle de votre partenaire se ressemblent-elles? Pourquoi?',
  ],
  defis: [
    'Faites un bilan de 3 minutes à la fin de chaque séance, sans exception, pendant 2 semaines.',
    'Déposez un mémo vocal de 20 secondes : l’idée la plus folle de la journée.',
  ],
  liens: ['Musique — Apprécier ses réalisations et celles de ses pairs', 'CCN — Collaborer à l’aide du numérique', 'CCN — Développer et mobiliser ses habiletés technologiques'],
  hors: 'Projetez le carnet d’un duo (avec son accord) et faites deviner aux autres la prochaine étape de leur chanson.',
};

export const DEFIS_SURPRISE = [
  'Chante ton prénom sur 3 notes différentes. Le groupe doit les reproduire.',
  'Fais une « conversation » avec ta voix sans aucun mot : seulement des montagnes et des vallées.',
  'Trouve un son dans la classe qui a une hauteur précise. Mesure-le dans le Miroir!',
  'Chante une note, puis la même note une octave plus haut. Combien de fois plus rapide vibre-t-elle?',
  'En 2 minutes : invente un beat qui représente ta journée.',
  'Fais deviner une émotion au groupe en ne chantant qu’une seule voyelle.',
  'Trouve la vitesse du Labo qui correspond à ton rythme cardiaque.',
  'Imite un animal avec ta voix : quelle note le Miroir détecte-t-il?',
  'Un ou une élève chante une note, la classe doit tenir la même note pendant 5 secondes en écoutant.',
  'Choisis une pochette générée au hasard et invente le titre de la chanson qui va avec.',
];

// ---------- Carnet partagé ----------
export const CARNET_TYPES = [
  { id: 'note', label: 'Note', aide: 'Une idée, un lien, une consigne, un mot pour ton duo.', placeholder: 'Ex. : Idée de titre pour la chanson 2' },
  { id: 'texte', label: 'Écrit', aide: 'Un brouillon, un poème, un bout de texte à proposer. Pour écrire une chanson complète, utilise l’atelier de paroles.', placeholder: 'Ex. : Premier jet du couplet' },
  { id: 'audio', label: 'Audio', aide: 'Un mémo vocal du cellulaire, une prise d’instrument, une idée de mélodie. Ton duo peut l’écouter tout de suite.', placeholder: 'Ex. : Riff de guitare pour le refrain' },
  { id: 'essai', label: 'Essai', aide: 'Ce que vous avez tenté : ce qui a marché, ce qui n’a pas marché. Les essais ratés sont précieux.', placeholder: 'Ex. : Refrain une octave plus haut' },
  { id: 'bilan', label: 'Bilan', aide: 'À la fin de chaque séance : 3 minutes, à deux, pour garder la trace et décider de la suite.', placeholder: 'Bilan du jour' },
  { id: 'evaluation', label: 'Évaluation', aide: 'Autoévaluation, évaluation par le ou la partenaire ou par l’enseignant·e, sur les mêmes critères.', placeholder: 'Ex. : Évaluation de mi-étape' },
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

// ---------- Parcours album ----------
export const ALBUM_STYLES = ['Pop', 'Hip-hop / rap', 'Folk / chanson', 'Rock', 'Électro', 'R&B / soul', 'Trad québécois', 'Mélange / à découvrir'];

// Les étapes du parcours, générées selon l'objectif du duo. weight = temps relatif prévu.
export function buildSteps(goal) {
  const steps = [
    { id: 'p-pacte', face: 'Face A · Accorder le duo', title: 'Le pacte du duo', why: 'Avant la musique, l’entente : comment on s’écoute, qui fait quoi, que fait-on en cas de désaccord. Écrivez 3 règles dans le carnet.', href: '#/carnet', cta: 'Écrire notre pacte', weight: 1 },
    { id: 'p-voix', face: 'Face A · Accorder le duo', title: 'Chacun son empreinte vocale', why: 'Chaque voix a son terrain confortable. Faites le test chacun votre tour.', href: '#/tessiture', cta: 'Faire mon empreinte', weight: 1 },
    { id: 'p-zone', face: 'Face A · Accorder le duo', title: 'Trouver notre zone commune', why: 'Ajoutez vos deux empreintes au portrait : Diapason trouve la zone où vous chantez ensemble sans forcer, donc vos tonalités.', href: '#/tessiture', cta: 'Voir notre zone', weight: 1 },
    { id: 'p-rituel', face: 'Face A · Accorder le duo', title: 'Notre rituel d’échauffement', why: 'Choisissez 2 exercices à faire au début de chaque séance. Le rituel rend la voix (et le duo) prêt.', href: '#/gym', cta: 'Essayer le gym vocal', weight: 1 },
  ];
  for (let k = 1; k <= (goal.songs || 1); k++) {
    const f = `Chanson ${k}`;
    steps.push(
      { id: `s${k}-idee`, face: f, title: `${f} · l’idée et le titre`, why: 'Une émotion, une image, une histoire vraie. Déposez vos idées (écrits, mémos vocaux) dans le carnet et choisissez-en une.', href: '#/carnet', cta: 'Déposer nos idées', weight: 1 },
      { id: `s${k}-refrain`, face: f, title: `${f} · le refrain`, why: 'Le cœur de la chanson. Court, répétable, chantable : visez des lignes de même longueur.', href: '#/paroles', cta: 'Écrire le refrain', weight: 2 },
      { id: `s${k}-melodie`, face: f, title: `${f} · la mélodie du refrain`, why: 'Sur la boucle de la Scène, tapez puis chantez la mélodie. Question / réponse si vous êtes deux.', href: '#/studio?tab=duo', cta: 'Ouvrir la Scène', weight: 2 },
      { id: `s${k}-beat`, face: f, title: `${f} · beat et accords`, why: 'Choisissez tempo, tonalité (dans votre zone commune!) et accords. Ou jouez-les à l’instrument : Diapason les reconnaît.', href: '#/studio?tab=beat', cta: 'Construire le beat', weight: 2 },
      { id: `s${k}-couplets`, face: f, title: `${f} · couplets et pont`, why: 'Les couplets racontent, le pont surprend. Marquez les passages incertains et les trous : vous y reviendrez à deux.', href: '#/paroles', cta: 'Écrire les couplets', weight: 3 },
      { id: `s${k}-prise`, face: f, title: `${f} · première prise`, why: 'Enregistrez, réécoutez, nommez UNE chose à améliorer, refaites. Déposez la meilleure prise dans le carnet.', href: '#/studio?tab=voix', cta: 'Enregistrer', weight: 2 },
      { id: `s${k}-bilan`, face: f, title: `${f} · bilan et évaluation croisée`, why: 'Chacun évalue la chanson et la collaboration sur les mêmes critères. Comparez : où êtes-vous d’accord?', href: '#/carnet', cta: 'Faire le bilan', weight: 1 },
    );
  }
  steps.push(
    { id: 'a-ordre', face: 'Face B · Sortir l’album', title: 'L’ordre des pistes et le titre final', why: 'Quelle chanson ouvre l’album? Laquelle le ferme? L’ordre raconte aussi une histoire.', href: '#/carnet', cta: 'Décider ensemble', weight: 1 },
    { id: 'a-pochette', face: 'Face B · Sortir l’album', title: 'La pochette', why: 'Générée à partir de vos mots, de votre tonalité et de vos accords.', href: '#/studio?tab=cover', cta: 'Créer la pochette', weight: 1 },
    { id: 'a-clip', face: 'Face B · Sortir l’album', title: 'Le clip', why: 'Filmez la Scène pendant que vous chantez : un clip par chanson, ou un seul pour l’album.', href: '#/studio?tab=duo', cta: 'Tourner le clip', weight: 1 },
    { id: 'a-lancement', face: 'Face B · Sortir l’album', title: 'L’écoute de lancement', why: 'Présentez l’album au groupe : une phrase par chanson, puis on écoute.', href: '#/carnet', cta: 'Préparer le lancement', weight: 1 },
    { id: 'a-bilan', face: 'Face B · Sortir l’album', title: 'Le bilan final', why: 'Qu’avez-vous appris, sur la musique et sur le travail à deux? Qu’est-ce que vous referiez autrement?', href: '#/carnet', cta: 'Écrire le bilan final', weight: 1 },
  );
  return steps;
}

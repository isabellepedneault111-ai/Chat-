// Les sources d'inspiration du grimoire. Chacune a son univers visuel (voir rituel.js).
// Les arcanes du tarot de Marseille servent d'images pour créer, pas de prédictions.

const g = (inner) => `<svg viewBox="0 0 100 100" class="emb" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
// Un emblème gravé, simple, pour chaque arcane.
const EMB = [
  g('<path d="M50 50m-4 0a4 4 0 1 1 8 0a10 10 0 1 1-20 0a18 18 0 1 1 36 0a26 26 0 1 1-52 0"/>'), // 0 spirale
  g('<path d="M20 50c0-14 22-14 30 0s30 14 30 0-22-14-30 0-30 14-30 0z"/>'), // I lemniscate
  g('<rect x="26" y="22" width="48" height="58" rx="3"/><path d="M50 22v58M34 36h8M58 36h8"/>'), // II livre
  g('<circle cx="50" cy="38" r="18"/><path d="M50 56v26M38 70h24"/>'), // III
  g('<rect x="26" y="26" width="48" height="48"/><path d="M26 50h48M50 26v48"/>'), // IIII
  g('<path d="M50 18v66M34 32h32M38 46h24M42 60h16"/>'), // V
  g('<circle cx="40" cy="50" r="20"/><circle cx="60" cy="50" r="20"/>'), // VI
  g('<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="6"/><path d="M50 22v56M22 50h56"/>'), // VII
  g('<path d="M50 18v62M24 34h52M24 34l-10 22h20zM76 34l-10 22h20zM36 80h28"/>'), // VIII balance
  g('<path d="M50 20l16 24-16 24-16-24z"/><circle cx="50" cy="44" r="4"/><path d="M50 68v14"/>'), // VIIII lanterne
  g('<circle cx="50" cy="50" r="30"/><path d="M50 20v60M20 50h60M29 29l42 42M71 29L29 71"/>'), // X roue
  g('<path d="M22 50c0-12 18-12 28 0s28 12 28 0-18-12-28 0-28 12-28 0z"/><path d="M30 76h40"/>'), // XI
  g('<path d="M24 24h52L50 74z"/><path d="M50 74v8"/>'), // XII triangle renversé
  g('<path d="M30 80V24c24 0 40 14 40 34"/><path d="M30 52h22"/>'), // XIII
  g('<path d="M22 30h22l-4 18H26zM56 52h22l-4 18H60z"/><path d="M40 48c8 0 12 6 18 6"/>'), // XIIII deux coupes
  g('<path d="M30 30c0 16 10 24 20 24s20-8 20-24M50 54v26M38 80h24"/>'), // XV cornes
  g('<rect x="34" y="34" width="32" height="48"/><path d="M58 14l-8 14h10l-8 14"/>'), // XVI tour et éclair
  g('<path d="M50 16l6 26 26 8-26 8-6 26-6-26-26-8 26-8z"/>'), // XVII étoile
  g('<path d="M62 22a28 28 0 1 0 0 56 22 22 0 1 1 0-56z"/><path d="M30 86v-6M44 88v-8M58 86v-6"/>'), // XVIII
  g('<circle cx="50" cy="50" r="16"/><path d="M50 18v10M50 72v10M18 50h10M72 50h10M27 27l7 7M66 66l7 7M73 27l-7 7M34 66l-7 7"/>'), // XVIIII soleil
  g('<path d="M50 80V28M32 46l18-18 18 18M24 80h52"/>'), // XX
  g('<ellipse cx="50" cy="50" rx="24" ry="34"/><circle cx="50" cy="50" r="5"/>'), // XXI couronne
];
const ARC = [
  ['0', 'Le Mat', 'le départ, la liberté', 'Écris ou joue un départ sans destination. Personne ne sait où ça va, et c’est le but.'],
  ['I', 'Le Bateleur', 'le commencement, les outils sur la table', 'Avec seulement ce que tu as sous la main (trois notes, trois mots), commence.'],
  ['II', 'La Papesse', 'le secret, le silence', 'Écris ce qu’on sait sans le dire. Laisse des silences dans la musique.'],
  ['III', 'L’Impératrice', 'la création qui déborde', 'Laisse déborder : une strophe trop pleine, un arrangement trop riche. Tu tailleras après.'],
  ['IIII', 'L’Empereur', 'la structure, la fondation', 'Construis la charpente seulement : forme, tempo, tonalité. Rien d’autre.'],
  ['V', 'Le Pape', 'la transmission', 'Une chanson pour quelqu’un qui t’a appris quelque chose, sans jamais le nommer.'],
  ['VI', 'L’Amoureux', 'le choix, le cœur partagé', 'Deux voix qui veulent des choses différentes. Laisse-les se répondre.'],
  ['VII', 'Le Chariot', 'l’élan qui avance', 'Un refrain qui avance : un rythme qui pousse, des mots en mouvement.'],
  ['VIII', 'La Justice', 'l’équilibre, la vérité', 'Dis une chose vraie, sans l’adoucir. Des lignes de même longueur.'],
  ['VIIII', 'L’Ermite', 'la solitude, la lumière intérieure', 'Une seule voix, très peu d’instruments. Une lanterne dans le noir.'],
  ['X', 'La Roue de Fortune', 'le cycle, le changement', 'Une boucle qui revient, un peu changée à chaque tour.'],
  ['XI', 'La Force', 'la douceur qui dompte', 'Chante fort tout doucement : de l’intensité, sans volume.'],
  ['XII', 'Le Pendu', 'le renversement', 'Raconte à l’envers, ou depuis le point de vue de l’autre.'],
  ['XIII', 'L’Arcane sans nom', 'la fin qui libère', 'Ce qu’il faut laisser finir pour que quelque chose pousse.'],
  ['XIIII', 'Tempérance', 'le mélange, la guérison', 'Mélange deux ambiances, deux styles, jusqu’à trouver la bonne température.'],
  ['XV', 'Le Diable', 'le désir, ce qui accroche', 'Ce qui t’attire et que tu n’avoues pas. Un groove qui ne lâche pas.'],
  ['XVI', 'La Maison Dieu', 'l’éclat, la libération soudaine', 'Un pont qui fait tout éclater, puis le calme d’après.'],
  ['XVII', 'L’Étoile', 'l’espoir, la source', 'Ce qui coule de toi sans effort. Verse, sans corriger.'],
  ['XVIII', 'La Lune', 'le rêve, le trouble', 'Écris un rêve. Des accords qui flottent sans se résoudre.'],
  ['XVIIII', 'Le Soleil', 'la joie partagée', 'Une chanson pour nous deux, lumineuse, sans ironie.'],
  ['XX', 'Le Jugement', 'l’appel, la renaissance', 'Ce qui t’appelle à te lever. Un refrain qui réveille.'],
  ['XXI', 'Le Monde', 'l’accomplissement', 'Reprends une idée ancienne du mur et termine-la.'],
];
const TOUCHE = ['Ce qu’on ne s’est jamais dit', 'La maison d’enfance', 'Quelqu’un qui n’est plus là', 'Le corps qui change', 'Ce qu’on transmet', 'Partir', 'La colère juste', 'La tendresse qu’on cache', 'Ce qui nous répare', 'Le temps qui file', 'Être aimé tel quel', 'Le pays qu’on porte en soi'];
const TOUCHE_C = ['Écris-le sans l’expliquer : un lieu, un objet, un geste.', 'Commence par un détail minuscule et vrai. Le reste suivra.', 'Écris-le comme une lettre que tu n’enverras pas. Tu choisis ce que tu montres.', 'Trois images, pas une seule idée abstraite.'];
const PEURS = ['Ne pas être à la hauteur', 'Être vraiment entendu', 'Le silence après la dernière note', 'Perdre sa voix', 'Que ça finisse', 'Recommencer à zéro', 'Le regard des autres', 'Me tromper devant toi', 'L’oubli', 'Réussir'];
const PEURS_C = ['Donne-lui un corps : où est-elle, de quoi a-t-elle l’air, quel son fait-elle?', 'Écris-lui une lettre, et laisse-la répondre.', 'Écris ce qu’elle protège en toi.', 'Chante-la tout bas, puis une deuxième fois, un peu plus fort.'];
const CONTRAINTES = [
  ['Trois notes', 'Toute la mélodie avec trois notes seulement. Le reste vient du rythme et de la voix.'],
  ['Sans le mot « je »', 'Un couplet entier sans dire « je ». Qui parle, alors?'],
  ['Une seule rime', 'Toutes les lignes du couplet sur la même rime.'],
  ['Commence par la fin', 'Écris la dernière ligne d’abord, puis remonte.'],
  ['Pas de refrain', 'Une chanson qui avance sans jamais revenir.'],
  ['Tout au présent', 'Pas de passé, pas de futur : seulement maintenant.'],
  ['Tempo 60', 'Tout à 60 battements par minute. Laisse respirer.'],
  ['Questions seulement', 'Chaque ligne est une question.'],
];

const pick = (l) => l[Math.floor(Math.random() * l.length)];
const shuffle = (l) => [...l].sort(() => Math.random() - 0.5);

// Les sources d’inspiration qu’on peut tirer (arcanes, etc.), chacune avec une phrase qui dit comment s’en servir.
export const SOURCES = [
  { id: 'arcanes', nom: 'Les arcanes', sous: 'Les 22 arcanes majeurs du tarot de Marseille, comme images pour créer.', note: 'Une image pour créer, pas une prédiction.' },
  { id: 'touche', nom: 'Ce qui nous touche', sous: 'Des sujets profonds, pour écrire vrai.', note: 'Tu écris ce que tu veux bien montrer. Rien ne part sans toi.' },
  { id: 'peurs', nom: 'Nos peurs', sous: 'Nommer une peur la rend plus petite, et elle devient matière.', note: 'Écrire ce qu’on ressent aide à le traverser (Pennebaker et Beall, 1986).' },
  { id: 'contrainte', nom: 'Une contrainte', sous: 'Moins de choix, plus d’invention.', note: 'La contrainte libère (De Bruin, 2019).' },
  { id: 'mots', nom: 'Nos mots', sous: 'Le champ de mots qu’on remplit à deux.', note: '' },
];

// Trois tirages pour une source. motsChamp : les mots du champ partagé ; cartes : le paquet de consignes.
export function tirer(source, motsChamp = [], cartes = []) {
  if (source === 'arcanes') return shuffle(ARC.map((a, i) => i)).slice(0, 3).map((i) => ({ card: { nom: 'Arcane majeur', consigne: ARC[i][3], src: ARC[i][2] }, mots: [ARC[i][1]], num: ARC[i][0], emblem: EMB[i] }));
  if (source === 'touche') return shuffle(TOUCHE).slice(0, 3).map((t) => ({ card: { nom: 'Ce qui nous touche', consigne: pick(TOUCHE_C) }, mots: [t] }));
  if (source === 'peurs') return shuffle(PEURS).slice(0, 3).map((t) => ({ card: { nom: 'Une peur', consigne: pick(PEURS_C) }, mots: [t] }));
  if (source === 'contrainte') return shuffle(CONTRAINTES).slice(0, 3).map(([m, c]) => ({ card: { nom: 'Contrainte', consigne: c }, mots: [m] }));
  const ws = motsChamp.length ? motsChamp : ['lune', 'marée', 'braise'];
  return shuffle(cartes).slice(0, 3).map((card) => { const sh = shuffle(ws); return { card, mots: card.trois ? sh.slice(0, 3) : [sh[0]], num: null }; });
}

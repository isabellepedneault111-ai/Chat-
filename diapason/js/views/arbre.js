// L'arbre de l'architecte : tout ce que FLIP contient, déplié comme des dossiers. D'où vient chaque son
// (fabriqué en direct, enregistré, ou la musique de Frog), ce que l'app calcule à l'écoute, où vivent nos données.
// Chaque son se joue d'un clic, pour l'entendre là où on lit son origine.
import { audio, drums, pad, bass, pluck, impulseOsc, out } from '../audio.js';
import { joue, accord, prechargerSons } from '../sampler.js';
import { mtof } from '../music.js';
import { espace } from '../espace.js';
import { VERSIONS } from '../nouveautes.js';
// Les abréviations qui reviennent dans le code, en clair.
const ABREV = { mtof: 'MIDI vers fréquence : le numéro d’une touche (60 = Do du milieu) devient des hertz (261,6 Hz)', ftom: 'fréquence vers MIDI : des hertz deviennent le numéro de la touche la plus proche',
  mod12: 'modulo 12 : ramène une note dans l’octave (Do, Do♯… Si), peu importe sa hauteur', esc: 'échapper : protège un texte avant de l’afficher, pour qu’un caractère spécial (<, &, ") ne casse pas la page',
  uid: 'identifiant unique : un code aléatoire qui nomme une entrée sans risque de doublon', css: 'lit une couleur ou une mesure définie dans la feuille de style', q: 'raccourci pour trouver un élément de la page (querySelector)',
  $: 'raccourci pour trouver un élément de la page', $$: 'raccourci pour trouver tous les éléments d’une sorte', clamp: 'borne une valeur entre un minimum et un maximum', pick: 'tire un élément au hasard dans une liste',
  FR: 'les noms des 12 notes en français (Do, Do♯, Ré…)', EN: 'les noms des 12 notes en anglais (C, C#, D…)', isBlack: 'dit si une touche du clavier est noire', toast: 'affiche un petit message qui disparaît tout seul',
  store: 'la mémoire de l’appareil (localStorage) : ce qui reste entre deux visites', api: 'parle au serveur de l’espace partagé (requête réseau)', render: 'redessine la page à partir des données', mount: 'installe la page quand on l’ouvre' };
const MOTS_COURTS = { maj: 'mise à jour de', nb: 'nombre de', cle: 'clé', ctx: 'contexte', el: 'élément', btn: 'bouton', ev: 'événement', init: 'initialiser', aff: 'afficher', calc: 'calculer', prev: 'précédent', suiv: 'suivant' };
const mots = (n) => n.replace(/^\$+/, '').replace(/([a-zà-ÿ])([A-Z])/g, '$1 $2').replace(/_/g, ' ').toLowerCase().split(' ').map((w) => MOTS_COURTS[w] || w).join(' ');

// Ce qu'est chaque sorte d'élément, pour un développeur, en une phrase.
const SORTE_EL = {
  'export function': ['Fonction partagée', 'Un bloc de code nommé qui fait une chose précise ; « export » : les autres fichiers de l’app peuvent l’appeler (import).'],
  'async export function': ['Fonction partagée, asynchrone', 'Partagée avec les autres fichiers ; asynchrone : elle attend quelque chose (le réseau, le micro, un fichier) sans figer l’app (async / await).'],
  function: ['Fonction interne', 'Un bloc de code nommé, utilisé seulement à l’intérieur de ce fichier.'],
  'async function': ['Fonction interne, asynchrone', 'Utilisée dans ce fichier ; elle attend une réponse (réseau, micro, fichier) sans figer l’app.'],
  'export const': ['Valeur partagée', 'Une donnée fixe (une liste, un tableau de réglages, un texte) que d’autres fichiers importent.'],
  'export const =>': ['Petite fonction partagée', 'Une fonction courte écrite en flèche (=>), partagée avec les autres fichiers.'],
  section: ['Section', 'Une grande partie du fichier, annoncée par un commentaire : elle regroupe ce qui va ensemble.'],
  def: ['Fonction Python', 'Une fonction de l’outil de construction (elle tourne avant la mise en ligne, pas dans l’app).'],
  class: ['Classe Python', 'Un moule d’objets, dans l’outil de construction.'],
};
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const F = 'fabriqué en direct'; const E = 'enregistré'; const C = 'calculé'; const D = 'données';
// [nom, détail, étiquette, son?, enfants?]
const ARBRE = ['Diapason Labo', 'Un environnement hybride : des sons fabriqués en direct par le navigateur, de vrais instruments enregistrés, la musique de Frog, et une oreille qui calcule.', null, null, [
  ['Les sons', 'D’où vient tout ce qu’on entend.', null, null, [
    ['La batterie', 'Aucun échantillon : chaque coup est fabriqué au moment où il joue (Web Audio). Dans l’arbre : js/audio.js.', F, null, [
      ['Grosse caisse', 'Une onde sinus qui glisse de 160 à 42 Hz en 0,14 s, et s’éteint en 0,4 s. C’est ce glissement vers le grave qui fait le « boum ».', F, 'kick'],
      ['Caisse claire', 'Du bruit blanc filtré au-dessus de 1 400 Hz (le « tchak »), plus une onde triangle qui tombe de 220 à 150 Hz (le corps).', F, 'snare'],
      ['Charley', 'Du bruit filtré au-dessus de 7 500 Hz, 50 millisecondes. Rien d’autre.', F, 'hat'],
      ['Claps', 'Trois éclats de bruit à 12 ms d’écart : comme plusieurs mains qui ne frappent pas pile en même temps.', F, 'clap'],
    ]],
    ['Basse et nappes', 'Des oscillateurs aussi : la basse suit la note de l’accord, la nappe tient l’accord entier en douceur.', F, null, [
      ['La basse', 'Une onde grave, coupée en filtre, sur la fondamentale de l’accord.', F, 'bass'],
      ['La nappe', 'Les notes de l’accord, tenues, très douces, qui enveloppent.', F, 'pad'],
      ['La note pincée', 'Le petit son de secours, quand le vrai piano n’est pas encore chargé.', F, 'pluck'],
    ]],
    ['Les vrais instruments', 'Enregistrés note par note, puis accordés à la bonne hauteur (data/sons/).', E, null, [
      ['Piano à queue', 'Salamander Grand Piano, par Alexander Holm (licence CC BY 3.0). 17 notes enregistrées, de Do2 à Do6. Dans l’arbre : data/sons/piano-….mp3.', E, 'piano'],
      ['Piano électrique', 'Rhodes du jeu FluidR3, par Frank Wen (licence MIT). 9 notes. Dans l’arbre : data/sons/rhodes-….mp3.', E, 'rhodes'],
      ['Voix « ooh »', 'Chœur du jeu FluidR3 (licence MIT) : c’est le guide vocal de Placer mes paroles. Dans l’arbre : data/sons/voix-….mp3.', E, 'voix'],
      ['L’orchestre de La cathédrale', 'Cordes, pizzicati, harpe, cor, cuivres, flûte, clarinette, hautbois, chœur, timbales et célesta, du jeu FluidR3 de Frank Wen (licence MIT). 92 notes enregistrées, accordées à la volée.', E, 'cordes'],
    ]],
    ['La musique de Frog', 'Tes propres pièces, utilisées dans la visite et pour écrire dessus.', E, null, [
      ['Projet 1, après la pause', 'Ré mineur, 120 BPM. La boucle va de 0:34,5 à 1:55,5.', E, 'projet1'],
      ['Joy Walk', 'Sol majeur, 116,6 BPM. La musique du tour guidé.', E, 'joywalk'],
    ]],
    ['Le labo', 'Un oscillateur à impulsions : des clics très réguliers qui, accélérés au-delà de ~20 par seconde, deviennent une note.', F, 'labo'],
  ]],
  ['L’oreille', 'Tout se calcule dans le navigateur : la musique ne quitte jamais l’appareil.', C, null, [
    ['Le tempo', 'L’autocorrélation des attaques : on cherche l’écart qui revient le plus souvent entre deux coups.', C],
    ['La tonalité', 'Les douze notes entendues (le chroma), comparées aux profils de Krumhansl et Kessler (1982).', C],
    ['Les accords', 'Temps par temps, le chroma comparé à des gabarits : majeur, mineur, 7, maj7, m7, sus2, sus4, dim.', C],
    ['La hauteur de la voix', 'L’autocorrélation normalisée, comme un accordeur : 45 mesures par seconde, l’écart en cents.', C],
    ['Les parties, le moment fort, la boucle', 'L’énergie mesurée 20 fois par seconde ; la boucle, c’est deux passages qui se ressemblent assez pour s’enchaîner.', C],
    ['Ce qui brille, ce qui est à retravailler', 'L’énergie qui retombe au milieu d’une partie, une partie sans relief, le contraste entre les parties.', C],
  ]],
  ['Les mots', 'Pour écrire des paroles qui se chantent.', D, null, [
    ['Syllabes et rimes', 'Lexique 3.83, par Boris New et Christophe Pallier (licence CC BY-SA 4.0) : 140 000 mots, avec leur prononciation et leurs syllabes.', D],
    ['Synonymes', 'myThes 2.3 de Frédéric Labbé (Dicollecte, LGPL), le dictionnaire de LibreOffice, gardé dans l’app ; le Wiktionnaire (CC BY-SA) en renfort.', D],
    ['L’accent tonique', 'La règle du français : la dernière syllabe prononcée du groupe, jamais un e muet.', C],
  ]],
  ['Les pièces de l’app', 'Ce qu’on trouve dans chaque onglet.', null, null, [
    ['Plan', 'Par où commencer, le mois en cours, le plan qui s’ajuste, Créer → Façonner → Produire.'],
    ['Mur', 'Toutes nos idées, de « idée brute » à « dans le set ».'],
    ['Session', 'Une séance guidée, étape par étape, avec la musique, qui finit par une prise.'],
    ['Relais', 'Un son envoyé, une couche par-dessus, chacun son temps.'],
    ['Écrire', 'Le journal, le mumble, l’atelier, le grimoire, Placer mes paroles, Nos idées pour le labo.'],
    ['Jouer', 'Le beat, Mes propres accords, Nos chansons, les prises, la pochette, la scène, Mon instrument (MIDI).'],
    ['Voix', 'Ton clavier coache ma voix, la tessiture, le gym vocal, le miroir.'],
    ['L’oreille', 'Analyser une pièce, trouver ses accords, mesurer une voix.'],
    ['Nos deux âmes', 'Ce que nos deux étapes 1 donnent ensemble, et nos pistes hors sentier.'],
  ]],
  ['Où vivent nos données', 'Rien chez des tiers.', D, null, [
    ['Le site', 'Hébergé par Netlify (diapason-labo.netlify.app).', D],
    ['Notre espace partagé', 'Netlify Blobs : nos idées, nos sons gardés, nos profils, nos chansons. Le mot secret mène à l’espace ; il n’est gardé que sous forme d’empreinte.', D],
    ['Sur l’appareil', 'Les réglages (tempo, tonalité, onglet ouvert) et les prises pas encore gardées.', D],
    ['Le micro', 'Écouté sur place pour la justesse et les accords ; rien n’est envoyé, sauf une prise qu’on choisit de garder.', D],
  ]],
  ['Les fondations', 'La technique, sans rien d’installé.', null, null, [
    ['Web Audio', 'Le moteur de son du navigateur : oscillateurs, filtres, échantillons, tout en temps réel.'],
    ['Web MIDI', 'Pour lire le clavier de Frog branché, et lui envoyer l’horloge du tempo.'],
    ['Polices', 'Literata (les titres) et Atkinson Hyperlegible (le texte, pensée pour se lire facilement).'],
  ]],
]];

const ETQ = { [F]: 'f', [E]: 'e', [C]: 'c', [D]: 'd' };
// Un nœud de l’arbre en liste : son nom, son étiquette et, s’il a un son, un bouton pour l’écouter.
function noeud([nom, detail, etq, son, enfants], prof) {
  const tete = `<span class="ar-nom">${nom}</span>${etq ? `<em class="ar-etq ar-${ETQ[etq]}">${etq}</em>` : ''}${son ? `<button class="icon-btn tiny ar-son" data-son="${son}" aria-label="Écouter : ${nom}">▶</button>` : ''}<small class="ar-det">${detail}</small>`;
  if (!enfants) return `<li class="ar-feuille">${tete}</li>`;
  return `<li><details ${prof < 3 && !/^Les pièces|^Où vivent|^Les fondations|^Les mots/.test(nom) ? 'open' : ''}><summary>${tete}</summary><ul>${enfants.map((x) => noeud(x, prof + 1)).join('')}</ul></details></li>`;
}

// Joue le son d’un élément (batterie, basse…) pour l’entendre.
function ecouter(son) {
  const c = audio(); c.resume(); const t = c.currentTime + 0.05;
  if (drums[son]) { [0, 0.5, 1].forEach((x) => drums[son](t + x)); return; }
  if (son === 'bass') { [36, 36, 43, 41].forEach((m, i) => bass(mtof(m), t + i * 0.4, 0.35)); return; }
  if (son === 'pad') { pad([48, 52, 55, 59].map(mtof), t, 2.5, 0.06); return; }
  if (son === 'pluck') { [60, 64, 67].forEach((m, i) => pluck(mtof(m), { when: t + i * 0.25 })); return; }
  if (son === 'labo') { const o = impulseOsc(2); const g = c.createGain(); g.gain.value = 0.08; o.frequency.setValueAtTime(2, t); o.frequency.exponentialRampToValueAtTime(220, t + 3); o.connect(g).connect(out()); o.start(t); o.stop(t + 3.6); return; }
  if (son === 'cordes') { prechargerSons(['cordes', 'cor', 'harpe']).then(() => { const u = audio().currentTime + 0.05; accord('cordes', [48, 55, 60, 64, 67], { when: u, dur: 2.2, vel: 0.6, egrene: 0 }); joue('cor', 52, { when: u + 0.4, dur: 1.8, vel: 0.6 }); [60, 64, 67, 72].forEach((m, i) => joue('harpe', m, { when: u + 0.2 + i * 0.12, dur: 1.5, vel: 0.6 })); }); return; }
  if (['piano', 'rhodes', 'voix'].includes(son)) { prechargerSons([son]).then(() => { const u = audio().currentTime + 0.05; if (son === 'voix') [60, 64, 67].forEach((m, i) => joue('voix', m, { when: u + i * 0.5, dur: 0.45 })); else accord(son, [48, 52, 55, 60], { when: u, dur: 1.6 }); }); return; }
  if (son === 'projet1' || son === 'joywalk') { const a = new Audio(son === 'projet1' ? 'data/sons/frog-visite.mp3' : 'data/sons/frog-joywalk.mp3'); a.currentTime = son === 'projet1' ? 40 : 18; a.play(); setTimeout(() => a.pause(), 8000); }
}

// Le grand dessin : l'arbre radial de la vraie structure (data/arbre.json, généré à chaque construction).
const COUL = { dossier: '#e8c27a', js: '#ff6fae', mjs: '#ff6fae', css: '#6f9fe0', html: '#9fe0c3', mp3: '#b58cf0', json: '#93b08e', tsv: '#93b08e', jpg: '#f0a36f', mp4: '#f0a36f', svg: '#f0a36f', py: '#e9e4d8', sh: '#e9e4d8', toml: '#e9e4d8', md: '#e9e4d8', txt: '#e9e4d8' };
// D'où vient un fichier, en une phrase : affiché en passant dessus dans l'arbre.
const ORIGINE = (nom) => (/^piano-/.test(nom) ? 'Piano à queue Salamander, enregistré par Alexander Holm (CC BY 3.0)'
  : /^rhodes-/.test(nom) ? 'Piano électrique Rhodes du jeu FluidR3, par Frank Wen (MIT)'
    : /^voix-/.test(nom) ? 'Voix « ooh » du jeu FluidR3 (MIT) : le guide vocal'
    : /^(cordes|pizz|harpe|cor|cuivres|flute|clarinette|hautbois|choeur|timbales|celesta)-/.test(nom) ? 'L’orchestre de La cathédrale : jeu FluidR3, par Frank Wen (MIT)'
      : /^frog-/.test(nom) ? 'La musique de Frog'
        : nom === 'audio.js' ? 'Ici naissent la batterie, la basse et les nappes, fabriquées en direct'
          : nom === 'sampler.js' ? 'Ici jouent les vrais instruments enregistrés (piano, Rhodes, voix)'
            : nom === 'lexique-fr.tsv' ? 'Lexique 3.83 (New et Pallier, CC BY-SA 4.0) : les syllabes et les rimes'
              : nom === 'synonymes-fr.tsv' ? 'myThes 2.3 (Frédéric Labbé, Dicollecte, LGPL) : 36 000 mots et leurs synonymes, par sens'
              : nom === 'oreille.js' ? 'Ici, l’app écoute : tempo, tonalité, accords, justesse' : '');
const couleur = (n) => (n.c ? COUL.dossier : COUL[(n.n.split('.').pop() || '').toLowerCase()] || '#cfc6b4');
// Les fiches : chaque point cliquable garde ici ce qu'on sait de lui.
let FICHES = []; let ETAPES = [];
let RECENT = ''; // la date de la dernière retouche : ces fichiers brillent
// Dessine l’arbre radial : un point par dossier et par fichier, en branches depuis le centre.
function dessinArbre(data) {
  FICHES = [];
  const R = 330; let feuilles = 0; let prof = 0; let dossiers = 0;
  // Démêler : les fichiers de base vont dans leur propre branche, et un dossier qui ne contient qu'un dossier
  // se lit d'un trait (« netlify/functions ») au lieu de faire un nœud serré près du centre.
  const fusion = (n) => { if (!n.c) return n; n.c = n.c.map(fusion); if (n.c.length === 1 && n.c[0].c && n.d !== 0) return { n: `${n.n}/${n.c[0].n}`, c: n.c[0].c }; return n; };
  data = { ...data, c: data.c.map(fusion) };
  const base = data.c.filter((x) => !x.c);
  if (base.length) data.c = [...data.c.filter((x) => x.c), { n: 'la base', c: base }];
  const parcours = (n, d, chemin) => { n.d = d; n.chemin = chemin; prof = Math.max(prof, d); if (n.c) { dossiers++; n.c.forEach((x) => parcours(x, d + 1, `${chemin}/${x.n}`)); } else n.i = feuilles++; };
  // Un peu d'air entre les grandes branches : trois places vides entre chaque dossier du premier niveau.
  data.c.forEach((x, k) => { if (k) feuilles += 3; parcours(x, 1, `Diapason Labo/${x.n}`); });
  data.d = 0; dossiers++; feuilles += 3;
  const angle = (n) => (n.c ? (angle(n.c[0]) + angle(n.c[n.c.length - 1])) / 2 : (n.i / feuilles) * Math.PI * 2 - Math.PI / 2);
  const rayon = (n) => (n.c ? (n.d / prof) * R * 0.92 : R);
  const xy = (a, r) => [500 + r * Math.cos(a), 500 + r * Math.sin(a)];
  let liens = ''; let points = ''; let mots = '';
  const dessine = (n) => {
    const a = angle(n); const r = rayon(n); const [x, y] = xy(a, r);
    if (n.c) {
      n.c.forEach((ch, k) => {
        const a2 = angle(ch); const r2 = rayon(ch); const m = (r + r2) / 2;
        const [c1x, c1y] = xy(a, m); const [c2x, c2y] = xy(a2, m); const [x2, y2] = xy(a2, r2);
        liens += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${couleur(ch)}" style="--d:${(n.d * 0.35 + k * 0.01).toFixed(2)}s"/>`;
        dessine(ch);
      });
      if (n.d > 0) { points += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(3, 7 - n.d)}" fill="${COUL.dossier}" class="ar-pt" data-f="${FICHES.push(n) - 1}" tabindex="0"><title>${n.chemin} · ${n.c.length} éléments</title></circle>`; const [lx, ly] = xy(a, r + 16); mots += `<text class="ar-dos" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${n.n}</text>`; }
    } else {
      const deg = (a * 180) / Math.PI; const gauche = deg > 90 && deg < 270;
      points += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${n.mod && n.mod === RECENT ? 3.4 : 2.2}" fill="${couleur(n)}" class="ar-pt ${n.mod && n.mod === RECENT ? 'ar-recent' : ''}" data-f="${FICHES.push(n) - 1}" stroke="transparent" stroke-width="6"><title>${n.chemin}${n.l ? ` · ${n.l} lignes` : ''}${ORIGINE(n.n) ? `\n${ORIGINE(n.n)}` : ''}</title></circle>`;
      const [tx, ty] = xy(a, R + 6);
      mots += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" transform="rotate(${gauche ? deg - 180 : deg} ${tx.toFixed(1)} ${ty.toFixed(1)})" text-anchor="${gauche ? 'end' : 'start'}" dominant-baseline="middle" fill="${couleur(n)}">${n.n}</text>`;
    }
  };
  dessine(data);
  return { svg: `<svg class="ar-radial" viewBox="-40 -40 1080 1080" role="img" aria-label="L’arbre des dossiers et fichiers de Diapason Labo"><g class="ar-liens">${liens}</g>${points}${mots}<text class="ar-centre" x="500" y="494" text-anchor="middle">Diapason</text><text class="ar-centre" x="500" y="528" text-anchor="middle">Labo</text></svg>`, dossiers };
}

// La généalogie : chaque étape du projet (un point), chaque branche de travail (une ligne), les fusions.
const ERE_COUL = { 'La refonte': '#6f9fe0', 'L’app à deux': '#93b08e', 'La marque FLIP': '#e8c27a', 'La visite de Frog': '#ff6fae', 'Les versions': '#b58cf0', 'Diapason Labo': '#5fc4b8' };
// Ce que chaque ère a apporté, en une ligne (les ères se lisent dans le titre des étapes).
const ERE_SENS = { 'La refonte': 'l’app musicale d’avant, refaite de zéro', 'L’app à deux': 'le plan de six mois, la séance partagée, le Mur', 'La marque FLIP': 'le mot secret du duo, le relais, les bilans, la nouvelle identité', 'La visite de Frog': 'sa visite d’accueil, sur ses propres pièces', 'Les versions': 'les mises à jour numérotées, chacune annoncée', 'Diapason Labo': 'le nom actuel : le labo, la cathédrale, le studio' };
// Dessine la généalogie : la lignée des étapes date par date, et les autres chantiers en branches.
function dessinGenealogie(g) {
  ETAPES = [];
  const tous = g.lanes.flatMap((l, li) => l.c.map((c, k) => ({ ...c, li, k })));
  tous.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.li - b.li || a.k - b.k));
  let x = 40; let jour = ''; const pos = {}; const jours = [];
  tous.forEach((c) => { if (c.d !== jour) { if (jour) x += 26; jour = c.d; jours.push([c.d, x]); } pos[c.h] = x; x += 7; });
  const W = x + 40; const Y = (li) => (li === 0 ? 90 : 90 + li * 34); const H = Y(g.lanes.length - 1) + 50;
  const lignee = g.lanes[0];
  let svg = '';
  // Les bandes des époques, au-dessus de la lignée.
  let eDeb = null; let eNom = null;
  const fermer = (fin) => { if (eNom) svg += `<rect x="${eDeb - 4}" y="34" width="${fin - eDeb + 8}" height="14" rx="7" fill="${ERE_COUL[eNom] || '#888'}" opacity=".85"><title>${eNom}</title></rect>${fin - eDeb + 8 >= eNom.length * 5.4 ? `<text x="${(eDeb + fin) / 2}" y="44.5" text-anchor="middle" class="gn-ere">${eNom}</text>` : ''}`; };
  lignee.c.forEach((c) => { if (c.e !== eNom) { fermer(pos[lignee.c[lignee.c.indexOf(c) - 1]?.h] ?? pos[c.h]); eNom = c.e; eDeb = pos[c.h]; } });
  fermer(pos[lignee.c[lignee.c.length - 1].h]);
  // Les branches : elles partent de la lignée et y reviennent quand elles ont été fusionnées.
  g.lanes.forEach((l, li) => {
    if (!li) return;
    const y = Y(li); const premier = pos[l.c[0].h]; const dernier = pos[l.c[l.c.length - 1].h];
    const depart = l.base && pos[Object.keys(pos).find((h) => l.base.startsWith(h))] !== undefined ? pos[Object.keys(pos).find((h) => l.base.startsWith(h))] : pos[lignee.c[1]?.h] || 40;
    svg += `<path d="M${depart} ${Y(0)} C${depart} ${y}, ${premier - 20} ${y}, ${premier} ${y}" class="gn-br"/><path d="M${premier} ${y} H${dernier}" class="gn-br"/>`;
    // Chaque groupe d'étapes revient dans la lignée au moment de sa fusion.
    if (l.c[0].vers) { const fins = {}; l.c.forEach((c) => { fins[c.vers] = Math.max(fins[c.vers] || 0, pos[c.h]); }); Object.entries(fins).forEach(([vh, xf]) => { const v = pos[vh]; svg += `<path d="M${xf} ${y} C${xf + 12} ${y}, ${v} ${y + 4}, ${v} ${Y(0)}" class="gn-br gn-fusion"/>`; }); }
    l.c.forEach((c) => { svg += `<circle cx="${pos[c.h]}" cy="${y}" r="2.6" class="gn-pt-autre ar-pt" data-g="${ETAPES.push({ ...c, lane: l }) - 1}" stroke="transparent" stroke-width="6"><title>${c.d} · ${l.nom}</title></circle>`; });
    svg += `<text x="${premier}" y="${y - 7}" class="gn-lane">${l.nom} · ${l.c.length} étapes</text>`;
  });
  svg += `<path d="M${pos[lignee.c[0].h]} ${Y(0)} H${pos[lignee.c[lignee.c.length - 1].h]}" class="gn-tronc"/>`;
  lignee.c.forEach((c, k) => { svg += `<circle cx="${pos[c.h]}" cy="${Y(0)}" r="${c.f ? 4.5 : 3.4}" fill="${ERE_COUL[c.e] || '#cfc6b4'}" class="ar-pt ${c.f ? 'gn-fus' : ''}" data-g="${ETAPES.push({ ...c, lane: lignee, rang: k + 1, sur: lignee.c.length }) - 1}" stroke="transparent" stroke-width="6"><title>${c.d} · ${c.s.replace(/[<&]/g, '')}</title></circle>`; });
  jours.forEach(([d, xx], i) => { if (i % 1 === 0) svg += `<text x="${xx}" y="${H - 14}" class="gn-jour" transform="rotate(-35 ${xx} ${H - 14})">${new Date(`${d}T12:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: d < '2026' ? 'numeric' : undefined })}</text>`; });
  svg += `<text x="${pos[lignee.c[0].h]}" y="${Y(0) + 22}" class="gn-note">« Create Flip » : le premier geste</text>`;
  return `<svg class="gn-svg" viewBox="0 0 ${W} ${H + 20}" width="${W}" height="${H + 20}" role="img" aria-label="La généalogie du projet, branche par branche">${svg}</svg>`;
}

const SORTE = { js: 'Code (JavaScript) : ce que l’app fait', mjs: 'Code du serveur : là où nos données sont gardées', css: 'Styles : l’allure de l’app', html: 'La page d’entrée', mp3: 'Un son', json: 'Des données', tsv: 'Des données de langue', jpg: 'Une image', mp4: 'Une vidéo', svg: 'Une image dessinée', py: 'Un outil de construction', sh: 'Un outil de construction', toml: 'Les réglages de mise en ligne', md: 'Une note', txt: 'Une note' };
const jour = (d) => (d ? new Date(`${d}T12:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const compteFeuilles = (n) => (n.c ? n.c.reduce((a, x) => a + compteFeuilles(x), 0) : 1);
// La fiche d’un point de l’arbre : un dossier (ce qu’il contient) ou un fichier (son rôle, ses retouches, ses éléments).
function ficheFichier(n) {
  const chemin = n.chemin.replace(/^Diapason Labo\//, '').replace(/^la base\//, '');
  if (n.c) {
    const lignes = (function t(x) { return x.c ? x.c.reduce((a, y) => a + t(y), 0) : x.l || 0; })(n);
    return `<p class="ar-f-sorte" style="--c:${COUL.dossier}">Dossier</p><h3>${esc(n.n)}</h3><p class="ar-f-ch">${esc(chemin)}</p>
      <p>${n.c.length} éléments directs, ${compteFeuilles(n)} fichiers en tout${lignes ? `, ${lignes.toLocaleString('fr-CA')} lignes écrites` : ''}.</p>
      <p class="ar-f-liste">${n.c.slice(0, 18).map((x) => `<span>${esc(x.n)}${x.c ? '/' : ''}</span>`).join('')}${n.c.length > 18 ? `<span>… et ${n.c.length - 18} autres</span>` : ''}</p>`;
  }
  const ext = (n.n.split('.').pop() || '').toLowerCase(); const o = ORIGINE(n.n);
  return `<p class="ar-f-sorte" style="--c:${couleur(n)}">${SORTE[ext] || 'Fichier'}</p><h3>${esc(n.n)}</h3><p class="ar-f-ch">${esc(chemin)}</p>
    ${n.r ? `<p class="ar-f-role">« ${esc(n.r)} »</p><p class="muted small">La première phrase écrite en tête du fichier : ce qu’il fait, dans ses propres mots.</p>` : ''}
    ${o ? `<p><b>D’où il vient :</b> ${esc(o)}</p>` : ''}
    <p class="ar-f-meta">${n.l ? `<span><b>${n.l.toLocaleString('fr-CA')}</b> lignes</span>` : ''}${n.nee ? `<span>né le <b>${jour(n.nee)}</b></span>` : ''}${n.mod && n.mod !== n.nee ? `<span>retouché le <b>${jour(n.mod)}</b></span>` : ''}</p>
    ${n.h?.length ? `<div class="ar-f-h"><b>Ses dernières retouches</b><ul>${n.h.map(([d, t]) => `<li><span>${jour(d).replace(/ \d{4}$/, '')}</span> ${esc(t)}</li>`).join('')}</ul></div>` : ''}
    ${n.el?.length ? `<div class="ar-f-el"><b>Ce qu’il contient</b>${n.el.some((x) => x[1]) ? ' <span class="ar-nv">nouveau</span> = ajouté à sa dernière retouche' : ''}<p>${n.el.map(([x, nv, so, com], k) => `<button type="button" class="${x.startsWith('§') ? 'ar-sec' : 'ar-fn'} ${nv ? 'nv' : ''}" data-el="${k}" data-so="${esc(so || '')}" data-com="${esc(com || '')}" title="${esc(com || SORTE_EL[so]?.[0] || '')}">${esc(x.replace(/^§ /, ''))}</button>`).join('')}</p><div class="ar-el-quoi" hidden></div><p class="muted small">Touche un nom : ce que c’est pour un développeur, et ce que ça fait concrètement. Les sections (en gras) sont les grandes parties du fichier ; les autres noms, ses fonctions et ses valeurs.</p></div>` : ''}
    ${ext === 'mp3' && chemin.startsWith('data/sons/') ? `<button class="btn small" data-mp3="${esc(chemin)}">▶ Écouter ce son</button>` : ''}`;
}
// La fiche d’une étape de la généalogie : ce qui a changé, combien de fichiers et de lignes.
function ficheEtape(c) {
  if (!c.lane.musique) {
    return `<p class="ar-f-sorte" style="--c:#6d655a">${esc(c.lane.nom)}</p><h3>Une étape le ${jour(c.d)}</h3>
      <p>Un autre chantier, mené avec Claude dans le même dépôt. On montre sa forme (quand, combien d’étapes), pas son contenu : ce n’est pas de la musique.</p><p class="ar-f-meta"><span>${c.lane.c.length} étapes sur cette branche</span></p>`;
  }
  const [fic, plus, moins] = c.t || [];
  return `<p class="ar-f-sorte" style="--c:${ERE_COUL[c.e] || '#cfc6b4'}">${esc(c.e || 'Avant Diapason')}${ERE_SENS[c.e] ? ` : ${ERE_SENS[c.e]}` : ''}${c.rang ? ` · étape ${c.rang} sur ${c.sur}` : ''}</p>
    <h3>${esc(c.s)}</h3><p class="ar-f-ch">${jour(c.d)} · empreinte ${esc(c.h)}</p>
    ${c.f ? '<p>Ici, une branche de travail est revenue dans la lignée : son contenu a été fusionné.</p>' : ''}
    ${fic != null ? `<p class="ar-f-meta"><span><b>${fic}</b> fichier${fic > 1 ? 's' : ''} touché${fic > 1 ? 's' : ''}</span><span class="ar-plus">+${plus.toLocaleString('fr-CA')} lignes</span><span class="ar-moins">−${moins.toLocaleString('fr-CA')}</span></p>` : ''}
    <p class="ar-f-nav"><button class="btn small" data-gpas="-1" ${c.rang > 1 ? '' : 'disabled'}>← Étape d’avant</button><button class="btn small" data-gpas="1" ${c.rang < c.sur ? '' : 'disabled'}>Étape d’après →</button></p>`;
}

export default {
  id: 'arbre',
  mount(el) {
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">L’arbre de l’architecte</p>
        <h1>Un environnement hybride, à l’œuvre.</h1>
        <p class="muted">Tout Diapason Labo, dossier par dossier, fichier par fichier : la vraie structure de l’app, telle qu’elle tourne en ce moment. Ici, on ne touche à rien : on admire. Touche un point : sa fiche s’ouvre à côté (ce qu’il fait, d’où il vient, quand il est né).</p>
      </div></div>
      <section class="ar-scene no-aide"><div class="ar-stats"></div><div class="ar-cadre"><div class="ar-dessin"><p class="muted">L’arbre pousse…</p></div><aside class="ar-fiche" aria-live="polite"><p class="muted">Touche un point de l’arbre : un dossier (or) ou un fichier.</p></aside></div>
        <p class="ar-cles"><i style="--c:#e8c27a"></i>dossiers <i style="--c:#ff6fae"></i>code (JavaScript) <i style="--c:#6f9fe0"></i>styles <i style="--c:#b58cf0"></i>sons <i style="--c:#93b08e"></i>données <i style="--c:#f0a36f"></i>images</p></section>
      <section class="ar-genea no-aide">
        <h2>La généalogie</h2>
        <p class="muted small">Chaque point est une étape du projet, chaque ligne une branche de travail avec Claude. Tout commence le 13 août 2025 par « Create Flip ». Les branches qui reviennent dans la lignée ont été fusionnées ; les autres sont d’autres chantiers, dessinés sans leur contenu. Touche un point pour ouvrir l’étape : ce qu’elle a fait, quand, combien de lignes.</p>
        <div class="gn-host"><p class="muted">La généalogie se dessine…</p></div>
        <aside class="ar-fiche gn-fiche" aria-live="polite"><p class="muted">Touche un point de la lignée pour lire l’étape.</p></aside>
        <ul class="gn-eres">${Object.entries(ERE_COUL).map(([k, c]) => `<li><i style="--c:${c}"></i><b>${k}</b> ${ERE_SENS[k]}</li>`).join('')}<li><i style="--c:#6d655a"></i><b>Autres chantiers</b> d’autres projets menés dans le même dépôt</li></ul>
      </section>
      <section class="ar-mot no-aide">
        <p class="eyebrow">La conception</p>
        <h2>Comment Diapason Labo a été conçu</h2>
        <p class="ar-def"><b>Définition.</b> Une pratique de conception où l’on ne délègue pas des tâches à l’IA : on lui <b>distribue des fonctions cognitives</b>. À l’agent, le calcul combinatoire (générer, structurer, coder, tester, déployer) ; à la conceptrice, la <b>gouvernance interprétative</b> : le symbole qui organise le système, le ton, la justesse relationnelle, le sens pédagogique, et la décision d’arrêter. Le travail part d’un <b>noyau symbolique</b>, avance par <b>variation contrôlée</b> (un axe à la fois) et se pilote <b>en vol</b>, pendant l’exécution. C’est une forme de cognition distribuée (Hutchins, 1995) et d’esprit étendu (Clark et Chalmers, 1998) appliquée à la conception d’un objet réel, utilisé par de vraies personnes. Elle se distingue du <i>vibe coding</i> (Karpathy, 2025), où l’on accepte ce que la machine produit, et de l’usage de l’IA comme guichet (une requête, une réponse).</p>
        <ul class="ar-traits">
          <li><b>Conception dirigée par le sens.</b> L’architecture découle d’un modèle conceptuel et de ses métaphores structurantes, pas d’une liste de fonctionnalités. Une fonctionnalité sans place dans ce modèle est retirée.</li>
          <li><b>Pilotage en boucle fermée.</b> Les exigences arrivent pendant l’exécution et réorientent l’agent sans interrompre le chantier : un cycle court de rétroaction, proche de l’intégration continue.</li>
          <li><b>Variation contrôlée.</b> Une seule dimension modifiée à la fois, ce qui rend chaque changement attribuable et réversible. L’IA explore un espace de solutions ; la conceptrice le contraint.</li>
          <li><b>Contrôle qualité par le refus du générique.</b> Tout artefact perçu comme gabarit, superflu ou non vérifiable est retiré ou remplacé par une formulation vérifiable.</li>
          <li><b>Utilisateurs réels dans la boucle.</b> Chaque version est mise à l’épreuve de ses usagers, puis révisée : la logique de la recherche orientée par la conception (<i>design-based research</i> ; Brown, 1992 ; Collins, 1992).</li>
          <li><b>Finalité relationnelle.</b> Le critère de réussite n’est pas technique : l’outil sert un lien et une création à deux.</li>
          <li><b>Ancrage dans la recherche.</b> Chaque mécanisme pédagogique cite ses appuis (Rohrer, 2004 ; Cepeda et al., 2006 ; Biasutti, 2017 ; Pattison, 2009…) ; l’exactitude prime sur l’effet.</li>
          <li><b>Triangulation réflexive.</b> Un même protocole d’analyse de pratique, appliqué à plusieurs systèmes d’IA (Claude, ChatGPT, Gemini, Copilot), chacun sur son propre historique d’utilisation, puis comparé.</li>
          <li class="ar-cadence"><b>Cadence</b><ul class="ar-cad-l"><li class="ar-cad">mesurée dans l’historique…</li><li>Traçabilité : chaque décision est versionnée (Git) ; la généalogie ci-dessus en est la trace : <b class="ar-mot-etapes">—</b> étapes, <b class="ar-mot-lignes">—</b> lignes.</li><li>Vérification : des tests de bout en bout dans un vrai navigateur (Playwright) avant chaque mise en ligne.</li></ul><figure class="ar-cad-g" hidden></figure></li>
          <li><b>Limite nommée.</b> Penser en couches reliées expose à la surcomplexité et au raffinement au-delà du seuil d’utilité. Contre-mesures : des itérations numérotées, des versions datées, un journal, et une question de contrôle à chaque étape : est-ce que ça sert Frog et Zaza, maintenant ?</li>
        </ul>
        <p class="ar-verdict">Sur la base de ces traces (la cadence mesurée, la traçabilité de chaque décision, la triangulation sur quatre systèmes d’IA), la conceptrice de Diapason Labo est en fait une <b>architecte d’environnements hybrides humain-IA</b> : elle ne conçoit pas seulement l’objet, mais l’environnement où l’humain et l’agent travaillent ensemble, et la répartition de ce que chacun y fait.</p>
        <p class="ar-mot-sign"><b>Zaza</b>, architecte d’environnements hybrides humain-IA<br><b>Frog</b>, architecte sonore<br><span>Développé avec l’aide d’Anthropic, d’Antigravity et de Google AI Studio.</span></p>
      </section>
      <details class="panel ar-versions"><summary><h2>Le journal des versions</h2></summary>
        ${VERSIONS.map((x) => `<section><h3>Version ${x.v} · ${x.titre} <small class="muted">${new Date(`${x.quand}T12:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}</small></h3>${x.items.map(([t, l]) => `<p><b>${t}</b></p><ul>${l.map((y) => `<li>${y}</li>`).join('')}</ul>`).join('')}</section>`).join('')}
      </details>
      <details class="panel ar-details" open><summary><h2>D’où vient chaque son : piano, batterie, voix…</h2></summary>
        <p class="ar-legende"><em class="ar-etq ar-f">${F}</em><em class="ar-etq ar-e">${E}</em><em class="ar-etq ar-c">${C}</em><em class="ar-etq ar-d">${D}</em></p>
        <ul class="arbre no-aide">${noeud(ARBRE, 0)}</ul>
        <p class="ec-row"><button class="btn small" data-ar="ouvrir">Tout déplier</button><button class="btn small" data-ar="fermer">Tout replier</button></p>
      </details>`;
    fetch('data/arbre.json', { cache: 'no-cache' }).then((r) => r.json()).then((data) => {
      const compte = (n) => (n.c ? 1 + n.c.reduce((a, x) => a + compte(x), 0) : 0); const dossiers = compte(data);
      // Le nombre de fichiers ne bouge que quand on en crée un ; ce qui bouge à chaque mise à jour, ce sont les fichiers
      // retouchés : on les montre (ils brillent aussi dans le dessin).
      const feuilles = []; (function t(x, ch) { if (x.c) x.c.forEach((y) => t(y, ch ? `${ch}/${y.n}` : y.n)); else feuilles.push({ ...x, chemin: ch }); })(data, '');
      RECENT = feuilles.reduce((m, x) => (x.mod && x.mod > m ? x.mod : m), '');
      const retouches = feuilles.filter((x) => x.mod === RECENT); const nes = feuilles.filter((x) => x.nee === RECENT);
      const { svg } = dessinArbre(data);
      el.querySelector('.ar-mot-lignes').textContent = data.lignes.toLocaleString('fr-CA'); cadence();
      const dessin = el.querySelector('.ar-dessin');
      dessin.innerHTML = `<button type="button" class="btn small ar-zoom" data-zoom aria-pressed="false">⤢ Agrandir l’arbre</button>${svg}`;
      // Recadre le dessin sur ce qu'il contient vraiment (les noms compris) : l'arbre prend toute la place, sans marge vide.
      requestAnimationFrame(() => { const r = dessin.querySelector('.ar-radial'); try { const b = r.getBBox(); r.setAttribute('viewBox', `${b.x - 8} ${b.y - 8} ${b.width + 16} ${b.height + 16}`); } catch { /* le dessin garde son cadre */ } });
      el.querySelector('.ar-stats').innerHTML = `<b>${data.fichiers}</b> fichiers · <b>${dossiers - 1}</b> dossiers · <b>${data.lignes.toLocaleString('fr-CA')}</b> lignes écrites
        ${RECENT ? `<span class="ar-recents">Le ${jour(RECENT)} : <b>${retouches.length}</b> fichier${retouches.length > 1 ? 's' : ''} retouché${retouches.length > 1 ? 's' : ''}${nes.length ? `, dont <b>${nes.length}</b> né${nes.length > 1 ? 's' : ''} ce jour-là` : ''} (ils brillent dans le dessin) : ${retouches.sort((a, b) => b.l - a.l).slice(0, 6).map((x) => x.n).join(', ')}${retouches.length > 6 ? '…' : ''}</span>` : ''}`;
    }).catch(() => { el.querySelector('.ar-dessin').innerHTML = '<p class="muted">L’arbre n’a pas pu se charger.</p>'; });
    let gData = null;
    fetch('data/genealogie.json', { cache: 'no-cache' }).then((r) => r.json()).then((g) => {
      const host = el.querySelector('.gn-host'); host.innerHTML = dessinGenealogie(g);
      host.scrollLeft = host.scrollWidth; // on arrive sur aujourd'hui ; on remonte le temps en glissant
      const et = el.querySelector('.ar-mot-etapes'); if (et) et.textContent = g.lanes[0].c.length.toLocaleString('fr-CA');
      // Le temps réellement passé, et un repère du génie logiciel pour situer l'échelle (pas la qualité).
      gData = g; cadence();
    }).catch(() => { el.querySelector('.gn-host').innerHTML = '<p class="muted">La généalogie n’a pas pu se charger.</p>'; });
    // La cadence : le rythme de travail mesuré dans l’historique, comparé à une équipe sans IA (durée et coût).
    function cadence() {
      const g = gData; const cd = g?.cadence; const cad = el.querySelector('.ar-cad');
      if (cd && cad && !cad.dataset.fait && /\d/.test(el.querySelector('.ar-mot-lignes').textContent)) {
        const lignes = +(el.querySelector('.ar-mot-lignes').textContent.replace(/\D/g, '')) || 0;
        const min = Math.round((cd.heuresActives * 60) / Math.max(1, cd.etapes - 1));
        const jp = (n) => Math.round(lignes / n);
        const virg = (x) => (x < 10 ? x.toFixed(1) : String(Math.round(x))).replace('.', ',');
        const an = (j) => virg(j / 220); const mois = (j) => virg(j / 5 / 21);
        // Le coût, tout compris : le salaire, plus les charges de l'employeur (+25 %) et, pour un projet sans IA, la gestion
        // de projet et la coordination (+15 %). Le développeur : salaire médian au Québec (Guichet-Emplois, CNP 21232,
        // 45,67 $/h), journées de 8 h. La conceptrice : conseillère pédagogique au dernier échelon (102 857 $ au
        // 1er avril 2025, sur 1 826,3 h par an). Le matériel et les locaux ne sont pas comptés : une borne basse.
        const TAUX = 45.67; const TAUX_CP = 102857 / 1826.3; const CHARGES = 1.25; const GESTION = 1.15;
        const argent = (d) => (d >= 1e6 ? `${(d / 1e6).toFixed(2).replace('.', ',')} M$` : d >= 1e4 ? `${Math.round(d / 1000).toLocaleString('fr-CA')} k$` : `${Math.round(d).toLocaleString('fr-CA')} $`);
        const salaire = (j) => argent(j * 8 * TAUX); const cout = (j) => argent(j * 8 * TAUX * CHARGES * GESTION);
        const salaireIA = argent(cd.heuresActives * TAUX_CP); const coutIA = argent(cd.heuresActives * TAUX_CP * CHARGES);
        cad.outerHTML = `<li class="ar-cad" data-fait="1"><b>${cd.etapes}</b> étapes validées, en ≈ <b>${String(cd.heuresActives).replace('.', ',')} h</b> d’activité mesurée sur ${cd.jours} jours (${String(cd.heuresTotales).replace('.', ',')} h écoulées)</li>
          <li>Une itération toutes les <b>${min} minutes</b> environ</li>
          <li>Repère du génie logiciel : <b>10 à 50 lignes</b> de code fini par développeur et par jour, conception et tests compris (McConnell, 2004)</li>
          <li>Sans IA, ce volume représenterait <b>${jp(50).toLocaleString('fr-CA')} à ${jp(10).toLocaleString('fr-CA')} jours-personnes</b>. <b>Au mieux</b> (50 lignes par jour, l’<b>estimation basse</b>) : <b>${an(jp(50))} ans</b> pour une personne seule, <b>${mois(jp(50))} mois</b> pour une équipe de cinq. <b>Au pire</b> (10 lignes par jour, l’<b>estimation haute</b>) : <b>${an(jp(10))} ans</b>, ou <b>${mois(jp(10))} mois</b> à cinq</li>
          <li><b>Coût sans IA</b> : <b>${salaire(jp(50))} à ${salaire(jp(10))} en salaire</b> (salaire médian d’un développeur au Québec, 45,67 $/h, Guichet-Emplois), et <b>${cout(jp(50))} à ${cout(jp(10))} avec la gestion</b> : <b>25 % de charges de l’employeur</b> et <b>15 % de gestion de projet et de coordination</b>. Seul ou à cinq, <b>la même somme</b> : cinq salaires, cinq fois moins longtemps</li>
          <li><b>Coût avec l’IA</b> : <b>${salaireIA} en salaire</b>, soit ${String(cd.heuresActives).replace('.', ',')} h au salaire réel de la conceptrice, conseillère pédagogique au <b>dernier échelon</b> (102 857 $ par an), et <b>${coutIA} avec la gestion</b> (les charges de l’employeur ; la gestion du projet, c’est elle qui la fait, dans ces heures). Plus les abonnements aux outils d’IA</li>
          <li class="ar-cad-res">Lignes et salaires sont des mesures grossières : ils situent l’échelle, pas la qualité. Le matériel et les locaux ne sont pas comptés : c’est une <b>borne basse</b>.</li>`;
        // Le graphique comparatif : la durée, en jours de travail, sur une échelle logarithmique (2 jours et 2 000 jours
        // tiennent sur la même ligne). Une barre par scénario, de l'estimation basse à la haute.
        // Le graphique comparatif, proportionnel : chaque barre part de zéro, sa longueur est la durée (en jours de travail).
        // Plein : l'estimation basse ; plus pâle : jusqu'à l'estimation haute. À cette échelle, l'IA n'est qu'un trait.
        const jt = cd.heuresActives / 8; const fig = el.querySelector('.ar-cad-g'); const max = jp(10);
        // Un tableau à trois lignes : la durée en gros, le coût à côté, et une barre par ligne à la même échelle.
        // La barre montre le meilleur cas (50 lignes par jour) : la plage complète est écrite dans le chiffre.
        const ANNEE = 220; const P = (v) => (v / jp(50)) * 100;
        const enMots = (j) => (j < 20 ? `${Math.max(1, Math.round(j))} jours` : j < ANNEE ? `${Math.round(j / 21)} mois` : `${Math.round(j / ANNEE)} ans`);
        const plage = (a, b) => { const [x, y] = [enMots(a), enMots(b)]; return x.split(' ')[1] === y.split(' ')[1] ? `${x.split(' ')[0]} à ${y}` : `${x} à ${y}`; };
        const rangs = [['Avec l’IA', 'ce qui a été fait', enMots(jt), salaireIA, coutIA, jt, 'ia'],
          ['Équipe de cinq', 'sans IA, estimé', plage(jp(50) / 5, jp(10) / 5), `${salaire(jp(50))} à\u00a0${salaire(jp(10))}`, `${cout(jp(50))} à\u00a0${cout(jp(10))}`, jp(50) / 5, 'sans'],
          ['Une personne seule', 'sans IA, estimé', plage(jp(50), jp(10)), `${salaire(jp(50))} à\u00a0${salaire(jp(10))}`, `${cout(jp(50))} à\u00a0${cout(jp(10))}`, jp(50), 'sans']];
        const fois = Math.round(jp(50) / 5 / jt);
        fig.hidden = false;
        fig.innerHTML = `<figcaption><b>Même au mieux, sans IA, c’est ${fois.toLocaleString('fr-CA')} fois plus long</b></figcaption>
          <div class="ar-t" role="table" aria-label="Combien de temps et combien d’argent pour bâtir cette app">
            <div class="ar-t-r ar-t-h" role="row"><span role="columnheader"></span><span role="columnheader">Durée</span><span role="columnheader">Salaire</span><span role="columnheader">Salaire + gestion</span></div>
            ${rangs.map(([n, sous, duree, sal, tout, v, c]) => `<div class="ar-t-r" role="row">
              <span role="rowheader"><b>${n}</b><small>${sous}</small></span>
              <span role="cell" class="ar-t-big ${c}">${duree}</span>
              <span role="cell"><b class="ar-t-prix">${sal}</b></span><span role="cell"><b class="ar-t-prix">${tout}</b></span>
              <i class="ar-t-barre" aria-hidden="true"><i class="${c}" style="width:max(3px, ${P(v)}%)"></i></i></div>`).join('')}
          </div>
          <p class="ar-t-note">La barre compare les durées dans le meilleur cas, à la même échelle. Salaire : développeur au salaire médian du Québec ; avec l’IA, la conceptrice au dernier échelon de conseillère pédagogique. Gestion : charges de l’employeur (+25 %) et, sans IA, gestion de projet et coordination (+15 %). L’IA coûte aussi ses abonnements.</p>`;
      }
    }

    let gIci = -1;
    const choisir = (pt) => { pt.closest('svg').querySelectorAll('.ar-choisi').forEach((x) => x.classList.remove('ar-choisi')); pt.classList.add('ar-choisi'); };
    const montrerEtape = (i) => {
      const c = ETAPES[i]; if (!c) return; gIci = i; el.querySelector('.gn-fiche').innerHTML = ficheEtape(c);
      const pt = el.querySelector(`.gn-svg [data-g="${i}"]`); if (pt) { choisir(pt); const host = el.querySelector('.gn-host'); const x = +pt.getAttribute('cx'); if (x < host.scrollLeft + 40 || x > host.scrollLeft + host.clientWidth - 40) host.scrollTo({ left: x - host.clientWidth / 2, behavior: 'smooth' }); }
    };
    const lePoint = (e) => {
      const be = e.target.closest('[data-el]');
      if (be) { const box = be.closest('.ar-f-el').querySelector('.ar-el-quoi'); const [nom, so, com] = [be.textContent, be.dataset.so, be.dataset.com]; const S = SORTE_EL[so];
        be.parentElement.querySelectorAll('[data-el]').forEach((x) => x.classList.toggle('on', x === be));
        box.hidden = false; box.innerHTML = `<p class="ar-el-nom"><code>${esc(nom)}</code>${S ? ` · <b>${S[0]}</b>` : ''}</p>${S ? `<p><span class="ar-el-k">Pour un développeur</span> ${S[1]}</p>` : ''}<p><span class="ar-el-k">Concrètement</span> ${com ? esc(com) : so === 'section' ? `Cette partie du fichier s’occupe de : ${esc(nom)}.` : ABREV[nom] ? esc(ABREV[nom]) : `Pas de commentaire écrit au-dessus dans le code. Son nom, en mots : « ${esc(mots(nom))} ».`}</p>`; return true; }
      const f = e.target.closest('[data-f]'); if (f) { choisir(f); el.querySelector('.ar-dessin + .ar-fiche').innerHTML = ficheFichier(FICHES[+f.dataset.f]); return true; }
      const g = e.target.closest('[data-g]'); if (g) { montrerEtape(+g.dataset.g); return true; }
      return false;
    };
    el.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && lePoint(e)) e.preventDefault(); });
    let mp3 = null;
    el.addEventListener('click', (e) => {
      // « Agrandir » : l'arbre double de taille dans son cadre, et on s'y promène (on revient au centre).
      const z = e.target.closest('[data-zoom]');
      if (z) { const d = z.closest('.ar-dessin'); const on = d.classList.toggle('zoom'); z.setAttribute('aria-pressed', on); z.textContent = on ? '⤡ Réduire l’arbre' : '⤢ Agrandir l’arbre';
        if (on) requestAnimationFrame(() => d.scrollTo({ left: (d.scrollWidth - d.clientWidth) / 2, top: (d.scrollHeight - d.clientHeight) / 2 })); return; }
      if (lePoint(e)) return;
      const m = e.target.closest('[data-mp3]'); if (m) { mp3?.pause(); mp3 = new Audio(m.dataset.mp3); mp3.play().catch(() => {}); return; }
      const gp = e.target.closest('[data-gpas]'); if (gp) { const c = ETAPES[gIci]; const k = ETAPES.findIndex((x) => x.lane === c.lane && x.rang === c.rang + +gp.dataset.gpas); if (k >= 0) montrerEtape(k); return; }
      const s = e.target.closest('[data-son]'); if (s) { e.preventDefault(); ecouter(s.dataset.son); return; }
      const a = e.target.closest('[data-ar]')?.dataset.ar;
      if (a) el.querySelectorAll('.arbre details').forEach((d, i) => { d.open = a === 'ouvrir' || i === 0; });
    });
  },
};

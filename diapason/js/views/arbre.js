// L'arbre de l'architecte : tout ce que FLIP contient, déplié comme des dossiers. D'où vient chaque son
// (fabriqué en direct, enregistré, ou la musique de Frog), ce que l'app calcule à l'écoute, où vivent nos données.
// Chaque son se joue d'un clic, pour l'entendre là où on lit son origine.
import { audio, drums, pad, bass, pluck, impulseOsc, out } from '../audio.js';
import { joue, accord, prechargerSons } from '../sampler.js';
import { mtof } from '../music.js';

const F = 'fabriqué en direct'; const E = 'enregistré'; const C = 'calculé'; const D = 'données';
// [nom, détail, étiquette, son?, enfants?]
const ARBRE = ['FLIP · diapason-labo', 'Un environnement hybride : des sons fabriqués en direct par le navigateur, de vrais instruments enregistrés, la musique de Frog, et une oreille qui calcule.', null, null, [
  ['Les sons', 'D’où vient tout ce qu’on entend.', null, null, [
    ['La batterie', 'Aucun échantillon : chaque coup est fabriqué au moment où il joue (Web Audio).', F, null, [
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
      ['Piano à queue', 'Salamander Grand Piano, par Alexander Holm (licence CC BY 3.0). 17 notes enregistrées, de Do2 à Do6.', E, 'piano'],
      ['Piano électrique', 'Rhodes du jeu FluidR3, par Frank Wen (licence MIT). 9 notes.', E, 'rhodes'],
      ['Voix « ooh »', 'Chœur du jeu FluidR3 (licence MIT) : c’est le guide vocal de Placer mes paroles.', E, 'voix'],
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
    ['Synonymes', 'Le Wiktionnaire (CC BY-SA), interrogé en direct.', D],
    ['L’accent tonique', 'La règle du français : la dernière syllabe prononcée du groupe, jamais un e muet.', C],
  ]],
  ['Les pièces de l’app', 'Ce qu’on trouve dans chaque onglet.', null, null, [
    ['Plan', 'Par où commencer, le mois en cours, le plan qui s’ajuste, Créer → Façonner → Produire.'],
    ['Mur', 'Toutes nos idées, de « idée brute » à « dans le set ».'],
    ['Session', 'Une séance guidée, étape par étape, avec la musique, qui finit par une prise.'],
    ['Relais', 'Un son envoyé, une couche par-dessus, chacun son temps.'],
    ['Écrire', 'Le journal, le mumble, l’atelier, le grimoire, Placer mes paroles, Nos idées pour FLIP.'],
    ['Studio', 'Le beat, Mes propres accords, Nos chansons, les prises, la pochette, la scène, Mon instrument (MIDI).'],
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
function noeud([nom, detail, etq, son, enfants], prof) {
  const tete = `<span class="ar-nom">${nom}</span>${etq ? `<em class="ar-etq ar-${ETQ[etq]}">${etq}</em>` : ''}${son ? `<button class="icon-btn tiny ar-son" data-son="${son}" aria-label="Écouter : ${nom}">▶</button>` : ''}<small class="ar-det">${detail}</small>`;
  if (!enfants) return `<li class="ar-feuille">${tete}</li>`;
  return `<li><details ${prof < 3 && !/^Les pièces|^Où vivent|^Les fondations|^Les mots/.test(nom) ? 'open' : ''}><summary>${tete}</summary><ul>${enfants.map((x) => noeud(x, prof + 1)).join('')}</ul></details></li>`;
}

function ecouter(son) {
  const c = audio(); c.resume(); const t = c.currentTime + 0.05;
  if (drums[son]) { [0, 0.5, 1].forEach((x) => drums[son](t + x)); return; }
  if (son === 'bass') { [36, 36, 43, 41].forEach((m, i) => bass(mtof(m), t + i * 0.4, 0.35)); return; }
  if (son === 'pad') { pad([48, 52, 55, 59].map(mtof), t, 2.5, 0.06); return; }
  if (son === 'pluck') { [60, 64, 67].forEach((m, i) => pluck(mtof(m), { when: t + i * 0.25 })); return; }
  if (son === 'labo') { const o = impulseOsc(2); const g = c.createGain(); g.gain.value = 0.08; o.frequency.setValueAtTime(2, t); o.frequency.exponentialRampToValueAtTime(220, t + 3); o.connect(g).connect(out()); o.start(t); o.stop(t + 3.6); return; }
  if (['piano', 'rhodes', 'voix'].includes(son)) { prechargerSons([son]).then(() => { const u = audio().currentTime + 0.05; if (son === 'voix') [60, 64, 67].forEach((m, i) => joue('voix', m, { when: u + i * 0.5, dur: 0.45 })); else accord(son, [48, 52, 55, 60], { when: u, dur: 1.6 }); }); return; }
  if (son === 'projet1' || son === 'joywalk') { const a = new Audio(son === 'projet1' ? 'data/sons/frog-visite.mp3' : 'data/sons/frog-joywalk.mp3'); a.currentTime = son === 'projet1' ? 40 : 18; a.play(); setTimeout(() => a.pause(), 8000); }
}

export default {
  id: 'arbre',
  mount(el) {
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">L’arbre de l’architecte</p>
        <h1>D’où vient chaque son.</h1>
        <p class="muted">Tu m’as demandé d’où venaient le kick et le reste. Voici tout FLIP, déplié comme des dossiers : ce qui est <b>fabriqué en direct</b>, ce qui est <b>enregistré</b>, ce qui est <b>calculé</b>, et où vivent nos <b>données</b>. Touche ▶ pour entendre un son là où tu lis son origine.</p>
        <p class="ar-legende"><em class="ar-etq ar-f">${F}</em><em class="ar-etq ar-e">${E}</em><em class="ar-etq ar-c">${C}</em><em class="ar-etq ar-d">${D}</em></p>
      </div></div>
      <ul class="arbre no-aide">${noeud(ARBRE, 0)}</ul>
      <p class="ec-row"><button class="btn small" data-ar="ouvrir">Tout déplier</button><button class="btn small" data-ar="fermer">Tout replier</button></p>`;
    el.addEventListener('click', (e) => {
      const s = e.target.closest('[data-son]'); if (s) { e.preventDefault(); ecouter(s.dataset.son); return; }
      const a = e.target.closest('[data-ar]')?.dataset.ar;
      if (a) el.querySelectorAll('.arbre details').forEach((d, i) => { d.open = a === 'ouvrir' || i === 0; });
    });
  },
};

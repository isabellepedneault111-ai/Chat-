// L'arbre de l'architecte : tout ce que FLIP contient, déplié comme des dossiers. D'où vient chaque son
// (fabriqué en direct, enregistré, ou la musique de Frog), ce que l'app calcule à l'écoute, où vivent nos données.
// Chaque son se joue d'un clic, pour l'entendre là où on lit son origine.
import { audio, drums, pad, bass, pluck, impulseOsc, out } from '../audio.js';
import { joue, accord, prechargerSons } from '../sampler.js';
import { mtof } from '../music.js';
import { sonsPersoHTML, brancherSonsPerso } from '../sonsperso.js';

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

// Le grand dessin : l'arbre radial de la vraie structure (data/arbre.json, généré à chaque construction).
const COUL = { dossier: '#e8c27a', js: '#ff6fae', mjs: '#ff6fae', css: '#6f9fe0', html: '#9fe0c3', mp3: '#b58cf0', json: '#93b08e', tsv: '#93b08e', jpg: '#f0a36f', mp4: '#f0a36f', svg: '#f0a36f', py: '#e9e4d8', sh: '#e9e4d8', toml: '#e9e4d8', md: '#e9e4d8', txt: '#e9e4d8' };
const couleur = (n) => (n.c ? COUL.dossier : COUL[(n.n.split('.').pop() || '').toLowerCase()] || '#cfc6b4');
function dessinArbre(data) {
  const R = 330; let feuilles = 0; let prof = 0; let dossiers = 0;
  const parcours = (n, d, chemin) => { n.d = d; n.chemin = chemin; prof = Math.max(prof, d); if (n.c) { dossiers++; n.c.forEach((x) => parcours(x, d + 1, `${chemin}/${x.n}`)); } else n.i = feuilles++; };
  parcours(data, 0, 'FLIP');
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
      if (n.d > 0) { points += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(3, 7 - n.d)}" fill="${COUL.dossier}"><title>${n.chemin} · ${n.c.length} éléments</title></circle>`; mots += `<text class="ar-dos" x="${x.toFixed(1)}" y="${(y - 9).toFixed(1)}" text-anchor="middle">${n.n}</text>`; }
    } else {
      const deg = (a * 180) / Math.PI; const gauche = deg > 90 && deg < 270;
      points += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="${couleur(n)}"><title>${n.chemin}${n.l ? ` · ${n.l} lignes` : ''}</title></circle>`;
      const [tx, ty] = xy(a, R + 6);
      mots += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" transform="rotate(${gauche ? deg - 180 : deg} ${tx.toFixed(1)} ${ty.toFixed(1)})" text-anchor="${gauche ? 'end' : 'start'}" dominant-baseline="middle" fill="${couleur(n)}">${n.n}</text>`;
    }
  };
  dessine(data);
  return { svg: `<svg class="ar-radial" viewBox="-40 -40 1080 1080" role="img" aria-label="L’arbre des dossiers et fichiers de FLIP"><g class="ar-liens">${liens}</g>${points}${mots}<text class="ar-centre" x="500" y="506" text-anchor="middle">FLIP</text></svg>`, dossiers };
}

export default {
  id: 'arbre',
  mount(el) {
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">L’arbre de l’architecte</p>
        <h1>Un environnement hybride, à l’œuvre.</h1>
        <p class="muted">Tout FLIP, dossier par dossier, fichier par fichier : la vraie structure de l’app, telle qu’elle tourne en ce moment. Passe sur un point pour voir son nom complet.</p>
      </div></div>
      <section class="ar-scene no-aide"><div class="ar-stats"></div><div class="ar-dessin"><p class="muted">L’arbre pousse…</p></div>
        <p class="ar-cles"><i style="--c:#e8c27a"></i>dossiers <i style="--c:#ff6fae"></i>code (JavaScript) <i style="--c:#6f9fe0"></i>styles <i style="--c:#b58cf0"></i>sons <i style="--c:#93b08e"></i>données <i style="--c:#f0a36f"></i>images</p></section>
      <section class="panel ar-nos-sons"><h2>Nos sons de batterie</h2><p class="muted small">Remplace un son par le tien : ● Mon son (tu frappes, FLIP l’enregistre 2 secondes et garde le coup), ou dépose un fichier. Il remplace celui d’origine partout dans l’app, pour nous deux.</p><div class="sp-host">${sonsPersoHTML()}</div></section>
      <details class="panel ar-details"><summary><h2>D’où vient chaque son, en détail</h2></summary>
        <p class="ar-legende"><em class="ar-etq ar-f">${F}</em><em class="ar-etq ar-e">${E}</em><em class="ar-etq ar-c">${C}</em><em class="ar-etq ar-d">${D}</em></p>
        <ul class="arbre no-aide">${noeud(ARBRE, 0)}</ul>
        <p class="ec-row"><button class="btn small" data-ar="ouvrir">Tout déplier</button><button class="btn small" data-ar="fermer">Tout replier</button></p>
      </details>`;
    fetch('data/arbre.json').then((r) => r.json()).then((data) => {
      const { svg, dossiers } = dessinArbre(data);
      el.querySelector('.ar-dessin').innerHTML = svg;
      el.querySelector('.ar-stats').innerHTML = `<b>${data.fichiers}</b> fichiers · <b>${dossiers - 1}</b> dossiers · <b>${data.lignes.toLocaleString('fr-CA')}</b> lignes écrites`;
    }).catch(() => { el.querySelector('.ar-dessin').innerHTML = '<p class="muted">L’arbre n’a pas pu se charger.</p>'; });
    const hote = el.querySelector('.sp-host');
    brancherSonsPerso(hote, () => { hote.innerHTML = sonsPersoHTML(); });
    el.addEventListener('click', (e) => {
      const s = e.target.closest('[data-son]'); if (s) { e.preventDefault(); ecouter(s.dataset.son); return; }
      const a = e.target.closest('[data-ar]')?.dataset.ar;
      if (a) el.querySelectorAll('.arbre details').forEach((d, i) => { d.open = a === 'ouvrir' || i === 0; });
    });
  },
};

// L'arbre de l'architecte : tout ce que FLIP contient, déplié comme des dossiers. D'où vient chaque son
// (fabriqué en direct, enregistré, ou la musique de Frog), ce que l'app calcule à l'écoute, où vivent nos données.
// Chaque son se joue d'un clic, pour l'entendre là où on lit son origine.
import { audio, drums, pad, bass, pluck, impulseOsc, out } from '../audio.js';
import { joue, accord, prechargerSons } from '../sampler.js';
import { mtof } from '../music.js';
import { espace } from '../espace.js';
import { VERSIONS } from '../nouveautes.js';
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
      points += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" fill="${couleur(n)}" class="ar-pt" data-f="${FICHES.push(n) - 1}" stroke="transparent" stroke-width="6"><title>${n.chemin}${n.l ? ` · ${n.l} lignes` : ''}${ORIGINE(n.n) ? `\n${ORIGINE(n.n)}` : ''}</title></circle>`;
      const [tx, ty] = xy(a, R + 6);
      mots += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" transform="rotate(${gauche ? deg - 180 : deg} ${tx.toFixed(1)} ${ty.toFixed(1)})" text-anchor="${gauche ? 'end' : 'start'}" dominant-baseline="middle" fill="${couleur(n)}">${n.n}</text>`;
    }
  };
  dessine(data);
  return { svg: `<svg class="ar-radial" viewBox="-40 -40 1080 1080" role="img" aria-label="L’arbre des dossiers et fichiers de Diapason Labo"><g class="ar-liens">${liens}</g>${points}${mots}<text class="ar-centre" x="500" y="494" text-anchor="middle">Diapason</text><text class="ar-centre" x="500" y="528" text-anchor="middle">Labo</text></svg>`, dossiers };
}

// La généalogie : chaque étape du projet (un point), chaque branche de travail (une ligne), les fusions.
const ERE_COUL = { Diapason: '#6f9fe0', 'Zaza × Frog': '#93b08e', FLIP: '#e8c27a', 'La visite': '#ff6fae', 'Version 0.5': '#b58cf0', 'Diapason Labo': '#f3c77a' };
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
    ${ext === 'mp3' && chemin.startsWith('data/sons/') ? `<button class="btn small" data-mp3="${esc(chemin)}">▶ Écouter ce son</button>` : ''}`;
}
function ficheEtape(c) {
  if (!c.lane.musique) {
    return `<p class="ar-f-sorte" style="--c:#6d655a">${esc(c.lane.nom)}</p><h3>Une étape le ${jour(c.d)}</h3>
      <p>Un autre chantier, mené avec Claude dans le même dépôt. On montre sa forme (quand, combien d’étapes), pas son contenu : ce n’est pas de la musique.</p><p class="ar-f-meta"><span>${c.lane.c.length} étapes sur cette branche</span></p>`;
  }
  const [fic, plus, moins] = c.t || [];
  return `<p class="ar-f-sorte" style="--c:${ERE_COUL[c.e] || '#cfc6b4'}">${esc(c.e || 'Avant Diapason')}${c.rang ? ` · étape ${c.rang} sur ${c.sur}` : ''}</p>
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
        <p class="ar-cles gn-cles">${Object.entries(ERE_COUL).map(([k, c]) => `<i style="--c:${c}"></i>${k}`).join(' ')} <i style="--c:#6d655a"></i>autres chantiers</p>
      </section>
      <section class="ar-mot">
        <h2>Ma façon de faire : la direction interprétative d’un agent d’IA</h2>
        <p class="ar-def"><b>Définition.</b> Une pratique de conception où l’on ne délègue pas des tâches à l’IA : on lui <b>distribue des fonctions cognitives</b>. À l’agent, le calcul combinatoire (générer, structurer, coder, tester, mettre en ligne) ; à la conceptrice, la <b>gouvernance interprétative</b> : le symbole qui organise tout, le ton, la justesse relationnelle, le sens pédagogique, et la décision d’arrêter. Le travail part d’un <b>noyau symbolique</b>, avance par <b>variation contrôlée</b> (un axe à la fois), et se pilote <b>en vol</b>, pendant que l’agent exécute. C’est une forme de cognition distribuée (Hutchins, 1995) et d’esprit étendu (Clark et Chalmers, 1998) appliquée à la conception d’un objet réel, utilisé par une vraie personne. Elle s’oppose au <i>vibe coding</i> (Karpathy, 2025), où l’on accepte ce que la machine produit, et à l’usage courant de l’IA comme guichet (une question, une réponse, un texte à copier).</p>
        <ul class="ar-traits">
          <li><b>Un noyau symbolique d’abord, les fonctions ensuite.</b> Diapason Labo s’est construit autour d’images, pas d’une liste de fonctions : « L’absence ne crée plus de distance », l’arc et le triskel, la tresse du duo, la cathédrale. Les fonctions en découlent ; quand une fonction n’a pas de sens, elle tombe.</li>
          <li><b>Le pilotage en vol.</b> Plus d’une centaine de messages en deux jours, dont une bonne part envoyés pendant que l’agent travaillait : « pas graine », « je n’aime pas nos couleurs », « la session est instable », « je ne trouve pas ma notification ». L’agent réoriente sans arrêter le chantier. La direction n’est jamais négociée ; elle arrive avec la conceptrice et se précise en marchant.</li>
          <li><b>La variation contrôlée.</b> Rarement « refais tout » : un axe précis à la fois. « Plus subtil », « parle en je, pas de Zaza à la troisième personne », « un beat sous MA voix ? », « garde le mot cathédrale, pas graine ». L’IA sert de moteur d’exploration d’un espace de possibilités, que la conceptrice resserre.</li>
          <li><b>Le refus du générique, comme critère de qualité.</b> Ce qui sonne « IA », « cheap » ou plaqué est retiré : une voix enregistrée jugée gênante, des flûtes ajoutées « pas rapport », une prétention « unique au monde » remplacée par une définition vérifiable. La sensibilité aux artifices visibles est ici le contrôle qualité principal.</li>
          <li><b>Un vrai destinataire dans la boucle.</b> L’objet est conçu pour une personne précise, qui l’utilise : la première visite de Frog a produit une quinzaine de demandes concrètes, qui ont réorienté la version suivante. C’est la logique de la recherche orientée par la conception (<i>design-based research</i> ; Brown, 1992 ; Collins, 1992), à l’échelle d’un duo.</li>
          <li><b>Une finalité relationnelle assumée.</b> Le critère de réussite final n’est pas technique : « Ai-je réussi à te séduire ? ». L’IA est mise au service d’une adresse à quelqu’un, d’un lien, d’un élan créatif à deux.</li>
          <li><b>L’ancrage dans la recherche, visible.</b> Chaque mécanisme pédagogique cite ses appuis (Rohrer, 2004 ; Cepeda et al., 2006 ; Biasutti, 2017 ; Pattison, 2009…), et l’honnêteté prime sur l’effet.</li>
          <li><b>La triangulation de sa propre pratique.</b> La conceptrice a soumis le même protocole d’analyse (« à partir des traces observables, sans flatterie, sans généralités ») à quatre systèmes d’IA, puis a comparé leurs portraits. L’IA devient aussi un instrument d’observation réflexive de soi.</li>
          <li class="ar-cadence"><b>Cadence</b> : <span class="ar-cad">mesurée dans l’historique…</span> Traçabilité : chaque décision est versionnée (Git) ; la généalogie ci-dessus en est la trace : <b class="ar-mot-etapes">—</b> étapes, <b class="ar-mot-lignes">—</b> lignes. Vérification : des tests de bout en bout dans un vrai navigateur (Playwright) avant chaque mise en ligne.</li>
          <li><b>La limite, nommée.</b> Les quatre analyses convergent sur un risque : penser en couches reliées peut surcomplexifier, et raffiner au-delà du point d’utilité. La contre-mesure visible ici : des vagues numérotées, des versions datées, un journal, et la question qui revient à chaque étape : est-ce que ça sert Frog et Zaza, maintenant ?</li>
        </ul>
        <p class="ar-mot-sign">— ${esc((espace.meta?.members || ['Zaza'])[0])}, conceptrice · l’agent : Claude (Anthropic), via Claude Code · sources : nos traces de travail, et le document « Mon utilisation de l’IA selon l’IA » (mai 2026)</p>
      </section>
      <details class="panel ar-versions"><summary><h2>Le journal des versions</h2></summary>
        ${VERSIONS.map((x) => `<section><h3>Version ${x.v} · ${x.titre} <small class="muted">${new Date(`${x.quand}T12:00`).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}</small></h3>${x.items.map(([t, l]) => `<p><b>${t}</b></p><ul>${l.map((y) => `<li>${y}</li>`).join('')}</ul>`).join('')}</section>`).join('')}
      </details>
      <details class="panel ar-details" open><summary><h2>D’où vient chaque son : piano, batterie, voix…</h2></summary>
        <p class="ar-legende"><em class="ar-etq ar-f">${F}</em><em class="ar-etq ar-e">${E}</em><em class="ar-etq ar-c">${C}</em><em class="ar-etq ar-d">${D}</em></p>
        <ul class="arbre no-aide">${noeud(ARBRE, 0)}</ul>
        <p class="ec-row"><button class="btn small" data-ar="ouvrir">Tout déplier</button><button class="btn small" data-ar="fermer">Tout replier</button></p>
      </details>`;
    fetch('data/arbre.json').then((r) => r.json()).then((data) => {
      const compte = (n) => (n.c ? 1 + n.c.reduce((a, x) => a + compte(x), 0) : 0); const dossiers = compte(data);
      const { svg } = dessinArbre(data);
      el.querySelector('.ar-mot-lignes').textContent = data.lignes.toLocaleString('fr-CA'); cadence();
      el.querySelector('.ar-dessin').innerHTML = svg;
      el.querySelector('.ar-stats').innerHTML = `<b>${data.fichiers}</b> fichiers · <b>${dossiers - 1}</b> dossiers · <b>${data.lignes.toLocaleString('fr-CA')}</b> lignes écrites`;
    }).catch(() => { el.querySelector('.ar-dessin').innerHTML = '<p class="muted">L’arbre n’a pas pu se charger.</p>'; });
    let gData = null;
    fetch('data/genealogie.json').then((r) => r.json()).then((g) => {
      const host = el.querySelector('.gn-host'); host.innerHTML = dessinGenealogie(g);
      host.scrollLeft = host.scrollWidth; // on arrive sur aujourd'hui ; on remonte le temps en glissant
      const et = el.querySelector('.ar-mot-etapes'); if (et) et.textContent = g.lanes[0].c.length.toLocaleString('fr-CA');
      // Le temps réellement passé, et un repère du génie logiciel pour situer l'échelle (pas la qualité).
      gData = g; cadence();
    }).catch(() => { el.querySelector('.gn-host').innerHTML = '<p class="muted">La généalogie n’a pas pu se charger.</p>'; });
    function cadence() {
      const g = gData; const cd = g?.cadence; const cad = el.querySelector('.ar-cad');
      if (cd && cad && /\d/.test(el.querySelector('.ar-mot-lignes').textContent)) {
        const lignes = +(el.querySelector('.ar-mot-lignes').textContent.replace(/\D/g, '')) || 0;
        const min = Math.round((cd.heuresActives * 60) / Math.max(1, cd.etapes - 1));
        const jp = (n) => Math.round(lignes / n);
        cad.innerHTML = `${cd.etapes} étapes validées en ≈ ${String(cd.heuresActives).replace('.', ',')} h d’activité mesurée, sur ${cd.jours} jours (${String(cd.heuresTotales).replace('.', ',')} h écoulées) : une itération toutes les ${min} minutes environ. Repère : les estimations classiques du génie logiciel comptent de 10 à 50 lignes de code fini par développeur et par jour, conception et tests compris (McConnell, 2004). Sans IA, ce volume représenterait de l’ordre de ${jp(50).toLocaleString('fr-CA')} à ${jp(10).toLocaleString('fr-CA')} jours-personnes. Le nombre de lignes est une mesure grossière : il situe l’échelle, pas la qualité.`;
      }
    }

    let gIci = -1;
    const choisir = (pt) => { pt.closest('svg').querySelectorAll('.ar-choisi').forEach((x) => x.classList.remove('ar-choisi')); pt.classList.add('ar-choisi'); };
    const montrerEtape = (i) => {
      const c = ETAPES[i]; if (!c) return; gIci = i; el.querySelector('.gn-fiche').innerHTML = ficheEtape(c);
      const pt = el.querySelector(`.gn-svg [data-g="${i}"]`); if (pt) { choisir(pt); const host = el.querySelector('.gn-host'); const x = +pt.getAttribute('cx'); if (x < host.scrollLeft + 40 || x > host.scrollLeft + host.clientWidth - 40) host.scrollTo({ left: x - host.clientWidth / 2, behavior: 'smooth' }); }
    };
    const lePoint = (e) => {
      const f = e.target.closest('[data-f]'); if (f) { choisir(f); el.querySelector('.ar-dessin + .ar-fiche').innerHTML = ficheFichier(FICHES[+f.dataset.f]); return true; }
      const g = e.target.closest('[data-g]'); if (g) { montrerEtape(+g.dataset.g); return true; }
      return false;
    };
    el.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && lePoint(e)) e.preventDefault(); });
    let mp3 = null;
    el.addEventListener('click', (e) => {
      if (lePoint(e)) return;
      const m = e.target.closest('[data-mp3]'); if (m) { mp3?.pause(); mp3 = new Audio(m.dataset.mp3); mp3.play().catch(() => {}); return; }
      const gp = e.target.closest('[data-gpas]'); if (gp) { const c = ETAPES[gIci]; const k = ETAPES.findIndex((x) => x.lane === c.lane && x.rang === c.rang + +gp.dataset.gpas); if (k >= 0) montrerEtape(k); return; }
      const s = e.target.closest('[data-son]'); if (s) { e.preventDefault(); ecouter(s.dataset.son); return; }
      const a = e.target.closest('[data-ar]')?.dataset.ar;
      if (a) el.querySelectorAll('.arbre details').forEach((d, i) => { d.open = a === 'ouvrir' || i === 0; });
    });
  },
};

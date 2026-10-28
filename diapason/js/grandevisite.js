// La grande visite : le chemin d'une idée, chaque page visitée section par section, un projecteur à la fois. Elle accueille Frog à sa
// prochaine ouverture quand l'app a beaucoup changé depuis sa dernière visite (à la place, exceptionnellement, de la liste
// des nouveautés), et elle reste dans le coffre pour qui veut la refaire.
import { espace, profileOf, saveProfile } from './espace.js';
import { MEMBERS } from './duo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const EDITION = 2; // à augmenter quand une nouvelle grande visite s'impose

// Le fil de la visite : le chemin d'une idée, de l'étincelle à la scène. Chaque chapitre s'ouvre sur une carte qui dit
// où on en est dans ce chemin, puis visite sa page section par section. Une étape :
// { r: route, s: sélecteur (ou fonction qui trouve l'élément), t: titre, d: ce que ça fait, concrètement,
//   fil: le lien avec la suite (facultatif), faire: geste joué à l'arrivée (ouvrir une fiche…), essai: [libellé, sélecteur] }
// Ouvre le menu ⋯ s’il est fermé (un clic dans la bulle le referme).
const ouvrirMenu = () => { const m = document.querySelector('.plus-pop'); if (m?.hidden) document.getElementById('plusBtn')?.click(); return !!m; };
const CHAPITRES = (autre) => [
  { ch: 'Attraper', t: 'Une idée naît n’importe où', d: 'Le premier geste de FLIP : ne rien perdre. Une phrase, un riff, une minute de jam : l’app l’attrape et la pose au Mur.', etapes: [
    { r: '#/', s: '.etincelle', t: 'L’étincelle', d: 'La flamme, en bas, sur toutes les pages. Une idée te vient au milieu d’autre chose? Un mot, un son ou une image, et elle part au Mur sans quitter ce que tu fais.' },
    { r: '#/studio', s: '#priseBtn', t: 'La prise : le branchement', d: 'La porte de Mon studio. Le chiffre dit combien d’appareils sont branchés et actifs (clavier MIDI, micro, carte de son) : ce sont eux que le filet écoute.' },
    { r: '#/studio', s: '.filet-btn', t: 'Le filet', d: 'Tendu, il garde en continu la dernière minute de tout ce qui joue : ton clavier MIDI, ton micro, le son de l’app. Tu viens de jouer quelque chose de beau sans enregistrer? Touche le filet : la minute est là, tu choisis le bout et tu le gardes.' },
    { r: '#/studio', s: '#micBtn', t: 'Le micro', d: 'Gris : fermé. Rouge qui bat : ouvert, l’app entend (pour suivre une voix, trouver une note). Ouvrir le micro n’enregistre rien ; c’est le filet ou « ● Enregistrer » qui gardent.' },
    { r: '#/carnet', s: '.capture', t: 'Le Mur : déposer', d: 'Écrire une idée et « Ajouter » : elle prend place au Mur, à ta couleur, et l’autre la voit tout de suite.' },
    { r: '#/carnet', s: '.direction', t: 'Ce que le mois demande', d: 'Le plan des six mois fixe un objectif par mois. Ce mois-ci, un nombre d’idées à récolter : la jauge avance toute seule.' },
    { r: '#/carnet', s: '.mur', t: 'Le ciel des idées', d: 'Chaque idée est une étoile. Plus elle avance (brute, en chantier, presque prête, prête), plus elle s’approche du centre. Les outils au-dessus la montrent autrement : par étapes, par morceaux, en fil.', fil: 'Une idée au Mur, c’est de la matière. Reste à se retrouver pour la travailler.' },
  ] },
  { ch: 'Se retrouver', t: 'On se donne rendez-vous', d: 'Une idée avance quand on la travaille ensemble, régulièrement. L’accueil dit quoi faire maintenant ; le calendrier, quand ; la séance, comment.', etapes: [
    { r: '#/', s: '.commencer', t: 'Par où commencer', d: 'Les prochains pas, dans l’ordre : ce qui t’attend toi, pas une liste générale. Chaque ligne mène directement au bon endroit.' },
    { r: '#/', s: '.next-card', t: 'La prochaine séance', d: 'Combien de séances cette semaine, la prochaine plage prévue au calendrier, et le bouton pour lancer.' },
    { r: '#/', s: '.cycle', t: 'Notre cycle : la lune', d: 'Six mois, six lunes. Chaque phase a son geste : semer (nouvelle lune), faire grandir, faire entendre (pleine lune), laisser aller. La carte dit où on est et ce que ce temps-ci demande.' },
    { r: '#/calendrier', s: '.cl-cal', t: 'Le calendrier', d: `L’un propose une plage (en présence, à distance, projet pro, jeux), ${autre} l’approuve : elle prend nos deux couleurs. Les rituels lunaires y sont, à l’heure exacte. Tout s’exporte vers ton agenda (.ics).` },
    { r: '#/calendrier', s: '.cl-pas', t: 'Nos prochains pas', d: 'Ce que l’app voit à faire, et ce qu’on se donne nous-mêmes, à cocher. Pour soi ou pour nous deux.' },
    { r: '#/session', s: '.depuis', t: 'La séance : depuis la dernière fois', d: `Avant de jouer, ce que ${autre} a fait depuis : c’est votre matière de départ, pas une page blanche.` },
    { r: '#/session', s: '.pas-a-pas', t: 'Quatre questions, puis on joue', d: 'Où êtes-vous (ensemble, à distance, seul)? Combien de temps? Sur quoi (une cible, une seule)? Sur quels accords? La musique part, l’app guide les étapes, et la séance finit par une prise qu’on range au Mur.', fil: 'Pendant la séance, on joue. Voici les instruments.' },
  ] },
  { ch: 'Jouer', t: 'L’idée devient du son', d: 'Trois pièces : Jouer (le beat, les accords, les chansons), Mon studio (ton vrai matériel) et L’oreille (qui écoute pour toi).', etapes: [
    { r: '#/studio', s: '.transport', t: 'Le transport', d: 'Lecture, tempo (ou le taper), tonalité, et une grille d’accords connue. La lampe réchauffe tout ce qui sort. « ● » enregistre.' },
    { r: '#/studio', s: '.chord-row', t: 'La grille d’accords', d: 'Les quatre accords qui tournent. Touche-en un pour le changer, ou écris ta propre grille. En dessous : des défis d’impro tirés au hasard.' },
    { r: '#/studio', s: '.tabs', t: 'Les ateliers de Jouer', d: 'Beat (la batterie), Nos chansons (couplet, refrain, pont, avec leurs accords), Mes prises (ce que ● REC enregistre), Pochette, Scène, Mon instrument (l’app écoute ton clavier et devine les accords).' },
    { r: '#/materiel', s: '.m-scene', t: 'Mon studio', d: 'Ta pièce, vue de haut, avec tes meubles et tes appareils là où ils sont vraiment. Touche un objet : sa fiche (couleur, taille, ce à quoi il est branché).' },
    { r: '#/materiel', s: '.m-barre', t: 'Détecter, ajouter', d: 'L’app détecte micros et claviers MIDI branchés. Les vrais arrivent seuls ; les virtuels (Teams, Zoom…) se proposent, et on les ignore d’un geste. Ici aussi, on règle la durée du filet.' },
    { r: '#/materiel', s: '.m-qui', t: 'Le tien, celui de l’autre', d: `Une bascule pour visiter le studio de ${autre}, s’il le partage.` },
    { r: '#/oreille', s: '.or-src', t: 'L’oreille', d: 'Dépose un enregistrement (un mémo, une pièce) : l’app trouve le tempo, la tonalité, les parties et les accords, et en tire une grille prête à jouer.', fil: 'Le son est là. La voix maintenant.' },
  ] },
  { ch: 'La voix', t: 'Le piano coache la voix', d: 'Les claviers de Frog et la voix de Zaza, accord par accord. Quatre pièces : le clavier coach, le miroir, l’empreinte (la tessiture), la gym vocale.', etapes: [
    { r: '#/accord', s: '.acc-modes', t: 'Cinq façons de jouer', d: 'Dans l’accord (n’importe quelle note de l’accord), Frog donne la note (Zaza la reprend), Harmonie (une deuxième voix sous celle du piano), Hors des sentiers (les notes de couleur : 9e, 11e, 13e), Duel inversé (Zaza chante, Frog cherche les accords qui la portent).' },
    { r: '#/accord', s: '.groove', t: 'Un beat sous la voix', d: 'Un style, un tempo et une façon de phraser (tenir, sur les temps, syncopé…), pour chanter dans un vrai contexte.' },
    { r: '#/accord', s: '.acc-side', t: 'Ce que l’app retient', d: 'Le temps chanté juste, les notes où la voix est la plus stable (ses notes magiques), et la carte de nos accords : chaque accord où Zaza chante bien y prend sa place, séance après séance.', fil: 'Il manque les mots.' },
  ] },
  { ch: 'Écrire', t: 'Les mots, et le relais', d: 'Écrire seul, écrire sur le beat, et se renvoyer la balle.', etapes: [
    { r: '#/ecrire', s: '.ec-chemins', t: 'Les chemins de l’écriture', d: 'Une séance d’atelier guidée (25 min), le grimoire (cartes, cadavre exquis), placer des paroles sur une pièce de Frog, sculpter nos paroles (syllabes, rimes), partir dans une ambiance.' },
    { r: '#/ecrire', s: '.ec-flux', t: 'Écrire sur le beat', d: 'Comme en studio : la musique joue, on chante des sons sans mots (le mumble), on réécoute, puis on écrit des mots qui gardent ce rythme. Double-clique un mot n’importe où : ses rimes et ses synonymes.' },
    { r: '#/relais', s: '.rl-launch', t: 'Le relais', d: `Un son lancé à ${autre}, qui répond par-dessus. Couche après couche, à distance, la pièce se construit à deux.`, fil: 'Et quand on veut sortir des sentiers : le labo.' },
  ] },
  { ch: 'Le labo', t: 'Quand un rythme devient une note', d: 'Le labo part d’un fait physique : un rythme qu’on accélère au-delà de vingt battements par seconde, l’oreille l’entend comme une note. Les rapports entre rythmes deviennent alors des accords.', etapes: [
    { r: '#/labo', s: '.radar-panel', t: 'Les disques, en haut', d: 'Chaque disque tourne et frappe autant de fois par tour que son nombre : 2 et 3, c’est un 3 contre 2. Lent, tu entends un rythme. Touche ▶ : ça joue.', essai: ['▶ Écouter les disques', '.play-orb'] },
    { r: '#/labo', s: '.ctrl-panel', t: 'Accélérer jusqu’à la note', d: 'Le curseur règle la vitesse. Glissade ↗ accélère tout seul : passé le seuil (≈ 20 Hz), le rythme 2 : 3 devient une quinte. Les rapports tout prêts (octave, quinte, accord majeur…) sont juste dessous.', essai: ['Glissade ↗', '[data-act=sweep]'] },
    { r: '#/labo', s: '.tracks', t: 'Tes disques', d: 'Un disque par ligne : son nombre (− +), son son (grosse caisse, claps…), son volume. On en ajoute, on les regroupe pour qu’ils bougent ensemble.' },
    { r: '#/labo', s: '.liens', t: 'Les liens : qui influence qui', d: 'Un disque peut agir sur un autre : à chaque frappe, il le rend plus fort, plus aigu, plus brillant. Une respiration lente, le hasard, ta voix ou ton clavier MIDI peuvent aussi tirer les ficelles. Glisse une source vers sa cible, ou écris le lien en phrase.' },
    { r: '#/labo', s: '.kb-panel', t: 'La note cachée dans le rythme', d: 'Le clavier montre quelle note donnerait ce rythme s’il était accéléré : « double-le cinq fois et c’est un Sol ». Les touches pointillées sont les notes fantômes.' },
    { r: '#/labo', s: '.wave-panel', t: 'L’onde', d: 'Chaque disque dessiné comme une vague, et en blanc leur somme : ce que ton tympan reçoit. Quand les traits se collent, c’est une note.', fil: 'Le labo, c’est quelques disques. La cathédrale, c’est un orchestre entier bâti avec la même idée.' },
    { r: '#/cathedrale', s: '.view-cathedrale .mod-head', t: 'La cathédrale : une clé, trois vitesses', d: 'Une poignée de nombres (4 : 5 : 6 : 7) joués à trois vitesses en même temps. Très lente, elle donne la forme : quatre parties de durées 4, 5, 6, 7. Moyenne, le rythme : 4 contre 5 contre 6 contre 7. Rapide, l’harmonie : un accord en intonation juste. Une seule idée tient toute l’œuvre.' },
    { r: '#/cathedrale', s: '.nf-commande', t: 'Choisir la clé, le tour', d: 'Une clé toute prête (ou tes nombres), la note de départ, la durée. Le tour, c’est la mesure : plus court, tout va plus vite. Le curseur rythme ↔ harmonie dose les frappes et l’accord tenu. Pas besoin de passer par le studio : ▶ et on écoute.', essai: ['▶ Écouter', '[data-ca=jouer]'] },
    { r: '#/cathedrale', s: '.nf-nef-host', t: 'La nef : tout se lit d’un coup d’œil', d: 'Une rangée par voix : son instrument, ses frappes par tour (les points), sa note dans chaque partie. Une arche par partie, aussi large que sa durée. En bas, l’accord tenu et la famille qui chante la mélodie. Pendant l’écoute, la lumière avance et chaque voix pulse quand elle frappe.' },
    { r: '#/cathedrale', s: '.nf-fiche', t: 'Toucher une voix : sa fiche', d: 'Son nombre, son instrument, son octave, et son pupitre : des voix réglées ensemble, d’un seul geste (sourdine, solo, même instrument). Et ses liens : à chaque frappe, elle rend une autre voix plus forte, plus aiguë, plus brillante. Les liens se dessinent en flèches dans la marge, les pupitres en accolades.', faire: () => { const v = document.querySelector('.nf-voix[data-voix="1"]'); v?.click(); return !!v; } },
    { r: '#/cathedrale', s: '.nf-fiche', t: 'Toucher une arche : sa lumière, son accord', d: 'Qui chante la mélodie dans cette partie (les cordes, les cuivres, le chœur…) et sur quel accord tout l’orchestre se pose. Chaque accord sonne en intonation juste.', faire: () => { const a = document.querySelector('.nf-arche[data-partie="1"]'); a?.click(); return !!a; } },
    { r: '#/cathedrale', s: '.nf-plus', t: 'Ce que Frog branche', d: 'Un accord tenu au clavier devient la clé. Ou une minute de jeu prise dans le filet : la cathédrale de ton jeu, une partie par accord joué. Elle peut aussi jouer sur tes appareils MIDI.' },
    { r: '#/cathedrale', s: '.nf-garder', t: 'Garder l’œuvre', d: 'Le son en WAV (intonation juste gardée), la partition en MIDI, une famille d’instruments par piste, pour la reprendre dans ton logiciel. Et la rosace en image.', fil: 'Tout ça, on le joue. Reste à voir où on en est.' },
  ] },
  { ch: 'Mesurer', t: 'Où on est rendus', d: 'Se fixer des objectifs petits et vérifiables, et regarder honnêtement le chemin fait.', etapes: [
    { r: '#/projet', s: '.pj-obj', t: 'Nos objectifs, du plus près au plus loin', d: 'La cible de la dernière séance, l’objectif de la semaine (fixé à deux, évalué chacun en fin de semaine), le mois du plan, et le cap des six mois.' },
    { r: '#/projet', s: '.pj-plan', t: 'Le plan des six mois', d: 'Un objectif et une sortie visée par mois. Le mois en cours est mis en avant.' },
    { r: '#/bilan', s: '.b-tabs', t: 'Notre bilan', d: 'La semaine, le mois, nos séances, nos courbes : ce qui a été fait, par qui, et ce qui reste.' },
    { r: '#/passage', s: '.pa-etapes', t: 'Le passage, à chaque nouvelle lune', d: 'Quatre gestes à deux : ce qu’on avait semé, ce que le cycle a donné, ce qu’on emporte, ce qu’on sème pour la lune qui vient.', fil: 'Dernière pièce : l’envers du décor.' },
  ] },
  { ch: 'L’arbre', t: 'Toute la mécanique, colligée', d: 'L’arbre dessine l’app telle qu’elle est construite : chaque dossier, chaque fichier, ce qu’il contient et ce que ça fait, expliqué en mots simples. C’est la documentation vivante de Diapason Labo, régénérée à chaque mise à jour.', etapes: [
    { r: '#/arbre', s: '.ar-stats', t: 'L’app en chiffres', d: 'Combien de fichiers, de lignes, de dossiers : la taille réelle de ce qui a été bâti.' },
    { r: '#/arbre', s: '.ar-dessin', t: 'L’arbre', d: 'Au centre, l’app. Chaque branche est un dossier, chaque point un fichier, coloré selon sa nature (le code, les styles, les sons, les données). Les gros points or sont les dossiers ; ceux qui brillent ont été retouchés à la dernière mise à jour.' },
    { r: '#/arbre', s: '.ar-dessin + .ar-fiche', t: 'Touche un point : sa fiche', d: 'On vient de toucher le fichier de la cathédrale. À droite, sa fiche : ce qu’il fait en une phrase (écrite en tête du fichier), sa taille, sa date de naissance et ses dernières retouches.', faire: () => { const p = [...document.querySelectorAll('.ar-dessin [data-f]')].find((c) => /views\/cathedrale\.js/.test(c.querySelector('title')?.textContent || '')); p?.dispatchEvent(new MouseEvent('click', { bubbles: true })); return !!p; } },
    { r: '#/arbre', s: '.ar-f-el', t: 'Ce qu’il contient', d: 'Plus bas dans la fiche : chaque fonction et chaque réglage du fichier, par son nom. On vient d’en toucher un : l’app dit ce que c’est pour un développeur, puis ce que ça fait concrètement, dans l’app. Chaque nom de chaque fichier s’ouvre ainsi.', faire: () => { const b = [...document.querySelectorAll('.ar-f-el [data-el]')].find((x) => x.dataset.com) || document.querySelector('.ar-f-el [data-el]'); b?.click(); return !!b; } },
    { r: '#/arbre', s: '.ar-genea', t: 'La généalogie', d: 'Chaque étape de la construction, date par date, telle que l’historique du code la garde. Touche un point : ce qui a changé ce jour-là, combien de fichiers et de lignes. On vient d’ouvrir la plus récente.', faire: () => { const l = [...document.querySelectorAll('.gn-svg circle.ar-pt:not(.gn-pt-autre)')]; l[l.length - 1]?.dispatchEvent(new MouseEvent('click', { bubbles: true })); return l.length > 0; } },
    { r: '#/', s: '.plus-pop', t: 'Le menu ⋯ : les outils', d: 'Le bouton ⋯ en haut ouvre ce menu. On l’a ouvert pour toi.', faire: ouvrirMenu },
    { r: '#/', s: '.plus-pop .tool-arbre', t: 'L’arbre', d: 'Ce qu’on vient de visiter : l’architecture de l’app, fichier par fichier, et ses versions.', faire: ouvrirMenu },
    { r: '#/', s: '.plus-pop .tool-coffre', t: 'Le coffre', d: 'Nos petites perles : les traces qu’on veut garder précieusement. Cette visite y attend aussi, si tu veux la refaire.', faire: ouvrirMenu },
    { r: '#/', s: '#pistesBtn', t: 'Pourquoi ça marche', d: 'Pour la page ouverte : sur quelles recherches elle s’appuie (apprentissage, créativité, musique), en quelques lignes, avec leurs sources.', faire: ouvrirMenu },
    { r: '#/', s: '#fsBtn', t: 'Le plein écran', d: 'Cache la barre du navigateur : toute la place pour jouer.' },
  ] },
];
// À plat, pour avancer d'une étape à l'autre : chaque chapitre ouvre sur sa carte.
const ETAPES = (autre) => CHAPITRES(autre).flatMap((c, k) => [{ carte: true, k, ...c }, ...c.etapes.map((e, n) => ({ ...e, k, ch: c.ch, n: n + 1, de: c.etapes.length }))]);

const visible = (sel) => sel.split(',').map((x) => x.trim()).flatMap((x) => [...document.querySelectorAll(x)]).find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; });
const membres = () => espace.meta?.members || MEMBERS;

// Due pour Frog : il a déjà fait sa première visite, et pas encore cette édition de la grande visite.
export function grandeVisiteDue() {
  if (!espace.connected || !espace.me) return false;
  const frog = espace.me === membres()[1];
  return frog && !!espace.meta?.tour?.[espace.me] && (profileOf(espace.me)?.grandeVisite || 0) < EDITION;
}

// Lance la grande visite : huit chapitres, le chemin d’une idée ; chaque page section par section, avec ses gestes.
// Obligatoire, on peut la reprendre plus tard, mais pas la sauter.
export function lancerGrandeVisite({ obligatoire = false, onFin } = {}) {
  if (document.querySelector('.coach')) return;
  const autre = membres().find((m) => m !== espace.me) || 'l’autre';
  const de = membres()[0];
  const C = CHAPITRES(autre); const E = ETAPES(autre); let i = -1; let jeton = 0;
  // Obligatoire, rien ne se saute par mégarde : on reprend là où on s’était arrêté, on ne saute pas en avant
  // d’un chapitre pas encore vu, et un double-clic sur « Suivant » ne compte qu’une fois.
  const reprise = obligatoire ? Math.min(E.length - 1, profileOf(espace.me)?.grandeVisitePas || 0) : 0;
  let vu = reprise; let pret = 0; let confirmer = 0;
  const garder = () => { if (obligatoire && i > 0) saveProfile(() => ({ grandeVisitePas: Math.max(i, vu) })).catch(() => {}); };
  const box = document.createElement('div'); box.className = 'coach gv';
  box.innerHTML = '<div class="coach-hole"></div><div class="coach-bubble" role="dialog" aria-live="polite"></div>';
  document.body.appendChild(box);
  const hole = box.querySelector('.coach-hole'); const bulle = box.querySelector('.coach-bubble');
  const cible = () => { const x = E[i]; return x && !x.carte && (typeof x.s === 'function' ? x.s() : visible(x.s)); };
  // Sur grand écran, la page se resserre à gauche pendant la visite : la bulle a sa propre colonne et ne cache rien.
  const large = () => innerWidth >= 1100;
  const colonne = () => { const avant = document.documentElement.classList.contains('gv-on'); document.documentElement.classList.toggle('gv-on', large()); if (avant !== large()) dispatchEvent(new Event('resize')); };
  const fin = async (faite) => {
    jeton++; box.remove(); document.documentElement.classList.remove('gv-on'); dispatchEvent(new Event('resize')); removeEventListener('resize', placer); removeEventListener('resize', colonne); removeEventListener('keydown', touche);
    if (faite) { try { await saveProfile(() => ({ grandeVisite: EDITION, grandeVisitePas: 0 })); } catch { /* on réessaiera */ } onFin?.(); }
  };
  // Place le halo sur la section de l’étape, et la bulle là où elle cache le moins : à côté si la place le permet,
  // sinon dessous ou dessus, sinon en bas de l’écran. Une section plus haute que l’écran est montrée par son haut.
  function placer() {
    const vw = innerWidth; const vh = innerHeight; const bw = Math.min(400, vw - 24);
    const el = cible(); bulle.classList.toggle('gv-carte', !!E[i]?.carte || i < 0 || i >= E.length);
    if (!el) { hole.style.opacity = 0; Object.assign(bulle.style, { width: `${Math.min(560, vw - 24)}px`, left: `${(vw - Math.min(560, vw - 24)) / 2}px`, top: `${Math.max(20, vh / 2 - 220)}px`, bottom: 'auto' }); return; }
    let r = el.getBoundingClientRect(); const haut = r.height > vh - 160;
    if (r.top < 70 || (haut ? r.top > 120 : r.bottom > vh - 20)) { el.scrollIntoView({ block: haut ? 'start' : 'center' }); if (haut) scrollBy(0, -90); r = el.getBoundingClientRect(); }
    const p = 8; const t = Math.max(r.top - p, 4); const b = Math.min(r.bottom + p, vh - 8);
    Object.assign(hole.style, { left: `${r.left - p}px`, top: `${t}px`, width: `${r.width + 2 * p}px`, height: `${Math.max(20, b - t)}px`, opacity: 1 });
    const bh = bulle.offsetHeight || 220; const midY = Math.max(70, Math.min(vh - bh - 12, (t + b) / 2 - bh / 2));
    // Une icône du haut ou le menu ⋯ débordent dans la colonne : la bulle passe alors à leur gauche.
    if (large() && r.right + p > vw - bw - 32 && r.left - p >= bw + 24) { Object.assign(bulle.style, { width: `${bw}px`, left: `${r.left - p - 16 - bw}px`, top: `${Math.max(70, Math.min(vh - bh - 12, t))}px`, bottom: 'auto' }); return; }
    if (large()) { Object.assign(bulle.style, { width: `${bw}px`, left: `${vw - bw - 16}px`, top: `${Math.max(70, Math.min(vh - bh - 12, t))}px`, bottom: 'auto' }); return; }
    if (vw - r.right - p >= bw + 24) { Object.assign(bulle.style, { width: `${bw}px`, left: `${r.right + p + 16}px`, top: `${midY}px`, bottom: 'auto' }); return; }
    if (r.left - p >= bw + 24) { Object.assign(bulle.style, { width: `${bw}px`, left: `${r.left - p - 16 - bw}px`, top: `${midY}px`, bottom: 'auto' }); return; }
    const dessous = b + 16 + bh < vh; const dessus = t - 16 - bh > 60;
    if (!dessous && !dessus) { Object.assign(bulle.style, { width: `${bw}px`, left: `${vw - bw - 12}px`, top: 'auto', bottom: '12px' }); return; }
    const left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2));
    Object.assign(bulle.style, { width: `${bw}px`, left: `${left}px`, top: dessous ? `${b + 16}px` : 'auto', bottom: dessous ? 'auto' : `${vh - t + 16}px` });
  }
  // Attend que la section de l’étape soit dessinée (une page peut charger ses données), au plus quelques secondes.
  // Son geste (ouvrir un menu, toucher un point) est rejoué tant qu’il n’a pas trouvé sur quoi agir.
  const attendre = async (j) => {
    // Un tic d’abord : le clic sur « Suivant » doit finir de se propager (il refermerait le menu qu’on ouvre).
    await new Promise((ok) => setTimeout(ok, 60)); let fait = !E[i]?.faire;
    for (let n = 0; n < 30 && j === jeton; n++) {
      if (!fait) { try { fait = E[i].faire() !== false; } catch { fait = true; } }
      if (fait && cible()) return; await new Promise((ok) => setTimeout(ok, 150));
    }
  };
  // Les chapitres en pastilles : où on est dans le chemin, et un raccourci vers chacun.
  const bloque = (k) => obligatoire && E.findIndex((x) => x.carte && x.k === k) > vu;
  const fil = () => `<ol class="gv-fil">${C.map((c, k) => `<li><button data-g="chap" data-k="${k}" class="${E[i]?.k === k ? 'on' : E[i]?.k > k ? 'fait' : ''}" title="${esc(c.ch)}" ${bloque(k) ? 'disabled' : ''}>${esc(c.ch)}</button></li>`).join('')}</ol>`;
  const nav = (suiv = 'Suivant →') => `<div class="coach-row">${i > 0 ? '<button class="btn ghost small" data-g="avant" aria-label="Étape précédente">←</button>' : ''}<button class="btn primary" data-g="suivant">${suiv}</button>
    <button class="coach-skip" data-g="plustard">${obligatoire ? 'Finir plus tard' : 'Fermer'}</button></div>`;
  // Affiche l’étape courante : l’accueil de la visite, une carte de chapitre, ou une section (avec son geste et son essai).
  async function montrer() {
    const j = ++jeton; const x = E[i];
    if (i < 0) {
      hole.style.opacity = 0;
      bulle.innerHTML = `<p class="coach-n">La grande visite</p><h3>${obligatoire ? 'L’app a beaucoup changé depuis ta dernière visite.' : 'Tout Diapason Labo, en suivant le fil.'}</h3>
        <p>${obligatoire ? `${esc(de)} a transformé l’app. Alors on la parcourt ensemble, en suivant le chemin d’une idée : de l’étincelle à la scène, puis l’envers du décor. Elle remplace, exceptionnellement, la liste des nouveautés.` : 'Le chemin d’une idée : on l’attrape, on se retrouve, on la joue, on la chante, on l’écrit, on la pousse au labo, on mesure le chemin fait. Puis l’envers du décor.'}</p>
        ${reprise > 0 ? `<p class="gv-reprise">Tu t’étais arrêté au chapitre « ${esc(E[reprise].ch)} ». On reprend là?</p>` : ''}
        <p class="gv-som">${C.map((c, k) => `<button data-g="chap" data-k="${k}" ${bloque(k) ? 'disabled' : ''}><b>${k + 1}</b> ${esc(c.ch)}<small>${esc(c.t)}</small></button>`).join('')}</p>
        <p class="muted small">Environ ${Math.round(E.length / 4)} minutes. ${obligatoire ? 'Tu peux t’arrêter et reprendre plus tard, exactement là où tu étais.' : 'Les flèches du clavier marchent aussi ; tu peux sauter à un chapitre.'}</p>
        <div class="coach-row">${reprise > 0 ? '<button class="btn primary" data-g="reprendre">Reprendre</button><button class="btn ghost small" data-g="suivant">Depuis le début</button>' : '<button class="btn primary" data-g="suivant">Commencer</button>'}${obligatoire ? '' : '<button class="coach-skip" data-g="fermer">Fermer</button>'}</div>`;
    } else if (i >= E.length) {
      hole.style.opacity = 0; if (location.hash !== '#/') location.hash = '#/';
      bulle.innerHTML = `${fil()}<p class="coach-n">La grande visite</p><h3>Voilà le fil.</h3><p>Une idée s’attrape, on se retrouve pour la jouer, on la pousse aussi loin qu’on veut, on regarde où on est rendus. Et tout ce qui fait marcher l’app est lisible dans l’arbre.</p>
        <p>La liste des nouveautés reprend à la prochaine mise à jour. Cette visite reste dans le coffre (menu ⋯).</p>
        <div class="coach-row"><button class="btn primary" data-g="fini">Merci, on y va</button></div>`;
    } else if (x.carte) {
      hole.style.opacity = 0;
      bulle.innerHTML = `${fil()}<p class="coach-n">Chapitre ${x.k + 1} sur ${C.length} · ${esc(x.ch)}</p><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p>
        <p class="gv-quoi">${x.etapes.map((e) => `<span>${esc(e.t)}</span>`).join('')}</p>${nav('On y va →')}`;
    } else {
      const route = x.r;
      if (location.hash !== route && !(route === '#/' && (location.hash === '' || location.hash === '#'))) location.hash = route;
      bulle.innerHTML = `${fil()}<p class="coach-n">${esc(x.ch)} · ${x.n} / ${x.de}</p><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p>
        ${x.essai ? `<p><button class="btn small gv-essai" data-g="essai">${esc(x.essai[0])}</button></p>` : ''}
        ${x.fil ? `<p class="gv-suite">${esc(x.fil)}</p>` : ''}${nav()}`;
      placer(); await attendre(j); if (j !== jeton) return;
    }
    placer(); setTimeout(() => j === jeton && placer(), 450); setTimeout(() => j === jeton && placer(), 1000);
  }
  const aller = (n) => { if (Date.now() < pret) return; pret = Date.now() + 600; confirmer = 0; i = Math.max(-1, Math.min(E.length, n)); vu = Math.max(vu, i); if (E[i]?.carte) garder(); montrer(); };
  // Les flèches pour naviguer dans la visite ; Échap la ferme seulement si elle n’est pas obligatoire.
  function touche(e) { if (e.key === 'ArrowRight' && i < E.length && i + 1 <= vu + 1) aller(i + 1); if (e.key === 'ArrowLeft' && i > 0) aller(i - 1); if (e.key === 'Escape' && !obligatoire) fin(false); }
  bulle.addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]'); const g = b?.dataset.g;
    if (g === 'suivant') aller(i + 1);
    if (g === 'avant') aller(i - 1);
    if (g === 'chap' && !bloque(+b.dataset.k)) aller(E.findIndex((x) => x.carte && x.k === +b.dataset.k));
    if (g === 'reprendre') aller(reprise);
    if (g === 'essai') { const c = visible(E[i].essai[1]); if (c) c.click(); else b.textContent = 'Pas disponible ici'; }
    if (g === 'fermer' || (g === 'plustard' && !obligatoire)) fin(false);
    // Obligatoire : « Finir plus tard » demande une confirmation, puis garde l’endroit où on est rendu.
    if (g === 'plustard' && obligatoire) {
      if (Date.now() < confirmer) { garder(); fin(false); return; }
      confirmer = Date.now() + 5000; b.textContent = 'Oui, plus tard : elle reprendra ici'; b.classList.add('gv-sur');
    }
    if (g === 'fini') fin(true);
  });
  addEventListener('resize', placer); addEventListener('keydown', touche);
  colonne(); addEventListener('resize', colonne);
  montrer();
}

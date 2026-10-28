// Coquille de l'application de Zaza & Frog : routage, micro, « pourquoi ça marche », contraintes, visite guidée.
import { $, $$, toast, store } from './ui.js';
import { toggleMic, onMicStatus, onPitch } from './audio.js';
import { MODULES } from './data.js';
import { POURQUOI, PLAN } from './duo.js';
import { currentMonth } from './plan.js';
import session, { activeSession } from './views/session.js';
import depart from './views/depart.js';
import evolution from './views/evolution.js';
import accord from './views/accord.js';
import relais from './views/relais.js';
import bilan from './views/bilan.js';
import jeux from './views/jeux.js';
import coffre from './views/coffre.js';
import lexique from './views/lexique.js';
import ecrireV from './views/ecrire.js';
import atelier from './views/atelier.js';
import corbeille from './views/corbeille.js';
import etincelles from './views/etincelles.js';
import oreille from './views/oreille.js';
import placer from './views/placer.js';
import ames from './views/ames.js';
import arbre from './views/arbre.js';
import materiel from './views/materiel.js';
import elan from './views/elan.js';
import cathedrale from './views/cathedrale.js';
import passage from './views/passage.js';
import calendrier from './views/calendrier.js';
import { aVoir } from './suivi.js';
import { mesTaches } from './taches.js';
import { installerFilet } from './filet.js';
import { installerMotOuvert } from './motoutil.js';
import { installerGlossaire } from './glossaire.js';
import { installerMetronome } from './metronome.js';
import { installerSilence } from './silence.js';
import { initEtincelle } from './etincelle.js';
import { maybeTour } from './views/tour.js';
import home from './views/home.js';
import miroir from './views/miroir.js';
import tessiture from './views/tessiture.js';
import gym from './views/gym.js';
import labo from './views/labo.js';
import studio from './views/studio.js';
import paroles from './views/paroles.js';
import carnet from './views/carnet.js';
import { boot, joinEspace, espace, onEspace } from './espace.js';

// Pourquoi chaque page existe, en une ligne, avec ses appuis.
const APPUIS = {
  home: ['Séances courtes et régulières plutôt que rares et longues ; une vision commune avant de composer.', 'Rohrer 2004 · Merchán-Sánchez-Jara 2023'],
  carnet: ['Une idée passe par générer, écouter, construire, fixer, jouer : la rendre visible la fait avancer.', 'Biasutti 2018 · Aslan 2016'],
  session: ['Exploration, sélection, stabilisation, et toujours une prise ; le debrief nomme l’écart et la prochaine cible.', 'Biasutti 2017 · Montemayor 2014 · Marino 2023'],
  relais: ['Des contacts créatifs courts et rapprochés soutiennent l’élan mieux que de rares longues séances ; l’appel-réponse construit un vocabulaire commun.', 'Cepeda et al. 2006 · Bertolani 2019'],
  accord: ['Un retour visuel en temps réel améliore la justesse ; chanter dans de vrais accords entraîne l’oreille harmonique.', 'Welch, Howard & Rush 1989 · Hoppe et al. 2006'],
  oreille: ['Savoir où sont les parties, le tempo et la tonalité d’une pièce fait gagner des heures : on passe tout de suite à créer.', 'Krumhansl et Kessler 1982 · Müller 2015'],
  jeux: ['La contrainte libère : moins de choix, plus d’invention.', 'De Bruin 2019 · Merchán-Sánchez-Jara 2023 · Oulipo'],
  ecrire: ['Écrire régulièrement, sans juger, nourrit la matière ; trier vient après.', 'Pattison 2009'],
  atelier: ['Écriture libre, puis par les sens, puis sous contrainte, puis tri : de la matière à la ligne qui chante.', 'Pattison 2009 · Breton et Soupault 1919 · Oulipo'],
  bilan: ['Voir ses progrès et nommer la prochaine cible soutient la motivation et la pratique délibérée.', 'Miksza 2023 · Biasutti 2017'],
  paroles: ['Les syllabes chantées et la place des rimes font qu’un texte se chante.', 'Pattison 2009'],
  ames: ['Une vision commune avant de composer : savoir ensemble d’où on part et où on va.', 'Merchán-Sánchez-Jara 2023'],
  calendrier: ['Des séances courtes, régulières et planifiées d’avance tiennent mieux que les élans de dernière minute ; un rendez-vous fixé à deux est un engagement.', 'Rohrer 2004 · Gollwitzer 1999'],
  miroir: ['Voir sa hauteur pendant qu’on chante corrige la justesse plus vite que l’oreille seule.', 'Welch, Howard & Rush 1989'],
  tessiture: ['Chanter dans sa tessiture confortable ménage la voix : moins d’effort, moins de fatigue.', 'Titze 1994'],
  gym: ['Les exercices à conduit vocal semi-fermé (paille, lèvres, « vv ») échauffent la voix avec moins d’effort.', 'Titze 2006'],
  labo: ['Un rythme et un accord sont le même rapport de nombres, à deux vitesses : l’entendre change la façon de composer.', 'Cowell 1930 · Toussaint 2005'],
  studio: ['Improviser sur une boucle stable libère l’attention pour inventer ; c’est là que naît le vocabulaire.', 'Biasutti & Frezza 2009'],
  depart: ['Savoir d’où chacun part avant de composer : les objectifs, les voix, les styles, les besoins.', 'Merchán-Sánchez-Jara 2023'],
  evolution: ['Voir ses progrès dans le temps soutient la motivation et la pratique délibérée.', 'Miksza 2023'],
  etincelles: ['Une idée qui arrive hors séance vient souvent de l’incubation : la noter tout de suite évite de la perdre.', 'Wallas 1926'],
  elan: ['La création à plusieurs émerge des échanges : chacun reprend l’idée de l’autre et la transforme.', 'Sawyer 2003'],
  cathedrale: ['Hauteur, rythme et forme sont un seul continuum de durées.', 'Cowell 1930 · Stockhausen 1957'],
  passage: ['Revenir sur ce qu’on a fait avant de repartir : la pratique réflexive.', 'Schön 1983'],
  projet: ['Des objectifs précis et proches, avec un retour, font avancer davantage que des intentions vagues ; un cap commun avant de composer.', 'Locke & Latham 2002 · Merchán-Sánchez-Jara 2023'],
  placer: ['La prosodie : quand les syllabes accentuées tombent sur les temps forts, le texte se chante tout seul ; à côté, il boite.', 'Pattison 2009'],
};

const routes = { '': home, miroir, tessiture, gym, labo, studio, paroles, carnet, mur: carnet, session, depart, evolution, accord, relais, bilan, jeux, coffre, lexique, ecrire: ecrireV, atelier, corbeille, etincelles, oreille, placer, ames, arbre, materiel, nouvelles: home, elan, cathedrale, passage, calendrier, projet: home };
// Onglet en arrière-plan : le titre compte ce que l'autre vient d'ajouter, « (2) FLIP ». Revenir remet à zéro.
{
  const base = document.title; let n = 0;
  onEspace((w, extra) => {
    if (w !== 'entries' || !document.hidden) return;
    n += (extra?.fresh || []).filter((e) => e.author && e.author !== espace.me).length;
    if (n) document.title = `(${n}) ${base}`;
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { n = 0; document.title = base; } });
}
initEtincelle();
// Quatre lieux, rangés par ce qu'on y fait : aujourd'hui, nos idées, écrire, jouer (la Session est à part).
// Chaque lieu a sa barre de sous-onglets. La voix et les disques ne sont plus des lieux à eux : ce sont des
// sous-onglets de Jouer, avec une petite rangée de pastilles pour leurs pages.
const VOIX = ['accord', 'miroir', 'tessiture', 'gym'];
const LABO = ['cathedrale', 'labo'];
const PROJET = ['projet', 'depart', 'ames']; // notre projet, et ses deux sections : d'où chacun part, ce que ça donne à deux
const LIEUX = {
  home: { nom: 'Accueil', pages: ['', 'calendrier', 'projet', 'bilan', 'passage'], aussi: ['nouvelles', 'ames', 'depart', 'evolution', 'arbre', 'elan'] },
  carnet: { nom: 'Nos idées', pages: ['carnet', 'relais', 'coffre'], aussi: ['mur', 'corbeille', 'etincelles'] },
  ecrire: { nom: 'Écrire', pages: ['ecrire', 'paroles', 'placer', 'jeux', 'lexique'], aussi: ['atelier'] },
  studio: { nom: 'Jouer', pages: ['studio', 'accord', 'oreille', 'cathedrale', 'materiel'], aussi: [...VOIX, ...LABO] },
};
const NOMS = { '': ['☼', 'Aujourd’hui'], calendrier: ['◷', 'Calendrier'], projet: ['✦', 'Notre projet'], bilan: ['↗', 'Notre bilan'], passage: ['☾', 'Nos lunes'],
  carnet: ['▦', 'Le mur'], relais: ['⇄', 'Nos échanges'], coffre: ['✧', 'Le coffre'],
  ecrire: ['✎', 'Écrire'], paroles: ['¶', 'Paroles'], placer: ['↧', 'Placer mes paroles'], jeux: ['✺', 'Le grimoire'], lexique: ['Aa', 'Notre lexique'],
  studio: ['♪', 'Jouer'], accord: ['♫', 'Ma voix'], oreille: ['◎', 'L’oreille'], cathedrale: ['✶', 'La cathédrale'], materiel: ['⌂', 'Mon studio'] };
const NOMS_FAM = { projet: 'Le cap et le plan', depart: 'Notre point de départ', ames: 'Nos deux âmes' };
const lieuDe = (id) => Object.keys(LIEUX).find((k) => LIEUX[k].pages.includes(id) || LIEUX[k].aussi.includes(id)) || null;
const view = $('#view');
installerGlossaire(view); // les mots de musique s'expliquent au survol
installerFilet(); // le filet : la dernière minute, toujours gardée
installerMotOuvert(); // double-clic sur un mot : ses rimes et ses synonymes
installerMetronome(); // le métronome des prises : un clic par temps, et un décompte
installerSilence(() => route()); // « ■ Arrêter le son », partout, dès que quelque chose joue
let cleanup = null;
let currentId = 'home';

// Le petit lien « Retour au plan » en haut de page : il nomme l’objectif du mois en cours, ou se cache s’il n’y a pas de plan.
function majRetour() {
  const back = document.querySelector('.retour-plan');
  if (!back) return;
  const m = espace.meta?.plan ? currentMonth() : 0; const goal = m ? PLAN[m - 1] : null;
  back.innerHTML = `← Accueil${goal ? ` <span>· mois ${m} : ${goal.titre}</span>` : ''}`;
}
onEspace((w) => { if (w === 'meta') majRetour(); });

// Les outils de Jouer (le micro, la prise de Mon studio, le filet) : dans la barre de Jouer. Ailleurs, ils ne se
// montrent dans l'en-tête que s'ils sont allumés, pour qu'on puisse toujours les éteindre.
function placerOutils(barre) {
  const outils = ['#micBtn', '#priseBtn', '#filetBtn'].map((x) => $(x)).filter(Boolean);
  if (barre) { let w = barre.querySelector('.sub-outils'); if (!w) { w = document.createElement('div'); w.className = 'sub-outils'; barre.append(w); } outils.forEach((o) => { o.classList.remove('hors-lieu'); w.append(o); }); return; }
  const t = $('.tools'); outils.reverse().forEach((o) => { o.classList.add('hors-lieu'); t.prepend(o); });
}
// Le routeur : lit l’adresse après le #, choisit la vue, la monte dans la page et met à jour la navigation, le titre et l’aide.
async function route() {
  const id = location.hash.replace(/^#\/?/, '').split(/[?/]/)[0];
  // Lien d'invitation : #/rejoindre/<espace>
  // Aperçu de la visite de Frog : elle se joue sans être marquée comme vue pour lui.
  if (id === 'apercu-visite') {
    location.replace('#/');
    // Appareil pas encore connecté : on le dit, et l'aperçu démarrera dès la connexion.
    if (!espace.id) { store.set('apercuApres', true); toast('Pour voir la visite de Frog : choisis ton nom et entre votre mot secret. Elle démarrera toute seule.'); return; }
    import('./views/tour.js').then((t) => { const go = (n = 0) => (espace.meta ? t.startTour(true) : n < 40 && setTimeout(() => go(n + 1), 250)); go(); });
    return;
  }
  if (id === 'rejoindre') {
    const sid = location.hash.split('/')[2];
    try { await joinEspace(sid); } catch { toast('Ce lien d’espace ne fonctionne pas (ou l’espace a été effacé).'); }
    location.replace('#/');
    maybeTour();
    return;
  }
  const v = routes[id] || home;
  cleanup?.();
  cleanup = null;
  // Conteneur neuf à chaque module : ses écouteurs disparaissent avec lui.
  const host = document.createElement('div');
  host.className = `view-${v.id}`;
  placerOutils(null); // les outils de Jouer reviennent dans l'en-tête avant que l'ancienne barre disparaisse
  view.replaceChildren(host);
  const ici = routes[id] && id !== 'nouvelles' ? id : ''; // la route elle-même (Nos nouvelles vivent dans Aujourd'hui)
  const lieu = lieuDe(ici === '' ? '' : ici === 'mur' ? 'carnet' : ici) || lieuDe(v.id);
  if (lieu) {
    const sub = document.createElement('nav');
    sub.className = 'subnav';
    sub.setAttribute('aria-label', LIEUX[lieu].nom);
    // Le sous-onglet actif : la page elle-même, ou sa famille (toute page de voix allume « Ma voix »).
    const actif = (m) => m === ici || (m && m === v.id) || (m === 'accord' && VOIX.includes(v.id)) || (m === 'cathedrale' && LABO.includes(v.id)) || (m === 'projet' && PROJET.includes(ici));
    sub.innerHTML = `<div class="sub-l">${LIEUX[lieu].pages.map((m) => { const mm = MODULES.find((x) => x.id === m); const [num, nom] = NOMS[m] || [mm?.num || '', mm?.name || m]; return `<a href="#/${m}" class="${actif(m) ? 'active' : ''}" style="--c:${mm?.color || 'var(--c-studio)'}"><span class="mono">${num}</span>${nom}</a>`; }).join('')}</div>`;
    view.prepend(sub);
    // Une famille de pages (la voix, les disques) : ses pastilles, juste sous la barre.
    const fam = VOIX.includes(v.id) ? VOIX : LABO.includes(v.id) ? LABO : PROJET.includes(ici) ? PROJET : null;
    if (fam) { const p = document.createElement('nav'); p.className = 'sub-fam'; p.setAttribute('aria-label', fam === VOIX ? 'Ma voix' : fam === LABO ? 'La cathédrale' : 'Notre projet'); p.innerHTML = fam.map((m) => { const mm = MODULES.find((x) => x.id === m); return `<a href="#/${m}" class="${m === ici ? 'active' : ''}">${NOMS_FAM[m] || mm?.name || m}</a>`; }).join(''); sub.after(p); }
    // Sur téléphone, le sous-onglet actif reste visible même s'il est le dernier.
    requestAnimationFrame(() => { const l = sub.querySelector('.sub-l'); const act = sub.querySelector('.active'); if (act && l.scrollWidth > l.clientWidth) l.scrollLeft = act.offsetLeft - 16; });
  }
  placerOutils(lieu === 'studio' ? view.querySelector('.subnav') : null);
  const mod = MODULES.find((m) => m.id === v.id);
  view.style.setProperty('--accent', mod ? mod.color : 'var(--rec)');
  currentId = v.id;
  // « ?voir=… » : on amène l'élément sous les yeux et on le fait briller un instant (Nos nouvelles, la tresse…).
  const voir = (location.hash.match(/[?&]voir=([\w-]+)/) || [])[1];
  if (voir && v.id !== 'carnet') { let n = 0; const cherche = () => { const t = host.querySelector(`[data-id="${CSS.escape(voir)}"]`); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.add('vise'); setTimeout(() => t.classList.remove('vise'), 2600); } else if (n++ < 20) setTimeout(cherche, 150); }; setTimeout(cherche, 200); }
  host.classList.add('entering');
  setTimeout(() => host.classList.remove('entering'), 900);
  cleanup = v.mount(host) || null;
  const ap = APPUIS[ici === 'projet' ? 'projet' : v.id];
  if (ap) { const f = document.createElement('p'); f.className = 'appui'; f.innerHTML = `<span>Pourquoi :</span> ${ap[0]} <cite>${ap[1]}</cite>`; view.appendChild(f); }
  const group = lieu || v.id;
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.id === group));
  if (v.id === 'carnet') { unseen = 0; showBadge(); }
  document.title = mod ? `${mod.name} · Diapason Labo` : 'Diapason Labo · FLIP';
  renderPistes();
  window.scrollTo({ top: 0 });
}
window.addEventListener('hashchange', route);
// Le petit secret : FLIP retourné, c'est PLIF. Le bruit d'une goutte. Le feu et l'eau.
document.querySelector('.logo-flip')?.addEventListener('click', (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  f.classList.toggle('flipped');
  if (f.classList.contains('flipped')) { toast('FLIP retourné : PLIF. Le bruit d’une goutte. Le feu et l’eau.'); setTimeout(() => f.classList.remove('flipped'), 4000); }
});

// --- Micro global ---
const micBtn = $('#micBtn');
micBtn.addEventListener('click', async () => {
  const ok = await toggleMic();
  if (ok === false && !micBtn.classList.contains('on')) return;
});
onMicStatus((on, err) => {
  micBtn.classList.toggle('on', on);
  micBtn.setAttribute('aria-pressed', on);
  micBtn.querySelector('.mic-label').textContent = on ? 'Micro ouvert' : 'Micro fermé';
  micBtn.title = on ? 'Le micro est ouvert : Voix, Miroir et Empreinte t’entendent. Touche pour le fermer.' : 'Ouvrir le micro (pour chanter dans Voix, Miroir, Empreinte)';
  if (err) toast('Micro refusé. Autorise-le dans la barre d’adresse du navigateur.');
});
onPitch((p, rms) => {
  micBtn.style.setProperty('--lvl', Math.min(1, rms * 12).toFixed(3));
});

// --- Pourquoi ça marche : la recherche, section par section ---
const drawer = $('#drawer');
const scrim = $('#scrim');
// Remplit le tiroir « Pourquoi » avec les appuis de la page ouverte (les pages de la voix partagent les mêmes).
function renderPistes() {
  const key = VOIX.includes(currentId) ? 'voix' : currentId;
  const p = POURQUOI[key] || POURQUOI.home;
  $('#drawerBody').innerHTML = `
    <p class="drawer-intro">${p.titre}</p>
    <ul class="research">${p.points.map(([t, src]) => `<li><p>${t}</p><cite>${src}</cite></li>`).join('')}</ul>
    <div class="hors"><b>La source</b><p>La recherche Consensus de Zaza : « deux personnes qui souhaitent jouer de la musique ensemble », de la préparation à la composition originale.</p></div>
    <p class="fineprint">Le micro est analysé en direct sur l’appareil. Ce que vous ajoutez au mur est stocké dans votre espace à deux.</p>`;
}
// Ouvre ou ferme le tiroir latéral, avec son voile, et garde l’accessibilité à jour (aria-hidden).
function openDrawer(open) {
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', !open);
  scrim.hidden = !open;
  if (open) $('#drawerClose').focus();
}
$('#pistesBtn').addEventListener('click', () => openDrawer(!drawer.classList.contains('open')));
// « ⋯ Plus » : les outils occasionnels (le coffre, pourquoi ça marche, la contrainte surprise, le grand texte).
const plusBtn = $('#plusBtn'); const plusPop = $('.plus-pop');
const plusOuvert = (on) => { plusPop.hidden = !on; plusBtn.setAttribute('aria-expanded', on); };
plusBtn.addEventListener('click', (e) => { e.stopPropagation(); plusOuvert(plusPop.hidden); });
plusPop.addEventListener('click', () => setTimeout(() => plusOuvert(false), 0));
document.addEventListener('click', (e) => { if (!plusPop.hidden && !e.target.closest('.plus-menu')) plusOuvert(false); });
addEventListener('hashchange', () => plusOuvert(false));
$('#drawerClose').addEventListener('click', () => openDrawer(false));
scrim.addEventListener('click', () => openDrawer(false));

window.addEventListener('keydown', (e) => { if (e.key === 'Escape') openDrawer(false); });
document.documentElement.classList.remove('projector'); store.set('projector', false); // l'ancien « grand texte » est retiré
// La taille du texte (menu ⋯) : A, A+, A++ ; gardée sur cet appareil (Frog, qui joue loin de l'écran, peut grossir).
const TAILLES = [18, 20, 22];
const appliquerTaille = (px) => { const t = TAILLES.includes(px) ? px : 18; document.documentElement.style.fontSize = `${t}px`; document.querySelectorAll('[data-taille]').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.taille === t)); };
appliquerTaille(store.get('taille', 18));
document.addEventListener('click', (e) => { const b = e.target.closest('[data-taille]'); if (!b) return; store.set('taille', +b.dataset.taille); appliquerTaille(+b.dataset.taille); });

// Le vrai plein écran : la barre du navigateur disparaît. Sur iPhone, le navigateur ne le permet pas pour une page :
// on explique comment ajouter l'app à l'écran d'accueil, d'où elle s'ouvre déjà sans barre.
const fsBtn = $('#fsBtn');
const enPleinEcran = () => !!(document.fullscreenElement || document.webkitFullscreenElement) || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
const majFs = () => { const on = enPleinEcran(); fsBtn.setAttribute('aria-pressed', on); fsBtn.title = on ? 'Quitter le plein écran' : 'Plein écran (cache la barre du navigateur)'; document.documentElement.classList.toggle('plein-ecran', on); };
fsBtn.addEventListener('click', async () => {
  const d = document.documentElement;
  if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
  const req = d.requestFullscreen || d.webkitRequestFullscreen;
  if (req) { try { await req.call(d, { navigationUI: 'hide' }); return; } catch { /* refusé : on explique */ } }
  toast(/iPhone|iPod/.test(navigator.userAgent) ? 'Sur iPhone : touche Partager, puis « Sur l’écran d’accueil ». FLIP s’ouvrira de là, sans barre.' : 'Ce navigateur refuse le plein écran. Ajoute FLIP à l’écran d’accueil : il s’ouvrira sans barre.');
});
['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, majFs));
majFs();

// Pastille « nouveau » sur Carnet quand le duo ajoute quelque chose ailleurs dans l'app.
let unseen = 0;
// La pastille du Mur : le nombre de nouveautés que je n’ai pas encore vues (9+ au-delà).
function showBadge() {
  const b = $('#nav [data-id=carnet] .badge');
  b.hidden = !unseen;
  b.textContent = unseen > 9 ? '9+' : unseen;
}
// Pastille sur Plan : ce que l'autre a ajouté et que je n'ai pas encore vu (Nos nouvelles).
function majNouvelles() {
  const b = $('#nav [data-id=home] .nv-badge'); if (!b) return; const v = aVoir().length; const t = mesTaches().length; const n = v + t;
  b.hidden = !n; b.textContent = n > 9 ? '9+' : n; b.title = [v ? `${v} nouvelle${v > 1 ? 's' : ''} à voir` : '', t ? `${t} chose${t > 1 ? 's' : ''} à faire pour toi` : ''].filter(Boolean).join(' · ');
}
onEspace((what) => { if (what === 'entries' || what === 'meta') majNouvelles(); });
// Nos nouvelles sont tout en haut d'Aujourd'hui : toucher la pastille mène à l'accueil, comme le reste du bouton.
onEspace((what, extra) => {
  if (what === 'entries') $('#nav .nav-session').classList.toggle('live', !!activeSession());
  if (what === 'entries' && extra?.fresh?.length && currentId !== 'carnet') {
    unseen += extra.fresh.length;
    showBadge();
    if (!['paroles', 'home', 'session'].includes(currentId) && extra.fresh[0].type !== 'session') { const f = extra.fresh[0]; toast(`${f.editedBy || f.author} ${f._nouveau ? 'a ajouté' : 'a modifié'} « ${(f.title || 'quelque chose').slice(0, 50)} ».`); }
  }
});

boot().then(() => { maybeTour(); import('./nouveautes.js').then((n) => { n.majAvecAmour(); n.guetterVersions(); const b = document.querySelector('.brand small'); if (b && !b.dataset.v) { b.dataset.v = n.VERSIONS[0].v; b.textContent += ` · ${n.VERSIONS[0].v}`; } }); import('./sonsperso.js').then((m) => m.chargerSonsPerso()); });
route();

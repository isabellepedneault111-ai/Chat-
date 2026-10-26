// Nouveau pour toi : ce que l'autre a fait depuis ta dernière visite, et ce qu'il n'a pas encore vu de toi.
// Pas de notification qui sonne : une liste calme, en haut de l'accueil, qui se vide quand on a regardé.
import { espace, profileOf } from './espace.js';
import { MEMBERS, STAGES } from './duo.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MUR = new Set(['note', 'texte', 'audio', 'lien', 'image', 'essai', 'paroles']);
const titre = (e) => `« ${esc((e.title || 'sans titre').slice(0, 60))} »`;
const quand = (t) => new Date(t).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
// La visite précédente est figée au premier affichage de la page : la liste ne s'efface pas sous les yeux.
const fige = {};

export function nouveautesHTML() {
  if (!espace.connected || !espace.me) return '';
  const k = `${espace.id}:${espace.me}`;
  if (!(k in fige)) fige[k] = espace.meta.seen?.[espace.me] || 0;
  const depuis = fige[k];
  const mem = espace.meta.members || MEMBERS;
  const o = mem.find((m) => m !== espace.me) || 'l’autre';
  const de = (e) => e.author === o && !e.demo && !e.data?.demo;
  const items = [];
  if (depuis) {
    const neufs = espace.entries.filter((e) => de(e) && e.createdAt > depuis);
    const relais = neufs.filter((e) => e.data?.relais);
    if (relais.length) items.push([`${relais.length} ${relais.length > 1 ? 'envois' : 'envoi'} au relais : ${relais.slice(0, 2).map(titre).join(', ')}`, '#/relais']);
    const rencontres = neufs.filter((e) => e.data?.rencontre?.length === 2 && !e.data?.pochette);
    rencontres.slice(0, 2).forEach((e) => items.push([`a fait se rencontrer deux idées : ${titre(e)}`, '#/carnet']));
    const mur = neufs.filter((e) => MUR.has(e.type) && !e.data?.relais && !e.data?.rencontre && !e.data?.journal && !e.data?.atelier && !e.data?.etincelle && !e.data?.exemple);
    if (mur.length) items.push([`${mur.length > 1 ? `${mur.length} idées` : 'une idée'} au mur : ${mur.slice(0, 3).map(titre).join(', ')}`, '#/carnet']);
    const pochettes = neufs.filter((e) => e.data?.pochette);
    if (pochettes.length) items.push([`une pochette : ${titre(pochettes[0])}`, '#/carnet']);
    const pages = neufs.filter((e) => e.data?.journal || e.data?.atelier).length;
    if (pages) items.push([`${pages} page${pages > 1 ? 's' : ''} au journal`, '#/ecrire']);
    const etincelles = neufs.filter((e) => e.data?.etincelle).length;
    if (etincelles) items.push([`${etincelles} étincelle${etincelles > 1 ? 's' : ''}`, '#/etincelles']);
    const montees = espace.entries.flatMap((e) => (e.data?.moves || []).filter((m) => m.by === o && m.at > depuis && m.to > m.from).map((m) => [e, m])).slice(-3);
    montees.forEach(([e, m]) => items.push([`a fait monter ${titre(e)} : ${esc(STAGES[m.to]?.label || '')}`, '#/carnet']));
    const reponses = espace.entries.filter((e) => e.author === espace.me && (e.data?.replies || []).some((r) => r.by === o && r.at > depuis));
    reponses.slice(0, 3).forEach((e) => items.push([`a répondu à ${titre(e)}`, '#/carnet']));
    const pf = profileOf(o);
    if (pf?.doneAt > depuis) items.push(['a fait son point de départ : votre portrait commun est prêt', '#/depart']);
  }
  // Ce que l'autre n'a pas encore vu de moi, depuis sa dernière visite.
  const sa = espace.meta.seen?.[o];
  const pasVu = sa ? espace.entries.filter((e) => e.author === espace.me && !e.demo && !e.data?.demo && e.createdAt > sa && (MUR.has(e.type) || e.data?.relais)) : [];
  const rappel = sa && !profileOf(o)?.doneAt ? `${esc(o)} n’a pas encore fait son point de départ.` : '';
  if (!items.length && !pasVu.length && !rappel) return '';
  return `<section class="nouveau">
    ${items.length ? `<p class="nouveau-k">Nouveau pour toi, depuis ${quand(depuis)}</p>
    <ul>${items.slice(0, 7).map(([t, h]) => `<li><a href="${h}"><b>${esc(o)}</b> ${t} →</a></li>`).join('')}</ul>` : ''}
    ${pasVu.length || rappel ? `<p class="nouveau-attente">${pasVu.length ? `${esc(o)} n’a pas encore vu ${pasVu.length > 1 ? `tes ${pasVu.length} derniers ajouts` : `ton ${titre(pasVu[0])}`} (sa dernière visite : ${quand(sa)}).` : ''} ${rappel}</p>` : ''}
  </section>`;
}

// ---------- Les mises à jour, montrées une seule fois ----------
// À la première ouverture après une mise à jour, chacun voit une fois ce qui a changé : Frog, avec le mot de Zaza ;
// Zaza, avec l'aperçu de ce que Frog va découvrir. Chaque version garde sa liste : s'il en a manqué plusieurs, il les voit toutes, la plus récente en premier.
export const VERSIONS = [
  { v: '0.8', quand: '2026-10-26', titre: 'Les mots justes', items: [
    ['Le mot ouvert', ['Partout où l’on écrit (journal, paroles, Placer, relais…), <b>double-clique un mot</b> : ses syllabes, ses <b>rimes classées</b> de la plus riche à la plus simple (avec le nombre de syllabes de chacune, et un filtre « même nombre de syllabes »), et ses <b>synonymes par sens</b>, des plus courants aux plus rares.', 'Touche un synonyme : il remplace le mot (Ctrl+Z pour revenir). Touche une rime : elle est copiée, prête à finir une ligne.', 'Les synonymes viennent maintenant du dictionnaire libre de LibreOffice (myThes, 36 000 mots), <b>gardé dans l’app</b> : ils marchent même sans Internet.']],
    ['Nos inspirations, précisément', ['Étape 1 → Mes styles : pour chaque artiste ou morceau, <b>ce que tu aimes dedans</b> (la rythmique, la voix, le texte, le son, l’ambiance…), une précision en mots, et <b>le moment exact</b> (« à 2:14 ») : le lien YouTube s’ouvre pile là. Jusqu’à six inspirations.', 'Le portrait dit <b>ce qu’on cherche tous les deux</b> dans une chanson, et Nos deux âmes en tire des pistes pour commencer (« Le groove d’abord », « La voix devant »…).']],
  ] },
  { v: '0.7', quand: '2026-10-26', titre: 'Rien de ce que tu joues ne se perd', items: [
    ['Le filet', ['Un nouveau bouton en haut, à côté de l’ampoule : <b>le filet</b>. Tendu, il garde toujours la <b>dernière minute</b> (ou 3, ou 5, au choix dans Mon matériel) de ce qui joue : le son de l’app, tes entrées audio, les notes de tes claviers MIDI.', 'Un beau moment vient de passer ? Touche le filet : la minute se fige. Chaque source a sa ligne, les notes MIDI aussi. <b>Glisse pour choisir le bout</b> (le silence avant et après est déjà coupé), coche les sources à mélanger, écoute.', 'Puis : <b>Garder au mur</b>, <b>L’oreille</b> (elle trouve les accords du bout), <b>⬇ WAV</b> pour le son, <b>⬇ MIDI</b> pour les notes, à ouvrir dans ton logiciel.', 'Rien ne quitte l’ordinateur tant que tu ne gardes pas le bout. Le filet se retend tout seul à ta prochaine visite. L’<b>anneau d’or</b> autour du bouton se remplit : plein, le filet a toute sa durée ; avant, il affiche depuis combien de temps il écoute.']],
    ['Mon matériel', ['Studio → <b>Mon matériel et le filet</b> : ton studio redessiné, vu d’en haut. <b>Détecter mon matériel</b> trouve tes entrées audio et tes claviers MIDI ; la Xone:4D, le SV-1 ou ce qui n’est pas branché à l’ordi s’ajoutent à la main, « branchés à » l’appareil qui les reçoit.', 'Une <b>case par appareil</b> : actif ou pas aujourd’hui. Les câbles s’allument, les témoins clignotent quand les notes passent, les niveaux bougent quand le son entre.', 'Glisse les appareils pour les placer comme dans ta pièce : l’app s’en souvient. Un clavier MIDI muet peut <b>sonner au piano</b> d’un clic.']],
  ] },
  { v: '0.6', quand: '2026-10-26', titre: 'Plus lisible, plus à toi', items: [
    ['Le studio t’écoute mieux', ['<b>Touche un accord</b> de la grille pour le changer sur place : sa note, sa couleur, sa durée. ▶ pour l’entendre, + pour en ajouter un après.', 'Le clavier : <b>coche ce que tu veux voir</b> (l’accord qui joue, la pentatonique, la gamme, les couleurs jazz, les notes blues). La légende montre chaque couleur sur une touche blanche <i>et</i> sur une touche noire : le rose foncé, c’est la pentatonique posée sur une noire.', 'Quand tu changes la <b>tonalité</b>, le clavier allume la note maison et son accord, et te le fait entendre. Un point d’or marque la tonique.']],
    ['Moins de défilement', ['En haut de chaque page, trois cases courtes : <b>Ça sert à · Tu peux · Ça nourrit</b>, en points, avec une petite image. Repliables d’un clic.', '<b>Sur cette page</b> reste collé en haut : un clic et tu sautes à la section.', 'Le menu ✚ Plus du mur ne passe plus derrière les autres éléments.']],
    ['L’arbre se lit au doigt', ['<b>Touche un point</b> de l’arbre : sa fiche s’ouvre (ce que fait le fichier dans ses propres mots, d’où il vient, quand il est né et a été retouché). Les sons s’écoutent de là.', 'Dans la généalogie, chaque point ouvre l’étape : ce qu’elle a fait, combien de fichiers et de lignes. ← → pour remonter le fil.']],
  ] },
  { v: '0.5', quand: '2026-10-25', titre: 'Tout ça, pour toi', items: [
  ['Tes accords à toi', ['Studio → <b>✎ Mes propres accords</b> : choisis chaque accord, sa couleur (maj7, sus2, m9…) et sa durée (1 temps à 2 mesures). Tout change en direct, pendant que ça joue.', '<b>Taper le tempo</b> : tape le bouton au rythme, le labo trouve les BPM.', 'Studio → <b>Nos chansons</b> : monte une toune entière, avec intro, couplet, refrain et pont, chacun avec ses accords, dans l’ordre que tu veux (Couplet 2 = le même couplet). ▶ Toute la chanson.', 'Le clavier en couleurs, avec sa légende : l’accord qui joue (sûr à 100 %), la pentatonique, le reste de la gamme, les couleurs jazz et les notes blues.']],
  ['L’oreille trouve tes accords', ['Enregistre un bout de ton clavier au micro, ou dépose un fichier : L’oreille te donne la suite d’accords, temps par temps. Un bouton l’envoie au studio pour improviser dessus.', 'Branché en MIDI, Studio → Mon instrument les lit en direct, encore plus juste.', 'Sur une pièce, elle dit maintenant <b>ce qui brille déjà</b> et <b>ce qui est à retravailler</b> (l’énergie qui retombe, une partie sans relief).', 'Sur une voix seule : les meilleures notes et celles à travailler, gardées dans le profil.']],
  ['Plus clair, partout', ['Les mots de musique sont soulignés en pointillé : passe dessus (ou touche-les) pour une explication simple. Les onglets du menu ont aussi leur aperçu.', 'L’accueil commence par <b>Par où commencer</b> : trois gestes, dans l’ordre.', '<b>Créer → Façonner → Produire</b> : on voit où en est notre musique, et quels outils servent à quel moment.', 'Séance : les grilles ont des noms clairs (« Vamp : deux accords en boucle »…), notre grille du studio y est proposée, et chaque exercice a son <b>Concrètement</b>, souvent avec un exemple à entendre.']],
  ['Rien ne se perd', ['Les prises du studio se gardent au mur d’un clic : l’autre les entend, et elles comptent dans le plan.', 'Écrire → <b>Nos idées pour le labo</b> : note ce que tu voudrais changer ou ajouter dans l’app.', 'Les essais d’hier sont effacés ; nos deux portraits sont gardés.']],
  ['Tu m’as demandé d’où venaient les sons', ['<b>L’arbre de l’architecte</b> (lien sur l’accueil) : toute la structure de Diapason Labo, dossiers et fichiers, en un grand arbre. Et en dessous, d’où vient chaque son : la batterie est fabriquée en direct, le piano est enregistré, ta musique est la tienne. ▶ pour entendre chaque son.', 'Et tu peux <b>remplacer chaque son de batterie par le tien</b> : ● Mon son (tu frappes, le labo garde le coup) ou un fichier. Il joue partout, pour nous deux : Studio → Beat → Nos sons de batterie.']],
  ['Pour nous deux', ['<b>Nos deux âmes</b> : l’arc et le triskel, ce que nos deux étapes 1 donnent ensemble, nos frottements féconds, et huit pistes hors sentier tirées de nos propres mots.', '<b>Placer mes paroles</b> : sur Projet 1 ou Joy Walk, où poser les accents, combien de syllabes, quelle note chanter.']],
] },
];
const cle = (v) => `diapason:maj:version ${v}:${espace.id}`;
export function majAvecAmour() {
  if (!espace.connected || !espace.me) return;
  const mem = espace.meta.members || MEMBERS; const frog = espace.me === mem[1];
  if (frog && !espace.meta.tour?.[espace.me]) return; // la première fois, c'est la visite qui accueille
  let neuves;
  try { neuves = VERSIONS.filter((x) => !localStorage.getItem(cle(x.v))); } catch { return; }
  if (!neuves.length) return;
  const z = mem[0]; const [une, ...avant] = neuves;
  const liste = (x) => `<div class="maj-liste">${x.items.map(([t, l]) => `<section><h3>${t}</h3><ul>${l.map((y) => `<li>${y}</li>`).join('')}</ul></section>`).join('')}</div>`;
  const box = document.createElement('div'); box.className = 'maj'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', `Nouveautés de la version ${une.v}`);
  box.innerHTML = `<div class="maj-carte">
    <p class="maj-v">Diapason Labo · version ${une.v}</p>
    <h2>${une.titre}.</h2>
    ${frog ? `<p class="maj-pourquoi">Chacune de ces mises à jour a été faite dans un seul but : te rendre heureux, créatif… et séduit par moi. <span>— ${esc(z)}</span></p>`
    : `<p class="maj-pourquoi">Le résumé de ce qui a changé. ${esc(mem[1])} verra cette même liste une fois, à sa prochaine ouverture, avec ton mot : « te rendre heureux, créatif… et séduit par moi ».</p>`}
    ${liste(une)}
    ${avant.map((x) => `<details class="maj-avant"><summary>Et avant, la version ${x.v} : ${x.titre.toLowerCase()}</summary>${liste(x)}</details>`).join('')}
    <div class="maj-row"><a class="btn" href="#/arbre" data-maj="ok">Voir l’arbre</a><button class="btn primary" data-maj="ok">Allons-y</button></div>
  </div>`;
  document.body.appendChild(box);
  box.addEventListener('click', (e) => { if (e.target.closest('[data-maj]') || e.target === box) { try { neuves.forEach((x) => localStorage.setItem(cle(x.v), '1')); } catch { /* tant pis, elle reviendra */ } box.remove(); } });
}

// Nouveau pour toi : ce que l'autre a fait depuis ta dernière visite, et ce qu'il n'a pas encore vu de toi.
// Pas de notification qui sonne : une liste calme, en haut de l'accueil, qui se vide quand on a regardé.
import { espace, profileOf } from './espace.js';
import { MEMBERS, STAGES } from './duo.js';
import { deLautre, vu } from './suivi.js';

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
  const nv = deLautre(); const nvAVoir = nv.filter((e) => !vu(espace.me, e.id)).length;
  const lienNv = nv.length ? `<a class="nouveau-tout" href="#/nouvelles">Nos nouvelles${nvAVoir ? ` : <b>${nvAVoir} à voir</b>` : ''}, avec les cases « vu » et « j’ai fait ça » →</a>` : '';
  if (!items.length && !pasVu.length && !rappel) return lienNv ? `<section class="nouveau">${lienNv}</section>` : '';
  return `<section class="nouveau">${lienNv}
    ${items.length ? `<p class="nouveau-k">Nouveau pour toi, depuis ${quand(depuis)}</p>
    <ul>${items.slice(0, 7).map(([t, h]) => `<li><a href="${h}"><b>${esc(o)}</b> ${t} →</a></li>`).join('')}</ul>` : ''}
    ${pasVu.length || rappel ? `<p class="nouveau-attente">${pasVu.length ? `${esc(o)} n’a pas encore vu ${pasVu.length > 1 ? `tes ${pasVu.length} derniers ajouts` : `ton ${titre(pasVu[0])}`} (sa dernière visite : ${quand(sa)}).` : ''} ${rappel}</p>` : ''}
  </section>`;
}

// ---------- Les mises à jour, montrées une seule fois ----------
// À la première ouverture après une mise à jour, chacun voit une fois ce qui a changé : Frog, avec le mot de Zaza ;
// Zaza, avec l'aperçu de ce que Frog va découvrir. Chaque version garde sa liste : s'il en a manqué plusieurs, il les voit toutes, la plus récente en premier.
export const VERSIONS = [
  { v: '0.18', quand: '2026-10-26', titre: 'Voir les accords', items: [
    ['Chaque accord, dessiné sur un clavier', ['Partout où l’on choisit un accord, on voit les touches à jouer : la fondamentale en braise, les autres notes en or, leur nom dessous. Ce sont les touches exactes qu’on entend en cliquant ▶. Dans la rangée du studio, dans la fenêtre d’un accord, dans tes propres accords, dans les chansons, dans L’oreille, dans « Mon instrument ».', 'Les notes sont bien orthographiées : Sol m7, c’est Sol – Si♭ – Ré – Fa (pas La♯).']],
    ['« Studio » devient « Jouer »', ['L’onglet du beat, des accords, des chansons et des prises s’appelle maintenant <b>Jouer</b>, comme Écrire juste à côté. « Mon studio », c’est la pièce et le matériel (la prise, en haut) : les deux ne se confondent plus.']],
    ['Chacun son studio', ['Zaza aussi peut recréer sa pièce et ses instruments ; chacun voit le studio de l’autre.']],
    ['Le clavier d’impro, plus clair', ['D’emblée, seulement <b>l’accord qui joue</b>. La pentatonique, le reste de la gamme, les couleurs jazz, les notes blues et la tonique se cochent au besoin, chacune dans une couleur franche, bien distincte (lisible aussi pour les daltoniens). Une touche qui répond à plusieurs demandes porte toutes leurs couleurs, en bandes côte à côte.', 'Le point sur une touche, c’est la <b>tonique</b> : la note « maison » où l’on revient pour conclure. Il a maintenant sa place dans la légende.']],
    ['La barre du haut, rangée', ['Les outils sont regroupés par famille : capter (micro, mon studio, filet), les lieux à part (labo, coffre), les coups de pouce (pourquoi ça marche, défi), l’affichage. Au survol, chaque icône dit tout de suite ce qu’elle fait. Sur une tablette ou un petit portable, rien ne déborde.']],
  ] },
  { v: '0.17', quand: '2026-10-26', titre: 'Mon studio', items: [
    ['Ton studio, tel qu’il est vraiment', ['Mon matériel devient <b>Mon studio</b> : ta pièce vue d’en haut, avec son plancher, la couleur des murs, tes meubles (bureau, tapis, canapé, bac à vinyles, panneaux acoustiques, plantes…) et tes appareils à leur place, à leur couleur, à leur taille, tournés comme chez toi. Les câbles vont jusqu’à l’ordinateur, ou jusqu’à la table où ils sont branchés.', 'Touche un appareil pour sa fiche ; glisse-le pour le placer. Une photo de toute la pièce peut servir de <b>calque</b> : on pose tout par-dessus, à la vraie place.']],
    ['Les photos de tes instruments', ['Dans la fiche de chaque appareil : <b>sa photo</b> (prise au cellulaire), sa marque, son modèle. La couleur sur le plan suit la photo, et la vraie photo peut remplacer le dessin. Tout est gardé dans votre espace : les photos prises au cellulaire apparaissent aussi sur l’ordinateur.', 'Une nouvelle tâche pour Frog : photographier son studio, appareil par appareil, puis toute la pièce.']],
    ['Le studio se voit', ['Sur l’accueil, une carte <b>Ton studio</b>. Et si le studio est partagé, l’autre le voit chez lui : la pièce, les appareils, leurs photos.']],
    ['Les listes', ['Le studio de Frog part d’un tapis rouge vin. Les puces ne sont plus en retrait : le texte s’aligne sur son titre, avec une courte marque dans la marge.']],
  ] },
  { v: '0.16', quand: '2026-10-26', titre: 'La cathédrale de ton jeu', items: [
    ['Une cathédrale bâtie sur ce que tu joues', ['Tends le filet, improvise une minute, puis, dans la cathédrale, touche « ◎ La cathédrale de mon jeu » (ou, dans la fenêtre du filet, « La cathédrale de ce bout »). L’app relève les accords que tu as tenus : combien de temps, combien de fois, dans quel ordre. La pédale de sustain compte.', 'L’accord qui revient le plus devient la clé de voûte. Chaque partie se pose sur un des accords qui reviennent, dans l’ordre où tu les as joués (Do, puis Lam, puis Fa…), en intonation juste ; la coda revient à l’accord principal. Avec un clavier MIDI, l’app lit tes notes exactes ; avec un micro ou une carte son, elle reconnaît les accords à l’oreille, un peu moins finement.']],
    ['La prise, en haut', ['Un bouton en forme de prise, à côté du filet, ouvre <b>Mon matériel</b> de partout : brancher un clavier, une carte son, un micro, et cocher ce qui est actif. Un petit chiffre vert dit combien d’appareils sont branchés et actifs.']],
  ] },
  { v: '0.15', quand: '2026-10-26', titre: 'Les disques et ce qu’on branche', items: [
    ['La cathédrale se règle avec des disques', ['Comme au labo : <b>un disque par nombre</b> de la clé de voûte. Pour chacun, on choisit son instrument (cordes, cor, harpe, célesta…), son volume, on le met en sourdine (M) ou on l’enlève (×). « + Un disque » ajoute une voix. Les disques tournent pendant que la cathédrale joue : chacun à sa vitesse, celle de son nombre.']],
    ['Ce que Frog branche', ['Un clavier MIDI, un contrôleur, une carte son avec un micro : « ● Écouter mon matériel », puis <b>tiens un accord</b>. La cathédrale le traduit en rapports justes (Do Mi Sol → 4:5:6) et propose d’en faire la clé de voûte. « Suivre mon jeu » l’applique au fil de ce que tu joues.', '<b>Jouer aussi sur</b> : la cathédrale peut envoyer ses notes à un appareil MIDI branché (synthé, logiciel de musique), chaque voix sur son canal. Les hauteurs y sont arrondies au demi-ton le plus proche : l’intonation juste reste dans le son de l’app.']],
    ['Le labo respire', ['Sur grand écran, les cercles et les réglages ne sont plus tassés à droite : les pistes s’étalent en grille à côté du radar, les réglages ont la place de respirer.']],
  ] },
  { v: '0.14', quand: '2026-10-26', titre: 'Le passage', items: [
    ['Le passage de la nouvelle lune', ['Un rituel à deux pour fermer un cycle avant d’en ouvrir un autre, en quatre temps : <b>relire</b> ce qu’on avait semé (et y laisser un mot), regarder <b>ce que le cycle a donné</b> (nos idées, nos échanges), choisir chacun <b>l’idée qu’on emporte</b>, puis <b>semer la lune qui vient</b>.', 'Il s’ouvre la dernière semaine du cycle, quand la lune décroît, et les premiers jours après la nouvelle lune (un bouton apparaît dans Notre cycle). Les lunes passées restent : la mémoire du duo, lune après lune.']],
    ['À faire pour toi', ['La pastille de Plan compte aussi <b>ce qui t’attend</b> : dire pourquoi tes inspirations t’inspirent, répondre à ce que l’autre t’a lancé, semer ou relire ton intention, faire le passage. Tout est en tête de Nos nouvelles et sur l’accueil, avec un lien direct ; chaque tâche s’efface d’elle-même quand c’est fait.']],
    ['Plus clair', ['Chaque temps de la lune dit sa période en mots simples (« la dernière semaine, quand la lune décroît »).', 'Relais : « Un fichier audio (mémo, son de l’ordi…) » au lieu de « Un mémo du téléphone ».']],
  ] },
  { v: '0.13', quand: '2026-10-26', titre: 'Notre cycle', items: [
    ['La lune devient notre horloge', ['Sur l’accueil, <b>Notre cycle</b> : la lune dans sa vraie phase, entourée de ses quatre temps, qui sont nos quatre gestes. <b>Semer</b> (les jours de la nouvelle lune) = créer ; <b>faire grandir</b> (les deux semaines où elle grossit) = façonner ; <b>faire entendre</b> (les jours de la pleine lune) = produire ; <b>laisser aller</b> (la dernière semaine, quand elle décroît) = trier et relire. Six lunes ≈ nos six mois : chaque cycle est un tour complet du processus.', 'Pour chaque temps : ce qu’il appelle, jusqu’à quand, et ses outils (le relais, nos chansons, les prises, le mur…). Et ce que le cycle a déjà donné : idées semées, idées qui ont grandi, prises entendues.']],
    ['Nos intentions, semées puis relues', ['Chacun <b>sème</b> son intention du cycle, à la nouvelle lune (ou en cours de route). <b>La dernière semaine du cycle</b>, quand la lune décroît, on la <b>relit</b> : a-t-elle été tenue, transformée, ou lâchée sans regret ?']],
    ['Ce qu’on se demande, au rythme de la lune', ['Dans le relais, « Ton intention » devient <b>« Ce que tu demandes à… »</b> (ce n’est pas la même chose que l’intention du cycle). La lune suggère quelques demandes (☾) : créer à la nouvelle lune, développer quand elle grossit, écouter à la pleine lune, trier quand elle décroît.']],
  ] },
  { v: '0.12', quand: '2026-10-26', titre: 'La grille, et le plein écran', items: [
    ['L’oreille écrit la grille', ['Après l’écoute, <b>la grille par mesures</b>, comme une feuille d’accords de musicien : 4 temps par mesure, « % » quand une mesure se répète, et la boucle repérée (‖: Rém | Sol7 | Do | % :‖ ×3). Le tempo de la grille se recale tout seul sur les changements d’accords.', 'Touche une mesure pour l’entendre. <b>Copier la grille</b> ou <b>⬇ la grille en texte</b>. Marche aussi sur un bout pris dans le filet.']],
    ['Nos chansons s’exportent', ['Studio → Nos chansons : <b>⬇ La partition (MIDI)</b>, accords au piano et basse, au tempo du studio (les mesures tombent juste dans ton logiciel), et <b>⬇ La grille (texte)</b>, partie par partie.']],
    ['Le vrai plein écran', ['Un nouveau bouton en haut (les quatre coins) : la barre du navigateur disparaît. Le bouton « Aa » à côté, c’est le grand texte pour jouer loin de l’écran.', 'Sur téléphone : ajoute FLIP à l’écran d’accueil (Partager → Sur l’écran d’accueil) ; il s’ouvre comme une app, sans barre, avec la flamme comme icône.']],
    ['Plus direct', ['Dans Nos nouvelles, chaque élément mène droit à lui : la fiche de l’idée s’ouvre au mur, la page du journal brille.', 'Notre vision devient un manifeste : la phrase qu’on veut faire ressentir en grand, nos tonalités sur un clavier, nos instruments côte à côte, nos références et leur pourquoi.', 'Une tâche pour chacun dans « Par où commencer » : <b>dire pourquoi nos inspirations nous inspirent</b>.']],
  ] },
  { v: '0.11', quand: '2026-10-26', titre: 'La cathédrale', items: [
    ['Quelques nombres, tout un orchestre', ['Labo → <b>La cathédrale</b>. Une clé de voûte (4 : 5 : 6 : 7, ou les disques que tu as fait tourner) est jouée à trois vitesses en même temps : très lente, elle donne <b>la forme</b> (des parties de durées 4, 5, 6, 7) ; moyenne, <b>le rythme</b> (4 contre 5 contre 6 contre 7, aux timbales, pizzicati, harpe, célesta) ; rapide, <b>l’harmonie</b> (le même rapport entre les fréquences, en intonation juste, ce que le piano ne peut pas jouer).', 'Le labo bâtit la cathédrale ; vous décidez <b>où mettre la lumière</b> : la famille qui chante chaque partie (cordes, bois, cuivres, chœur, harpe, célesta, ou presque rien), et un curseur du tout-rythme au tout-harmonie.', 'Puis : ▶ écouter, <b>⬇ WAV</b>, <b>⬇ MIDI</b> (une famille par piste, à reprendre dans ton logiciel), ou garder au mur.']],
    ['Un orchestre dans l’app', ['Onze nouvelles familles de sons enregistrés (FluidR3, licence MIT) : cordes, pizzicati, harpe, cor, cuivres, flûte, clarinette, hautbois, chœur, timbales, célesta. À entendre dans l’arbre.']],
    ['La tresse nourrit', ['Sur le plan, ce que l’autre t’a lancé et qui attend ta réponse devient <b>la prochaine chose à faire</b>. Et Nos deux âmes tire une piste de ce qui circule le plus entre vous.']],
    ['Plus clair', ['La pastille sur Plan mène droit à Nos nouvelles, et l’accueil les montre tout en haut.', '« Sur cette page » est maintenant une liste en colonne, dans le mandat ; plus bas, un petit bouton la rouvre. Les cases du mandat sont plus compactes.']],
  ] },
  { v: '0.10', quand: '2026-10-26', titre: 'Notre élan', items: [
    ['La tresse', ['Une nouvelle page, <b>Notre élan</b> (sur l’accueil, et depuis Nos nouvelles) : nos deux fils dans le temps, braise et mûre. Chaque création est un nœud sur son fil ; chaque réponse, un lien d’or d’un fil à l’autre.', 'Plus on échange un jour, plus les fils se rapprochent ; pendant une séance à deux, ils se croisent : plus vous jouez ensemble, plus ils se tressent. Les jours calmes, ils respirent.', 'Touche un nœud ou un lien : il raconte (« Frog a mis de la musique sur « Arcane majeur » de Zaza, le lendemain »). Et la page dit en mots qui lance, qui répond, en combien de temps, ce qui circule le plus et ce qui attend, sans hâte. Pas de score.']],
  ] },
  { v: '0.9', quand: '2026-10-26', titre: 'Tout ce que je t’envoie, au même endroit', items: [
    ['Nos nouvelles', ['Une pastille sur <b>Plan</b> compte ce que l’autre a ajouté et que tu n’as pas encore vu. L’accueil mène à <b>Nos nouvelles</b> : tout, jour par jour, avec deux cases. <b>Vu</b>, et <b>J’ai fait ça</b> quand on demandait quelque chose.', 'De l’autre côté, on voit ce que l’autre a vu et fait de nos envois. Même chose dans le relais, sous chaque envoi.']],
    ['Le relais en mots', ['Une carte de mots (une arcane, des paroles) se répond enfin : <b>● De la musique sur ces mots</b> (les mots restent sous tes yeux pendant que tu joues), <b>✎ Répondre en mots</b>, ou <b>Placer ces mots sur une pièce</b>.']],
    ['Le mur, épuré', ['Un champ, et cinq gestes en icônes : mémo vocal, fichier audio, image, bravo, bilan. Les filtres et le projet se cachent sous <b>Filtrer</b> ; les réglages, l’invitation et le lexique sous ⚙.', '<b>Créer un morceau</b>, même quand il n’y en a aucun : vue Morceaux → « Un nouveau morceau ». Il naît avec un couplet et un refrain au studio, et chaque idée du mur peut le rejoindre. Un morceau du mur et une chanson du studio, c’est maintenant la même chose.']],
    ['Nos couleurs', ['<b>Braise</b> pour Zaza (le feu de FLIP, la pointe de la flèche), <b>mûre</b> pour Frog (la nuit du studio). Lisibles, et distinctes même pour un daltonien.']],
    ['Plus stable', ['Séance, étape 4 : la page ne saute plus à chaque choix de grille, et les cartes ne débordent plus au téléphone.', 'Le filet a un vrai bouton <b>⏻ Arrêter le filet</b>.']],
  ] },
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

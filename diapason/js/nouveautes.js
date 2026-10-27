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

// Le bloc des nouveautés sur l’accueil : ce qui a changé depuis ma dernière visite.
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
  { v: '0.45', quand: '2026-10-28', titre: 'La relance douce', items: [
    ['Quand le fil de l’autre pâlit', ['Après cinq jours calmes de son côté, tes prochains pas te proposent de lui lancer quelque chose de simple : un son de 10 secondes, un mot, une photo. Une invitation, pas un rappel ; et elle se tait dès que tu viens de lui lancer quelque chose. <a href="#/relais">Ouvrir le relais →</a>']],
  ] },
  { v: '0.44', quand: '2026-10-28', titre: 'La tresse, un miroir fidèle', items: [
    ['Des faits, pas des compliments', ['La tresse dit les choses telles qu’elles sont, avec les chiffres : qui lance, combien de fois, qui répond. Une rétroaction exacte aide ; un éloge gonflé nuit. <a href="#/elan">Ouvrir la tresse →</a>']],
    ['Un fil qui brille quand on chemine', ['Chaque fil s’allume les jours où sa personne crée, répond ou joue, et pâlit doucement quand c’est calme. Pas de score, pas de reproche : un miroir, pour se voir à deux.']],
    ['Ces jours-ci', ['Le dernier geste de chacun, tel quel.']],
  ] },
  { v: '0.43', quand: '2026-10-28', titre: 'Transposer, et un séquenceur qui ne gèle plus', items: [
    ['Transposer d’un demi-ton', ['Dans Jouer, à côté de la tonalité : − et +. Tous les accords suivent, les tiens compris. Guitare avec un capo à la 4e frette : +4. <a href="#/studio">Ouvrir Jouer →</a>']],
    ['Le séquenceur ne gèle plus', ['Après une veille ou un onglet laissé en arrière-plan, la musique reprend au présent au lieu de tout rattraper d’un coup (ce qui figeait la page). Même correctif pour le labo, la cathédrale et les exercices.']],
    ['Le clavier, d’emblée utile', ['L’accord qui joue et la tonique sont cochés dès l’ouverture.']],
    ['Le calendrier, plus juste', ['Le calendrier d’abord ; des cartes à peu près proportionnelles à leur durée, en avant-midi, après-midi et soirée ; chaque sorte a son « 0 / 1 » ; et « Proposer une plage » disparaît dès que tu as proposé ta moitié de notre rythme.']],
  ] },
  { v: '0.42', quand: '2026-10-27', titre: 'Le calendrier, plus simple', items: [
    ['Proposer une plage, en quelques touches', ['La sorte en cartes de couleur, le jour dans un petit calendrier du mois (avec les lunes et les plages déjà prévues), l’heure et la durée en pastilles, puis le résumé avant d’envoyer. <a href="#/calendrier">Ouvrir le calendrier →</a>']],
    ['Toucher une lune ouvre son rituel', ['Sur place : l’heure exacte, ce que ce temps du cycle nous demande, les outils pour le faire, et de quoi réserver une plage ce jour-là.']],
    ['Nos prochains pas, au complet', ['S’y ajoutent ce que l’autre t’a demandé et que tu n’as pas encore fait, la plage à proposer quand notre rythme de la semaine n’est pas couvert, l’objectif de la semaine à fixer et la semaine passée à évaluer.']],
  ] },
  { v: '0.41', quand: '2026-10-27', titre: 'La grande visite, en profondeur', items: [
    ['Le fil d’une idée', ['La grande visite suit maintenant le chemin d’une idée, en huit chapitres : l’attraper, se retrouver, la jouer, la chanter, l’écrire, la pousser au labo, mesurer le chemin, puis l’envers du décor. On peut sauter d’un chapitre à l’autre. <a href="#/coffre">Ouvrir le coffre →</a>']],
    ['Chaque section, pas seulement chaque onglet', ['Les disques du labo (en haut), l’accélération jusqu’à la note, les liens, l’onde ; la cathédrale de la rosace jusqu’au MIDI ; des boutons pour entendre pendant la visite. Les icônes aussi : la prise, le filet, le micro et chaque outil du menu ⋯.']],
    ['L’arbre se montre', ['La visite touche elle-même un fichier de l’arbre, ouvre sa fiche et descend jusqu’à « Ce qu’il contient ». Presque chaque élément de chaque fichier a désormais son explication concrète.']],
  ] },
  { v: '0.40', quand: '2026-10-27', titre: 'La grande visite', items: [
    ['Tout Diapason Labo, en un tour', ['Trente arrêts : chaque onglet, chaque sous-onglet, chaque icône, un projecteur à la fois, environ cinq minutes. Elle est dans <b>le coffre</b> (menu ⋯, en haut à droite) : « La grande visite : tous les onglets ». <a href="#/coffre">Ouvrir le coffre →</a>', 'À sa prochaine ouverture, Frog la reçoit d’office : l’app a tellement changé depuis sa dernière visite qu’elle remplace, exceptionnellement, cette liste des nouveautés. Il peut la finir plus tard ; elle l’attendra.']],
    ['Le calendrier, cases égales', ['Toutes les cases du calendrier ont la même superficie, en semaine comme en mois.']],
  ] },
  { v: '0.39', quand: '2026-10-27', titre: 'Notre calendrier sacré', items: [
    ['Le temps qu’on se donne pour créer', ['Sous Accueil, un nouvel onglet : <b>Calendrier</b>. L’un propose une plage (séance en présence, séance à distance, projet professionnel, jeux et amusement, ou un repère comme une démo), l’autre l’approuve : elle prend alors <b>nos deux couleurs</b>. On peut aussi proposer autre chose, ou retirer.', 'En haut, notre rythme de la semaine : au moins <b>deux séances en présence</b> et <b>une à distance</b>. Une plage approuvée s’ajoute à ton agenda (Google, Apple, Outlook) d’un clic.']],
    ['Nos rituels lunaires', ['Nouvelle lune (le passage), premier quartier (faire grandir), pleine lune (faire entendre), dernier quartier (laisser aller) : chacun au bon jour, <b>à l’heure exacte</b>, calculés comme les éphémérides (Meeus) et affichés à l’heure du Québec.']],
    ['Nos prochains pas', ['Fini les « tâches » : <b>Nos prochains pas</b>, dans le calendrier. Les deux listes côte à côte : ceux que l’app voit (et qui mènent au bon endroit), et ceux qu’on se donne, pour soi ou pour nous deux, <b>à cocher</b>.']],
    ['Plus clair', ['Nos objectifs : « La dernière séance » dit sa cible, sa date, et ce que chacun en a dit (atteinte, en partie, pas encore, ou pas évaluée).', 'Le plan qui s’ajuste ne compte plus les coups d’œil d’une minute comme des pratiques, ni deux fois un exercice fait pendant une séance.', 'Les mots du sommaire, en haut de chaque page, mènent maintenant presque tous quelque part.', 'Mon studio : « Mes meubles », en rangée au-dessus de la pièce, pour choisir un meuble même caché sous un appareil (le bureau sous l’ordi).']],
  ] },
  { v: '0.38', quand: '2026-10-27', titre: 'Ton studio, à ta main', items: [
    ['Retirer, vraiment', ['Tout appareil a maintenant son bouton « Retirer de mon studio », même ceux que l’ordinateur détecte tout seul. Il ne revient plus à la détection suivante ; « Ignorés » le remet si on change d’idée.']],
    ['Les micros virtuels restent dehors', ['Les vrais micros arrivent seuls, comme avant. Les micros virtuels (Teams, Zoom, logiciels de visio) n’entrent plus d’office : ils sont proposés, avec « + Dans mon studio » ou « Ignorer », et « ignorer tous les virtuels » les écarte d’un geste. Le micro intégré de l’ordi (celui du MacBook) est branché à l’ordi.']],
    ['La couleur des meubles', ['Touche un meuble : douze teintes (chêne, noyer, noir, rouge vin, bleu nuit, vert forêt, moutarde…) ou n’importe quelle couleur. Les coussins et les motifs suivent, un ton plus clair.']],
  ] },
  { v: '0.37', quand: '2026-10-27', titre: 'L’exercice seul, avec un clavier qui joue pour toi', items: [
    ['La séance solo parle à celle ou celui qui la fait', ['Seul, plus d’écho à deux ni de « regardez-vous » : la séance solo pioche dans ce qui se fait seul (pentatonique, gamme, corps et souffle, pré-entendre, économie de matériau, un fragment en trois variations). Et les consignes sont dites <b>à toi</b> : à la voix pour Zaza, au clavier pour Frog.']],
    ['L’exemple en boucle', ['Dans l’exercice, <b>▶ L’exemple en boucle</b> : le clavier de l’app joue la partie que Frog jouerait (la gamme, la pentatonique sur un bourdon, une phrase à pré-entendre…), au tempo de l’exercice, et ses touches s’allument. Touche une note du clavier pour l’entendre.']],
    ['M’enregistrer', ['<b>● M’enregistrer</b>, pendant que l’exemple joue : tu réécoutes tout de suite, et « Garder au mur » si ça vaut la peine de la faire entendre.']],
    ['Les crédits', ['En bas de chaque page : Diapason Labo est conçu par <b>Zaza</b> et par <b>Frog</b>.']],
  ] },
  { v: '0.36', quand: '2026-10-27', titre: 'Chaque page dit pourquoi', items: [
    ['Le pourquoi, partout', ['Treize pages de plus affichent, en bas, <b>pourquoi elles marchent</b> et d’où ça vient : Miroir (Welch, Howard et Rush, 1989), Empreinte (Titze, 1994), Gym vocal (Titze, 2006), le labo (Cowell, 1930 ; Toussaint, 2005), Jouer (Biasutti et Frezza, 2009), l’étape 1, nos courbes, les étincelles (Wallas, 1926), notre élan (Sawyer, 2003), la cathédrale (Stockhausen, 1957), le passage (Schön, 1983) et Notre projet (Locke et Latham, 2002).', 'Les outils pour ranger et se repérer (le studio, les nouvelles, le coffre, le lexique, la corbeille, l’arbre) n’en ont pas : ils ne prétendent rien.']],
    ['Plus lisible', ['Quelques textes dorés et l’orange de Zaza sont un brin plus foncés : tout le texte de l’app atteint maintenant le contraste recommandé pour être lu sans effort (4,5 : 1). Le lexique et la corbeille ont leur sommaire.']],
  ] },
  { v: '0.35', quand: '2026-10-26', titre: 'Rien ne se cache derrière l’accueil', items: [
    ['L’accueil a ses sous-onglets', ['Comme Jouer, Voix et Labo : <b>Aujourd’hui · Notre projet · Notre bilan · Nos lunes</b>. Ce qu’on ouvrait seulement depuis l’accueil (le projet, le passage de lune) a maintenant une place fixe, toujours au même endroit.']],
    ['L’arbre dans « ⋯ »', ['L’arbre de l’app (son architecture, ses versions) est aussi dans le menu ⋯, en haut à droite.']],
    ['Nos courbes', ['Dans Notre bilan, à côté de Séance, Semaine et Mois : « Nos courbes → ».']],
  ] },
  { v: '0.34', quand: '2026-10-26', titre: 'Le labo entier dans la cathédrale', items: [
    ['« Bâtir La cathédrale de ces disques » emporte tout', ['Plus seulement les nombres : les <b>groupes</b> du labo deviennent des <b>pupitres</b> de l’orchestre, chaque son trouve son équivalent (grosse caisse → timbales, caisse claire → pizzicati, charley → célesta, claps → harpe), avec les volumes, les sourdines, la respiration et <b>les liens</b>.']],
    ['Les pupitres', ['Sous chaque disque, « pupitre A, B ou C ». Un pupitre se règle d’un geste : son instrument, son volume, sourdine, solo, respirer.']],
    ['Les liens, gardés dans l’œuvre', ['Un disque à chacune de ses frappes, la respiration, l’oscillation, le hasard et le chaos agissent sur un disque ou tout un pupitre : volume, hauteur, timbre, gauche-droite. Ils sont écrits dans la partition : <b>ils restent dans le WAV et le MIDI</b>.', 'Ta voix au micro, le clavier et la molette agissent pendant l’écoute seulement (marqués « en direct seulement »).']],
    ['Jouer · Mon studio · L’oreille', ['Jouer a ses sous-onglets, comme Voix et Labo. Dans Mon studio, une bascule <b>Le mien / Celui de Frog</b> (ou de Zaza) : le studio de l’autre est à un geste, et s’il n’est pas encore partagé, la page le dit.']],
  ] },
  { v: '0.33', quand: '2026-10-26', titre: 'Nos objectifs, du plus loin au plus près', items: [
    ['Quatre paliers', ['Dans <b>Notre projet</b>, une échelle : <b>dans six mois</b> (notre cap, il ne bouge presque pas), <b>ce mois-ci</b> (le plan), <b>cette semaine</b> et <b>cette séance</b>. Plus le palier est petit, plus il se vérifie vite : c’est là qu’on peut s’autoévaluer et se donner de la rétroaction.']],
    ['L’objectif de la semaine', ['Sur l’accueil, dans la carte du mois : « Cette semaine, on vise… ». L’un de vous deux le fixe, les deux le voient. En fin de semaine, chacun dit <b>atteint</b>, <b>en partie</b> ou <b>pas encore</b>, ce qui a aidé ou bloqué, et un mot pour l’autre. Si tu n’as pas évalué la semaine passée, l’accueil te le redemande.', 'Le bilan (onglet « Notre semaine ») garde toutes les semaines : ce qu’on visait, ce qu’on en a dit.']],
    ['La cible de la séance, évaluée', ['En rangeant une séance, chacun dit si la cible est atteinte, en partie, ou pas encore. Ça apparaît dans les traces des séances.']],
    ['Notre cap n’est pas un ressenti', ['Votre phrase « On a réussi à se faire deux vraies bonnes chansons… » est maintenant affichée pour ce qu’elle est : <b>notre cap dans six mois</b>. « Ce qu’on veut que les gens ressentent » devient une case à part, encore à décider ensemble (Modifier, dans Notre vision).']],
    ['Le temps de faire entendre, à notre mesure', ['À la pleine lune, plus besoin d’une prise complète d’un morceau fini : <b>soixante secondes</b>, d’un bout à l’autre, suffisent. Un original, ou <b>un cover à notre sauce</b> (60 s de Stolen Dance, par exemple), qu’on fait écouter à une personne. Le bouton « 60 s d’un cover à notre sauce » prépare la séance. Pas prêts? La pleine lune revient dans un mois.']],
    ['Orange', ['La couleur de Zaza devient un <b>orange brûlé</b> (le mauve reste à Frog), partout dans l’app.']],
    ['Plus léger en haut', ['L’accueil commence par « Diapason Labo » (FLIP reste dans le logo de la barre). Le micro devient une icône : un point gris quand il est fermé, rouge qui bat avec ta voix quand il est ouvert. Le Mur a une nouvelle icône : des cartes épinglées, comme vos idées. Au survol d’Accueil, l’aperçu n’affiche plus un chiffre collé au nom.']],
  ] },
  { v: '0.32', quand: '2026-10-26', titre: 'Un accueil pour aujourd’hui, une page pour le projet', items: [
    ['L’accueil garde le quotidien', ['Il ne montre plus que ce qui sert aujourd’hui : les nouvelles de l’autre, par où commencer, le mois en cours avec la prochaine séance, et la lune où on est rendus. L’onglet s’appelle maintenant <b>Accueil</b>, partout.']],
    ['« Ce qu’on bâtit, à deux »', ['Une carte en bas de l’accueil ouvre <b>Notre projet</b> : le plan des six mois, nos intentions, notre vision, ce qui nous inspire, puis ce que nos traces disent de nous (l’élan, nos deux âmes, le bilan, les bravos) et nos deux studios.', 'Le studio de l’autre y a toujours sa place : tant qu’il n’est pas partagé, la case l’attend.']],
    ['L’arbre descend', ['L’arbre de l’app (son architecture, ses versions) reste accessible par un petit lien tout en bas de l’accueil.']],
  ] },
  { v: '0.31', quand: '2026-10-26', titre: 'La rosace, et une barre plus claire', items: [
    ['La rosace de votre cathédrale', ['En haut de la cathédrale, un grand vitrail gothique calculé à partir de votre clé de voûte : un anneau de vitraux par nombre (du centre vers le bord), autant de vitraux que le nombre en demande, aux couleurs de la lumière choisie pour chaque partie ; des ogives au bord, du verre soufflé serti de plomb, des meneaux de pierre. Chaque clé donne une rosace unique.', 'Pendant l’écoute, la lumière tourne et l’anneau de la partie qui joue s’embrase. « ⬇ La rosace » l’enregistre en image (pour une pochette, par exemple).']],
    ['Labo devient un onglet', ['Le labo a sa place dans la barre, comme Jouer et Voix. Dedans, deux sous-onglets : <b>Le labo</b> (les disques) et <b>La cathédrale</b>.']],
    ['Micro et Voix ne se confondent plus', ['<b>Voix</b> (l’onglet, une note de musique) regroupe les outils pour chanter. Le bouton <b>Micro</b> dit maintenant son état : « Micro fermé » ou « Micro ouvert ». Ouvert, l’app entend ta voix ; rien n’est enregistré.']],
    ['« ⋯ Plus »', ['Les outils occasionnels (le coffre, pourquoi ça marche, la contrainte surprise, le grand texte) sont rangés dans un menu « ⋯ ». La barre ne garde à la vue que ce qui sert tout le temps : le micro, Mon studio, le filet, le plein écran.']],
  ] },
  { v: '0.30', quand: '2026-10-26', titre: 'Plus de coches', items: [
    ['Les notes tenues ne cochent plus', ['Pour durer, une note tenue (cordes, chœur, cors, cuivres, bois) fait tourner le milieu de son échantillon en boucle. La jointure tombait mal : un petit « coche » à chaque tour, environ toutes les deux secondes. Elle est maintenant fondue, comme dans un vrai échantillonneur. Mesuré : la flûte passe d’un saut 24 fois plus fort que la normale à 4,5 ; les cuivres de 19 à 8 ; le chœur de 16 à 6.', 'La cathédrale entre aussi moins fort dans la sortie de l’app : à plein orchestre, le limiteur ne craque plus. Partout où l’orchestre joue (la cathédrale, son WAV, Jouer), c’est corrigé.']],
  ] },
  { v: '0.29', quand: '2026-10-26', titre: 'Des mots-clés qui mènent quelque part', items: [
    ['Cliquer pour y aller', ['Dans Ça sert à, Tu peux et Ça nourrit, un mot-clé souligné mène quelque part : à la partie de la page qu’il nomme (« les liens », « la lampe », « le beat »… elle s’illumine un instant), ou à la page qu’il nomme (« Jouer ↗ », « le mur ↗ »).', 'Les mots-clés sont en colonne, avec un petit rond, au lieu des petits traits.']],
  ] },
  { v: '0.28', quand: '2026-10-26', titre: 'En mots-clés', items: [
    ['Ça sert à, Tu peux, Ça nourrit', ['Sur chaque page, les trois cases du haut sont en <b>mots-clés</b>, alignés à gauche, sans retrait. La phrase complète reste au survol de chaque case.']],
    ['Diapason Labo, en grand', ['Sur l’accueil, <b>Diapason Labo</b> est maintenant le grand titre ; le logo FLIP, au-dessus, est plus discret.']],
  ] },
  { v: '0.27', quand: '2026-10-26', titre: 'Le grand ménage des bords', items: [
    ['Rien ne colle plus au bord', ['Les cartes des disques du labo : la rangée − 2 + M × débordait dans la marge ; « choisir » passe sous le cercle du disque, et chaque carte garde de l’air à droite, à toutes les largeurs d’écran.', 'L’Empreinte : la « zone commune » dépassait de l’écran (on pouvait glisser la page de côté). Corrigé.', 'Une vérification automatique passe maintenant sur toutes les pages, sur téléphone, tablette et ordinateur, à la recherche de ce qui déborde ou colle au bord.']],
    ['Un accueil plus direct', ['La phrase « Six mois. Deux musiciens… » et la ligne des rôles sont parties : l’accueil commence par le labo.']],
  ] },
  { v: '0.26', quand: '2026-10-26', titre: 'Dans chaque fichier', items: [
    ['L’arbre ouvre les fichiers', ['Touche un fichier dans l’arbre : sa fiche montre maintenant <b>ses dernières retouches</b> (la date, et ce que chacune a fait, en une phrase) et <b>ce qu’il contient</b>, grosso modo : ses grandes sections et ses fonctions. Ce qui a été ajouté à sa dernière retouche est marqué <b>nouveau</b>, en or. On voit enfin qu’un ajout est dans tel fichier, et que c’est tel truc.']],
    ['Le numéro de version, sous le logo', ['Sous « Diapason Labo », en haut à gauche : le numéro de la version que tu as à l’écran. Si ce n’est pas le dernier, recharge l’app.']],
  ] },
  { v: '0.25', quand: '2026-10-26', titre: 'Le labo se souvient', items: [
    ['Rien ne se perd', ['Le labo se souvient tout seul de ce que tu as fait (disques, groupes, liens, disque en avant, vitesse), même si tu actualises la page.', '<b>Mes réglages</b> : donne un nom, « Garder ce réglage », et il te suit sur tes appareils ; l’autre le voit aussi chez lui et peut le charger. Un toucher pour le recharger.']],
    ['● Enregistrer', ['À côté de Démarrer : enregistre exactement ce que tu entends (groupes, liens, lampe compris), puis le télécharge en WAV stéréo.']],
    ['L’arbre montre ce qui bouge', ['Le nombre de fichiers ne change que quand on en crée un. L’arbre dit maintenant aussi ce qui a bougé à la dernière mise à jour : combien de fichiers ont été retouchés (et lesquels), combien sont nés ce jour-là ; ils brillent dans le dessin.']],
    ['De l’air dans les cartes', ['Dans « Tes disques », le texte ne colle plus au bord droit des cartes.']],
    ['Des mots qui s’entendent', ['Les liens disent ce qu’on entend : « le chaos agit sur le timbre du groupe A : <b>plus sourd</b> ». Plus doux ou plus fort, plus grave ou plus aigu, plus sourd ou plus brillant, vers la gauche ou vers la droite (l’<b>espace gauche-droite</b>, entre tes deux haut-parleurs).', 'Les déclencheurs sont revenus à gauche du schéma, collés au bord ; le schéma prend toute la largeur.']],
  ] },
  { v: '0.24', quand: '2026-10-26', titre: 'Le schéma, en plus clair', items: [
    ['Les groupes se blottissent', ['Dans le schéma des liens, les disques d’un groupe sont <b>dans son anneau</b>. On vise l’anneau pour toucher tout le groupe, ou un disque à l’intérieur pour lui seul.']],
    ['Toucher pour mettre en avant', ['Dans le schéma, touche un disque sans tirer, même dans un anneau : il passe <b>en avant</b> dans la grande fenêtre du haut, où sa fréquence se règle. Un halo le marque dans le schéma.']],
    ['Les déclencheurs dans une barre', ['Les déclencheurs (respiration, oscillation, hasard, chaos, voix, clavier, molette) attendent dans une barre compacte, au-dessus du schéma. On en tire un vers sa cible ; seuls ceux qu’on utilise apparaissent dans le schéma. Toute la place va aux disques et aux groupes.']],
  ] },
  { v: '0.23', quand: '2026-10-26', titre: 'Déclencheurs et paramètres', items: [
    ['Faire un groupe, sans chercher', ['Chaque disque a sa case <b>« choisir »</b>, et une ligne dit quoi faire : coche deux disques ou plus, puis « Les grouper ».']],
    ['Les liens poussent plus que le volume', ['Un lien pousse maintenant <b>le volume</b>, <b>la hauteur</b> (jusqu’à deux demi-tons : vibrato, glissés), <b>le timbre</b> (plus sourd ou plus clair) ou <b>la place</b> (vers la gauche ou la droite). La phrase se lit d’elle-même : « le chaos pousse le timbre du groupe A vers le sourd ».']],
    ['D’autres déclencheurs', ['À gauche du schéma, ce que les compositeurs branchent le plus sur les synthés modulaires, et quelques-uns déjantés : la <b>respiration lente</b>, une <b>oscillation rapide</b> (six fois par seconde : vibrato, trémolo), le <b>hasard</b> (une nouvelle valeur à chaque battement), le <b>chaos</b> (une suite logistique : jamais deux fois pareil, pourtant pas du hasard), <b>ta voix au micro</b> (plus tu chantes fort, plus ça bouge), <b>le clavier MIDI</b> de Frog (chaque note, plus fort s’il frappe fort) et <b>sa molette de modulation</b>.', 'Dans le schéma, les disques s’appellent D1, D2… (leur nombre de bosses en petit dessous), comme dans les cartes.']],
  ] },
  { v: '0.22', quand: '2026-10-26', titre: 'Le schéma des liens', items: [
    ['Le disque en avant', ['En haut, à côté du cercle, la fréquence en gros n’est plus seulement celle du disque 1 : <b>En avant</b> (ou le nom d’un disque, dans sa carte) choisit celui qu’on veut voir et régler. Taper sa fréquence règle tout l’ensemble, les rapports restent.']],
    ['Ce qu’on voit dans la grande fenêtre', ['Les petits cercles numérotés en haut à droite du radar montrent ou cachent chaque disque dans la fenêtre. Caché, un disque joue toujours : on choisit seulement ce qu’on regarde.']],
    ['Le schéma des liens', ['Sous les groupes, un schéma : chaque disque, chaque groupe et la respiration sont des cercles ; chaque lien, une flèche (orange : fait baisser ; vert : fait monter ; plus épaisse : plus forte). <b>Tire d’un cercle vers un autre</b> pour créer un lien, touche une flèche pour la choisir. Les pointillés relient un groupe à ses disques. Quand ça joue lentement, les flèches battent au rythme de leur disque.', 'Dans la liste, touche « baisser » ou « monter » pour inverser un lien.']],
  ] },
  { v: '0.21', quand: '2026-10-26', titre: 'La lampe', items: [
    ['Une lampe sur la sortie', ['Dans le labo, la cathédrale et Jouer : le bouton <b>Lampe</b>. Tout ce que joue l’app passe alors par une lampe imitée, comme le tube d’un ampli : une saturation douce et asymétrique (surtout l’harmonique paire, l’octave : la chaleur), une compression naturelle quand on joue fort, et le <b>bruit de grenaille</b> : le souffle des électrons qui arrivent un par un, au hasard (Schottky, 1918), qui suit le signal.', 'Comme une vraie, elle <b>chauffe</b> : allumée, elle met une dizaine de secondes à trouver son son (son filament rougeoit). La <b>chauffe</b> règle son caractère, de tiède à saturée. Le WAV de la cathédrale garde la lampe.', 'Mesuré, pas promis : sur une note pure, la lampe tiède ajoute l’harmonique 2 à −16 dB et la 3 à −29 dB, le profil d’une triode. Éteinte, elle ne touche à rien.']],
    ['L’arbre, toujours frais', ['L’arbre et la généalogie restaient en mémoire dans le navigateur pendant une semaine : on voyait ceux d’hier. Ils sont maintenant relus à chaque visite.']],
  ] },
  { v: '0.20', quand: '2026-10-26', titre: 'Des groupes de disques', items: [
    ['Le labo, recomposé', ['Le cercle et les réglages côte à côte, à la même hauteur ; tes disques en cartes, sur toute la largeur. Plus rien de tassé à droite.', 'Chaque disque a son volume.']],
    ['Les groupes', ['Touche le cercle de plusieurs disques, puis « Les grouper » : ils bougent ensemble. Un groupe change d’un geste son <b>nombre</b> (−1, +1, ÷2, ×2 : les rapports entre eux restent), son <b>son</b>, son <b>volume</b> ; on le met en <b>sourdine</b>, en <b>solo</b>, ou on le fait <b>respirer</b> (son volume monte et descend sur quatre tours). Pour l’instant, jusqu’à trois groupes (A, B, C, chacun sa couleur) et six disques : il y en aura plus quand nous aurons bien testé.']],
    ['Les liens : qui influence qui', ['Dans le labo, sous les groupes : « <b>le disque 1, à chacune de ses frappes, fait baisser le volume du groupe A</b> ». C’est la pompe de la musique électronique : la grosse caisse fait de la place aux autres. Une source (un disque, ou la respiration lente), un sens (monter ou baisser), une cible (un disque ou un groupe), une force. On peut en faire autant qu’on veut.']],
    ['La cathédrale : d’autres réglages', ['« ＋ un réglage » sur chaque disque : la <b>hauteur</b> (une ou deux octaves), <b>gauche ↔ droite</b>, le <b>décalage</b> (un contretemps), l’<b>aération</b> (des frappes retirées, toujours les mêmes), la <b>durée des notes</b>, l’<b>accent</b> du premier coup. Le WAV les garde.', 'Les nombres sautent par-dessus ceux déjà pris : de 2, « + » passe à 4 si un autre disque a déjà 3. Et le volume ne dépasse plus de sa carte.']],
  ] },
  { v: '0.19', quand: '2026-10-26', titre: 'Les nouveautés arrivent', items: [
    ['Même quand l’app reste ouverte', ['Diapason Labo reste souvent ouvert (en plein écran, ou sur l’écran d’accueil du cellulaire) : il ne redémarrait pas, et la fenêtre des nouveautés ne s’ouvrait jamais. Maintenant, quand une nouvelle version est en ligne, un bandeau le dit : « Charger les nouveautés », et cette fenêtre s’ouvre.']],
    ['Revoir les mises à jour', ['Dans <b>Nos nouvelles</b>, un bouton rouvre les dernières mises à jour, quand on veut.', 'L’arbre suit aussi : sa liste de fichiers, son journal des versions et sa généalogie se mettent à jour à chaque mise en ligne.']],
  ] },
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
// La fenêtre de mise à jour, une seule fois par personne ; la grande visite la remplace quand l’app a beaucoup changé.
export function majAvecAmour({ revoir = false } = {}) {
  if (!espace.connected || !espace.me) return;
  // Quand l'app a beaucoup changé depuis la dernière visite de Frog : la grande visite remplace, cette fois, la liste.
  if (!revoir) { import('./grandevisite.js').then((g) => { if (g.grandeVisiteDue()) g.lancerGrandeVisite({ obligatoire: true, onFin: () => VERSIONS.forEach((x) => { try { localStorage.setItem(cle(x.v), '1'); } catch { /* */ } }) }); else majListe(); }); return; }
  majListe({ revoir });
}
// La liste des versions que je n’ai pas encore vues.
function majListe({ revoir = false } = {}) {
  const mem = espace.meta.members || MEMBERS; const frog = espace.me === mem[1];
  if (frog && !revoir && !espace.meta.tour?.[espace.me]) return; // la première fois, c'est la visite qui accueille
  let neuves;
  if (revoir) neuves = VERSIONS.slice(0, 4);
  else try { neuves = VERSIONS.filter((x) => !localStorage.getItem(cle(x.v))); } catch { return; }
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

// L'app reste souvent ouverte (plein écran, écran d'accueil du cellulaire) : elle ne redémarre pas, et ne verrait jamais
// la nouvelle version. On regarde donc, quand on revient sur l'app et tous les quarts d'heure, si une version plus
// récente est en ligne ; si oui, un bandeau propose de la charger (la fenêtre des nouveautés s'ouvre alors).
let bandeau = null;
// Va voir si une nouvelle version est en ligne, et propose de recharger.
async function verifierVersion() {
  if (bandeau || document.visibilityState !== 'visible') return;
  try {
    const t = await (await fetch(`js/nouveautes.js?v=${Date.now()}`, { cache: 'no-store' })).text();
    const v = (t.match(/v: '([\d.]+)'/) || [])[1];
    if (!v || v === VERSIONS[0].v) return;
    bandeau = document.createElement('div'); bandeau.className = 'maj-bandeau'; bandeau.setAttribute('role', 'status');
    bandeau.innerHTML = `<span>La version <b>${esc(v)}</b> de Diapason Labo est prête.</span><button class="btn small primary" type="button">Charger les nouveautés</button>`;
    bandeau.querySelector('button').addEventListener('click', () => location.reload());
    document.body.appendChild(bandeau);
  } catch { /* hors ligne : on regardera plus tard */ }
}
// Vérifie les versions au retour sur l’onglet et toutes les quinze minutes.
export function guetterVersions() {
  document.addEventListener('visibilitychange', verifierVersion);
  addEventListener('focus', verifierVersion);
  setInterval(verifierVersion, 15 * 60 * 1000);
}

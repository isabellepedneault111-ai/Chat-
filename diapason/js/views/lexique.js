// Notre lexique : chaque mot de l'app, ce qu'il veut dire, et ce qu'il fait bouger sur notre route.
const MOTS = [
  ['Le parcours', [
    ['Le plan de six mois', 'Six étapes, d’idées brutes à 3 à 5 originaux stables. Chaque mois a une cible mesurée toute seule.', 'Tout ce qui suit le fait avancer.', 'bilan/mois'],
    ['La cible du mois', 'Ce qu’on vise ce mois-ci (10 idées, 2 ébauches, 2 morceaux jouables…).', 'Monter des idées au mur la remplit.', 'bilan/mois'],
    ['Notre route', 'Le chemin de six mois, dessiné : chaque action y laisse sa marque, datée.', 'C’est le miroir de tout ce que vous faites.', 'bilan/mois'],
    ['Notre fil', 'Nos quatre façons d’être ensemble : même pièce, distance en même temps, chacun son temps, seul pour nous deux.', 'Montre que le mouvement ne s’arrête jamais.', ''],
  ]],
  ['Le mur', [
    ['Le mur', 'Toutes nos idées au même endroit : notes, mémos, liens, sons et mots du relais.', 'C’est là que les idées deviennent des morceaux.', 'carnet'],
    ['Une étape', 'Idée brute → À creuser → En chantier → Fixé → Dans le set. On fait monter une idée d’un geste.', 'Chaque montée compte pour la cible du mois et s’inscrit sur la route.', 'carnet'],
    ['Le prochain pas', 'L’idée qui a le plus de vie (couches, réponses, coffre) : le mur propose de la faire monter.', 'Le geste le plus utile du moment, en un clic.', 'carnet'],
  ]],
  ['Entre deux séances', [
    ['Le relais', 'Se lancer des sons et des mots. L’autre répond par-dessus, écrit dessus, ou renvoie.', 'Chaque envoi apparaît au mur et sur la route.', 'relais'],
    ['Une couche', 'Un enregistrement posé par-dessus un autre, calé automatiquement. On écoute toutes les couches ensemble.', 'Une idée avec des couches est une idée vivante : le mur la suggère.', 'relais'],
    ['Une intention', 'Ce qu’on aimerait que l’autre en fasse : chante dessus, habille-le de sons, trouve-lui un titre… ou avec ses mots.', 'Elle guide la réponse et s’affiche partout où la note voyage.', 'relais'],
    ['Pendant ce temps', 'Ce que l’un pratique seul laisse une trace toute seule, avec des pistes pour l’autre.', 'Ce qu’on fait seul nourrit le duo.', ''],
    ['Une étincelle', 'Une idée embryonnaire déposée en trois secondes grâce à la petite flamme en bas de l’écran : pour notre musique, ou pour l’app.', 'Une étincelle pour la musique peut aller au mur et monter d’étape ; une idée pour l’app nourrit ce qu’on construit ensuite.', 'etincelles'],
    ['La corbeille commune', 'Ce qu’on jette attend ici, restaurable. L’effacer pour de bon demande l’accord de l’autre.', 'Rien ne disparaît sur un coup de tête.', 'corbeille'],
    ['Le coffre, une perle', 'Les petits endroits précieux : la vidéo, le mot d’accueil, ce qu’on y dépose d’un geste.', 'Une perle remonte dans « Depuis la dernière fois ».', 'coffre'],
  ]],
  ['Les séances', [
    ['Une séance', 'Ensemble dans la pièce, à distance en même temps, ou seul. Guidée, elle finit toujours par une prise.', 'Le compteur des séances ensemble, le rythme de la semaine.', 'session'],
    ['Depuis la dernière fois', 'Au début de chaque séance : la cible convenue, le relais, les pratiques solo, les perles.', 'Rien de ce qui a été fait à distance ne se perd.', 'session'],
    ['La trace de séance', 'À la fin : le feu (1 à 5 flammes), un mot chacun, le debrief, la prochaine cible.', 'Le bilan de la semaine et la route.', 'bilan/seance'],
  ]],
  ['Écrire', [
    ['Notre journal', 'Chacun écrit de son côté, avec une invitation du jour commune. On se lit.', 'Une page peut aller au mur (et monter d’étape) ou au coffre.', 'ecrire'],
    ['La séance d’atelier', 'Quatre temps guidés : délier la main, écrire par les sens, une contrainte, garder ce qui brille.', 'Elle va au journal, et l’autre en reçoit une piste.', 'atelier'],
    ['Le grimoire', 'Le rituel avant d’écrire : notre champ de mots, une carte tirée, le cadavre exquis, tes propres rituels.', 'La matière des textes, sans page blanche.', 'jeux'],
    ['Le champ de mots', 'Les mots qu’on dépose à deux autour d’un thème. Les cartes y puisent.', 'Le vocabulaire commun de l’album.', 'jeux'],
    ['Une ambiance', 'Un lieu qui sonne (fleuve gelé, cuisine à 2 h…), qu’un clavier peut piloter. On écrit et on chante dedans.', 'Une couleur commune pour un morceau.', 'ambiances'],
  ]],
  ['La voix et le son', [
    ['Voix + piano', 'Un clavier joue un accord : les notes chantables s’allument, l’app dit laquelle on tient.', 'La carte des accords et les notes magiques.', 'accord'],
    ['La carte des accords', 'Les accords où la voix est chez elle, et ceux à apprivoiser.', 'Où bâtir les refrains.', 'accord'],
    ['Les notes magiques', 'Les notes où la voix est la plus stable et la plus juste.', 'Les notes longues du refrain.', 'accord'],
    ['L’empreinte', 'Le test de tessiture : l’étendue de chaque voix, et les tonalités qui vous vont.', 'Toutes les grilles se règlent dessus.', 'tessiture'],
  ]],
];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default {
  id: 'lexique',
  mount(el) {
    el.innerHTML = `
      <div class="mod-head"><div>
        <p class="eyebrow">Notre lexique</p>
        <h1>Les mots de FLIP</h1>
        <p class="muted">Ce que chaque mot veut dire, et surtout ce qu’il fait bouger sur notre route.</p>
      </div></div>
      <input class="input lx-search" placeholder="Chercher un mot…" aria-label="Chercher un mot">
      ${MOTS.map(([g, list]) => `<section class="lx-g"><h2>${esc(g)}</h2><dl>${list.map(([m, def, moves, href]) => `
        <div class="lx-m" data-q="${esc((m + ' ' + def).toLowerCase())}"><dt>${href ? `<a href="#/${href}">${esc(m)}</a>` : esc(m)}</dt><dd>${esc(def)}<span class="lx-moves">→ ${esc(moves)}</span></dd></div>`).join('')}</dl></section>`).join('')}`;
    el.querySelector('.lx-search').addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      el.querySelectorAll('.lx-m').forEach((d) => { d.hidden = q && !d.dataset.q.includes(q); });
      el.querySelectorAll('.lx-g').forEach((g) => { g.hidden = ![...g.querySelectorAll('.lx-m')].some((d) => !d.hidden); });
    });
  },
};

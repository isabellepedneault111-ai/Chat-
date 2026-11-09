const L = require('./lib');
const { d, C, EMBED, P, label, H1, H2, H3, B, N, BR, SP, note, quote, tbl, img, caption, styles, numbering, footer, cover, save, page } = L;
const OUT = process.argv[2];
const I = __dirname + '/img/';

const kids = [
  ...cover({
    kicker: 'Journée régionale FGA · 13 novembre 2026 · CFGA De Jonquière',
    title: 'RÊVER LE MONDE DE DEMAIN',
    sub: 'De l’idéation à l’action. Engagement citoyen et autodétermination en FGA. Guide d’animation pour la coanimation (90 minutes).',
    image: { path: I + 'nb_mur.jpg', w: 640, h: 360, cap: 'Du « ça me dérange » au « on l’a fait ! »' },
    meta: ['**Isabelle Pedneault**, conseillère pédagogique, CFGA De Jonquière (CSSDLJ)', '**Francis Laroche**, chargé de projet en éducation citoyenne mondiale, Centre de solidarité internationale du Saguenay–Lac-Saint-Jean (CSI)', 'Présentation interactive : presentation/index.html (aussi utilisable hors ligne)']
  }),
  L.logos([[I + 'logo_cfga.png', 62, 61], [I + 'logo_csi.png', 230, 50]]),
  BR(),

  label('En un coup d’œil'),
  P('**Le pari.** Et si le but ultime, c’était l’engagement ? Si l’engagement est là, tout le reste en découle : la présence, la persévérance, les apprentissages.'),
  P('**Le fil rouge.** Les participants vivent en accéléré la démarche que des élèves de PPS du CFGA ont déjà vécue : ce qui me préoccupe, mon monde idéal, l’analyse de contexte, du résultat aux actions, le vote, le premier pas.'),
  P('**L’effet de la fin.** On montre ce que les élèves de PPS ont produit : ça ressemble à ce que les participants ont fait. Puis on nomme les pratiques gagnantes qu’ils ont vécues sans qu’on les annonce.'),
  P('**Ce que chacun emporte.** Le cahier du participant, la page Ressources (invite Copilot, documents en PDF) et son premier pas.'),

  H1('01', 'Intentions et objectifs'),
  ...note('Intention générale', ['Faire découvrir comment une démarche d’engagement citoyen (la démarche « de l’idée à l’action ») donne du sens aux apprentissages et soutient l’autodétermination des adultes en formation, puis outiller les participants pour en transposer une partie dans leur contexte, en groupe comme en enseignement individualisé.']),
  tbl(['', 'À la fin, les participants pourront…', 'Ce qu’on observera'], [
    ['1', '**décrire** les étapes de la démarche « de l’idée à l’action », de l’enjeu qui touche les élèves jusqu’au projet réalisé ;', 'Ils reconnaissent les marches qu’ils viennent de vivre (diapo 15).'],
    ['2', '**reconnaître** les composantes de l’autodétermination mobilisées (choisir, se fixer un but, décider, résoudre, s’autoévaluer) ;', 'Ils nomment les pratiques vécues et les besoins nourris (diapo 21).'],
    ['3', '**analyser** les conditions qui facilitent ou freinent le transfert selon leur contexte ;', 'L’analyse de contexte et les trois portes (diapos 11 et 16).'],
    ['4', '**esquisser** un premier pas réaliste à mettre à l’essai avec leurs élèves.', 'Chacun remplit sa fiche « Mon premier pas » : une action, une date, un allié.']
  ], [500, 5500, 4080], { firstAccent: true }),
  P('Les verbes suivent une progression : décrire, reconnaître, analyser, esquisser. On passe de comprendre la démarche à se l’approprier.', { before: 100, run: { italics: true, color: C.grey } }),

  H1('02', 'Qui sera dans la salle'),
  P('D’après le portrait des inscriptions du 4 novembre (146 personnes à la journée, quatre CSS). Les noms restent dans le document interne du comité ; ici, seulement ce qui change notre animation.', { run: { size: 19, color: C.grey } }),
  tbl(['', 'Ce qu’on sait', 'Ce que ça change'], [
    ['**Combien**', '34 personnes ont mis l’atelier en 1er ou 2e choix (19 et 15). 22 autres l’ont en réserve.', 'Prévoir 40 cahiers et 4 îlots d’environ 8 à 10 personnes, chacun près d’une surface verticale. Tout le matériel est compté pour 40.'],
    ['**D’où**', 'Les quatre CSS : Rives-du-Saguenay 12, Lac-Saint-Jean 10, De La Jonquière 6, Pays-des-Bleuets 6.', 'Mélanger les centres dans chaque îlot : l’appartenance se construit aussi entre collègues de la région.'],
    ['**Qui**', 'IS et ISP : 11. Mathématiques et sciences : 8. PPS et DHS : 6. Français, orthopédagogie, orientation et CP, direction : 2 chacun. Anglais : 1.', 'La moitié enseigne en PPS, DHS, IS ou ISP : on nomme IS et ISP partout avec PPS et DHS. L’autre moitié compte aussi : un exemple en mathématiques, une porte « Anglais », une porte « Direction · services », et des rôles Copilot pour chacun.']
  ], [1500, 4300, 4280], { firstAccent: true }),
  H3('Ce qu’elles et ils souhaitent aborder, et où on y répond'),
  tbl(['Souhait exprimé à l’inscription', 'Où on y répond'], [
    ['L’autodétermination à travers le programme de participation sociale', 'Les 5 marches et leurs composantes (diapo 15), J’ai mon plan (annexe 07)'],
    ['Des exemples concrets de projets de participation sociale', 'Les projets du CFGA et la vidéo (diapos 15 et 22), la porte IS · ISP (diapo 16)'],
    ['Les partenariats avec la communauté : le rôle de l’enseignant, l’horaire, le terrain', 'Francis et le CSI, l’analyse de contexte (diapo 11), décloisonner (diapo 23)'],
    ['La cohérence du projet PPS avec les cours matières, sans alourdir la tâche', 'Le scénario C, le projet-pont (diapo 16), et le coup de théâtre (diapo 19) : les élèves en individualisé contribuent comme « experts »'],
    ['Le DHS, la déficience intellectuelle, le TSA ; des outils pour le DHS', 'Les portes PPS et DHS, la fiche élève en 5 marches (annexe 08), les 4 étapes en îlot'],
    ['Le développement de l’autonomie chez les jeunes de 16 ans', 'Les 4 besoins et les 9 gestes (diapo 7, annexe 09), et les forces (diapo 18)'],
    ['Le plan d’intervention multidisciplinaire', 'L’annexe 10 : les interventions universelles avant le plan d’intervention'],
    ['L’IA', 'Copilot en îlot (diapo 14), le coup de théâtre (diapo 19) et l’aide-mémoire Copilot (annexe 03)']
  ], [5000, 5080], { firstAccent: true }),
  H3('Une place pour chaque profil'),
  tbl(['Profil', 'Son angle dans l’atelier'], [
    ['**IS, ISP, PPS, DHS**', 'Vivre la démarche avec leur groupe, du début à la fin : c’est leur terrain.'],
    ['**Mathématiques et sciences**', 'Le scénario A : un sondage, une mesure, un budget. Le scénario C : l’« expert » du projet-pont.'],
    ['**Français et anglais**', 'Le résultat (un nom) et l’action (un verbe) : un pont direct avec la grammaire. Une lettre, une affiche bilingue, une capsule.'],
    ['**Orthopédagogie**', 'L’enjeu choisi par l’élève comme texte d’entraînement ; l’annexe 10 sur les interventions universelles.'],
    ['**Orientation et CP**', 'Relier l’enjeu au projet de vie et à J’ai mon plan ; accompagner une équipe qui fait un premier essai.'],
    ['**Directions**', 'Les conditions qui rendent la démarche possible : du **temps protégé** à l’horaire (le cadre d’innovation du CFGA), l’horaire d’un projet-pont, les partenariats avec la communauté.']
  ], [2800, 7280], { firstAccent: true }),
  ...note('Les 4 îlots, hétérogènes et formés exprès', ['La composition est prête dans le document interne « Composition des îlots » (Drive d’Isabelle, non partagé : il contient des noms). Chaque îlot réunit les quatre centres de services, les programmes (IS, ISP, PPS, DHS), les matières et les fonctions. Les personnes en réserve y sont aussi placées, pour que chaque îlot reste hétérogène aux deux séances. À l’entrée, on accueille chaque personne avec son numéro d’îlot ; un carton « Îlot 1 » à « Îlot 4 » est posé sur chaque table (matériel à imprimer).', 'Au dévoilement, on le nomme : « On entend souvent que l’hétérogénéité des élèves, leurs parcours uniques et leurs sigles particuliers freinent l’universel. Vos îlots étaient hétérogènes, formés exprès. Regardez ce que vous avez produit ensemble. » C’est un principe de base de la classe collabo-réflexive.'], { before: 160 }),

  H1('03', 'Déroulé minuté'),
  P('Quatre phases : 30, 30, 20 et 10 minutes. Chaque activité suit la même façon de faire : on **modélise** (la boîte « Modèle » de la diapo), puis **pratique guidée**, puis **pratique autonome**. Chaque diapo d’activité porte l’étiquette **Nourrit** (le besoin de l’engagement qu’elle nourrit) et l’étiquette **Expansion** ou **Restriction** : le va-et-vient décrit dans « Mon utilisation de l’IA ». En expansion, on ouvre et on cherche des idées, avec l’IA, les autres ou soi-même ; en restriction, on resserre, on choisit, on précise. On le nomme au dévoilement. La touche N affiche les notes ; la touche P ouvre le mode présentateur.'),
  H3('Deux séances, le même atelier'),
  tbl(['Phase', 'Séance du matin', 'Séance de l’après-midi', 'Diapos'], [
    ['**Phase 1 · Diagnostic et monde idéal** (30 min)', '10 h 20 à 10 h 50', '13 h 30 à 14 h', '1 à 11'],
    ['**Phase 2 · Le pivot : du résultat aux actions** (30 min)', '10 h 50 à 11 h 20', '14 h à 14 h 30', '12 à 16'],
    ['**Phase 3 · Galerie, votes et projet du groupe** (20 min)', '11 h 20 à 11 h 40', '14 h 30 à 14 h 50', '17 à 19'],
    ['**Phase 4 · Bilan et dévoilement** (10 min)', '11 h 40 à 11 h 50', '14 h 50 à 15 h', '20 à 27']
  ], [3700, 2100, 2300, 1980], { firstAccent: true }),
  P('**Entre les deux séances (11 h 50 à 13 h 30).** Photographier le mur d’enjeux et les surfaces verticales, puis effacer le plexiglas et changer les affiches. Dans la présentation : diapo 2, **Vider** ; diapo 17, **Remettre à zéro**.', { before: 100 }),
  H3('Le fil de l’atelier'),
  tbl(['Min.', 'Diapo', 'Ce que vivent les participants', 'Pratique', 'Nourrit'], [
    ['0–5', '1–4', 'En entrant, un post-it au mur : ce qui me préoccupe dans mon milieu, dans le cercle école, communauté ou nature. Présentation éclair, puis « Aujourd’hui » : les quatre temps de l’atelier.', 'Méthode inductive', 'Sens'],
    ['5–10', '5–7', 'Le pari : et si le but ultime, c’était l’engagement ? Les intentions. Vrai ou faux : motivation et engagement.', 'Questionner', 'Sens'],
    ['10–17', '9', '**Pense**, seul : mon monde idéal dans les trois cercles, puis les intersections.', 'Pense, parle, partage', 'Autonomie'],
    ['17–25', '10', '**Parle** en îlot, au plexiglas ; **partage** : chaque îlot nomme ce qu’il a gardé.', 'Classe collabo-réflexive', 'Appartenance'],
    ['25–30', '11', 'L’analyse de contexte : les leviers et les « je remarque que ».', 'Analyse de contexte', 'Sens'],
    ['30–40', '12', 'Résultat ou action : conflit cognitif, modelage, pratique guidée, pratique autonome. SMART.', 'Enseignement explicite', 'Compétence'],
    ['40–52', '13–14', 'En îlot : du résultat aux actions, un titre au projet, tout au plexiglas. Copilot pour des micro-actions.', 'Collabo-réflexive, IA', 'Appartenance'],
    ['52–60', '15–16', 'Les 5 marches : « vous venez de vivre les trois premières ». Les trois portes pour l’individualisé.', 'Raconter', 'Sens'],
    ['60–70', '17', 'La galerie et les trois votes.', 'Choix, rétroaction par les pairs', 'Autonomie'],
    ['70–73', '18', 'Nos forces : voter « on est capables », c’est se connaître.', 'Forces comme leviers', 'Compétence'],
    ['73–80', '19', 'Le coup de théâtre : un projet, toutes vos disciplines, en un clic.', 'IA au service du sens', 'Sens'],
    ['80–83', '20', 'Mon premier pas, de retour dans mon milieu.', 'Objectif SMART', 'Autonomie'],
    ['83–85', '21', 'Le dévoilement : ce que vous avez vécu sans qu’on le nomme.', 'Objectivation', 'Compétence'],
    ['85–87', '22–23', 'Des élèves l’ont vécue : cette semaine au centre, les projets des élèves d’Isabelle, ce qu’ils en disent. Décloisonner : des pistes à explorer.', 'Raconter', 'Sens'],
    ['87–88', '24', 'Francis : les incubateurs solidaires, du Saguenay au Sénégal.', 'Raconter', 'Appartenance'],
    ['88–90', '25–27', 'La pyramide (optionnelle, en discussion), 3-2-1 (si le temps le permet, sinon dans le cahier), merci.', 'Objectivation', 'Compétence']
  ], [900, 900, 4600, 2000, 1680], { firstAccent: true }),
  P('Le minutage est serré : c’est un atelier qui fait vivre beaucoup. Les diapos 8 (les 4 besoins) et 25 (la pyramide) sont **optionnelles**.', { before: 80, run: { italics: true, color: C.grey } }),

  H2('Rôles et passages de relais'),
  tbl(['', 'Isabelle', 'Francis'], [
    ['**Porte surtout**', 'L’ancrage pédagogique : le pari de l’engagement, l’enseignement explicite, l’analyse de contexte, les forces, Copilot, le dévoilement des pratiques.', 'Le terrain : la démarche « de l’idée à l’action », les élèves de PPS, l’histoire vraie de l’Halloween, le CSI et les partenariats.'],
    ['**Pendant que l’autre anime**', 'Circule entre les surfaces verticales, photographie, note les mots forts.', 'Tient le minuteur et prépare le matériel de la phase suivante.'],
    ['**Signal discret**', 'Carton vert : on continue. Jaune : 5 minutes. Rouge : on conclut en une phrase.', 'Même code.']
  ], [2000, 4040, 4040]),
  H2('Plan B chrono · 10 minutes de retard'),
  B('**Le minuteur d’atelier (touche A)** compte les 90 minutes et compare au déroulé : en haut à droite, « ✓ » si on est dans les temps, « +4 min ⚠ » si on est en retard. Un clic affiche quoi couper, dans l’ordre, selon le retard. Il se lance à la diapo où on est, se met en pause et survit à un rechargement de la page.'),
  B('**Ordre des coupes :** 1) la diapo 8 (les 4 besoins) ; 2) la diapo 25 (la pyramide) ; 3) raccourcir la diapo 16 (les portes : on renvoie au cahier) ; 4) raccourcir la diapo 7 (étapes 4 et 5) ; 5) le 3-2-1 de la diapo 26 se fait dans le cahier ; 6) un seul projet d’incubateur à la diapo 24.'),
  B('**Ne jamais couper** le coup de théâtre (19), le premier pas (20) et le dévoilement (21) : c’est là que l’atelier prend tout son sens.'),
  B('**Qui anime ?** Un cadre de couleur entoure l’écran : jaune quand Francis anime, mauve quand Isabelle anime, blanc quand c’est le duo ; moitié-moitié quand l’un passe la parole à l’autre.'),
  H2('Plan B technique'),
  B('La présentation fonctionne sans Internet (fichier sur 2 clés USB). Le coup de théâtre de la diapo 19 demande Internet pour Copilot ; sinon, le bouton « Voir un exemple ».'),
  B('La vidéo des élèves de PPS doit être enregistrée localement. On la glisse dans la diapo 22.'),
  B('Prévoir des adaptateurs HDMI, USB-C et VGA, et une rallonge.'),
  B('**Le minuteur suit la diapo :** lancé depuis un bouton de diapo, il disparaît quand on change de diapo. La touche T lance un minuteur de 5 minutes qui reste affiché.'),
  B('**Les activités à plusieurs étapes (diapos 9, 10, 13 et 20) ont un seul minuteur global**, découpé en secteurs : chaque étape a son temps approximatif. On touche « Étape suivante » quand l’étape est terminée : on peut prendre plus ou moins de temps sur une étape, et le minuteur montre ce qui reste pour l’ensemble. Une étape qui déborde son temps prévu se hachure en orange.'),

  H1('04', 'Le script, phase par phase'),
  H2('Phase 1 · Diagnostic et monde idéal (0–30 min)'),
  H3('Accueil et mur d’enjeux · Francis (diapos 1 à 4)'),
  ...note('Le mur d’enjeux', ['**Quoi :** une grande affiche à l’entrée (fichier 05b) : « Qu’est-ce qui vous préoccupe ou vous dérange dans votre milieu ? », avec les trois cercles école, communauté, nature.', '**Quand :** en entrant, avant de s’asseoir. Une table près de la porte avec des post-it et des marqueurs.', '**Ensuite :** pendant l’accueil, Francis tape 4 ou 5 post-it dans la diapo 2, en choisissant leur cercle ; ils s’accrochent au globe et un compteur montre où ils sont tombés.']),
  P('Phrase d’ouverture : « Ce que vous venez de faire, nos élèves de PPS l’ont fait aussi : c’est la première marche de la démarche. »'),
  P('**Aujourd’hui (diapo 4).** Après les présentations, les quatre temps de l’atelier : rêver, cibler, choisir, s’engager. On ne nomme pas les pratiques pédagogiques. On fait plutôt un avertissement, comme un « trigger warning » : « Faites-nous confiance. On a choisi exprès une démarche inductive : par moments, le sens pourrait vous échapper. On fait le pari qu’il apparaîtra à la fin. » Et on annonce des surprises, sans les dévoiler : plus de cinq approches pédagogiques, la comparaison avec la démarche vécue cette semaine au centre par des élèves, et quelques autres.'),
  H3('Le pari · Isabelle (diapos 5 à 7)'),
  P('**Et si le but ultime, c’était l’engagement ?** On fait le pari que si l’engagement est là, tout le reste en découle : la présence, la persévérance, les apprentissages. On annonce sans tout dévoiler : les participants vont vivre une version accélérée d’une démarche qu’Isabelle a vécue à de nombreuses reprises avec ses élèves, que Francis fait vivre dans ses incubateurs solidaires, et que des élèves ont vécue cette semaine au centre, et on comparera à la fin. **On ne nomme pas les pratiques pédagogiques maintenant** : on les dévoile à la diapo 21. Puis les intentions et le vrai ou faux sur la motivation et l’engagement, avec les 4 besoins.'),
  H3('Mon monde idéal : pense, parle, partage · Francis (diapos 9 et 10)'),
  N('**Modéliser.** Francis lit la boîte « Modèle » : École, *créativité* ; communauté, *collaboration* ; entre les deux, « la communauté entre dans nos murs et fait vivre aux élèves des moments de créativité ».', 5),
  N('**Pense (3 min, seul).** Sans limite de budget ni de ressources matérielles ou humaines : des mots-clés dans un ou plusieurs cercles du cahier (école, mon centre ; communauté ; nature).', 5),
  N('**Les intersections (2 min).** Qu’est-ce qui relie deux cercles ? Le droit à l’erreur et au « je ne sais pas » : une case vide, c’est permis.', 5),
  N('**Parle (5 min, en îlot, debout au plexiglas).** Chacun partage ; pour chaque cercle, l’îlot garde ce qui revient, au crayon effaçable sur l’affiche 05c collée derrière. Les membres aident ceux qui n’ont pas trouvé d’intersection.', 5),
  N('**Partage (3 min).** Chaque îlot nomme ce qu’il a gardé. Le grand groupe est optionnel selon le temps.', 5),
  H3('L’analyse de contexte · Isabelle (diapo 11)'),
  P('Pour chaque cercle : **les leviers** (ce qui existe déjà : une qualité du CFGA, une personne, un lieu, un organisme) et **« je remarque que »** (ce qui manque : « je remarque qu’il n’y a pas de verdure autour », « je remarque qu’on fait peu appel aux organismes communautaires »). Rien n’existe ? De quoi le centre aurait-il besoin pour s’y rendre ? On modélise une rangée, puis 4 minutes dans le cahier.'),

  H2('Phase 2 · Le pivot : du résultat aux actions (30–60 min)'),
  H3('Résultat ou action : l’enseignement explicite · Isabelle (diapo 12)'),
  N('**Conflit cognitif.** Chacun écrit une « action » pour ce qui l’interpelle le plus dans ses cercles. Isabelle en lit trois : la plupart sont des résultats.', 6),
  N('**Modelage.** Le résultat est un nom ; l’action est un verbe, avec qui et quand.', 6),
  N('**Pratique guidée.** On teste des phrases de la salle dans le détecteur de la diapo.', 6),
  N('**Pratique autonome.** Dans le cahier : mon résultat, mes actions, puis la grille SMART d’Isabelle (spécifique, mesurable, atteignable, représentatif, temporel).', 6),
  tbl(['Résultat · un nom', 'Action · un verbe'], [
    ['la réduction des déchets à la cafétéria', '==installer== trois bacs de compost vendredi avec le concierge'],
    ['un centre plus vert', '==aménager== un jardin avec un organisme du quartier d’ici juin'],
    ['plus de liens avec la communauté', '==inviter== un organisme à présenter un besoin à notre groupe le 12 décembre'],
    ['une meilleure compréhension du budget familial (mathématiques)', '==comparer== le prix de 10 produits dans deux épiceries et ==calculer== l’écart d’ici vendredi']
  ], [4600, 5480]),
  H3('En îlot : du résultat aux actions · Duo (diapos 13 et 14)'),
  P('Ce qui interpelle l’îlot dans ses cercles devient le résultat (un ou plusieurs) ; des actions détaillées, le plus SMART possible ; **un titre au projet** (obligatoire : la galerie se fait par titre) ; tout au plexiglas, sur l’affiche 05d « Notre projet », avec l’espace des trois votes. **Copilot (diapo 14) :** la tâche « micro-actions » à partir de l’analyse de contexte. Sur leur ordinateur, les participants ouvrent la page Ressources (code QR) et copient la même invite.'),
  P('**Coup de pouce des 4 besoins (encadré de la diapo 13).** Devant chaque manque relevé dans l’analyse de contexte (les « je remarque que »), l’îlot se demande quel besoin il touche, puis choisit une action qui le nourrit : compétence (« Qu’est-ce qu’on peut réussir, à notre mesure ? »), autonomie (« Qu’est-ce qu’on laisse choisir ? »), sens (« À qui ça sert, vraiment ? »), appartenance (« Avec qui le fait-on ? »). On l’annonce dès la diapo 11. Le même outil sert avec les élèves.'),
  H3('Les 5 marches et les trois portes · Francis, puis Isabelle (diapos 15 et 16)'),
  P('« Vous venez de vivre les trois premières marches. » Les projets vécus au CFGA. Puis les trois portes pour l’individualisé : A, l’enjeu comme contexte de tâche ; B, le micro-projet ; C, le projet-pont.'),

  H2('Phase 3 · Galerie, votes et projet du groupe (60–80 min)'),
  H3('La galerie et les trois votes · Duo (diapo 17)'),
  tbl(['Vote', 'Post-it', 'Ce qu’il veut dire'], [
    ['**Coup de cœur**', 'jaune', '« Ce projet me touche, il a du sens. »'],
    ['**Oui, et…**', 'orange', '« J’aime cette action, et je changerais ceci. » La suggestion s’écrit sur le post-it : l’îlot repart avec une bonification.'],
    ['**On est capables**', 'mauve', '« Avec nos forces, on peut le réaliser. »']
  ], [2400, 1400, 6280], { firstAccent: true }),
  N('Une personne par îlot reste au plexiglas et explique en 30 secondes ; les autres circulent. À mi-temps, on change de présentateur.', 7),
  N('Chacun a 3 post-it, un de chaque couleur, à coller sur le résultat ou sur une action. 1 post-it = 1 point.', 7),
  N('**Les photos.** Pendant la galerie, Francis photographie chaque plexiglas (ou reçoit les photos par Teams, courriel ou câble) et les glisse dans la carte de l’îlot avec « + Photo du plexiglas ». Une photo touchée s’affiche en grand.', 7),
  N('**Les points.** Les votes se font sur papier. Chaque îlot compte ses post-it et on tape seulement les trois totaux dans la diapo. Les piles 3D montent, et surtout le projet qui a le plus de points s’affiche tout seul, avec sa photo, au coup de théâtre (diapo 19).', 7),
  H3('Nos forces · Isabelle (diapo 18)'),
  P('Le pont vers les élèves : voter « on est capables », c’est difficile pour un élève qui ne connaît pas ses forces. Avec ses élèves, Isabelle utilisait **l’empreinte d’apprentissage** (« J’ai MON plan! ») et **la liste des forces et capacités**, puis un **top 3 des forces** (bien en vue : ce sont des leviers pour faire ce qui demande un effort) et un **top 3 des défis** (qui deviennent des objectifs SMART, avec des moyens efficaces choisis selon la catégorie du défi, annexe 07).'),
  H3('Le coup de théâtre : un projet, toutes vos disciplines · Isabelle (diapo 19)'),
  N('Le titre du projet le plus voté s’affiche tout seul. On complète le résultat et les actions avec la salle.', 8),
  N('Les disciplines présentes sont déjà cochées, d’après le portrait des inscriptions (sans aucun nom) : IS, ISP, PPS, DHS, mathématiques, sciences, français, francisation, anglais, orthopédagogie, orientation, conseil pédagogique, direction. On décoche celles qui sont absentes.', 8),
  N('**Copier l’invite**, la coller dans Copilot sur l’ordinateur du TNI, lancer. Les extraits de programmes sont **déjà dans l’invite**, pour chaque discipline cochée, et on joint en plus le PDF « 11 · Extraits de programmes pour Copilot » : les vraies pages du Ministère pour 9 cours (Z101, Z107, MAT-1101, MAT-1102, MAT-3052, MAT-3053, FRA-2101, FRA-3104, ANG-4104). Copilot doit s’y appuyer uniquement, citer le sigle et livrer un document Word aux couleurs de l’atelier.', 8),
  N('Le message : si ce projet se réalise dans votre milieu, l’école, la communauté et la nature en bénéficient déjà. L’engagement est le moteur de tout le reste, jusqu’à l’assiduité. Et chaque discipline y trouve ses contenus, en un clic.', 8),
  N('Si Copilot hésite ou si Internet manque : le bouton **« Voir un exemple »** affiche un tableau préparé d’avance (un jardin collectif avec le quartier).', 8),

  H2('Phase 4 · Bilan et dévoilement (80–90 min)'),
  N('**Mon premier pas (diapo 20, 3 min).** Une action, une date (mon temps protégé), un allié. Les six questions du cadre d’innovation sont sous la fiche, dans le cahier.', 9),
  N('**Le dévoilement (diapo 21, 2 min).** Avant de commencer : « Ouvrez votre cahier à la section 12 ; pendant qu’on révèle, cochez les pratiques que vous voulez essayer. » Chacun repart avec son propre menu de pratiques, choisi par lui. Puis : « Vous l’avez vécu sans qu’on le nomme. » On révèle une pratique à la fois en demandant : « Où l’avez-vous vécue ? »', 9),
  N('**Des élèves l’ont vécue (diapo 22), trois onglets.** 1. Francis : la démarche vécue cette semaine au centre par des élèves de PPS (vidéo ou photos). « Est-ce que ça ressemble à ce que vous avez produit ? » Ce qui est bon pour les élèves de PPS est bon pour tout le monde. 2. Isabelle : les projets de ses élèves, chacun parti d’une envie de l’élève. 3. Isabelle : ce qu’ils en disent, de vrais mots de parents et d’élèves ; toucher un mot pour l’agrandir, pointer le besoin nourri.', 9),
  N('**Décloisonner (diapo 23).** Francis raconte l’histoire de l’Halloween ; Isabelle lance les pistes à explorer comme des défis : « Et si, dans votre centre… ? » Le sens et l’autodétermination, le thème du colloque.', 9),
  N('**Ici et ailleurs (diapo 24).** Francis montre des projets d’incubateurs solidaires vécus ici, au Saguenay, et au Sénégal. Glisser les photos ou la vidéo dans la diapo avant l’atelier.', 9),
  N('**La pyramide (diapo 25, optionnelle).** On en parle, sans vote à l’écran : où se situait votre dernière formation ? Et l’atelier d’aujourd’hui ?', 9),
  N('**3-2-1 et merci (diapos 26 et 27).** Le code QR mène à la page Ressources. Annonce de la relance à six semaines.', 9),
  H3('Les projets réalisés par des élèves d’Isabelle (diapo 22)'),
  P('Tirés de la liste « Projets d’apprentissage de mes élèves ». Chaque projet est parti d’une envie de l’élève.', { run: { size: 19, color: C.grey } }),
  tbl(['Le projet', 'Ce que ça a donné', 'À retenir'], [
    ['Un comptoir vestimentaire pour les élèves qui manquent de vêtements', 'Une boutique dans un local.', 'Prévoir le temps : la collecte et le classement ont pris l’année.'],
    ['Du matériel pour un enfant qui a un trouble du langage', 'Des ateliers conçus avec l’orthophoniste.', 'Le mentorat d’un professionnel change tout.'],
    ['Un journal étudiant', 'Trois éditions.', 'D’autres élèves se sont joints à l’équipe.'],
    ['Des produits à l’effigie de l’école', 'Plus de 200 objets, tout vendu.', 'Il y avait matière à continuer.'],
    ['Une grande murale', 'Une murale dans le studio multimédia.', 'L’élève a ensuite obtenu un contrat dans un organisme communautaire.'],
    ['Un programme d’entraînement de basketball', 'Trois entraînements par semaine.', 'Ceux qui ne faisaient pas partie de l’équipe ont été intégrés.']
  ], [3500, 3000, 3580], { firstAccent: true }),

  H1('05', 'Les pratiques pédagogiques vécues'),
  P('Ce qu’on dévoile à la diapo 21, et que les participants retrouvent dans leur cahier (section 12).'),
  tbl(['Pratique', 'Où on la fait vivre', 'Nourrit'], [
    ['Pense, parle, partage', 'Le monde idéal (diapos 9 et 10), et un peu partout', 'Appartenance'],
    ['Des îlots hétérogènes, formés exprès', 'La composition des 4 îlots : centres, programmes, matières et fonctions différents, un principe de base de la classe collabo-réflexive', 'Appartenance'],
    ['La classe collabo-réflexive', 'Les surfaces verticales, en îlot (10, 13)', 'Appartenance'],
    ['La démarche inductive', 'Vivre d’abord, nommer ensuite : partir d’exemples concrets pour que les participants dégagent eux-mêmes le principe ; les pratiques ne sont nommées qu’au dévoilement (21)', 'Compétence'],
    ['L’enseignement explicite', 'Résultat ou action : modelage, pratique guidée, pratique autonome (12)', 'Compétence'],
    ['La modélisation avant chaque activité', 'La boîte « Modèle » des diapos', 'Compétence'],
    ['Le droit à l’erreur et au « je ne sais pas »', 'Tout au long', 'Appartenance'],
    ['Les objectifs SMART', 'Du résultat aux actions (12, 13)', 'Compétence'],
    ['Le choix et le vote', 'La galerie (17)', 'Autonomie'],
    ['La rétroaction par les pairs', 'Le vote « Oui, et… » (17)', 'Compétence'],
    ['Les forces comme leviers', 'On est capables (18)', 'Autonomie'],
    ['Expansion et restriction (d’après « Mon utilisation de l’IA »)', 'L’étiquette en haut de chaque diapo : on ouvre pour chercher des idées (l’IA, les autres, soi-même), puis on resserre pour choisir', 'Autonomie'],
    ['L’IA au service du sens et de la créativité', 'Un projet, toutes vos disciplines (19) ; l’invite Copilot (14)', 'Sens'],
    ['L’objectivation', 'Le 3-2-1 (26)', 'Compétence']
  ], [3500, 4700, 1880], { firstAccent: true }),

  H1('06', 'Matériel et logistique'),
  tbl(['Quoi', 'Quantité', ''], [
    ['Cahier du participant imprimé (34 inscrits, plus une marge)', '40', '☐'],
    ['Fiches « Mon premier pas » (aussi dans le cahier)', '40', '☐'],
    ['Annexes : en ligne sur la page Ressources ; à imprimer seulement si on le souhaite (03, 04, 07, 09, 10)', '40', '☐'],
    ['Les participants apportent leur ordinateur (rappel dans le courriel de confirmation)', '—', '☐'],
    ['Post-it de vote jaune, orange et mauve (coup de cœur, oui et…, on est capables)', '3 par personne', '☐'],
    ['Post-it et marqueurs pour le mur d’enjeux, sur une table près de la porte', '2 paquets par séance', '☐'],
    ['Affiches de l’îlot : « Notre monde idéal » (05c) et « Notre projet » (05d), derrière le plexiglas', '4 de chaque par séance', '☐'],
    ['Crayons effaçables pour les surfaces verticales, et linges', '2 par îlot', '☐'],
    ['Affiche du mur d’enjeux, format 11 × 17 po ou agrandie (fichier 05b), une par séance', '2', '☐'],
    ['Cartons de signaux vert, jaune et rouge', '2 jeux', '☐'],
    ['Présentation sur 2 clés USB et vidéo enregistrée localement', '2', '☐'],
    ['Adaptateurs HDMI, USB-C et VGA, rallonge', '1 de chaque', '☐'],
    ['Invites Copilot testées, réponses sauvegardées dans le dossier partagé', '3', '☐']
  ], [7280, 2200, 600]),
  H2('Aménagement'),
  B('Quatre îlots, chacun près d’une surface verticale en plexiglas. À chaque place : le cahier du participant et 3 post-it de vote.'),
  B('Le mur d’enjeux à l’entrée, avec la table des post-it.'),
  B('Des îlots qui mêlent les quatre CSS et les profils, avec une direction ou une personne des services dans le plus d’îlots possible.'),

  H1('07', 'Après le colloque'),
  B('**Le mur d’enjeux régional.** Les post-it des quatre CSS deviennent une « carte des préoccupations » du Saguenay–Lac-Saint-Jean, rapportée en classe comme banque d’enjeux.'),
  B('**La relance à six semaines.** Un courriel aux participants (« Avez-vous fait votre premier pas ? ») transforme l’atelier en petite communauté de pratique. On y joint la question 6 du cadre d’innovation : « Qui l’a vue assez de fois pour la refaire sans moi ? »'),
  B('**Le jumelage interprogrammes.** Un groupe PPS ou DHS avec une enseignante matières (scénario C), prêt à démarrer en janvier.'),
  B('**L’accompagnement du CSI.** Un ou deux enseignants qui démarrent une démarche semblable, y compris dans les autres CSS.'),

  H1('08', 'À valider entre nous'),
  B('Les productions des élèves de PPS (photos de leurs cercles, de leur projet, ou vidéo) : lesquelles montre-t-on à la diapo 22 ? Les autorisations de diffusion sont-elles signées ?'),
  B('Les extraits de programmes à joindre à l’invite du coup de théâtre (diapo 19) : qui les prépare ?'),
  B('Quels outils de la démarche remettons-nous (gabarits, fiches, liens) ? Les déposons-nous dans l’équipe Teams du colloque ?'),
  B('Courriel de confirmation : demander aux participants d’apporter leur ordinateur pour Copilot.'),
  B('Qui fait la relance à six semaines, et à partir de quelle liste ?'),

  H1('09', 'Éthique des exemples concrets'),
  P('Les mots d’élèves et de parents de l’accroche proviennent de la classe d’Isabelle, du temps où elle enseignait. Ils ont été **recadrés et anonymisés** : aucun prénom, aucun nom, aucune signature. On précise à la salle qu’il s’agit de mots reçus, pas de témoignages sollicités.'),
];

const doc = new d.Document({
  creator: 'Isabelle Pedneault', title: 'Guide d’animation · Rêver le monde de demain', styles: styles(), numbering, fonts: EMBED,
  sections: [{ properties: { page: { ...page(), margin: { top: 1080, bottom: 1080, left: 1260, right: 1080 } } },
    footers: footer('Rêver le monde de demain · guide d’animation'), children: kids }]
});
save(doc, OUT);

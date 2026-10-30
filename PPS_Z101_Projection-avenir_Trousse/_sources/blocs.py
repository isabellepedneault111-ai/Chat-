"""Contenu des blocs C0 à C6 de la trousse Z101. Aucun nom d'élève : le fil rouge est Léo, un personnage fictif."""
from style import ico, SITE

L = lambda n: f'<div class="lines l{n}"></div>'
CB = lambda t: f'<span class="opt"><span class="cb"></span>{t}</span>'
OPTS = lambda items: "".join(CB(t) for t in items)
LOGIC = lambda t: f'<div class="logic">{ico("logique", 16)}<span><b>Raisonner avec logique :</b> {t}</span></div>'
SCALE = ('<div class="scale"><div class="s1"><span class="dot"></span>Je suis capable seul</div>'
         '<div class="s2"><span class="dot"></span>Avec un peu d\'aide</div><div class="s3"><span class="dot"></span>J\'ai besoin d\'aide</div></div>')


def ex(n, titre, corps, tag=""):
    return f'<div class="ex"><div class="h"><span class="n">{n}</span><b>{titre}</b><span class="tag">{tag}</span></div>{corps}</div>'


def leo(texte):
    return f'<div class="persona"><div class="av">L</div><div class="quote">{texte}</div></div>'


B = {}

# ---------------------------------------------------------------------------- C0
B["C0"] = dict(
    cat="base", titre="Mon carnet de route", sous="Le point de départ : comment le cours fonctionne et où je garde mes traces.",
    savoirs=[], lien=("Le site du cours", SITE),
    lede="Ce cours, c'est <b>ton projet</b>. Pas un examen sur toi : un plan pour la suite, que tu construis toi-même.",
    faire=["Je découvre les 3 étapes du cours.", "Je note mon groupe, mon atelier et mes personnes-ressources.",
           "Je joue à Mission Avenir pour faire mon premier portrait.", "Je garde mes traces dans mon cahier ou dans OneNote."],
    pourquoi="Ton projet de participation sociale guide tous tes autres cours au PPS. Il doit être prêt en premier.",
    reussi=["Je sais dans quel groupe je suis.", "Je sais où je vais en atelier.", "Je sais à qui demander de l'aide.", "J'ai téléchargé mon bilan Mission Avenir."],
    notes=[f'''
<p class="lede">Le cours se fait en <b>3 étapes</b>. Chaque étape correspond à un critère d'évaluation.</p>
<div class="g3 mt">
 <div class="card t" style="--c:#5B4BFF;--cl:#EEEDFF"><span class="tag" style="color:#5B4BFF">Étape 1 · blocs C1 et C2</span><div class="big mt">Me connaître</div><p class="small">Mes traits, mes habiletés, mes expériences, ce qui me limite.</p></div>
 <div class="card t" style="--c:#F2542D;--cl:#FFEDE8"><span class="tag" style="color:#F2542D">Étape 2 · blocs C3 et C4</span><div class="big mt">Ce qui me fait avancer</div><p class="small">Ma motivation, mes habitudes, moi en groupe, mes milieux.</p></div>
 <div class="card t" style="--c:#0E9F8E;--cl:#E2F6F3"><span class="tag" style="color:#0E9F8E">Étape 3 · blocs C5 et C6</span><div class="big mt">Mon projet</div><p class="small">Mes buts, mes cours, mes conditions de réussite, mes partenaires.</p></div>
</div>
<div class="g2 mt2">
 <div class="card"><h2>{ico("horloge")}Mon horaire</h2>
  <table class="t"><tr><th>Moment</th><th>Où je suis</th></tr>
  <tr><td>8 h 25</td><td>Rassemblement avec tout le groupe</td></tr>
  <tr><td>9 h 00 à 10 h 35</td><td>{OPTS(["Classe Z101", "Atelier"])}</td></tr>
  <tr><td>10 h 45 à 11 h 45</td><td>{OPTS(["Classe Z101", "Atelier"])}</td></tr></table>
  <p class="xs mt">Mardi et jeudi, les groupes changent de place. Regarde la page « Où suis-je aujourd'hui ? » sur le site.</p></div>
 <div class="card"><h2>{ico("personne")}Ma fiche</h2>
  <p>Mon groupe : {OPTS(["A", "B"])}</p>
  <p>Mon atelier :</p>{OPTS(["Grenier de Maria", "Ensachage et préparation", "Cantine de l'école", "Conciergerie et services"])}
  <p class="mt">L'adulte de mon atelier :</p>{L(2)}</div>
</div>''',
           f'''
<h2>{ico("groupe")}Les personnes qui peuvent m'aider ici</h2>
<table class="t grid"><tr><th style="width:38%">Pour…</th><th>Je demande à…</th></tr>
<tr><td>Une question sur mon projet</td><td></td></tr><tr><td>Une question sur mon atelier</td><td></td></tr>
<tr><td>Un problème d'horaire ou de transport</td><td></td></tr><tr><td>Quand ça ne va pas</td><td></td></tr></table>
<h2 class="mt2">{ico("crayon")}Où je garde mes traces</h2>
<ol class="steps"><li>Mon cahier : je le garde dans ma chemise Z101.</li><li>Mes PDF (bilan, journal d'atelier) : je les remets dans le devoir Teams.</li>
<li>Mes photos ou mes idées : je les mets dans ma section OneNote « Mon projet ».</li></ol>
<div class="card d mt2"><h2>{ico("fusee")}Mon idée de départ</h2><p class="small" style="color:#4A5068">Même si ce n'est pas clair encore. Ça va changer, et c'est normal.</p>
<p>Dans un an, j'aimerais…</p><div class="lines l3" style="background-image:repeating-linear-gradient(transparent 0 26px,#CDD2E0 26px 27px)"></div></div>'''],
    exos=[f'''
{ex(1, "Mission Avenir : mon premier portrait", f"""<ol class="steps"><li>Je vais sur le site du cours et je clique sur Mission Avenir.</li><li>Je joue jusqu'à la fin (environ 30 minutes).</li><li>Je télécharge mon bilan et je le remets dans Teams.</li></ol>
<p class="mt">Trois choses que le jeu m'a apprises sur moi :</p>{L(3)}""", "En ligne")}
{ex(2, "Ce que je sais déjà du PPS", f"""<p>Je suis {OPTS(["nouveau ou nouvelle au PPS", "déjà au PPS depuis un moment"])}</p>
<p class="mt">Si je suis nouveau : une question que j'ai.</p>{L(2)}<p>Si je suis déjà là : un conseil pour un nouveau.</p>{L(2)}""", "Réflexion")}
{ex(3, "Mon contrat avec moi-même", f"""<p>Pour réussir ce cours, je m'engage à :</p>{OPTS(["être là à 8 h 25", "remplir mon journal d'atelier", "demander de l'aide", "garder mes traces"])}<p class="mt">Autre :</p>{L(2)}""", "Engagement")}
<div class="mt">{SCALE}</div>'''],
    observe=dict(avant="Préparer la carte des groupes et des ateliers au TNI. Prévoir les duos (un nouveau avec un élève déjà en place).",
                 pendant="Circuler pendant Mission Avenir. Noter qui demande de l'aide, qui aide spontanément (futurs mentors).",
                 apres="Lire les bilans Mission Avenir : ils donnent une première lecture des 3 critères, sans note.",
                 regarder=["L'élève sait-il où il va et avec qui ?", "Les nouveaux ont-ils une personne de référence ?", "Quelles idées de départ reviennent souvent ?"],
                 diff="Pour un élève qui lit peu : le jeu lit les consignes à voix haute (bouton Écouter). L'idée de départ peut être dessinée."),
)

# ---------------------------------------------------------------------------- C1
B["C1"] = dict(
    cat="disp", titre="Qui je suis", sous="Mes traits de personnalité et mes habiletés.",
    savoirs=["Traits de personnalité", "Habiletés"], lien=("Mission Avenir · Me connaître", SITE + "/mission-avenir.html"),
    lede="Pour bâtir un projet qui te ressemble, il faut d'abord savoir <b>ce qui t'intéresse</b> et <b>ce que tu fais bien</b>.",
    faire=["Je nomme mes champs d'intérêt et mes aspirations.", "Je décris mon tempérament avec des exemples.",
           "Je fais l'inventaire de mes habiletés, dans 5 familles.", "Je relie une force à un moment de ma vie de tous les jours."],
    pourquoi="Un projet construit sur tes forces a plus de chances de réussir. Tu vas aussi t'en servir pour choisir tes cours.",
    reussi=["Je nomme 3 intérêts.", "Je décris mon tempérament avec un exemple.", "Je nomme au moins 3 habiletés de familles différentes.", "Je fais un lien entre une force et ma vie."],
    notes=[f'''
<div class="g2">
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 1</span><h2>Mes traits de personnalité</h2>
  <ul><li><b>Champs d'intérêt :</b> ce qui m'attire, ce que j'aime faire.</li><li><b>Aspirations :</b> ce que je souhaite pour plus tard.</li><li><b>Tempérament :</b> ma façon d'être, ma façon de réagir.</li></ul></div>
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 2</span><h2>Mes habiletés</h2>
  <p class="small">Ce que je sais faire. Il y en a 5 familles :</p>
  <ul class="small"><li><b>Intellectuelles :</b> comprendre, me souvenir, résoudre.</li><li><b>Sociales :</b> écouter, aider, parler aux autres.</li><li><b>Manuelles :</b> construire, réparer, cuisiner.</li><li><b>Artistiques :</b> dessiner, chanter, créer.</li><li><b>Organisationnelles :</b> planifier, ranger, être à l'heure.</li></ul></div>
</div>
<h2 class="mt2">{ico("idee")}Exemple : Léo, 24 ans</h2>
{leo("J'aime la musique et les jeux vidéo. Je suis calme, mais je bloque quand on me presse. Je suis bon avec mes mains : je répare des vélos. Je suis toujours à l'heure. Je voudrais travailler dans un endroit où on ne crie pas.")}
<table class="t mt"><tr><th>Ce que Léo dit</th><th>C'est…</th></tr>
<tr><td>J'aime la musique</td><td>un champ d'intérêt</td></tr><tr><td>Je suis calme, je bloque quand on me presse</td><td>son tempérament</td></tr>
<tr><td>Je répare des vélos</td><td>une habileté manuelle</td></tr><tr><td>Je suis toujours à l'heure</td><td>une habileté organisationnelle</td></tr>
<tr><td>Un endroit où on ne crie pas</td><td>une aspiration</td></tr></table>''' + '<div class="mots"><h2>' + ico("crayon") + 'Mes mots à moi</h2><div class="lines"></div></div>'],
    exos=[f'''
{ex(1, "Mes champs d'intérêt", f"""<p>J'encercle ou je coche ce qui m'attire.</p>{OPTS(["La musique", "Le sport", "La cuisine", "Les animaux", "L'informatique", "Le dessin et l'art", "La nature", "La mécanique", "La mode", "Aider les autres", "Les jeux vidéo", "Le bricolage"])}
<p class="mt">Autre :</p>{L(2)}""", "Traits")}
{ex(2, "Mon tempérament", f"""<p>Pour chaque paire, je coche ce qui me ressemble le plus.</p>
<table class="t"><tr><td>{CB("Calme")}</td><td>{CB("Énergique")}</td></tr><tr><td>{CB("J'aime être seul")}</td><td>{CB("J'aime être en groupe")}</td></tr>
<tr><td>{CB("Je prends mon temps")}</td><td>{CB("J'aime aller vite")}</td></tr><tr><td>{CB("J'aime la routine")}</td><td>{CB("J'aime le changement")}</td></tr></table>
<p class="mt">Un exemple de ma vie qui le montre :</p>{L(2)}""", "Traits")}
{ex(3, "Mes aspirations", f"""<p>Dans un an, j'aimerais…</p>{L(2)}<p>Dans cinq ans, j'aimerais…</p>{L(2)}""", "Traits")}''',
          f'''
{ex(4, "L'inventaire de mes habiletés", f"""<p>J'écris au moins une habileté dans chaque famille. Si je bloque, je regarde les cartes « Forces ».</p>
<table class="t grid"><tr><th style="width:26%">Famille</th><th>Ce que je sais faire</th></tr>
<tr><td>Intellectuelles</td><td style="height:34px"></td></tr><tr><td>Sociales</td><td style="height:34px"></td></tr><tr><td>Manuelles</td><td style="height:34px"></td></tr>
<tr><td>Artistiques</td><td style="height:34px"></td></tr><tr><td>Organisationnelles</td><td style="height:34px"></td></tr></table>""", "Habiletés")}
{ex(5, "Une force dans ma vie", f"""<p>Ma plus grande force, c'est…</p>{L(1)}<p>On la voit quand…</p>{L(2)}<p>Dans mon atelier, elle m'aide à…</p>{L(2)}
{LOGIC("je relie une force à un moment précis. « Je suis patient, <i>donc</i> à la cantine je reste calme quand la file est longue. »")}""", "Lien")}
<div class="mt">{SCALE}</div>'''],
    observe=dict(avant="Imprimer les cartes « Forces ». Projeter le cas de Léo.",
                 pendant="Faire nommer les traits avec des exemples concrets. Relancer : « Montre-moi un moment où c'est arrivé. »",
                 apres="Relire avec l'élève les choix « portrait » de Mission Avenir : est-ce cohérent avec le bloc ?",
                 regarder=["L'élève distingue-t-il un intérêt d'une habileté ?", "Ses exemples sont-ils précis et réels ?", "Nomme-t-il des forces dans plus d'une famille ?"],
                 diff="Cartes à trier plutôt qu'écrire. Un pair peut nommer une force qu'il voit chez l'élève (ça compte aussi)."),
)

# ---------------------------------------------------------------------------- C2
B["C2"] = dict(
    cat="disp", titre="Mon parcours", sous="Mes expériences et ce qui peut me limiter.",
    savoirs=["Expériences", "Facteurs de délimitation"], lien=("Mission Avenir · Mon parcours", SITE + "/mission-avenir.html"),
    lede="Ce que tu as vécu t'a appris des choses. Ce qui te limite aussi : le connaître, c'est <b>trouver comment le contourner</b>.",
    faire=["Je fais la ligne de vie de mes expériences.", "Je repère une expérience positive et ce qu'elle m'a appris.",
           "Je nomme un facteur qui peut me limiter.", "Je fais le lien entre ce facteur et ma vie de tous les jours, puis je trouve un moyen."],
    pourquoi="Un projet réaliste tient compte de ce qui est difficile pour toi. C'est la clé du premier critère : faire des liens.",
    reussi=["Je nomme 3 expériences de types différents.", "Je dis ce qu'une expérience m'a appris.", "Je nomme un facteur qui me limite.", "J'explique son effet sur ma vie et un moyen d'agir."],
    notes=[f'''
<div class="g2">
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 3</span><h2>Mes expériences</h2>
  <ul><li><b>Familiales :</b> à la maison, avec mes proches.</li><li><b>Scolaires :</b> à l'école, en formation.</li><li><b>Professionnelles :</b> un emploi, un stage, du bénévolat.</li><li><b>Socioculturelles :</b> un club, un sport, une activité.</li></ul></div>
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 4</span><h2>Mes facteurs de délimitation</h2>
  <p class="small">Ce qui peut rendre certaines choses plus difficiles :</p>
  <ul class="small"><li>un handicap physique ou intellectuel ;</li><li>un problème de santé ou de comportement ;</li><li>une difficulté d'apprentissage ou d'adaptation ;</li><li>une vulnérabilité émotionnelle ;</li><li>une difficulté dans les relations.</li></ul></div>
</div>
<div class="card k mt2"><h2>{ico("logique")}La chaîne de logique</h2>
<div class="g3" style="text-align:center"><div><div class="tag">Ce qui me limite</div><div class="big" style="color:var(--c)">Le bruit me stresse</div></div>
<div><div class="tag">L'effet sur ma vie</div><div class="big" style="color:var(--c)">Je quitte la cafétéria</div></div>
<div><div class="tag">Un moyen d'agir</div><div class="big" style="color:var(--c)">Je mange plus tôt</div></div></div></div>
<h2 class="mt2">{ico("idee")}Exemple : Léo</h2>
{leo("J'ai réparé des vélos avec mon oncle (expérience familiale). J'ai abandonné le secondaire 3 parce que je ne suivais plus (scolaire). Quand on me presse, je perds mes moyens : au dépanneur, j'ai quitté après deux semaines. Maintenant, je demande qu'on m'explique les tâches une à la fois.")}''' + '<div class="mots"><h2>' + ico("crayon") + 'Mes mots à moi</h2><div class="lines"></div></div>'],
    exos=[f'''
{ex(1, "Ma ligne de vie", f"""<p>Je place 4 à 6 moments importants. Au-dessus de la ligne : les bons moments. En dessous : les moments difficiles.</p>
<svg viewBox="0 0 640 150" width="100%" height="150"><line x1="10" y1="75" x2="630" y2="75" stroke="#0E1330" stroke-width="2"/><path d="M620 68l12 7-12 7" fill="none" stroke="#0E1330" stroke-width="2"/>
<text x="10" y="98" font-size="11" fill="#6B7189">Enfance</text><text x="560" y="98" font-size="11" fill="#6B7189">Aujourd'hui</text>
<g stroke="#B9BFD0" stroke-dasharray="3 4">{"".join(f'<line x1="{x}" y1="12" x2="{x}" y2="138"/>' for x in (120, 230, 340, 450))}</g></svg>""", "Expériences")}
{ex(2, "Une expérience qui m'a appris quelque chose", f"""<p>Type : {OPTS(["Familiale", "Scolaire", "Professionnelle", "Socioculturelle"])}</p><p>Ce qui s'est passé :</p>{L(2)}<p>Ce que j'ai appris :</p>{L(2)}""", "Expériences")}''',
          f'''
{ex(3, "Ce qui peut me limiter", f"""<p>Je coche ce qui me ressemble. C'est confidentiel : je peux aussi en parler seulement à Mme Lisa.</p>
{OPTS(["Je me fatigue vite", "Le bruit me dérange", "Lire est difficile", "J'oublie facilement", "Je stresse vite", "Les conflits me bloquent", "Me déplacer est difficile", "J'ai de la difficulté à me concentrer"])}<p class="mt">Autre :</p>{L(1)}""", "Délimitation")}
{ex(4, "Ma chaîne de logique", f"""<table class="t grid"><tr><th>Ce qui me limite</th><th>L'effet sur ma vie de tous les jours</th><th>Un moyen d'agir</th></tr><tr><td style="height:92px"></td><td></td><td></td></tr><tr><td style="height:92px"></td><td></td><td></td></tr></table>
{LOGIC("si… alors… <i>Si</i> le bruit me stresse, <i>alors</i> je choisis un atelier plus calme ou je prévois des bouchons.")}""", "Lien")}
<div class="mt">{SCALE}</div>'''],
    observe=dict(avant="Rappeler le caractère confidentiel de l'exercice 3. Prévoir un moment individuel pour les élèves qui le souhaitent.",
                 pendant="Modéliser la chaîne de logique avec un exemple neutre avant de laisser l'élève écrire la sienne.",
                 apres="Repérer les moyens d'agir proposés : ils nourriront les conditions de réussite du bloc C6.",
                 regarder=["L'élève nomme-t-il un facteur sans se dévaloriser ?", "Le lien entre le facteur et la vie quotidienne est-il explicite ?", "Le moyen d'agir est-il réaliste ?"],
                 diff="Ligne de vie avec photos ou pictogrammes. La chaîne de logique peut se faire à l'oral, l'enseignante écrit."),
)

# ---------------------------------------------------------------------------- C3
B["C3"] = dict(
    cat="pot", titre="Ce qui me fait avancer", sous="Ma motivation et mes habitudes de vie.",
    savoirs=["Facteurs de motivation", "Habitudes de vie"], lien=("Mission Avenir · Ma motivation", SITE + "/mission-avenir.html"),
    lede="Avoir un projet, c'est bien. Avoir <b>l'énergie et l'horaire</b> pour le faire, c'est ce qui le rend possible.",
    faire=["Je nomme ce qui me donne de l'énergie.", "Je repère ce qui me démotive et comment je réagis.",
           "Je trace ma semaine type.", "Je trouve les moments où je suis disponible pour mes cours et mon projet."],
    pourquoi="Le critère 2 demande une vision réaliste de ton potentiel. Ton horaire réel en fait partie.",
    reussi=["Je nomme 2 sources de motivation.", "Je nomme un moyen de persévérer quand c'est difficile.", "Ma semaine type est remplie.", "Je nomme mes moments disponibles."],
    notes=[f'''
<div class="g2">
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 5</span><h2>Mes facteurs de motivation</h2>
  <ul><li><b>Efforts et persévérance :</b> continuer même quand c'est dur.</li><li><b>Sentiment d'appartenance :</b> me sentir à ma place.</li><li><b>Sentiment de compétence :</b> me sentir capable.</li><li><b>Soutien et aide :</b> avoir quelqu'un sur qui compter.</li></ul></div>
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 6</span><h2>Mes habitudes de vie</h2>
  <ul><li><b>Routine :</b> ce que je fais chaque jour, dans le même ordre.</li><li><b>Horaire :</b> mes heures de sommeil, de repas, de transport.</li><li><b>Disponibilité :</b> les moments libres pour mes cours et mon projet.</li></ul></div>
</div>
<h2 class="mt2">{ico("idee")}Exemple : Léo</h2>
{leo("Ce qui me motive : voir un vélo réparé qui roule, et quand mon oncle me dit bravo. Quand c'est difficile, je fais une pause de 5 minutes avec de la musique. Je me couche tard, donc le matin c'est dur. Mon autobus arrive à 8 h 10.")}
<div class="card k mt"><h2>{ico("logique")}Ce que Léo en conclut</h2><p>Je suis plus motivé quand je vois le résultat de mon travail. <b>Donc</b> un atelier concret, comme la conciergerie, me convient. Je me couche tard, <b>donc</b> je dois avancer mon coucher les soirs de cours.</p></div>''' + '<div class="mots"><h2>' + ico("crayon") + 'Mes mots à moi</h2><div class="lines"></div></div>'],
    exos=[f'''
{ex(1, "Ce qui me donne de l'énergie", f"""{OPTS(["Voir le résultat de mon travail", "Être félicité", "Apprendre quelque chose", "Aider quelqu'un", "Être avec mes amis", "Gagner de l'argent", "Être utile", "Relever un défi"])}<p class="mt">Ma première source de motivation, c'est…</p>{L(1)}""", "Motivation")}
{ex(2, "Quand ça devient difficile", f"""<p>Ce qui me démotive :</p>{L(2)}<p>D'habitude, je réagis en…</p>{L(1)}<p>Un moyen pour continuer quand même :</p>{L(2)}""", "Persévérance")}
{ex(3, "Où je me sens à ma place", f"""<p>Au centre, je me sens à ma place quand…</p>{L(2)}<p>Ce qui m'aiderait à m'y sentir encore mieux :</p>{L(1)}""", "Appartenance")}''',
          f'''
{ex(4, "Ma semaine type", f"""<p>Je colorie ou j'écris ce que je fais. Je laisse en blanc les moments libres.</p>
<table class="t grid" style="font-size:8.6pt"><tr><th></th>{"".join(f"<th>{j}</th>" for j in ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"])}</tr>
{"".join(f'<tr><td style="width:70px"><b>{m}</b></td>' + "<td style='height:40px'></td>" * 7 + "</tr>" for m in ["Matin", "Midi", "Après-midi", "Souper", "Soir"])}</table>""", "Habitudes")}
{ex(5, "Mes moments disponibles", f"""<p>Pour mes cours et mon projet, je suis disponible :</p>{L(2)}<p>Une habitude à changer pour mieux réussir :</p>{L(1)}
{LOGIC("je me couche à ___ et je dois partir à ___ , <i>donc</i> j'ai besoin de ___ heures de sommeil pour être en forme.")}""", "Disponibilité")}
<div class="mt">{SCALE}</div>'''],
    observe=dict(avant="Avoir un horaire vierge projeté. Rappeler l'horaire du centre (8 h 25, P1-P2, P3).",
                 pendant="Faire relier motivation et choix d'atelier. Relancer : « Qu'est-ce qui t'a donné de l'énergie cette semaine ? »",
                 apres="Comparer la semaine type avec les absences ou retards : y a-t-il un obstacle d'horaire ou de transport ?",
                 regarder=["La motivation nommée est-elle personnelle (et non « mes parents veulent ») ?", "L'élève a-t-il un moyen concret de persévérer ?", "Les disponibilités sont-elles réalistes ?"],
                 diff="Semaine type avec pictogrammes ou autocollants. Lien direct avec le journal d'atelier (question « Comment j'ai trouvé l'atelier »)."),
)

# ---------------------------------------------------------------------------- C4
B["C4"] = dict(
    cat="pot", titre="Moi avec les autres", sous="Mon fonctionnement en groupe et mes milieux d'appartenance.",
    savoirs=["Fonctionnement en groupe", "Milieux d'appartenance"], lien=("Mission Avenir · Mon équipe", SITE + "/mission-avenir.html"),
    lede="Personne ne réalise un projet seul. Voyons <b>comment tu fonctionnes en équipe</b> et <b>qui t'entoure</b>.",
    faire=["J'observe mon fonctionnement en groupe, en classe et en atelier.", "Je nomme une force et un défi en équipe.",
           "Je trace mon réseau : les personnes et les milieux autour de moi.", "Je choisis une personne significative pour mon projet."],
    pourquoi="Ton réseau, c'est la contribution de tes milieux. Le critère 2 en tient compte.",
    reussi=["Je nomme une force en groupe.", "Je nomme un défi en groupe et un moyen.", "Mon réseau a au moins 4 personnes.", "Je sais qui peut m'aider pour mon projet."],
    notes=[f'''
<div class="g2">
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 7</span><h2>Mon fonctionnement en groupe</h2>
  <p class="small">Cinq attitudes qu'on observe en équipe :</p><ul><li>l'enthousiasme ;</li><li>le respect ;</li><li>la tolérance ;</li><li>la collaboration ;</li><li>la socialisation (aller vers les autres).</li></ul></div>
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 8</span><h2>Mes milieux d'appartenance</h2>
  <ul class="small"><li><b>Le centre de formation :</b> enseignants, TES, autres élèves.</li><li><b>Mon réseau social :</b> famille, amis, voisins.</li><li><b>Mes services :</b> hébergement, intervenant, aide adaptée.</li><li><b>Ma famille :</b> parent naturel ou d'accueil.</li></ul></div>
</div>
<h2 class="mt2">{ico("idee")}Exemple : Léo</h2>
{leo("En équipe, je suis respectueux et je fais ma part. Mais je ne parle pas beaucoup : j'attends qu'on vienne me chercher. Les personnes qui comptent : mon oncle, mon intervenante du CLSC, et Kevin, de mon atelier.")}
<div class="card k mt"><h2>{ico("logique")}Pourquoi c'est important</h2><p>Mon oncle connaît la mécanique, <b>donc</b> il peut m'aider à trouver un stage. Mon intervenante connaît les services, <b>donc</b> elle peut m'aider pour le transport.</p></div>''' + '<div class="mots"><h2>' + ico("crayon") + 'Mes mots à moi</h2><div class="lines"></div></div>'],
    exos=[f'''
{ex(1, "Moi en équipe", f"""<p>Pour chaque attitude, je choisis une couleur.</p>
<table class="t grid"><tr><th>Attitude</th><th style="width:16%">Ça va bien</th><th style="width:16%">Moyen</th><th style="width:16%">À travailler</th></tr>
{"".join(f'<tr><td>{a}</td><td class="center">{CB("")}</td><td class="center">{CB("")}</td><td class="center">{CB("")}</td></tr>' for a in ["Enthousiasme", "Respect", "Tolérance", "Collaboration", "Aller vers les autres"])}</table>
<p class="mt">Un exemple vu dans mon atelier :</p>{L(2)}""", "Groupe")}
{ex(2, "Mon défi en équipe", f"""<p>Ce qui est plus difficile pour moi en groupe :</p>{L(1)}<p>Un moyen que je vais essayer :</p>{L(1)}""", "Groupe")}''',
          f'''
{ex(3, "Mon réseau", f"""<p>J'écris mon nom au centre. Plus une personne est proche de moi, plus je la place près du centre.</p>
<svg viewBox="0 0 640 300" width="100%" height="300"><g fill="none" stroke="#F2542D"><circle cx="320" cy="150" r="140" stroke-dasharray="3 6" opacity=".5"/><circle cx="320" cy="150" r="92" stroke-dasharray="3 6" opacity=".7"/><circle cx="320" cy="150" r="44" stroke-width="2"/></g>
<text x="320" y="154" text-anchor="middle" font-size="12" font-weight="800" fill="#0E1330">MOI</text>
<g font-size="10" fill="#6B7189" font-weight="700"><text x="40" y="24">Centre de formation</text><text x="480" y="24">Famille</text><text x="40" y="292">Amis et réseau</text><text x="480" y="292">Services</text></g></svg>""", "Milieux")}
{ex(4, "Ma personne significative pour mon projet", f"""<p>Son nom ou son rôle :</p>{L(1)}<p>Elle peut m'aider à…</p>{L(1)}<p>Quand est-ce que je peux la voir ?</p>{L(1)}
{LOGIC("je choisis une personne <i>parce que</i> son aide correspond à un besoin de mon projet.")}""", "Partenaire")}
<div class="mt">{SCALE}</div>'''],
    observe=dict(avant="Faire le lien avec les ateliers : l'exercice 1 se remplit après une séance d'atelier.",
                 pendant="Accepter des personnes de services (intervenant, éducatrice) : elles comptent. Respecter les élèves qui ont un petit réseau.",
                 apres="Repérer les élèves isolés : la personne significative peut d'abord être au centre (enseignante, TES, mentor d'atelier).",
                 regarder=["L'élève s'évalue-t-il avec réalisme en groupe ?", "Distingue-t-il les milieux (centre, réseau, services) ?", "La personne choisie peut-elle réellement aider ?"],
                 diff="Réseau avec des jetons ou des photos. Le défi en équipe peut être nommé par l'adulte d'atelier, avec l'accord de l'élève."),
)

# ---------------------------------------------------------------------------- C5
B["C5"] = dict(
    cat="proj", titre="Mon projet prend forme", sous="Mes buts et mes besoins de formation.",
    savoirs=["Buts", "Besoins de formation"], lien=("Le cours Z101 · Projet et cours liés", "https://ppscssdlj.netlify.app"),
    lede="On passe de « j'aimerais » à <b>un vrai plan</b> : des buts clairs et les cours qui vont t'aider à les atteindre.",
    faire=["Je relis mes blocs C1 à C4 et je souligne ce qui revient.", "J'écris mon projet en une phrase.",
           "Je découpe mon projet en buts : court, moyen et long terme.", "Je choisis les cours du programme qui répondent à mes besoins."],
    pourquoi="C'est le cœur du critère 3 : un projet méthodique, avec des buts et des cours liés.",
    reussi=["Mon projet tient en une phrase.", "J'ai un but à court, à moyen et à long terme.", "Mes buts sont clairs et réalistes.", "J'ai choisi 2 à 4 cours liés à mon projet."],
    notes=[f'''
<div class="g2">
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 9</span><h2>Mes buts</h2>
  <ul><li><b>Court terme :</b> d'ici quelques semaines.</li><li><b>Moyen terme :</b> d'ici la fin de l'année.</li><li><b>Long terme :</b> dans quelques années.</li></ul>
  <p class="small mt">Un bon but est <b>clair</b> (je sais quoi faire), <b>réaliste</b> (c'est possible) et <b>daté</b> (je sais quand).</p></div>
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 10</span><h2>Mes besoins de formation</h2>
  <p class="small">Le programme a 27 cours en 4 thématiques :</p>
  <ul class="small"><li><b>Les conditions de vie :</b> santé, hygiène, alimentation.</li><li><b>Les relations sociales :</b> communication, réseau.</li><li><b>Le milieu de vie :</b> appartement, entretien.</li><li><b>La communauté :</b> achats, budget, loisirs, déplacements.</li></ul></div>
</div>
<h2 class="mt2">{ico("idee")}Exemple : Léo</h2>
{leo("Mon projet : travailler dans un atelier de vélos, à temps partiel, d'ici deux ans.")}
<table class="t mt"><tr><th>Terme</th><th>But de Léo</th><th>Cours lié</th></tr>
<tr><td>Court</td><td>Venir à tous mes ateliers de conciergerie d'ici Noël.</td><td>Déplacements quotidiens (Z130)</td></tr>
<tr><td>Moyen</td><td>Faire un stage d'un jour dans un atelier de vélos au printemps.</td><td>Interactions au quotidien (Z112)</td></tr>
<tr><td>Long</td><td>Avoir un emploi à temps partiel dans deux ans.</td><td>Activités productives (Z126)</td></tr></table>''' + '<div class="mots"><h2>' + ico("crayon") + 'Mes mots à moi</h2><div class="lines"></div></div>'],
    exos=[f'''
{ex(1, "Ce qui revient dans mes blocs", f"""<p>Je relis C1 à C4. J'écris ce qui revient souvent :</p>
<table class="t grid"><tr><th>Mes intérêts et mes forces</th><th>Ce qui me motive</th><th>Ce qui me limite</th></tr><tr><td style="height:70px"></td><td></td><td></td></tr></table>""", "Synthèse")}
{ex(2, "Mon projet en une phrase", f"""<p class="amorce">Je veux… (quoi) … pour… (pourquoi) … d'ici… (quand).</p>{L(2)}
{LOGIC("mon projet est cohérent <i>parce qu'</i>il utilise une de mes forces (C1) et tient compte de ce qui me limite (C2).")}""", "Projet")}
{ex(3, "Mes buts", f"""<table class="t grid"><tr><th style="width:18%">Terme</th><th>Mon but</th><th style="width:22%">Quand</th></tr>
<tr><td>Court</td><td style="height:44px"></td><td></td></tr><tr><td>Moyen</td><td style="height:44px"></td><td></td></tr><tr><td>Long</td><td style="height:44px"></td><td></td></tr></table>""", "Buts")}''',
          f'''
{ex(4, "Les cours qui m'aident", f"""<p>Je regarde les cartes des 27 cours. Je choisis ceux qui répondent à mes besoins.</p>
<table class="t grid"><tr><th>Cours choisi</th><th>Thématique</th><th>Il m'aide à… (lien avec mon but)</th></tr>
{"<tr><td style='height:46px'></td><td></td><td></td></tr>" * 4}</table>
{LOGIC("je choisis un cours <i>parce qu'</i>il répond à un besoin précis de mon projet, pas seulement parce qu'il a l'air intéressant.")}""", "Formation")}
{ex(5, "Je vérifie mes buts", f"""<table class="t"><tr><th>Mon but de court terme est…</th><th>Oui</th><th>Pas encore</th></tr>
{"".join(f'<tr><td>{q}</td><td>{CB("")}</td><td>{CB("")}</td></tr>' for q in ["clair : je sais quoi faire", "réaliste : c'est possible pour moi", "daté : je sais quand"])}</table>""", "Vérification")}
<div class="mt">{SCALE}</div>'''],
    observe=dict(avant="Imprimer les cartes des 27 cours. Avoir les blocs C1 à C4 de l'élève sous la main.",
                 pendant="Faire reformuler les buts vagues (« être heureux ») en buts observables et datés.",
                 apres="Vérifier la cohérence : chaque cours choisi est-il relié à un but ? L'outil Z101 (Projet et cours liés) peut servir de support.",
                 regarder=["Le projet tient-il compte des réalités (C1-C2) et du potentiel (C3-C4) ?", "Les buts sont-ils hiérarchisés (court, moyen, long) ?", "Le choix des cours est-il justifié ?"],
                 diff="Projet en une phrase avec un gabarit à compléter. Tri des cartes de cours en 3 piles : oui, peut-être, non."),
)

# ---------------------------------------------------------------------------- C6
B["C6"] = dict(
    cat="proj", titre="Je me prépare à réussir", sous="Mes conditions de réussite et mes partenaires.",
    savoirs=["Conditions de réussite", "Partenaires"], lien=("Le cours Z101 · One-pager", "https://ppscssdlj.netlify.app"),
    lede="Un projet réussit quand on a prévu <b>les obstacles</b>, <b>les échéances</b> et <b>les personnes</b> qui nous accompagnent.",
    faire=["Je classe mes priorités.", "Je prévois les échéances, le transport et les coûts.",
           "Je choisis mes mesures de suivi.", "Je nomme mes partenaires et leur rôle, puis je les informe de mon projet."],
    pourquoi="C'est la dernière pièce du critère 3. Ensuite, tu présentes ton projet complet.",
    reussi=["Mes priorités sont classées.", "J'ai prévu le transport et les coûts.", "J'ai une mesure de suivi.", "Mes partenaires savent ce qu'ils vont faire."],
    notes=[f'''
<div class="g2">
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 11</span><h2>Mes conditions de réussite</h2>
  <ul><li><b>Priorités :</b> ce que je fais en premier.</li><li><b>Échéances :</b> les dates à respecter.</li><li><b>Transport et coûts :</b> comment je me rends, combien ça coûte.</li><li><b>Mesures de suivi :</b> quand et avec qui je fais le point.</li></ul></div>
 <div class="card t"><span class="tag" style="color:var(--c)">Savoir 12</span><h2>Mes partenaires</h2>
  <p class="small">Pour chaque partenaire, je précise :</p><ul><li>la <b>ressource</b> qu'il m'apporte ;</li><li>sa <b>responsabilité</b> dans mon projet ;</li><li>son <b>expertise</b> ;</li><li>sa <b>disponibilité</b>.</li></ul></div>
</div>
<h2 class="mt2">{ico("idee")}Exemple : Léo</h2>
<table class="t"><tr><th>Partenaire</th><th>Responsabilité</th><th>Disponibilité</th></tr>
<tr><td>Son oncle (mécanicien)</td><td>Lui trouver un atelier pour un stage d'un jour</td><td>Les fins de semaine</td></tr>
<tr><td>Son intervenante</td><td>L'aider à avoir une carte d'autobus réduite</td><td>Aux deux semaines</td></tr>
<tr><td>Mme Lisa</td><td>Faire le point sur son projet</td><td>Le dernier jeudi du mois</td></tr></table>
<div class="card k mt"><h2>{ico("logique")}Sa mesure de suivi</h2><p>Le dernier jeudi du mois, Léo relit ses buts avec Mme Lisa. S'il n'a pas avancé, ils cherchent ensemble <b>pourquoi</b> et ils ajustent.</p></div>''' + '<div class="mots"><h2>' + ico("crayon") + 'Mes mots à moi</h2><div class="lines"></div></div>'],
    exos=[f'''
{ex(1, "Mes priorités", f"""<p>J'écris les étapes de mon projet et je les numérote dans l'ordre.</p><table class="t grid"><tr><th style="width:12%">Ordre</th><th>Étape</th><th style="width:24%">Échéance</th></tr>{"<tr><td style='height:34px'></td><td></td><td></td></tr>" * 4}</table>""", "Conditions")}
{ex(2, "Transport et coûts", f"""<p>Pour mon projet, je me déplace en {OPTS(["autobus", "transport adapté", "à pied ou à vélo", "auto (on me conduit)"])}</p>
<p>Ce que ça peut coûter (passe, matériel, inscription) :</p>{L(1)}<p>Si c'est un problème, je demande de l'aide à :</p>{L(1)}""", "Conditions")}
{ex(3, "Mon suivi", f"""<p>Je fais le point sur mon projet {OPTS(["chaque semaine", "aux deux semaines", "chaque mois"])} avec :</p>{L(1)}""", "Suivi")}''',
          f'''
{ex(4, "Mes partenaires", f"""<table class="t grid"><tr><th>Partenaire</th><th>Ce qu'il m'apporte</th><th>Sa responsabilité</th><th style="width:18%">Disponibilité</th></tr>{"<tr><td style='height:46px'></td><td></td><td></td><td></td></tr>" * 3}</table>""", "Partenaires")}
{ex(5, "J'informe un partenaire", f"""<p>Je prépare ce que je vais lui dire :</p><p><b class="c1">1.</b> Mon projet en une phrase :</p>{L(1)}<p><b>2.</b> Ce que j'aimerais qu'il fasse :</p>{L(1)}<p><b>3.</b> Quand on pourrait se reparler :</p>{L(1)}
<p class="mt">Je l'ai informé le : ____________ &nbsp; Sa réaction :</p>{L(1)}""", "Partenaires")}
{LOGIC("je vérifie que chaque obstacle nommé au bloc C2 a maintenant une condition de réussite ou un partenaire.")}
<div class="mt">{SCALE}</div>'''],
    observe=dict(avant="Prévoir du temps pour que l'élève informe réellement un partenaire (appel, courriel, rencontre).",
                 pendant="Faire relire les obstacles du bloc C2 : chacun devrait avoir une réponse ici.",
                 apres="Le bloc C6 se termine par « Mon projet en une page » : c'est une trace centrale pour l'épreuve.",
                 regarder=["Les conditions sont-elles concrètes (dates, transport, coûts) ?", "Les partenaires ont-ils un rôle précis ?", "Le partenaire a-t-il vraiment été informé ?"],
                 diff="Jeu de rôle avant d'informer un partenaire. Gabarit de courriel ou de message texte."),
)

ORDRE = ["C0", "C1", "C2", "C3", "C4", "C5", "C6"]

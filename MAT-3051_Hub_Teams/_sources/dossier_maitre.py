"""Dossier maître MAT-3051-2 : rassemble la trousse existante (cahier par bloc, feuilles de notes, exercices, corrigés, guides).
Usage : python3 dossier_maitre.py  (réutilise le style de la trousse Z101, économe en encre)"""
import os, sys, subprocess
ICI = os.path.dirname(os.path.abspath(__file__))
R = os.path.dirname(ICI)
Z101 = os.path.join(os.path.dirname(R), "PPS_Z101_Projection-avenir_Trousse", "_sources")
sys.path.insert(0, Z101)
import style
from style import doc, ico, CAT
from blocs import L, CB, OPTS

style.COURS = "MAT-3051-2"
style.TITRE_COURS = "Modélisation algébrique et graphique"
style.FOOT = "Formation générale des adultes"
CAT["mat"] = dict(nom="Mathématique", court="MAT-3051", c="#1D4ED8", cl="#E8EEFC", crit="")
C = "#1D4ED8"

BLOCS = [
 dict(n=1, t="Un p'tit brin de révision", s="Résoudre une équation à une variable", p="5 à 11", np=7, d="1 à 2 séances",
      cap=["Nommer variable, coefficient, terme et constante", "Résoudre une équation du 1er degré", "Vérifier par substitution"],
      piege=["Erreur de signe en distribuant un négatif : −2(x + 1) = −2x − 2", "Oublier de vérifier la solution"],
      obs="L'élève vérifie-t-il spontanément sa réponse ? Garde-t-il l'équilibre (même opération des deux côtés) ?",
      diff="Image de la balance ; « chasser » les fractions en multipliant tout ; détecteur d'erreurs de la feuille de notes."),
 dict(n=2, t="Les inéquations", s="Inégalités, intervalles et inéquations", p="12 à 35", np=24, d="3 à 4 séances",
      cap=["Lire et écrire < ≤ > ≥", "Noter un ensemble en intervalle et sur une droite numérique", "Résoudre et traduire un problème en contexte"],
      piege=["Oublier d'inverser le symbole en divisant par un négatif", "« Au moins » se traduit par ≥, pas par >"],
      obs="Les mots-signaux sont-ils bien traduits ? L'élève sait-il dire si la borne est incluse ?",
      diff="Truc : « le 100 lui-même, a-t-il le droit ? » ; trois façons d'écrire le même ensemble côte à côte."),
 dict(n=3, t="La droite", s="Fonction affine, taux de variation et modélisation", p="36 à 99", np=64, d="6 à 8 séances",
      cap=["Situer des points (x, y)", "Distinguer variables indépendante et dépendante", "Interpréter a et b en contexte", "Trouver la règle y = ax + b et tracer la droite"],
      piege=["Inverser x et y dans un couple", "Confondre a (taux) et b (valeur initiale)"],
      obs="L'élève explique-t-il a et b avec les unités du contexte (« 15 $ par heure ») ?",
      diff="Le plus long bloc : utiliser les 8 sous-pages déjà découpées (3.1 à 3.6c) dans 99_ENSEIGNANTE_SEULEMENT."),
 dict(n=4, t="Fonctions rationnelle et définie par parties", s="k/x, synthèse affine-rationnelle, parties et nuages", p="101 à 125", np=25, d="3 à 4 séances",
      cap=["Reconnaître une fonction rationnelle", "Trouver k et la règle y = k/x", "Choisir entre affine et rationnelle", "Lire une fonction par parties ; associer un nuage à un modèle"],
      piege=["Une courbe qui descend n'est pas toujours rationnelle : faire le test x · y"],
      obs="L'élève justifie-t-il son choix de modèle avec la table (produit constant ou écart constant) ?",
      diff="Tableau de synthèse affine/rationnelle ; tri de cartes-situations en deux piles."),
 dict(n=5, t="Fonction ou relation ?", s="Reconnaître une fonction dans les quatre registres", p="126 à 132", np=7, d="1 à 2 séances",
      cap=["Définir une fonction", "La reconnaître dans une table, un graphique, une règle ou une situation", "Justifier sa réponse"],
      piege=["Regarder si les y se répètent : c'est la répétition d'un x (avec des y différents) qui brise la fonction"],
      obs="La justification nomme-t-elle un x qui a deux y ?",
      diff="Image de la machine distributrice : un bouton donne toujours le même produit."),
 dict(n=6, t="Réciproque d'une fonction", s="Renverser la question", p="133 à 151", np=19, d="2 à 3 séances",
      cap=["Expliquer la réciproque", "La représenter en table, règle, graphique et mots", "Dire si la réciproque est une fonction"],
      piege=["Échanger x et y sans isoler y ensuite", "Oublier de renommer les axes (salaire ↔ heures)"],
      obs="L'élève formule-t-il la question retournée en mots avant de calculer ?",
      diff="Partir d'une situation de paie : « Combien vais-je gagner ? » devient « Combien d'heures pour gagner 500 $ ? »."),
 dict(n=7, t="Propriétés des fonctions", s="Lire et raconter un graphique", p="152 à 166", np=15, d="2 séances",
      cap=["Décrire domaine, image, variation, extremums, signe, coordonnées à l'origine", "Raconter l'histoire d'un graphique"],
      piege=["La croissance et le signe se donnent avec des valeurs de x, pas de y"],
      obs="Le récit du graphique utilise-t-il le vocabulaire et les unités ?",
      diff="« Un graphique, c'est une histoire » : faire raconter oralement avant d'écrire."),
 dict(n=8, t="Systèmes d'équations", s="Table, graphique et comparaison", p="166 à 196", np=31, d="4 séances",
      cap=["Résoudre par table, par graphique et par comparaison", "Interpréter la solution pour prendre une décision"],
      piege=["Trouver x et oublier de calculer y", "Donner un couple sans phrase de conclusion"],
      obs="La conclusion répond-elle à la question (quel forfait choisir, à partir de quand) ?",
      diff="Deux forfaits de cellulaire ou de location : le point de rencontre, c'est le moment où ça change."),
]
TOT = 9


def pg(titre, corps, kick, sous="", n=1):
    return style.page("mat", titre, corps, kick=kick, sous=sous, etiquette="Dossier maître", n=n, tot=TOT)


def couverture():
    return f'''<section class="page cover">
<svg style="position:absolute;right:0;top:0" width="300" height="300" viewBox="0 0 300 300"><g fill="none" stroke-width="1.4"><line x1="40" y1="0" x2="300" y2="260" stroke="{C}"/><line x1="110" y1="0" x2="300" y2="190" stroke="#0E9F8E"/><line x1="180" y1="0" x2="300" y2="120" stroke="#F2542D"/></g><rect x="250" y="30" width="16" height="16" fill="{C}"/></svg>
<div style="margin-top:2.6in" class="kick" ><span style="color:{C}">MAT-3051-2 · Dossier maître</span></div>
<h1 style="margin-top:12px">Modélisation<br>algébrique<br>et graphique</h1>
<div class="sous">Le guide de l'enseignante : la trousse Teams déjà montée, la séquence des 8 blocs, ce qu'on observe, l'entrée continue et le suivi.</div>
<div class="g4" style="margin-top:.8in;max-width:6.4in">{"".join(f'<div><div style="height:4px;background:{C};border-radius:4px;opacity:{0.4 + i * 0.2}"></div><div style="font-weight:800;margin-top:8px">{t}</div></div>' for i, t in enumerate(["Équations", "Droites", "Fonctions", "Systèmes"]))}</div>
<div class="foot" style="margin-top:auto"><span>CFGA De La Jonquière</span><span>Trousse MAT-3051</span></div></section>'''


def p_trousse():
    corps = f'''<div class="dense">
<p class="lede" style="font-size:12pt">Tout le matériel est <b>déjà monté</b> et prêt à déposer dans Teams. <b>Un dossier = une section OneNote, un fichier = une page.</b></p>
<table class="t mt"><tr><th style="width:30%">Dossier</th><th>Contenu</th><th style="width:22%">Pour qui</th></tr>
<tr><td><b>00_COMMENCER-ICI</b></td><td>Ce dossier maître · plan de rencontre de 60 min · guide Teams pas à pas · guide OneNote avec tous les liens vidéo</td><td>Enseignante</td></tr>
<tr><td><b>Bloc-0</b> Commencer ici</td><td>Passeport de l'élève et « Ma démarche » : il coche son avancement, bloc par bloc</td><td>Élève</td></tr>
<tr><td><b>Bloc-1 à Bloc-8</b></td><td>1 · Cahier du bloc (pages du cahier) · 2 · Feuille de notes (l'essentiel, vidéos, « Mon exemple perso », feu de circulation) · 3 · Exercices supplémentaires</td><td>Élève</td></tr>
<tr><td><b>99_ENSEIGNANTE_SEULEMENT</b></td><td>Corrigés des exercices supplémentaires · cahier découpé par sous-section · banque d'exercices modifiable (Word)</td><td>Enseignante</td></tr></table>
<div class="g3 mt2"><div class="card t"><h2>{ico("crayon")}Feuille de notes</h2><p>« Je serai capable de… », l'essentiel en une page, les pièges fréquents, les vidéos en code QR et « Mon exemple perso ».</p></div>
<div class="card t"><h2>{ico("ok")}Feu de circulation</h2><p>L'élève s'autoévalue en couleur à la fin de chaque bloc : vert, je suis capable seul ; jaune, avec un peu d'aide ; rouge, j'ai besoin d'aide. Pas de note.</p></div>
<div class="card t"><h2>{ico("loupe")}Math-o-portrait</h2><p>Le moment où l'enseignante valide le bloc avec l'élève avant de libérer le corrigé ou le bloc suivant. Il est daté dans le passeport.</p></div></div>
<h2 class="mt2">{ico("etapes")}Les 5 décisions d'équipe (plan de rencontre)</h2>
<table class="t"><tr><th style="width:36%">Décision</th><th>Recommandation</th><th style="width:18%">Notre choix</th></tr>
<tr><td>Où vivent les blocs ?</td><td>Une section par bloc dans le bloc-notes de l'élève, et une copie maîtresse dans la Bibliothèque de contenu</td><td></td></tr>
<tr><td>Tout d'un coup ou bloc par bloc ?</td><td>Bloc par bloc, à l'élève qui arrive au bloc (entrée continue)</td><td></td></tr>
<tr><td>Bloc 3 (64 pages) ?</td><td>Une page avec 8 sous-pages, déjà découpées</td><td></td></tr>
<tr><td>Les corrigés ?</td><td>Dans l'espace de l'enseignante, libérés après le Math-o-portrait</td><td></td></tr>
<tr><td>Les coquilles du cahier ?</td><td>Liste et corrections en page 2 du plan de rencontre</td><td></td></tr></table></div>'''
    return pg("La trousse, déjà montée", corps, kick="Organisation", sous="Ce qui est prêt et comment c'est rangé.", n=2)


def p_sequence():
    rows = "".join(f'<tr><td><b style="color:{C}">{b["n"]}</b></td><td><b>{b["t"]}</b><div class="xs">{b["s"]}</div></td><td>p. {b["p"]}<div class="xs">{b["np"]} pages</div></td><td class="small">{"<br>".join(b["cap"])}</td><td>{b["d"]}</td></tr>' for b in BLOCS)
    corps = f'''<div class="dense" style="font-size:8.8pt"><table class="t"><tr><th>Bloc</th><th style="width:26%">Titre</th><th style="width:12%">Cahier</th><th>Je serai capable de…</th><th style="width:13%">Durée suggérée</th></tr>{rows}</table>
<div class="g3 mt"><div class="phase pa"><span class="tag">Avant</span>L'élève lit « Je serai capable de… » et regarde la vidéo du bloc (code QR de la feuille de notes).</div>
<div class="phase pp"><span class="tag">Pendant</span>Il travaille dans le cahier, puis il complète la feuille de notes avec son exemple perso.</div>
<div class="phase pap"><span class="tag">Après</span>Exercices supplémentaires, feu de circulation, puis Math-o-portrait avec l'enseignante.</div></div>
<p class="xs mt">Les durées sont indicatives : en entrée continue, chaque élève avance à son rythme. Elles aident à repérer un élève qui stagne.</p></div>'''
    return pg("La séquence des 8 blocs", corps, kick="Planification", sous="Environ 25 à 30 séances, selon le rythme de l'élève.", n=3)


def fiche(b):
    return f'''<div class="card" style="border-left:5px solid {C}"><h3 style="margin-top:0"><span style="color:{C}">Bloc {b["n"]}</span> · {b["t"]} <span class="xs">· cahier p. {b["p"]}</span></h3>
<div class="g3"><div class="phase pp"><span class="tag">Pièges fréquents</span>{"<br>".join(b["piege"])}</div><div class="phase pa"><span class="tag">À observer</span>{b["obs"]}</div><div class="phase pap"><span class="tag">Différenciation</span>{b["diff"]}</div></div></div>'''


def p_blocs(a, b, n):
    return pg("Bloc par bloc" if a == 0 else "", '<div class="dense" style="display:flex;flex-direction:column;gap:9px' + (';margin-top:14px' if a else '') + '">' + "".join(fiche(x) for x in BLOCS[a:b]) + "</div>",
              kick="Pistes d'observation", sous="Les pièges repris des feuilles de notes, ce qu'on regarde, comment différencier." if a == 0 else "", n=n)


def p_continue():
    corps = f'''<div class="dense">
<h2>{ico("horloge")}Les 10 premières minutes d'un nouvel élève</h2><ol class="steps"><li>On l'accueille dans l'équipe Teams et on lui distribue le Bloc 0 (passeport).</li><li>Il ouvre la section du bloc où il commence (Bloc 1, ou plus loin après un test diagnostique).</li><li>Il lit « Je serai capable de… » et regarde la vidéo du bloc.</li><li>Il sait à qui demander de l'aide (voir la routine ci-dessous).</li></ol>
<h2 class="mt">{ico("groupe")}Quand 15 élèves sont dans 6 blocs différents</h2>
<div class="g3"><div class="card t"><b>1 · Je relis</b><p>La feuille de notes et le piège fréquent du bloc.</p></div><div class="card t"><b>2 · Je demande à un pair</b><p>Un élève qui a terminé ce bloc (voir le tableau de suivi).</p></div><div class="card t"><b>3 · Je m'inscris</b><p>Sur la file d'aide au tableau ; l'enseignante passe dans l'ordre.</p></div></div>
<h2 class="mt">{ico("crayon")}Tableau de suivi de la classe</h2><p class="xs">Une ligne par élève. Inscrire la date du Math-o-portrait et la couleur du feu de circulation. À garder dans l'espace de l'enseignante (pas dans un canal public).</p>
<table class="t grid"><tr><th style="width:20%">Élève</th>{"".join(f"<th>B{i}</th>" for i in range(1, 9))}</tr>{("<tr><td style='height:24px'></td>" + "<td></td>" * 8 + "</tr>") * 10}</table>
<div class="card k mt"><h2>{ico("attention")}Évaluation</h2><p>L'épreuve suit la DDE de MAT-3051-2 (octobre 2021) : voir les pages 7 et 8. Pendant l'apprentissage, on donne une rétroaction sur <b>tous</b> les critères, même ceux qui ne sont pas retenus pour l'épreuve.</p></div></div>'''
    return pg("Entrée continue et suivi", corps, kick="Au quotidien", sous="Pour que chaque élève sache quoi faire, même le jour de son arrivée.", n=6)


def p_pistes():
    corps = f'''<div class="dense"><div class="card t"><h2>{ico("idee")}Pistes de réflexion</h2><ul>
<li>Et si les « Mon exemple perso » devenaient une <b>banque d'exemples de la classe</b>, dans l'espace de collaboration ?</li>
<li>Un <b>mur des pièges</b> : chaque élève qui tombe dans un piège fréquent l'ajoute, avec son truc pour l'éviter.</li>
<li>Des <b>tuteurs de bloc</b> : l'élève qui a un feu vert au Math-o-portrait devient la personne-ressource du bloc pour une semaine.</li>
<li>Pour le bloc 8, partir d'une <b>vraie décision</b> des élèves : deux forfaits de cellulaire, deux salles de sport, deux emplois.</li></ul></div>
<div class="g2 mt"><div class="card"><h2>{ico("lien")}Les documents de la trousse</h2><ul><li>00 · Plan de rencontre de 60 min (avec les coquilles du cahier)</li><li>00 · Guide Teams pas à pas (Word et PDF)</li><li>00 · Guide OneNote : structure et liens vidéo (Word et PDF)</li><li>Bloc 0 · Passeport et ma démarche</li><li>Blocs 1 à 8 · Cahier, feuille de notes, exercices</li><li>99 · Corrigés, cahier découpé, banque d'exercices</li><li>La DDE de MAT-3051-2 (MEQ, 2021), sur Québec.ca</li></ul></div>
<div class="card d"><h2>{ico("ok")}Pour bien démarrer</h2><ol class="steps"><li>Prendre les 5 décisions (page 2).</li><li>Déposer le Bloc 0 et le Bloc 1 dans Teams.</li><li>Faire le premier Math-o-portrait.</li><li>Ajouter les blocs suivants au fil des arrivées.</li></ol></div></div></div>'''
    return pg("Pistes et ressources", corps, kick="Annexes", n=9)


SAVOIRS = [
 ("Inégalité et inéquation", "Relation d'inégalité", "2"),
 ("Inégalité et inéquation", "Résolution d'équations et d'inéquations du 1er degré à une variable", "1 · 2"),
 ("Relation", "Observation, description, interprétation et représentation de la dépendance entre les variables", "3"),
 ("Relation", "Fonction et réciproque", "5 · 6"),
 ("Relation", "Représentation d'une expérimentation ou d'une étude statistique à l'aide d'un nuage de points", "4"),
 ("Relation", "Représentation et interprétation de la réciproque d'une fonction", "6"),
 ("Relation", "Détermination de la règle de correspondance", "3 · 4"),
 ("Relation", "Description des propriétés d'une fonction en contexte", "7"),
 ("Relation", "Description qualitative de l'effet de la modification d'un paramètre d'une fonction affine", "3 (section 3.6)"),
 ("Système", "Résolution de systèmes d'équations du 1er degré à deux variables", "8")]
DDE_URL = "https://cdn-contenu.quebec.ca/cdn-contenu/education/formation-generale-adultes/definitions-domaine-evaluation/mathematique/FGA-DDE-mathematique-MAT-3051-2-modelisation-algebrique-graphique.pdf"


def p_dde():
    crit = [("1.1", "Manifestation, oralement ou par écrit, d'une compréhension adéquate de la situation-problème", "10", "Dégager les informations pertinentes et ce qui est cherché."),
            ("1.2", "Mobilisation de stratégies et de savoirs mathématiques appropriés", "20", "Choisir une stratégie pertinente et les bons savoirs."),
            ("2.1", "Utilisation correcte des concepts et des processus mathématiques appropriés", "15 + 5", "Appliquer les savoirs avec justesse (15) ; obtenir les bons résultats (5)."),
            ("2.2", "Mise en œuvre convenable d'un raisonnement mathématique adapté à la situation", "20", "Démarche cohérente, étapes dégagées."),
            ("2.3", "Structuration adéquate des étapes d'une démarche pertinente", "5 + 5", "Démarche structurée, conventions respectées ; réponse cohérente avec le contexte.")]
    corps = f"""<div class="dense">
<div class="g3"><div class="card t"><span class="tag" style="color:{C}">Compétence 1 · 30 %</span><h3>Utiliser des stratégies de résolution de situations-problèmes</h3></div>
<div class="card t"><span class="tag" style="color:{C}">Compétence 2 · 50 %</span><h3>Déployer un raisonnement mathématique</h3></div>
<div class="card t"><span class="tag" style="color:{C}">Connaissances · 20 %</span><h3>Évaluation explicite des connaissances</h3></div></div>
<p class="xs mt">La compétence 3, « Communiquer à l'aide du langage mathématique », n'est pas évaluée à part ; elle est prise en compte dans les grilles. Famille de situations : <b>Relation entre quantités</b>. Domaines généraux de formation : Santé et bien-être, Environnement et consommation.</p>
<h2 class="mt">{ico("cible")}Les critères de l'épreuve (grilles prescrites)</h2>
<table class="t"><tr><th style="width:7%">Critère</th><th style="width:40%">Énoncé</th><th style="width:10%">Points</th><th>Concrètement</th></tr>
{"".join(f"<tr><td><b>{a}</b></td><td>{b}</td><td>/{c}</td><td>{d}</td></tr>" for a, b, c, d in crit)}</table>
<p class="xs">Échelle : marquée, assurée, acceptable, peu développée, très peu développée.</p>
<h2 class="mt">{ico("etapes")}L'épreuve</h2>
<div class="g2"><div class="card"><ul><li><b>180 minutes</b>, une seule séance, un seul cahier.</li><li><b>Section 1 :</b> 4 questions d'application (connaissances, 20 %).</li><li><b>Section 2 :</b> 3 tâches à partir de situations réalistes (compétences, 80 %).</li><li>Le jugement repose sur <b>au moins 2 tâches</b> : une seule tâche terminée = échec.</li><li><b>Seuil : 60 %.</b> La reprise se fait <b>en entier</b>.</li><li>Toutes les catégories et <b>au moins 7 des 10 savoirs</b> sont touchés.</li></ul></div>
<div class="card k"><h2>{ico("crayon")}Matériel autorisé</h2><ul><li>Calculatrice scientifique ou graphique <b>sans calcul formel</b> (mémoire effacée avant et après)</li><li>Règle, équerre, compas, rapporteur, papier brouillon et quadrillé</li><li><b>Aide-mémoire :</b> 1 page recto 8½ × 11, manuscrite ou à l'ordinateur (12 points minimum), faite par l'élève et approuvée par l'enseignante. Exemples et formules acceptés.</li></ul></div></div>
<p class="xs mt">Source : Définition du domaine d'évaluation MAT-3051-2, MEQ, octobre 2021 (prescrite).</p></div>"""
    return pg("L'épreuve selon la DDE", corps, kick="Évaluation", sous="Ce que prescrit la définition du domaine d'évaluation.", n=7)


def p_savoirs():
    rows = "".join(f'<tr><td class="small" style="color:{C};font-weight:800">{c}</td><td>{s}</td><td style="text-align:center"><b>{b}</b></td><td>{CB("")}</td></tr>' for c, s, b in SAVOIRS)
    corps = f"""<div class="dense"><table class="t grid"><tr><th style="width:18%">Catégorie</th><th>Savoir prescrit</th><th style="width:16%">Bloc(s) du cahier</th><th style="width:10%">Vu</th></tr>{rows}</table>
<div class="g2 mt"><div class="card d"><h2>{ico("idee")}L'aide-mémoire se bâtit pendant le cours</h2><p>Chaque feuille de notes a « L'essentiel » et « Mon exemple perso ». À la fin de chaque bloc, l'élève choisit <b>une ligne</b> à recopier sur son aide-mémoire. Au bloc 8, il a sa page recto, faite par lui, prête à faire approuver.</p></div>
<div class="card"><h2>{ico("logique")}Préparer aux 3 tâches</h2><ul><li>S'entraîner à <b>dégager ce qui est cherché</b> avant de calculer (critère 1.1).</li><li>Exiger une <b>phrase de conclusion</b> avec les unités (critère 2.3).</li><li>Les problèmes de contexte des blocs 2, 3, 4 et 8 sont les plus proches des tâches.</li><li>Faire une épreuve de pratique de 180 minutes avant la vraie.</li></ul></div></div>
<div class="card t mt"><h2>{ico("ok")}Rétroaction en cours d'apprentissage</h2><p>Le feu de circulation et le Math-o-portrait servent de rétroaction sur tous les critères. On peut reprendre les mots des grilles avec l'élève : « Tu as bien dégagé ce qui est cherché ; ta démarche manque d'une étape. »</p></div></div>"""
    return pg("Les 10 savoirs et le cahier", corps, kick="Évaluation", sous="Où chaque savoir prescrit est travaillé dans la trousse.", n=8)


def construire():
    pages = [couverture(), p_trousse(), p_sequence(), p_blocs(0, 4, 4), p_blocs(4, 8, 5), p_continue(), p_dde(), p_savoirs(), p_pistes()]
    out = os.path.join(R, "00_COMMENCER-ICI", "0_Dossier-maitre_Enseignante.pdf")
    tmp = "/tmp/claude-0/pps/mathtml"; os.makedirs(tmp, exist_ok=True)
    h = os.path.join(tmp, "dm.html"); open(h, "w").write(doc("Dossier maître MAT-3051", pages))
    subprocess.run(["node", os.path.join(Z101, "rendre.js"), h, out], check=True)


if __name__ == "__main__":
    construire()

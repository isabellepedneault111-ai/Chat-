"""Dossier maître, évaluation, matériel à imprimer et guide Teams de la trousse Z101."""
import os
from style import page, doc, ico, qr, CAT, SITE, INK, CSS
from blocs import B, ORDRE, L, CB, OPTS, SCALE

ICI = os.path.dirname(os.path.abspath(__file__))
R = os.path.dirname(ICI)
P_COM = os.path.join(R, "00_COMMENCER-ICI")
P_EPR = os.path.join(R, "Bloc-C7_Je-presente-mon-projet")
P_EV = os.path.join(R, "99_ENSEIGNANTE_SEULEMENT", "Evaluation")
P_MAT = os.path.join(R, "99_ENSEIGNANTE_SEULEMENT", "Materiel-a-imprimer")
for d in (P_COM, P_EPR, P_EV, P_MAT): os.makedirs(d, exist_ok=True)

CRIT = [
    dict(cat="disp", no="1", nom="Détermination rigoureuse de ses réalités personnelles et sociales", court="Me connaître",
         savoirs=["Traits de personnalité", "Habiletés", "Expériences", "Facteurs de délimitation"], blocs="C1 et C2",
         logique="Établir des liens entre ses facteurs de délimitation et leurs incidences sur sa vie quotidienne.",
         ech=["Grande difficulté à établir des liens entre sa vie quotidienne et ses dispositions.", "Difficulté à établir des liens entre sa vie quotidienne et ses dispositions.",
              "Établit de façon satisfaisante des liens entre sa vie quotidienne et ses dispositions.", "Établit clairement des liens entre sa vie quotidienne et ses dispositions.",
              "Établit très clairement des liens entre sa vie quotidienne et ses dispositions."],
         je=["Je nomme mes intérêts, mon tempérament et mes habiletés.", "Je raconte des expériences qui m'ont appris quelque chose.", "J'explique comment ce qui me limite agit sur ma vie, avec un exemple."],
         obs=["Nomme des traits et des habiletés appuyés sur des exemples réels.", "Distingue ses expériences (familiales, scolaires, professionnelles, socioculturelles).",
              "Nomme au moins un facteur de délimitation sans se dévaloriser.", "Fait un lien explicite : facteur, effet sur la vie quotidienne, moyen d'agir."],
         traces=["C1 · ex. 4 Inventaire des habiletés", "C1 · ex. 5 Une force dans ma vie", "C2 · ex. 1 Ligne de vie", "C2 · ex. 4 Chaîne de logique", "Journal d'atelier : force utilisée, ce qui a été difficile"],
         q=["Parle-moi de toi : qu'est-ce qui t'intéresse ? Qu'est-ce que tu fais bien ?", "Quelle expérience t'a appris quelque chose d'important ?", "Qu'est-ce qui rend certaines choses plus difficiles pour toi ? Donne-moi un exemple de ta semaine."]),
    dict(cat="pot", no="2", nom="Reconnaissance réaliste de son potentiel d'action", court="Ce qui me fait avancer",
         savoirs=["Facteurs de motivation", "Habitudes de vie", "Fonctionnement en groupe", "Milieux d'appartenance"], blocs="C3 et C4",
         logique="Développer un sentiment d'appartenance au milieu de formation.",
         ech=["Grande difficulté à cerner sa motivation et la contribution de ses milieux.", "Difficulté à cerner sa motivation et la contribution de ses milieux.",
              "Cerne de façon satisfaisante sa motivation et la contribution de ses milieux.", "Cerne de façon concrète sa motivation et la contribution de ses milieux.",
              "Cerne de façon concrète et précise sa motivation et la contribution de ses milieux."],
         je=["Je nomme ce qui me motive et comment je continue quand c'est difficile.", "Je connais mon horaire et mes moments disponibles.", "Je nomme les personnes et les milieux qui peuvent m'aider."],
         obs=["Nomme des sources de motivation personnelles et un moyen de persévérer.", "Décrit sa routine et des disponibilités réalistes.",
              "S'évalue avec réalisme en groupe (force et défi).", "Nomme des personnes significatives de plusieurs milieux, dont le centre de formation."],
         traces=["C3 · ex. 2 Quand ça devient difficile", "C3 · ex. 4 Ma semaine type", "C4 · ex. 1 Moi en équipe", "C4 · ex. 3 Mon réseau", "Journal d'atelier : comment j'ai trouvé l'atelier"],
         q=["Qu'est-ce qui te donne de l'énergie pour venir ici ?", "Quand est-ce que tu es disponible pour ton projet ?", "Qui, autour de toi, peut t'aider ? Comment ?"]),
    dict(cat="proj", no="3", nom="Élaboration méthodique de son projet de participation sociale", court="Mon projet",
         savoirs=["Buts", "Besoins de formation", "Conditions de réussite", "Partenaires"], blocs="C5 et C6",
         logique="Mettre en relation ses réalités personnelles et sociales ainsi que son potentiel d'action.",
         ech=["Grande difficulté à déterminer les composantes de son projet.", "Difficulté à déterminer les composantes de son projet.",
              "Détermine de façon satisfaisante les principales composantes de son projet.", "Détermine de façon claire l'ensemble des composantes de son projet.",
              "Détermine de façon claire et détaillée l'ensemble des composantes de son projet."],
         je=["Mon projet tient en une phrase et il me ressemble.", "J'ai des buts à court, moyen et long terme, et les cours qui m'aident.", "J'ai prévu mes conditions de réussite et mes partenaires."],
         obs=["Formule un projet cohérent avec ses réalités (C1-C2) et son potentiel (C3-C4).", "Hiérarchise des buts clairs, réalistes et datés.",
              "Justifie le choix de cours du programme par ses besoins.", "Prévoit priorités, échéances, transport, coûts, suivi et partenaires avec un rôle."],
         traces=["C5 · ex. 2 Mon projet en une phrase", "C5 · ex. 3 et 4 Buts et cours", "C6 · ex. 1 à 4 Conditions et partenaires", "C7 · Mon projet en une page"],
         q=["Décris-moi ton projet. Pourquoi celui-là ?", "Quelle est la première étape ? Pour quand ?", "Qui t'accompagne et que va faire cette personne ?"]),
]
ECH = ["Très peu développée", "Peu développée", "Acceptable", "Assurée", "Marquée"]


def sv(lst, cat):
    k = CAT[cat]
    return "".join(f'<span class="sv" style="background:{k["cl"]};color:{k["c"]}">{s}</span>' for s in lst)


# ============================================================================ ÉVALUATION
def evaluation():
    jobs = []
    # --- Élève : fiche descriptive de l'épreuve
    corps = f'''
<p class="lede">À la fin du cours, tu présentes <b>ton projet de participation sociale</b>. Tu montres que tu te connais, que tu sais ce qui te fait avancer et que ton projet est bien organisé.</p>
<div class="g3 mt2">{"".join(f'<div class="card t" style="--c:{CAT[c["cat"]]["c"]};--cl:{CAT[c["cat"]]["cl"]}"><span class="tag" style="color:{CAT[c["cat"]]["c"]}">Critère {c["no"]}</span><div class="big mt">{c["court"]}</div><p class="small">Blocs {c["blocs"]}</p></div>' for c in CRIT)}</div>
<div class="g2 mt2">
 <div><h2>{ico("etapes")}Comment ça se passe</h2><ol class="steps"><li>Je rassemble mes blocs C0 à C6 et mes journaux d'atelier.</li><li>Je remplis « Mon projet en une page ».</li><li>Je choisis ma façon de présenter, avec Mme Lisa.</li><li>Je présente mon projet et je réponds aux questions.</li><li>Je fais mon autoévaluation.</li></ol></div>
 <div class="card"><h2>{ico("ecran")}Ma façon de présenter</h2>{OPTS(["Entrevue avec Mme Lisa", "Présentation orale", "Portfolio", "Journal de bord", "Questionnaire écrit"])}
  <p class="xs mt">Toutes les façons sont valables. Ce qui compte : couvrir les 3 critères.</p></div>
</div>
<div class="card d mt2"><h2>{ico("ok")}Pour réussir</h2><p>Je dois atteindre le niveau <b style="color:#D9431F">Acceptable</b> dans <b>chacun</b> des 3 critères. Si un critère n'est pas encore atteint, je peux le reprendre.</p></div>
<div class="card k mt2"><h2>{ico("idee")}Ce que j'apporte</h2><ul class="ticks"><li>Mon cahier (blocs C0 à C6)</li><li>Mes journaux d'atelier</li><li>Mon projet en une page</li><li>Une photo ou un objet lié à mon projet (si je veux)</li></ul></div>'''
    jobs.append(("C7_1", doc("Fiche descriptive de l'épreuve", [page("base", "Je présente mon projet", corps, no="C7", kick="Fiche descriptive de l'épreuve", sous="L'épreuve finale du cours, expliquée simplement.", bloc="Bloc C7", etiquette="L'épreuve")]),
                 os.path.join(P_EPR, "C7_1_Fiche-descriptive-de-l-epreuve.pdf")))
    # --- Élève : mon projet en une page
    sec = lambda cat, titre, contenu: f'<div class="card" style="--c:{CAT[cat]["c"]};border-top:5px solid {CAT[cat]["c"]}"><h2 style="color:{CAT[cat]["c"]}">{titre}</h2>{contenu}</div>'
    corps = f'''
<div class="card d"><span class="tag" style="color:#D9431F">Mon projet en une phrase</span><div class="lines l2" style="background-image:repeating-linear-gradient(transparent 0 26px,#CDD2E0 26px 27px)"></div></div>
<div class="g3 mt">
 {sec("disp", "Qui je suis", '<p class="xs">Intérêts et forces</p>' + L(2) + '<p class="xs">Ce qui me limite et mon moyen</p>' + L(2))}
 {sec("pot", "Ce qui me fait avancer", '<p class="xs">Ma motivation</p>' + L(2) + '<p class="xs">Mes moments disponibles</p>' + L(2))}
 {sec("pot", "Les gens autour de moi", '<p class="xs">Mes milieux</p>' + L(2) + '<p class="xs">Ma personne significative</p>' + L(2))}
</div>
<div class="g2 mt">
 {sec("proj", "Mes buts", '<table class="t"><tr><td style="width:24%"><b>Court</b></td><td><div class="lines" style="min-height:27px"></div></td></tr><tr><td><b>Moyen</b></td><td><div class="lines" style="min-height:27px"></div></td></tr><tr><td><b>Long</b></td><td><div class="lines" style="min-height:27px"></div></td></tr></table>')}
 {sec("proj", "Mes cours", '<p class="xs">Cours du programme et le besoin qu’ils comblent</p>' + L(4))}
</div>
<div class="g2 mt">
 {sec("proj", "Mes conditions de réussite", '<p class="xs">Priorités, échéances, transport, coûts, suivi</p>' + L(3))}
 {sec("proj", "Mes partenaires", '<p class="xs">Qui, et ce qu’il ou elle va faire</p>' + L(3))}
</div>'''
    jobs.append(("C7_2", doc("Mon projet en une page", [page("proj", "Mon projet en une page", corps, no="C7", kick="Synthèse", sous="Prénom : ______________________ &nbsp; Date : ____________", bloc="Bloc C7", etiquette="Mon projet en une page")]),
                 os.path.join(P_EPR, "C7_2_Mon-projet-en-une-page.pdf")))
    # --- Élève : autoévaluation au « je » (code couleur)
    rows = "".join(f'''<div class="card mt" style="border-left:6px solid {CAT[c["cat"]]["c"]}"><span class="tag" style="color:{CAT[c["cat"]]["c"]}">Critère {c["no"]} · {c["court"]}</span>
<table class="t mt">{"".join(f'<tr><td>{j}</td><td style="width:44%"><span class="opt" style="color:#127A45"><span class="dot" style="margin-right:4px"></span>Oui</span><span class="opt" style="color:#946200"><span class="dot" style="margin-right:4px"></span>Presque</span><span class="opt" style="color:#B3341B"><span class="dot" style="margin-right:4px"></span>Pas encore</span></td></tr>' for j in c["je"])}</table></div>''' for c in CRIT)
    corps = f'''<p class="lede">Je colorie le rond qui me ressemble. <b>Pas de note</b> : c'est pour voir où j'en suis et quoi améliorer.</p>{rows}
<div class="card d mt"><h2>{ico("fusee")}Ma prochaine étape</h2><p class="small" style="color:#4A5068">Ce que je vais améliorer avant de présenter :</p><div class="lines l2" style="background-image:repeating-linear-gradient(transparent 0 26px,#CDD2E0 26px 27px)"></div></div>'''
    jobs.append(("C7_3", doc("Mon autoévaluation", [page("base", "Mon autoévaluation", corps, no="C7", kick="Je fais le point", sous="Avant l'épreuve, puis après.", bloc="Bloc C7", etiquette="Autoévaluation")]),
                 os.path.join(P_EPR, "C7_3_Mon-autoevaluation.pdf")))

    # --- Enseignante : grille critérielle
    def grille_crit(c):
        k = CAT[c["cat"]]
        cells = "".join(f'<td style="width:18%;{"background:" + k["cl"] + ";" if i == 2 else ""}"><div class="tag" style="color:{k["c"] if i >= 2 else "#6B7189"}">{ECH[i]}</div><div style="font-size:8.6pt;margin:3px 0 6px">{d}</div><span class="cb"></span></td>' for i, d in enumerate(c["ech"]))
        return f'<div class="mt"><h2 style="color:{k["c"]}">Critère {c["no"]} · {c["nom"]}</h2><table class="t grid"><tr>{cells}</tr></table></div>'
    corps = f'''<div class="g2"><div class="small"><b>Adulte :</b> ____________________________</div><div class="small"><b>Date :</b> ______________ &nbsp; <b>Forme :</b> ______________</div></div>
{"".join(grille_crit(c) for c in CRIT)}
<div class="card d mt"><h2>{ico("ok")}Règle de réussite</h2><p>Seuil de réussite : <b style="color:#D9431F">Acceptable</b> pour <b>chacun</b> des 3 critères. Un critère sous le seuil entraîne une reprise ciblée de ce critère seulement.</p></div>
<div class="card mt"><h2>{ico("crayon")}Commentaires et prochaines étapes</h2>{L(2)}</div>
<p class="xs">Échelons et descripteurs repris de l'outil Z101 du CSSDLJ (grille critérielle prescrite, PPS-Z101-3). À valider avec la définition du domaine d'évaluation en vigueur.</p>'''
    jobs.append(("EV_1", doc("Grille d'évaluation critérielle", [page("base", "Grille d'évaluation critérielle", corps, kick="Enseignante seulement", sous="PPS-Z101-3 · une grille par élève", etiquette="Grille critérielle")]),
                 os.path.join(P_EV, "1_Grille-critérielle_PPS-Z101.pdf".replace("é", "e"))))
    # --- Enseignante : fiches descriptives par critère
    pages = []
    for c in CRIT:
        k = CAT[c["cat"]]
        corps = f'''<div class="dense"><p class="lede">{c["nom"]}.</p><div class="savoirs mt">{sv(c["savoirs"], c["cat"])}</div>
<div class="g2 mt2"><div class="card"><h2>{ico("loupe")}Ce qu'on observe</h2><ul class="ticks">{"".join(f"<li>{o}</li>" for o in c["obs"])}</ul></div>
<div class="card t"><h2>{ico("crayon")}Traces dans la trousse</h2><ul>{"".join(f"<li>{t}</li>" for t in c["traces"])}</ul></div></div>
<div class="card k mt2"><h2>{ico("logique")}Raisonner avec logique</h2><p>{c["logique"]}</p></div>
<div class="g2 mt2"><div class="card"><h2>{ico("groupe")}Questions pour l'entrevue</h2><ol class="steps">{"".join(f"<li>{q}</li>" for q in c["q"])}</ol></div>
<div class="card d"><h2>{ico("ok")}Le seuil, concrètement</h2><p >{c["ech"][2]}</p><p class="xs" style="color:#6B7189">Au-delà (Assurée, Marquée) : les liens ou les composantes sont clairs, précis, détaillés, sans relance.</p></div></div>
<div class="card mt2"><h2>{ico("crayon")}Mes notes d'observation</h2>{L(3)}</div></div>'''
        pages.append(page(c["cat"], c["court"], corps, no=c["no"], kick=f"Fiche descriptive · Critère {c['no']}", sous=f"Blocs {c['blocs']}", etiquette="Fiches descriptives", n=int(c["no"]), tot=3))
    jobs.append(("EV_2", doc("Fiches descriptives par critère", pages), os.path.join(P_EV, "2_Fiches-descriptives_par-critere.pdf")))
    # --- Enseignante : formes d'épreuve + planificateur de couverture
    FORMES = [("Entrevue guidée", "20 à 45 min", "6 à 10 questions ouvertes couvrant les 3 critères. Relancer avec « Peux-tu développer ? »."),
              ("Exposé oral", "10 à 15 min + 5 min de questions", "Plan fourni. Les questions peuvent faire monter l'échelon."),
              ("Portfolio", "20 à 30 min de présentation", "Pièces choisies et justifiées : la justification compte autant que la pièce."),
              ("Journal de bord", "Tout le cours, lecture finale 30 à 60 min", "Les journaux d'atelier et les blocs montrent l'évolution de la pensée."),
              ("Questionnaire écrit", "60 à 90 min", "Questions ouvertes, lecture à voix haute permise.")]
    corps = f'''<h2>{ico("etapes")}Formes de production possibles</h2><table class="t"><tr><th style="width:22%">Forme</th><th style="width:24%">Durée</th><th>À retenir</th></tr>
{"".join(f"<tr><td><b>{a}</b></td><td>{b}</td><td>{c}</td></tr>" for a, b, c in FORMES)}</table>
<h2 class="mt2">{ico("cible")}Planificateur de couverture des savoirs</h2><p class="small">L'épreuve touche au moins <b>6 des 12 savoirs</b> et couvre <b>les 3 catégories</b>. Cocher les savoirs couverts.</p>
<table class="t grid">{"".join(f'<tr><td style="width:34%;color:{CAT[c["cat"]]["c"]};font-weight:800">{CAT[c["cat"]]["nom"]}</td>' + "".join(f"<td>{CB(s)}</td>" for s in c["savoirs"]) + "</tr>" for c in CRIT)}</table>
<div class="g2 mt"><div class="card t"><b>Savoirs couverts :</b> ______ / 12</div><div class="card t"><b>Les 3 catégories :</b> {CB("oui")}</div></div>
'''
    corps2 = f'''<div class="dense"><h2>{ico("lien")}Où chaque savoir est travaillé</h2><table class="t grid"><tr><th>Savoir</th>{"".join(f"<th>{b}</th>" for b in ORDRE[1:])}</tr>
{"".join(f'<tr><td>{s}</td>' + "".join(f'<td class="center" style="background:{CAT[B[b]["cat"]]["cl"] if s in B[b]["savoirs"] else "#fff"};text-align:center;font-weight:900;color:{CAT[B[b]["cat"]]["c"]}">{"●" if s in B[b]["savoirs"] else ""}</td>' for b in ORDRE[1:]) + "</tr>" for c in CRIT for s in c["savoirs"])}</table></div>'''
    jobs.append(("EV_3", doc("Formes d'épreuve et couverture", [page("base", "L'épreuve : formes et couverture", '<div class="dense">' + corps + '</div>', kick="Enseignante seulement", sous="Choisir la forme avec l'élève, vérifier la couverture des savoirs.", etiquette="Épreuve", n=1, tot=2), page("base", "Où chaque savoir est travaillé", corps2, kick="Enseignante seulement", sous="Les blocs C1 à C6 et les 12 savoirs.", etiquette="Épreuve", n=2, tot=2)]),
                 os.path.join(P_EV, "3_Formes-d-epreuve-et-couverture-des-savoirs.pdf")))
    # --- Enseignante : grille d'observation des ateliers (vierge, sans noms)
    corps = f'''<div class="g2"><div class="small"><b>Atelier :</b> {OPTS(["Grenier", "Ensachage", "Cantine", "Conciergerie"])}</div><div class="small"><b>Date :</b> ____________ &nbsp; <b>Groupe :</b> {OPTS(["A", "B"])}</div></div>
<p class="small mt">Code couleur : <b style="color:#127A45">V</b> ça va bien · <b style="color:#946200">J</b> en progrès · <b style="color:#B3341B">R</b> besoin de soutien. Pas de note chiffrée.</p>
<table class="t grid mt"><tr><th style="width:22%">Élève</th><th>Suit les étapes de la fiche</th><th>Force observée</th><th>Respect et collaboration</th><th>Autonomie</th><th style="width:20%">Note</th></tr>
{"<tr>" + "<td style='height:40px'></td>" * 6 + "</tr>"}{("<tr>" + "<td style='height:40px'></td>" * 6 + "</tr>") * 11}</table>
<p class="xs mt">Liens : force observée (habiletés, C1) · respect et collaboration (fonctionnement en groupe, C4) · autonomie (motivation et persévérance, C3).</p>'''
    jobs.append(("EV_4", doc("Grille d'observation des ateliers", [page("base", "Observation en atelier", corps, kick="Enseignante et adultes d'atelier", sous="Une feuille par séance. À garder dans le dossier de l'élève, pas dans Teams public.", etiquette="Observation")]),
                 os.path.join(P_EV, "4_Grille-observation-ateliers_vierge.pdf")))
    return jobs


# ============================================================================ DOSSIER MAÎTRE
def maitre():
    pages = []
    couv = f'''<section class="page cover">{"".join([])}
<svg style="position:absolute;right:0;top:0" width="300" height="300" viewBox="0 0 300 300"><g fill="none" stroke-width="1.4"><line x1="40" y1="0" x2="300" y2="260" stroke="#5B4BFF"/><line x1="110" y1="0" x2="300" y2="190" stroke="#F2542D"/><line x1="180" y1="0" x2="300" y2="120" stroke="#0E9F8E"/></g><rect x="250" y="30" width="16" height="16" fill="#F2542D"/></svg>
<div style="margin-top:2.6in" class="kick">PPS-Z101-3 · Dossier maître</div>
<h1 style="margin-top:12px">Projection<br>vers l'avenir</h1>
<div class="sous">Mon projet de participation sociale. Le guide de l'enseignante : programme, organisation, séquence bloc par bloc, observation et évaluation.</div>
<div class="g3" style="margin-top:.9in;max-width:6.2in">{"".join(f'<div><div style="height:4px;background:{CAT[c]["c"]};border-radius:4px"></div><div style="font-weight:800;margin-top:8px">{CAT[c]["court"]}</div><div style="font-size:9pt;color:#6B7189">{CAT[c]["crit"]}</div></div>' for c in ["disp", "pot", "proj"])}</div>
<div class="foot" style="margin-top:auto"><span>CFGA De La Jonquière · Participation sociale</span><span>Trousse Z101</span></div></section>'''
    pages.append(couv)
    # p2 le cours en une page
    corps = f'''<div class="dense">
<div class="card d"><h2>{ico("cible")}Le but du cours</h2><p>Rendre l'adulte apte à traiter avec compétence des situations de la vie courante liées à l'<b>organisation de son projet de participation sociale</b>. Le cours est <b>obligatoire</b>, placé dès le début de la formation : il doit être réussi avant l'évaluation de tout autre cours du programme.</p></div>
<div class="g3 mt">{"".join(f'<div class="card t" style="--c:{CAT[c["cat"]]["c"]};--cl:{CAT[c["cat"]]["cl"]}"><span class="tag" style="color:{CAT[c["cat"]]["c"]}">Catégorie d\'actions · critère {c["no"]}</span><h3>{c["nom"]}</h3><div class="savoirs">{sv(c["savoirs"], c["cat"])}</div></div>' for c in CRIT)}</div>
<div class="g2 mt">
 <div class="card"><h2>{ico("logique")}Compétence polyvalente : Raisonner avec logique</h2><ul>{"".join(f"<li>{c['logique']}</li>" for c in CRIT)}</ul></div>
 <div class="card"><h2>{ico("maison")}Classe de situations</h2><p><b>Organisation de mon projet de participation sociale.</b> Exemples : implication dans son milieu de vie, développement d'un réseau social, changement de résidence, modification de son mode de vie, responsabilités parentales.</p></div>
</div>
<div class="card mt"><h2>{ico("etapes")}Exemples d'actions du programme</h2><table class="t"><tr><th>Catégorie</th><th>Exemples</th></tr>
<tr><td>Réalités personnelles et sociales</td><td>Donner des exemples de ses champs d'intérêt · faire l'inventaire de ses habiletés sociales · décrire ses expériences scolaires · considérer ses problèmes de comportement en public</td></tr>
<tr><td>Potentiel d'action</td><td>S'interroger sur les efforts à fournir · déterminer des moments de disponibilité · trouver des avantages à la collaboration entre pairs · désigner une personne significative</td></tr>
<tr><td>Élaboration du projet</td><td>Définir ses buts à court terme · repérer des cours dans les thématiques · prévoir des mesures de suivi · informer ses partenaires</td></tr></table></div>
<div class="g2 mt"><div class="card t"><h2>{ico("ok")}Évaluation</h2><p>3 critères, grille critérielle à 5 échelons. Seuil : <b>Acceptable</b> pour chaque critère. L'épreuve touche au moins 6 des 12 savoirs et les 3 catégories.</p></div>
<div class="card t"><h2>{ico("personne")}Attitude visée : le réalisme</h2><p>L'adulte considère ses forces et ses défis de façon objective. C'est ce qui rend le projet signifiant et réalisable.</p></div></div>
<p class="xs" style="margin-top:6px">Source : Programme d'études Participation sociale, MEQ 2022, cours PPS-Z101-3.</p></div>'''
    pages.append(page("base", "Le cours en une page", corps, kick="Programme", sous="Ce que prescrit le programme d'études.", etiquette="Dossier maître", n=2, tot=9))
    # p3 organisation chez nous
    corps = f'''<div class="dense">
<div class="g2"><div class="card"><h2>{ico("horloge")}L'horaire</h2><table class="t"><tr><th>Moment</th><th>Mardi</th><th>Jeudi</th></tr>
<tr><td>8 h 25</td><td colspan="2">Rassemblement, tout le groupe</td></tr><tr><td>P1-P2 · 9 h 00 à 10 h 35</td><td>A en classe · B en atelier</td><td>B en classe · A en atelier</td></tr>
<tr><td>P3 · 10 h 45 à 11 h 45</td><td>B en classe · A en atelier</td><td>A en classe · B en atelier</td></tr></table><p class="xs mt">A : PPS pur (accompagné de la TES en atelier) · B : concomitance.</p></div>
<div class="card"><h2>{ico("groupe")}Les 4 ateliers exploratoires</h2><ul><li><b>Grenier de Maria :</b> recevoir, trier, ranger.</li><li><b>Ensachage et préparation :</b> sacs de denrées comptés et identifiés.</li><li><b>Cantine de l'école :</b> comptoir, rôles tournants.</li><li><b>Conciergerie et services :</b> espaces propres et agréables.</li></ul><p class="xs">Les nouveaux essaient deux ateliers pendant deux semaines avant de choisir.</p></div></div>
<div class="card k mt"><h2>{ico("lien")}Le lien classe et atelier</h2><p>L'atelier est le <b>laboratoire</b> du cours : l'élève y vit des expériences, utilise ses habiletés et fonctionne en groupe. En classe, il en fait la lecture avec les blocs. Le <b>journal d'atelier</b> (papier ou en ligne) fait le pont : chaque question est liée à un savoir.</p></div>
<h2 class="mt">{ico("etapes")}La trousse dans Teams</h2><table class="t"><tr><th>Dossier</th><th>Contenu</th><th>Section OneNote</th></tr>
<tr><td>00_COMMENCER-ICI</td><td>Ce dossier maître, le guide Teams et OneNote</td><td>(enseignante)</td></tr>
<tr><td>Bloc-C0 à Bloc-C6</td><td>Ma mission · Feuille de notes · Je m'exerce</td><td>Une section par bloc, une page par fichier</td></tr>
<tr><td>Bloc-C7</td><td>Fiche de l'épreuve · Mon projet en une page · Autoévaluation</td><td>Section « Mon projet »</td></tr>
<tr><td>99_ENSEIGNANTE_SEULEMENT</td><td>Grille critérielle, fiches descriptives, observation, matériel à imprimer</td><td>Espace réservé aux enseignants</td></tr></table>
<h2 class="mt">{ico("ecran")}Le volet en ligne</h2><div class="g2"><div class="qr"><div>{qr(SITE, 64)}</div><div><b>Site du cours</b><div class="xs">{SITE.replace("https://", "")}</div><div class="small">Mission Avenir, ateliers et journal, « Où suis-je aujourd'hui ? », plan de match.</div></div></div>
<div class="qr"><div>{qr("https://ppscssdlj.netlify.app", 64)}</div><div><b>Outil Z101</b><div class="xs">ppscssdlj.netlify.app</div><div class="small">Empreinte, capacités, autodétermination, projet et cours liés, 29 cours.</div></div></div></div>
</div>'''
    pages.append(page("base", "L'organisation chez nous", corps, kick="Organisation", sous="Deux sous-groupes, quatre ateliers, un projet par élève.", etiquette="Dossier maître", n=3, tot=9))
    # p4 séquence
    DUR = {"C0": "1 à 2 séances", "C1": "2 séances", "C2": "2 séances", "C3": "2 séances", "C4": "2 séances", "C5": "2 à 3 séances", "C6": "2 séances"}
    rows = "".join(f'<tr><td><b style="color:{CAT[B[b]["cat"]]["c"]}">{b}</b></td><td><b>{B[b]["titre"]}</b><div class="xs">{B[b]["sous"]}</div></td><td>{sv(B[b]["savoirs"], B[b]["cat"]) or "—"}</td><td>{DUR[b]}</td><td class="xs">{B[b]["lien"][0]}</td></tr>' for b in ORDRE)
    corps = f'''<div class="dense" style="font-size:8.6pt"><table class="t"><tr><th>Bloc</th><th style="width:30%">Titre</th><th>Savoirs</th><th>Durée suggérée</th><th>En ligne</th></tr>{rows}
<tr><td><b>C7</b></td><td><b>Je présente mon projet</b><div class="xs">Épreuve, projet en une page, autoévaluation</div></td><td><span class="sv o">Les 12 savoirs</span></td><td>2 à 3 séances</td><td class="xs">Outil Z101 · One-pager</td></tr></table>
<div class="g3 mt"><div class="phase pa"><span class="tag">Avant (amorce)</span>Partir d'une expérience vécue en atelier ou du cas de Léo. Faire nommer, sans juger.</div>
<div class="phase pp"><span class="tag">Pendant (réaliser)</span>Ma mission, puis la feuille de notes modelée, puis Je m'exerce. Une consigne à la fois, à voix haute.</div>
<div class="phase pap"><span class="tag">Après (intégrer)</span>Code couleur d'autoévaluation, retour en duo, trace dans OneNote ou la chemise.</div></div>
<div class="card k mt"><h2>{ico("personne")}Léo, le fil rouge</h2><p>Léo, 24 ans, est un personnage fictif. Il modèle chaque bloc : l'élève voit comment faire <b>avant</b> de parler de lui-même. Ça protège les élèves qui ont un parcours difficile et ça donne un exemple concret de liens logiques.</p></div>
</div>'''
    pages.append(page("base", "La séquence", corps, kick="Planification", sous="Sept blocs et une épreuve. Environ 15 à 18 séances en classe.", etiquette="Dossier maître", n=4, tot=9))
    # p5-6 bloc par bloc
    def fiche(b):
        o = B[b]["observe"]; k = CAT[B[b]["cat"]]
        return f'''<div class="card" style="border-left:5px solid {k["c"]}"><h3 style="margin-top:0"><span style="color:{k["c"]}">{b}</span> · {B[b]["titre"]}</h3>
<div class="g3"><div class="phase pa"><span class="tag">Avant</span>{o["avant"]}</div><div class="phase pp"><span class="tag">Pendant</span>{o["pendant"]}</div><div class="phase pap"><span class="tag">Après</span>{o["apres"]}</div></div>
<div class="g2 mt" style="margin-top:6px"><div><b>À observer</b><ul class="ticks">{"".join(f"<li>{r}</li>" for r in o["regarder"])}</ul></div><div><b>Différenciation</b><p>{o["diff"]}</p></div></div></div>'''
    pages.append(page("base", "Bloc par bloc", '<div class="dense" style="display:flex;flex-direction:column;gap:9px">' + "".join(fiche(b) for b in ORDRE[:3]) + "</div>", kick="Pistes d'observation", sous="Avant, pendant, après. Ce qu'on regarde. Comment différencier.", etiquette="Dossier maître", n=5, tot=9))
    pages.append(page("base", "", '<div class="dense" style="display:flex;flex-direction:column;gap:9px;margin-top:14px">' + "".join(fiche(b) for b in ORDRE[3:6]) + "</div>", kick="Pistes d'observation", etiquette="Dossier maître", n=6, tot=9))
    pages.append(page("base", "", '<div class="dense" style="display:flex;flex-direction:column;gap:9px;margin-top:14px">' + "".join(fiche(b) for b in ORDRE[6:]) + f'''
<div class="card d"><h3 style="margin-top:0;color:#fff">C7 · Je présente mon projet</h3><p >Choisir la forme avec l'élève. Rassembler les traces (blocs, journaux d'atelier, bilan Mission Avenir). Faire remplir « Mon projet en une page » et l'autoévaluation. Évaluer avec la grille critérielle et les fiches descriptives.</p></div></div>''', kick="Pistes d'observation", etiquette="Dossier maître", n=7, tot=9))
    # p7 évaluation
    corps = f'''<div class="dense">
<div class="g3">{"".join(f'<div class="card t" style="--c:{CAT[c["cat"]]["c"]};--cl:{CAT[c["cat"]]["cl"]}"><span class="tag" style="color:{CAT[c["cat"]]["c"]}">Critère {c["no"]}</span><h3>{c["nom"]}</h3><p class="xs">Seuil : {c["ech"][2]}</p></div>' for c in CRIT)}</div>
<h2 class="mt2">{ico("etapes")}La démarche</h2><ol class="steps"><li>En cours de route : observer en atelier (grille vierge), lire les blocs et les journaux. Code couleur, sans note.</li>
<li>Avant l'épreuve : l'élève remplit « Mon projet en une page » et son autoévaluation. Choisir la forme ensemble.</li>
<li>L'épreuve : entrevue, exposé, portfolio, journal de bord ou questionnaire. Couvrir au moins 6 savoirs et les 3 catégories.</li>
<li>Juger avec la grille critérielle et les fiches descriptives. Seuil Acceptable pour chacun des 3 critères.</li>
<li>Si un critère n'est pas atteint : reprise ciblée de ce critère seulement, après un retour sur le bloc concerné.</li></ol>
<div class="g2 mt2"><div class="card"><h2>{ico("crayon")}Les documents</h2><ul><li>Bloc-C7 : fiche de l'épreuve, projet en une page, autoévaluation (élève)</li><li>Evaluation/1 : grille critérielle</li><li>Evaluation/2 : fiches descriptives par critère</li><li>Evaluation/3 : formes d'épreuve et couverture</li><li>Evaluation/4 : observation en atelier</li></ul></div>
<div class="card k"><h2>{ico("attention")}Points de vigilance</h2><ul><li>Juger la qualité des <b>liens</b>, pas la quantité d'écrit.</li><li>L'oral vaut l'écrit : relancer avant de conclure.</li><li>Les facteurs de délimitation restent confidentiels.</li><li>Ne pas déposer de documents nominatifs dans un canal public.</li></ul></div></div>
</div>'''
    pages.append(page("base", "L'évaluation", corps, kick="Évaluation", sous="Aide à l'apprentissage en continu, évaluation en vue de la sanction à la fin.", etiquette="Dossier maître", n=8, tot=9))
    # p8 sommaire matériel et ressources
    corps = f'''<div class="dense">
<div class="g2"><div class="card"><h2>{ico("crayon")}Matériel à imprimer</h2><ul><li><b>Cartes « Forces » :</b> 30 habiletés en 5 familles (bloc C1).</li><li><b>Cartes des 27 cours :</b> 4 thématiques (bloc C5).</li><li><b>Journal d'atelier papier :</b> la version imprimable du journal en ligne.</li></ul></div>
<div class="card"><h2>{ico("maison")}Ressources du programme</h2><ul><li>Personnes du milieu de vie : parents, amis, tuteurs, éducateurs, ressource d'hébergement.</li><li>Personnel du centre de formation.</li><li>Documentation gouvernementale et d'organismes reconnus.</li></ul></div></div>
<div class="card t mt"><h2>{ico("idee")}Pistes de réflexion pour l'équipe</h2><ul>
<li>Et si les élèves déjà en place devenaient mentors d'atelier après la découverte ? Ils travailleraient le fonctionnement en groupe et l'appartenance.</li>
<li>Le journal d'atelier peut-il servir de journal de bord pour l'épreuve ? Les traces existent déjà.</li>
<li>Un mur des projets dans la classe, enrichi par les deux sous-groupes, relu en juin.</li>
<li>Inviter un partenaire réel (intervenant, employeur de stage) à la présentation du projet.</li></ul></div>
<div class="card mt"><h2>{ico("idee")}10 principes pour ce cours en PPS</h2><ol class="steps" style="columns:2;column-gap:20px">
<li>Partir du vécu de l'atelier.</li><li>Modeler avant de demander.</li><li>Une idée par ligne, une consigne à la fois.</li><li>Lire à voix haute, toujours.</li><li>L'oral et le dessin valent l'écrit.</li><li>Valoriser les forces avant les limites.</li><li>Confidentialité des facteurs de délimitation.</li><li>Faire dire « parce que » et « donc ».</li><li>Code couleur, jamais de note pour l'élève.</li><li>Le projet change : c'est normal.</li></ol></div>
<div class="card d mt"><h2>{ico("attention")}Confidentialité</h2><p >Cette trousse ne contient aucun nom d'élève. Les grilles remplies, la répartition des groupes et les facteurs de délimitation restent dans un espace privé (dossier de l'élève, canal privé de l'équipe).</p></div></div>'''
    pages.append(page("base", "Matériel et ressources", corps, kick="Annexes", etiquette="Dossier maître", n=9, tot=9))
    jobs = [("M_1", doc("Dossier maître Z101", pages), os.path.join(P_COM, "1_Dossier-maitre_Enseignante.pdf"))]
    # guide Teams OneNote
    corps = f'''<p class="lede">La trousse est pensée pour <b>Teams et OneNote</b>, comme celle de Budget et consommation : <b>un dossier = une section</b>, <b>un fichier = une page</b>.</p>
<h2 class="mt2">{ico("etapes")}Déposer la trousse dans Teams</h2><ol class="steps"><li>Dans l'équipe du cours, ouvrir le canal Général, onglet Fichiers.</li><li>Glisser les dossiers Bloc-C0 à Bloc-C7 et 00_COMMENCER-ICI.</li>
<li>Créer un canal privé « Enseignants » et y glisser 99_ENSEIGNANTE_SEULEMENT.</li><li>Épingler le site du cours comme onglet (bouton +, Site web) : {SITE.replace("https://", "")}</li></ol>
<h2 class="mt2">{ico("crayon")}Bâtir le bloc-notes OneNote</h2><ol class="steps"><li>Ouvrir le bloc-notes pour la classe et créer une section par bloc : C0 Mon carnet de route, C1 Qui je suis, … C7 Je présente mon projet.</li>
<li>Dans chaque section, insérer les 3 PDF en impression : Ma mission, Feuille de notes, Je m'exerce.</li><li>Distribuer les sections aux élèves au fil des blocs (Distribuer la page ou la section).</li><li>Mettre Bloc-C7 dans l'espace de collaboration ou une section « Mon projet ».</li></ol>
<div class="g2 mt2"><div class="card t"><h2>{ico("idee")}Réglages utiles en PPS</h2><ul><li>Lecteur immersif : lit la page à voix haute.</li><li>Dictée : l'élève répond à l'oral.</li><li>Stylet ou doigt : écrire directement sur le PDF.</li></ul></div>
<div class="card k"><h2>{ico("lien")}Remise des traces</h2><ul><li>Devoir Teams « Mon bilan Mission Avenir ».</li><li>Devoir Teams « Mon journal d'atelier » (récurrent).</li><li>Devoir Teams « Mon projet en une page ».</li></ul></div></div>'''
    jobs.append(("M_2", doc("Guide Teams et OneNote", [page("base", "Guide Teams et OneNote", corps, kick="Mise en place", sous="Déposer la trousse en 15 minutes.", etiquette="Guide Teams")]), os.path.join(P_COM, "2_Guide-Teams-OneNote.pdf")))
    return jobs


# ============================================================================ MATÉRIEL
def materiel():
    jobs = []
    FAM = {"Intellectuelles": ["Comprendre vite", "Bonne mémoire", "Résoudre un problème", "Calculer", "Lire des consignes", "Être curieux"],
           "Sociales": ["Écouter", "Aider les autres", "Faire rire", "Rester calme", "Parler aux clients", "Travailler en équipe"],
           "Manuelles": ["Réparer", "Construire", "Cuisiner", "Nettoyer avec soin", "Plier et ranger", "Utiliser des outils"],
           "Artistiques": ["Dessiner", "Chanter ou jouer", "Décorer", "Prendre des photos", "Inventer des histoires", "Danser"],
           "Organisationnelles": ["Être à l'heure", "Planifier", "Ranger", "Suivre une liste", "Faire un inventaire", "Prendre des notes"]}
    COL = dict(zip(FAM, ["#5B4BFF", "#F2542D", "#0E9F8E", "#C2185B", "#B7791F"]))
    cartes = [(f, h) for f in FAM for h in FAM[f]]
    pages = []
    for i in range(0, len(cartes), 12):
        cs = "".join(f'<div class="cut" style="border-radius:12px;height:2.05in;padding:12px;display:flex;flex-direction:column;justify-content:space-between;border-top:8px solid {COL[f]}"><span class="tag" style="color:{COL[f]}">{f}</span><div style="font-size:17pt;font-weight:850;letter-spacing:-.02em;line-height:1.1">{h}</div><span class="xs">Habiletés · bloc C1</span></div>' for f, h in cartes[i:i + 12])
        pages.append(page("disp", "Cartes « Forces »" if i == 0 else "", f'<div class="g3" style="gap:8px;margin-top:{6 if i == 0 else 18}px">{cs}</div>', kick="Matériel à imprimer", sous="Découper. Trier en 3 piles : moi souvent, moi parfois, pas moi." if i == 0 else "", etiquette="Cartes Forces", n=i // 12 + 1, tot=3, deco=(i == 0)))
    jobs.append(("MAT_1", doc("Cartes Forces", pages), os.path.join(P_MAT, "Cartes-Forces_30-habiletes.pdf")))
    TH = {"Les conditions de vie": ("#0E9F8E", [("Z104", "Soins personnels"), ("Z105", "Hygiène et prévention"), ("Z106", "Alimentation au quotidien"), ("Z107", "Alimentation saine"), ("Z108", "Psychomotricité"), ("Z109", "Forme physique"), ("Z110", "Sexualité et respect"), ("Z111", "Conduites à risque")]),
          "Les relations sociales": ("#5B4BFF", [("Z112", "Interactions au quotidien"), ("Z113", "Réseau social sain"), ("Z114", "Relations harmonieuses"), ("Z115", "Langages utilitaires"), ("Z116", "Vie parentale")]),
          "Le milieu de vie": ("#F2542D", [("Z117", "Vie en cohabitation"), ("Z118", "Perspective de vie en appartement"), ("Z119", "Vie locative"), ("Z120", "Sécurité et salubrité du milieu de vie"), ("Z121", "Gestion de l'entretien domestique"), ("Z122", "Objets technologiques courants")]),
          "La communauté": ("#B7791F", [("Z123", "Identité culturelle"), ("Z124", "Vie dans une collectivité"), ("Z125", "Participation citoyenne"), ("Z126", "Activités productives"), ("Z127", "Achat et consommation"), ("Z128", "Budget et consommation"), ("Z129", "Activités de loisir"), ("Z130", "Déplacements quotidiens")])}
    cartes = [(t, c, code, nom) for t, (c, l) in TH.items() for code, nom in l]
    pages = []
    for i in range(0, len(cartes), 12):
        cs = "".join(f'<div class="cut" style="border-radius:12px;height:2.05in;padding:12px;display:flex;flex-direction:column;justify-content:space-between;border-top:10px solid {c}"><span class="tag" style="color:{c}">{t}</span><div><div style="font-size:24pt;font-weight:900;letter-spacing:-.03em;color:transparent;-webkit-text-stroke:1.2px {c}">{code}</div><div style="font-size:14pt;font-weight:850;line-height:1.12">{nom}</div></div><span class="xs">PPS-{code} · bloc C5</span></div>' for t, c, code, nom in cartes[i:i + 12])
        pages.append(page("proj", "Cartes des 27 cours" if i == 0 else "", f'<div class="g3" style="gap:8px;margin-top:{6 if i == 0 else 18}px">{cs}</div>', kick="Matériel à imprimer", sous="Pour choisir les cours liés au projet. Trier : oui, peut-être, non." if i == 0 else "", etiquette="Cartes des cours", n=i // 12 + 1, tot=3, deco=(i == 0)))
    jobs.append(("MAT_2", doc("Cartes des 27 cours", pages), os.path.join(P_MAT, "Cartes-des-27-cours_4-thematiques.pdf")))
    q = lambda sav, t, contenu: f'<div style="margin-top:7px"><span class="tag" style="color:var(--c)">{sav}</span><div style="font-weight:800">{t}</div>{contenu}</div>'
    corps = f'''<div class="g2"><div class="small"><b>Prénom :</b> ______________________</div><div class="small"><b>Date :</b> ____________ &nbsp; <b>Séance :</b> ____</div></div>
<p class="small mt"><b>Atelier :</b> {OPTS(["Grenier de Maria", "Ensachage", "Cantine", "Conciergerie"])} &nbsp; <b>Rôle :</b> ____________</p>
{q("Expériences", "Ce que j'ai fait aujourd'hui", L(2))}
{q("Habiletés", "Une force que j'ai utilisée", L(1))}
{q("Motivation", "Comment j'ai trouvé l'atelier", '<div class="scale" style="margin-top:4px"><div class="s1"><span class="dot"></span>J\'ai aimé</div><div class="s2"><span class="dot"></span>Moyen</div><div class="s3"><span class="dot"></span>Pas aimé</div></div>')}
{q("Motivation", "Ce que j'ai le plus aimé, ou le moins aimé", L(2))}
{q("Facteurs de délimitation", "Ce qui a été difficile pour moi", L(1))}
{q("Buts", "Est-ce que ça m'intéresse pour mon projet ?", OPTS(["Oui, j'aimerais continuer", "Peut-être", "Non, pas pour moi"]))}
{q("Buts", "Ma phrase pour l'avenir : Aujourd'hui, j'ai appris… Ça pourrait me servir pour…", L(2))}
{q("Conditions de réussite", "La prochaine fois, je veux essayer…", L(1))}'''
    jobs.append(("MAT_3", doc("Journal d'atelier", [page("pot", "Mon journal d'atelier", corps, kick="Après chaque séance", sous="5 minutes. Il n'y a pas de mauvaise réponse.", etiquette="Journal d'atelier")]), os.path.join(P_MAT, "Journal-d-atelier_papier.pdf")))
    return jobs

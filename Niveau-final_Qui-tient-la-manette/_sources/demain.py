"""Plan concret de l'atelier 3 pour la classe de modélisation : part de la page 1 déjà remplie (PDF, 2 pages)."""
import os, sys, subprocess
ICI = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(ICI)
Z = os.path.join(os.path.dirname(R), "PPS_Z101_Projection-avenir_Trousse", "_sources"); sys.path.insert(0, Z); sys.path.insert(0, ICI)
import carnet
from style import doc, ico
CY, CO, VE, JA = carnet.CY, carnet.CO, carnet.VE, carnet.JA
rows = [("0 à 3", "Accueil · la page 1", "« Sortez votre cahier, page 1. La semaine passée, vous avez rempli votre fiche de joueur : vos forces, vos défis, votre équipe d'aide. Aujourd'hui, on s'en sert. »", "Q1 batterie"),
        ("3 à 4", "Les 4 power-ups", "« Il reste trois semaines. Un power-up par semaine. Aujourd'hui : rester dans sa zone, même le jour de l'évaluation. »", "NF0-02"),
        ("4 à 8", "Jeu : vrai ou mythe ?", "4 affirmations, 45 secondes chacune. Révéler la réponse et lire l'explication.", "Q2 à Q5"),
        ("8 à 12", "Le stress, c'est le volume · l'alarme et le pilote", "Montrer sa propre zone. « Un peu de stress aide. Trop, et le pilote lâche la manette. »", "Q6 · NF3-01, NF3-02"),
        ("12 à 15", "4 · 4 · 6 ensemble", "Chronomètre au tableau, 3 fois, sans parler. Puis le vote.", "Q7 · NF3-03"),
        ("15 à 17", "Mes signaux d'alarme", "Carnet p. 2 : chacun coche. Le nuage montre qu'on n'est pas seul.", "Q8"),
        ("17 à 25", "Mon « si… alors… » à partir de la page 1", "« Regardez votre défi en page 1 : c'est votre SI. Regardez vos forces et votre équipe d'aide : c'est votre ALORS. » Exemple en maths : SI je bloque sur un système d'équations, ALORS je reprends l'exemple de mon aide-mémoire, puis je demande à la personne de mon équipe (page 1). Écrire 2 plans en carnet p. 3.", "Q9 · NF3-04"),
        ("25 à 30", "Sortie", "Batterie, mot de la fin. Découper la carte de poche et la glisser dans le cahier, à la page 1.", "Q10, Q11")]
corps = f'''<div class="card t" style="--cl:#FBF1D6"><b>Le fil :</b> la page 1 du cahier (forces, défis, équipe d'aide) devient la matière première de l'atelier. Rien de nouveau à apprendre sur la personne : on lui donne des outils pour s'en servir le jour de l'évaluation.</div>
<h2 class="mt">{ico("crayon")}Ce soir</h2><ul class="ticks small"><li>Imprimer pour chaque élève les pages 1, 2, 3 et 8 du carnet (la page 8, c'est la carte de poche). Prévoir des ciseaux.</li><li>Monter la présentation Mentimeter (liste à la page 2 de ce plan).</li><li>Demander aux élèves d'apporter leur cahier, ouvert à la page 1.</li></ul>
<h2 class="mt">{ico("horloge")}Demain, minute par minute</h2>
<div class="dense"><table class="t"><tr><th style="width:10%">Min</th><th style="width:22%">Moment</th><th>Ce qu'on dit ou fait</th><th style="width:16%">Mentimeter · visuel</th></tr>{"".join(f"<tr><td><b>{a}</b></td><td><b>{b}</b></td><td>{c}</td><td class='xs'>{d}</td></tr>" for a, b, c, d in rows)}</table></div>
<div class="card k mt"><h2>{ico("loupe")}Après mon passage (pour l'enseignant·e)</h2><p class="small">Cette semaine, en circulant : « Quel est votre « si… alors… » pour l'évaluation ? » La page 1 et la carte de poche sont au même endroit, dans le cahier.</p></div>'''
Q = [("Q1", "Échelle", "Ma batterie en arrivant (0 à 10)", "NF0-01_Titre"), ("—", "Diapo image", "Les 4 power-ups", "NF0-02_Les-4-power-ups"),
     ("Q2 à Q5", "Choix multiple · bonne réponse révélée", "Vrai ou mythe ? (4 questions : Vrai / Mythe)", "NF3-05 à NF3-08"),
     ("Q6", "Échelle", "Quand je pense à l'évaluation, je suis… (1 endormi, 10 bloqué)", "NF3-01_Le-stress-cest-le-volume"), ("—", "Diapo image", "L'alarme et le pilote", "NF3-02"),
     ("Q7", "Choix multiple", "Après 3 fois 4 · 4 · 6, je me sens : plus calme / pareil / je dois pratiquer", "NF3-03_Respiration-4-4-6"), ("Q8", "Nuage de mots", "Mon signal d'alarme à moi", "—"),
     ("Q9", "Question ouverte · grille", "Un de mes « si… alors… »", "NF3-04_Si-alors"), ("Q10", "Échelle", "Ma batterie en partant", "—"), ("Q11", "Nuage de mots", "En un mot, cet atelier ?", "—")]
corps2 = f'''<p class="small">Dupliquer la présentation des ateliers précédents. Réglages : réponses anonymes, résultats affichés après le vote, bonne réponse révélée pour Q2 à Q5.</p>
<table class="t grid mt"><tr><th style="width:11%">Question</th><th style="width:24%">Type</th><th>Texte</th><th style="width:28%">Image</th></tr>{"".join(f"<tr><td><b>{a}</b></td><td>{b}</td><td>{c}</td><td class='xs'>{d}</td></tr>" for a, b, c, d in Q)}</table>
<div class="g2 mt2"><div class="card"><h2>{ico("ok")}Réponses du jeu</h2><ol class="small"><li>Être stressé = pas prêt : <b>mythe</b></li><li>Un peu de stress aide : <b>vrai</b></li><li>Relire jusqu'à la dernière seconde : <b>mythe</b></li><li>Rester bloqué jusqu'à trouver : <b>mythe</b></li></ol></div>
<div class="card d"><h2>{ico("idee")}Si le temps manque</h2><p class="small">Garder absolument : 4 · 4 · 6 et le « si… alors… » à partir de la page 1. Le jeu peut passer à 2 questions.</p></div></div>'''
out = os.path.join(R, "Plan-de-demain_Atelier-3_classe-de-modelisation.pdf")
h = "/tmp/claude-0/pps/nf_demain.html"
open(h, "w").write(doc("Plan de demain", [carnet.P("Z", "Demain, concrètement", corps, kick="Atelier 3 · Je reste dans ma zone", sous="Classe de modélisation algébrique · 30 minutes", n=1, tot=2),
                                          carnet.P("Z", "La présentation Mentimeter", corps2, kick="À monter ce soir", n=2, tot=2)]))
subprocess.run(["node", os.path.join(Z, "rendre.js"), h, out], check=True)

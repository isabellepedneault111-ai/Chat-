"""Suivi Teams « Niveau final » : messages prêts à copier (PDF)."""
import os, sys, subprocess
ICI = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(ICI)
Z = os.path.join(os.path.dirname(R), "PPS_Z101_Projection-avenir_Trousse", "_sources"); sys.path.insert(0, Z); sys.path.insert(0, ICI)
import carnet  # applique le style « Niveau final »
from style import doc, ico
M = [("Atelier 3 · Je reste dans ma zone", "#0E8FB0", "Niveau final, atelier 3 : vous avez débloqué le power-up Z : je reste dans ma zone. Cette semaine, une seule mission : essayer 4 · 4 · 6 une fois avant de commencer votre période, et garder votre carte de poche sur le bureau. Votre « si… alors… » préféré, vous pouvez le partager ici (avec ou sans votre nom).",
      "Plusieurs ont écrit « si je bloque, alors je passe à la suivante ». Excellent réflexe : en évaluation, une question laissée de côté n'est pas une question perdue."),
     ("Atelier 4 · Je choisis", "#B7860B", "Niveau final, atelier 4 : power-up C débloqué. Mission de la semaine : calculer votre chrono (minutes par partie) et montrer le brouillon de votre aide-mémoire à votre enseignant·e. Les 3 passes : 1 les points sûrs, 2 les encerclées, 3 je vérifie.",
      "Le groupe a trouvé 40 minutes par tâche. Écrire l'heure de fin en haut de la copie, c'est garder la manette."),
     ("Atelier 5 · Je peux · Je me connais", "#E0522B", "Niveau final, atelier 5 : les 4 power-ups sont débloqués. Votre lettre au « moi du jour J » est dans votre étui : ouvrez-la le matin de l'évaluation. On est derrière vous.",
      "Les phrases de coach du groupe, en vrac : « une question à la fois », « je ne maîtrise pas encore, mais j'avance », « j'ai un plan ». Gardez-les.")]
cartes = "".join(f'''<div class="card" style="border-left:6px solid {c};margin-top:8px;padding:9px 13px"><h2 style="color:{c}">{t}</h2><span class="tag">Le jour de l'atelier · à copier</span><div class="quote small" style="margin:4px 0 8px">{a}</div><span class="tag">Retour au groupe, deux lignes, sans nommer</span><div class="quote small">{b}</div></div>''' for t, c, a, b in M)
corps = f'''<p class="lede" style="font-size:11.5pt">Dans le canal « Qui tient la manette ? » de l'équipe de la classe. Un message le jour de l'atelier, un retour de deux lignes en fin de semaine.</p>{cartes}
<div class="card t mt"><h2>{ico("personne")}Le lien humain</h2><ul><li>Réagir aux messages des élèves (un pouce, un mot).</li><li>Si la batterie d'une personne baisse deux semaines de suite : un message privé, simple et chaleureux.</li><li>Après l'évaluation : « Quel power-up vous a servi ? » en sondage dans le canal.</li></ul></div>'''
out = os.path.join(R, "Suivi-Teams_Niveau-final.pdf")
h = "/tmp/claude-0/pps/nf_suivi.html"; open(h, "w").write(doc("Suivi Teams", [carnet.P("N", "Suivi dans Teams", corps, kick="Entre les ateliers")]))
subprocess.run(["node", os.path.join(Z, "rendre.js"), h, out], check=True)

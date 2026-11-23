"""Guide d'animation « Niveau final » (Word, puis PDF par LibreOffice). Pour l'enseignant·e et l'animatrice : sans « tu », sans sigles."""
import os, subprocess
from docx import Document
from docx.shared import Pt, Inches, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ICI = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(ICI)
V = os.path.join(R, "Visuels_Mentimeter")
NUIT, JA, CY, CO, VE = RGBColor(0x0F, 0x14, 0x30), RGBColor(0xB7, 0x86, 0x0B), RGBColor(0x0E, 0x8F, 0xB0), RGBColor(0xE0, 0x52, 0x2B), RGBColor(0x1E, 0x9E, 0x6A)

d = Document()
for s in d.sections:
    s.top_margin = s.bottom_margin = Cm(1.8); s.left_margin = s.right_margin = Cm(2)
st = d.styles["Normal"]; st.font.name = "Calibri"; st.font.size = Pt(10.5)
st.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")


def shade(cell, hexa):
    tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement("w:shd"); sh.set(qn("w:val"), "clear"); sh.set(qn("w:color"), "auto"); sh.set(qn("w:fill"), hexa); tcPr.append(sh)


def H(txt, lvl=1, color=NUIT):
    p = d.add_heading(txt, level=lvl)
    for r in p.runs: r.font.color.rgb = color; r.font.name = "Calibri"
    return p


def Pp(txt, bold_prefix=None, size=None, italic=False):
    p = d.add_paragraph()
    if bold_prefix: r = p.add_run(bold_prefix); r.bold = True
    r = p.add_run(txt); r.italic = italic
    if size: r.font.size = Pt(size)
    return p


def B(items):
    for it in items:
        p = d.add_paragraph(style="List Bullet")
        if isinstance(it, tuple): r = p.add_run(it[0]); r.bold = True; p.add_run(it[1])
        else: p.add_run(it)


def tableau(rows, widths, head=True, fill="E9ECF5"):
    t = d.add_table(rows=len(rows), cols=len(rows[0])); t.style = "Table Grid"; t.autofit = False
    for j, w in enumerate(widths): t.columns[j].width = w
    for i, row in enumerate(rows):
        for j, val in enumerate(row):
            c = t.cell(i, j); c.text = ""; p = c.paragraphs[0]; r = p.add_run(val); r.font.size = Pt(9.5)
            if head and i == 0: r.bold = True; shade(c, fill)
            c.width = widths[j]
    d.add_paragraph()
    return t


def img(nom, w=3.0):
    p = d.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(os.path.join(V, nom + ".png"), width=Inches(w))


def vignettes(noms, w=2.15):
    t = d.add_table(rows=1, cols=len(noms))
    for j, n in enumerate(noms):
        c = t.cell(0, j); p = c.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(os.path.join(V, n + ".png"), width=Inches(w))
        q = c.add_paragraph(n.replace("-", " ")); q.alignment = WD_ALIGN_PARAGRAPH.CENTER; q.runs[0].font.size = Pt(7.5)
    d.add_paragraph()


W4 = [Cm(1.9), Cm(7.6), Cm(4.6), Cm(2.9)]

# ------------------------------------------------------------------ Couverture
p = d.add_paragraph(); r = p.add_run("QUI TIENT LA MANETTE ?"); r.bold = True; r.font.color.rgb = JA; r.font.size = Pt(11)
p = d.add_paragraph(); r = p.add_run("Niveau final"); r.bold = True; r.font.size = Pt(40); r.font.color.rgb = NUIT
p = d.add_paragraph(); r = p.add_run("Guide d'animation · ateliers 3, 4 et 5"); r.font.size = Pt(16); r.font.color.rgb = NUIT
img("NF0-01_Titre", 6.2)
Pp("Les élèves terminent dans trois semaines et plusieurs se préparent à leur évaluation. Cette suite garde l'esprit de « Qui tient la manette ? » et le guide de départ, sans les remplacer : elle met l'accent sur ce qui aide vraiment la semaine de l'évaluation, sans surcharger. ", "Pourquoi cette suite. ")
Pp("« Niveau final » pour ce guide, « Mon carnet » pour le cahier de l'élève. Le jeu vidéo est déjà l'image de la séquence : la manette, ce sont les choix; le niveau final, c'est l'évaluation. On ne combat pas le boss seul et sans plan.", "Le nom. ")

# ------------------------------------------------------------------ L'idée
H("1. L'idée en une page")
Pp("Les ateliers travaillent directement les quatre caractéristiques d'un comportement autodéterminé, déjà présentes dans les intentions pédagogiques de la séquence. Chacune devient un « power-up » que l'élève débloque :")
tableau([["Power-up", "Caractéristique", "Ce que l'élève fait concrètement", "Atelier"],
         ["Z · Je reste dans ma zone", "Autorégulation", "Reconnaître ses signaux de stress, respirer 4 · 4 · 6, se donner un plan « si… alors… ».", "3"],
         ["C · Je choisis", "Autonomie", "Choisir son ordre (les 3 passes), gérer son temps, bâtir son aide-mémoire.", "4"],
         ["P · Je peux", "Empowerment psychologique", "Remplacer la voix du critique par celle du coach; voir la preuve de ses progrès.", "5"],
         ["M · Je me connais", "Autoréalisation", "Nommer ce qui marche pour soi : moment, stratégie, personne, force.", "5"]], [Cm(3.2), Cm(3.6), Cm(8), Cm(2.2)])
img("NF0-02_Les-4-power-ups", 5.6)
B([("30 minutes, une fois par semaine. ", "Mentimeter, réponses anonymes, sur portable."),
   ("Une question toutes les 2 ou 3 minutes, ", "jamais plus de 4 minutes de parole d'affilée. Un jeu par atelier."),
   ("Chaque atelier se suffit à lui-même : ", "une personne qui a manqué les ateliers 1 et 2, ou qui n'a vu l'animatrice qu'une fois, embarque sans retard."),
   ("Les maths seulement quand c'est utile : ", "lire une question de problème, calculer son temps, préparer son aide-mémoire. Le reste vaut pour toutes les matières.")])

H("2. Adapter selon la situation")
Pp("Le matériel est le même partout : visuels, questions Mentimeter, carnet, carte de poche. Seuls deux points s'ajustent.")
tableau([["", "Quand tous les élèves passent la même évaluation", "Quand chaque élève a sa propre évaluation"],
         ["Le chrono (atelier 4)", "Le calcul du jeu est leur vrai calcul : 3 heures, 4 questions, 3 tâches, aide-mémoire d'une page permis.", "Chaque élève note la durée de sa propre évaluation; s'il ne la connaît pas, la demander à l'enseignant·e devient l'action de la semaine."],
         ["L'aide-mémoire", "Une page recto, faite par l'élève, approuvée par l'enseignant·e.", "Les règles varient selon les cours : l'élève vérifie ce qui est permis."]], [Cm(3.4), Cm(6.8), Cm(6.8)])
Pp("Dans tous les cas, les partages passent par Mentimeter, de façon anonyme. Une personne qui le souhaite peut en dire plus à voix haute, sans jamais y être invitée nommément.")

H("3. Sécurité affective")
tableau([["À dire", "À éviter"],
         ["« Être stressé, ça veut dire que c'est important pour vous. »", "« Il n'y a pas de raison d'être stressé. »"],
         ["« On vise la zone, pas le zéro stress. »", "« Relaxez, ce n'est qu'un examen. »"],
         ["« Pas encore » · « Une question à la fois. »", "« C'est facile, vous l'avez vu. »"],
         ["« Personne ne voit votre carnet sans votre permission. »", "Demander de lire son plan ou sa lettre à voix haute."]], [Cm(8.5), Cm(8.5)], fill="E1F4EB")
Pp("Une personne très anxieuse peut faire la respiration les yeux ouverts, ou seulement regarder. Si un·e élève parle d'une anxiété qui l'empêche de se présenter à l'évaluation, l'orienter vers les services du centre (orientation, TES, accommodements prévus).", italic=True)

# ------------------------------------------------------------------ Atelier 3
H("4. Atelier 3 · Je reste dans ma zone", color=CY)
Pp("Reconnaître ses signaux de stress et reprendre le contrôle avec deux outils simples : la respiration 4 · 4 · 6 et le plan « si… alors… ».", "Intention. ")
vignettes(["NF3-01_Le-stress-cest-le-volume", "NF3-02_Qui-tient-la-manette-du-cerveau", "NF3-03_Respiration-4-4-6"])
vignettes(["NF3-04_Si-alors", "NF3-05_Vrai-ou-mythe-1", "NF0-02_Les-4-power-ups"])
tableau([["Minutes", "Déroulement", "Mentimeter", "Visuel · carnet"],
         ["0 à 2", "Accueil. Ceux qui arrivent : on part d'ici, aucun retard.", "Q1 Échelle : ma batterie (0 à 10)", "NF0-01"],
         ["2 à 3", "Les 4 power-ups : aujourd'hui, on débloque Z.", "—", "NF0-02 · carnet p. 1"],
         ["3 à 7", "Jeu « Vrai ou mythe ? » : 4 affirmations, 45 secondes chacune, la bonne réponse et l'explication en direct.", "Q2 à Q5 Choix multiple (Vrai / Mythe), bonne réponse révélée", "NF3-05 à NF3-08"],
         ["7 à 10", "Je fais : le stress, c'est le volume. Modeler à voix haute : « Quand je pense à une évaluation, je me situe ici, et voici ce que je sens. »", "Q6 Échelle : quand je pense à l'évaluation, je suis… (1 endormi, 10 bloqué)", "NF3-01 · carnet p. 2"],
         ["10 à 12", "Je fais : l'alarme et le pilote. Le cerveau croit que l'examen est un ours; l'expiration lente redonne la manette au pilote.", "—", "NF3-02"],
         ["12 à 15", "Nous faisons : 4 · 4 · 6 ensemble, 3 fois, chronomètre au tableau.", "Q7 Choix multiple : après 3 fois, je me sens plus calme / pareil / je dois pratiquer", "NF3-03"],
         ["15 à 17", "Mes signaux d'alarme : chacun coche dans son carnet.", "Q8 Nuage de mots : mon signal d'alarme à moi", "carnet p. 2"],
         ["17 à 24", "Ils font : le plan « si… alors… ». Deux exemples, puis deux à écrire. En maths : « Si je ne me souviens plus comment isoler x, alors je regarde l'exemple de mon aide-mémoire. »", "Q9 Question ouverte (grille) : un de mes « si… alors… »", "NF3-04 · carnet p. 3"],
         ["24 à 27", "Objectivation : avant, pendant, après (carnet p. 3).", "—", "carnet p. 3"],
         ["27 à 30", "Batterie de sortie, mot de la fin, carte de poche à découper.", "Q10 Échelle : ma batterie · Q11 Nuage : en un mot, cet atelier ?", "carnet p. 8"]], W4)
Pp("Montrer sa propre jauge et son propre « si… alors… » (« Si je dois parler devant un groupe et que ma voix tremble, alors je ralentis et je respire »). L'adulte qui montre son stress donne la permission d'en avoir.", "Je fais. ")
Pp("La respiration en même temps, tout le monde, sans rien dire. Les résultats de la Q9 donnent des idées aux autres sans que personne s'expose.", "Nous faisons. ")
Pp("Écrire ses deux plans « si… alors… » et découper sa carte de poche.", "Ils font. ")
Pp("En circulant cette semaine, demander : « Quel est votre « si… alors… » pour l'évaluation ? » Remarquer un·e élève qui respire avant de commencer et le nommer en privé.", "Après mon passage (pour l'enseignant·e). ")

# ------------------------------------------------------------------ Atelier 4
H("5. Atelier 4 · Je choisis", color=JA)
Pp("Choisir comment aborder l'évaluation : la carte du niveau, les 3 passes, le chrono, la lecture en détective et l'aide-mémoire.", "Intention. ")
vignettes(["NF4-01_La-carte-du-niveau", "NF4-02_Les-3-passes", "NF4-03_Lire-comme-un-detective"])
vignettes(["NF4-04_Le-chrono-du-boss", "NF4-05_Le-chrono-reponse", "NF4-06_Mon-aide-memoire"])
tableau([["Minutes", "Déroulement", "Mentimeter", "Visuel · carnet"],
         ["0 à 2", "Batterie, rappel du power-up Z (une respiration ensemble).", "Q1 Échelle : ma batterie", "—"],
         ["2 à 4", "Sondage : dans une évaluation, je commence par…", "Q2 Choix multiple : la première question / ce que je sais / ce qui vaut le plus de points / je ne sais pas", "—"],
         ["4 à 8", "Je fais : la carte du niveau, puis les 3 passes en pensant à voix haute sur une copie d'évaluation fictive.", "—", "NF4-01, NF4-02 · carnet p. 4"],
         ["8 à 12", "Jeu « Le chrono du boss » : combien de minutes par grande tâche ? Puis la démarche.", "Q3 Deviner le nombre (réponse : 40)", "NF4-04, NF4-05"],
         ["12 à 17", "Nous faisons : lire comme un détective. Trois couleurs, 30 secondes.", "Q4 Épingler sur l'image : où est le mot piège ? · Q5 Deviner le nombre : à partir de combien de visites ? (réponse : 6)", "NF4-03 · carnet p. 5"],
         ["17 à 25", "Ils font : mon chrono (avec les vraies données de son évaluation) et le brouillon de mon aide-mémoire.", "Q6 Question ouverte (grille) : ce que je mets sur mon aide-mémoire", "NF4-06 · carnet p. 4 et 5"],
         ["25 à 30", "Une stratégie que j'essaie cette semaine; batterie; mot de la fin.", "Q7 Choix multiple : 3 passes / chrono / détective / aide-mémoire · Q8 Échelle · Q9 Nuage", "—"]], W4)
Pp("15 $ + 2 $ par visite contre 5 $ par visite. À 5 visites : 25 $ contre 25 $. À 6 visites : 27 $ contre 30 $. La première salle devient avantageuse à partir de 6 visites. Le mot piège est « avantageuse » : il faut que ce soit moins cher, pas égal.", "La réponse du détective. ")
Pp("Demander : « Quel est votre chrono par tâche ? » Approuver ou commenter le brouillon d'aide-mémoire au cours de la semaine : c'est déjà de l'étude.", "Après mon passage (pour l'enseignant·e). ")

# ------------------------------------------------------------------ Atelier 5
H("6. Atelier 5 · Je peux · Je me connais", color=CO)
Pp("Faire taire le critique intérieur, voir la preuve de ses progrès, nommer ce qui marche pour soi, puis écrire au « moi du jour J ».", "Intention. ")
vignettes(["NF5-01_Critique-ou-coach", "NF5-02_La-preuve", "NF5-03_Message-du-jour-J"])
tableau([["Minutes", "Déroulement", "Mentimeter", "Visuel · carnet"],
         ["0 à 2", "Batterie.", "Q1 Échelle : ma batterie", "—"],
         ["2 à 5", "La phrase du critique dans ma tête (anonyme).", "Q2 Nuage de mots", "—"],
         ["5 à 8", "Je fais : critique ou coach. La phrase du coach est vraie, pas magique.", "—", "NF5-01"],
         ["8 à 12", "Jeu « Vote éclair » : laquelle est la meilleure phrase de coach ?", "Q3 Choix multiple, 3 phrases, 20 secondes chacune", "NF5-01"],
         ["12 à 17", "Ils font : transformer 3 phrases, puis la sienne.", "Q4 Question ouverte (grille) : ma phrase de coach", "carnet p. 6"],
         ["17 à 21", "La preuve : au début, je ne savais pas… maintenant, je sais… En maths, une notion maîtrisée aujourd'hui.", "Q5 Question ouverte : une chose que je sais faire maintenant", "NF5-02 · carnet p. 6"],
         ["21 à 26", "Le message au moi du jour J : écrire en silence, plier, garder dans son étui.", "—", "NF5-03 · carnet p. 7"],
         ["26 à 30", "Les 4 power-ups débloqués, batterie, mot de la fin.", "Q6 Échelles ×4 : mes power-ups · Q7 Échelle · Q8 Nuage", "NF5-04 · carnet p. 7"]], W4)
Pp("Si la classe s'y prête, l'enseignant·e peut garder les lettres dans une enveloppe et les remettre le matin de l'évaluation.", "Une idée qui marque. ")

# ------------------------------------------------------------------ Suivi Teams et réglages
H("7. Entre les ateliers : le suivi dans Teams")
Pp("Dans le canal « Qui tient la manette ? » de l'équipe de la classe. Un message le jour de l'atelier, un retour de deux lignes au groupe, sans nommer personne. Les trois messages sont prêts à copier dans le document « Suivi Teams ».")
H("8. Réglages Mentimeter", 2)
B(["Réponses anonymes; pas de classement des participants.", "Choix multiple : afficher les résultats après le vote, puis la bonne réponse.", "Deviner le nombre : révéler la bonne réponse après les estimations.", "Question ouverte : affichage en grille; modérer si besoin.", "Dupliquer la présentation des ateliers 1 et 2, puis changer images et questions."])
H("9. Pistes de réflexion", 2)
B(["Et si la carte de poche devenait un objet officiel du centre, permis sur le bureau pendant les évaluations ?",
   "Les « si… alors… » de la Q9 pourraient former une affiche anonyme du groupe dans la classe.",
   "Après l'évaluation, un court retour : quel power-up a servi ? C'est de l'autoréalisation en direct."])
Pp("Sources des contenus mathématiques : définition du domaine d'évaluation du cours de modélisation algébrique et graphique (MEQ, 2021) pour la durée de l'épreuve et l'aide-mémoire.", size=8.5, italic=True)

out = os.path.join(R, "Guide-d-animation_Niveau-final.docx")
d.save(out)
subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", R, out], check=True, capture_output=True)
print("ok")

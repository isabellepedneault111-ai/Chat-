"""Carnet de l'élève « Niveau final » (PDF, fond blanc, peu d'encre). Usage : python3 carnet.py"""
import os, sys, subprocess
ICI = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(ICI)
Z = os.path.join(os.path.dirname(R), "PPS_Z101_Projection-avenir_Trousse", "_sources")
sys.path.insert(0, Z)
import style
from style import doc, ico, CAT
from blocs import L, CB, OPTS

style.COURS, style.TITRE_COURS, style.FOOT = "Qui tient la manette ?", "Niveau final", "Mon carnet"
CY, JA, CO, VE, NU = "#0E8FB0", "#B7860B", "#E0522B", "#1E9E6A", "#0F1430"
CAT.update({"R": dict(nom="Je me règle", court="R", c=CY, cl="#E2F4F9", crit=""), "C": dict(nom="Je choisis", court="C", c=JA, cl="#FBF1D6", crit=""),
            "P": dict(nom="Je peux", court="P", c=CO, cl="#FDE9E2", crit=""), "M": dict(nom="Je me connais", court="M", c=VE, cl="#E1F4EB", crit=""),
            "N": dict(nom="Niveau final", court="", c=NU, cl="#ECEEF6", crit="")})
MAN = f'''<svg viewBox="0 0 240 150" width="{{w}}" aria-hidden="true"><path d="M60 20h120c34 0 52 28 58 70 6 40-10 58-28 58-16 0-26-12-38-30H68c-12 18-22 30-38 30-18 0-34-18-28-58 6-42 24-70 58-70z" fill="none" stroke="{NU}" stroke-width="8"/>
<path d="M62 62v36M44 80h36" stroke="{JA}" stroke-width="10" stroke-linecap="round"/><circle cx="170" cy="66" r="9" fill="{CY}"/><circle cx="192" cy="88" r="9" fill="{CO}"/><circle cx="148" cy="88" r="9" fill="{VE}"/><circle cx="170" cy="108" r="9" fill="{JA}"/></svg>'''


def deco(c, cl):
    return (f'<svg class="deco" viewBox="0 0 260 150" width="260" height="150" aria-hidden="true"><circle cx="250" cy="0" r="118" fill="{cl}"/>'
            f'<g transform="translate(178,58) scale(.3)">{MAN.format(w=240)[MAN.index(">") + 1:-6]}</g></svg>')


style.orbite = deco


def P(cat, titre, corps, kick, sous="", n=1, tot=1, no=""):
    return style.page(cat, titre, corps, kick=kick, sous=sous, etiquette="Mon carnet", n=n, tot=tot, bloc=("Atelier " + no) if no else "", no=no)


def batterie(moment):
    return f'''<div style="display:flex;align-items:center;gap:10px"><span class="small"><b>Ma batterie {moment}</b></span><span style="display:inline-flex;border:2.5px solid {NU};border-radius:6px;padding:2px;gap:2px">{"".join('<span style="width:26px;height:16px;border:1px solid #B9BFD0;border-radius:2px;display:inline-block"></span>' for _ in range(5))}</span><span style="width:5px;height:10px;background:{NU};border-radius:0 2px 2px 0"></span><span class="xs">je colorie</span></div>'''


def pu(actif):
    return "".join(f'<span style="display:inline-flex;width:24px;height:24px;border-radius:6px;align-items:center;justify-content:center;font-weight:900;font-size:10pt;margin-right:4px;{"background:" + CAT[k]["c"] + ";color:#fff" if k in actif else "border:1.5px solid #C9CEDB;color:#C9CEDB"}">{k}</span>' for k in "RCPM")


TOT = 8


def couverture():
    cartes = "".join(f'<div style="border:2px solid {CAT[k]["c"]};border-radius:16px;padding:14px"><div style="width:46px;height:46px;border-radius:12px;background:{CAT[k]["c"]};color:#fff;font-weight:900;font-size:22pt;display:flex;align-items:center;justify-content:center">{k}</div><div style="font-weight:900;font-size:15pt;margin-top:10px">{CAT[k]["nom"]}</div><div class="small">{d}</div></div>'
                     for k, d in [("R", "Je garde le contrôle quand le stress monte."), ("C", "Je choisis mes stratégies et mon ordre."), ("P", "Je crois que mes efforts changent le résultat."), ("M", "Je sais ce qui marche pour moi.")])
    corps = f'''<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:.5in"><div><div class="kick" style="color:{JA};font-size:10pt;letter-spacing:.24em;font-weight:900">QUI TIENT LA MANETTE ?</div>
<div style="font-size:60pt;font-weight:900;letter-spacing:-.045em;line-height:.88;margin-top:10px">Niveau<br><span style="color:{JA}">final</span></div><div class="lede" style="margin-top:16px;max-width:3.8in">Mon carnet pour arriver à l'évaluation <b style="color:{NU}">en contrôle</b>.</div></div>{MAN.format(w=230)}</div>
<div class="card" style="margin-top:.4in;max-width:4in"><div class="small"><b>Prénom :</b> ________________________________</div></div>
<h2 style="margin-top:.45in">Les 4 power-ups d'une personne qui tient la manette</h2><div class="g4">{cartes}</div>
<p class="small mt2">Personne ne voit ce carnet sans ma permission. Il n'y a pas de bonne ou de mauvaise réponse : c'est mon plan à moi.</p>'''
    return P("N", "", corps, kick="", n=1, tot=TOT)


def a3a():
    sig = ["Mon cœur bat vite", "Mes mains sont moites", "J'ai la tête vide", "J'ai mal au ventre", "J'ai envie de partir", "Je relis sans comprendre", "Je pense « je suis nul »"]
    corps = f'''<div style="display:flex;justify-content:space-between;align-items:center">{batterie("au début")}<div>{pu("R")}</div></div>
<h2 class="mt2">{ico("cible")}Le stress, c'est le volume</h2>
<svg viewBox="0 0 640 190" width="100%" height="190"><rect x="210" y="10" width="220" height="150" rx="12" fill="#E1F4EB"/><path d="M20 150 C 150 150, 200 20, 320 20 S 490 150, 620 150" fill="none" stroke="{NU}" stroke-width="4"/>
<line x1="20" y1="165" x2="620" y2="165" stroke="#8A90A6" stroke-width="2"/><text x="320" y="55" text-anchor="middle" font-size="18" font-weight="900" fill="{VE}">LA ZONE</text>
<text x="70" y="110" text-anchor="middle" font-size="14" font-weight="800" fill="#6B7189">Endormi</text><text x="570" y="110" text-anchor="middle" font-size="14" font-weight="800" fill="{CO}">Bloqué</text>
<text x="610" y="183" text-anchor="end" font-size="11" fill="#8A90A6">STRESS +</text></svg>
<p>Quand je pense à l'évaluation, je suis… (je fais un X sur la courbe)</p>
<h2 class="mt">{ico("attention")}Mes signaux d'alarme</h2><p class="small">Je coche ce que je ressens quand le stress monte trop.</p>{OPTS(sig)}<p class="small mt">Autre :</p>{L(1)}
<div class="card t mt2" style="--cl:#E2F4F9;display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;gap:8px">{"".join(f'<div><div style="font-size:40pt;font-weight:900;color:{c};line-height:1">{n}</div><div style="font-weight:900">{t}</div><div class="xs">{d}</div></div>' for n, t, d, c in [("4", "J'inspire", "par le nez", CY), ("4", "Je bloque", "doucement", JA), ("6", "J'expire", "lentement, par la bouche", VE)])}</div>
<p class="small mt">Je l'ai essayé : après 3 fois, je me sens {OPTS(["plus calme", "pareil", "je dois encore pratiquer"])}</p>'''
    return P("R", "Je me règle", corps, kick="Atelier 3", sous="Je garde le contrôle quand le stress monte.", n=2, tot=TOT, no="3")


def a3b():
    lignes = [("je bloque sur une question", "je l'encercle et je passe à la suivante"), ("mon cœur part en course", "je fais 4 · 4 · 6, trois fois"), ("", ""), ("", "")]
    rows = "".join(f'<div style="display:grid;grid-template-columns:36px 1fr 66px 1fr;gap:8px;align-items:center;border:1.5px solid #D5D9E5;border-radius:12px;padding:10px 12px;margin-top:8px"><b style="color:{CO}">SI</b><div>{a or "<div class=lines style=min-height:27px></div>"}</div><b style="color:{VE}">ALORS</b><div>{b or "<div class=lines style=min-height:27px></div>"}</div></div>' for a, b in lignes)
    corps = f'''<h2>{ico("logique")}Mon plan « Si… alors… »</h2><p class="small">Les deux premiers sont des exemples. J'écris les miens en dessous.</p>{rows}
<div class="g3 mt2"><div class="phase pa"><span class="tag">Avant</span>Qu'est-ce qui me stresse le plus dans l'évaluation ?<div class="lines l2"></div></div><div class="phase pp"><span class="tag">Pendant</span>Quel signal me dit que je sors de ma zone ?<div class="lines l2"></div></div><div class="phase pap"><span class="tag">Après</span>Quel « si… alors… » vais-je essayer cette semaine ?<div class="lines l2"></div></div></div>
<div class="card k mt2"><h2>{ico("idee")}Mon truc pour m'en souvenir</h2><p class="small">Je découpe ma carte de poche (dernière page) et je la garde dans mon étui à crayons.</p></div>
<div style="margin-top:auto">{batterie("à la fin")}</div>'''
    return P("R", "", corps, kick="Atelier 3", n=3, tot=TOT, no="3")


def a4a():
    et = [("La veille", ["Je dors assez", "Mon sac est prêt (calculatrice, crayons, efface)", "Mon aide-mémoire est approuvé"]), ("En entrant", ["3 respirations 4 · 4 · 6", "Je survole toutes les questions", "J'écris l'heure de fin en haut"]),
          ("Pendant", ["Les 3 passes", "J'encercle et je passe", "Je regarde l'heure à la moitié"]), ("À la fin", ["Je relis chaque question", "Unités et phrase de réponse", "Je remets, fier·ère de moi"])]
    corps = f'''<div style="display:flex;justify-content:space-between;align-items:center">{batterie("au début")}<div>{pu("RC")}</div></div>
<h2 class="mt2">{ico("drapeau")}Ma carte du niveau</h2><p class="small">Je coche ce que je fais déjà. J'encercle ce que je veux essayer.</p>
<div class="g4">{"".join(f'<div class="card" style="border-top:5px solid {[CY, JA, CO, VE][i]}"><b>{t}</b><ul class="ticks small">{"".join(f"<li>{x}</li>" for x in xs)}</ul></div>' for i, (t, xs) in enumerate(et))}</div>
<h2 class="mt2">{ico("etapes")}Les 3 passes</h2><div class="g3">{"".join(f'<div class="card t" style="--cl:{cl}"><span class="tag" style="color:{c}">Passe {n}</span><div style="font-weight:900;font-size:13pt">{t}</div><div class="small">{d}</div></div>' for n, t, d, c, cl in [(1, "Je ramasse les points sûrs", "Tout ce que je sais faire, vite.", VE, "#E1F4EB"), (2, "Je reviens aux encerclées", "Avec plus de temps.", JA, "#FBF1D6"), (3, "Je vérifie", "Question, unités, phrase.", CY, "#E2F4F9")])}</div>
<h2 class="mt2">{ico("horloge")}Mon chrono</h2><table class="t grid"><tr><td style="width:52%">Mon évaluation dure</td><td>______ minutes</td></tr><tr><td>Je garde pour vérifier</td><td>______ minutes</td></tr><tr><td>Il y a combien de parties ou de tâches ?</td><td>______</td></tr><tr><td><b>Temps par partie (environ)</b></td><td>______ minutes</td></tr></table>
<p class="xs mt">Je ne connais pas tout ça ? Je le demande à mon enseignant·e : c'est une très bonne question à poser.</p>'''
    return P("C", "Je choisis", corps, kick="Atelier 4", sous="Je choisis mes stratégies et mon ordre.", n=4, tot=TOT, no="4")


def a4b():
    corps = f'''<h2>{ico("loupe")}Lire comme un détective</h2><p class="small">Avant de répondre, 30 secondes et 3 couleurs : <b style="color:{JA}">ce qu'on cherche</b> · <b style="color:{CY}">les données utiles</b> · <b style="color:{CO}">le mot piège</b>.</p>
<div class="ex mt"><div class="h"><span class="n">1</span><b>En maths</b></div><p>Une salle d'entraînement demande 15 $ par mois plus 2 $ par visite. Une autre demande 5 $ par visite, sans abonnement. À partir de combien de visites par mois la première salle est-elle avantageuse ?</p><p class="small">Ma réponse :</p>{L(1)}</div>
<div class="ex"><div class="h"><span class="n">2</span><b>Dans une autre matière</b></div><p>Lis le texte, puis nomme deux raisons qui expliquent pourquoi le personnage change d'avis. Appuie chaque raison sur un passage du texte.</p><p class="small">Combien de choses on me demande ? ____ Lesquelles ?</p>{L(1)}</div>
<h2 class="mt2">{ico("crayon")}Le brouillon de mon aide-mémoire</h2><p class="xs">Une page. Je vérifie avec mon enseignant·e ce qui est permis dans ma matière.</p>
<div class="g2" style="gap:8px">{"".join(f'<div class="card" style="border-left:5px solid {c};padding:8px 10px"><b class="small">{t}</b><div class="lines l3"></div></div>' for t, c in [("Les formules ou règles que j'oublie, avec un exemple fait par moi", CY), ("Mes pièges à moi", CO), ("Mon plan si… alors…", VE), ("Ma phrase de coach", JA)])}</div>
<div style="margin-top:auto">{batterie("à la fin")}</div>'''
    return P("C", "", corps, kick="Atelier 4", n=5, tot=TOT, no="4")


def a5a():
    crit = ["Je suis nul en maths.", "Je vais encore échouer.", "Les autres comprennent, pas moi."]
    corps = f'''<div style="display:flex;justify-content:space-between;align-items:center">{batterie("au début")}<div>{pu("RCP")}</div></div>
<h2 class="mt2">{ico("personne")}Du critique au coach</h2><p class="small">Je transforme la phrase du critique en phrase de coach. La phrase du coach est vraie, pas magique.</p>
<table class="t grid"><tr><th style="width:44%;color:{CO}">Le critique dit…</th><th style="color:{VE}">Mon coach répond…</th></tr>{"".join(f'<tr><td style="text-decoration:line-through;color:#8A90A6">« {c} »</td><td style="height:40px"></td></tr>' for c in crit)}<tr><td>Ma phrase à moi : <div class="lines" style="min-height:27px"></div></td><td></td></tr></table>
<h2 class="mt2">{ico("fusee")}Ma preuve</h2><div class="g2"><div class="card"><b>Au début, je ne savais pas…</b><div class="lines l3"></div></div><div class="card t" style="--cl:#E1F4EB"><b>Maintenant, je sais…</b><div class="lines l3"></div></div></div>
<h2 class="mt2">{ico("idee")}Ce qui marche pour moi</h2><table class="t grid"><tr><td style="width:50%">Le moment où j'apprends le mieux</td><td></td></tr><tr><td>La stratégie qui m'aide le plus</td><td></td></tr><tr><td>La personne qui m'aide</td><td></td></tr><tr><td>Ma force</td><td></td></tr></table>'''
    return P("P", "Je peux · Je me connais", corps, kick="Atelier 5", sous="Je crois que mes efforts changent le résultat. Je sais ce qui marche pour moi.", n=6, tot=TOT, no="5")


def a5b():
    corps = f'''<div style="border:2px dashed #B9BFD0;border-radius:18px;padding:22px 26px;position:relative"><div class="tag" style="color:{CO}">À découper · à ouvrir le jour de l'évaluation</div>
<div style="font-size:24pt;font-weight:900;margin-top:8px">Cher moi du jour J,</div>{"".join('<div style="height:27px;border-bottom:1.5px solid #CDD2E0"></div>' for _ in range(8))}<div style="text-align:right;font-weight:800;margin-top:8px">— Moi, aujourd'hui</div></div>
<h2 class="mt2">{ico("ok")}Mes power-ups</h2><table class="t">{"".join(f'<tr><td style="width:38px"><span style="display:inline-flex;width:26px;height:26px;border-radius:6px;background:{CAT[k]["c"]};color:#fff;font-weight:900;align-items:center;justify-content:center">{k}</span></td><td><b>{CAT[k]["nom"]}</b> · <span class="small">{d}</span></td><td style="width:42%"><span class="opt" style="color:#127A45"><span class="dot" style="margin-right:4px"></span>Débloqué</span><span class="opt" style="color:#946200"><span class="dot" style="margin-right:4px"></span>En chemin</span><span class="opt" style="color:#B3341B"><span class="dot" style="margin-right:4px"></span>Pas encore</span></td></tr>' for k, d in [("R", "je me calme et j'ai un plan si je bloque"), ("C", "j'ai mes 3 passes, mon chrono, mon aide-mémoire"), ("P", "mon coach parle plus fort que mon critique"), ("M", "je sais ce qui marche pour moi")])}</table>
<div class="g2 mt2"><div class="card"><b>Une chose que je garde après ces ateliers</b><div class="lines l2"></div></div><div class="card"><b>Mon prochain niveau, après l'évaluation</b><div class="lines l2"></div></div></div>
<div style="margin-top:auto">{batterie("à la fin")}</div>'''
    return P("P", "", corps, kick="Atelier 5", n=7, tot=TOT, no="5")


def poche():
    def carte():
        return f'''<div style="border:2px dashed #B9BFD0;border-radius:16px;padding:16px 18px;height:4.25in;display:flex;flex-direction:column;gap:8px">
<div style="display:flex;justify-content:space-between;align-items:center"><div><div class="tag" style="color:{JA}">Ma carte de poche</div><div style="font-size:19pt;font-weight:900;line-height:1">Niveau final</div></div>{MAN.format(w=70)}</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);text-align:center;background:#F4F5F9;border-radius:10px;padding:6px">{"".join(f'<div><b style="font-size:22pt;color:{c}">{n}</b><div class="xs">{t}</div></div>' for n, t, c in [("4", "j'inspire", CY), ("4", "je bloque", JA), ("6", "j'expire", VE)])}</div>
<div class="small"><b style="color:{CO}">SI</b> je bloque <b style="color:{VE}">ALORS</b> j'encercle et je passe.</div><div class="small"><b style="color:{CO}">SI</b> ________________ <b style="color:{VE}">ALORS</b> ________________</div>
<div class="small"><b>3 passes :</b> 1 les points sûrs · 2 les encerclées · 3 je vérifie</div><div class="small"><b>Mon chrono :</b> ____ min par partie</div>
<div style="margin-top:auto;border-top:1.5px solid #E1E4EE;padding-top:6px" class="small"><b>Mon coach :</b> « ______________________________ »</div></div>'''
    corps = f'<div class="g2" style="margin-top:10px;gap:12px">{carte()}{carte()}</div><p class="xs center mt">Je découpe, je plie en deux, je la garde dans mon étui. Une carte pour moi, une à donner à quelqu\'un du groupe.</p>'
    return P("N", "Ma carte de poche", corps, kick="À découper", n=8, tot=TOT)


if __name__ == "__main__":
    out = os.path.join(R, "Mon-carnet_Niveau-final.pdf")
    h = "/tmp/claude-0/pps/nf_carnet.html"; open(h, "w").write(doc("Niveau final · Mon carnet", [couverture(), a3a(), a3b(), a4a(), a4b(), a5a(), a5b(), poche()]))
    subprocess.run(["node", os.path.join(Z, "rendre.js"), h, out], check=True)

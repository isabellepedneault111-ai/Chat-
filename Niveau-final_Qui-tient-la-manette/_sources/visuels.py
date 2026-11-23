"""Visuels Mentimeter « Niveau final » (1920 x 1080). Usage : python3 visuels.py  -> ../Visuels_Mentimeter/*.png"""
import os, subprocess, json
ICI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(ICI), "Visuels_Mentimeter")
TMP = "/tmp/claude-0/pps/nfv"
os.makedirs(OUT, exist_ok=True); os.makedirs(TMP, exist_ok=True)

NUIT, JAUNE, CYAN, CORAIL, VERT, BLANC, GRIS = "#0F1430", "#FFC531", "#2EC4E6", "#FF6A3D", "#3DDC97", "#F4F6FF", "#8B93B8"
CSS = f"""*{{box-sizing:border-box;margin:0;padding:0}}body{{width:1920px;height:1080px;background:{NUIT};color:{BLANC};font-family:Inter,sans-serif;overflow:hidden;position:relative}}
.k{{position:absolute;left:110px;top:80px;font-size:26px;letter-spacing:.24em;text-transform:uppercase;font-weight:800;color:{JAUNE}}}
.t{{position:absolute;left:110px;top:130px;font-size:84px;line-height:1.02;font-weight:900;letter-spacing:-.035em;max-width:1500px}}
.s{{font-size:34px;color:#C9CEE8;font-weight:500;line-height:1.35}}
.b{{font-weight:900}}
.grid{{position:absolute;left:0;top:0;width:100%;height:100%;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:80px 80px}}
.foot{{position:absolute;left:110px;bottom:56px;font-size:22px;letter-spacing:.18em;text-transform:uppercase;color:{GRIS};font-weight:700}}
.pu{{position:absolute;right:110px;bottom:46px;display:flex;gap:14px}}
.pu span{{width:46px;height:46px;border-radius:12px;border:3px solid #2C3360;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;color:#2C3360}}
.pu span.on{{background:{JAUNE};border-color:{JAUNE};color:{NUIT}}}
"""
MANETTE = f'''<svg viewBox="0 0 240 150" width="{{w}}" aria-hidden="true"><path d="M60 20h120c34 0 52 28 58 70 6 40-10 58-28 58-16 0-26-12-38-30H68c-12 18-22 30-38 30-18 0-34-18-28-58 6-42 24-70 58-70z" fill="none" stroke="{BLANC}" stroke-width="8"/>
<path d="M62 62v36M44 80h36" stroke="{JAUNE}" stroke-width="10" stroke-linecap="round"/><circle cx="170" cy="66" r="9" fill="{CYAN}"/><circle cx="192" cy="88" r="9" fill="{CORAIL}"/><circle cx="148" cy="88" r="9" fill="{VERT}"/><circle cx="170" cy="108" r="9" fill="{JAUNE}"/></svg>'''


def pu(actifs):
    lab = ["Z", "C", "P", "M"]  # Je reste dans ma Zone, Je Choisis, Je Peux, Je Me connais
    return '<div class="pu">' + "".join(f'<span class="{"on" if l in actifs else ""}">{l}</span>' for l in lab) + "</div>"


def slide(nom, corps, kick="", titre="", atelier="", actifs=""):
    h = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div class="grid"></div>'
    if kick: h += f'<div class="k">{kick}</div>'
    if titre: h += f'<div class="t">{titre}</div>'
    h += corps + f'<div class="foot">Niveau final{(" · " + atelier) if atelier else ""}</div>{pu(actifs)}</body></html>'
    return nom, h


S = []
# ------------------------------------------------------------------ communs
S.append(slide("NF0-01_Titre", f'''<div style="position:absolute;left:110px;top:250px;font-size:30px;letter-spacing:.3em;font-weight:800;color:{JAUNE}">QUI TIENT LA MANETTE ?</div>
<div style="position:absolute;left:104px;top:300px;font-size:220px;font-weight:900;letter-spacing:-.05em;line-height:.88">Niveau<br><span style="color:{JAUNE}">final</span></div>
<div style="position:absolute;right:150px;top:270px">{MANETTE.format(w=560)}</div>
<div style="position:absolute;right:150px;top:640px;width:560px"><div class="s" style="font-size:26px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:{GRIS}">Énergie du boss</div>
<div style="height:34px;border:4px solid {BLANC};border-radius:8px;margin-top:10px;padding:4px"><div style="height:100%;width:72%;background:{CORAIL};border-radius:4px"></div></div></div>
<div class="s" style="position:absolute;left:110px;top:800px;max-width:1000px">Trois ateliers pour arriver à l'évaluation <b style="color:{BLANC}">en contrôle</b>.</div>''', atelier="", actifs=""))
S.append(slide("NF0-02_Les-4-power-ups", f'''<div style="position:absolute;left:110px;top:330px;right:110px;display:grid;grid-template-columns:repeat(4,1fr);gap:34px">''' + "".join(f'''<div style="border:4px solid {c};border-radius:28px;padding:40px 34px;height:520px;display:flex;flex-direction:column">
<div style="width:110px;height:110px;border-radius:24px;background:{c};color:{NUIT};display:flex;align-items:center;justify-content:center;font-size:66px;font-weight:900">{l}</div>
<div style="font-size:52px;font-weight:900;letter-spacing:-.03em;margin-top:34px;line-height:1">{t}</div><div class="s" style="margin-top:20px;font-size:30px">{d}</div><div style="margin-top:auto;font-size:22px;letter-spacing:.16em;text-transform:uppercase;font-weight:800;color:{c}">{a}</div></div>''' for l, t, d, c, a in [
 ("Z", "Je reste dans ma zone", "Je garde le contrôle quand ça monte.", CYAN, "Atelier 3"), ("C", "Je choisis", "Je choisis mes stratégies et mon ordre.", JAUNE, "Atelier 4"),
 ("P", "Je peux", "Je crois que mes efforts changent le résultat.", CORAIL, "Atelier 5"), ("M", "Je me connais", "Je sais ce qui marche pour moi.", VERT, "Atelier 5")]) + "</div>",
 kick="Les 4 power-ups", titre="Une personne qui tient la manette…", actifs="ZCPM"))

# ------------------------------------------------------------------ ATELIER 3 : Je reste dans ma zone
A3 = "Atelier 3 · Je reste dans ma zone"
S.append(slide("NF3-01_Le-stress-cest-le-volume", f'''<svg style="position:absolute;left:110px;top:330px" width="1700" height="560" viewBox="0 0 1700 560">
<rect x="560" y="20" width="560" height="470" rx="24" fill="{VERT}" opacity=".14"/>
<path d="M40 470 C 380 470, 520 70, 840 70 S 1300 470, 1660 470" fill="none" stroke="{BLANC}" stroke-width="10" stroke-linecap="round"/>
<line x1="40" y1="500" x2="1660" y2="500" stroke="{GRIS}" stroke-width="4"/><path d="M1650 490l18 10-18 10" fill="{GRIS}"/>
<text x="1660" y="545" text-anchor="end" font-size="28" fill="{GRIS}" font-weight="700">STRESS +</text>
<circle cx="840" cy="70" r="22" fill="{VERT}"/>
<text x="170" y="330" text-anchor="middle" font-size="40" font-weight="900" fill="{GRIS}">Endormi</text><text x="170" y="370" text-anchor="middle" font-size="26" fill="{GRIS}">« bof, ça ne compte pas »</text>
<text x="840" y="170" text-anchor="middle" font-size="54" font-weight="900" fill="{VERT}">LA ZONE</text><text x="840" y="214" text-anchor="middle" font-size="28" fill="{BLANC}">concentré, alerte, efficace</text>
<text x="1520" y="330" text-anchor="middle" font-size="40" font-weight="900" fill="{CORAIL}">Bloqué</text><text x="1520" y="370" text-anchor="middle" font-size="26" fill="{CORAIL}">« trou noir »</text></svg>
<div class="s" style="position:absolute;left:110px;top:250px">Un peu de stress, c'est du carburant. Trop, ça éteint l'écran.</div>''', kick="Atelier 3", titre="Le stress, c'est le volume.", atelier=A3, actifs="Z"))
S.append(slide("NF3-02_Qui-tient-la-manette-du-cerveau", f'''<div style="position:absolute;left:110px;top:330px;right:110px;display:grid;grid-template-columns:1fr 140px 1fr;align-items:center">
<div style="border:5px solid {CORAIL};border-radius:32px;padding:46px;height:520px"><div style="font-size:30px;letter-spacing:.18em;font-weight:800;color:{CORAIL}">L'ALARME</div>
<div style="font-size:64px;font-weight:900;margin-top:16px;line-height:1.05">Danger !<br>Fuis ou fige.</div><div class="s" style="margin-top:26px">Cœur qui bat vite, mains moites, tête vide. Le cerveau croit que l'examen est un ours.</div></div>
<div style="text-align:center;font-size:90px;font-weight:900;color:{JAUNE}">→</div>
<div style="border:5px solid {CYAN};border-radius:32px;padding:46px;height:520px"><div style="font-size:30px;letter-spacing:.18em;font-weight:800;color:{CYAN}">LE PILOTE</div>
<div style="font-size:64px;font-weight:900;margin-top:16px;line-height:1.05">Je réfléchis.<br>Je me souviens.</div><div class="s" style="margin-top:26px">Il reprend la manette quand le corps se calme. Le chemin le plus court : <b style="color:{BLANC}">l'expiration lente</b>.</div></div></div>''',
 kick="Atelier 3", titre="Quand l'alarme sonne, le pilote lâche la manette.", atelier=A3, actifs="Z"))
S.append(slide("NF3-03_Respiration-4-4-6", f'''<div style="position:absolute;left:110px;top:300px;right:110px;display:grid;grid-template-columns:repeat(3,1fr);gap:50px">''' + "".join(f'''<div style="text-align:center"><svg width="400" height="400" viewBox="0 0 400 400"><circle cx="200" cy="200" r="180" fill="none" stroke="#2C3360" stroke-width="22"/>
<circle cx="200" cy="200" r="180" fill="none" stroke="{c}" stroke-width="22" stroke-dasharray="{1131 * p} 1131" transform="rotate(-90 200 200)" stroke-linecap="round"/>
<text x="200" y="245" text-anchor="middle" font-size="170" font-weight="900" fill="{BLANC}" font-family="Inter">{n}</text></svg>
<div style="font-size:56px;font-weight:900;margin-top:18px">{t}</div><div class="s">{d}</div></div>''' for n, t, d, c, p in [("4", "J'inspire", "par le nez", CYAN, .45), ("4", "Je bloque", "doucement", JAUNE, .45), ("6", "J'expire", "lentement, par la bouche", VERT, .68)]) + f'''</div>
<div class="s" style="position:absolute;left:110px;top:225px">3 fois. Personne ne le voit. Ça marche dans la salle d'évaluation.</div>''', kick="Atelier 3 · On l'essaie ensemble", titre="4 · 4 · 6", atelier=A3, actifs="Z"))
S.append(slide("NF3-04_Si-alors", f'''<div style="position:absolute;left:110px;top:310px;right:110px;display:flex;flex-direction:column;gap:30px">''' + "".join(f'''<div style="display:grid;grid-template-columns:90px 1fr 190px 1fr;align-items:center;gap:20px;border:4px solid #2C3360;border-radius:28px;padding:22px 40px">
<div style="font-size:42px;font-weight:900;color:{CORAIL}">SI</div><div style="font-size:40px;font-weight:800">{a}</div><div style="font-size:42px;font-weight:900;color:{VERT}">ALORS</div><div style="font-size:40px;font-weight:800">{b}</div></div>''' for a, b in [
 ("je bloque sur une question", "je l'encercle et je passe à la suivante"), ("mon cœur part en course", "je fais 4 · 4 · 6, trois fois"), ("j'oublie une formule ou une règle", "je regarde mon aide-mémoire"), ("je pense « je suis nul »", "je me dis « pas encore, une question à la fois »")]) + "</div>",
 kick="Atelier 3", titre="Mon plan « Si… alors… »", atelier=A3, actifs="Z"))
for i, (q, rep, expl) in enumerate([
    ("Être stressé avant une évaluation, ça veut dire qu'on n'est pas prêt.", "MYTHE", "Même les personnes très préparées sont stressées. Le stress dit : « ça compte pour moi »."),
    ("Un peu de stress aide à se concentrer.", "VRAI", "C'est la zone : alerte et efficace. On vise la zone, pas le zéro stress."),
    ("Relire ses notes jusqu'à la dernière seconde, ça aide.", "MYTHE", "Le cerveau a besoin d'une pause. Mieux : 3 respirations et une collation."),
    ("Si je bloque, c'est mieux de rester sur la question jusqu'à trouver.", "MYTHE", "On encercle, on passe, on revient. Souvent, la réponse arrive en faisant autre chose.")]):
    S.append(slide(f"NF3-0{5 + i}_Vrai-ou-mythe-{i + 1}", f'''<div style="position:absolute;left:110px;top:300px;max-width:1300px;font-size:70px;font-weight:900;letter-spacing:-.03em;line-height:1.1">« {q} »</div>
<div style="position:absolute;left:110px;bottom:200px;display:flex;gap:40px;align-items:center"><div style="font-size:60px;font-weight:900;padding:18px 48px;border-radius:20px;border:5px solid {VERT if rep == "VRAI" else CORAIL};color:{VERT if rep == "VRAI" else CORAIL}">{rep}</div><div class="s" style="max-width:1100px">{expl}</div></div>''',
                   kick=f"Atelier 3 · Vrai ou mythe ? · {i + 1} / 4", atelier=A3, actifs="Z"))

# ------------------------------------------------------------------ ATELIER 4 : Je choisis
A4 = "Atelier 4 · Je choisis"
etapes = [("La veille", ["Je dors", "Mon sac est prêt", "Mon aide-mémoire est approuvé"], CYAN), ("En entrant", ["3 respirations 4 · 4 · 6", "Je survole tout", "Je note l'heure de fin"], JAUNE),
          ("Pendant", ["Les 3 passes", "J'encercle et je passe", "Je regarde l'heure à la moitié"], CORAIL), ("À la fin", ["Je relis la question", "Unités et phrase", "Je remets, fier"], VERT)]
S.append(slide("NF4-01_La-carte-du-niveau", f'''<svg style="position:absolute;left:110px;top:330px" width="1700" height="40"><line x1="0" y1="20" x2="1700" y2="20" stroke="#2C3360" stroke-width="8" stroke-dasharray="20 16"/></svg>
<div style="position:absolute;left:110px;top:300px;right:110px;display:grid;grid-template-columns:repeat(4,1fr);gap:34px">''' + "".join(f'''<div><div style="width:100px;height:100px;border-radius:50%;background:{c};color:{NUIT};display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:900">{n + 1}</div>
<div style="font-size:50px;font-weight:900;margin-top:30px">{t}</div>{"".join(f'<div class="s" style="margin-top:16px;padding-left:22px;border-left:5px solid {c}">{x}</div>' for x in xs)}</div>''' for n, (t, xs, c) in enumerate(etapes)) + "</div>",
 kick="Atelier 4", titre="La carte du niveau", atelier=A4, actifs="ZC"))
S.append(slide("NF4-02_Les-3-passes", f'''<div style="position:absolute;left:110px;top:320px;right:110px;display:grid;grid-template-columns:repeat(3,1fr);gap:40px">''' + "".join(f'''<div style="border-radius:32px;background:{c};color:{NUIT};padding:46px;height:560px;display:flex;flex-direction:column">
<div style="font-size:30px;letter-spacing:.2em;font-weight:900">PASSE {n}</div><div style="font-size:70px;font-weight:900;line-height:1;margin-top:20px;letter-spacing:-.03em">{t}</div><div style="font-size:34px;font-weight:600;margin-top:24px;line-height:1.3">{d}</div><div style="margin-top:auto;font-size:30px;font-weight:900">{e}</div></div>''' for n, t, d, e, c in [
 (1, "Je ramasse les points sûrs", "Je fais tout ce que je sais faire. Vite, sans m'acharner.", "Le moral monte.", VERT), (2, "Je reviens aux encerclées", "Avec plus de temps et l'esprit libéré.", "Le cerveau a travaillé en arrière-plan.", JAUNE), (3, "Je vérifie", "J'ai répondu à la question ? Les unités ? Une phrase ?", "Les points perdus bêtement, je les reprends.", CYAN)]) + "</div>",
 kick="Atelier 4", titre="Les 3 passes", atelier=A4, actifs="ZC"))
S.append(slide("NF4-03_Lire-comme-un-detective", f'''<div style="position:absolute;left:110px;top:310px;width:1080px;border:4px solid #2C3360;border-radius:28px;padding:44px;font-size:42px;line-height:1.55;font-weight:500">
Une salle d'entraînement demande <span style="border-bottom:6px solid {CYAN}">15 $ par mois</span> plus <span style="border-bottom:6px solid {CYAN}">2 $ par visite</span>. Une autre demande <span style="border-bottom:6px solid {CYAN}">5 $ par visite</span>, sans abonnement.
<span style="background:{JAUNE};color:{NUIT};padding:0 8px;border-radius:6px;font-weight:800">À partir de combien de visites</span> par mois la première salle est-il <span style="border:5px solid {CORAIL};border-radius:40px;padding:0 10px">avantageux</span> ?</div>
<div style="position:absolute;right:110px;top:310px;width:520px;display:flex;flex-direction:column;gap:30px">''' + "".join(f'<div style="display:flex;gap:22px;align-items:center"><div style="width:70px;height:16px;border-radius:8px;background:{c}"></div><div style="font-size:38px;font-weight:800">{t}</div></div>' for t, c in [("Ce qu'on cherche", JAUNE), ("Les données utiles", CYAN), ("Le mot piège", CORAIL)]) + f'''
<div class="s" style="margin-top:30px">Ça marche en maths, en français, en sciences : 3 couleurs, 30 secondes, avant de commencer.</div></div>''',
 kick="Atelier 4", titre="Lire comme un détective", atelier=A4, actifs="ZC"))
S.append(slide("NF4-04_Le-chrono-du-boss", f'''<div style="position:absolute;left:110px;top:330px;font-size:56px;font-weight:800;line-height:1.35;max-width:1250px">L'évaluation dure <span style="color:{JAUNE}">3 heures</span>.<br>Elle a <span style="color:{CYAN}">4 petites questions</span> (10 minutes chacune) et <span style="color:{CORAIL}">3 grandes tâches</span>.<br>Je garde <span style="color:{VERT}">20 minutes</span> pour vérifier.</div>
<div style="position:absolute;left:110px;bottom:190px;font-size:72px;font-weight:900;letter-spacing:-.03em">Combien de minutes par grande tâche ?</div>
<div style="position:absolute;right:150px;top:300px">{MANETTE.format(w=300)}</div>''', kick="Atelier 4 · Jeu : devine le nombre", atelier=A4, actifs="ZC"))
S.append(slide("NF4-05_Le-chrono-reponse", f'''<div style="position:absolute;left:110px;top:300px;display:flex;flex-direction:column;gap:22px;font-size:54px;font-weight:800">
<div>180 min <span style="color:{GRIS}">−</span> 20 min de vérification <span style="color:{GRIS}">=</span> 160 min</div>
<div>160 min <span style="color:{GRIS}">−</span> 4 × 10 min <span style="color:{GRIS}">=</span> 120 min</div>
<div>120 min <span style="color:{GRIS}">÷</span> 3 tâches <span style="color:{GRIS}">=</span> <span style="color:{NUIT};background:{JAUNE};padding:0 22px;border-radius:14px;font-weight:900">40 min</span></div></div>
<div class="s" style="position:absolute;left:110px;bottom:180px;max-width:1500px">Je l'écris en haut de ma copie : <b style="color:{BLANC}">quand une tâche dépasse 40 minutes, je l'encercle et je passe.</b></div>''', kick="Atelier 4 · La réponse", titre="40 minutes.", atelier=A4, actifs="ZC"))
S.append(slide("NF4-06_Mon-aide-memoire", f'''<div style="position:absolute;left:110px;top:300px;width:640px;height:660px;background:{BLANC};border-radius:10px;color:{NUIT};padding:40px;transform:rotate(-2deg);box-shadow:24px 24px 0 #2C3360">
<div style="font-size:30px;font-weight:900">Mon aide-mémoire</div><div style="font-size:20px;color:#666">1 page · fait à la main ou à l'ordi · approuvé</div>
{"".join(f'<div style="margin-top:22px;border-left:8px solid {c};padding-left:14px"><div style="font-size:22px;font-weight:900">{t}</div><div style="font-size:19px;color:#444">{d}</div></div>' for t, d, c in [("Les formules que j'oublie", "et un exemple fait par moi", CYAN), ("Mes pièges à moi", "« je mélange x et y »", CORAIL), ("Mon plan si… alors…", "et 4 · 4 · 6", VERT), ("Une phrase de coach", "« une question à la fois »", JAUNE)])}</div>
<div style="position:absolute;left:880px;top:330px;right:110px"><div style="font-size:62px;font-weight:900;line-height:1.08;letter-spacing:-.03em">Ma manette de secours.</div>
<div class="s" style="margin-top:30px">Le faire, c'est déjà étudier : je choisis ce qui compte pour <b style="color:{BLANC}">moi</b>.</div>
<div class="s" style="margin-top:24px">Chaque matière a ses règles : je vérifie avec mon enseignant·e ce qui est permis.</div></div>''', kick="Atelier 4", titre="", atelier=A4, actifs="ZC"))

# ------------------------------------------------------------------ ATELIER 5 : Je peux, je me connais
A5 = "Atelier 5 · Je peux · Je me connais"
S.append(slide("NF5-01_Critique-ou-coach", f'''<div style="position:absolute;left:110px;top:310px;right:110px;display:grid;grid-template-columns:1fr 1fr;gap:50px">
<div><div style="font-size:34px;letter-spacing:.2em;font-weight:900;color:{CORAIL}">LE CRITIQUE</div>{"".join(f'<div style="margin-top:24px;font-size:44px;font-weight:700;color:#9AA0C2;text-decoration:line-through;text-decoration-color:{CORAIL};text-decoration-thickness:4px">« {x} »</div>' for x in ["Je suis nul en maths.", "Je vais encore échouer.", "Les autres comprennent, pas moi."])}</div>
<div><div style="font-size:34px;letter-spacing:.2em;font-weight:900;color:{VERT}">LE COACH</div>{"".join(f'<div style="margin-top:24px;font-size:44px;font-weight:800">« {x} »</div>' for x in ["Je ne maîtrise pas encore cette notion.", "J'ai un plan si je bloque.", "Je compare avec moi d'avant, pas avec les autres."])}</div></div>''',
 kick="Atelier 5", titre="Qui parle dans ma tête ?", atelier=A5, actifs="ZCP"))
S.append(slide("NF5-02_La-preuve", f'''<svg style="position:absolute;left:110px;top:300px" width="1100" height="640" viewBox="0 0 1100 640">
{"".join(f'<rect x="{40 + i * 205}" y="{560 - (i + 1) * 105}" width="185" height="{(i + 1) * 105}" rx="10" fill="{[GRIS, CYAN, CYAN, JAUNE, VERT][i]}" opacity="{.35 if i == 0 else 1}"/>' for i in range(5))}
<line x1="20" y1="562" x2="1080" y2="562" stroke="{BLANC}" stroke-width="5"/><text x="130" y="610" text-anchor="middle" font-size="28" fill="{GRIS}" font-weight="700">au début</text><text x="950" y="610" text-anchor="middle" font-size="28" fill="{VERT}" font-weight="900">aujourd'hui</text></svg>
<div style="position:absolute;left:1280px;top:330px;right:110px"><div style="font-size:58px;font-weight:900;line-height:1.08;letter-spacing:-.03em">Je me compare à moi d'avant.</div>
<div class="s" style="margin-top:30px">Une chose que je ne savais pas faire au début, et que je fais maintenant : <b style="color:{BLANC}">c'est ma preuve.</b></div></div>''', kick="Atelier 5", titre="La preuve", atelier=A5, actifs="ZCP"))
S.append(slide("NF5-03_Message-du-jour-J", f'''<div style="position:absolute;left:330px;top:250px;width:1260px;height:640px;background:{BLANC};color:{NUIT};border-radius:18px;padding:70px;transform:rotate(-1.5deg);box-shadow:26px 26px 0 {JAUNE}">
<div style="font-size:30px;letter-spacing:.2em;font-weight:900;color:{CORAIL}">À OUVRIR LE JOUR DE L'ÉVALUATION</div>
<div style="font-size:60px;font-weight:900;margin-top:30px;line-height:1.1">Cher moi du jour J,</div>
{"".join(f'<div style="margin-top:34px;height:4px;background:#D9DCEB"></div>' for _ in range(5))}
<div style="position:absolute;right:70px;bottom:50px;font-size:34px;font-weight:800">— Moi, aujourd'hui</div></div>''', kick="Atelier 5", atelier=A5, actifs="ZCPM"))
S.append(slide("NF5-04_Power-ups-debloques", f'''<div style="position:absolute;left:110px;top:330px;right:110px;display:grid;grid-template-columns:repeat(4,1fr);gap:34px">''' + "".join(f'''<div style="border-radius:28px;background:{c};color:{NUIT};padding:40px;height:420px;display:flex;flex-direction:column"><div style="font-size:90px;font-weight:900;line-height:1">{l}</div><div style="font-size:46px;font-weight:900;margin-top:auto;line-height:1.05">{t}</div><div style="font-size:26px;font-weight:700;margin-top:12px">{d}</div></div>''' for l, t, d, c in [
 ("Z", "Je reste dans ma zone", "4 · 4 · 6 et si… alors…", CYAN), ("C", "Je choisis", "les 3 passes, le chrono, l'aide-mémoire", JAUNE), ("P", "Je peux", "la voix du coach, ma preuve", CORAIL), ("M", "Je me connais", "ce qui marche pour moi", VERT)]) + f'''</div>
<div class="s" style="position:absolute;left:110px;top:800px">La manette, c'est vous qui la tenez. On se voit de l'autre côté.</div>''', kick="Atelier 5 · Tous débloqués", titre="Prêt pour le niveau final.", atelier=A5, actifs="ZCPM"))

if __name__ == "__main__":
    lst = []
    for nom, h in S:
        p = os.path.join(TMP, nom + ".html"); open(p, "w").write(h); lst.append([p, os.path.join(OUT, nom + ".png")])
    js = os.path.join(TMP, "shot.js")
    open(js, "w").write("""const {chromium}=require('playwright');const L=%s;(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});for(const [h,o] of L){await p.goto('file://'+h);await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:o});}await b.close()})();""" % json.dumps(lst))
    subprocess.run(["node", js], check=True, cwd="/tmp/claude-0/pps/gen" if os.path.isdir("/tmp/claude-0/pps/gen") else "/tmp")
    print(len(lst), "visuels")

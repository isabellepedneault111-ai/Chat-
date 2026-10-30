"""Leçon clé en main : le premier mardi (3 périodes) : brise-glace, ateliers A + B, retour. Papier + TNI."""
import os
from style import page, doc, ico, qr, CAT, SITE
from blocs import L, CB, OPTS

ICI = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(os.path.dirname(ICI), "Lecons", "Premier-mardi_Accueil-et-ateliers")
os.makedirs(D, exist_ok=True)
URL = SITE + "/brise-glace.html"

BINGO = ["A déjà aidé un voisin", "Aime cuisiner", "A un animal", "Est né en hiver", "Joue d'un instrument", "A déjà fait du bénévolat",
         "Préfère le matin au soir", "Parle une autre langue", "Est fan d'une équipe de sport", "Aime l'automne", "Sait réparer quelque chose", "Aime dessiner",
         "N'aime pas le café", "Porte quelque chose de bleu", "Aime la pizza ananas", "Fait du sport chaque semaine",
         "Connaît une blague par cœur", "Est nouveau au PPS", "Est au PPS depuis plus d'un an", "Aime les jeux vidéo", "A déjà gagné un prix", "Aime le camping", "Écoute du rap", "Aime les films d'horreur"]
PLUTOT = [("Chien", "Chat"), ("Été", "Hiver"), ("Pizza", "Poutine"), ("Lève-tôt", "Couche-tard"), ("Travailler dehors", "Travailler en dedans"),
          ("Seul", "En équipe"), ("Parler", "Écouter"), ("Ville", "Campagne"), ("Film", "Série"), ("Faire", "Regarder"),
          ("Plan détaillé", "Improvisation"), ("Aider", "Être aidé"), ("Bruit", "Silence"), ("Routine", "Surprise")]
JASETTE = {
    "Pour partir": ["Ton repas préféré, c'est quoi ?", "Une chanson que tu écoutes souvent ?", "Ton endroit préféré au Saguenay ?", "Si tu gagnais 100 $ aujourd'hui, tu ferais quoi ?",
                    "Un film ou une série que tu recommandes ?", "Tu es plus matin ou soir ?", "Ta saison préférée et pourquoi ?", "Un talent caché ?"],
    "On jase": ["Une chose que tu fais vraiment bien ?", "Une personne qui t'a aidé dans ta vie ?", "Une chose que tu as apprise cette année ?", "Ce qui te rend fier de toi ?",
                "Un métier que tu trouves intéressant ?", "Qu'est-ce qui te stresse au début d'un nouveau groupe ?", "Qu'est-ce qui t'aide à te sentir à l'aise ?", "Un défi que tu as relevé ?"],
    "Vers l'avenir": ["Dans un an, tu aimerais faire quoi ?", "Une chose que tu aimerais apprendre ici ?", "Un endroit où tu aimerais travailler ou t'impliquer ?", "Qu'est-ce qui rendrait ta semaine meilleure ?",
                      "Si tu pouvais essayer n'importe quel métier une journée ?", "Qui pourrait t'aider dans ton projet ?", "Une habitude que tu aimerais prendre ?", "Ton prochain petit défi ?"],
}
COLJ = {"Pour partir": "#0E9F8E", "On jase": "#5B4BFF", "Vers l'avenir": "#F2542D"}


ATELIERS = {
    "Grenier de Maria": ("#7A4E9E", ["Trier les articles reçus", "Plier ou étiqueter", "Ranger sur les tablettes", "Tenir l'inventaire", "Accueillir les clients", "Ranger l'espace"]),
    "Ensachage et préparation": ("#C27C0E", ["Préparer le poste", "Compter ou peser", "Fermer et étiqueter les sacs", "Vérifier les dates", "Placer dans les bacs", "Nettoyer le poste"]),
    "Cantine de l'école": ("#C8553D", ["Ouvrir le comptoir", "Préparer", "Servir les clients", "Tenir la caisse", "Nettoyer", "Remplir « ce qui manque »"]),
    "Conciergerie et services": ("#1F7A8C", ["Prendre la liste et le chariot", "Nettoyer les surfaces", "Vider poubelles et recyclage", "Cocher les tâches", "Petit entretien", "Ranger le chariot"]),
}


def plan():
    P = [("Période 1", "Tout le monde", "Se connaître", "#0E9F8E", [
            ("10 min", "Le cercle d'accueil", "En cercle, dans le coin coocooning. Chacun dit son prénom et choisit une carte-météo (ou montre le mot au TNI). On peut passer son tour."),
            ("10 min", "Ma carte de joueur", "Chacun remplit sa carte. Les élèves déjà en place aident les nouveaux. On épingle les cartes au mur."),
            ("15 min", "Plutôt ceci ou cela ?", "Debout. Le TNI affiche deux choix, on se place du côté qui nous ressemble. On demande « pourquoi ? » à 2 ou 3 personnes, sans obliger."),
            ("15 min", "Bingo humain ou cercle de questions", "Bingo pour un groupe qui bouge. Sinon, cercle de questions : on tire une carte, on répond si on veut, on passe la carte.")]),
         ("Période 2", "Groupes A et B ensemble, par atelier", "Bâtir notre atelier", "#F2542D", [
            ("5 min", "Les rôles", "Dans chaque équipe d'atelier : animateur, gardien du temps, secrétaire, porte-parole. Un adulte par équipe, en soutien."),
            ("15 min", "Nos tâches", "On part de la fiche de l'atelier. Pour chaque tâche : on garde, on change ou on enlève. On ajoute nos idées."),
            ("15 min", "La passation de quart", "Le groupe A et le groupe B se partagent l'atelier. Comment on se passe le relais ? On choisit notre façon et on remplit le carnet modèle."),
            ("10 min", "Notre plan de match", "Qui fait quoi au début, ce qu'on veut essayer, la règle d'or de l'équipe. Le porte-parole se prépare pour la période 3.")]),
         ("Période 3", "Tout le monde", "Mettre en commun", "#5B4BFF", [
            ("20 min", "La galerie des ateliers", "Chaque équipe affiche son plan de match. Les porte-parole présentent en 2 minutes. Les autres collent un point vert (j'aime) ou jaune (question)."),
            ("15 min", "Notre entente de passation", "En grand groupe, on choisit les règles communes pour les passations de quart. Vote avec les doigts (1 à 5) : on garde ce qui fait consensus."),
            ("15 min", "Mon cercle d'influence", "Seul, au calme. Ce que je contrôle, ce que je peux influencer, ce qui ne dépend pas de moi, pour ma place dans l'atelier."),
            ("10 min", "Mon billet de sortie", "3 mots, 2 choses, 1 question. On peut écrire, encercler ou dessiner. Le mot de la fin : un mot chacun, en cercle.")])]
    def per(no, qui, titre, c, rows):
        return f"""<div class="card" style="border-left:6px solid {c};padding:9px 12px"><div style="display:flex;align-items:baseline;gap:10px"><span class="tag" style="color:{c}">{no} · {qui}</span><b style="font-size:12pt">{titre}</b></div>
<table class="t" style="margin-top:3px">{"".join(f"<tr><td style='width:11%'><b>{d}</b></td><td style='width:26%'><b>{a}</b></td><td>{t}</td></tr>" for d, a, t in rows)}</table></div>"""
    corps = f"""<div class="dense" style="display:flex;flex-direction:column;gap:8px">
<p class="lede" style="font-size:11.6pt">Un seul mardi, pas comme les autres : <b>tout le monde ensemble</b>. On se rencontre, on <b>co-construit</b> les ateliers avec les élèves, puis on met en commun. Les élèves ont du pouvoir d'agir dès le premier jour.</p>
{"".join(per(*x) for x in P)}</div>"""
    p1 = page("pot", "Le premier mardi", corps, kick="Leçon clé en main · Mme Lisa et l'équipe", sous="Trois périodes : se connaître, bâtir nos ateliers, mettre en commun.", etiquette="Plan du premier mardi", n=1, tot=2)
    corps = f"""<div class="dense">
<div class="g2"><div class="card t"><h2>{ico("maison")}Le local coocooning</h2><ul><li>Un cercle de chaises ou de coussins pour les périodes 1 et 3.</li><li>Lumière douce, musique basse à l'arrivée.</li><li>Un mur pour les cartes de joueur et la galerie.</li><li>Un coin calme pour qui a besoin d'une pause.</li></ul></div>
<div class="card t"><h2>{ico("groupe")}Tenir compte de nos élèves</h2><ul><li>On peut <b>toujours passer son tour</b>. Aucune question sur la famille, l'argent ou la santé.</li><li>Tout se fait à l'oral d'abord ; l'écrit est un choix.</li><li>Consignes une à la fois, au TNI et à voix haute.</li><li>Les élèves déjà en place jumelés avec un nouveau.</li></ul></div></div>
<h2 class="mt">{ico("etapes")}Nos façons d'animer (inspirées de l'animation participative)</h2>
<table class="t"><tr><th style="width:24%">Outil</th><th>Comment</th><th style="width:20%">Quand</th></tr>
<tr><td><b>Tour de parole</b></td><td>Un objet circule. Celui qui le tient parle, les autres écoutent. On peut le passer sans parler.</td><td>Cercles P1 et P3</td></tr>
<tr><td><b>Rôles d'équipe</b></td><td>Animateur, gardien du temps, secrétaire, porte-parole. Les rôles changent à chaque fois.</td><td>Période 2</td></tr>
<tr><td><b>Garder, changer, enlever</b></td><td>On trie les tâches proposées. Les élèves décident ; l'adulte vérifie seulement la sécurité.</td><td>Période 2</td></tr>
<tr><td><b>Galerie</b></td><td>Les affiches au mur, on circule, on colle des points. Tout le monde voit le travail des autres.</td><td>Période 3</td></tr>
<tr><td><b>Vote avec les doigts</b></td><td>1 = je bloque, 3 = je peux vivre avec, 5 = j'adore. On garde ce qui est à 3 et plus pour tout le monde.</td><td>Période 3</td></tr>
<tr><td><b>Cercle d'influence</b></td><td>Trois cercles : je contrôle, j'influence, ça ne dépend pas de moi. Pour agir là où on a du pouvoir.</td><td>Période 3</td></tr></table>
<div class="g2 mt"><div class="card"><h2>{ico("crayon")}À préparer</h2><ul class="ticks"><li>Cartes de joueur, bingos, cartes de questions</li><li>Une fiche d'équipe par atelier et des carnets de passation</li><li>Points autocollants verts et jaunes, gommette</li><li>Billets de sortie et cercles d'influence</li><li>La page brise-glace ouverte au TNI</li></ul></div>
<div class="card d"><h2>{ico("ecran")}Au TNI</h2><div class="qr"><div style="background:#fff;padding:6px;border-radius:8px">{qr(URL, 70)}</div><div><b>Boîte à animation</b><div class="xs" style="color:#6B7189">{URL.replace("https://", "")}</div><div class="xs" style="color:#6B7189">Météo · Plutôt ceci ou cela · La roue · Chrono</div></div></div></div></div>
<div class="card k mt"><h2>{ico("logique")}Le lien avec le Z101</h2><p>Fonctionnement en groupe, milieux d'appartenance, motivation (sentiment d'appartenance) et la compétence « développer un sentiment d'appartenance au milieu de formation ». Les cartes de joueur et les cercles d'influence nourrissent les blocs C1 et C4. Les plans de match d'atelier deviennent une trace pour le critère 2.</p></div></div>"""
    p2 = page("pot", "", corps, kick="Animation", etiquette="Plan du premier mardi", n=2, tot=2)
    return [p1, p2]


def fiche_equipe():
    pages = []
    for nom, (c, taches) in ATELIERS.items():
        corps = f"""<div class="dense">
<div class="g4">{"".join(f'<div class="card t" style="padding:7px 9px"><span class="tag">{r}</span><div class="lines" style="min-height:27px"></div></div>' for r in ["Animateur", "Gardien du temps", "Secrétaire", "Porte-parole"])}</div>
<h2 class="mt">{ico("etapes")}1. Nos tâches : on garde, on change ou on enlève</h2>
<table class="t grid"><tr><th>Tâche proposée</th><th style="width:10%">Garder</th><th style="width:10%">Changer</th><th style="width:10%">Enlever</th><th style="width:30%">Notre idée</th></tr>
{"".join(f"<tr><td>{t}</td><td>{CB('')}</td><td>{CB('')}</td><td>{CB('')}</td><td></td></tr>" for t in taches)}
<tr><td><b>Nouvelle tâche :</b></td><td colspan="4" style="height:30px"></td></tr><tr><td><b>Nouvelle tâche :</b></td><td colspan="4" style="height:30px"></td></tr></table>
<h2 class="mt">{ico("groupe")}2. Qui fait quoi au début ?</h2>
<table class="t grid"><tr><th style="width:40%">Tâche</th><th>Groupe A</th><th>Groupe B</th></tr>{"<tr><td style='height:28px'></td><td></td><td></td></tr>" * 3}</table>
<div class="g2 mt"><div class="card"><h2>{ico("fusee")}3. Ce qu'on veut essayer</h2>{L(2)}</div><div class="card d"><h2>{ico("drapeau")}Notre règle d'or</h2><div class="lines l2" style="background-image:repeating-linear-gradient(transparent 0 26px,#CDD2E0 26px 27px)"></div></div></div></div>"""
        pages.append(f'<div style="--c:{c}">' + page("pot", f"Notre plan de match", corps, kick=f"Période 2 · {nom}", sous="Équipe d'atelier : groupes A et B ensemble. On décide ensemble.", etiquette="Fiche d'équipe", n=len(pages) + 1, tot=4).replace('style="--c:#F2542D;--cl:#FFEDE8"', f'style="--c:{c};--cl:#F6F1EC"') + "</div>")
    return pages


def passation():
    corps = f"""<p class="lede">Le groupe A et le groupe B travaillent dans le même atelier, mais pas en même temps. Le <b>carnet de passation</b> permet de se passer le relais, comme dans une vraie équipe de travail.</p>
<div class="card t mt"><h2>{ico("logique")}Comment on se passe le relais ? (on choisit en équipe)</h2>{OPTS(["Ce carnet papier, dans l'atelier", "Le tableau blanc de l'atelier", "Une photo dans le canal Teams", "Un message vocal", "Un mot en personne au rassemblement"])}</div>
<h2 class="mt">{ico("crayon")}Carnet de passation</h2>
<table class="t grid"><tr><th style="width:16%">Date et groupe</th><th>Ce qu'on a fait</th><th>Ce qui reste à faire</th><th>Ce qui manque</th><th style="width:16%">Un mot pour l'autre groupe</th></tr>
{("<tr><td style='height:74px'><span class='xs'>____ / ____</span><br>" + CB("A") + CB("B") + "</td><td></td><td></td><td></td><td></td></tr>") * 6}</table>"""
    return page("pot", "La passation de quart", corps, kick="Période 2 · toutes les équipes", sous="Imprimer plusieurs copies. Le carnet reste dans l'atelier.", etiquette="Carnet de passation")


def entente():
    corps = f"""<p class="lede">Nos <b>règles communes</b> pour les passations entre le groupe A et le groupe B. On les a choisies ensemble, on les affiche dans chaque atelier.</p>
<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">{"".join(f'<div class="card" style="display:grid;grid-template-columns:60px 1fr 150px;gap:14px;align-items:center;padding:14px"><div style="font-size:34pt;font-weight:900;color:var(--c);letter-spacing:-.04em;line-height:1">0{n}</div><div class="lines" style="min-height:54px"></div><div><span class="tag">Vote</span><div style="display:flex;gap:4px;margin-top:4px">' + "".join(f'<span style="width:22px;height:22px;border:1.4px solid #B9BFD0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:8pt;font-weight:800;color:#6B7189">{k}</span>' for k in range(1, 6)) + "</div></div></div>" for n in range(1, 6))}</div>
<div class="card d mt2"><h2>{ico("ok")}On s'engage</h2><p style="color:#4A5068">On relit l'entente dans 3 semaines. Si une règle ne marche pas, on la change ensemble.</p></div>"""
    return page("disp", "Notre entente de passation", corps, kick="Période 3 · grand groupe", sous="Affiche à remplir en grand groupe (agrandir en 11 x 17 au besoin).", etiquette="Entente")


def cercle():
    corps = f"""<p class="lede">Pour ma place dans l'atelier et dans le groupe : où est-ce que <b>j'ai du pouvoir</b> ?</p>
<svg viewBox="0 0 640 470" width="100%" height="470" style="margin-top:6px"><circle cx="320" cy="235" r="225" fill="#F4F5F9" stroke="#B9BFD0" stroke-dasharray="4 6"/><circle cx="320" cy="235" r="150" fill="#EEEDFF" stroke="#5B4BFF" stroke-width="1.5"/><circle cx="320" cy="235" r="75" fill="#5B4BFF"/>
<text x="320" y="230" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">JE CONTRÔLE</text><text x="320" y="246" text-anchor="middle" font-size="9" fill="#fff">ce que je fais, ce que je dis</text>
<text x="320" y="110" text-anchor="middle" font-size="12" font-weight="800" fill="#5B4BFF">J'INFLUENCE</text><text x="320" y="126" text-anchor="middle" font-size="9" fill="#5B4BFF">je peux demander, proposer</text>
<text x="320" y="36" text-anchor="middle" font-size="12" font-weight="800" fill="#6B7189">ÇA NE DÉPEND PAS DE MOI</text></svg>
<div class="card k mt"><h2>{ico("fusee")}Une chose que je vais faire mardi prochain, dans mon cercle « Je contrôle »</h2>{L(1)}</div>"""
    return page("disp", "Mon cercle d'influence", corps, kick="Période 3 · seul, au calme", sous="J'écris ou je dessine dans le bon cercle. Il n'y a pas de mauvaise réponse.", etiquette="Cercle d'influence")


def billet():
    def b():
        return f"""<div class="cut" style="border-radius:16px;padding:14px 16px;height:4.45in;display:flex;flex-direction:column;gap:6px">
<div style="display:flex;justify-content:space-between"><span class="tag" style="color:var(--c)">Mon billet de sortie · premier mardi</span><span class="xs">Prénom : ______________</span></div>
<div style="display:grid;grid-template-columns:60px 1fr;gap:10px;align-items:start"><div style="font-size:38pt;font-weight:900;color:var(--c);line-height:.9">3</div><div><b>mots pour décrire aujourd'hui</b><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:6px"><div class="lines" style="min-height:27px"></div><div class="lines" style="min-height:27px"></div><div class="lines" style="min-height:27px"></div></div></div></div>
<div style="display:grid;grid-template-columns:60px 1fr;gap:10px;align-items:start"><div style="font-size:38pt;font-weight:900;color:var(--c);line-height:.9">2</div><div><b>choses que j'ai apprises sur les autres</b><div class="lines" style="min-height:54px"></div></div></div>
<div style="display:grid;grid-template-columns:60px 1fr;gap:10px;align-items:start"><div style="font-size:38pt;font-weight:900;color:var(--c);line-height:.9">1</div><div><b>question, ou une chose que j'ai hâte de faire</b><div class="lines" style="min-height:27px"></div></div></div>
<div class="scale" style="margin-top:auto"><div class="s1"><span class="dot"></span>Je me sens bien ici</div><div class="s2"><span class="dot"></span>Ça commence</div><div class="s3"><span class="dot"></span>Pas encore à l'aise</div></div></div>"""
    return page("disp", "", f'<div style="display:flex;flex-direction:column;gap:12px;margin-top:10px">{b()}{b()}</div>', etiquette="Billet de sortie · 2 par feuille", deco=False)


def carte_joueur():
    def carte():
        return f'''<div class="cut" style="border-radius:18px;overflow:hidden;display:flex;flex-direction:column;height:4.62in">
<div style="background:#fff;border-bottom:3px solid #0E1330;padding:12px 14px;position:relative"><svg style="position:absolute;right:0;top:0" width="120" height="80" viewBox="0 0 120 80"><polygon points="70,0 120,0 120,50" fill="#F2542D"/><line x1="40" y1="0" x2="120" y2="80" stroke="#5B4BFF" stroke-width="1.4"/></svg>
<div class="tag" style="color:#D9431F">Carte de joueur · Z101</div><div style="font-size:9pt;color:#6B7189;margin-top:14px">Prénom</div><div style="border-bottom:1.5px solid #CDD2E0;height:24px"></div></div>
<div style="padding:10px 14px;display:flex;flex-direction:column;gap:7px;flex:1;font-size:9.6pt">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div class="tag">Position</div>{CB("Nouveau")}<br>{CB("Déjà au PPS")}</div><div class="box" style="height:62px;display:flex;align-items:center;justify-content:center;color:#B9BFD0;font-size:8pt">Mon logo ou un dessin</div></div>
<div><div class="tag">Mes stats</div>{"".join(f'<div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:84px">{s}</span>' + "".join('<span style="width:14px;height:10px;border:1.3px solid #0E1330;border-radius:2px;display:inline-block"></span>' for _ in range(5)) + "</div>" for s in ["Énergie", "Patience", "Humour", "Créativité"])}</div>
<div><div class="tag">Mon pouvoir spécial</div><div class="lines" style="min-height:27px"></div></div>
<div><div class="tag">Ce qui me fait avancer</div><div class="lines" style="min-height:27px"></div></div>
<div><div class="tag">Dans un an, j'aimerais</div><div class="lines" style="min-height:27px"></div></div></div></div>'''
    corps = f'<div class="g2" style="margin-top:10px;gap:10px">{carte()}{carte()}{carte()}{carte()}</div>'
    return page("pot", "", corps, etiquette="Carte de joueur · 4 par feuille, à découper", deco=False)


def bingo():
    cases = BINGO[:12] + ["CASE LIBRE"] + BINGO[12:24]
    cells = "".join(f'<td style="height:1.18in;width:20%;vertical-align:top;padding:8px;{"background:#fff;color:#0E1330;border:2px solid #0E1330;text-align:center;vertical-align:middle;font-weight:900;letter-spacing:.1em" if c == "CASE LIBRE" else ""}">{"Z101" if c == "CASE LIBRE" else f"<div style=font-weight:800;font-size:10pt;line-height:1.2>{c}</div><div style=margin-top:16px;border-bottom:1px solid #CDD2E0></div>"}</td>' + ("</tr><tr>" if (i + 1) % 5 == 0 and i < 24 else "") for i, c in enumerate(cases))
    corps = f'''<div class="steps-inline small" style="display:flex;gap:18px;margin-bottom:10px"><span><b style="color:var(--c)">01</b> Je circule.</span><span><b style="color:var(--c)">02</b> Je pose la question.</span><span><b style="color:var(--c)">03</b> Si c'est oui, j'écris son prénom.</span><span><b style="color:var(--c)">04</b> Une personne = une case.</span></div>
<table class="t grid" style="table-layout:fixed"><tr>{cells}</tr></table>
<div class="card t mt"><b>Une ligne complète ?</b> Je crie « Bingo ! ». Une personne que je ne connaissais pas et que j'aimerais revoir : ______________________</div>'''
    return page("disp", "Bingo humain", corps, kick="Brise-glace · papier", sous="Trouve quelqu'un qui…", etiquette="Bingo humain")


def cartes_jasette():
    pages = []
    items = [(k, q) for k, l in JASETTE.items() for q in l]
    for i in range(0, len(items), 12):
        cs = "".join(f'<div class="cut" style="border-radius:14px;height:2.05in;padding:12px;display:flex;flex-direction:column;justify-content:space-between;border-left:8px solid {COLJ[k]}"><span class="tag" style="color:{COLJ[k]}">{k}</span><div style="font-size:14pt;font-weight:850;letter-spacing:-.02em;line-height:1.15">{q}</div><span class="xs">On peut passer son tour</span></div>' for k, q in items[i:i + 12])
        pages.append(page("disp", "Cartes de questions" if i == 0 else "", f'<div class="g3" style="gap:8px;margin-top:{6 if i == 0 else 18}px">{cs}</div>', kick="Brise-glace · papier", sous="Cercle de questions ou speed-jasette. Trois paquets : Pour partir, On jase, Vers l'avenir. On peut toujours passer son tour." if i == 0 else "", etiquette="Cartes de questions", n=i // 12 + 1, tot=2, deco=(i == 0)))
    return pages


def tour():
    corps = f'''<div class="g21"><div><p class="lede">Avec <b>10 feuilles</b> et <b>30 cm de ruban adhésif</b>, construisez la tour la plus haute qui tient debout toute seule.</p>
<ol class="steps"><li>2 minutes : on planifie sans toucher aux feuilles.</li><li>8 minutes : on construit.</li><li>On mesure. La tour doit tenir 10 secondes.</li></ol></div>
<div class="card d"><div class="tag" style="color:#D9431F">Notre résultat</div><div style="font-size:40pt;font-weight:900;letter-spacing:-.03em;margin-top:6px">___ cm</div><div class="xs" style="color:#6B7189">Nom de l'équipe : ______________</div></div></div>
<h2 class="mt2">{ico("groupe")}Les rôles</h2><div class="g4">{"".join(f'<div class="card t"><b>{r}</b><p class="xs">{d}</p><div class="lines" style="min-height:27px"></div></div>' for r, d in [("Architecte", "Propose le plan"), ("Constructeur", "Plie et assemble"), ("Gardien du temps", "Surveille le chrono"), ("Porte-parole", "Présente au groupe")])}</div>
<h2 class="mt2">{ico("logique")}Après le défi : on en parle</h2>
<table class="t grid"><tr><th>Question</th><th style="width:52%">Notre réponse</th></tr>
<tr><td>Qu'est-ce qui a aidé notre équipe ?</td><td style="height:48px"></td></tr><tr><td>Qu'est-ce qui a été difficile ?</td><td style="height:48px"></td></tr><tr><td>Qu'est-ce que je ferais autrement ?</td><td style="height:48px"></td></tr></table>
<div class="card k mt"><h2>{ico("lien")}Lien avec mon projet</h2><p class="small">En équipe, j'ai montré {OPTS(["de l'enthousiasme", "du respect", "de la tolérance", "de la collaboration", "que je vais vers les autres"])}</p></div>'''
    return page("pot", "Le défi de la tour", corps, kick="Brise-glace · en équipe", sous="Équipes mixtes de 3 ou 4 : nouveaux et élèves déjà en place.", etiquette="Défi de la tour")


def reserve():
    si = ["un animal", "un métier", "un lieu au Saguenay", "un objet", "une saison", "une chanson", "un sport", "un repas"]
    corps = f'''<div class="g2"><div class="card"><h2>{ico("idee")}Deux vérités, un mensonge</h2><p class="small">J'écris 3 phrases sur moi. Une seule est fausse. Le groupe devine laquelle.</p>
{"".join(f'<div style="margin-top:8px"><b>{n}.</b><div class="lines" style="min-height:27px"></div></div>' for n in (1, 2, 3))}<p class="xs mt">Le mensonge, c'est la phrase n° ___ (je le cache).</p></div>
<div class="card"><h2>{ico("personne")}Si j'étais…</h2><table class="t">{"".join(f"<tr><td style='width:44%'>Si j'étais {s}, je serais…</td><td><div class='lines' style='min-height:27px'></div></td></tr>" for s in si)}</table><p class="xs mt">Je choisis ma réponse préférée et j'explique pourquoi au groupe.</p></div></div>
<div class="card d mt2"><h2>{ico("fusee")}Le mot de la fin</h2><p style="color:#4A5068">Un seul mot pour décrire le cours d'aujourd'hui :</p><div style="border-bottom:1.5px solid #CDD2E0;height:40px"></div></div>'''
    return page("disp", "En réserve", corps, kick="Brise-glace · papier", sous="Pour un groupe rapide ou pour un prochain cours.", etiquette="En réserve")


def jobs():
    return [("BG_0", doc("Plan du premier mardi", plan()), os.path.join(D, "0_Plan-du-premier-mardi_Enseignante.pdf")),
            ("BG_1", doc("Ma carte de joueur", [carte_joueur()]), os.path.join(D, "1_P1_Ma-carte-de-joueur.pdf")),
            ("BG_2", doc("Bingo humain", [bingo()]), os.path.join(D, "2_P1_Bingo-humain.pdf")),
            ("BG_3", doc("Cartes de questions", cartes_jasette()), os.path.join(D, "3_P1_Cartes-de-questions.pdf")),
            ("BG_4", doc("Fiches d'équipe d'atelier", fiche_equipe()), os.path.join(D, "4_P2_Fiches-d-equipe_plan-de-match-par-atelier.pdf")),
            ("BG_5", doc("Carnet de passation", [passation()]), os.path.join(D, "5_P2_Carnet-de-passation-de-quart.pdf")),
            ("BG_6", doc("Entente de passation", [entente()]), os.path.join(D, "6_P3_Entente-de-passation_affiche.pdf")),
            ("BG_7", doc("Cercle d'influence", [cercle()]), os.path.join(D, "7_P3_Mon-cercle-d-influence.pdf")),
            ("BG_8", doc("Billet de sortie", [billet()]), os.path.join(D, "8_P3_Mon-billet-de-sortie.pdf")),
            ("BG_9", doc("En réserve", [tour(), reserve()]), os.path.join(D, "9_En-reserve_Defi-de-la-tour-et-autres.pdf"))]

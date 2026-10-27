"""Génère alimentation.json (jeu en tournée PPS-Z107-3) et vérifie les valeurs nutritives."""
import json, os

ICI = os.path.dirname(os.path.abspath(__file__))
# Valeurs quotidiennes (Santé Canada, étiquetage 2016)
VQ = {"Lipides": 75, "Saturés + trans": 20, "Fibres": 28, "Sucres": 100, "Sodium": 2300, "Calcium": 1300}

def pct(nut, q):
    return round(q / VQ[nut] * 100)

# ---------- produits (valeurs plausibles) ----------
CROUSTILLES = {"nom": "Croustilles nature", "portion": "pour 1 sac (40 g)", "cal": 210,
               "lignes": [("Lipides", 13, "g"), ("Saturés + trans", 1.5, "g"), ("Glucides", 21, "g"), ("Fibres", 1, "g"),
                          ("Sucres", 0, "g"), ("Protéines", 3, "g"), ("Sodium", 280, "mg")]}
BOISSON = {"nom": "Boisson gazeuse", "portion": "pour 1 bouteille (591 mL)", "cal": 250,
           "lignes": [("Lipides", 0, "g"), ("Glucides", 65, "g"), ("Fibres", 0, "g"), ("Sucres", 65, "g"),
                      ("Protéines", 0, "g"), ("Sodium", 55, "mg")]}
POUTINE = {"nom": "Poutine moyenne", "portion": "pour 1 poutine moyenne", "cal": 740,
           "lignes": [("Lipides", 38, "g"), ("Saturés + trans", 15, "g"), ("Glucides", 78, "g"), ("Fibres", 6, "g"),
                      ("Sucres", 2, "g"), ("Protéines", 22, "g"), ("Sodium", 1610, "mg"), ("Calcium", 250, "mg")]}
CEREALE_A = {"nom": "A · Flocons de son", "portion": "pour 30 g", "cal": 100,
             "lignes": [("Fibres", 5, "g"), ("Sucres", 5, "g"), ("Sodium", 160, "mg")]}
CEREALE_B = {"nom": "B · Céréales givrées", "portion": "pour 30 g", "cal": 120,
             "lignes": [("Fibres", 1, "g"), ("Sucres", 12, "g"), ("Sodium", 140, "mg")]}

def g(d, nut):
    return next(v for n, v, u in d["lignes"] if n == nut)

# vérifications : calories cohérentes (4-9-4) et % VQ attendus
def kcal(d):
    return g(d, "Lipides") * 9 + g(d, "Glucides") * 4 + g(d, "Protéines") * 4
assert abs(kcal(CROUSTILLES) - CROUSTILLES["cal"]) <= 10
assert abs(kcal(BOISSON) - BOISSON["cal"]) <= 15
assert abs(kcal(POUTINE) - POUTINE["cal"]) <= 10
assert pct("Sodium", 280) == 12 and pct("Lipides", 13) == 17 and pct("Saturés + trans", 1.5) == 8 and pct("Fibres", 1) == 4
assert pct("Sucres", 65) == 65 and pct("Sodium", 55) == 2
assert pct("Sodium", 1610) == 70 and pct("Lipides", 38) == 51 and pct("Sucres", 2) == 2 and pct("Calcium", 250) == 19
assert pct("Saturés + trans", 15) == 75 and pct("Fibres", 6) == 21
assert pct("Fibres", 5) == 18 and pct("Sucres", 5) == 5 and pct("Sodium", 160) == 7
assert pct("Fibres", 1) == 4 and pct("Sucres", 12) == 12 and pct("Sodium", 140) == 6
assert pct("Sodium", 1035) == 45            # burger
assert pct("Sucres", 26) == 26              # lait au chocolat 250 mL
assert pct("Sucres", 70) == 70              # lait frappé moyen
assert pct("Sodium", 70) == 3               # salade du jardin sans vinaigrette
assert round(65 / 4) == 16                  # 4 g de sucre ≈ 1 cuillère à thé

def tableau(d, surligne=()):
    """Tableau de la valeur nutritive (HTML, styles en ligne)."""
    lig = []
    for n, v, u in d["lignes"]:
        p = f"{pct(n, v)} %" if n in VQ else ""
        vs = (f"{v:,g}".replace(",", "\u202f").replace(".", ",")) + " " + u
        ind = "padding-left:14px;" if n in ("Saturés + trans", "Fibres", "Sucres") else ""
        fond = "background:#FFF3B0;" if n in surligne else ""
        lig.append(f'<div style="display:flex;justify-content:space-between;border-top:1px solid #444;padding:2px 4px;{fond}">'
                   f'<span style="{ind}"><b>{n}</b> {vs}</span><b>{p}</b></div>')
    port_fond = "background:#FFF3B0;" if "Portion" in surligne else ""
    return (f'<div style="border:2px solid #111;background:#fff;color:#111;font-family:Arial,sans-serif;font-size:17px;'
            f'text-align:left;width:290px;max-width:100%;margin:6px auto;padding:6px 8px">'
            f'<div style="font-size:12px;color:#555">{d["nom"]}</div>'
            f'<div style="font-weight:900;font-size:22px;line-height:1.1">Valeur nutritive</div>'
            f'<div style="{port_fond}padding:0 4px">{d["portion"]}</div>'
            f'<div style="display:flex;justify-content:space-between;border-top:6px solid #111;padding:2px 4px">'
            f'<b>Calories {d["cal"]}</b><b style="font-size:13px">% valeur quotidienne*</b></div>'
            + "".join(lig) +
            f'<div style="border-top:4px solid #111;font-size:12px;padding-top:3px">*5 % ou moins c’est <b>peu</b>, '
            f'15 % ou plus c’est <b>beaucoup</b></div></div>')

def qte(v, u):
    return (f"{v:,g}".replace(",", " ").replace(".", ",")) + " " + u

def tn(d, dit=None, repere=True):
    """Visuel tableauNutritif du moteur (lu à voix haute). Sans repere : pas de couleurs, mais la note *5 % / 15 % reste."""
    v = {"type": "tableauNutritif", "titre": "Valeur nutritive", "portion": d["nom"] + " · " + d["portion"], "calories": d["cal"],
         "lignes": [[n, qte(q, u), pct(n, q) if n in VQ else None] for n, q, u in d["lignes"]]}
    if repere: v["repere"] = True
    if dit: v["dit"] = dit
    return v

def _c(p):
    return "" if p is None else "background:#FBE2CE;color:#8f4f24" if p >= 15 else "background:#E3F3E8;color:#2E6B45" if p <= 5 else ""

def tn_html(d):
    """Même balisage que le moteur (classes .tvn), pour deux tableaux côte à côte."""
    lig = "".join(f'<div class="tvn-l"><span><b>{n}</b> {qte(q, u)}</span><b style="border-radius:6px;padding:0 6px;{_c(pct(n, q) if n in VQ else None)}">'
                  f'{str(pct(n, q)) + " %" if n in VQ else ""}</b></div>' for n, q, u in d["lignes"])
    return (f'<div class="tvn pop" style="max-width:250px;margin:8px 0"><div class="tvn-t">Valeur nutritive</div><div class="small">{d["nom"]} · {d["portion"]}</div>'
            f'<div class="tvn-cal"><b>Calories {d["cal"]}</b><span class="small">% VQ*</span></div>{lig}'
            f'<div class="small" style="margin-top:4px">*5 % ou moins, c’est <b>peu</b> · 15 % ou plus, c’est <b>beaucoup</b></div></div>')

def dit_tn(d):
    return f'{d["nom"]}, {d["portion"]}. ' + ". ".join(f'{n} {qte(q, u)}' + (f', {pct(n, q)} %' if n in VQ else '') for n, q, u in d["lignes"])

def deux(a, b):
    return {"type": "html", "html": f'<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">{tn_html(a)}{tn_html(b)}</div>',
            "dit": dit_tn(a) + ". " + dit_tn(b) + "."}

def ingredients(nom, liste):
    return (f'<div style="border:2px solid #111;background:#fff;color:#111;font-family:Arial,sans-serif;font-size:18px;'
            f'text-align:left;max-width:420px;margin:6px auto;padding:8px 10px"><div style="font-size:12px;color:#555">{nom}</div>'
            f'<b>Ingrédients :</b> {liste}</div>')

ASSIETTE = ('<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center">'
            '<div style="width:170px;height:170px;border-radius:50%;border:8px solid #fff;box-shadow:0 2px 8px #0003;'
            'background:conic-gradient(#6BB36B 0 50%,#E3BF6A 50% 75%,#C96B5A 75% 100%)"></div>'
            '<div style="text-align:left;font-size:19px;line-height:1.6">'
            '<div><span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:#6BB36B"></span> ½ légumes et fruits</div>'
            '<div><span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:#E3BF6A"></span> ¼ grains entiers</div>'
            '<div><span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:#C96B5A"></span> ¼ protéines</div>'
            '<div>💧 de l’eau pour boire</div></div></div>')

PEU_BEAUCOUP = ('<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;font-size:22px;font-weight:900">'
                '<div style="background:#E3F3E8;border-radius:14px;padding:10px 16px">5 % ou moins<br>= peu</div>'
                '<div style="background:#FBEDE4;border-radius:14px;padding:10px 16px">15 % ou plus<br>= beaucoup</div></div>')

BARRE = ingredients("Barre tendre", "flocons d’avoine, sirop de glucose, sucre, huile de canola, riz soufflé, miel, dextrose, sel.")
BISCUITS = ingredients("Biscuits au chocolat", "sucre, farine de blé, huile de palme, cacao, sel, bicarbonate de sodium.")

cfg = {
 "id": "pps-z107-tournee-sante-v2",
 "fichier": "tournee-sante",
 "titre": "La tournée santé",
 "sousTitre": "PPS-Z107-3 · Alimentation saine · avec Véronique",
 "cours": "PPS-Z107-3",
 "matiere": "Alimentation saine",
 "enseignant": "Véronique",
 "cleEnseignant": "veronique",
 "accroche": "Du Ruisseau au Fleuve : choisis mieux tes collations et tes repas.",
 "duree": 25,
 "unite": "",
 "intention": "Lire le tableau de la valeur nutritive et la liste des ingrédients pour faire des choix de collations et de repas plus santé (progression : je reconnais → je lis → je compare et je planifie).",
 "mascotte": {"fichier": "hibou", "nom": "le hibou", "du": "du hibou"},
 "theme": {"accent": "#2F8F5B", "accentFonce": "#1E6440", "accentPale": "#E3F3E8",
           "formes": ["#CFE9D7", "#F6E3A6", "#DDF5F2", "#F6D1D6"]},
 "carte": {"trajet": "de Saint-Félicien à Chicoutimi", "depart": "Saint-Félicien", "arrivee": "Chicoutimi", "riviere": "rivière Saguenay"},
 "remise": "Remets-le à Véronique dans le devoir Teams « Remets ton bilan ».",
 "niveaux": [
  {"id": "R", "nom": "Ruisseau", "clair": "#D6EEF5", "fonce": "#2B6F86", "description": "je reconnais",
   "intro": {"texte": "Au niveau Ruisseau, tu reconnais les groupes d’aliments.", "capsules": ["assiette"]}},
  {"id": "V", "nom": "Rivière", "clair": "#C8DDF4", "fonce": "#1F4E8C", "description": "je lis le tableau",
   "intro": {"texte": "Au niveau Rivière, tu lis le tableau de la valeur nutritive.", "capsules": ["tableau"]}},
  {"id": "F", "nom": "Fleuve", "clair": "#D6D3F0", "fonce": "#3F3A8C", "description": "je compare et je planifie",
   "intro": {"texte": "Au niveau Fleuve, tu compares deux produits et tu prépares ta boîte à lunch.", "capsules": ["comparer"]}}
 ],
 "elements": [
  {"id": "grp", "nom": "Classer les aliments dans les groupes du Guide alimentaire",
   "descripteurs": ["Classe seul les aliments dans les 3 groupes et explique l’assiette.",
                    "Classe les aliments avec un rappel (l’assiette, le truc du hibou).",
                    "Classe quelques aliments avec beaucoup d’aide.",
                    "Ne classe pas encore les aliments."],
   "descripteursEleve": ["Je classe seul les aliments dans les 3 groupes.",
                         "Je classe les aliments avec un rappel (l’assiette).",
                         "Je classe quelques aliments avec beaucoup d’aide.",
                         "Je ne classe pas encore les aliments."],
   "prochaines": ["Aide un ami à remplir son assiette, ou crée ta question.",
                  "Regarde ton prochain repas : trouve un aliment de chaque groupe.",
                  "Revois la capsule « L’assiette » et classe 3 aliments de ta cuisine.",
                  "Avec un adulte, classe de vrais aliments sur une assiette en papier."]},
  {"id": "occ", "nom": "Distinguer les aliments de tous les jours et d’occasion",
   "descripteurs": ["Distingue seul les aliments de tous les jours et d’occasion et donne la raison (sucre, sel, gras).",
                    "Les distingue avec un rappel.",
                    "Les distingue avec beaucoup d’aide.",
                    "Ne les distingue pas encore."],
   "descripteursEleve": ["Je sais seul si un aliment est de tous les jours ou d’occasion.",
                         "Je le sais avec un rappel.",
                         "Je le sais avec beaucoup d’aide.",
                         "Je ne le sais pas encore."],
   "prochaines": ["Trouve une collation de tous les jours pour remplacer une collation d’occasion.",
                  "Au dîner, nomme un aliment de tous les jours et un aliment d’occasion.",
                  "Revois la capsule « Tous les jours ou d’occasion ? ».",
                  "Avec un adulte, trie des emballages vides en deux piles."]},
  {"id": "tvn", "nom": "Repérer l’information dans le tableau de la valeur nutritive",
   "descripteurs": ["Repère seul la portion, les sucres, le sodium et les fibres.",
                    "Les repère avec un rappel de la démarche.",
                    "Repère la portion ou un élément avec beaucoup d’aide.",
                    "Ne repère pas encore l’information."],
   "descripteursEleve": ["Je trouve seul la portion, les sucres, le sodium et les fibres.",
                         "Je les trouve avec un rappel.",
                         "Je trouve une information avec beaucoup d’aide.",
                         "Je ne trouve pas encore l’information."],
   "prochaines": ["Lis le tableau d’une collation chez toi et explique-le à un ami.",
                  "Lis le tableau de haut en bas : la portion d’abord.",
                  "Revois la capsule « Le tableau » et pointe chaque ligne avec ton doigt.",
                  "Avec un adulte, surligne la portion et les sucres sur un vrai emballage."]},
  {"id": "vq", "nom": "Interpréter le % de la valeur quotidienne (5 % peu, 15 % beaucoup)",
   "descripteurs": ["Interprète seul le % VQ (peu ou beaucoup) et l’utilise pour juger un aliment.",
                    "Interprète le % VQ avec le rappel 5 % / 15 %.",
                    "Interprète le % VQ avec beaucoup d’aide.",
                    "N’interprète pas encore le % VQ."],
   "descripteursEleve": ["Je sais seul si c’est peu ou beaucoup avec le % VQ.",
                         "J’y arrive avec le rappel 5 % et 15 %.",
                         "J’y arrive avec beaucoup d’aide.",
                         "Je n’y arrive pas encore."],
   "prochaines": ["Trouve un aliment avec beaucoup de fibres et peu de sucres.",
                  "Écris « 5 % peu, 15 % beaucoup » sur un papier et garde-le.",
                  "Revois la capsule « Le % VQ » et trie 3 emballages : peu ou beaucoup.",
                  "Avec un adulte, colorie en vert les 5 % ou moins et en rouge les 15 % ou plus."]},
  {"id": "ing", "nom": "Lire la liste des ingrédients",
   "descripteurs": ["Sait seul que le 1er ingrédient est le plus présent et repère les noms du sucre.",
                    "Y arrive avec un rappel.",
                    "Y arrive avec beaucoup d’aide.",
                    "Ne lit pas encore la liste des ingrédients."],
   "descripteursEleve": ["Je sais seul quel ingrédient il y a le plus et je trouve les noms du sucre.",
                         "J’y arrive avec un rappel.",
                         "J’y arrive avec beaucoup d’aide.",
                         "Je ne lis pas encore la liste."],
   "prochaines": ["Trouve un produit où le sucre est le 1er ingrédient, et un autre où il n’y en a pas.",
                  "Fais une liste des noms du sucre et garde-la dans ton cahier.",
                  "Revois la capsule « Comparer » et lis seulement le 1er ingrédient.",
                  "Avec un adulte, encercle le 1er ingrédient sur 3 emballages."]},
  {"id": "cho", "nom": "Comparer des produits et planifier un repas plus santé",
   "descripteurs": ["Compare seul deux produits (même portion, % VQ) et planifie une boîte à lunch équilibrée en justifiant.",
                    "Compare et planifie avec un rappel de la démarche.",
                    "Compare ou planifie avec beaucoup d’aide.",
                    "Ne compare pas encore et ne planifie pas encore."],
   "descripteursEleve": ["Je compare seul deux produits et je planifie ma boîte à lunch.",
                         "J’y arrive avec un rappel des étapes.",
                         "J’y arrive avec beaucoup d’aide.",
                         "Je n’y arrive pas encore."],
   "prochaines": ["Planifie tes boîtes à lunch de la semaine, ou crée ta question.",
                  "À l’épicerie, compare deux collations : même portion, puis le % VQ.",
                  "Revois la capsule « Comparer » et compare un seul nutriment à la fois.",
                  "Avec un adulte, prépare une boîte à lunch avec l’assiette en papier."]}
 ],
 "autoeval": [
  {"element": "grp", "phrase": "Je suis capable de classer un aliment dans son groupe."},
  {"element": "occ", "phrase": "Je sais si un aliment est de tous les jours ou d’occasion."},
  {"element": "tvn", "phrase": "Je trouve la portion, les sucres et le sodium dans le tableau."},
  {"element": "vq", "phrase": "Je sais que 5 %, c’est peu, et 15 %, c’est beaucoup."},
  {"element": "ing", "phrase": "Je sais lire la liste des ingrédients."},
  {"element": "cho", "phrase": "Je suis capable de comparer deux produits et de choisir."}
 ],
 "stations": [
  {"nom": "Ta cuisine", "lieu": "chez toi, Saint-Félicien", "niveau": "R", "couleur": "#C0551F", "decor": "cuisine",
   "texte": "C’est l’heure du souper. Le hibou t’aide à remplir ton assiette."},
  {"nom": "Cafétéria de l’école", "court": "Cafétéria", "lieu": "ton école, Roberval", "niveau": "R", "couleur": "#3B6EA5", "decor": "cafeteria",
   "texte": "C’est l’heure du dîner à la cafétéria. Tous les jours ou d’occasion ?", "capsules": ["occasion"]},
  {"nom": "Dépanneur du coin", "court": "Dépanneur", "lieu": "Alma", "niveau": "V", "couleur": "#B5121B", "decor": "depanneur",
   "texte": "Tu passes au dépanneur après l’école. Tu lis le tableau avant d’acheter."},
  {"nom": "Casse-croûte", "lieu": "Jonquière", "niveau": "V", "couleur": "#D9661B", "decor": "casse-croute",
   "texte": "Souper au casse-croûte avec des amis. Le % VQ t’aide à choisir.", "capsules": ["vq"]},
  {"nom": "Épicerie", "lieu": "Chicoutimi", "niveau": "F", "couleur": "#2E7D32", "decor": "epicerie",
   "texte": "Tu fais l’épicerie. Tu compares deux produits avant de choisir."},
  {"nom": "Parc de la Rivière-du-Moulin", "court": "Parc", "lieu": "Chicoutimi", "niveau": "F", "couleur": "#5B3F8C", "decor": "parc",
   "texte": "Pique-nique au parc ! Tu prépares ta boîte à lunch."}
 ],
 "trucs": {
  "t1": {"titre": "L’assiette du hibou", "lignes": ["La moitié : des légumes et des fruits.", "Un quart : des grains entiers.",
         "Un quart : des protéines (viande, poisson, œufs, légumineuses, lait, yogourt, fromage).", "Pour boire : de l’eau."],
         "visuel": {"type": "html", "html": ASSIETTE, "dit": "L’assiette santé : la moitié, des légumes et des fruits. Un quart, des grains entiers. Un quart, des protéines. De l’eau pour boire."}},
  "t2": {"titre": "Tous les jours ou d’occasion ?", "lignes": ["Tous les jours : des aliments des 3 groupes, peu transformés.",
         "D’occasion : beaucoup de sucre, de sel ou de gras.", "Exemples d’occasion : croustilles, boissons sucrées, bonbons, frites."],
         "visuel": {"type": "colonnes", "colonnes": [{"titre": "Tous les jours", "texte": "pomme, yogourt nature, sandwich au pain de blé entier, eau"},
                                                      {"titre": "D’occasion", "texte": "frites, beigne, boisson gazeuse, croustilles"}]}},
  "t3": {"titre": "Je lis le tableau de haut en bas", "lignes": ["Je regarde la portion (en haut).", "Je trouve les sucres, le sodium et les fibres.",
         "Je lis le % VQ à droite."], "visuel": tn(CROUSTILLES)},
  "t4": {"titre": "Peu ou beaucoup ?", "lignes": ["Je regarde le % VQ, à droite du tableau.", "5 % ou moins : c’est peu.", "15 % ou plus : c’est beaucoup."],
         "visuel": {"type": "html", "html": PEU_BEAUCOUP, "dit": "5 % ou moins, c’est peu. 15 % ou plus, c’est beaucoup."}},
  "t5": {"titre": "Je compare deux produits", "lignes": ["Je vérifie que la portion est pareille.", "Je compare le % VQ.",
         "Je choisis : moins de sucres et de sodium, plus de fibres."], "visuel": {"type": "grand", "html": "– sucres · – sodium · + fibres"}},
  "t6": {"titre": "La liste des ingrédients", "lignes": ["Le 1er ingrédient, c’est celui qu’il y a le plus.", "Le dernier, c’est celui qu’il y a le moins.",
         "Le sucre a plusieurs noms : sucre, sirop, miel, glucose, dextrose, fructose."], "visuel": {"type": "html", "html": BISCUITS, "dit": "Biscuits au chocolat. Ingrédients : sucre, farine de blé, huile de palme, cacao, sel, bicarbonate de sodium."}},
  "t7": {"titre": "Ma boîte à lunch", "lignes": ["Des légumes ou des fruits.", "Un aliment à grains entiers.", "Une protéine.", "Une bouteille d’eau."],
         "visuel": {"type": "html", "html": ASSIETTE, "dit": "L’assiette santé : la moitié, des légumes et des fruits. Un quart, des grains entiers. Un quart, des protéines. De l’eau pour boire."}}
 },
 "capsules": {
  "assiette": {"titre": "L’assiette du Guide alimentaire", "scenes": [
   {"texte": "Le Guide alimentaire canadien montre une assiette santé.", "visuel": {"type": "html", "html": ASSIETTE, "dit": "L’assiette santé : la moitié, des légumes et des fruits. Un quart, des grains entiers. Un quart, des protéines. De l’eau pour boire."}},
   {"texte": "La moitié de l’assiette : des légumes et des fruits.", "visuel": {"type": "grand", "html": "½ légumes et fruits"}},
   {"texte": "Un quart : des grains entiers. Un quart : des protéines. Le lait, le yogourt et le fromage sont avec les protéines.", "visuel": {"type": "grand", "html": "¼ grains entiers<br>¼ protéines"}},
   {"texte": "Le truc du hibou : la moitié légumes et fruits, un quart grains entiers, un quart protéines. Et de l’eau pour boire.", "visuel": {"type": "mascotte", "taille": 130, "html": "½ · ¼ · ¼ · 💧"}}]},
  "occasion": {"titre": "Tous les jours ou d’occasion ?", "scenes": [
   {"texte": "Les aliments de tous les jours viennent des 3 groupes de l’assiette.", "visuel": {"type": "grand", "html": "pomme · yogourt · pain de blé entier"}},
   {"texte": "Les aliments d’occasion ont beaucoup de sucre, de sel ou de gras. On en mange de temps en temps.", "visuel": {"type": "colonnes", "colonnes": [{"titre": "Tous les jours", "texte": "pomme, yogourt nature, eau"}, {"titre": "D’occasion", "texte": "frites, beigne, boisson gazeuse"}]}},
   {"texte": "Le truc du hibou : beaucoup de sucre, de sel ou de gras ? C’est d’occasion.", "visuel": {"type": "mascotte", "taille": 130, "html": "sucre · sel · gras<br>→ d’occasion"}}]},
  "tableau": {"titre": "Le tableau de la valeur nutritive", "scenes": [
   {"texte": "Sur l’emballage, il y a le tableau de la valeur nutritive.", "visuel": tn(CROUSTILLES)},
   {"texte": "En haut, je lis la portion. Ici : 1 sac de 40 grammes. Tous les nombres sont pour cette portion.", "visuel": tn(CROUSTILLES)},
   {"texte": "Je trouve les sucres, le sodium et les fibres. Le sodium, c’est le sel.", "visuel": tn(CROUSTILLES)},
   {"texte": "Le truc du hibou : je lis de haut en bas. La portion d’abord, puis les sucres, le sodium et les fibres.", "visuel": {"type": "mascotte", "taille": 130, "html": "portion → sucres · sodium · fibres"}}]},
  "vq": {"titre": "Le % de la valeur quotidienne", "scenes": [
   {"texte": "À droite du tableau, il y a le pourcentage de la valeur quotidienne. On dit le % VQ.", "visuel": tn(POUTINE)},
   {"texte": "5 % ou moins, c’est peu. 15 % ou plus, c’est beaucoup.", "visuel": {"type": "html", "html": PEU_BEAUCOUP, "dit": "5 % ou moins, c’est peu. 15 % ou plus, c’est beaucoup."}},
   {"texte": "Le truc du hibou : la poutine a 70 % de sodium. 70 %, c’est beaucoup plus que 15 %. C’est beaucoup de sel !", "visuel": {"type": "mascotte", "taille": 130, "html": "70 % &gt; 15 %<br>→ beaucoup"}}]},
  "comparer": {"titre": "Comparer deux produits", "scenes": [
   {"texte": "Pour comparer deux produits, je vérifie d’abord que la portion est pareille.", "visuel": deux(CEREALE_A, CEREALE_B)},
   {"texte": "Je compare le % VQ. Je cherche moins de sucres et de sodium, et plus de fibres.", "visuel": {"type": "grand", "html": "– sucres · – sodium · + fibres"}},
   {"texte": "Je lis aussi la liste des ingrédients. Le premier ingrédient, c’est celui qu’il y a le plus.", "visuel": {"type": "html", "html": BISCUITS, "dit": "Biscuits au chocolat. Ingrédients : sucre, farine de blé, huile de palme, cacao, sel, bicarbonate de sodium."}},
   {"texte": "Le truc du hibou : le sucre a plusieurs noms. Sucre, sirop, miel, glucose, dextrose.", "visuel": {"type": "mascotte", "taille": 130, "html": "sucre · sirop · miel<br>glucose · dextrose"}}]}
 },
 "questions": [
  # ---------- Ruisseau : cuisine ----------
  {"id": "R1", "station": 0, "element": "grp", "type": "tri", "truc": "t1",
   "titre": "Trie les aliments dans leur <b>groupe</b>.", "resume": "Trier 6 aliments dans les 3 groupes",
   "boites": ["Légumes et fruits", "Grains entiers", "Protéines"],
   "etiquettes": [["Pomme", 0], ["Carottes", 0], ["Pain de blé entier", 1], ["Riz brun", 1], ["Œufs", 2], ["Lentilles", 2]],
   "explication": ["La pomme et les carottes : légumes et fruits.", "Le pain de blé entier et le riz brun : grains entiers.",
                   "Les œufs et les lentilles : protéines."]},
  {"id": "R2", "station": 0, "element": "grp", "type": "qcm", "truc": "t1",
   "titre": "Dans l’assiette santé, quelle place prennent les <b>légumes et les fruits</b> ?", "resume": "Place des légumes et fruits dans l’assiette",
   "choix": ["Le quart", "La moitié", "Presque rien"], "bonne": 1,
   "explication": ["Je pense à l’assiette du Guide alimentaire.", "Les légumes et les fruits prennent la plus grande place.",
                   "C’est la moitié de l’assiette."]},
  {"id": "R3", "station": 0, "element": "grp", "type": "vf", "truc": "t1",
   "titre": "Le <b>yogourt nature</b> va dans le groupe des protéines. Vrai ou faux ?", "resume": "Yogourt : groupe des protéines ?",
   "reponse": True,
   "explication": ["Dans le Guide alimentaire, il y a 3 groupes.", "Le lait, le yogourt et le fromage sont avec les protéines.",
                   "C’est vrai !"]},
  # ---------- Ruisseau : cafétéria ----------
  {"id": "R4", "station": 1, "element": "occ", "type": "tri", "truc": "t2",
   "titre": "À la cafétéria, trie : <b>tous les jours</b> ou <b>d’occasion</b> ?", "resume": "Trier 6 aliments : tous les jours ou d’occasion",
   "boites": ["Tous les jours", "D’occasion"],
   "etiquettes": [["Pomme", 0], ["Frites", 1], ["Yogourt nature", 0], ["Beigne", 1], ["Sandwich au poulet sur pain de blé entier", 0], ["Boisson gazeuse", 1]],
   "explication": ["La pomme, le yogourt nature et le sandwich viennent des 3 groupes : tous les jours.",
                   "Les frites ont beaucoup de gras et de sel : d’occasion.",
                   "Le beigne et la boisson gazeuse ont beaucoup de sucre : d’occasion."]},
  {"id": "R5", "station": 1, "element": "occ", "type": "qcm", "truc": "t2",
   "titre": "Quelle boisson choisir <b>tous les jours</b> ?", "resume": "Boisson de tous les jours",
   "choix": ["Une boisson gazeuse", "De l’eau", "Une boisson énergisante"], "bonne": 1,
   "explication": ["La boisson gazeuse a beaucoup de sucre : d’occasion.", "La boisson énergisante n’est pas conseillée pour les jeunes.",
                   "Le Guide alimentaire dit : l’eau, tous les jours."]},
  # ---------- Rivière : dépanneur ----------
  {"id": "V1", "station": 2, "element": "tvn", "type": "qcm", "truc": "t3",
   "titre": "Regarde le tableau des croustilles. Quelle est la <b>portion</b> ?", "resume": "Croustilles : trouver la portion",
   "visuel": tn(CROUSTILLES),
   "choix": ["1 sac (40 g)", "210 calories", "280 mg"], "bonne": 0,
   "explication": ["La portion est en haut du tableau.", "Je lis : pour 1 sac (40 g).", "Tous les nombres du tableau sont pour 1 sac."]},
  {"id": "V2", "station": 2, "element": "tvn", "type": "num", "truc": "t3", "unite": "g",
   "titre": "Combien de grammes de <b>sucres</b> dans la bouteille ?", "resume": "Boisson gazeuse 591 mL : grammes de sucres",
   "visuel": tn(BOISSON),
   "accepteMin": 65, "accepteMax": 65,
   "explication": ["La portion : 1 bouteille de 591 mL.", "Je trouve la ligne Sucres : 65 g.",
                   "65 g, c’est environ 16 cuillères à thé de sucre !"]},
  {"id": "V3", "station": 2, "element": "tvn", "type": "ordre", "truc": "t3",
   "titre": "Remets les étapes dans l’ordre pour <b>lire un tableau</b>.", "resume": "Ordonner les étapes de lecture du tableau",
   "etapes": ["Je regarde la portion.", "Je trouve les sucres, le sodium et les fibres.", "Je lis le % VQ à droite.", "Je décide : c’est peu ou beaucoup ?"],
   "explication": ["Je regarde la portion.", "Je trouve les sucres, le sodium et les fibres.", "Je lis le % VQ à droite.", "Je décide : c’est peu ou beaucoup ?"]},
  # ---------- Rivière : casse-croûte ----------
  {"id": "V4", "station": 3, "element": "vq", "type": "curseur", "truc": "t4", "unite": "%",
   "titre": "À partir de combien de <b>% VQ</b>, c’est <b>beaucoup</b> ?", "resume": "Repère : beaucoup = 15 % ou plus",
   "min": 0, "max": 30, "pas": 1, "depart": 0, "accepteMin": 15, "accepteMax": 15,
   "explication": ["Je me rappelle le truc du hibou.", "5 % ou moins, c’est peu.", "15 % ou plus, c’est beaucoup."]},
  {"id": "V5", "station": 3, "element": "vq", "type": "vf", "truc": "t4",
   "titre": "La poutine moyenne a <b>70 %</b> de sodium. C’est <b>beaucoup</b> de sodium. Vrai ou faux ?", "resume": "Poutine : sodium 70 % VQ",
   "reponse": True,
   "explication": ["Je compare 70 % avec 15 %.", "70 %, c’est plus que 15 %.", "C’est vrai : c’est beaucoup de sodium (de sel)."]},
  {"id": "V6", "station": 3, "element": "vq", "type": "tri", "truc": "t4",
   "titre": "Trie : <b>peu</b> ou <b>beaucoup</b> ?", "resume": "Trier 6 % VQ : peu ou beaucoup",
   "boites": ["Peu (5 % ou moins)", "Beaucoup (15 % ou plus)"],
   "etiquettes": [["Burger : sodium 45 %", 1], ["Salade du jardin : sodium 3 %", 0], ["Lait au chocolat : sucres 26 %", 1],
                  ["Eau : sucres 0 %", 0], ["Lait frappé : sucres 70 %", 1], ["Croustilles : fibres 4 %", 0]],
   "explication": ["Je regarde seulement le % VQ.", "3 %, 0 % et 4 % : 5 % ou moins, c’est peu.",
                   "45 %, 26 % et 70 % : 15 % ou plus, c’est beaucoup."]},
  {"id": "V7", "station": 3, "element": "vq", "type": "erreur", "truc": "t4",
   "titre": "Ton ami lit le tableau de la poutine. Une ligne est <b>fausse</b>. Touche-la.", "resume": "Poutine : trouver la ligne mal interprétée",
   "visuel": tn(POUTINE, repere=False),
   "lignes": [["Sodium 70 %", "beaucoup"], ["Lipides 51 %", "beaucoup"], ["Sucres 2 %", "beaucoup"], ["Calcium 19 %", "beaucoup"]],
   "fausses": [2],
   "explication": ["70 %, 51 % et 19 % : 15 % ou plus, c’est beaucoup.", "Sucres 2 % : 5 % ou moins, c’est peu.",
                   "La ligne fausse : Sucres 2 %, c’est peu, pas beaucoup."]},
  # ---------- Fleuve : épicerie ----------
  {"id": "F1", "station": 4, "element": "cho", "type": "qcm", "truc": "t5",
   "titre": "Quelles céréales sont le <b>meilleur choix</b> pour tous les jours ?", "resume": "Comparer deux céréales (30 g)",
   "visuel": deux(CEREALE_A, CEREALE_B),
   "choix": ["A · Flocons de son", "B · Céréales givrées", "C’est pareil"], "bonne": 0,
   "explication": ["La portion est pareille : 30 g.", "Fibres : A 18 %, B 4 %. A a plus de fibres.", "Sucres : A 5 %, B 12 %. A a moins de sucres.",
                   "Le sodium est presque pareil (7 % et 6 %).", "Je choisis A : les flocons de son."]},
  {"id": "F2", "station": 4, "element": "ing", "type": "qcm", "truc": "t6",
   "titre": "Dans ces biscuits, il y a <b>le plus</b> de quel ingrédient ?", "resume": "Biscuits : 1er ingrédient",
   "visuel": {"type": "html", "html": BISCUITS, "dit": "Biscuits au chocolat. Ingrédients : sucre, farine de blé, huile de palme, cacao, sel, bicarbonate de sodium."},
   "choix": ["Sucre", "Sel", "Cacao"], "bonne": 0,
   "explication": ["Je lis la liste des ingrédients.", "Le 1er ingrédient, c’est celui qu’il y a le plus.", "Le 1er ingrédient est le sucre."]},
  {"id": "F3", "station": 4, "element": "ing", "type": "num", "truc": "t6", "unite": "",
   "titre": "Combien de <b>noms de sucre</b> trouves-tu dans la barre tendre ?", "resume": "Barre tendre : compter les noms du sucre",
   "visuel": {"type": "html", "html": BARRE, "dit": "Barre tendre. Ingrédients : flocons d’avoine, sirop de glucose, sucre, huile de canola, riz soufflé, miel, dextrose, sel."},
   "accepteMin": 4, "accepteMax": 4,
   "explication": ["Je cherche les noms du sucre dans la liste.", "Sirop de glucose, sucre, miel et dextrose.",
                   "Il y a 4 noms de sucre."]},
  # ---------- Fleuve : parc ----------
  {"id": "F4", "station": 5, "element": "cho", "type": "qcm", "truc": "t7",
   "titre": "Quelle <b>boîte à lunch</b> est la plus santé pour le pique-nique ?", "resume": "Choisir la boîte à lunch équilibrée",
   "choix": ["Wrap de blé entier au poulet, crudités, pomme, eau", "Croustilles, biscuits, boisson gazeuse", "Pain blanc, beigne, jus"], "bonne": 0,
   "explication": ["Je cherche les 3 groupes et de l’eau.", "Wrap de blé entier : grains entiers. Poulet : protéines.",
                   "Crudités et pomme : légumes et fruits. Et de l’eau.", "Je choisis la première boîte."]},
  {"id": "F5", "station": 5, "element": "grp", "type": "tri", "truc": "t7",
   "titre": "Remplis ta boîte à lunch : trie chaque aliment dans son <b>groupe</b>.", "resume": "Boîte à lunch : trier 6 aliments",
   "boites": ["Légumes et fruits", "Grains entiers", "Protéines"],
   "etiquettes": [["Bâtonnets de carottes", 0], ["Bleuets du Lac", 0], ["Wrap de blé entier", 1], ["Craquelins de grains entiers", 1],
                  ["Œuf cuit dur", 2], ["Fromage en grains", 2]],
   "explication": ["Carottes et bleuets : légumes et fruits.", "Wrap et craquelins de grains entiers : grains entiers.",
                   "Œuf et fromage en grains : protéines."]},
  {"id": "F6", "station": 5, "element": "cho", "type": "texte",
   "titre": "Décris <b>ta boîte à lunch</b> pour demain. Mets un aliment de chaque groupe et une boisson.", "resume": "Planifier sa boîte à lunch (écrit)",
   "explication": ["Légumes et fruits : des bâtonnets de concombre et une pomme.", "Grains entiers : un sandwich au pain de blé entier.",
                   "Protéines : du poulet dans mon sandwich.", "Boisson : une bouteille d’eau."]}
 ],
 "reinvest": {
  "capsules": True,
  "creation": {"titre": "Crée ta question",
               "description": "Invente une question sur l’alimentation, avec la réponse, et publie-la dans Teams. On te guide étape par étape.",
               "consigne": "Ta question peut porter sur le Guide alimentaire, le tableau de la valeur nutritive ou la liste des ingrédients. Regarde un vrai emballage chez toi !",
               "teams": {"equipe": "Alimentation saine PPS", "canal": "le canal « PPS-Z107 »"}},
  "dansBilan": False
 }
}

out = os.path.join(ICI, "alimentation.json")
json.dump(cfg, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(out)

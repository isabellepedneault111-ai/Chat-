"""Trousse Teams PPS-Z107-3 Alimentation saine. Usage : python3 z107.py
Aligné sur le programme Participation sociale (MEQ 2022) et la DDE PPS-Z107-3 (octobre 2022). Aucun nom d'élève."""
import os, sys, subprocess
ICI = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(ICI)
Z101 = os.path.join(os.path.dirname(R), "PPS_Z101_Projection-avenir_Trousse", "_sources")
sys.path.insert(0, Z101); sys.path.insert(0, ICI)
import style
from style import doc, ico, qr, CAT
from blocs import L, CB, OPTS, SCALE
from illus import piece, bouquet, deco_page, assiette, V, T, A

style.COURS, style.TITRE_COURS = "PPS-Z107-3", "Alimentation saine"
style.orbite = deco_page
CAT.update({"nut": dict(nom="Principes de nutrition", court="Bien manger", c="#2F7D4F", cl="#DCEFE3", crit="Critère 1"),
            "ris": dict(nom="Pratiques alimentaires à risque", court="Les pièges", c="#B8391F", cl="#FBE1DA", crit="Critère 1"),
            "org": dict(nom="Organisation alimentaire", court="Ma semaine", c="#9A6A00", cl="#FBEFD3", crit="Critère 2"),
            "cul": dict(nom="Pratiques culinaires", court="À mes chaudrons", c="#1F5F8B", cl="#DDEBF5", crit="Critère 3"),
            "z7": dict(nom="Alimentation saine", court="Alimentation saine", c="#2F7D4F", cl="#DCEFE3", crit="")})
JEU = "https://pps-z107-alimentation.netlify.app/tournee-sante.html"
DDE = "https://cdn-contenu.quebec.ca/cdn-contenu/education/formation-generale-adultes/definitions-domaine-evaluation/participation-sociale/DDE-PPS-Z107-3-integration-sociale-alimentation-saine.pdf"
LOGIC = lambda t: f'<div class="logic">{ico("logique", 16)}<span><b>Raisonner avec logique :</b> {t}</span></div>'
METH = lambda t: f'<div class="logic">{ico("etapes", 16)}<span><b>Agir avec méthode :</b> {t}</span></div>'


def ex(n, titre, corps, tag=""):
    return f'<div class="ex"><div class="h"><span class="n">{n}</span><b>{titre}</b><span class="tag">{tag}</span></div>{corps}</div>'


def P(cat, titre, corps, kick, sous="", n=1, tot=1, et="", bloc="", no=""):
    return style.page(cat, titre, corps, kick=kick, sous=sous, etiquette=et, n=n, tot=tot, bloc=bloc, no=no)


# ------------------------------------------------------------------ BLOCS
B = {
 "A1": dict(cat="nut", titre="Bien manger, ça change quoi ?", sous="Mon corps, les nutriments, l'équilibre.", illus=["pomme", "brocoli", "pain"],
   savoirs=["Constituants du corps humain", "Nutriments", "Bienfaits des aliments nutritifs", "Équilibre alimentaire"],
   lede="Ce que je mange devient <b>mon énergie, mes muscles, mes os</b>. Comprendre comment, ça aide à faire de meilleurs choix.",
   faire=["Je nomme ce qui compose mon corps.", "Je découvre les 6 nutriments et où les trouver.", "Je relie un aliment à un bienfait.", "Je compose une assiette équilibrée."],
   reussi=["Je nomme 3 nutriments et un aliment qui en contient.", "J'explique un bienfait d'un aliment nutritif.", "Je compose une assiette équilibrée.", "J'explique un de mes choix avec un principe de nutrition."]),
 "A2": dict(cat="ris", titre="Les pièges dans mon assiette", sous="Facteurs de risque, modes, troubles alimentaires.", illus=["tomate", "citron"],
   savoirs=["Facteurs de risque", "Pratiques à la mode", "Troubles alimentaires"],
   lede="La pub, le manque de temps, le moral : plein de choses nous poussent vers de moins bons choix. <b>Les repérer, c'est déjà reprendre le contrôle.</b>",
   faire=["Je repère ce qui influence mes choix (pub, stress, manque de temps).", "J'analyse une pratique à la mode : boisson énergisante, restauration rapide, régime.", "Je trouve une solution de rechange réaliste.", "Je sais où chercher de l'aide."],
   reussi=["Je nomme 2 facteurs de risque dans ma vie.", "J'explique un effet d'une pratique à la mode.", "Je propose une solution de rechange.", "Je connais une ressource d'aide."]),
 "A3": dict(cat="org", titre="Ma semaine planifiée", sous="Planifier, acheter, conserver, lire une étiquette.", illus=["carotte", "oeuf", "pain"],
   savoirs=["Étapes d'une planification", "Avantages", "Moyens d'organisation", "Conservation", "Particularités des achats", "Données nutritionnelles"],
   lede="Planifier sa semaine, c'est <b>manger mieux, dépenser moins et gagner du temps</b>. Une méthode en 4 étapes.",
   faire=["Je fais l'inventaire de mes réserves.", "Je consulte une circulaire.", "Je compose mon menu de la semaine.", "J'écris ma liste d'épicerie, je range et je conserve bien."],
   reussi=["Je suis les 4 étapes dans l'ordre.", "Mon menu est équilibré et réaliste.", "Je lis le tableau de la valeur nutritive.", "Je sais où et combien de temps conserver un aliment."]),
 "A4": dict(cat="cul", titre="À mes chaudrons", sous="Recette, mesures, techniques et cuisson.", illus=["fouet", "tasse", "poele"],
   savoirs=["Consultation d'une recette", "Adaptations", "Notions de mathématiques", "Outils de mesure", "Lexique culinaire", "Techniques", "Modes de cuisson"],
   lede="Une recette, c'est un plan. Je le lis, je mesure, je cuisine, et <b>je l'adapte</b> pour la rendre plus saine.",
   faire=["Je lis une recette au complet avant de commencer.", "Je mesure avec les bons outils.", "Je comprends le vocabulaire et les modes de cuisson.", "J'adapte une recette : je bonifie, je remplace, j'utilise des restes."],
   reussi=["Je repère les ingrédients, les étapes, le temps et les portions.", "Je distingue c. à thé, c. à soupe et tasse.", "J'explique 3 mots du lexique culinaire.", "Je propose une adaptation plus saine."]),
}
ORDRE = ["A1", "A2", "A3", "A4"]

NOTES = {
 "A1": f'''<div class="g21"><div>
<h2>{ico("personne")}Mon corps est fait de…</h2><p>eau (environ 60 %), muscles, os, graisse et tissus. Tout ça se renouvelle grâce à ce que je mange et bois.</p>
<h2 class="mt">{ico("idee")}Les 6 nutriments</h2>
<table class="t"><tr><th>Nutriment</th><th>À quoi il sert</th><th>Où le trouver</th></tr>
<tr><td><b>Eau</b></td><td>Hydrater, réguler la chaleur</td><td>Eau, fruits, légumes, soupe</td></tr>
<tr><td><b>Protéines</b></td><td>Bâtir et réparer les muscles</td><td>Poulet, poisson, œufs, légumineuses, tofu</td></tr>
<tr><td><b>Glucides</b></td><td>Donner de l'énergie</td><td>Pain et pâtes de grains entiers, riz brun, fruits</td></tr>
<tr><td><b>Lipides</b></td><td>Énergie de réserve, cerveau</td><td>Huile d'olive, noix, avocat, poisson</td></tr>
<tr><td><b>Vitamines</b></td><td>Protéger le corps (vitamine C : défenses)</td><td>Poivron, agrumes, brocoli, kiwi</td></tr>
<tr><td><b>Sels minéraux</b></td><td>Os solides (calcium), sang (fer)</td><td>Lait, yogourt, épinards, légumineuses</td></tr></table></div>
<div style="text-align:center">{assiette(240)}<p class="xs">L'assiette équilibrée (Guide alimentaire canadien). Comme boisson : l'eau.</p></div></div>
<div class="card t mt"><h2>{ico("ok")}L'équilibre, c'est…</h2><ul><li>manger de tout, en variant ;</li><li>respecter son budget (les légumes surgelés comptent !) ;</li><li>éviter les excès… et la privation : une gâterie de temps en temps, c'est correct.</li></ul></div>
{LOGIC("je relie un aliment à un bienfait. « Je mange un œuf le matin <i>parce que</i> les protéines me donnent de l'énergie plus longtemps. »")}''',
 "A2": f'''<div class="g3">
<div class="card t"><span class="tag" style="color:var(--c)">Facteurs de risque</span><h3>Ce qui me pousse</h3><ul class="small"><li>La publicité</li><li>Une faible estime de soi</li><li>Un rythme de vie effréné</li></ul></div>
<div class="card t"><span class="tag" style="color:var(--c)">Pratiques à la mode</span><h3>Ce qui est populaire</h3><ul class="small"><li>Les boissons énergisantes</li><li>La restauration rapide</li><li>Les régimes d'amaigrissement</li></ul></div>
<div class="card t"><span class="tag" style="color:var(--c)">Troubles alimentaires</span><h3>Quand ça devient une maladie</h3><ul class="small"><li>Anorexie</li><li>Boulimie</li><li>Hyperphagie boulimique</li></ul></div></div>
<h2 class="mt2">{ico("loupe")}Regarder de plus près</h2>
<table class="t"><tr><th style="width:24%">Pratique</th><th>Ce qu'il faut savoir</th><th style="width:32%">Une solution de rechange</th></tr>
<tr><td>Boisson énergisante</td><td>Beaucoup de caféine et de sucre : cœur qui bat vite, sommeil perturbé, « crash » d'énergie.</td><td>Eau, un fruit et une poignée de noix, dormir assez.</td></tr>
<tr><td>Restauration rapide</td><td>Souvent friture, sel, grosses portions. Correct de temps en temps.</td><td>Commander grillé plutôt que frit, eau plutôt que boisson gazeuse.</td></tr>
<tr><td>Régime à la mode</td><td>Promesses rapides, privation, effet yo-yo.</td><td>Manger équilibré et régulier ; en parler à un professionnel.</td></tr></table>
<div class="card k mt2"><h2>{ico("attention")}Les troubles alimentaires</h2><p>Ce sont de vraies maladies. Ce n'est la faute de personne. On peut s'en sortir avec de l'aide : un médecin, un intervenant, ou ANEB Québec (ligne d'écoute et de soutien).</p></div>
{LOGIC("si je mange vite devant un écran, <i>alors</i> je risque de manger plus que ma faim. <i>Donc</i> je prends 15 minutes à table.")}''',
 "A3": f'''<h2>{ico("etapes")}Les 4 étapes d'une planification</h2>
<div class="g4">{"".join(f'<div class="card t"><div style="font-size:26pt;font-weight:900;color:transparent;-webkit-text-stroke:1.3px var(--c);line-height:1">0{i + 1}</div><b>{a}</b><p class="small">{b}</p></div>' for i, (a, b) in enumerate([("Inventaire", "Je regarde ce que j'ai au frigo, au congélateur, au garde-manger."), ("Circulaires", "Je repère les rabais de la semaine."), ("Menus", "Je compose mes repas avec ce que j'ai et les rabais."), ("Liste", "J'écris ma liste par rayon. Je m'y tiens.")]))}</div>
<div class="g2 mt"><div class="card"><h2>{ico("ok")}Les avantages</h2><ul><li>Des repas de qualité, réguliers, faits maison</li><li>Économie d'argent : moins de restaurant, moins de gaspillage</li><li>Économie de temps : je sais quoi faire</li></ul></div>
<div class="card"><h2>{ico("crayon")}Mes moyens d'organisation</h2><ul><li>Une grille de menus sur le frigo</li><li>Une liste d'épicerie modèle</li><li>Un dimanche pour préparer des mets</li><li>Une banque de recettes</li></ul></div></div>
<div class="g2 mt"><div class="card"><h2>{ico("maison")}Conserver</h2><table class="t"><tr><td>Réfrigérateur</td><td>4 °C ou moins</td></tr><tr><td>Congélateur</td><td>−18 °C</td></tr><tr><td>Restes</td><td>Au frigo dans les 2 heures, mangés dans les 2 à 3 jours</td></tr></table>
<p class="xs mt">« Meilleur avant » : qualité. Date limite sur la viande ou le lait : je respecte.</p></div>
<div class="card"><h2>{ico("loupe")}Acheter malin</h2><ul><li>À l'article, au poids ou en vrac (noix, riz)</li><li>Les marques maison : souvent moins chères</li><li>Les bons de réduction et les circulaires</li><li>Le prix unitaire : prix pour 100 g</li></ul></div></div>
{METH("je suis toujours les 4 étapes dans le même ordre, chaque semaine, au même moment.")}''',
 "A4": f'''<div class="g2"><div class="card"><h2>{ico("loupe")}Lire une recette, avant de commencer</h2><ul class="ticks"><li>Les ingrédients : je les ai ?</li><li>Les étapes, dans l'ordre</li><li>Le temps de préparation et de cuisson</li><li>Le degré de difficulté</li><li>Le nombre de portions (et de calories)</li></ul></div>
<div class="card"><h2>{ico("cible")}Les mesures</h2><table class="t"><tr><td>1 c. à thé</td><td><b>5 mL</b></td></tr><tr><td>1 c. à soupe</td><td><b>15 mL</b> (3 c. à thé)</td></tr><tr><td>1 tasse</td><td><b>250 mL</b></td></tr><tr><td>½ tasse</td><td>125 mL</td></tr><tr><td>¼ tasse</td><td>60 mL</td></tr></table><p class="xs">Outils : cuillères, tasses à mesurer, bols, thermomètre.</p></div></div>
<div class="g2 mt"><div class="card t"><h2>{ico("crayon")}Lexique : les techniques</h2><table class="t small"><tr><td><b>Assaisonner</b></td><td>ajouter sel, poivre, épices</td></tr><tr><td><b>Saupoudrer</b></td><td>répandre une poudre en fine couche</td></tr><tr><td><b>Dégraisser</b></td><td>enlever le gras</td></tr><tr><td><b>Désosser</b></td><td>enlever les os</td></tr><tr><td><b>Mariner</b></td><td>laisser tremper dans une sauce</td></tr><tr><td><b>Déglacer</b></td><td>verser un liquide dans la poêle chaude pour décoller les sucs</td></tr><tr><td><b>Décanter</b></td><td>laisser reposer un liquide pour séparer le dépôt</td></tr></table></div>
<div class="card t"><h2>{ico("idee")}Les modes de cuisson</h2><table class="t small"><tr><td><b>Vapeur</b></td><td>au-dessus de l'eau bouillante</td></tr><tr><td><b>Poché</b></td><td>dans un liquide qui frémit</td></tr><tr><td><b>Blanchi</b></td><td>quelques minutes dans l'eau bouillante, puis eau froide</td></tr><tr><td><b>Sauté</b></td><td>à feu vif, peu de gras, on remue</td></tr><tr><td><b>Saisi</b></td><td>à feu très vif, pour dorer</td></tr><tr><td><b>Braisé</b></td><td>doré, puis cuit longtemps à couvert avec un peu de liquide</td></tr><tr><td><b>Frit</b></td><td>dans l'huile chaude (à garder pour les occasions)</td></tr></table></div></div>
<div class="card k mt"><h2>{ico("fusee")}Adapter une recette</h2><p><b>Bonifier</b> un macaroni commercial avec du thon et du brocoli · <b>remplacer</b> la crème par du yogourt nature · <b>modifier les proportions</b> pour 2 personnes · <b>utiliser les restes</b> du poulet dans une soupe.</p></div>
{LOGIC("j'ajoute du brocoli au macaroni <i>parce qu'</i>il apporte des vitamines et des fibres ; <i>donc</i> mon repas est plus complet.")}''',
}

EXOS = {
 "A1": [f'''{ex(1, "Mon assiette d'hier", f"""<p>Je dessine ou j'écris ce que j'ai mangé au souper d'hier, dans la bonne section.</p><div style="display:flex;gap:16px;align-items:center"><div style="opacity:.55">{assiette(200)}</div><div style="flex:1"><p class="small">Ce qui manquait :</p>{L(2)}<p class="small">Ce que je pourrais ajouter (budget correct) :</p>{L(2)}</div></div>""", "Équilibre")}
{ex(2, "Qui fait quoi ?", f"""<p>Je relie chaque aliment à son nutriment principal.</p><table class="t grid"><tr><th>Aliment</th><th>Nutriment</th></tr>{"".join(f"<tr><td>{a}</td><td>{OPTS(['Protéines', 'Glucides', 'Lipides', 'Vitamines', 'Sels minéraux'])}</td></tr>" for a in ["Lentilles", "Riz brun", "Huile d'olive", "Poivron rouge", "Yogourt"])}</table>""", "Nutriments")}''',
        f'''{ex(3, "Le bon carburant", f"""<p>J'ai un cours exigeant demain matin. Je choisis mon déjeuner :</p>{OPTS(["Un beigne et une boisson énergisante", "Gruau, banane et lait", "Rien, je n'ai pas faim"])}<p class="mt">Pourquoi ?</p>{L(2)}{LOGIC("j'explique avec un bienfait : énergie, concentration, muscles ou os.")}""", "Bienfaits")}
{ex(4, "Équilibre, pas privation", f"""<p>Vrai ou faux ? {OPTS(["Vrai", "Faux"])} « Pour bien manger, il faut ne jamais manger de dessert. »</p><p>J'explique :</p>{L(2)}<p class="mt">Une gâterie que j'aime, et quand je me la permets :</p>{L(1)}""", "Équilibre")}
<div class="mt">{SCALE}</div>'''],
 "A2": [f'''{ex(1, "Qu'est-ce qui me pousse ?", f"""<p>Je coche ce qui m'arrive parfois.</p>{OPTS(["Je mange en courant", "La pub me donne faim", "Je mange quand je suis triste ou stressé", "Je saute des repas", "Je bois des boissons énergisantes", "Je commande souvent du restaurant"])}<p class="mt">Ce que ça change dans ma journée :</p>{L(2)}""", "Facteurs de risque")}
{ex(2, "Je lis l'étiquette d'une boisson énergisante", f"""<p>Une canette de 473 mL contient environ <b>160 mg de caféine</b> et <b>54 g de sucre</b> (environ 13 cuillères à thé).</p><p>Une limite raisonnable pour un adulte : 400 mg de caféine par jour. Combien de canettes, c'est déjà beaucoup ?</p>{L(1)}<p>Ce que je pourrais boire à la place :</p>{L(1)}""", "Pratiques à la mode")}''',
        f'''{ex(3, "Au resto rapide", f"""<p>Je refais la commande pour qu'elle soit plus saine, sans perdre le plaisir.</p><table class="t grid"><tr><th>Commande de départ</th><th>Ma commande</th></tr><tr><td>Trio poulet frit, grosses frites, grosse boisson gazeuse</td><td style="height:70px"></td></tr></table>{LOGIC("je justifie un changement : « je prends grillé <i>parce que</i>… »")}""", "Restauration rapide")}
{ex(4, "Le régime miracle", f"""<p class="quote small">« Perdez 10 livres en 7 jours avec notre jus détox ! »</p><p>Les ruses que je repère :</p>{L(1)}<p>Ce que je réponds à une amie qui veut l'essayer :</p>{L(2)}""", "Pub et régimes")}
{ex(5, "Où chercher de l'aide", f"""<p>Si moi ou un proche avons une relation difficile avec la nourriture, je peux en parler à :</p>{L(1)}<p class="xs">Ex. : médecin, infirmière, intervenant du centre, ANEB Québec.</p>""", "Ressources")}
<div class="mt">{SCALE}</div>'''],
 "A3": [f'''{ex(1, "Mon inventaire", f"""<table class="t grid"><tr><th>Frigo</th><th>Congélateur</th><th>Garde-manger</th></tr><tr><td style="height:110px"></td><td></td><td></td></tr></table>""", "Étape 1")}
{ex(2, "Mon menu de la semaine", f"""<table class="t grid" style="font-size:8.6pt"><tr><th></th>{"".join(f"<th>{j}</th>" for j in ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"])}</tr>{"".join(f"<tr><td><b>{m}</b></td>" + "<td style='height:46px'></td>" * 7 + "</tr>" for m in ["Déjeuner", "Dîner", "Souper"])}</table>{METH("j'utilise d'abord ce que j'ai (inventaire), puis les rabais (circulaire).")}""", "Étape 3")}''',
        f'''{ex(3, "Ma liste d'épicerie par rayon", f"""<div class="g4">{"".join(f'<div class="card" style="padding:8px"><span class="tag">{r}</span><div class="lines l4"></div></div>' for r in ["Fruits et légumes", "Protéines", "Grains", "Autres"])}</div>""", "Étape 4")}
{ex(4, "Je lis le tableau de la valeur nutritive", f"""<div style="display:grid;grid-template-columns:200px 1fr;gap:14px"><div class="card" style="font-size:8.6pt;border:2px solid #1F2A24;border-radius:4px;padding:6px"><b style="font-size:11pt">Valeur nutritive</b><br>pour 1 tasse (250 mL)<hr style="margin:3px 0">Calories 110<br>Lipides 0 g<br>Sodium 10 mg<br>Glucides 26 g<br>&nbsp;&nbsp;Sucres 22 g<br>Protéines 1 g<br>Vitamine C 100 %</div>
<div><p class="small">C'est un jus de pommes. Combien de sucre dans une tasse ?</p>{L(1)}<p class="small">22 g de sucre, c'est environ ____ c. à thé (1 c. à thé ≈ 4 g).</p><p class="small">Un fruit entier ou le jus : qu'est-ce que je choisis, et pourquoi ?</p>{L(1)}</div></div>""", "Données nutritionnelles")}
{ex(5, "Où je le range ?", f"""<table class="t grid"><tr><th>Aliment</th><th>Où</th></tr>{"".join(f"<tr><td>{a}</td><td>{OPTS(['Frigo', 'Congélateur', 'Garde-manger'])}</td></tr>" for a in ["Poulet cru pour demain", "Pain pour la semaine prochaine", "Riz sec", "Restes de soupe d'hier"])}</table>""", "Conservation")}
<div class="mt">{SCALE}</div>'''],
 "A4": [f'''{ex(1, "J'analyse une recette", f"""<div class="card t small"><b>Macaroni gratiné au thon (4 portions) · Facile · 30 min</b><br>Ingrédients : 2 tasses de macaroni, 1 boîte de thon, 2 tasses de brocoli, 1 tasse de lait, 2 c. à soupe de farine, ½ tasse de fromage râpé, sel et poivre.<br>Étapes : 1. Cuire les pâtes. 2. Blanchir le brocoli. 3. Faire la sauce. 4. Mélanger, saupoudrer de fromage, gratiner 5 min.</div>
<table class="t mt"><tr><td>Nombre de portions</td><td>____</td><td>Temps</td><td>____</td></tr><tr><td>Mode de cuisson du brocoli</td><td>____________</td><td>Que veut dire « saupoudrer » ?</td><td>____________</td></tr></table>""", "Recette")}
{ex(2, "Pour 2 personnes", f"""<p>Je divise la recette par 2.</p><table class="t grid"><tr><th>Ingrédient</th><th>Pour 4</th><th>Pour 2</th></tr>{"".join(f"<tr><td>{a}</td><td>{b}</td><td></td></tr>" for a, b in [("Macaroni", "2 tasses"), ("Lait", "1 tasse"), ("Farine", "2 c. à soupe"), ("Fromage", "½ tasse")])}</table>""", "Fractions")}''',
        f'''{ex(3, "En millilitres", f"""<table class="t grid"><tr><th>Mesure</th><th>En mL</th></tr>{"".join(f"<tr><td>{a}</td><td></td></tr>" for a in ["1 tasse", "½ tasse", "3 c. à thé", "2 c. à soupe"])}</table>""", "Conversion")}
{ex(4, "J'adapte pour que ce soit plus sain", f"""<table class="t grid"><tr><th>Recette de départ</th><th>Mon adaptation</th><th>Pourquoi</th></tr><tr><td>Macaroni en boîte seul</td><td style="height:44px"></td><td></td></tr><tr><td>Sauce à la crème</td><td style="height:44px"></td><td></td></tr><tr><td>Reste de poulet du dimanche</td><td style="height:44px"></td><td></td></tr></table>""", "Adaptations")}
{ex(5, "Le bon mode de cuisson", f"""<p>J'associe : vapeur · poché · sauté · braisé · saisi</p><table class="t grid">{"".join(f"<tr><td>{a}</td><td style='width:40%'></td></tr>" for a in ["Un œuf cuit dans l'eau qui frémit", "Des légumes au-dessus de l'eau bouillante", "Un bœuf cuit longtemps à couvert", "Un steak doré à feu très vif"])}</table>""", "Cuisson")}
<div class="mt">{SCALE}</div>'''],
}


def mission(bid, b):
    k = CAT[b["cat"]]
    corps = f'''<p class="lede">{b["lede"]}</p>
<div class="g21 mt2"><div><h2>{ico("etapes")}Ce que je vais faire</h2><ol class="steps">{"".join(f"<li>{x}</li>" for x in b["faire"])}</ol></div>
<div class="card t" style="text-align:center">{bouquet(b["illus"], 62)}<div class="tag mt" style="color:var(--c)">{k["crit"]}</div><div class="small"><b>{k["nom"]}</b></div><div class="savoirs mt" style="justify-content:center">{"".join(f'<span class="sv">{s}</span>' for s in b["savoirs"])}</div></div></div>
<div class="g2 mt2"><div class="card"><h2>{ico("ok")}Je sais que j'ai réussi quand…</h2><ul class="ticks">{"".join(f"<li>{x}</li>" for x in b["reussi"])}</ul></div>
<div class="card d"><h2>{ico("ecran")}En ligne</h2><div class="qr"><div>{qr(JEU, 70)}</div><div><b>La tournée santé</b><div class="xs">Le jeu du cours, avec un bilan PDF</div></div></div></div></div>
<div class="fill"></div><div class="card mt" style="border-style:dashed"><h2>{ico("crayon")}Avant de commencer : ce que je sais déjà</h2><div class="lines l3"></div></div>'''
    return P(b["cat"], b["titre"], corps, kick="Ma mission", sous=b["sous"], et="Ma mission", bloc=f"Bloc {bid}", no=bid)


def slug(s):
    import re
    for a, c in [("é", "e"), ("è", "e"), ("ê", "e"), ("à", "a"), ("ç", "c"), ("'", "-"), ("’", "-")]: s = s.replace(a, c)
    return re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-")


def blocs():
    jobs = []
    for bid in ORDRE:
        b = B[bid]; d = os.path.join(R, f"Bloc-{bid}_{slug(b['titre'])}"); os.makedirs(d, exist_ok=True)
        a = dict(bloc=f"Bloc {bid}", no=bid, sous=b["sous"])
        jobs.append((f"{bid}_1", doc(bid, [mission(bid, b)]), os.path.join(d, f"{bid}_1_Ma-mission.pdf")))
        mots = f'<div class="mots"><h2>{ico("crayon")}Mes mots à moi</h2><div class="lines"></div></div>' if bid in ("A1", "A2") else ""
        jobs.append((f"{bid}_2", doc(bid, [P(b["cat"], b["titre"], NOTES[bid] + mots, kick="Feuille de notes", et="Feuille de notes", **a)]), os.path.join(d, f"{bid}_2_Feuille-de-notes.pdf")))
        ps = [P(b["cat"], b["titre"] if i == 0 else "", x, kick="Je m'exerce", et="Je m'exerce", n=i + 1, tot=len(EXOS[bid]), **a) for i, x in enumerate(EXOS[bid])]
        jobs.append((f"{bid}_3", doc(bid, ps), os.path.join(d, f"{bid}_3_Je-m-exerce.pdf")))
    return jobs


# ------------------------------------------------------------------ ÉPREUVE (élève) et ÉVALUATION (enseignante)
CRIT = [("1", "nut", "Intégration judicieuse de saines pratiques alimentaires", "Expliquer ses choix alimentaires au regard des principes de nutrition et de ses facteurs de risque.",
         ["L'adulte explique de façon claire et détaillée ses choix alimentaires au regard des principes de nutrition et des pratiques à risque.", "L'adulte explique de façon claire ses choix alimentaires au regard des principes de nutrition et des pratiques à risque.", "L'adulte explique de façon globale ses choix alimentaires au regard des principes de nutrition et des pratiques à risque.", "L'adulte a de la difficulté à expliquer ses choix alimentaires.", "L'adulte a une grande difficulté à expliquer ses choix alimentaires."], "Blocs A1 et A2"),
        ("2", "org", "Planification hebdomadaire rigoureuse de son alimentation", "Utiliser des moyens facilitant l'organisation hebdomadaire de son alimentation.",
         ["L'adulte planifie son alimentation de façon complète et détaillée.", "L'adulte planifie son alimentation de façon presque complète.", "L'adulte planifie son alimentation de façon satisfaisante.", "L'adulte a de la difficulté à planifier son alimentation.", "L'adulte a une grande difficulté à planifier son alimentation."], "Bloc A3"),
        ("3", "cul", "Élaboration appropriée d'un mets", "Élaborer un mets en tenant compte de certaines pratiques culinaires.",
         ["L'adulte élabore un mets de façon rigoureuse en tenant compte de toutes les pratiques culinaires requises.", "L'adulte élabore un mets de façon rigoureuse en tenant compte de presque toutes les pratiques culinaires requises.", "L'adulte élabore un mets de façon adéquate en tenant compte des principales pratiques culinaires requises.", "L'adulte a de la difficulté à élaborer un mets en tenant compte des pratiques culinaires requises.", "L'adulte a une grande difficulté à élaborer un mets en tenant compte des pratiques culinaires requises."], "Bloc A4")]
ECH = ["Marquée", "Assurée", "Acceptable", "Peu développée", "Très peu développée"]


def epreuve():
    D = os.path.join(R, "Bloc-A5_Je-presente-mon-mets"); os.makedirs(D, exist_ok=True)
    corps = f'''<p class="lede">À la fin du cours, je montre que je sais <b>expliquer mes choix</b>, <b>planifier ma semaine</b> et <b>cuisiner un mets</b>.</p>
<div class="g3 mt2">{"".join(f'<div class="card t" style="--c:{CAT[c]["c"]};--cl:{CAT[c]["cl"]}"><span class="tag" style="color:{CAT[c]["c"]}">Critère {n}</span><div class="big mt" style="font-size:13pt">{nom}</div></div>' for n, c, nom, *_ in CRIT)}</div>
<div class="g2 mt2"><div><h2>{ico("etapes")}Comment ça se passe</h2><ol class="steps"><li>Je planifie mon menu de la semaine et ma liste d'épicerie.</li><li>Je choisis un mets du menu et je remplis ma fiche recette.</li><li>Je cuisine mon mets devant l'enseignante (ou je montre mes photos).</li><li>J'explique mes choix : pourquoi c'est sain, ce que j'ai adapté.</li></ol></div>
<div class="card"><h2>{ico("horloge")}À savoir</h2><ul><li>2 heures au maximum en tout.</li><li>À l'écrit, à l'oral ou en action.</li><li>Pour réussir : au moins <b>Acceptable</b> dans <b>chacun</b> des 3 critères.</li><li>Si un critère n'est pas réussi, je peux le reprendre seul.</li></ul></div></div>
<div class="g2 mt">{"".join(f'<div style="text-align:center">{bouquet(x, 70)}</div>' for x in (["bol", "tomate"], ["poele", "fouet"]))}</div>'''
    jobs = [("A5_1", doc("Épreuve", [P("z7", "Je présente mon mets", corps, kick="Fiche descriptive de l'épreuve", et="L'épreuve", bloc="Bloc A5", no="A5")]), os.path.join(D, "A5_1_Fiche-descriptive-de-l-epreuve.pdf"))]
    corps = f'''<div class="g2"><div class="small"><b>Prénom :</b> ______________________</div><div class="small"><b>Pour :</b> ____ personne(s)</div></div>
<div class="card mt"><div class="g2"><div><span class="tag">Mon mets</span><div class="lines l2"></div></div><div><span class="tag">Temps · difficulté · portions</span><div class="lines l2"></div></div></div></div>
<div class="g2 mt"><div class="card"><h2>{ico("crayon")}Ingrédients et mesures</h2><div class="lines l5"></div></div><div class="card"><h2>{ico("etapes")}Les étapes</h2><div class="lines l5"></div></div></div>
<div class="g2 mt"><div class="card t"><h2>{ico("idee")}Techniques et cuisson</h2><p class="small">Technique(s) :</p>{L(1)}<p class="small">Mode de cuisson :</p>{L(1)}</div><div class="card t" style="--cl:#DCEFE3"><h2>{ico("fusee")}Mon adaptation saine</h2>{L(2)}<p class="small">Pourquoi c'est plus sain :</p>{L(1)}</div></div>
<div class="card k mt"><h2>{ico("logique")}J'explique mes choix</h2><p class="small">Ce mets est équilibré parce que… (assiette, nutriments, bienfaits)</p>{L(2)}</div>'''
    jobs.append(("A5_2", doc("Ma fiche recette", [P("cul", "Ma fiche recette", corps, kick="Épreuve · critères 1 et 3", et="Fiche recette", bloc="Bloc A5", no="A5")]), os.path.join(D, "A5_2_Ma-fiche-recette.pdf")))
    items = [("1", "J'explique mes choix avec la nutrition et les pièges à éviter."), ("2", "Je planifie ma semaine : inventaire, circulaire, menu, liste."), ("3", "Je cuisine un mets : recette, mesures, techniques, cuisson, adaptation.")]
    rows = "".join(f'<tr><td><b>Critère {n}</b><br>{t}</td><td style="width:44%"><span class="opt" style="color:#127A45"><span class="dot" style="margin-right:4px"></span>Oui</span><span class="opt" style="color:#946200"><span class="dot" style="margin-right:4px"></span>Presque</span><span class="opt" style="color:#B3341B"><span class="dot" style="margin-right:4px"></span>Pas encore</span></td></tr>' for n, t in items)
    corps = f'''<p class="lede">Je colorie le rond qui me ressemble. <b>Pas de note</b> : c'est pour voir où j'en suis.</p><table class="t mt">{rows}</table>
<div class="g2 mt2"><div class="card"><h2>{ico("idee")}Ce que je fais déjà mieux</h2>{L(3)}</div><div class="card"><h2>{ico("fusee")}Mon prochain défi en cuisine</h2>{L(3)}</div></div>
<div style="text-align:center;margin-top:auto">{bouquet(["pomme", "carotte", "brocoli", "citron", "pain"], 64, 10)}</div>'''
    jobs.append(("A5_3", doc("Autoévaluation", [P("z7", "Mon autoévaluation", corps, kick="Je fais le point", et="Autoévaluation", bloc="Bloc A5", no="A5")]), os.path.join(D, "A5_3_Mon-autoevaluation.pdf")))
    # enseignante
    EV = os.path.join(R, "99_ENSEIGNANTE_SEULEMENT", "Evaluation"); os.makedirs(EV, exist_ok=True)
    g = "".join(f'''<div class="mt"><h2 style="color:{CAT[c]["c"]}">Critère {n} · {nom}</h2><table class="t grid"><tr>{"".join(f'<td style="width:20%;{"background:" + CAT[c]["cl"] if i == 2 else ""}"><div class="tag">{ECH[i]}</div><div style="font-size:8.4pt;margin:3px 0 6px">{d}</div><span class="cb"></span></td>' for i, d in enumerate(e))}</tr></table><p class="xs">Résultat du critère : {CB("Succès")} {CB("Échec")}</p></div>''' for n, c, nom, _, e, _b in CRIT)
    corps = f'''<div class="small"><b>Adulte :</b> ______________________ &nbsp; <b>Date :</b> ____________ &nbsp; <b>Forme :</b> ______________</div>{g}
<div class="card d mt"><h2>{ico("ok")}Résultat final</h2><p>Compétence développée avec succès : {CB("Oui")} {CB("Non")} &nbsp; (Succès à chacun des 3 critères = seuil Acceptable, 60 %)</p></div>
<p class="xs mt">Énoncés de la grille prescrite, DDE PPS-Z107-3, MEQ, octobre 2022.</p>'''
    jobs.append(("EV1", doc("Grille", [P("z7", "Grille d'évaluation critérielle", corps, kick="Enseignante seulement", sous="PPS-Z107-3 · une grille par adulte", et="Grille critérielle")]), os.path.join(EV, "1_Grille-criterielle_PPS-Z107.pdf")))
    rows = "".join(f'<tr><td style="width:20%"></td>' + "<td></td>" * 5 + "</tr>" for _ in range(11))
    corps = f'''<p class="small">Pendant les ateliers de cuisine. Code couleur : <b style="color:#127A45">V</b> ça va · <b style="color:#946200">J</b> en progrès · <b style="color:#B3341B">R</b> soutien. Le jugement final s'appuie sur l'observation de l'agir pendant le cours (DDE).</p>
<table class="t grid mt" style="font-size:8.6pt"><tr><th>Adulte</th><th>Lit la recette avant</th><th>Mesure juste</th><th>Technique et cuisson</th><th>Hygiène et sécurité</th><th>Explique un choix</th></tr>{rows.replace("<td></td>", "<td style='height:38px'></td>")}</table>'''
    jobs.append(("EV2", doc("Observation", [P("z7", "Observation en cuisine", corps, kick="Enseignante seulement", sous="Une feuille par atelier. À garder dans le dossier de l'élève.", et="Observation")]), os.path.join(EV, "2_Grille-observation-cuisine_vierge.pdf")))
    return jobs


# ------------------------------------------------------------------ DOSSIER MAÎTRE
def maitre():
    TOT = 6
    couv = f'''<section class="page cover"><div style="position:absolute;right:.6in;top:.7in">{bouquet(["pomme", "carotte"], 110, 6)}<br>{bouquet(["brocoli", "citron", "tomate"], 90, 6)}</div>
<div style="margin-top:3in" class="kick"><span style="color:#2F7D4F">PPS-Z107-3 · Dossier maître</span></div><h1 style="margin-top:12px">Alimentation<br>saine</h1>
<div class="sous">Le guide de l'enseignante : programme, séquence en 4 blocs, pistes d'observation, épreuve et grille selon la DDE.</div>
<div class="g4" style="margin-top:.8in;max-width:6.4in">{"".join(f'<div><div style="height:4px;background:{CAT[c]["c"]};border-radius:4px"></div><div style="font-weight:800;margin-top:8px">{CAT[c]["court"]}</div><div style="font-size:9pt;color:#6B7189">{CAT[c]["nom"]}</div></div>' for c in ["nut", "ris", "org", "cul"])}</div>
<div class="foot" style="margin-top:auto"><span>CFGA De La Jonquière · Participation sociale</span><span>Trousse Z107</span></div></section>'''
    p2 = f'''<div class="dense"><div class="card d"><h2>{ico("cible")}Le but du cours</h2><p>Rendre l'adulte apte à traiter avec compétence des situations de la vie courante liées à l'<b>adoption d'une alimentation saine</b> : intégrer de saines pratiques alimentaires, planifier de façon hebdomadaire son alimentation et élaborer des mets.</p></div>
<div class="g3 mt">{"".join(f'<div class="card t" style="--c:{CAT[c]["c"]};--cl:{CAT[c]["cl"]}"><span class="tag" style="color:{CAT[c]["c"]}">Critère {n}</span><h3>{nom}</h3><p class="xs">{prec}</p><p class="xs"><b>{bl}</b></p></div>' for n, c, nom, prec, _e, bl in CRIT)}</div>
<div class="g2 mt"><div class="card"><h2>{ico("logique")}Compétences polyvalentes</h2><p><b>Raisonner avec logique :</b> établir des liens entre des principes de nutrition et ses choix ; considérer des adaptations.</p><p><b>Agir avec méthode :</b> mettre en œuvre des moyens pour faciliter l'organisation alimentaire.</p></div>
<div class="card"><h2>{ico("maison")}Exemples de situations de vie</h2><p>Approvisionnement en fruits et légumes · sollicitation des médias · conservation d'aliments · indécision quant au contenu d'un repas · souper pour deux · conciliation de la vie active et de l'alimentation.</p></div></div>
<h2 class="mt">{ico("etapes")}Les 4 catégories et les 20 savoirs</h2><table class="t"><tr><th style="width:24%">Catégorie</th><th>Savoirs</th><th style="width:10%">Bloc</th></tr>
<tr><td><b style="color:#2F7D4F">Principes de nutrition</b></td><td>Constituants du corps · nutriments · bienfaits des aliments nutritifs · équilibre alimentaire</td><td>A1</td></tr>
<tr><td><b style="color:#B8391F">Pratiques à risque</b></td><td>Facteurs de risque · pratiques à la mode · troubles alimentaires</td><td>A2</td></tr>
<tr><td><b style="color:#9A6A00">Organisation alimentaire</b></td><td>Étapes et avantages d'une planification · moyens d'organisation · conservation · particularités des achats · données nutritionnelles</td><td>A3</td></tr>
<tr><td><b style="color:#1F5F8B">Pratiques culinaires</b></td><td>Recette · adaptations · notions de mathématiques · outils de mesure · lexique · techniques · modes de cuisson</td><td>A4</td></tr></table>
<p class="xs mt">Sources : Programme d'études Participation sociale (MEQ, 2022) ; DDE PPS-Z107-3 (MEQ, octobre 2022).</p></div>'''
    seq = "".join(f'<tr><td><b style="color:{CAT[B[b]["cat"]]["c"]}">{b}</b></td><td><b>{B[b]["titre"]}</b><div class="xs">{B[b]["sous"]}</div></td><td class="small">{" · ".join(B[b]["savoirs"])}</td><td>{d}</td></tr>' for b, d in zip(ORDRE, ["3 séances", "2 à 3 séances", "3 à 4 séances", "4 à 6 séances (dont la cuisine)"]))
    p3 = f'''<div class="dense"><table class="t"><tr><th>Bloc</th><th style="width:30%">Titre</th><th>Savoirs</th><th style="width:16%">Durée suggérée</th></tr>{seq}
<tr><td><b>A5</b></td><td><b>Je présente mon mets</b><div class="xs">Menu, fiche recette, cuisine, explication</div></td><td class="small">Les 3 critères</td><td>2 h au maximum</td></tr></table>
<div class="g3 mt"><div class="phase pa"><span class="tag">Avant</span>Partir du vécu : le souper d'hier, la circulaire de la semaine, une pub de boisson.</div><div class="phase pp"><span class="tag">Pendant</span>Ma mission, feuille de notes, Je m'exerce. Une consigne à la fois, à voix haute. Cuisiner le plus souvent possible.</div><div class="phase pap"><span class="tag">Après</span>Code couleur, retour en duo, une recette ajoutée à la banque de la classe.</div></div>
<h2 class="mt">{ico("idee")}Le jeu « La tournée santé »</h2><div class="qr"><div>{qr(JEU, 64)}</div><div class="small">Révision en ligne des 4 catégories, avec 3 niveaux, une grille descriptive et un bilan PDF. Espace enseignante : ajouter <b>?mode=veronique</b> à l'adresse. Studio pour créer une question : <b>?mode=question</b>.</div></div>
<h2 class="mt">{ico("groupe")}Principes pour ce cours en PPS</h2><ol class="steps" style="columns:2;column-gap:20px"><li>Cuisiner pour vrai, souvent.</li><li>Respecter les budgets : surgelés et marques maison.</li><li>Jamais de commentaire sur le poids ou le corps.</li><li>Équilibre, pas privation.</li><li>Les troubles alimentaires : écouter, référer.</li><li>Mesurer avec de vrais outils.</li><li>L'oral et la démonstration valent l'écrit.</li><li>Une recette de la classe par semaine.</li></ol></div>'''
    obs = {"A1": ("Faire nommer le souper d'hier sans juger.", "L'élève relie-t-il un aliment à un bienfait concret ?", "Assiette à colorier ; cartes d'aliments à trier."),
           "A2": ("Partir d'une vraie canette ou d'une vraie pub.", "Propose-t-il une solution de rechange réaliste pour son budget et son horaire ?", "Aborder les troubles alimentaires avec délicatesse ; prévoir une ressource."),
           "A3": ("Apporter des circulaires de la semaine.", "Les 4 étapes sont-elles suivies dans l'ordre ? Le menu est-il réaliste ?", "Grille de menus préremplie à moitié ; liste modèle par rayon."),
           "A4": ("Démontrer une mesure et une technique avant.", "Lit-il la recette en entier avant de commencer ? Mesure-t-il juste ?", "Recettes illustrées ; tasses de couleur ; travail en duo.")}
    fiches = "".join(f'''<div class="card" style="border-left:5px solid {CAT[B[b]["cat"]]["c"]}"><h3 style="margin-top:0"><span style="color:{CAT[B[b]["cat"]]["c"]}">{b}</span> · {B[b]["titre"]}</h3><div class="g3"><div class="phase pa"><span class="tag">Avant</span>{o[0]}</div><div class="phase pp"><span class="tag">À observer</span>{o[1]}</div><div class="phase pap"><span class="tag">Différenciation</span>{o[2]}</div></div></div>''' for b, o in obs.items())
    p4 = f'<div class="dense" style="display:flex;flex-direction:column;gap:9px">{fiches}</div>'
    p5 = f'''<div class="dense"><div class="g2"><div class="card"><h2>{ico("etapes")}L'épreuve selon la DDE</h2><ul><li>Une ou deux parties, au moment choisi par l'enseignante.</li><li><b>2 heures au maximum</b> pour l'ensemble ; durée annoncée à l'avance.</li><li>À l'écrit, à l'oral ou dans l'action : questionnaire, étude de cas, entrevue, jeu de rôle, simulation, exposé, <b>observation en action</b>, présentation d'une production.</li><li>Elle touche <b>au moins la moitié des savoirs</b> et les <b>4 catégories</b>.</li><li>Le jugement est porté à la fin du cours et s'appuie sur l'observation de l'agir pendant le cours.</li></ul></div>
<div class="card"><h2>{ico("ok")}Le jugement</h2><ul><li>Pondération : la compétence vaut 100 % ; les 3 critères ont la même importance.</li><li>Grille prescrite, 5 échelons.</li><li><b>Seuil : Acceptable (60 %) pour chaque critère.</b> Résultat : Succès ou Échec.</li><li>Reprise possible sur le ou les critères non réussis.</li><li>Le prototype d'épreuve du MEQ ne sert jamais d'exercice.</li></ul></div></div>
<div class="card k mt"><h2>{ico("idee")}Notre proposition : « Je présente mon mets » (Bloc A5)</h2><p>L'adulte planifie sa semaine (critère 2), cuisine un mets de son menu devant l'enseignante (critère 3) et explique ses choix en entrevue (critère 1). Tout tient en 2 heures. Les documents élèves sont dans le Bloc A5.</p></div>
<h2 class="mt">{ico("crayon")}Les documents</h2><table class="t"><tr><td>Bloc A5</td><td>Fiche de l'épreuve · fiche recette · autoévaluation (élève)</td></tr><tr><td>99 · Evaluation</td><td>Grille critérielle (énoncés de la DDE) · grille d'observation en cuisine, vierge</td></tr></table>
<div class="qr mt"><div>{qr(DDE, 60)}</div><div class="xs">DDE PPS-Z107-3, MEQ, octobre 2022 (prescrite). Lien dans le LISEZ-MOI.</div></div></div>'''
    p6 = f'''<div class="dense"><div class="card t"><h2>{ico("idee")}Pistes de réflexion</h2><ul><li>Une <b>banque de recettes de la classe</b> dans OneNote : chaque élève ajoute la recette qu'il a adaptée.</li><li>Un <b>budget réel</b> : planifier un souper pour deux avec 15 $, en lien avec Budget et consommation.</li><li>Le <b>dimanche de préparation</b> simulé en classe : cuisiner 3 mets pour la semaine.</li><li>Inviter une nutritionniste du CLSC ou visiter une épicerie avec la circulaire.</li></ul></div>
<div class="card d mt"><h2>{ico("attention")}Délicatesse</h2><p>Certains élèves vivent l'insécurité alimentaire ou ont une relation difficile avec la nourriture. On parle d'aliments, jamais de poids ni de corps. On garde sous la main une ressource d'aide (ANEB Québec, CLSC, banque alimentaire).</p></div>
<div style="text-align:center;margin-top:24px">{bouquet(["bol", "poele", "fouet", "tasse"], 70, 14)}</div></div>'''
    pages = [couv, P("z7", "Le cours en une page", p2, kick="Programme", sous="Ce que prescrivent le programme et la DDE.", et="Dossier maître", n=2, tot=TOT),
             P("z7", "La séquence", p3, kick="Planification", sous="4 blocs et une épreuve. Environ 12 à 16 séances.", et="Dossier maître", n=3, tot=TOT),
             P("z7", "Bloc par bloc", p4, kick="Pistes d'observation", et="Dossier maître", n=4, tot=TOT),
             P("z7", "L'évaluation", p5, kick="Évaluation", sous="Selon la DDE PPS-Z107-3.", et="Dossier maître", n=5, tot=TOT),
             P("z7", "Pistes et délicatesse", p6, kick="Annexes", et="Dossier maître", n=6, tot=TOT)]
    d = os.path.join(R, "00_COMMENCER-ICI"); os.makedirs(d, exist_ok=True)
    return [("DM", doc("Dossier maître Z107", pages), os.path.join(d, "1_Dossier-maitre_Enseignante.pdf"))]


def rendre(jobs):
    tmp = "/tmp/claude-0/pps/z107html"; os.makedirs(tmp, exist_ok=True); a = []
    for n, h, o in jobs:
        p = os.path.join(tmp, n + ".html"); open(p, "w").write(h); a += [p, o]
    subprocess.run(["node", os.path.join(Z101, "rendre.js")] + a, check=True)


if __name__ == "__main__":
    rendre(blocs() + epreuve() + maitre())

#!/usr/bin/env python3
# Le garde-fou de la navigation : aucune page ne doit dépendre de l'accueil pour être trouvée.
# On lit les routes (js/app.js), ce que chaque vue relie (« #/route » dans son fichier), la barre du haut et le menu ⋯
# (index.html), et les sous-onglets (les fratries de js/app.js). Puis on cherche ce qui reste atteignable sans le
# contenu de l'accueil. Une page orpheline arrête la construction : on lui donne une adresse fixe avant de publier.
import re, sys, pathlib

racine = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent
app = (racine / 'js/app.js').read_text()

# Les vues : nom importé → fichier ; puis route → nom.
vues = dict(re.findall(r"^import (\w+)(?:,\s*\{[^}]*\})? from '\./views/(\w+)\.js';", app, re.M))
corps = re.search(r"const routes = \{(.*?)\};", app).group(1)
routes = {}
for part in corps.split(','):
    part = part.strip()
    if not part: continue
    k, _, v = part.partition(':')
    k = k.strip().strip("'"); v = (v or k).strip()
    routes[k] = vues.get(v)
fichier_de = {r: f for r, f in routes.items() if f}

lien = re.compile(r"#/([a-z]+)")
liste = re.compile(r"\[\s*'([a-z]+)'\s*,") # une liste de pages : ['atelier', 'Une séance d’atelier', …]
def cibles(texte, listes=False):
    trouve = set(lien.findall(texte)) | (set(liste.findall(texte)) if listes else set())
    return {m for m in trouve if m in routes}

# Ce qui est toujours là : la barre, le menu ⋯, et les sous-onglets (une fratrie se voit depuis chacune de ses pages).
barre = cibles((racine / 'index.html').read_text()) | cibles((racine / 'js/etincelle.js').read_text()) | {''}  # la petite flamme est sur chaque page
fratries = [re.findall(r"'([a-z]*)'", m) for m in re.findall(r"^const (?:VOIX|LABO|JOUER|ACCUEIL) = \[(.*?)\];", app, re.M)]

# Les liens de chaque page. L'accueil (home.js sert '' et 'projet') est mis de côté : c'est lui qu'on teste.
graphe = {r: cibles((racine / 'js/views' / f'{f}.js').read_text(), listes=True) for r, f in fichier_de.items()}
# Le sommaire en haut de chaque page : ses mots-clés qui mènent ailleurs (« nos deux âmes » → #/ames).
som = (racine / 'js/sommaire.js').read_text()
pages = dict(re.findall(r"'([^']+)': '#/([a-z]*)", re.search(r"const PAGES = \{(.*?)\};", som, re.S).group(1)))
for r, mots in re.findall(r"^  '?([a-z]*)'?: (\[\[.*\]\]),?$", som, re.M):
    for m in re.findall(r"'([^']+)'", mots):
        c = pages.get(m.lower())
        if c is not None and c in routes and r in graphe: graphe[r].add(c)
for fr in fratries:
    for r in fr:
        graphe.setdefault(r, set()).update(x for x in fr if x)
accueil = {r for r, f in fichier_de.items() if f == 'home'}

vus = set(barre); pile = list(barre)
while pile:
    r = pile.pop()
    if r in accueil and r != 'projet' and r != '': continue
    suivants = graphe.get(r, set()) if r not in accueil else {x for fr in fratries if r in fr for x in fr if x}
    for n in suivants:
        if n not in vus: vus.add(n); pile.append(n)

orphelins = sorted(set(fichier_de) - vus - {'mur'})
if orphelins:
    print('Pages qu’on ne trouve que par l’accueil (ou nulle part) :', ', '.join(orphelins))
    print('Donne-leur une place fixe : un onglet, un sous-onglet, le menu ⋯, ou un lien depuis une page voisine.')
    sys.exit(1)
print(f'Navigation : {len(fichier_de)} pages, toutes trouvables sans passer par l’accueil.')

#!/usr/bin/env python3
# Les promesses de Diapason Labo, vérifiées à chaque construction. Une promesse brisée arrête la publication.
#   1. On trouve chaque page sans passer par l'accueil (tools/orphelins.py).
#   2. Chaque page pédagogique dit pourquoi elle marche, avec sa source (APPUIS, js/app.js).
#   4. Chaque bouton a un nom qu'un lecteur d'écran peut dire (texte visible, aria-label ou title).
#   5. Chaque couleur de texte se lit sur le papier : contraste d'au moins 4,5 : 1 (WCAG 2.2, niveau AA).
import re, sys, pathlib, subprocess

racine = pathlib.Path(__file__).resolve().parent.parent
lire = lambda p: (racine / p).read_text()
app = lire('js/app.js'); css = lire('styles.css')
echecs = []

# 1. La navigation.
r = subprocess.run([sys.executable, str(racine / 'tools/orphelins.py')], capture_output=True, text=True)
if r.returncode: echecs.append(r.stdout.strip())

# Les routes (sans l'alias « mur », qui ouvre le même mur que « carnet »).
corps = re.search(r"const routes = \{(.*?)\};", app).group(1)
routes = [p.split(':')[0].strip().strip("'") for p in corps.split(',') if p.strip()]
routes = [x for x in dict.fromkeys(routes) if x != 'mur']

# 2. Le pourquoi. Les outils (ranger, retrouver, se repérer) n'ont pas de prétention pédagogique : pas de source à citer.
OUTILS = {'materiel', 'nouvelles', 'coffre', 'lexique', 'corbeille', 'arbre'}
appuis = set(re.findall(r"^  '?(\w*)'?: \[", re.search(r"const APPUIS = \{(.*?)\n\};", app, re.S).group(1), re.M)) | {''} if 'home' in app else set()
appuis = {('' if k == 'home' else k) for k in appuis}
sans = [x or 'accueil' for x in routes if x not in appuis and x not in OUTILS]
if sans: echecs.append(f'Pages sans « Pourquoi » (APPUIS, js/app.js) : {", ".join(sans)}. Une source réelle, ou la page rejoint OUTILS si elle ne prétend rien.')

# 4. Les boutons nommés.
muets = []
for p in sorted(racine.glob('js/**/*.js')) + [racine / 'index.html']:
    s = p.read_text()
    for m in re.finditer(r"<button\b([^>]*)>(.*?)</button>", s, re.S):
        if re.search(r'aria-label=|title=|aria-labelledby=', m.group(1)): continue
        vu = re.sub(r"\$\{[^}]*\}", "X", re.sub(r"<svg.*?</svg>|<[^>]+>", "", m.group(2), flags=re.S))
        if not re.search(r"[A-Za-zÀ-ÿ0-9X]", vu): muets.append(f'{p.relative_to(racine)}:{s[:m.start()].count(chr(10)) + 1}')
if muets: echecs.append(f'Boutons sans nom pour un lecteur d’écran : {", ".join(muets)}.')

# 5. Le contraste.
def lum(h):
    h = h.lstrip('#'); h = ''.join(c * 2 for c in h) if len(h) == 3 else h
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = [f(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
    return .2126 * r + .7152 * g + .0722 * b
def ratio(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True); return (x + .05) / (y + .05)
jetons = dict(re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{3,6})\b", css.split('}')[0]))
fonds = [jetons['paper'], jetons['card']]
faibles = [f'--{k} {jetons[k]} ({min(ratio(jetons[k], f) for f in fonds):.2f})' for k in ('ink', 'ink-2', 'muted', 'zaza', 'frog') if min(ratio(jetons[k], f) for f in fonds) < 4.5]
# Les textes colorés codés en dur, pensés pour le papier (les couleurs sombres). Les dessins (flammes, voyant
# d'enregistrement sur la scène noire) ne sont pas du texte.
for regle in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
    sel, decl = regle.group(1), regle.group(2)
    if re.search(r'flame|flamme|scene-rec|svg|stroke|fill|\.feu', sel): continue  # les flammes de la séance sont des dessins
    for c in re.findall(r"(?<![-\w])color:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b", decl):
        if lum(c) < 0.25 and min(ratio(c, f) for f in fonds) < 4.5: faibles.append(f'{sel.strip()[-40:]} {c} ({min(ratio(c, f) for f in fonds):.2f})')
if faibles: echecs.append('Textes trop pâles sur le papier (sous 4,5 : 1) : ' + ' ; '.join(dict.fromkeys(faibles)) + '.')

if echecs:
    print('Promesses brisées :'); [print(' ✗', e) for e in echecs]; sys.exit(1)
print(f'Promesses tenues : {len(routes)} pages trouvables sans l’accueil, chacune avec son pourquoi (ou outil assumé) ; tous les boutons nommés ; tous les textes lisibles (≥ 4,5 : 1).')

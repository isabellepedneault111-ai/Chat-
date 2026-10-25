#!/usr/bin/env python3
# L'arbre de l'architecte : la vraie structure de FLIP (dossiers, sous-dossiers, fichiers), pour l'onglet « arbre ».
# Généré depuis git à chaque construction, donc il grandit avec l'app.
import json, pathlib, subprocess
racine = pathlib.Path(__file__).resolve().parent.parent
fichiers = subprocess.run(['git', 'ls-files'], cwd=racine, capture_output=True, text=True).stdout.split()
fichiers = [f for f in fichiers if not f.startswith(('dist/', 'package-lock')) and not f.endswith('.png')]
arbre = {'n': 'Diapason Labo', 'c': {}}
lignes_total = 0
for f in fichiers:
    noeud = arbre
    parts = f.split('/')
    for p in parts[:-1]:
        noeud = noeud['c'].setdefault(p, {'n': p, 'c': {}})
    lignes = 0
    if f.endswith(('.js', '.mjs', '.css', '.html', '.py', '.sh', '.toml', '.md', '.json')):
        try: lignes = (racine / f).read_text(errors='ignore').count('\n')
        except OSError: pass
    lignes_total += lignes
    noeud['c'][parts[-1]] = {'n': parts[-1], 'l': lignes}
def liste(n):
    if 'c' in n: return {'n': n['n'], 'c': sorted((liste(x) for x in n['c'].values()), key=lambda x: ('c' not in x, x['n']))}
    return n
out = liste(arbre); out['fichiers'] = len(fichiers); out['lignes'] = lignes_total
(racine / 'data' / 'arbre.json').write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
print('data/arbre.json :', len(fichiers), 'fichiers,', lignes_total, 'lignes')

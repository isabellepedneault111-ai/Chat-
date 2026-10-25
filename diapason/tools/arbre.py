#!/usr/bin/env python3
# L'arbre de l'architecte : la vraie structure de FLIP (dossiers, sous-dossiers, fichiers), pour l'onglet « arbre ».
# Généré depuis git à chaque construction, donc il grandit avec l'app.
import datetime, json, pathlib, subprocess
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

# ---------- La généalogie : d'où vient l'app, branche par branche ----------
# Les branches de travail (avec Claude), les fusions, et la lignée qui mène à Diapason Labo.
# Les chantiers hors musique restent anonymes : on montre leur forme, pas leur contenu.
def git(*a):
    return subprocess.run(['git', *a], cwd=racine, capture_output=True, text=True).stdout.strip()
def commits(spec, *opts):
    out = []
    for l in git('log', '--format=%h|%ad|%P|%s', '--date=short', *opts, spec).splitlines():
        h, d, p, s = l.split('|', 3)
        out.append({'h': h, 'd': d, 'p': p.split(), 's': s})
    return out[::-1]
ERES = [('Diapason :', 'Diapason'), ('Zaza × Frog', 'Zaza × Frog'), ('FLIP', 'FLIP'), ('Visite', 'La visite'), ('labo 0.5', 'Version 0.5'), ('Diapason Labo', 'Diapason Labo')]
def ere(s):
    for k, v in ERES:
        if s.startswith(k): return v
    return None
principale = commits('HEAD', '--first-parent')
fusionnes = []
for c in principale:
    if len(c['p']) > 1:
        for x in commits(f"{c['p'][0]}..{c['p'][1]}"):
            fusionnes.append({**x, 'vers': c['h']})
lanes = [{'id': 'lignee', 'nom': 'La lignée de Diapason Labo', 'musique': True, 'c': []}]
derniere = None
for c in principale:
    e = ere(c['s']) or (derniere if c['d'] >= '2026-10-24' else None)
    if c['d'] >= '2026-10-24' and not e: e = 'Diapason'
    derniere = e or derniere
    lanes[0]['c'].append({'d': c['d'], 'h': c['h'], 's': c['s'] if c['d'] >= '2026-10-24' or c['s'].startswith('Create Flip') else ('Fusion d’un autre chantier' if len(c['p']) > 1 else 'Le tout premier dépôt'), 'e': e, 'f': len(c['p']) > 1})
if fusionnes:
    lanes.append({'id': 'fusion', 'nom': 'Un chantier fusionné', 'musique': False, 'c': [{'d': x['d'], 'h': x['h'], 'vers': x['vers']} for x in fusionnes]})
dans = set(git('rev-list', 'HEAD').split())
for ref in git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin').splitlines():
    if ref.endswith(('HEAD', 'improve-google-app-t8pfyj', '/main')): continue
    propres = [c for c in commits(f'HEAD..{ref}')]
    if not propres: continue
    base = git('merge-base', 'HEAD', ref)[:7]
    lanes.append({'id': ref.split('/')[-1], 'nom': 'Un autre chantier', 'musique': False, 'base': base, 'c': [{'d': c['d'], 'h': c['h']} for c in propres]})
gen = {'lanes': lanes, 'debut': principale[0]['d'] if principale else ''}
(racine / 'data' / 'genealogie.json').write_text(json.dumps(gen, ensure_ascii=False, separators=(',', ':')))
print('data/genealogie.json :', len(lanes), 'branches,', sum(len(l['c']) for l in lanes), 'étapes')

# ---------- La cadence : le temps réellement passé, mesuré dans l'historique ----------
# Depuis la première étape de Diapason : temps total écoulé, et temps actif (on additionne les écarts entre
# deux étapes quand ils font moins de 90 minutes ; une pause plus longue ne compte pas).
ts = [int(x) for x in git('log', '--first-parent', '--format=%at', 'HEAD').split()][::-1]
firsts = [c for c in principale if c['s'].startswith('Diapason :')]
if firsts:
    t0 = int(git('log', '-1', '--format=%at', firsts[0]['h']))
    ts = [t for t in ts if t >= t0]
    actif = sum(b - a for a, b in zip(ts, ts[1:]) if b - a <= 90 * 60)
    gen['cadence'] = {'etapes': len(ts), 'heuresActives': round(actif / 3600, 1), 'heuresTotales': round((ts[-1] - ts[0]) / 3600, 1), 'jours': len({datetime.datetime.fromtimestamp(t).date() for t in ts})}
    (racine / 'data' / 'genealogie.json').write_text(json.dumps(gen, ensure_ascii=False, separators=(',', ':')))
    print('cadence :', gen['cadence'])

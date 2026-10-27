#!/usr/bin/env python3
# L'arbre de l'architecte : la vraie structure de FLIP (dossiers, sous-dossiers, fichiers), pour l'onglet « arbre ».
# Généré depuis git à chaque construction, donc il grandit avec l'app.
import datetime, json, pathlib, subprocess
racine = pathlib.Path(__file__).resolve().parent.parent
fichiers = subprocess.run(['git', 'ls-files'], cwd=racine, capture_output=True, text=True).stdout.split()
fichiers = [f for f in fichiers if not f.startswith(('dist/', 'package-lock')) and not f.endswith('.png')]
arbre = {'n': 'Diapason Labo', 'c': {}}
lignes_total = 0
# Pour la fiche de chaque point : le rôle du fichier (sa première phrase de commentaire), sa naissance et sa dernière retouche.
def role(f):
    try: tete = (racine / f).read_text(errors='ignore').splitlines()[:6]
    except OSError: return ''
    morceaux = []
    for l in tete:
        t = l.strip()
        if t.startswith(('#!', '<!doctype', '<!DOCTYPE')): continue
        if t.startswith(('//', '#', '/*', '*', '<!--')):
            t = t.lstrip('/#*!<- ').rstrip('*/->').strip()
            if t: morceaux.append(t)
        elif morceaux or t: break
    r = ' '.join(morceaux)
    return (r[:260].rsplit(' ', 1)[0] + '…') if len(r) > 260 else r
import re
SECTION = re.compile(r'^\s*(?://|/\*)\s*-{3,}\s*(.+?)\s*-{3,}')
FONCTION = re.compile(r'^\s*(?:export\s+)?(?:async\s+)?function\s+([\wÀ-ÿœ]+)\s*\(')
CONSTE = re.compile(r'^export\s+const\s+([\wÀ-ÿœ]+)\s*=')
CSS = re.compile(r'^/\*\s*(.+?)\s*\*/')
DEF = re.compile(r'^(?:def|class)\s+(\w+)')
# Les éléments d’un fichier : ses sections et ses fonctions (JavaScript), ses blocs commentés (CSS), ses fonctions (Python).
def elements(f, texte=None):
    if texte is None:
        try: texte = (racine / f).read_text(errors='ignore')
        except OSError: return []
    if not texte: return []
    out = []
    for l in texte.splitlines():
        if f.endswith(('.js', '.mjs')):
            m = SECTION.match(l)
            if m: out.append('§ ' + m.group(1)); continue
            m = FONCTION.match(l) or CONSTE.match(l)
            if m: out.append(m.group(1))
        elif f.endswith('.css'):
            m = CSS.match(l)
            if m: out.append('§ ' + m.group(1)[:70].split(' : ')[0].split('. ')[0])
        elif f.endswith('.py'):
            m = DEF.match(l) or SECTION.match(l.replace('#', '//', 1))
            if m: out.append(m.group(1))
    vus = set(); return [x for x in out if not (x in vus or vus.add(x))]
# Pour chaque élément : sa sorte (fonction partagée, interne, asynchrone, valeur partagée, section) et le commentaire écrit
# juste au-dessus dans le code (ou au bout de sa ligne) : ce qu'il fait, concrètement.
def notes(f):
    try: L = (racine / f).read_text(errors='ignore').splitlines()
    except OSError: return {}
    out = {}
    for i, l in enumerate(L):
        nom = sorte = None
        if f.endswith(('.js', '.mjs')):
            m = SECTION.match(l)
            if m: out.setdefault('§ ' + m.group(1), ['section', '']); continue
            m = FONCTION.match(l)
            if m: nom = m.group(1); sorte = ('async ' if 'async' in l.split('function')[0] else '') + ('export ' if l.lstrip().startswith('export') else '') + 'function'
            else:
                m = CONSTE.match(l)
                if m: nom = m.group(1); sorte = 'export const' + (' =>' if '=>' in l else '')
        elif f.endswith('.py'):
            m = DEF.match(l)
            if m: nom = m.group(1); sorte = l.split()[0]
        if not nom or nom in out: continue
        com = []; j = i - 1
        marque = '#' if f.endswith('.py') else '//'
        while j >= 0 and L[j].strip().startswith(marque): com.insert(0, L[j].strip()[len(marque):].strip()); j -= 1
        if j < 0: com = []  # le commentaire d'en-tête du fichier parle du fichier, pas de son premier élément
        if not com and marque + ' ' in l: com = [l.split(marque + ' ', 1)[1].strip()]
        out[nom] = [sorte, ' '.join(com)[:320]]
    return out
# Le contenu d’un fichier avant sa dernière retouche, lu dans Git, pour repérer ce qui y est nouveau.
def precedent(f):
    # Le contenu du fichier avant sa dernière retouche (vide s'il vient de naître).
    h = subprocess.run(['git', 'log', '-2', '--format=%h', '--', f], cwd=racine, capture_output=True, text=True).stdout.split()
    if len(h) < 2: return ''
    return subprocess.run(['git', 'show', f'{h[1]}:./{f}'], cwd=racine, capture_output=True, text=True).stdout
import re
# La page sur la conception reste à part : on ne la nomme pas dans l'histoire des étapes.
DISCRET = re.compile(r'fa[cç]on de faire|direction interpr|architecte d.environnement', re.I)
# Retire d’un nom d’étape ce qui touche la page sur la conception (gardée hors de l’histoire des étapes).
def discret(sujet):
    if not DISCRET.search(sujet): return sujet
    garde = [x for x in re.split(r' ; |, (?=[a-zé])', sujet) if not DISCRET.search(x)]
    return ' ; '.join(garde) if garde else 'L’arbre : retouches de mise en page'
# Les dernières retouches d’un fichier, lues dans Git : la date et ce que l’étape a fait.
def histoire(f):
    # Ses dernières retouches (depuis Diapason) : la date et ce que l'étape a fait, en une phrase.
    out = []
    for l in subprocess.run(['git', 'log', '-6', '--format=%ad|%s', '--date=short', '--', f], cwd=racine, capture_output=True, text=True).stdout.splitlines():
        d, sujet = l.split('|', 1)
        if d >= '2026-10-24' and not sujet.startswith('Arbre et généalogie'): out.append([d, discret(sujet)[:140]])
    return out[:4]
dates = {}
for l in subprocess.run(['git', 'log', '--format=@%ad', '--date=short', '--name-only', '--relative'], cwd=racine, capture_output=True, text=True).stdout.splitlines():
    if l.startswith('@'): d = l[1:]
    elif l: dates.setdefault(l, [d, d])[0] = d  # le log va du plus récent au plus ancien : [naissance, retouche]
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
    fiche = {'n': parts[-1], 'l': lignes}
    if f.endswith(('.js', '.mjs', '.css', '.py', '.sh', '.toml')) and role(f): fiche['r'] = role(f)
    if f in dates: fiche['nee'], fiche['mod'] = dates[f]
    # Ce qu'il contient, grosso modo : ses fonctions et ses sections (et ce qui y est nouveau depuis sa retouche d'avant).
    el = elements(f)
    if el:
        avant = set(elements(f, precedent(f)))
        nt = notes(f)
        fiche['el'] = [[x, 1 if avant and x not in avant else 0, *nt.get(x, ['section' if x.startswith('§') else '', ''])] for x in el][:48]
    h = histoire(f)
    if h: fiche['h'] = h
    noeud['c'][parts[-1]] = fiche
# Range l’arbre : les dossiers d’abord, puis les fichiers, par ordre alphabétique.
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
# Les étapes (commits) d’une branche : identifiant, date, parents, titre.
def commits(spec, *opts):
    out = []
    for l in git('log', '--format=%h|%ad|%P|%s', '--date=short', *opts, spec).splitlines():
        h, d, p, s = l.split('|', 3)
        out.append({'h': h, 'd': d, 'p': p.split(), 's': discret(s)})
    return out[::-1]
ERES = [('Diapason :', 'Diapason'), ('Zaza × Frog', 'Zaza × Frog'), ('FLIP', 'FLIP'), ('Visite', 'La visite'), ('labo 0.5', 'Version 0.5'), ('Diapason Labo', 'Diapason Labo')]
# L’ère d’une étape (Diapason, FLIP, la visite…), devinée d’après le début de son titre.
def ere(s):
    for k, v in ERES:
        if s.startswith(k): return v
    return None
principale = commits('HEAD', '--first-parent')
# Ce que chaque étape a touché : fichiers, lignes ajoutées, lignes retirées.
stats = {}; h = None
for l in git('log', '--first-parent', '--format=@%h', '--shortstat', 'HEAD').splitlines():
    if l.startswith('@'): h = l[1:]
    elif 'changed' in l:
        nb = lambda mot: int(next((x.split()[0] for x in l.split(',') if mot in x), 0))
        stats[h] = [nb('changed'), nb('insertion'), nb('deletion')]
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
    lanes[0]['c'].append({'d': c['d'], 'h': c['h'], 's': c['s'] if c['d'] >= '2026-10-24' or c['s'].startswith('Create Flip') else ('Fusion d’un autre chantier' if len(c['p']) > 1 else 'Le tout premier dépôt'), 'e': e, 'f': len(c['p']) > 1, 't': stats.get(c['h'])})
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

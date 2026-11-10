"""Construit le site rever-le-monde.netlify.app : hub de ressources autonome + présentation + PDF."""
import os, re, shutil, sys
B = os.path.dirname(os.path.abspath(__file__)); OUT = sys.argv[1]; R = sys.argv[2]
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT + '/img'); os.makedirs(OUT + '/fichiers'); os.makedirs(OUT + '/fonts'); os.makedirs(OUT + '/presentation')
shutil.copy(B + '/fonts/Anton-Regular.ttf', OUT + '/fonts/')
for f in ['riso_mur.jpg', 'logo_cfga.png', 'logo_csi.png']: shutil.copy(B + '/img/' + f, OUT + '/img/')
for f in os.listdir(R + '/presentation/fichiers'): shutil.copy(R + '/presentation/fichiers/' + f, OUT + '/fichiers/')
hub = open(B + '/hub_fragment.html', encoding='utf8').read()
hub = hub.replace('__IMG_RISO_MUR__', 'img/riso_mur.jpg').replace('__LOGO_CFGA__', 'img/logo_cfga.png').replace('__LOGO_CSI__', 'img/logo_csi.png')
hub = hub.replace('<div id="hub" class="hub" hidden>', '<div id="hub" class="hub">')
hub = hub.replace("  if (location.hash !== '#ressources') return;\n", '')
hub = re.sub(r'href="#ressources" data-to="([a-z-]+)"', r'href="#\1" data-to="\1"', hub)
# en tête : les deux grands boutons et les 4 verbes
hero = '''<div class="hub-cta"><a class="hub-btn big" href="presentation/">▶ La présentation</a><a class="hub-btn big alt" href="#h-copilot">Mon invite Copilot</a></div>
    <ol class="hub-verbes" aria-label="Les 4 étapes de l’atelier"><li><i>1</i>Rêver</li><li><i>2</i>Cibler</li><li><i>3</i>Choisir</li><li><i>4</i>S’engager</li></ol>'''
hub = hub.replace('<ul class="hub-times"', hero + '\n    <ul class="hub-times"', 1)
cg = open(B + '/copilot_gen_src.html', encoding='utf8').read().replace('__SIG_DB__', open(B + '/sig_db.js', encoding='utf8').read())
css = '''@font-face{font-family:"Anton";src:url(fonts/Anton-Regular.ttf) format("truetype");font-display:swap}
:root{--paper:#FBF8EF;--paper2:#F3EDDF;--ink:#1E1A22;--mauve:#5B2A86;--mauve2:#7A45AB;--gold:#F2C230;--muted:#45404D;--hair:#8F859A;
--display:"Anton","Impact","Arial Narrow Bold",sans-serif;--hand:"Arial","Helvetica",sans-serif;--body:"Cambria","Georgia","Times New Roman",serif;--ui:"Arial","Helvetica",sans-serif;color-scheme:light}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:64px}body{margin:0;background:#E9E1D0}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
.hub-cta{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 6px}
.hub-btn.big{font-size:20px;padding:12px 20px}
.hub-verbes{list-style:none;display:flex;flex-wrap:wrap;gap:0;margin:14px 0 4px;padding:0;border:2px solid var(--h-paper);width:max-content;max-width:100%}
.hub-verbes li{display:flex;align-items:center;gap:6px;font-family:var(--display);font-size:17px;letter-spacing:.03em;text-transform:uppercase;padding:4px 12px;border-right:2px solid var(--h-paper);color:var(--h-paper)}
.hub-verbes li:last-child{border-right:0}
.hub-verbes i{font-style:normal;display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--h-gold);color:var(--h-ink);font-family:var(--ui);font-weight:700;font-size:12px}
@media (max-width:520px){.hub-verbes li{padding:3px 7px;font-size:14px}.hub-btn.big{font-size:17px;padding:10px 14px}}
'''
page = '''<!doctype html><html lang="fr" class="hubmode"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Rêver le monde de demain · Ressources</title><meta name="description" content="Atelier FGA du 13 novembre 2026 : la présentation, l’invite Copilot, les documents et les programmes officiels.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%235B2A86'/%3E%3Ccircle cx='32' cy='32' r='16' fill='%23F2C230'/%3E%3C/svg%3E">
<style>''' + css + '''</style></head><body class="hubmode">
''' + cg + '\n' + hub + '\n</body></html>'
open(OUT + '/index.html', 'w', encoding='utf8').write(page)
shutil.copy(B + '/pres_web.html', OUT + '/presentation/index.html')
open(OUT + '/presentation/index.html', 'r+', encoding='utf8')
open(OUT + '/netlify.toml', 'w').write('[[headers]]\n  for = "/*"\n  [headers.values]\n    X-Content-Type-Options = "nosniff"\n')
print('ok', sum(len(fs) for _, _, fs in os.walk(OUT)), 'fichiers')

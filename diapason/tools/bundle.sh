#!/usr/bin/env bash
# Compile Diapason en un seul fichier HTML autonome : dist/index.html
# (utile pour l'import Netlify par URL, ou pour envoyer l'app par courriel/clé USB).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 tools/arbre.py
python3 tools/promesses.py  # nos promesses (navigation, pourquoi, sommaire, boutons nommés, contraste) : brisées, on ne publie pas
tmp=$(mktemp -d)
npx -y esbuild@0.24.2 js/app.js --bundle --format=iife --minify --target=es2020 --outfile="$tmp/app.js"
npx -y esbuild@0.24.2 styles.css --minify --outfile="$tmp/styles.css"
mkdir -p dist
python3 - "$tmp" <<'PY'
import sys, base64, pathlib
tmp = pathlib.Path(sys.argv[1])
html = pathlib.Path('index.html').read_text()
css = (tmp / 'styles.css').read_text()
js = (tmp / 'app.js').read_text().replace('</script', '<\\/script')
icon = base64.b64encode(pathlib.Path('favicon.svg').read_bytes()).decode()
html = html.replace('<link rel="stylesheet" href="styles.css">', f'<style>{css}</style>')
html = html.replace('<script type="module" src="js/app.js"></script>', f'<script>{js}</script>')
html = html.replace('href="favicon.svg"', f'href="data:image/svg+xml;base64,{icon}"')
pathlib.Path('dist/index.html').write_text(html)
print('dist/index.html', len(html), 'octets')
PY

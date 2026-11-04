"""Aucune section coupée sur deux pages : rend le .docx, repère les titres dont le contenu déborde
sur la page suivante et leur ajoute un saut de page avant (pageBreakBefore). Boucle jusqu'à stabilité.
Usage : python3 nosplit.py fichier.docx [...]"""
import sys, os, re, zipfile, shutil, subprocess, tempfile
from lxml import etree

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
q = lambda t: '{%s}%s' % (W, t)
HEADS = ('Heading1', 'Heading2', 'Heading3')
norm = lambda s: re.sub(r'[^a-z0-9àâçéèêëîïôûùüÿœ]+', '', s.lower())


def load(path):
    with zipfile.ZipFile(path) as z:
        return etree.fromstring(z.read('word/document.xml'))


def write(path, root):
    tmp = path + '.tmp'
    data = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
    with zipfile.ZipFile(path) as z, zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as o:
        for it in z.infolist():
            o.writestr(it, data if it.filename == 'word/document.xml' else z.read(it.filename))
    shutil.move(tmp, path)


def style(p):
    s = p.find(q('pPr') + '/' + q('pStyle'))
    return s.get(q('val')) if s is not None else None


def heads(root):
    body = root.find(q('body'))
    kids = [k for k in body if k.tag in (q('p'), q('tbl'))]
    out = []
    for i, k in enumerate(kids):
        if k.tag == q('p') and style(k) in HEADS:
            txt = ''.join(t.text or '' for t in k.iter(q('t')))
            out.append({'el': k, 'idx': i, 'lvl': style(k), 'key': norm(txt)[-28:]})
    return out, kids


def pages(path):
    d = tempfile.mkdtemp()
    subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', d, path], capture_output=True)
    pdf = os.path.join(d, os.path.splitext(os.path.basename(path))[0] + '.pdf')
    txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    shutil.rmtree(d)
    pgs = []
    for pg in txt.split('\f'):
        lines = [l for l in pg.splitlines() if l.strip()]
        if lines and re.match(r'^\s*\d+\s+R\s*ê', lines[-1]):  # pied de page
            lines = lines[:-1]
        pgs.append([norm(l) for l in lines])
    return [p for p in pgs if p] or [[]]


def find(pgs, key, start):
    for pi in range(start, len(pgs)):
        flat = ''.join(pgs[pi])
        if key and key in flat:
            # position de la ligne
            acc = ''
            for li, l in enumerate(pgs[pi]):
                acc += l
                if key in acc:
                    return pi, li
    return None, None


def has_pbb(p):
    pr = p.find(q('pPr'))
    return pr is not None and pr.find(q('pageBreakBefore')) is not None


def add_pbb(p):
    pr = p.find(q('pPr'))
    if pr is None:
        pr = etree.Element(q('pPr')); p.insert(0, pr)
    st = pr.find(q('pStyle'))
    pr.insert(1 if st is not None else 0, etree.Element(q('pageBreakBefore')))


def run(path):
    for it in range(25):
        root = load(path)
        hs, kids = heads(root)
        pgs = pages(path)
        pos, start = [], 0
        for h in hs:
            pi, li = find(pgs, h['key'], start)
            pos.append((pi, li))
            if pi is not None:
                start = pi
        fixed = None
        for i, h in enumerate(hs):
            pi, li = pos[i]
            if pi is None or li == 0:
                continue
            nxt = next((pos[j] for j in range(i + 1, len(hs)) if pos[j][0] is not None), (len(pgs), 0))
            # la section déborde si la suite commence plus loin qu'en haut de la page suivante
            spills = nxt[0] > pi and not (nxt[0] == pi + 1 and nxt[1] == 0)
            if not spills:
                continue
            # titre court suivi d'un sous-titre : on déplace le bloc parent
            target = h['el']
            if i > 0 and hs[i - 1]['lvl'] < h['lvl'] and h['idx'] - hs[i - 1]['idx'] <= 3 and pos[i - 1][0] == pi and pos[i - 1][1] > 0:
                target = hs[i - 1]['el']
            if not has_pbb(target):
                fixed = target; break
        if fixed is None:
            print('ok :', os.path.basename(path), len(pgs), 'pages, passes :', it)
            return
        add_pbb(fixed)
        write(path, root)
        print('  saut avant :', ''.join(t.text or '' for t in fixed.iter(q('t')))[:50])
    print('arrêt après 25 passes :', path)


for f in sys.argv[1:]:
    run(f)

"""Garde chaque section (titre + contenu) sur une même page : keepNext en chaîne, rangées insécables.
Usage : python3 keep.py fichier.docx [...]"""
import sys, zipfile, shutil, os
from lxml import etree

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
q = lambda t: '{%s}%s' % (W, t)
HEADS = {'Heading1', 'Heading2', 'Heading3'}


def style(p):
    s = p.find(q('pPr') + '/' + q('pStyle'))
    return s.get(q('val')) if s is not None else None


def ppr(p):
    pr = p.find(q('pPr'))
    if pr is None:
        pr = etree.SubElement(p, q('pPr'))
        p.remove(pr); p.insert(0, pr)
    return pr


def setflag(p, tag):
    pr = ppr(p)
    if pr.find(q(tag)) is None:
        el = etree.Element(q(tag))
        # keepNext / keepLines se placent après pStyle
        st = pr.find(q('pStyle'))
        pr.insert(1 if st is not None else 0, el)


def keep_tbl(t, last):
    rows = t.findall(q('tr'))
    for i, tr in enumerate(rows):
        trpr = tr.find(q('trPr'))
        if trpr is None:
            trpr = etree.Element(q('trPr')); tr.insert(0 if tr.find(q('tblPrEx')) is None else 1, trpr)
        if trpr.find(q('cantSplit')) is None:
            etree.SubElement(trpr, q('cantSplit'))
        if i < len(rows) - 1 or not last:
            for p in tr.iter(q('p')):
                setflag(p, 'keepNext')


def process(path):
    tmp = path + '.tmp'
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml')
        root = etree.fromstring(xml)
        body = root.find(q('body'))
        kids = [k for k in body if k.tag in (q('p'), q('tbl'))]
        blocks, cur = [], []
        for k in kids:
            if k.tag == q('p') and style(k) in HEADS and cur:
                blocks.append(cur); cur = []
            cur.append(k)
        if cur: blocks.append(cur)
        for bi, b in enumerate(blocks):
            # un bloc court (titre + intro) reste collé au bloc suivant
            short = len(b) <= 3 and all(k.tag == q('p') for k in b) and bi < len(blocks) - 1
            for i, k in enumerate(b):
                last = (i == len(b) - 1) and not short
                if k.tag == q('p'):
                    if k.find('.//' + q('br')) is not None and any(br.get(q('type')) == 'page' for br in k.iter(q('br'))):
                        continue
                    setflag(k, 'keepLines')
                    if not last:
                        setflag(k, 'keepNext')
                else:
                    keep_tbl(k, last)
        data = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
        with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as o:
            for it in z.infolist():
                o.writestr(it, data if it.filename == 'word/document.xml' else z.read(it.filename))
    shutil.move(tmp, path)
    print('gardé ensemble :', os.path.basename(path), len(blocks), 'blocs')


for f in sys.argv[1:]:
    process(f)

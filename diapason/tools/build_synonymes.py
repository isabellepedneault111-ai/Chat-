#!/usr/bin/env python3
# Le dictionnaire des synonymes de l'app : myThes 2.3 (Frédéric Labbé, Dicollecte/Grammalecte, LGPL 2.1+), le même que
# LibreOffice, ramené à l'essentiel pour l'écriture de chansons : jusqu'à 4 sens par mot, 18 synonymes par sens, sans
# les expressions de plus de trois mots. Usage : python3 tools/build_synonymes.py chemin/vers/thes_fr.dat
import pathlib, sys
src = pathlib.Path(sys.argv[1]).read_text(encoding='utf-8').splitlines()
NAT = {'Nom': 'n', 'Verbe': 'v', 'Adjectif': 'a', 'Adverbe': 'adv'}
out = ['# Synonymes : myThes 2.3, Frédéric Labbé (Dicollecte / Grammalecte), LGPL 2.1 ou plus. Format : mot<TAB>nature:syn|syn;nature:syn|…']
i = 1
while i < len(src):
    tete, n = src[i].rsplit('|', 1); n = int(n); sens = []
    for l in src[i + 1:i + 1 + n]:
        p = l.split('|'); nat = NAT.get(p[0].strip('()').split()[0] if p[0] else '', '')
        syns = []
        for s in p[1:]:
            s = s.strip()
            if s and s != tete and len(s.split()) <= 3 and '(' not in s and s not in syns: syns.append(s)
        if syns: sens.append(f"{nat}:{'|'.join(syns[:18])}")
    if sens: out.append(f"{tete}\t{';'.join(sens[:4])}")
    i += 1 + n
dest = pathlib.Path(__file__).resolve().parent.parent / 'data' / 'synonymes-fr.tsv'
dest.write_text('\n'.join(out) + '\n', encoding='utf-8')
print(dest.name, len(out) - 1, 'mots,', dest.stat().st_size // 1024, 'Ko')

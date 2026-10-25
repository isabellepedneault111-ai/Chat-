# Construit data/lexique-fr.tsv à partir de Lexique 3.83 (New & Pallier, lexique.org, CC BY-SA 4.0).
import csv, sys
src, dst, minfreq = sys.argv[1], sys.argv[2], float(sys.argv[3])
best = {}
with open(src, encoding='utf-8') as f:
    r = csv.DictReader(f, delimiter='\t', quoting=csv.QUOTE_NONE)
    for row in r:
        w = row['ortho']
        if not w or ' ' in w or len(w) > 24: continue
        fr = float(row['freqfilms2'] or 0) + float(row['freqlivres'] or 0)
        cur = best.get(w)
        if cur is None or fr > cur[0]:
            best[w] = (fr, row['phon'], row['nbsyll'], row['orthosyll'], row['cgram'])
        elif cur:
            best[w] = (cur[0] + fr,) + cur[1:]
rows = sorted(((v[0], w) + v[1:] for w, v in best.items() if v[0] >= minfreq), reverse=True)
with open(dst, 'w', encoding='utf-8') as o:
    o.write('# Lexique 3.83 — New, B. & Pallier, C. — www.lexique.org — CC BY-SA 4.0. Colonnes : mot, phonétique, syllabes, découpage, catégorie\n')
    for fr, w, phon, nb, osyl, cg in rows:
        o.write(f'{w}\t{phon}\t{nb}\t{osyl}\t{cg}\n')
print(len(rows))

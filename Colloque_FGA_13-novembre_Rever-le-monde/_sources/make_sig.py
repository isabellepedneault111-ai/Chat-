import json,re
d=json.load(open('sigles.json')); T=json.load(open('meq_titles.json')); PX=json.load(open('px_db.json')); P=PX['db']; ORDER=PX['order']
FIX={'MAT-4153':'Représentation géométrique en contexte général','INF-5072':'Création d’une base de données'}
def L(x):
    if not x: return []
    if isinstance(x,str): return [x]
    out=[]
    for i in x:
        if isinstance(i,str): out.append(i)
        elif isinstance(i,dict): out.append(i.get('nom') or i.get('t') or i.get('label') or ' · '.join(str(v) for v in i.values() if isinstance(v,str)))
    return out
def trim(s,n): s=re.sub(r'\s+',' ',s or '').strip(); return s if len(s)<=n else s[:n].rsplit(' ',1)[0]+'…'
DB={}
for s in d['sigles']:
    k=s['sigle']; e={'n':s['nom'],'v':s.get('niveau',''),'f':s.get('formation','')}
    if s.get('repertoire_seulement'): e['r']=1
    cs=s.get('classe_situations') or ''; fam=L(s.get('familles_situations') or s.get('famille_situations')); sv=L(s.get('situations_de_vie'))
    if cs: e['cs']=trim(cs,160)
    if fam: e['fam']=[trim(x,140) for x in fam[:4]]
    if sv: e['sv']=[trim(x,90) for x in sv[:5]]
    comp=L(s.get('competences_ciblees') or s.get('competences') or s.get('competences_disciplinaires_principales') or s.get('competence_disciplinaire_principale'))
    if comp: e['c']=[trim(x,140) for x in comp[:4]]
    pol=L(s.get('competences_polyvalentes') or s.get('competences_transversales'))
    if pol: e['p']=[trim(x,90) for x in pol[:6]]
    dgf=L(s.get('domaines_generaux_formation'))
    if dgf: e['dgf']=[trim(x,90) for x in dgf[:3]]
    if s.get('attentes_fin_cours'): e['a']=trim(s['attentes_fin_cours'],520)
    cr=L(s.get('criteres_evaluation'))+L(s.get('criteres_evaluation_lire'))+L(s.get('criteres_evaluation_ecrire'))
    if cr: e['cr']=[trim(x,140) for x in cr[:5]]
    sav=L(s.get('contenus') or s.get('savoirs_prescrits') or s.get('savoirs_essentiels'))
    if sav: e['s']=[trim(x,130) for x in sav[:6]]
    if s.get('lien_meq'): e['u']=s['lien_meq']
    DB[k]=e
# rapport : compléter ou ajouter (marqué x = extrait à valider)
for k,p in P.items():
    if k in DB:
        e=DB[k]
        if e.get('r') and (p.get('s') or p.get('a') or p.get('c')):
            for f in ('cs','c','s','a'):
                if p.get(f) and not e.get(f): e[f]=p[f]
            if p.get('fs') and not e.get('fam'): e['fam']=[p['fs']]
            if p.get('cv') and not e.get('c'): e['c']=[p['cv']]
            e.pop('r',None); e['x']=1
        if p.get('d'): e['d']=p['d']
        if p.get('u') and not e.get('u'): e['u']=p['u']
    else:
        e={'n':p['n'],'x':1}
        for f in ('cs','c','s','a','u','d'):
            if p.get(f): e[f]=p[f]
        if p.get('fs'): e['fam']=[p['fs']]
        if p.get('cv'): e['c']=[p['cv']]+e.get('c',[])
        if p.get('but'): e['b']=trim(p['but'],260)
        if not any(e.get(f) for f in ('c','s','a','cs','fam')): e['r']=1
        DB[k]=e
# titres officiels et DDE des pages du ministère
for k,t in T.items():
    if k in DB:
        DB[k]['n']=FIX.get(k,t['n'])
        if t.get('d','').endswith('.pdf'): DB[k]['d']=t['d']
    else:
        DB[k]={'n':FIX.get(k,t['n']),'r':1,'d':t['d']}
# ANG : garder aussi le titre anglais de la Boussole
for s in d['sigles']:
    k=s['sigle']
    if k.startswith('ANG') and k in T and s['nom']!=T[k]['n']: DB[k]['n']=T[k]['n']+' ('+s['nom']+')'
# progression : précédent et suivant dans le même programme
grp=lambda k: k.split('-')[0]
seq={}
for k in ORDER:
    seq.setdefault(grp(k),[]).append(k)
for g,ks in seq.items():
    for i,k in enumerate(ks):
        if k in DB:
            if i>0: DB[k]['pv']=ks[i-1]
            if i<len(ks)-1: DB[k]['nx']=ks[i+1]
js=json.dumps(DB,ensure_ascii=False,separators=(',',':'))
for bad in ('Caroline','Joël','Olivier','dossiers_cp','notes_cp'):
    assert bad not in js, bad
open('build/sig_db.js','w',encoding='utf8').write('const SIG='+js+';')
print(len(DB),'sigles ·',len(js)//1024,'Ko ·',sum(1 for v in DB.values() if v.get('d')),'avec DDE ·',sum(1 for v in DB.values() if v.get('x')),'du rapport ·',sum(1 for v in DB.values() if v.get('r')),'sans contenu')

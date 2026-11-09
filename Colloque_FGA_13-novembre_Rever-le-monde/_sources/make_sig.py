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
# DDE officielles : extraits pour les sigles sans contenu, minces ou tirés du rapport
DDE=json.load(open('dde_db.json'))
for k,x in DDE.items():
    if k not in DB or not x.get('el'): continue
    e=DB[k]
    thin=not e.get('a') and not (e.get('s') and len(e['s'])>2)
    if e.get('r') or thin or e.get('x'):
        e['dd']=x['el']
        if x.get('sit') and not e.get('cs') and not e.get('fam'): e['si']=x['sit']
        if e.get('x'):
            for f in ('c','s'): e.pop(f,None)
            e.pop('x',None)
        e.pop('r',None)
for k2,k1 in [('MAT-4261','MAT-4161'),('MAT-4262','MAT-4162'),('MAT-4263','MAT-4163')]:
    if k2 in DB and k1 in DB and DB[k2].get('r'):
        src=DB[k1]; DB[k2].update({f:src[f] for f in ('dd','si','d','u','c','s','a','fam','cs') if f in src}); DB[k2].pop('r',None); DB[k2]['b']='Même cours que '+k1+' : le programme d’études utilise le code '+k2+', la DDE officielle le code '+k1
PROGX={'PER-2101':{'a':'Pour traiter les situations de la classe Maintien de saines relations interpersonnelles, l’adulte collabore à une interaction. Il peut s’agir d’une discussion, d’une tâche, d’une activité ou d’un projet avec un pair ou avec une équipe. Il réfléchit sur la qualité de son engagement personnel et sélectionne des moyens pour s’ajuster à l’évolution de la relation. Il envisage aussi des améliorations qui favorisent le maintien de saines relations interpersonnelles. L’adulte qui collabore à une interaction poursuit un objectif commun et clairement identifié.','u':'https://cdn-contenu.quebec.ca/cdn-contenu/education/formation-generale-adultes/programmes/FGA-DomDevPerso-presecondaire-vie-personnelle.pdf','cs':'Maintien de saines relations interpersonnelles','b':'Programme Vie personnelle et relationnelle (PER-2101-2 ; le répertoire 2026-2027 utilise aussi PER-2101-1 pour Santé psychologique)'},
 'PER-2102':{'a':'Pour traiter les situations de la classe Maintien de la santé sexuelle, l’adulte sélectionne judicieusement des moyens et des méthodes de planification des naissances ainsi que de prévention des ITS et du VIH /Sida. Il exprime des choix personnels relativement à des besoins et à un contexte de vie particulier. Il utilise de manière appropriée des ressources particulières d’information, d’aide et de soutien.','u':'https://cdn-contenu.quebec.ca/cdn-contenu/education/formation-generale-adultes/programmes/FGA-DomDevPerso-presecondaire-sante.pdf','cs':'Maintien de la santé sexuelle','b':'Programme Santé (le programme d’études affiche l’ancien code SAN-2102)'}}
for k,v in PROGX.items():
    if k in DB: DB[k].update(v); DB[k].pop('r',None)
for k,e in DB.items():
    if k.startswith('FRE') and e.get('v','').lower().startswith('francisation'): e['v']='Français, langue seconde'
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

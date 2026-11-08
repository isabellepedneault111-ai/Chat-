import re,json
R=open('/root/.claude/uploads/cb5b3ab4-75e9-527d-a36f-eb836d77049f/f278d8ea-Rapport___Programmes_de_tudes_FGA_Que_bec.md',encoding='utf8').read()
parts=re.split(r'^#### ',R,flags=re.M)[1:]
OUT={}; ORDER=[]
def ok(it):
    it=it.strip()
    return 3<len(it)<140 and it[0].isupper() and 'Programme d' not in it and 'Programme de la formation' not in it and not re.search(r'\b(le|la|les|des|du|de|et|à|aux)$',it)
for p in parts:
    head=p.split('\n',1)[0]
    m=re.match(r'([A-Z]{2,4}-[A-Z0-9]{3,5})(?:-(\d+))? — (.+)',head)
    if not m: continue
    sg,u,t=m.groups(); body=p.split('\n',1)[1] if '\n' in p else ''
    body=body.split('\n### ')[0].split('\n## ')[0]
    e={'n':t.strip()}
    dde=re.search(r'\[DDE[^\]]*\]\((https[^)]+)\)',body); prog=re.search(r'Programme d.études \(PDF\) : \[[^\]]*\]\((https[^)]+)\)',body)
    if dde: e['d']=dde.group(1)
    if prog: e['u']=prog.group(1)
    def field(lab):
        m=re.search(r'\*\*'+lab+r'[^*]*\*\* ?: ?(.+)',body); return m.group(1).strip() if m else ''
    def lst(lab):
        m=re.search(r'\*\*'+lab+r'[^*]*\*\* ?:? ?\n((?:- .+\n?)+)',body)
        return [x[2:].strip() for x in m.group(1).strip().split('\n')] if m else []
    for k,lab in [('cs','Classe de situations'),('fs','Familles de situations'),('cv','Compétence visée'),('but','But du cours')]:
        v=field(lab)
        if v and len(v)<300: e[k]=v
    c=[x for x in lst('Compétences disciplinaires') if ok(x)]
    if c: e['c']=c[:4]
    cl=field('Compétences langagières')
    if cl: e['c']=[cl]
    sv=[x for x in (lst('Savoirs essentiels')+lst('Catégories de savoirs')+lst('Savoirs prescrits')) if ok(x)]
    if sv: e['s']=list(dict.fromkeys(sv))[:8]
    a=re.search(r'\*\*Attentes de fin de cours \(extrait\)\*\* ?: ?« (.+?) »',body)
    if a and len(a.group(1))>60:
        x=a.group(1); x=x[:x.rfind('.')+1] if '.' in x else x
        if len(x)>60: e['a']=x[:520]
    OUT[sg]=e; ORDER.append(sg)
json.dump({'db':OUT,'order':ORDER},open('px_db.json','w',encoding='utf8'),ensure_ascii=False)
print(len(OUT)); 
for k in ['MAT-4151','PPS-Z125','LAN-4049','FRA-B121','SCT-4061','HIS-4103','GEO-5102']:
    print(k, json.dumps(OUT.get(k),ensure_ascii=False)[:500])
print(sorted({k.split('-')[0] for k in OUT}))

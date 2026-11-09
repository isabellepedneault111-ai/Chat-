import re,json,glob,os
OUT={}
BOIL=[r'La maîtrise des connaissances suppose.*?compétences?\.', r'Proficiency in subject-specific knowledge (involves|requires).*?competenc(y|ies)\.', r'Les domaines généraux de formation indiqués.*?$']
def clean(seg):
    seg=re.sub(r'Définition du domaine d.évaluation|Definition of the Evaluation Domain','',seg)
    seg=re.sub(r'Page \d+|\b(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|January|February|March|April|May|June|July|August|September|October|November|December) \d{4}','',seg)
    seg=re.sub(r'[A-Z]{2,4}-[A-Z0-9]{3,5}-\d+','',seg)
    seg=seg.replace('•',' ').replace('',' ').replace('','').replace('- ',' ')
    seg=re.sub(r'\s+',' ',seg).strip()
    for b in BOIL: seg=re.sub(b,'',seg,flags=re.S|re.I)
    seg=re.sub(r'\b(Maîtrise des connaissances|Proficiency in Subject-Specific Knowledge)\b','',seg)
    return re.sub(r'\s+',' ',seg).strip()
for f in glob.glob('dde/*.raw'):
    k=os.path.basename(f)[:-4]
    t=open(f,encoding='utf8',errors='ignore').read().replace('\f','\n')
    fr='Renseignements généraux' in t
    st=[m.start() for m in re.finditer(r'Renseignements généraux|General Information',t)]
    en=[m.start() for m in re.finditer(r'Précisions sur le contenu de l.évaluation|Explanation of the Evaluation Content',t)]
    if not st:
        n=[m.start() for m in re.finditer(r'\n\s*3\.1\s*\n?\s*Notions|Notions\s*\n',t)]
        p=[m.start() for m in re.finditer(r'Tableau des pondérations',t)]
        if len(n)>=1:
            a=n[-1]; b=[x for x in p if x>a]; seg=clean(t[a:(b[0] if b else a+3000)])
            seg=re.sub(r'^3\.1 ?','',seg); seg=re.sub(r'\b\d(\.\d)+\b','',seg)
            OUT[k]={'sit':'','el':re.sub(r'\s+',' ',seg)[:1100]}
        continue
    a=st[-1] if len(st)>1 else st[0]; b=[x for x in en if x>a]; seg=t[a:(b[0] if b else a+4000)]
    m=re.search(r'Éléments essentiels visés par l.évaluation|Subject-Specific Competencies|Essential Elements',seg)
    head=clean(seg[:m.start()]) if m else ''
    body=clean(seg[m.start():]) if m else clean(seg)
    body=re.sub(r'^Éléments essentiels visés par l.évaluation ?','',body)
    # situations : ce qui suit « Classe de situations » / « Familles de situations »
    sit=re.search(r'(Classe de situations|Familles de situations|Situations de communication|Broad Areas of Learning|Families of Situations)(.*)$',head)
    OUT[k]={'sit':clean(sit.group(2))[:260] if sit else '','el':body[:1100]}
json.dump(OUT,open('dde_db.json','w',encoding='utf8'),ensure_ascii=False)
print(len(OUT))
for k in ['ISP-3018','FRE-3101','ENG-3101','PER-5201','INF-5067','LAN-5079','MAT-4261']:
    print('==',k,json.dumps(OUT.get(k),ensure_ascii=False)[:700])

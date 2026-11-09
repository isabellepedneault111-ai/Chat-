import re,json,glob,os
FOOT=re.compile(r'^(Définition du domaine d.évaluation|Definition of the Evaluation Domain|Page \d+|(Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre|January|February|March|April|May|June|July|August|September|October|November|December) \d{4}|[A-Z]{2,4}-[A-Z0-9]{3,5}-\d+)$')
BOIL=re.compile(r'(La maîtrise des connaissances suppose|Proficiency in subject-specific knowledge|leur acquisition|its acquisition|application et leur|lien d.interdépendance|^d.interdépendance$|^lien$|^entre$|^les$|^et$|^de la compétence|connaissances et les critères|connaissances$|critères$|d.évaluation des$|compétences\.$|competencies\.$|^d’évaluation|linked with|for the$)',re.I)
HEAD=re.compile(r'^(Éléments essentiels visés par l.évaluation|Essential Elements.*|Compétences? disciplinaires?( \d)?|Compétence langagière \d|Subject-Specific Competencies|Catégories de savoirs|Categories of Knowledge|Critères? d.évaluation.*|Evaluation Criteria.*|Maîtrise des connaissances|Proficiency in Subject-Specific Knowledge)$')
BUL=re.compile(r'^[••-]\s*')
def items(lines):
    out=[]; pend_nums=[]
    for l in lines:
        l=BUL.sub('',l).strip()
        if not l or FOOT.match(l) or BOIL.search(l): continue
        if re.fullmatch(r'\d+(\.\d+)?\.?',l): pend_nums.append(l); continue
        m=re.match(r'^(\d+(\.\d+)?\.?)\s+(.*)',l)
        if m: out.append(m.group(3)); continue
        if out and (l[0].islower() or l[0] in '(«') : out[-1]+=' '+l; continue
        out.append(l)
    res=[]
    for x in out:
        x=re.sub(r'\s+',' ',x)
        x=re.sub(r'\s(acquisition|application and mobilization|its acquisition|leur acquisition)\b.*$','',x)
        x=re.sub(r'\s(des|the|and|et|de)$','',x).strip(' ;')
        if len(x)<3 or len(x)>220: continue
        if re.match(r'^(Les domaines généraux|The broad area|Le domaine général)',x): continue
        res.append(x)
    return res
DB={}
for f in glob.glob('dde/*.raw'):
    k=os.path.basename(f)[:-4]
    t=open(f,encoding='utf8',errors='ignore').read().replace('\f','\n')
    st=[m.start() for m in re.finditer(r'Éléments essentiels visés par l.évaluation|Essential Elements Targeted',t)]
    en=[m.start() for m in re.finditer(r'Précisions sur le contenu de l.évaluation|Explanation of the Evaluation Content',t)]
    if not st: continue
    a=st[-1] if len(st)>1 else st[0]; b=[x for x in en if x>a]; seg=t[a:(b[0] if b else a+5000)]
    L=[x.strip() for x in seg.split('\n')]
    # séparer partie « éléments » et partie « critères »
    ci=next((i for i,x in enumerate(L) if re.match(r'^(Critères d.évaluation|Evaluation Criteria)$',x)),len(L))
    ess=[x for x in L[1:ci] if not HEAD.match(x)]; cri=[x for x in L[ci+1:] if not HEAD.match(x)]
    comp=[];sav=[]
    for it in items(ess):
        (comp if re.match(r'^(Compétence à|Interagir|Produire|Comprendre|Lire|Écrire|Communiquer|Utiliser|Résoudre|Chercher|Mettre|Déployer|S’interroger|Faire|Interpréter|Uses|Reads|Writes|Compréhension orale|Production orale|Compréhension écrite|Production écrite)',it) and len(comp)<6 else sav).append(it)
    crit=[x for x in items(cri) if not re.match(r'^(Critères?|Evaluation Criteria)',x)]
    DB[k]={'dc':comp[:6],'ds':sav[:12],'dk':crit[:10]}
json.dump(DB,open('dde_struct.json','w',encoding='utf8'),ensure_ascii=False)
print(len(DB))
for k in ['ISP-3018','FRE-3101','ENG-3101','PER-5201','INF-5067','LAN-5079','EVR-5002','MAT-4151','SCT-4061']:
    print('==',k,json.dumps(DB.get(k),ensure_ascii=False)[:900])

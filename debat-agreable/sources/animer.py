# Ajoute de vraies animations PowerPoint au .pptx produit par deck.js :
# - transition « fondu » entre les diapos
# - apparition en cascade (fondu + léger zoom) de chaque forme, automatique à l'ouverture de la diapo
# Les titres (espaces réservés) restent fixes; les diapos qui ont déjà une minuterie (vidéos) gardent la leur.
import re, sys, zipfile, shutil, os
src = sys.argv[1]; tmp = src + '.tmp'
STEP, MAXD, DUR = 140, 2600, 450

def timing(ids):
    n = [3]  # compteur d'identifiants cTn
    def nid():
        n[0] += 1; return n[0]
    effects = []
    for i, sp in enumerate(ids):
        delay = min(i * STEP, MAXD)
        a, b2, c, d2 = nid(), nid(), nid(), nid()
        effects.append(
            f'<p:par><p:cTn id="{a}" presetID="53" presetClass="entr" presetSubtype="16" fill="hold" nodeType="withEffect">'
            f'<p:stCondLst><p:cond delay="{delay}"/></p:stCondLst><p:childTnLst>'
            f'<p:set><p:cBhvr><p:cTn id="{b2}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
            f'<p:tgtEl><p:spTgt spid="{sp}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>'
            f'<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="{c}" dur="{DUR}" fill="hold"/><p:tgtEl><p:spTgt spid="{sp}"/></p:tgtEl><p:attrNameLst><p:attrName>ppt_w</p:attrName></p:attrNameLst></p:cBhvr>'
            f'<p:tavLst><p:tav tm="0"><p:val><p:strVal val="#ppt_w*0.85"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_w"/></p:val></p:tav></p:tavLst></p:anim>'
            f'<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="{d2}" dur="{DUR}"/><p:tgtEl><p:spTgt spid="{sp}"/></p:tgtEl></p:cBhvr></p:animEffect>'
            f'</p:childTnLst></p:cTn></p:par>')
    return ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
            '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
            '<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>'
            + ''.join(effects) +
            '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn>'
            '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
            '</p:childTnLst></p:cTn></p:par></p:tnLst>'
            '<p:bldLst>' + ''.join(f'<p:bldP spid="{sp}" grpId="0"/>' for sp in ids if sp in TXT) + '</p:bldLst></p:timing>')

zin = zipfile.ZipFile(src); zout = zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED)
done = 0
for item in zin.infolist():
    data = zin.read(item.filename)
    if re.match(r'ppt/slides/slide\d+\.xml$', item.filename):
        x = data.decode('utf8')
        x = x.replace('</p:clrMapOvr>', '</p:clrMapOvr><p:transition spd="med"><p:fade/></p:transition>', 1) if '<p:transition' not in x else x
        if '<p:timing' not in x:
            ids, TXT = [], set()
            for m in re.finditer(r'<p:(sp|pic)>(.*?)</p:\1>', x, re.S):
                body = m.group(2)
                if '<p:ph' in body or 'videoFile' in body: continue
                sid = re.search(r'<p:cNvPr id="(\d+)"', body)
                if sid:
                    ids.append(sid.group(1))
                    if '<p:txBody>' in body: TXT.add(sid.group(1))
            globals()['TXT'] = TXT
            if ids:
                t = timing(ids)
                x = x.replace('</p:sld>', t + '</p:sld>') if '<p:extLst>' not in x.split('</p:cSld>')[1] else x.replace('<p:extLst>', t + '<p:extLst>', 1)
                done += 1
        data = x.encode('utf8')
    zout.writestr(item, data)
zout.close(); zin.close(); shutil.move(tmp, src)
print('diapos animées :', done)

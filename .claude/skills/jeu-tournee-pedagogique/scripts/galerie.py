"""Fabrique une galerie HTML de tous les décors (pour choisir les visuels).
Usage : python3 galerie.py sortie.html [--png sortie.png]"""
import os, sys, subprocess, json
ICI = os.path.dirname(os.path.abspath(__file__))
MOT = os.path.join(ICI, "..", "moteur")
NOMS = {"cafe": "Café", "depanneur": "Dépanneur", "magasin": "Magasin (Halloween)", "epicerie": "Épicerie",
        "cinema": "Cinéma", "restaurant": "Restaurant / pizzéria", "arena": "Aréna", "grande-surface": "Grande surface",
        "pharmacie": "Pharmacie", "centre-commercial": "Centre commercial", "maison-halloween": "Maison d’Halloween",
        "ecole": "École", "bibliotheque": "Bibliothèque", "parc": "Parc", "banque": "Banque", "clinique": "Clinique",
        "maison": "Maison", "cuisine": "Cuisine", "gare": "Arrêt d’autobus", "casse-croute": "Casse-croûte", "cafeteria": "Cafétéria", "planete": "Planète", "station-spatiale": "Station spatiale", "observatoire": "Observatoire", "lancement": "Rampe de lancement", "base-lunaire": "Base lunaire", "tour-controle": "Tour de contrôle", "atelier-robot": "Atelier robot", "constellation": "Constellation", "asteroides": "Astéroïdes", "cockpit": "Cockpit"}
def main():
    out = sys.argv[1]
    js = open(os.path.join(MOT, "decors.js"), encoding="utf-8").read()
    fonts = os.path.join(ICI, "..", "assets", "fonts")
    html = f"""<!doctype html><html lang="fr-CA"><head><meta charset="utf-8"><title>Galerie des décors</title>
<style>@font-face{{font-family:PH;src:url("{fonts}/PatrickHand-Regular.ttf")}}body{{font-family:Arial,sans-serif;background:#FFFDF9;color:#4A4F55;margin:16px}}
.g{{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}}.c{{background:#fff;border-radius:16px;padding:8px;box-shadow:0 4px 14px rgba(0,0,0,.08)}}
.c b{{display:block;text-align:center;margin-top:4px}}.c code{{display:block;text-align:center;font-size:13px;color:#C9733A}}svg{{width:100%;display:block}}</style></head>
<body><h1 style="font-family:PH">Galerie des décors</h1><div class="g" id="g"></div><script>{js}
document.head.insertAdjacentHTML("beforeend","<style>"+DECORS_CSS+"</style>");
const N={json.dumps(NOMS, ensure_ascii=False)};const C=["#B5121B","#3B6EA5","#2E7D32","#D7261E","#5B3F8C","#C0551F","#1F3A93","#0B6FC4","#00539B","#7A4E2D","#D9661B","#8A6100","#5C7A3A","#2E6B45","#4A6FA5","#A9372B","#C9733A","#2E9E5B","#7B5AA6"];
document.getElementById("g").innerHTML=Object.keys(DECORS).map((k,i)=>`<div class="c">${{decor(k,{{n:"Nom du lieu",c:C[i%C.length]}})}}<b>${{N[k]||k}}</b><code>${{k}}</code></div>`).join("");</script></body></html>"""
    open(out, "w", encoding="utf-8").write(html)
    if "--png" in sys.argv:
        png = sys.argv[sys.argv.index("--png") + 1]
        subprocess.run(["node", "-e", f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage({{viewport:{{width:1400,height:900}}}});await p.goto('file://{os.path.abspath(out)}');await p.waitForTimeout(1800);await p.screenshot({{path:'{png}',fullPage:true}});await b.close()}})()"""], check=True)
    print(out)
if __name__ == "__main__":
    main()

"""Construit le jeu à partir d’un fichier de configuration.
Usage : python3 construire.py config.json dossier_sortie [--autonome]
Produit dossier_sortie/<fichier>.html + fonts/ + lib/ (prêt pour Netlify ou n’importe quel hébergement statique).
Avec --autonome : UN SEUL fichier HTML (polices, jsPDF et html2canvas intégrés), à télécharger, à glisser
sur Netlify Drop ou à ouvrir directement. C’est la sortie à privilégier dans le clavardage claude.ai."""
import json, os, sys, shutil, html, base64
ICI = os.path.dirname(os.path.abspath(__file__))
RAC = os.path.join(ICI, "..")
sys.path.insert(0, ICI)
from valider import valider

def autonome(page):
    A = os.path.join(RAC, "assets")
    b64 = lambda f: base64.b64encode(open(os.path.join(A, "fonts", f), "rb").read()).decode()
    page = page.replace("url(fonts/PatrickHand-Regular.ttf)", "url(data:font/ttf;base64," + b64("PatrickHand-Regular.ttf") + ")")
    page = page.replace("url(fonts/Nunito-VF.ttf)", "url(data:font/ttf;base64," + b64("Nunito-VF.ttf") + ")")
    for f in ("jspdf.umd.min.js", "html2canvas.min.js"):
        js = open(os.path.join(A, f), encoding="utf-8").read().replace("</script", "<\\/script")
        page = page.replace(f'<script src="lib/{f}"></script>', "<script>" + js + "</script>")
    return page

def construire(cfg_path, out, seul=False):
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    err, warn = valider(cfg)
    for w in warn: print("Avertissement :", w)
    if err:
        for e in err: print("ERREUR :", e)
        sys.exit("Construction annulée : corrige les erreurs ci-dessus.")
    tpl = open(os.path.join(RAC, "moteur", "moteur.html"), encoding="utf-8").read()
    dec = open(os.path.join(RAC, "moteur", "decors.js"), encoding="utf-8").read()
    m = (cfg.get("mascotte") or {}).get("fichier", "renard")
    mas = "" if m in ("", "aucune") else open(os.path.join(RAC, "assets", "mascottes", m + ".svg"), encoding="utf-8").read().strip()
    if "`" in mas or "${" in mas: sys.exit("Mascotte invalide (accent grave ou ${ interdit).")
    js = json.dumps(cfg, ensure_ascii=False).replace("</", "<\\/")
    page = (tpl.replace("__TITRE__", html.escape(cfg["titre"])).replace("__DECORS__", dec)
               .replace("__MASCOTTE__", mas).replace("__CONFIG__", js))
    os.makedirs(out, exist_ok=True)
    nom = (cfg.get("fichier") or cfg["id"]) + ".html"
    if seul:
        open(os.path.join(out, nom), "w", encoding="utf-8").write(autonome(page))
        print(os.path.join(out, nom), "(fichier autonome)")
        return os.path.join(out, nom)
    open(os.path.join(out, nom), "w", encoding="utf-8").write(page)
    os.makedirs(os.path.join(out, "fonts"), exist_ok=True); os.makedirs(os.path.join(out, "lib"), exist_ok=True)
    for f in ("PatrickHand-Regular.ttf", "Nunito-VF.ttf"):
        shutil.copy(os.path.join(RAC, "assets", "fonts", f), os.path.join(out, "fonts", f))
    for f in ("jspdf.umd.min.js", "html2canvas.min.js"):
        shutil.copy(os.path.join(RAC, "assets", f), os.path.join(out, "lib", f))
    print(os.path.join(out, nom))
    return os.path.join(out, nom)

if __name__ == "__main__":
    construire(sys.argv[1], sys.argv[2], "--autonome" in sys.argv)

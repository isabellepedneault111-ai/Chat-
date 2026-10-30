"""Construit la trousse Z101 (PDF) : python3 construire.py [blocs|evaluation|maitre|materiel|tout] [C1 C2 ...]"""
import os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from style import page, doc, ico, qr, CAT, SITE
from blocs import B, ORDRE
import style as _style
from illus_z101 import deco_page, bouquet, pour
_style.orbite = deco_page

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
TMP = "/tmp/claude-0/pps/z101html"
RENDU = os.path.join(ICI, "rendre.js")


def slug(s):
    s = s.replace("’", "'")
    for a, b in [("é", "e"), ("è", "e"), ("ê", "e"), ("à", "a"), ("ç", "c"), ("ô", "o"), ("î", "i"), ("û", "u"), ("É", "E"), ("'", "-")]:
        s = s.replace(a, b)
    return re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-")


def savoirs_html(b):
    return "".join(f'<span class="sv">{s}</span>' for s in b["savoirs"]) or '<span class="sv o">Point de départ du cours</span>'


def mission(bid, b):
    k = CAT[b["cat"]]
    titre_lien, url = b["lien"]
    corps = f'''
<p class="lede">{b["lede"]}</p>
<div class="g21 mt2">
 <div><h2>{ico("etapes")}Ce que je vais faire</h2><ol class="steps">{"".join(f"<li>{x}</li>" for x in b["faire"])}</ol></div>
 <div class="card t"><div style="text-align:center;margin-bottom:4px">{bouquet(pour(k["c"]), 44)}</div><h2>{ico("cible")}Pourquoi</h2><p>{b["pourquoi"]}</p>
  <div class="tag mt" style="color:var(--c)">{k["crit"] or "Avant de commencer"}</div><div class="small"><b>{k["nom"]}</b></div>
  <div class="savoirs mt">{savoirs_html(b)}</div></div>
</div>
<div class="g2 mt2">
 <div class="card"><h2>{ico("ok")}Je sais que j'ai réussi quand…</h2><ul class="ticks">{"".join(f"<li>{x}</li>" for x in b["reussi"])}</ul></div>
 <div class="card d"><h2>{ico("ecran")}En ligne</h2><div class="qr"><div style="background:#fff;padding:6px;border-radius:8px">{qr(url, 70)}</div>
  <div><b>{titre_lien}</b><div class="xs" style="color:#6B7189">{url.replace("https://", "")}</div></div></div></div>
</div>
<div class="card k mt2"><h2>{ico("lien")}Avec mon atelier</h2><p class="small">Après chaque séance, je remplis mon journal d'atelier. Ce que j'y écris m'aide à remplir ce bloc.</p></div>
<div class="fill"></div>
<div class="card mt" style="border-style:dashed"><h2>{ico("crayon")}Avant de commencer : ce que j'en pense</h2><div class="lines l2"></div></div>'''
    return page(b["cat"], b["titre"], corps, no=bid, kick="Ma mission", sous=b["sous"], bloc=f"Bloc {bid}", etiquette="Ma mission")


def bloc_jobs(bid):
    b = B[bid]
    d = os.path.join(RACINE, f"Bloc-{bid}_{slug(b['titre'])}")
    os.makedirs(d, exist_ok=True)
    args = dict(no=bid, sous=b["sous"], bloc=f"Bloc {bid}")
    jobs = [(f"{bid}_1", doc(f"{bid} Ma mission", [mission(bid, b)]), os.path.join(d, f"{bid}_1_Ma-mission.pdf"))]
    ps = [page(b["cat"], b["titre"] if i == 0 else "", x, kick="Feuille de notes", etiquette="Feuille de notes", n=i + 1, tot=len(b["notes"]), **args) for i, x in enumerate(b["notes"])]
    jobs.append((f"{bid}_2", doc(f"{bid} Feuille de notes", ps), os.path.join(d, f"{bid}_2_Feuille-de-notes.pdf")))
    ps = [page(b["cat"], b["titre"] if i == 0 else "", x, kick="Je m'exerce", etiquette="Je m'exerce", n=i + 1, tot=len(b["exos"]), **args) for i, x in enumerate(b["exos"])]
    jobs.append((f"{bid}_3", doc(f"{bid} Je m'exerce", ps), os.path.join(d, f"{bid}_3_Je-m-exerce.pdf")))
    return jobs


def rendre(jobs):
    os.makedirs(TMP, exist_ok=True)
    a = []
    for nom, html, sortie in jobs:
        h = os.path.join(TMP, nom + ".html"); open(h, "w").write(html); a += [h, sortie]
    subprocess.run(["node", RENDU] + a, check=True)


if __name__ == "__main__":
    quoi = sys.argv[1] if len(sys.argv) > 1 else "tout"
    seuls = sys.argv[2:] or ORDRE
    jobs = []
    if quoi in ("blocs", "tout"):
        for bid in seuls: jobs += bloc_jobs(bid)
    if quoi in ("brise", "tout"):
        import brise
        jobs += brise.jobs()
    if quoi in ("evaluation", "maitre", "materiel", "tout"):
        import autres
        if quoi in ("evaluation", "tout"): jobs += autres.evaluation()
        if quoi in ("maitre", "tout"): jobs += autres.maitre()
        if quoi in ("materiel", "tout"): jobs += autres.materiel()
    rendre(jobs)

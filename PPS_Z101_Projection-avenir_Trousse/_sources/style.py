"""Style de la trousse Z101 : sobre, adulte, éditorial. Aucun emoji, icônes au trait."""
import io, re
import segno

INK = "#0E1330"
COURS = "PPS-Z101-3"
TITRE_COURS = "Projection vers l'avenir"
SITE = "https://pps-z101-avenir.netlify.app"

# 3 catégories de savoirs = 3 couleurs
CAT = {
    "disp": dict(nom="Dispositions personnelles et sociales", court="Me connaître", c="#5B4BFF", cl="#EEEDFF", crit="Critère 1"),
    "pot": dict(nom="Potentiel d'action", court="Ce qui me fait avancer", c="#F2542D", cl="#FFEDE8", crit="Critère 2"),
    "proj": dict(nom="Composantes du projet", court="Mon projet", c="#0E9F8E", cl="#E2F6F3", crit="Critère 3"),
    "base": dict(nom="Participation sociale", court="Point de départ", c=INK, cl="#ECEEF4", crit=""),
}

ICONES = {  # icônes au trait, 24 x 24
    "cible": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    "etapes": '<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="18" cy="6" r="2"/><circle cx="14" cy="18" r="2"/>',
    "ok": '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9"/>',
    "lien": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    "ecran": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    "crayon": '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',
    "idee": '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    "personne": '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    "groupe": '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.8"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M15 14.5a5 5 0 0 1 6.5 4.5"/>',
    "logique": '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M7.4 11l9.2-4M7.4 13l9.2 4"/>',
    "drapeau": '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    "horloge": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "maison": '<path d="M3 11l9-7 9 7M5 9.5V20h14V9.5"/>',
    "fusee": '<path d="M12 3c3 2.5 4.5 6 4 11H8c-.5-5 1-8.5 4-11z"/><path d="M8 14l-3 4h4M16 14l3 4h-4M10 18l2 3 2-3"/>',
    "loupe": '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
    "attention": '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.2v.3"/>',
}


def ico(nom, taille=18, couleur="currentColor", ep=1.8):
    return (f'<svg class="ic" viewBox="0 0 24 24" width="{taille}" height="{taille}" fill="none" stroke="{couleur}" '
            f'stroke-width="{ep}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONES[nom]}</svg>')


def qr(url, taille=64):
    q = segno.make(url, error="m")
    b = io.BytesIO()
    q.save(b, kind="svg", scale=1, border=0, dark=INK, xmldecl=False, svgns=True, nl=False)
    s = b.getvalue().decode()
    m = re.search(r'width="(\d+)" height="(\d+)"', s)
    return s.replace(m.group(0), f'width="{taille}" height="{taille}" viewBox="0 0 {m.group(1)} {m.group(2)}"', 1)


def orbite(c, cl):
    """Motif : bandes diagonales fines, en haut à droite."""
    return f'''<svg class="deco" viewBox="0 0 260 150" width="260" height="150" aria-hidden="true">
<polygon points="120,0 260,0 260,140" fill="{cl}"/><g stroke="{c}" stroke-width="1.2" opacity=".55">
<line x1="150" y1="0" x2="260" y2="110"/><line x1="180" y1="0" x2="260" y2="80"/><line x1="210" y1="0" x2="260" y2="50"/></g>
<rect x="232" y="18" width="10" height="10" fill="{c}"/></svg>'''


CSS = r"""
@page { size: 8.5in 11in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; color: #1A1F36; font-size: 11pt; line-height: 1.45; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-feature-settings: "ss01", "cv11"; }
.page { width: 8.5in; height: 11in; padding: .5in .55in .38in; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; background: #fff; }
.page:last-child { page-break-after: auto; }
.deco { position: absolute; top: 0; right: 0; z-index: 0; }
.page > * { position: relative; z-index: 1; }
.page > .deco { position: absolute; z-index: 0; }
.run { display: flex; justify-content: space-between; align-items: center; font-size: 7.6pt; letter-spacing: .14em; text-transform: uppercase; color: #6B7189; font-weight: 600; }
.run b { color: var(--c); font-weight: 800; }
.chip { display: inline-flex; align-items: center; gap: 6px; background: var(--c); color: #fff; border-radius: 99px; padding: 3px 10px 3px 8px; font-weight: 800; letter-spacing: .08em; }
.head { margin: 22px 0 14px; display: flex; gap: 18px; align-items: flex-end; }
.head .no { font-size: 64pt; font-weight: 900; line-height: .78; letter-spacing: -.04em; color: transparent; -webkit-text-stroke: 1.6px var(--c); }
.head .kick { font-size: 9pt; letter-spacing: .16em; text-transform: uppercase; font-weight: 800; color: var(--c); }
.head h1 { font-size: 27pt; line-height: 1.02; margin: 3px 0 0; font-weight: 850; letter-spacing: -.025em; color: #0E1330; }
.head .sous { font-size: 11pt; color: #4A5068; margin-top: 5px; max-width: 5.6in; }
h2 { font-size: 12.5pt; margin: 0 0 6px; font-weight: 800; letter-spacing: -.01em; color: #0E1330; display: flex; align-items: center; gap: 8px; }
h2 .ic { color: var(--c); }
h3 { font-size: 10.5pt; margin: 6px 0 3px; font-weight: 800; }
p { margin: 0 0 6px; }
ul, ol { margin: 3px 0 6px; padding-left: 18px; }
li { margin: 3px 0; }
.lede { font-size: 13pt; line-height: 1.38; color: #1A1F36; font-weight: 500; }
.lede b { color: var(--c); }
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.g21 { display: grid; grid-template-columns: 1.6fr 1fr; gap: 14px; }
.card { border: 1px solid #E1E4EE; border-radius: 14px; padding: 12px 14px; background: #fff; break-inside: avoid; }
.card.t { background: var(--cl); border-color: transparent; }
.card.d { background: #0E1330; color: #E9EBF5; border: 0; }
.card.d h2 { color: #fff; } .card.d h2 .ic { color: var(--c2, #FF8A6B); }
.card.k { border: 1.6px solid var(--c); }
.mt { margin-top: 12px; } .mt2 { margin-top: 18px; }
.steps { list-style: none; padding: 0; margin: 4px 0; counter-reset: s; }
.steps > li { counter-increment: s; display: grid; grid-template-columns: 30px 1fr; gap: 10px; align-items: baseline; padding: 7px 0; border-bottom: 1px solid #ECEEF4; margin: 0; }
.steps > li:last-child { border: 0; }
.steps > li::before { content: counter(s, decimal-leading-zero); font-weight: 900; color: var(--c); font-size: 11pt; letter-spacing: -.02em; }
.ticks { list-style: none; padding: 0; margin: 3px 0; }
.ticks li { display: flex; gap: 8px; align-items: flex-start; margin: 5px 0; }
.ticks li::before { content: ""; flex: none; width: 13px; height: 13px; border: 1.6px solid var(--c); border-radius: 4px; margin-top: 2px; }
.savoirs { display: flex; flex-wrap: wrap; gap: 6px; }
.sv { font-size: 8.6pt; font-weight: 700; border-radius: 6px; padding: 2px 8px; background: var(--cl); color: var(--c); }
.sv.o { background: #fff; border: 1px solid #D5D9E5; color: #4A5068; }
.lines { background-image: repeating-linear-gradient(transparent 0 26px, #CDD2E0 26px 27px); min-height: 54px; }
.l2 { height: 54px; } .l3 { height: 81px; } .l4 { height: 108px; } .l5 { height: 135px; }
.fill { flex: 1; }
.box { border: 1.3px dashed #B9BFD0; border-radius: 12px; }
.amorce { color: #6B7189; font-size: 10pt; font-style: italic; }
.ex { border: 1px solid #E1E4EE; border-radius: 14px; padding: 11px 14px 10px; margin-bottom: 10px; break-inside: avoid; }
.ex .h { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
.ex .h .n { font-weight: 900; color: #fff; background: var(--c); border-radius: 8px; padding: 1px 8px; font-size: 10.5pt; }
.ex .h b { font-size: 11.5pt; letter-spacing: -.01em; }
.ex .h .tag { margin-left: auto; }
.tag { font-size: 7.6pt; letter-spacing: .1em; text-transform: uppercase; font-weight: 800; color: #6B7189; }
.logic { display: flex; gap: 8px; align-items: center; background: #F4F5F9; border-radius: 10px; padding: 6px 10px; font-size: 9.6pt; color: #3A4060; margin-top: 6px; }
.logic .ic { color: var(--c); flex: none; }
table.t { border-collapse: collapse; width: 100%; font-size: 9.8pt; }
table.t th, table.t td { border-bottom: 1px solid #E1E4EE; padding: 6px 8px; text-align: left; vertical-align: top; }
table.t th { font-size: 7.8pt; letter-spacing: .1em; text-transform: uppercase; color: #6B7189; font-weight: 800; border-bottom: 1.6px solid #0E1330; }
table.t.grid td { border: 1px solid #E1E4EE; }
table.t.grid th { border: 1px solid #E1E4EE; border-bottom: 1.6px solid #0E1330; }
.cb { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #8A90A6; border-radius: 3px; vertical-align: -1px; margin-right: 5px; }
.opt { display: inline-flex; align-items: center; margin: 3px 12px 3px 0; font-size: 10pt; }
.scale { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.scale div { border-radius: 8px; padding: 5px 8px; font-size: 9.2pt; font-weight: 700; display: flex; gap: 6px; align-items: center; }
.dot { width: 12px; height: 12px; border-radius: 50%; border: 1.6px solid currentColor; display: inline-block; flex: none; }
.s1 { background: #E5F5EC; color: #127A45; } .s2 { background: #FFF5D9; color: #946200; } .s3 { background: #FDE9E5; color: #B3341B; }
.persona { display: flex; gap: 12px; align-items: flex-start; }
.persona .av { flex: none; width: 46px; height: 46px; border-radius: 50%; background: #0E1330; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15pt; letter-spacing: -.03em; }
.quote { border-left: 3px solid var(--c); padding: 2px 0 2px 12px; font-size: 10.4pt; color: #2A3050; }
.mots { flex: 1 1 0; min-height: 0; border: 1.3px dashed #B9BFD0; border-radius: 14px; padding: 10px 14px; display: flex; flex-direction: column; margin-top: 12px; }
.mots .lines { flex: 1; }
.foot { margin-top: auto; padding-top: 8px; font-size: 7.4pt; color: #8A90A6; display: flex; justify-content: space-between; border-top: 1px solid #E6E8F0; letter-spacing: .04em; }
.qr { display: flex; gap: 12px; align-items: center; }
.qr .u { font-size: 8.6pt; color: #4A5068; word-break: break-all; }
.small { font-size: 9.6pt; } .xs { font-size: 8.4pt; color: #6B7189; }
.big { font-size: 15pt; font-weight: 850; letter-spacing: -.02em; }
.dense { font-size: 9.2pt; line-height: 1.36; }
.dense h2 { font-size: 11.2pt; } .dense h3 { font-size: 9.8pt; }
.dense .card { padding: 9px 11px; border-radius: 11px; }
.dense li { margin: 1.5px 0; }
.dense table.t { font-size: 8.6pt; } .dense table.t td, .dense table.t th { padding: 4px 6px; }
.phase { border-radius: 10px; padding: 7px 10px; }
.phase .tag { display: block; margin-bottom: 2px; }
.pa { background: #EEF0FF; } .pp { background: #FFF1EA; } .pap { background: #E5F6F2; }
.cover { background: #0E1330; color: #fff; padding: .7in .7in .5in; }
.cover h1 { font-size: 48pt; line-height: .95; letter-spacing: -.035em; font-weight: 900; margin: 0; }
.cover .kick { color: #FF8A6B; font-size: 10pt; letter-spacing: .2em; text-transform: uppercase; font-weight: 800; }
.cover .sous { font-size: 14pt; color: #C9CDE3; margin-top: 14px; max-width: 5.2in; line-height: 1.35; }
.cover .foot { color: #8C92B5; border-color: #2A3060; }
.cut { border: 1.2px dashed #B9BFD0; }
"""


def doc(titre, pages):
    return (f"<!doctype html><html lang='fr-CA'><head><meta charset='utf-8'><title>{titre}</title>"
            f"<style>{CSS}</style></head><body>{''.join(pages)}</body></html>")


def page(cat, titre, corps, *, no="", kick="", sous="", bloc="", etiquette="", n=1, tot=1, deco=True):
    k = CAT[cat]
    run = (f'<div class="run"><span class="chip">{bloc}</span><span>{COURS} · {TITRE_COURS}</span>'
           f'<span><b>{etiquette}</b></span></div>') if bloc else (
        f'<div class="run"><span>{COURS} · {TITRE_COURS}</span><span><b>{etiquette}</b></span></div>')
    head = (f'<div class="head">{f"<div class=no>{no}</div>" if no else ""}<div><div class="kick">{kick}</div>'
            f'<h1>{titre}</h1>{f"<div class=sous>{sous}</div>" if sous else ""}</div></div>') if titre else ""
    return (f'<section class="page" style="--c:{k["c"]};--cl:{k["cl"]}">{orbite(k["c"], k["cl"]) if deco else ""}'
            f'{run}{head}{corps}<div class="foot"><span>CFGA De La Jonquière · Participation sociale · {COURS}</span>'
            f'<span>{etiquette} · {n}/{tot}</span></div></section>')

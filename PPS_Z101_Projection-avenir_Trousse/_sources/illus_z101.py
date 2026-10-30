"""Illustrations du cours Projection vers l'avenir : se connaître, avancer, bâtir son projet. Style plat, peu d'encre."""
VI, CO, SA, I = "#5B4BFF", "#F2542D", "#0E9F8E", "#1A1F36"
VIL, COL, SAL = "#EEEDFF", "#FFEDE8", "#E2F6F3"

PIECES = {
 "boussole": f'<circle cx="50" cy="50" r="34" fill="{VIL}" stroke="{VI}" stroke-width="3"/><circle cx="50" cy="50" r="26" fill="#fff" stroke="{VI}" stroke-width="1.5"/><path d="M50 28l7 22-7 22-7-22z" fill="{CO}"/><path d="M50 50l7 0-7 22-7-22z" fill="{I}" opacity=".85"/><circle cx="50" cy="50" r="3" fill="#fff" stroke="{I}" stroke-width="1.5"/><g fill="{VI}" font-size="9" font-weight="800" text-anchor="middle"><text x="50" y="22">N</text></g>',
 "ampoule": f'<path d="M50 16a22 22 0 0 0-13 40c3 3 5 6 5 10h16c0-4 2-7 5-10a22 22 0 0 0-13-40z" fill="#FFF6D6" stroke="{I}" stroke-width="3"/><path d="M42 72h16M44 80h12" stroke="{I}" stroke-width="3" stroke-linecap="round"/><path d="M45 50l5 8 5-8" stroke="{CO}" stroke-width="2.5" fill="none"/><g stroke="#E3A21A" stroke-width="3" stroke-linecap="round"><path d="M50 4v5M22 16l4 4M78 16l-4 4M12 40h5M83 40h5"/></g>',
 "miroir": f'<ellipse cx="50" cy="42" rx="24" ry="30" fill="{VIL}" stroke="{VI}" stroke-width="3"/><path d="M40 30q6-8 14-6" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M50 72v14M38 88h24" stroke="{I}" stroke-width="3" stroke-linecap="round"/>',
 "pousse": f'<path d="M30 70h40l-5 18H35z" fill="{COL}" stroke="{CO}" stroke-width="3"/><path d="M50 70V40" stroke="{SA}" stroke-width="3.5"/><path d="M50 50c-14 0-20-10-20-20 12 0 20 6 20 20z" fill="{SAL}" stroke="{SA}" stroke-width="3"/><path d="M50 42c0-14 8-22 22-22 0 12-8 22-22 22z" fill="{SAL}" stroke="{SA}" stroke-width="3"/>',
 "sac": f'<path d="M28 38c0-10 8-16 22-16s22 6 22 16v44H28z" fill="{COL}" stroke="{CO}" stroke-width="3" stroke-linejoin="round"/><path d="M40 22c0-8 20-8 20 0" fill="none" stroke="{I}" stroke-width="3"/><rect x="36" y="54" width="28" height="18" rx="4" fill="#fff" stroke="{CO}" stroke-width="2.5"/><path d="M36 62h28" stroke="{CO}" stroke-width="2"/>',
 "groupe": f'<g fill="{COL}" stroke="{CO}" stroke-width="3"><circle cx="30" cy="38" r="9"/><circle cx="70" cy="38" r="9"/><path d="M14 74c0-12 7-20 16-20s16 8 16 20z"/><path d="M54 74c0-12 7-20 16-20s16 8 16 20z"/></g><g fill="{VIL}" stroke="{VI}" stroke-width="3"><circle cx="50" cy="32" r="10"/><path d="M32 80c0-14 8-22 18-22s18 8 18 22z"/></g>',
 "panneau": f'<path d="M48 18v70" stroke="{I}" stroke-width="4" stroke-linecap="round"/><path d="M50 24h30l8 8-8 8H50z" fill="{SAL}" stroke="{SA}" stroke-width="3" stroke-linejoin="round"/><path d="M48 46H20l-8 8 8 8h28z" fill="{VIL}" stroke="{VI}" stroke-width="3" stroke-linejoin="round"/><path d="M36 88h26" stroke="{I}" stroke-width="3" stroke-linecap="round"/>',
 "drapeau": f'<path d="M10 86l26-36 14 18 12-14 28 32z" fill="{SAL}" stroke="{SA}" stroke-width="3" stroke-linejoin="round"/><path d="M62 54V16" stroke="{I}" stroke-width="3"/><path d="M62 18h22l-6 8 6 8H62z" fill="{CO}"/>',
 "cle": f'<circle cx="34" cy="50" r="16" fill="{SAL}" stroke="{SA}" stroke-width="3.5"/><circle cx="34" cy="50" r="6" fill="#fff" stroke="{SA}" stroke-width="2.5"/><path d="M50 50h36M74 50v12M84 50v8" stroke="{SA}" stroke-width="4" stroke-linecap="round"/>',
 "mains": f'<path d="M14 56l18-14 14 4 10 10-6 6-12-6" fill="{VIL}" stroke="{VI}" stroke-width="3" stroke-linejoin="round"/><path d="M86 56L68 42 54 46 38 60c4 6 10 6 14 2l8 6 6-6 6 4z" fill="{COL}" stroke="{CO}" stroke-width="3" stroke-linejoin="round"/>',
 "calendrier": f'<rect x="20" y="24" width="60" height="58" rx="6" fill="#fff" stroke="{I}" stroke-width="3"/><path d="M20 40h60" stroke="{I}" stroke-width="3"/><path d="M34 18v12M66 18v12" stroke="{I}" stroke-width="3" stroke-linecap="round"/><rect x="52" y="54" width="14" height="14" rx="3" fill="{SAL}" stroke="{SA}" stroke-width="2.5"/><path d="M55 61l3 3 6-6" stroke="{SA}" stroke-width="2.5" fill="none"/>',
}
PAR_CAT = {"#5B4BFF": ["boussole", "miroir", "ampoule"], "#F2542D": ["pousse", "sac", "groupe"], "#0E9F8E": ["panneau", "calendrier", "drapeau"]}


def piece(nom, t=60):
    return f'<svg viewBox="0 0 100 100" width="{t}" height="{t}" aria-hidden="true">{PIECES[nom]}</svg>'


def bouquet(noms, t=60, gap=4):
    return '<span style="display:inline-flex;gap:%dpx;align-items:center">%s</span>' % (gap, "".join(piece(n, t) for n in noms))


def pour(c):
    return PAR_CAT.get(c, ["boussole", "pousse", "drapeau"])


def deco_page(c, cl):
    """Motif de coin de page : trois illustrations du critère, sur une pastille claire."""
    n = pour(c)
    return (f'<svg class="deco" viewBox="0 0 260 150" width="260" height="150" aria-hidden="true"><circle cx="250" cy="0" r="120" fill="{cl}"/>'
            f'<g transform="translate(150,6) scale(.46)">{PIECES[n[0]]}</g><g transform="translate(190,32) scale(.46)">{PIECES[n[1]]}</g>'
            f'<g transform="translate(222,62) scale(.4)">{PIECES[n[2]]}</g></svg>')

"""Illustrations du cours Alimentation saine : style plat et épuré, peu d'encre (contours + aplats légers)."""
V, T, A, I = "#2F7D4F", "#D9472B", "#E3A21A", "#1F2A24"  # vert herbe, tomate, agrume, encre
VL, TL, AL = "#DCEFE3", "#FBE1DA", "#FBEFD3"

PIECES = {
 "pomme": f'<path d="M50 28c-8-6-24-4-27 12-3 16 8 36 20 38 3 0 5-2 7-2s4 2 7 2c12-2 23-22 20-38-3-16-19-18-27-12z" fill="{TL}" stroke="{T}" stroke-width="3"/><path d="M50 28c0-8 3-14 9-17" stroke="{I}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M53 20c6-8 16-8 19-5-4 7-12 9-19 5z" fill="{VL}" stroke="{V}" stroke-width="2.5"/>',
 "carotte": f'<path d="M30 40l40-12c4 2 5 6 2 9L34 70c-6 3-10-2-8-7z" fill="{AL}" stroke="{A}" stroke-width="3"/><path d="M44 46l6 6M54 41l5 6M38 56l5 5" stroke="{A}" stroke-width="2.5"/><path d="M71 30c4-8 10-12 16-12-2 6-6 10-12 13M73 33c8-2 14 0 18 4-6 3-12 2-17-1" fill="{VL}" stroke="{V}" stroke-width="2.5"/>',
 "brocoli": f'<path d="M45 58l-4 26h18l-4-26" fill="{VL}" stroke="{V}" stroke-width="3"/><g fill="{VL}" stroke="{V}" stroke-width="3"><circle cx="36" cy="44" r="13"/><circle cx="64" cy="44" r="13"/><circle cx="50" cy="32" r="15"/><circle cx="50" cy="52" r="11"/></g>',
 "citron": f'<circle cx="50" cy="50" r="30" fill="{AL}" stroke="{A}" stroke-width="3"/><circle cx="50" cy="50" r="22" fill="none" stroke="{A}" stroke-width="2"/><g stroke="{A}" stroke-width="2">' + "".join(f'<line x1="50" y1="50" x2="{50 + 22 * c:.1f}" y2="{50 + 22 * s:.1f}"/>' for c, s in [(1, 0), (.5, .87), (-.5, .87), (-1, 0), (-.5, -.87), (.5, -.87)]) + '</g>',
 "bol": f'<path d="M18 46h64c0 20-14 34-32 34S18 66 18 46z" fill="{VL}" stroke="{V}" stroke-width="3"/><path d="M40 82h20" stroke="{V}" stroke-width="3"/><g fill="none" stroke="{I}" stroke-width="2.5" stroke-linecap="round"><path d="M36 38c0-6 6-6 6-12M50 36c0-6 6-6 6-12M64 38c0-6 6-6 6-12"/></g>',
 "tasse": f'<path d="M26 30h40l-4 50H30z" fill="#fff" stroke="{I}" stroke-width="3"/><path d="M66 40h8c6 0 6 16 0 16h-9" fill="none" stroke="{I}" stroke-width="3"/><path d="M29 52h34l-2 28H31z" fill="{AL}"/><g stroke="{I}" stroke-width="2"><line x1="30" y1="44" x2="38" y2="44"/><line x1="30" y1="56" x2="38" y2="56"/><line x1="31" y1="68" x2="39" y2="68"/></g>',
 "fouet": f'<path d="M50 14v28" stroke="{I}" stroke-width="5" stroke-linecap="round"/><g fill="none" stroke="{T}" stroke-width="2.5"><path d="M50 42c-14 6-16 34 0 44 16-10 14-38 0-44z"/><path d="M50 42c-6 8-6 34 0 44 6-10 6-36 0-44z"/></g>',
 "poele": f'<ellipse cx="42" cy="56" rx="28" ry="20" fill="{VL}" stroke="{I}" stroke-width="3"/><path d="M68 50l24-10" stroke="{I}" stroke-width="6" stroke-linecap="round"/><circle cx="42" cy="56" r="9" fill="#fff" stroke="{A}" stroke-width="3"/><circle cx="42" cy="56" r="4" fill="{A}"/>',
 "tomate": f'<circle cx="50" cy="56" r="26" fill="{TL}" stroke="{T}" stroke-width="3"/><path d="M38 32l12 6 12-6-6 10 10 2-14 2-2 8-2-8-14-2 10-2z" fill="{VL}" stroke="{V}" stroke-width="2.5" stroke-linejoin="round"/>',
 "pain": f'<path d="M20 50c0-14 14-22 30-22s30 8 30 22v24H20z" fill="{AL}" stroke="{A}" stroke-width="3"/><g stroke="{A}" stroke-width="2.5"><path d="M36 40l6 8M50 38l6 8M64 40l6 8"/></g>',
 "oeuf": f'<path d="M50 18c14 0 26 24 26 40s-12 24-26 24-26-8-26-24 12-40 26-40z" fill="#fff" stroke="{I}" stroke-width="3"/><circle cx="50" cy="58" r="10" fill="{AL}" stroke="{A}" stroke-width="2.5"/>',
}


def piece(nom, t=60):
    return f'<svg viewBox="0 0 100 100" width="{t}" height="{t}" aria-hidden="true">{PIECES[nom]}</svg>'


def bouquet(noms, t=60, gap=4):
    return '<span style="display:inline-flex;gap:%dpx;align-items:center">%s</span>' % (gap, "".join(piece(n, t) for n in noms))


def deco_page(c, cl):
    """Remplace le motif de coin de page : trois aliments en diagonale, sur une pastille claire."""
    return (f'<svg class="deco" viewBox="0 0 260 150" width="260" height="150" aria-hidden="true">'
            f'<circle cx="250" cy="0" r="120" fill="{cl}"/>'
            f'<g transform="translate(150,6) scale(.48)">{PIECES["carotte"]}</g>'
            f'<g transform="translate(190,32) scale(.48)">{PIECES["pomme"]}</g>'
            f'<g transform="translate(222,62) scale(.4)">{PIECES["brocoli"]}</g></svg>')


def assiette(t=260):
    """Assiette équilibrée (Guide alimentaire canadien) : moitié légumes et fruits, quart protéines, quart grains entiers."""
    return f'''<svg viewBox="0 0 220 220" width="{t}" height="{t}" aria-hidden="true">
<circle cx="110" cy="110" r="104" fill="#fff" stroke="{I}" stroke-width="3"/><circle cx="110" cy="110" r="88" fill="#fff" stroke="#CDD2D0" stroke-width="2"/>
<path d="M110 22 A88 88 0 0 0 110 198 Z" fill="{VL}" stroke="{V}" stroke-width="2"/>
<path d="M110 22 A88 88 0 0 1 198 110 L110 110 Z" fill="{TL}" stroke="{T}" stroke-width="2"/>
<path d="M198 110 A88 88 0 0 1 110 198 L110 110 Z" fill="{AL}" stroke="{A}" stroke-width="2"/>
<text x="62" y="108" text-anchor="middle" font-size="12" font-weight="800" fill="{V}">Légumes</text><text x="62" y="124" text-anchor="middle" font-size="12" font-weight="800" fill="{V}">et fruits</text>
<text x="150" y="80" text-anchor="middle" font-size="11" font-weight="800" fill="{T}">Aliments</text><text x="150" y="94" text-anchor="middle" font-size="11" font-weight="800" fill="{T}">protéinés</text>
<text x="150" y="140" text-anchor="middle" font-size="11" font-weight="800" fill="#9A6A00">Grains</text><text x="150" y="154" text-anchor="middle" font-size="11" font-weight="800" fill="#9A6A00">entiers</text></svg>'''

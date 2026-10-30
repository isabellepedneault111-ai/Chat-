"""Renard détective (variante du renard des jeux Z128) : casquette, loupe, foulard. SVG, aplats légers."""
BASE = '''<ellipse cx="100" cy="190" rx="70" ry="9" fill="#000" opacity=".06"/>
<path d="M140,170 C200,165 205,95 168,92 C150,90 150,112 165,118 C182,126 172,160 132,160 Z" fill="#D9844A"/>
<path d="M168,92 C150,90 150,112 165,118 C160,108 162,98 168,92 Z" fill="#FBF3EA"/>
<ellipse cx="95" cy="145" rx="50" ry="45" fill="#D9844A"/>
<path d="M95,105 C120,120 118,170 95,188 C72,170 70,120 95,105 Z" fill="#FBF3EA"/>
<ellipse cx="72" cy="186" rx="13" ry="7" fill="#A85A2A"/><ellipse cx="118" cy="186" rx="13" ry="7" fill="#A85A2A"/>
<path d="M58,40 L68,82 L88,62 Z" fill="#D9844A"/><path d="M63,50 L70,76 L82,63 Z" fill="#FBF3EA"/>
<path d="M132,40 L122,82 L102,62 Z" fill="#D9844A"/><path d="M127,50 L120,76 L108,63 Z" fill="#FBF3EA"/>
<path d="M50,72 Q95,40 140,72 Q132,110 95,124 Q58,110 50,72 Z" fill="#D9844A"/>
<path d="M62,94 Q95,132 128,94 Q118,112 95,124 Q72,112 62,94 Z" fill="#FBF3EA"/>
<circle cx="81" cy="85" r="4.5" fill="#2B211B"/><circle cx="109" cy="85" r="4.5" fill="#2B211B"/><circle cx="82.5" cy="83.5" r="1.4" fill="#fff"/><circle cx="110.5" cy="83.5" r="1.4" fill="#fff"/>
<path d="M74,76 Q81,72 88,75" stroke="#2B211B" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<ellipse cx="95" cy="108" rx="6" ry="4.5" fill="#2B211B"/>
<path d="M88,115 Q96,120 104,113" fill="none" stroke="#2B211B" stroke-width="2.2" stroke-linecap="round"/>'''
CASQUETTE = '''<path d="M62,62 Q95,30 128,62 Q95,54 62,62 Z" fill="#7A6A58"/><path d="M64,60 Q95,48 126,60" stroke="#5E5042" stroke-width="2" fill="none"/>
<path d="M60,62 Q95,58 130,62 Q132,68 128,68 Q95,62 62,68 Q58,68 60,62 Z" fill="#5E5042"/>
<path d="M83,42 Q95,36 107,42" stroke="#9C8A74" stroke-width="2" fill="none"/><circle cx="95" cy="40" r="3" fill="#5E5042"/>'''
FOULARD = '''<path d="M66,120 Q95,134 124,120 L122,130 Q95,142 68,130 Z" fill="#0F766E"/><path d="M108,130 L118,156 L104,150 Z" fill="#0F766E"/>'''
LOUPE = '''<line x1="152" y1="150" x2="172" y2="176" stroke="#5E5042" stroke-width="7" stroke-linecap="round"/>
<circle cx="140" cy="134" r="22" fill="#EAF6FA" stroke="#2B211B" stroke-width="4"/><path d="M128,124 Q134,118 142,118" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>
<ellipse cx="128" cy="152" rx="9" ry="7" fill="#D9844A"/>'''


def renard(taille=120, loupe=True):
    h = round(taille * 210 / 220)
    return (f'<svg viewBox="0 0 220 210" width="{taille}" height="{h}" aria-hidden="true"><g transform="translate(5,0)">'
            f'{BASE}{FOULARD}{CASQUETTE}{LOUPE if loupe else ""}</g></svg>')


def tete(taille=46):
    """Tête seule, pour les encadrés « Le truc du renard »."""
    return (f'<svg viewBox="38 26 116 116" width="{taille}" height="{taille}" aria-hidden="true">'
            f'{BASE}{FOULARD}{CASQUETTE}</svg>')

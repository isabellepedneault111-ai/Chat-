import os
import base64, io, sys
from PIL import Image
B = sys.argv[1]; OUT_OFF = sys.argv[2]; OUT_WEB = sys.argv[3]
def uri(path, w=None, q=80, png=False):
    im = Image.open(path)
    if w and im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    if png: im.save(buf, 'PNG', optimize=True); m = 'image/png'
    else: im.convert('RGB').save(buf, 'JPEG', quality=q, optimize=True); m = 'image/jpeg'
    return 'data:%s;base64,%s' % (m, base64.b64encode(buf.getvalue()).decode())
def font(p): return 'data:font/ttf;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
I = B + '/img/'
rep = {
 '__FONT_ANTON__': font(B + '/fonts/Anton-Regular.ttf'), '__FONT_CAVEAT__': font(B + '/fonts/Caveat-SemiBold.ttf'),
 '__IMG_MUR__': uri(I + 'nb_mur.jpg', 1600, 78), '__IMG_COMPOST__': uri(I + 'nb_compost.jpg', 1100, 78),
 '__IMG_BULLETIN__': uri(I + 'nb_bulletin.jpg', 1000, 78), '__IMG_MAISON__': uri(I + 'nb_maison.jpg', 900, 78),
 '__IMG_Q1__': uri(I + 'mot_eleve_2017.jpg', 900, 82), '__IMG_Q2__': uri(I + 'mot_parent_hate.jpg', 700, 82),
 '__IMG_Q3__': uri(I + 'mot_parent_forces.jpg', 700, 82), '__IMG_Q4__': uri(I + 'mot_parent_confiance.jpg', 700, 82),
 '__IMG_Q5__': uri(I + 'mot_parent_projets.jpg', 700, 82), '__IMG_Q6__': uri(I + 'mot_famille_etincelles.jpg', 800, 80),
 '__IMG_FRAG1__': uri(I + 'frag_ecole.jpg', 900, 85), '__IMG_FRAG2__': uri(I + 'frag_projets.jpg', 800, 85),
 '__LOGO_CSI__': uri(I + 'logo_csi.png', 600, png=True),
 '__LOGO_CFGA__': uri(I + 'logo_cfga.png', 600, png=True) if os.path.exists(I + 'logo_cfga.png') else '',
 '__IMG_RISO_MUR__': uri(I + 'riso_mur.jpg', 1400, 80),
 '__IMG_CAP_ACCEPTE__': uri(I + 'cap_accepte.jpg', 700, 86), '__IMG_CAP_VALORISER__': uri(I + 'cap_valoriser.jpg', 700, 86), '__IMG_CAP_CONFIANCE__': uri(I + 'cap_confiance.jpg', 700, 86), '__IMG_FRAG_PROJETS__': uri(I + 'frag_projets.jpg', 700, 86), '__IMG_FRAG_ECOLE__': uri(I + 'frag_ecole.jpg', 700, 86),
 '__IMG_ESCALIER__': uri(I + 'il_escalier.png', 1000, png=True), '__IMG_GNGV__': uri(I + 'il_gngv.png', 1100, png=True),
 '__IMG_BILLET__': uri(I + 'il_billet.png', 1100, png=True),
}
t = open(B + '/pres_template.html', encoding='utf-8').read()
cg = open(B + '/copilot_gen_src.html', encoding='utf-8').read().replace('__SIG_DB__', open(B + '/sig_db.js', encoding='utf-8').read())
t = t.replace('__COPILOT_GEN__', cg)
for k, v in rep.items(): t = t.replace(k, v)
three = open(B + '/vendor/three.min.js').read(); qr = open(B + '/vendor/qrcode.min.js').read()
web = t.replace('__THREE_SCRIPT__', '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>').replace('__QR_SCRIPT__', '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>')
off = t.replace('__THREE_SCRIPT__', '<script>' + three + '</script>').replace('__QR_SCRIPT__', '<script>' + qr + '</script>')
off = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>' + off + '</body></html>'
open(OUT_WEB, 'w', encoding='utf-8').write(web); open(OUT_OFF, 'w', encoding='utf-8').write(off)
print(len(web) // 1024, 'Ko web ·', len(off) // 1024, 'Ko hors ligne')

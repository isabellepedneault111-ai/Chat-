"""Effet risographie bicolore : trame de points mauve + passage jaune décalé + grain papier."""
import sys, math, random
from PIL import Image, ImageOps, ImageFilter, ImageDraw, ImageEnhance, ImageChops

PAPER = (251, 248, 239); MAUVE = (91, 42, 134); GOLD = (242, 194, 48); INK = (30, 26, 34)

def halftone(gray, cell=7, angle=22):
    """Trame de points : renvoie un masque L (255 = encre)."""
    w, h = gray.size
    big = max(w, h) * 2
    g = gray.rotate(angle, expand=True, fillcolor=255)
    W, H = g.size
    small = g.resize((W // cell + 1, H // cell + 1), Image.BILINEAR)
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    px = small.load()
    for y in range(small.size[1]):
        for x in range(small.size[0]):
            v = 1 - px[x, y] / 255
            r = cell * .62 * math.sqrt(v)
            if r > .4:
                cx, cy = x * cell + cell / 2, y * cell + cell / 2
                d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    m = m.rotate(-angle, expand=False, fillcolor=0)
    l, t = (W - w) // 2, (H - h) // 2
    return m.crop((l, t, l + w, t + h))

def riso(src, out, width=1600, cell=None):
    im = Image.open(src).convert('RGB')
    if im.width > width: im = im.resize((width, int(im.height * width / im.width)), Image.LANCZOS)
    w, h = im.size; cell = cell or max(4, w // 300)
    gray = ImageOps.autocontrast(ImageOps.grayscale(im), cutoff=2)
    # couche mauve : ombres et tons moyens, en trame
    shadows = gray.point(lambda v: int(255 * ((v / 255) ** 0.55)))
    m_mauve = halftone(shadows, cell, 22)
    # couche or : tons clairs à moyens, en aplat légèrement texturé (zones chaudes de l'image)
    r, g, b = im.split()
    warm = ImageChops.subtract(r, b)                       # jaunes / oranges de l'original
    lum = gray.point(lambda v: 255 if 90 < v < 240 else 0)
    m_gold = ImageChops.multiply(warm.point(lambda v: min(255, max(0, v - 40) * 4)), lum).filter(ImageFilter.GaussianBlur(1.2))
    m_gold = m_gold.point(lambda v: 210 if v > 70 else 0)
    # traits noirs : contours forts seulement
    m_ink = gray.point(lambda v: 255 if v < 48 else (140 if v < 70 else 0))
    # composition sur papier
    base = Image.new('RGB', (w, h), PAPER)
    gold_layer = Image.new('RGB', (w, h), GOLD)
    base = Image.composite(gold_layer, base, ImageChops.offset(m_gold, 4, 3))   # repérage décalé
    mauve_layer = Image.new('RGB', (w, h), MAUVE)
    base = Image.composite(mauve_layer, base, m_mauve)
    base = Image.composite(Image.new('RGB', (w, h), INK), base, m_ink)
    # grain papier
    random.seed(3)
    noise = Image.effect_noise((w, h), 22).filter(ImageFilter.GaussianBlur(.6))
    base = ImageChops.multiply(base, Image.merge('RGB', [noise.point(lambda v: 220 + v // 8)] * 3))
    base.save(out, quality=86)
    print(out, base.size)

if __name__ == '__main__':
    riso(sys.argv[1], sys.argv[2])

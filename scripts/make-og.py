#!/usr/bin/env python3
"""Write docs/og.png: 1200x630 share card.

Motifs are the page's own: the Ilkal temple-tower pallu band (`.saree-border`),
the mango-leaf toran with jasmine and gold beads (hero side ornaments), and the
jasmine-and-marigold mala (`.mala-divider`). Drawn at 3x and downsampled, since
there is no SVG rasteriser on hand.
"""
from pathlib import Path
import math
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'og.png'
FONT_DIR = Path('/tmp/ogfonts')

W, H = 1200, 630
SS = 3

CREAM = (247, 238, 218)
MAROON = (158, 27, 50)
ILKAL_RED = (156, 36, 54)
GOLD = (214, 164, 25)
GOLD_LIGHT = (240, 197, 80)
ZARI = (212, 160, 23)
INK = (34, 26, 20)
KASUTI = (32, 28, 23)
LEAF = (31, 107, 58)
CORD = (90, 70, 56)
RIB = (20, 61, 34)
MARIGOLD = (226, 138, 18)
TERRACOTTA = (193, 99, 26)
DOT = (231, 221, 200)

FONTS = {
    'tamma': (
        FONT_DIR / 'BalooTamma2-Bold.ttf',
        'https://github.com/google/fonts/raw/main/ofl/balootamma2/BalooTamma2%5Bwght%5D.ttf',
    ),
    'baloo': (
        FONT_DIR / 'Baloo2-Bold.ttf',
        'https://github.com/google/fonts/raw/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf',
    ),
}


def fetch_fonts():
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for path, url in FONTS.values():
        if path.exists() and path.stat().st_size > 10000:
            continue
        req = urllib.request.Request(url, headers={'User-Agent': 'NammaBengaluruGuide/1.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            path.write_bytes(r.read())


def font(key, size, weight=800):
    f = ImageFont.truetype(str(FONTS[key][0]), size * SS)
    try:
        f.set_variation_by_axes([weight])
    except OSError:
        pass
    return f


def cubic(p0, p1, p2, p3, steps=24):
    out = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]
        out.append((x, y))
    return out


def quad(p0, p1, p2, steps=20):
    out = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]
        y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
        out.append((x, y))
    return out


def leaf_points(cx, y0, w, h):
    """Mango leaf from the toran: pointed at both ends, belly out to the sides."""
    sx, sy = w / 22.0, h / 44.0

    def m(x, y):
        return (cx + (x - 27) * sx, y0 + (y - 18) * sy)

    pts = cubic(m(27, 18), m(18, 28), m(16, 48), m(27, 62))
    pts += cubic(m(27, 62), m(38, 48), m(36, 28), m(27, 18))
    return pts


def ellipse_points(cx, cy, rx, ry, rot=0.0, steps=36):
    a = math.radians(rot)
    ca, sa = math.cos(a), math.sin(a)
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return pts


def jasmine(d, cx, cy, scale=1.0):
    rx, ry = 6 * scale, 3.2 * scale
    for rot in (0, 60, 120):
        d.polygon(ellipse_points(cx, cy, rx, ry, rot), fill=CREAM, outline=MAROON)
    r = 1.7 * scale
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GOLD)


def marigold(d, cx, cy, r=8.0):
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=MARIGOLD)
    r2 = r * 0.69
    d.ellipse((cx - r2, cy - r2, cx + r2, cy + r2), fill=GOLD_LIGHT)
    r3 = r * 0.28
    d.ellipse((cx - r3, cy - r3, cx + r3, cy + r3), fill=TERRACOTTA)


def pallu_band(d, y_top, band_h, flip=False):
    """`.saree-border`: black ground, Ilkal temple triangles, zari inner tier."""
    d.rectangle((0, y_top, W * SS, y_top + band_h), fill=KASUTI)
    step = 24 * SS
    for x in range(-step, W * SS + step, step):
        base = y_top + band_h if not flip else y_top
        tip = y_top if not flip else y_top + band_h
        mid = base + (tip - base) * 0.62
        d.polygon([(x, base), (x + step / 2, tip), (x + step, base)], fill=ILKAL_RED)
        d.polygon([(x, base), (x + step / 2, mid), (x + step, base)], fill=ZARI)


def toran(d, x, y0, y1):
    """Hero side ornament: cord, mango leaves, jasmine pairs, gold beads."""
    d.line((x, y0, x, y1), fill=KASUTI, width=max(1, int(1.4 * SS)))
    span = y1 - y0
    leaf_h = 46 * SS
    leaf_w = 23 * SS
    gap = span / 5.0
    for i in range(5):
        top = y0 + gap * i + gap * 0.16
        d.polygon(leaf_points(x, top, leaf_w, leaf_h), fill=LEAF)
        d.line((x, top + leaf_h * 0.06, x, top + leaf_h * 0.92), fill=RIB, width=max(1, int(SS * 0.7)))
        if i < 4:
            jy = top + leaf_h + gap * 0.18
            jasmine(d, x - 9 * SS, jy, scale=SS * 0.92)
            jasmine(d, x + 9 * SS, jy, scale=SS * 0.92)
            by = jy + 16 * SS
            r = 3.6 * SS
            for bx in (x - 13 * SS, x + 13 * SS):
                d.ellipse((bx - r, by - r, bx + r, by + r), fill=GOLD)


def mala(d, x0, x1, y, amp, arcs=4):
    """`.mala-divider`: sagging cord, jasmine rosettes, marigolds on the cord."""
    seg = (x1 - x0) / arcs
    p0 = (x0, y)
    ctrl = (x0 + seg * 0.5, y + amp)
    pts = []
    for i in range(arcs):
        end = (x0 + seg * (i + 1), y)
        pts += quad(p0, ctrl, end)
        p0 = end
        ctrl = (end[0] + seg * 0.5, 2 * end[1] - ctrl[1])
    d.line(pts, fill=CORD, width=max(1, int(1.6 * SS)), joint='curve')

    def y_at(px):
        best = min(pts, key=lambda p: abs(p[0] - px))
        return best[1]

    for i in range(arcs):
        cx = x0 + seg * i + seg * 0.5
        if i % 2:
            jasmine(d, cx, y_at(cx), scale=SS * 1.2)
        else:
            marigold(d, cx, y_at(cx), r=9 * SS)
    for i in range(1, arcs):
        cx = x0 + seg * i
        d.polygon(ellipse_points(cx, y_at(cx), 5.4 * SS, 2.6 * SS, -24), fill=LEAF)


def main():
    fetch_fonts()
    img = Image.new('RGB', (W * SS, H * SS), CREAM)
    d = ImageDraw.Draw(img)

    band = 18 * SS
    dot_r = max(1, int(SS * 0.9))
    for x in range(30 * SS, W * SS, 20 * SS):
        for y in range(band + 18 * SS, H * SS - band - 10 * SS, 20 * SS):
            d.ellipse((x, y, x + dot_r, y + dot_r), fill=DOT)

    pallu_band(d, 0, band, flip=False)
    pallu_band(d, H * SS - band, band, flip=True)
    toran(d, 62 * SS, band + 6 * SS, H * SS - band - 6 * SS)
    toran(d, (W - 62) * SS, band + 6 * SS, H * SS - band - 6 * SS)

    kn = font('tamma', 104, 800)
    en = font('baloo', 60, 800)
    sub = font('baloo', 34, 700)
    tag = font('baloo', 26, 600)

    x = 136 * SS
    d.text((x, 116 * SS), 'ನಮ್ಮ ಬೆಂಗಳೂರು', font=kn, fill=MAROON)
    d.text((x, 252 * SS), 'Namma Bengaluru', font=en, fill=INK)
    d.text((x, 332 * SS), 'A field guide to Bengaluru and Karnataka', font=sub, fill=INK)
    d.text((x, 378 * SS), 'Places, food, Kannada.', font=sub, fill=MAROON)

    mala(d, 136 * SS, (W - 136) * SS, 458 * SS, 22 * SS)
    d.text((x, 508 * SS), 'aravindbaskaran.github.io/this-blr-namma-bengaluru', font=tag, fill=CORD)

    out = img.resize((W, H), Image.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, 'PNG', optimize=True)
    print('wrote', OUT, out.size)


if __name__ == '__main__':
    main()

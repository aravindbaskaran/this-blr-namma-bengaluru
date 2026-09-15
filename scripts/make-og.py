#!/usr/bin/env python3
"""Write docs/og.png: 1200x630 share card. Big type, high contrast, no thin serif."""
from pathlib import Path
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'og.png'
FONT_DIR = Path('/tmp/ogfonts')

W, H = 1200, 630
CREAM = (247, 238, 218)
CREAM2 = (238, 225, 190)
MAROON = (158, 27, 50)
GOLD = (214, 164, 25)
INK = (34, 26, 20)
LEAF = (31, 107, 58)
DOT = (230, 220, 198)

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
    f = ImageFont.truetype(str(FONTS[key][0]), size)
    try:
        f.set_variation_by_axes([weight])
    except OSError:
        pass
    return f


def main():
    fetch_fonts()
    img = Image.new('RGB', (W, H), CREAM)
    d = ImageDraw.Draw(img)

    for x in range(24, W, 18):
        for y in range(56, H - 56, 18):
            d.ellipse((x, y, x + 2, y + 2), fill=DOT)

    d.rectangle((0, 0, W, 32), fill=MAROON)
    d.rectangle((0, 32, W, 48), fill=GOLD)
    d.rectangle((0, H - 48, W, H - 32), fill=GOLD)
    d.rectangle((0, H - 32, W, H), fill=MAROON)
    d.rectangle((0, 48, 18, H - 48), fill=LEAF)

    kn = font('tamma', 108, 800)
    en = font('baloo', 64, 800)
    sub = font('baloo', 40, 700)

    x = 72
    y = 168
    d.text((x, y), 'ನಮ್ಮ ಬೆಂಗಳೂರು', font=kn, fill=MAROON)
    y += 128
    d.text((x, y), 'Namma Bengaluru', font=en, fill=INK)
    y += 78
    d.text((x, y), 'A field guide', font=sub, fill=INK)
    y += 56
    d.text((x, y), 'Places, food, Kannada.', font=sub, fill=INK)

    # jasmine on the gold strip, like the header mala
    for cx in (300, 500, 700, 900):
        d.ellipse((cx - 7, 34, cx + 7, 48), fill=CREAM)
        d.ellipse((cx - 5, 36, cx + 5, 46), outline=MAROON, width=2)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, 'PNG', optimize=True)
    print('wrote', OUT, img.size)


if __name__ == '__main__':
    main()

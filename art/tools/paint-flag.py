# Paints the flag of the Nena Republic (white, pink and navy stripes; a round emblem with Nena in a pink
# bow and scarf, a crown and two stars above, a "NENA REPUBLIC" ribbon and a little heart) as a texture.
#   python3 paint-flag.py <nunito-900.woff> <out.png>
import sys, math
from PIL import Image, ImageDraw, ImageFont

FONT, OUT = sys.argv[1], sys.argv[2]
S = 2                                   # draw at twice the size, then shrink, for smooth edges
W, H = 1024 * S, 640 * S
WHITE, PINK, NAVY, INK = (250, 248, 246), (240, 122, 160), (38, 52, 96), (28, 30, 52)
PALEPINK, ORANGE, CHEEK = (246, 167, 194), (245, 176, 50), (246, 150, 170)
im = Image.new('RGB', (W, H), WHITE); d = ImageDraw.Draw(im)
s = lambda v: int(v * S)

# stripes: white, pink, navy
d.rectangle([0, 0, W, s(235)], fill=WHITE); d.rectangle([0, s(235), W, s(370)], fill=PINK); d.rectangle([0, s(370), W, H], fill=NAVY)

# the emblem: a white oval with a pink ring
cx, cy, rx, ry = s(512), s(330), s(215), s(250)
d.ellipse([cx - rx - s(9), cy - ry - s(9), cx + rx + s(9), cy + ry + s(9)], fill=PINK)
d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=WHITE)

# crown, and two stars
def star(x, y, r, col):
    pts = [(x + math.cos(-math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * 0.45), y + math.sin(-math.pi / 2 + i * math.pi / 5) * (r if i % 2 == 0 else r * 0.45)) for i in range(10)]
    d.polygon(pts, fill=col)
crx, cry = cx, s(118)
d.polygon([(crx - s(52), cry + s(28)), (crx - s(60), cry - s(22)), (crx - s(30), cry + s(2)), (crx, cry - s(34)), (crx + s(30), cry + s(2)), (crx + s(60), cry - s(22)), (crx + s(52), cry + s(28))], fill=PINK)
d.rectangle([crx - s(52), cry + s(24), crx + s(52), cry + s(40)], fill=PINK)
for x, y in [(crx - s(60), cry - s(24)), (crx, cry - s(38)), (crx + s(60), cry - s(24))]: d.ellipse([x - s(9), y - s(9), x + s(9), y + s(9)], fill=PINK)
d.ellipse([crx - s(8), cry + s(4), crx + s(8), cry + s(20)], fill=WHITE)
star(cx - s(150), s(150), s(20), (226, 70, 110)); star(cx + s(158), s(132), s(18), (226, 70, 110))

# Nena: navy body and head, white face and tummy, flippers, eyes with a shine, cheeks, beak, bow and scarf
bx, by = cx, s(345)
d.ellipse([bx - s(150), by - s(10), bx + s(150), by + s(260)], fill=NAVY)                 # body
d.ellipse([bx - s(205), by + s(60), bx - s(110), by + s(200)], fill=NAVY)                  # flippers
d.ellipse([bx + s(110), by + s(60), bx + s(205), by + s(200)], fill=NAVY)
d.ellipse([bx - s(150), by - s(185), bx + s(150), by + s(80)], fill=NAVY)                  # head
d.ellipse([bx - s(122), by - s(120), bx + s(122), by + s(70)], fill=WHITE)                 # face
d.ellipse([bx - s(100), by + s(60), bx + s(100), by + s(250)], fill=WHITE)                 # tummy
d.polygon([(bx - s(60), by - s(122)), (bx, by - s(70)), (bx + s(60), by - s(122)), (bx, by - s(150))], fill=NAVY)   # the dip of the cap into the face
for ex in (-1, 1):
    x = bx + ex * s(58); d.ellipse([x - s(17), by - s(52), x + s(17), by - s(12)], fill=INK); d.ellipse([x - s(8) + ex * s(3), by - s(46), x + s(3) + ex * s(3), by - s(35)], fill=WHITE)
    x2 = bx + ex * s(90); d.ellipse([x2 - s(24), by - s(4), x2 + s(24), by + s(22)], fill=CHEEK)
d.polygon([(bx - s(24), by - s(10)), (bx + s(24), by - s(10)), (bx, by + s(16))], fill=ORANGE)
# bow on her head
bwx, bwy = bx + s(92), by - s(138)
d.polygon([(bwx, bwy), (bwx - s(48), bwy - s(36)), (bwx - s(52), bwy + s(30))], fill=PINK); d.polygon([(bwx, bwy), (bwx + s(48), bwy - s(36)), (bwx + s(52), bwy + s(30))], fill=PINK)
d.ellipse([bwx - s(16), bwy - s(16), bwx + s(16), bwy + s(16)], fill=(226, 70, 110))
# scarf
d.rounded_rectangle([bx - s(135), by + s(52), bx + s(135), by + s(102)], radius=s(25), fill=PINK)
d.polygon([(bx + s(10), by + s(90)), (bx + s(62), by + s(170)), (bx + s(18), by + s(178)), (bx - s(10), by + s(100))], fill=PINK)
d.polygon([(bx - s(10), by + s(90)), (bx - s(56), by + s(165)), (bx - s(14), by + s(176)), (bx + s(10), by + s(100))], fill=PINK)
d.ellipse([bx - s(24), by + s(66), bx + s(24), by + s(110)], fill=(226, 70, 110))

# the ribbon with the name
ry0, ry1 = s(478), s(560)
for side in (-1, 1):   # folded ends
    x0 = cx + side * s(250); d.polygon([(x0, ry0 + s(16)), (x0 + side * s(70), ry0 + s(16)), (x0 + side * s(46), (ry0 + ry1) // 2 + s(16)), (x0 + side * s(70), ry1 + s(16)), (x0, ry1 + s(16))], fill=WHITE)
d.polygon([(cx - s(262), ry0 + s(10)), (cx + s(262), ry0 + s(10)), (cx + s(262), ry1 + s(10)), (cx - s(262), ry1 + s(10))], fill=WHITE)
d.polygon([(cx - s(252), ry0 + s(16)), (cx + s(252), ry0 + s(16)), (cx + s(252), ry1 + s(4)), (cx - s(252), ry1 + s(4))], fill=NAVY)
font = ImageFont.truetype(FONT, s(58)); text = 'NENA REPUBLIC'; bb = d.textbbox((0, 0), text, font=font)
d.text((cx - (bb[2] - bb[0]) // 2 - bb[0], (ry0 + ry1) // 2 + s(10) - (bb[3] - bb[1]) // 2 - bb[1]), text, font=font, fill=WHITE)
# heart
hx, hy, hr = cx, s(600), s(14)
d.ellipse([hx - 2 * hr, hy - hr, hx, hy + hr], fill=(226, 70, 110)); d.ellipse([hx, hy - hr, hx + 2 * hr, hy + hr], fill=(226, 70, 110))
d.polygon([(hx - 2 * hr + s(2), hy + s(4)), (hx + 2 * hr - s(2), hy + s(4)), (hx, hy + int(2.2 * hr))], fill=(226, 70, 110))

im.resize((1024, 640), Image.LANCZOS).save(OUT)
print('painted', OUT)

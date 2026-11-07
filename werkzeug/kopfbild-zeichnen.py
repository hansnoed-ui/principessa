import random, json, math
random.seed(11)
W, H = 1200, 1612
S = 2  # Entwurf in 600x806
GOLD, GOLD_H, GOLD_D = '#d9a43a', '#f3d27a', '#a8741f'
out = []
def p(s): out.append(s)
def dome(cx, by, w, h, fill, stroke=GOLD):
    cx, by, w, h = cx*S, by*S, w*S, h*S
    d = (f"M{cx-w/2:.1f},{by:.1f} C{cx-w*.74:.1f},{by-h*.48:.1f} {cx-w*.1:.1f},{by-h*.62:.1f} {cx:.1f},{by-h:.1f} "
         f"C{cx+w*.1:.1f},{by-h*.62:.1f} {cx+w*.74:.1f},{by-h*.48:.1f} {cx+w/2:.1f},{by:.1f} Z")
    p(f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="5" stroke-linejoin="round"/>')
    p(f'<circle cx="{cx:.1f}" cy="{by-h-7:.1f}" r="6" fill="{GOLD}"/>')
def rund(cx, by, w, h, fill):
    cx, by, w, h = cx*S, by*S, w*S, h*S
    p(f'<path d="M{cx-w/2:.1f},{by:.1f} A{w/2:.1f},{h:.1f} 0 0 1 {cx+w/2:.1f},{by:.1f} Z" fill="{fill}" stroke="{GOLD}" stroke-width="5"/>')
def koerper(x, y, w, h, fill):
    p(f'<rect x="{x*S}" y="{y*S}" width="{w*S}" height="{h*S}" fill="{fill}" stroke="{GOLD}" stroke-width="5"/>')
def fenster(x, y, w, h, nx, ny, fill, fw=.55, fh=.6):
    cw, ch = w/nx, h/ny
    for i in range(nx):
        for j in range(ny):
            ww, hh = cw*fw*S, ch*fh*S
            fx, fy = (x + cw*(i+.5))*S - ww/2, (y + ch*(j+.5))*S - hh/2
            p(f'<path d="M{fx:.1f},{fy+hh:.1f} V{fy+ww/2:.1f} A{ww/2:.1f},{ww/2:.1f} 0 0 1 {fx+ww:.1f},{fy+ww/2:.1f} V{fy+hh:.1f} Z" fill="{fill}"/>')
def punkte(x, y, w, h, n, fill, r=3.2):
    for _ in range(n):
        p(f'<circle cx="{(x+random.random()*w)*S:.1f}" cy="{(y+random.random()*h)*S:.1f}" r="{r*S/2:.1f}" fill="{fill}"/>')
def raster(x, y, w, h, nx, ny, fill, r=3):
    for i in range(nx):
        for j in range(ny):
            p(f'<circle cx="{(x+w*(i+.5)/nx)*S:.1f}" cy="{(y+h*(j+.5)/ny)*S:.1f}" r="{r*S/2:.1f}" fill="{fill}"/>')
def streifen(x, y, w, h, n, fill):
    for j in range(n):
        yy = y + h*(j+.5)/n
        p(f'<rect x="{(x+3)*S}" y="{(yy-2)*S:.1f}" width="{(w-6)*S}" height="{4*S}" fill="{fill}"/>')
def herz(cx, cy, s, fill):
    cx, cy, s = cx*S, cy*S, s*S
    p(f'<path d="M{cx:.1f},{cy+s*.9:.1f} C{cx-s*1.3:.1f},{cy:.1f} {cx-s*.6:.1f},{cy-s:.1f} {cx:.1f},{cy-s*.25:.1f} C{cx+s*.6:.1f},{cy-s:.1f} {cx+s*1.3:.1f},{cy:.1f} {cx:.1f},{cy+s*.9:.1f} Z" fill="{fill}"/>')

glanz = {'sonne': [], 'himmel': [], 'stadt': [], 'mond': []}
p(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
p(f'<rect width="{W}" height="{H}" fill="#e2aed0"/>')
# Himmelspunkte
for _ in range(46):
    x, y = random.uniform(10, 590), random.uniform(10, 470)
    if (x-274)**2 + (y-268)**2 < 215**2: continue
    r = random.uniform(5, 9)
    p(f'<circle cx="{x*S:.1f}" cy="{y*S:.1f}" r="{r:.1f}" fill="#fbf6fb"/>')
    if random.random() < .45: glanz['himmel'].append([round(x/600, 4), round(y/806, 4)])
# Monde
def mond(cx, cy, r, dx, dy):
    m = f'm{len(out)}'
    p(f'<mask id="{m}"><rect width="{W}" height="{H}" fill="#fff"/><circle cx="{(cx+dx)*S}" cy="{(cy+dy)*S}" r="{r*S*.88:.1f}" fill="#000"/></mask>')
    p(f'<circle cx="{cx*S}" cy="{cy*S}" r="{r*S}" fill="#f7f1f6" mask="url(#{m})"/>')
mond(52, 52, 34, 14, -10); glanz['mond'] += [[.07, .05], [.05, .085]]
p(f'<g>'); mond(490, 318, 15, 7, -6); p('</g>')
# Sonne mit Glitzerdruck
p(f'<circle cx="{274*S}" cy="{268*S}" r="{201*S}" fill="{GOLD}"/>')
for _ in range(2600):
    a, rr = random.random()*math.tau, math.sqrt(random.random())*198
    x, y = 274 + math.cos(a)*rr, 268 + math.sin(a)*rr
    c = random.choice([GOLD_H, GOLD_D, '#e9b84c', '#c38a2a', '#fff2c2'])
    p(f'<circle cx="{x*S:.1f}" cy="{y*S:.1f}" r="{random.uniform(1.2, 4.2):.1f}" fill="{c}"/>')
    if c == '#fff2c2' and random.random() < .5 and len(glanz['sonne']) < 60: glanz['sonne'].append([round(x/600, 4), round(y/806, 4)])
p(f'<circle cx="{274*S}" cy="{268*S}" r="{201*S}" fill="none" stroke="{GOLD_D}" stroke-width="4" opacity=".5"/>')

# Stadt, hintere Reihe
koerper(0, 600, 52, 210, '#4a3a9a'); fenster(0, 610, 52, 120, 2, 3, '#f2c6dc'); dome(26, 600, 70, 92, '#65b9ec'); punkte(0, 520, 52, 70, 6, '#f7f1f6', 4)
koerper(64, 560, 70, 250, '#f2c6dc'); streifen(64, 640, 70, 160, 6, '#c98ab0'); dome(99, 560, 84, 96, '#f6d4e5'); raster(76, 495, 46, 50, 3, 3, GOLD, 6)
koerper(225, 545, 64, 265, '#3d73c9'); fenster(225, 560, 64, 220, 2, 5, '#1d2f7a', .5, .62); dome(257, 545, 74, 62, GOLD)
koerper(282, 610, 92, 200, '#efb2cf'); dome(328, 610, 108, 82, '#e7a64a'); raster(296, 545, 64, 50, 4, 3, '#f7d886', 6); raster(294, 640, 70, 60, 4, 3, GOLD, 6)
koerper(358, 520, 38, 290, '#1d1b2d'); streifen(358, 540, 38, 250, 9, GOLD); dome(377, 520, 48, 70, '#203a4f')
koerper(398, 475, 72, 335, '#2f8ad0'); fenster(398, 500, 72, 230, 2, 5, '#163a8f', .5, .62); dome(434, 475, 92, 98, '#7fd1df'); raster(410, 405, 48, 54, 4, 4, '#2f8ad0', 5)
koerper(470, 400, 50, 410, '#1d1b2d'); streifen(470, 420, 50, 360, 12, GOLD); dome(495, 400, 74, 86, '#4b2d8f'); raster(478, 335, 34, 46, 3, 3, GOLD, 6)
koerper(522, 455, 78, 355, '#61c3e6'); fenster(522, 470, 78, 300, 2, 6, '#2c64b8', .5, .62); dome(561, 455, 88, 70, '#e05a74')
# vordere Reihe
koerper(0, 715, 60, 95, GOLD); raster(6, 725, 48, 80, 3, 3, '#4a3a9a', 9)
rund(196, 700, 172, 92, '#68c9ec'); koerper(110, 700, 172, 110, '#7ad4e6')
for i, x in enumerate([140, 175, 210, 245]):
    herz(x, 730, 11, '#f6d4e5'); herz(x + 17, 770, 11, '#f6d4e5')
dome(150, 720, 52, 70, '#1d2f7a'); koerper(132, 720, 36, 90, '#2c4fa3'); fenster(132, 730, 36, 70, 1, 2, '#f2c6dc')
dome(98, 735, 40, 48, '#8fd6ee'); koerper(84, 735, 28, 75, '#efb2cf')
koerper(296, 700, 110, 110, '#f2c6dc'); rund(351, 700, 110, 54, '#e7a64a'); raster(306, 715, 90, 80, 5, 3, '#c98ab0', 7)
koerper(420, 690, 180, 120, '#5aa8e0'); rund(510, 690, 180, 64, '#9fdcef'); fenster(420, 705, 180, 95, 6, 2, '#1d2f7a', .5, .66); raster(440, 640, 140, 40, 8, 2, '#3d73c9', 6)
dome(262, 735, 46, 60, '#e7a64a'); koerper(246, 735, 32, 75, '#1d1b2d'); streifen(246, 745, 32, 60, 4, GOLD)
# Goldkanten als Glanzpunkte
for (x, y) in [(26,508),(99,464),(257,483),(328,528),(377,450),(434,377),(495,314),(561,385),(150,650),(98,687),(262,675),(351,646),(510,626),(196,608)]:
    glanz['stadt'].append([round(x/600, 4), round(y/806, 4)])
p('</svg>')
open('kopfbild.svg', 'w').write('\n'.join(out))
json.dump(glanz, open('glanz.json', 'w'), separators=(',', ':'))
print({k: len(v) for k, v in glanz.items()})

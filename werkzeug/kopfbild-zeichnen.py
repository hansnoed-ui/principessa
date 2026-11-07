import random, json, math
random.seed(7)
W, H = 1200, 1612; S = 2
ROSA = '#c89bc4'; GOLD = '#c8902c'; GOLD_H = '#ebc462'; GOLD_D = '#8f6118'; GOLD_X = '#fff0b8'
NAVY = '#1b2a6a'; BLAU = '#2f6fcf'; HELL = '#7ec7e8'; CYAN = '#49b9d8'; ROSAH = '#efc3da'; DUNKEL = '#1a1726'; ROT = '#c23a55'; LILA = '#4a3690'
out = []
def p(s): out.append(s)
def glitzer(cx, cy, w, h, n, farben, clip=None):
    for _ in range(n):
        x, y = cx + (random.random()-.5)*w, cy + (random.random()-.5)*h
        p(f'<circle cx="{x*S:.1f}" cy="{y*S:.1f}" r="{random.uniform(.8,2.6):.1f}" fill="{random.choice(farben)}"/>')
def zwiebel(cx, by, w, h, fill, spitze=True):
    cx, by, w, h = cx*S, by*S, w*S, h*S
    r = w/2
    d = (f"M{cx-r*.72:.1f},{by:.1f} C{cx-r*1.35:.1f},{by-h*.38:.1f} {cx-r*1.1:.1f},{by-h*.72:.1f} {cx-r*.22:.1f},{by-h*.9:.1f} "
         f"Q{cx:.1f},{by-h*1.02:.1f} {cx:.1f},{by-h*1.14:.1f} Q{cx:.1f},{by-h*1.02:.1f} {cx+r*.22:.1f},{by-h*.9:.1f} "
         f"C{cx+r*1.1:.1f},{by-h*.72:.1f} {cx+r*1.35:.1f},{by-h*.38:.1f} {cx+r*.72:.1f},{by:.1f} Z")
    p(f'<path d="{d}" fill="{fill}" stroke="{GOLD}" stroke-width="7" stroke-linejoin="round"/>')
    if spitze: p(f'<circle cx="{cx:.1f}" cy="{by-h*1.16:.1f}" r="7" fill="{GOLD_H}"/>')
def kuppel(cx, by, w, h, fill):
    cx, by, w, h = cx*S, by*S, w*S, h*S
    p(f'<path d="M{cx-w/2:.1f},{by:.1f} C{cx-w/2:.1f},{by-h*1.3:.1f} {cx+w/2:.1f},{by-h*1.3:.1f} {cx+w/2:.1f},{by:.1f} Z" fill="{fill}" stroke="{GOLD}" stroke-width="7"/>')
def turm(x, y, w, h, fill, gold_rand=True):
    p(f'<rect x="{x*S}" y="{y*S}" width="{w*S}" height="{h*S}" fill="{fill}" stroke="{GOLD}" stroke-width="{7 if gold_rand else 0}"/>')
def bogen(x, y, w, h, fill):
    x, y, w, h = x*S, y*S, w*S, h*S
    p(f'<path d="M{x:.1f},{y+h:.1f} V{y+w/2:.1f} A{w/2:.1f},{w/2:.1f} 0 0 1 {x+w:.1f},{y+w/2:.1f} V{y+h:.1f} Z" fill="{fill}"/>')
def fenster(x, y, w, h, nx, ny, fill, fw=.5, fh=.6):
    cw, ch = w/nx, h/ny
    for i in range(nx):
        for j in range(ny):
            bogen(x+cw*(i+.5)-cw*fw/2, y+ch*(j+.5)-ch*fh/2, cw*fw, ch*fh, fill)
def raster(x, y, w, h, nx, ny, fill, r=3.5):
    for i in range(nx):
        for j in range(ny):
            p(f'<circle cx="{(x+w*(i+.5)/nx)*S:.1f}" cy="{(y+h*(j+.5)/ny)*S:.1f}" r="{r*S/2:.1f}" fill="{fill}"/>')
def streifen(x, y, w, h, n, fill, dick=4):
    for j in range(n):
        p(f'<rect x="{(x+4)*S}" y="{(y+h*(j+.5)/n-dick/2)*S:.1f}" width="{(w-8)*S}" height="{dick*S}" fill="{fill}"/>')
def herz(cx, cy, s, fill):
    cx, cy, s = cx*S, cy*S, s*S
    p(f'<path d="M{cx:.1f},{cy+s*.9:.1f} C{cx-s*1.3:.1f},{cy:.1f} {cx-s*.6:.1f},{cy-s:.1f} {cx:.1f},{cy-s*.25:.1f} C{cx+s*.6:.1f},{cy-s:.1f} {cx+s*1.3:.1f},{cy:.1f} {cx:.1f},{cy+s*.9:.1f} Z" fill="{fill}"/>')
def goldfassade(x, y, w, h):
    turm(x, y, w, h, GOLD); glitzer(x+w/2, y+h/2, w*.9, h*.9, int(w*h/22), [GOLD_H, GOLD_D, GOLD_X, '#ffffff'])

glanz = {'sonne': [], 'himmel': [], 'stadt': [], 'mond': []}
p(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
p(f'<rect width="{W}" height="{H}" fill="{ROSA}"/>')
# weiche Wolkigkeit im Himmel
for _ in range(14):
    p(f'<ellipse cx="{random.uniform(0,600)*S:.0f}" cy="{random.uniform(0,520)*S:.0f}" rx="{random.uniform(60,140)*S:.0f}" ry="{random.uniform(30,70)*S:.0f}" fill="#d3a8cd" opacity=".35"/>')
# grosse weisse Punkte
for _ in range(34):
    x, y = random.uniform(14, 586), random.uniform(14, 500)
    if (x-285)**2 + (y-262)**2 < 232**2: continue
    r = random.uniform(7, 11)
    p(f'<circle cx="{x*S:.1f}" cy="{y*S:.1f}" r="{r:.1f}" fill="#f6eef5"/>')
    if random.random() < .5: glanz['himmel'].append([round(x/600, 4), round(y/806, 4)])
def mond(cx, cy, r, dx, dy):
    m = f'm{len(out)}'
    p(f'<mask id="{m}"><rect width="{W}" height="{H}" fill="#fff"/><circle cx="{(cx+dx)*S}" cy="{(cy+dy)*S}" r="{r*S*.86:.1f}" fill="#000"/></mask>')
    p(f'<circle cx="{cx*S}" cy="{cy*S}" r="{r*S}" fill="#f4ecf3" mask="url(#{m})"/>')
mond(48, 50, 34, 15, -9); glanz['mond'] += [[.065, .05], [.045, .08]]
mond(483, 322, 15, 8, -5)
# Sonne: rund, mit weichem Glitzersaum
p(f'<circle cx="{285*S}" cy="{262*S}" r="{214*S}" fill="{GOLD}"/>')
for _ in range(700):
    a = random.random()*math.tau; rr = 214 + random.uniform(0, 9)
    p(f'<circle cx="{(285+math.cos(a)*rr)*S:.1f}" cy="{(262+math.sin(a)*rr)*S:.1f}" r="{random.uniform(1.5,4):.1f}" fill="{random.choice([GOLD, GOLD_H, GOLD_D])}"/>')
for _ in range(7000):
    a, rr = random.random()*math.tau, math.sqrt(random.random())*212
    x, y = 285 + math.cos(a)*rr, 262 + math.sin(a)*rr
    c = random.choices([GOLD_H, GOLD_D, '#d9a63f', '#b07a22', GOLD_X, '#ffffff'], [3, 3, 3, 2, 2, 1])[0]
    p(f'<circle cx="{x*S:.1f}" cy="{y*S:.1f}" r="{random.uniform(1.5, 5):.1f}" fill="{c}"/>')
    if c == GOLD_X and len(glanz['sonne']) < 60: glanz['sonne'].append([round(x/600, 4), round(y/806, 4)])
# feiner Glitzerstaub im Himmel
for _ in range(900):
    x, y = random.uniform(0, 600), random.uniform(0, 540)
    if (x-285)**2 + (y-262)**2 < 230**2: continue
    p(f'<circle cx="{x*S:.1f}" cy="{y*S:.1f}" r="{random.uniform(.6,1.8):.1f}" fill="{random.choice(["#fff6e6", "#f3d9a0", "#ffffff"])}" opacity="{random.uniform(.35,.9):.2f}"/>')
# Stadt, hinten
goldfassade(0, 470, 56, 340); fenster(4, 500, 48, 200, 2, 4, NAVY); zwiebel(28, 470, 76, 84, HELL); raster(6, 720, 44, 70, 3, 3, NAVY, 7)
turm(62, 560, 62, 250, GOLD); raster(70, 575, 46, 60, 3, 3, ROSAH, 8); streifen(62, 650, 62, 150, 7, ROSAH); zwiebel(93, 560, 74, 70, ROSAH)
turm(128, 640, 40, 170, LILA); fenster(128, 650, 40, 150, 1, 4, GOLD_H, .45, .5); zwiebel(148, 640, 50, 60, GOLD)
turm(228, 540, 60, 270, BLAU); fenster(230, 560, 56, 230, 2, 5, NAVY, .5, .62); kuppel(258, 540, 70, 46, GOLD)
turm(294, 600, 96, 210, ROSAH); raster(300, 530, 84, 60, 5, 3, GOLD, 8); zwiebel(342, 600, 120, 96, GOLD); raster(304, 640, 76, 70, 4, 3, GOLD, 7)
turm(362, 500, 40, 310, DUNKEL); streifen(362, 520, 40, 280, 10, GOLD, 5); zwiebel(382, 500, 50, 72, NAVY)
turm(400, 460, 74, 350, BLAU); fenster(402, 490, 70, 240, 2, 5, NAVY, .5, .62); zwiebel(437, 460, 96, 100, HELL); raster(410, 380, 54, 70, 4, 4, CYAN, 6)
turm(474, 380, 52, 430, DUNKEL); streifen(474, 400, 52, 380, 13, GOLD, 5); zwiebel(500, 380, 76, 90, LILA); raster(480, 290, 40, 70, 3, 4, GOLD_H, 7)
turm(526, 440, 74, 370, HELL); fenster(528, 460, 70, 310, 2, 6, BLAU, .5, .62); zwiebel(563, 440, 90, 74, ROT)
# vorne
goldfassade(0, 700, 70, 110); raster(8, 712, 54, 86, 3, 3, LILA, 10)
turm(108, 700, 180, 110, CYAN); kuppel(198, 700, 176, 86, HELL)
for x in [138, 172, 206, 240]: herz(x, 732, 11, ROSAH); herz(x+17, 772, 11, ROSAH)
turm(132, 720, 38, 90, NAVY); zwiebel(151, 720, 54, 66, NAVY); fenster(136, 735, 30, 60, 1, 2, GOLD_H)
turm(84, 735, 30, 75, GOLD); zwiebel(99, 735, 42, 48, HELL)
turm(296, 700, 112, 110, GOLD); glitzer(352, 755, 100, 95, 200, [GOLD_H, GOLD_D, GOLD_X]); kuppel(352, 700, 112, 56, GOLD); fenster(300, 715, 104, 85, 4, 2, '#f3e6c4', .5, .7)
turm(420, 690, 180, 120, BLAU); kuppel(510, 690, 180, 70, HELL); fenster(422, 705, 176, 95, 6, 2, NAVY, .5, .66); raster(440, 638, 140, 42, 8, 2, NAVY, 6)
turm(246, 735, 32, 75, DUNKEL); streifen(246, 745, 32, 60, 4, GOLD); zwiebel(262, 735, 46, 60, GOLD)
for (x, y) in [(28,375),(93,480),(148,572),(258,490),(342,490),(382,418),(437,346),(500,278),(563,356),(151,645),(99,680),(262,667),(352,630),(510,600),(198,595)]:
    glanz['stadt'].append([round(x/600, 4), round(y/806, 4)])
# leichte Vignette
p(f'<rect width="{W}" height="{H}" fill="url(#v)"/>')
p(f'<defs><radialGradient id="v" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#2a1030" stop-opacity=".28"/></radialGradient></defs>')
p('</svg>')
open('kopfbild.svg', 'w').write('\n'.join(out))
json.dump(glanz, open('glanz.json', 'w'), separators=(',', ':'))

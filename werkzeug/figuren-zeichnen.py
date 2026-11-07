import random, math
random.seed(3)
def kopf_svg(W, H, dateien):
    pass
# ---------------- Principessa 2: Tupfenkleid (Box 1024)
def p2():
    o = []; p = o.append; N = 1024
    p(f'<svg xmlns="http://www.w3.org/2000/svg" width="{N}" height="{N}" viewBox="0 0 {N} {N}">')
    p('<defs><filter id="w" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter></defs>')
    L = '#1c1620'; W = '#faf7f2'; ROSA = '#f1c3d2'; ROT = '#c3162d'
    # Beine mit Füssen
    for x, fx in [(368, -38), (498, 42)]:
        p(f'<path d="M{x},700 L{x-6},960 L{x-6+fx},960" fill="none" stroke="{W}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>')
        p(f'<path d="M{x},700 L{x-6},960 L{x-6+fx},960" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" filter="url(#w)" opacity=".5"/>')
    # Kleid: Glocke, leicht gedreht
    p(f'<path d="M372,445 C330,560 300,650 290,735 C370,745 480,745 580,728 C560,650 530,560 500,440 Z" fill="{ROSA}"/>')
    p(f'<path d="M372,445 C330,560 300,650 290,735 C370,745 480,745 580,728 C560,650 530,560 500,440 Z" fill="url(#g)" opacity=".18"/>')
    p('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#b86a8a"/></linearGradient></defs>')
    for cx, cy, r in [(400,520,26),(475,500,22),(355,620,24),(440,610,30),(520,585,22),(395,700,22),(480,690,26),(545,665,20),(330,700,16)]:
        p(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{W}" opacity=".95"/>')
    # Arme in die Hüften
    p(f'<path d="M382,470 C300,500 245,560 240,620 C250,640 300,655 330,640" fill="none" stroke="{W}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>')
    p(f'<path d="M500,462 C590,480 650,540 655,600 C640,630 590,640 560,628" fill="none" stroke="{W}" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>')
    # Kopf, schief gelegt
    p(f'<g transform="rotate(-18 440 290)">')
    p(f'<ellipse cx="440" cy="290" rx="235" ry="150" fill="{W}"/>')
    p(f'<ellipse cx="440" cy="290" rx="235" ry="150" fill="none" stroke="rgba(0,0,0,.06)" stroke-width="3"/>')
    # Augen geschlossen mit Wimpern
    for ax, ay, b in [(345, 300, 70), (515, 300, 70)]:
        p(f'<path d="M{ax-b/2},{ay} Q{ax},{ay+28} {ax+b/2},{ay}" fill="none" stroke="{L}" stroke-width="7" stroke-linecap="round"/>')
        for k in range(5):
            t = -1 + k*.5; x0 = ax + t*b/2; y0 = ay + 28*(1-t*t)*.5 + 2
            p(f'<path d="M{x0:.0f},{y0:.0f} l{t*10:.0f},22" stroke="{L}" stroke-width="5" stroke-linecap="round"/>')
    # Mund
    p(f'<path d="M405,372 C415,360 430,360 440,368 C450,360 465,362 472,372 C460,390 420,392 405,372 Z" fill="{ROT}"/>')
    # Krone: breiter Glitzerkranz, fast waagrecht auf dem Kopf
    p('</g>')
    p('<g transform="rotate(-6 440 170)">')
    p(f'<path d="M300,180 L326,118 L364,172 L400,100 L438,170 L476,96 L514,170 L552,104 L586,172 L618,122 L632,186 C570,232 320,236 290,196 Z" fill="#cdb79a"/>')
    for _ in range(620):
        x = random.uniform(292, 630); y = random.uniform(104, 232)
        d = abs(x-461); k = 100 + d*.42
        if y < k: continue
        p(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(1.5,4.5):.1f}" fill="{random.choice(["#fff7e0","#e8d2a8","#f4e3ff","#d6ecff","#ffdbe8","#c7b48c","#ffffff"])}"/>')
    p('</g>')
    p('</svg>'); return '\n'.join(o)

# ---------------- Principessa 3: Meerjungfrau in Teilen (Box 768)
def p3():
    teile = {}
    L = '#1c1620'; HAUT = '#f1e6d2'; GELB = '#e9d05a'
    def svg(body):
        return f'<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">{body}</svg>'
    # Kopf (Mitte ~ 384,345; Original 240..640 x, 240..440 y)
    k = []
    # Locken aussen
    for i in range(30):
        a = math.pi*(1.08 + i/30*1.1*(-1)) if False else -0.22 + i/29*(math.pi+.44)
        x = 384 + math.cos(a)*218; y = 350 - math.sin(a)*126
        k.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(20,27):.0f}" fill="{GELB}"/>')
    k.append(f'<ellipse cx="384" cy="350" rx="208" ry="112" fill="{HAUT}"/>')
    k.append(f'<ellipse cx="384" cy="350" rx="208" ry="112" fill="none" stroke="rgba(0,0,0,.05)" stroke-width="3"/>')
    for ax in (300, 470):
        k.append(f'<path d="M{ax-36},338 Q{ax},366 {ax+36},338" fill="none" stroke="{L}" stroke-width="8" stroke-linecap="round"/>')
        for t in (-1, -.5, 0, .5, 1):
            x0 = ax + t*36; y0 = 338 + 28*(1-t*t)*.5 + 2
            k.append(f'<path d="M{x0:.0f},{y0:.0f} l{t*10:.0f},22" stroke="{L}" stroke-width="5" stroke-linecap="round"/>')
    # Glitzerwangen
    for cx in (250, 520):
        k.append(f'<circle cx="{cx}" cy="372" r="22" fill="#f3b9c6" opacity=".9"/>')
        for _ in range(40):
            a, r = random.random()*6.3, math.sqrt(random.random())*20
            k.append(f'<circle cx="{cx+math.cos(a)*r:.0f}" cy="{372+math.sin(a)*r:.0f}" r="{random.uniform(1,2.5):.1f}" fill="{random.choice(["#fff","#ffd9e4","#f6a5bd"])}"/>')
    k.append(f'<path d="M322,398 Q384,432 446,396" fill="none" stroke="#e36a86" stroke-width="7" stroke-linecap="round"/>')
    teile['kopf'] = svg(''.join(k))
    # Krone (Original ~ x 455..520, y 20..240)
    c = []
    c.append(f'<path d="M466,236 L458,70 L484,100 L492,52 L506,102 L532,70 L524,236 Z" fill="#c9972c"/>')
    for _ in range(260):
        x = random.uniform(460, 528); y = random.uniform(70, 236)
        c.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(1,3.5):.1f}" fill="{random.choice(["#f3d27a","#a8741f","#fff0b8","#d9a43a"])}"/>')
    for cx, cy in [(458, 56), (492, 38), (532, 56)]:
        c.append(f'<circle cx="{cx}" cy="{cy}" r="16" fill="#1f6a4a"/>')
        for _ in range(26):
            a, r = random.random()*6.3, math.sqrt(random.random())*14
            c.append(f'<circle cx="{cx+math.cos(a)*r:.0f}" cy="{cy+math.sin(a)*r:.0f}" r="{random.uniform(.8,2):.1f}" fill="{random.choice(["#7fe0b0","#2e9a6a","#c8ffe0"])}"/>')
    teile['krone'] = svg(''.join(c))
    # Rumpf mit Armen (Original y 455..520)
    r = []
    r.append(f'<path d="M352,452 L416,452 L426,520 L342,520 Z" fill="{HAUT}"/>')
    r.append(f'<path d="M356,462 C300,470 258,500 246,530" fill="none" stroke="{HAUT}" stroke-width="16" stroke-linecap="round"/>')
    r.append(f'<path d="M412,462 C470,470 512,500 526,530" fill="none" stroke="{HAUT}" stroke-width="16" stroke-linecap="round"/>')
    r.append(f'<circle cx="244" cy="532" r="10" fill="{HAUT}"/><circle cx="528" cy="532" r="10" fill="{HAUT}"/>')
    teile['rumpf'] = svg(''.join(r))
    # Schwanz (Original y 515..755)
    s = []
    farben = ['#2fae8e','#4fc3a8','#2a7f8a','#e8b9c7','#86c96b','#3dae8f','#e8b9c7','#2fae8e','#1f6f7a']
    # Umriss: Zylinder, der sich verjüngt, unten Flosse
    s.append('<defs><clipPath id="cs"><path d="M336,512 L432,512 C438,600 430,660 418,700 L350,700 C338,660 330,600 336,512 Z"/></clipPath></defs>')
    n = len(farben); y0, y1 = 512, 700
    for i, f in enumerate(farben):
        s.append(f'<rect x="300" y="{y0+(y1-y0)*i/n:.0f}" width="170" height="{(y1-y0)/n+1:.0f}" fill="{f}" clip-path="url(#cs)"/>')
    for _ in range(420):
        x = random.uniform(340, 430); y = random.uniform(515, 698)
        s.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(1.2,3.6):.1f}" fill="{random.choice(["#ffffff","#a6f5ea","#fff2b0","#2a9d8f"])}" opacity=".85" clip-path="url(#cs)"/>')
    # Flosse
    s.append(f'<path d="M352,698 C320,720 300,748 306,760 C340,752 370,736 384,722 C398,736 428,752 462,760 C468,748 448,720 416,698 Z" fill="#4fc3a8"/>')
    for _ in range(60):
        x = random.uniform(312, 456); y = random.uniform(708, 756)
        s.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(1,3):.1f}" fill="#d9fff4" opacity=".8"/>')
    teile['schwanz'] = svg(''.join(s))
    return teile
open('p2.svg','w').write(p2())
for n, t in p3().items(): open(f'p3-{n}.svg','w').write(t)
print('ok')

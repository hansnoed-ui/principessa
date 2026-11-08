// Der Auftakt: ein kleiner Film im Querformat 16:9, live gezeichnet (Canvas 2D).
// Die Principessa schläft in ihrem Turmzimmer, der Hund mit Krone im Körbchen daneben.
// Es wird hell, beide wachen auf, schütteln sich (Glitzer), stehen auf und gehen zur Tür hinaus
// auf die Wiese. Dort bleiben sie stehen; dann springen sie als 3D-Figuren aus dem Bild (main.js).
//
// Alles hängt an einer einzigen Zeit t in Sekunden. Masse sind in Bildeinheiten: 1 = Bildhöhe,
// die Breite ist 16/9. Die Welt ist breiter als das Bild; die Kamera (cam) fährt nach rechts mit.
import { zeichne, zeichneKopf, zeichneKrone, zeichneHund, F, F4, C, rng } from './figur.js';

const BREITE = 16 / 9, BODEN = .86;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const glatt = (t, a, b) => { const u = seg(t, a, b); return u * u * (3 - 2 * u); };
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eout = t => 1 - Math.pow(1 - t, 3);
const mischen = (a, b, t) => {
  const h = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const A = h(a), B = h(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`;
};

// ------------------------------------------------------------------ Zeitplan (Sekunden)
export const AUFTAKT = {
  hell: [.8, 2.8],        // am Fenster wird es Tag: Nachtblau wird Rosa, der Mond verblasst
  wach: [1.7, 2.3],       // die Augen gehen auf, der Hund hebt den Kopf
  sitz: [2.3, 3.0],       // die Principessa setzt sich auf
  schuettel: [3.1, 4.1],  // beide schütteln sich, Glitzer stiebt
  steh: [4.2, 5.0],       // sie steigt aus dem Bett, er springt aus dem Körbchen
  krone: [5.0, 5.7],      // die Krone fliegt vom Bettpfosten auf ihren Kopf
  geh: 5.8,               // los geht's
  tuer: [6.3, 7.0],       // die Tür öffnet sich
  kamera: [7.0, 9.6],     // die Kamera fährt mit hinaus
  halt: 10.4,             // beide bleiben stehen
  sprung: 11.2,           // die 3D-Figuren übernehmen (main.js)
};
export const HOEHE_P = .34;          // Höhe der Principessa im Bild (Bildhöhe = 1)
export const SKALA_H = .09;          // Bildeinheiten je Hunde-Einheit

// ------------------------------------------------------------------ Farben
const FARBE = {
  wand: '#4a2e5a', boden: '#33203a', mauer: '#5f3f6b',
  nacht: '#2a1f4e', morgen: '#f0bfc2', mond: '#fbf3e4', gold: '#d4a429',
  bett: '#b0586a', bettDunkel: '#8e4454', matratze: '#fbf3e4', kissen: '#fffaf2',
  korb: '#d1a54c', korbDunkel: '#ad8530', korbKissen: '#f6d6d2',
  tuer: '#c98b86', tuerDunkel: '#a36660',
  wiese: '#3e9868', wieseDunkel: '#2a8f5c', huegel: '#a9cf8c', huegelFern: '#dba593',
  stamm: '#5a3a3f', baum: '#4f9a5f', sonne: '#d4a429', stadt: '#c99aa4',
};

// ------------------------------------------------------------------ Bewegung der Figuren
// Weg der Principessa (Welt-x): sie startet neben dem Bett, läuft gleichmässig und hält sanft an
const P_START = .72, P_TEMPO = .36;
function wegP(t) {
  if (t <= AUFTAKT.geh) return P_START;
  // Geschwindigkeit fährt in .5 s hoch und in .6 s herunter; Distanz als Integral in kleinen Schritten
  let x = P_START, dt = .02;
  for (let u = AUFTAKT.geh; u < Math.min(t, AUFTAKT.halt + .6); u += dt) {
    const v = P_TEMPO * glatt(u, AUFTAKT.geh, AUFTAKT.geh + .5) * (1 - glatt(u, AUFTAKT.halt - .6, AUFTAKT.halt));
    x += v * Math.min(dt, t - u);
  }
  return x;
}
// Weg des Hundes: läuft voraus, wartet vor der Tür, schnuppert an einer Blume, trabt ans Ziel
const HUND_WEG = [[AUFTAKT.geh - .1, 1.5], [7.3, 1.92], [8.1, 1.92], [8.7, 2.24], [9.6, 2.24], [10.4, 2.66]];
function wegH(t) {
  if (t <= HUND_WEG[0][0]) return HUND_WEG[0][1];
  for (let i = 0; i < HUND_WEG.length - 1; i++) {
    const [t0, x0] = HUND_WEG[i], [t1, x1] = HUND_WEG[i + 1];
    if (t <= t1) return lerp(x0, x1, glatt(t, t0, t1));
  }
  return HUND_WEG[HUND_WEG.length - 1][1];
}
const kamera = t => lerp(0, wegP(AUFTAKT.halt + 1) - .75, eio(seg(t, AUFTAKT.kamera[0], AUFTAKT.kamera[1])));

// Lage der beiden im Bild (Anteile der Bildbreite/-höhe), für die Übergabe an die 3D-Figuren
export function auftaktLage(t) {
  const cam = kamera(t);
  const px = wegP(t), hx = wegH(t);
  return {
    sichtbar: t < AUFTAKT.sprung,
    p: { x: (px - cam) / BREITE, fuss: BODEN, h: HOEHE_P },
    hund: { x: (hx - cam) / BREITE, fuss: BODEN, h: F4.hoehe * SKALA_H, breite: F4.laenge * SKALA_H / BREITE },
  };
}

// ------------------------------------------------------------------ Glitzer, ohne Zustand: jedes Korn hat seine Zeit
function funken(ctx, X, Y, S, cx, cy, t0, dauer, seed, n, weite, hoch, t, farben = ['#ffffff', '#a6f5ea', '#fff2b0', '#ffd27a']) {
  const r = rng(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const geburt = t0 + r() * dauer, leben = .7 + r() * .7, a = r() * Math.PI * 2, v = (.08 + r() * .22) * weite;
    const vx = Math.cos(a) * v, vy = Math.sin(a) * v * .6 - hoch, rad = .003 + r() * .004, farbe = farben[Math.floor(r() * farben.length)];
    const u = t - geburt; if (u < 0 || u > leben) continue;
    const x = cx + vx * u, y = cy + vy * u + .25 * u * u;
    const alpha = Math.sin(Math.PI * u / leben) * (.6 + .4 * Math.sin(u * 40 + i));
    ctx.globalAlpha = alpha; ctx.fillStyle = farbe;
    if (rad > .005) stern(ctx, X(x), Y(y), rad * S * .9); else { ctx.beginPath(); ctx.arc(X(x), Y(y), rad * S, 0, 7); ctx.fill(); }
  }
  ctx.restore();
}
function stern(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r * 2.2); ctx.quadraticCurveTo(x, y, x + r * 2.2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2.2); ctx.quadraticCurveTo(x, y, x - r * 2.2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2.2); ctx.fill();
}

const STERNE = (() => { const r = rng(5), out = []; for (let i = 0; i < 90; i++) out.push([r() * 4, r() * .7, .4 + Math.pow(r(), 3) * 1.6, r() * 7, 1 + r() * 2]); return out; })();
// Die Sonne wird einmal je Grösse mit ihrem Glitzer vorgerendert; darüber funkeln wenige Punkte live
let sonnenBild = null, sonnenBildR = 0;
function sonne(ctx, x, y, r, tau) {
  const R = Math.round(r);
  if (!sonnenBild || sonnenBildR !== R) {
    sonnenBild = document.createElement('canvas'); sonnenBild.width = sonnenBild.height = R * 2 + 2; sonnenBildR = R;
    const g = sonnenBild.getContext('2d'), q = rng(9);
    g.beginPath(); g.arc(R + 1, R + 1, R, 0, 7); g.clip();
    g.fillStyle = FARBE.sonne; g.fillRect(0, 0, R * 2 + 2, R * 2 + 2);
    for (let i = 0; i < 1400; i++) {
      const a = q() * Math.PI * 2, d = Math.sqrt(q()) * R, w = q();
      g.fillStyle = w < .45 ? 'rgba(255,246,200,.9)' : w < .7 ? 'rgba(255,230,140,.8)' : 'rgba(140,88,18,.55)';
      g.beginPath(); g.arc(R + 1 + Math.cos(a) * d, R + 1 + Math.sin(a) * d, (.35 + q() * 1.4) * R / 90, 0, 7); g.fill();
    }
  }
  ctx.drawImage(sonnenBild, x - R - 1, y - R - 1);
  const q = rng(13);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) {
    const a = q() * Math.PI * 2, d = Math.sqrt(q()) * R * .95, f = Math.pow(Math.max(0, Math.sin(tau * (1.5 + q() * 2) + q() * 7)), 6);
    if (f < .05) continue;
    ctx.globalAlpha = f * .9; ctx.fillStyle = '#fff8dc'; stern(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, R * .012 * (1 + f));
  }
  ctx.restore();
}
const BLUMEN = [[2.2, '#f7f2ec'], [2.36, '#d4a429'], [2.62, '#f3c6d3'], [2.95, '#f7f2ec'], [3.3, '#d4a429']];

// ------------------------------------------------------------------ Zeichnen
export function zeichneAuftakt(ctx, W, H, t, tau = t) {
  const S = H, cam = kamera(t);
  const X = x => (x - cam) * S, Y = y => y * S;   // Welt → Pixel
  const lw = Math.max(1, S * .004);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.clearRect(0, 0, W, H);

  const tag = glatt(t, AUFTAKT.hell[0], AUFTAKT.hell[1]);                // 0 Nacht, 1 Morgen
  const himmel = mischen(FARBE.nacht, FARBE.morgen, tag);
  const px = wegP(t), hx = wegH(t);

  // ---------- Draussen (liegt hinter allem; man sieht es durch Fenster und Tür und später ganz)
  const draussen = () => {
    ctx.fillStyle = himmel; ctx.fillRect(0, 0, W, H);
    // Sterne verblassen am Morgen
    if (tag < 1) {
      ctx.fillStyle = '#f7f2ec';
      for (const [sx, sy, r, ph, k] of STERNE) {
        const x = X(sx), y = Y(sy); if (x < -10 || x > W + 10) continue;
        ctx.globalAlpha = (1 - tag) * (.35 + .65 * (.5 + .5 * Math.sin(tau * k + ph)));
        ctx.beginPath(); ctx.arc(x, y, r * S / 540, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // Mond: Sichel, oben links im Fenster, verblasst mit dem Morgen
    if (tag < 1) {
      ctx.save(); ctx.globalAlpha = 1 - tag; ctx.fillStyle = FARBE.mond;
      ctx.beginPath(); ctx.arc(X(.8), Y(.24), .05 * S, 0, 7); ctx.fill();
      ctx.fillStyle = himmel; ctx.beginPath(); ctx.arc(X(.8) + .022 * S, Y(.24) - .012 * S, .045 * S, 0, 7); ctx.fill();
      ctx.restore();
    }
    // Sonne: Glitzergold, steigt über die Hügel
    {
      const sy = lerp(.56, .33, glatt(t, 6.5, 10.5)), sx = 3.05, sr = .17;
      if (X(sx) + sr * S > 0) sonne(ctx, X(sx), Y(sy), sr * S, tau);
    }
    // Stadt mit Kuppeltürmen am Horizont, fern
    ctx.fillStyle = FARBE.stadt;
    for (const [bx, bw, bh, kuppel] of [[2.52, .05, .1, 1], [2.58, .04, .15, 1], [2.66, .06, .09, 1], [2.74, .035, .13, 1]]) {
      ctx.fillRect(X(bx), Y(.68 - bh), bw * S, bh * S);
      if (kuppel) { ctx.beginPath(); ctx.arc(X(bx + bw / 2), Y(.68 - bh), bw / 2 * S, Math.PI, 0); ctx.fill(); }
    }
    // Hügel, zwei Reihen, einfarbig
    const huegel = (farbe, y0, amp, k, ph) => {
      ctx.fillStyle = farbe; ctx.beginPath(); ctx.moveTo(0, H);
      for (let i = 0; i <= 60; i++) { const wx = cam - .1 + (BREITE + .2) * i / 60; ctx.lineTo(X(wx), Y(y0 + Math.sin(wx * k + ph) * amp + Math.sin(wx * k * 2.3 + ph) * amp * .4)); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    };
    huegel(FARBE.huegelFern, .66, .03, 2.1, .4);
    huegel(FARBE.huegel, .76, .025, 3.3, 2);
    // Wiese: eine Fläche
    ctx.fillStyle = FARBE.wiese; ctx.fillRect(0, Y(BODEN), W, H - Y(BODEN));
    // zwei Bäume: eine runde Krone auf feinem Stamm
    for (const [bx, h, r] of [[1.98, .24, .1], [3.08, .3, .12]]) {
      ctx.strokeStyle = FARBE.stamm; ctx.lineWidth = .012 * S; ctx.beginPath(); ctx.moveTo(X(bx), Y(BODEN)); ctx.lineTo(X(bx), Y(BODEN - h)); ctx.stroke();
      ctx.fillStyle = FARBE.baum; ctx.beginPath(); ctx.arc(X(bx), Y(BODEN - h), r * S, 0, 7); ctx.fill();
    }
    // Blumen: ein Stiel, ein farbiger Punkt, wiegen sich leise
    for (const [bx, farbe] of BLUMEN) {
      const wind = Math.sin(tau * 1.1 + bx * 3) * .006, h = .05;
      ctx.strokeStyle = FARBE.wieseDunkel; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(X(bx), Y(BODEN)); ctx.quadraticCurveTo(X(bx), Y(BODEN - h * .5), X(bx + wind), Y(BODEN - h)); ctx.stroke();
      ctx.fillStyle = farbe; ctx.beginPath(); ctx.arc(X(bx + wind), Y(BODEN - h), .012 * S, 0, 7); ctx.fill();
    }
    // Vögel: zwei kleine Bögen, ziehen langsam
    ctx.strokeStyle = 'rgba(43,33,82,.75)'; ctx.lineWidth = lw * .8;
    for (const [bx0, by0, v, ph] of [[2.0, .22, .05, 0], [2.3, .28, .045, 2], [2.6, .19, .055, 4]]) {
      const bx = bx0 + (t - 6) * v, by = by0 + Math.sin(tau * .7 + ph) * .01, fl = Math.sin(tau * 6 + ph) * .006;
      ctx.beginPath(); ctx.moveTo(X(bx - .015), Y(by + fl)); ctx.quadraticCurveTo(X(bx - .007), Y(by - .004), X(bx), Y(by)); ctx.quadraticCurveTo(X(bx + .007), Y(by - .004), X(bx + .015), Y(by + fl)); ctx.stroke();
    }
  };

  // ---------- Das Turmzimmer: Wand, Boden, Fenster, Tür (Welt-x 0 bis 1.62, Wand bis 1.74)
  const ZIMMER_R = 1.62, WAND = .12, TUER_L = 1.44, TUER_O = .42;
  const zimmer = () => {
    // Wand mit Fenster (ausgespart) und Türöffnung
    ctx.save();
    ctx.beginPath(); ctx.rect(X(-1), 0, (ZIMMER_R + 1) * S, Y(BODEN));
    // Fensterbogen aussparen
    ctx.moveTo(X(.72), Y(.58)); ctx.lineTo(X(.72), Y(.29)); ctx.arc(X(.87), Y(.29), .15 * S, Math.PI, 0); ctx.lineTo(X(1.02), Y(.58)); ctx.closePath();
    // Türöffnung aussparen
    ctx.moveTo(X(TUER_L), Y(BODEN)); ctx.lineTo(X(TUER_L), Y(TUER_O + .09)); ctx.arc(X(TUER_L + .09), Y(TUER_O + .09), .09 * S, Math.PI, 0); ctx.lineTo(X(TUER_L + .18), Y(BODEN)); ctx.closePath();
    ctx.fillStyle = FARBE.wand; ctx.fill('evenodd');
    ctx.restore();
    // Fensterrahmen: eine feine goldene Linie
    ctx.strokeStyle = FARBE.gold; ctx.lineWidth = lw * 1.2;
    ctx.beginPath(); ctx.moveTo(X(.72), Y(.58)); ctx.lineTo(X(.72), Y(.29)); ctx.arc(X(.87), Y(.29), .15 * S, Math.PI, 0); ctx.lineTo(X(1.02), Y(.58)); ctx.closePath(); ctx.stroke();
    // Boden: eine ruhige Fläche
    ctx.fillStyle = FARBE.boden; ctx.fillRect(X(-1), Y(BODEN), (ZIMMER_R + 1) * S, H - Y(BODEN));
    // Turmmauer: ein Band rechts, vom Boden bis oben; die Tür führt hindurch
    ctx.fillStyle = FARBE.mauer; ctx.fillRect(X(ZIMMER_R), 0, WAND * S, Y(BODEN));
    ctx.fillRect(X(TUER_L + .18), 0, (ZIMMER_R - TUER_L - .18) * S, Y(BODEN));
    // Türbogen: goldene Linie
    ctx.strokeStyle = FARBE.gold; ctx.lineWidth = lw * 1.2;
    ctx.beginPath(); ctx.moveTo(X(TUER_L), Y(BODEN)); ctx.lineTo(X(TUER_L), Y(TUER_O + .09)); ctx.arc(X(TUER_L + .09), Y(TUER_O + .09), .09 * S, Math.PI, 0); ctx.lineTo(X(TUER_L + .18), Y(BODEN)); ctx.stroke();
    // Tür: schwingt nach aussen auf (nach rechts), Angel bei TUER_L + .18 (rechter Pfosten)
    const auf = eio(seg(t, AUFTAKT.tuer[0], AUFTAKT.tuer[1]));
    ctx.save(); ctx.translate(X(TUER_L + .18), 0); ctx.scale(lerp(1, .12, auf), 1); ctx.translate(-X(TUER_L + .18), 0);
    ctx.fillStyle = mischen(FARBE.tuer, FARBE.tuerDunkel, auf * .6);
    ctx.beginPath(); ctx.moveTo(X(TUER_L), Y(BODEN)); ctx.lineTo(X(TUER_L), Y(TUER_O + .09)); ctx.arc(X(TUER_L + .09), Y(TUER_O + .09), .09 * S, Math.PI, 0); ctx.lineTo(X(TUER_L + .18), Y(BODEN)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = FARBE.gold; ctx.beginPath(); ctx.arc(X(TUER_L + .035), Y(.68), .011 * S, 0, 7); ctx.fill();
    ctx.restore();
  };

  // ---------- Das Bett (Welt-x .12 bis .62)
  const BETT = { l: .12, r: .62, matratze: .72, kopfX: .13, kopfOben: .44 };
  const atem = Math.sin(tau * 1.4) * .006 * (1 - glatt(t, AUFTAKT.sitz[0], AUFTAKT.sitz[1]));
  const bettHinten = () => {
    ctx.fillStyle = FARBE.bett;
    // Kopfteil: rund, mit Pfosten und Kugel
    ctx.beginPath(); ctx.moveTo(X(BETT.l), Y(BODEN)); ctx.lineTo(X(BETT.l), Y(BETT.kopfOben + .08)); ctx.arc(X(BETT.l + .08), Y(BETT.kopfOben + .08), .08 * S, Math.PI, 0); ctx.lineTo(X(BETT.l + .16), Y(BODEN)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = FARBE.gold; ctx.beginPath(); ctx.arc(X(BETT.kopfX), Y(BETT.kopfOben + .05), .018 * S, 0, 7); ctx.fill();
    // Fussteil
    ctx.fillStyle = FARBE.bett; ctx.fillRect(X(BETT.r - .03), Y(.62), .03 * S, (BODEN - .62) * S);
    ctx.fillStyle = FARBE.gold; ctx.beginPath(); ctx.arc(X(BETT.r - .015), Y(.62), .018 * S, 0, 7); ctx.fill();
    // Matratze und Kissen
    ctx.fillStyle = FARBE.matratze; ctx.fillRect(X(BETT.l + .16), Y(BETT.matratze - .04), (BETT.r - BETT.l - .19) * S, .07 * S);
    ctx.fillStyle = FARBE.kissen; ctx.beginPath(); ctx.ellipse(X(.26), Y(BETT.matratze - .045), .09 * S, .035 * S, 0, 0, 7); ctx.fill();
  };
  // Die Decke: gestreift wie das Kleid; sie rutscht herunter, wenn die Principessa sich aufsetzt
  const deckeOben = lerp(.665, .745, eio(seg(t, AUFTAKT.sitz[0], AUFTAKT.sitz[1]))) - atem;
  const bettVorn = () => {
    const l = lerp(.25, .3, eio(seg(t, AUFTAKT.sitz[0], AUFTAKT.sitz[1]))), r = BETT.r - .04, u = BODEN - .02;
    ctx.save(); ctx.beginPath(); ctx.moveTo(X(l), Y(deckeOben + .02)); ctx.quadraticCurveTo(X((l + r) / 2), Y(deckeOben - .015), X(r), Y(deckeOben + .01)); ctx.lineTo(X(r), Y(u)); ctx.lineTo(X(l), Y(u)); ctx.closePath(); ctx.clip();
    const farben = ['hellblau', 'tuerkis', 'koenigsblau', 'gruen'], n = 7, bh = (u - deckeOben + .03) / n;
    for (let i = 0; i < n; i++) { ctx.fillStyle = C[farben[i % farben.length]]; ctx.fillRect(X(l), Y(deckeOben - .03 + i * bh), (r - l) * S, bh * S + 1); }
    ctx.restore();
    ctx.strokeStyle = C.linie; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(X(l), Y(deckeOben + .02)); ctx.quadraticCurveTo(X((l + r) / 2), Y(deckeOben - .015), X(r), Y(deckeOben + .01)); ctx.stroke();
    // Bettrahmen vorn
    ctx.fillStyle = FARBE.bett; ctx.fillRect(X(BETT.l + .14), Y(.76), (BETT.r - BETT.l - .14) * S, .05 * S);
    ctx.fillStyle = FARBE.bettDunkel; ctx.fillRect(X(BETT.l + .14), Y(.81), .025 * S, .05 * S); ctx.fillRect(X(BETT.r - .04), Y(.81), .025 * S, .05 * S);
  };

  // ---------- Das Körbchen (Welt-x 1.08 bis 1.4)
  const KORB = { x: 1.24, r: .17, vorn: .08 };   // vorn: so weit liegt es vor ihrem Weg
  const korbHinten = () => {
    ctx.save(); ctx.translate(0, KORB.vorn * S);
    ctx.fillStyle = FARBE.korbDunkel; ctx.beginPath(); ctx.ellipse(X(KORB.x), Y(.8), KORB.r * S, .07 * S, 0, 0, 7); ctx.fill();
    ctx.fillStyle = FARBE.korbKissen; ctx.beginPath(); ctx.ellipse(X(KORB.x), Y(.795), (KORB.r - .03) * S, .045 * S, 0, 0, 7); ctx.fill();
    ctx.restore();
  };
  const korbVorn = () => {
    const R = KORB.r;
    ctx.save(); ctx.translate(0, KORB.vorn * S);
    ctx.fillStyle = FARBE.korb; ctx.beginPath(); ctx.moveTo(X(KORB.x - R), Y(.8)); ctx.quadraticCurveTo(X(KORB.x - R + .01), Y(BODEN), X(KORB.x - R + .05), Y(BODEN)); ctx.lineTo(X(KORB.x + R - .05), Y(BODEN)); ctx.quadraticCurveTo(X(KORB.x + R - .01), Y(BODEN), X(KORB.x + R), Y(.8)); ctx.ellipse(X(KORB.x), Y(.8), R * S, .03 * S, 0, 0, Math.PI, true); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = FARBE.korbDunkel; ctx.lineWidth = lw;
    for (let i = 1; i < 7; i++) { const kx = KORB.x - R + 2 * R * i / 7; ctx.beginPath(); ctx.moveTo(X(kx), Y(.81)); ctx.lineTo(X(kx + (kx < KORB.x ? -.004 : .004)), Y(BODEN - .005)); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(X(KORB.x), Y(.8), R * S, .03 * S, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
  };

  // ---------- Die Principessa
  const sP = HOEHE_P * S / F.hoehe;        // Pixel je Figureneinheit
  const lwP = Math.max(1.2, sP * .025);
  const principessa = () => {
    if (t >= AUFTAKT.sprung) return;
    const sitz = eio(seg(t, AUFTAKT.sitz[0], AUFTAKT.sitz[1]));
    const steh = seg(t, AUFTAKT.steh[0], AUFTAKT.steh[1]);
    const augenZu = t < AUFTAKT.wach[0] + .2 || (t > AUFTAKT.wach[0] + .35 && t < AUFTAKT.wach[0] + .45); // kurzes Blinzeln beim Aufwachen
    // Schütteln: Kopf wackelt, klingt ab
    const sch = seg(t, AUFTAKT.schuettel[0], AUFTAKT.schuettel[1]);
    const wackel = sch > 0 && sch < 1 ? Math.sin(t * 34) * .22 * Math.sin(Math.PI * sch) : 0;
    if (steh <= 0) {
      // im Bett: liegend Kopf auf dem Kissen (um 90° gedreht), beim Aufsetzen dreht er hoch und wandert zum Rumpf
      const kopfLiegt = [.265, .635], hebung = (1 - sitz) * .1, kopfSitzt = [.41, .75 + hebung - F.kopfY * HOEHE_P / F.hoehe];
      const kx = lerp(kopfLiegt[0], kopfSitzt[0], sitz), ky = lerp(kopfLiegt[1], kopfSitzt[1], sitz) + atem * .4 * (1 - sitz);
      const rot = lerp(-.3, 0, sitz) + wackel;
      // der Rumpf steigt hinter der Decke hoch: Füsse (gedacht) bei .75 + Hebung
      if (sitz > 0) zeichne(ctx, X(.41), Y(.75 + hebung), sP, lwP, { ohneKopf: true, ohneKrone: true });
      zeichneKopf(ctx, X(kx), Y(ky), sP, lwP, { augenZu, kopf: rot });
    } else {
      // Hüpfer aus dem Bett auf den Boden, dann gehen
      const hop = eio(steh), bogen = Math.sin(Math.PI * steh) * .07;
      const x = steh < 1 ? lerp(.41, P_START, hop) : px;
      const fuss = steh < 1 ? lerp(.75, BODEN, hop) - bogen : BODEN;
      const laeuft = t > AUFTAKT.geh && t < AUFTAKT.halt + .3;
      const schritt = laeuft ? Math.sin((px - P_START) * 24) : 0;
      const hopser = laeuft ? Math.abs(Math.sin((px - P_START) * 24)) * .012 * (1 - glatt(t, AUFTAKT.halt - .5, AUFTAKT.halt)) : 0;
      const beine = laeuft ? [schritt * .45, -schritt * .45] : [0, 0];
      const mitKrone = t >= AUFTAKT.krone[1];
      zeichne(ctx, X(x), Y(fuss - hopser), sP, lwP, { beine, ohneKrone: !mitKrone, kopf: wackel + (laeuft ? schritt * .03 : 0) });
    }
  };
  // Die Krone: hängt am Bettpfosten, fliegt dann in einem Bogen auf ihren Kopf
  const krone = () => {
    if (t >= AUFTAKT.krone[1] || t >= AUFTAKT.sprung) return;
    const u = eio(seg(t, AUFTAKT.krone[0], AUFTAKT.krone[1]));
    const zielX = lerp(.41, P_START, eio(seg(t, AUFTAKT.steh[0], AUFTAKT.steh[1])));
    // zeichneKrone zeichnet relativ zu den Füssen: Krone ragt von F.kroneBasis bis +.44 über die Füsse
    const kroneBasisPx = F.kroneBasis * sP;
    const vonX = X(BETT.kopfX + .005), vonY = Y(BETT.kopfOben + .03) + kroneBasisPx + .18 * sP;   // auf der Pfostenkugel
    const zuX = X(zielX), zuY = Y(BODEN);
    const kx = lerp(vonX, zuX, u), ky = lerp(vonY, zuY, u) - Math.sin(Math.PI * u) * .22 * S;
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(lerp(.35, 0, u) + Math.sin(u * Math.PI * 2) * .3 * (1 - u)); ctx.translate(-kx, -ky);
    zeichneKrone(ctx, kx, ky, sP, lwP); ctx.restore();
    if (u > 0 && u < 1) funken(ctx, x => x, y => y, 1, kx, ky - .15 * sP * 2, AUFTAKT.krone[0], .6, 23, 30, .25 * S, .1 * S, t, ['#fff6c0', '#ffe066', '#ffffff']);
  };

  // ---------- Der Hund
  const sH = SKALA_H * S, lwH = Math.max(1.2, sH * .02);
  const hund = (vorn) => {
    if (t >= AUFTAKT.sprung) return;
    const steh = seg(t, AUFTAKT.steh[0] + .2, AUFTAKT.steh[1]);
    if ((steh <= 0) === vorn) return;    // im Körbchen hinter dem Rand, danach davor
    const wach = eio(seg(t, AUFTAKT.wach[0], AUFTAKT.wach[1]));
    const sch = seg(t, AUFTAKT.schuettel[0], AUFTAKT.schuettel[1]);
    const schuettel = sch > 0 && sch < 1 ? Math.sin(t * 40) * Math.sin(Math.PI * sch) : 0;
    const augeZu = t < AUFTAKT.wach[0] + .15;
    if (steh <= 0) {
      // liegt im Körbchen: tiefer, Beine hinter dem Korbrand, Kopf gesenkt; atmet
      const atemH = Math.sin(tau * 1.9 + 1) * .5 * (1 - wach);
      const korbBoden = .85 + KORB.vorn;
      ctx.save(); ctx.translate(X(KORB.x - .02), Y(korbBoden)); ctx.rotate(schuettel * .06); ctx.scale(1 + schuettel * .03, 1 - schuettel * .03 + atemH * .01); ctx.translate(-X(KORB.x - .02), -Y(korbBoden));
      zeichneHund(ctx, X(KORB.x - .02), Y(korbBoden), sH, lwH, { kopf: lerp(.32, 0, wach) + schuettel * .08, augeZu, schwanz: wach * Math.sin(tau * 5) * .6, ohr: schuettel, beine: [.9, 1.1, -.9, -1.1] });
      ctx.restore();
    } else {
      const hop = eio(steh), bogen = Math.sin(Math.PI * steh) * .09;
      const x = steh < 1 ? lerp(KORB.x - .02, HUND_WEG[0][1], hop) : hx;
      const fuss = steh < 1 ? lerp(.85 + KORB.vorn, BODEN, hop) - bogen : BODEN;
      // Gangart aus dem zurückgelegten Weg; Schnuppern an der Blume bei 2.36
      const weg = hx - HUND_WEG[0][1], dx = wegH(t + .05) - wegH(t - .05), tempo = clamp(Math.abs(dx) / .05);
      const ph = weg * 30, amp = .5 * tempo;
      const beine = [Math.sin(ph) * amp, Math.sin(ph + Math.PI) * amp, Math.sin(ph + Math.PI + .6) * amp, Math.sin(ph + .6) * amp];
      const schnupper = glatt(t, 8.7, 9.1) * (1 - glatt(t, 9.4, 9.7));
      const wartet = tempo < .1 && t > AUFTAKT.geh;
      const hopser = Math.abs(Math.sin(ph)) * .02 * SKALA_H * tempo;
      zeichneHund(ctx, X(x), Y(fuss - hopser), sH, lwH, { beine: steh < 1 ? [.6, .8, -.6, -.8] : beine, kopf: schnupper * .55 + (steh < 1 ? -.2 : 0), schwanz: wartet || schnupper > 0 ? Math.sin(tau * 9) * .9 : Math.sin(tau * 4) * .4, ohr: Math.sin(ph) * .5 * tempo });
    }
  };

  // ---------- Glitzer beim Schütteln (um beide Figuren) und eine Spur beim Gehen
  const glitzer = () => {
    const [a, b] = AUFTAKT.schuettel;
    if (t > a && t < b + 1.6) {
      funken(ctx, x => X(x), y => Y(y), S, .34, .62, a, b - a, 31, 90, .5, .12, t);
      funken(ctx, x => X(x), y => Y(y), S, KORB.x - .02, .78 + KORB.vorn, a + .1, b - a, 37, 70, .4, .1, t, ['#ffffff', '#a6f5ea', '#ffd27a', '#f0b63a']);
    }
    if (t > AUFTAKT.geh && t < AUFTAKT.sprung) {
      // leise Spur hinter ihr: wenige Körner am Weg, jedes blitzt kurz
      const r = rng(41);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 60; i++) {
        const geburt = AUFTAKT.geh + r() * (AUFTAKT.sprung - AUFTAKT.geh), leben = 1.2 + r() * .8, u = t - geburt; const dy = r() * .22, dx = (r() - .5) * .08;
        if (u < 0 || u > leben) continue;
        const x = wegP(geburt) + dx, y = BODEN - dy - u * .03;
        ctx.globalAlpha = Math.sin(Math.PI * u / leben) * .8; ctx.fillStyle = ['#ffffff', '#fff2b0', '#a6f5ea'][i % 3];
        ctx.beginPath(); ctx.arc(X(x), Y(y), (.002 + (i % 4) * .001) * S, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
    // Vorfreude vor dem Sprung: beide glitzern auf
    if (t > AUFTAKT.halt && t < AUFTAKT.sprung + .6) {
      funken(ctx, x => X(x), y => Y(y), S, px, BODEN - .17, AUFTAKT.halt, AUFTAKT.sprung - AUFTAKT.halt, 51, 60, .3, .15, t);
      funken(ctx, x => X(x), y => Y(y), S, hx, BODEN - .1, AUFTAKT.halt, AUFTAKT.sprung - AUFTAKT.halt, 53, 50, .35, .12, t, ['#ffffff', '#a6f5ea', '#ffd27a']);
    }
    // der Sprung selbst: ein Aufblitzen, wo sie standen
    if (t >= AUFTAKT.sprung && t < AUFTAKT.sprung + 1.4) {
      funken(ctx, x => X(x), y => Y(y), S, px, BODEN - .17, AUFTAKT.sprung, .15, 61, 80, .7, .3, t);
      funken(ctx, x => X(x), y => Y(y), S, hx, BODEN - .1, AUFTAKT.sprung, .15, 63, 70, .7, .25, t, ['#ffffff', '#a6f5ea', '#ffd27a', '#f0b63a']);
    }
  };

  // ---------- Reihenfolge
  draussen();
  zimmer();
  bettHinten();
  const hundImKorb = t < AUFTAKT.steh[0] + .2;
  if (hundImKorb) { korbHinten(); hund(false); }
  principessa();          // liegend/sitzend hinter der Decke; nach dem Aufstehen davor (die Decke liegt dann tiefer)
  if (t < AUFTAKT.steh[0]) bettVorn();
  if (!hundImKorb) korbHinten();
  korbVorn();             // das Körbchen steht vor ihrem Weg: sie geht dahinter vorbei
  if (t >= AUFTAKT.steh[0]) bettVorn();
  hund(true);
  krone();
  glitzer();
  ctx.restore();
}

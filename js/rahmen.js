// Das Bild im Auftakt: Gemälde, verzierter Goldrahmen und die Lage der Principessa darin.
import { rng } from './figur.js';

export const GEMAELDE = { w: 878, h: 1180 };            // Pixelmasse des Original-Gemäldes
export const RAHMEN = 0.13;                             // Rahmenbreite relativ zur Gemäldebreite
export const SEITENVERHAELTNIS = (1 + 2 * RAHMEN) / (GEMAELDE.h / GEMAELDE.w + 2 * RAHMEN);
const FIGUR = { x: 0.5, y: 0.64, h: 0.40 };              // Füsse und Höhe der Principessa, relativ zum Gemälde

// Lage aller Teile in einem Canvas der Grösse W × H
export function lage(W, H) {
  const f = W * RAHMEN / (1 + 2 * RAHMEN);
  const g = { x: f, y: f, w: W - 2 * f, h: H - 2 * f };
  const fussX = g.x + FIGUR.x * g.w, fussY = g.y + FIGUR.y * g.h;
  const box = (FIGUR.h * g.h) / 0.836;                  // Kantenlänge des quadratischen Abziehbilds (siehe imBild)
  return { f, g, box: { x: fussX - box / 2, y: fussY - 0.94 * box, s: box } };
}

// --------------------------------------------------------------- Rahmen
const GOLD = {
  kante: ['#4a2f08', '#7d5414'],
  wulst: ['#6e4810', '#c9952e', '#fbe7a1', '#d6a63e', '#6a440e'],
  band: ['#a87a26', '#dcb24e', '#e9c766', '#c2922f'],
  kehle: ['#4f340b', '#8f6420', '#e7c36a'],
  lippe: ['#fff0b8', '#b5862c', '#5a3a0c'],
};
const LICHT = [1.0, .62, .45, .82]; // oben, rechts, unten, links

function trapez(ctx, W, H, seite, a, b) {
  ctx.beginPath();
  if (seite === 0) { ctx.moveTo(a, a); ctx.lineTo(W - a, a); ctx.lineTo(W - b, b); ctx.lineTo(b, b); }
  if (seite === 1) { ctx.moveTo(W - a, a); ctx.lineTo(W - a, H - a); ctx.lineTo(W - b, H - b); ctx.lineTo(W - b, b); }
  if (seite === 2) { ctx.moveTo(W - a, H - a); ctx.lineTo(a, H - a); ctx.lineTo(b, H - b); ctx.lineTo(W - b, H - b); }
  if (seite === 3) { ctx.moveTo(a, H - a); ctx.lineTo(a, a); ctx.lineTo(b, b); ctx.lineTo(b, H - b); }
  ctx.closePath();
}
function quer(ctx, W, H, seite, a, b) {
  if (seite === 0) return ctx.createLinearGradient(0, a, 0, b);
  if (seite === 1) return ctx.createLinearGradient(W - a, 0, W - b, 0);
  if (seite === 2) return ctx.createLinearGradient(0, H - a, 0, H - b);
  return ctx.createLinearGradient(a, 0, b, 0);
}
// Punkte entlang der Mittellinie einer Seite in Tiefe d, Abstand ab, ohne die Ecken
function entlang(W, H, f, d, ab, rand) {
  const out = [];
  const strecken = [
    [[f + rand, d], [W - f - rand, d], 0], [[W - d, f + rand], [W - d, H - f - rand], Math.PI / 2],
    [[W - f - rand, H - d], [f + rand, H - d], Math.PI], [[d, H - f - rand], [d, f + rand], -Math.PI / 2],
  ];
  strecken.forEach(([[x0, y0], [x1, y1], w], seite) => {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / ab));
    for (let i = 0; i <= n; i++) out.push({ x: x0 + (x1 - x0) * i / n, y: y0 + (y1 - y0) * i / n, w, seite, t: i / n });
  });
  return out;
}
function juwel(ctx, x, y, rx, ry, farbe, hell) {
  const fass = ctx.createRadialGradient(x - rx * .3, y - ry * .3, 0, x, y, rx * 1.35);
  fass.addColorStop(0, '#fff3c4'); fass.addColorStop(.5, '#d9a840'); fass.addColorStop(1, '#5e3e0e');
  ctx.fillStyle = fass; ctx.beginPath(); ctx.ellipse(x, y, rx * 1.3, ry * 1.3, 0, 0, 7); ctx.fill();
  const stein = ctx.createRadialGradient(x - rx * .35, y - ry * .4, rx * .05, x, y, rx);
  stein.addColorStop(0, hell); stein.addColorStop(.55, farbe); stein.addColorStop(1, '#1d1430');
  ctx.fillStyle = stein; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(x - rx * .35, y - ry * .38, rx * .22, ry * .14, -.5, 0, 7); ctx.fill();
}

export function zeichneRahmen(W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), r = rng(17);
  const { f } = lage(W, H);
  // Profil in Bändern, Licht von oben links
  const baender = [['kante', 0, .06], ['wulst', .06, .3], ['band', .3, .72], ['kehle', .72, .93], ['lippe', .93, 1]];
  for (let s = 0; s < 4; s++) {
    for (const [name, t0, t1] of baender) {
      const a = t0 * f, b = t1 * f, gr = quer(x, W, H, s, a, b), st = GOLD[name];
      st.forEach((col, i) => gr.addColorStop(i / (st.length - 1), col));
      trapez(x, W, H, s, a, b - .5); x.fillStyle = gr; x.fill();
    }
    trapez(x, W, H, s, 0, f);
    const l = LICHT[s];
    x.fillStyle = l >= .9 ? `rgba(255,240,200,${(l - .9) * 1.2})` : `rgba(40,22,0,${(.9 - l) * .55})`; x.fill();
  }
  // Gehrungen
  x.strokeStyle = 'rgba(60,38,8,.55)'; x.lineWidth = Math.max(1, f * .012);
  for (const [px, py, qx, qy] of [[0, 0, f, f], [W, 0, W - f, f], [W, H, W - f, H - f], [0, H, f, H - f]]) { x.beginPath(); x.moveTo(px, py); x.lineTo(qx, qy); x.stroke(); }

  // Perlenreihe auf dem Wulst
  for (const p of entlang(W, H, f, f * .18, f * .16, f * .55)) {
    const rr = f * .058, g = x.createRadialGradient(p.x - rr * .4, p.y - rr * .4, 0, p.x, p.y, rr * 1.2);
    g.addColorStop(0, '#fffbe6'); g.addColorStop(.45, '#e6bb55'); g.addColorStop(1, '#6e4810');
    x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, rr, 0, 7); x.fill();
  }
  // Eierstab auf dem flachen Band
  for (const p of entlang(W, H, f, f * .51, f * .3, f * .62)) {
    x.save(); x.translate(p.x, p.y); x.rotate(p.w);
    const ei = x.createRadialGradient(-f * .03, -f * .05, 0, 0, 0, f * .16);
    ei.addColorStop(0, '#fff2bf'); ei.addColorStop(.6, '#d4a43e'); ei.addColorStop(1, '#7a5214');
    x.fillStyle = 'rgba(70,44,8,.6)'; x.beginPath(); x.ellipse(0, f * .01, f * .1, f * .15, 0, 0, 7); x.fill();
    x.fillStyle = ei; x.beginPath(); x.ellipse(0, 0, f * .085, f * .13, 0, 0, 7); x.fill();
    x.fillStyle = '#7a5214'; x.beginPath(); x.moveTo(f * .15, -f * .1); x.lineTo(f * .18, f * .12); x.lineTo(f * .12, f * .12); x.closePath(); x.fill();
    x.restore();
  }
  // Juwelen in den Seitenmitten, in den Farben des Bildes
  const steine = [['#d36aa8', '#ffd1ec'], ['#2fb8c9', '#c8fbff'], ['#d36aa8', '#ffd1ec'], ['#2fb8c9', '#c8fbff']];
  [[W / 2, f * .51], [W - f * .51, H / 2], [W / 2, H - f * .51], [f * .51, H / 2]].forEach(([px, py], i) => {
    const quer = i % 2 === 0;
    x.fillStyle = 'rgba(40,24,4,.45)'; x.beginPath(); x.ellipse(px + f * .02, py + f * .03, f * (quer ? .32 : .22), f * (quer ? .22 : .32), 0, 0, 7); x.fill();
    juwel(x, px, py, f * (quer ? .22 : .15), f * (quer ? .15 : .22), steine[i][0], steine[i][1]);
  });
  // Rosetten in den Ecken
  for (const [px, py] of [[f * .5, f * .5], [W - f * .5, f * .5], [W - f * .5, H - f * .5], [f * .5, H - f * .5]]) {
    x.fillStyle = 'rgba(40,24,4,.45)'; x.beginPath(); x.arc(px + f * .03, py + f * .04, f * .44, 0, 7); x.fill();
    for (let k = 0; k < 8; k++) {
      x.save(); x.translate(px, py); x.rotate(k * Math.PI / 4);
      const bl = x.createLinearGradient(0, 0, 0, -f * .42);
      bl.addColorStop(0, '#8a5d18'); bl.addColorStop(.5, '#f3d47c'); bl.addColorStop(1, '#a8761f');
      x.fillStyle = bl; x.beginPath(); x.ellipse(0, -f * .22, f * .12, f * .21, 0, 0, 7); x.fill();
      x.strokeStyle = 'rgba(80,50,8,.5)'; x.lineWidth = f * .012; x.stroke();
      x.restore();
    }
    juwel(x, px, py, f * .14, f * .14, '#3f4fd0', '#c9d2ff');
  }
  // Feiner Glitzer auf dem Gold
  for (let i = 0; i < W * 1.2; i++) {
    const u = r(), seite = Math.floor(r() * 4), d = r() * f;
    let px, py;
    if (seite === 0) { px = u * W; py = d; } else if (seite === 1) { px = W - d; py = u * H; } else if (seite === 2) { px = u * W; py = H - d; } else { px = d; py = u * H; }
    x.fillStyle = r() < .5 ? `rgba(255,252,235,${.3 + r() * .6})` : `rgba(255,220,120,${.3 + r() * .5})`;
    x.beginPath(); x.arc(px, py, (.4 + r() * 1.1) * W / 800, 0, 7); x.fill();
  }
  // Schattenfuge zum Bild hin
  x.strokeStyle = 'rgba(30,18,4,.9)'; x.lineWidth = Math.max(1.5, f * .025); x.strokeRect(f, f, W - 2 * f, H - 2 * f);
  return c;
}

// Stellen im Gemälde, die glitzern dürfen (relativ zum Gemälde, aus dem Bild ausgelesen)
export const GLANZ = {"sonne":[[0.2771,0.4346],[0.5654,0.4933],[0.6359,0.4731],[0.3212,0.4437],[0.2452,0.1408],[0.3852,0.5411],[0.6472,0.3777],[0.6244,0.1087],[0.3987,0.4943],[0.4368,0.0639],[0.5945,0.2995],[0.5613,0.3394],[0.7185,0.2201],[0.4996,0.5054],[0.5775,0.1266],[0.7409,0.2911],[0.5286,0.1957],[0.3314,0.1862],[0.7365,0.3402],[0.4478,0.5348],[0.4026,0.426],[0.641,0.5221],[0.6289,0.3295],[0.1884,0.1859],[0.239,0.4785],[0.5688,0.5419],[0.5171,0.1563],[0.3412,0.3586],[0.2436,0.5223],[0.4468,0.1841],[0.781,0.4173],[0.7807,0.2812],[0.2442,0.303],[0.6047,0.4042],[0.3837,0.2868],[0.6541,0.1245],[0.2463,0.2515],[0.1788,0.2144],[0.2153,0.4014],[0.3789,0.4133],[0.6921,0.2684],[0.3679,0.4848],[0.7063,0.1308],[0.3972,0.5152],[0.4802,0.2361],[0.659,0.183],[0.3572,0.1055],[0.6654,0.2663],[0.4349,0.3321],[0.3333,0.2869],[0.1891,0.4603],[0.3242,0.4725],[0.3622,0.3784],[0.499,0.4226],[0.6127,0.2727],[0.2401,0.4242],[0.5252,0.2135],[0.5461,0.2397],[0.7875,0.2034],[0.4823,0.5286]],"himmel":[[0.0448,0.2958],[0.0795,0.4806],[0.8044,0.5383],[0.9364,0.1084],[0.857,0.4985],[0.0827,0.058],[0.3475,0.0491],[0.0476,0.5446],[0.8327,0.6162],[0.1052,0.079],[0.8464,0.4372]],"stadt":[[0.0467,0.4653],[0.155,0.5955],[0.2467,0.7097],[0.43,0.6079],[0.57,0.6079],[0.6367,0.5186],[0.7283,0.4293],[0.8333,0.3449],[0.9383,0.4417],[0.2517,0.8002],[0.165,0.8437],[0.4367,0.8275],[0.5867,0.7816],[0.85,0.7444],[0.33,0.7382]],"mond":[[0.065,0.05],[0.045,0.08]]};
export const SONNE = { x: .475, y: .325, r: .36 }; // Mitte und Radius relativ zur Gemäldebreite

// Funkelpunkte: im Rahmen verteilt und an den Glanzstellen des Gemäldes
export function funkelpunkte(nRahmen = 24, seed = 5) {
  const r = rng(seed), out = [];
  for (let i = 0; i < nRahmen; i++) out.push({ u: r(), seite: Math.floor(r() * 4), d: .2 + r() * .6, imBild: false, ph: r() * 7, k: 1.2 + r() * 2, gr: .6 + r() * .7 });
  for (const [art, k, gr] of [['sonne', 2.2, .9], ['stadt', 1.4, .75], ['himmel', 1.1, .7], ['mond', 1.6, .8]])
    for (const [gx, gy] of GLANZ[art]) out.push({ gx, gy, imBild: true, art, ph: r() * 7, k: k * (.6 + r() * .8), gr: gr * (.6 + r() * .8) });
  return out;
}

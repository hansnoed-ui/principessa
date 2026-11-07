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
export const GLANZ = {"sonne":[[0.3724,0.4011],[0.1882,0.3073],[0.4186,0.4759],[0.3927,0.1244],[0.6468,0.4136],[0.6909,0.2975],[0.1918,0.2205],[0.2323,0.2763],[0.502,0.4264],[0.5061,0.3279],[0.2943,0.3672],[0.2399,0.1994],[0.3895,0.2127],[0.3707,0.474],[0.1646,0.2759],[0.51,0.5437],[0.1926,0.4705],[0.6056,0.3957],[0.2099,0.462],[0.5228,0.1391],[0.2187,0.2829],[0.4872,0.2491],[0.745,0.4216],[0.3397,0.5032],[0.1906,0.3346],[0.6039,0.5048],[0.5707,0.3091],[0.3375,0.1444],[0.4828,0.4676],[0.3339,0.4169],[0.1842,0.3599],[0.4094,0.3385],[0.213,0.4313],[0.5353,0.4258],[0.175,0.4121],[0.4993,0.3123],[0.7003,0.4133],[0.6442,0.3667],[0.3786,0.3337],[0.2691,0.4224],[0.3833,0.5299],[0.2991,0.3443],[0.4628,0.2789],[0.2201,0.4117],[0.6399,0.2752],[0.3499,0.3806],[0.7061,0.3285],[0.216,0.2861],[0.1692,0.4431],[0.2994,0.526],[0.4475,0.5658],[0.3482,0.5159],[0.3328,0.1914],[0.3695,0.445],[0.5882,0.5536],[0.4515,0.5661],[0.2961,0.1687],[0.3063,0.2849],[0.3111,0.2739],[0.3019,0.4734]],"himmel":[[0.1689,0.021],[0.2961,0.0525],[0.7692,0.1664],[0.9486,0.445],[0.1143,0.0466],[0.8695,0.3569]],"stadt":[[0.0433,0.6303],[0.165,0.5757],[0.4283,0.5993],[0.5467,0.6551],[0.6283,0.5583],[0.7233,0.4677],[0.825,0.3896],[0.935,0.4777],[0.25,0.8065],[0.1633,0.8524],[0.4367,0.8375],[0.585,0.8015],[0.85,0.7767],[0.3267,0.7543]],"mond":[[0.07,0.05],[0.05,0.085]]};
export const SONNE = { x: .4567, y: .3325, r: .335 }; // Mitte und Radius relativ zur Gemäldebreite

// Funkelpunkte: im Rahmen verteilt und an den Glanzstellen des Gemäldes
export function funkelpunkte(nRahmen = 24, seed = 5) {
  const r = rng(seed), out = [];
  for (let i = 0; i < nRahmen; i++) out.push({ u: r(), seite: Math.floor(r() * 4), d: .2 + r() * .6, imBild: false, ph: r() * 7, k: 1.2 + r() * 2, gr: .6 + r() * .7 });
  for (const [art, k, gr] of [['sonne', 2.2, .9], ['stadt', 1.4, .75], ['himmel', 1.1, .7], ['mond', 1.6, .8]])
    for (const [gx, gy] of GLANZ[art]) out.push({ gx, gy, imBild: true, art, ph: r() * 7, k: k * (.6 + r() * .8), gr: gr * (.6 + r() * .8) });
  return out;
}

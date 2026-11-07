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
export const GLANZ = {"sonne":[[0.2768,0.5161],[0.6321,0.3237],[0.4818,0.5441],[0.3622,0.1636],[0.7825,0.3593],[0.5831,0.2797],[0.3087,0.4381],[0.2289,0.2051],[0.5558,0.4729],[0.3599,0.3373],[0.279,0.4898],[0.1765,0.3119],[0.4954,0.2983],[0.4339,0.5534],[0.1754,0.278],[0.3212,0.5059],[0.6538,0.2059],[0.5011,0.3602],[0.2005,0.3966],[0.6378,0.5153],[0.2403,0.3822],[0.3918,0.1881],[0.6697,0.3186],[0.2232,0.3178],[0.7255,0.3195],[0.3508,0.528],[0.336,0.2712],[0.5467,0.2254],[0.7415,0.372],[0.5604,0.3508],[0.2426,0.2432],[0.4977,0.5059],[0.4624,0.3856],[0.4339,0.311],[0.3166,0.2229],[0.1583,0.3924],[0.4875,0.4237],[0.1629,0.2119],[0.2335,0.2754],[0.3998,0.2246],[0.5467,0.5305],[0.7107,0.4805],[0.7665,0.2814],[0.5957,0.4102],[0.3884,0.1424],[0.4191,0.3347],[0.3417,0.4449],[0.1629,0.2466],[0.4487,0.2703],[0.6333,0.5407],[0.3519,0.2983],[0.5319,0.4898],[0.6765,0.2864],[0.6128,0.2568],[0.3838,0.4398],[0.6754,0.1763],[0.369,0.4763],[0.2483,0.4992],[0.6845,0.2297],[0.6298,0.1619],[0.3667,0.3653],[0.6264,0.2314],[0.4453,0.1678],[0.7084,0.3737],[0.2688,0.278],[0.4886,0.2661],[0.4749,0.1585],[0.3804,0.2822],[0.5888,0.3127],[0.5444,0.1788]],"stadt":[[0.1663,0.5661],[0.246,0.5992],[0.3838,0.5856],[0.213,0.672],[0.0364,0.6907],[0.033,0.7534],[0.0774,0.7729],[0.262,0.6907],[0.1651,0.9297],[0.09,0.8619],[0.0103,0.8085],[0.2221,0.7559],[0.4886,0.9881],[0.7551,0.6661],[0.131,0.7856],[0.5364,0.8585],[0.6868,0.7915],[0.1412,0.7102],[0.2916,0.5593],[0.5262,0.9059],[0.0809,0.7153],[0.5797,0.7898],[0.123,0.6475],[0.2654,0.9034],[0.7665,0.6093],[0.0103,0.5915],[0.6708,0.7],[0.09,0.8153],[0.1298,0.6034],[0.2187,0.8669],[0.6708,0.7398],[0.7289,0.8203],[0.1583,0.8653],[0.2175,0.7102],[0.6219,0.7619],[0.1173,0.9093],[0.8428,0.9686],[0.0251,0.889],[0.1355,0.9805],[0.6116,0.8729]],"himmel":[[0.3929,0.0254],[0.0182,0.2534],[0.0979,0.0559],[0.5672,0.0331],[0.738,0.5915],[0.0433,0.0712],[0.2825,0.0331],[0.1082,0.2212],[0.1378,0.5441],[0.0319,0.539],[0.0911,0.5678],[0.1401,0.0822],[0.1196,0.1449],[0.9134,0.4661],[0.7631,0.022],[0.0342,0.0271],[0.033,0.3864],[0.1811,0.1271],[0.1185,0.3763],[0.0752,0.3229],[0.6686,0.1322],[0.9601,0.3347]],"mond":[[0.085,0.05],[0.06,0.085],[0.1,0.115],[0.14,0.13]]};
export const SONNE = { x: .456, y: .332, r: .335 }; // Mitte und Radius relativ zur Gemäldebreite

// Funkelpunkte: im Rahmen verteilt und an den Glanzstellen des Gemäldes
export function funkelpunkte(nRahmen = 24, seed = 5) {
  const r = rng(seed), out = [];
  for (let i = 0; i < nRahmen; i++) out.push({ u: r(), seite: Math.floor(r() * 4), d: .2 + r() * .6, imBild: false, ph: r() * 7, k: 1.2 + r() * 2, gr: .6 + r() * .7 });
  for (const [art, k, gr] of [['sonne', 2.2, .9], ['stadt', 1.4, .75], ['himmel', 1.1, .7], ['mond', 1.6, .8]])
    for (const [gx, gy] of GLANZ[art]) out.push({ gx, gy, imBild: true, art, ph: r() * 7, k: k * (.6 + r() * .8), gr: gr * (.6 + r() * .8) });
  return out;
}

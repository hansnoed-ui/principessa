import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { C, F, F2, F3, BEIN_EXTRA, rng, zeichneSticker, silhouette, imBild, baueFigur, baueFigur2, baueFigur3 } from './figur.js';
import { GLANZ, SONNE } from './rahmen.js';
import './zauber.js';
import './bestellen.js';
import { hintergrund } from './hintergrund.js';

// ------------------------------------------------------------------ Hilfen
const reduziert = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const glatt = (a, b, x) => { const t = seg(x, a, b); return t * t * (3 - 2 * t); };
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eout = t => 1 - Math.pow(1 - t, 3);
const eback = (t, s = 1.9) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const daempfe = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const zufall = rng(2026);
// immer oben beginnen, damit man den Sprung sieht
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);
const VERSION = new URL(import.meta.url).searchParams.get('v');

// ------------------------------------------------------------------ DOM
const $ = s => document.querySelector(s);
const staub = $('#staub'), sc = staub.getContext('2d');
const flach = $('#flach'), fc = flach.getContext('2d');
const flach2 = $('#flach2'), fc2 = flach2.getContext('2d');
const flach3 = $('#flach3'), fc3 = flach3.getContext('2d');
const bildEl = $('.tablet'), boden = $('#boden');

// Glitzerfüllung für den Titel
{
  const c = document.createElement('canvas'); c.width = c.height = 240;
  const x = c.getContext('2d'), r = rng(31);
  for (let i = 0; i < 1100; i++) {
    const rr = .4 + Math.pow(r(), 3) * 2.4, w = r();
    x.fillStyle = w < .4 ? `rgba(255,255,255,${.55 + r() * .45})` : w < .75 ? `rgba(255,232,140,${.6 + r() * .4})` : `rgba(140,88,18,${.5 + r() * .4})`;
    x.beginPath(); x.arc(r() * 240, r() * 240, rr, 0, 7); x.fill();
  }
  document.documentElement.style.setProperty('--glitzer', `url(${c.toDataURL()})`);
}
const S = { augenblick: $('#augenblick'), schweben: $('#schweben'), glitzer: $('#glitzer'), verweilen: $('#verweilen'), ankommen: $('#ankommen') };

const sichtbar = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('da'); }), { threshold: .2 });
document.querySelectorAll('.ebene .inhalt').forEach(el => sichtbar.observe(el));

// ------------------------------------------------------------------ Bühne
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#buehne'), alpha: true, antialias: true });
} catch (e) {
  renderer = null;
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 1, 10000);
if (renderer) {
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = .35;
}
const himmel = new THREE.HemisphereLight('#fff4e6', '#3a2a24', 1.1); scene.add(himmel);
const key = new THREE.DirectionalLight('#ffe2c4', 2.2); key.position.set(-.6, 1, .9); scene.add(key);
const rim = new THREE.DirectionalLight('#9fbcff', 1.4); rim.position.set(.8, .6, -1); scene.add(rim);

// Principessa: figur (Füsse, Grösse, Verbeugung) > schwenk (Mitte) > versatz > dreh > Modell
const modell = baueFigur();
const LOKAL_H = F.hoehe + BEIN_EXTRA, MITTE = LOKAL_H * .5;
const figur = new THREE.Group(), schwenk = new THREE.Group(), versatz = new THREE.Group(), dreh = new THREE.Group();
figur.add(schwenk); schwenk.add(versatz); versatz.add(dreh); dreh.add(modell.gruppe);
modell.gruppe.position.y = BEIN_EXTRA; schwenk.position.y = MITTE; versatz.position.y = -MITTE;
figur.visible = false; scene.add(figur);

// Abziehbilder: biegsame Flächen, vorn das Bild, hinten Papier
function machKarte(tex) {
  const geo = new THREE.PlaneGeometry(1, 1, 1, 60); geo.translate(0, .5, 0);
  const basis = Float32Array.from(geo.attributes.position.array);
  const gruppe = new THREE.Group();
  const vorn = new THREE.MeshBasicMaterial({ map: tex, alphaTest: .5, toneMapped: false, side: THREE.FrontSide, transparent: true });
  const hinten = new THREE.MeshStandardMaterial({ color: '#d9d2c6', alphaMap: tex, alphaTest: .5, roughness: .85, side: THREE.BackSide, transparent: true });
  gruppe.add(new THREE.Mesh(geo, vorn), new THREE.Mesh(geo, hinten));
  gruppe.visible = false; scene.add(gruppe);
  return { gruppe, geo, basis, deckung: a => { vorn.opacity = hinten.opacity = a; } };
}
function rollen(k, p, r = .09) {
  const a = k.geo.attributes.position, L = 1 - p, AMAX = Math.PI * .8;
  for (let i = 0; i < a.count; i++) {
    const x = k.basis[i * 3], y0 = k.basis[i * 3 + 1];
    let y = y0, z = 0;
    if (y0 > L) {
      const d = y0 - L, w = d / r;
      if (w <= AMAX) { y = L + r * Math.sin(w); z = r * (1 - Math.cos(w)); }
      else { const e = d - AMAX * r; y = L + r * Math.sin(AMAX) + e * Math.cos(AMAX); z = r * (1 - Math.cos(AMAX)) + e * Math.sin(AMAX); }
    }
    a.setXYZ(i, x, y, z);
  }
  a.needsUpdate = true; k.geo.computeVertexNormals();
}
const KG = 1024, kc = document.createElement('canvas'); kc.width = kc.height = KG;
{ const { cx, by, s } = imBild(KG); zeichneSticker(kc.getContext('2d'), cx, by, s, KG * .009); }
const kTex = new THREE.CanvasTexture(kc); kTex.colorSpace = THREE.SRGBColorSpace; kTex.anisotropy = 8;
const K1 = machKarte(kTex), karte = K1.gruppe;
const k2Tex = new THREE.TextureLoader().load('assets/principessa2-figur.png' + (VERSION ? '?v=' + VERSION : ''));
k2Tex.colorSpace = THREE.SRGBColorSpace; k2Tex.anisotropy = 8;
const K2 = machKarte(k2Tex);

// Die zweite Principessa, gleich aufgehängt wie die erste
const modell2 = baueFigur2();
const LOKAL_H2 = F2.hoehe, MITTE2 = LOKAL_H2 * .5;
const figur2 = new THREE.Group(), schwenk2 = new THREE.Group(), versatz2 = new THREE.Group(), dreh2 = new THREE.Group();
figur2.add(schwenk2); schwenk2.add(versatz2); versatz2.add(dreh2); dreh2.add(modell2.gruppe);
schwenk2.position.y = MITTE2; versatz2.position.y = -MITTE2;
figur2.visible = false; scene.add(figur2);

// Die dritte Principessa: setzt sich aus vier Teilen zusammen
const TEILE3 = ['schwanz', 'rumpf', 'kopf', 'krone'];
const bild3 = Object.fromEntries(TEILE3.map(n => [n, (() => { const i = new Image(); i.decoding = 'async'; i.src = `assets/principessa3-${n}.png` + (VERSION ? '?v=' + VERSION : ''); return i; })()]));
const k3c = document.createElement('canvas'); k3c.width = k3c.height = 768;
const k3Tex = new THREE.CanvasTexture(k3c); k3Tex.colorSpace = THREE.SRGBColorSpace; k3Tex.anisotropy = 8;
Promise.all(TEILE3.map(n => bild3[n].decode().catch(() => {}))).then(() => {
  const x = k3c.getContext('2d'); for (const n of TEILE3) if (bild3[n].naturalWidth) x.drawImage(bild3[n], 0, 0, 768, 768); k3Tex.needsUpdate = true;
});
const K3 = machKarte(k3Tex);
const modell3 = baueFigur3();
const LOKAL_H3 = F3.hoehe, MITTE3 = LOKAL_H3 * .5;
const figur3 = new THREE.Group(), schwenk3 = new THREE.Group(), versatz3 = new THREE.Group(), dreh3 = new THREE.Group();
figur3.add(schwenk3); schwenk3.add(versatz3); versatz3.add(dreh3); dreh3.add(modell3.gruppe);
schwenk3.position.y = MITTE3; versatz3.position.y = -MITTE3;
figur3.visible = false; scene.add(figur3);

// Splitter des Bildes
const splitter = [];
{
  const glas = new THREE.MeshBasicMaterial({ color: '#eef6f8', transparent: true, opacity: .6, side: THREE.DoubleSide, toneMapped: false });
  const gold = new THREE.MeshBasicMaterial({ color: '#e6bb4f', side: THREE.DoubleSide, toneMapped: false });
  const rosa = new THREE.MeshBasicMaterial({ color: '#dcaacd', side: THREE.DoubleSide, toneMapped: false });
  for (let i = 0; i < 34; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, -(.4 + zufall()), -(.3 + zufall() * .6), 0, .4 + zufall(), -(.2 + zufall() * .7), 0], 3));
    const w = zufall(), m = new THREE.Mesh(g, w < .5 ? glas : w < .8 ? gold : rosa); m.visible = false; scene.add(m);
    splitter.push({ m, v: new THREE.Vector3(), w: new THREE.Vector3(), leben: 0 });
  }
}
function splittern(x, y, radius) {
  if (reduziert) return;
  const m = welt(x, y);
  for (const sp of splitter) {
    const a = zufall() * Math.PI * 2, r = zufall() * radius, s = radius * (.04 + zufall() * .08);
    sp.m.position.set(m.x + Math.cos(a) * r, m.y + Math.sin(a) * r, 2);
    sp.m.scale.setScalar(s); sp.m.rotation.set(zufall() * 6, zufall() * 6, zufall() * 6);
    sp.v.set(Math.cos(a) * (150 + zufall() * 500), Math.sin(a) * (120 + zufall() * 400) + 350, 150 + zufall() * 500);
    sp.w.set((zufall() - .5) * 16, (zufall() - .5) * 16, (zufall() - .5) * 16);
    sp.leben = 2.2; sp.m.visible = true;
  }
}

// ------------------------------------------------------------------ Masse
let vw = 0, vh = 0, dpr = 1, figH = 200, mobil = false;
const lage = {};
const welt = (x, y, z = 0) => new THREE.Vector3(x - vw / 2, vh / 2 - y, z);
function messen() {
  for (const [k, el] of Object.entries(S)) { const r = el.getBoundingClientRect(); lage[k] = { top: r.top + scrollY, h: r.height }; }
  const b = boden.getBoundingClientRect(); lage.boden = b.top + scrollY;
}
function groesse() {
  const altVw = vw;
  // tatsächlich sichtbare Höhe, auch wenn der Browser die Leiste ein- oder ausblendet
  document.documentElement.style.setProperty('--vh', innerHeight + 'px');
  vw = innerWidth; vh = innerHeight; mobil = vw < 700;
  dpr = Math.min(devicePixelRatio || 1, 2);
  if (renderer) { renderer.setPixelRatio(dpr); renderer.setSize(vw, vh, false); }
  camera.aspect = vw / vh;
  const d = vh / 2 / Math.tan(THREE.MathUtils.degToRad(15));
  camera.position.set(0, 0, d); camera.near = d * .05; camera.far = d * 4; camera.updateProjectionMatrix();
  staub.width = Math.round(vw * dpr); staub.height = Math.round(vh * dpr);
  figH = clamp(Math.min(vh * (mobil ? .17 : .24), vw * .4), 100, 240);
  const r = flach.getBoundingClientRect();
  const kd = Math.min(dpr, 1920 / Math.max(1, r.width));
  flach.width = Math.round(r.width * kd); flach.height = Math.round(r.height * kd);
  const r2 = flach2.getBoundingClientRect();
  flach2.width = Math.round(r2.width * dpr); flach2.height = Math.round(r2.height * dpr);
  const r3 = flach3.getBoundingClientRect();
  flach3.width = Math.round(r3.width * dpr); flach3.height = Math.round(r3.height * dpr);
  messen();
  if (Math.abs(altVw - vw) > 1) { wolkeAnlegen(); sterneAnlegen(); }
}

// ------------------------------------------------------------------ Die Bilder (2D): Gemälde, Principessa, Glas, Rahmen
const lade = src => { const i = new Image(); i.decoding = 'async'; i.src = src + (VERSION ? '?v=' + VERSION : ''); return i; };
const geladen = i => i.complete && i.naturalWidth > 0;
const gemaelde = lade('assets/kopfbild.jpg');
const risse = (() => {
  const r = rng(42), out = [];
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * Math.PI * 2 + r() * .4, len = .22 + r() * .3;
    const pts = [[0, 0]]; let d = 0;
    while (d < len) { d += .025 + r() * .04; const aa = a + (r() - .5) * .5; pts.push([Math.cos(aa) * d, Math.sin(aa) * d]); }
    out.push(pts);
    if (r() < .6) { const k = 1 + Math.floor(r() * (pts.length - 2)); const b = a + (r() < .5 ? 1 : -1) * (.5 + r() * .5); const [bx, by] = pts[k]; out.push([[bx, by], [bx + Math.cos(b) * .06, by + Math.sin(b) * .06], [bx + Math.cos(b + .2) * .11, by + Math.sin(b + .2) * .11]]); }
  }
  return out;
})();
let leinenMuster = null;
function leinen(ctx) {
  if (leinenMuster) return leinenMuster;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), r = rng(9);
  x.fillStyle = '#ece4d6'; x.fillRect(0, 0, 64, 64); x.lineWidth = .7;
  for (let i = 0; i < 220; i++) {
    x.strokeStyle = `rgba(150,130,100,${.08 + r() * .14})`;
    const p = r() * 64; x.beginPath();
    if (r() < .5) { x.moveTo(0, p); x.lineTo(64, p + (r() - .5) * 2); } else { x.moveTo(p, 0); x.lineTo(p + (r() - .5) * 2, 64); }
    x.stroke();
  }
  leinenMuster = ctx.createPattern(c, 'repeat'); return leinenMuster;
}

// Bausteine für beide Bilder
// Glitzer, mit dem sich das Bild wieder schliesst: jeder Punkt blitzt zu seiner Zeit auf
function heilGlitzer(ctx, punkte, heil, groesse) {
  if (heil <= 0 || heil >= 1) return;
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, o] of punkte) {
    const u = (heil - o * .75) / .25; if (u <= 0 || u >= 1) continue;
    const a = Math.sin(Math.PI * u);
    const hg = ctx.createRadialGradient(x, y, 0, x, y, groesse * 3);
    hg.addColorStop(0, `rgba(255,228,150,${a * .55})`); hg.addColorStop(1, 'rgba(255,228,150,0)');
    ctx.fillStyle = hg; ctx.fillRect(x - groesse * 3, y - groesse * 3, groesse * 6, groesse * 6);
    ctx.fillStyle = `rgba(255,250,225,${a})`; stern(ctx, x, y, groesse * (.5 + a * .6));
  }
  ctx.globalCompositeOperation = 'source-over';
}
// --- Das Titelbild: Ausschnitt des Gemäldes über die ganze Breite, 16:9
const AUSSCHNITT = { y0: 0, h: 1 };                // Lage des Ausschnitts im Gemälde (relativ zur Gemäldehöhe)
const FIGUR1 = { x: .5, y: .70, h: .34 };             // Füsse und Höhe der Principessa im Titelbild
function kopfLage(W, H) {
  const s = (FIGUR1.h * H) / 0.836, fx0 = FIGUR1.x * W, fy0 = FIGUR1.y * H;
  return { box: { x: fx0 - s / 2, y: fy0 - 0.94 * s, s } };
}
const glanzImKopf = [];
for (const [art, k, gr] of [['sonne', 2.2, .9], ['stadt', 1.4, .75], ['himmel', 1.1, .7], ['mond', 1.6, .8]])
  for (const [gx, gy] of GLANZ[art]) {
    const v = (gy - AUSSCHNITT.y0) / AUSSCHNITT.h; if (v < .02 || v > .98) continue;
    glanzImKopf.push({ u: gx, v, art, ph: zufall() * 7, k: k * (.6 + zufall() * .8), gr: gr * (.6 + zufall() * .8) });
  }
let heil1 = null, heil1Fuer = '';
function boxImFenster() {
  const r = flach.getBoundingClientRect(), k = r.width / (flach.width || 1), L = kopfLage(flach.width || 1, flach.height || 1);
  return { x: r.left + L.box.x * k, y: r.top + L.box.y * k, s: L.box.s * k, unten: r.bottom };
}
function heilpunkte1(W, H, cx, by, s) {
  if (heil1Fuer === W + 'x' + H) return heil1;
  const r = rng(77), out = [];
  fc.save(); silhouette(fc, cx, by, s);
  for (let i = 0; out.length < 70 && i < 4000; i++) {
    const x = cx + (r() - .5) * 1.4 * s, y = by - r() * 2.3 * s;
    if (fc.isPointInPath(x, y)) out.push([x, y, r()]);
  }
  fc.restore(); heil1 = out; heil1Fuer = W + 'x' + H; return out;
}
// z = { flach, klopf, ringe, leer, heil, glanz }
function bildZeichnen(z) {
  const W = flach.width, H = flach.height; if (!W || !H) return;
  const { box } = kopfLage(W, H);
  const ib = imBild(box.s), cx = box.x + ib.cx, by = box.y + ib.by, s = ib.s, lw = box.s * .009;
  fc.clearRect(0, 0, W, H);
  if (geladen(gemaelde)) fc.drawImage(gemaelde, 0, 0, W, H);
  else { fc.fillStyle = '#d8a9c9'; fc.fillRect(0, 0, W, H); }
  // die Sonne schimmert: ein Lichtfleck wandert langsam über das Gold
  {
    const sx = SONNE.x * W, sy = SONNE.y * H, sr = SONNE.r * W;
    fc.save(); fc.beginPath(); fc.arc(sx, sy, sr, 0, 7); fc.clip();
    fc.globalCompositeOperation = 'lighter';
    const lx = sx + Math.cos(tau * .35) * sr * .55, ly = Math.max(sr * .2, sy + Math.sin(tau * .5) * sr * .45 + sr * .35);
    const lg = fc.createRadialGradient(lx, ly, 0, lx, ly, sr * .7);
    lg.addColorStop(0, 'rgba(255,236,170,.3)'); lg.addColorStop(1, 'rgba(255,236,170,0)');
    fc.fillStyle = lg; fc.fillRect(sx - sr, 0, sr * 2, H);
    fc.restore();
  }
  if (z.flach) {
    const k = z.klopf;
    fc.save(); fc.translate(cx, by); fc.scale(1 + k * .05, 1 - k * .03); fc.translate(-cx, -by);
    zeichneSticker(fc, cx, by, s, lw); fc.restore();
    for (const u of z.ringe) { fc.strokeStyle = `rgba(255,250,235,${(1 - u) * .75})`; fc.lineWidth = lw * 1.2; fc.beginPath(); fc.arc(cx, by - 1.2 * s, box.s * (.12 + u * .4), 0, 7); fc.stroke(); }
  } else if (z.leer > 0) {
    // ihre Kontur bleibt kurz als rohe Leinwand mit Vorzeichnung, dann schliesst sich das Bild
    fc.save(); fc.globalAlpha = z.leer; silhouette(fc, cx, by, s); fc.fillStyle = leinen(fc); fc.fill();
    fc.strokeStyle = 'rgba(110,95,80,.5)'; fc.lineWidth = lw * .6; fc.stroke(); fc.restore();
  }
  heilGlitzer(fc, heilpunkte1(W, H, cx, by, s), z.heil, lw * 2.6);
  if (z.glanz > 0) {
    const gr = fc.createRadialGradient(cx, by - 1.1 * s, 0, cx, by - 1.1 * s, s * 1.4);
    gr.addColorStop(0, `rgba(255,232,170,${.2 * z.glanz})`); gr.addColorStop(1, 'rgba(255,232,170,0)');
    fc.globalCompositeOperation = 'lighter'; fc.fillStyle = gr; fc.fillRect(0, 0, W, H); fc.globalCompositeOperation = 'source-over';
  }
  // Funkeln an Sonne, Kuppeln, Sternen und Mond
  fc.globalCompositeOperation = 'lighter';
  for (const p of glanzImKopf) {
    const a = Math.pow(Math.max(0, Math.sin(tau * p.k + p.ph)), p.art === 'sonne' ? 5 : 8); if (a < .02) continue;
    const x = p.u * W, y = p.v * H, g = p.gr * W / 900;
    const hg = fc.createRadialGradient(x, y, 0, x, y, g * 9); hg.addColorStop(0, `rgba(255,226,140,${a * .45})`); hg.addColorStop(1, 'rgba(255,226,140,0)');
    fc.fillStyle = hg; fc.fillRect(x - g * 9, y - g * 9, g * 18, g * 18);
    fc.fillStyle = `rgba(255,248,215,${a})`; stern(fc, x, y, g * 2.2);
  }
  fc.globalCompositeOperation = 'source-over';
  // Glas des Monitors: ein leiser Schimmer und, nach dem Sprung, Risse, die langsam vergehen
  const sch = fc.createLinearGradient(0, 0, W, H);
  sch.addColorStop(0, 'rgba(255,255,255,.1)'); sch.addColorStop(.32, 'rgba(255,255,255,0)'); sch.addColorStop(.62, 'rgba(255,255,255,0)'); sch.addColorStop(.7, 'rgba(255,255,255,.06)'); sch.addColorStop(.78, 'rgba(255,255,255,0)');
  fc.fillStyle = sch; fc.fillRect(0, 0, W, H);
  if (z.risse > 0 && z.risseAlpha > 0) {
    const ox = cx, oy = by - 1.2 * s, mm = box.s * 1.5;
    fc.lineJoin = 'round'; fc.lineCap = 'round'; fc.globalAlpha = z.risseAlpha;
    for (const [farbe, breite, dx] of [['rgba(30,20,40,.35)', lw * .9, lw * .4], ['rgba(255,255,255,.92)', lw * .65, 0]]) {
      fc.strokeStyle = farbe; fc.lineWidth = breite;
      for (const pts of risse) {
        fc.beginPath(); const n = Math.max(2, Math.ceil(pts.length * z.risse));
        for (let i = 0; i < n; i++) { const X = ox + pts[i][0] * mm + dx, Y = oy + pts[i][1] * mm + dx; i ? fc.lineTo(X, Y) : fc.moveTo(X, Y); }
        fc.stroke();
      }
    }
    fc.globalAlpha = 1;
  }
}

// --- Die zweite Principessa liegt flach auf der Seite, unter dem Text
const B2 = { fuss: .973, hoehe: .926, heil: [[0.5609,0.2371],[0.5807,0.3679],[0.4247,0.0677],[0.4427,0.5807],[0.5401,0.688],[0.3499,0.4608],[0.5464,0.3291],[0.3769,0.5861],[0.459,0.1145],[0.4536,0.4544],[0.688,0.266],[0.2606,0.5058],[0.5446,0.5401],[0.743,0.3607],[0.2308,0.1947],[0.6258,0.1424],[0.6564,0.3896],[0.2597,0.1803],[0.4752,0.5888],[0.6123,0.2237],[0.2976,0.5797],[0.4184,0.3164],[0.3625,0.7069],[0.4121,0.7088],[0.4797,0.3579],[0.486,0.807],[0.4662,0.2516],[0.6078,0.5797],[0.7304,0.5202],[0.4292,0.7313],[0.7484,0.3507],[0.3481,0.1162],[0.3021,0.1722],[0.56,0.5302],[0.4842,0.5573],[0.541,0.1335],[0.5618,0.7457],[0.7619,0.3101],[0.2994,0.2155],[0.4491,0.1577],[0.4139,0.1767],[0.33,0.265],[0.3643,0.8034],[0.3264,0.698],[0.3886,0.56],[0.6943,0.3282],[0.5266,0.1613],[0.6745,0.1975],[0.5167,0.6582],[0.6898,0.247],[0.459,0.2714],[0.3399,0.2614],[0.5365,0.7241],[0.7078,0.2578],[0.5185,0.4896],[0.6069,0.1858],[0.5618,0.1272],[0.3129,0.578],[0.2885,0.6637],[0.7349,0.3651],[0.6871,0.5194],[0.4085,0.1316],[0.624,0.2588],[0.349,0.596],[0.3652,0.7475],[0.5176,0.1956],[0.4391,0.3435],[0.385,0.7024],[0.2922,0.1424],[0.6492,0.3778],[0.4085,0.2642],[0.6141,0.477],[0.3607,0.4796],[0.5879,0.3795],[0.4445,0.3418],[0.605,0.5492],[0.5915,0.5645],[0.6096,0.5158],[0.532,0.7547],[0.5518,0.7592],[0.385,0.3534],[0.6014,0.4698],[0.5086,0.3759],[0.587,0.4599],[0.4175,0.2732],[0.6114,0.614],[0.5167,0.687],[0.6339,0.4021],[0.3057,0.1776],[0.2489,0.5113]] };
const bild2 = { figur: lade('assets/principessa2-figur.png') };
function box2ImFenster() {
  const r = flach2.getBoundingClientRect();
  return { x: r.left, y: r.top, s: r.width, mitte: r.top + r.height / 2, unten: r.bottom, oben: r.top };
}
// z = { flach, klopf, ringe, leer, heil, glanz }
function bild2Zeichnen(z) {
  const W = flach2.width, H = flach2.height; if (!W || !H) return;
  fc2.clearRect(0, 0, W, H);
  const fx0 = W / 2, fy0 = H * B2.fuss;
  if (z.flach && geladen(bild2.figur)) {
    const k = z.klopf;
    fc2.save(); fc2.translate(fx0, fy0); fc2.scale(1 + k * .04, 1 - k * .025); fc2.translate(-fx0, -fy0);
    fc2.shadowColor = 'rgba(20,30,70,.35)'; fc2.shadowBlur = W * .025; fc2.shadowOffsetY = W * .01;
    fc2.drawImage(bild2.figur, 0, 0, W, H); fc2.restore();
    for (const u of z.ringe) { fc2.strokeStyle = `rgba(255,255,255,${(1 - u) * .7})`; fc2.lineWidth = W * .008; fc2.beginPath(); fc2.arc(fx0, H * .45, W * (.12 + u * .35), 0, 7); fc2.stroke(); }
  } else if (z.leer > 0 && geladen(bild2.figur)) {
    // ein Hauch ihrer Kontur bleibt kurz liegen
    fc2.globalAlpha = z.leer * .22; fc2.drawImage(bild2.figur, 0, 0, W, H); fc2.globalAlpha = 1;
  }
  heilGlitzer(fc2, B2.heil.map(([x, y], i) => [x * W, y * H, (i * .618) % 1]), z.heil, W * .012);
  if (z.glanz > 0) {
    const gr = fc2.createRadialGradient(fx0, H * .45, 0, fx0, H * .45, W * .45);
    gr.addColorStop(0, `rgba(255,240,190,${.22 * z.glanz})`); gr.addColorStop(1, 'rgba(255,240,190,0)');
    fc2.globalCompositeOperation = 'lighter'; fc2.fillStyle = gr; fc2.fillRect(0, 0, W, H); fc2.globalCompositeOperation = 'source-over';
  }
}

// --- Die dritte Principessa liegt unter ihrem Text und setzt sich beim Scrollen zusammen
const B3 = {"fuss":0.9806,"hoehe":0.9529,"heil":[[0.3888,0.4532],[0.5378,0.6306],[0.5863,0.0374],[0.7602,0.4047],[0.4802,0.4248],[0.5315,0.3188],[0.4026,0.5198],[0.2924,0.3881],[0.6078,0.1788],[0.6667,0.4463],[0.4033,0.6008],[0.4539,0.7838],[0.5828,0.3687],[0.6736,0.5253],[0.6667,0.3888],[0.2633,0.5246],[0.5877,0.3853],[0.6694,0.5315],[0.3763,0.3347],[0.6383,0.2169],[0.4207,0.7138],[0.648,0.1046],[0.4678,0.3895],[0.6369,0.1947],[0.4719,0.4726],[0.3687,0.3209],[0.6549,0.0908],[0.6597,0.4608],[0.6881,0.3375],[0.4879,0.7519],[0.2876,0.4428],[0.4615,0.6632],[0.6078,0.3714],[0.3216,0.5281],[0.6306,0.4331],[0.6001,0.6514],[0.5676,0.6223],[0.6459,0.3222],[0.4893,0.8385],[0.5967,0.2287],[0.4137,0.3909],[0.3174,0.3451],[0.4747,0.7491],[0.5052,0.6611],[0.5814,0.0367],[0.5156,0.7949],[0.5128,0.7866],[0.4089,0.3985],[0.727,0.4103],[0.4705,0.9418],[0.3153,0.4685],[0.5558,0.4906],[0.7367,0.4276],[0.4886,0.9785],[0.4012,0.5475],[0.553,0.4782],[0.3597,0.3825],[0.7942,0.4082],[0.4401,0.894],[0.4643,0.7678],[0.289,0.4823],[0.2807,0.4879],[0.4269,0.6542],[0.3971,0.6542],[0.6431,0.1677],[0.6272,0.2134],[0.3514,0.5308],[0.3001,0.3361],[0.3805,0.3721],[0.5128,0.3271],[0.2945,0.3486],[0.7242,0.4213],[0.5288,0.5419],[0.3624,0.3943],[0.4719,0.9307],[0.5662,0.5094],[0.3721,0.3361],[0.5551,0.4643],[0.7041,0.51],[0.5599,0.359],[0.562,0.4019],[0.4144,0.4033],[0.4532,0.6597],[0.6618,0.1455],[0.325,0.3541],[0.5856,0.6528],[0.7082,0.4172],[0.3915,0.4421],[0.395,0.7623],[0.578,0.352]],"teile":{"kopf":[[0.7699,0.4498],[0.526,0.3243],[0.4615,0.5031],[0.3763,0.377],[0.4387,0.3971],[0.7263,0.3749],[0.474,0.5121],[0.6396,0.5246],[0.6535,0.3604],[0.5204,0.3216],[0.3701,0.3805],[0.4934,0.5177],[0.7824,0.4179],[0.2994,0.3631],[0.3347,0.5454],[0.5461,0.4643],[0.307,0.413],[0.4733,0.4969],[0.4816,0.3652],[0.2987,0.3423],[0.562,0.395],[0.5974,0.3805],[0.6355,0.4636],[0.4643,0.3181],[0.4297,0.5572],[0.5371,0.4213],[0.2814,0.352],[0.4712,0.4809],[0.2772,0.501],[0.2523,0.4116],[0.596,0.4435],[0.3992,0.4109],[0.3853,0.4304],[0.4255,0.4075]],"krone":[[0.6036,0.2841],[0.6403,0.0589],[0.6625,0.1629],[0.5904,0.2419],[0.6334,0.1372],[0.6085,0.2363],[0.5863,0.0534],[0.6466,0.307],[0.6514,0.1268],[0.6119,0.2093],[0.6292,0.2855],[0.5911,0.1282]],"rumpf":[[0.5558,0.6085],[0.5606,0.6064],[0.3929,0.5981],[0.3915,0.5911],[0.5038,0.6119],[0.5371,0.6085],[0.5024,0.614],[0.5676,0.6292],[0.5003,0.5994],[0.5343,0.5863],[0.4373,0.6001],[0.6098,0.675]],"schwanz":[[0.3978,0.7727],[0.4664,0.6549],[0.4269,0.7852],[0.4151,0.9224],[0.4997,0.7277],[0.5274,0.7145],[0.5087,0.973],[0.4608,0.8572],[0.456,0.7568],[0.4539,0.8184],[0.5066,0.7477],[0.4151,0.8559],[0.5094,0.702],[0.4671,0.7734],[0.4255,0.648],[0.3915,0.9473],[0.4324,0.6493],[0.4539,0.781],[0.5073,0.6681],[0.4213,0.7526],[0.4837,0.8482],[0.4463,0.7498]]}};
// Zeitplan in Sekunden; jedes Teil kommt auf eigener, verspielter Bahn und federt am Ziel ein
const BAU3 = { kopf: [0, 1.7], krone: [1.5, 3.1], rumpf: [2.9, 4.9], schwanz: [2.9, 4.9] };   // Oberkörper und Schwanz kommen am Stück
const BAUZEIT = 4.9, BAU_PAUSE = 1.0;
const TEILMITTE = { kopf: [.5, .45], krone: [.64, .12], rumpf: [.47, .72], schwanz: [.47, .72] };
function bahn(n, u, W, H) {
  const e = eback(u, 1.5), w = 1 - eout(u);
  if (n === 'kopf') return { dx: Math.sin(u * 9) * w * W * .05, dy: -(1 - e) * H * .55, rot: -.7 * w + Math.sin(u * 12) * .12 * w, sk: .55 + .45 * e };
  if (n === 'krone') return { dx: (1 - e) * W * .5, dy: -(1 - e) * H * .35 - Math.sin(Math.PI * u) * H * .1, rot: w * Math.PI * 3, sk: .7 + .3 * e };
  // der ganze Unterkörper schlängelt sich von unten heran
  return { dx: Math.sin(u * 11) * w * W * .07, dy: (1 - e) * H * .55, rot: Math.sin(u * 9) * .22 * w, sk: .9 + .1 * e };
}
function box3ImFenster() {
  const r = flach3.getBoundingClientRect();
  return { x: r.left, y: r.top, s: r.width, mitte: r.top + r.height / 2, unten: r.bottom, oben: r.top };
}
// z = { bau (0..1), flach, klopf, ringe, leer, heil, glanz }
function bild3Zeichnen(z) {
  const W = flach3.width, H = flach3.height; if (!W || !H) return;
  fc3.clearRect(0, 0, W, H);
  const fx0 = W / 2, fy0 = H * B3.fuss;
  if (z.flach) {
    const k = z.klopf;
    fc3.save(); fc3.translate(fx0, fy0); fc3.scale(1 + k * .04, 1 - k * .025); fc3.translate(-fx0, -fy0);
    for (const n of TEILE3) {
      const [a0, a1] = BAU3[n], u = seg(z.uhr, a0, a1); if (u <= 0 || !geladen(bild3[n])) continue;
      const b = bahn(n, u, W, H), [mx, my] = TEILMITTE[n];
      fc3.save(); fc3.globalAlpha = clamp(u / .15);
      fc3.shadowColor = 'rgba(10,20,50,.35)'; fc3.shadowBlur = W * .022; fc3.shadowOffsetY = W * .01;
      fc3.translate(mx * W + b.dx, my * H + b.dy); fc3.rotate(b.rot); fc3.scale(b.sk, b.sk); fc3.translate(-mx * W, -my * H);
      fc3.drawImage(bild3[n], 0, 0, W, H); fc3.restore();
    }
    fc3.restore();
    // Glitzer, wo gerade ein Teil entsteht
    fc3.globalCompositeOperation = 'lighter';
    for (const n of TEILE3) {
      const [a0, a1] = BAU3[n], u = seg(z.uhr, a0, a1); if (u < .7 || u >= 1) continue;
      const a = Math.sin(Math.PI * (u - .7) / .3);
      B3.teile[n].forEach(([x, y], i) => {
        const f = Math.pow(Math.max(0, Math.sin(tau * 6 + i * 2.3)), 2) * a; if (f < .05) return;
        const X = x * W, Y = y * H, g = W * .012;
        const hg = fc3.createRadialGradient(X, Y, 0, X, Y, g * 3); hg.addColorStop(0, `rgba(255,228,150,${f * .55})`); hg.addColorStop(1, 'rgba(255,228,150,0)');
        fc3.fillStyle = hg; fc3.fillRect(X - g * 3, Y - g * 3, g * 6, g * 6);
        fc3.fillStyle = `rgba(255,250,225,${f})`; stern(fc3, X, Y, g * (.5 + f * .6));
      });
    }
    fc3.globalCompositeOperation = 'source-over';
    for (const u of z.ringe) { fc3.strokeStyle = `rgba(255,255,255,${(1 - u) * .7})`; fc3.lineWidth = W * .008; fc3.beginPath(); fc3.arc(fx0, H * .4, W * (.12 + u * .35), 0, 7); fc3.stroke(); }
  } else if (z.leer > 0) {
    fc3.globalAlpha = z.leer * .22; for (const n of TEILE3) if (geladen(bild3[n])) fc3.drawImage(bild3[n], 0, 0, W, H); fc3.globalAlpha = 1;
  }
  heilGlitzer(fc3, B3.heil.map(([x, y], i) => [x * W, y * H, (i * .618) % 1]), z.heil, W * .012);
  if (z.glanz > 0) {
    const gr = fc3.createRadialGradient(fx0, H * .45, 0, fx0, H * .45, W * .45);
    gr.addColorStop(0, `rgba(255,240,190,${.22 * z.glanz})`); gr.addColorStop(1, 'rgba(255,240,190,0)');
    fc3.globalCompositeOperation = 'lighter'; fc3.fillStyle = gr; fc3.fillRect(0, 0, W, H); fc3.globalCompositeOperation = 'source-over';
  }
}

// ------------------------------------------------------------------ Staub, Sterne, Blumen (2D, Seitenkoordinaten)
let teilchen = [];
function wolkeAnlegen() {
  teilchen = teilchen.filter(p => p.art !== 'wolke');
  const L = lage.glitzer; if (!L) return;
  const n = mobil ? 300 : 520;
  for (let i = 0; i < n; i++) {
    teilchen.push({ art: 'wolke', x: zufall() * vw, y: L.top + L.h * (.05 + zufall() * .9), vx: 0, vy: 0, r: .9 + Math.pow(zufall(), 2) * 3.4, f: zufall(), ph: zufall() * 7, leben: Infinity });
  }
}
let sterne = [], sterneAuftakt = [];
function sterneAnlegen() {
  sterne = []; sterneAuftakt = [];
  for (let i = 0; i < (mobil ? 70 : 140); i++) sterneAuftakt.push({ fx: zufall(), fy: zufall() * .8, r: .4 + Math.pow(zufall(), 3) * 1.8, ph: zufall() * 7, k: 1 + zufall() * 2.5 });
  const n = mobil ? 110 : 220;
  for (let i = 0; i < n; i++) sterne.push({ fx: zufall(), fy: .02 + zufall() * .7, r: .5 + Math.pow(zufall(), 3) * 2.4, ph: zufall() * 7, k: 1.5 + zufall() * 3 });
}
const GLITZERFARBEN = ['#ffffff', '#a6f5ea', '#fff2b0', '#ffd27a'];
function streuen(x, y, n, art = 'streu') {
  if (teilchen.length > 1400) return;
  for (let i = 0; i < n; i++) {
    const a = zufall() * Math.PI * 2, v = 20 + zufall() * 60;
    teilchen.push({ art, x: x + (zufall() - .5) * 10, y: y + (zufall() - .5) * 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, r: .8 + zufall() * 2, f: zufall(), ph: zufall() * 7, leben: 2.5 + zufall() * 2 });
  }
}
let zeiger = null;
addEventListener('pointermove', e => {
  const x = e.clientX, y = e.clientY + scrollY;
  if (zeiger && Math.hypot(x - zeiger.x, y - zeiger.y) < 7) return;
  zeiger = { x, y }; streuen(x, y, e.pointerType === 'touch' ? 3 : 2);
}, { passive: true });
addEventListener('touchmove', e => {
  const t = e.touches[0]; if (!t) return;
  const x = t.clientX, y = t.clientY + scrollY;
  if (zeiger && Math.hypot(x - zeiger.x, y - zeiger.y) < 9) return;
  zeiger = { x, y }; streuen(x, y, 3);
}, { passive: true });

let blumen = [], geblueht = false;
function blumenPflanzen(landX) {
  // wenige, feine Blumen: zarte Stiele, kleine Blütenblätter, zurückhaltende Farben
  blumen = []; const n = clamp(5 + Math.floor(gesammelt / 30), 5, 9);
  const farben = ['#f3c6d3', '#fbf3e4', '#e8c56a', '#b9c8f2', '#f0a9b5'];
  for (let i = 0; i < n; i++) {
    const seite = i % 2 ? -1 : 1, d = (.18 + (i >> 1) * .14 + zufall() * .06) * vw * .55;
    const x = clamp(landX + seite * (figH * .9 + d), 14, vw - 14);
    blumen.push({ x, h: 16 + zufall() * (mobil ? 22 : 30), r: 3.2 + zufall() * 2.2, blaetter: 5 + (zufall() < .4 ? 1 : 0), farbe: farben[i % farben.length], neig: (zufall() - .5) * .35, verz: Math.abs(x - landX) / vw * 1.4 + zufall() * .3, ph: zufall() * 7 });
  }
  geblueht = true;
}
function stern(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r * 2.2); ctx.quadraticCurveTo(x, y, x + r * 2.2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2.2); ctx.quadraticCurveTo(x, y, x - r * 2.2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2.2); ctx.fill();
}

// ------------------------------------------------------------------ Flugbahn
function anker() {
  return mobil
    ? [['augenblick', Math.min(vw * .5 - figH * .35, bildEl.getBoundingClientRect().width / 2 + figH * .1), .7], ['schweben', vw * .2, .3], ['glitzer', -vw * .2, .3], ['verweilen', vw * .2, .3], ['ankommen', -vw * .12, .3]]
    : [['augenblick', 0, 0], ['schweben', vw * .22, .44], ['glitzer', -vw * .22, .44], ['verweilen', vw * .22, .42], ['ankommen', -vw * .14, .44]];
}
// Sie weicht Text und der liegenden zweiten Principessa aus: in den freien Raum darüber oder darunter
const freizuhalten = [...document.querySelectorAll('.ebene .inhalt > *')];
function ausweichen(x, y) {
  const halbB = figH * .42, halbH = figH * .58, rand = 14;
  let oben = Infinity, unten = -Infinity;
  for (const el of freizuhalten) {
    const r = el.getBoundingClientRect();
    if (r.height === 0 || r.bottom < 0 || r.top > vh) continue;
    if (r.right < x - halbB - rand || r.left > x + halbB + rand) continue;
    oben = Math.min(oben, r.top); unten = Math.max(unten, r.bottom);
  }
  if (oben === Infinity || y + halbH < oben - rand || y - halbH > unten + rand) return y;
  const mitteOben = oben - rand - halbH, mitteUnten = unten + rand + halbH;
  const passtOben = mitteOben >= halbH + 8, passtUnten = mitteUnten <= vh - halbH - 8;
  if (passtOben && (!passtUnten || (oben + unten) / 2 > vh * .5)) return mitteOben;
  if (passtUnten) return mitteUnten;
  return y;
}
// Die fliegenden Principesse halten sich im freien Platz ihrer Ebene, nie im Text.
// Beim Wechsel der Ebene gleiten sie mit, gewichtet danach, wie viel von jeder Ebene zu sehen ist.
const PLATZ = Object.fromEntries(['schweben', 'glitzer', 'verweilen'].map(k => [k, S[k].querySelector('.platz')]));
function zielFuer(k, idx) {
  const a = anker()[idx];
  if (k === 'augenblick') {
    const r = bildEl.getBoundingClientRect();
    if (vh - r.bottom > figH * 1.15) return { x: vw / 2, y: Math.min((r.bottom + vh) / 2, vh - figH * .72) }; // unter dem Bild
    return { x: (r.right + vw) / 2, y: vh * .5 };                                            // sonst daneben
  }
  if (!PLATZ[k]) return { x: vw / 2 + a[1], y: a[2] * vh };
  const r = PLATZ[k].getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height * (mobil ? .5 : .52) };
}
// Freier Bereich der aktuellen Ebene (links/rechts), damit drei nebeneinander Platz finden
function freierBereich() {
  const namen = anker().map(([k]) => k), c = scrollY + vh * .5;
  let i = 0; while (i < namen.length - 1 && lage[namen[i + 1]].top <= c) i++;
  const k = namen[i];
  if (PLATZ[k]) { const r = PLATZ[k].getBoundingClientRect(); return [r.left, r.right]; }
  if (k === 'augenblick') { const r = bildEl.getBoundingClientRect(); return vh - r.bottom > figH * 1.15 ? [figH * .2, vw - figH * .2] : [r.right + figH * .1, vw - figH * .2]; }
  return [figH * .2, vw - figH * .2];
}
// Drei Positionen nebeneinander um die Mitte x, innerhalb [L, R]
function reihe(x) {
  const [L, R] = freierBereich();
  const ab = Math.min(figH * .95, Math.max(figH * .62, (R - L) / 3));
  let links = x - ab, rechts = x + ab;
  if (links < L + figH * .3) { links = x + ab; rechts = x + 2 * ab; }
  else if (rechts > R - figH * .3) { rechts = x - ab; links = x - 2 * ab; }
  const lo = L + figH * .3, hi = R - figH * .3;
  return { p2: clamp(rechts, lo, hi), p3: clamp(links, lo, hi) };
}
function ziel() {
  const namen = anker().map(([k]) => k), c = scrollY + vh * .5;
  let i = 0; while (i < namen.length - 1 && lage[namen[i + 1]].top <= c) i++;
  const jetzt = zielFuer(namen[i], i);
  let x = jetzt.x, y = jetzt.y, f = 0;
  if (i > 0) {
    f = clamp((scrollY + vh - lage[namen[i]].top) / vh);
    const vor = zielFuer(namen[i - 1], i - 1);
    x = lerp(vor.x, jetzt.x, eio(f)); y = lerp(vor.y, jetzt.y, f);
  }
  return { x, mitteY: y, drehungen: 0, i: Math.max(0, i - 1), f };
}

// ------------------------------------------------------------------ Zustand
// modus: 'drin' = im Bild, klopft ab und zu · 'aus' = draussen · 'zurueck' = kehrt ins Bild zurück
const KARTEN = false; // kein Abziehbild mehr: die Principessa springt direkt aus der Fläche
const T = { loesen: .05, plopp: .1, flugEnde: 1.6, rueckFlug: 2.0, rueckKleben: 3.0, rueckEnde: 4.1 };
let ersterSprung = false, modus = 'drin', tI = 0, tR = 0, klopfUhr = 0, plopped = false, obenZeit = 0, rueck = null, warWeg = false, bremse1 = 0, anstoss = false;

// Wie weit man durch eine Ebene gescrollt ist: 0 = Bildschirmmitte an ihrem Anfang, 1 = an ihrem Ende
const fort = k => (scrollY + vh * .5 - lage[k].top) / lage[k].h;

// Scroll-Bremse: Solange eine Principessa springt, lässt sich nur langsam weiterscrollen
function scrollGrenze() {
  if (reduziert) return Infinity;
  let g = Infinity;
  if (modus === 'drin' || (modus === 'aus' && tI < T.flugEnde + .4)) g = Math.min(g, 0);
  if (P3.modus === 'drin' && P3.uhr != null && P3.uhr < BAUZEIT + BAU_PAUSE) g = Math.min(g, lage.glitzer.top);
  if (P3.modus === 'aus' && P3.t < T.flugEnde + .4) g = Math.min(g, lage.glitzer.top);
  if (P2.modus === 'drin' && P2.sicht > 0) g = Math.min(g, lage.verweilen.top);
  if (P2.modus === 'aus' && P2.t < T.flugEnde + .4) g = Math.min(g, lage.verweilen.top);
  return g;
}
const nachUnten = e => {
  if (modus === 'drin') anstoss = true;
  if (scrollY >= scrollGrenze() - 2 && e.cancelable) e.preventDefault();
};
addEventListener('wheel', e => { if (e.deltaY > 0) nachUnten(e); }, { passive: false });
let touchY = null;
addEventListener('touchstart', e => { touchY = e.touches[0]?.clientY ?? null; }, { passive: true });
addEventListener('touchmove', e => {
  const y = e.touches[0]?.clientY; if (y == null || touchY == null) return;
  if (y < touchY - 2) nachUnten(e);
}, { passive: false });
addEventListener('keydown', e => { if (['ArrowDown', 'PageDown', 'End', ' '].includes(e.key) && !e.target.closest?.('input, textarea, select, button')) nachUnten(e); });
addEventListener('scroll', () => { const g = scrollGrenze(); if (scrollY > g + 40) scrollTo({ top: g, behavior: 'smooth' }); }, { passive: true });
const P3 = { bremse: null, uhr: null, bremseBau: 0, warWeg: false, warZurueck: false, modus: 'drin', t: 0, tR: 0, klopf: 0, plopped: false, obenZeit: 0, rueck: null, x: 0, y: 0, z: 0, vx: 0, gelandet: false, landZeit: -99, sofort: false, bau: 0 };
const P2 = { bremse: null, sicht: 0, modus: 'drin', t: 0, tR: 0, klopf: 0, plopped: false, obenZeit: 0, rueck: null, x: 0, y: 0, z: 0, vx: 0, seite: 1, gelandet: false, landZeit: -99, sofort: false };
// nach dem Herausspringen: Kontur kurz sichtbar, dann schliesst sich das Bild mit Glitzer
const heilStand = t => ({ leer: 0, risseA: 0, heil: 0 });
let fx = 0, fy = 0, fz = 0, vxF = 0, scrollV = 0, letzterScroll = scrollY;
let gelandet = false, landZeit = -99, funkenGesprueht = true, gesammelt = 0, tau = 0, zauberZeit = -99, treffenZeit = -99, warNah = false, treffenAnzahl = 0;
addEventListener('zauber', () => { zauberZeit = performance.now() / 1000; });
const himmelFarben = [new THREE.Color('#fff4e6'), new THREE.Color('#e2efff'), new THREE.Color('#bdf3f6'), new THREE.Color('#8f9cff'), new THREE.Color('#fff1d6')];
const himmelStaerke = [1.1, 1.15, .95, .6, 1.1];

groesse();
addEventListener('resize', groesse);
visualViewport?.addEventListener('resize', groesse);
addEventListener('orientationchange', () => setTimeout(groesse, 300));
document.fonts?.ready.then(() => { messen(); wolkeAnlegen(); });
addEventListener('load', messen);
{
  const z = ziel(); fx = z.x; fy = z.mitteY + figH / 2;
}

let tAlt = performance.now() / 1000;
function bild(nowMs) {
  const now = nowMs / 1000, dt = Math.min(.05, now - tAlt); tAlt = now;
  messen();

  // Verweilen: die Zeit hält an, wenn die dritte Ebene in der Mitte steht
  const vMitte = lage.verweilen.top + lage.verweilen.h / 2;
  const halt = reduziert ? 1 : 1 - glatt(.1, .5, Math.abs(scrollY + vh / 2 - vMitte) / vh);
  const zeit = 1 - .97 * halt, dtz = dt * zeit;
  tau += dtz;

  scrollV = daempfe(scrollV, (scrollY - letzterScroll) / Math.max(dt, 1e-3), 6, dt); letzterScroll = scrollY;
  const z = ziel();

  // ---- Bis die erste Principessa draussen ist, steht die Seite still
  document.documentElement.classList.toggle('gesperrt', !reduziert && (modus === 'drin' || tI < T.flugEnde));
  // ---- Übergänge: bei der ersten Scrollbewegung heraus
  obenZeit = scrollY < 16 ? obenZeit + dt : 0;
  if (scrollY > 120) warWeg = true;
  if (modus === 'drin') {
    klopfUhr += dt;
    if (scrollY > 4 || anstoss || (!ersterSprung && !reduziert && klopfUhr > 1.6)) { ersterSprung = true; modus = 'aus'; tI = reduziert ? T.flugEnde : 0; plopped = reduziert; gelandet = false; warWeg = false; bremse1 = scrollY; }
  } else if (modus === 'aus') {
    tI += dt;
    if (false) {
      modus = 'zurueck'; tR = reduziert ? T.rueckKleben : 0; gelandet = false;
      const h = heilStand(tI);
      rueck = { x: fx, y: fy, z: fz, dreh: dreh.rotation.y, leer: h.leer, risseA: h.risseA };
    }
  } else {
    tR += dt;
    if (tR >= T.rueckEnde) { modus = 'drin'; tI = 0; klopfUhr = -2.5; plopped = false; }
  }

  // ---- Bild im Auftakt
  const bx = boxImFenster();
  if (bx.unten > -40) {
    const zb = { flach: true, klopf: 0, ringe: [], risse: 0, risseAlpha: 1, leer: 0, heil: 0, glanz: 0 };
    if (modus === 'drin') {
      if (!reduziert && klopfUhr > 0) {
        const p = klopfUhr % 7;
        for (const kt of [.45, .9]) {
          const d = p - kt;
          if (d > 0 && d < .25) zb.klopf = Math.max(zb.klopf, Math.sin(d / .25 * Math.PI));
          if (d > 0 && d < .5) zb.ringe.push(d / .5);
        }
      }
    } else if (modus === 'aus') {
      const h = heilStand(tI);
      zb.flach = false; zb.risse = tI >= T.plopp ? eout(seg(tI, T.plopp, T.plopp + .3)) : 0;
      zb.risseAlpha = h.risseA; zb.leer = h.leer; zb.heil = h.heil;
    } else {
      zb.flach = tR >= T.rueckKleben; zb.risse = 1; zb.risseAlpha = rueck.risseA * (1 - seg(tR, .3, 1.5)); zb.leer = rueck.leer * (1 - seg(tR, 0, 1));
      zb.glanz = Math.sin(Math.PI * seg(tR, T.rueckKleben - .15, T.rueckEnde));
    }
    bildZeichnen(zb);
  }
  bildEl.style.transform = (modus === 'aus' && tI >= T.plopp && tI < T.plopp + .35) ? `translate(${(zufall() - .5) * 8}px, ${(zufall() - .5) * 8}px)` : '';

  // ---- Abziehbild: hinaus rollt es sich ab, zurück legt es sich wieder an
  let lift = 0, roll = 0;
  karte.visible = false;
  if (KARTEN && renderer && modus === 'aus' && tI < T.plopp + 0.35) {
    karte.visible = true; lift = eio(seg(tI, T.loesen, T.plopp)); K1.deckung(1 - glatt(T.plopp, T.plopp + 0.35, tI));
    roll = eio(seg(tI, 0, T.loesen)) * .62 * (1 - eout(seg(tI, T.loesen, T.plopp)));
  } else if (KARTEN && renderer && modus === 'zurueck' && tR >= T.rueckFlug && tR < T.rueckKleben) {
    karte.visible = true; K1.deckung(1); const u = seg(tR, T.rueckFlug, T.rueckKleben);
    lift = 1 - eio(u); roll = .22 * Math.sin(Math.PI * u);
  }
  if (karte.visible) {
    rollen(K1, roll);
    karte.position.copy(welt(bx.x + bx.s / 2, bx.y + bx.s - lift * bx.s * .1, lift * bx.s * .45));
    karte.rotation.set(-lift * .25 + Math.sin(lift * Math.PI) * .2 - glatt(T.plopp - .1, T.plopp + 0.35, tI) * .9, 0, Math.sin(lift * Math.PI) * .08);
    karte.scale.setScalar(bx.s);
  }

  // ---- Plopp: Glassplitter, Goldflocken, ein Stück Himmel
  if (modus === 'aus' && tI >= T.plopp && !plopped) { plopped = true; splittern(bx.x + bx.s / 2, bx.y + bx.s * .45, bx.s * .6); }
  for (const sp of splitter) {
    if (sp.leben <= 0) continue;
    sp.leben -= dt; sp.v.y -= 1900 * dt;
    sp.m.position.addScaledVector(sp.v, dt);
    sp.m.rotation.x += sp.w.x * dt; sp.m.rotation.y += sp.w.y * dt; sp.m.rotation.z += sp.w.z * dt;
    if (sp.leben <= 0) sp.m.visible = false;
  }

  // ---- Principessa
  const draussen = (modus === 'aus' && tI >= T.plopp) || (modus === 'zurueck' && tR < T.rueckFlug);
  figur.visible = !!renderer && draussen;
  const bodenTop = lage.boden - scrollY;
  // Sobald der Boden gut sichtbar ist, sinkt sie auf ihn hinab
  const amBoden = bodenTop < vh * .8;
  const zielFuss = amBoden ? bodenTop + 5 : Math.min(z.mitteY + figH / 2, bodenTop + 5);

  let tiefe = 1, skal = 1, sq = 0, verbeug = 0, extraDreh = 0, rueckDreh = null;
  const startSkal = (.37 * bx.s * LOKAL_H) / figH;
  const sx = bx.x + bx.s / 2, sy = bx.y + bx.s * .84, sz = bx.s * .45;
  if (modus === 'aus' && tI < T.flugEnde) {
    // aus dem Bild heraus zum ersten Ankerpunkt
    const u = seg(tI, T.plopp, T.flugEnde), e = eio(u);
    fx = lerp(sx, z.x, e); fy = lerp(sy, zielFuss, e) - Math.sin(Math.PI * u) * vh * .12;
    fz = lerp(sz, 0, e) + Math.sin(Math.PI * u) * figH * .9;
    skal = lerp(startSkal, 1, eio(seg(tI, T.plopp, T.plopp + .9))); tiefe = .06 + .94 * eback(seg(tI, T.plopp, T.plopp + .7), 1.1);
    extraDreh = e * Math.PI * 2;
  } else if (modus === 'zurueck' && rueck) {
    // sanft zurück: in einem leisen Bogen, kleiner werdend, mit dem Gesicht nach vorn
    const u = seg(tR, 0, T.rueckFlug), e = eio(u);
    fx = lerp(rueck.x, sx, e); fy = lerp(rueck.y, sy, e) - Math.sin(Math.PI * u) * vh * .08;
    fz = lerp(rueck.z, sz, e) + Math.sin(Math.PI * u) * figH * .5;
    skal = lerp(1, startSkal, eio(seg(tR, .3, T.rueckFlug)));
    rueckDreh = lerp(rueck.dreh, Math.round(rueck.dreh / (Math.PI * 2)) * Math.PI * 2, e);
  } else {
    fx = daempfe(fx, gelandet ? fx : z.x, 1.4, dt);
    fy = gelandet ? zielFuss : daempfe(fy, zielFuss, amBoden ? 2.2 : 1.8, dt);
    fz = daempfe(fz, 0, 4, dt);
  }
  const fxAlt = figur.userData.fx ?? fx; vxF = daempfe(vxF, (fx - fxAlt) / Math.max(dt, 1e-3), 6, dt); figur.userData.fx = fx;

  // Landen
  if (modus === 'aus' && tI >= T.flugEnde && amBoden && !gelandet && Math.abs(fy - zielFuss) < 6) {
    gelandet = true; landZeit = now; funkenGesprueht = false;
    if (!geblueht) blumenPflanzen(fx);
  }
  if (!amBoden && gelandet) gelandet = false;
  if (gelandet) {
    const d = now - landZeit;
    sq = reduziert ? 0 : .24 * Math.exp(-d * 7) * Math.cos(d * 24);
    verbeug = reduziert ? 0 : .4 * Math.sin(Math.PI * eio(seg(d, .45, 1.35)));
    if (!funkenGesprueht && d > .85) {
      funkenGesprueht = true;
      for (let i = 0; i < 34; i++) {
        teilchen.push({ art: 'funke', x: fx + (zufall() - .5) * figH * .3, y: fy - figH * .95 + scrollY, vx: (zufall() - .5) * 260, vy: -220 - zufall() * 380, r: 1 + zufall() * 2, f: .6 + zufall() * .4, ph: zufall() * 7, leben: 1.3 + zufall() * .6 });
      }
    }
  }

  const schwebt = !gelandet && draussen && modus === 'aus';
  const wipp = schwebt && !reduziert ? Math.sin(tau * 1.1) * figH * .012 : 0;
  figur.position.copy(welt(fx, fy + wipp, fz));
  const basis = figH / LOKAL_H * skal;
  figur.scale.set(basis * (1 + sq * .5), basis * (1 - sq), basis * (1 + sq * .5) * tiefe);
  figur.rotation.x = verbeug;
  schwenk.rotation.z = schwebt ? clamp(-vxF * .0003, -.18, .18) + (reduziert ? 0 : Math.sin(tau * .9) * .03) : daempfe(schwenk.rotation.z, 0, 8, dt);
  schwenk.rotation.x = schwebt ? clamp(scrollV * .00008, -.12, .12) : daempfe(schwenk.rotation.x, 0, 8, dt);
  dreh.rotation.y = rueckDreh ?? (z.drehungen * Math.PI * 2 + extraDreh + (schwebt && !reduziert ? Math.sin(tau * .5) * .08 : 0));

  // Blinzeln
  const bp = (tau % 4.3);
  const blink = Math.max(0, 1 - Math.abs(bp - 4.0) / .07);
  modell.augen.forEach(a => a.scale.y = 1 - .9 * blink);

  // Glitzer an Kleid und Krone
  // Verzauberung: Kleid und Krone glitzern auf, um sie steigt Glitzer
  const zw = now - zauberZeit, zp = zw >= 0 && zw < 2.6 ? Math.sin(Math.PI * zw / 2.6) : 0;
  modell.kleidMat.emissiveIntensity = .5 + Math.min(gesammelt, 160) / 160 * 1.5 + zp * 2.2 * (.75 + .25 * Math.sin(now * 23));
  modell.kroneMat.emissiveIntensity = .8 + .3 * Math.sin(tau * 2.3) + zp * 1.8 * (.7 + .3 * Math.sin(now * 31));
  if (zp > .05 && figur.visible && !reduziert) {
    for (let i = 0; i < 2; i++) {
      const a = zufall() * Math.PI * 2, h = zufall();
      teilchen.push({ art: 'zauber', x: fx + Math.cos(a) * figH * (.12 + .22 * (1 - h)), y: fy - figH * (.08 + h * .9) + scrollY, vx: (zufall() - .5) * 30, vy: -25 - zufall() * 45, r: .8 + zufall() * 2.2, f: zufall(), ph: zufall() * 7, leben: .9 + zufall() * .8 });
    }
  }

  // Licht folgt den Ebenen
  {
    const i = z.i, f = z.f;
    himmel.color.copy(himmelFarben[i]).lerp(himmelFarben[i + 1], f);
    himmel.intensity = lerp(himmelStaerke[i], himmelStaerke[i + 1], f);
  }

  // ---- Zweite Principessa: wartet unter dem Text, springt beim Vorbeiscrollen heraus und begleitet die erste
  const b2 = box2ImFenster(), figH2 = figH * .95;
  if (P2.modus === 'drin') {
    P2.klopf += dt;
    if (b2.unten < 0) { P2.modus = 'aus'; P2.t = 99; P2.plopped = true; P2.sofort = true; P2.gelandet = false; }
    else if ((P2.sicht = fort('verweilen') > .42 ? P2.sicht + dt : 0) > 1.4 || (reduziert && fort('verweilen') > .42)) { P2.modus = 'aus'; P2.t = reduziert ? T.flugEnde : 0; P2.plopped = reduziert; P2.gelandet = false; P2.bremse = scrollY; }
  } else if (P2.modus === 'aus') {
    P2.t += dt;
    P2.obenZeit = fort('verweilen') < .1 ? P2.obenZeit + dt : 0;
    if (false) {
      const h = heilStand(P2.t);
      P2.modus = 'zurueck'; P2.tR = reduziert ? T.rueckKleben : 0; P2.gelandet = false;
      P2.rueck = { x: P2.x, y: P2.y, z: P2.z, dreh: dreh2.rotation.y, leer: h.leer, risseA: h.risseA };
    }
  } else {
    P2.tR += dt;
    if (P2.tR >= T.rueckEnde) { P2.modus = 'drin'; P2.t = 0; P2.klopf = -1; P2.plopped = false; }
  }
  if (b2.unten > -40 && b2.oben < vh + 40) {
    const zb = { flach: true, klopf: 0, ringe: [], leer: 0, heil: 0, glanz: 0 };
    if (P2.modus === 'drin') {
      if (!reduziert && P2.klopf > 0) {
        const p = P2.klopf % 8;
        for (const kt of [2.0, 2.45]) {
          const d = p - kt;
          if (d > 0 && d < .25) zb.klopf = Math.max(zb.klopf, Math.sin(d / .25 * Math.PI));
          if (d > 0 && d < .5) zb.ringe.push(d / .5);
        }
      }
    } else if (P2.modus === 'aus') {
      const h = heilStand(P2.t);
      zb.flach = false; zb.leer = h.leer; zb.heil = h.heil;
    } else {
      zb.flach = P2.tR >= T.rueckKleben; zb.leer = P2.rueck.leer * (1 - seg(P2.tR, 0, 1));
      zb.glanz = Math.sin(Math.PI * seg(P2.tR, T.rueckKleben - .15, T.rueckEnde));
    }
    bild2Zeichnen(zb);
  }
  {
    let l2 = 0, r2 = 0; K2.gruppe.visible = false;
    if (KARTEN && renderer && P2.modus === 'aus' && P2.t < T.plopp + 0.35) {
      K2.gruppe.visible = true; l2 = eio(seg(P2.t, T.loesen, T.plopp)); K2.deckung(1 - glatt(T.plopp, T.plopp + 0.35, P2.t));
      r2 = eio(seg(P2.t, 0, T.loesen)) * .62 * (1 - eout(seg(P2.t, T.loesen, T.plopp)));
    } else if (KARTEN && renderer && P2.modus === 'zurueck' && P2.tR >= T.rueckFlug && P2.tR < T.rueckKleben) {
      K2.gruppe.visible = true; K2.deckung(1); const u = seg(P2.tR, T.rueckFlug, T.rueckKleben); l2 = 1 - eio(u); r2 = .22 * Math.sin(Math.PI * u);
    }
    if (K2.gruppe.visible) {
      rollen(K2, r2);
      K2.gruppe.position.copy(welt(b2.x + b2.s / 2, b2.y + b2.s - l2 * b2.s * .1, l2 * b2.s * .45));
      K2.gruppe.rotation.set(-l2 * .25 + Math.sin(l2 * Math.PI) * .2 - glatt(T.plopp - .1, T.plopp + 0.35, P2.t) * .9, 0, Math.sin(l2 * Math.PI) * .08);
      K2.gruppe.scale.setScalar(b2.s);
    }
  }
  if (P2.modus === 'aus' && P2.t >= T.plopp && !P2.plopped) {
    P2.plopped = true;
    if (!reduziert) for (let i = 0; i < 40; i++) {
      const a = zufall() * Math.PI * 2, v = 80 + zufall() * 260;
      teilchen.push({ art: 'funke', x: b2.x + b2.s / 2 + Math.cos(a) * b2.s * .15, y: b2.y + b2.s * .45 + scrollY + Math.sin(a) * b2.s * .15, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220, r: 1 + zufall() * 2, f: zufall(), ph: zufall() * 7, leben: 1.1 + zufall() * .7 });
    }
  }
  {
    const draussen2 = (P2.modus === 'aus' && P2.t >= T.plopp) || (P2.modus === 'zurueck' && P2.tR < T.rueckFlug);
    figur2.visible = !!renderer && draussen2;
    const begleitet = figur.visible && modus === 'aus' && tI >= T.flugEnde;
    const amBoden2 = bodenTop < vh * .8;
    const zx = begleitet ? reihe(fx).p2 : clamp(b2.x + b2.s * 1.15, figH * .35, vw - figH * .35);
    let zf = begleitet ? fy + figH * .06 : clamp(b2.y + b2.s, figH, vh * .92);
    if (amBoden2) zf = bodenTop + 5;
    let tiefe2 = 1, skal2 = 1, sq2 = 0, verb2 = 0, extra2 = 0, rueckDreh2 = null;
    const start2 = (B2.hoehe * b2.s) / figH2;
    const sx2 = b2.x + b2.s / 2, sy2 = b2.y + b2.s * (B2.fuss - .1), sz2 = b2.s * .45;
    if (P2.sofort) { P2.x = zx; P2.y = zf; P2.z = 0; P2.sofort = false; }
    if (P2.modus === 'aus' && P2.t < T.flugEnde) {
      const u = seg(P2.t, T.plopp, T.flugEnde), e = eio(u);
      P2.x = lerp(sx2, zx, e); P2.y = lerp(sy2, zf, e) - Math.sin(Math.PI * u) * vh * .1;
      P2.z = lerp(sz2, 0, e) + Math.sin(Math.PI * u) * figH * .8;
      skal2 = lerp(start2, 1, eio(seg(P2.t, T.plopp, T.plopp + .9))); tiefe2 = .06 + .94 * eback(seg(P2.t, T.plopp, T.plopp + .7), 1.1); extra2 = -e * Math.PI * 2;
    } else if (P2.modus === 'zurueck' && P2.rueck) {
      const u = seg(P2.tR, 0, T.rueckFlug), e = eio(u);
      P2.x = lerp(P2.rueck.x, sx2, e); P2.y = lerp(P2.rueck.y, sy2, e) - Math.sin(Math.PI * u) * vh * .06;
      P2.z = lerp(P2.rueck.z, sz2, e) + Math.sin(Math.PI * u) * figH * .4;
      skal2 = lerp(1, start2, eio(seg(P2.tR, .3, T.rueckFlug)));
      rueckDreh2 = lerp(P2.rueck.dreh, Math.round(P2.rueck.dreh / (Math.PI * 2)) * Math.PI * 2, e);
    } else {
      P2.x = daempfe(P2.x, zx, 1.3, dt);
      P2.y = P2.gelandet ? zf : daempfe(P2.y, zf, 1.7, dt);
      P2.z = daempfe(P2.z, begleitet && !amBoden2 ? -figH * .25 : 0, 3, dt);
    }
    const x2alt = figur2.userData.x ?? P2.x; P2.vx = daempfe(P2.vx, (P2.x - x2alt) / Math.max(dt, 1e-3), 6, dt); figur2.userData.x = P2.x;
    if (P2.modus === 'aus' && P2.t >= T.flugEnde && amBoden2 && !P2.gelandet && Math.abs(P2.y - zf) < 6) { P2.gelandet = true; P2.landZeit = now; }
    if (!amBoden2 && P2.gelandet) P2.gelandet = false;
    if (P2.gelandet && !reduziert) { const d = now - P2.landZeit; sq2 = .22 * Math.exp(-d * 7) * Math.cos(d * 24); verb2 = .35 * Math.sin(Math.PI * eio(seg(d, .7, 1.6))); }
    const schwebt2 = !P2.gelandet && draussen2 && P2.modus === 'aus';
    const wipp2 = schwebt2 && !reduziert ? Math.sin(tau * 1.5 + 1.3) * figH * .03 : 0;
    figur2.position.copy(welt(P2.x, P2.y + wipp2, P2.z));
    const basis2 = figH2 / LOKAL_H2 * skal2;
    figur2.scale.set(basis2 * (1 + sq2 * .5), basis2 * (1 - sq2), basis2 * (1 + sq2 * .5) * tiefe2);
    figur2.rotation.x = verb2;
    schwenk2.rotation.z = schwebt2 ? clamp(-P2.vx * .0003, -.18, .18) + (reduziert ? 0 : Math.sin(tau * .8 + 2) * .03) : daempfe(schwenk2.rotation.z, 0, 8, dt);
    schwenk2.rotation.x = schwebt2 ? clamp(scrollV * .00008, -.12, .12) : daempfe(schwenk2.rotation.x, 0, 8, dt);
    dreh2.rotation.y = rueckDreh2 ?? (z.drehungen * Math.PI * 2 + extra2 + (schwebt2 && !reduziert ? Math.sin(tau * .45 + 1) * .08 : 0));
    modell2.kroneMat.emissiveIntensity = .9 + .3 * Math.sin(tau * 2.1 + 1) + zp * 1.6 * (.7 + .3 * Math.sin(now * 27));
  }

  // ---- Dritte Principessa: setzt sich beim Scrollen zusammen, springt heraus und fliegt auf der anderen Seite mit
  const b3 = box3ImFenster(), figH3 = figH * .95;
  if (P3.modus === 'drin') {
    P3.klopf += dt;
    const f3 = fort('glitzer');
    if (reduziert) P3.uhr = BAUZEIT + BAU_PAUSE;
    else if (P3.uhr == null) { if (f3 > .42) { P3.uhr = 0; P3.bremseBau = scrollY; } }
    else if (f3 < -.45) { P3.uhr = null; P3.warZurueck = false; }
    else P3.uhr = Math.min(BAUZEIT + BAU_PAUSE, P3.uhr + dt);
    P3.bau = clamp((P3.uhr ?? 0) / BAUZEIT);
    if (b3.unten < 0) { P3.modus = 'aus'; P3.t = 99; P3.plopped = true; P3.sofort = true; P3.gelandet = false; P3.uhr = BAUZEIT + BAU_PAUSE; }
    else if (P3.uhr >= BAUZEIT + BAU_PAUSE && (!P3.warZurueck || f3 > .45)) { P3.modus = 'aus'; P3.t = reduziert ? T.flugEnde : 0; P3.plopped = reduziert; P3.gelandet = false; P3.bremse = scrollY; }
  } else if (P3.modus === 'aus') {
    P3.t += dt;
    if (fort('glitzer') > .45) P3.warWeg = true;
    P3.obenZeit = fort('glitzer') < .1 ? P3.obenZeit + dt : 0;
    if (false) {
      P3.warWeg = false; P3.warZurueck = true;
      const h = heilStand(P3.t);
      P3.modus = 'zurueck'; P3.tR = reduziert ? T.rueckKleben : 0; P3.gelandet = false;
      P3.rueck = { x: P3.x, y: P3.y, z: P3.z, dreh: dreh3.rotation.y, leer: h.leer, risseA: h.risseA };
    }
  } else {
    P3.tR += dt;
    if (P3.tR >= T.rueckEnde) { P3.modus = 'drin'; P3.t = 0; P3.klopf = -1; P3.plopped = false; }
  }
  if (b3.unten > -40 && b3.oben < vh + 40) {
    const zb = { uhr: P3.modus === 'drin' ? (P3.uhr ?? 0) : 99, flach: true, klopf: 0, ringe: [], leer: 0, heil: 0, glanz: 0 };
    if (P3.modus === 'drin') {
      if (!reduziert && P3.klopf > 0 && P3.bau >= 1) {
        const p = P3.klopf % 8;
        for (const kt of [2.0, 2.45]) {
          const d = p - kt;
          if (d > 0 && d < .25) zb.klopf = Math.max(zb.klopf, Math.sin(d / .25 * Math.PI));
          if (d > 0 && d < .5) zb.ringe.push(d / .5);
        }
      }
    } else if (P3.modus === 'aus') {
      const h = heilStand(P3.t);
      zb.flach = false; zb.leer = h.leer; zb.heil = h.heil;
    } else {
      zb.flach = P3.tR >= T.rueckKleben; zb.leer = P3.rueck.leer * (1 - seg(P3.tR, 0, 1));
      zb.glanz = Math.sin(Math.PI * seg(P3.tR, T.rueckKleben - .15, T.rueckEnde));
    }
    bild3Zeichnen(zb);
  }
  {
    let l3 = 0, r3 = 0; K3.gruppe.visible = false;
    if (KARTEN && renderer && P3.modus === 'aus' && P3.t < T.plopp + 0.35) {
      K3.gruppe.visible = true; l3 = eio(seg(P3.t, T.loesen, T.plopp)); K3.deckung(1 - glatt(T.plopp, T.plopp + 0.35, P3.t));
      r3 = eio(seg(P3.t, 0, T.loesen)) * .62 * (1 - eout(seg(P3.t, T.loesen, T.plopp)));
    } else if (KARTEN && renderer && P3.modus === 'zurueck' && P3.tR >= T.rueckFlug && P3.tR < T.rueckKleben) {
      K3.gruppe.visible = true; K3.deckung(1); const u = seg(P3.tR, T.rueckFlug, T.rueckKleben); l3 = 1 - eio(u); r3 = .22 * Math.sin(Math.PI * u);
    }
    if (K3.gruppe.visible) {
      rollen(K3, r3);
      K3.gruppe.position.copy(welt(b3.x + b3.s / 2, b3.y + b3.s - l3 * b3.s * .1, l3 * b3.s * .45));
      K3.gruppe.rotation.set(-l3 * .25 + Math.sin(l3 * Math.PI) * .2 - glatt(T.plopp - .1, T.plopp + 0.35, P3.t) * .9, 0, Math.sin(l3 * Math.PI) * .08);
      K3.gruppe.scale.setScalar(b3.s);
    }
  }
  if (P3.modus === 'aus' && P3.t >= T.plopp && !P3.plopped) {
    P3.plopped = true;
    if (!reduziert) for (let i = 0; i < 40; i++) {
      const a = zufall() * Math.PI * 2, v = 80 + zufall() * 260;
      teilchen.push({ art: 'funke', x: b3.x + b3.s / 2 + Math.cos(a) * b3.s * .15, y: b3.y + b3.s * .45 + scrollY + Math.sin(a) * b3.s * .15, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 220, r: 1 + zufall() * 2, f: zufall(), ph: zufall() * 7, leben: 1.1 + zufall() * .7 });
    }
  }
  {
    const draussen3 = (P3.modus === 'aus' && P3.t >= T.plopp) || (P3.modus === 'zurueck' && P3.tR < T.rueckFlug);
    figur3.visible = !!renderer && draussen3;
    const begleitet = figur.visible && modus === 'aus' && tI >= T.flugEnde;
    const amBoden3 = bodenTop < vh * .8;
    const zx = begleitet ? reihe(fx).p3 : clamp(b3.x + b3.s * 1.15, figH * .35, vw - figH * .35);
    let zf = begleitet ? fy - figH * .04 : clamp(b3.y + b3.s, figH, vh * .92);
    if (amBoden3) zf = bodenTop + 5;
    let tiefe3 = 1, skal3 = 1, sq3 = 0, verb3 = 0, extra3 = 0, rueckDreh3 = null;
    const start3 = (B3.hoehe * b3.s) / figH3;
    const sx3 = b3.x + b3.s / 2, sy3 = b3.y + b3.s * (B3.fuss - .1), sz3 = b3.s * .45;
    if (P3.sofort) { P3.x = zx; P3.y = zf; P3.z = 0; P3.sofort = false; }
    if (P3.modus === 'aus' && P3.t < T.flugEnde) {
      const u = seg(P3.t, T.plopp, T.flugEnde), e = eio(u);
      P3.x = lerp(sx3, zx, e); P3.y = lerp(sy3, zf, e) - Math.sin(Math.PI * u) * vh * .1;
      P3.z = lerp(sz3, 0, e) + Math.sin(Math.PI * u) * figH * .8;
      skal3 = lerp(start3, 1, eio(seg(P3.t, T.plopp, T.plopp + .9))); tiefe3 = .06 + .94 * eback(seg(P3.t, T.plopp, T.plopp + .7), 1.1); extra3 = -e * Math.PI * 2;
    } else if (P3.modus === 'zurueck' && P3.rueck) {
      const u = seg(P3.tR, 0, T.rueckFlug), e = eio(u);
      P3.x = lerp(P3.rueck.x, sx3, e); P3.y = lerp(P3.rueck.y, sy3, e) - Math.sin(Math.PI * u) * vh * .06;
      P3.z = lerp(P3.rueck.z, sz3, e) + Math.sin(Math.PI * u) * figH * .4;
      skal3 = lerp(1, start3, eio(seg(P3.tR, .3, T.rueckFlug)));
      rueckDreh3 = lerp(P3.rueck.dreh, Math.round(P3.rueck.dreh / (Math.PI * 2)) * Math.PI * 2, e);
    } else {
      P3.x = daempfe(P3.x, zx, 1.3, dt);
      P3.y = P3.gelandet ? zf : daempfe(P3.y, zf, 1.7, dt);
      P3.z = daempfe(P3.z, begleitet && !amBoden3 ? -figH * .25 : 0, 3, dt);
    }
    const x2alt = figur3.userData.x ?? P3.x; P3.vx = daempfe(P3.vx, (P3.x - x2alt) / Math.max(dt, 1e-3), 6, dt); figur3.userData.x = P3.x;
    if (P3.modus === 'aus' && P3.t >= T.flugEnde && amBoden3 && !P3.gelandet && Math.abs(P3.y - zf) < 6) { P3.gelandet = true; P3.landZeit = now; }
    if (!amBoden3 && P3.gelandet) P3.gelandet = false;
    if (P3.gelandet && !reduziert) { const d = now - P3.landZeit; sq3 = .22 * Math.exp(-d * 7) * Math.cos(d * 24); verb3 = .35 * Math.sin(Math.PI * eio(seg(d, .7, 1.6))); }
    const schwebt3 = !P3.gelandet && draussen3 && P3.modus === 'aus';
    const wipp3 = schwebt3 && !reduziert ? Math.sin(tau * 1.5 + 1.3) * figH * .03 : 0;
    figur3.position.copy(welt(P3.x, P3.y + wipp3, P3.z));
    const basis3 = figH3 / LOKAL_H3 * skal3;
    figur3.scale.set(basis3 * (1 + sq3 * .5), basis3 * (1 - sq3), basis3 * (1 + sq3 * .5) * tiefe3);
    figur3.rotation.x = verb3;
    schwenk3.rotation.z = schwebt3 ? clamp(-P3.vx * .0003, -.18, .18) + (reduziert ? 0 : Math.sin(tau * .8 + 2) * .03) : daempfe(schwenk3.rotation.z, 0, 8, dt);
    schwenk3.rotation.x = schwebt3 ? clamp(scrollV * .00008, -.12, .12) : daempfe(schwenk3.rotation.x, 0, 8, dt);
    dreh3.rotation.y = rueckDreh3 ?? (-z.drehungen * Math.PI * 2 + extra3 + (schwebt3 && !reduziert ? Math.sin(tau * .45 + 2) * .08 : 0));
    modell3.kroneMat.emissiveIntensity = .9 + .3 * Math.sin(tau * 2.1 + 1) + zp * 1.6 * (.7 + .3 * Math.sin(now * 27));
  }

  // ---- Treffen sich zwei, glitzern ihre Kronen auf
  {
    const frei = (vis, m, t) => vis && m === 'aus' && t >= T.flugEnde;
    const wer = [];
    if (frei(figur.visible, modus, tI)) wer.push({ x: fx, y: fy, mat: modell.kroneMat, kx: fx, ky: fy - figH * .9 });
    if (frei(figur2.visible, P2.modus, P2.t)) wer.push({ x: P2.x, y: P2.y, mat: modell2.kroneMat, kx: P2.x + figH * .14, ky: P2.y - figH * .86 });
    if (frei(figur3.visible, P3.modus, P3.t)) wer.push({ x: P3.x, y: P3.y, mat: modell3.kroneMat, kx: P3.x + figH * .12, ky: P3.y - figH * .9 });
    let nah = false;
    for (let i = 0; i < wer.length; i++) for (let j = i + 1; j < wer.length; j++) if (Math.hypot(wer[i].x - wer[j].x, wer[i].y - wer[j].y) < figH * 1.35) nah = true;
    const anzahl = wer.length;
    if (nah && (!warNah || anzahl > (treffenAnzahl || 0)) && now - treffenZeit > 3) { treffenZeit = now; }
    if (nah) treffenAnzahl = Math.max(treffenAnzahl || 0, anzahl);
    warNah = nah;
    const tp = now - treffenZeit, puls = tp >= 0 && tp < 2.4 ? Math.sin(Math.PI * tp / 2.4) : 0;
    if (puls > 0) {
      const flimmer = .75 + .25 * Math.sin(now * 29);
      for (const w of wer) w.mat.emissiveIntensity += puls * 2.6 * flimmer;
      if (!reduziert && puls > .15) for (const w of wer) for (let i = 0; i < 2; i++) {
        teilchen.push({ art: 'zauber', x: w.kx + (zufall() - .5) * figH * .3, y: w.ky + (zufall() - .5) * figH * .1 + scrollY, vx: (zufall() - .5) * 60, vy: -40 - zufall() * 70, r: 1 + zufall() * 2.4, f: .5 + zufall() * .5, ph: zufall() * 7, leben: .8 + zufall() * .8 });
      }
    }
  }

  // ---- 2D-Schicht
  sc.setTransform(dpr, 0, 0, dpr, 0, 0);
  sc.clearRect(0, 0, vw, vh);
  hintergrund(sc, { lage, sy: scrollY, vw, vh, tau, mobil });

  // Sterne
  const L3 = lage.verweilen;
  if (L3.top - scrollY < vh && L3.top + L3.h - scrollY > 0) {
    sc.fillStyle = '#f7f2ec';
    for (const s of sterne) {
      const x = s.fx * vw, y = L3.top + s.fy * L3.h - scrollY;
      if (y < -10 || y > vh + 10) continue;
      sc.globalAlpha = .3 + .7 * (.5 + .5 * Math.sin(tau * s.k + s.ph));
      if (s.r > 1.6) stern(sc, x, y, s.r * .7); else { sc.beginPath(); sc.arc(x, y, s.r, 0, 7); sc.fill(); }
    }
    sc.globalAlpha = 1;
  }

  // Schatten am Boden
  if (bodenTop < vh + 40 && figur.visible) {
    const a = (1 - clamp((bodenTop - fy) / (figH * 1.6))) * .35;
    if (a > 0) { sc.fillStyle = `rgba(10,30,20,${a})`; sc.beginPath(); sc.ellipse(fx + figH * .03, bodenTop + 4, figH * .3 * (1 - clamp((bodenTop - fy) / (figH * 3)) * .5), figH * .045, 0, 0, 7); sc.fill(); }
  }

  if (bodenTop < vh + 40 && figur3.visible) {
    const a = (1 - clamp((bodenTop - P3.y) / (figH * 1.6))) * .3;
    if (a > 0) { sc.fillStyle = `rgba(10,30,20,${a})`; sc.beginPath(); sc.ellipse(P3.x, bodenTop + 4, figH * .22, figH * .035, 0, 0, 7); sc.fill(); }
  }
  if (bodenTop < vh + 40 && figur2.visible) {
    const a = (1 - clamp((bodenTop - P2.y) / (figH * 1.6))) * .3;
    if (a > 0) { sc.fillStyle = `rgba(10,30,20,${a})`; sc.beginPath(); sc.ellipse(P2.x, bodenTop + 4, figH * .28, figH * .04, 0, 0, 7); sc.fill(); }
  }
  // Blumen
  if (geblueht && bodenTop < vh + 80) {
    const d = reduziert ? 9 : now - landZeit;
    sc.lineCap = 'round';
    for (const b of blumen) {
      const w = eout(seg(d - b.verz, 0, .9)); if (w <= 0) continue;
      const x0 = b.x, y0 = bodenTop + 3, h = b.h * w, wind = Math.sin(tau * 1.1 + b.ph) * 1.5;
      const x1 = x0 + b.neig * h + wind, y1 = y0 - h;
      sc.strokeStyle = 'rgba(40,90,60,.85)'; sc.lineWidth = 1;
      sc.beginPath(); sc.moveTo(x0, y0); sc.quadraticCurveTo(x0 + b.neig * h * .2, y0 - h * .55, x1, y1); sc.stroke();
      // ein kleines Blatt am Stiel
      sc.fillStyle = 'rgba(70,140,90,.8)'; sc.beginPath(); sc.ellipse(x0 + b.neig * h * .25 + 3, y0 - h * .35, 3.2 * w, 1.3 * w, -.6, 0, 7); sc.fill();
      const r = b.r * eback(seg(d - b.verz, .45, 1.1), 1.2);
      if (r > .3) {
        sc.fillStyle = b.farbe;
        for (let k = 0; k < b.blaetter; k++) {
          const a = k / b.blaetter * Math.PI * 2 + b.ph;
          sc.beginPath(); sc.ellipse(x1 + Math.cos(a) * r * .75, y1 + Math.sin(a) * r * .75, r * .62, r * .38, a, 0, 7); sc.fill();
        }
        sc.fillStyle = '#d9a43a'; sc.beginPath(); sc.arc(x1, y1, r * .3, 0, 7); sc.fill();
      }
    }
  }

  // Glitzer
  const kx = fx, ky = fy - figH * .5 + scrollY, ziehR = figH * 1.15, fangR = figH * .3;
  const zieht = figur.visible && !gelandet;
  sc.globalCompositeOperation = 'lighter';
  const rest = [];
  for (const p of teilchen) {
    if (p.art === 'funke' || p.art === 'zauber') { p.vy += (p.art === 'funke' ? 700 : -20) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.leben -= dt; }
    else {
      if (p.art === 'streu') { p.vy += 40 * dtz; p.vx *= Math.exp(-1.2 * dtz); p.vy *= Math.exp(-.6 * dtz); p.leben -= dtz; }
      else { p.vx *= Math.exp(-1.5 * dtz); p.vy *= Math.exp(-1.5 * dtz); }
      if (zieht) {
        const dx = kx - p.x, dy = ky - p.y, d = Math.hypot(dx, dy);
        if (d < fangR) { gesammelt++; continue; }
        if (d < ziehR) { const k = 900 * (1 - d / ziehR) * dtz / d; p.vx += dx * k; p.vy += dy * k; }
      }
      p.x += (p.vx + Math.sin(tau * .7 + p.ph) * 9) * dtz;
      p.y += (p.vy + Math.cos(tau * .5 + p.ph * 1.3) * 7) * dtz;
    }
    if (p.leben <= 0) continue;
    rest.push(p);
    const y = p.y - scrollY;
    if (y < -20 || y > vh + 20) continue;
    const a = clamp(p.leben, 0, 1) * (.45 + .55 * (.5 + .5 * Math.sin(tau * 4 + p.ph)));
    sc.globalAlpha = a;
    sc.fillStyle = p.art === 'funke' ? (p.f > .8 ? '#fff6c8' : '#ffd25a') : GLITZERFARBEN[Math.floor(p.f * GLITZERFARBEN.length)];
    if (p.r > 2.2) stern(sc, p.x, y, p.r * .55); else { sc.beginPath(); sc.arc(p.x, y, p.r, 0, 7); sc.fill(); }
  }
  teilchen = rest;
  sc.globalAlpha = 1; sc.globalCompositeOperation = 'source-over';

  if (renderer) renderer.render(scene, camera);
  requestAnimationFrame(bild);
}
requestAnimationFrame(bild);

// für Tests: window.__principessa.springe(t) setzt die Auftakt-Uhr
window.__principessa = { zustand: () => ({ modus, tI, tR, gesammelt, gelandet, p2: P2.modus, p2t: P2.t, p2tR: P2.tR, p2gelandet: P2.gelandet, fx, fy, figH, p2x: P2.x, p2y: P2.y, sichtbar2: figur2.visible, p3: P3.modus, p3t: P3.t, p3bau: P3.bau, p3uhr: P3.uhr, p3x: P3.x, p3y: P3.y, sichtbar3: figur3.visible, treffenZeit, jetzt: performance.now() / 1000 }) };

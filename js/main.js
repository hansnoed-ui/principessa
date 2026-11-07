import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { C, F, BEIN_EXTRA, rng, zeichne, silhouette, imBild, baueFigur } from './figur.js';

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

// ------------------------------------------------------------------ DOM
const $ = s => document.querySelector(s);
const staub = $('#staub'), sc = staub.getContext('2d');
const flach = $('#flach'), fc = flach.getContext('2d');
const bildEl = $('.bild'), auftakt = $('.auftakt'), hinweis = $('.hinweis'), boden = $('#boden');
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

// Abziehbild: dieselbe Zeichnung wie im Bild, als biegsame Fläche
const KG = 1024, kc = document.createElement('canvas'); kc.width = kc.height = KG;
{ const { cx, by, s } = imBild(KG); zeichne(kc.getContext('2d'), cx, by, s, KG * .009); }
const kTex = new THREE.CanvasTexture(kc); kTex.colorSpace = THREE.SRGBColorSpace; kTex.anisotropy = 8;
const kGeo = new THREE.PlaneGeometry(1, 1, 1, 60); kGeo.translate(0, .5, 0);
const kBasis = Float32Array.from(kGeo.attributes.position.array);
const karte = new THREE.Group();
karte.add(new THREE.Mesh(kGeo, new THREE.MeshBasicMaterial({ map: kTex, alphaTest: .5, toneMapped: false, side: THREE.FrontSide })));
karte.add(new THREE.Mesh(kGeo, new THREE.MeshStandardMaterial({ color: '#d9d2c6', alphaMap: kTex, alphaTest: .5, roughness: .85, side: THREE.BackSide })));
karte.visible = false; scene.add(karte);
function rollen(p, r = .09) {
  const a = kGeo.attributes.position, L = 1 - p, AMAX = Math.PI * .8;
  for (let i = 0; i < a.count; i++) {
    const x = kBasis[i * 3], y0 = kBasis[i * 3 + 1];
    let y = y0, z = 0;
    if (y0 > L) {
      const d = y0 - L, w = d / r;
      if (w <= AMAX) { y = L + r * Math.sin(w); z = r * (1 - Math.cos(w)); }
      else { const e = d - AMAX * r; y = L + r * Math.sin(AMAX) + e * Math.cos(AMAX); z = r * (1 - Math.cos(AMAX)) + e * Math.sin(AMAX); }
    }
    a.setXYZ(i, x, y, z);
  }
  a.needsUpdate = true; kGeo.computeVertexNormals();
}

// Splitter des Bildes
const splitter = [];
{
  const papier = new THREE.MeshBasicMaterial({ color: '#fcfaf6', side: THREE.DoubleSide, toneMapped: false });
  const strich = new THREE.MeshBasicMaterial({ color: C.linie, side: THREE.DoubleSide });
  for (let i = 0; i < 30; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 0, -(.4 + zufall()), -(.3 + zufall() * .6), 0, .4 + zufall(), -(.2 + zufall() * .7), 0], 3));
    const m = new THREE.Mesh(g, zufall() < .82 ? papier : strich); m.visible = false; scene.add(m);
    splitter.push({ m, v: new THREE.Vector3(), w: new THREE.Vector3(), leben: 0 });
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
  vw = innerWidth; vh = innerHeight; mobil = vw < 700;
  dpr = Math.min(devicePixelRatio || 1, 2);
  if (renderer) { renderer.setPixelRatio(dpr); renderer.setSize(vw, vh, false); }
  camera.aspect = vw / vh;
  const d = vh / 2 / Math.tan(THREE.MathUtils.degToRad(15));
  camera.position.set(0, 0, d); camera.near = d * .05; camera.far = d * 4; camera.updateProjectionMatrix();
  staub.width = Math.round(vw * dpr); staub.height = Math.round(vh * dpr);
  figH = clamp(Math.min(vh * (mobil ? .18 : .27), vw * .45), 110, 270);
  const r = flach.getBoundingClientRect();
  flach.width = Math.round(r.width * dpr); flach.height = Math.round(r.height * dpr);
  bildFertig = false;
  messen();
  if (Math.abs(altVw - vw) > 1) { wolkeAnlegen(); sterneAnlegen(); }
}

// ------------------------------------------------------------------ Das Bild (2D)
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
let bildFertig = false, karoMuster = null, karoFuer = 0;
function karo(g) {
  if (karoFuer === g) return karoMuster;
  const q = Math.max(6, Math.round(g / 48)), c = document.createElement('canvas'); c.width = c.height = q * 2;
  const x = c.getContext('2d'); x.fillStyle = '#dedad5'; x.fillRect(0, 0, q * 2, q * 2); x.fillStyle = '#c2bdb7'; x.fillRect(0, 0, q, q); x.fillRect(q, q, q, q);
  karoMuster = fc.createPattern(c, 'repeat'); karoFuer = g; return karoMuster;
}
const T = { klopf: [1.0, 1.5], abrollen: 2.1, loesen: 2.45, plopp: 2.7, flugEnde: 3.6 };
function bildZeichnen(t) {
  const g = flach.width; if (!g) return;
  fc.clearRect(0, 0, g, g);
  const { cx, by, s } = imBild(g), lw = g * .009;
  if (t < T.abrollen) {
    let k = 0;
    for (const kt of T.klopf) { const d = t - kt; if (d > 0 && d < .25) k = Math.max(k, Math.sin(d / .25 * Math.PI)); }
    fc.save(); fc.translate(cx, by); fc.scale(1 + k * .05, 1 - k * .03); fc.translate(-cx, -by);
    zeichne(fc, cx, by, s, lw); fc.restore();
    for (const kt of T.klopf) {
      const d = t - kt;
      if (d > 0 && d < .5) { const u = d / .5; fc.strokeStyle = `rgba(42,34,48,${(1 - u) * .45})`; fc.lineWidth = lw; fc.beginPath(); fc.arc(cx, by - 1.2 * s, g * (.1 + u * .32), 0, 7); fc.stroke(); }
    }
  } else {
    fc.save(); silhouette(fc, cx, by, s); fc.fillStyle = karo(g); fc.fill(); fc.restore();
    if (t >= T.plopp) {
      const w = eout(seg(t, T.plopp, T.plopp + .18));
      fc.strokeStyle = C.linie; fc.lineWidth = lw * .75; fc.lineJoin = 'round';
      const ox = cx, oy = by - 1.2 * s;
      for (const pts of risse) {
        fc.beginPath(); const n = Math.max(2, Math.ceil(pts.length * w));
        for (let i = 0; i < n; i++) { const [x, y] = pts[i]; i ? fc.lineTo(ox + x * g, oy + y * g) : fc.moveTo(ox + x * g, oy + y * g); }
        fc.stroke();
      }
    }
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
let sterne = [];
function sterneAnlegen() {
  sterne = [];
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
  blumen = []; const n = clamp(14 + Math.floor(gesammelt / 4), 14, 54);
  const farben = [C.kugel, C.wange, C.gold, C.punkt, '#fcfaf6', C.hellblau];
  for (let i = 0; i < n; i++) {
    const seite = zufall() < .5 ? -1 : 1, d = Math.pow(zufall(), .75) * vw * .55;
    const x = clamp(landX + seite * (figH * .35 + d), 10, vw - 10);
    blumen.push({ x, h: 18 + zufall() * (mobil ? 34 : 52), r: 4 + zufall() * 6, farbe: farben[Math.floor(zufall() * farben.length)], neig: (zufall() - .5) * .5, verz: Math.abs(x - landX) / vw * 1.1 + zufall() * .25, ph: zufall() * 7 });
  }
  geblueht = true;
}
function stern(ctx, x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r * 2.2); ctx.quadraticCurveTo(x, y, x + r * 2.2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2.2); ctx.quadraticCurveTo(x, y, x - r * 2.2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2.2); ctx.fill();
}

// ------------------------------------------------------------------ Flugbahn
function anker() {
  const bildR = bildEl.getBoundingClientRect();
  const heroX = mobil ? 0 : Math.min(vw * .36, bildR.width / 2 + figH * .5 + 30);
  return mobil
    ? [['augenblick', 0, .84], ['schweben', vw * .2, .3], ['glitzer', -vw * .2, .3], ['verweilen', vw * .18, .3], ['ankommen', -vw * .12, .3]]
    : [['augenblick', heroX, .58], ['schweben', vw * .22, .44], ['glitzer', -vw * .22, .44], ['verweilen', vw * .2, .42], ['ankommen', -vw * .14, .44]];
}
function ziel() {
  const a = anker().map(([k, x, y]) => ({ py: lage[k].top + lage[k].h / 2, x, y }));
  a[0].py = lage.augenblick.top + vh / 2; // Auftakt: Bildschirmmitte
  const c = scrollY + vh / 2;
  let i = 0; while (i < a.length - 2 && c > a[i + 1].py) i++;
  const f = eio(seg(c, a[i].py, a[i + 1].py));
  return { x: vw / 2 + lerp(a[i].x, a[i + 1].x, f), mitteY: lerp(a[i].y, a[i + 1].y, f) * vh, drehungen: i + f, i, f };
}

// ------------------------------------------------------------------ Zustand
let tI = reduziert ? 99 : 0, plopped = false;
let fx = 0, fy = 0, fz = 0, vxF = 0, scrollV = 0, letzterScroll = scrollY;
let gelandet = false, landZeit = -99, funkenGesprueht = true, gesammelt = 0, tau = 0;
const himmelFarben = [new THREE.Color('#fff4e6'), new THREE.Color('#e2efff'), new THREE.Color('#c4f6ee'), new THREE.Color('#8f9cff'), new THREE.Color('#dcffe0')];
const himmelStaerke = [1.1, 1.15, 1.0, .55, 1.05];

groesse();
addEventListener('resize', groesse);
document.fonts?.ready.then(() => { messen(); wolkeAnlegen(); });
addEventListener('load', messen);
{
  const z = ziel(); fx = z.x; fy = z.mitteY + figH / 2;
}

let tAlt = performance.now() / 1000;
function bild(nowMs) {
  const now = nowMs / 1000, dt = Math.min(.05, now - tAlt); tAlt = now;
  messen();

  // Auftakt-Uhr
  if (tI < 99) {
    if (scrollY > 30 && tI < T.abrollen) tI = T.abrollen;
    tI += dt;
    if (tI > 30) tI = 99;
  }

  // Verweilen: die Zeit hält an, wenn die dritte Ebene in der Mitte steht
  const vMitte = lage.verweilen.top + lage.verweilen.h / 2;
  const halt = reduziert ? 1 : 1 - glatt(.1, .5, Math.abs(scrollY + vh / 2 - vMitte) / vh);
  const zeit = 1 - .97 * halt, dtz = dt * zeit;
  tau += dtz;

  scrollV = daempfe(scrollV, (scrollY - letzterScroll) / Math.max(dt, 1e-3), 6, dt); letzterScroll = scrollY;
  const z = ziel();

  // ---- Bild im Auftakt
  if (!bildFertig) {
    bildZeichnen(tI);
    if (tI > T.plopp + .4) bildFertig = true;
  }
  if (tI >= T.plopp + .4 && !auftakt.classList.contains('da')) auftakt.classList.add('da');
  if (tI >= T.flugEnde + .8 && !hinweis.classList.contains('da')) hinweis.classList.add('da');
  if (scrollY > vh * .4) hinweis.classList.remove('da');
  bildEl.style.transform = (tI >= T.plopp && tI < T.plopp + .35) ? `translate(${(zufall() - .5) * 8}px, ${(zufall() - .5) * 8}px)` : '';

  const br = flach.getBoundingClientRect(), bw = br.width;

  // ---- Abziehbild
  karte.visible = !!renderer && tI >= T.abrollen && tI < T.plopp;
  if (karte.visible) {
    const lift = eio(seg(tI, T.loesen, T.plopp));
    rollen(eio(seg(tI, T.abrollen, T.loesen)) * .62 * (1 - eout(seg(tI, T.loesen, T.plopp))));
    karte.position.copy(welt(br.left + bw / 2, br.bottom - lift * bw * .1, lift * bw * .45));
    karte.rotation.set(-lift * .25 + Math.sin(lift * Math.PI) * .2, 0, Math.sin(lift * Math.PI) * .08);
    karte.scale.setScalar(bw);
  }

  // ---- Plopp: Splitter
  if (tI >= T.plopp && !plopped) {
    plopped = true;
    if (!reduziert) {
      const m = welt(br.left + bw / 2, br.top + bw * .45);
      for (const sp of splitter) {
        const a = zufall() * Math.PI * 2, r = zufall() * bw * .35, s = bw * (.02 + zufall() * .05);
        sp.m.position.set(m.x + Math.cos(a) * r, m.y + Math.sin(a) * r, 2);
        sp.m.scale.setScalar(s); sp.m.rotation.set(zufall() * 6, zufall() * 6, zufall() * 6);
        sp.v.set(Math.cos(a) * (150 + zufall() * 500), Math.sin(a) * (120 + zufall() * 400) + 350, 150 + zufall() * 500);
        sp.w.set((zufall() - .5) * 16, (zufall() - .5) * 16, (zufall() - .5) * 16);
        sp.leben = 2.2; sp.m.visible = true;
      }
    }
  }
  for (const sp of splitter) {
    if (sp.leben <= 0) continue;
    sp.leben -= dt; sp.v.y -= 1900 * dt;
    sp.m.position.addScaledVector(sp.v, dt);
    sp.m.rotation.x += sp.w.x * dt; sp.m.rotation.y += sp.w.y * dt; sp.m.rotation.z += sp.w.z * dt;
    if (sp.leben <= 0) sp.m.visible = false;
  }

  // ---- Principessa
  figur.visible = !!renderer && tI >= T.plopp;
  const bodenTop = lage.boden - scrollY;
  // Sobald der Boden gut sichtbar ist, sinkt sie auf ihn hinab
  const amBoden = bodenTop < vh * .8;
  const zielFuss = amBoden ? bodenTop + 5 : Math.min(z.mitteY + figH / 2, bodenTop + 5);

  let skal = 1, sq = 0, verbeug = 0, extraDreh = 0;
  if (tI < T.flugEnde) {
    // Auftakt: aus dem Bild heraus zum ersten Ankerpunkt
    const u = seg(tI, T.plopp, T.flugEnde), e = eio(u);
    const sx = br.left + bw / 2, sy = br.bottom - bw * .1;
    fx = lerp(sx, z.x, e); fy = lerp(sy, zielFuss, e) - Math.sin(Math.PI * u) * vh * .12;
    fz = Math.sin(Math.PI * u) * figH * .9;
    const start = (.37 * bw * LOKAL_H) / figH;
    skal = lerp(start, 1, eback(seg(tI, T.plopp, T.plopp + .45)));
    extraDreh = e * Math.PI * 2;
  } else {
    fx = daempfe(fx, gelandet ? fx : z.x, 4.5, dt);
    fy = gelandet ? zielFuss : daempfe(fy, zielFuss, amBoden ? 3.5 : 5, dt);
    fz = daempfe(fz, 0, 4, dt);
  }
  const fxAlt = figur.userData.fx ?? fx; vxF = daempfe(vxF, (fx - fxAlt) / Math.max(dt, 1e-3), 6, dt); figur.userData.fx = fx;

  // Landen
  if (tI >= T.flugEnde && amBoden && !gelandet && Math.abs(fy - zielFuss) < 6) {
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

  const schwebt = !gelandet && tI >= T.plopp;
  const wipp = schwebt && !reduziert ? Math.sin(tau * 1.7) * figH * .035 : 0;
  figur.position.copy(welt(fx, fy + wipp, fz));
  const basis = figH / LOKAL_H * skal;
  figur.scale.set(basis * (1 + sq * .5), basis * (1 - sq), basis * (1 + sq * .5));
  figur.rotation.x = verbeug;
  schwenk.rotation.z = schwebt ? clamp(-vxF * .0007, -.35, .35) + (reduziert ? 0 : Math.sin(tau * 1.1) * .05) : daempfe(schwenk.rotation.z, 0, 8, dt);
  schwenk.rotation.x = schwebt ? clamp(scrollV * .00022, -.3, .3) : daempfe(schwenk.rotation.x, 0, 8, dt);
  dreh.rotation.y = z.drehungen * Math.PI * 2 + extraDreh + (schwebt && !reduziert ? Math.sin(tau * .8) * .2 : 0);

  // Blinzeln
  const bp = (tau % 4.3);
  const blink = Math.max(0, 1 - Math.abs(bp - 4.0) / .07);
  modell.augen.forEach(a => a.scale.y = 1 - .9 * blink);

  // Glitzer an Kleid und Krone
  modell.kleidMat.emissiveIntensity = .5 + Math.min(gesammelt, 160) / 160 * 1.5;
  modell.kroneMat.emissiveIntensity = .8 + .3 * Math.sin(tau * 2.3);

  // Licht folgt den Ebenen
  {
    const i = z.i, f = z.f;
    himmel.color.copy(himmelFarben[i]).lerp(himmelFarben[i + 1], f);
    himmel.intensity = lerp(himmelStaerke[i], himmelStaerke[i + 1], f);
  }

  // ---- 2D-Schicht
  sc.setTransform(dpr, 0, 0, dpr, 0, 0);
  sc.clearRect(0, 0, vw, vh);

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

  // Blumen
  if (geblueht && bodenTop < vh + 80) {
    const d = reduziert ? 9 : now - landZeit;
    sc.lineCap = 'round';
    for (const b of blumen) {
      const w = eout(seg(d - b.verz, 0, .7)); if (w <= 0) continue;
      const x0 = b.x, y0 = bodenTop + 3, h = b.h * w, wind = Math.sin(tau * 1.3 + b.ph) * 2;
      const x1 = x0 + b.neig * h + wind, y1 = y0 - h;
      sc.strokeStyle = C.linie; sc.lineWidth = 1.6;
      sc.beginPath(); sc.moveTo(x0, y0); sc.quadraticCurveTo(x0, y0 - h * .5, x1, y1); sc.stroke();
      const r = b.r * eback(seg(d - b.verz, .35, .9));
      if (r > .3) { sc.fillStyle = b.farbe; sc.lineWidth = 1.4; sc.beginPath(); sc.arc(x1, y1, r, 0, 7); sc.fill(); sc.stroke(); sc.fillStyle = C.gold; sc.beginPath(); sc.arc(x1, y1, r * .32, 0, 7); sc.fill(); }
    }
  }

  // Glitzer
  const kx = fx, ky = fy - figH * .5 + scrollY, ziehR = figH * 1.15, fangR = figH * .3;
  const zieht = figur.visible && !gelandet;
  sc.globalCompositeOperation = 'lighter';
  const rest = [];
  for (const p of teilchen) {
    if (p.art === 'funke') { p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.leben -= dt; }
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
window.__principessa = { springe: t => { tI = t; }, zustand: () => ({ tI, gesammelt, gelandet }) };

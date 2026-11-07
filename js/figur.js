// Die Principessa: flach gezeichnet (Canvas 2D) und als 3D-Figur (Three.js).
// Beide lesen dieselben Masse F, damit die Zeichnung und die Figur übereinstimmen.
import * as THREE from 'three';

export const C = {
  creme: '#f7f2ec', linie: '#2a2230', kopf: '#fdfcfa', wange: '#f4aac0',
  hellblau: '#5b9be0', tuerkis: '#1f5f6a', koenigsblau: '#3f4fd0', gruen: '#2fa58a',
  punkt: '#4a3fc0', gold: '#d4a429', kugel: '#c8173f',
};
export const STREIFEN = ['hellblau', 'tuerkis', 'koenigsblau', 'hellblau', 'tuerkis', 'koenigsblau', 'gruen', 'hellblau', 'tuerkis'];

// Masse in lokalen Einheiten, Füsse bei y = 0
export const F = {
  beinOben: 0.22, kleidUnten: 0.22, kleidOben: 1.22, rUnten: 0.55, rOben: 0.18,
  kopfY: 1.45, krx: 0.64, kry: 0.265, krz: 0.4,
  kroneBasis: 1.72,
  beine: [-0.30, 0.05], fuss: 0.14,
  hoehe: 2.26,
};
export const BEIN_EXTRA = 0.13;
export const ARM = { breite: 0.13, tiefe: 0.36 }; // die U-förmigen Arme am Oberkörper // in 3D etwas längere Beine, damit die Füsse unter dem Saum sichtbar sind

export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const lerp = (a, b, t) => a + (b - a) * t;

export function kronenUmriss() {
  const b = F.kroneBasis;
  return [[-0.32, b], [-0.24, b + .44], [-0.13, b + .19], [-0.02, b + .44], [0.05, b + .21],
    [0.11, b + .40], [0.16, b + .21], [0.22, b + .39], [0.28, b + .21], [0.42, b + .38], [0.36, b]];
}

// Zeichnet die Principessa; (cx, by) = Mitte der Füsse in Pixeln, s = Pixel pro lokaler Einheit
export function zeichne(ctx, cx, by, s, lw = 3) {
  const X = x => cx + x * s, Y = y => by - y * s;
  const r = rng(7);
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = C.linie; ctx.lineWidth = lw;
  for (const bx of F.beine) {
    ctx.beginPath(); ctx.moveTo(X(bx), Y(F.beinOben)); ctx.lineTo(X(bx), Y(0.02)); ctx.lineTo(X(bx + F.fuss), Y(0.02)); ctx.stroke();
  }
  const kleid = () => { ctx.beginPath(); ctx.moveTo(X(-F.rOben), Y(F.kleidOben)); ctx.lineTo(X(F.rOben), Y(F.kleidOben)); ctx.lineTo(X(F.rUnten), Y(F.kleidUnten)); ctx.lineTo(X(-F.rUnten), Y(F.kleidUnten)); ctx.closePath(); };
  ctx.save(); kleid(); ctx.clip();
  const bh = (F.kleidOben - F.kleidUnten) / STREIFEN.length;
  STREIFEN.forEach((k, i) => {
    const y1 = F.kleidOben - i * bh;
    ctx.fillStyle = C[k]; ctx.fillRect(X(-0.7), Y(y1) - 1, 1.4 * s, bh * s + 2);
    if (k === 'tuerkis') {
      for (let n = 0; n < 60; n++) {
        ctx.fillStyle = r() < .5 ? '#ffffff' : '#9ff3e8';
        ctx.beginPath(); ctx.arc(X(-0.6 + r() * 1.2), Y(y1 - r() * bh), (0.4 + r() * 1.3) * s / 165, 0, 7); ctx.fill();
      }
    }
  });
  ctx.restore();
  kleid(); ctx.stroke();
  const py = F.kleidOben - 7.5 * bh;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = C.punkt; ctx.beginPath(); ctx.arc(X(-0.4 + i * 0.16), Y(py), 0.035 * s, 0, 7); ctx.fill(); ctx.lineWidth = lw * .6; ctx.stroke();
  }
  ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(X(-ARM.breite), Y(F.kleidOben)); ctx.quadraticCurveTo(X(-0.02), Y(F.kleidOben - 2 * ARM.tiefe), X(ARM.breite), Y(F.kleidOben)); ctx.stroke();
  ctx.fillStyle = C.kopf; ctx.beginPath(); ctx.ellipse(X(0), Y(F.kopfY), F.krx * s, F.kry * s, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.linie;
  for (const [ex, ey] of [[-0.27, 1.50], [0.2, 1.47]]) { ctx.beginPath(); ctx.arc(X(ex), Y(ey), 0.03 * s, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(X(-0.33), Y(1.42)); ctx.quadraticCurveTo(X(0), Y(1.24), X(0.36), Y(1.43)); ctx.stroke();
  ctx.fillStyle = C.wange; ctx.lineWidth = lw * .7;
  for (const [ex, ey] of [[-0.45, 1.42], [0.48, 1.40]]) { ctx.beginPath(); ctx.arc(X(ex), Y(ey), 0.075 * s, 0, 7); ctx.fill(); ctx.stroke(); }
  ctx.lineWidth = lw;
  const k = kronenUmriss();
  ctx.beginPath(); k.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.closePath();
  ctx.fillStyle = C.gold; ctx.fill();
  ctx.save(); ctx.clip();
  for (let n = 0; n < 90; n++) { ctx.fillStyle = r() < .5 ? '#fff6c0' : '#ffe066'; ctx.beginPath(); ctx.arc(X(-0.33 + r() * .76), Y(F.kroneBasis + r() * .44), (0.5 + r() * 1.4) * s / 165, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.stroke();
  ctx.fillStyle = C.kugel;
  for (const i of [1, 3, 5, 7, 9]) { ctx.beginPath(); ctx.arc(X(k[i][0]), Y(k[i][1] + 0.02), 0.05 * s, 0, 7); ctx.fill(); ctx.lineWidth = lw * .8; ctx.stroke(); }
  ctx.restore();
}

export function silhouette(ctx, cx, by, s) {
  const X = x => cx + x * s, Y = y => by - y * s;
  ctx.beginPath();
  ctx.moveTo(X(-F.rOben), Y(F.kleidOben)); ctx.lineTo(X(F.rOben), Y(F.kleidOben)); ctx.lineTo(X(F.rUnten), Y(F.kleidUnten)); ctx.lineTo(X(-F.rUnten), Y(F.kleidUnten)); ctx.closePath();
  ctx.ellipse(X(0), Y(F.kopfY), F.krx * s + 2, F.kry * s + 2, 0, 0, Math.PI * 2);
  const k = kronenUmriss(); k.forEach(([x, y], i) => i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))); ctx.closePath();
  for (const bx of F.beine) ctx.rect(X(bx) - 3, Y(F.beinOben), F.fuss * s + 6, F.beinOben * s);
}

// Lage der Figur in einem quadratischen Bild der Grösse g (Pixel)
export const imBild = g => ({ cx: g / 2, by: g * 0.94, s: g * 0.37 });

// ------------------------------------------------------------------ 3D
function glitzerTextur(w, h, grund, glitzerZeilen, seed, gold = false) {
  const c = document.createElement('canvas'), e = document.createElement('canvas');
  c.width = e.width = w; c.height = e.height = h;
  const g = c.getContext('2d'), ge = e.getContext('2d'); const r = rng(seed);
  ge.fillStyle = '#000'; ge.fillRect(0, 0, w, h);
  grund(g);
  for (const [y0, y1] of glitzerZeilen) {
    const n = (y1 - y0) * w / 60;
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = lerp(y0, y1, r()), rad = .6 + r() * 1.8;
      g.fillStyle = gold ? (r() < .5 ? '#fff4b8' : '#ffde55') : (r() < .5 ? '#ffffff' : '#a6f5ea');
      g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
      if (r() < .3) { ge.fillStyle = gold ? '#fff2c0' : '#fff'; ge.beginPath(); ge.arc(x, y, rad * 1.2, 0, 7); ge.fill(); }
    }
  }
  const tc = new THREE.CanvasTexture(c), te = new THREE.CanvasTexture(e);
  tc.colorSpace = te.colorSpace = THREE.SRGBColorSpace; tc.anisotropy = te.anisotropy = 8;
  return [tc, te];
}

export function baueFigur() {
  const g = new THREE.Group();
  const linie = new THREE.MeshBasicMaterial({ color: C.linie });
  const huelle = new THREE.MeshBasicMaterial({ color: C.linie, side: THREE.BackSide });

  for (const bx of F.beine) {
    const bein = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, F.beinOben + BEIN_EXTRA, 10), linie);
    bein.position.set(bx, (F.beinOben - BEIN_EXTRA) / 2, 0); g.add(bein);
    const fuss = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, F.fuss + .03, 10), linie);
    fuss.rotation.z = Math.PI / 2; fuss.position.set(bx + F.fuss / 2, .03 - BEIN_EXTRA, 0); g.add(fuss);
  }

  const bh = 512 / STREIFEN.length;
  const [kleidMap, kleidLeucht] = glitzerTextur(1024, 512, c => {
    STREIFEN.forEach((k, i) => { c.fillStyle = C[k]; c.fillRect(0, i * bh - 1, 1024, bh + 2); });
  }, STREIFEN.map((k, i) => k === 'tuerkis' ? [i * bh, (i + 1) * bh] : null).filter(Boolean), 3);
  const dh = F.kleidOben - F.kleidUnten;
  const kleidMat = new THREE.MeshStandardMaterial({ map: kleidMap, emissive: '#ffffff', emissiveMap: kleidLeucht, emissiveIntensity: .6, roughness: .55 });
  const kleid = new THREE.Mesh(new THREE.CylinderGeometry(F.rOben, F.rUnten, dh, 96, 1, false), kleidMat);
  kleid.position.y = F.kleidUnten + dh / 2; kleid.rotation.y = -Math.PI / 2; g.add(kleid);
  const kh = new THREE.Mesh(new THREE.CylinderGeometry(F.rOben + .022, F.rUnten + .026, dh + .03, 96, 1, false), huelle);
  kh.position.copy(kleid.position); g.add(kh);
  const rBei = y => lerp(F.rUnten, F.rOben, (y - F.kleidUnten) / dh);

  const py = F.kleidOben - 7.5 * dh / STREIFEN.length, pr = rBei(py);
  const punktMat = new THREE.MeshStandardMaterial({ color: C.punkt, roughness: .4 });
  const punktGeo = new THREE.SphereGeometry(.036, 14, 10);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2, d = new THREE.Mesh(punktGeo, punktMat);
    d.position.set(Math.sin(a) * (pr + .005), py, Math.cos(a) * (pr + .005)); d.scale.z = .6;
    d.lookAt(d.position.clone().multiplyScalar(2).setY(py)); g.add(d);
  }

  const kette = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24, x = lerp(-ARM.breite, ARM.breite, u), y = F.kleidOben - (1 - Math.pow(2 * u - 1, 2)) * ARM.tiefe;
    kette.push(new THREE.Vector3(x, y, Math.sqrt(Math.max(0, rBei(y) ** 2 - x * x)) + .012));
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(kette), 40, .012, 6), linie));

  const aufKopf = (x, y, d = 0) => {
    const u = x / F.krx, v = (y - F.kopfY) / F.kry;
    return new THREE.Vector3(x, y, F.krz * Math.sqrt(Math.max(0, 1 - u * u - v * v)) + d);
  };
  const kopf = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), new THREE.MeshStandardMaterial({ color: '#f1ece4', roughness: .55 }));
  kopf.scale.set(F.krx, F.kry, F.krz); kopf.position.y = F.kopfY; g.add(kopf);
  const kopfH = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), huelle);
  kopfH.scale.set(F.krx + .022, F.kry + .022, F.krz + .022); kopfH.position.y = F.kopfY; g.add(kopfH);
  const augen = [];
  for (const [ex, ey] of [[-0.27, 1.50], [0.2, 1.47]]) {
    const a = new THREE.Mesh(new THREE.SphereGeometry(.034, 16, 12), linie);
    a.position.copy(aufKopf(ex, ey, -.008)); a.scale.z = .6; g.add(a); augen.push(a);
  }
  const mund = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    mund.push(aufKopf((1 - u) ** 2 * -.33 + u * u * .36, (1 - u) ** 2 * 1.42 + 2 * (1 - u) * u * 1.24 + u * u * 1.43, .006));
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mund), 40, .013, 6), linie));
  const wangeMat = new THREE.MeshStandardMaterial({ color: C.wange, roughness: .6 });
  for (const [ex, ey] of [[-0.45, 1.42], [0.48, 1.40]]) {
    const w = new THREE.Mesh(new THREE.SphereGeometry(.075, 20, 14), wangeMat);
    const p = aufKopf(ex, ey, -.02); w.position.copy(p); w.scale.z = .35;
    w.lookAt(p.clone().add(new THREE.Vector3(p.x / F.krx ** 2, (p.y - F.kopfY) / F.kry ** 2, p.z / F.krz ** 2).normalize()));
    g.add(w);
  }

  // Krone: offener Zylinder mit Zackenrand
  const N = 9, SEG = N * 10, kg = new THREE.CylinderGeometry(1, 1, 1, SEG, 1, true);
  const pos = kg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const oben = pos.getY(i) > 0, idx = i % (SEG + 1), ang = idx / SEG * Math.PI * 2;
    const zacke = 1 - Math.abs(2 * ((idx % 10) / 10) - 1);
    const h = oben ? .19 + .25 * Math.pow(zacke, 1.6) : 0;
    const r = lerp(.27, .34, h / .44);
    pos.setXYZ(i, Math.sin(ang) * r, h, Math.cos(ang) * r);
  }
  kg.computeVertexNormals();
  const [kroneMap, kroneLeucht] = glitzerTextur(1024, 256, c => { c.fillStyle = C.gold; c.fillRect(0, 0, 1024, 256); }, [[0, 256]], 11, true);
  const kroneMat = new THREE.MeshStandardMaterial({ map: kroneMap, emissive: '#fff', emissiveMap: kroneLeucht, emissiveIntensity: .9, metalness: .65, roughness: .35, side: THREE.DoubleSide });
  const krone = new THREE.Mesh(kg, kroneMat);
  krone.position.y = F.kroneBasis - .04; krone.rotation.y = Math.PI / N; g.add(krone);
  const kugelMat = new THREE.MeshStandardMaterial({ color: C.kugel, roughness: .3, metalness: .1 });
  const kugelGeo = new THREE.SphereGeometry(.05, 16, 12);
  for (let k = 0; k < N; k++) {
    const ang = (k * 10 + 5) / SEG * Math.PI * 2 + Math.PI / N;
    const b = new THREE.Mesh(kugelGeo, kugelMat);
    b.position.set(Math.sin(ang) * .34, F.kroneBasis - .04 + .47, Math.cos(ang) * .34); g.add(b);
  }
  return { gruppe: g, augen, kleidMat, kroneMat };
}

// Wie zeichne(), mit einem weichen Schatten dahinter, ohne Kontur: so löst sie sich vom Bild
export function zeichneSticker(ctx, cx, by, s, lw = 3) {
  ctx.save();
  const weg = 100000;
  ctx.translate(-weg, 0);
  silhouette(ctx, cx, by, s);
  ctx.shadowColor = 'rgba(40,16,30,.45)'; ctx.shadowBlur = lw * 5; ctx.shadowOffsetX = weg; ctx.shadowOffsetY = lw * 1.2;
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.restore();
  zeichne(ctx, cx, by, s, lw);
}

// ------------------------------------------------------------------ Die zweite Principessa
// Nach dem Gemälde mit schwarzem Grund: schief gelegter Kopf, geschlossene Wimpernaugen, roter Mund,
// Glitzerkrone, rosa Tupfenkleid, Hände in den Hüften, weisse Strichbeine.
export const F2 = { hoehe: 2.6 };
export function baueFigur2() {
  const g = new THREE.Group();
  const weiss = new THREE.MeshStandardMaterial({ color: '#f7f5f1', roughness: .6 });
  const schwarz = new THREE.MeshBasicMaterial({ color: '#141014' });
  const rosa = '#f2c4d2';

  // Beine und Füsse, die Füsse nach aussen
  for (const [bx, fuss] of [[-0.24, -0.2], [0.11, 0.21]]) {
    const bein = new THREE.Mesh(new THREE.CylinderGeometry(.034, .03, .64, 10), weiss);
    bein.position.set(bx, .32, 0); g.add(bein);
    const f = new THREE.Mesh(new THREE.CapsuleGeometry(.036, Math.abs(fuss), 4, 8), weiss);
    f.rotation.z = Math.PI / 2; f.position.set(bx + fuss / 2, .036, .01); g.add(f);
  }

  // Kleid: rosa mit weissen Tupfen
  const tc = document.createElement('canvas'); tc.width = 1024; tc.height = 512;
  const t = tc.getContext('2d'), r = rng(23);
  t.fillStyle = rosa; t.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 1400; i++) { t.fillStyle = `rgba(255,255,255,${r() * .08})`; t.fillRect(r() * 1024, r() * 512, 2 + r() * 10, 1 + r() * 3); }
  for (let zeile = 0; zeile < 3; zeile++) for (let i = 0; i < 9; i++) {
    const x = (i + (zeile % 2) * .5) / 9 * 1024 + (r() - .5) * 30, y = 95 + zeile * 150 + (r() - .5) * 30;
    t.fillStyle = 'rgba(255,255,255,.92)'; t.beginPath(); t.ellipse(x, y, 34 + r() * 6, 30 + r() * 6, 0, 0, 7); t.fill();
  }
  const kleidTex = new THREE.CanvasTexture(tc); kleidTex.colorSpace = THREE.SRGBColorSpace; kleidTex.anisotropy = 8;
  const kleidMat = new THREE.MeshStandardMaterial({ map: kleidTex, roughness: .7 });
  const kleid = new THREE.Mesh(new THREE.CylinderGeometry(.3, .58, .72, 72, 1, false), kleidMat);
  kleid.position.y = .61 + .36; kleid.rotation.y = -Math.PI / 2; g.add(kleid);
  const boden = new THREE.Mesh(new THREE.CircleGeometry(.58, 48), kleidMat); boden.rotation.x = Math.PI / 2; boden.position.y = .61; g.add(boden);

  // Arme in die Hüften gestemmt
  const armMat = new THREE.MeshStandardMaterial({ color: rosa, roughness: .7 });
  for (const s of [-1, 1]) {
    const kurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * .26, 1.26, 0), new THREE.Vector3(s * .5, 1.18, .02), new THREE.Vector3(s * .63, 1.03, .03),
      new THREE.Vector3(s * .56, .92, .05), new THREE.Vector3(s * .44, .86, .1)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(kurve, 40, .045, 10), armMat));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.055, 14, 10), weiss); hand.position.set(s * .42, .86, .11); g.add(hand);
  }

  // Kopf, schief gelegt
  const kopf = new THREE.Group(); kopf.position.set(.11, 1.77, 0); kopf.rotation.z = -.33; g.add(kopf);
  const KR = { x: .8, y: .52, z: .46 };
  const schale = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), new THREE.MeshStandardMaterial({ color: '#fbfaf7', roughness: .5 }));
  schale.scale.set(KR.x, KR.y, KR.z); kopf.add(schale);
  const vorn = (x, y, d = 0) => { const u = x / KR.x, v = y / KR.y; return new THREE.Vector3(x, y, KR.z * Math.sqrt(Math.max(0, 1 - u * u - v * v)) + d); };
  // geschlossene Augen mit Wimpern (Koordinaten im Kopf)
  const augen = [];
  for (const [ax, ay, b] of [[-.36, .08, .27], [.3, -.12, .3]]) {
    const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16 * 2 - 1; pts.push(vorn(ax + u * b / 2, ay - (1 - u * u) * .06, .004)); }
    kopf.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .016, 6), schwarz));
    for (let k = 0; k < 4; k++) {
      const u = -.6 + k * .4, p0 = vorn(ax + u * b / 2, ay - (1 - u * u) * .06, .004), p1 = vorn(ax + u * b / 2 + u * .03, ay - (1 - u * u) * .06 - .07, .004);
      kopf.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(p0, p1), 2, .011, 5), schwarz));
    }
    augen.push(ax);
  }
  // roter Mund
  const mundMat = new THREE.MeshStandardMaterial({ color: '#c3162d', roughness: .35 });
  for (const [dy, sx] of [[.018, .075], [-.02, .065]]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), mundMat);
    l.scale.set(sx, .032, .03); l.position.copy(vorn(-.05, -.25 + dy, -.012)); kopf.add(l);
  }
  // Glitzerkrone oben rechts auf dem Kopf
  const N = 5, SEG = N * 12, kg = new THREE.CylinderGeometry(1, 1, 1, SEG, 1, true), pos = kg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const oben = pos.getY(i) > 0, idx = i % (SEG + 1), ang = idx / SEG * Math.PI * 2;
    const zacke = 1 - Math.abs(2 * ((idx % 12) / 12) - 1), h = oben ? .14 + .2 * Math.pow(zacke, 1.4) : 0;
    const rr = lerp(.36, .42, h / .34); pos.setXYZ(i, Math.sin(ang) * rr, h, Math.cos(ang) * rr);
  }
  kg.computeVertexNormals();
  const kc = document.createElement('canvas'), ke = document.createElement('canvas'); kc.width = ke.width = 1024; kc.height = ke.height = 256;
  const k1 = kc.getContext('2d'), k2 = ke.getContext('2d'), kr = rng(41);
  k1.fillStyle = '#d6b85e'; k1.fillRect(0, 0, 1024, 256); k2.fillStyle = '#000'; k2.fillRect(0, 0, 1024, 256);
  const pastell = ['#fff7d6', '#e9c95a', '#f4e9ff', '#d9f2ff', '#ffe0ec', '#c9a24a', '#ffffff', '#e2b84a'];
  for (let i = 0; i < 5200; i++) {
    const x = kr() * 1024, y = kr() * 256, rad = 1.5 + kr() * 4;
    k1.fillStyle = pastell[Math.floor(kr() * pastell.length)]; k1.beginPath(); k1.arc(x, y, rad, 0, 7); k1.fill();
    if (kr() < .2) { k2.fillStyle = '#fff'; k2.beginPath(); k2.arc(x, y, rad * .8, 0, 7); k2.fill(); }
  }
  const kMap = new THREE.CanvasTexture(kc), kLeucht = new THREE.CanvasTexture(ke); kMap.colorSpace = kLeucht.colorSpace = THREE.SRGBColorSpace;
  const kroneMat = new THREE.MeshStandardMaterial({ map: kMap, emissive: '#fff', emissiveMap: kLeucht, emissiveIntensity: .9, metalness: .55, roughness: .35, side: THREE.DoubleSide });
  const krone = new THREE.Mesh(kg, kroneMat); krone.position.set(.24, .3, 0); krone.rotation.z = -.14; krone.scale.set(1.3, 1.55, 1.3); kopf.add(krone);
  return { gruppe: g, kroneMat, kleidMat };
}

// ------------------------------------------------------------------ Die dritte Principessa: eine Meerjungfrau
// Blonde Lockenkrause, geschlossene Wimpernaugen, Glitzerwangen, hohe schmale Krone mit drei grünen Kugeln,
// zarter Oberkörper mit dünnen Armen, Fischschwanz in Türkis und Grün mit Pailletten.
export const F3 = { hoehe: 2.62 };
export function baueFigur3() {
  const g = new THREE.Group(), r = rng(57);
  const haut = new THREE.MeshStandardMaterial({ color: '#f1e6d2', roughness: .6 });
  const schwarz = new THREE.MeshBasicMaterial({ color: '#141014' });

  // Schwanz: gedrechselt, vorn und hinten etwas flacher
  const profil = [[.0, .16], [.06, .16], [.075, .22], [.1, .34], [.135, .5], [.17, .68], [.195, .84], [.2, .98], [.0, .98]].map(([x, y]) => new THREE.Vector2(x, y));
  const [sMap, sLeucht] = glitzerTextur(1024, 512, c => {
    const farben = ['#2c9d86', '#4fc3a8', '#1f6f7a', '#e8b9c7', '#3dae8f', '#86c96b', '#2a7f8a', '#e8b9c7', '#4fc3a8', '#2c9d86'];
    const h = 512 / farben.length;
    farben.forEach((f, i) => { c.fillStyle = f; c.fillRect(0, i * h - 1, 1024, h + 2); });
  }, [[0, 512]], 61);
  const schwanzMat = new THREE.MeshStandardMaterial({ map: sMap, emissive: '#fff', emissiveMap: sLeucht, emissiveIntensity: .6, roughness: .45 });
  const schwanz = new THREE.Mesh(new THREE.LatheGeometry(profil, 64), schwanzMat);
  schwanz.scale.z = .72; g.add(schwanz);
  // Flosse: zwei flache Lappen
  const flosseMat = new THREE.MeshStandardMaterial({ color: '#56c9ae', emissive: '#fff', emissiveMap: sLeucht, emissiveIntensity: .5, roughness: .4 });
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), flosseMat);
    f.scale.set(.15, .1, .035); f.position.set(s * .1, .09, 0); f.rotation.z = s * -.55; g.add(f);
  }

  // Oberkörper und Arme
  const rumpf = new THREE.Mesh(new THREE.CylinderGeometry(.075, .13, .22, 24), haut);
  rumpf.position.y = 1.07; rumpf.scale.z = .75; g.add(rumpf);
  const hals = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .08, 16), haut); hals.position.y = 1.2; g.add(hals);
  for (const s of [-1, 1]) {
    const kurve = new THREE.CatmullRomCurve3([new THREE.Vector3(s * .08, 1.12, 0), new THREE.Vector3(s * .25, 1.06, .02), new THREE.Vector3(s * .42, .97, .03)]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(kurve, 24, .026, 8), haut));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), haut); hand.position.set(s * .43, .965, .03); g.add(hand);
  }

  // Kopf
  const KR = { x: .74, y: .3, z: .36 }, kopfY = 1.5;
  const kopf = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), new THREE.MeshStandardMaterial({ color: '#f3e9d6', roughness: .55 }));
  kopf.scale.set(KR.x, KR.y, KR.z); kopf.position.y = kopfY; g.add(kopf);
  const vorn = (x, y, d = 0) => { const u = x / KR.x, v = (y - kopfY) / KR.y; return new THREE.Vector3(x, y, KR.z * Math.sqrt(Math.max(0, 1 - u * u - v * v)) + d); };
  // Locken rund um die obere Hälfte, in drei Lagen
  const lockenMat = new THREE.MeshStandardMaterial({ color: '#ecd56a', roughness: .5 });
  const locke = new THREE.SphereGeometry(1, 14, 10);
  for (const [lage, zf] of [[0, 0], [1, .55], [-1, .55]]) {
    for (let i = 0; i <= 26; i++) {
      const w = -0.32 + i / 26 * (Math.PI + .64), rr = .062 + r() * .022;
      const x = Math.cos(w) * (KR.x + .01) * (1 - zf * .18), y = kopfY + Math.sin(w) * (KR.y + .02) * (1 - zf * .1);
      if (lage !== 0 && Math.sin(w) < .15) continue;
      const l = new THREE.Mesh(locke, lockenMat); l.scale.setScalar(rr);
      l.position.set(x, y, lage * zf * KR.z); g.add(l);
    }
  }
  // geschlossene Augen mit Wimpern
  for (const ax of [-.27, .27]) {
    const ay = 1.535, b = .3, pts = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16 * 2 - 1; pts.push(vorn(ax + u * b / 2, ay - (1 - u * u) * .05, .004)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .02, 6), schwarz));
    for (let k = 0; k < 5; k++) {
      const u = -.75 + k * .375, p0 = vorn(ax + u * b / 2, ay - (1 - u * u) * .05, .004), p1 = vorn(ax + u * b / 2 + u * .03, ay - (1 - u * u) * .05 - .075, .004);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(p0, p1), 2, .013, 5), schwarz));
    }
  }
  // Glitzerwangen und Lächeln
  const wangeMat = new THREE.MeshStandardMaterial({ color: '#f1b3bf', emissive: '#ffd7e0', emissiveIntensity: .25, roughness: .3, metalness: .2 });
  for (const wx of [-.56, .56]) {
    const p = vorn(wx, 1.44, -.02), w = new THREE.Mesh(new THREE.SphereGeometry(.085, 18, 12), wangeMat);
    w.position.copy(p); w.scale.z = .3; w.lookAt(p.clone().add(new THREE.Vector3(p.x / KR.x ** 2, (p.y - kopfY) / KR.y ** 2, p.z / KR.z ** 2).normalize())); g.add(w);
  }
  const mund = []; for (let i = 0; i <= 20; i++) { const u = i / 20; mund.push(vorn(-.24 + u * .5, 1.37 - Math.sin(Math.PI * u) * .06, .004)); }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mund), 30, .014, 6), new THREE.MeshBasicMaterial({ color: '#e0708a' })));

  // hohe schmale Krone mit drei grünen Kugeln
  const [kMap, kLeucht] = glitzerTextur(256, 512, c => { c.fillStyle = C.gold; c.fillRect(0, 0, 256, 512); }, [[0, 512]], 67, true);
  const kroneMat = new THREE.MeshStandardMaterial({ map: kMap, emissive: '#fff', emissiveMap: kLeucht, emissiveIntensity: .8, metalness: .6, roughness: .35 });
  const krone = new THREE.Group(); krone.position.set(.34, 1.74, 0); g.add(krone);
  const stiel = new THREE.Mesh(new THREE.CylinderGeometry(.085, .06, .5, 20), kroneMat); stiel.position.y = .25; stiel.scale.z = .6; krone.add(stiel);
  const kugelMat = new THREE.MeshStandardMaterial({ color: '#1f6a4a', emissive: '#7fe0b0', emissiveIntensity: .25, roughness: .35, metalness: .3 });
  for (const [dx, h, rot] of [[-.075, .14, .45], [0, .17, 0], [.075, .14, -.45]]) {
    const zacke = new THREE.Mesh(new THREE.CylinderGeometry(.018, .03, h, 10), kroneMat);
    zacke.position.set(dx + Math.sin(-rot) * h * .5, .5 + Math.cos(rot) * h * .5, 0); zacke.rotation.z = rot; krone.add(zacke);
    const k = new THREE.Mesh(new THREE.SphereGeometry(.058, 16, 12), kugelMat);
    k.position.set(dx + Math.sin(-rot) * h, .5 + Math.cos(rot) * h + .04, 0); krone.add(k);
  }
  return { gruppe: g, kroneMat };
}

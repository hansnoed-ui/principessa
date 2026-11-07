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

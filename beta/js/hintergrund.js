// Wenige Objekte im Hintergrund der Ebenen: Wolken, Mond und Sternschnuppe, Unterwasserlicht, Blasen,
// Seegras und Fische, Kleeblätter im Morgenrot. Gezeichnet auf die 2D-Schicht hinter den Figuren.
import { rng } from './figur.js';

const r = rng(314);
const WOLKEN = Array.from({ length: 4 }, (_, i) => ({ fx: [.12, .66, .38, .86][i], fy: [.1, .24, .38, .5][i], s: [1, .8, .65, .9][i], v: 4 + r() * 6, tiefe: .1 + r() * .2 }));
const STERNBILD = [[.08, .2], [.14, .13], [.2, .17], [.25, .1], [.31, .15], [.27, .24]];
const BLASEN = Array.from({ length: 22 }, () => ({ fx: r(), r: 2 + Math.pow(r(), 2) * 9, v: .025 + r() * .04, ph: r(), wob: r() * 7 }));
const SEEGRAS = Array.from({ length: 6 }, (_, i) => ({ fx: [.03, .07, .12, .84, .9, .95][i], h: .55 + r() * .45, b: .8 + r() * .5, ph: r() * 7, farbe: ['#2a8f7a', '#3aa88e', '#1f6f66'][i % 3] }));
const FISCHE = [{ fy: .3, v: .016, ph: .1, s: 1, farbe: '#e6b84c' }, { fy: .62, v: -.012, ph: .6, s: .8, farbe: '#efc96a' }];
const KLEE = Array.from({ length: 6 }, (_, i) => ({ fx: [.1, .86, .22, .72, .5, .93][i], fy: [.2, .32, .7, .78, .12, .6][i], s: .7 + r() * .6, dreh: r() * 7, v: .12 + r() * .2, ph: r() * 7 }));

function sichtbar(L, sy, vh) { return L && L.top - sy < vh + 60 && L.top + L.h - sy > -60; }

function wolke(ctx, x, y, b, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  for (const [dx, dy, rr] of [[-.32, .06, .26], [-.1, -.08, .34], [.16, -.02, .3], [.36, .08, .22], [0, .1, .3]]) {
    const g = ctx.createRadialGradient(x + dx * b, y + dy * b, 0, x + dx * b, y + dy * b, rr * b);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.6, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx * b, y + dy * b, rr * b, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function klee(ctx, x, y, s, w) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(w); ctx.scale(s, s);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 40); g.addColorStop(0, 'rgba(255,244,200,.55)'); g.addColorStop(1, 'rgba(255,244,200,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.fill();
  for (let k = 0; k < 4; k++) {
    ctx.save(); ctx.rotate(k * Math.PI / 2);
    ctx.fillStyle = k % 2 ? '#3f9a5a' : '#4cad66';
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-14, -6, -16, -24, -6, -24); ctx.bezierCurveTo(-2, -24, 0, -20, 0, -17);
    ctx.bezierCurveTo(0, -20, 2, -24, 6, -24); ctx.bezierCurveTo(16, -24, 14, -6, 0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(220,255,210,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -15); ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = '#3f8a4f'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, 14, 2, 26); ctx.stroke();
  ctx.restore();
}

export function hintergrund(ctx, { lage, sy, vw, vh, tau, mobil }) {
  const m = mobil ? .65 : 1;

  // Himmel: weiche Wolken, die langsam ziehen
  const L1 = lage.schweben;
  if (sichtbar(L1, sy, vh)) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, L1.top - sy, vw, L1.h); ctx.clip();
    for (const w of WOLKEN) {
      const b = Math.min(vw * .22, 260) * w.s * (mobil ? 1.3 : 1);
      const x = ((w.fx * vw + tau * w.v) % (vw + b * 2)) - b * .5;
      const y = L1.top + w.fy * L1.h - sy + (sy - L1.top) * w.tiefe;
      if (y > -b && y < vh + b) wolke(ctx, x, y, b, .55);
    }
    ctx.restore();
  }

  // Sternenhimmel: Mond, ein zartes Sternbild, ab und zu eine Sternschnuppe
  const L2 = lage.verweilen;
  if (sichtbar(L2, sy, vh)) {
    const mx = vw * (mobil ? .82 : .56), my = L2.top + L2.h * (mobil ? .1 : .14) - sy, mr = Math.min(vw * .06, 64);
    const glow = ctx.createRadialGradient(mx, my, mr * .6, mx, my, mr * 3.2);
    glow.addColorStop(0, 'rgba(255,236,190,.2)'); glow.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(mx, my, mr * 3.2, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.clip();
    ctx.fillStyle = '#f6e9c6'; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    ctx.fillStyle = '#151840'; ctx.beginPath(); ctx.arc(mx + mr * .42, my - mr * .22, mr * .92, 0, 7); ctx.fill();
    ctx.restore();
    const sx = mobil ? .5 : 1, ox = mobil ? vw * .4 : vw * .55;
    ctx.strokeStyle = 'rgba(247,242,236,.22)'; ctx.lineWidth = 1; ctx.beginPath();
    STERNBILD.forEach(([fx, fy], i) => { const x = ox + fx * vw * sx, y = L2.top + fy * L2.h - sy; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.stroke();
    ctx.fillStyle = '#fff6dd';
    for (const [fx, fy] of STERNBILD) { ctx.beginPath(); ctx.arc(ox + fx * vw * sx, L2.top + fy * L2.h - sy, 2.2, 0, 7); ctx.fill(); }
    const p = (tau % 9) / 1.1;
    if (p < 1) {
      const x0 = vw * .2, y0 = L2.top + L2.h * .08 - sy, x = x0 + p * vw * .45, y = y0 + p * L2.h * .12;
      const g = ctx.createLinearGradient(x - vw * .1, y - L2.h * .027, x, y);
      g.addColorStop(0, 'rgba(255,250,230,0)'); g.addColorStop(1, `rgba(255,250,230,${Math.sin(Math.PI * p) * .9})`);
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - vw * .1, y - L2.h * .027); ctx.lineTo(x, y); ctx.stroke();
    }
  }

  // Unter Wasser: Lichtstrahlen, aufsteigende Blasen, Seegras, zwei Fische
  const L3 = lage.glitzer;
  if (sichtbar(L3, sy, vh)) {
    const top = L3.top - sy, h = L3.h;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x = vw * (.15 + i * .24) + Math.sin(tau * .3 + i) * vw * .04, w = vw * (.05 + (i % 2) * .03);
      const g = ctx.createLinearGradient(0, top, 0, top + h * .7);
      g.addColorStop(0, 'rgba(170,240,255,0)'); g.addColorStop(.1, 'rgba(170,240,255,.15)'); g.addColorStop(1, 'rgba(170,240,255,0)');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(x - w * .4, top); ctx.lineTo(x + w * .4, top); ctx.lineTo(x + w * 1.6 + vw * .05, top + h * .7); ctx.lineTo(x - w * .2 + vw * .05, top + h * .7); ctx.fill();
    }
    ctx.restore();
    for (const s of SEEGRAS) {
      const x = s.fx * vw, y0 = top + h, hh = Math.min(vh * .34, 300) * s.h * m;
      if (y0 < -20 || y0 - hh > vh + 20) continue;
      // ein breites, sich verjüngendes Blattband, das in der Strömung wiegt
      const n = 16, bw = 13 * s.b * m, links = [], rechts = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, y = y0 - hh * u, dx = Math.sin(tau * .9 + s.ph + u * 2.4) * 16 * u * u;
        const w = bw * (1 - u * .85) * (0.75 + .25 * Math.sin(u * 9 + s.ph));
        links.push([x + dx - w / 2, y]); rechts.push([x + dx + w / 2, y]);
      }
      const g = ctx.createLinearGradient(0, y0, 0, y0 - hh);
      g.addColorStop(0, s.farbe); g.addColorStop(1, 'rgba(120,205,180,.7)');
      ctx.fillStyle = g; ctx.beginPath();
      links.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      for (let i = rechts.length - 1; i >= 0; i--) ctx.lineTo(rechts[i][0], rechts[i][1]);
      ctx.closePath(); ctx.fill();
    }
    for (const f of FISCHE) {
      const u = ((f.ph + tau * f.v) % 1 + 1) % 1, dir = Math.sign(f.v);
      const x = dir > 0 ? -60 + u * (vw + 120) : vw + 60 - u * (vw + 120), y = top + f.fy * h + Math.sin(tau * 1.3 + f.ph * 9) * 10;
      if (y < -40 || y > vh + 40) continue;
      const s = f.s * (mobil ? .75 : 1);
      ctx.save(); ctx.translate(x, y); ctx.scale(dir * s, s);
      ctx.fillStyle = f.farbe; ctx.beginPath(); ctx.ellipse(0, 0, 22, 11, 0, 0, 7); ctx.fill();
      const sch = Math.sin(tau * 8 + f.ph * 9) * 4;
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-34, -10 + sch); ctx.lineTo(-34, 10 + sch); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(2, -4, 10, 3, -.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#1b1420'; ctx.beginPath(); ctx.arc(12, -2, 2.2, 0, 7); ctx.fill();
      ctx.restore();
    }
    for (const b of BLASEN.slice(0, mobil ? 20 : 34)) {
      const u = (b.ph + tau * b.v) % 1, y = top + h * (1 - u), x = b.fx * vw + Math.sin(tau * 1.5 + b.wob) * 8;
      if (y < -20 || y > vh + 20) continue;
      ctx.strokeStyle = `rgba(220,250,255,${.55 * Math.sin(Math.PI * u)})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, b.r, 0, 7); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${.5 * Math.sin(Math.PI * u)})`; ctx.beginPath(); ctx.arc(x - b.r * .35, y - b.r * .35, b.r * .25, 0, 7); ctx.fill();
    }
  }

  // Morgenrot: schwebende vierblättrige Kleeblätter
  const L4 = lage.gluecksbringer;
  if (sichtbar(L4, sy, vh)) {
    for (const k of KLEE.slice(0, mobil ? 4 : 6)) {
      const x = k.fx * vw + Math.sin(tau * .4 + k.ph) * 14, y = L4.top + k.fy * L4.h - sy + Math.sin(tau * .6 + k.ph) * 12;
      if (y < -60 || y > vh + 60) continue;
      klee(ctx, x, y, k.s * m * 1.1, k.dreh + tau * k.v);
    }
  }
}

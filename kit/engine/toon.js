// engine/toon.js — the "toon" cast: outlined flat-colour 2D cartoon (round skin-tone heads, bean bodies, stick limbs,
// thick dark outlines, hand-drawn line boil). Third drawing style next to the stick figures (rig2d) and the 3D cast (rig3d).
//
// Toon is a fully independent cast: it never imports rig2d.js / rig3d.js. Characters + poses + expressions: toon-rig.js;
// extra props and sets: toon-props.js; catalog of everything: examples/toon-catalog.
// Usage inside a 2D shot:   import * as TO from '/engine/toon.js';
//   registerShot('s001', { draw(g, t, info) { TO.use(g, t); TO.classroom(t); TO.kid(640, 900, 1.25, {...}); } });
// TO.use(g, t) MUST be called first in every draw(): it binds the canvas and sets the line-boil clock.
// All coordinates are logical units (1920x1080 landscape). Fonts: TO.F.hand (Patrick Hand) for handwriting,
// TO.F.comic (Nunito 900 italic) for comic pop text — Bangers is NOT used because it mangles Ơ/Ư.
// Read references/style-bible-toon.md before designing toon shots.
import { clamp, lerp, prog, ease, E } from './core.js';

let g = null, BOIL = 0;
export const INK = '#141218', OUT = 6;
export const F = { hand: 'Patrick Hand', comic: 'Nunito' };
export function use(ctx, t = 0) { g = ctx; BOIL = Math.floor(t * 8); return g; }
export const ctx = () => g;   // for sibling toon modules (toon-rig.js, toon-props.js)

// ---------------- primitives ----------------
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; }
// part(id, fn): draws fn with a tiny per-part jitter that changes 8x per second (hand-drawn "line boil")
export function part(id, fn, amt = 1) { const r = rng(id * 7919 + BOIL * 104729 + 1); g.save(); g.translate((r() - 0.5) * 2 * amt, (r() - 0.5) * 2 * amt); g.rotate((r() - 0.5) * 0.005 * amt); fn(); g.restore(); }
export function fs(fill, lw = OUT) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw > 0) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
export function rr(x, y, w, h, r = 0) { g.beginPath(); g.roundRect(x, y, w, h, r); }
export function ell(x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
export function line(pts, lw, col = INK, dash = null) { g.save(); if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = dash ? 'butt' : 'round'; g.lineJoin = 'round'; g.stroke(); g.restore(); }
export function curve(p0, p1, p2, lw, col = INK, dash = null) { g.save(); if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo(...p1, ...p2); g.lineWidth = lw; g.strokeStyle = col; g.lineCap = dash ? 'butt' : 'round'; g.stroke(); g.restore(); }
export function glow(x, y, r, col, a = 1) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
export function shade(hex, a) { const n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255; const f = v => Math.max(0, Math.min(255, Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a))); return `rgb(${f(r)},${f(gg)},${f(b)})`; }
// shaded skin head: fill, soft inner crescent, outline
export function head(x, y, r, skin, ry = r) { ell(x, y, r, ry); g.fillStyle = skin; g.fill(); g.save(); ell(x, y, r, ry); g.clip(); g.beginPath(); g.arc(x, y, Math.max(r, ry) + 4, 0, 7); g.arc(x - r * 0.16, y - ry * 0.14, Math.max(r, ry) * 0.98, 0, 7, true); g.fillStyle = 'rgba(150,70,40,.16)'; g.fill('evenodd'); g.restore(); ell(x, y, r, ry); fs(null, OUT); }
// two-segment stick limb solved toward a target (bend = +1/-1 picks the elbow side)
export function ikArm(sx, sy, tx, ty, L1, L2, bend = 1, lw = 8) { let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); d = Math.min(d, L1 + L2 - 1); const a = Math.atan2(dy, dx), c = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), b = a + bend * Math.acos(c); const ex = sx + Math.cos(b) * L1, ey = sy + Math.sin(b) * L1, hx = sx + Math.cos(a) * d, hy = sy + Math.sin(a) * d; line([[sx, sy], [ex, ey], [hx, hy]], lw); return [hx, hy]; }
export function hand(x, y, r, skin) { ell(x, y, r, r); fs(skin, 4.5); }
export function eye(x, y, rx, ry, lookX = 0, lookY = 0, blink = false) { if (blink) { line([[x - rx, y], [x + rx, y]], 5); return; } ell(x, y, rx, ry); fs('#fff', 4.5); ell(x + lookX * rx * 0.35, y + lookY * ry * 0.38, rx * 0.52, ry * 0.55); g.fillStyle = INK; g.fill(); ell(x + lookX * rx * 0.35 - rx * 0.18, y + lookY * ry * 0.38 - ry * 0.2, rx * 0.16, ry * 0.16); g.fillStyle = '#fff'; g.fill(); }
export function sweat(x, y, t, k = 0) { const sp = (t * 0.35 + k * 0.5) % 1; g.save(); g.globalAlpha = sp < 0.9 ? 1 : (1 - sp) * 10; const sx = x, sy = y + sp * 70; g.beginPath(); g.moveTo(sx, sy - 18); g.quadraticCurveTo(sx + 12, sy, sx, sy + 8); g.quadraticCurveTo(sx - 12, sy, sx, sy - 18); fs('#9fd6ff', 3.5); g.restore(); }

// ---------------- text ----------------
// comic pop text (yellow with thick outline, pops in with outBack). p = 0..1 entrance progress.
export function comic(str, x, y, size, p = 1, color = '#ffd23f', rot = -0.05) { if (p <= 0) return; const sc = ease.outBack(clamp(p)); g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.font = `italic 900 ${size}px "${F.comic}"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * 0.16; g.strokeStyle = INK; g.strokeText(str, 0, 0); g.fillStyle = color; g.fillText(str, 0, 0); g.restore(); }
// handwritten label with outline (like a caption written over the scene)
export function handTitle(str, x, y, size = 110, color = '#f6f3ea', align = 'left', rot = -0.03) { g.save(); g.font = `${size}px "${F.hand}"`; g.textAlign = align; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = size * 0.13; g.strokeStyle = INK; g.translate(x, y); g.rotate(rot); g.strokeText(str, 0, 0); g.fillStyle = color; g.fillText(str, 0, 0); g.restore(); }
// black card with handwriting revealed word by word (wipe), starting at t0, one word every `step` seconds
export function handReveal(words, x, y, size, t, t0 = 0, step = 0.45, color = '#fff') { g.save(); g.font = `${size}px "${F.hand}"`; g.fillStyle = color; g.textBaseline = 'middle'; let xx = x; words.forEach((w, i) => { const p = prog(t, t0 + i * step, t0 + i * step + 0.35); if (p > 0) { const ww = g.measureText(w).width; g.save(); g.beginPath(); g.rect(xx - 10, y - size, (ww + 20) * p, size * 2); g.clip(); g.translate(xx, y); g.rotate(-0.03); g.fillText(w, 0, 0); g.restore(); } xx += g.measureText(w + ' ').width; }); g.restore(); }

// ---------------- props & layout helpers ----------------
// price / label tag hanging from a string. swing in radians.
export function tag(x, y, swing, big, small = '', color = INK) { g.save(); g.translate(x, y); line([[0, -70], [0, -8]], 2.5); g.rotate(swing); g.beginPath(); g.moveTo(-90, 0); g.lineTo(80, 0); g.lineTo(104, 40); g.lineTo(80, 80); g.lineTo(-90, 80); g.closePath(); fs('#f3ead2', 4.5); ell(-68, 40, 7, 7); fs('#c9bfa6', 3); g.font = `60px "${F.hand}"`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(big, 8, small ? 30 : 40); if (small) { g.font = `26px "${F.hand}"`; g.fillStyle = INK; g.fillText(small, 8, 64); } g.restore(); }
// rotating sunburst background clipped to [x0,x1]
export function rays(x0, x1, c1, c2, t, cy = 480, H = 1080) { g.save(); g.beginPath(); g.rect(x0, 0, x1 - x0, H); g.clip(); g.fillStyle = c1; g.fillRect(x0, 0, x1 - x0, H); const cx = (x0 + x1) / 2; g.translate(cx, cy); g.rotate(t * 0.08); g.fillStyle = c2; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 2400, (i * Math.PI) / 8, (i * Math.PI) / 8 + Math.PI / 16); g.closePath(); g.fill(); } g.restore(); g.save(); g.beginPath(); g.rect(x0, 0, x1 - x0, H); g.clip(); const gr = g.createRadialGradient(cx, cy, 60, cx, cy, 620); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(x0, 0, x1 - x0, H); g.restore(); }
// round show platform with bulbs
export function platform(cx, y, w) { ell(cx, y + 26, w, 64); fs('#26262c', 6); ell(cx, y, w, 64); fs('#e8e6e2', 6); for (let i = 0; i < 7; i++) { const a = Math.PI * (0.15 + (i * 0.7) / 6); ell(cx - Math.cos(a) * w * 0.92, y + Math.sin(a) * 58 * 0.9 + 14, 7, 7); fs('#ffe08a', 2.5); } }
// split screen: panel(x0, x1, fn) clips fn to a vertical strip; divider(x) draws the black seam
export function panel(x0, x1, fn, H = 1080) { g.save(); g.beginPath(); g.rect(x0, 0, x1 - x0, H); g.clip(); fn(); g.restore(); }
export function divider(x, H = 1080) { line([[x, 0], [x, H]], 10, '#0b0a0d'); }
// flat 2D microchip with glowing tiles (for hands / inserts). pulse 0..1
export function chip2d(x, y, s = 1, pulse = 0.6, rot = -0.12) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(0, 0, 10, 0, 0, 150); gl.addColorStop(0, `rgba(90,255,80,${0.55 * pulse})`); gl.addColorStop(1, 'rgba(90,255,80,0)'); g.fillStyle = gl; g.fillRect(-150, -150, 300, 300); g.restore(); for (let i = 0; i < 7; i++) { const p = -36 + i * 12; for (const s2 of [-1, 1]) { rr(p - 3, s2 * 50 - 5, 6, 10, 1); fs('#e0b43a', 2); rr(s2 * 50 - 5, p - 3, 10, 6, 1); fs('#e0b43a', 2); } } rr(-46, -46, 92, 92, 6); fs('#143018', 4.5); rr(-32, -32, 64, 64, 4); fs('#0b1a0d', 3.5); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { rr(-26 + i * 13.5, -26 + j * 13.5, 11, 11, 2); g.fillStyle = `rgba(${120 * pulse + 60},255,${60 * pulse},1)`; g.fill(); } g.restore(); }

// ---------------- wardrobe (local coords: origin = centre of the neck, y down, ~210 wide x 240 tall) ----------------
const J = { base: '#20232c', panel: '#2b2f3c', lining: '#4d5466', metal: '#cfd5df' };
function zipper(p0, p1, p2, w = 7) { curve(p0, p1, p2, w + 4, '#0e0f13'); curve(p0, p1, p2, w, J.metal, [3, 3]); }
function stud(x, y, r = 5) { ell(x, y, r, r); g.fillStyle = J.metal; g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); ell(x - 1.5, y - 1.5, r * 0.35, r * 0.35); g.fillStyle = '#fff'; g.fill(); }
function torsoPath() { g.beginPath(); g.moveTo(-58, -8); g.quadraticCurveTo(-100, -2, -104, 40); g.lineTo(-108, 212); g.quadraticCurveTo(-108, 232, -88, 232); g.lineTo(88, 232); g.quadraticCurveTo(108, 232, 108, 212); g.lineTo(104, 40); g.quadraticCurveTo(100, -2, 58, -8); g.closePath(); }
// biker leather jacket. o = { sleeves (hanging version), sheen 0..1.3 (moving highlight), tee (black tee instead of quilted lining) }
export function jacket(t, o = {}) {
  const sheen = o.sheen ?? 0;
  if (o.sleeves) for (const s of [-1, 1]) { g.save(); g.scale(s, 1); g.beginPath(); g.moveTo(96, 10); g.quadraticCurveTo(136, 20, 140, 70); g.lineTo(144, 226); g.quadraticCurveTo(128, 240, 110, 232); g.lineTo(104, 60); g.closePath(); fs(J.base, 5); line([[112, 214], [140, 212]], 4, '#0e0f13'); curve([128, 40], [138, 110], [134, 190], 4, 'rgba(255,255,255,.25)'); g.restore(); }
  torsoPath(); fs(J.base, 5.5);
  g.save(); torsoPath(); g.clip();
  g.beginPath(); g.moveTo(-40, -6); g.lineTo(40, -6); g.lineTo(14, 150); g.lineTo(-6, 150); g.closePath(); g.fillStyle = o.tee ? '#121318' : J.lining; g.fill();
  if (!o.tee) { g.save(); g.clip(); for (let k = -200; k < 200; k += 22) { line([[k, -10], [k + 160, 170]], 2, 'rgba(20,20,30,.45)'); line([[k, -10], [k - 160, 170]], 2, 'rgba(20,20,30,.45)'); } g.restore(); }
  else { g.beginPath(); g.arc(0, -14, 30, 0.15 * Math.PI, 0.85 * Math.PI); g.lineWidth = 4; g.strokeStyle = '#2a2c34'; g.stroke(); }
  g.beginPath(); g.moveTo(40, -6); g.quadraticCurveTo(30, 80, 14, 150); g.lineTo(6, 232); g.lineTo(120, 232); g.lineTo(120, -20); g.closePath(); fs(J.base, 5);
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(62, -20, 60, 260);
  if (sheen > 0) { const x = lerp(-170, 170, sheen); const gr = g.createLinearGradient(x - 60, 0, x + 60, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-120, -20, 240, 260); }
  curve([-92, 40], [-98, 110], [-90, 180], 5, 'rgba(255,255,255,.28)'); curve([88, 60], [94, 120], [90, 170], 3, 'rgba(255,255,255,.12)');
  g.restore(); torsoPath(); fs(null, 5.5);
  zipper([38, -4], [30, 80], [12, 150]); zipper([12, 150], [8, 190], [6, 230]); rr(0, 226, 12, 24, 3); fs(J.metal, 3);
  g.beginPath(); g.moveTo(-40, -8); g.lineTo(-58, -6); g.lineTo(-96, 52); g.lineTo(-64, 112); g.lineTo(-34, 40); g.closePath(); fs(J.panel, 5); stud(-82, 58);
  g.beginPath(); g.moveTo(40, -8); g.lineTo(58, -6); g.lineTo(98, 40); g.lineTo(60, 96); g.lineTo(34, 30); g.closePath(); fs(J.panel, 5); stud(84, 44);
  g.beginPath(); g.moveTo(-40, -8); g.lineTo(-46, -34); g.lineTo(-10, -22); g.lineTo(-6, -6); g.closePath(); fs(J.panel, 4.5);
  g.beginPath(); g.moveTo(40, -8); g.lineTo(48, -34); g.lineTo(12, -22); g.lineTo(6, -6); g.closePath(); fs(J.panel, 4.5);
  zipper([-86, 150], [-70, 160], [-44, 176], 5); zipper([40, 96], [56, 86], [76, 74], 5); zipper([42, 180], [60, 170], [80, 160], 5);
  for (const [x, y] of [[-44, 176], [76, 74], [80, 160]]) { rr(x - 3, y - 2, 8, 16, 2); fs(J.metal, 2.5); }
  line([[-106, 206], [106, 206]], 4, '#0e0f13'); g.lineWidth = 3.5; g.strokeStyle = J.metal; g.strokeRect(-78, 200, 26, 14);
  if (!o.tee) { rr(-10, -2, 20, 9, 2); fs('#e9e2cf', 2); }
}
// V-neck sweater over a collared shirt. col = sweater colour, shirt = shirt colour
export function sweater(col = '#5b2133', shirt = '#bcd3ea') {
  torsoPath(); fs(col, 5.5); g.save(); torsoPath(); g.clip(); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(60, -20, 60, 260); for (let y = 196; y < 232; y += 7) line([[-110, y], [110, y]], 2, 'rgba(0,0,0,.25)'); g.restore(); torsoPath(); fs(null, 5.5);
  g.beginPath(); g.moveTo(-44, -8); g.lineTo(0, 70); g.lineTo(44, -8); g.closePath(); fs(shirt, 4.5);
  g.beginPath(); g.moveTo(-44, -10); g.lineTo(-10, -2); g.lineTo(-30, 30); g.closePath(); fs(shade(shirt, 0.3), 4); g.beginPath(); g.moveTo(44, -10); g.lineTo(10, -2); g.lineTo(30, 30); g.closePath(); fs(shade(shirt, 0.3), 4);
  g.beginPath(); g.moveTo(-48, -10); g.lineTo(0, 78); g.lineTo(48, -10); g.lineWidth = 12; g.strokeStyle = shade(col, -0.15); g.stroke(); g.lineWidth = 4; g.strokeStyle = INK; g.beginPath(); g.moveTo(-54, -10); g.lineTo(0, 86); g.lineTo(54, -10); g.stroke();
}
// pinstripe suit + shirt + tie (seated torso, bottom at y=700 when used by banker); generic version at neck origin
export function suit(col = '#2a2f45', tie = '#a3242c') {
  torsoPath(); fs(col, 5.5); g.save(); torsoPath(); g.clip(); for (let x = -120; x < 120; x += 13) line([[x, -20], [x + 4, 240]], 1.6, 'rgba(200,205,230,.33)'); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(40, -20, 90, 260); g.restore(); torsoPath(); fs(null, 5.5);
  g.beginPath(); g.moveTo(-36, -6); g.lineTo(0, 74); g.lineTo(36, -6); g.closePath(); fs('#f1ede4', 5);
  g.beginPath(); g.moveTo(-10, 4); g.lineTo(10, 4); g.lineTo(16, 92); g.lineTo(0, 116); g.lineTo(-16, 92); g.closePath(); fs(tie, 4.5);
  g.beginPath(); g.moveTo(-40, -8); g.lineTo(-8, 96); g.lineTo(-60, 56); g.lineTo(-52, 30); g.closePath(); fs(shade(col, -0.15), 5); g.beginPath(); g.moveTo(40, -8); g.lineTo(8, 96); g.lineTo(60, 56); g.lineTo(52, 30); g.closePath(); fs(shade(col, -0.15), 5);
}
// thick sleeve (jacket arm) along a polyline + highlight
export function sleeve(pts, col = '#20232c') { line(pts, 40, INK); line(pts, 31, col); for (let k = 0; k < pts.length - 1; k++) { const [a, b] = [pts[k], pts[k + 1]]; line([[lerp(a[0], b[0], 0.2), lerp(a[1], b[1], 0.2) - 8], [lerp(a[0], b[0], 0.7), lerp(a[1], b[1], 0.7) - 8]], 3, 'rgba(255,255,255,.18)'); } }
// legs + shoes + contact shadow for a standing toon body whose feet are at (0,0)
export function legs(shoe = '#1b1c22', w = 110) { ell(0, 10, w, 16); g.fillStyle = 'rgba(0,0,0,.3)'; g.fill(); line([[-26, -80], [-30, 0]], 9); line([[26, -80], [30, 0]], 9); ell(-38, 2, 24, 11); fs(shoe, 4); ell(40, 2, 24, 11); fs(shoe, 4); }

// ================= CAST =================
// Every character is drawn at feet position (x, y) unless noted. They animate from t.
// Nhóc: the channel kid (orange tee with "?"). st = { hx, hy (front hand target, local), point, lookX, lookY, brow, blink, talk }
export function kid(x, y, s, st) {
  const t = st.t ?? 0; g.save(); g.translate(x, y); g.scale(s, s);
  const SK = '#f6d39b', TEE = '#ee5a36', SH = '#2e3f73', bob = Math.sin(t * 2 * Math.PI * 0.9) * 2.5;
  ell(0, 4, 78, 12); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill();
  part(1, () => { line([[-18, -120], [-22, -8]], 9); line([[18, -120], [22, -8]], 9); ell(-28, -6, 22, 12); fs('#e9e4dc', 5); ell(30, -6, 22, 12); fs('#e9e4dc', 5); line([[-44, -4], [-12, -4]], 3.5, '#c0392b'); line([[14, -4], [46, -4]], 3.5, '#c0392b'); });
  g.translate(0, bob);
  part(2, () => { const h = ikArm(-48, -228, -78, -128, 54, 52, -1, 8); hand(...h, 13, SK); });
  const bodyP = () => { g.beginPath(); g.moveTo(-50, -240); g.bezierCurveTo(-62, -200, -64, -150, -52, -118); g.lineTo(52, -118); g.bezierCurveTo(64, -150, 62, -200, 50, -240); g.bezierCurveTo(30, -262, -30, -262, -50, -240); g.closePath(); };
  part(3, () => { bodyP(); fs(TEE); g.save(); bodyP(); g.clip(); g.beginPath(); g.rect(-80, -148, 160, 40); g.fillStyle = SH; g.fill(); line([[-70, -148], [70, -148]], 6); line([[0, -148], [0, -118]], 4); g.beginPath(); g.rect(22, -262, 60, 150); g.fillStyle = 'rgba(0,0,0,.12)'; g.fill(); g.restore(); bodyP(); fs(null);
    g.font = `italic 900 54px "${F.comic}"`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff6e0'; g.strokeStyle = INK; g.lineWidth = 5; g.strokeText('?', -2, -170); g.fillText('?', -2, -170); });
  part(4, () => { const h = ikArm(48, -228, st.hx ?? 80, st.hy ?? -130, 64, 62, st.bend ?? -1, 8); hand(...h, 13, SK); if (st.point) line([[h[0], h[1]], [h[0] + 0.45 * 24, h[1] - 0.9 * 24]], 7); });
  part(5, () => { const hx = 6, hy = -330, R = 88;
    g.beginPath(); g.moveTo(hx - 86, hy - 8); g.quadraticCurveTo(hx - 92, hy - 80, hx - 20, hy - 92); g.lineTo(hx - 30, hy - 128); g.lineTo(hx + 2, hy - 96); g.lineTo(hx + 14, hy - 136); g.lineTo(hx + 30, hy - 92); g.lineTo(hx + 62, hy - 118); g.lineTo(hx + 60, hy - 78); g.quadraticCurveTo(hx + 90, hy - 50, hx + 86, hy - 14); g.closePath(); fs('#2b2421');
    ell(hx - 76, hy + 8, 16, 20); fs(SK, 5); head(hx, hy, R, SK);
    g.beginPath(); g.moveTo(hx - 82, hy - 30); g.quadraticCurveTo(hx - 70, hy - 92, hx + 4, hy - 90); g.quadraticCurveTo(hx + 70, hy - 88, hx + 86, hy - 28); g.quadraticCurveTo(hx + 56, hy - 56, hx + 30, hy - 44); g.lineTo(hx + 22, hy - 62); g.quadraticCurveTo(hx - 10, hy - 40, hx - 40, hy - 50); g.quadraticCurveTo(hx - 60, hy - 40, hx - 82, hy - 30); g.closePath(); fs('#2b2421', 6);
    ell(hx - 8, hy + 30, 14, 9); g.fillStyle = 'rgba(240,120,110,.45)'; g.fill(); ell(hx + 70, hy + 28, 12, 8); g.fill();
    eye(hx + 12, hy - 6, 15, 19, st.lookX ?? 0.5, st.lookY ?? 0, st.blink); eye(hx + 54, hy - 6, 13, 18, st.lookX ?? 0.5, st.lookY ?? 0, st.blink);
    const br = st.brow ?? 2; line([[hx - 2, hy - 38 - br], [hx + 24, hy - 44 - br]], 5.5); line([[hx + 44, hy - 44 - br], [hx + 66, hy - 38 - br]], 5.5);
    const tk = st.talk ?? 0; if (tk > 0.15) { ell(hx + 38, hy + 40, 10 + tk * 4, 6 + tk * 12); fs('#7a2e2a', 5); ell(hx + 38, hy + 46 + tk * 6, 7, 3 + tk * 3); g.fillStyle = '#e8776c'; g.fill(); }
    else { g.beginPath(); g.arc(hx + 38, hy + 30, 16, 0.2 * Math.PI, 0.8 * Math.PI); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
    if (st.sweat) { sweat(hx + 96, hy - 40, t); sweat(hx - 96, hy - 30, t, 1); } });
  g.restore();
}
// Ông đồ: old scholar in áo dài + khăn xếp, stroking his beard. st = { t, think }
export function scholar(x, y, s, st) {
  const t = st.t ?? 0; g.save(); g.translate(x, y); g.scale(s, s); const SK = '#efc68f', ROBE = '#33416e';
  ell(0, 4, 95, 14); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill();
  part(11, () => { line([[-20, -60], [-24, -8]], 9); line([[20, -60], [24, -8]], 9); ell(-34, -6, 24, 11); fs('#1f1d22', 5); ell(32, -6, 24, 11); fs('#1f1d22', 5); });
  g.translate(0, Math.sin(t * Math.PI) * 1.5);
  part(12, () => { const h = ikArm(56, -336, 118, -210, 70, 64, 1, 9); g.save(); g.translate(h[0] + 10, h[1] - 4); g.rotate(-0.35); rr(-14, -70, 28, 140, 10); fs('#efe2c0', 5); rr(-20, -80, 40, 16, 6); fs('#8a5a32', 5); rr(-20, 64, 40, 16, 6); fs('#8a5a32', 5); g.restore(); hand(...h, 14, SK); });
  part(13, () => { const robe = () => { g.beginPath(); g.moveTo(-58, -350); g.bezierCurveTo(-80, -250, -96, -140, -104, -58); g.lineTo(104, -58); g.bezierCurveTo(96, -140, 80, -250, 58, -350); g.bezierCurveTo(30, -372, -30, -372, -58, -350); g.closePath(); }; robe(); fs(ROBE); g.save(); robe(); g.clip(); g.beginPath(); g.rect(26, -380, 120, 340); g.fillStyle = 'rgba(0,0,0,.16)'; g.fill(); g.restore(); line([[0, -362], [18, -300], [44, -280]], 5); line([[44, -280], [48, -60]], 4, 'rgba(28,26,31,.7)'); for (const yy of [-322, -302, -282]) { ell(30, yy, 4, 4); g.fillStyle = '#d9b24a'; g.fill(); } });
  part(15, () => { const hx = 4, hy = -438, R = 76; ell(hx - 66, hy + 10, 14, 18); fs(SK, 5); head(hx, hy, R, SK);
    g.beginPath(); g.moveTo(hx - 74, hy - 6); g.quadraticCurveTo(hx - 82, hy + 30, hx - 58, hy + 46); g.quadraticCurveTo(hx - 66, hy + 16, hx - 54, hy - 6); g.closePath(); fs('#f2f0ec', 5);
    for (let i = 0; i < 3; i++) { const yy = hy - 66 - i * 14; ell(hx + 2, yy, 78 - i * 6, 20); fs(i % 2 ? '#2a2a3c' : '#363650', 6); } ell(hx + 2, hy - 106, 58, 14); fs('#2a2a3c', 6);
    if (st.think) { for (const [ex, er] of [[hx + 14, 11], [hx + 52, 10]]) { g.beginPath(); g.arc(ex, hy + 2, er, 1.1 * Math.PI, 1.9 * Math.PI); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); } } else { for (const ex of [hx + 14, hx + 52]) { ell(ex, hy + 2, 5, 6); g.fillStyle = INK; g.fill(); } }
    for (const [ex, er] of [[hx + 14, 20], [hx + 52, 18]]) { ell(ex, hy, er, er); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke(); }
    line([[hx - 6, hy - 4], [hx - 60, hy - 10]], 4); line([[hx - 4, hy - 30], [hx + 26, hy - 26]], 8, '#f2f0ec'); line([[hx + 40, hy - 26], [hx + 66, hy - 30]], 8, '#f2f0ec');
    g.beginPath(); g.moveTo(hx + 8, hy + 40); g.quadraticCurveTo(hx + 34, hy + 30, hx + 62, hy + 40); g.quadraticCurveTo(hx + 52, hy + 72, hx + 42, hy + 130 + Math.sin(t * 3) * 2); g.quadraticCurveTo(hx + 28, hy + 80, hx + 8, hy + 40); g.closePath(); fs('#f4f2ee', 5);
    g.beginPath(); g.moveTo(hx + 4, hy + 38); g.quadraticCurveTo(hx + 34, hy + 22, hx + 68, hy + 36); g.quadraticCurveTo(hx + 36, hy + 36, hx + 4, hy + 38); fs('#f4f2ee', 4.5); });
  part(14, () => { const k = Math.sin(t * 2 * Math.PI * 0.8) * 14; const h = ikArm(-50, -336, 46, -345 + k, 70, 64, 1, 9); hand(...h, 14, SK); });
  g.restore();
}
// Worried banker sitting behind a desk (draw the desk top before, the desk front after). (cx = body centre x)
export function bankerSeated(cx, t) {
  const sigh = Math.sin(prog(t, 4.6, 5.6) * Math.PI) * 10, breath = Math.sin(t * 2.4) * 2 + sigh, SK = '#efc79a';
  part(61, () => { g.save(); g.beginPath(); g.rect(cx - 220, 0, 440, 700); g.clip(); g.translate(cx, 548 + breath * 0.4); suit(); g.restore(); });
  part(62, () => { const tap = Math.abs(Math.sin(t * 9)) * 6 * (t < 4.4 ? 1 : 0); line([[cx - 104, 600], [cx - 150, 690]], 10); line([[cx + 104, 600], [cx + 148, 690]], 10); ell(cx - 156, 698 - tap, 22, 14); fs(SK, 5); ell(cx + 152, 698, 22, 14); fs(SK, 5); });
  part(63, () => { const hx = cx + 4, hy = 455 + breath * 0.8, R = 84;
    ell(hx - 80, hy + 12, 15, 20); fs(SK, 5); ell(hx + 86, hy + 12, 15, 20); fs(SK, 5); head(hx, hy, R, SK, R * 1.02);
    g.save(); ell(hx, hy, R, R * 1.02); g.clip(); ell(hx - 24, hy - 56, 22, 12, -0.4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(hx + s * (R + 4), hy - 10); g.quadraticCurveTo(hx + s * (R - 10), hy - 40, hx + s * (R - 26), hy - 44); g.lineTo(hx + s * (R - 30), hy + 10); g.closePath(); g.fillStyle = '#8c8a88'; g.fill(); } g.restore();
    for (const k of [0, 1]) { g.beginPath(); g.arc(hx, hy - 46 + k * 12, 28 - k * 4, 1.15 * Math.PI, 1.85 * Math.PI); g.lineWidth = 3; g.strokeStyle = 'rgba(23,20,26,.55)'; g.stroke(); }
    line([[hx - 48, hy - 8], [hx - 14, hy - 22]], 6); line([[hx + 14, hy - 22], [hx + 48, hy - 8]], 6);
    const bl = (t % 2.7) > 2.58; for (const ex of [-30, 30]) { if (bl) line([[hx + ex - 9, hy + 10], [hx + ex + 9, hy + 10]], 5); else { ell(hx + ex, hy + 10, 9, 11); fs('#fff', 4); const lk = t > 3.6 && t < 4.6 ? -0.5 : 0.3; ell(hx + ex + lk * 4, hy + 12, 4.5, 5.5); g.fillStyle = INK; g.fill(); } g.beginPath(); g.arc(hx + ex, hy + 18, 12, 0.15 * Math.PI, 0.85 * Math.PI); g.lineWidth = 2.5; g.strokeStyle = 'rgba(23,20,26,.5)'; g.stroke(); }
    g.beginPath(); g.moveTo(hx + 4, hy + 20); g.quadraticCurveTo(hx + 18, hy + 40, hx + 2, hy + 44); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.moveTo(hx - 36, hy + 58); g.quadraticCurveTo(hx - 20, hy + 42, hx, hy + 50); g.quadraticCurveTo(hx + 20, hy + 42, hx + 36, hy + 58); g.quadraticCurveTo(hx + 16, hy + 54, hx, hy + 58); g.quadraticCurveTo(hx - 16, hy + 54, hx - 36, hy + 58); fs('#7d7b7a', 4);
    g.beginPath(); g.moveTo(hx - 20, hy + 70); for (let k = 1; k <= 4; k++) g.lineTo(hx - 20 + k * 10, hy + 70 + (k % 2 ? -5 : 3)); g.lineWidth = 4; g.stroke(); sweat(hx + 64, hy - 30, t); });
}
// Biker uncle (original, not a real person): bald, sunglasses, goatee, leather jacket, cheering.
export function bikerUncle(x, y, t) { g.save(); g.translate(x, y); const SK = '#efc79a', wave = Math.sin(t * 9); legs(); line([[-100, -300], [-150, -380], [-130 + wave * 10, -460]], 9); line([[100, -300], [150, -380], [132 - wave * 10, -462]], 9); hand(-130 + wave * 10, -468, 16, SK); hand(132 - wave * 10, -470, 16, SK);
  g.save(); g.translate(0, -326); g.scale(0.98, 1.02); jacket(t, { sheen: (t * 0.35 + 0.4) % 1.3 }); g.restore();
  const hx = 0, hy = -420, R = 86; head(hx, hy, R, SK); g.save(); ell(hx, hy, R, R); g.clip(); ell(hx - 26, hy - 54, 22, 11, -0.4); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill(); g.restore();
  g.beginPath(); g.roundRect(hx - 62, hy - 20, 54, 34, 10); g.roundRect(hx + 8, hy - 20, 54, 34, 10); g.fillStyle = '#101116'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); line([[hx - 8, hy - 8], [hx + 8, hy - 8]], 5); g.fillStyle = 'rgba(160,230,255,.7)'; g.fillRect(hx - 54, hy - 14, 14, 5); g.fillRect(hx + 16, hy - 14, 14, 5);
  g.beginPath(); g.moveTo(hx - 36, hy + 34); g.quadraticCurveTo(hx, hy + 72, hx + 36, hy + 34); g.closePath(); fs('#fff', 5); line([[hx - 24, hy + 44], [hx + 24, hy + 44]], 2.5);
  g.beginPath(); g.moveTo(hx - 16, hy + 66); g.lineTo(hx + 16, hy + 66); g.lineTo(hx, hy + 96); g.closePath(); fs('#5a4a40', 4); g.restore(); }

// ---- Caricatures of public figures. Rule: SIMPLE round head + tiny features; likeness comes from the silhouette
//      (hair shape, glasses, outfit). Never put invented quotes in their mouths; no real company logos.
// Tech-CEO caricature (silver hair with a jagged side-part fringe, small rectangular glasses, black tee + biker jacket, arms crossed)
// Jensen caricature head only, centred at (0,0) (head radius 92). talk 0..1
export function jensenHead(t, talk = 0) { g.save(); g.translate(0, 430);
  const SK = '#efc89a';
  const cx = 0, cy = -430, R = 92, sw = Math.sin(t * 1.7) * 1.2; head(cx, cy, R, SK);
  const PX = cx - 34; const cap = () => { g.beginPath(); g.moveTo(cx - 90, cy - 8); g.bezierCurveTo(cx - 110, cy - 104, cx - 44, cy - 146 + sw, cx + 18, cy - 142 + sw); g.bezierCurveTo(cx + 96, cy - 138 + sw, cx + 124, cy - 62, cx + 94, cy + 8); g.quadraticCurveTo(cx + 80, cy - 36, cx + 52, cy - 56); g.quadraticCurveTo(cx + 10, cy - 78, PX + 6, cy - 70); g.lineTo(PX, cy - 40); g.lineTo(PX - 8, cy - 58); g.lineTo(PX - 16, cy - 34); g.lineTo(PX - 24, cy - 56); g.lineTo(PX - 34, cy - 30); g.lineTo(PX - 42, cy - 52); g.quadraticCurveTo(cx - 84, cy - 40, cx - 90, cy - 8); g.closePath(); };
  cap(); g.fillStyle = '#cfd0d4'; g.fill(); g.save(); cap(); g.clip();
  g.beginPath(); g.moveTo(cx + 98, cy + 10); g.quadraticCurveTo(cx + 84, cy - 48, cx + 50, cy - 70); g.quadraticCurveTo(cx + 10, cy - 92, PX + 6, cy - 88); g.lineTo(PX + 6, cy - 64); g.quadraticCurveTo(cx + 10, cy - 70, cx + 52, cy - 52); g.quadraticCurveTo(cx + 82, cy - 30, cx + 92, cy + 10); g.closePath(); g.fillStyle = '#8f9096'; g.fill();
  g.fillStyle = '#a9aab0'; g.beginPath(); g.ellipse(cx - 70, cy - 40, 34, 26, 0, 0, 7); g.fill();
  curve([cx - 30, cy - 104], [cx + 20, cy - 120], [cx + 70, cy - 96], 3, 'rgba(40,40,48,.55)'); curve([cx + 40, cy - 108], [cx + 80, cy - 98], [cx + 90, cy - 60], 3, 'rgba(40,40,48,.45)'); g.restore(); cap(); fs(null, 6);
  curve([cx - 22, cy - 26], [cx, cy - 30], [cx + 24, cy - 26], 2.4, 'rgba(60,40,30,.55)'); curve([cx - 14, cy - 18], [cx + 2, cy - 21], [cx + 18, cy - 18], 2.4, 'rgba(60,40,30,.45)');
  const blink = (t % 3.3) > 3.18; for (const ex of [-28, 28]) { g.beginPath(); g.roundRect(cx + ex - 20, cy - 2, 40, 24, 3); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); g.lineWidth = 3.6; g.strokeStyle = INK; g.stroke(); if (blink) line([[cx + ex - 8, cy + 10], [cx + ex + 8, cy + 10]], 3.5); else { ell(cx + ex + 2, cy + 10, 6, 7); g.fillStyle = INK; g.fill(); } }
  line([[cx - 8, cy + 8], [cx + 8, cy + 8]], 3.6); line([[cx - 48, cy + 6], [cx - 88, cy]], 3.6); line([[cx + 48, cy + 6], [cx + 88, cy]], 3.6);
  curve([cx - 14, cy + 48], [cx + 2, cy + 56 + talk * 6], [cx + 18, cy + 46], 4, INK); g.restore(); }
export function jensenToon(x, y, t, o = {}) { g.save(); g.translate(x, y); const SK = '#efc89a', talk = o.talk ?? (t > 1.0 && t < 3.4 ? Math.abs(Math.sin(t * 11)) : 0), br = Math.sin(t * 2.2) * 2;
  legs(); g.translate(0, br * 0.3);
  g.save(); g.translate(0, -326); g.scale(1.02, 1.0); jacket(t, { tee: true, sheen: (t * 0.3 + 0.4) % 1.3 }); g.restore();
  sleeve([[-104, -296], [-126, -200], [64, -206]]); hand(78, -208, 17, SK); sleeve([[104, -296], [128, -196], [-58, -196]]); hand(-72, -196, 17, SK);
  g.save(); g.translate(0, -430); jensenHead(t, talk); g.restore();
  g.restore(); }
// Software-founder caricature (neat short salt-and-pepper hair, bold dark glasses, big smile, V-neck sweater over a shirt, waving)
export function gatesToon(x, y, t, o = {}) { g.save(); g.translate(x, y); const SK = '#f2c9a6', talk = o.talk ?? (t > 2.0 && t < 4.2 ? Math.abs(Math.sin(t * 12)) : 0), br = Math.sin(t * 2.2 + 1) * 2, wave = Math.sin(t * 8);
  legs('#3a2a22'); g.translate(0, br * 0.3);
  line([[-102, -296], [-128, -200], [-118, -120]], 9); hand(-118, -112, 17, SK);
  const up = o.wave === false ? 0 : clamp(prog(t, 0.5, 1.0)); const hx2 = lerp(118, 150 + wave * 12, up), hy2 = lerp(-120, -430, up); line([[102, -296], [lerp(128, 170, up), lerp(-200, -330, up)], [hx2, hy2]], 9); hand(hx2, hy2 - 8, 17, SK);
  g.save(); g.translate(0, -326); sweater(o.sweater || '#5b2133'); g.restore();
  const cx = 0, cy = -430, R = 92; head(cx, cy, R, SK);
  const PX = cx + 40; const cap = () => { g.beginPath(); g.moveTo(cx - 92, cy - 4); g.bezierCurveTo(cx - 100, cy - 86, cx - 40, cy - 120, cx + 10, cy - 118); g.bezierCurveTo(cx + 70, cy - 116, cx + 102, cy - 70, cx + 92, cy - 4); g.quadraticCurveTo(cx + 84, cy - 40, PX + 12, cy - 58); g.lineTo(PX, cy - 70); g.quadraticCurveTo(cx - 6, cy - 62, cx - 52, cy - 44); g.quadraticCurveTo(cx - 76, cy - 34, cx - 80, cy - 16); g.quadraticCurveTo(cx - 86, cy - 12, cx - 92, cy - 4); g.closePath(); };
  cap(); g.fillStyle = '#8f8579'; g.fill(); g.save(); cap(); g.clip(); g.fillStyle = '#b4aca2'; g.beginPath(); g.ellipse(cx - 6, cy - 100, 70, 22, -0.1, 0, 7); g.fill(); g.fillStyle = '#6f665c'; g.beginPath(); g.ellipse(cx - 84, cy - 24, 22, 30, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(cx + 90, cy - 24, 20, 30, 0, 0, 7); g.fill();
  curve([PX - 4, cy - 74], [cx - 10, cy - 80], [cx - 60, cy - 56], 2.6, 'rgba(40,32,26,.5)'); curve([PX - 2, cy - 90], [cx, cy - 100], [cx - 64, cy - 80], 2.6, 'rgba(40,32,26,.4)'); g.restore(); cap(); fs(null, 6);
  const blink = (t % 2.9) > 2.78; for (const ex of [-30, 30]) { g.beginPath(); g.roundRect(cx + ex - 24, cy - 6, 48, 32, 9); g.fillStyle = 'rgba(255,255,255,.22)'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#1a1416'; g.stroke(); if (blink) line([[cx + ex - 8, cy + 10], [cx + ex + 8, cy + 10]], 3.5); else { ell(cx + ex + 1, cy + 10, 6, 7); g.fillStyle = INK; g.fill(); } }
  line([[cx - 6, cy + 6], [cx + 6, cy + 6]], 5, '#1a1416'); line([[cx - 54, cy + 4], [cx - 90, cy - 2]], 5, '#1a1416'); line([[cx + 54, cy + 4], [cx + 90, cy - 2]], 5, '#1a1416');
  curve([cx - 44, cy - 18], [cx - 30, cy - 24], [cx - 16, cy - 18], 4, '#5c544b'); curve([cx + 16, cy - 18], [cx + 30, cy - 24], [cx + 44, cy - 18], 4, '#5c544b');
  const mo = () => { g.beginPath(); g.moveTo(cx - 30, cy + 44); g.quadraticCurveTo(cx, cy + 76 + talk * 6, cx + 30, cy + 44); g.quadraticCurveTo(cx, cy + 52, cx - 30, cy + 44); g.closePath(); }; mo(); fs('#7a2e2a', 4.5); g.save(); mo(); g.clip(); g.fillStyle = '#fff'; g.fillRect(cx - 34, cy + 42, 68, 14); g.restore();
  ell(cx - 52, cy + 34, 12, 7); g.fillStyle = 'rgba(235,120,110,.35)'; g.fill(); ell(cx + 52, cy + 34, 12, 7); g.fill(); g.restore(); }

// ================= SETS (1920x1080; draw first, inside your camera transform) =================
export function classroom(t) {
  let gr = g.createLinearGradient(0, 0, 0, 700); gr.addColorStop(0, '#4f6f74'); gr.addColorStop(1, '#62858a'); g.fillStyle = gr; g.fillRect(-400, -300, 2720, 1000);
  g.fillStyle = '#7b4b2e'; g.fillRect(-400, 600, 2720, 190); line([[-400, 600], [2320, 600]], 6); for (let x = -360; x < 2320; x += 230) { rr(x, 622, 190, 146, 6); g.lineWidth = 4; g.strokeStyle = '#4e2e1b'; g.stroke(); } line([[-400, 788], [2320, 788]], 6);
  gr = g.createLinearGradient(0, 788, 0, 1300); gr.addColorStop(0, '#2f3a57'); gr.addColorStop(1, '#1d2438'); g.fillStyle = gr; g.fillRect(-400, 788, 2720, 600); for (let i = 0; i < 7; i++) { const yy = 800 + i * i * 9 + i * 22; line([[-400, yy], [2320, yy]], 2.5, 'rgba(10,14,28,.6)'); }
  part(31, () => { rr(1400, 110, 400, 430, 10); g.save(); g.clip(); gr = g.createLinearGradient(0, 110, 0, 540); gr.addColorStop(0, '#7fc6f2'); gr.addColorStop(1, '#cfeeff'); g.fillStyle = gr; g.fillRect(1400, 110, 400, 430); const cx = 1500 + ((t * 14) % 120); for (const [a, b, r] of [[cx, 230, 40], [cx + 48, 214, 52], [cx + 100, 236, 38]]) { ell(a, b, r, r * 0.8); g.fillStyle = '#fff'; g.fill(); } ell(1730, 200, 46, 46); g.fillStyle = '#ffe58a'; g.fill(); g.restore();
    rr(1400, 110, 400, 430, 10); g.lineWidth = 14; g.strokeStyle = '#e8dcc4'; g.stroke(); g.lineWidth = OUT; g.strokeStyle = INK; rr(1393, 103, 414, 444, 14); g.stroke(); line([[1600, 110], [1600, 540]], 12, '#e8dcc4'); line([[1400, 325], [1800, 325]], 12, '#e8dcc4'); rr(1380, 536, 440, 26, 6); fs('#e8dcc4', 6); });
  part(32, () => { rr(260, 120, 900, 430, 10); fs('#7b4b2e', OUT); rr(286, 146, 848, 378, 6); fs('#2e4a3c', 5); rr(330, 536, 760, 22, 4); fs('#5c3820', 5); rr(420, 522, 70, 16, 4); fs('#f3efe2', 4); });
  part(33, () => { ell(1270, 190, 52, 52); fs('#f3efe2'); const a = t * 0.6; line([[1270, 190], [1270 + Math.sin(a) * 34, 190 - Math.cos(a) * 34]], 5); line([[1270, 190], [1292, 196]], 6); });
  return { GY: 900, board: [286, 146, 848, 378] };
}
// write on the classroom board (chalk), call after classroom()
export function chalk(str, x, y, size = 64, color = '#f3efe2', alpha = 0.88) { g.save(); g.globalAlpha = alpha; g.font = `${size}px "${F.hand}"`; g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(str, x, y); g.restore(); }

function cobweb(x, y, r, dir) { g.save(); g.translate(x, y); g.scale(dir, 1); g.strokeStyle = 'rgba(235,235,240,.75)'; g.lineWidth = 1.8; const n = 6; for (let i = 0; i <= n; i++) { const a = (Math.PI / 2) * (i / n); g.beginPath(); g.moveTo(0, 0); g.lineTo(-Math.cos(a) * r, Math.sin(a) * r); g.stroke(); } for (let k = 1; k <= 5; k++) { const r2 = (r * k) / 5.6; g.beginPath(); for (let i = 0; i <= n; i++) { const a = (Math.PI / 2) * (i / n), px = -Math.cos(a) * r2, py = Math.sin(a) * r2; if (i === 0) g.moveTo(px, py); else { const pa = (Math.PI / 2) * ((i - 0.5) / n); g.quadraticCurveTo(-Math.cos(pa) * r2 * 0.82, Math.sin(pa) * r2 * 0.82, px, py); } } g.stroke(); } g.restore(); }
// Old executive office (wood panels, red monitor glow). o = { year:'1995', money:[from,to], crashAt, ringAt:[a,b] }. Draw the character with
// office1995Back(t) -> your character (e.g. bankerSeated(930,t)) -> office1995Front(t, o).
export function office1995Back(t, o = {}) {
  let gr = g.createLinearGradient(0, 0, 0, 760); gr.addColorStop(0, '#3a2620'); gr.addColorStop(1, '#4c3127'); g.fillStyle = gr; g.fillRect(-300, -200, 2520, 1000);
  for (let x = -260; x < 2220; x += 210) { rr(x + 14, 40, 182, 330, 6); g.fillStyle = 'rgba(255,220,180,.035)'; g.fill(); g.lineWidth = 3.5; g.strokeStyle = '#26170f'; g.stroke(); rr(x + 14, 400, 182, 250, 6); g.fill(); g.stroke(); }
  line([[-300, 385], [2220, 385]], 5, '#26170f'); g.fillStyle = '#1d1310'; g.fillRect(-300, -200, 2520, 215); line([[-300, 15], [2220, 15]], OUT);
  gr = g.createLinearGradient(0, 760, 0, 1200); gr.addColorStop(0, '#2a1b17'); gr.addColorStop(1, '#140d0b'); g.fillStyle = gr; g.fillRect(-300, 760, 2520, 500); line([[-300, 760], [2220, 760]], OUT);
  const fl = 1 + Math.sin(t * 23) * 0.02; for (const x of [300, 960, 1620]) { glow(x, 90, 260 * fl, 'rgba(255,190,110,.32)'); g.save(); g.globalCompositeOperation = 'lighter'; const cg = g.createLinearGradient(0, 70, 0, 760); cg.addColorStop(0, 'rgba(255,200,120,.12)'); cg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = cg; g.beginPath(); g.moveTo(x - 40, 68); g.lineTo(x + 40, 68); g.lineTo(x + 250, 760); g.lineTo(x - 250, 760); g.closePath(); g.fill(); g.restore(); }
  part(41, () => { const x = 110, y = 150, w = 300, h = 610; rr(x - 18, y - 18, w + 36, h + 18, 4); fs('#2b1a14'); for (const dx of [0, w / 2]) { rr(x + dx + 6, y, w / 2 - 12, h, 4); fs('#5a3626', 5); rr(x + dx + 34, y + 40, w / 2 - 68, 240, 4); fs('rgba(150,170,180,.55)', 4); rr(x + dx + 34, y + 330, w / 2 - 68, 230, 4); fs('#4a2c1f', 4); } rr(x + w / 2 - 26, y + 300, 12, 70, 6); fs('#d9a640', 4); rr(x + w / 2 + 14, y + 300, 12, 70, 6); fs('#d9a640', 4); });
  part(42, () => { const x = 470, y = 200; line([[x + 80, y - 30], [x + 80, y - 6]], 4); ell(x + 80, y - 32, 7, 7); fs('#c9c2b4', 3); rr(x, y, 160, 215, 6); fs('#efe6d2'); rr(x, y, 160, 58, 6); fs('#c2412f'); g.font = `44px "${F.hand}"`; g.fillStyle = '#fbe9d6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.month || 'THG 1', x + 80, y + 30); g.font = `72px "${F.hand}"`; g.fillStyle = INK; g.fillText(o.year || '1995', x + 80, y + 118); for (let r = 0; r < 3; r++) line([[x + 22, y + 168 + r * 14], [x + 138, y + 168 + r * 14]], 2, 'rgba(0,0,0,.25)'); });
  part(43, () => { const x = 780, y = 70, w = 330, h = 290; rr(x, y, w, h, 4); fs('#8a6326', 7); rr(x + 20, y + 20, w - 40, h - 40, 2); fs('#2c2a33', 4); const cx = x + w / 2, cy = y + h / 2 + 16; ell(cx, cy, 92, 66); fs('#e88aa0', 6); ell(cx + 88, cy - 6, 22, 24); fs('#e88aa0', 5); g.beginPath(); g.moveTo(cx + 40, cy - 56); g.lineTo(cx + 58, cy - 92); g.lineTo(cx + 64, cy - 54); fs('#e88aa0', 5); for (const lx of [-56, -20, 22, 56]) { rr(cx + lx - 10, cy + 52, 20, 30, 5); fs('#e88aa0', 5); } rr(cx - 30, cy - 66, 50, 9, 4); fs(INK, 0); ell(cx + 50, cy - 18, 6, 6); g.fillStyle = INK; g.fill(); line([[cx - 30, cy - 60], [cx - 12, cy - 26], [cx - 30, cy - 4], [cx - 8, cy + 22], [cx - 22, cy + 56]], 5); cobweb(x + w - 20, y + 20, 95, 1); const sp = Math.sin(t * 1.5) * 10; line([[x + w - 62, y + 20], [x + w - 62, y + 70 + sp]], 1.5, 'rgba(235,235,240,.7)'); ell(x + w - 62, y + 76 + sp, 7, 8); fs(INK, 0); });
  part(44, () => { const x = 1170, y = 110; rr(x, y, 150, 190, 4); fs('#8a6326', 6); rr(x + 14, y + 14, 122, 162, 2); fs('#ece4d0', 4); for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(x + 28, y + 40 + i * 19); for (let k = 0; k < 8; k++) g.lineTo(x + 28 + k * 13, y + 40 + i * 19 + (k % 2 ? 4 : -2)); g.lineWidth = 2.5; g.strokeStyle = '#3b3540'; g.stroke(); } });
  part(46, () => { const x = 1560, y = 250; ell(x, y, 48, 48); fs('#efe6d2'); const a = t * 2.2; line([[x, y], [x + Math.sin(a) * 34, y - Math.cos(a) * 34]], 3, '#b43a2a'); line([[x, y], [x + 16, y + 18]], 5); });
  for (const [x, i] of [[300, 0], [960, 1], [1620, 2]]) part(50 + i, () => { line([[x, 15], [x, 40]], 4); g.beginPath(); g.moveTo(x - 46, 62); g.quadraticCurveTo(x, 10, x + 46, 62); g.closePath(); fs('#c8962f', 5); ell(x, 64, 46, 8); fs('#ffe9a8', 4); });
  part(47, () => { const x = 1400, y = 520; rr(x, y, 420, 240, 4); fs('#3b2419'); line([[x, y + 70], [x + 420, y + 70]], 4); rr(x + 120, y - 170, 190, 150, 12); fs('#d7d0bf'); rr(x + 140, y - 152, 150, 108, 8); fs('#1e2a2e', 4); rr(x + 90, y - 24, 250, 26, 6); fs('#d7d0bf', 5); });
  part(60, () => { rr(800, 430, 240, 300, 40); fs('#5a1f24'); });
  part(48, () => { g.beginPath(); g.moveTo(240, 690); g.lineTo(1680, 690); g.lineTo(1720, 735); g.lineTo(200, 735); g.closePath(); fs('#5b3524'); });
}
export function office1995Front(t, o = {}) {
  const [m0, m1] = o.money || [1000000, 0], crash = o.crashAt ?? 3.4, ring = o.ringAt || [3.6, 5.2];
  part(70, () => { const x = 1140, y = 470; rr(x, y, 300, 220, 16); fs('#e6d8c6'); rr(x + 24, y + 22, 252, 160, 10); fs('#1a0b0d', 5); g.save(); rr(x + 24, y + 22, 252, 160, 10); g.clip();
    const p = clamp(t / (crash - 0.2)); g.beginPath(); const r = rng(5); let px = x + 36, py = y + 70; g.moveTo(px, py); for (let i = 1; i <= Math.floor(24 * p); i++) { px = x + 36 + i * 9.5; py = y + 70 + i * 3.4 + (r() - 0.5) * 18; g.lineTo(px, py); } g.lineWidth = 4; g.strokeStyle = '#ff4a4a'; g.stroke();
    const val = Math.round(lerp(m0, m1, ease.inOut(clamp(t / crash)))); g.font = `900 34px "${F.comic}"`; g.fillStyle = '#ff6b5e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(val.toLocaleString('vi-VN') + ' ĐỒNG', x + 150, y + 56);
    for (let k = 0; k < 160; k += 4) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 24, y + 22 + k, 252, 2); } g.restore();
    rr(x + 120, y + 220, 60, 22, 4); fs('#cbbca8', 5); rr(x + 40, y + 238, 220, 30, 8); fs('#e6d8c6', 5); });
  part(71, () => { for (let i = 0; i < 5; i++) { rr(440 + i * 2, 664 - i * 7, 150, 18, 3); fs(i % 2 ? '#ece4d0' : '#e2d8c0', 4); } });
  part(72, () => { rr(640, 630, 64, 66, 8); fs('#e9e2d6', 5); g.beginPath(); g.arc(710, 662, 18, -1.2, 1.2); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); ell(672, 632, 30, 8); fs('#5a3420', 4); for (let k = 0; k < 2; k++) { const of = (t * 30 + k * 40) % 80; g.save(); g.globalAlpha = 1 - of / 80; line([[660 + k * 20, 620 - of], [666 + k * 20, 600 - of], [660 + k * 20, 580 - of]], 3, 'rgba(240,240,240,.7)'); g.restore(); } });
  part(73, () => { const rg = t > ring[0] && t < ring[1]; g.save(); g.translate(rg ? Math.sin(t * 70) * 4 : 0, 0); g.beginPath(); g.moveTo(1490, 700); g.lineTo(1500, 650); g.lineTo(1620, 650); g.lineTo(1630, 700); g.closePath(); fs('#262229'); ell(1560, 676, 24, 16); fs('#d9d2c2', 4); g.save(); g.translate(0, rg ? -Math.abs(Math.sin(t * 35)) * 10 : 0); rr(1480, 624, 160, 30, 14); fs('#262229'); g.restore(); g.restore(); if (rg) for (const [dx, rot] of [[-110, -0.4], [120, 0.4]]) { g.save(); g.translate(1560 + dx, 600); g.rotate(rot); line([[0, -30], [0, 30]], 4, '#ffe58a'); line([[-14, -24], [-14, 22]], 4, '#ffe58a'); g.restore(); } });
  part(49, () => { rr(200, 733, 1520, 34, 4); fs('#4a2a1c'); for (const x of [300, 1440]) { g.beginPath(); g.moveTo(x, 767); g.lineTo(x + 180, 767); g.lineTo(x + 160, 920); g.lineTo(x + 20, 920); g.closePath(); fs('#3a2116'); } g.beginPath(); g.moveTo(480, 767); g.lineTo(1440, 767); g.lineTo(1440, 800); g.lineTo(480, 800); g.closePath(); fs('#33201a', 5); });
  const fl = 0.85 + Math.sin(t * 17) * 0.05 + (Math.floor(t * 6) % 2 && t > crash ? 0.15 : 0); glow(1290, 560, 520, 'rgba(255,40,40,.42)', fl); glow(1290, 560, 200, 'rgba(255,80,80,.35)', fl);
  const r = rng(9); for (let i = 0; i < 60; i++) { const x = (r() * 1920 + t * (10 + r() * 20)) % 1920, y = r() * 700 + Math.sin(t + i) * 20 + 60; g.fillStyle = `rgba(255,215,160,${0.15 + r() * 0.3})`; g.beginPath(); g.arc(x, y, 1.5 + r() * 2, 0, 7); g.fill(); }
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(255,170,150,.35)'; g.fillRect(-300, -200, 2520, 1480); g.restore();
}
// Dark keynote stage with a big screen. o = { big:'AI', sub:'', spots:[x,...] }
export function keynote(t, o = {}) {
  let gr = g.createLinearGradient(0, 0, 0, 1080); gr.addColorStop(0, '#07090d'); gr.addColorStop(1, '#11141b'); g.fillStyle = gr; g.fillRect(-200, -200, 2320, 1480);
  rr(260, 80, 1400, 560, 24); fs('#0b1210', 8); g.save(); rr(276, 96, 1368, 528, 18); g.clip(); const sg = g.createRadialGradient(960, 360, 40, 960, 360, 760); sg.addColorStop(0, '#1d4a22'); sg.addColorStop(1, '#08130b'); g.fillStyle = sg; g.fillRect(276, 96, 1368, 528);
  for (let i = 0; i < 14; i++) line([[320 + i * 100, 96], [320 + i * 100, 624]], 1.5, 'rgba(110,255,120,.12)'); for (let j = 0; j < 6; j++) line([[276, 140 + j * 90], [1644, 140 + j * 90]], 1.5, 'rgba(110,255,120,.12)');
  const sx = o.textX ?? 960; if (o.big) { g.font = `italic 900 150px "${F.comic}"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.save(); g.shadowColor = 'rgba(120,255,110,.9)'; g.shadowBlur = 40; g.fillStyle = '#b8ffb0'; g.fillText(o.big, sx, 340); g.restore(); }
  if (o.sub) { g.font = `44px "${F.hand}"`; g.fillStyle = 'rgba(220,255,220,.8)'; g.textAlign = 'center'; g.fillText(o.sub, sx, 450); } g.restore();
  gr = g.createLinearGradient(0, 760, 0, 1080); gr.addColorStop(0, '#1a1d26'); gr.addColorStop(1, '#0b0c11'); g.fillStyle = gr; g.fillRect(-200, 760, 2320, 520); line([[-200, 760], [2120, 760]], 6);
  const spots = o.spots || [600]; g.save(); g.globalCompositeOperation = 'lighter'; const cone = g.createLinearGradient(0, 0, 0, 950); cone.addColorStop(0, 'rgba(255,240,210,.22)'); cone.addColorStop(1, 'rgba(255,240,210,.04)'); g.fillStyle = cone; for (const X of spots) { g.beginPath(); g.moveTo(X - 50, -10); g.lineTo(X + 50, -10); g.lineTo(X + 280, 950); g.lineTo(X - 280, 950); g.closePath(); g.fill(); } g.restore();
  for (const X of spots) { ell(X, 930, 280, 56); g.fillStyle = 'rgba(255,240,210,.16)'; g.fill(); }
  return { GY: 930 };
}

// Nhóc holding something heavy overhead in panic: hands go to hL / hR (screen points, e.g. projected 3D prop corners).
// glow = colour of the light hitting his face from above (null for none)
export function kidHoldUp(hL, hR, t, glowCol = 'rgba(110,255,90,.55)') {
  const SK = '#f6d39b', TEE = '#ee5a36', shake = Math.sin(t * 38) * (t > 1.1 ? 2.5 : 1);
  const hx = (hL[0] + hR[0]) / 2 - 30 + shake, hy = Math.max(hL[1], hR[1]) + 190;
  g.beginPath(); g.moveTo(hx - 120, hy + 340); g.bezierCurveTo(hx - 130, hy + 180, hx - 100, hy + 110, hx - 40, hy + 100); g.lineTo(hx + 60, hy + 100); g.bezierCurveTo(hx + 120, hy + 110, hx + 150, hy + 180, hx + 140, hy + 340); g.closePath(); fs(TEE, 7);
  g.font = `italic 900 90px "${F.comic}"`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff6e0'; g.lineWidth = 7; g.strokeStyle = INK; g.strokeText('?', hx + 10, hy + 220); g.fillText('?', hx + 10, hy + 220);
  const a1 = ikArm(hx - 96, hy + 140, hL[0], hL[1] + 8, 170, 170, 1, 12), a2 = ikArm(hx + 104, hy + 140, hR[0], hR[1] + 8, 170, 170, -1, 12);
  const R = 118;
  g.beginPath(); g.moveTo(hx - 116, hy - 10); g.quadraticCurveTo(hx - 126, hy - 110, hx - 30, hy - 124); g.lineTo(hx - 44, hy - 176); g.lineTo(hx + 2, hy - 130); g.lineTo(hx + 18, hy - 186); g.lineTo(hx + 40, hy - 126); g.lineTo(hx + 86, hy - 160); g.lineTo(hx + 82, hy - 104); g.quadraticCurveTo(hx + 124, hy - 70, hx + 116, hy - 18); g.closePath(); fs('#2b2421', 7);
  ell(hx, hy, R, R); g.fillStyle = SK; g.fill();
  g.save(); ell(hx, hy, R, R); g.clip(); g.beginPath(); g.arc(hx, hy, R + 2, 0, 7); g.arc(hx - 20, hy + 18, R * 0.98, 0, 7, true); g.fillStyle = 'rgba(120,60,30,.2)'; g.fill('evenodd');
  if (glowCol) { const gl = g.createRadialGradient(hx + 60, hy - 120, 10, hx + 60, hy - 120, R * 1.6); gl.addColorStop(0, glowCol); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(hx - R, hy - R, R * 2, R * 2); } g.restore();
  ell(hx, hy, R, R); fs(null, 7);
  g.beginPath(); g.moveTo(hx - 110, hy - 40); g.quadraticCurveTo(hx - 96, hy - 122, hx + 4, hy - 120); g.quadraticCurveTo(hx + 96, hy - 118, hx + 114, hy - 36); g.quadraticCurveTo(hx + 74, hy - 76, hx + 40, hy - 60); g.lineTo(hx + 30, hy - 84); g.quadraticCurveTo(hx - 14, hy - 54, hx - 54, hy - 68); g.quadraticCurveTo(hx - 80, hy - 54, hx - 110, hy - 40); g.closePath(); fs('#2b2421', 7);
  for (const ex of [-32, 34]) { ell(hx + ex, hy - 2, 24, 30); fs('#fff', 5); ell(hx + ex + 4, hy - 14, 7, 8); g.fillStyle = INK; g.fill(); }
  line([[hx - 60, hy - 46], [hx - 14, hy - 56]], 7); line([[hx + 12, hy - 56], [hx + 60, hy - 46]], 7);
  const m = 0.7 + Math.abs(Math.sin(t * 9)) * 0.3; ell(hx + 4, hy + 62, 30, 24 * m); fs('#7a2e2a', 6); ell(hx + 4, hy + 72, 18, 8 * m); g.fillStyle = '#e8776c'; g.fill();
  sweat(hx + 96, hy - 50, t * 1.7); sweat(hx - 104, hy - 50, t * 1.7, 1);
  for (const h of [a1, a2]) { ell(h[0], h[1], 22, 18); fs(SK, 6); }
}

// ---------------- camera & effects (v0.5) ----------------
// camFx(t, o): wraps the scene in a camera move. Call before drawing, call the returned end() after.
//   o = { cx, cy (zoom centre, default 960,540), drift: [z0, z1, dur] slow push-in,
//         punch: [[t0, amount, hold]] quick zoom-in that overshoots then settles (amount 0.15 = +15%), held for `hold` s then eases back,
//         shake: [[t0, dur, amp]] decaying screen shake (amp in px) }
export function camFx(t, o = {}) { const cx = o.cx ?? 960, cy = o.cy ?? 540; let z = 1, dx = 0, dy = 0, r = 0;
  if (o.drift) { const [z0, z1, d] = o.drift; z *= lerp(z0, z1, ease.inOut(clamp(t / d))); }
  for (const [t0, amt, hold = 1.2] of o.punch || []) { if (t < t0) continue; const a = ease.outBack(clamp((t - t0) / 0.22)), b = ease.inOut(clamp((t - t0 - hold) / 0.45)); z *= 1 + amt * a * (1 - b); }
  for (const [t0, d, amp] of o.shake || []) { const k = (t - t0) / d; if (k < 0 || k > 1) continue; const f = (1 - k) ** 2 * amp; dx += Math.sin(t * 83) * f + Math.sin(t * 47) * f * 0.5; dy += Math.cos(t * 71) * f; r += Math.sin(t * 59) * f * 0.0008; }
  g.save(); g.translate(cx + dx, cy + dy); g.rotate(r); g.scale(z, z); g.translate(-cx, -cy);
  return () => g.restore(); }

// lineChart(x, y, w, h, data, p, o): outlined toon chart that draws itself (p 0..1). data = [{ label, v }].
//   o = { title, color, max, unit, highlightLast: true, card: true } — dots pop as the line reaches them, last value pops as comic text.
export function lineChart(x, y, w, h, data, p = 1, o = {}) { const col = o.color || '#2e9d4a', max = o.max ?? Math.max(...data.map(d => d.v)) * 1.15, n = data.length;
  g.save(); g.translate(x, y);
  if (o.card !== false) { rr(-40, -h - 110, w + 80, h + 190, 22); fs('#fbf7ec'); }
  if (o.title) { g.font = `900 ${Math.round(h * 0.11)}px "${F.comic}"`; g.fillStyle = INK; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillText(o.title, 0, -h - 40); }
  line([[0, 0], [w, 0]], 5); for (let i = 1; i <= 3; i++) line([[0, -h * i / 3.3], [w, -h * i / 3.3]], 2, 'rgba(20,18,24,.15)', [10, 10]);
  const pts = data.map((d, i) => [w * (n === 1 ? 0.5 : i / (n - 1)), -h * d.v / max]);
  g.font = `700 ${Math.round(h * 0.075)}px "${F.comic}"`; g.textAlign = 'center'; g.fillStyle = 'rgba(20,18,24,.7)'; data.forEach((d, i) => g.fillText(d.label, pts[i][0], h * 0.11));
  // progressive line by length
  const seg = []; let L = 0; for (let i = 1; i < n; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
  let left = clamp(p) * L + 1e-6; const shown = [pts[0]]; let reached = 0;
  for (let i = 1; i < n && left > 0; i++) { const k = Math.min(1, left / seg[i - 1]); shown.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); if (k >= 0.999) reached = i; left -= seg[i - 1]; }
  if (p > 0 && shown.length > 1) { g.save(); g.beginPath(); g.moveTo(shown[0][0], 0); shown.forEach(q => g.lineTo(...q)); g.lineTo(shown[shown.length - 1][0], 0); g.closePath(); g.fillStyle = col + '33'; g.fill(); g.restore(); line(shown, 14); line(shown, 8, col); }
  for (let i = 0; i <= reached && p > 0; i++) { const last = i === n - 1 && o.highlightLast !== false, sc = 1; ell(pts[i][0], pts[i][1], last ? 16 : 11, last ? 16 : 11); fs(last ? '#ffd23f' : '#fff', 5); }
  if (reached === n - 1 && o.highlightLast !== false) { const d = data[n - 1]; g.restore(); comic(`${d.v}${o.unit || ''}`, x + pts[n - 1][0], y + pts[n - 1][1] - 70, h * 0.2, o.popP ?? clamp((p - 0.9) / 0.1), o.popColor || '#ffd23f'); return; }
  g.restore(); }

// pageTurn(p, o): paper page-turn transition. p 0→1 a sheet sweeps in from the right and covers the frame; p 1→2 it peels off to the left.
//   Call it LAST in the outgoing shot (p = 0..1 over its final ~0.5 s) and FIRST-over-content in the incoming shot (p = 1..2).
export function pageTurn(p, o = {}) { if (p <= 0 || p >= 2) return; const W = o.W || 1920, H = o.H || 1080, col = o.color || '#f3ead6';
  const k = p <= 1 ? ease.inOut(p) : ease.inOut(p - 1), edge = p <= 1 ? lerp(W + 260, -260, k) : lerp(W + 260, -260, k), curl = 140 * Math.sin(Math.PI * k);
  g.save(); g.beginPath();
  if (p <= 1) { g.moveTo(W + 10, -10); g.lineTo(edge + curl * 0.4, -10); g.quadraticCurveTo(edge - curl, H / 2, edge + curl * 0.4, H + 10); g.lineTo(W + 10, H + 10); }
  else { g.moveTo(-10, -10); g.lineTo(edge + curl * 0.4, -10); g.quadraticCurveTo(edge - curl, H / 2, edge + curl * 0.4, H + 10); g.lineTo(-10, H + 10); }
  g.closePath(); g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 40; g.shadowOffsetX = p <= 1 ? -20 : 20; g.fillStyle = col; g.fill(); g.restore();
  g.save(); g.clip(); const r = rng(9); for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(120,90,50,.07)'; g.fillRect(r() * W, r() * H, 3, 2); } g.restore();
  g.lineWidth = OUT; g.strokeStyle = INK; g.stroke();
  // curl: a soft shaded band along the leading edge
  g.save(); g.beginPath(); g.moveTo(edge + curl * 0.4, -10); g.quadraticCurveTo(edge - curl, H / 2, edge + curl * 0.4, H + 10); g.lineTo(edge + curl * 0.4 + (p <= 1 ? 70 : -70), H + 10); g.quadraticCurveTo(edge - curl + (p <= 1 ? 70 : -70), H / 2, edge + curl * 0.4 + (p <= 1 ? 70 : -70), -10); g.closePath();
  const gr = g.createLinearGradient(edge - curl * 0.3, 0, edge - curl * 0.3 + (p <= 1 ? 90 : -90), 0); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(120,90,50,0)'); g.fillStyle = gr; g.fill(); g.restore();
  g.restore(); }

// popIn(p): returns a scale 0..~1.1..1 for elements that should pop in (use with g.scale around their centre).
export const popIn = p => p <= 0 ? 0 : ease.outBack(clamp(p));

// bgImage(key, o): draw a preloaded image (config.images) as a full-frame background, cover-fit, with a slow camera.
//   o = { zoom: [z0, z1, dur] (default slight push-in), pan: [dx, dy] px over dur, cx, cy, t, dim: 0..1 darken, tint: 'rgba(...)' }
export function bgImage(key, o = {}) { const im = E.img && E.img[key]; if (!im) { g.fillStyle = '#20232c'; g.fillRect(0, 0, 1920, 1080); return; }
  const t = o.t || 0, [z0, z1, d] = o.zoom || [1.0, 1.06, 8], k = ease.inOut(clamp(t / d)), z = lerp(z0, z1, k), [px, py] = o.pan || [0, 0];
  const sc = Math.max(1920 / im.width, 1080 / im.height) * z, w = im.width * sc, h = im.height * sc, cx = o.cx ?? 0.5, cy = o.cy ?? 0.5;
  g.save(); g.imageSmoothingQuality = 'high'; g.drawImage(im, 960 - w * cx + px * k, 540 - h * cy + py * k, w, h);
  if (o.dim) { g.fillStyle = `rgba(0,0,0,${o.dim})`; g.fillRect(0, 0, 1920, 1080); } if (o.tint) { g.fillStyle = o.tint; g.fillRect(0, 0, 1920, 1080); } g.restore(); }

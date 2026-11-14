// engine/toon-rig.js — the toon cast's OWN rig: front + side views, pose library, walk/run cycles, facial expressions,
// and a data-driven character system. Independent from rig2d.js / rig3d.js (it never imports them).
//
//   import * as TO from '/engine/toon.js'; import * as TR from '/engine/toon-rig.js';
//   TO.use(g, t);
//   TR.character('jensen', 800, 930, 1, { t, view: 'front', pose: TR.posesAt(t, [[0, 'stand'], [1, 'wave']]), expr: 'smile', talk });
//   TR.character('nhoc', x, 930, 1, { t, view: 'side', facing: 1, pose: TR.walk(t * 5.6), expr: 'happy' });
//
// Units: feet at (0,0), up is -y, figure ~560 tall at s=1 (head centre ≈ -430). Front poses use ANGLES in radians:
//   arms aL/aR = [upper, fore]: upper 0 = hanging down, +π/2 = straight out sideways, π = straight up, negative = across the body;
//   fore is relative to the upper arm (+ bends outward/up). legs lL/lR = [thigh, shin] (same convention), tk = thigh length (1, or ~0.35
//   when the thigh points at the camera, e.g. sitting), lean = torso tilt, dy = hip drop (+ = lower), tilt = head tilt.
// Side poses (view:'side', facing +x unless facing:-1): arms aN/aF (near/far) = [upper, fore] with 0 = down, + = forward;
//   legs lN/lF = [thigh, shin] with + = forward; lean (+ = forward), dy.
import { clamp, lerp, ease, E } from './core.js';
import * as TO from './toon.js';
const { INK } = TO;
const G = () => TO.ctx();

// ---------------- pose library (front) ----------------
const D = { lean: 0, dy: 0, tilt: 0, tk: 1, aL: [0.16, 0.06], aR: [0.16, 0.06], lL: [0.05, -0.02], lR: [0.05, -0.02] };
const F = (o) => ({ ...D, ...o });
export const POSES = {
  stand: F({}),
  relaxed: F({ aL: [0.22, 0.25], aR: [0.12, 0.05], lL: [0.12, -0.08], tilt: 0.04 }),
  handsHips: F({ aL: [1.0, -1.65], aR: [1.0, -1.65] }),
  wave: F({ aR: [2.3, 0.5], tilt: 0.05 }),
  waveBoth: F({ aL: [2.3, 0.5], aR: [2.3, 0.5] }),
  point: F({ aR: [1.55, 0.05], tilt: 0.06 }),
  pointUp: F({ aR: [2.75, 0.15], tilt: -0.06 }),
  pointDown: F({ aR: [0.75, -0.2], tilt: 0.12 }),
  explain: F({ aL: [0.5, 1.95], aR: [0.5, 1.95] }),
  present: F({ aR: [1.2, 0.5], aL: [0.2, 0.1], tilt: 0.06 }),
  shrug: F({ aL: [0.85, 1.4], aR: [0.85, 1.4], tilt: 0.12, dy: 2 }),
  cheer: F({ aL: [2.75, 0.2], aR: [2.75, 0.2], lL: [0.18, -0.05], lR: [0.18, -0.05] }),
  crossArms: F({ aL: [-0.15, -1.45], aR: [-0.2, -1.37], lL: [0.1, -0.05], lR: [0.1, -0.05] }),
  handsBehind: F({ aL: [0.1, 0.0, 1], aR: [0.1, 0.0, 1] }),
  think: F({ aR: [-0.1, -2.45], aL: [-0.15, -1.45], tilt: 0.1 }),
  facepalm: F({ aR: [-0.35, -2.6], tilt: 0.22, dy: 6 }),
  handsOnHead: F({ aL: [2.5, 1.44], aR: [2.5, 1.44] }),
  shocked: F({ aL: [1.3, 1.6], aR: [1.3, 1.6], lL: [0.22, -0.1], lR: [0.22, -0.1], dy: -6 }),
  scared: F({ aL: [-0.05, -2.5], aR: [-0.05, -2.5], lL: [0.2, -0.45], lR: [0.2, -0.45], dy: 12, tilt: 0.06 }),
  angry: F({ aL: [0.45, 0.25], aR: [0.45, 0.25], lL: [0.22, -0.05], lR: [0.22, -0.05], lean: 0.04 }),
  sad: F({ aL: [0.05, 0], aR: [0.05, 0], tilt: 0.22, dy: 6, lean: 0.03 }),
  phone: F({ aR: [2.2, 1.88], tilt: 0.1 }),
  holdFront: F({ aL: [0.1, -1.5], aR: [0.1, -1.5] }),
  holdUp: F({ aL: [2.7, 0.6], aR: [2.7, 0.6], lL: [0.18, -0.08], lR: [0.18, -0.08] }),
  sit: F({ tk: 0.35, dy: 52, lL: [0.32, -0.32], lR: [0.32, -0.32], aL: [0.3, -0.6], aR: [0.3, -0.6] }),
  sitThink: F({ tk: 0.35, dy: 52, lL: [0.32, -0.32], lR: [0.32, -0.32], aR: [-0.1, -2.45], aL: [0.3, -1.0], tilt: 0.1 }),
  crouch: F({ tk: 0.6, dy: 40, lL: [0.7, -1.3], lR: [0.7, -1.3], aL: [0.4, -0.4], aR: [0.4, -0.4], lean: 0 }),
  jump: F({ dy: -10, aL: [2.6, 0.3], aR: [2.6, 0.3], lL: [0.45, -1.1], lR: [0.45, -1.1] }),
  fall: F({ lean: 0.5, aL: [2.2, 0.8], aR: [1.4, 1.2], lL: [0.6, -0.2], lR: [-0.1, 0.3], tilt: 0.3 }),
  bow: F({ lean: 0.0, tilt: 0.45, dy: 8, aL: [0.05, 0], aR: [0.05, 0] }),
  victory: F({ aR: [2.6, 0.1], aL: [1.0, -1.65], tilt: -0.05 }),
};
export const POSE_IDS = Object.keys(POSES);

// ---------------- lively motion (v0.5) ----------------
// act(t, keys, o): like posesAt but with overshoot-and-settle (easeOutBack) and follow-through: forearms trail the upper arms.
//   o = { dur: 0.42, overshoot: 1 (0 = none), lag: 0.07 s forearm delay, side: false }
const back = (k, s) => { k = clamp(k); const c1 = 1.70158 * s, c3 = c1 + 1; return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2; };
function actRaw(t, keys, dur, ov, side) { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; const cur = pose(keys[i][1], side); if (i === 0) return cur; const prev = pose(keys[i - 1][1], side); const k = (t - keys[i][0]) / dur; return k < 1 ? mixP(prev, cur, back(k, ov)) : cur; }
export function act(t, keys, o = {}) { const dur = o.dur ?? 0.42, ov = o.overshoot ?? 1, lag = o.lag ?? 0.07, side = !!o.side;
  const P = actRaw(t, keys, dur, ov, side); if (!lag) return P; const L = actRaw(t - lag, keys, dur, ov * 1.3, side), out = { ...P };
  for (const k of side ? ['aN', 'aF'] : ['aL', 'aR']) if (P[k] && L[k]) out[k] = [P[k][0], L[k][1], P[k][2]];
  return out; }
// voice(t): speech drivers from the narration. Uses timeline/envelope.json (tools/envelope.py) when present, else words.json.
//   returns { talk 0..1 (mouth), brow 0..1 (raise on stressed syllables), energy 0..1 (smoothed loudness) }
export function voice(t, o = {}) { const env = o.env || E.env;
  if (env && env.v && env.v.length) { const f = t * env.fps, i = Math.floor(f), a = env.v[i] ?? 0, b = env.v[i + 1] ?? a, v = lerp(a, b, f - i);
    let brow = 0; for (const st of env.stress || []) { const d = t - st; if (d > -0.05 && d < 0.6) brow = Math.max(brow, d < 0 ? 1 + d * 20 : Math.exp(-d * 5)); }
    let en = 0, n = 0; for (let k = -6; k <= 6; k++) { en += env.v[i + k] ?? 0; n++; }
    return { talk: v > 0.08 ? clamp(v * 1.15) : 0, brow: clamp(brow), energy: clamp(en / n * 1.3) }; }
  const W = E.words || []; for (const w of W) if (t >= w.start && t <= w.end) { const d = t - w.start, stressed = (w.word || w.text || '').replace(/[^\p{L}]/gu, '').length >= 6;
    return { talk: 0.3 + 0.55 * Math.abs(Math.sin(d * 15)), brow: stressed ? Math.exp(-d * 5) : 0, energy: 0.7 }; }
  return { talk: 0, brow: 0, energy: 0 }; }
// speak(pose, t, v): head nods/tilts and body bobs that follow the voice. Pass the result as pose, and v.talk / v.brow to character().
export function speak(P, t, v = voice(t), amt = 1) { const e = v.energy * amt;
  return { ...P, nod: (P.nod || 0) + (Math.sin(t * 7.3) * 3 * v.talk - v.brow * 5) * amt, tilt: (P.tilt || 0) + (Math.sin(t * 2.1) * 0.05 * e - v.brow * 0.03 * amt), dy: (P.dy || 0) + Math.sin(t * 4.2) * 2 * e, lean: (P.lean || 0) + Math.sin(t * 1.3) * 0.02 * e }; }
// side-view pose library (facing +x)
const DS = { lean: 0, dy: 0, tilt: 0, aN: [0.08, 0.1], aF: [-0.06, 0.1], lN: [0.05, -0.05], lF: [-0.05, -0.05] };
const FS = (o) => ({ ...DS, ...o });
export const SIDE_POSES = {
  stand: FS({}),
  point: FS({ aN: [1.5, 0.0], tilt: 0.05 }),
  hold: FS({ aN: [0.9, 0.7], aF: [0.8, 0.8] }),
  reach: FS({ aN: [1.9, 0.1], aF: [1.6, 0.2], lean: 0.12 }),
  sit: FS({ dy: 52, tk: 1.9, lN: [1.5, -1.5], lF: [1.45, -1.45], aN: [0.5, 0.6], aF: [0.45, 0.6] }),
  sad: FS({ lean: 0.18, tilt: 0.3, dy: 6 }),
  jump: FS({ dy: -10, aN: [2.4, 0.3], aF: [2.2, 0.4], lN: [0.9, -1.5], lF: [0.3, -1.2] }),
  think: FS({ aN: [0.6, 2.4], tilt: 0.1 }),
};
export const SIDE_POSE_IDS = Object.keys(SIDE_POSES);

function mixP(a, b, k) { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) { const x = a[key] ?? b[key], y = b[key] ?? a[key]; o[key] = Array.isArray(x) ? x.map((v, i) => lerp(v, y[i] ?? v, i === 2 ? (k < 0.5 ? 0 : 1) : k)) : lerp(x, y, k); } return o; }
export const pose = (name, side = false) => typeof name === 'object' ? name : ((side ? SIDE_POSES : POSES)[name] || (side ? SIDE_POSES.stand : POSES.stand));
export const blend = (a, b, k, side = false) => mixP(pose(a, side), pose(b, side), ease.inOut(clamp(k)));
// posesAt(t, [[0,'stand'],[1.2,'wave'],[3,'point']], blend=0.3, side=false): hold each pose, blend into the next
export function posesAt(t, keys, bl = 0.3, side = false) { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; const cur = pose(keys[i][1], side); if (i === 0 && t < keys[0][0]) return cur; const prev = i > 0 ? pose(keys[i - 1][1], side) : cur; const k = clamp((t - keys[i][0]) / bl); return i > 0 && k < 1 ? mixP(prev, cur, ease.inOut(k)) : cur; }
// idle: tiny breathing + sway so nobody freezes
export function breathe(p, t, amt = 1, seed = 0) { const b = Math.sin(t * 2.2 + seed) * amt; return { ...p, dy: (p.dy || 0) + b * 1.5, tilt: (p.tilt || 0) + Math.sin(t * 0.9 + seed) * 0.015 * amt }; }
// front walk/run in place (move x yourself): phase = t * 2π * steps/s
export function walkFront(phase, o = {}) { const run = !!o.run, A = run ? 1.6 : 1, l = s => Math.max(0, Math.sin(phase + s)); const bob = Math.abs(Math.sin(phase)) * (run ? 8 : 4);
  return F({ dy: -bob, tilt: Math.sin(phase) * 0.03, aL: [0.2 + 0.18 * A * Math.sin(phase), 0.25 + (run ? 1.2 : 0.2)], aR: [0.2 - 0.18 * A * Math.sin(phase), 0.25 + (run ? 1.2 : 0.2)],
    lL: [0.06 + 0.12 * l(0) * A, -0.9 * l(0) * A], lR: [0.06 + 0.12 * l(Math.PI) * A, -0.9 * l(Math.PI) * A], lean: run ? 0.02 : 0 }); }
// side walk/run (true profile). phase = t * 2π * cycles/s ; move x at ~150 units/s (walk) or ~420 (run) at s=1
export function walk(phase, o = {}) { const run = !!o.run, sw = run ? 0.75 : 0.45, s = Math.sin(phase), c = Math.cos(phase);
  const leg = (ph) => { const a = Math.sin(ph) * sw; const bend = Math.max(0, -Math.cos(ph)) * (run ? 1.6 : 0.9); return [a, -bend]; };
  return FS({ lean: run ? 0.22 : 0.04, dy: -Math.abs(c) * (run ? 10 : 5), tilt: run ? 0.08 : 0, lN: leg(phase), lF: leg(phase + Math.PI),
    aN: [-s * (run ? 0.9 : 0.45), run ? 1.6 : 0.3], aF: [s * (run ? 0.9 : 0.45), run ? 1.6 : 0.3] }); }
export const run = (phase) => walk(phase, { run: true });

// ---------------- expressions ----------------
export const EXPRESSIONS = ['cheer', 'chat', 'neutral', 'smile', 'happy', 'grin', 'laugh', 'sad', 'cry', 'angry', 'scared', 'shocked', 'surprised', 'worried', 'smug', 'thinking', 'sleepy', 'confused', 'determined', 'wink', 'love'];
const EX = {
  neutral: { eyes: 'open', brow: 0, mouth: 'flat' }, cheer: { eyes: 'closedUp', brow: 0.1, mouth: 'open' }, chat: { eyes: 'open', brow: 0.1, mouth: 'open' }, smile: { eyes: 'open', brow: 0, mouth: 'smile' }, happy: { eyes: 'closedUp', brow: 0.1, mouth: 'smile' },
  grin: { eyes: 'open', brow: 0.1, mouth: 'grin' }, laugh: { eyes: 'closedUp', brow: 0.2, mouth: 'laugh' }, sad: { eyes: 'open', brow: -1, mouth: 'frown', droop: 1 },
  cry: { eyes: 'closedDown', brow: -1, mouth: 'wail', tears: 1 }, angry: { eyes: 'open', brow: 1, mouth: 'teeth' }, scared: { eyes: 'wide', brow: -1, mouth: 'wavy', sweat: 1 },
  shocked: { eyes: 'wide', brow: -0.4, mouth: 'O' }, surprised: { eyes: 'wide', brow: 0.6, mouth: 'o' }, worried: { eyes: 'open', brow: -1, mouth: 'wavy', sweat: 1 },
  smug: { eyes: 'half', brow: 0.3, mouth: 'smirk' }, thinking: { eyes: 'lookUp', brow: 0.4, mouth: 'side' }, sleepy: { eyes: 'line', brow: 0, mouth: 'o', zz: 1 },
  confused: { eyes: 'open', brow: 'oneUp', mouth: 'squiggle' }, determined: { eyes: 'open', brow: 0.8, mouth: 'flatHard' }, wink: { eyes: 'wink', brow: 0.2, mouth: 'smile' },
  love: { eyes: 'heart', brow: 0, mouth: 'smile' },
};
// front face at head centre (0,0). spec.eyes: 'dot' (small dots, adults) | 'big' (white ovals, kids). talk 0..1 overrides the mouth.

// wide, warm smiles for caricatures (spec.smile = 'closed' | 'teeth' | 'big'), used by expressions with mouth smile/grin/laugh
function wideSmile(kind, my, sk) { const g = G(), cr = TO.shade(sk, -0.28);
  const tuck = () => { TO.curve([-44, my - 10], [-48, my - 2], [-42, my + 4], 3.5); TO.curve([46, my - 10], [50, my - 2], [44, my + 4], 3.5);
    TO.curve([-56, my - 34], [-66, my - 10], [-58, my + 12], 3, cr); TO.curve([58, my - 34], [68, my - 10], [60, my + 12], 3, cr); };
  if (kind === 'closed') { g.beginPath(); g.moveTo(-42, my - 6); g.bezierCurveTo(-20, my + 18, 24, my + 18, 46, my - 6); g.lineWidth = 5; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke();
    TO.curve([-14, my + 20], [2, my + 24], [18, my + 20], 3, cr); tuck(); return; }
  const h = kind === 'big' ? 40 : 28;
  const shape = () => { g.beginPath(); g.moveTo(-42, my - 6); g.bezierCurveTo(-18, my + 4, 22, my + 4, 46, my - 6); g.bezierCurveTo(30, my + h, -26, my + h, -42, my - 6); g.closePath(); };
  shape(); g.fillStyle = '#5e2422'; g.fill();
  g.save(); shape(); g.clip();
  g.fillStyle = '#fbf7f0'; g.beginPath(); g.moveTo(-46, my - 10); g.bezierCurveTo(-18, my + 2, 22, my + 2, 50, my - 10); g.lineTo(50, my + 6); g.bezierCurveTo(22, my + 15, -18, my + 15, -46, my + 6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,110,100,.35)'; g.lineWidth = 2; for (const x of [-18, 2, 22]) { g.beginPath(); g.moveTo(x, my + 2); g.lineTo(x, my + 12); g.stroke(); }
  g.fillStyle = '#e07a70'; g.beginPath(); g.ellipse(2, my + h - 4, 22, 9, 0, 0, 7); g.fill();
  g.restore(); shape(); g.lineWidth = 4.5; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); tuck(); }

// mouth drawn for the 3/4 view (unscaled, shifted toward the facing side; the near corner is short and tucks up into the cheek)
function mouth3q(m, my, tk, e) { const g = G(), cx = 26;
  if (tk > 0.15) { TO.ell(cx, my + 4, 10 + tk * 3, 5 + tk * 12); TO.fs('#7a2e2a', 4.5); TO.ell(cx, my + 10 + tk * 6, 6, 2 + tk * 3); g.fillStyle = '#e8776c'; g.fill(); return; }
  if (m === 'open') { TO.ell(cx, my + 4, 12, 12); TO.fs('#7a2e2a', 4.5); TO.ell(cx, my + 13, 6, 3.6); g.fillStyle = '#e8776c'; g.fill(); return; }
  if (m === 'smile' || m === 'smirk') { TO.curve([cx - 30, my - 2], [cx + 4, my + 14], [cx + 26, my - 8], 4.5); return; }
  if (m === 'grin' || m === 'laugh') { const h = m === 'laugh' ? 30 : 22;
    g.beginPath(); g.moveTo(cx - 34, my - 2); g.quadraticCurveTo(cx + 2, my + 6, cx + 28, my - 10); g.quadraticCurveTo(cx + 8, my + h + 8, cx - 34, my - 2); g.closePath(); TO.fs('#7a2e2a', 4.5);
    g.save(); g.clip(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx - 40, my - 10); g.quadraticCurveTo(cx + 2, my - 2, cx + 34, my - 18); g.lineTo(cx + 34, my + 4); g.quadraticCurveTo(cx + 2, my + 14, cx - 40, my + 8); g.closePath(); g.fill(); g.restore();
    g.beginPath(); g.moveTo(cx - 34, my - 2); g.quadraticCurveTo(cx + 2, my + 6, cx + 28, my - 10); g.quadraticCurveTo(cx + 8, my + h + 8, cx - 34, my - 2); g.closePath(); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke(); return; }
  if (m === 'teeth') { g.beginPath(); g.moveTo(cx - 26, my + 12); g.quadraticCurveTo(cx - 2, my - 2, cx + 20, my + 6); g.quadraticCurveTo(cx - 2, my + 18, cx - 26, my + 12); g.closePath(); TO.fs('#fff', 4.5); TO.line([[cx - 22, my + 9], [cx + 16, my + 7]], 2.5); return; }
  if (m === 'wail') { g.beginPath(); g.moveTo(cx - 26, my + 16); g.quadraticCurveTo(cx - 2, my - 12, cx + 22, my + 12); g.quadraticCurveTo(cx - 2, my + 22, cx - 26, my + 16); g.closePath(); TO.fs('#7a2e2a', 4.5); return; }
  if (m === 'squiggle') { g.beginPath(); g.moveTo(cx - 20, my + 4); g.bezierCurveTo(cx - 10, my - 6, cx, my + 14, cx + 16, my); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); return; }
  if (m === 'side') { TO.line([[cx, my + 6], [cx + 18, my + 2]], 4.5); return; }
  if (m === 'frown') { TO.curve([cx - 26, my + 10], [cx, my - 4], [cx + 20, my + 8], 4.5); return; }
  if (m === 'O') { TO.ell(cx, my + 6, 11, 18); TO.fs('#7a2e2a', 4.5); return; }
  if (m === 'o') { TO.ell(cx, my + 4, 6, 8); TO.fs('#7a2e2a', 4); return; }
  if (m === 'wavy') { g.beginPath(); g.moveTo(cx - 20, my + 4); for (let k = 1; k <= 4; k++) g.lineTo(cx - 20 + k * 9, my + 4 + (k % 2 ? -5 : 3)); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); return; }
  TO.line([[cx - 20, my + 4], [cx + 16, my + 2]], m === 'flatHard' ? 5.5 : 4.5); }
function faceFront(spec, expr, o) {
  const g = G(), e = EX[expr] || EX.neutral, big = spec.eyes === 'big', ex = big ? 36 : 30, ey = big ? 2 : 10, t = o.t || 0;
  if (!o.__mouthOnly) {
  const blink = o.blink ?? (((t + (spec.seed || 0)) % 3.3) > 3.18);
  const eyesType = blink && ['open', 'wide', 'lookUp', 'half'].includes(e.eyes) ? 'line' : e.eyes;
  for (const s of [-1, 1]) { const x = s * ex, y = ey;
    if (eyesType === 'open' || eyesType === 'wide' || eyesType === 'lookUp') { const w = eyesType === 'wide' ? 1.3 : 1, lx = (o.lookX || 0) * 4, ly = eyesType === 'lookUp' ? -6 : (o.lookY || 0) * 4;
      if (big) { TO.ell(x, y, 15 * w, 19 * w); TO.fs('#fff', 4.5); TO.ell(x + lx, y + ly + 2, (eyesType === 'wide' ? 5 : 8), (eyesType === 'wide' ? 6 : 10)); g.fillStyle = INK; g.fill(); TO.ell(x + lx - 3, y + ly - 2, 2.6, 2.6); g.fillStyle = '#fff'; g.fill(); }
      else { if (eyesType === 'wide') { TO.ell(x, y, 11, 12); TO.fs('#fff', 3); TO.ell(x + lx, y + ly, 3.5, 4); g.fillStyle = INK; g.fill(); } else { TO.ell(x + lx, y + ly, 6, 7); g.fillStyle = INK; g.fill(); } }
      if (e.droop) TO.line([[x - 12, y - 10], [x + 12, y - 14 * s * 0 - 10]], 3); }
    else if (eyesType === 'closedUp') { g.beginPath(); g.arc(x, y + 6, big ? 13 : 10, 1.15 * Math.PI, 1.85 * Math.PI); g.lineWidth = 4.8; g.strokeStyle = INK; g.stroke(); }
    else if (eyesType === 'closedDown') { g.beginPath(); g.arc(x, y - 6, big ? 13 : 10, 0.15 * Math.PI, 0.85 * Math.PI); g.lineWidth = 4.8; g.strokeStyle = INK; g.stroke(); }
    else if (eyesType === 'half') { TO.ell(x, y + 2, 7, 6); g.fillStyle = INK; g.fill(); TO.line([[x - 11, y - 2], [x + 11, y - 2]], 4); }
    else if (eyesType === 'wink') { if (s < 0) { g.beginPath(); g.arc(x, y + 6, 10, 1.15 * Math.PI, 1.85 * Math.PI); g.lineWidth = 4.8; g.strokeStyle = INK; g.stroke(); } else { TO.ell(x, y, big ? 9 : 6, big ? 11 : 7); g.fillStyle = INK; g.fill(); } }
    else if (eyesType === 'heart') { g.save(); g.translate(x, y); g.beginPath(); g.moveTo(0, 8); g.bezierCurveTo(-14, -2, -8, -14, 0, -6); g.bezierCurveTo(8, -14, 14, -2, 0, 8); TO.fs('#e8435a', 3); g.restore(); }
    else TO.line([[x - 9, y + 2], [x + 9, y + 2]], 4.5);
    // brows
    const by = y - (big ? 30 : 22) - (o.browUp || 0) * 10; let tiltB = typeof e.brow === 'number' ? e.brow : 0; if (e.brow === 'oneUp') tiltB = s < 0 ? -0.2 : 1.2;
    const inner = s * 4, outer = s * 22, yIn = by + (typeof e.brow === 'number' ? e.brow * 7 : (s < 0 ? 0 : -8)) , yOut = by - (typeof e.brow === 'number' ? e.brow * 3 : (s < 0 ? 0 : -2));
    if ((e.brow !== 0 || spec.brows) && spec.browShape === 'taper') { const dr = spec.browDroop || 0, x0 = x - s * 10, x1 = x + s * 26, bt = typeof e.brow === 'number' ? e.brow * 7 : 0;
      const yI = y - 21 - (o.browUp || 0) * 10 + bt, yO = yI + dr - bt * 0.6, th = spec.browW || 8;
      g.beginPath(); g.moveTo(x0, yI - th * 0.7); g.quadraticCurveTo((x0 + x1) / 2, yI - th * 0.7 + (yO - yI) * 0.35, x1, yO - 1.5); g.lineTo(x1, yO + 1.5); g.quadraticCurveTo((x0 + x1) / 2, yI + th * 0.5 + (yO - yI) * 0.55, x0, yI + th * 0.6); g.closePath();
      g.fillStyle = spec.browCol || INK; g.fill(); if (spec.browEdge) { g.lineWidth = 2.5; g.strokeStyle = spec.browEdge; g.lineJoin = 'round'; g.stroke(); } }
    else if (e.brow !== 0 || spec.brows) { const dr = spec.browDroop || 0; if (dr) TO.curve([x - inner * 1.5 - s * 6, yIn], [x + s * 6, yIn - dr * 0.6], [x + outer - s * 2, yOut + dr], spec.browW || 5, spec.browCol || INK); else TO.line([[x - inner * 1.5 - s * 6, yIn], [x + outer - s * 6, yOut]], spec.browW || 5, spec.browCol || INK); }
  }
  }
  if (!o.__mouthOnly) {
  // nose (optional, caricatures): spec.nose = 'bulb' | 'broad' | 'wide'
  if (spec.nose) { const sk = spec.skin, dk = TO.shade(sk, -0.22);
    if (spec.nose === 'bulb') { TO.ell(2, 30, 15, 13); TO.fs(TO.shade(sk, -0.06), 4); TO.ell(-3, 25, 5, 4); g.fillStyle = 'rgba(255,255,255,.45)'; g.fill(); }
    else if (spec.nose === 'wideTip') { const ns = TO.shade(sk, -0.05);
      g.beginPath(); g.moveTo(-5, 10); g.quadraticCurveTo(-8, 22, -13, 28); g.bezierCurveTo(-26, 32, -24, 46, -12, 45); g.quadraticCurveTo(0, 50, 12, 45); g.bezierCurveTo(24, 46, 26, 32, 13, 28); g.quadraticCurveTo(8, 22, 5, 10);
      g.fillStyle = ns; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
      TO.ell(0, 34, 7, 5); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill();
      for (const s2 of [-1, 1]) TO.curve([s2 * 14, 41], [s2 * 10, 44], [s2 * 6, 42], 3.2, dk); }
    else if (spec.nose === 'broad') { g.beginPath(); g.moveTo(-4, 6); g.quadraticCurveTo(-8, 22, -18, 30); g.quadraticCurveTo(-24, 40, -12, 42); g.quadraticCurveTo(0, 46, 12, 42); g.quadraticCurveTo(24, 40, 18, 30); g.quadraticCurveTo(10, 22, 6, 8);
      g.fillStyle = TO.shade(sk, -0.06); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke();
      for (const s2 of [-1, 1]) { TO.ell(s2 * 8, 38, 4, 2.6); g.fillStyle = dk; g.fill(); } }
    else { TO.curve([-22, 34], [-26, 44], [-12, 44], 4.5); TO.curve([22, 34], [26, 44], [12, 44], 4.5); TO.curve([-12, 44], [0, 48], [12, 44], 3.5, dk); TO.curve([4, 10], [10, 26], [8, 34], 3.5, dk); } }
  }
  // mouth
  const my = (big ? 44 : 48) + (spec.nose ? 10 : 0), tk = o.talk || 0;
  if (o.__noMouth) {} else if (o.__mouthOnly) mouth3q(e.mouth, my, tk, e);
  else if (tk > 0.15) { TO.ell(2, my + 4, 12 + tk * 4, 5 + tk * 12); TO.fs('#7a2e2a', 4.5); TO.ell(2, my + 10 + tk * 6, 7, 2 + tk * 3); g.fillStyle = '#e8776c'; g.fill(); }
  else if (spec.smile && ['smile', 'grin', 'laugh'].includes(e.mouth)) wideSmile(e.mouth === 'smile' ? 'closed' : e.mouth === 'laugh' ? 'big' : spec.smile === 'closed' ? 'teeth' : spec.smile, my, spec.skin);
  else if (e.mouth === 'open') { TO.ell(2, my + 4, 14.4, 12.2); TO.fs('#7a2e2a', 4.5); TO.ell(2, my + 13.6, 7, 3.8); g.fillStyle = '#e8776c'; g.fill(); }
  else { const m = e.mouth;
    if (m === 'smile') TO.curve([-16, my], [2, my + 12], [20, my - 2], 4.5);
    else if (m === 'flat') TO.line([[-12, my + 4], [14, my + 4]], 4.5);
    else if (m === 'flatHard') TO.line([[-16, my + 4], [16, my + 2]], 5.5);
    else if (m === 'frown') TO.curve([-16, my + 10], [2, my - 4], [20, my + 10], 4.5);
    else if (m === 'grin' || m === 'laugh' || m === 'teeth' || m === 'wail') { const h = m === 'laugh' ? 30 : m === 'wail' ? 26 : m === 'teeth' ? 14 : 22, down = m === 'wail' || m === 'teeth';
      g.beginPath(); if (down) { g.moveTo(-26, my + 14); g.quadraticCurveTo(2, my + 14 - h, 30, my + 14); g.quadraticCurveTo(2, my + 22, -26, my + 14); } else { g.moveTo(-28, my); g.quadraticCurveTo(2, my + h + 8, 32, my); g.quadraticCurveTo(2, my + 8, -28, my); } g.closePath(); TO.fs('#7a2e2a', 4.5);
      if (m !== 'wail') { g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(-30, down ? my + 2 : my - 4, 64, 12); g.restore(); } }
    else if (m === 'O') { TO.ell(2, my + 6, 13, 18); TO.fs('#7a2e2a', 4.5); }
    else if (m === 'o') { TO.ell(2, my + 4, 7, 8); TO.fs('#7a2e2a', 4); }
    else if (m === 'wavy') { g.beginPath(); g.moveTo(-18, my + 4); for (let k = 1; k <= 4; k++) g.lineTo(-18 + k * 9, my + 4 + (k % 2 ? -5 : 3)); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
    else if (m === 'smirk') TO.curve([-10, my + 6], [10, my + 8], [24, my - 4], 4.5);
    else if (m === 'side') TO.line([[4, my + 6], [22, my + 2]], 4.5);
    else if (m === 'squiggle') { g.beginPath(); g.moveTo(-16, my + 4); g.bezierCurveTo(-6, my - 6, 4, my + 14, 18, my); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); } }
  if (o.__mouthOnly) return;
  if (e.tears) for (const s of [-1, 1]) { const k = ((t * 1.4) % 1); g.save(); g.globalAlpha = 0.9; TO.line([[s * ex, ey + 8], [s * (ex + 4), ey + 40 + k * 30]], 7, '#7cc8ff'); g.restore(); }
  if (e.sweat) TO.sweat(70, -40, t);
  if (e.zz) { g.save(); g.font = `italic 900 30px "${TO.F.comic}"`; g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 5; const k = (t * 0.6) % 1; g.globalAlpha = 1 - k; g.strokeText('Z', 70 + k * 20, -70 - k * 40); g.fillText('Z', 70 + k * 20, -70 - k * 40); g.restore(); }
  if (spec.cheeks) { TO.ell(-ex - 14, ey + 30, 13, 8); g.fillStyle = 'rgba(240,120,110,.4)'; g.fill(); TO.ell(ex + 14, ey + 30, 13, 8); g.fill(); }
}
// side face (facing +x) at head centre
function faceSide(spec, expr, o) {
  const g = G(), e = EX[expr] || EX.neutral, big = spec.eyes === 'big', t = o.t || 0, x = 46, y = big ? 0 : 6;
  const blink = o.blink ?? (((t + (spec.seed || 0)) % 3.3) > 3.18); let et = blink && ['open', 'wide', 'lookUp', 'half'].includes(e.eyes) ? 'line' : e.eyes;
  if (et === 'open' || et === 'wide' || et === 'lookUp' || et === 'heart') { if (big) { TO.ell(x, y, 11 * (et === 'wide' ? 1.25 : 1), 17); TO.fs('#fff', 4); TO.ell(x + 4, y + (et === 'lookUp' ? -5 : 1), 5, 8); g.fillStyle = INK; g.fill(); } else { TO.ell(x + 2, y, et === 'wide' ? 7 : 5, et === 'wide' ? 8 : 6.5); g.fillStyle = INK; g.fill(); } }
  else if (et === 'closedUp' || et === 'wink') { g.beginPath(); g.arc(x, y + 5, 9, 1.15 * Math.PI, 1.85 * Math.PI); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke(); }
  else if (et === 'closedDown') { g.beginPath(); g.arc(x, y - 5, 9, 0.15 * Math.PI, 0.85 * Math.PI); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke(); }
  else TO.line([[x - 8, y + 2], [x + 8, y + 2]], 4.5);
  const bt = typeof e.brow === 'number' ? e.brow : 0.6;
  if (spec.browShape === 'taper') { const dr = spec.browDroop || 0, by = y - 22 - (o.browUp || 0) * 10 + (typeof e.brow === 'number' ? e.brow * 6 : 0), th = spec.browW || 8;
    g.beginPath(); g.moveTo(x + 22, by - th * 0.7); g.quadraticCurveTo(x + 2, by - th * 0.6 + dr * 0.3, x - 16, by + dr - 1.5); g.lineTo(x - 16, by + dr + 1.5); g.quadraticCurveTo(x + 4, by + th * 0.5 + dr * 0.5, x + 22, by + th * 0.6); g.closePath();
    g.fillStyle = spec.browCol || INK; g.fill(); if (spec.browEdge) { g.lineWidth = 2.5; g.strokeStyle = spec.browEdge; g.stroke(); } }
  else TO.line([[x - 14, y - (big ? 26 : 20) + bt * 2], [x + 12, y - (big ? 26 : 20) + bt * 7]], spec.browW || 5, spec.browCol || INK);
  const tk = o.talk || 0, mx = spec.nose ? 64 : 58, my = (big ? 42 : 48) + (spec.nose ? 10 : 0);
  if (tk > 0.15) { TO.ell(mx, my, 8 + tk * 3, 4 + tk * 10); TO.fs('#7a2e2a', 4); }
  else if (e.mouth === 'grin' || e.mouth === 'laugh') { g.beginPath(); g.moveTo(mx - 16, my - 4); g.quadraticCurveTo(mx + 2, my + 2, mx + 18, my - 8); g.quadraticCurveTo(mx + 12, my + 16, mx - 4, my + 14); g.quadraticCurveTo(mx - 12, my + 10, mx - 16, my - 4); g.closePath(); TO.fs('#7a2e2a', 4); g.beginPath(); g.moveTo(mx - 12, my - 3); g.quadraticCurveTo(mx + 2, my + 2, mx + 15, my - 6); g.lineTo(mx + 13, my); g.quadraticCurveTo(mx, my + 5, mx - 10, my + 2); g.closePath(); g.fillStyle = '#fbf7f0'; g.fill(); TO.curve([mx - 22, my - 22], [mx - 28, my - 6], [mx - 20, my + 6], 3, 'rgba(120,70,50,.45)'); }
  else if (['smile', 'grin', 'laugh', 'smirk'].includes(e.mouth)) TO.curve([mx - 14, my - 2], [mx - 2, my + 10], [mx + 14, my - 6], 4.5);
  else if (['frown', 'wail', 'teeth'].includes(e.mouth)) TO.curve([mx - 14, my + 8], [mx - 2, my - 4], [mx + 12, my + 6], 4.5);
  else if (e.mouth === 'O' || e.mouth === 'o') { TO.ell(mx, my + 2, e.mouth === 'O' ? 9 : 6, e.mouth === 'O' ? 13 : 7); TO.fs('#7a2e2a', 4); }
  else TO.line([[mx - 10, my + 2], [mx + 12, my]], 4.5);
  if (e.tears) TO.line([[x - 2, y + 10], [x - 6, y + 46 + ((t * 1.4) % 1) * 20]], 6, '#7cc8ff');
  if (e.sweat) TO.sweat(-20, -60, t);
}

// ---------------- hair, headwear, glasses, facial hair (front + side) ----------------
const HAIR = {
  spiky: { col: '#2b2421',
    front: (g) => { g.beginPath(); g.moveTo(-86, -8); g.quadraticCurveTo(-92, -80, -20, -92); g.lineTo(-30, -128); g.lineTo(2, -96); g.lineTo(14, -136); g.lineTo(30, -92); g.lineTo(62, -118); g.lineTo(60, -78); g.quadraticCurveTo(90, -50, 86, -14); g.closePath(); TO.fs('#2b2421'); },
    frontTop: (g) => { g.beginPath(); g.moveTo(-84, -30); g.quadraticCurveTo(-72, -94, 2, -92); g.quadraticCurveTo(72, -90, 88, -28); g.quadraticCurveTo(58, -56, 32, -44); g.lineTo(24, -64); g.quadraticCurveTo(-8, -42, -40, -52); g.quadraticCurveTo(-62, -42, -84, -30); g.closePath(); TO.fs('#2b2421', 6); },
    side: (g) => { g.beginPath(); g.moveTo(60, -64); g.quadraticCurveTo(30, -100, -20, -96); g.lineTo(-10, -132); g.lineTo(-40, -98); g.lineTo(-60, -126); g.lineTo(-64, -86); g.lineTo(-96, -96); g.quadraticCurveTo(-96, -30, -80, 10); g.quadraticCurveTo(-60, -10, -40, -30); g.quadraticCurveTo(10, -46, 60, -64); g.closePath(); TO.fs('#2b2421', 6); } },
  silver: { front: (g, t) => { const sw = Math.sin(t * 1.7) * 1.2, PX = -34; const cap = () => { g.beginPath(); g.moveTo(-90, -8); g.bezierCurveTo(-110, -104, -44, -146 + sw, 18, -142 + sw); g.bezierCurveTo(96, -138 + sw, 124, -62, 94, 8); g.quadraticCurveTo(80, -36, 52, -56); g.quadraticCurveTo(10, -78, PX + 6, -70); g.lineTo(PX, -40); g.lineTo(PX - 8, -58); g.lineTo(PX - 16, -34); g.lineTo(PX - 24, -56); g.lineTo(PX - 34, -30); g.lineTo(PX - 42, -52); g.quadraticCurveTo(-84, -40, -90, -8); g.closePath(); };
      cap(); g.fillStyle = '#cfd0d4'; g.fill(); g.save(); cap(); g.clip(); g.beginPath(); g.moveTo(98, 10); g.quadraticCurveTo(84, -48, 50, -70); g.quadraticCurveTo(10, -92, PX + 6, -88); g.lineTo(PX + 6, -64); g.quadraticCurveTo(10, -70, 52, -52); g.quadraticCurveTo(82, -30, 92, 10); g.closePath(); g.fillStyle = '#8f9096'; g.fill(); g.fillStyle = '#a9aab0'; g.beginPath(); g.ellipse(-70, -40, 34, 26, 0, 0, 7); g.fill(); TO.curve([-30, -104], [20, -120], [70, -96], 3, 'rgba(40,40,48,.55)'); TO.curve([40, -108], [80, -98], [90, -60], 3, 'rgba(40,40,48,.45)'); g.restore(); cap(); TO.fs(null, 6); },
    side: (g) => { g.beginPath(); g.moveTo(66, -60); g.quadraticCurveTo(60, -128, -10, -132); g.quadraticCurveTo(-96, -126, -104, -40); g.quadraticCurveTo(-104, 0, -82, 24); g.quadraticCurveTo(-70, -10, -40, -24); g.quadraticCurveTo(0, -40, 20, -56); g.lineTo(30, -40); g.lineTo(40, -60); g.lineTo(52, -44); g.closePath(); TO.fs('#cfd0d4', 6); TO.curve([30, -100], [-30, -120], [-80, -70], 3, 'rgba(40,40,48,.5)'); TO.curve([10, -80], [-40, -96], [-86, -30], 3, 'rgba(40,40,48,.45)'); } },
  silverBack: { front: (g, t) => { const sw = Math.sin(t * 1.5) * 1.5;
      const cap = () => { g.beginPath(); g.moveTo(-91, -6); g.bezierCurveTo(-106, -74, -70, -132 + sw, 0, -134 + sw); g.bezierCurveTo(74, -136 + sw, 110, -84, 92, -8); g.quadraticCurveTo(86, -38, 70, -52); g.quadraticCurveTo(30, -74, -16, -72); g.quadraticCurveTo(-34, -71, -46, -66); g.quadraticCurveTo(-74, -54, -80, -26); g.quadraticCurveTo(-86, -14, -91, -6); g.closePath(); };
      cap(); g.fillStyle = '#d3d6dc'; g.fill(); g.save(); cap(); g.clip();
      g.fillStyle = '#9da2ab'; g.beginPath(); g.moveTo(120, 20); g.quadraticCurveTo(96, -70, 30, -96); g.quadraticCurveTo(70, -60, 74, 20); g.closePath(); g.fill();
      g.fillStyle = '#a7abb3'; g.beginPath(); g.ellipse(-86, -20, 18, 40, 0.1, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(-30, -78); g.quadraticCurveTo(-6, -120 + sw, 56, -124 + sw); g.quadraticCurveTo(4, -108, -18, -80); g.closePath(); g.fill();
      for (const [a, b, c] of [[[-6, -76], [20, -114], [68, -122]], [[20, -74], [52, -104], [88, -98]], [[44, -68], [72, -88], [96, -70]], [[-44, -70], [-30, -108], [8, -128]]]) TO.curve(a, b, c, 3, 'rgba(60,64,74,.55)');
      g.restore(); cap(); TO.fs(null, 6);
      TO.curve([-46, -66], [-44, -96], [-26, -124 + sw], 4, 'rgba(40,42,50,.7)'); },
    side: (g, t) => { const sw = Math.sin(t * 1.5) * 1.5; g.beginPath(); g.moveTo(72, -54); g.quadraticCurveTo(66, -132 + sw, -6, -134 + sw); g.quadraticCurveTo(-98, -126, -104, -40); g.quadraticCurveTo(-106, 4, -84, 26); g.quadraticCurveTo(-72, -8, -44, -20); g.quadraticCurveTo(-10, -34, 20, -44); g.quadraticCurveTo(48, -52, 72, -54); g.closePath(); TO.fs('#d3d6dc', 6);
      TO.curve([62, -66], [10, -126], [-80, -108], 3, 'rgba(60,64,74,.55)'); TO.curve([50, -52], [-10, -90], [-92, -50], 3, 'rgba(60,64,74,.5)'); TO.curve([30, -118], [-30, -128], [-70, -106], 4, 'rgba(255,255,255,.8)'); } },
  silver73R: { lazy: [1, 1] }, silver73L: { lazy: [-1, 1] }, silverPomp: { lazy: [1, 1.35] }, silver72R: { lazy: [1, 1.1, 50] }, silver72L: { lazy: [-1, 1.1, 50] }, silver71R: { lazy: [1, 1.1, 66] }, silver71L: { lazy: [-1, 1.1, 66] },
  neat: { front: (g) => { const PX = 40; const cap = () => { g.beginPath(); g.moveTo(-92, -4); g.bezierCurveTo(-100, -86, -40, -120, 10, -118); g.bezierCurveTo(70, -116, 102, -70, 92, -4); g.quadraticCurveTo(84, -40, PX + 12, -58); g.lineTo(PX, -70); g.quadraticCurveTo(-6, -62, -52, -44); g.quadraticCurveTo(-76, -34, -80, -16); g.quadraticCurveTo(-86, -12, -92, -4); g.closePath(); };
      cap(); g.fillStyle = '#8f8579'; g.fill(); g.save(); cap(); g.clip(); g.fillStyle = '#b4aca2'; g.beginPath(); g.ellipse(-6, -100, 70, 22, -0.1, 0, 7); g.fill(); g.fillStyle = '#6f665c'; g.beginPath(); g.ellipse(-84, -24, 22, 30, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(90, -24, 20, 30, 0, 0, 7); g.fill(); g.restore(); cap(); TO.fs(null, 6); },
    side: (g) => { g.beginPath(); g.moveTo(60, -60); g.quadraticCurveTo(50, -116, -10, -118); g.quadraticCurveTo(-90, -112, -96, -30); g.quadraticCurveTo(-94, 0, -84, 12); g.quadraticCurveTo(-70, -20, -40, -34); g.quadraticCurveTo(10, -48, 60, -60); g.closePath(); TO.fs('#8f8579', 6); TO.curve([40, -76], [-20, -100], [-70, -70], 2.6, 'rgba(40,32,26,.45)'); } },
  bald: { front: (g) => { TO.ell(-26, -54, 22, 11, -0.4); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill(); }, side: (g) => { TO.ell(10, -66, 24, 10, -0.2); g.fillStyle = 'rgba(255,255,255,.4)'; g.fill(); } },
  baldRing: { front: (g) => { HAIR.bald.front(g); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 94, -6); g.quadraticCurveTo(s * 84, -40, s * 66, -46); g.lineTo(s * 62, 8); g.closePath(); TO.fs('#8c8a88', 4.5); } },
    side: (g) => { HAIR.bald.side(g); g.beginPath(); g.moveTo(-94, -20); g.quadraticCurveTo(-80, -56, -50, -56); g.quadraticCurveTo(-30, -20, -40, 20); g.quadraticCurveTo(-80, 24, -94, -20); TO.fs('#8c8a88', 4.5); } },
  short: { col: '#3b2a22', front: (g) => { g.beginPath(); g.moveTo(-90, -10); g.bezierCurveTo(-98, -96, -30, -126, 20, -120); g.bezierCurveTo(80, -114, 104, -60, 90, -10); g.quadraticCurveTo(76, -50, 40, -62); g.quadraticCurveTo(-10, -50, -40, -66); g.quadraticCurveTo(-70, -50, -90, -10); g.closePath(); TO.fs('#3b2a22', 6); },
    side: (g) => { g.beginPath(); g.moveTo(62, -58); g.quadraticCurveTo(50, -118, -10, -120); g.quadraticCurveTo(-92, -114, -98, -30); g.quadraticCurveTo(-96, 0, -84, 12); g.quadraticCurveTo(-60, -30, -30, -40); g.quadraticCurveTo(20, -48, 62, -58); g.closePath(); TO.fs('#3b2a22', 6); } },
  bob: { col: '#2b1f1c', back: (g) => { g.beginPath(); g.moveTo(-104, 60); g.quadraticCurveTo(-118, -110, 0, -126); g.quadraticCurveTo(118, -110, 104, 60); g.quadraticCurveTo(60, 70, 60, 40); g.lineTo(-60, 40); g.quadraticCurveTo(-60, 70, -104, 60); g.closePath(); TO.fs('#2b1f1c', 6); },
    front: (g) => { g.beginPath(); g.moveTo(-92, 0); g.quadraticCurveTo(-96, -100, 0, -116); g.quadraticCurveTo(96, -100, 92, 0); g.quadraticCurveTo(70, -60, 10, -56); g.quadraticCurveTo(-50, -60, -92, 0); g.closePath(); TO.fs('#2b1f1c', 6); },
    side: (g) => { g.beginPath(); g.moveTo(60, -60); g.quadraticCurveTo(40, -122, -20, -122); g.quadraticCurveTo(-110, -110, -100, 20); g.quadraticCurveTo(-96, 60, -60, 64); g.quadraticCurveTo(-50, 20, -30, -30); g.quadraticCurveTo(10, -50, 60, -60); g.closePath(); TO.fs('#2b1f1c', 6); } },
  bobBlonde: { col: '#d6b26a', back: (g) => { g.beginPath(); g.moveTo(-104, 60); g.quadraticCurveTo(-118, -110, 0, -126); g.quadraticCurveTo(118, -110, 104, 60); g.quadraticCurveTo(60, 70, 60, 40); g.lineTo(-60, 40); g.quadraticCurveTo(-60, 70, -104, 60); g.closePath(); TO.fs('#d6b26a', 6); },
    front: (g) => { g.beginPath(); g.moveTo(-92, 0); g.quadraticCurveTo(-96, -100, 0, -116); g.quadraticCurveTo(96, -100, 92, 0); g.quadraticCurveTo(70, -60, 10, -56); g.quadraticCurveTo(-50, -60, -92, 0); g.closePath(); TO.fs('#d6b26a', 6); },
    side: (g) => { g.beginPath(); g.moveTo(60, -60); g.quadraticCurveTo(40, -122, -20, -122); g.quadraticCurveTo(-110, -110, -100, 20); g.quadraticCurveTo(-96, 60, -60, 64); g.quadraticCurveTo(-50, 20, -30, -30); g.quadraticCurveTo(10, -50, 60, -60); g.closePath(); TO.fs('#d6b26a', 6); } },
  bun: { back: (g) => { TO.ell(0, -128, 36, 30); TO.fs('#5a3a28', 6); }, front: (g) => { g.beginPath(); g.moveTo(-90, -10); g.quadraticCurveTo(-96, -104, 0, -116); g.quadraticCurveTo(96, -104, 90, -10); g.quadraticCurveTo(60, -70, 0, -66); g.quadraticCurveTo(-60, -70, -90, -10); g.closePath(); TO.fs('#5a3a28', 6); },
    side: (g) => { TO.ell(-40, -118, 32, 28); TO.fs('#5a3a28', 6); g.beginPath(); g.moveTo(60, -60); g.quadraticCurveTo(40, -118, -20, -118); g.quadraticCurveTo(-98, -110, -96, -20); g.quadraticCurveTo(-90, 10, -80, 14); g.quadraticCurveTo(-60, -30, -30, -40); g.quadraticCurveTo(20, -50, 60, -60); g.closePath(); TO.fs('#5a3a28', 6); } },
  whiteSides: { front: (g) => { g.beginPath(); g.moveTo(-90, -6); g.quadraticCurveTo(-98, 30, -70, 50); g.quadraticCurveTo(-80, 16, -66, -6); g.closePath(); TO.fs('#f2f0ec', 5); g.beginPath(); g.moveTo(90, -6); g.quadraticCurveTo(98, 30, 70, 50); g.quadraticCurveTo(80, 16, 66, -6); g.closePath(); TO.fs('#f2f0ec', 5); },
    side: (g) => { g.beginPath(); g.moveTo(-96, -10); g.quadraticCurveTo(-100, 30, -60, 50); g.quadraticCurveTo(-60, 10, -40, -10); g.closePath(); TO.fs('#f2f0ec', 5); } },
};

// swept-back silver hair with a 7/3 side part. side = +1 part on the viewer's right (big mass on the viewer's left), -1 mirrored.
// vol = top volume (1 normal, 1.3 fuller). Used for Jensen-style caricatures; register variants in HAIR below.
function sweptHair(dir = 1, vol = 1, part = 30) { const S = dir, V = vol;
  const front = (g, t) => { const sw = Math.sin(t * 1.5) * 1.2, P = part * S, top = -100 - 40 * V + sw, hl = -50; // hl = hairline height at centre
    const cap = () => { g.beginPath(); g.moveTo(-94 * S, 14); g.bezierCurveTo(-120 * S, -60, -84 * S, top, -6 * S, top); g.bezierCurveTo(70 * S, top + 2, 118 * S, -66, 94 * S, 12);
      g.quadraticCurveTo(88 * S, -22, 74 * S, -36); g.quadraticCurveTo(P + 22 * S, hl - 4, P + 2 * S, hl - 6);            // 3-side: flat, combed back
      g.bezierCurveTo(P - 10 * S, hl - 14 - 4 * V, P - 40 * S, hl - 16 - 4 * V, P - 64 * S, hl - 10);                         // 7-side: wave lifts at the part
      g.quadraticCurveTo(-60 * S, hl - 2, -74 * S, -28); g.quadraticCurveTo(-84 * S, -14, -86 * S, 14); g.closePath(); };
    cap(); g.fillStyle = '#cfd2d8'; g.fill(); g.save(); cap(); g.clip();
    g.fillStyle = '#9fa4ad'; g.beginPath(); g.ellipse(-94 * S, 0, 20, 52, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(96 * S, -4, 16, 46, 0, 0, 7); g.fill();
    g.fillStyle = '#b6bac2'; g.beginPath(); g.moveTo(P + 4 * S, hl - 6); g.quadraticCurveTo(P + 20 * S, -100, P + 8 * S, top + 10); g.lineTo(P + 40 * S, top + 14); g.quadraticCurveTo(P + 46 * S, -90, P + 30 * S, hl - 4); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(P - 22 * S, hl - 32 - 8 * V); g.quadraticCurveTo(-30 * S, top + 8, -70 * S, top + 40); g.quadraticCurveTo(-40 * S, top + 30, P - 34 * S, hl - 26 - 8 * V); g.closePath(); g.fill();
    for (let k = 0; k < 5; k++) { const x0 = P - (8 + k * 20) * S, y0 = hl - 26 - 8 * V + k * 7; TO.curve([x0, y0], [x0 - 10 * S, top + 20 + k * 6], [x0 - 44 * S - k * 6 * S, top + 30 + k * 16], 3, 'rgba(60,64,74,.55)'); }
    for (let k = 0; k < 3; k++) { const x0 = P + (12 + k * 18) * S; TO.curve([x0, hl - 4 + k * 6], [x0 + 6 * S, -96 + k * 8], [x0 + 18 * S, top + 20 + k * 12], 3, 'rgba(60,64,74,.5)'); }
    g.restore(); cap(); TO.fs(null, 6);
    TO.curve([P + 2 * S, hl - 6], [P + 8 * S, -96], [P + 2 * S, top + 10 + Math.max(0, part - 30) * 1.4], 4.5, 'rgba(30,32,40,.8)'); };
  const side = (g, t) => { const sw = Math.sin(t * 1.5) * 1.2, top = -98 - 30 * V + sw;
    const cap = () => { g.beginPath(); g.moveTo(70, -56); g.bezierCurveTo(82, -100, 50, top + 2, -4, top); g.bezierCurveTo(-74, top + 2, -106, -84, -102, -30); g.quadraticCurveTo(-100, -4, -88, 10);
      g.quadraticCurveTo(-70, -22, -34, -28); g.lineTo(2, -28); g.lineTo(4, 2); g.lineTo(14, 2); g.quadraticCurveTo(18, -34, 36, -46); g.quadraticCurveTo(52, -54, 70, -56); g.closePath(); };
    cap(); g.fillStyle = '#cfd2d8'; g.fill(); g.save(); cap(); g.clip();
    g.fillStyle = '#a2a7b0'; g.beginPath(); g.ellipse(-70, -10, 40, 34, 0, 0, 7); g.fill(); g.fillStyle = '#b6bac2'; g.beginPath(); g.ellipse(8, -14, 10, 18, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.moveTo(56, -76); g.quadraticCurveTo(20, top + 8, -50, top + 22); g.quadraticCurveTo(10, top + 22, 48, -66); g.closePath(); g.fill();
    for (let k = 0; k < 5; k++) TO.curve([66 - k * 8, -60 + k * 8], [20 - k * 10, top + 18 + k * 10], [-60 - k * 8, top + 40 + k * 14], 3, 'rgba(60,64,74,.5)');
    g.restore(); cap(); TO.fs(null, 6); };
  return { front, side }; }
for (const [k, v] of Object.entries(HAIR)) if (v.lazy) HAIR[k] = sweptHair(...v.lazy);
const HAT = {
  khanxep: { front: (g) => { for (let i = 0; i < 3; i++) { TO.ell(0, -66 - i * 14, 84 - i * 6, 21); TO.fs(i % 2 ? '#2a2a3c' : '#363650', 6); } TO.ell(0, -108, 62, 15); TO.fs('#2a2a3c', 6); },
    side: (g) => { for (let i = 0; i < 3; i++) { TO.ell(-8, -66 - i * 14, 80 - i * 6, 19); TO.fs(i % 2 ? '#2a2a3c' : '#363650', 6); } } },
  cap: { front: (g, c = '#d64a33') => { g.beginPath(); g.moveTo(-90, -40); g.quadraticCurveTo(-90, -124, 0, -126); g.quadraticCurveTo(90, -124, 90, -40); g.closePath(); TO.fs(c, 6); TO.ell(0, -40, 96, 16); TO.fs(TO.shade(c, -0.2), 5); },
    side: (g, c = '#d64a33') => { g.beginPath(); g.moveTo(-90, -40); g.quadraticCurveTo(-90, -124, 0, -126); g.quadraticCurveTo(80, -124, 86, -44); g.closePath(); TO.fs(c, 6); g.beginPath(); g.moveTo(60, -46); g.lineTo(140, -36); g.lineTo(80, -30); g.closePath(); TO.fs(TO.shade(c, -0.2), 5); } },
};
const GLASSES = {
  small: { front: (g) => { for (const ex of [-28, 28]) { g.beginPath(); g.roundRect(ex - 20, -2, 40, 24, 3); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); g.lineWidth = 3.6; g.strokeStyle = INK; g.stroke(); } TO.line([[-8, 8], [8, 8]], 3.6); TO.line([[-48, 6], [-88, 0]], 3.6); TO.line([[48, 6], [88, 0]], 3.6); },
    side: (g) => { g.beginPath(); g.roundRect(30, -6, 34, 22, 3); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill(); g.lineWidth = 3.6; g.strokeStyle = INK; g.stroke(); TO.line([[30, 4], [-6, 2]], 3.6); } },
  bold: { front: (g) => { for (const ex of [-30, 30]) { g.beginPath(); g.roundRect(ex - 24, -6, 48, 32, 9); g.fillStyle = 'rgba(255,255,255,.22)'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#1a1416'; g.stroke(); } TO.line([[-6, 6], [6, 6]], 5, '#1a1416'); TO.line([[-54, 4], [-90, -2]], 5, '#1a1416'); TO.line([[54, 4], [90, -2]], 5, '#1a1416'); },
    side: (g) => { g.beginPath(); g.roundRect(26, -10, 40, 30, 9); g.fillStyle = 'rgba(255,255,255,.22)'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#1a1416'; g.stroke(); TO.line([[26, 2], [-8, 0]], 5, '#1a1416'); } },
  round: { front: (g) => { for (const ex of [-30, 30]) { TO.ell(ex, 10, 22, 22); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke(); } TO.line([[-8, 8], [8, 8]], 4); }, side: (g) => { TO.ell(46, 8, 18, 18); g.lineWidth = 4.5; g.strokeStyle = INK; g.stroke(); TO.line([[28, 6], [-6, 2]], 4); } },
  sun: { front: (g) => { g.beginPath(); g.roundRect(-62, -10, 54, 34, 10); g.roundRect(8, -10, 54, 34, 10); g.fillStyle = '#101116'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); TO.line([[-8, 2], [8, 2]], 5); g.fillStyle = 'rgba(160,230,255,.7)'; g.fillRect(-54, -4, 14, 5); g.fillRect(16, -4, 14, 5); },
    side: (g) => { g.beginPath(); g.roundRect(24, -10, 46, 30, 10); g.fillStyle = '#101116'; g.fill(); TO.line([[24, 0], [-8, -2]], 5); } },
};
const FACIAL = {
  mustache: { front: (g) => { g.beginPath(); g.moveTo(-36, 40); g.quadraticCurveTo(-20, 24, 0, 32); g.quadraticCurveTo(20, 24, 36, 40); g.quadraticCurveTo(16, 36, 0, 40); g.quadraticCurveTo(-16, 36, -36, 40); TO.fs('#7d7b7a', 4); }, side: (g) => { g.beginPath(); g.moveTo(40, 34); g.quadraticCurveTo(60, 26, 76, 38); g.quadraticCurveTo(60, 40, 40, 34); TO.fs('#7d7b7a', 4); } },
  goatee: { front: (g) => { g.beginPath(); g.moveTo(-16, 72); g.lineTo(16, 72); g.lineTo(0, 102); g.closePath(); TO.fs('#5a4a40', 4); }, side: (g) => { g.beginPath(); g.moveTo(44, 70); g.lineTo(66, 66); g.lineTo(52, 98); g.closePath(); TO.fs('#5a4a40', 4); } },
  whiteBeard: { front: (g, t) => { g.beginPath(); g.moveTo(-26, 42); g.quadraticCurveTo(0, 30, 26, 42); g.quadraticCurveTo(16, 80, 4, 132 + Math.sin(t * 3) * 2); g.quadraticCurveTo(-10, 80, -26, 42); g.closePath(); TO.fs('#f4f2ee', 5); g.beginPath(); g.moveTo(-34, 38); g.quadraticCurveTo(0, 22, 34, 38); g.quadraticCurveTo(0, 36, -34, 38); TO.fs('#f4f2ee', 4.5); },
    side: (g, t) => { g.beginPath(); g.moveTo(30, 40); g.quadraticCurveTo(60, 34, 76, 44); g.quadraticCurveTo(60, 80, 48, 130 + Math.sin(t * 3) * 2); g.quadraticCurveTo(36, 80, 30, 40); g.closePath(); TO.fs('#f4f2ee', 5); } },
};

// ---------------- outfits (front torso at neck origin ~232 tall; side torso narrower) ----------------
function torsoFront(o, t) { const g = G(), c = o.color || '#3a6ea5';
  if (o.type === 'jacket') TO.jacket(t, { tee: o.tee !== false, sheen: (t * 0.3 + 0.4) % 1.3 });
  else if (o.type === 'sweater') TO.sweater(c, o.shirt);
  else if (o.type === 'suit') TO.suit(c, o.tie);
  else if (o.type === 'robe' || o.type === 'dress') { const L = o.type === 'robe' ? 300 : 250, W = o.type === 'robe' ? 106 : 120; const p = () => { g.beginPath(); g.moveTo(-58, -8); g.bezierCurveTo(-82, 80, -96, 180, -W, L); g.lineTo(W, L); g.bezierCurveTo(96, 180, 82, 80, 58, -8); g.bezierCurveTo(30, -26, -30, -26, -58, -8); g.closePath(); }; p(); TO.fs(c); g.save(); p(); g.clip(); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(30, -40, 120, 380); if (o.type === 'dress') { g.fillStyle = TO.shade(c, -0.25); g.fillRect(-140, 96, 280, 16); } g.restore(); p(); TO.fs(null);
    if (o.type === 'robe') { TO.line([[0, -14], [18, 46], [44, 66]], 5); for (const yy of [30, 50, 70]) { TO.ell(30, yy, 4, 4); g.fillStyle = '#d9b24a'; g.fill(); } } }
  else { // tee (+ optional shorts / logo)
    const p = () => { g.beginPath(); g.moveTo(-58, -8); g.quadraticCurveTo(-100, -2, -104, 40); g.lineTo(-104, 216); g.quadraticCurveTo(-104, 232, -88, 232); g.lineTo(88, 232); g.quadraticCurveTo(104, 232, 104, 216); g.lineTo(104, 40); g.quadraticCurveTo(100, -2, 58, -8); g.closePath(); };
    p(); TO.fs(c); g.save(); p(); g.clip(); if (o.shorts) { g.fillStyle = o.shorts; g.fillRect(-120, 170, 240, 70); TO.line([[-110, 170], [110, 170]], 6); TO.line([[0, 170], [0, 232]], 4); } g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(52, -20, 70, 260); g.restore(); p(); TO.fs(null);
    g.beginPath(); g.arc(0, -16, 34, 0.18 * Math.PI, 0.82 * Math.PI); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    if (o.logo) { g.font = `italic 900 90px "${TO.F.comic}"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 7; g.strokeStyle = INK; g.fillStyle = '#fff6e0'; g.strokeText(o.logo, 0, 96); g.fillText(o.logo, 0, 96); } } }
function torsoSide(o, t) { const g = G(), c = o.type === 'jacket' ? '#20232c' : (o.color || '#3a6ea5');
  const L = o.type === 'robe' ? 300 : o.type === 'dress' ? 250 : 232, Wb = o.type === 'robe' ? 80 : o.type === 'dress' ? 86 : 64;
  const p = () => { g.beginPath(); g.moveTo(-40, -6); g.quadraticCurveTo(-70, 20, -68, 80); g.lineTo(-Wb, L - 12); g.quadraticCurveTo(-Wb, L, -Wb + 14, L); g.lineTo(Wb - 14, L); g.quadraticCurveTo(Wb, L, Wb, L - 12); g.lineTo(66, 70); g.quadraticCurveTo(64, 10, 34, -8); g.quadraticCurveTo(0, -18, -40, -6); g.closePath(); };
  p(); TO.fs(c); g.save(); p(); g.clip(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-120, -30, 60, 360);
  if (o.type === 'jacket') { TO.line([[50, 0], [40, 120], [54, 232]], 5, '#cfd5df', [3, 3]); TO.line([[-100, 206], [100, 206]], 4, '#0e0f13'); g.fillStyle = '#121318'; g.beginPath(); g.moveTo(20, -8); g.lineTo(48, -6); g.lineTo(44, 60); g.closePath(); g.fill(); }
  if (o.type === 'suit') { g.fillStyle = '#f1ede4'; g.beginPath(); g.moveTo(26, -8); g.lineTo(52, -4); g.lineTo(50, 60); g.closePath(); g.fill(); TO.line([[46, 0], [52, 90]], 8, o.tie || '#a3242c'); }
  if (o.type === 'sweater') { g.fillStyle = o.shirt || '#bcd3ea'; g.beginPath(); g.moveTo(20, -8); g.lineTo(52, -4); g.lineTo(46, 50); g.closePath(); g.fill(); }
  if (o.shorts) { g.fillStyle = o.shorts; g.fillRect(-120, 170, 240, 70); TO.line([[-110, 170], [110, 170]], 6); }
  g.restore(); p(); TO.fs(null);
  if (o.logo) { g.font = `italic 900 60px "${TO.F.comic}"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 6; g.strokeStyle = INK; g.fillStyle = '#fff6e0'; g.strokeText(o.logo, 10, 96); g.fillText(o.logo, 10, 96); } }

// ---------------- the cast (data) ----------------
// spec = { skin, hair, hairCol?, hat?, hatCol?, glasses?, facial?, eyes:'dot'|'big', cheeks?, brows?, browCol?, kid?, outfit:{type, color, shirt, tie, logo, shorts}, legs, shoe, sleeve:'long'|'short'|'none', seed }
export const CAST = {
  nhoc: { name: 'Nhóc', skin: '#f6d39b', hair: 'spiky', eyes: 'big', cheeks: true, brows: true, kid: true, outfit: { type: 'tee', color: '#ee5a36', logo: '?', shorts: '#2e3f73' }, shoe: '#e9e4dc', sleeve: 'short', seed: 0.4 },
  ongdo: { name: 'Ông đồ', skin: '#efc68f', hair: 'whiteSides', hat: 'khanxep', glasses: 'round', facial: 'whiteBeard', eyes: 'dot', brows: true, browCol: '#f2f0ec', browW: 8, outfit: { type: 'robe', color: '#33416e' }, shoe: '#1f1d22', sleeve: 'long', sleeveCol: '#33416e', seed: 1.1 },
  banker: { name: 'Banker', skin: '#efc79a', hair: 'baldRing', facial: 'mustache', eyes: 'dot', brows: true, outfit: { type: 'suit', color: '#2a2f45', tie: '#a3242c' }, shoe: '#1b1c22', sleeve: 'long', sleeveCol: '#2a2f45', seed: 1.7 },
  biker: { name: 'Chú biker', skin: '#efc79a', hair: 'bald', glasses: 'sun', facial: 'goatee', eyes: 'dot', outfit: { type: 'jacket', tee: false }, shoe: '#1b1c22', sleeve: 'long', sleeveCol: '#20232c', seed: 2.3 },
  jensen: { name: 'Jensen Huang (biếm hoạ)', skin: '#efc89a', hair: 'silver', glasses: 'small', eyes: 'dot', expr: 'happy', outfit: { type: 'jacket', tee: true }, shoe: '#1b1c22', sleeve: 'long', sleeveCol: '#20232c', seed: 0.9 },
  gates: { name: 'Bill Gates (biếm hoạ)', skin: '#f2c9a6', hair: 'neat', glasses: 'bold', eyes: 'dot', brows: true, browCol: '#5c544b', outfit: { type: 'sweater', color: '#5b2133', shirt: '#bcd3ea' }, shoe: '#3a2a22', sleeve: 'long', sleeveCol: '#5b2133', seed: 1.4 },
  kress: { name: 'Colette Kress (biếm hoạ)', skin: '#f2cba6', hair: 'bobBlonde', eyes: 'dot', brows: true, browCol: '#8a6a3a', cheeks: true, outfit: { type: 'suit', color: '#22314f', tie: '#22314f' }, shoe: '#1b1c22', sleeve: 'long', sleeveCol: '#22314f', seed: 4.2 },
  man: { name: 'Anh văn phòng', skin: '#efc69a', hair: 'short', eyes: 'dot', brows: true, outfit: { type: 'tee', color: '#3a6ea5' }, shoe: '#2a2a30', sleeve: 'short', seed: 2.9 },
  woman: { name: 'Chị văn phòng', skin: '#f3cfa8', hair: 'bob', eyes: 'dot', brows: true, cheeks: true, outfit: { type: 'dress', color: '#c2414f' }, shoe: '#3a1f24', sleeve: 'none', seed: 3.3 },
  student: { name: 'Bạn nữ', skin: '#f5d2a4', hair: 'bun', eyes: 'big', cheeks: true, brows: true, kid: true, outfit: { type: 'tee', color: '#3fae7a', shorts: '#2e3f73' }, shoe: '#e9e4dc', sleeve: 'short', seed: 3.8 },
};
export const CAST_IDS = Object.keys(CAST);

function drawHead(spec, view, expr, o) { const g = G(), t = o.t || 0, hairDef = HAIR[spec.hair] || HAIR.bald;
  if (view === '3q') { // three-quarter view facing +x: features slide toward the facing side and foreshorten
    hairDef.back?.(g, t);
    TO.ell(-84, 10, 13, 20); TO.fs(spec.skin, 4.5); TO.curve([-80, 0], [-90, 6], [-82, 20], 3, TO.shade(spec.skin, -0.3));
    TO.head(0, 0, 92, spec.skin);
    g.save(); g.translate(6, 0); hairDef.front?.(g, t); hairDef.frontTop?.(g, t); if (spec.hat) HAT[spec.hat].front(g, spec.hatCol); g.restore();
    g.save(); g.beginPath(); g.arc(0, 0, 96, 0, 7); g.rect(90, -200, 120, 400); g.clip(); g.translate(22, 0); g.scale(0.8, 1);
    faceFront(spec, expr, { ...o, __noMouth: true }); if (spec.facial) FACIAL[spec.facial].front(g, t); if (spec.glasses) GLASSES[spec.glasses].front(g); g.restore();
    faceFront(spec, expr, { ...o, __mouthOnly: true });
    if (spec.cheeks) { TO.ell(70, 34, 12, 7); g.fillStyle = 'rgba(240,120,110,.4)'; g.fill(); }
    return; }
  if (view === 'side') {
    if (hairDef.backSide) hairDef.backSide(g, t);
    TO.ell(-10, 8, 14, 20); TO.fs(spec.skin, 4.5); // ear (behind)
    TO.head(0, 0, 92, spec.skin);
    if (spec.nose === 'wideTip' || spec.nose === 'broad' || spec.nose === 'bulb') { g.beginPath(); g.moveTo(84, -4); g.quadraticCurveTo(96, 6, 106, 20); g.bezierCurveTo(120, 30, 112, 46, 98, 44); g.quadraticCurveTo(92, 46, 86, 40); TO.fs(TO.shade(spec.skin, -0.04), 4.5);
      TO.curve([98, 30], [88, 30], [90, 42], 3.5, TO.shade(spec.skin, -0.3)); }
    else { g.beginPath(); g.moveTo(88, 10); g.quadraticCurveTo(108, 24, 90, 34); TO.fs(spec.skin, 4.5); } // nose bump
    TO.ell(-12, 10, 14, 20); TO.fs(spec.skin, 4.5); TO.curve([-6, 0], [-18, 4], [-10, 20], 3, TO.shade(spec.skin, -0.3));
    hairDef.side?.(g, t); if (spec.hat) HAT[spec.hat].side(g, spec.hatCol);
    faceSide(spec, expr, o); if (spec.facial) FACIAL[spec.facial].side(g, t); if (spec.glasses) GLASSES[spec.glasses].side(g);
    if (spec.cheeks) { TO.ell(40, 34, 12, 7); g.fillStyle = 'rgba(240,120,110,.4)'; g.fill(); }
    return; }
  hairDef.back?.(g, t);
  for (const s of [-1, 1]) { TO.ell(s * 90, 10, 13, 20); TO.fs(spec.skin, 4.5); }
  TO.head(0, 0, 92, spec.skin);
  hairDef.front?.(g, t); hairDef.frontTop?.(g, t); if (spec.hat) HAT[spec.hat].front(g, spec.hatCol);
  faceFront(spec, expr, o); if (spec.facial) FACIAL[spec.facial].front(g, t); if (spec.glasses) GLASSES[spec.glasses].front(g);
}

// character(idOrSpec, x, y, s, o): o = { t, view:'front'|'side', facing:1|-1, pose (name|object), expr, talk, lookX, lookY, blink,
//   prop: { R: fn(g), L: fn(g) } drawn at the hands (front), or { N: fn, F: fn } (side) }. Returns { head:[x,y], hands }.
export function character(id, x, y, s = 1, o = {}) {
  const g = G(), spec = typeof id === 'string' ? (CAST[id] || CAST.man) : id, view = o.view || 'front', side = view === 'side';
  const P = typeof o.pose === 'string' || !o.pose ? pose(o.pose || 'stand', side) : o.pose, t = o.t || 0, f = o.facing ?? 1;
  if (o.voice) { o = { ...o, talk: o.talk ?? o.voice.talk, browUp: o.browUp ?? o.voice.brow }; }
  const B = { head: 1, legs: 1, arms: 1, torso: 1, width: 1, ...(spec.build || {}), ...(o.build || {}) };
  const kid = spec.kid ? 0.78 : 1, SK = spec.skin, slv = spec.sleeve || 'long', sc = spec.sleeveCol || spec.outfit?.color || '#20232c';
  const dir = (a, sg = 1) => [sg * Math.sin(a), Math.cos(a)], go = (p, d, L) => [p[0] + d[0] * L, p[1] + d[1] * L];
  g.save(); g.translate(x, y); g.scale(s * f, s);
  TO.ell(0, 10, side ? 80 : 110, 16); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill();
  g.scale(kid, kid);
  const hip = [0, -96 * B.legs + 2 + (P.dy || 0) * B.legs], lean = P.lean || 0;
  const TL = 240 * B.torso, neck = [hip[0] + Math.sin(lean) * TL, hip[1] - Math.cos(lean) * TL];
  const rot = (dx, dy) => [neck[0] + dx * Math.cos(lean) - dy * Math.sin(lean), neck[1] + dx * Math.sin(lean) + dy * Math.cos(lean)];
  const armPts = (sh, a, sg) => { const e = go(sh, dir(a[0], sg), 104 * B.arms), h = go(e, dir(a[0] + a[1], sg), 100 * B.arms); return [sh, e, h]; };
  const legPts = (h0, l, sg) => { const k = go(h0, dir(l[0], sg), 48 * B.legs * (P.tk ?? 1)), ft = go(k, dir(l[0] + l[1], sg), 48 * B.legs); return [h0, k, ft]; };
  const drawArm = (A, prop) => { if (slv === 'long') TO.sleeve(A, sc); else if (slv === 'short') { const m = [lerp(A[0][0], A[1][0], 0.45), lerp(A[0][1], A[1][1], 0.45)]; TO.line([m, A[1], A[2]], 9); TO.line([A[0], m], 40, INK); TO.line([A[0], m], 31, spec.outfit?.color || sc); } else TO.line(A, 9); TO.hand(A[2][0], A[2][1], 17, SK); if (prop) { g.save(); g.translate(A[2][0], A[2][1]); prop(g); g.restore(); } };
  const drawLeg = (L, sg) => { TO.line(L, 9); TO.ell(L[2][0] + sg * 12, L[2][1] + 2, 24, 11); TO.fs(spec.shoe || '#1b1c22', 4); };
  let hands;
  if (!side) {
    const shL = rot(-98 * B.width, 34 * B.torso), shR = rot(98 * B.width, 34 * B.torso), aL = armPts(shL, P.aL, -1), aR = armPts(shR, P.aR, 1);
    const lL = legPts([hip[0] - 22, hip[1]], P.lL, -1), lR = legPts([hip[0] + 22, hip[1]], P.lR, 1);
    if (P.aL[2]) drawArm(aL, o.prop?.L); if (P.aR[2]) drawArm(aR, o.prop?.R);
    drawLeg(lL, -1); drawLeg(lR, 1);
    g.save(); g.translate(neck[0] + (view === '3q' ? 8 : 0), neck[1]); g.rotate(lean); g.scale(B.width * (view === '3q' ? 0.9 : 1), B.torso); torsoFront(spec.outfit || {}, t); g.restore();
    const hp = rot(0, -96 * B.head + (P.nod || 0)); g.save(); g.translate(hp[0], hp[1]); g.rotate(P.tilt || 0); if (f < 0 && view !== '3q') g.scale(-1, 1); g.scale(B.head * 1.06 / kid * (spec.kid ? 0.86 : 1), B.head * 1.06 / kid * (spec.kid ? 0.86 : 1)); drawHead(spec, view === '3q' ? '3q' : 'front', o.expr || spec.expr || 'neutral', o); g.restore();
    if (!P.aL[2]) drawArm(aL, o.prop?.L); if (!P.aR[2]) drawArm(aR, o.prop?.R);
    hands = { L: aL[2], R: aR[2] };
  } else {
    const sh = rot(6, 30 * B.torso), aN = armPts(sh, P.aN, 1), aF = armPts(rot(-6, 30 * B.torso), P.aF, 1);
    const lN = legPts([hip[0] + 6, hip[1]], P.lN, 1), lF = legPts([hip[0] - 6, hip[1]], P.lF, 1);
    g.save(); g.globalAlpha = 1; drawArm(aF, o.prop?.F); g.restore(); drawLeg(lF, 1);
    if (spec.outfit?.type !== 'robe') drawLeg(lN, 1);
    g.save(); g.translate(neck[0], neck[1]); g.rotate(lean); g.scale(B.width, B.torso); torsoSide(spec.outfit || {}, t); g.restore();
    if (spec.outfit?.type === 'robe') drawLeg(lN, 1);
    const hp = rot(8, -96 * B.head); g.save(); g.translate(hp[0], hp[1]); g.rotate(P.tilt || 0); g.scale(B.head * 1.06 / kid * (spec.kid ? 0.86 : 1), B.head * 1.06 / kid * (spec.kid ? 0.86 : 1)); drawHead(spec, 'side', o.expr || spec.expr || 'neutral', o); g.restore();
    drawArm(aN, o.prop?.N); hands = { N: aN[2], F: aF[2] };
  }
  g.restore();
  return { hands };
}

// portrait(id, x, y, s, o): head only (for expression sheets, bigFace-style close-ups, thumbnails). o = { view, expr, talk, t }
export function portrait(id, x, y, s = 1, o = {}) { const g = G(), spec = typeof id === 'string' ? (CAST[id] || CAST.man) : id; g.save(); g.translate(x, y); g.scale(s * (o.facing ?? 1), s); drawHead(spec, o.view || 'front', o.expr || spec.expr || 'neutral', o); g.restore(); }

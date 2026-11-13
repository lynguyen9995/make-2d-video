// engine/toon3d.js — 3D props in the toon look (toon shading + dark inverted-hull outline + emissive glow for bloom).
// Use inside a kind:'3d' shot:  import { chip3d, toonSky } from '/engine/toon3d.js';
//   init(T){ const st = T.stage({ fog:false, bloom:0.9, bloomThreshold:0.7 }); st.scene.background = toonSky(T);
//            const chip = chip3d(T.THREE); st.add(chip.group); return { stage: st, chip }; }
//   draw(s, t, info, T){ s.chip.update(t, { crackStart:1.1, crackEnd:2.4 }); /* move s.stage.camera */ }
// project(T, chip, [x,y,z]) gives screen coords (logical units) so 2D toon hands can hold the 3D prop in overlay().
import { E, clamp, lerp, prog } from './core.js';

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; }

export function toonKit(THREE) {
  const grad = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
  const black = new THREE.MeshBasicMaterial({ color: 0x07080a, side: THREE.BackSide });
  const toon = c => new THREE.MeshToonMaterial({ color: c, gradientMap: grad });
  // box with a constant-thickness dark outline (inverted hull)
  function box(parent, w, h, d, mat, x, y, z, outline = 0.025) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); if (outline) { const o = new THREE.Mesh(m.geometry, black); o.scale.set(1 + (2 * outline) / w, 1 + (2 * outline) / h, 1 + (2 * outline) / d); m.add(o); } return m; }
  return { toon, black, box, grad };
}

// Night sky + dark mountains + cliff ledge as a scene background texture (toon outlines)
export function toonSky(T, o = {}) {
  return T.canvasTex(1920, 1080, (b, W, H) => {
    const gr = b.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, o.top || '#050b14'); gr.addColorStop(0.55, o.mid || '#0c2a2c'); gr.addColorStop(1, '#08161a'); b.fillStyle = gr; b.fillRect(0, 0, W, H);
    const r = rng(3); for (let i = 0; i < 140; i++) { b.fillStyle = `rgba(220,240,255,${0.3 + r() * 0.6})`; b.beginPath(); b.arc(r() * W, r() * H * 0.55, 0.8 + r() * 1.8, 0, 7); b.fill(); }
    const aur = b.createRadialGradient(W * 0.55, H * 0.55, 40, W * 0.55, H * 0.55, W * 0.5); aur.addColorStop(0, o.haze || 'rgba(80,255,120,.22)'); aur.addColorStop(1, 'rgba(80,255,120,0)'); b.fillStyle = aur; b.fillRect(0, 0, W, H);
    const mount = (pts, col) => { b.beginPath(); b.moveTo(-20, H); for (const [x, y] of pts) b.lineTo(x, y); b.lineTo(W + 20, H); b.closePath(); b.fillStyle = col; b.fill(); b.lineWidth = 5; b.strokeStyle = '#020406'; b.lineJoin = 'round'; b.stroke(); };
    mount([[-20, 640], [180, 520], [330, 600], [520, 470], [700, 580], [900, 500], [1100, 610], [1320, 480], [1520, 590], [1720, 520], [1940, 600]], '#0f2226');
    mount([[-20, 760], [240, 690], [420, 740], [640, 660], [880, 770], [1180, 700], [1440, 760], [1700, 680], [1940, 740]], '#0a171a');
  });
}

// Glowing microchip that cracks: substrate, emissive frame, gold pads/pins, 8x8 emissive tiles, zigzag crack, sparks.
export function chip3d(THREE, o = {}) {
  const K = toonKit(THREE), group = new THREE.Group(), add = (...a) => K.box(group, ...a);
  const glowCol = new THREE.Color(o.color || 0x30ff20);
  add(4, 0.22, 4, K.toon(o.board || 0x123018), 0, 0, 0, 0.035);
  const frameMat = new THREE.MeshBasicMaterial({ color: glowCol.clone().multiplyScalar(1.4) });
  for (const s of [-1, 1]) { add(3.7, 0.04, 0.07, frameMat, 0, 0.13, s * 1.82, 0); add(0.07, 0.04, 3.7, frameMat, s * 1.82, 0.13, 0, 0); }
  const gold = K.toon(0xe0b43a);
  for (let i = 0; i < 14; i++) { const p = -1.43 + i * 0.22; for (const s of [-1, 1]) { add(0.09, 0.03, 0.09, gold, p, 0.125, s * 1.6, 0.012); add(0.09, 0.03, 0.09, gold, s * 1.6, 0.125, p, 0.012); } }
  for (let i = 0; i < 16; i++) { const p = -1.8 + i * 0.24; for (const s of [-1, 1]) { add(0.12, 0.07, 0.24, gold, p, -0.02, s * 2.1, 0.02); add(0.24, 0.07, 0.12, gold, s * 2.1, -0.02, p, 0.02); } }
  add(2.75, 0.12, 2.75, K.toon(0x0b1a0d), 0, 0.17, 0, 0.03);
  const tiles = [], N = 8, TS = 0.27, GAP = 0.055, start = -(N * TS + (N - 1) * GAP) / 2 + TS / 2;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const m = new THREE.MeshBasicMaterial({ color: 0x7dff3a }); const x = start + i * (TS + GAP), z = start + j * (TS + GAP); add(TS, 0.05, TS, m, x, 0.255, z, 0.012); tiles.push({ m, x, z }); }
  const pts = o.crack || [[-0.35, -1.38], [-0.1, -1.0], [-0.42, -0.62], [0.05, -0.25], [-0.18, 0.12], [0.3, 0.45], [0.02, 0.8], [0.4, 1.38]];
  const crackMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfffbe0).multiplyScalar(2.2) });
  const segs = []; let total = 0;
  for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], c = pts[k + 1], dx = c[0] - a[0], dz = c[1] - a[1], L = Math.hypot(dx, dz); const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 0.07), crackMat); m.position.y = 0.29; m.rotation.y = -Math.atan2(dz, dx); group.add(m); segs.push({ m, a, dx, dz, L, s0: total }); total += L; }
  const dist = (x, z) => { let best = 9; for (const s of segs) { const t = clamp(((x - s.a[0]) * s.dx + (z - s.a[1]) * s.dz) / (s.L * s.L)); best = Math.min(best, Math.hypot(x - (s.a[0] + s.dx * t), z - (s.a[1] + s.dz * t))); } return best; };
  for (const tl of tiles) tl.d = dist(tl.x, tl.z);
  const at = u => { let d = u * total; for (const s of segs) { if (d <= s.L) { const t = d / s.L; return [s.a[0] + s.dx * t, s.a[1] + s.dz * t]; } d -= s.L; } return pts[pts.length - 1]; };
  const sparkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff27a).multiplyScalar(2) });
  const sparks = []; { const r = rng(11); for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), sparkMat); group.add(m); sparks.push({ m, u: r(), vx: (r() - 0.5) * 2.2, vy: 1.2 + r() * 2.2, vz: (r() - 0.5) * 2.2, dt: r() }); } }
  const light = new THREE.PointLight(glowCol, 1.5, 6, 1.6); group.add(light); light.position.set(0, 1.2, 0);
  function update(t, u = {}) {
    const c0 = u.crackStart ?? 1.1, c1 = u.crackEnd ?? 2.4, base = u.brightness ?? 1.0;
    const cg = prog(t, c0, c1) * total;
    for (const s of segs) { const len = clamp(cg - s.s0, 0, s.L); s.m.visible = len > 0; s.m.scale.x = Math.max(len, 0.001); s.m.position.x = s.a[0] + (s.dx / s.L) * len / 2; s.m.position.z = s.a[1] + (s.dz / s.L) * len / 2; }
    for (const tl of tiles) { let k = base; const die = u.die === false ? 0 : prog(t, c1 + 0.2 + tl.d * 1.6, c1 + 0.8 + tl.d * 1.6); if (t > c0 && tl.d < 0.3 && cg > 0) k *= Math.floor(t * 14 + tl.x * 9) % 3 ? 1.4 : 0.25; k = lerp(k, 0.12, die); tl.m.color.setRGB(glowCol.r * 0.9 * k + 0.05 * k, glowCol.g * k, glowCol.b * k); }
    light.intensity = lerp(1.5, 0.4, prog(t, c1 + 0.4, c1 + 2.6));
    for (const s of sparks) { const t0 = c0 + s.dt * (c1 - c0 + 1.2), lt = t - t0; if (cg <= 0 || lt < 0 || lt > 0.9) { s.m.visible = false; continue; } s.m.visible = true; const [cx, cz] = at(clamp(s.u * prog(t0, c0, c1) + 0.02)); s.m.position.set(cx + s.vx * lt, 0.3 + s.vy * lt - 3 * lt * lt, cz + s.vz * lt); s.m.scale.setScalar(1 - lt); }
  }
  return { group, update, tiles };
}

// world point on an object -> logical screen coords (for 2D overlays that interact with a 3D prop)
export function project(T, obj, p, camera) { const v = new T.THREE.Vector3(...p); obj.updateMatrixWorld(); obj.localToWorld(v); v.project(camera); return [((v.x + 1) / 2) * E.W, ((1 - v.y) / 2) * E.H]; }

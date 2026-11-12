// engine/rig3d-cast.js - character presets + drawn faces for engine/rig3d.js.
// Look values ported from thuann-vn/claude-3d-animated-shorts engine/main.js (MIT): white flat head, brush outline
// in screen pixels, pear body, noodle limbs, white mittens, flat-colour clothes with patterns.
//
//   const SR = three.rig3d; SR.use(st.scene);
//   const an = SR.build(char3d({ jacket: '#e8742a', jacket2: '#b5561a', pattern: ['plaid', '#c95f06'], hat: 'cap', hatCol: '#d6402e' }), new THREE.Vector3(0, 0, 0), 0);
//   face3d(an, 'wide');                    // calm talk wide shout listen serious laugh smug flat pale squint grin
//   per frame: SR.clipAt(an, 'idle', t); SR.updateLimbs(an);   // clips: idle walk run agree headShake sad_pose sneak_pose

const IK = '#17141a', WH = '#fbf7ef';
const EX = 82, LW = 26;

// RicksClips-like base: every character shares head size/shape; differences come from clothes and hats.
export const BASE3D = {
  rick: true, head: 'ball', headCol: '#ffffff', headR: 0.3, headShape: 'rround', flatHead: true, headLift: 0.78, headFwd: 0.55,
  headInk: 0.004, headInkClean: true, inkPx: 4.5, bodyW: 0.82, bodyInk: 0.02, roundBottom: true, limbK: 0.6, noodle: true, mitten: true,
  armCol: '#3a2418', legCol: '#2b2230', shoeCol: '#3a2b26', shoe: '#111', sole: '#111', flatCloth: true, capBack: true, style: 'tunic',
  jacket: '#e8742a', jacket2: '#b5561a', face: () => {},
};
export const char3d = (o = {}) => ({ ...BASE3D, ...o });

// pose3d(SR, c, clip, t, o) — sample a Mixamo clip, push the arms out of the pear body (the clips keep them inside it),
// then rebuild the noodle limbs. Call once per frame per character. o.spread (default 0.5 rad), o.bend (forearm, 0.3).
export function pose3d(SR, c, clip = 'idle', t = 0, o = {}) {
  SR.clipAt(c, clip, t);
  const sp = o.spread ?? 0.5, bd = o.bend ?? 0.3;
  if (sp || bd) { const f = c.root.getWorldDirection(new SR.THREE_V()); // character forward (+z) in world
    SR.rotWorld(c.bone('LeftArm'), f, sp); SR.rotWorld(c.bone('RightArm'), f, -sp);
    SR.rotWorld(c.bone('LeftForeArm'), f, -bd); SR.rotWorld(c.bone('RightForeArm'), f, bd); }
  if (o.after) o.after(c);
  SR.updateLimbs(c);
}

// ---------- faces (canvas decals on the white head) ----------
const dots = (g, px = 0, py = 0, r = 1) => { g.fillStyle = IK; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * EX + px * 20, py * 20, 24 * r, 30 * r, 0, 0, 7); g.fill(); } };
const ringEyes = (g, pr = 22) => { for (const sd of [-1, 1]) { g.fillStyle = WH; g.strokeStyle = IK; g.lineWidth = 20; g.beginPath(); g.ellipse(sd * EX, -6, 68, 82, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = IK; g.beginPath(); g.arc(sd * EX, 0, pr, 0, 7); g.fill(); } };
const brows = (g, tilt = 0, y = -112, lw = 40) => { lw *= 0.85; g.strokeStyle = IK; g.lineWidth = lw; g.lineCap = 'round'; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 125, y + tilt * 34); g.quadraticCurveTo(sd * 200, y - 16 - tilt * 2, sd * 275, y - tilt * 34); g.stroke(); } };
const mSmile = (g, w = 70, y = 205, d = 0.5) => { g.strokeStyle = IK; g.lineWidth = LW; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + w * d * 2, w, y); g.stroke(); };
const mFlat = (g, w = 55, y = 215) => { g.strokeStyle = IK; g.lineWidth = LW; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y - 8, w, y); g.stroke(); };
const mFrownS = g => { g.strokeStyle = IK; g.lineWidth = 15; g.beginPath(); g.moveTo(-22, 100); g.quadraticCurveTo(2, 84, 26, 102); g.stroke(); };
const mFrown = (g, w = 60, y = 225) => { g.strokeStyle = IK; g.lineWidth = LW; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y - 45, w, y); g.stroke(); };
const mOpen = (g, w = 80, h = 95, y = 185) => { w *= 0.75; h *= 0.8; g.fillStyle = '#5c1212'; g.strokeStyle = IK; g.lineWidth = 14; g.beginPath(); g.moveTo(-w, y - 10); g.quadraticCurveTo(0, y - 24, w, y - 10); g.quadraticCurveTo(w * 0.8, y + h, 0, y + h); g.quadraticCurveTo(-w * 0.8, y + h, -w, y - 10); g.fill(); g.stroke();
  g.save(); g.clip(); g.fillStyle = '#ef3b3b'; g.beginPath(); g.ellipse(0, y + h, w * 0.55, h * 0.45, 0, 0, 7); g.fill(); g.restore(); };
const mO = (g, r = 30, y = 225) => { g.strokeStyle = IK; g.lineWidth = 24; g.beginPath(); g.ellipse(0, y, r, r * 1.2, 0, 0, 7); g.stroke(); };
const mWavy = (g, y = 225) => { g.strokeStyle = IK; g.lineWidth = 24; g.beginPath(); for (let i = 0; i <= 6; i++) g.lineTo(-72 + i * 24, y + (i % 2 ? -13 : 13)); g.stroke(); };
const happyEyes = g => { g.strokeStyle = IK; g.lineWidth = 30; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * EX - 55, 12); g.quadraticCurveTo(sd * EX, -58, sd * EX + 55, 12); g.stroke(); } };
const lidEyes = g => { for (const sd of [-1, 1]) { g.save(); g.beginPath(); g.rect(sd * EX - 60, -78, 120, 120); g.clip(); g.fillStyle = IK; g.beginPath(); g.ellipse(sd * EX + 3, -70, 27, 32, 0, 0, 7); g.fill(); g.restore();
  g.strokeStyle = IK; g.lineWidth = 14; g.beginPath(); g.moveTo(sd * EX - 36, -78); g.quadraticCurveTo(sd * EX, -84, sd * EX + 38, -76); g.stroke(); } };
const sweat = g => { g.fillStyle = '#6cc3ff'; g.strokeStyle = IK; g.lineWidth = 8; g.beginPath(); g.moveTo(330, -200); g.quadraticCurveTo(372, -110, 330, -95); g.quadraticCurveTo(288, -110, 330, -200); g.fill(); g.stroke(); };
const moust = g => { g.fillStyle = IK; g.beginPath(); g.moveTo(-10, 150); g.quadraticCurveTo(-90, 140, -130, 215); g.quadraticCurveTo(-80, 175, -10, 182); g.closePath(); g.fill(); g.beginPath(); g.moveTo(10, 150); g.quadraticCurveTo(90, 140, 130, 215); g.quadraticCurveTo(80, 175, 10, 182); g.closePath(); g.fill(); };

export const FACES3D = {
  calm: g => { lidEyes(g); mFrownS(g); },
  talk: g => { dots(g); brows(g, 0.05); mOpen(g, 52, 62, 195); },
  wide: g => { ringEyes(g, 20); brows(g, -0.5, -150, 34); mO(g, 26, 235); },
  shout: g => { dots(g, 0, 0, 0.85); brows(g, 0.7, -108); mOpen(g, 95, 115, 175); },
  listen: g => { lidEyes(g); brows(g, 0.5, -84); mFlat(g, 34); },
  serious: g => { lidEyes(g); brows(g, 0.45, -88); mFlat(g, 50); },
  laugh: g => { happyEyes(g); brows(g, -0.25, -120, 34); mOpen(g, 90, 105, 165); },
  smug: g => { lidEyes(g); brows(g, 0.2, -86); g.strokeStyle = IK; g.lineWidth = LW; g.beginPath(); g.moveTo(-55, 205); g.quadraticCurveTo(10, 240, 75, 180); g.stroke(); },
  flat: g => { dots(g, 0, 0.2, 0.9); brows(g, -0.15); mFlat(g, 40); },
  pale: g => { ringEyes(g, 18); brows(g, -0.55, -152, 32); mWavy(g); sweat(g); },
  squint: g => { g.strokeStyle = IK; g.lineWidth = 30; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * EX - 55, 6); g.lineTo(sd * EX + 55, 0); g.stroke(); } brows(g, 0.4, -70); mFrown(g); },
  grin: g => { dots(g); brows(g, -0.2, -125); mSmile(g, 85, 190, 0.6); },
  sad: g => { dots(g, 0, 0.3, 0.9); brows(g, -0.6, -120, 34); mFrown(g, 50, 230); },
};
const big = f => g => { g.translate(0, -24); g.scale(1.42, 1.22); f(g); };

// face textures are built once per rig (canvas -> texture) and shared by every character
const CACHE = new WeakMap();
export function face3d(c, mood = 'calm', SR = null) {
  const rig = SR || c._rig; if (!rig) throw new Error('face3d: pass the rig (three.rig3d) the first time');
  c._rig = rig; let T = CACHE.get(rig); if (!T) { T = {}; CACHE.set(rig, T); }
  const key = (c.opts.moust ? 'm:' : '') + mood;
  if (!T[key]) { const f = FACES3D[mood] || FACES3D.calm; T[key] = rig.faceTex(big(c.opts.moust ? (g => { f(g); moust(g); }) : f), false, true); }
  c.faceMesh.material.map = T[key]; c.faceMesh.material.needsUpdate = true;
}

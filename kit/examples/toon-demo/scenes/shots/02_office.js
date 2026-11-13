import { registerShot, ease, prog, lerp } from '/engine/core.js';
import * as TO from '/engine/toon.js';
registerShot('t003', { draw(g, t, info) {
  TO.use(g, t);
  const p = ease.inOut(prog(t, 0, info.dur)), z = lerp(1, 1.1, p), shake = t > 3.6 && t < 3.8 ? Math.sin(t * 90) * 6 : 0;
  g.save(); g.translate(960, 540); g.scale(z, z); g.translate(-960 + lerp(0, 30, p) + shake, -540 + lerp(0, -10, p));
  TO.office1995Back(t, { year: '1995' }); TO.bankerSeated(930, t); TO.office1995Front(t, { money: [1000000, 0], crashAt: 3.4, ringAt: [3.6, 5.2] });
  g.restore();
  TO.comic('RENG! RENG!', 1530, 330, 96, prog(t, 3.6, 3.9), '#ffd23f', 0.06);
  if (t > 4.6) TO.comic('Thôi xong...', 560, 960, 90, prog(t, 4.6, 4.95), '#fff3d6', -0.03);
}});

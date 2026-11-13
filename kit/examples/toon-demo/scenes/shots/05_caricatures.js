import { registerShot, prog, lerp } from '/engine/core.js';
import * as TO from '/engine/toon.js';
// Caricatures of public figures: simple round heads, likeness carried by hair + glasses + outfit. Label them; no invented quotes, no logos.
registerShot('t006', { draw(g, t, info) {
  TO.use(g, t);
  const z = 1 + 0.05 * prog(t, 0, info.dur); g.save(); g.translate(960, 540); g.scale(z, z); g.translate(-960, -540);
  TO.keynote(t, { big: 'AI', sub: 'biếm hoạ · cùng một style', spots: [560, 1360] });
  TO.part(1, () => TO.jensenToon(560, 930, t)); TO.part(2, () => TO.gatesToon(1360, 930, t));
  g.restore();
  for (const [nm, x] of [['Jensen Huang', 560], ['Bill Gates', 1360]]) TO.handTitle(nm, x, 1010, 72, '#f6f3ea', 'center', 0);
}});

import { registerShot, ease, prog, clamp, lerp } from '/engine/core.js';
import * as TO from '/engine/toon.js';
registerShot('t001', { draw(g, t, info) {
  TO.use(g, t);
  const p = ease.inOut(prog(t, 0, info.dur)), z = lerp(1, 1.08, p);
  g.save(); g.translate(960, 540); g.scale(z, z); g.translate(-960 - lerp(0, 40, p), -540);
  TO.classroom(t); TO.chalk('Bài 1: Bầu trời', 320, 220); TO.chalk('= ?', 790, 410, 120, '#8fd0ff', 0.75);
  const wave = t < 1.6, pt = ease.inOut(prog(t, 1.6, 2.0)), up = ease.outBack(clamp(t / 0.4));
  const wx = lerp(80, 150, up) + Math.sin(t * 11) * 30, wy = lerp(-130, -320, up);
  const talking = (t > 0.3 && t < 1.4) || (t > 2.2 && t < 3.6);
  TO.kid(640, 900, 1.25, { t, hx: wave ? wx : lerp(wx, 160, pt), hy: wave ? wy : lerp(wy, -345, pt), point: !wave, lookX: 0.6, lookY: t < 1.8 ? 0 : -0.9, brow: t > 1.8 ? 8 : 2, blink: (t % 3.1) > 3.0, talk: talking ? Math.abs(Math.sin(t * 14)) : 0 });
  TO.scholar(1150, 900, 1.2, { t, think: t > 2.6 });
  g.restore();
  TO.comic('?', 760, 260 + Math.sin(t * 5) * 6, 150, prog(t, 1.9, 2.3), '#ffd23f', Math.sin(t * 3) * 0.08);
  TO.comic('TẠI SAO TRỜI LẠI XANH?', 960, 985, 92, prog(t, 2.4, 2.8));
  if (t > 3.7) TO.comic('Hừm...', 1350, 250, 78, prog(t, 3.7, 4.0), '#fff3d6');
}});
registerShot('t002', { draw(g, t) { TO.use(g, t); g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080); TO.handReveal(['Vì', 'sao', 'nhỉ...'], 330, 520, 120, t, 0.3); } });

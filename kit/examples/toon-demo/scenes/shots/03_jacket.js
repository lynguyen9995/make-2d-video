import { registerShot, prog } from '/engine/core.js';
import * as TO from '/engine/toon.js';
registerShot('t004', { draw(g, t) {
  TO.use(g, t);
  TO.rays(0, 960, '#1f5a35', '#256b40', t); TO.rays(960, 1920, '#5a1f24', '#6b262c', -t);
  TO.panel(0, 960, () => { TO.platform(480, 900, 360); TO.part(1, () => TO.bikerUncle(480, 900, t)); TO.tag(760, 520, Math.sin(t * 2.2) * 0.08, '300K', '/ cổ phiếu'); });
  TO.panel(960, 1920, () => { TO.platform(1440, 900, 360);
    TO.part(2, () => { g.save(); g.translate(1440, 330 + Math.sin(t * 1.3) * 4); TO.line([[0, -600], [0, -96]], 3); g.rotate(Math.sin(t * 1.6) * 0.05);
      g.beginPath(); g.arc(0, -78, 16, Math.PI * 1.05, Math.PI * 0.2, false); g.lineWidth = 5; g.strokeStyle = '#9aa1ad'; g.stroke();
      g.beginPath(); g.moveTo(-120, 0); g.quadraticCurveTo(0, -70, 120, 0); g.lineTo(112, 10); g.quadraticCurveTo(0, -54, -112, 10); g.closePath(); TO.fs('#c8955a', 4);
      g.translate(0, 14); TO.jacket(t, { sleeves: true, sheen: (t * 0.35) % 1.3 }); g.restore(); });
    TO.tag(1660, 640, Math.sin(t * 2.6 + 1) * 0.1, '225K', '/ cổ phiếu', '#c4302b');
    TO.comic('RỚT GIÁ!', 1440, 980, 104, prog(t, 2.2, 2.6), '#ffd23f', -0.04); });
  TO.divider(960);
}});

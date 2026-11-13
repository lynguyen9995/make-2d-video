import { registerShot, prog, lerp, clamp } from '/engine/core.js';
import * as TO from '/engine/toon.js';
import * as TR from '/engine/toon-rig.js';
import * as TP from '/engine/toon-props.js';
const bg = (g, title) => { g.fillStyle = '#efe9dc'; g.fillRect(0, 0, 1920, 1080); TO.handTitle(title, 40, 50, 54, '#141218', 'left', 0); };
const label = (g, s, x, y, size = 24) => { g.font = `${size}px "${TO.F.hand}"`; g.fillStyle = '#3a3540'; g.textAlign = 'center'; g.fillText(s, x, y); };
registerShot('c001', { draw(g, t) { TO.use(g, t); bg(g, `Tư thế nhìn thẳng (${TR.POSE_IDS.length}) — TR.POSES`);
  TR.POSE_IDS.forEach((id, i) => { const c = i % 11, r = Math.floor(i / 11), x = 90 + c * 174, y = 340 + r * 310; TR.character('man', x, y, 0.4, { t, pose: id, expr: 'smile' }); label(g, id, x, y + 32); }); } });
registerShot('c002', { draw(g, t) { TO.use(g, t); bg(g, 'Góc nghiêng — TR.walk / TR.run / TR.SIDE_POSES');
  for (let i = 0; i < 8; i++) { const x = 120 + i * 120; TR.character('nhoc', x, 330, 0.42, { t, view: 'side', pose: TR.walk(i / 8 * Math.PI * 2), expr: 'happy' }); } label(g, 'walk (8 khung)', 540, 365, 28);
  for (let i = 0; i < 8; i++) { const x = 1080 + i * 105; TR.character('gates', x, 330, 0.4, { t, view: 'side', pose: TR.run(i / 8 * Math.PI * 2), expr: 'determined' }); } label(g, 'run (8 khung)', 1450, 365, 28);
  TR.SIDE_POSE_IDS.forEach((id, i) => { const x = 140 + i * 230; TR.character(['jensen', 'woman', 'banker', 'ongdo'][i % 4], x, 900, 0.5, { t, view: 'side', pose: id, expr: 'neutral' }); label(g, id, x, 940); }); } });
registerShot('c003', { draw(g, t) { TO.use(g, t); bg(g, `Biểu cảm (${TR.EXPRESSIONS.length}) — expr`);
  TR.EXPRESSIONS.forEach((e, i) => { const c = i % 10, r = Math.floor(i / 10), x = 110 + c * 185; TR.portrait('nhoc', x, 230 + r * 230, 0.62, { t: 0.2, expr: e }); label(g, e, x, 320 + r * 230); TR.portrait('jensen', x, 700 + r * 230, 0.62, { t: 0.2, expr: e }); label(g, e, x, 790 + r * 230); }); } });
registerShot('c004', { draw(g, t) { TO.use(g, t); bg(g, `Dàn nhân vật (${TR.CAST_IDS.length}) — TR.CAST`);
  TR.CAST_IDS.forEach((id, i) => { const x = 120 + i * 210; TR.character(id, x, 520, 0.6, { t, expr: 'smile' }); label(g, id, x, 560); TR.character(id, x, 1000, 0.6, { t, view: 'side', expr: 'neutral' }); label(g, id + ' (nghiêng)', x, 1040, 20); }); } });
registerShot('c005', { draw(g, t) { TO.use(g, t); bg(g, `Đạo cụ (${TP.PROPS.length + 3}) — TP.* và TO.tag / TO.chip2d / TO.jacket`);
  const cells = TP.PROPS.map(n => [n, (x, y) => { const k = { moneyStack: () => TP.moneyStack(x, y, 0.7), coin: () => TP.coin(x, y - 40, 0.9, 0.3), goldBar: () => TP.goldBar(x, y, 0.8), moneyBag: () => TP.moneyBag(x, y, 0.8), phone: () => TP.phone(x, y - 60, 0.7), laptop: () => TP.laptop(x, y, 0.55), chartBoard: () => TP.chartBoard(x, y, 0.38, 'crash', 1, 'VN-Index'), arrow: () => TP.arrow(x, y - 60, 0.6, 'down'), briefcase: () => TP.briefcase(x, y, 0.8), cup: () => TP.cup(x, y, 1, t), newspaper: () => TP.newspaper(x, y, 0.6), lightbulb: () => TP.lightbulb(x, y, 0.8), trophy: () => TP.trophy(x, y, 0.7), piggy: () => TP.piggy(x, y, 0.6, true), speech: () => TP.speech(x, y - 60, 'Xin chào!', 0.6), thought: () => TP.thought(x, y - 60, 'Hừm...', 0.6), house: () => TP.house(x, y, 0.55), rocket: () => TP.rocket(x, y - 30, 0.55), bomb: () => TP.bomb(x, y, 0.7), gear: () => TP.gear(x, y - 50, 0.9, t) }[n]; k(); }]);
  cells.push(['tag', (x, y) => TO.tag(x, y - 90, 0.05, '300K', '/ cổ phiếu')], ['chip2d', (x, y) => TO.chip2d(x, y - 60, 0.9)], ['jacket', (x, y) => { g.save(); g.translate(x, y - 150); g.scale(0.55, 0.55); TO.jacket(t, { sleeves: true }); g.restore(); }]);
  cells.forEach(([n, fn], i) => { const c = i % 8, r = Math.floor(i / 8), x = 130 + c * 235, y = 320 + r * 310; fn(x, y); label(g, n, x, y + 40, 26); }); } });
registerShot('c006', { draw(g, t) { TO.use(g, t); bg(g, 'Bối cảnh — TP.street / livingRoom / cafe / tradingFloor + TO.classroom / office1995 / keynote');
  const sets = [['street', () => TP.street(t)], ['street (đêm)', () => TP.street(t, { night: true })], ['livingRoom', () => TP.livingRoom(t)], ['cafe', () => TP.cafe(t)], ['tradingFloor', () => TP.tradingFloor(t)], ['classroom', () => TO.classroom(t)], ['office1995', () => { TO.office1995Back(t); TO.office1995Front(t); }], ['keynote', () => TO.keynote(t, { big: 'AI' })]];
  sets.forEach(([n, fn], i) => { const c = i % 3, r = Math.floor(i / 3), x = 40 + c * 620, y = 100 + r * 320; g.save(); g.beginPath(); g.rect(x, y, 600, 300); g.clip(); g.translate(x, y); g.scale(600 / 1920, 300 / 1080); fn(); g.restore(); g.lineWidth = 4; g.strokeStyle = '#141218'; g.strokeRect(x, y, 600, 300); label(g, n, x + 300, y + 330, 26); }); } });
// motion test: side walk -> stop -> turn to camera -> talk with expressions -> sit
registerShot('c007', { draw(g, t, info) { TO.use(g, t); const { GY } = TP.street(t);
  const walkEnd = 3.2, x = lerp(200, 1100, clamp(t / walkEnd));
  if (t < walkEnd) TR.character('nhoc', x, 900, 1, { t, view: 'side', pose: TR.walk(t * Math.PI * 2 * 0.9), expr: 'happy' });
  else { const lt = t - walkEnd; const P = TR.breathe(TR.posesAt(lt, [[0, 'stand'], [0.4, 'wave'], [1.6, 'explain'], [3.0, 'shrug'], [4.0, 'sit']], 0.3), t);
    const expr = lt < 1.6 ? 'happy' : lt < 3.0 ? 'surprised' : lt < 4.0 ? 'confused' : 'smug';
    if (lt > 3.85) { g.save(); TO.rr(x - 120, 900 - 60, 240, 24, 6); TO.fs('#8a5a32', 5); g.restore(); }
    TR.character('nhoc', x, 900, 1, { t, pose: P, expr, talk: lt > 1.6 && lt < 3 ? Math.abs(Math.sin(t * 12)) : 0 }); }
  TR.character('woman', 1600, 900, 0.95, { t, pose: TR.breathe(TR.posesAt(t, [[0, 'stand'], [4, 'handsHips'], [6.5, 'think']], 0.3), t, 1, 2), expr: t < 4 ? 'smile' : t < 6.5 ? 'smug' : 'thinking', facing: -1 });
  TO.handTitle('Thử chuyển động: đi nghiêng → quay mặt → nói → ngồi', 60, 60, 46, '#141218', 'left', 0); } });

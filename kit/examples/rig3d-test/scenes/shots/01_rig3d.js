// Test for engine/rig3d.js + post3d.js: a dusk room, two 3D cartoon characters, cinematic grade, DOF close-up.
import { E, V, registerShot, mood, ease, clamp, lerp } from '/engine/core.js';

const BOY = { jacket: '#e8742a', jacket2: '#b5561a', pattern: ['plaid', '#c95f06'], details: ['buttons'], btn: '#6a3208', hat: 'cap', hatCol: '#d6402e' };
const GIRL = { jacket: '#f2cf2c', jacket2: '#c9a516', pattern: ['dots', '#f39ac2'], details: ['collar'], collarCol: '#ee5d9f' };

function room(T, st, M) {
  st.add(T.ground(30, 30, M.floor, T.planks(M.floor, 14, [6, 6])));
  st.add(T.box(14, 4, 0.2, M.wall, 0, 2, -3));
  st.add(T.box(0.2, 4, 10, M.wall, -5, 2, 1));
  const win = T.windowPane(1.8, 1.6, { glowColor: M.practical, cols: 2, rows: 2, power: 0.9 }); win.position.set(1.6, 2.1, -2.88); st.add(win);
  const sh = T.shaft(1.8, 5, M.practical, 0.06); sh.position.set(1.4, 1.4, -1.2); sh.rotation.x = -0.9; st.add(sh);
  st.add(T.box(1.6, 0.75, 0.8, '#3a2a2e', -2.2, 0.375, -2.3), T.box(0.5, 0.35, 0.05, '#20202a', -2.2, 0.95, -2.5));
  const lamp = new T.THREE.PointLight(M.practical, 6, 6, 1.6); lamp.position.set(-2.2, 1.6, -2); st.add(lamp);
}

registerShot('a1', {
  kind: '3d', rig3d: true,
  init(T) {
    const M = mood('interiorWarm'), SR = T.rig3d;
    const st = T.stage({ mood: 'interiorWarm', fov: V(30, 40), fog: [8, 30], keyPos: [3, 6, 4], keyIntensity: 3.2, ambient: 2.4, exposure: 1.2, post: 'cinematic' });
    room(T, st, M); SR.use(st.scene);
    const boy = SR.build(T.char3d(BOY), new T.THREE.Vector3(-0.55, 0, 0), 0.45);
    const girl = SR.build(T.char3d(GIRL), new T.THREE.Vector3(0.6, 0, 0.2), -0.5);
    T.face3d(boy, 'talk', SR); T.face3d(girl, 'smug', SR);
    return { stage: st, SR, boy, girl };
  },
  draw(s, t, info, T) {
    T.pose3d(s.SR, s.boy, 'agree', t); T.pose3d(s.SR, s.girl, 'idle', t + 0.7);
    const k = ease.inOut(clamp(t / info.dur));
    T.dolly(s.stage.camera, t, [[0, { pos: [0.4, 1.7, 6.2], look: [0, 1.0, 0] }], [info.dur, { pos: [0.1, 1.5, 4.6], look: [0, 1.05, 0] }]]);
  },
});

registerShot('a2', {
  kind: '3d', rig3d: true,
  init(T) {
    const M = mood('interiorWarm'), SR = T.rig3d;
    const st = T.stage({ mood: 'interiorWarm', fov: 30, fog: [8, 30], keyPos: [3, 6, 4], keyIntensity: 3.2, ambient: 2.4, exposure: 1.2, post: { preset: 'cinematic', dof: { aperture: 0.006, maxblur: 0.012 } } });
    room(T, st, M); SR.use(st.scene);
    const boy = SR.build(T.char3d(BOY), new T.THREE.Vector3(0, 0, 0), 0.2);
    const girl = SR.build(T.char3d(GIRL), new T.THREE.Vector3(1.3, 0, -1.4), -0.6);
    T.face3d(boy, 'wide', SR); T.face3d(girl, 'flat', SR);
    return { stage: st, SR, boy, girl };
  },
  draw(s, t, info, T) {
    T.pose3d(s.SR, s.boy, 'idle', t); T.pose3d(s.SR, s.girl, 'idle', t + 1.3);
    T.dolly(s.stage.camera, t, [[0, { pos: [-0.35, 1.7, 3.4], look: [0, 1.45, 0] }], [info.dur, { pos: [-0.2, 1.68, 2.8], look: [0, 1.5, 0] }]]);
    s.stage.post.focusOn([0, 1.6, 0]);
  },
});

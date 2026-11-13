import { registerShot, ease, prog, lerp } from '/engine/core.js';
import * as TO from '/engine/toon.js';
import { chip3d, toonSky, project } from '/engine/toon3d.js';
// 3D prop (toon-shaded chip with bloom) + 2D toon character in overlay() holding it: 2.5D like the reference channels.
registerShot('t005', { kind: '3d',
  init(T) { const st = T.stage({ fog: false, bloom: 0.55, bloomThreshold: 0.8, ambient: 1.4, keyIntensity: 1.6, keyPos: [-3, 6, 8] });
    st.scene.background = toonSky(T); const chip = chip3d(T.THREE); st.add(chip.group);
    st.camera.fov = 32; st.camera.updateProjectionMatrix(); return { stage: st, chip, T }; },
  draw(s, t, info) { const p = ease.inOut(prog(t, 0, info.dur)), cam = s.stage.camera;
    cam.position.set(lerp(3.4, 0.8, p) + (t > 1.1 && t < 1.5 ? Math.sin(t * 80) * 0.06 : 0), lerp(1.2, -1.6, p), lerp(13.5, 12.5, p)); cam.lookAt(0.9, -0.9, 0); cam.updateMatrixWorld();
    s.chip.group.position.set(1.0, 0.9, 0); s.chip.group.rotation.set(1.05 + Math.sin(t * 1.7) * 0.04, 0.25 + Math.sin(t * 1.1) * 0.05, -0.32 + Math.sin(t * 2.3) * 0.03);
    s.chip.update(t, { crackStart: 1.1, crackEnd: 2.4 }); },
  overlay(g, t, info, s) { TO.use(g, t);
    const cam = s.stage.camera, hL = project(s.T, s.chip.group, [-1.3, 0, 2.15], cam), hR = project(s.T, s.chip.group, [0.7, 0, 2.15], cam);
    TO.kidHoldUp(hL, hR, t);
    TO.handTitle('CON CHIP', 110, 130, 130);
    TO.comic('TOANG RỒI!!', 1520, 760, 120, prog(t, 2.2, 2.55));
    TO.comic('-400 TỶ', 1560, 140, 128, prog(t, 3.3, 3.65), '#ff5a4e', -0.06); } });

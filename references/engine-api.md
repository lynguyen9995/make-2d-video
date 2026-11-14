# Engine reference

## Folder layout
```
make-2d-video-studio/
  render.mjs  player.html  package.json
  engine/   core.js styles.js rig2d.js fx2d.js ui2d.js three-kit.js player.js
  tools/    doctor.py verify_kit.py new_project.py transcribe.py parse_script.py beats.py common.py envelope.py join_segments.py
    jobs/   common.ps1 set_duration.py make_srt.py setup.ps1 setup-studio.bat  templates/ (full.ps1, 2-full.bat)
  audio/    dsp.py sfx.py music.py mix.py
  examples/reaction-time/   (reference project: scenes + story)
  projects/<slug>/
     config.json   input/ (voiceover, script, music)   timeline/ (words, sentences, beats)
     story/shots.json  story/bible.md   scenes/cast.js  scenes/sets/*.js  scenes/shots/*.js
     assets/ (picked images, assets/_raw/ = unpicked)   story/plan.md (handoff notes)   jobs/ (*.bat, *.ps1, logs/)
     build/ (temporary: sheets, stills, styles, parts, music.wav, mix.wav, video_silent.mp4)
     out/ (deliverables only: <title>.mp4, <title>.en.srt, thumbnail, youtube.txt)
```
Every `.js` under `scenes/` is loaded automatically (files starting with `_` are skipped). Import the engine with absolute paths (`'/engine/core.js'`) and project files relatively (`'../cast.js'`).

## config.json
`{ title, lang: "vi"|"en"|… (ISO code of the video language; drives Whisper, fonts and on-screen text), aspect: "16:9"|"9:16", resolution: "720p"|"1080p"|"1440p"|"2160p", fps: 24, style: "dusk" (| "paper" for the toon cast), cast: "stick"|"3d"|"toon" (informational: which drawing style the scenes use), voiceover, script, duration, captions: bool, captionStyle?: {y,size,max}, bars: null|"wide"|"scope"|"none"|number, fadeIn: 0.5, fadeOut: 0.8, music: {enabled, gainDb, file?, seed?, key?}, sfx: {enabled, gainDb}, loudness: -14 }`

## story/shots.json
```json
{ "title": "…", "duration": 312.4,
  "shots": [ { "id": "s001", "start": 0, "end": 3.4, "line": "spoken words", "scene": "what we see", "set": "cafe",
               "bars": null, "in": {"type": "cut|fade|dip|dipWhite|flash|whip|zoom", "dur": 0.4, "dir": 1},
               "sfx": [{"at": 0.4, "name": "buzz", "gain": -10}], "amb": {"name": "murmur", "gain": -26},
               "params": {}, "vignette": true, "captions": true, "notes": "" } ],
  "music": [ {"start": 0, "end": 42, "mood": "mystery", "intensity": 0.4} ],
  "sfx": [ {"t": 120.5, "name": "impact", "gain": -6} ] }
```

## Shot modules
```js
import { E, V, registerShot, mood, layer, blurLayer, veil, ease, prog, key, wordTime, talkAmount } from '/engine/core.js';
import { drawFigure, POSES, posesAt, breathe, walkPose, bigFace, headPos } from '/engine/rig2d.js';
import * as FX from '/engine/fx2d.js';  import * as UI from '/engine/ui2d.js';
import { lab } from '../sets/lab.js';  import { MAX, DOC } from '../cast.js';

registerShot('s013', { draw(g, t, info) {            // 2D: g = canvas ctx in logical units, t = seconds into the shot
  const cam = { z: 1 + 0.06 * ease.inOut(t / info.dur), x: -30 };
  const { GY, M } = lab(g, t, cam);
  layer(g, cam, 1, g => drawFigure(g, { x: E.W/2 - 40, y: GY, s: 1.4, facing: -1, outfit: DOC,
        pose: breathe(posesAt(t, [[0, 'stand'], [0.4, 'point']]), t), expr: 'smile', rim: { color: M.rim, dir: [0, -1] } }));
  FX.dust(g, t);
}});
registerShot('s008', { kind: '3d',                   // 3D: init once (T = three-kit), draw per frame, optional 2D overlay
  init(T, info) { const st = T.stage({ mood: 'golden' }); /* build */ return { stage: st }; },
  draw(s, t, info, T) { T.orbit(s.stage.camera, t, { target: [0, 1, 0], radius: 6, height: 2.5, from: -0.8, to: 0.3, dur: info.dur }); },
  overlay(g, t, info, s) { /* 2D graphics on top, logical units */ } });
```
`info = { dur, globalT, p, line, shot, ...shot.params }`. An exception inside a shot is printed to the console and drawn as red text on the frame, so check the render output.

## Core, rig, FX and UI API (logical units: 16:9 → 1920×1080, 9:16 → 1080×1920)
- **core.js:** `E` (W, H, PX, fps, vertical, cfg, words, shots), `V(h, v)`, `clamp lerp prog ease{linear,in,out,inOut,sine,outBack,outElastic} key(t, [[t,v],…], ease) mixVal rng(seed) noise(x, seed) shake(t, amp, freq, seed) talkAmount(globalT, from, to) wordTime(word, afterGlobalT)`, colour `rgb css mix alpha shade`, `mood(name) S() setStyle`, draw `rr seg poly circle ring linGrad radGrad glow fillRect backdrop veil text measure FONTS`, camera `layer(g, cam, depth, fn) blurLayer(g, amount, fn, cam?, depth?)`, `registerShot getShot`.
- **rig2d.js:** `drawFigure(g, {x, y, s, facing, pose, rot, outfit, expr, talk, blink, look:[x,y], rim:{color, dir, w}, dim, alpha, prop, shadow, trail})`. Poses: `POSES.{stand, relaxed, talk, explain, point, pointUp, wave, cheer, handsOnHead, crossArms, think, shrug, holdFront, phone, reach, sad, facepalm, ready, crouch, sit, sitBack, kneel, lie(+rot), dive(+rot), kick, jump, fall}`, plus `posesAt, blendPose, breathe, walkPose(phase, {run})`, `face(g, x, y, r, {expr, talk, blink, look, front})`, `bigFace(g, cx, cy, r, {outfit, expr, talk, blink, look, rimColor, rimSide, tilt})`, `headPos(o) → [x, y, r]`, `soccerBall(g, x, y, r, rot)`. Props: `phone, ball, paper, cup, paddle, pointer, tablet, flashlight`. Outfit: `top: hoodie|labcoat|trench|jersey|tshirt|suit|dress|tracksuit|none, color, color2, legs, head: cap|capBack|beanie|fedora|headband|visor|hood|ponytail|bun|curly|spiky|none, headColor, face: glasses|sunglasses, gloves, number, kid`. Custom poses are plain objects with the 11 points; edit a copy (`{...POSES.sit, hF:[34,-188]}`).
- **fx2d.js:** `rain drops dust snow stars fog sun moon godRays lightCone pool lensStreak sparkle lightning speedLines rings skyline hills clouds tree pine lampPost windowFrame facade door chair stool counter screen bed clock floorLines crowd`.
- **toon.js / toon3d.js (toon cast):** see `references/style-bible-toon.md` → API cheat sheet. Call `TO.use(g, t)` first in each draw/overlay.
- **ui2d.js:** `titleCard bigLine badge readout callout dimension dataCard compareBars meter blueprint bpStroke lineFigure bubble endScreen captions`.

## three-kit.js (passed as `T` to `init`/`draw`)
`T.stage({mood, fov, fog:[near, far], sky, keyPos, keyIntensity, ambient, bloom})` → `{scene, camera, composer, sun, add(...objs), render(), dispose()}`. Builders: `box cyl cone sphere plane ground(w, d, color, tex) planks tiles windowPane(w, h, {glowColor, cols, rows, power, interior}) shaft(w, len, color, opacity) building(w, h, d, {color, win, lit}) tree3D pine3D crowd3D({rows, perRow, width, step, rise, colors}) figure3D(outfit, {rim, pose, s}) → .setPose(pose)`, `mat basic canvasTex`, and cameras `orbit(camera, t, {target, radius, height, from, to, dur})` and `dolly(camera, t, [[t, {pos, look, fov}], …])`. Units are metres, a figure is ~1.7 m and faces +x. 3D shots get the same grade, bars and grain automatically. Keep exposure moody: let windows and lamps be the brightest things, and keep the floor dark.


## 3D cartoon characters + cinematic post (rig3d, post3d)
Optional add-on for `kind: '3d'` shots: rigged 3D cartoon people (white flat head with drawn face, brush outline, pear body,
noodle limbs, white mittens, flat-colour clothes with patterns, hats) and a cinematic post chain (depth of field, ACES +
warm/teal grade, god rays, SMAA). Ported from thuann-vn/claude-3d-animated-shorts (MIT). Files: `engine/rig3d.js`,
`engine/rig3d-cast.js`, `engine/post3d.js`, rig `engine/assets/rigs/Xbot.glb`. Reference project: `examples/rig3d-test`.

```js
registerShot('s12', {
  kind: '3d', rig3d: true,                       // rig3d: true -> the player preloads the rig before any init()
  init(T) {
    const SR = T.rig3d;
    const st = T.stage({ mood: 'interiorWarm', fov: 32, ambient: 2.4, keyIntensity: 3.2, exposure: 1.2,
      post: { preset: 'cinematic', dof: { aperture: 0.006, maxblur: 0.012 } } });   // post: true | 'cinematic' | 'warm' | 'cool' | 'neutral' | {...}
    SR.use(st.scene);                            // ALWAYS before build: characters go into this shot's scene
    const boy = SR.build(T.char3d({ jacket: '#e8742a', jacket2: '#b5561a', pattern: ['plaid', '#c95f06'], hat: 'cap', hatCol: '#d6402e' }),
      new T.THREE.Vector3(0, 0, 0), 0.3);        // position (metres, ~1.8 m tall), yaw
    T.face3d(boy, 'wide', SR);                   // calm talk wide shout listen serious laugh smug flat pale squint grin sad
    return { stage: st, SR, boy };
  },
  draw(s, t, info, T) {
    T.pose3d(s.SR, s.boy, 'idle', t);            // clips: idle walk run agree headShake sad_pose sneak_pose; arms pushed out of the body
    T.dolly(s.stage.camera, t, [[0, { pos: [0, 1.6, 4], look: [0, 1.3, 0] }], [info.dur, { pos: [0, 1.6, 3.2], look: [0, 1.4, 0] }]]);
    s.stage.post.focusOn([0, 1.5, 0]);           // DOF focus on the face (only when post.dof is set)
  },
});
```
- `char3d(o)` options: `jacket`, `jacket2`, `pattern: [stripes|hstripes|pinstripe|plaid|dots|zigzag|vest, colour2]`,
  `details: ['buttons','tie','bow','hoodie','vestBtn','hanky','polo','pocket','strings','zip','belt','sash','collar']`,
  `hat: cap|nonla|boonie|beret|pith|m1|cap79` + `hatCol`, `glasses`, `beard`, `moust` (moustache face), `tieCol`, `collarCol`.
- `pose3d(SR, c, clip, t, { spread, bend, after })`: `after(c)` runs after the clip, before the limbs are rebuilt — custom IK
  goes there (`SR.limb`, `SR.rotWorld`, `SR.pose(c, 'rope_pull'|'shoulder_push', t, {...})`).
- Lighting: these characters have dark limbs, so light 3D rooms brighter than the stick-figure sets (ambient ~2.4, key ~3.2,
  exposure ~1.2) or the arms and legs vanish into the floor. With `post` on, bloom is lowered so the white heads don't glow.
- `post` does its own ACES tone mapping; the player's style grade, vignette and grain still apply on top, so keep post vignette/grain at 0.
- QC: heads the same size in every shot, outline visible at the farthest shot, arms and legs readable against the floor.

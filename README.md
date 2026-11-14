# make-2d-video (Claude Code skill)

Personal copy of the **Thanh Hai Learn AI 2D Studio** skill for Claude Code: narrated videos where every frame is drawn
by code (HTML canvas + Three.js), rendered frame by frame in headless Chromium and encoded with ffmpeg.

Private repository. The studio kit has no licence of its own, so do not make this repository public.

## Contents
| Path | What it is |
|---|---|
| `SKILL.md` | The skill: the full pipeline from voiceover to final MP4 |
| `references/` | Style bible, story breakdown, engine API, sound design, render QC, install |
| `kit/` | The studio that gets installed into a workspace as `thanhhai-2d-studio/` |
| `kit/engine/rig3d.js`, `rig3d-cast.js`, `post3d.js` | Add-on: 3D cartoon characters and cinematic post for `kind: '3d'` shots |
| `channel.json` | Channel defaults (name, language, 9:16, 30 fps, dusk, captions, pacing); copy next to the studio on a new machine |
| `kit/tools/join_segments.py` | Joins per-sentence VieNeu clips into one voiceover with fixed pauses |
| `kit/examples/rig3d-test/` | Two-shot reference project for the 3D add-on |
| `kit/engine/toon.js`, `toon3d.js` | Toon cast (3rd drawing style): outlined flat 2D cartoon characters, wardrobe, props, sets, comic text, caricatures; toon-shaded 3D props with glow |
| `references/style-bible-toon.md` | Look and rules for the toon cast |
| `kit/examples/toon-demo/` | Six-shot reference project for the toon cast |
| `kit/engine/toon-rig.js`, `toon-props.js` | Toon cast library: characters (front + side), 31 poses, walk/run, 19 expressions, 20 props, 4 more sets |
| `kit/examples/toon-catalog/` | Catalog of everything the toon cast has (render with `--sheet`) + a motion test |

## Changelog
- **0.5.0** — toon: lively motion (`act`), audio-driven lip sync (`tools/envelope.py`, `voice`, `speak`), 3/4 view, 2 new expressions,
  caricature options (nose, brows, hair variants), camera punch/shake/drift, self-drawing line chart, page-turn transition, image backgrounds
  (`config.images` + `bgImage`, e.g. Google Flow backgrounds), sentence-aware captions, Kress caricature, chair/nameplate/letter props.
  Rule: characters in code, AI images only for hard backgrounds.
- **0.4.0** — toon library (own rig, poses, expressions, cast, props, sets, catalog).

## Install
Copy this folder to `~/.claude/skills/make-2d-video/`, then ask Claude Code to "làm video 2D" / "make a 2D video".

## Credits
- 3D add-on ported from [thuann-vn/claude-3d-animated-shorts](https://github.com/thuann-vn/claude-3d-animated-shorts) (MIT),
  which builds on [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) (MIT).
- `Xbot.glb` rig from the [three.js](https://github.com/mrdoob/three.js) examples (MIT).

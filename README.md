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
| `kit/examples/rig3d-test/` | Two-shot reference project for the 3D add-on |

## Install
Copy this folder to `~/.claude/skills/make-2d-video/`, then ask Claude Code to "làm video 2D" / "make a 2D video".

## Credits
- 3D add-on ported from [thuann-vn/claude-3d-animated-shorts](https://github.com/thuann-vn/claude-3d-animated-shorts) (MIT),
  which builds on [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) (MIT).
- `Xbot.glb` rig from the [three.js](https://github.com/mrdoob/three.js) examples (MIT).

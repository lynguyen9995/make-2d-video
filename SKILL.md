---
name: make-2d-video
description: >
  This skill should be used when the user wants a narrated animated video in the make-2d-video style
  (cinematic stick figures with rim light, moody 2.5D sets, giant face close-ups, freeze-frames,
  data overlays, blueprint diagrams and low-poly 3D shots), e.g. "make a 2D video from this voiceover",
  "animate my script", "turn this narration into a stick figure video", "make a What If video", "make a cartoon explainer like Paper Billions",
  "create an animated explainer from my audio", or "do the whole video", and Vietnamese requests such as
  "làm video 2D", "làm video người que", "dựng video hoạt hình từ giọng đọc", "làm video What If". It runs the full pipeline:
  install, timestamps (Whisper), story breakdown, style choice, scene building, rendering, music, SFX and
  final MP4 in 16:9 or 9:16 at 720p to 4K. Three drawing styles: cinematic stick figures (default), a 3D cartoon
  cast, or the toon cast (outlined flat 2D cartoon with round heads, comic text, visual gags and caricatures).
metadata:
  version: "0.8.0"
  author: lynguyen9995
---

# make-2d-video studio: full video pipeline

Turn a voiceover (plus an optional script) into a finished MP4 where every frame is drawn by code (HTML canvas + Three.js), captured frame by frame in headless Chromium and encoded with ffmpeg. No image or video generation models are used, so characters stay consistent and text stays crisp. Invent the visuals fresh for every script; only the style is fixed.

**Bundled resources (this skill's base directory):**
- `kit/`: the tested studio (renderer, engine, tools, audio, the `examples/reaction-time` reference project). Install it into the workspace as `make-2d-video-studio/` (see `references/install.md`).
- `references/install.md`: install, dependency table, doctor, self-test.
- `references/style-bible.md`: **the look** (characters, sets, light, camera, editing, graphics, 9:16 rules, don'ts). Read it fully before designing any shot.
- `references/style-bible-toon.md`: the look for the **toon cast** (`cast: "toon"`). When the cast is toon, follow it instead of the parts of style-bible.md that conflict (rim light, no outlines, black silhouettes).
- `references/story-breakdown.md`: writing `story/bible.md` and `story/shots.json`, plus pacing rules.
- `references/engine-api.md`: the scene API, config and shots.json schemas, and the three-kit reference.
- `references/sound-design.md`: the music plan, SFX library, ambience and levels.
- `references/render-qc.md`: preview and final render, speed guide, QC checklist, troubleshooting.

Stage commands from this plugin re-run one stage: `/new-video` (stages 1–4), `/video-styles` (5), `/render-video` (6 and 8), `/video-sound` (7). When running end to end, follow this file and load references as each stage needs them.

## Golden rules
0. **Ask the video language first.** Before any other question, install, file or edit, ask the user which language the video is in (Stage 0). Every later step uses that language. Talk to the user in the language they write in.
1. **Keep the narration intact.** Never rewrite, add, drop or reorder spoken words. Every shot illustrates the words spoken while it is on screen.
2. **Same style, new pictures.** Invent sets, props, characters and actions from this script. Use `examples/reaction-time` only to learn the API.
3. **Show what is said, literally and specifically.** Abstract lines become visual metaphors, diagrams or close-up reactions.
4. **Draft, look, fix, then render.** Open contact sheets and stills yourself (read the PNGs) before any full render. Rendering is slow; looking is fast.
5. **Three user checkpoints:** setup choices, style choice from rendered samples, and the preview before the final render. If the user is away, take the defaults, state what was assumed, and continue.
6. **Files are the truth.** Each video lives in `make-2d-video-studio/projects/<slug>/`, and `story/shots.json` owns all timing.
   One video = one self-contained folder: `config.json`, `input/`, `assets/` (+ `assets/_raw/` for unpicked AI images), `scenes/`, `story/`
   (incl. `plan.md` handoff notes), `timeline/`, `jobs/` (+ `jobs/logs/`), `build/` (temporary, safe to delete), `out/` (deliverables only).
   Never put per-video files at the studio root or in a separate `_jobs/` folder.
7. **Only people in the story appear on screen (news/explainer videos).** No channel mascots or narrator/host characters
   (e.g. `nhoc`, `ongdo`) unless the user asks for them. Every named person in the news gets their own toon (signature hair, glasses,
   outfit, per the caricature rules in style-bible-toon.md) plus a name label, not a generic figure or a silhouette. Private or
   unnamed people (unconfirmed suspects, family members) stay anonymous: a generic unnamed toon or a silhouette with a role label.

## Channel defaults (`channel.json`)
Before Stage 0, look for `channel.json` next to `make-2d-video-studio/` (the workspace folder that holds the studio), then in the
current folder, then in this skill's base directory (the copy that travels with the skill; on a new machine copy it next to
the studio once it is installed). It can hold `name`, `lang`, `aspect`, `resolution`, `fps`, `style`, `cast` (`stick` | `3d` | `toon`), `captions`, `shotsPerMin` and `music`.
Every key present is the default for this video: skip the questions it answers (language, aspect, resolution, fps, captions,
style pick in Stage 5) and confirm them in ONE line instead, e.g. "Kênh Tí Tò Mò: tiếng Việt, 9:16, 1080p, 30 fps, dusk, có phụ đề."
Ask only what is still unknown (voiceover, script, title). `name` is the channel name for end cards.

## The three drawing styles (pick ONE cast per video)
| `cast` | Look | Engine | Style bible |
|---|---|---|---|
| `stick` (default) | Black stick figures with rim light, moody cinematic 2.5D sets | `rig2d.js` (+ `three-kit.js` for 3D establishing shots) | `style-bible.md` |
| `3d` | 3D cartoon cast: white flat heads, pear bodies, noodle limbs | `rig3d.js`, `rig3d-cast.js` (`kind: '3d'`, `rig3d: true`) | `style-bible.md` → "2D cast or 3D cast" |
| `toon` | Outlined flat 2D cartoon: round skin-tone heads, bean bodies, stick limbs, thick outlines, line boil, comic text, visual gags, caricatures of public figures; optional toon-shaded 3D hero props with glow | `toon.js`, `toon3d.js` | `style-bible-toon.md` |

`channel.json` → `cast` decides; otherwise ask once in Stage 1 (one line per style). For `toon` the default colour style is `paper`
(the cinematic grades also work but darken the flat colours). Study `examples/toon-demo/` before writing toon shots.

## News explainer mode (toon cast, the channel's main format)
When the user asks for a news / finance / tech / billionaire / investment-asset explainer, follow `kit/CLAUDE.md`
(installed as `make-2d-video-studio/CLAUDE.md`). It replaces stages 1–8 below with a gated workflow:
0 topic pick (3–5 candidates with source strength, risk and shelf life) ✋ → 1 sourced script + 3 titles + thumbnail concept ✋ →
2a voice and 2b asset manifest (`story/assets.md`: what to draw, count, made with Flow / user's image AI / code toon /
three.js + bloom) ✋ → 3 images + character sheets ✋ → 4 timing + scenes → 5 contact sheet of all shots + 30 s demo ✋ →
6 full render → 7 package (thumbnail, description with sources, chapters, stale-line list) ✋ → 8 upload ✋ → 9 review stats.
Scene images: no people, no text, no logos. Thumbnails: may contain people (stylised, never photoreal fakes of real people)
and ≤ 4 words of text. Never upload through the YouTube Data API from an unaudited project (uploads get locked private);
upload through the YouTube Studio website, saved Private/Scheduled, and publish only on the user's explicit go.
In a local Claude Code session run every command yourself; write `.bat` jobs only when you have no Windows shell.
Asset library: search `library/index.json` before making any image; candidates go to `assets/_review/` (review page:
`tools/library/build_review.py`), approved reusable assets to `library/` (`tools/library/build_catalog.py`); never overwrite
a candidate, rejected ones move to `_rejected/` and the redo takes the next letter. Rules in `kit/CLAUDE.md`.

## Stage 0: Video language (always first)
If `channel.json` gives `lang`, confirm it in the one-line summary above instead of asking. Otherwise, before asking anything else, creating files, installing or editing, ask exactly one question in the user's language, for example: **"Video này dùng ngôn ngữ nào? (ví dụ: Tiếng Việt, English, 日本語…)"**. Use AskUserQuestion when available. Wait for the answer, then map it to an ISO 639-1 code (`vi`, `en`, `ja`, `ko`, `es`, `pt`, `de`, `fr`, `hi`, …). If the user already named the video language earlier in this conversation, confirm it in one line instead of asking again.

The language code drives the whole pipeline:
- `--lang <code>` on `tools/new_project.py` (stored in `config.json` → `lang`). `tools/transcribe.py` reads it from the config.
- **All on-screen text** (title cards, labels, units, signs, chart captions, burned-in captions) is written in this language, short and correctly spelled with full diacritics. Never translate or change the spoken narration.
- Fonts: the renderer loads latin, latin-ext and Vietnamese glyphs; for `vi` the title font switches to Nunito automatically so accents render in one consistent font. For scripts the bundled fonts don't cover (Japanese, Korean, Chinese, Arabic, Hindi, Thai…), tell the user and check text stills carefully during QC.

## Stage 1: Intake
After the language is known, ask once (AskUserQuestion when available) for:
- **Voiceover file** (required). No recording yet? Make one with VieNeu (if its MCP tools are connected): synthesize ONE clip per
  sentence (`01.wav`, `02.wav`, … in a folder), write the sentences one per line in `sentences.txt` (optional `|0.8` pause or
  `|cham` slow-down markers, emotion tags like [cười] stay in the line), then
  `python -I tools/join_segments.py <clip_dir> sentences.txt voiceover.wav`. It joins the clips with fixed pauses (VieNeu merges
  short sentences and drops pauses when given a whole script) and writes `voiceover.wav.script.txt`, the clean text to pass as `--script`.
- **Script:** timestamped (SRT/VTT/JSON/TXT with `[mm:ss]`), plain text (best: aligned to the audio, keeping exact wording), or none (transcribed).
- **Aspect:** 16:9 or 9:16.
- **Resolution:** 720p / 1080p (recommended) / 1440p / 2160p (4K). Mention that higher resolutions take much longer to render.
- **Captions:** default on for 9:16, off for 16:9.
- **Music:** generated, the user's own file, or none. **SFX:** on or off.
- **Title.**

- **Cast** (drawing style): stick / 3d / toon, unless `channel.json` gives `cast`.

Don't ask about the colour style yet. Defaults (when `channel.json` doesn't say): 16:9, 1080p, 24 fps, generated music + SFX, cast `stick`, style `dusk` (`paper` for toon).

## Stage 2: Install or check the studio
Follow `references/install.md`: copy `kit/` to `make-2d-video-studio/` in the workspace (skip if already present), install dependencies, run `python tools/verify_kit.py` and `python tools/doctor.py`, then run the example self-test. Report what was installed in one short list. On Windows, if doctor finds ffmpeg only in the winget folder it writes `make-2d-video-studio/env.sh` and `env.ps1`; prefix render and mix commands with `source env.sh &&` (a shell started before the install doesn't see the new PATH).

## Stage 3: Project + timeline
Run inside `make-2d-video-studio/`. Use `python3` where `python` isn't Python 3.

**Windows without a usable terminal (computer use can only click in File Explorer):** put each long step in a job the user
double-clicks. Copy `tools/jobs/templates/full.ps1` + `2-full.bat` into `projects/<slug>/jobs/`; every job `.ps1` starts with
`$JobDir = $PSScriptRoot` and dot-sources `..\..\..\tools\jobs\common.ps1` (gives `$P`, `Run`, `Py`, `Say`, `Fail`, `Done`, and writes
`jobs/logs/<name>.log` + `<name>.status` = RUNNING / OK / FAILED for Claude to read). Shared helpers: `tools/jobs/set_duration.py`
(config.json duration from the voiceover), `tools/jobs/make_srt.py` (`out/<title>.en.srt` from `timeline/sentences.json`).
Studio install/repair on Windows: `tools/jobs/setup-studio.bat`.
```bash
python tools/new_project.py --name <slug> --voice "<voiceover path>" [--script "<script path>"] --aspect 16:9 --resolution 1080p --fps 24 --style dusk --title "<title>" --lang <code> [--captions]
```
- Timestamped script: `python tools/parse_script.py --project projects/<slug> --script projects/<slug>/input/script.<ext>`
- Plain script: `python tools/transcribe.py --project projects/<slug> --script projects/<slug>/input/script.txt --lang <code> --model small`. The match must be ≥ 90%; if it's lower, tell the user the script and audio differ.
- No script: `python tools/transcribe.py --project projects/<slug> --lang <code> --model small` (`base` on slow machines, `large-v3` for hard audio).

Check `timeline/transcript.txt` (its end should be near the voiceover length), then run `python tools/beats.py --project projects/<slug>` to get the beat sheet and a draft `story/shots.json`.

## Stage 4: Story breakdown
Read `references/style-bible.md` (or `references/style-bible-toon.md` for the toon cast) and `references/story-breakdown.md`. Write `story/bible.md` (logline, cast with one signature colour each, locations with moods and key lights, motifs, music plan, and whether the cast is 2D stick figures or 3D characters). Write `scenes/cast.js`. Rewrite `story/shots.json`: contiguous shots, cut on phrase boundaries 0.1–0.2 s early, an establishing shot per new location, and a concrete `scene` description for each. Pacing: 9:16 shorts run **30–40 shots per minute** (median 1.5–2 s); long 16:9 explainers run 15–25 (median 2–3.5 s). `channel.json` → `shotsPerMin` overrides both. Send the user a 5–10 line plan summary and continue unless they object.

## Stage 5: Style choice
If `channel.json` fixes `style`, use it and skip the comparison grid unless the user asks for it.
Build the 1–2 most-used sets plus 3 representative shots (a wide shot with ≥ 2 characters, a `bigFace` close-up, a data/blueprint or 3D shot). Then render:
```bash
node render.mjs --project projects/<slug> --styles dusk,midnight,golden,neon,storybook --at <t1>,<t2>,<t3> --scale 0.5
```
Open `build/styles/style_grid.png`, then show it with one line per style: **dusk** (mauve shadows, amber key, cream rim), **midnight** (cold navy, blue-white rims, sodium practicals), **golden** (warm orange and teal), **neon** (deep blacks, magenta and teal), **storybook** (soft pastel, low contrast). Save the pick in `config.json` → `style`. For tweaks, add a custom entry to `STYLES` in `engine/styles.js` (moods overrides plus the `grade` lift/gamma/gain, sat, contrast, vignette, grain, bloom) and re-render that row.

## Stage 6: Build every shot
Read `references/engine-api.md` and the example scenes in `examples/reaction-time/scenes/` once. Work in batches of 8–12 shots:
1. Write `scenes/sets/<location>.js` (reusable, anchored to `GY = E.H * V(0.8, 0.68)` and `CX = E.W/2`, with walls, floor and sky extended past the frame) and `scenes/shots/NN_<name>.js` with `registerShot('<id>', {...})` for the ids in shots.json.
2. Run `node render.mjs --project projects/<slug> --sheet --scale 0.5`. Open every `build/sheets/sheet_XX.png` and check it against the QC checklist in `references/render-qc.md`. Fix any MISSING shots, errors printed by the renderer, and composition problems.
3. Check motion with `--stills t1,t2,t3` or `--from A --to B --scale 0.5` (writes `build/preview.mp4`).

**Toon cast:** `import * as TO from '/engine/toon.js'`, call `TO.use(g, t)` first in every `draw()`/`overlay()`, build sets and
characters from the library (`TO.classroom`, `TO.office1995Back/Front`, `TO.keynote`, `TO.kid`, `TO.scholar`, `TO.jensenToon`…)
and ADD new reusable characters/sets/props to the toon library instead of one-off code. Characters, 31 front poses, side walk/run, 19
expressions: `engine/toon-rig.js` (`TR.character(id, x, y, s, { t, view, pose, expr, talk })`); props and sets: `engine/toon-props.js`.
v0.5 motion: `TR.act()` (overshoot + follow-through), lip sync `TR.voice(t)` + `TR.speak()` from `timeline/envelope.json` (`python -I tools/envelope.py --project …`),
3/4 view (`view: '3q'`), camera `TO.camFx`, `TO.lineChart`, `TO.pageTurn`, background images `config.images` + `TO.bgImage`. Rule: characters and
text, charts and effects are code; external AI images (e.g. Google Flow: flat vector cartoon, thick outlines, no people/text/logos) for backgrounds
and objects (objects on a flat green background, keyed out with ffmpeg chromakey to PNG) (style-bible-toon.md).
Before drawing anything new, render and look at `examples/toon-catalog` (everything that exists); after adding something new, add it to
the catalog (style-bible-toon.md → "Making NEW things"). The three styles are independent: toon shots never import rig2d/rig3d. Caricatures of real people: look at real
photos first, keep the head simple and carry the likeness with hair + glasses + outfit, label the name, no invented quotes, no
logos (style-bible-toon.md). 3D hero props: `engine/toon3d.js` (`chip3d`, `toonSky`, `project`) in a `kind: '3d'` shot, with the
2D characters drawn in `overlay()`.

**3D cartoon characters (optional):** `kind: '3d'` shots can use rigged 3D cartoon people and a cinematic post chain
(`rig3d: true`, `T.rig3d`, `T.char3d`, `T.face3d`, `T.pose3d`, `stage({ post })`; see engine-api.md, "3D cartoon characters").
Decide per video in the story bible and follow style-bible.md, "2D cast or 3D cast". Light 3D rooms brighter (ambient ~2.4,
key ~3.2, exposure ~1.2) so the dark limbs read, and expect 3D shots to render several times slower than 2D ones.

Non-negotiables from the style bible (stick cast; for toon follow style-bible-toon.md instead of the rim-light/colour items):
- Rim light on every lit figure.
- Colours from `mood()`/`S()`.
- A camera move in every shot.
- Atmosphere (dust, rain, glows).
- Moody value structure.
- Graphics synced to words with `wordTime()`.
- `V()` for every aspect-dependent value.
- No `Math.random`/`Date.now`.

## Stage 7: Sound
Read `references/sound-design.md`. Fill `story/shots.json` → `music` (contiguous mood sections) and add per-shot `sfx` cues and `amb` beds. Mixing happens after the final render (Stage 8), or run `python audio/mix.py --project projects/<slug>` now to audition `build/mix.wav`.

## Stage 8: Render and deliver
Read `references/render-qc.md`.
1. Preview: `node render.mjs --project projects/<slug> --from 0 --to 30 --scale 0.5`. Show the user the preview or a contact sheet before the long render.
2. Final: `node render.mjs --project projects/<slug>`. Run it in the background for long videos and poll the log. The log prints fps and ETA, so share the estimate.
3. Run `python audio/mix.py --project projects/<slug>`, which generates music and SFX, ducks the music under the voice, normalises to −14 LUFS and muxes `out/<title>.mp4`.
4. QC the final file: duration matches, audio is present, and a 1-frame-per-10-s contact sheet looks right. Deliver the MP4 (send the file), then give the location in plain words and one line on what to tweak next if needed.

## Defaults and judgement calls
- When unsure about a visual, choose the more literal, more cinematic option: a close-up for emotion, an insert for objects, a blueprint for mechanisms, 3D for big spaces.
- Keep about 30–40 shots per minute for 9:16 shorts and 15–25 for long 16:9 explainers (or `channel.json` → `shotsPerMin`). Use 1–3 freeze-frames per video and about one 3D establishing shot per minute (a 3D-cast video uses 3D for its character shots too).
- Keep each character's outfit colour fixed for the whole video, and keep screen direction consistent within a scene.
- Prefer re-rendering a fixed shot range over the whole video only when the user is comfortable splicing. Otherwise re-render everything.

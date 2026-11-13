# Style bible: the toon cast (third drawing style)

Use this file instead of `style-bible.md` when the video's cast is **toon** (`channel.json` / `config.json` → `"cast": "toon"`).
Camera, pacing, editing, sound and the pipeline stay the same as the other styles; only the look changes.
Engine: `engine/toon.js` (2D characters, wardrobe, props, sets, text) and `engine/toon3d.js` (toon-shaded 3D props with glow).
Reference project: `examples/toon-demo/` (classroom, handwriting card, office 1995, split screen, 3D chip, caricatures).

## The look in one paragraph
Bright, readable explainer cartoon in the spirit of business/finance explainer channels: **round skin-tone heads**, bean-shaped
bodies, **thin stick limbs** with small round hands, **thick dark outlines (6 px at 1080p) on everything**, flat colours with one
soft shadow side, a tiny hand-drawn "line boil" (every part jitters ~1 px, 8 times a second). Sets are flat vector rooms with
the same outlines (wood panels, chalkboards, windows, stages), lit by a few soft glows and light cones. Ideas are shown as
**visual metaphors and sight gags** (a jacket with a price tag, a cracked chip, a piggy bank with cobwebs), numbers pop in as
**comic text**, and pauses are handwritten words on black.

## Rules
1. **Call `TO.use(g, t)` first** in every 2D `draw()` and in every `overlay()`. It binds the canvas and the line-boil clock.
2. **Outlines everywhere.** Use `TO.fs(fill)` (fill + 6 px ink stroke) for every shape. Never leave a filled shape without an outline,
   except glows, light cones, shadows and highlights.
3. **Faces stay simple.** Round head, dot or small oval eyes (or eyes inside glasses), a single mouth line, maybe brows and one
   or two wrinkles. Never add realistic noses, cheek folds or eye bags to a toon head: realism breaks the style and, for
   caricatures, makes the likeness *worse* (tested).
4. **Recognition by silhouette.** A character is recognised by **hair shape + glasses/hat + outfit**. Test: cover the face; if
   you still know who it is, the design works. Keep each character's outfit and colours fixed for the whole video.
5. **Wrap characters in `TO.part(id, fn)`** (distinct id per character) so they boil independently.
6. **Show, don't tell.** For every abstract line, find a concrete object or gag (price tags for valuations, a cracking chip for a
   crash, a calendar for a date, a ringing phone for bad news, a split screen for before/after).
7. **Text:** comic pop numbers/exclamations with `TO.comic(str, x, y, size, progress, colour)` (Nunito 900 italic, thick outline,
   outBack pop). Handwritten labels with `TO.handTitle` and black-card pauses with `TO.handReveal` (Patrick Hand).
   **Do not use Bangers for Vietnamese**: it breaks Ơ/Ư (renders "RÓ·T"). Both fonts used here cover Vietnamese.
8. **Style:** use the `paper` style (neutral grade, light grain, soft vignette). Do not add your own grain/vignette in scenes.
9. **Every shot moves:** slow push-in or drift (`g.translate/scale` around the centre), plus character idle motion
   (breathing bob, blinks, talking mouth on the beat).
10. **2.5D:** big hero props can be 3D (`kind: '3d'` + `toon3d.js`: toon shading, dark inverted-hull outline, emissive parts that
    bloom). Draw the 2D toon characters in `overlay()`; use `project(T, obj, [x,y,z], camera)` so their hands follow the prop.

## Caricatures of real public figures
- Allowed for commentary/explainer videos, drawn **from the toon recipe**: simple round head + the person's 2–3 signature
  features (e.g. hair shape and parting, glasses, signature clothing). Look at real photos first and list those features.
- **Label** the figure (handwritten name), never put invented quotes in their mouth or on screens, do not use real company
  logos, keep the tone light (no degrading or defamatory gags).
- Do not copy another channel's character design line for line; build the figure from the recipe.
- Ready-made: `TO.jensenToon(x, y, t)` (silver hair with a jagged side-part fringe, small rectangular glasses, black tee +
  biker jacket, arms crossed) and `TO.gatesToon(x, y, t)` (neat salt-and-pepper hair, bold dark glasses, big smile, V-neck sweater
  over a shirt, waving).

## API cheat sheet (`import * as TO from '/engine/toon.js'`)
- **Primitives:** `use part fs rr ell line curve glow shade head ikArm hand eye sweat rng`, constants `INK OUT F`.
- **Text:** `comic handTitle handReveal chalk`.
- **Props/layout:** `tag` (hanging price tag), `rays` (sunburst bg), `platform` (round stage), `panel` + `divider` (split screen),
  `chip2d` (small glowing chip for hands).
- **Wardrobe** (origin = neck, ~210x240): `jacket(t, {sleeves, sheen, tee})`, `sweater(colour, shirt)`, `suit(colour, tie)`, `sleeve(pts)`, `legs(shoe)`.
- **Cast:** `kid(x, y, s, {t, hx, hy, point, lookX, lookY, brow, blink, talk, sweat})` (Nhóc), `kidHoldUp(hL, hR, t)`,
  `scholar(x, y, s, {t, think})` (ông đồ), `bankerSeated(cx, t)`, `bikerUncle(x, y, t)`, `jensenToon`, `gatesToon`.
- **Sets:** `classroom(t)` → `{GY, board}`, `office1995Back(t, {year, month})` + character + `office1995Front(t, {money, crashAt, ringAt})`,
  `keynote(t, {big, sub, spots})`.
- **3D (`/engine/toon3d.js`):** `chip3d(THREE, {color, crack})` → `{group, update(t, {crackStart, crackEnd, brightness, die})}`,
  `toonSky(T)`, `toonKit(THREE)` (toon material, outline box builder), `project(T, obj, point, camera)`.
  Suggested stage: `T.stage({ fog: false, bloom: 0.55, bloomThreshold: 0.8, ambient: 1.4, keyIntensity: 1.6, keyPos: [-3, 6, 8] })`.

## Growing the library
Every video should add 3–5 reusable assets (a character, a set, a prop) to `toon.js` instead of one-off code in the shot files.
That library is what makes a long video fast to produce. New characters reuse the body and `head()`; only hair, glasses and
outfit change.

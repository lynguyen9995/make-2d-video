# Style bible: the toon cast (third drawing style)

Use this file instead of `style-bible.md` when the video's cast is **toon** (`channel.json` / `config.json` → `"cast": "toon"`).
Camera, pacing, editing, sound and the pipeline stay the same as the other styles; only the look changes.
Engine: `engine/toon.js` (2D characters, wardrobe, props, sets, text) and `engine/toon3d.js` (toon-shaded 3D props with glow).
Reference projects: `examples/toon-demo/` (classroom, handwriting card, office 1995, split screen, 3D chip, caricatures) and
`examples/toon-catalog/` (**everything the toon cast has**: poses, side cycles, expressions, cast, props, sets).

**Independence:** the toon cast is self-contained. Toon shots import only `toon.js`, `toon-rig.js`, `toon-props.js`, `toon3d.js`
(+ `core.js` helpers and `ui2d.js` captions if needed). Never import `rig2d.js` / `rig3d.js` / `rig3d-cast.js` or reuse stick-figure
poses or 3D-cast characters in a toon video, and never use toon assets in the other two styles.

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

## Characters, poses and expressions (`import * as TR from '/engine/toon-rig.js'`)
- **Draw a character:** `TR.character(id | spec, x, y, s, { t, view: 'front'|'side', facing: 1|-1, pose, expr, talk, lookX, lookY, prop })`.
  Cast ids (`TR.CAST`): `nhoc, ongdo, banker, biker, jensen, gates, man, woman, student`. A spec is plain data
  `{ skin, hair, hat, glasses, facial, eyes:'dot'|'big', cheeks, kid, outfit:{type:'tee'|'jacket'|'sweater'|'suit'|'robe'|'dress', color, ...}, sleeve, shoe }`,
  so a new person = a new spec (`{ ...TR.CAST.man, hair: 'bob', outfit: { type: 'suit', color: '#333' } }`).
  Hair: `spiky silver neat bald baldRing short bob bun whiteSides`; hats: `khanxep cap`; glasses: `small bold round sun`; facial: `mustache goatee whiteBeard`.
- **Front poses (31, `TR.POSE_IDS`):** stand relaxed handsHips wave waveBoth point pointUp pointDown explain present shrug cheer crossArms
  handsBehind think facepalm handsOnHead shocked scared angry sad phone holdFront holdUp sit sitThink crouch jump fall bow victory.
  Animate with `TR.posesAt(t, [[0,'stand'],[1.2,'wave']], 0.3)`, `TR.breathe(pose, t)`, `TR.walkFront(phase)` (walk in place, move x yourself).
- **Side view (true profile):** `TR.walk(phase)`, `TR.run(phase)` (phase = t·2π·~0.9; move x ≈150/s walk, ≈420/s run at s=1) and
  `TR.SIDE_POSES`: stand point hold reach sit sad jump think (`posesAt(..., side=true)`).
- **Expressions (19, `TR.EXPRESSIONS`):** neutral smile happy grin laugh sad cry angry scared shocked surprised worried smug thinking
  sleepy confused determined wink love. `talk` (0..1) opens the mouth on the beat; blinking is automatic.
- **Close-ups:** `TR.portrait(id, x, y, s, { expr, view, talk })` draws the head only (reaction shots, thumbnails).
- **Props in hands:** `prop: { R: g => TP.phone(0, 0, 0.6) }` (front, L/R) or `{ N, F }` (side).

## Props and sets (`import * as TP from '/engine/toon-props.js'`)
- **Props (20):** moneyStack coin goldBar moneyBag phone laptop chartBoard(trend up|down|crash) arrow briefcase cup newspaper lightbulb
  trophy piggy speech thought house rocket bomb gear — plus `TO.tag`, `TO.chip2d`, `TO.jacket`.
- **Sets:** `TP.street(t, {night})`, `TP.livingRoom`, `TP.cafe`, `TP.tradingFloor(t, {trend})` — plus `TO.classroom`, `TO.office1995Back/Front`, `TO.keynote`.
  Each returns `{ GY }` (ground line for feet).

## Making NEW things in a video (poses, expressions, characters, props, sets)
New videos will need things that don't exist yet. Make them in code, never with image generators, and make them reusable:
1. Open the catalog first (`node render.mjs --project examples/toon-catalog --sheet`, read the PNGs) and reuse what exists.
2. **New pose:** add an entry to `POSES` (front) or `SIDE_POSES` in `toon-rig.js` using the angle convention at the top of the file;
   check it in the catalog sheet. **New expression:** add to `EX` (+ the name to `EXPRESSIONS`).
3. **New character:** add a spec to `CAST` (reuse hair/glasses/outfit types, or add a new hair/hat/glasses/outfit type with BOTH
   `front` and `side` drawings). Public figures follow the caricature rules below.
4. **New prop/set:** add a function to `toon-props.js` (outlines with `fs`, colours flat, returns `{ GY }` for sets) and its name to `PROPS`/`SETS`.
5. Add the new item to the matching shot in `examples/toon-catalog/scenes/shots/catalog.js`, re-render the sheet and look at it.
6. Keep one-off drawing inside shot files only for things that will never come back.

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

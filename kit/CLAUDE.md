# make-2d-video-studio — house rules for Claude

This folder is the studio of the skill `make-2d-video` (installed from github.com/lynguyen9995/make-2d-video, `kit/` = this studio).
Each video lives in `projects/<topic>-<demo|full>-<length>/` (e.g. `projects/jensen-full-10min/`). Read that video's
`story/plan.md` first when continuing work; update it at every milestone ("Progress log" + "Next session").

## Talking to the user
- Speak Vietnamese. Files, code and agent prompts in English.
- The user is a beginner: before work, turn a rough request into a clear brief; if something is missing, ask 1–3 short questions.
- Explain what you need from them in plain steps. Never leave a step half-done without saying so.

## Running things
- In a LOCAL Claude Code session on Windows: run every command yourself (node, python, ffmpeg). Do not write .bat files for the
  user to click. Long renders: run in the background and check the log every ~10 min.
- In a cloud chat session (no Windows shell): write `projects/<video>/jobs/*.bat` from `tools/jobs/templates/` and ask the user to
  double-click; read `jobs/logs/<name>.status` (RUNNING / OK / FAILED) and `.log`.
- Ask before: generating ElevenLabs voice (credits), git push, deleting files, installing software, uploading/publishing to YouTube.

## Topic scope (news explainer channel)
In scope: world news with economic impact, finance and markets, technology and AI, billionaires and big companies,
investment assets (stocks, gold, oil, crypto, real estate) — explained, not advised.
Avoid or handle with care: graphic violence and war casualties, partisan election content, health/medical claims, sexual
details of scandals, rumours about private people, "buy/sell now" calls, small-cap/meme coin promotion.
Every finance video: neutral explanation, no personal investment advice, line "Not financial advice" in the description.

## Workflow (✋ = stop and wait for the user's approval)
0. ✋ Topic pick: search the latest news; propose 3–5 topics, each with: why hot now, how solid the sources are, risk
   (legal / ad-friendly), shelf life (date it goes stale). User picks one.
1. ✋ Script: summary + explainer script, one sentence per line in `input/script.txt`, every fact with ≥2 sources where possible
   in `story/script_sources.md`; unconfirmed = "reportedly"; no invented quotes. Also: 3 title options, thumbnail concept,
   hook (first 5 s) that matches the thumbnail.
2a. Voice (after script approval): ElevenLabs "Professor Bill" (voice_id lnieQLGTodpbhjpZtg1k, eleven_v4), one WAV 24 kHz mono
   per sentence or paragraph → `input/voice/01.wav, 02.wav…`. (Engine may change later; keep this output format.)
2b. ✋ Asset manifest (in parallel with voice): `story/assets.md` table — shot/lines, what is shown, type (character / prop /
   background / chart / 3D), made with (code toon / Google Flow or the user's own image AI / three.js + bloom / code chart),
   count, reusable?, Flow prompt. User approves the list.
3. ✋ Images + characters: backgrounds and props from Flow (2–3 options each; props on flat green, keyed to PNG); new real-person
   characters as code toons with a character sheet. User picks images and approves faces. Save reusable characters to the library.
4. Timing + scenes: join voice, transcribe, envelope, line timing; storyboard (`story/shots.json`, a new picture every 2–4 s); scene code.
5. ✋ Demo: contact sheet of ALL shots (`--sheet --scale 0.5`) + 30 s preview. User approves or lists fixes.
6. Full render 1080p + music + SFX + `.srt`.
7. ✋ Package: thumbnail 1280×720, description with sources + "Not financial advice" where relevant, tags, chapters,
   list of lines that go stale by date. User watches the full video once.
8. ✋ Upload: the user uploads in YouTube Studio, or Claude uploads through the YouTube Studio website in the browser (not the
   Data API: API uploads from an unaudited project are locked private). Save as Private or Scheduled; publish only on the
   user's explicit go. Not made for kids. Declare altered/synthetic content if YouTube asks.
9. Later: after 2–7 days, review views / CTR / retention with the user and note lessons in `story/plan.md`.

## Picture rules
- Only people who are in the news appear. No channel mascots (ongdo, nhoc) in news videos.
- Each named person = their own toon (signature hair, glasses, outfit) + name label; no invented quotes, nothing degrading.
  Private or unnamed people stay anonymous (generic toon or silhouette + role label).
- VIDEO SCENES — backgrounds and props: Google Flow or the user's own image AI; flat vector cartoon, thick black outlines,
  NO people, NO text, NO logos, 16:9. Characters, text, numbers, charts, effects: code. 3D hero props: three.js + bloom.
- THUMBNAIL (different rules): may be made with Flow / the user's own image AI and MAY contain people and text.
  Keep public figures stylised (cartoon/illustration), never a photorealistic fake photo of a real person; text ≤ 4 big words,
  high contrast; no real company logos; must match the video (no misleading claims). Same look as the first frame.

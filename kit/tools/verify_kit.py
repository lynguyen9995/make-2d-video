"""tools/verify_kit.py — confirm every studio file was written exactly (run right after installing).

  python tools/verify_kit.py
Prints MISMATCH/MISSING for any file that differs from the tested version; copy those files again from the plugin kit folder.
(Line endings and leading/trailing blank lines are ignored. Files you customise later, e.g. engine/styles.js, will of course differ.)
"""
import hashlib, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPECTED = {
    "audio/dsp.py": "589d305d94d8acc3",
    "audio/mix.py": "a48273c523b68c3b",
    "audio/music.py": "2fb3ce1df2fe5c7d",
    "audio/sfx.py": "2fa56141e2423718",
    "engine/assets/rigs/Xbot.glb": "6270ba6d99d81e90",
    "engine/core.js": "21d646d84eb33165",
    "engine/fx2d.js": "d09f93f6d44366fa",
    "engine/player.js": "f951ab58b0643faf",
    "engine/post3d.js": "d8ce281f8c1db841",
    "engine/rig2d.js": "ec2a665e0aa8ffed",
    "engine/rig3d-cast.js": "028a42416a280f78",
    "engine/rig3d.js": "dec626a2b5dd5782",
    "engine/styles.js": "de1fb42a69699ffd",
    "engine/three-kit.js": "265558924974a90e",
    "engine/toon-props.js": "a75df29e02437b2f",
    "engine/toon-rig.js": "ebb5fe42a0e276a2",
    "engine/toon.js": "392e3235d4a77638",
    "engine/toon3d.js": "e34930951cfae4dd",
    "engine/ui2d.js": "74d4747785d5e6d1",
    "examples/reaction-time/config.json": "9ee341c65b3cfe9a",
    "examples/reaction-time/scenes/cast.js": "e4faad3c508a5cf5",
    "examples/reaction-time/scenes/sets/cafe.js": "fb9adaa553e87b74",
    "examples/reaction-time/scenes/sets/lab.js": "a2da3ca0fff2d8c4",
    "examples/reaction-time/scenes/shots/01_cafe.js": "931e9c360ba052b3",
    "examples/reaction-time/scenes/shots/02_orbit3d.js": "77897bcae80a501e",
    "examples/reaction-time/scenes/shots/03_explain.js": "c22f0e7a8f505c78",
    "examples/reaction-time/story/bible.md": "e22b689a54461b41",
    "examples/reaction-time/story/shots.json": "9b1921e8e42c2498",
    "examples/rig3d-test/config.json": "8cbfcae96c4640b7",
    "examples/rig3d-test/scenes/shots/01_rig3d.js": "a5645359dcf86431",
    "examples/rig3d-test/story/shots.json": "4b7c91d756748acb",
    "examples/toon-catalog/config.json": "8957015fbc07c5b7",
    "examples/toon-catalog/scenes/shots/catalog.js": "4cae162d7afdaa57",
    "examples/toon-catalog/story/bible.md": "fffeea488078e3de",
    "examples/toon-catalog/story/shots.json": "b2eb976cfd398ea1",
    "examples/toon-demo/config.json": "896d394b89a2c8b3",
    "examples/toon-demo/scenes/shots/01_classroom.js": "6f33cf97fa397afc",
    "examples/toon-demo/scenes/shots/02_office.js": "f39a3b3ba320bbdf",
    "examples/toon-demo/scenes/shots/03_jacket.js": "1126b4101c1fc7c5",
    "examples/toon-demo/scenes/shots/04_chip3d.js": "89948a6cdcdc5957",
    "examples/toon-demo/scenes/shots/05_caricatures.js": "628a2db69b9c6a58",
    "examples/toon-demo/story/bible.md": "f8b55ec159fa3d4c",
    "examples/toon-demo/story/shots.json": "6a40db6fccb3b691",
    "package.json": "def05b35e1fe9705",
    "player.html": "5ffdd7da4a48cd4b",
    "render.mjs": "ba9779c796616616",
    "tools/beats.py": "eb42a8aef4d87584",
    "tools/common.py": "5cb9e123f452b790",
    "tools/doctor.py": "38ff51dbeb16889f",
    "tools/envelope.py": "04abd88e6c067db6",
    "tools/join_segments.py": "b3156630a092a413",
    "tools/new_project.py": "7376e2571d0e0b62",
    "tools/parse_script.py": "5163cf3162b2579b",
    "tools/transcribe.py": "9811589c92da827e",
    "tools/jobs/common.ps1": "fa0d7b835a868ba2",
    "tools/jobs/make_srt.py": "7a85ae0def4bef88",
    "tools/jobs/set_duration.py": "aa37b6b0b0b2a656",
    "tools/jobs/setup.ps1": "83fc993c939e8bee",
    "tools/jobs/setup-studio.bat": "e21e9c2154e7b03b",
    "tools/jobs/templates/full.ps1": "773c9b2d10d249ad",
    "tools/jobs/templates/2-full.bat": "f94938be252c32c1",
}
bad = 0
for rel, want in EXPECTED.items():
    p = os.path.join(ROOT, *rel.split("/"))
    if not os.path.exists(p):
        print(f"MISSING   {rel}"); bad += 1; continue
    got = hashlib.sha256(open(p, "rb").read().replace(b"\r\n", b"\n").strip()).hexdigest()[:16]
    if got != want:
        print(f"MISMATCH  {rel}"); bad += 1
print(f"{len(EXPECTED) - bad}/{len(EXPECTED)} files verified." + ("" if not bad else "  Copy the files listed above again from the plugin's kit folder, then run this again."))
sys.exit(1 if bad else 0)

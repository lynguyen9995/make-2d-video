"""STEP 3 helper: set config.json "duration" to the exact length of the joined voiceover (keeps the file's formatting)."""
import json, os, re, sys, wave
P = sys.argv[1]
cfgp = os.path.join(P, "config.json")
cfg = json.load(open(cfgp, encoding="utf-8"))
vo = os.path.join(P, cfg["voiceover"])
with wave.open(vo, "rb") as w:
    d = round(w.getnframes() / w.getframerate(), 3)
txt = open(cfgp, encoding="utf-8").read()
new, n = re.subn(r'("duration"\s*:\s*)[0-9.]+', lambda m: m.group(1) + str(d), txt, count=1)
if n != 1:
    sys.exit("ERROR: no \"duration\" key in config.json")
assert json.loads(new)["duration"] == d and json.loads(new)["voiceover"] == cfg["voiceover"]
open(cfgp, "w", encoding="utf-8", newline="").write(new)
print(f"config.json duration = {d}  (voiceover = {cfg['voiceover']})")

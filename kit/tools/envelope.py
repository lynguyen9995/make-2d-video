"""tools/envelope.py — loudness envelope of the voiceover for toon lip sync (TR.voice / TR.speak).

  python -I tools/envelope.py --project projects/my-video [--audio path.wav] [--fps 24]

Writes timeline/envelope.json = { fps, v: [0..1 per frame], stress: [seconds] }.
v is RMS loudness per frame (smoothed, normalised to the 95th percentile); stress marks syllable peaks that are clearly
louder than the surrounding second of speech (used to raise the brows and nod on emphasised words).
"""
import argparse, json, os, sys
import numpy as np
from scipy.io import wavfile

ap = argparse.ArgumentParser()
ap.add_argument("--project", required=True)
ap.add_argument("--audio")
ap.add_argument("--fps", type=float)
a = ap.parse_args()
cfg = json.load(open(os.path.join(a.project, "config.json"), encoding="utf-8"))
fps = a.fps or cfg.get("fps", 24)
path = a.audio or os.path.join(a.project, cfg.get("voiceover", "input/voiceover.wav"))
if not os.path.exists(path): sys.exit(f"audio not found: {path}")
sr, x = wavfile.read(path)
x = x.astype(np.float32)
if x.ndim > 1: x = x.mean(axis=1)
if np.abs(x).max() > 1.5: x /= 32768.0
hop = sr / fps
n = int(len(x) / hop) + 1
rms = np.array([np.sqrt(np.mean(x[int(i * hop):int((i + 1) * hop)] ** 2)) if int(i * hop) < len(x) else 0.0 for i in range(n)])
# light smoothing (attack fast, release slower) so the mouth does not flicker
sm = np.zeros_like(rms)
for i, v in enumerate(rms):
    prev = sm[i - 1] if i else 0.0
    sm[i] = prev + (v - prev) * (0.75 if v > prev else 0.45)
ref = np.percentile(sm[sm > 1e-4], 95) if np.any(sm > 1e-4) else 1.0
v = np.clip(sm / (ref + 1e-9), 0, 1)
v[v < 0.06] = 0
# stress: local peaks > 1.35 x mean of the surrounding 1 s, at least 0.35 s apart
w = int(fps)
stress, last = [], -9.0
for i in range(1, n - 1):
    if v[i] >= v[i - 1] and v[i] >= v[i + 1] and v[i] > 0.45:
        lo, hi = max(0, i - w // 2), min(n, i + w // 2)
        mean = v[lo:hi][v[lo:hi] > 0].mean() if np.any(v[lo:hi] > 0) else 0
        t = i / fps
        if v[i] > 1.35 * mean * 0.85 and v[i] > mean * 1.15 and t - last > 0.35:
            stress.append(round(t, 3)); last = t
out = os.path.join(a.project, "timeline", "envelope.json")
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump({"fps": fps, "v": [round(float(q), 3) for q in v], "stress": stress}, open(out, "w"))
print(f"envelope: {n} frames, {len(stress)} stress marks -> {out}")

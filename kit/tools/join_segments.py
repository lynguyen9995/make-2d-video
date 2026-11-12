"""Join per-sentence TTS clips (01.wav, 02.wav, ...) into one voiceover with controlled pauses.

Usage: python -I join_segments.py <seg_dir> <sentences.txt> <out.wav>

sentences.txt: one sentence per line, same order as the clips. A line may carry markers after "|":
  Bạn ở lại.|0.8          pause 0.8 s after this sentence
  Nó ngủ say.|cham        read this sentence 8% slower (pitch unchanged, needs ffmpeg)
  Nó ngủ say.|0.7|cham0.88  both: 0.7 s pause, 12% slower
Emotion tags such as [cười], [thở dài], [hắng giọng] stay in the line: they are sent to VieNeu
as part of the text and are ignored here when counting words.

Default pauses: 0.40 s; 0.35 s after short lines (<= 3 words); 0.70 s before the last line;
0 after the last line.

Also writes <out>.script.txt: the clean spoken text (no tags, no markers), one paragraph,
ready for new_project.py --script and transcribe.py (captions must not show "[cười]").
"""
import glob
import os
import re
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from scipy.io import wavfile

TAG = re.compile(r"\s*\[[^\]]+\]\s*")
DEFAULT_SLOW = 0.92


def parse(line):
    """-> (spoken text with tags, pause or None, tempo or None)"""
    text, *marks = line.split("|")
    pause = tempo = None
    for m in (s.strip().lower() for s in marks):
        if m.startswith("cham"):
            tempo = float(m[4:]) if m[4:] else DEFAULT_SLOW
        elif m:
            pause = float(m)
    return text.strip(), pause, tempo


def clean(text):
    """Remove emotion tags and tidy spaces before punctuation."""
    t = TAG.sub(" ", text).strip()
    return re.sub(r"\s+([.,!?…])", r"\1", re.sub(r"\s{2,}", " ", t))


def stretch(clip, sr, tempo):
    ff = shutil.which("ffmpeg")
    if not ff:
        sys.exit("ffmpeg not found: run `source /c/AI-Workspace/Videos/env.sh` first")
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
        wavfile.write(a, sr, clip.astype(np.float32))
        subprocess.run([ff, "-v", "error", "-y", "-i", a, "-af", f"atempo={tempo}",
                        "-ar", str(sr), "-c:a", "pcm_f32le", b], check=True)
        _, y = wavfile.read(b)
    return y.astype(np.float32)


seg_dir, sent_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
lines = [l.strip() for l in open(sent_path, encoding="utf-8") if l.strip()]
files = sorted(glob.glob(os.path.join(seg_dir, "*.wav")))
if len(files) != len(lines):
    sys.exit(f"{len(files)} clips but {len(lines)} sentences: they must match")
items = [parse(l) for l in lines]


def pause_for(i):
    text, pause, _ = items[i]
    if pause is not None:
        return pause
    if i == len(items) - 1:
        return 0.0
    if i == len(items) - 2:
        return 0.70
    return 0.35 if len(clean(text).split()) <= 3 else 0.40


parts, sr0 = [np.zeros(1, np.float32)], None
for i, (f, (text, _, tempo)) in enumerate(zip(files, items)):
    sr, x = wavfile.read(f)
    sr0 = sr0 or sr
    if sr != sr0:
        sys.exit(f"sample rate mismatch in {f}")
    x = x.astype(np.float32)
    if x.ndim > 1:
        x = x.mean(axis=1)
    win = max(1, int(sr * 0.01))
    env = np.convolve(np.abs(x), np.ones(win) / win, mode="same")
    idx = np.where(env > (np.abs(x).max() or 1.0) * 0.02)[0]
    a, b = (idx[0], idx[-1]) if len(idx) else (0, len(x))
    clip = x[max(0, a - int(sr * 0.03)): min(len(x), b + int(sr * 0.06))]
    if tempo and tempo != 1.0:
        clip = stretch(clip, sr, tempo)
    gap = pause_for(i)
    parts += [clip, np.zeros(int(sr * gap), np.float32)]
    slow = f"  (x{tempo})" if tempo else ""
    print(f"{i + 1:02} {len(clip) / sr:5.2f}s + {gap:.2f}s  {text}{slow}")

parts[0] = np.zeros(int(sr0 * 0.05), np.float32)
y = np.concatenate(parts)
y = y / (np.abs(y).max() or 1) * 0.95 * 32767
wavfile.write(out, sr0, y.astype(np.int16))
script_path = os.path.splitext(out)[0] + ".script.txt"
with open(script_path, "w", encoding="utf-8") as fh:
    fh.write(" ".join(clean(t) for t, _, _ in items) + "\n")
print(f"total {len(y) / sr0:.2f}s -> {out}")
print(f"clean script -> {script_path}")

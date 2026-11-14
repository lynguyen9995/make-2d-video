"""Write out/<title>.en.srt next to the final MP4 (same name rule as audio/mix.py) from timeline/sentences.json (one cue per sentence)."""
import json, os, re, sys
P = sys.argv[1]
cfg = json.load(open(os.path.join(P, "config.json"), encoding="utf-8"))
safe = re.sub(r"[^\w\- ]+", "", cfg.get("title") or "video").strip().replace(" ", "_") or "video"
S = json.load(open(os.path.join(P, "timeline", "sentences.json"), encoding="utf-8"))
S = S["sentences"] if isinstance(S, dict) else S
def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"
out = []
for i, s in enumerate(S):
    end = s["end"] + 0.2
    if i + 1 < len(S): end = min(end, S[i + 1]["start"])
    out.append(f"{i + 1}\n{ts(s['start'])} --> {ts(end)}\n{s['text']}\n")
path = os.path.join(P, "out", f"{safe}.en.srt")
os.makedirs(os.path.dirname(path), exist_ok=True)
open(path, "w", encoding="utf-8").write("\n".join(out))
print(f"subtitles: {len(S)} cues -> {path}")

"""tools/library/build_review.py — build projects/<video>/assets/_review/review.html for the user to pick images.

  python -I tools/library/build_review.py projects/<video>

Candidate files in assets/_review/: <asset-id>-<letter>.<ext>, e.g. bg-diner-01-A.jpg, bg-diner-01-B.jpg, prop-envelope-01-A.png
Optional sidecar <same name>.json: {"prompt": "...", "tool": "...", "status": "pending|picked|rejected", "reason": "..."}
Rejected candidates are moved to assets/_review/_rejected/ (never overwritten); a redo gets the next letter (C, D…).
The user answers in one line, e.g.:  bg-diner-01 B, prop-envelope-01 redo: lid missing, char-rubio: hair whiter
"""
import html, json, os, re, sys
IMG = (".jpg", ".jpeg", ".png", ".webp")
PAT = re.compile(r"^(?P<id>.+)-(?P<letter>[A-Z])$")


def main():
    if len(sys.argv) < 2:
        print(__doc__); return 1
    proj = sys.argv[1]
    rev = os.path.join(proj, "assets", "_review")
    os.makedirs(rev, exist_ok=True)
    groups = {}
    for f in sorted(os.listdir(rev)):
        base, ext = os.path.splitext(f)
        if ext.lower() not in IMG:
            continue
        m = PAT.match(base)
        aid, letter = (m["id"], m["letter"]) if m else (base, "?")
        meta = {}
        side = os.path.join(rev, base + ".json")
        if os.path.exists(side):
            try: meta = json.load(open(side, encoding="utf-8"))
            except Exception: pass
        groups.setdefault(aid, []).append((letter, f, meta))
    rej = os.path.join(rev, "_rejected")
    nrej = len([f for f in os.listdir(rej) if f.lower().endswith(IMG)]) if os.path.isdir(rej) else 0
    e = html.escape
    rows = []
    for aid, cands in groups.items():
        cells = []
        for letter, f, meta in cands:
            st = meta.get("status", "pending")
            cells.append(f'<figure class="{e(st)}"><img src="{e(f)}"><figcaption><b>{e(letter)}</b> · {e(st)}'
                         f'{" — " + e(meta.get("reason","")) if meta.get("reason") else ""}<br><small>{e(meta.get("tool",""))}</small></figcaption></figure>')
        rows.append(f'<section><h3>{e(aid)}</h3><div class="r">{"".join(cells)}</div></section>')
    page = f"""<!doctype html><meta charset="utf-8"><title>Review — {e(os.path.basename(os.path.normpath(proj)))}</title>
<style>body{{font:14px system-ui;background:#16181d;color:#e8e8e8;margin:16px}}.r{{display:flex;gap:12px;flex-wrap:wrap}}
figure{{margin:0;background:#22252c;border-radius:8px;padding:6px;width:380px}}figure img{{width:100%;background:#0d0e11;border-radius:4px}}
figure.picked{{outline:3px solid #3fb950}}figure.rejected{{opacity:.45}}h3{{margin:18px 0 6px}}code{{background:#2d3139;padding:2px 6px;border-radius:4px}}</style>
<h2>Review: {len(groups)} assets</h2>
<p>Reply in one line, e.g. <code>bg-diner-01 B, prop-envelope-01 redo: lid missing, char-rubio: hair whiter</code>.
Rejected so far: {nrej} (kept in _rejected/, never overwritten).</p>{''.join(rows)}"""
    out = os.path.join(rev, "review.html")
    open(out, "w", encoding="utf-8").write(page)
    print(f"review: {len(groups)} assets -> {out}")


if __name__ == "__main__":
    sys.exit(main())

"""tools/library/build_catalog.py — rebuild library/catalog.html + library/index.json from library/**.

  python -I tools/library/build_catalog.py            (run from the studio root)

Every asset file (jpg/png) in library/ should have a sidecar <same name>.json:
  {"id": "bg-boardroom-01", "type": "background|prop|character|thumbnail", "category": "office",
   "title": "...", "tags": ["..."], "tool": "Google Flow", "prompt": "...", "created": "YYYY-MM-DD",
   "used_in": ["jensen-full-10min"], "status": "approved", "notes": ""}
Characters are drawn in code; their entry is a .json (+ optional <id>-sheet.png render).
"""
import html, json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LIB = os.path.join(ROOT, "library")
IMG = (".jpg", ".jpeg", ".png", ".webp")


def main():
    items = []
    for dp, _, files in os.walk(LIB):
        for f in sorted(files):
            if not f.endswith(".json") or f == "index.json":
                continue
            p = os.path.join(dp, f)
            try:
                meta = json.load(open(p, encoding="utf-8"))
            except Exception as e:
                print(f"BAD JSON {p}: {e}"); continue
            base = f[:-5]
            img = next((base + x for x in IMG if os.path.exists(os.path.join(dp, base + x))), None)
            if not img:
                img = next((base + "-sheet" + x for x in IMG if os.path.exists(os.path.join(dp, base + "-sheet" + x))), None)
            rel = os.path.relpath(dp, LIB).replace(os.sep, "/")
            meta["_dir"] = rel
            meta["_img"] = f"{rel}/{img}" if img else None
            meta.setdefault("id", base)
            items.append(meta)
    items.sort(key=lambda m: (m.get("type", ""), m["_dir"], m["id"]))
    json.dump(items, open(os.path.join(LIB, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    cards = []
    for m in items:
        e = html.escape
        pic = f'<img src="{e(m["_img"])}" loading="lazy">' if m["_img"] else '<div class="noimg">drawn in code<br>(no sheet yet)</div>'
        tags = " ".join(m.get("tags", []))
        search = e(" ".join([m["id"], m.get("title", ""), m["_dir"], tags, m.get("type", "")]).lower())
        used = ", ".join(m.get("used_in", []))
        cards.append(f'<div class="c" data-s="{search}">{pic}<b>{e(m["id"])}</b><span>{e(m["_dir"])} · {e(m.get("status",""))}</span>'
                     f'<span>{e(m.get("title",""))}</span><span class="t">{e(tags)}</span><span class="u">{e(used)}</span></div>')
    page = f"""<!doctype html><meta charset="utf-8"><title>Library ({len(items)})</title>
<style>body{{font:14px system-ui;background:#16181d;color:#e8e8e8;margin:16px}}input{{font:15px system-ui;padding:8px;width:340px}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:14px}}
.c{{background:#22252c;border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:3px}}
.c img,.noimg{{width:100%;aspect-ratio:16/9;object-fit:contain;background:#0d0e11;border-radius:4px}}
.noimg{{display:flex;align-items:center;justify-content:center;text-align:center;color:#888}}span{{color:#aab}}.t{{color:#7fb3ff;font-size:12px}}.u{{color:#999;font-size:12px}}</style>
<h2>Library — {len(items)} items</h2><input id="q" placeholder="search: boardroom, government, jensen, prop…">
<div class="g" id="g">{''.join(cards)}</div>
<script>q.oninput=()=>{{const v=q.value.toLowerCase().trim();for(const c of g.children)c.style.display=!v||c.dataset.s.includes(v)?'':'none'}}</script>"""
    open(os.path.join(LIB, "catalog.html"), "w", encoding="utf-8").write(page)
    print(f"catalog: {len(items)} items -> library/catalog.html")


if __name__ == "__main__":
    sys.exit(main())

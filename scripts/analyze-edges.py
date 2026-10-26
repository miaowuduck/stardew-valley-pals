"""Dev tool: detect split-cell animations in NPC sprite sheets.

Some NPC actions are drawn across TWO adjacent cells instead of one 16x32
frame — vertically stacked (16x64, e.g. raised hammer / fishing rod above the
body) or side by side (32x32, e.g. fishing rod extending right of the body).

Heuristic: a standalone 16x32 character frame has feet at the bottom edge but
never draws on the very top row of pixels, and characters are centered enough
that side-edge contact is rare. So for rows 4+ we flag:
  T = opaque pixels on the cell's top edge    -> content continues into cell ABOVE
  L/R = opaque pixels on left/right edge      -> content continues sideways
  (bottom-edge contact is normal: feet)

Also prints opaque pixel count so prop-only cells (tiny counts) stand out.

Usage: python scripts/analyze-edges.py [Name ...]
       (no args = all NPC sheets)
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
NPC_DIR = ROOT / "assets" / "stardew" / "NPC"

COLS = 4
FRAME_W = 16
SHORT_FRAMES = {"Dwarf", "Krobus"}  # 16x24 frames
EDGE_THRESHOLD = 2  # pixels on an edge row/column to count as "touching"


def analyze(name: str) -> None:
    path = NPC_DIR / f"{name}..png"
    if not path.is_file():
        print(f"{name}: sheet missing")
        return
    img = Image.open(path).convert("RGBA")
    fh = 24 if name in SHORT_FRAMES else 32
    rows = img.height // fh
    print(f"== {name} ({img.width}x{img.height}, fh={fh}, rows={rows}) ==")
    for r in range(4, rows):
        parts = []
        for c in range(COLS):
            cell = img.crop((c * FRAME_W, r * fh, (c + 1) * FRAME_W, (r + 1) * fh))
            px = list(cell.getdata())
            w, h = cell.size
            opaque = sum(1 for p in px if p[3] > 0)
            top = sum(1 for x in range(w) if px[x][3] > 0)
            bottom = sum(1 for x in range(w) if px[(h - 1) * w + x][3] > 0)
            left = sum(1 for y in range(h) if px[y * w][3] > 0)
            right = sum(1 for y in range(h) if px[y * w + w - 1][3] > 0)
            if opaque == 0:
                parts.append("  --  ")
                continue
            flags = ""
            flags += "T" if top >= EDGE_THRESHOLD else "."
            flags += "B" if bottom >= EDGE_THRESHOLD else "."
            flags += "L" if left >= EDGE_THRESHOLD else "."
            flags += "R" if right >= EDGE_THRESHOLD else "."
            parts.append(f"{flags}{opaque:4d}")
        print(f"  r{r:2d}: " + " | ".join(parts))


def main() -> None:
    if len(sys.argv) > 1:
        names = sys.argv[1:]
    else:
        names = sorted(p.name[:-5] for p in NPC_DIR.glob("*..png"))
    for name in names:
        analyze(name)


if __name__ == "__main__":
    main()

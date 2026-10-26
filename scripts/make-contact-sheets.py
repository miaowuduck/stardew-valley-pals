"""Dev tool: generate enlarged, grid-labeled contact sheets for NPC sprite sheets.

For every PNG in assets/stardew/NPC/ (plus assets/stardew/pets/ when --pets is
passed), crop the sheet from a given start row, upscale 4x with NEAREST, and
draw row/col labels so frame coordinates can be read off for curation.

Output: scripts/out/<name>_contact.png  (one per character, extra rows only)
        scripts/out/<name>_full.png     (whole sheet, for context)

Usage: python scripts/make-contact-sheets.py [--pets] [--from-row N]
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
NPC_DIR = ROOT / "assets" / "stardew" / "NPC"
PET_DIR = ROOT / "assets" / "stardew" / "pets"
OUT_DIR = Path(__file__).resolve().parent / "out"

COLS = 4
FRAME_W = 16
# Most NPCs use 32px frames; these two use 24px (matches frameHeight in code).
SHORT_FRAMES = {"Dwarf", "Krobus"}
SCALE = 4
LABEL_W = 28  # left gutter for row labels
LABEL_H = 18  # top gutter for column labels

# Solid filler colors used by the sprite artists to pad unused cells.
FILLER_RGB = {
    (255, 0, 255), (0, 255, 255), (255, 128, 128), (200, 200, 200),
    (255, 200, 200), (220, 190, 160), (245, 220, 200),
}


def cell_state(img: Image.Image, col: int, row: int, fh: int) -> str:
    """Classify a frame cell: 'empty' (fully transparent), 'filler' (single
    solid opaque color), or 'art'."""
    box = (col * FRAME_W, row * fh, (col + 1) * FRAME_W, (row + 1) * fh)
    if box[2] > img.width or box[3] > img.height:
        return "missing"
    cell = img.crop(box).convert("RGBA")
    pixels = list(cell.getdata())
    opaque = [p[:3] for p in pixels if p[3] > 0]
    if not opaque:
        return "empty"
    if len(set(opaque)) == 1:
        return "filler"
    return "art"


def contact_sheet(path: Path, out_prefix: str, from_row: int) -> None:
    img = Image.open(path).convert("RGBA")
    name = path.stem.rstrip(".")
    fh = 24 if name in SHORT_FRAMES else 32
    rows = img.height // fh

    def render(start: int, suffix: str) -> None:
        n = rows - start
        if n <= 0:
            return
        w = LABEL_W + COLS * FRAME_W * SCALE
        h = LABEL_H + n * fh * SCALE
        canvas = Image.new("RGBA", (w, h), (40, 40, 48, 255))
        draw = ImageDraw.Draw(canvas)
        for r in range(start, rows):
            for c in range(COLS):
                box = (c * FRAME_W, r * fh, (c + 1) * FRAME_W, (r + 1) * fh)
                if box[2] > img.width or box[3] > img.height:
                    continue
                cell = img.crop(box).resize((FRAME_W * SCALE, fh * SCALE), Image.Resampling.NEAREST)
                x = LABEL_W + c * FRAME_W * SCALE
                y = LABEL_H + (r - start) * fh * SCALE
                canvas.paste(cell, (x, y), cell)
                state = cell_state(img, c, r, fh)
                if state != "art":
                    # Tint non-art cells so hazards are obvious.
                    tint = (255, 0, 0, 90) if state == "filler" else (255, 255, 0, 50)
                    overlay = Image.new("RGBA", (FRAME_W * SCALE, fh * SCALE), tint)
                    canvas.alpha_composite(overlay, (x, y))
                draw.rectangle([x, y, x + FRAME_W * SCALE - 1, y + fh * SCALE - 1], outline=(90, 90, 100, 255))
        for r in range(start, rows):
            draw.text((4, LABEL_H + (r - start) * fh * SCALE + 2), f"r{r}", fill=(255, 255, 255, 255))
        for c in range(COLS):
            draw.text((LABEL_W + c * FRAME_W * SCALE + 2, 3), f"c{c}", fill=(255, 255, 255, 255))
        canvas.save(OUT_DIR / f"{out_prefix}_{suffix}.png")

    render(0, "full")
    if rows > from_row:
        render(from_row, "contact")
    print(f"{name}: {rows} rows (frame {FRAME_W}x{fh})")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pets", action="store_true", help="process pet sheets instead of NPCs")
    parser.add_argument("--from-row", type=int, default=4, help="first row for the zoomed contact sheet")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    src = PET_DIR if args.pets else NPC_DIR
    if not src.is_dir():
        sys.exit(f"missing directory: {src}")
    for png in sorted(src.glob("*.png")):
        contact_sheet(png, png.stem.rstrip("."), args.from_row)


if __name__ == "__main__":
    main()

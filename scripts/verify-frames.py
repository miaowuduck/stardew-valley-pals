"""Dev tool: verify that every frame referenced by NPC_EXTRA_ANIMATIONS (and
the shared npcAnimations) in pets/stardew-species.ts points at real sprite
art — not an empty (fully transparent) cell, not a solid-color filler cell,
and not outside the sheet.

Parses the animation tables out of the TypeScript source with regexes (the
tables follow a fixed `Name: { key: A([[c, r], ...], fps, {...}) }` shape),
then classifies each referenced cell in the PNG.

Usage: python scripts/verify-frames.py
Exit code 1 if any referenced frame is not usable art.
"""

import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
NPC_DIR = ROOT / "assets" / "stardew" / "NPC"
SPECIES_TS = ROOT / "pets" / "stardew-species.ts"

COLS = 4
FRAME_W = 16
SHORT_FRAMES = {"Dwarf", "Krobus"}  # 16x24 frames


def cell_state(img: Image.Image, col: int, row: int, fh: int) -> str:
    """'missing' (outside sheet) / 'empty' (transparent) / 'filler' (one solid
    opaque color) / 'art'."""
    box = (col * FRAME_W, row * fh, (col + 1) * FRAME_W, (row + 1) * fh)
    if col < 0 or row < 0 or box[2] > img.width or box[3] > img.height:
        return "missing"
    cell = img.crop(box).convert("RGBA")
    opaque = [p[:3] for p in cell.getdata() if p[3] > 0]
    if not opaque:
        return "empty"
    if len(set(opaque)) == 1:
        return "filler"
    return "art"


def parse_tables(src: str) -> tuple[list[tuple[int, int]], dict[str, dict[str, list[tuple[list[tuple[int, int]], tuple[int, int]]]]]]:
    """Return (shared npcAnimations frames, {npc: {key: [(frames, span)]}}).

    span is (w, h) in cells — multi-cell regions (span option) check every
    cell of the w×h block whose top-left cell the frame references.
    """
    pair_re = re.compile(r"\[\s*(\d+)\s*,\s*(\d+)\s*\]")
    span_re = re.compile(r"span:\s*\{\s*w:\s*(\d)\s*,\s*h:\s*(\d)")

    def calls_of(chunk: str) -> list[tuple[list[tuple[int, int]], tuple[int, int]]]:
        """Find A(...) calls, tolerating nested braces in the options object."""
        out: list[tuple[list[tuple[int, int]], tuple[int, int]]] = []
        for m in re.finditer(r"\bA\(\s*\[", chunk):
            depth = 0
            i = m.start() + 1  # at the '(' — count it so options (span) are included
            start = m.start()
            while i < len(chunk):
                ch = chunk[i]
                if ch in "([{":
                    depth += 1
                elif ch in ")]}":
                    depth -= 1
                    if depth == 0:
                        break
                i += 1
            call = chunk[start:i + 1]
            # Only the frames array contains [n, n] pairs — options don't.
            frames = [(int(c), int(r)) for c, r in pair_re.findall(call)]
            span_m = span_re.search(call)
            span = (int(span_m.group(1)), int(span_m.group(2))) if span_m else (1, 1)
            out.append((frames, span))
        return out

    # Shared walk/idle table.
    shared_m = re.search(r"const npcAnimations[^=]*=\s*\{(.*?)\n\};", src, re.S)
    shared: list[tuple[int, int]] = []
    if shared_m:
        for frames, _span in calls_of(shared_m.group(1)):
            shared += frames

    # Per-NPC extra table: entries look like `Name: { ... },` at one tab depth.
    table_m = re.search(r"const NPC_EXTRA_ANIMATIONS[^=]*=\s*\{(.*)\n\};", src, re.S)
    per_npc: dict[str, dict[str, list[tuple[list[tuple[int, int]], tuple[int, int]]]]] = {}
    if table_m:
        body = table_m.group(1)
        for entry in re.finditer(r"\n\t(\w+):\s*\{(.*?)\n\t\},?", body, re.S):
            name, chunk = entry.group(1), entry.group(2)
            per_npc[name] = split_keys(chunk, calls_of)
    return shared, per_npc


def split_keys(chunk, calls_of):
    """Split an entry body into key -> A(...) calls, tracking bracket depth so
    keys inside arrays or option objects aren't mistaken for top-level keys."""
    keys = {}
    depth = 0
    key_name = None
    key_value_start = 0
    i = 0
    while i < len(chunk):
        ch = chunk[i]
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        elif depth == 0:
            m = re.match(r"(\w+):\s*", chunk[i:])
            if m:
                if key_name:
                    keys[key_name] = calls_of(chunk[key_value_start:i])
                key_name = m.group(1)
                key_value_start = i + m.end()
                i += m.end()
                continue
        i += 1
    if key_name:
        keys[key_name] = calls_of(chunk[key_value_start:])
    return keys


def main() -> int:
    src = SPECIES_TS.read_text(encoding="utf-8")
    shared, per_npc = parse_tables(src)

    problems: list[str] = []
    checked = 0

    # Every NPC sheet referenced anywhere in the file via N("Name", ...).
    npc_names = re.findall(r'N\("(\w+)"', src)
    for name in npc_names:
        path = NPC_DIR / f"{name}..png"
        if not path.is_file():
            problems.append(f"{name}: sheet missing on disk ({path.name})")
            continue
        img = Image.open(path).convert("RGBA")
        fh = 24 if name in SHORT_FRAMES else 32

        for c, r in shared:
            checked += 1
            state = cell_state(img, c, r, fh)
            if state != "art":
                problems.append(f"{name}: shared npcAnimations frame [{c},{r}] is {state}")

        for key, calls in per_npc.get(name, {}).items():
            for frames, (sw, sh) in calls:
                for c, r in frames:
                    # Multi-cell regions: every cell of the w×h block must be art.
                    for dc in range(sw):
                        for dr in range(sh):
                            checked += 1
                            state = cell_state(img, c + dc, r + dr, fh)
                            if state != "art":
                                problems.append(
                                    f"{name}: {key} frame [{c},{r}] span {sw}x{sh}: "
                                    f"cell [{c + dc},{r + dr}] is {state}"
                                )

    # Every curated NPC must exist in the roster and vice versa is optional.
    for name in per_npc:
        if name not in npc_names:
            problems.append(f"{name}: has NPC_EXTRA_ANIMATIONS entry but no N() definition")

    print(f"checked {checked} frame references across {len(npc_names)} NPCs "
          f"({len(per_npc)} with extra animations)")
    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print(f"  {p}")
        return 1
    print("all referenced frames are usable art ✓")
    return 0


if __name__ == "__main__":
    sys.exit(main())

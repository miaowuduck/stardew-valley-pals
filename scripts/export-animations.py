"""Dev tool: export every animation in NPC_EXTRA_ANIMATIONS as review images.

For each NPC / key / variant, renders into scripts/out/anim-review/:
  <Npc>_<key>[_v<n>].png  — horizontal strip of all frames (span-aware),
                            each frame labeled with its [col,row]; header line
                            gives npc, key, fps, frame list. Use this to spot
                            position drift between frames.
  <Npc>_<key>[_v<n>].gif  — the frames played at their fps. Use this to spot
                            twitching / floating in motion.

Frames are aligned by their ANCHOR cell (the cell holding the character) so a
consistent character stays put and any drift is visible.

Usage: python scripts/export-animations.py
"""

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
NPC_DIR = ROOT / "assets" / "stardew" / "NPC"
SPECIES_TS = ROOT / "pets" / "stardew-species.ts"
OUT_DIR = ROOT / "scripts" / "out" / "anim-review"

COLS = 4
FRAME_W = 16
SHORT_FRAMES = {"Dwarf", "Krobus"}  # 16x24 frames
SCALE = 5
PAD = 6


def parse_animations(src: str):
    """Parse NPC_EXTRA_ANIMATIONS into
    {npc: {key: [ {frames, fps, span, flip} ]}} preserving variant order."""
    table_m = re.search(r"const NPC_EXTRA_ANIMATIONS[^=]*=\s*\{(.*)\n\};", src, re.S)
    if not table_m:
        raise SystemExit("NPC_EXTRA_ANIMATIONS not found")
    body = table_m.group(1)

    pair_re = re.compile(r"\[\s*(\d+)\s*,\s*(\d+)\s*\]")
    span_re = re.compile(
        r"span:\s*\{\s*w:\s*(\d)\s*,\s*h:\s*(\d)"
        r"(?:\s*,\s*anchorX:\s*(\d))?(?:\s*,\s*anchorY:\s*(\d))?"
    )

    def parse_call(call: str):
        frames = [(int(c), int(r)) for c, r in pair_re.findall(call)]
        # fps = first bare number after the frames ARRAY closes. The call
        # starts `A([[...` — match the outer '[' to its closing ']'.
        outer = call.index("[")
        depth = 0
        end = outer
        for i in range(outer, len(call)):
            if call[i] == "[":
                depth += 1
            elif call[i] == "]":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        fps_m = re.search(r",\s*(\d+)", call[end + 1:])
        span_m = span_re.search(call)
        span = None
        if span_m:
            span = {
                "w": int(span_m.group(1)),
                "h": int(span_m.group(2)),
                "anchorX": int(span_m.group(3) or 0),
                "anchorY": int(span_m.group(4) or 0),
            }
        return {
            "frames": frames,
            "fps": int(fps_m.group(1)) if fps_m else 4,
            "span": span,
            "flip": "flip: true" in call,
        }

    def calls_of(chunk: str):
        out = []
        for m in re.finditer(r"\bA\(\s*\[", chunk):
            depth = 0
            i = m.start() + 1  # at the '(' — count it so the whole call is captured
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
            out.append(parse_call(chunk[start:i + 1]))
        return out

    per_npc = {}
    for entry in re.finditer(r"\n\t(\w+):\s*\{(.*?)\n\t\},?", body, re.S):
        name, chunk = entry.group(1), entry.group(2)
        keys: dict[str, list] = {}
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
        per_npc[name] = keys
    return per_npc


def render_frame(img: Image.Image, col: int, row: int, fh: int, span):
    """Crop the (possibly multi-cell) region for one frame, native scale."""
    w = span["w"] if span else 1
    h = span["h"] if span else 1
    box = (col * FRAME_W, row * fh, (col + w) * FRAME_W, (row + h) * fh)
    return img.crop(box), w, h


def main() -> int:
    src = SPECIES_TS.read_text(encoding="utf-8")
    per_npc = parse_animations(src)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    font = ImageFont.load_default()

    # Checkerboard background so transparent pixels are visible.
    def checker(w: int, h: int) -> Image.Image:
        bg = Image.new("RGBA", (w, h), (200, 200, 200, 255))
        d = ImageDraw.Draw(bg)
        for y in range(0, h, 8):
            for x in range(0, w, 8):
                if (x // 8 + y // 8) % 2 == 0:
                    d.rectangle([x, y, x + 7, y + 7], fill=(230, 230, 230, 255))
        return bg

    count = 0
    for name, keys in per_npc.items():
        path = NPC_DIR / f"{name}..png"
        if not path.is_file():
            print(f"!! {name}: sheet missing")
            continue
        img = Image.open(path).convert("RGBA")
        fh = 24 if name in SHORT_FRAMES else 32

        for key, variants in keys.items():
            for vi, anim in enumerate(variants):
                frames = anim["frames"]
                span = anim["span"]
                sw = span["w"] if span else 1
                sh = span["h"] if span else 1
                ax = span["anchorX"] if span else 0
                ay = span["anchorY"] if span else 0

                # Native-size canvas per frame: region + anchor margins so the
                # anchor cell sits at the same offset in every frame.
                cw = (sw + 1) * FRAME_W  # one extra cell of margin
                chh = (sh + 1) * fh
                ox = FRAME_W - ax * FRAME_W  # anchor cell lands at x=FRAME_W
                oy = fh - ay * fh

                suffix = f"_v{vi}" if len(variants) > 1 else ""
                label = (f"{name} {key}{suffix}  fps={anim['fps']}"
                         + (f"  span={sw}x{sh} a={ax},{ay}" if span else "")
                         + ("  flip" if anim["flip"] else ""))
                coords = " ".join(f"[{c},{r}]" for c, r in frames)

                # ── PNG strip ──
                n = len(frames)
                cell_w = cw * SCALE
                cell_h = chh * SCALE
                strip_w = n * cell_w + (n + 1) * PAD
                strip_h = cell_h + 3 * PAD + 26  # header + per-frame coord labels
                strip = Image.new("RGBA", (strip_w, strip_h), (40, 40, 48, 255))
                d = ImageDraw.Draw(strip)
                d.text((PAD, PAD), label, fill=(255, 220, 120), font=font)
                d.text((PAD, PAD + 11), coords, fill=(180, 180, 200), font=font)

                gif_frames = []
                for fi, (c, r) in enumerate(frames):
                    region, _, _ = render_frame(img, c, r, fh, span)
                    canvas = checker(cw, chh)
                    canvas.paste(region, (ox, oy), region)
                    # anchor-cell crosshair marker
                    cd = ImageDraw.Draw(canvas)
                    cd.rectangle([ox, oy, ox + FRAME_W - 1, oy + fh - 1],
                                 outline=(255, 80, 80, 255))
                    big = canvas.resize((cw * SCALE, chh * SCALE), Image.NEAREST)
                    gif_frames.append(big)

                    x0 = PAD + fi * (cell_w + PAD)
                    y0 = 2 * PAD + 22
                    strip.paste(big, (x0, y0))
                    d.text((x0, y0 + cell_h + 2), f"[{c},{r}]",
                           fill=(230, 230, 230), font=font)

                base = f"{name}_{key}{suffix}"
                strip.save(OUT_DIR / f"{base}.png")
                duration = max(20, round(1000 / anim["fps"]))
                gif_frames[0].save(
                    OUT_DIR / f"{base}.gif",
                    save_all=True,
                    append_images=gif_frames[1:],
                    duration=duration,
                    loop=0,
                    disposal=1,
                )
                count += 1

    print(f"exported {count} animations to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

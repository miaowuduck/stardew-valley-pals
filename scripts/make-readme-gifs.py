#!/usr/bin/env python3
"""Generate the README art from the plugin's own sprite sheets.

Outputs (readmepics/):
  hero.gif       — Pelican Town diorama with villagers, pets and a speech bubble
  villagers.gif  — eight villagers playing their signature activities
  pets.gif       — the nine pet species, animated

All frames come from the real assets in assets/stardew/ and the animation
tables in pets/stardew-species.ts, so the images never drift from the plugin.

Usage: python scripts/make-readme-gifs.py
Requires Pillow. The Silkscreen font is downloaded on first run (OFL).
"""

from __future__ import annotations

import importlib.util
import math
import random
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
NPC_DIR = ROOT / "assets" / "stardew" / "NPC"
PET_DIR = ROOT / "assets" / "stardew" / "pets"
SPECIES_TS = ROOT / "pets" / "stardew-species.ts"
OUT_DIR = ROOT / "readmepics"
CACHE_DIR = ROOT / "scripts" / "out" / "readme-cache"

FPS = 20

# ── palette ───────────────────────────────────────────────────────────
INK = (61, 45, 22, 255)
INK_SOFT = (104, 78, 44, 255)
CREAM = (247, 230, 183, 255)
CREAM_DEEP = (231, 202, 137, 255)
BROWN = (139, 90, 43, 255)
BROWN_DARK = (99, 62, 28, 255)
GRASS = (126, 178, 74, 255)
GRASS_DARK = (104, 152, 60, 255)
GRASS_LIGHT = (150, 196, 92, 255)
PATH = (201, 163, 107, 255)
PATH_EDGE = (176, 138, 86, 255)
WATER = (96, 164, 214, 255)
WATER_LIGHT = (140, 198, 234, 255)
SHADOW = (40, 55, 28, 70)

FONT_REGULAR = CACHE_DIR / "Silkscreen-Regular.ttf"
FONT_BOLD = CACHE_DIR / "Silkscreen-Bold.ttf"
FONT_BUBBLE = CACHE_DIR / "PixelifySans.ttf"
FONT_SOURCES = {
    FONT_REGULAR: "https://github.com/google/fonts/raw/main/ofl/silkscreen/Silkscreen-Regular.ttf",
    FONT_BOLD: "https://github.com/google/fonts/raw/main/ofl/silkscreen/Silkscreen-Bold.ttf",
    FONT_BUBBLE: "https://github.com/google/fonts/raw/main/ofl/pixelifysans/PixelifySans%5Bwght%5D.ttf",
}

_font_cache: dict[tuple[str, int], ImageFont.ImageFont] = {}
_npc_sheets: dict[str, Image.Image] = {}
_pet_sheets: dict[str, Image.Image] = {}
_sprite_cache: dict[tuple, Image.Image] = {}


def _ensure_fonts() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    for path, url in FONT_SOURCES.items():
        if path.exists():
            continue
        try:
            urllib.request.urlretrieve(url, path)
        except Exception as exc:  # noqa: BLE001 - fall back to a system font
            print(f"! could not download {path.name} ({exc}); using Consolas")
            path.write_bytes(b"")  # marker so we don't retry every call


def _load_font(path: Path, size: int) -> ImageFont.ImageFont:
    if path.exists() and path.stat().st_size:
        return ImageFont.truetype(str(path), size)
    for name in ("Consolas", "DejaVu Sans Mono", "Courier New"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)


def pixel_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    key = ("bold" if bold else "regular", size)
    if key not in _font_cache:
        path = FONT_BOLD if bold else FONT_REGULAR
        if not path.exists() or not path.stat().st_size:
            _ensure_fonts()
        _font_cache[key] = _load_font(path, size)
    return _font_cache[key]


def bubble_font(size: int) -> ImageFont.ImageFont:
    key = ("bubble", size)
    if key not in _font_cache:
        if not FONT_BUBBLE.exists() or not FONT_BUBBLE.stat().st_size:
            _ensure_fonts()
        _font_cache[key] = _load_font(FONT_BUBBLE, size)
    return _font_cache[key]


# ── animation tables ──────────────────────────────────────────────────


def npc_animations():
    spec = importlib.util.spec_from_file_location(
        "export_animations", ROOT / "scripts" / "export-animations.py"
    )
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module.parse_animations(SPECIES_TS.read_text(encoding="utf-8"))


NPC_ANIMS = npc_animations()

# (frame size, sheet, variant offset in cells, animations)
# Only the clips used by the README art are listed; coordinates come straight
# from pets/stardew-species.ts.
PET_DEFS: dict[str, dict] = {
    "cat": dict(
        frame=32,
        offset=(8, 0),  # Orange
        anims=dict(
            walk=([(0, 1), (1, 1), (2, 1), (3, 1)], 5),
            idle=([(0, 4), (1, 4), (2, 4)], 5),
            special=([(0, 5), (1, 5), (2, 5), (3, 5), (0, 5), (2, 4)], 5),
        ),
    ),
    "dog": dict(
        frame=32,
        offset=(12, 0),  # Brown
        anims=dict(
            walk=([(0, 1), (1, 1), (2, 1), (3, 1)], 5),
            idle=([(0, 5), (1, 5), (2, 5), (3, 5)], 5),
            special=([(1, 6), (0, 6), (2, 6), (3, 5)], 5),
        ),
    ),
    "chicken": dict(
        frame=16,
        offset=(8, 0),  # Blue
        anims=dict(
            walk=([(0, 1), (1, 1), (2, 1), (3, 1)], 5),
            idle=([(0, 0)], 5),
            special=(
                [(0, 6), (1, 6), (2, 6), (1, 6), (2, 6), (1, 6), (0, 6), (0, 0)],
                5,
            ),
        ),
    ),
    "duck": dict(
        frame=16,
        offset=(0, 0),
        anims=dict(
            walk=([(0, 1), (1, 1), (2, 1), (3, 1)], 5),
            idle=([(0, 0)], 5),
            special=(
                [(0, 6), (1, 6), (2, 6), (3, 6), (2, 6), (3, 6), (2, 6), (1, 6), (0, 6)],
                5,
            ),
        ),
    ),
    "junimo": dict(
        frame=16,
        offset=(24, 6),  # Green
        anims=dict(
            walk=([(0, 2), (1, 2), (2, 2), (3, 2), (4, 2), (5, 2), (6, 2), (7, 2)], 8),
            idle=([(0, 0)], 5),
            special=([(4, 3), (5, 3), (6, 3), (7, 3)], 10),
        ),
    ),
    "parrot": dict(
        frame=24,
        offset=(0, 2),  # Colourful
        anims=dict(
            walk=([(2, 0), (3, 0), (4, 0)], 5),
            idle=([(0, 0)], 5),
            special=([(0, 0), (1, 0), (0, 0), (1, 0), (0, 0)], 5),
        ),
    ),
    "turtle": dict(
        frame=32,
        offset=(0, 0),
        anims=dict(
            walk=([(0, 1), (1, 1), (2, 1), (3, 1)], 2),
            idle=([(0, 4)], 5),
            special=([(0, 6), (1, 6), (2, 6), (3, 6)], 5),
        ),
    ),
    "dino": dict(
        frame=16,
        offset=(0, 0),
        anims=dict(
            walk=([(0, 1), (1, 1), (2, 1), (3, 1)], 5),
            idle=([(0, 0)], 5),
            special=([(0, 6), (1, 6), (2, 6), (3, 6), (0, 6), (0, 0)], 5),
        ),
    ),
    "cow": dict(
        frame=32,
        offset=(0, 0),
        anims=dict(
            walk=([(0, 1), (1, 1), (2, 1), (3, 1)], 5),
            idle=([(0, 0)], 5),
            special=([(0, 4), (1, 4), (3, 4), (2, 4), (3, 4), (1, 4), (0, 4)], 5),
        ),
    ),
}

PET_LABELS = {
    "cat": "Cat",
    "dog": "Dog",
    "chicken": "Chicken",
    "duck": "Duck",
    "junimo": "Junimo",
    "parrot": "Parrot",
    "turtle": "Turtle",
    "dino": "Dinosaur",
    "cow": "Cow",
}


# ── sprite access ─────────────────────────────────────────────────────


def npc_sheet(name: str) -> Image.Image:
    if name not in _npc_sheets:
        _npc_sheets[name] = Image.open(NPC_DIR / f"{name}..png").convert("RGBA")
    return _npc_sheets[name]


def pet_sheet(name: str) -> Image.Image:
    if name not in _pet_sheets:
        _pet_sheets[name] = Image.open(PET_DIR / f"{name}.png").convert("RGBA")
    return _pet_sheets[name]


def npc_frame(name: str, col: int, row: int, span: dict | None, scale: int) -> Image.Image:
    key = ("npc", name, col, row, span and (span["w"], span["h"]), scale)
    if key in _sprite_cache:
        return _sprite_cache[key]
    fw, fh = 16, 24 if name in {"Dwarf", "Krobus"} else 32
    w = span["w"] if span else 1
    h = span["h"] if span else 1
    region = npc_sheet(name).crop(
        (col * fw, row * fh, (col + w) * fw, (row + h) * fh)
    )
    region = region.resize((region.width * scale, region.height * scale), Image.NEAREST)
    _sprite_cache[key] = region
    return region


def pet_frame(name: str, anim: str, index: int, scale: int) -> Image.Image:
    frames, fps = PET_DEFS[name]["anims"][anim]
    col, row = frames[index % len(frames)]
    ox, oy = PET_DEFS[name]["offset"]
    key = ("pet", name, col, row, scale)
    if key in _sprite_cache:
        return _sprite_cache[key]
    f = PET_DEFS[name]["frame"]
    region = pet_sheet(name).crop(
        ((col + ox) * f, (row + oy) * f, (col + ox + 1) * f, (row + oy + 1) * f)
    )
    region = region.resize((region.width * scale, region.height * scale), Image.NEAREST)
    _sprite_cache[key] = region
    return region


def paste_feet(
    canvas: Image.Image,
    sprite: Image.Image,
    x: float,
    y: float,
    flip: bool = False,
    anchor_px: tuple[float, float] | None = None,
) -> None:
    """Paste a sprite so its anchor point (feet) sits at (x, y).

    Multi-cell frames (Clint's anvil, Willy's fishing line) carry the
    character in one anchor cell; passing `anchor_px` keeps that cell's feet
    on (x, y) instead of the whole region's bottom-centre.
    """
    if flip:
        sprite = ImageOps.mirror(sprite)
        if anchor_px:
            anchor_px = (sprite.width - anchor_px[0], anchor_px[1])
    ax, ay = anchor_px if anchor_px else (sprite.width / 2, sprite.height)
    canvas.alpha_composite(sprite, (round(x - ax), round(y - ay)))


def npc_anchor(
    name: str, span: dict | None, scale: int
) -> tuple[float, float]:
    fw, fh = 16, 24 if name in {"Dwarf", "Krobus"} else 32
    ax = span["anchorX"] if span else 0
    ay = span["anchorY"] if span else 0
    return ((ax + 0.5) * fw * scale, (ay + 1) * fh * scale)


def paste_centered(
    canvas: Image.Image,
    sprite: Image.Image,
    cx: float,
    cy: float,
    flip: bool = False,
) -> None:
    if flip:
        sprite = ImageOps.mirror(sprite)
    canvas.alpha_composite(
        sprite,
        (round(cx - sprite.width / 2), round(cy - sprite.height / 2)),
    )


def soft_shadow(
    canvas: Image.Image, cx: float, cy: float, width: float, height: float = 10
) -> None:
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.ellipse(
        [cx - width / 2, cy - height / 2, cx + width / 2, cy + height / 2],
        fill=SHADOW,
    )
    canvas.alpha_composite(overlay)


# ── shared drawing helpers ────────────────────────────────────────────


def wrap_text(text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        candidate = f"{line} {word}".strip()
        if fnt.getlength(candidate) <= max_width or not line:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_speech_bubble(
    canvas: Image.Image,
    box: tuple[int, int, int, int],
    text: str,
    tail: tuple[int, int],
    alpha: int = 255,
    caret: bool = False,
    fnt=None,
) -> None:
    """Draw a Stardew-ish speech bubble with a tail pointing at `tail`."""
    if alpha <= 0:
        return
    fnt = fnt or bubble_font(19)
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    x0, y0, x1, y1 = box
    radius = 12

    # shadow
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        [x0 + 3, y0 + 5, x1 + 3, y1 + 5], radius=radius, fill=(20, 15, 8, 70)
    )
    overlay.alpha_composite(shadow)

    # tail (outline then fill)
    tx, ty = tail
    bx = max(x0 + 26, min(x1 - 26, tx))
    by = y1
    d.polygon([(bx - 13, by - 6), (bx + 13, by - 6), (tx, ty + 3)], fill=INK)
    d.polygon([(bx - 8, by - 3), (bx + 8, by - 3), (tx, ty - 2)], fill=CREAM)

    d.rounded_rectangle(box, radius=radius, fill=CREAM, outline=INK, width=3)

    # text
    lines = wrap_text(text, fnt, x1 - x0 - 34)
    line_h = fnt.size + 7
    total_h = len(lines) * line_h
    ty0 = y0 + (y1 - y0 - total_h) // 2 + 1
    for i, line in enumerate(lines):
        d.text((x0 + 17, ty0 + i * line_h), line, font=fnt, fill=INK_SOFT)

    if caret and lines:
        cy = ty0 + (len(lines) - 1) * line_h
        cx = x0 + 17 + fnt.getlength(lines[-1]) + 3
        d.rectangle([cx, cy + 1, cx + 2, cy + fnt.size], fill=INK_SOFT)

    if alpha < 255:
        r, g, b, a = overlay.split()
        overlay.putalpha(a.point(lambda v: v * alpha // 255))
    canvas.alpha_composite(overlay)


def draw_sign(canvas: Image.Image, x: int, y: int, title: str, subtitle: str) -> None:
    w, h = 272, 98
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle([x + 4, y + 6, x + w + 4, y + h + 6], radius=8, fill=(30, 25, 14, 60))
    d.rounded_rectangle([x, y, x + w, y + h], radius=8, fill=BROWN_DARK, outline=INK, width=3)
    d.rounded_rectangle([x + 9, y + 9, x + w - 9, y + h - 9], radius=5, fill=CREAM, outline=BROWN, width=2)
    # little nail heads
    for nx, ny in ((x + 16, y + 16), (x + w - 16, y + 16)):
        d.ellipse([nx - 3, ny - 3, nx + 3, ny + 3], fill=INK_SOFT)
    tf = pixel_font(21, bold=True)
    sf = pixel_font(12)
    d.text((x + w / 2, y + 31), title, font=tf, fill=INK, anchor="mm")
    d.text((x + w / 2, y + 64), subtitle, font=sf, fill=INK_SOFT, anchor="mm")


# ── hero scene ────────────────────────────────────────────────────────


def make_pelican_town(w: int = 1000, h: int = 500) -> Image.Image:
    rng = random.Random(11)
    bg = Image.new("RGBA", (w, h), GRASS)
    d = ImageDraw.Draw(bg)
    # Soft, low-contrast colour variation — the old high-contrast blobs read
    # as holes rather than grass at README scale.
    for _ in range(34):
        cx, cy = rng.randrange(w), rng.randrange(h)
        rx = rng.randrange(38, 110)
        d.ellipse(
            [cx - rx, cy - rx // 3, cx + rx, cy + rx // 3],
            fill=(130, 180, 77, 255) if rng.random() < 0.5 else (123, 175, 72, 255),
        )
    # grass blades
    for _ in range(420):
        gx, gy = rng.randrange(w), rng.randrange(h)
        col = rng.choice(((112, 162, 64, 255), (146, 190, 88, 255)))
        d.line([gx, gy, gx, gy + rng.choice((2, 3, 3, 4))], fill=col, width=1)
        if rng.random() < 0.4:
            d.line([gx + 2, gy + 1, gx + 2, gy + 3], fill=col, width=1)

    # dirt path — drawn as a filled band; Pillow's wide `line` leaves notches
    # between joints at this thickness, which showed the grass underneath.
    xs = list(range(-20, w + 40, 4))
    ys = [372 + 20 * math.sin(x / 190) + 7 * math.sin(x / 63) for x in xs]
    for half, col in ((61, PATH_EDGE), (53, PATH)):
        top = [(x, int(y - half)) for x, y in zip(xs, ys)]
        bottom = [(x, int(y + half)) for x, y in zip(reversed(xs), reversed(ys))]
        d.polygon(top + bottom, fill=col)
    for _ in range(90):
        px = rng.randrange(-10, w + 10)
        py = int(372 + 20 * math.sin(px / 190) + 7 * math.sin(px / 63))
        py += rng.randrange(-46, 47)
        s = rng.choice((2, 2, 3, 4))
        d.ellipse([px, py, px + s, py + s // 2 + 1], fill=PATH_EDGE)
    for _ in range(60):
        px = rng.randrange(-10, w + 10)
        py = int(372 + 20 * math.sin(px / 190) + 7 * math.sin(px / 63))
        py += rng.randrange(-42, 43)
        s = rng.choice((3, 4, 5, 7))
        d.ellipse([px, py, px + s, py + s // 2], fill=(188, 150, 96, 255))

    # pond
    d.ellipse([762, 34, 982, 168], fill=(70, 96, 60, 255))
    d.ellipse([770, 40, 974, 162], fill=WATER, outline=(60, 122, 170, 255), width=3)
    for i in range(4):
        yy = 62 + i * 24
        d.arc([800 + i * 8, yy, 900 + i * 14, yy + 16], 200, 340, fill=WATER_LIGHT, width=2)
    for lx, ly in ((812, 112), (905, 74), (930, 128)):
        d.ellipse([lx, ly, lx + 22, ly + 12], fill=(88, 154, 74, 255), outline=(64, 120, 54, 255))
        d.pieslice([lx + 4, ly + 2, lx + 17, ly + 10], 200, 340, fill=(110, 176, 88, 255))

    # small fence along the near bank of the pond
    for i, fx in enumerate((792, 850, 908, 966)):
        d.rectangle([fx, 158, fx + 7, 192], fill=BROWN_DARK, outline=INK)
        d.rectangle([fx + 1, 160, fx + 6, 163], fill=(160, 112, 58, 255))
    d.rectangle([792, 166, 973, 171], fill=(160, 112, 58, 255), outline=BROWN_DARK)
    d.rectangle([792, 178, 973, 183], fill=(160, 112, 58, 255), outline=BROWN_DARK)

    # a few rocks
    for rx, ry, rw in ((620, 214, 16), (700, 300, 12), (180, 400, 14), (466, 214, 10)):
        d.ellipse([rx, ry, rx + rw, ry + rw * 0.6], fill=(148, 148, 138, 255), outline=(110, 112, 104, 255))
        d.arc([rx + 2, ry + 1, rx + rw - 2, ry + rw * 0.5], 200, 330, fill=(182, 182, 170, 255))

    # trees & bushes
    def tree(cx: int, cy: int, r: int) -> None:
        d.ellipse([cx - r * 0.7, cy + r * 0.15, cx + r * 0.7, cy + r * 0.5], fill=(40, 55, 28, 55))
        d.rectangle([cx - 5, cy + 4, cx + 5, cy + r * 0.5], fill=(105, 70, 38, 255))
        for rr, col in ((r, (56, 106, 48)), (r * 0.8, (74, 130, 58)), (r * 0.55, (96, 156, 70))):
            d.ellipse([cx - rr, cy - rr * 0.75, cx + rr, cy + rr * 0.75], fill=(*col, 255))
        for _ in range(7):
            hx = cx + rng.randrange(-int(r * 0.5), int(r * 0.5))
            hy = cy + rng.randrange(-int(r * 0.4), int(r * 0.35))
            d.ellipse([hx, hy, hx + 5, hy + 4], fill=(126, 180, 84, 255))

    tree(74, 246, 52)
    tree(348, 54, 42)
    tree(600, 34, 38)
    tree(690, 190, 30)

    # flowers
    for _ in range(46):
        fx, fy = rng.randrange(20, w - 20), rng.randrange(180, h - 20)
        path_y = 372 + 20 * math.sin(fx / 190) + 7 * math.sin(fx / 63)
        if abs(fy - path_y) < 74 or (750 < fx < 990 and fy < 175):
            continue
        col = rng.choice(((238, 226, 128), (239, 155, 178), (232, 238, 246), (196, 154, 226)))
        d.rectangle([fx, fy + 3, fx, fy + 6], fill=GRASS_DARK)
        d.rectangle([fx - 2, fy, fx + 2, fy + 2], fill=col)
        d.rectangle([fx, fy - 2, fx, fy + 1], fill=col)

    draw_sign(bg, 26, 24, "PELICAN TOWN", "population: 41")
    return bg


def hero_gif() -> None:
    w, h = 1000, 500
    bg = make_pelican_town(w, h)
    total, nframes = 6.0, int(6.0 * FPS)
    frames: list[Image.Image] = []

    # (character, feet x, feet y, animation variants, fps, scale)
    villagers = [
        ("Clint", 128, 268, 0, 0),
        ("Abigail", 318, 272, 0, 0),
        ("Wizard", 512, 264, 0, 0),
        ("Emily", 872, 276, 0, 0),
    ]

    walkers = [
        ("cat", 150, 445, 78, 0.0, 3),
        ("dog", 330, 470, 62, 2.0, 3),
        ("chicken", 548, 430, 26, 0.7, 4),
        ("parrot", 690, 438, 36, 1.2, 3),
        ("turtle", 938, 474, 30, 0.6, 2),
    ]
    fixed_pets = [
        ("junimo", 792, 424, "special", 4),
    ]
    heart_src = Image.open(ROOT / "assets" / "misc" / "heart.png").convert("RGBA")
    heart = heart_src.resize((heart_src.width * 2, heart_src.height * 2), Image.NEAREST)

    for fi in range(nframes):
        t = fi / FPS
        canvas = bg.copy()

        # ── back row villagers, sorted for depth ──
        for name, x, y, variant_index, _ in villagers:
            variants = NPC_ANIMS[name]["activity"]
            anim = variants[min(variant_index, len(variants) - 1)]
            frames_list, fps = anim["frames"], anim["fps"]
            idx = int(t * fps) % len(frames_list)
            col, row = frames_list[idx]
            sprite = npc_frame(name, col, row, anim["span"], 3)
            soft_shadow(canvas, x, y - 3, 16 * 3 * 0.7)
            paste_feet(
                canvas, sprite, x, y, anchor_px=npc_anchor(name, anim["span"], 3)
            )

        # ── pets ──
        for name, cx, y, amp, phase, scale in walkers:
            period = 3.0
            ang = 2 * math.pi * ((t / period) + phase)
            x = cx + amp * math.sin(ang)
            facing = 1 if math.cos(ang) >= 0 else -1
            frames_list, fps = PET_DEFS[name]["anims"]["walk"]
            idx = int(t * fps) % len(frames_list)
            sprite = pet_frame(name, "walk", idx, scale)
            soft_shadow(canvas, x, y - 3, sprite.width * 0.7, 8)
            paste_feet(canvas, sprite, x, y, flip=facing < 0)

        for name, x, y, anim_name, scale in fixed_pets:
            frames_list, fps = PET_DEFS[name]["anims"][anim_name]
            idx = int(t * fps) % len(frames_list)
            sprite = pet_frame(name, anim_name, idx, scale)
            soft_shadow(canvas, x, y - 3, sprite.width * 0.7, 8)
            paste_feet(canvas, sprite, x, y)

        # A little heart floats up over the junimo, the same feedback a click
        # gives in the plugin.
        for i, delay in enumerate((0.0, 0.28, 0.56)):
            ht = t - (3.0 + delay)
            if not 0 <= ht < 1.0:
                continue
            h = heart.copy()
            a = h.getchannel("A").point(lambda v, p=ht: int(v * (1 - p)))
            h.putalpha(a)
            hx = 150 + (i - 1) * 18 + int(10 * math.sin(ht * 5 + i))
            hy = int(344 - 44 * ht)
            canvas.alpha_composite(h, (hx, hy))

        # ── Sebastian with a speech bubble ──
        sx, sy = 642, 432
        seb = npc_frame("Sebastian", 0, 0, None, 3)
        soft_shadow(canvas, sx, sy - 3, seb.width * 0.62)
        paste_feet(canvas, seb, sx, sy)

        # bubble appears after a beat, types, holds, fades out
        text = "Rain outside, code inside. My kind of night."
        start, type_speed, hold_end, fade_end = 1.1, 0.032, 5.0, 5.5
        if start <= t < fade_end:
            chars = max(0, min(len(text), int((t - start) / type_speed)))
            alpha = 255
            if t < start + 0.18:
                alpha = int(255 * (t - start) / 0.18)
            elif t > hold_end:
                alpha = int(255 * max(0.0, (fade_end - t) / (fade_end - hold_end)))
            typing = chars < len(text)
            draw_speech_bubble(
                canvas,
                (430, 286, 914, 366),
                text[:chars],
                (sx + 6, 371),
                alpha=alpha,
                caret=typing or (t * 3) % 2 < 1,
                fnt=bubble_font(19),
            )

        frames.append(canvas.convert("RGB"))

    save_gif(frames, OUT_DIR / "hero.gif")


# ── activity grid ─────────────────────────────────────────────────────


def parchment_card(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    radius: int = 12,
    fill=CREAM,
) -> None:
    x0, y0, x1, y1 = box
    draw.rounded_rectangle([x0 + 2, y0 + 4, x1 + 2, y1 + 4], radius=radius, fill=(40, 30, 16, 55))
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=BROWN, width=3)
    draw.rounded_rectangle(
        [x0 + 6, y0 + 6, x1 - 6, y1 - 6], radius=radius - 5, outline=CREAM_DEEP, width=2
    )


def make_grid_background(w: int, h: int, cols: int, rows: int, tile_w: int, tile_h: int, gap: int, margin_x: int, margin_y: int):
    bg = Image.new("RGBA", (w, h), (46, 58, 36, 255))
    d = ImageDraw.Draw(bg)
    rng = random.Random(3)
    for _ in range(240):
        x, y = rng.randrange(w), rng.randrange(h)
        c = rng.choice(((52, 66, 40, 255), (40, 51, 31, 255), (58, 72, 44, 255)))
        d.rectangle([x, y, x + 2, y + 2], fill=c)
    for r in range(rows):
        for c in range(cols):
            x0 = margin_x + c * (tile_w + gap)
            y0 = margin_y + r * (tile_h + gap)
            parchment_card(d, (x0, y0, x0 + tile_w, y0 + tile_h))
    return bg


def villagers_gif() -> None:
    picks = [
        ("Abigail", 0, 3),   # flute
        ("Clint", 0, 3),     # anvil (2-cell span)
        ("Emily", 0, 3),     # dance
        ("Sam", 1, 3),       # skateboard
        ("Wizard", 0, 3),    # cauldron
        ("Leah", 0, 3),      # sculpting
        ("Maru", 1, 3),      # welding sparks
        ("Robin", 0, 3),     # hammering
    ]
    cols, rows = 4, 2
    tile_w, tile_h, gap = 226, 196, 16
    mx, my = 20, 20
    w = mx * 2 + cols * tile_w + (cols - 1) * gap
    h = my * 2 + rows * tile_h + (rows - 1) * gap
    bg = make_grid_background(w, h, cols, rows, tile_w, tile_h, gap, mx, my)
    total, nframes = 4.0, int(4.0 * FPS)
    frames = []

    for fi in range(nframes):
        t = fi / FPS
        canvas = bg.copy()
        d = ImageDraw.Draw(canvas)
        for i, (name, variant_index, scale) in enumerate(picks):
            r, c = divmod(i, cols)
            x0 = mx + c * (tile_w + gap)
            y0 = my + r * (tile_h + gap)
            cx = x0 + tile_w / 2
            label_f = pixel_font(15, bold=True)
            d.text((cx, y0 + tile_h - 24), name, font=label_f, fill=INK, anchor="mm")
            d.line(
                [x0 + 34, y0 + tile_h - 40, x0 + tile_w - 34, y0 + tile_h - 40],
                fill=CREAM_DEEP,
                width=2,
            )

            variants = NPC_ANIMS[name]["activity"]
            anim = variants[min(variant_index, len(variants) - 1)]
            frames_list, fps = anim["frames"], anim["fps"]
            idx = int(t * fps) % len(frames_list)
            col, row = frames_list[idx]
            sprite = npc_frame(name, col, row, anim["span"], scale)
            cy = y0 + (tile_h - 44) / 2
            ax, ay = npc_anchor(name, anim["span"], scale)
            feet_x = cx - sprite.width / 2 + ax
            feet_y = cy - sprite.height / 2 + ay
            soft_shadow(canvas, feet_x, feet_y - 2, 16 * scale * 0.7, 9)
            paste_centered(canvas, sprite, cx, cy)

        frames.append(canvas.convert("RGB"))

    save_gif(frames, OUT_DIR / "villagers.gif")


# ── pet grid ──────────────────────────────────────────────────────────


def pets_gif() -> None:
    order = ["cat", "dog", "chicken", "duck", "junimo", "parrot", "turtle", "dino", "cow"]
    scales = {
        "cat": 3,
        "dog": 3,
        "chicken": 5,
        "duck": 5,
        "junimo": 5,
        "parrot": 4,
        "turtle": 3,
        "dino": 5,
        "cow": 3,
    }
    anims = {
        "cat": "special",
        "dog": "special",
        "chicken": "walk",
        "duck": "walk",
        "junimo": "walk",
        "parrot": "walk",
        "turtle": "walk",
        "dino": "walk",
        "cow": "walk",
    }
    cols, rows = 3, 3
    tile_w, tile_h, gap = 248, 158, 16
    mx, my = 20, 20
    w = mx * 2 + cols * tile_w + (cols - 1) * gap
    h = my * 2 + rows * tile_h + (rows - 1) * gap
    bg = make_grid_background(w, h, cols, rows, tile_w, tile_h, gap, mx, my)
    total, nframes = 4.0, int(4.0 * FPS)
    frames = []

    for fi in range(nframes):
        t = fi / FPS
        canvas = bg.copy()
        d = ImageDraw.Draw(canvas)
        for i, name in enumerate(order):
            r, c = divmod(i, cols)
            x0 = mx + c * (tile_w + gap)
            y0 = my + r * (tile_h + gap)
            cx = x0 + tile_w / 2
            label_f = pixel_font(15, bold=True)
            d.text((cx, y0 + tile_h - 22), PET_LABELS[name], font=label_f, fill=INK, anchor="mm")

            anim_name = anims[name]
            frames_list, fps = PET_DEFS[name]["anims"][anim_name]
            idx = int(t * fps) % len(frames_list)
            sprite = pet_frame(name, anim_name, idx, scales[name])
            cy = y0 + (tile_h - 42) / 2
            soft_shadow(canvas, cx, cy + sprite.height / 2 - 1, sprite.width * 0.65, 9)
            paste_centered(canvas, sprite, cx, cy)

        frames.append(canvas.convert("RGB"))

    save_gif(frames, OUT_DIR / "pets.gif")


# ── speech bubble demo ────────────────────────────────────────────────


def save_gif(frames: list[Image.Image], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    quantized = [
        f.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        for f in frames
    ]
    quantized[0].save(
        path,
        save_all=True,
        append_images=quantized[1:],
        duration=round(1000 / FPS),
        loop=0,
        optimize=True,
        disposal=1,
    )
    print(f"wrote {path.relative_to(ROOT)}  ({path.stat().st_size / 1024:.0f} KB)")


def main() -> int:
    _ensure_fonts()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    hero_gif()
    villagers_gif()
    pets_gif()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

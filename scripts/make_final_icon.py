"""Kalendra icon: calendar + checkmark tile + leaf sprig, no white card/sticker,
sitting directly on the app's brand gradient."""
import math
from PIL import Image, ImageDraw, ImageFilter

SIZE = 1024
INDIGO = (99, 102, 241)
PINK = (236, 72, 153)
HEADER_BLUE = (37, 99, 235)
RING_NAVY = (30, 41, 59)
TILE_GRAY = (226, 230, 241)
LEAF_DARK = (22, 132, 83)
LEAF_LIGHT = (52, 199, 121)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def diagonal_gradient(size, c1, c2):
    img = Image.new("RGB", (size, size), c1)
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            px[x, y] = lerp(c1, c2, t)
    return img


def leaf_shape(size, color):
    """A single pointed leaf on a transparent tile, tip pointing up."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = size / 2
    top = (cx, 0)
    bottom = (cx, size)
    bulge = size * 0.42
    pts = []
    for t in range(0, 101):
        f = t / 100
        # teardrop: quadratic bulge from bottom to top
        x = cx + bulge * math.sin(f * math.pi) * (1 - f * 0.15)
        y = size * f
        pts.append((x, y))
    for t in range(100, -1, -1):
        f = t / 100
        x = cx - bulge * math.sin(f * math.pi) * (1 - f * 0.15)
        y = size * f
        pts.append((x, y))
    d.polygon(pts, fill=color)
    d.line([top, bottom], fill=(255, 255, 255, 60), width=max(2, size // 60))
    return img


def make_icon():
    img = diagonal_gradient(SIZE, INDIGO, PINK).convert("RGBA")

    # --- soft drop shadow for the whole calendar+leaf group ---
    shadow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    l, t, r, b = 250, 210, SIZE - 250, SIZE - 170
    sd.rounded_rectangle([l + 18, t + 34, r + 18, b + 34], radius=64, fill=(10, 10, 30, 130))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    img.alpha_composite(shadow)

    draw = ImageDraw.Draw(img)

    # --- calendar body (white) ---
    draw.rounded_rectangle([l, t, r, b], radius=64, fill=(255, 255, 255, 255))

    # --- header (blue), rounded only at the top ---
    header_b = t + 165
    draw.rounded_rectangle([l, t, r, header_b + 64], radius=64, fill=HEADER_BLUE)
    draw.rectangle([l, header_b, r, header_b + 4], fill=HEADER_BLUE)

    # --- binder rings ---
    for cx in (l + 150, r - 150):
        draw.rounded_rectangle([cx - 26, t - 55, cx + 26, t + 40], radius=22, fill=RING_NAVY)
        draw.ellipse([cx - 12, t - 20, cx + 12, t + 4], fill=(255, 255, 255, 255))

    # --- date grid (3x3), one tile becomes the checkmark tile ---
    cols, rows = 3, 3
    grid_l, grid_r = l + 55, r - 55
    grid_t = header_b + 48
    grid_b = b - 40
    cell_w = (grid_r - grid_l) / cols
    cell_h = (grid_b - grid_t) / rows
    tile_pad = 13
    check_row, check_col = 1, 1
    for row in range(rows):
        for col in range(cols):
            cx0 = grid_l + col * cell_w + tile_pad
            cy0 = grid_t + row * cell_h + tile_pad
            cx1 = grid_l + (col + 1) * cell_w - tile_pad
            cy1 = grid_t + (row + 1) * cell_h - tile_pad
            if row == check_row and col == check_col:
                draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=18, fill=HEADER_BLUE)
                mx, my = (cx0 + cx1) / 2, (cy0 + cy1) / 2
                s = (cx1 - cx0) * 0.28
                draw.line([(mx - s, my), (mx - s * 0.15, my + s * 0.85), (mx + s * 1.1, my - s * 0.9)],
                          fill=(255, 255, 255, 255), width=int(s * 0.42), joint="curve")
            else:
                draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=18, fill=TILE_GRAY)

    # --- leaf sprig tucked just past the bottom-right corner ---
    leaf_size = 230
    leaf1 = leaf_shape(leaf_size, LEAF_DARK).rotate(-28, expand=True, resample=Image.BICUBIC)
    leaf2 = leaf_shape(int(leaf_size * 0.8), LEAF_LIGHT).rotate(20, expand=True, resample=Image.BICUBIC)
    anchor_x, anchor_y = r + 15, b - 120
    img.alpha_composite(leaf1, (int(anchor_x - leaf1.width * 0.55), int(anchor_y - leaf1.height * 0.85)))
    img.alpha_composite(leaf2, (int(anchor_x - leaf2.width * 0.2), int(anchor_y - leaf2.height * 0.9)))

    return img.convert("RGB")


if __name__ == "__main__":
    icon = make_icon()
    icon.save("icon-master.png")
    for name, size in [("icon-180.png", 180), ("apple-touch-icon.png", 180),
                        ("icon-192.png", 192), ("icon-512.png", 512), ("icon-32.png", 32)]:
        icon.resize((size, size), Image.LANCZOS).save(name)
    print("done")

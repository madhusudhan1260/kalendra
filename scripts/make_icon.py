"""Generates the Kalendra app icon (gradient calendar card) at several sizes."""
from PIL import Image, ImageDraw
import math

SIZE = 1024
OUT_DIR = "."

# Brand gradient: indigo -> pink (matches --accent / #ec4899 in styles.css)
C1 = (99, 102, 241)   # #6366f1
C2 = (236, 72, 153)   # #ec4899


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_master():
    img = Image.new("RGB", (SIZE, SIZE), C1)
    px = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            t = (x + y) / (2 * SIZE)
            px[x, y] = lerp(C1, C2, t)

    draw = ImageDraw.Draw(img)

    # Rounded "card" body (white)
    card_l, card_t, card_r, card_b = 210, 250, SIZE - 210, SIZE - 190
    radius = 90
    draw.rounded_rectangle([card_l, card_t, card_r, card_b], radius=radius, fill=(255, 255, 255))

    # Header strip (indigo), rounded only at the top -- draw rounded rect then
    # square off the bottom by covering it with a plain rectangle.
    header_b = card_t + 190
    draw.rounded_rectangle([card_l, card_t, card_r, header_b + radius], radius=radius, fill=(79, 70, 229))
    draw.rectangle([card_l, header_b, card_r, header_b + radius], fill=(79, 70, 229))
    # re-clip bottom of header square (remove the extra rounded bulge below header_b)
    draw.rectangle([card_l, header_b, card_r, header_b + 4], fill=(79, 70, 229))

    # Binder rings
    ring_y = card_t
    for cx in (card_l + 170, card_r - 170):
        draw.ellipse([cx - 34, ring_y - 34, cx + 34, ring_y + 34], fill=(255, 255, 255))
        draw.ellipse([cx - 16, ring_y - 16, cx + 16, ring_y + 16], fill=(79, 70, 229))

    # Date-dot grid (4 cols x 2 rows) in the lower white area
    dot_colors = [(99, 102, 241), (236, 72, 153), (245, 158, 11), (16, 185, 129)]
    grid_top = header_b + 90
    grid_left = card_l + 110
    gap_x = (card_r - card_l - 220) / 3
    gap_y = 150
    dot_r = 34
    for row in range(2):
        for col in range(4):
            cx = grid_left + col * gap_x
            cy = grid_top + row * gap_y
            color = dot_colors[(row * 4 + col) % len(dot_colors)]
            if row == 0 and col == 1:
                # one highlighted "today" dot, bigger
                draw.ellipse([cx - dot_r * 1.3, cy - dot_r * 1.3, cx + dot_r * 1.3, cy + dot_r * 1.3], fill=(236, 72, 153))
            else:
                draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=color)

    return img


def rounded_mask(size, radius_ratio=0.225):
    """iOS-style squircle mask so previews (non-iOS) also look tidy."""
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=round(size * radius_ratio), fill=255)
    return mask


if __name__ == "__main__":
    master = make_master()
    master.save(f"{OUT_DIR}/icon-master.png")

    # Apple touch icon: iOS applies its own squircle mask, so ship a plain square.
    for name, size in [("icon-180.png", 180), ("apple-touch-icon.png", 180),
                        ("icon-192.png", 192), ("icon-512.png", 512),
                        ("icon-32.png", 32)]:
        resized = master.resize((size, size), Image.LANCZOS)
        resized.save(f"{OUT_DIR}/{name}")

    print("done")

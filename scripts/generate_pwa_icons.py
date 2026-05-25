from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ICONS_DIR = ROOT / "frontend" / "public" / "icons"
ICONS_DIR.mkdir(parents=True, exist_ok=True)

PALETTE = {
    "emerald": "#10B981",
    "deep": "#065F46",
    "cream": "#F5F0E8",
    "mint": "#D1FAE5",
    "shadow": "#0F3D33",
}


def draw_icon(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), PALETTE["cream"])
    draw = ImageDraw.Draw(image)

    padding = size * 0.09
    draw.rounded_rectangle(
        (padding, padding, size - padding, size - padding),
        radius=size * 0.24,
        fill=PALETTE["emerald"],
    )

    basket_left = size * 0.23
    basket_top = size * 0.43
    basket_right = size * 0.77
    basket_bottom = size * 0.76

    draw.rounded_rectangle(
        (basket_left, basket_top, basket_right, basket_bottom),
        radius=size * 0.09,
        fill=PALETTE["cream"],
    )

    handle_width = size * 0.08
    draw.arc(
        (size * 0.32, size * 0.2, size * 0.68, size * 0.58),
        start=200,
        end=-20,
        fill=PALETTE["cream"],
        width=max(6, int(handle_width)),
    )

    stripe_width = max(4, int(size * 0.028))
    for stripe_x in (0.35, 0.5, 0.65):
        draw.line(
            [(size * stripe_x, basket_top + size * 0.05), (size * stripe_x, basket_bottom - size * 0.05)],
            fill=PALETTE["emerald"],
            width=stripe_width,
        )

    leaf = [
        (size * 0.49, size * 0.28),
        (size * 0.60, size * 0.18),
        (size * 0.65, size * 0.31),
        (size * 0.55, size * 0.36),
    ]
    draw.polygon(leaf, fill=PALETTE["mint"])
    draw.line(
        [(size * 0.53, size * 0.34), (size * 0.63, size * 0.22)],
        fill=PALETTE["deep"],
        width=max(3, int(size * 0.016)),
    )

    return image


def main() -> None:
    sizes = {
        "icon-192x192.png": 192,
        "icon-512x512.png": 512,
        "apple-touch-icon.png": 180,
    }

    for filename, size in sizes.items():
        icon = draw_icon(size)
        icon.save(ICONS_DIR / filename)


if __name__ == "__main__":
    main()

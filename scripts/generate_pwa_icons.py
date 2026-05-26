"""Generate PWA, favicon, and Android launcher icons from workspace/ brand assets."""

from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / "frontend"
WORKSPACE = ROOT / "workspace"
ICONS_DIR = FRONTEND / "public" / "icons"
PUBLIC_DIR = FRONTEND / "public"
ANDROID_RES = FRONTEND / "android" / "app" / "src" / "main" / "res"
COMMITTED_SOURCE = ICONS_DIR / "app-icon-source.png"


def _appiconset_dir() -> Path:
    candidates = [
        WORKSPACE / "ios" / "AppIcon.appiconset",
        WORKSPACE / "Assets.xcassets" / "AppIcon.appiconset",
    ]
    for path in candidates:
        if (path / "1024.png").is_file():
            return path
    return candidates[0]


def resolve_source() -> Path:
    """Prefer workspace/ios export (square app icon, not marketing spec sheet)."""
    appiconset = _appiconset_dir()
    candidates = [
        appiconset / "1024.png",
        WORKSPACE / "marketing" / "appstore.png",
        WORKSPACE / "appstore.png",
        WORKSPACE / "marketing" / "playstore.png",
        WORKSPACE / "playstore.png",
        COMMITTED_SOURCE,
    ]
    for path in candidates:
        if path.is_file():
            ICONS_DIR.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, COMMITTED_SOURCE)
            return COMMITTED_SOURCE
    raise FileNotFoundError(
        "App icon not found. Add workspace/ios/AppIcon.appiconset/1024.png"
    )


def fit_cover_square(image: Image.Image, size: int) -> Image.Image:
    image = image.convert("RGBA")
    width, height = image.size
    scale = max(size / width, size / height)
    resized = image.resize((int(width * scale), int(height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size) // 2
    top = (resized.height - size) // 2
    return resized.crop((left, top, left + size, top + size))


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)


def copy_if_exists(src: Path, dst: Path) -> bool:
    if not src.is_file():
        return False
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    return True


def save_ico(square: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    square.save(path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])


def copy_workspace_android_launchers() -> None:
    """Use pre-exported mipmaps from workspace/android when available."""
    src_root = WORKSPACE / "android"
    if not src_root.is_dir():
        return

    for folder in src_root.iterdir():
        if not folder.name.startswith("mipmap-"):
            continue
        src_icon = folder / "ic_launcher.png"
        if not src_icon.is_file():
            continue
        dst_folder = ANDROID_RES / folder.name
        for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
            shutil.copy2(src_icon, dst_folder / name)


def main() -> None:
    appiconset = _appiconset_dir()
    source_path = resolve_source()
    master = Image.open(source_path)

    presets = {
        "icon-512x512.png": appiconset / "512.png",
        "apple-touch-icon.png": appiconset / "180.png",
    }
    for filename, preset in presets.items():
        if not copy_if_exists(preset, ICONS_DIR / filename):
            size = 512 if "512" in filename else 180
            save_png(fit_cover_square(master, size), ICONS_DIR / filename)

    save_png(fit_cover_square(master, 192), ICONS_DIR / "icon-192x192.png")
    save_png(fit_cover_square(master, 32), ICONS_DIR / "favicon-32x32.png")

    save_ico(fit_cover_square(master, 48), PUBLIC_DIR / "favicon.ico")
    shutil.copy2(ICONS_DIR / "favicon-32x32.png", PUBLIC_DIR / "favicon.png")

    copy_workspace_android_launchers()

    print(f"Source: {source_path.relative_to(ROOT)}")
    print(f"AppIcon set: {appiconset.relative_to(ROOT)}")
    print("Icons written:")
    for path in sorted(ICONS_DIR.glob("*.png")):
        print(f"  - {path.relative_to(ROOT)}")
    print(f"  - {PUBLIC_DIR / 'favicon.ico'}")
    print("  - Android mipmap ic_launcher* (from workspace/android when present)")


if __name__ == "__main__":
    main()

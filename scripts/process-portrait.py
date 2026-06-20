"""Generate portrait and platform assets from source photo."""
from __future__ import annotations

import base64
import io
from pathlib import Path

from PIL import Image

SRC = Path(
    r"C:\Users\Benjamin\.cursor\projects\c-Users-Benjamin-Projects-Strewn-release\assets"
    r"\c__Users_Benjamin_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images"
    r"_348906517_589248356673731_2200711262366015141_n-dbebc087-849e-4ff6-a834-d0f8e97f19f3.png"
)
ASSETS = Path(__file__).resolve().parent.parent / "assets"
PLATFORM = ASSETS / "platform-logos"


def load_square() -> Image.Image:
    img = Image.open(SRC).convert("RGB")
    w, h = img.size
    s = min(w, h)
    return img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))


def resize_square(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.LANCZOS)


def cover_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    w, h = img.size
    scale = max(target_w / w, target_h / h)
    resized = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    rw, rh = resized.size
    left = (rw - target_w) // 2
    top = (rh - target_h) // 2
    return resized.crop((left, top, left + target_w, top + target_h))


def save_jpg(img: Image.Image, path: Path, quality: int = 88) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="JPEG", quality=quality, optimize=True)


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)


def save_webp(img: Image.Image, path: Path, quality: int = 85) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="WEBP", quality=quality, method=6)


def write_favicon_svg(img: Image.Image, path: Path) -> None:
    small = resize_square(img, 64)
    buf = io.BytesIO()
    small.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
        f'  <image href="data:image/png;base64,{b64}" width="64" height="64"/>\n'
        "</svg>\n"
    )
    path.write_text(svg, encoding="utf-8")


def main() -> None:
    src = load_square()
    src_w, src_h = src.size
    print(f"Source: {src_w}x{src_h}")

    # Primary site assets
    save_webp(resize_square(src, 800), ASSETS / "benny-portrait.webp", quality=88)
    save_png(resize_square(src, min(src_w, 1024)), ASSETS / "benny-portrait.png")
    save_webp(resize_square(src, 400), ASSETS / "benny-portrait-400.webp")
    save_webp(resize_square(src, 512), ASSETS / "benny-portrait-512.webp")
    save_webp(resize_square(src, 800), ASSETS / "benny-portrait-800.webp")

    og = cover_crop(src, 1200, 630)
    save_jpg(og, ASSETS / "og-image.jpg")
    save_png(resize_square(src, 180), ASSETS / "apple-touch-icon.png")

    write_favicon_svg(src, ASSETS / "favicon.svg")

    # Platform upload folder
    save_jpg(resize_square(src, 750), PLATFORM / "spotify-750x750.jpg", quality=92)
    save_jpg(resize_square(src, 3000), PLATFORM / "apple-music-3000x3000.jpg", quality=92)
    save_jpg(resize_square(src, 4000), PLATFORM / "apple-music-4000x4000.jpg", quality=92)
    save_jpg(resize_square(src, 800), PLATFORM / "youtube-800x800.jpg", quality=92)
    save_png(resize_square(src, 512), PLATFORM / "github-512x512.png")
    save_png(resize_square(src, 512), PLATFORM / "favicon-512x512.png")
    save_jpg(og, PLATFORM / "og-image-1200x630.jpg")
    save_png(resize_square(src, 180), PLATFORM / "apple-touch-icon-180x180.png")

    print("Done. Assets written to", ASSETS)


if __name__ == "__main__":
    main()

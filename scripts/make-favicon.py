from PIL import Image, ImageDraw
import base64
import io
from pathlib import Path

SRC = Path(
    r"C:\Users\Benjamin\.cursor\projects\c-Users-Benjamin-Projects-Strewn-release\assets"
    r"\c__Users_Benjamin_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images"
    r"_bennyblacklogo-764478b4-8370-4a60-b38c-086a7af4eac2.png"
)
OUT = Path(r"C:\Users\Benjamin\Projects\Strewn\release\benny-black\assets\favicon.svg")

img = Image.open(SRC).convert("RGBA")
w, h = img.size
s = min(w, h)
img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
mask = Image.new("L", (s, s), 0)
ImageDraw.Draw(mask).ellipse((0, 0, s, s), fill=255)
img.putalpha(mask)
small = img.resize((64, 64), Image.LANCZOS)
buf = io.BytesIO()
small.save(buf, format="PNG")
b64 = base64.b64encode(buf.getvalue()).decode()
svg = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n'
    f'  <image href="data:image/png;base64,{b64}" width="64" height="64"/>\n'
    "</svg>\n"
)
OUT.write_text(svg, encoding="utf-8")
print("favicon.svg updated")

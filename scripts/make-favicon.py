from PIL import Image
import base64
import io
from pathlib import Path

SRC = Path(
    r"C:\Users\Benjamin\.cursor\projects\c-Users-Benjamin-Projects-Strewn-release\assets"
    r"\c__Users_Benjamin_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images"
    r"_348906517_589248356673731_2200711262366015141_n-dbebc087-849e-4ff6-a834-d0f8e97f19f3.png"
)
OUT = Path(r"C:\Users\Benjamin\Projects\Strewn\release\benny-black\assets\favicon.svg")

img = Image.open(SRC).convert("RGB")
w, h = img.size
s = min(w, h)
img = img.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
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

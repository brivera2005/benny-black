import re
import urllib.request

ALBUMS = ["B0CC7DGMY1", "B0FMZT8DHM"]

for asin in ALBUMS:
    url = f"https://music.amazon.com/albums/{asin}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")
    artists = re.findall(r"https://music\.amazon\.com/artists/[A-Z0-9]+/[^\"'\s<>]+", html)
    artists += re.findall(r"/artists/(B[A-Z0-9]+)/benny-black", html, re.I)
    print(asin, "->", sorted(set(artists))[:5] or "no artist url in html")

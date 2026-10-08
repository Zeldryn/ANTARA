#!/usr/bin/env python3
"""Cache the official NASA/JPL PIA00481 Alpha Regio JPEG for ANTARA.

The project itself uses a local schematic fallback so it never hotlinks a broken
remote image. Run this helper on a machine with internet access to replace the
fallback with the official NASA/JPL Photojournal asset if desired.
"""
from pathlib import Path
from urllib.request import Request, urlopen

URL = "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia00/pia00481/PIA00481.jpg"
OUT = Path(__file__).resolve().parents[1] / "assets" / "venus-alpha-regio-pia00481.jpg"
req = Request(URL, headers={"User-Agent": "ANTARA educational asset cache/1.0"})
with urlopen(req, timeout=60) as response:
    data = response.read()
if len(data) < 100_000:
    raise SystemExit("Downloaded file is unexpectedly small; refusing to replace asset.")
OUT.write_bytes(data)
print(f"Saved {len(data):,} bytes to {OUT}")

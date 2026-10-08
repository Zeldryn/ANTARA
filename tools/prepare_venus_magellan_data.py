#!/usr/bin/env python3
"""Prepare local Magellan terrain assets for ANTARA Venus Full Exploration.

Primary macro elevation source:
USGS Venus Magellan Global Topography 4641m v02 GeoTIFF.

A coarse NASA PDS 1-degree byte grid is also downloaded as a scientific fallback.
Magellan SAR is downloaded separately and is never converted into height.
"""
from __future__ import annotations

import argparse
import hashlib
import math
from pathlib import Path
import tempfile
import urllib.parse
import urllib.request

VENUS_RADIUS_KM = 6051.8
KM_PER_DEG_LAT = 2 * math.pi * VENUS_RADIUS_KM / 360.0
TOPO_TIFF_URL = "https://planetarymaps.usgs.gov/mosaic/Venus_Magellan_Topography_Global_4641m_v02.tif"
COARSE_TOPO_URL = "https://pds-geosciences.wustl.edu/mgn/mgn-v-rss-5-gravity-l2-v1/mg_5201/images/topogrd.img"
WMS_URL = "https://planetarymaps.usgs.gov/cgi-bin/mapserv"
WMS_MAP = "/maps/venus/venus_simp_cyl.map"
REGIONS = {
    "maat": (0.9, 194.5),
    "maxwell": (65.0, 6.0),
    "aphrodite": (-1.0, 81.0),
    "ishtar": (65.0, 0.0),
    "alpha": (-25.0, 4.0),
}
USER_AGENT = "ANTARA-Education/1.0 scientific-asset-preparer"
REGIONAL_SIZE = 257
REGIONAL_HALF_EXTENT_KM = 330.0


def get_bytes(url: str, timeout: int = 120) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def download_to_file(url: str, path: Path, timeout: int = 300) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response, path.open("wb") as target:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            target.write(chunk)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_if_valid(path: Path, data: bytes, *, expected_size: int | None = None, png: bool = False) -> None:
    if expected_size is not None and len(data) != expected_size:
        raise RuntimeError(f"{path.name}: expected {expected_size} bytes, received {len(data)}")
    if png and not data.startswith(b"\x89PNG\r\n\x1a\n"):
        prefix = data[:120].decode("utf-8", "replace")
        raise RuntimeError(f"{path.name}: USGS response is not PNG: {prefix!r}")
    path.write_bytes(data)
    print(f"saved {path}  bytes={len(data)}  sha256={sha256(data)}")


def longitude_delta(lon: float, center: float) -> float:
    return (lon - center + 180.0) % 360.0 - 180.0


def build_regional_float_grids(global_tiff: Path, output: Path) -> None:
    try:
        import numpy as np
        import rasterio
        from rasterio.fill import fillnodata
    except Exception as exc:
        raise RuntimeError("Regional GTDR preparation requires numpy and rasterio.") from exc

    with rasterio.open(global_tiff) as src:
        band = src.read(1).astype("float32")
        if band.shape != (4096, 8192):
            raise RuntimeError(f"Unexpected GTDR shape {band.shape}; expected (4096, 8192).")
        nodata = src.nodata
        if nodata is not None:
            band[band == nodata] = np.nan
        band[band <= -32000] = np.nan

        height, width = band.shape
        axis = np.linspace(-REGIONAL_HALF_EXTENT_KM, REGIONAL_HALF_EXTENT_KM, REGIONAL_SIZE, dtype=np.float64)
        x_grid, z_grid = np.meshgrid(axis, axis)

        for region, (center_lat, center_lon_east) in REGIONS.items():
            cos_lat = max(0.18, math.cos(math.radians(center_lat)))
            lat = center_lat - z_grid / KM_PER_DEG_LAT
            lon = center_lon_east + x_grid / (KM_PER_DEG_LAT * cos_lat)
            lon = ((lon + 180.0) % 360.0) - 180.0

            # GTDR v02 is a global Simple Cylindrical raster, -180..180 and -90..90.
            # The half-pixel correction samples pixel centers instead of raster edges.
            fx = (lon + 180.0) / 360.0 * width - 0.5
            fy = (90.0 - lat) / 180.0 * height - 0.5
            x0 = np.floor(fx).astype(np.int64)
            y0 = np.floor(fy).astype(np.int64)
            tx = fx - x0
            ty = fy - y0
            x0 %= width
            x1 = (x0 + 1) % width
            y0 = np.clip(y0, 0, height - 1)
            y1 = np.clip(y0 + 1, 0, height - 1)

            a = band[y0, x0]
            b = band[y0, x1]
            c = band[y1, x0]
            d = band[y1, x1]
            values = (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
            finite = np.isfinite(values)
            if not finite.all():
                if not finite.any():
                    raise RuntimeError(f"{region}: GTDR crop contains no finite elevation samples")
                values = fillnodata(
                    np.where(finite, values, 0.0).astype("float32"),
                    mask=finite.astype("uint8"),
                    max_search_distance=48,
                )
                if not np.isfinite(values).all():
                    raise RuntimeError(f"{region}: GTDR crop still contains missing values after scientific gap fill")

            # USGS GeoTIFF stores elevation in meters above the 6051 km datum.
            values = (values / 1000.0).astype("<f4")
            target = output / f"topography-{region}.f32"
            target.write_bytes(values.tobytes(order="C"))
            print(
                f"saved {target}  samples={REGIONAL_SIZE}x{REGIONAL_SIZE}  "
                f"finite={int(np.isfinite(values).sum())}/{values.size}  sha256={sha256(target.read_bytes())}"
            )


def radar_url(lat: float, lon_east: float, extent_km: float, size: int) -> str:
    lat_radius = extent_km / KM_PER_DEG_LAT
    lon_scale = max(0.18, math.cos(math.radians(lat)))
    lon_radius = extent_km / (KM_PER_DEG_LAT * lon_scale)
    center_lon = lon_east + 360.0 if lon_east < 3.0 else lon_east
    min_lon = center_lon - lon_radius
    max_lon = center_lon + lon_radius
    min_lat = max(-89.5, lat - lat_radius)
    max_lat = min(89.5, lat + lat_radius)
    params = {
        "map": WMS_MAP,
        "SERVICE": "WMS",
        "VERSION": "1.1.1",
        "REQUEST": "GetMap",
        "LAYERS": "MAGELLAN",
        "STYLES": "",
        "SRS": "EPSG:4326",
        "BBOX": f"{min_lon},{min_lat},{max_lon},{max_lat}",
        "WIDTH": str(size),
        "HEIGHT": str(size),
        "FORMAT": "image/png",
        "TRANSPARENT": "FALSE",
    }
    return WMS_URL + "?" + urllib.parse.urlencode(params)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="assets/venus-data", help="output directory relative to current working directory")
    parser.add_argument("--skip-radar", action="store_true", help="prepare topography only")
    parser.add_argument("--skip-highres", action="store_true", help="download only the coarse PDS fallback plus optional radar")
    parser.add_argument("--global-topography", help="use an already-downloaded USGS GTDR GeoTIFF instead of downloading it")
    parser.add_argument("--keep-global", action="store_true", help="keep the downloaded 65 MB global GeoTIFF in the output folder")
    parser.add_argument("--radar-size", type=int, default=1536, help="square USGS SAR crop resolution")
    parser.add_argument("--extent-km", type=float, default=310.0, help="SAR half-width around each region")
    args = parser.parse_args()

    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    print("Downloading NASA PDS 1-degree Magellan topography fallback...")
    coarse = get_bytes(COARSE_TOPO_URL)
    write_if_valid(output / "topogrd.img", coarse, expected_size=360 * 180)

    if not args.skip_highres:
        if args.global_topography:
            global_tiff = Path(args.global_topography)
            if not global_tiff.exists():
                raise RuntimeError(f"GeoTIFF not found: {global_tiff}")
            build_regional_float_grids(global_tiff, output)
        elif args.keep_global:
            global_tiff = output / "Venus_Magellan_Topography_Global_4641m_v02.tif"
            if not global_tiff.exists():
                print("Downloading USGS Magellan GTDR 4641m global GeoTIFF...")
                download_to_file(TOPO_TIFF_URL, global_tiff)
            build_regional_float_grids(global_tiff, output)
        else:
            with tempfile.TemporaryDirectory(prefix="antara-venus-") as temp:
                global_tiff = Path(temp) / "Venus_Magellan_Topography_Global_4641m_v02.tif"
                print("Downloading USGS Magellan GTDR 4641m global GeoTIFF...")
                download_to_file(TOPO_TIFF_URL, global_tiff)
                build_regional_float_grids(global_tiff, output)

    if args.skip_radar:
        return 0

    print("Downloading USGS Magellan SAR region crops...")
    for region, (lat, lon) in REGIONS.items():
        data = get_bytes(radar_url(lat, lon, args.extent_km, args.radar_size))
        write_if_valid(output / f"radar-{region}.png", data, png=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

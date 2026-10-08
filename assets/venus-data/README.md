# ANTARA Venus scientific terrain assets

Venus Full Exploration no longer uses procedural generation for large-scale terrain shape. The renderer has two scientific elevation tiers and an independent radar-material tier.

## Primary macro elevation: USGS Magellan GTDR 4641m

Preferred runtime files:

- `topography-maat.f32`
- `topography-maxwell.f32`
- `topography-aphrodite.f32`
- `topography-ishtar.f32`
- `topography-alpha.f32`

Each file is a 257 x 257 little-endian Float32 grid in kilometers above the Venus datum. Each crop spans 330 km from the destination center in every horizontal direction. They are generated from:

`https://planetarymaps.usgs.gov/mosaic/Venus_Magellan_Topography_Global_4641m_v02.tif`

The USGS source is Magellan GTDR v02, 8192 x 4096, 16-bit elevation, about 4,641 meters per pixel. ANTARA preprocesses only the five required regional windows so the browser does not depend on a 65 MB planetary GeoTIFF.

## Scientific fallback: PDS 1-degree topography

`topogrd.img` is a 360 x 180 unsigned-byte map from the NASA PDS Magellan topography archive. Exact size: 64,800 bytes.

Source:

`https://pds-geosciences.wustl.edu/mgn/mgn-v-rss-5-gravity-l2-v1/mg_5201/images/topogrd.img`

Archived PDS decoding:

`elevation_km = DN * 0.0478 - 2.492`

This fallback is scientifically real but much coarser than the preferred USGS 4.641 km/pixel regional crops. The HUD labels it as a 1-degree fallback when it is active.

## Magellan SAR surface context

Optional local files:

- `radar-maat.png`
- `radar-maxwell.png`
- `radar-aphrodite.png`
- `radar-ishtar.png`
- `radar-alpha.png`

They are requested from the USGS planetary WMS `MAGELLAN` layer. The renderer uses SAR only for surface/material context. Radar brightness is never interpreted as elevation.

## Prepare everything

From the project root, on a machine with internet access:

```bash
python tools/prepare_venus_magellan_data.py
```

The preparation script downloads the global USGS GTDR GeoTIFF temporarily, writes only the five compact Float32 crops, downloads the 64.8 KB PDS fallback, and requests local SAR crops. It requires `numpy` and `rasterio` for the high-resolution crop stage.

Useful alternatives:

```bash
python tools/prepare_venus_magellan_data.py --skip-radar
python tools/prepare_venus_magellan_data.py --global-topography /path/to/Venus_Magellan_Topography_Global_4641m_v02.tif
```

For a competition deployment, generate these local assets before uploading the site. The runtime can attempt remote fallbacks, but local assets avoid CORS and network reliability problems.

## Runtime resilience added in hotfix

If the regional Float32 crops are not present, ANTARA now tries the local PDS byte grid, a same-origin PHP cache endpoint (`venus-data-proxy.php?asset=topogrd`), the direct NASA PDS byte grid, and the ASCII PDS grid. On PHP/XAMPP hosting, the proxy can cache the official 64,800-byte NASA PDS `TOPOGRD.IMG` locally so browser CORS does not block the fallback.

If every scientific path fails, Full Exploration no longer hard-stops. It enters a clearly labelled `OFFLINE PREVIEW · NON-SCIENTIFIC TOPOGRAPHY` emergency mode. That generated relief is never labelled Magellan/GTDR data and exists only so the experience remains usable until scientific assets can be installed.

# Venus Full Exploration Science Audit

## Data actually used by the runtime

### Preferred elevation

`assets/venus-data/topography-{region}.f32`

These compact files are generated from USGS **Venus Magellan Global Topography 4641m v02**, a global Magellan GTDR elevation product with 8192 x 4096 samples and approximately 4,641 m/pixel resolution. The preprocessing tool writes five 257 x 257 Float32 regional crops in kilometers.

The ZIP does not claim those regional files exist unless they are physically present. If they have not been generated, the runtime proceeds to the next legitimate source.

### Coarse elevation fallback

NASA PDS `topogrd.img`, 360 x 180 unsigned bytes, one-degree sampling. The runtime decodes the archived scale as:

`elevation_km = DN * 0.0478 - 2.492`

This grid is real scientific topography, but its resolution is much coarser than the preferred 4.641 km/pixel product. The HUD explicitly identifies the one-degree fallback when active.

### Radar surface context

Magellan SAR is loaded independently through local `radar-{region}.png` crops or the USGS planetary WMS `MAGELLAN` layer. SAR brightness is not interpreted as elevation.

## Procedural content

Procedural generation is restricted to sub-resolution surface enrichment. The amplitudes are kept small relative to the scientific macro relief. Region-specific rules can emphasize volcanic flow texture, mountain-belt ridges, tectonic fabrics or tessera structure, but they do not replace GTDR as the large-scale elevation source.

## Destination identity

The same data pipeline is used for Maat Mons, Maxwell Montes, Aphrodite Terra, Ishtar Terra and Alpha Regio. Their differences come from their actual geographic topography, different scientific centers, regional material palettes and controlled small-scale geology.

## No false precision

The renderer does not convert Magellan SAR brightness directly into mountains. It also does not reconstruct numerical elevation from a colorized topography image. If neither preferred nor fallback scientific elevation can be loaded, the exploration reports an error.

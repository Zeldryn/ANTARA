# Venus data-loading hotfix

The previous rebuild could show **Eksplorasi Belum Tersedia** when the regional `topography-{region}.f32` files were absent and the NASA PDS HTTP fallback was blocked by browser CORS.

This hotfix changes runtime behavior:

1. Prefer regional local GTDR crops as before.
2. Try a local `assets/venus-data/topogrd.img` file.
3. Try `venus-data-proxy.php?asset=topogrd`, which fetches and caches the fixed NASA PDS `TOPOGRD.IMG` from the server side and serves it from ANTARA's own origin.
4. Try direct PDS binary and ASCII products.
5. If all scientific paths are unavailable, keep Full Exploration functional with a visibly labelled non-scientific offline preview rather than blocking the user.

The emergency preview is intentionally not described as scientific data.

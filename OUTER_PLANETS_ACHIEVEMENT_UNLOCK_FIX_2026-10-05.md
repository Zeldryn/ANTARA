# Outer Planets Achievement Unlock Fix · 2026-10-05

## Root cause
Jupiter, Saturnus, Uranus, and Neptunus Full Exploration were sending progress keys in the form `region:observation`. The server progress catalog only accepts one Full Exploration milestone per region. Those requests were rejected with HTTP 422, so local observation UI could show completion while server achievements remained locked.

A second mismatch existed because the backend progress catalog still contained destination IDs from the older outer-planet builds.

## Fix
- Full Exploration now records one server milestone per region after the first successful observation in that region.
- Backend outer-planet catalog now matches the current 5 region IDs for each planet.
- Backend normalizes stale `region:observation` keys to their region so cached older clients cannot inflate milestone counts.
- Achievement counting now deduplicates normalized region keys rather than raw database rows.
- Local discovery recovery scans existing localStorage observation data when the user opens Full Exploration, allowing previously observed regions to sync without replaying every map.
- Safe rename aliases are supported for equivalent legacy region IDs.

## Expected unlock rule
`Ahli Jupiter`, `Ahli Saturnus`, `Ahli Uranus`, and `Ahli Neptunus` unlock at 5 / 5 unique Full Exploration regions recorded on the server.

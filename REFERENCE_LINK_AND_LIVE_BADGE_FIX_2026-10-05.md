# ANTARA Reference Link + Live Achievement Audit — 2026-10-05

## Scope
Audit clickable exploration / Info Lokasi references from Matahari through Neptunus, plus contextual live achievement placement/visibility.

## Reference strategy
Brittle legacy Photojournal/Resource/JPL-news click-through pages were normalized to stable official object/facts/mission pages. Existing NASA image assets remain unchanged.

Canonical targets:
- Sun: https://science.nasa.gov/sun/facts/
- Mercury: https://science.nasa.gov/mercury/facts/
- Venus: https://science.nasa.gov/venus/venus-facts/
- Earth: https://science.nasa.gov/earth/facts/
- Mars: https://science.nasa.gov/mars/facts/
- Asteroid Belt: https://science.nasa.gov/solar-system/asteroids/facts/
- Jupiter: https://science.nasa.gov/jupiter/jupiter-facts/
- Saturn: https://science.nasa.gov/saturn/facts/
- Titan: https://science.nasa.gov/saturn/moons/titan/facts/
- Enceladus: https://science.nasa.gov/saturn/moons/enceladus/
- Saturn Moons: https://science.nasa.gov/saturn/moons/
- Cassini: https://science.nasa.gov/mission/cassini/about-the-mission/
- Uranus: https://science.nasa.gov/uranus/facts/
- Miranda: https://science.nasa.gov/uranus/moons/miranda/
- Voyager 2: https://science.nasa.gov/mission/voyager/voyager-2/
- Neptune: https://science.nasa.gov/neptune/neptune-facts/
- Triton: https://science.nasa.gov/neptune/moons/triton/
- Voyager Fact Sheet: https://science.nasa.gov/mission/voyager/fact-sheet/

## Live achievement change
- Context badge shows when entering a relevant planet/game context.
- Context badge shows again when progress increases or an achievement unlock state changes.
- Context badge auto-dismisses after 7000 ms.
- Passive renders do not immediately reopen an auto-hidden badge.
- Mobile badge footprint is slightly reduced.

## Verification
- Reference/live badge verifier: PASS
- Context achievement verifier: 69/69 PASS
- Outer achievement unlock: 48/48 PASS
- Outer observe while reading: 20/20 PASS
- Outer Venus action parity: 93/93 PASS
- Outer Venus surface parity: 39/39 PASS
- Jupiter atmosphere verifier: PASS
- JS syntax checks: PASS
- CSS brace balance: 0
- Duplicate HTML IDs: 0

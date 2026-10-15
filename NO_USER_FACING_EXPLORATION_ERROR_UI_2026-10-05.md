# Full Exploration user-facing error UI removal · 2026-10-05

Removed the visible fallback/error cards from Earth, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, and Neptune Full Exploration.

Runtime failures are still logged to the developer console, but the visitor is returned directly to the relevant panorama instead of seeing an error/fallback panel.

The Solar System Observer follows the same rule: internal errors remain developer-visible while the visitor is restored to the source panorama.

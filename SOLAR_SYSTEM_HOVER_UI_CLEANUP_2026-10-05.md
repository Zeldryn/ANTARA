# Solar System Hover UI Cleanup · 2026-10-05

- Removed persistent per-planet label cards from the solar-system viewport.
- Planet information now appears only while hovering a real 3D body.
- Existing lower-left detail card updates from the hovered body.
- Added a compact cursor-following hover card with name, distance, and orbital period.
- Canvas interaction cursor states:
  - empty space: grab
  - camera drag: grabbing
  - hoverable planet: pointer
- Added invisible interaction proxy spheres around smaller planets to make hover/click forgiving without enlarging the rendered model.
- Direct click-to-panorama navigation remains intact.
- Mobile suppresses hover-only card and keeps tap-to-panorama behavior.

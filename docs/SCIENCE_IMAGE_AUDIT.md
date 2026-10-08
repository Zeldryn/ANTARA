# ANTARA Scientific Image Integrity Audit

## Policy
Observational imagery is used when a reputable mission/telescope image exists. Non-observable concepts remain diagrams and are explicitly surfaced in the UI as `DIAGRAM ILMIAH` or another inferred visual type. The shared media component now displays visual type, exact credit, source link, and locks thumbnails outside exploration mode.

## Object-by-object audit

- **Sun**: existing SDO observations retained for photosphere/sunspots/activity. Fusion, structure, solar wind and mission-system visuals remain diagrams.
- **Mercury**: existing NASA/MESSENGER and ESA/BepiColombo observations retained. Orbit, temperature, exosphere and mission timeline diagrams retained where concept-driven.
- **Venus**: existing NASA/JPL mission imagery and scientific data products retained. Diagrammatic/data visuals remain classified by the shared visual-type layer.
- **Earth**: unverified local landmark previews removed. Known Wikimedia documentary photographs retained.
- **Mars**: unverified local preview copies removed. NASA mission/orbital imagery retained for Olympus Mons, Valles Marineris, Jezero, polar cap, atmosphere and dust-storm topics.
- **Asteroid Belt**: overview/location/formation/composition/history/missions remain diagrams. Ceres and Vesta slide now uses authentic Dawn imagery (PIA21906 and PIA15678).
- **Jupiter**: identity/atmosphere/Great Red Spot use Hubble observations; Galilean-system montage uses Voyager; ring slide uses New Horizons imagery. Rotation, magnetosphere and mission timeline remain diagrams.
- **Saturn**: identity, rings, atmosphere and north-polar hexagon use Cassini imagery. Titan uses Huygens surface imagery; Enceladus uses Cassini plume imagery. Moon-system overview now uses Cassini PIA06475; mission-history overview remains a diagram.
- **Uranus**: global view, rings, Miranda, Titania and Oberon use Voyager 2 imagery. Tilt, seasons, methane explanation, interior, magnetosphere, Voyager trajectory and future exploration remain diagrams.
- **Neptune**: global view, Great Dark Spot, bright clouds, rings and Triton use Voyager 2 imagery. Interior, methane, wind-flow explanation, magnetosphere, Voyager trajectory and trans-Neptunian context remain diagrams.

## Interaction and layout consistency

- Supporting-media buttons are disabled, removed from tab order, and have no hover/click affordance outside `.is-exploring`.
- Entering exploration mode re-enables the existing modal/enlarge interaction without creating a second modal system.
- Feature-based topics are tagged by the shared renderer and pull their media inward on desktop for a more Mars-like connected composition; non-localized concepts retain detached side placement.
- Primary `JELAJAHI` CTAs now use restrained object-specific accents across Sun, Mercury, Venus, Earth, Mars, Asteroid Belt, Jupiter, Saturn, Uranus and Neptune.

## Primary external image credits used in replacements

- NASA/JPL-Caltech/UCLA/MPS/DLR/IDA: Dawn Ceres and Vesta.
- NASA, ESA, A. Simon (GSFC), M.H. Wong (UC Berkeley): Hubble Jupiter.
- NASA/JPL and NASA/Johns Hopkins University APL/Southwest Research Institute: Voyager/New Horizons Jupiter system and rings.
- NASA/JPL/Space Science Institute and NASA/JPL-Caltech/Space Science Institute: Cassini Saturn, rings, atmosphere, hexagon and Enceladus.
- ESA/NASA/JPL/University of Arizona: Huygens Titan surface.
- NASA/JPL: Voyager 2 Uranus, Uranian moons, Neptune, storms, clouds, rings and Triton.

## Venus 2026-09 expansion audit

- Venus information now contains 14 topics. Global atmosphere/greenhouse/pressure/rotation/radar/missions concepts use labelled diagrams or mission imagery instead of fake surface markers.
- Global cloud imagery is identified as visible/UV cloud observation where applicable.
- Surface products from Magellan are explicitly described as radar-derived or simulated-color visualizations, not ordinary visible-light photographs.
- Maat Mons, Maxwell Montes, Alpha Regio, and Mead use mission/scientific imagery with supporting source links.
- Full Exploration uses real IAU/USGS POI coordinates and a measured-data-first height pipeline. Preferred macro elevation comes from regional crops of USGS Venus Magellan Global Topography 4641m v02. NASA PDS one-degree Magellan topography is the coarse scientific fallback.

## Venus Full Exploration source labeling update (2026-09-29)

Venus Full Exploration keeps three source categories separate:

- **Topography**: USGS Magellan GTDR 4.641 km/pixel regional crops when generated locally, otherwise the real PDS one-degree topography fallback.
- **Radar context**: Magellan SAR imagery used only for material/surface context, never as elevation.
- **Renderer detail**: procedural micro and meso enrichment below the DEM resolution. It remains subordinate to measured macro elevation.

The HUD and location card report the active topography source. If no legitimate elevation source is available, Full Exploration reports an error instead of presenting procedural terrain as scientific data.

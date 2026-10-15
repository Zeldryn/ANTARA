# Outer Planets Observe-While-Reading Fix · 2026-10-05

## Bug
On Jupiter, Saturn, Uranus, and Neptune, opening **Info Lokasi** or **Tujuan** could make the nearby **AMATI** interaction disappear and also block keyboard `E` from opening the observation card.

## Root cause
The outer-planet controllers tied observation eligibility to `observationPrompt.hidden`. The prompt was intentionally hidden while reading panels were open to prevent overlap, so the keyboard action was accidentally disabled too.

## Fix
- Keyboard `E` now observes a nearby target based on `nearbyObservation`, not visual prompt visibility.
- Nearby observation prompt is allowed while Info Lokasi or Tujuan is open.
- On mobile, the prompt collapses into a compact floating **AMATI** action so it remains touch-accessible without covering the reading sheet.
- The actions MENU still takes priority and temporarily suppresses AMATI.
- Opening the observation card still hides the reading sheet temporarily; closing the observation returns to the previous Info/Tujuan state.

## Planets patched
- Jupiter
- Saturnus
- Uranus
- Neptunus

## Validation
- Dedicated observe-while-reading verifier: 20/20 PASS
- Outer Venus action parity verifier: 93/93 PASS
- Jupiter atmosphere verifier: PASS
- JS syntax: PASS for all four full-exploration controllers
- Duplicate HTML IDs: 0
- Shared CSS brace balance: 0

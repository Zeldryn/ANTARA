# ANTARA Home Profile HUD Rework V2

## Scope

This pass only refines the existing top login / explorer identity area on the ANTARA homepage. The hero title, subtitle, START button, Nara, Sora, dialogue bubble, cockpit background, lower dashboard, launch flow, planet scenes, and Venus exploration systems are intentionally left structurally unchanged.

## What changed

The previous identity HUD was visually strong but behaved like a compact centered module. The new requirement calls for the profile frame to begin at the left side of the existing long upper rail and for the login copy to feel mechanically connected to it.

The identity system is now composed as one continuous rail:

1. left explorer identity socket
2. short segmented mechanical connector
3. angular `IDENTITAS PENJELAJAH / MASUK KE ANTARA` frame
4. continuation line that merges into the existing top cockpit strip

The result avoids the appearance of a floating profile card or a badge pasted over the cockpit.

## Visual language

The frame keeps ANTARA's established palette and material language:

- deep navy / near-black cockpit body
- warm champagne-gold primary lines
- restrained cyan secondary accents
- interrupted technical strokes
- beveled / angular corner cuts
- small status nodes
- sparse metallic detail with preserved negative space

No RGB neon, purple/green/red gaming accents, oversized glow rings, or dense decorative hexagon fields were introduced.

## Profile socket

The existing login / avatar location is reused. The circular avatar core now sits inside a more angular mechanical cradle so it reads as an explorer identity socket rather than a standalone circle.

The system still supports:

- logged-out login glyph
- real avatar image when supplied
- initials fallback
- logged-in status treatment

No duplicate login control was created.

## Login frame

`IDENTITAS PENJELAJAH` remains the small technical label and `MASUK KE ANTARA` remains the primary action.

The copy now lives inside its own clipped angular frame with:

- thin gold top edge
- subtle cyan lower edge
- dark translucent interior
- small top / bottom bracket strokes
- restrained status marker geometry
- an interaction arrow separated by a fine divider

The frame is physically bridged to the profile socket by a short segmented connector.

## Motion and interaction

Motion remains cheap and restrained:

- short deployment / line-reveal sequence
- one scan pass during initialization
- slow small-angle avatar technical ring movement
- very slow status-node pulses
- hover brightens the login frame slightly and advances the arrow
- click briefly activates the connector and frame before the existing auth/profile flow continues

Continuous large blur or animated box-shadow effects were not added.

`prefers-reduced-motion` still disables the non-essential animation layer.

## Authentication behavior

The project still does not fabricate authentication data.

The HUD continues to support:

- `window.ANTARAAuth` / `window.AntaraAuth`
- `getCurrentUser()`
- `openLogin()`
- `openProfile()`
- `window.ANTARA_USER`
- `antara:auth-change`
- `antara:login-request`
- `antara:profile-request`
- `window.ANTARAProfileHUD`

A 120 ms visual activation cue is applied before the existing login/profile action is dispatched.

## Responsive behavior

The desktop and laptop layouts stay left-anchored inside the current top rail while shortening connector and ornament lengths as space decreases.

At mobile width the composition becomes a compact equivalent:

`[ PROFILE SOCKET ] [ CONNECTOR ] [ MASUK KE ANTARA ]`

It does not shrink the full desktop rail into an unreadable miniature. Secondary status copy and nonessential ornaments are removed first.

## Verification

- JavaScript syntax check passed.
- `tools/verify_home_profile_hud.mjs`: 20/20 checks passed.
- The profile root and trigger remain unique.
- Existing real-auth discovery hooks remain present.
- No fake auth persistence was introduced.
- Mobile and short-height responsive rules are present.

The repository's full Chromium browser harness could not complete inside the current container because Chromium denied localStorage access in that harness environment. This is an environment limitation rather than a claimed visual pass, so no full browser-harness success is reported here.

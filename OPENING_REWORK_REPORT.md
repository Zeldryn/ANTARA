# ANTARA Intro Cockpit Rework

## Scope

This update is limited to the opening cockpit experience, its companion character system, and the supporting intro UI. Earth, Venus, Mars, Seven Wonders, exploration media, and planet rendering files were not modified.

## Intro composition

- The opening remains a real layered HTML/CSS/JavaScript interface.
- The cockpit is visible from the first frame.
- The normal top website navigation shown in the visual reference was not added.
- On home and launch states, the existing masthead is hidden so there is no Beranda, Program, Jelajah Antariksa, Sumber Belajar, Komunitas, Masuk, search, or globe toolbar.
- ANTARA branding is centered inside the forward window.
- The START button remains centered above the lower dashboard and is still the existing functional launch control.

## Cockpit depth

The cockpit received additional structural layers for:

- top and bottom window depth rails
- left and right window depth frames
- side cockpit modules
- thicker lower dashboard framing
- larger left, center, and right display banks
- stronger shadows and layered foreground depth
- restrained navy, gold, and blue instrument lighting

The cockpit is still composed from DOM/CSS elements. No full-screen generated image is used as the website UI.

## Character sprite system

The old inline SVG character rigs were removed from `index.html`.

Character assets are organized under:

- `assets/characters/nara/`
- `assets/characters/sora/`

Both character folders contain eight WebP state files. The renderer now selects sprite files from structured character state maps instead of changing primitive SVG facial parts.

### Nara states

- idle
- happy
- talking
- excited
- thinking
- surprised
- confident
- supportive

### Sora states

- idle
- smile
- talking
- curious
- supportive
- thinking
- surprised
- confident

## Dialogue driven state selection

Every launch dialogue cue now carries an explicit emotion and sprite state. Character changes are deterministic, not randomized. Dialogue meaning controls the selected state, for example greeting uses happy, explanation uses talking, discovery uses excited, and reaction uses surprised.

Sprite swaps use a short fade and translate transition. Small breathing/talking motion remains secondary to the actual image changes.

## Validation

Static validation completed:

- JavaScript syntax passes `node --check`.
- no duplicate HTML IDs
- all `getElementById()` targets exist
- all HTML local asset references exist
- all 16 character WebP files decode successfully
- one launch button click handler is present
- old `character-rig` SVG markup is absent from the intro
- requested top-navigation labels are absent from the page source
- CSS opening and closing brace counts match

Unrelated scene implementation hashes were checked and remain unchanged for Earth, Venus, Mars, and exploration media files.

A Chromium screenshot run was attempted in the container, but the installed Chromium process does not terminate correctly in this environment because of its headless/DBus runtime. Runtime visual acceptance should therefore still be checked locally in the target browser at 1920x1080, 1600x900, 1440x900, and 1366x768.

## Strict crop / side-structure correction
- Character PNG/WebP canvases were trimmed to their real visible alpha bounds so transparent top padding no longer pushes the visible artwork downward.
- Detached Nara residue was removed without changing Nara's artwork.
- Sora's contaminated alpha was rebuilt against the same Sora artwork so cockpit/window fragments are no longer part of the sprite; missing top hair/hat pixels from the old crop were restored from the matching character source while keeping the existing character identity.
- Character containers now use intrinsic image height instead of forcing every sprite into a tall fixed box.
- Dashboard occlusion was reduced to the lower-body zone only.
- Side cockpit pieces were reshaped into angled structural supports behind the characters; central branding/button/planet systems were not redesigned.

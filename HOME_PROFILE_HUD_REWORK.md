# ANTARA Home Profile HUD Rework

## Scope

This pass only adds the explorer identity / login HUD to the existing homepage cockpit. The title, START button, Nara, Sora, cockpit frame, launch timeline, planet scenes, Venus systems, and mission flow are not redesigned.

## Existing authentication audit

The current project does not contain an authentication, login, account, avatar, or profile backend. Because of that, the homepage defaults to a logged-out `MASUK KE ANTARA` state and does not fabricate an account.

The HUD is ready to connect to a real account system later through either:

- `window.ANTARAAuth` / `window.AntaraAuth` with `getCurrentUser()`, `openLogin()`, and/or `openProfile()` methods.
- `window.ANTARA_USER` for an already-resolved user object.
- `antara:auth-change` events with `{ user }` in `event.detail`.
- `window.ANTARAProfileHUD.setUser(user)` and `clearUser()`.
- `antara:login-request` and `antara:profile-request` events when no concrete auth UI is connected yet.

No fake user data and no fake authentication persistence were added.

## Cockpit integration

The new module is positioned in the existing upper-center window housing. It uses the same dark navy / blue-black structure already present in the cockpit with restrained cyan illumination and ANTARA gold accents.

The avatar area is intentionally more engineered than a simple circle. It contains layered rings, segmented arcs, angular cardinal extensions, crossing orbital lines, a local status light, and a nested portrait viewport. The supplied profile-frame reference guided this geometry, while the color system was adapted to ANTARA.

## States

### Logged out

- IDENTITAS PENJELAJAH
- MASUK KE ANTARA
- CREW ACCESS · STANDBY
- technical user symbol inside the framed portrait position

### Logged in

When real user data is supplied:

- actual display name is shown
- actual avatar URL is used when supplied
- initials are used when no avatar exists
- role / rank / subtitle is used when supplied
- otherwise the neutral UI label `PENJELAJAH ANTARA` is used

## Motion

Initial load uses a short cockpit initialization sequence:

1. housing deploys
2. frame appears
3. one scan line crosses the module
4. avatar frame resolves
5. identity text reveals

After boot the HUD stays quiet. Continuous motion is restricted to a slow technical ring and tiny status pulses. Hover only adds a small frame lift, arrow movement, and one short scan pass.

`prefers-reduced-motion` disables the boot / idle animation layer.

## Responsive behavior

The component does not use `transform: scale()` as its responsive strategy.

- large desktop: complete identity HUD, secondary status and technical marks
- laptop: reduced width, slightly tighter spacing
- tablet: secondary status is removed first
- mobile: compact framed icon + primary identity label + interaction arrow
- short browser windows: reduced height and ornament density

The main title and START control remain visually stronger than the profile HUD.

## Visual audit

A layout audit was run against representative viewport sizes including:

- 2560x1440
- 1920x1080
- 1600x900
- 1440x900
- 1366x768
- 1366x620
- 1024x768
- 768x1024
- 412x915
- 390x844
- 375x812
- 360x800

The profile HUD remained inside the viewport and did not collide with the main title in the audit harness.

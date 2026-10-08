# Venus Full Exploration Responsive UI + Mars Exit Rework

## Scope
This pass deliberately does not rebuild Venus terrain or morphology. It only refines Venus Full Exploration UI responsiveness and the surface-to-planet exit lifecycle.

## Responsive information hierarchy
- Default exploration now opens with the compact left HUD, collapsed objectives, hidden scientific info panel, top toolbar, and subtle desktop control hints.
- Scientific info and observation content become bounded scrollable panels rather than unconstrained sidebars.
- On phone and touch-tablet layouts, scientific info, objectives, and observation detail become bottom sheets. Persistent desktop sidebars are not used.
- Constrained layouts enforce large-panel exclusivity. Larger desktops may retain independent left/right contextual panels when space exists.
- Mobile persistent HUD is reduced to location plus altitude/distance. Keyboard guidance is removed in touch layouts.
- Touch controls and secondary buttons account for safe-area insets and practical touch target sizes.

## Breakpoint architecture
The Venus-specific responsive layer now uses a small hierarchy instead of per-device patches:
1. base / standard desktop
2. large desktop
3. compact desktop + height-constrained laptop
4. tablet / coarse-pointer touch composition
5. phone portrait
6. one short-height adjustment

Target audit matrix encoded by the verifier:
360x800, 375x812, 390x844, 393x873, 412x915, 768x1024, 1024x768, 1366x768, 1440x900, 1536x864, 1600x900, 1920x1080, 2560x1440.

## Z-index hierarchy
Venus now uses explicit conceptual tokens for world, HUD, panel, modal, and transition layers instead of relying on ever-growing arbitrary numbers.

## Mars-family exit
The Venus planet scene retains a dedicated `fullDiveBlend`, independent from normal `explorationBlend`, matching Mars responsibility.

The exit path now follows the working Mars sequence:
1. lock exploration input but keep the Full Exploration render loop alive;
2. fade/minimize exploration UI;
3. raise the live terrain camera to the same 52 km visual altitude target used by Mars over 1650 ms;
4. reverse the dedicated planetary full-dive over 3200 ms (260 ms for reduced motion);
5. surface opacity falls while Venus planet distance/orientation is continuously recomputed by `venus-scene.js`;
6. nonessential LOD/ambient decisions pause during exit to preserve frame budget, but camera, terrain render and planet render continue;
7. only after the handoff completes are Venus Full Exploration resources disposed and panorama interaction restored.

The core Mars/Venus full-dive distance formula, recentering behavior, pointer suppression and geographic quaternion interpolation remain structurally equivalent.

## Browser screenshot limitation
The implementation includes an explicit viewport verification matrix and source-level checks. The container Chromium runtime blocks both localhost and file navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so this environment cannot truthfully produce runtime browser screenshots of the local project. No visual-browser pass is claimed here.

# ANTARA · Contextual Achievement Badge Audit
Date: 2026-10-05

## Goal
Show one achievement badge that is relevant to the user's current context and expose its progress live instead of requiring the user to leave the experience and open Pencapaian.

## Planet mapping
Normal Jelajah uses the planet completion badge:
- Matahari -> Matahari Tuntas
- Merkurius -> Merkurius Tuntas
- Venus -> Venus Tuntas
- Bumi -> Bumi Tuntas
- Mars -> Mars Tuntas
- Sabuk Asteroid -> Sabuk Asteroid Tuntas
- Jupiter -> Jupiter Tuntas
- Saturnus -> Saturnus Tuntas
- Uranus -> Uranus Tuntas
- Neptunus -> Neptunus Tuntas

Full Exploration automatically changes target to:
- Ahli Merkurius
- Ahli Venus
- Ahli Bumi
- Ahli Mars
- Ahli Jupiter
- Ahli Saturnus
- Ahli Uranus
- Ahli Neptunus

Matahari and Sabuk Asteroid do not have Full Exploration master badges, so their normal completion badge remains the relevant achievement.

## Live behavior
- The panel reads authoritative achievement state from `api/achievements/get.php`.
- Planet milestone writes from `progress-tracker.js` immediately feed the contextual panel through `antara:progress-updated`.
- A successful increment animates the progress bar, badge, and a `+N` indicator.
- Reaching the goal before the achievement refresh displays `TARGET TERCAPAI · MENUNGGU VERIFIKASI` rather than falsely claiming the medal is already unlocked.
- Achievement notification payloads promote the contextual card to `TERBUKA` immediately after server unlock.
- The panel is re-parented into the active fullscreen element so it does not disappear in Fullscreen mode.

## Quiz mapping
Quiz uses one smart active target from:
- Kuis Pertama
- Orbit Streak x5
- Jawaban Kilat
- Lintasan Sempurna
- Komandan Kuis

`permainan.js` feeds verified answer response data into the contextual badge:
- score
- current/best streak
- correct answers <= 3 seconds
- first-try correct count for the current stack
- final run summary

The target can switch as the current run develops, prioritizing a locked achievement with meaningful live progress.

## UI behavior
Desktop:
- compact centered mission badge near the top
- does not replace the normal unlock toast

Mobile normal planet / Quiz:
- compact badge near the top safe-area

Mobile Full Exploration:
- badge moves above the D-pad / altitude control zone
- prevents the contextual badge from covering movement controls

Full Exploration entry / region selection / loading:
- badge is temporarily hidden until the 3D world is active

## Files changed
- achievement-client.js
- achievement-notify.css
- permainan.js
- index.html
- permainan.html
- tools/verify_context_achievement_badge.cjs

## Verification
- Contextual achievement verifier: 67/67 PASS
- Context icons present: 24/24
- Outer achievement verifier: 48/48 PASS
- Outer surface parity: 39/39 PASS
- Outer Venus action parity: 93/93 PASS
- Observe while reading: 20/20 PASS
- Inner mobile panels: PASS
- Quiz adaptive timing: 300/300 questions PASS
- JS syntax: PASS
- PHP syntax: PASS
- Duplicate HTML IDs: 0
- CSS brace balance: PASS

## Runtime note
Headless Chromium in the current execution environment hangs during screenshot rendering, so no claim is made for automated browser screenshot verification. The code, mappings, DOM, assets, syntax, and regression suites above were verified directly.

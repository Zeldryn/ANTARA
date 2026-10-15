# ANTARA Responsive + Kids UI Polish
Date: 2026-10-05

## Scope
- Opening hero title/subtitle overlap prevention across unusual viewport sizes.
- Leaderboard visual polish.
- Achievement gallery visual/interactivity polish.
- Quiz visual polish.
- Removal of technical user-facing language such as server/database verification jargon from these three surfaces.

## Opening responsive fix
The old title and subtitle used independent absolute `top:%` positions. This could overlap when the title wrapped differently on short, portrait, landscape, or unusual aspect ratios.

The new `.intro-title-stack` keeps the title and educational subtitle in one normal vertical flow. Additional safe zones cover:
- 320×568
- 360×640
- 390×844
- 430×932
- 568×320 landscape
- 667×375 landscape
- 844×390
- 768×1024
- 820×1180
- 1024×600
- 1180×720
- 1366×768
- 1600×600
- 1920×1080

On very short mobile landscape, the subtitle is hidden. If the MORE drawer is open on those tiny-height screens, the title stack is hidden so navigation and the start control never collide.

## Leaderboard
- Replaced technical server-verification copy with simple exploration language.
- Added a planet-orbit hero visual.
- Added three visual mission cards.
- Added planet artwork to tabs, podium cards, and ranking rows.
- Added hover/focus interaction for ranking cards.
- Simplified disconnected/error copy.

## Pencapaian
- Replaced server-oriented hero copy with exploration/collection language.
- Added a planet trail to the hero.
- Added larger visual icons to summary stats.
- Achievement cards are now keyboard/tap interactive and can enter a focused `is-peek` state.
- Added clear tap hints and stronger unlocked/locked visual feedback.
- Simplified error copy.

## Quiz
- Simplified intro copy for younger learners.
- Added a planet parade.
- Rebuilt level tiles with planet artwork and friendlier level labels.
- Added visual icons to the four quiz summary cards.
- Added active planet artwork inside the question header; it changes with the current question.
- Replaced technical result/server wording with mission-oriented copy.
- Simplified quiz error copy.

## Verification
- JavaScript syntax: PASS
- Duplicate IDs: 0
- CSS brace balance: 0
- Newly referenced local assets missing: 0
- Technical UI jargon scan: PASS
- Browser layout matrix for opening hero: PASS for 14 viewport sizes in closed and MORE-open states
- Leaderboard populated-layout horizontal overflow: PASS across 8 viewport sizes
- Achievement populated-layout horizontal overflow: PASS across 8 viewport sizes
- Quiz populated-layout horizontal overflow: PASS across 8 viewport sizes

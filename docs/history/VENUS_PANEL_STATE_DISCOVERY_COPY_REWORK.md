# Venus Full Exploration: Panel State + Discovery Copy Rework

This pass changes only secondary-panel behavior and discovery/observation writing.

## Panel behavior

- `TUJUAN` and `INFO LOKASI` now have independent logical state: `objectiveOpen` and `infoOpen`.
- Desktop/laptop can render both panels at the same time. Responsive CSS reduces their dimensions on constrained desktop widths and short heights rather than closing either one.
- Mobile keeps both logical states but presents only the most recently interacted bottom sheet. Closing that sheet restores the other one when it was previously open.
- ESC closes the most recently interacted secondary panel first. Only when no secondary panel remains open does ESC continue toward Full Exploration exit.
- Region switching still resets panel state when a different region is actually selected, because the content itself changes.

## Discovery writing

The 25 Venus observation cards now use a lighter educational voice. Card eyebrows use short prompts such as `TAHUKAH KAMU?`, `COBA PERHATIKAN!`, `LIHAT DEH!`, `TERNYATA...`, and `UNIKNYA...`.

Leads and short sections connect the explanation directly to what the player is looking at. Main interface terminology such as `KUALITAS GRAFIS`, `WILAYAH`, `KETINGGIAN`, and `KELUAR DARI EKSPLORASI` remains professional.

The optional deeper section and scientific sources are retained so the friendlier tone does not remove scientific context.

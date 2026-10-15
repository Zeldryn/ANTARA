# ANTARA account bio + Solar System speed + return typography

## Return route typography
- Replaced the old Georgia serif status with a cleaner cockpit-style system sans stack.
- Increased tracking and contrast while keeping the cinematic route overlay lightweight.
- Removed trailing ellipsis from `KEMBALI KE BUMI`.

## Editable profile bio
- Added an editable bio field with a 280 character limit.
- Bio appears in the profile summary card after it is saved.
- Clicking the Bio card opens Settings and focuses the Bio editor.
- Bio is returned through the authenticated user payload when the database column is available.
- Existing production databases are handled by a guarded schema check that attempts to add `users.bio` once when needed.
- `database/antara.sql` now includes the Bio column for fresh installations.
- `database/migrate_add_user_bio.sql` is included for manual migration if desired.

## Solar System speed control
- Added decrease, pause/resume, increase, and direct numeric speed controls.
- Accepted range: 0 to 365 simulated Earth days per real second.
- Default speed remains 12 days/second.
- Speed preference is persisted in localStorage.
- Orbit integration still uses elapsed time, so changing render FPS does not change orbital timing.

# ANTARA Achievement System

The achievement page is `pencapaian.html`. Achievement ownership is stored per `users.id` in `user_achievements`.

## Database upgrade
For an existing ANTARA database, import `database/achievement-migration.sql` once. The PHP API also has defensive `CREATE TABLE IF NOT EXISTS` logic.

## Unlock model
Most achievements are derived on the server from authoritative data:
- normal/full exploration milestones from `user_progress_events`
- planet completion from the progress catalog
- total solar-system completion from all 110 milestones
- leaderboard achievements from the secure leaderboard tables

Only `first-launch` is a browser activity event because launch occurs in the cockpit UI. Its API only accepts an allow-listed activity key, requires an authenticated session, applies same-origin checks and a session rate limit, and stores the event once per account.

Unlocked achievements remain stored even if a later leaderboard position changes.

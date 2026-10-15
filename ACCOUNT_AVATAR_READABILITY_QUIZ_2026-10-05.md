# ANTARA Account Readability + Custom Avatar + Quiz Label

Date: 2026-10-05

## Changes
- Increased cockpit account identity typography, including IDENTITAS label, display name, and @username.
- Restored @username visibility on mobile instead of hiding it.
- Increased username and identity typography inside account dropdown/profile panel.
- Enabled custom profile photo upload.
- Client crops the selected image to a centered 512x512 JPEG at quality 0.84 before upload.
- Server validates uploaded images, stores them under assets/uploads/avatars, and persists the relative path in users.avatar_url.
- Old custom avatar file is deleted after a successful replacement.
- Added profile photo removal action.
- Avatar refresh propagates through ANTARA auth-change so cockpit HUD, dropdown, and profile panel update together.
- Renamed visible navigation label Permainan to Quiz while preserving permainan.html and backend keys to avoid breaking routes.
- Replaced gamepad navigation icon with a quiz/document icon.

## Database
No SQL migration required. Existing users.avatar_url column is used.

## Validation
- account-home-v2.js syntax PASS
- script.js syntax PASS
- auth-client.js syntax PASS
- api/account/update.php PHP lint PASS
- api/_bootstrap.php PHP lint PASS
- upload wiring checks PASS
- duplicate index.html IDs: 0
- CSS brace balance: 0
- obsolete EARLY ACCESS avatar UI: 0
- visible navbar Permainan label: 0

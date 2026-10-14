# ANTARA Quiz MVP - Verification Report

Date: 2026-10-04

## Verified in this build
- Parsed bank: 300 / 300 questions.
- Every parsed question has 4 choices, an answer key, explanation, and ANTARA material reference.
- Run selection: 15 questions, exactly 3 from each difficulty level.
- Timers: 10s, 9s, 8s, 7s, 6s for levels 1-5.
- Server scoring helper: faster correct answers produce more points at the same level.
- 5,000-point achievement is reachable; simulated perfect run at ~2s/answer scored 7,947.
- PHP syntax check passed for quiz and achievement backend files.
- JavaScript syntax check passed for quiz and leaderboard clients.
- Mock browser flow passed: authenticated -> start -> answer -> feedback -> next -> final result.
- Responsive layout checked at 390x844, 1366x768, and 1920x1080 with no horizontal overflow in the tested quiz screen.
- ZIP integrity checked after packaging.

## Environment limitation
The build environment does not provide a running MySQL/MariaDB service, so actual MySQL transactions were not executed end-to-end here. The quiz schema is created automatically by the PHP endpoints and an explicit `database/quiz-game-migration.sql` is included for deployment/testing in XAMPP.

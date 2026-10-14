# ANTARA Quiz MVP - Verification Report

Date: 2026-10-04

## Verified in this build
- Parsed bank: 300 / 300 questions.
- Every parsed question has 4 choices, an answer key, explanation, and ANTARA material reference.
- Run selection: 15 questions, exactly 3 from each difficulty level.
- Adaptive timer verified against all 300 questions. The server calculates each question from prompt word count + option word count + level thinking allowance, then clamps it to a sensible range.
- Observed timer ranges in the current bank: Pemula 17-22s, Dasar 10-15s, Menengah 10-14s, Sulit 18-25s, Ahli 20-28s.
- Spot checks: Q130=10s, Q001=19s, Q192=25s, Q241=27s, Q269=28s, Q300=26s.
- The selected per-question timer is stored server-side in `quiz_run_questions.time_limit_ms`; the browser cannot choose its own limit.
- Server scoring helper: faster correct answers produce more points relative to the specific question's adaptive limit.
- 5,000-point achievement remains reachable; an average perfect run at ~2s/answer scores about 8,458 points with the adaptive timer model.
- PHP syntax check passed for quiz backend files.
- JavaScript syntax check passed for the quiz client.
- Adaptive timing verifier (`tools/verify_quiz_adaptive_timing.php`) passed all 300 questions.
- ZIP integrity checked after packaging.

## Environment limitation
The build environment does not provide a running MySQL/MariaDB service, so actual MySQL transactions were not executed end-to-end here. The quiz schema is created automatically by the PHP endpoints and an explicit `database/quiz-game-migration.sql` is included for deployment/testing in XAMPP.

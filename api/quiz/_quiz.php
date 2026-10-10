<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/leaderboard/_leaderboard.php';

const ANTARA_QUIZ_GAME_CODE = 'quiz15';
const ANTARA_QUIZ_STACK_SIZE = 15;
const ANTARA_QUIZ_LEVEL_COUNT = 5;
// One verified challenge is exactly 15 questions. Difficulty levels are mixed
// inside the same run so every leaderboard attempt has the same shape.
const ANTARA_QUIZ_TOTAL_QUESTIONS = ANTARA_QUIZ_STACK_SIZE;
const ANTARA_QUIZ_QUESTION_COUNT = ANTARA_QUIZ_STACK_SIZE;
const ANTARA_QUIZ_RUN_MINUTES = 90;
const ANTARA_QUIZ_NETWORK_GRACE_MS = 700;

function antara_quiz_bank(): array
{
    static $bank = null;
    if (is_array($bank)) return $bank;
    $loaded = require __DIR__ . '/_bank.php';
    if (!is_array($loaded) || count($loaded) !== 300) {
        throw new RuntimeException('Bank soal ANTARA tidak valid.');
    }
    $bank = $loaded;
    return $bank;
}

function antara_quiz_level_config(int $level): array
{
    // Timer is intentionally NOT a flat countdown per level. The actual limit is
    // calculated from each question's reading load (prompt + four answer choices)
    // and then clamped to a sensible band for its cognitive difficulty.
    $configs = [
        1 => ['label' => 'PEMULA',   'base' => 100, 'thinkingMs' => 5000, 'minTimeMs' => 15000, 'maxTimeMs' => 22000],
        2 => ['label' => 'DASAR',    'base' => 150, 'thinkingMs' => 4000, 'minTimeMs' => 10000, 'maxTimeMs' => 18000],
        3 => ['label' => 'MENENGAH', 'base' => 220, 'thinkingMs' => 5000, 'minTimeMs' =>  9000, 'maxTimeMs' => 16000],
        4 => ['label' => 'SULIT',    'base' => 310, 'thinkingMs' => 7000, 'minTimeMs' => 16000, 'maxTimeMs' => 25000],
        5 => ['label' => 'AHLI',     'base' => 430, 'thinkingMs' => 9000, 'minTimeMs' => 18000, 'maxTimeMs' => 30000],
    ];
    if (!isset($configs[$level])) throw new InvalidArgumentException('Level kuis tidak valid.');
    return $configs[$level];
}

function antara_quiz_word_count(string $text): int
{
    if ($text === '') return 0;
    preg_match_all("/[\\p{L}\\p{N}]+(?:[-’'][\\p{L}\\p{N}]+)*/u", $text, $matches);
    return count($matches[0] ?? []);
}

function antara_quiz_question_time_ms(array $question): int
{
    $level = (int)($question['level'] ?? 0);
    $config = antara_quiz_level_config($level);
    $questionWords = antara_quiz_word_count((string)($question['question'] ?? ''));
    $optionWords = 0;
    foreach (($question['options'] ?? []) as $option) {
        $optionWords += antara_quiz_word_count((string)$option);
    }

    // Reading model: prompts are read carefully (~189 wpm) while answer choices
    // are scanned a little faster (~252 wpm). Then add level-specific thinking
    // time. Round to whole seconds so the timer feels deliberate, not arbitrary.
    $readingSeconds = ($questionWords / 3.15) + ($optionWords / 4.2);
    $rawMs = (int)round(($readingSeconds * 1000 + (int)$config['thinkingMs']) / 1000) * 1000;
    return max((int)$config['minTimeMs'], min((int)$config['maxTimeMs'], $rawMs));
}

function antara_quiz_column_exists(PDO $pdo, string $column): bool
{
    $stmt = $pdo->query("SHOW COLUMNS FROM quiz_run_questions LIKE " . $pdo->quote($column));
    return (bool)$stmt->fetch();
}

function antara_quiz_ensure_schema(PDO $pdo): void
{
    antara_leaderboard_ensure_schema($pdo);
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS quiz_run_questions (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            run_id BIGINT UNSIGNED NOT NULL,
            position TINYINT UNSIGNED NOT NULL,
            question_id SMALLINT UNSIGNED NOT NULL,
            level TINYINT UNSIGNED NOT NULL,
            correct_key CHAR(1) NOT NULL,
            time_limit_ms INT UNSIGNED NOT NULL,
            served_at DATETIME(6) NULL,
            answered_at DATETIME(6) NULL,
            answer_key CHAR(1) NULL,
            is_correct TINYINT(1) NULL,
            timed_out TINYINT(1) NOT NULL DEFAULT 0,
            response_ms INT UNSIGNED NULL,
            points INT UNSIGNED NOT NULL DEFAULT 0,
            streak_after TINYINT UNSIGNED NOT NULL DEFAULT 0,
            attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            first_try_correct TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_quiz_run_position (run_id, position),
            KEY idx_quiz_run_question (run_id, question_id),
            KEY idx_quiz_run_level_mastery (run_id, level, is_correct, attempt_count),
            CONSTRAINT fk_quiz_question_run FOREIGN KEY (run_id) REFERENCES game_runs(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );

    // Existing installations are upgraded in place, so users do not have to re-import SQL.
    if (!antara_quiz_column_exists($pdo, 'attempt_count')) {
        $pdo->exec('ALTER TABLE quiz_run_questions ADD COLUMN attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER streak_after');
    }
    if (!antara_quiz_column_exists($pdo, 'first_try_correct')) {
        $pdo->exec('ALTER TABLE quiz_run_questions ADD COLUMN first_try_correct TINYINT(1) NOT NULL DEFAULT 0 AFTER attempt_count');
    }
}

function antara_quiz_select_question_ids(): array
{
    $bank = antara_quiz_bank();
    $selected = [];
    $basePerLevel = intdiv(ANTARA_QUIZ_STACK_SIZE, ANTARA_QUIZ_LEVEL_COUNT);
    $remainder = ANTARA_QUIZ_STACK_SIZE % ANTARA_QUIZ_LEVEL_COUNT;

    for ($level = 1; $level <= ANTARA_QUIZ_LEVEL_COUNT; $level++) {
        $ids = [];
        foreach ($bank as $id => $question) {
            if ((int)$question['level'] === $level) $ids[] = (int)$id;
        }
        shuffle($ids);
        $take = $basePerLevel + ($level <= $remainder ? 1 : 0);
        $slice = array_slice($ids, 0, $take);
        if (count($slice) !== $take) {
            throw new RuntimeException('Bank soal level ' . $level . ' tidak cukup untuk tantangan 15 soal.');
        }
        foreach ($slice as $id) $selected[] = $id;
    }

    shuffle($selected);
    if (count($selected) !== ANTARA_QUIZ_TOTAL_QUESTIONS) {
        throw new RuntimeException('Pemilihan tantangan kuis gagal.');
    }
    return $selected;
}

function antara_quiz_stack_position(array $row): int
{
    $position = (int)$row['position'];
    return (($position - 1) % ANTARA_QUIZ_STACK_SIZE) + 1;
}

function antara_quiz_stack_progress(PDO $pdo, int $runId, int $level = 0): array
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS total,
                SUM(CASE WHEN attempt_count > 0 THEN 1 ELSE 0 END) AS attempted,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS mastered,
                SUM(attempt_count) AS attempts,
                SUM(first_try_correct) AS first_try_correct
         FROM quiz_run_questions
         WHERE run_id = :run_id'
    );
    $stmt->execute(['run_id'=>$runId]);
    $row = $stmt->fetch() ?: [];
    $total = (int)($row['total'] ?? 0);
    $mastered = (int)($row['mastered'] ?? 0);
    return [
        'level'=>0,
        'label'=>'CAMPURAN',
        'total'=>$total,
        'attempted'=>(int)($row['attempted'] ?? 0),
        'mastered'=>$mastered,
        'remaining'=>max(0, $total - (int)($row['attempted'] ?? 0)),
        'attempts'=>(int)($row['attempts'] ?? 0),
        'firstTryCorrect'=>(int)($row['first_try_correct'] ?? 0),
        'complete'=>$total === ANTARA_QUIZ_STACK_SIZE && (int)($row['attempted'] ?? 0) === ANTARA_QUIZ_STACK_SIZE,
    ];
}

function antara_quiz_previous_levels_complete(PDO $pdo, int $runId, int $level): bool
{
    // Levels are difficulty tags inside one 15-question challenge, not gates.
    return true;
}

function antara_quiz_find_next_stack_question(PDO $pdo, int $runId, int $level = 0, bool $forUpdate = true): ?array
{
    $sql =
        'SELECT * FROM quiz_run_questions
         WHERE run_id = :run_id AND attempt_count = 0
         ORDER BY position ASC
         LIMIT 1';
    if ($forUpdate) $sql .= ' FOR UPDATE';
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['run_id'=>$runId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function antara_quiz_public_question(array $row): array
{
    $bank = antara_quiz_bank();
    $id = (int)$row['question_id'];
    $q = $bank[$id] ?? null;
    if (!$q) throw new RuntimeException('Soal kuis tidak ditemukan.');
    $level = (int)$row['level'];
    $config = antara_quiz_level_config($level);
    return [
        // `position` stays the secure database slot used by answer.php.
        'position' => (int)$row['position'],
        'stackPosition' => antara_quiz_stack_position($row),
        'stackTotal' => ANTARA_QUIZ_STACK_SIZE,
        'overallTotal' => ANTARA_QUIZ_TOTAL_QUESTIONS,
        'questionId' => $id,
        'level' => $level,
        'levelLabel' => $config['label'],
        'planet' => (string)$q['planet'],
        'topic' => (string)$q['title'],
        'question' => (string)$q['question'],
        'options' => $q['options'],
        'timeLimitMs' => (int)$row['time_limit_ms'],
        'attemptNumber' => ((int)($row['attempt_count'] ?? 0)) + 1,
        'isRetry' => (int)($row['attempt_count'] ?? 0) > 0,
    ];
}

function antara_quiz_token_hash(string $token): string
{
    $token = trim($token);
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) return '';
    return hash('sha256', $token);
}

function antara_quiz_score(int $level, int $responseMs, int $timeLimitMs, int $streakAfter, bool $correct): array
{
    if (!$correct) return ['points' => 0, 'base' => 0, 'speedBonus' => 0, 'streakBonus' => 0];
    $config = antara_quiz_level_config($level);
    $base = (int)$config['base'];
    $used = max(0, min($responseMs, $timeLimitMs));
    $remainingRatio = $timeLimitMs > 0 ? max(0.0, ($timeLimitMs - $used) / $timeLimitMs) : 0.0;
    $speedBonus = (int)round($base * 0.85 * $remainingRatio);
    $streakBonus = min(200, max(0, $streakAfter - 1) * 25);
    return [
        'points' => $base + $speedBonus + $streakBonus,
        'base' => $base,
        'speedBonus' => $speedBonus,
        'streakBonus' => $streakBonus,
    ];
}

function antara_quiz_run_summary(PDO $pdo, int $runId): array
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS total,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct_count,
                COALESCE(MAX(streak_after),0) AS best_streak,
                COALESCE(AVG(CASE WHEN is_correct = 1 THEN response_ms END),0) AS avg_response_ms,
                SUM(CASE WHEN level = 5 AND is_correct = 1 THEN 1 ELSE 0 END) AS expert_correct,
                SUM(CASE WHEN is_correct = 1 AND response_ms <= 3000 THEN 1 ELSE 0 END) AS fast_correct,
                COALESCE(SUM(attempt_count),0) AS total_attempts,
                COALESCE(SUM(first_try_correct),0) AS first_try_correct
         FROM quiz_run_questions WHERE run_id = :run_id'
    );
    $stmt->execute(['run_id' => $runId]);
    $row = $stmt->fetch() ?: [];
    $scoreStmt = $pdo->prepare('SELECT server_score FROM game_runs WHERE id = :run_id LIMIT 1');
    $scoreStmt->execute(['run_id' => $runId]);
    $score = (int)($scoreStmt->fetchColumn() ?: 0);
    $total = (int)($row['total'] ?? 0);
    $correct = (int)($row['correct_count'] ?? 0);
    $firstTry = (int)($row['first_try_correct'] ?? 0);
    $attempts = (int)($row['total_attempts'] ?? 0);
    return [
        'score' => $score,
        'total' => $total,
        'correct' => $correct,
        'accuracy' => $total > 0 ? (int)round(($firstTry / $total) * 100) : 0,
        'firstTryCorrect' => $firstTry,
        'totalAttempts' => $attempts,
        'bestStreak' => (int)($row['best_streak'] ?? 0),
        'avgResponseMs' => (int)round((float)($row['avg_response_ms'] ?? 0)),
        'expertCorrect' => (int)($row['expert_correct'] ?? 0),
        'fastCorrect' => (int)($row['fast_correct'] ?? 0),
    ];
}

function antara_quiz_find_run(PDO $pdo, int $userId, string $token, bool $forUpdate = false): ?array
{
    $hash = antara_quiz_token_hash($token);
    if ($hash === '') return null;
    $sql = 'SELECT * FROM game_runs WHERE user_id = :user_id AND game_code = :game AND run_token_hash = :hash LIMIT 1';
    if ($forUpdate) $sql .= ' FOR UPDATE';
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['user_id' => $userId, 'game' => ANTARA_QUIZ_GAME_CODE, 'hash' => $hash]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function antara_quiz_finalize(PDO $pdo, int $runId, int $userId): array
{
    $summary = antara_quiz_run_summary($pdo, $runId);

    $bestStmt = $pdo->prepare(
        'SELECT MAX(score) FROM verified_game_scores WHERE user_id = :user_id AND game_code = :game_code'
    );
    $bestStmt->execute(['user_id'=>$userId,'game_code'=>ANTARA_QUIZ_GAME_CODE]);
    $previousBestRaw = $bestStmt->fetchColumn();
    $previousBest = $previousBestRaw === false || $previousBestRaw === null ? null : (int)$previousBestRaw;

    $pdo->prepare("UPDATE game_runs SET status = 'finished', finished_at = NOW() WHERE id = :run_id AND status = 'active'")
        ->execute(['run_id' => $runId]);
    $stmt = $pdo->prepare(
        'INSERT INTO verified_game_scores (run_id, user_id, game_code, score, verified_at)
         VALUES (:run_id, :user_id, :game_code, :score, NOW())
         ON DUPLICATE KEY UPDATE score = VALUES(score)'
    );
    $stmt->execute([
        'run_id' => $runId,
        'user_id' => $userId,
        'game_code' => ANTARA_QUIZ_GAME_CODE,
        'score' => $summary['score'],
    ]);

    $summary['previousBestScore'] = $previousBest;
    $summary['bestScore'] = max((int)$summary['score'], $previousBest ?? 0);
    $summary['isNewBest'] = $previousBest === null || (int)$summary['score'] > $previousBest;
    return $summary;
}

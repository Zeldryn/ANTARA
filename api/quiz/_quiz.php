<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/leaderboard/_leaderboard.php';

const ANTARA_QUIZ_GAME_CODE = 'quiz';
const ANTARA_QUIZ_QUESTION_COUNT = 15;
const ANTARA_QUIZ_RUN_MINUTES = 20;
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
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_quiz_run_position (run_id, position),
            KEY idx_quiz_run_question (run_id, question_id),
            CONSTRAINT fk_quiz_question_run FOREIGN KEY (run_id) REFERENCES game_runs(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );
}

function antara_quiz_select_question_ids(): array
{
    $bank = antara_quiz_bank();
    $selected = [];
    for ($level = 1; $level <= 5; $level++) {
        $ids = [];
        foreach ($bank as $id => $question) {
            if ((int)$question['level'] === $level) $ids[] = (int)$id;
        }
        shuffle($ids);
        foreach (array_slice($ids, 0, 3) as $id) $selected[] = $id;
    }
    if (count($selected) !== ANTARA_QUIZ_QUESTION_COUNT) {
        throw new RuntimeException('Pemilihan soal kuis gagal.');
    }
    return $selected;
}

function antara_quiz_public_question(array $row): array
{
    $bank = antara_quiz_bank();
    $id = (int)$row['question_id'];
    $q = $bank[$id] ?? null;
    if (!$q) throw new RuntimeException('Soal kuis tidak ditemukan.');
    $config = antara_quiz_level_config((int)$row['level']);
    return [
        'position' => (int)$row['position'],
        'total' => ANTARA_QUIZ_QUESTION_COUNT,
        'questionId' => $id,
        'level' => (int)$row['level'],
        'levelLabel' => $config['label'],
        'planet' => (string)$q['planet'],
        'topic' => (string)$q['title'],
        'question' => (string)$q['question'],
        'options' => $q['options'],
        'timeLimitMs' => (int)$row['time_limit_ms'],
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
                COALESCE(AVG(CASE WHEN answered_at IS NOT NULL THEN response_ms END),0) AS avg_response_ms,
                SUM(CASE WHEN level = 5 AND is_correct = 1 THEN 1 ELSE 0 END) AS expert_correct,
                SUM(CASE WHEN is_correct = 1 AND response_ms <= 3000 THEN 1 ELSE 0 END) AS fast_correct
         FROM quiz_run_questions WHERE run_id = :run_id'
    );
    $stmt->execute(['run_id' => $runId]);
    $row = $stmt->fetch() ?: [];
    $scoreStmt = $pdo->prepare('SELECT server_score FROM game_runs WHERE id = :run_id LIMIT 1');
    $scoreStmt->execute(['run_id' => $runId]);
    $score = (int)($scoreStmt->fetchColumn() ?: 0);
    $total = (int)($row['total'] ?? 0);
    $correct = (int)($row['correct_count'] ?? 0);
    return [
        'score' => $score,
        'total' => $total,
        'correct' => $correct,
        'accuracy' => $total > 0 ? (int)round(($correct / $total) * 100) : 0,
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
    return $summary;
}

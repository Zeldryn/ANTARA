<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/progress/_progress.php';

const ANTARA_COMPLETION_MIN_SECONDS = 300;
const ANTARA_LEADERBOARD_LIMIT_MAX = 100;


function antara_completion_required_milestones(): int
{
    return array_sum(array_map(
        static fn(array $definition): int => (int)$definition['normal_total'] + count($definition['full']),
        antara_progress_catalog()
    ));
}

function antara_leaderboard_ensure_schema(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS exploration_completions (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            completed_at DATETIME NOT NULL,
            completion_event_id BIGINT UNSIGNED NULL,
            first_progress_at DATETIME NULL,
            elapsed_seconds INT UNSIGNED NULL,
            total_milestones SMALLINT UNSIGNED NOT NULL DEFAULT 0,
            eligible TINYINT(1) NOT NULL DEFAULT 0,
            integrity_status VARCHAR(32) NOT NULL DEFAULT \'pending\',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_exploration_completion_user (user_id),
            KEY idx_exploration_rank (eligible, completed_at, completion_event_id, id),
            CONSTRAINT fk_exploration_completion_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS game_runs (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            game_code VARCHAR(40) NOT NULL,
            run_token_hash CHAR(64) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT \'active\',
            server_score BIGINT UNSIGNED NOT NULL DEFAULT 0,
            started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            finished_at DATETIME NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_game_run_token_hash (run_token_hash),
            KEY idx_game_runs_user_game (user_id, game_code),
            KEY idx_game_runs_status_expiry (status, expires_at),
            CONSTRAINT fk_game_runs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS verified_game_scores (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            run_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            game_code VARCHAR(40) NOT NULL,
            score BIGINT UNSIGNED NOT NULL,
            verified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_verified_score_run (run_id),
            KEY idx_verified_game_rank (game_code, score, verified_at, id),
            KEY idx_verified_game_user (user_id, game_code),
            CONSTRAINT fk_verified_score_run FOREIGN KEY (run_id) REFERENCES game_runs(id) ON DELETE CASCADE,
            CONSTRAINT fk_verified_score_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );
}

function antara_completion_integrity(PDO $pdo, int $userId, array $summary): array
{
    $done = (int)($summary['overall']['completedMilestones'] ?? 0);
    $total = (int)($summary['overall']['totalMilestones'] ?? 0);
    if ($total <= 0 || $done < $total) {
        return ['complete' => false, 'eligible' => false, 'status' => 'incomplete'];
    }

    $stmt = $pdo->prepare(
        'SELECT MIN(created_at) AS first_at, MAX(created_at) AS last_at, MAX(id) AS last_event_id, COUNT(*) AS event_count
         FROM user_progress_events
         WHERE user_id = :user_id'
    );
    $stmt->execute(['user_id' => $userId]);
    $row = $stmt->fetch() ?: [];

    $first = (string)($row['first_at'] ?? '');
    $last = (string)($row['last_at'] ?? '');
    $count = (int)($row['event_count'] ?? 0);
    $lastEventId = isset($row['last_event_id']) ? (int)$row['last_event_id'] : null;
    $elapsed = null;
    if ($first !== '' && $last !== '') {
        $a = strtotime($first);
        $b = strtotime($last);
        if ($a !== false && $b !== false) {
            $elapsed = max(0, $b - $a);
        }
    }

    $eligible = $count >= $total && $elapsed !== null && $elapsed >= ANTARA_COMPLETION_MIN_SECONDS;
    $status = $eligible ? 'verified' : (($elapsed !== null && $elapsed < ANTARA_COMPLETION_MIN_SECONDS) ? 'too-fast' : 'review');

    return [
        'complete' => true,
        'eligible' => $eligible,
        'status' => $status,
        'firstAt' => $first !== '' ? $first : null,
        'completedAt' => $last !== '' ? $last : date('Y-m-d H:i:s'),
        'elapsedSeconds' => $elapsed,
        'eventCount' => $count,
        'completionEventId' => $lastEventId,
        'total' => $total,
    ];
}

function antara_completion_sync(PDO $pdo, int $userId, array $summary): ?array
{
    $integrity = antara_completion_integrity($pdo, $userId, $summary);
    if (!$integrity['complete']) {
        return null;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO exploration_completions
         (user_id, completed_at, completion_event_id, first_progress_at, elapsed_seconds, total_milestones, eligible, integrity_status, created_at, updated_at)
         VALUES (:user_id, :completed_at, :completion_event_id, :first_at, :elapsed, :total, :eligible, :status, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           completed_at = IF(total_milestones <> VALUES(total_milestones), VALUES(completed_at), completed_at),
           completion_event_id = IF(total_milestones <> VALUES(total_milestones), VALUES(completion_event_id), COALESCE(completion_event_id, VALUES(completion_event_id))),
           first_progress_at = VALUES(first_progress_at),
           elapsed_seconds = VALUES(elapsed_seconds),
           total_milestones = VALUES(total_milestones),
           eligible = VALUES(eligible),
           integrity_status = VALUES(integrity_status),
           updated_at = NOW()'
    );
    $stmt->execute([
        'user_id' => $userId,
        'completed_at' => $integrity['completedAt'],
        'completion_event_id' => $integrity['completionEventId'],
        'first_at' => $integrity['firstAt'],
        'elapsed' => $integrity['elapsedSeconds'],
        'total' => $integrity['total'],
        'eligible' => $integrity['eligible'] ? 1 : 0,
        'status' => $integrity['status'],
    ]);

    return $integrity;
}

function antara_completion_backfill(PDO $pdo): void
{
    antara_leaderboard_ensure_schema($pdo);
    $required = antara_completion_required_milestones();

    $stmt = $pdo->prepare(
        'SELECT e.user_id
         FROM user_progress_events e
         LEFT JOIN exploration_completions c ON c.user_id = e.user_id
         WHERE c.user_id IS NULL
         GROUP BY e.user_id
         HAVING COUNT(*) >= :required
         LIMIT 250'
    );
    $stmt->bindValue(':required', $required, PDO::PARAM_INT);
    $stmt->execute();

    foreach ($stmt->fetchAll() as $row) {
        $userId = (int)$row['user_id'];
        $summary = antara_progress_summary($pdo, $userId);
        antara_completion_sync($pdo, $userId, $summary);
    }
}

function antara_completion_entries(PDO $pdo, int $limit = 50): array
{
    $limit = max(1, min(ANTARA_LEADERBOARD_LIMIT_MAX, $limit));
    antara_completion_backfill($pdo);

    $required = antara_completion_required_milestones();
    $sql = 'SELECT c.id, c.user_id, c.completed_at, c.completion_event_id, c.elapsed_seconds, u.username, u.full_name, u.avatar_url
            FROM exploration_completions c
            JOIN users u ON u.id = c.user_id
            WHERE c.eligible = 1 AND c.total_milestones = :required
            ORDER BY c.completed_at ASC, c.completion_event_id ASC, c.id ASC
            LIMIT ' . $limit;
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':required', $required, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $entries = [];
    foreach ($rows as $index => $row) {
        $entries[] = [
            'rank' => $index + 1,
            'userId' => (int)$row['user_id'],
            'username' => (string)$row['username'],
            'name' => (string)$row['full_name'],
            'avatar' => $row['avatar_url'] !== null ? (string)$row['avatar_url'] : null,
            'completedAt' => (string)$row['completed_at'],
            'elapsedSeconds' => isset($row['elapsed_seconds']) ? (int)$row['elapsed_seconds'] : null,
        ];
    }
    return $entries;
}

function antara_completion_user_rank(PDO $pdo, int $userId): ?array
{
    $stmt = $pdo->prepare('SELECT id, completed_at, completion_event_id, eligible, integrity_status, total_milestones FROM exploration_completions WHERE user_id = :user_id LIMIT 1');
    $stmt->execute(['user_id' => $userId]);
    $row = $stmt->fetch();
    if (!$row) return null;

    $required = antara_completion_required_milestones();
    if (!(bool)$row['eligible'] || (int)$row['total_milestones'] !== $required) {
        return [
            'rank' => null,
            'completedAt' => (string)$row['completed_at'],
            'eligible' => false,
            'status' => (int)$row['total_milestones'] !== $required ? 'content-expanded' : (string)$row['integrity_status'],
        ];
    }

    $rankStmt = $pdo->prepare(
        'SELECT COUNT(*) + 1 AS rank_no
         FROM exploration_completions
         WHERE eligible = 1 AND total_milestones = :required AND (
           completed_at < :completed_at
           OR (completed_at = :completed_at AND COALESCE(completion_event_id, 18446744073709551615) < :completion_event_id)
           OR (completed_at = :completed_at AND COALESCE(completion_event_id, 18446744073709551615) = :completion_event_id AND id < :id)
         )'
    );
    $rankStmt->execute([
        'completed_at' => $row['completed_at'],
        'completion_event_id' => $row['completion_event_id'] !== null ? (int)$row['completion_event_id'] : PHP_INT_MAX,
        'id' => $row['id'],
        'required' => $required,
    ]);
    return [
        'rank' => (int)$rankStmt->fetchColumn(),
        'completedAt' => (string)$row['completed_at'],
        'eligible' => true,
        'status' => 'verified',
    ];
}

function antara_verified_game_entries(PDO $pdo, string $game, int $limit = 50): array
{
    $limit = max(1, min(ANTARA_LEADERBOARD_LIMIT_MAX, $limit));
    $sql = 'SELECT v.user_id, u.username, u.full_name, u.avatar_url, MAX(v.score) AS score,
                   MIN(CASE WHEN v.score = best.best_score THEN v.verified_at END) AS achieved_at
            FROM verified_game_scores v
            JOIN users u ON u.id = v.user_id
            JOIN (
                SELECT user_id, MAX(score) AS best_score
                FROM verified_game_scores
                WHERE game_code = :game_best
                GROUP BY user_id
            ) best ON best.user_id = v.user_id
            WHERE v.game_code = :game_main
            GROUP BY v.user_id, u.username, u.full_name, u.avatar_url
            ORDER BY score DESC, achieved_at ASC, v.user_id ASC
            LIMIT ' . $limit;
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['game_best' => $game, 'game_main' => $game]);
    $rows = $stmt->fetchAll();

    return array_map(static fn(array $row, int $index): array => [
        'rank' => $index + 1,
        'userId' => (int)$row['user_id'],
        'username' => (string)$row['username'],
        'name' => (string)$row['full_name'],
        'avatar' => $row['avatar_url'] !== null ? (string)$row['avatar_url'] : null,
        'score' => (int)$row['score'],
        'achievedAt' => $row['achieved_at'] !== null ? (string)$row['achieved_at'] : null,
    ], $rows, array_keys($rows));
}

function antara_verified_game_user_rank(PDO $pdo, int $userId, string $game): ?array
{
    $stmt = $pdo->prepare('SELECT MAX(score) AS best_score FROM verified_game_scores WHERE user_id = :user_id AND game_code = :game');
    $stmt->execute(['user_id' => $userId, 'game' => $game]);
    $best = $stmt->fetchColumn();
    if ($best === false || $best === null) return null;
    $score = (int)$best;

    $rank = $pdo->prepare(
        'SELECT COUNT(*) + 1 FROM (
            SELECT user_id, MAX(score) AS best_score
            FROM verified_game_scores
            WHERE game_code = :game
            GROUP BY user_id
            HAVING best_score > :score
         ) ranked'
    );
    $rank->execute(['game' => $game, 'score' => $score]);
    return ['rank' => (int)$rank->fetchColumn(), 'score' => $score];
}

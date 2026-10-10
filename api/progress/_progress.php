<?php
declare(strict_types=1);

function antara_progress_catalog(): array
{
    static $catalog = null;
    if (is_array($catalog)) {
        return $catalog;
    }

    $catalog = [
        'sun' => [
            'name' => 'Matahari',
            'short' => 'MATAHARI',
            'normal_total' => 11,
            'full' => [],
        ],
        'mercury' => [
            'name' => 'Merkurius',
            'short' => 'MERKURIUS',
            'normal_total' => 11,
            'full' => [
                'caloris' => 'Caloris Basin',
                'discovery' => 'Discovery Rupes',
                'beethoven' => 'Beethoven Basin',
                'rembrandt' => 'Rembrandt Basin',
                'prokofiev' => 'Prokofiev Crater',
            ],
        ],
        'venus' => [
            'name' => 'Venus',
            'short' => 'VENUS',
            'normal_total' => 14,
            'full' => [
                'maat' => 'Maat Mons',
                'maxwell' => 'Maxwell Montes',
                'aphrodite' => 'Aphrodite Terra',
                'ishtar' => 'Ishtar Terra',
                'alpha' => 'Alpha Regio',
            ],
        ],
        'earth' => [
            'name' => 'Bumi',
            'short' => 'BUMI',
            'normal_total' => 14,
            'full' => [
                'everest' => 'Everest / Himalaya',
                'mariana' => 'Mariana / Challenger Deep',
                'maunakea' => 'Mauna Kea / Hawaiʻi',
                'grandcanyon' => 'Grand Canyon',
                'antarctica' => 'Antarktika / Vostok',
            ],
        ],
        'mars' => [
            'name' => 'Mars',
            'short' => 'MARS',
            'normal_total' => 11,
            'full' => [
                'jezero' => 'Kawah Jezero',
                'olympus' => 'Olympus Mons',
                'valles' => 'Valles Marineris',
                'gale' => 'Gale Crater',
                'hellas' => 'Hellas Planitia',
            ],
        ],
        'asteroid-belt' => [
            'name' => 'Sabuk Asteroid',
            'short' => 'SABUK ASTEROID',
            'normal_total' => 11,
            'full' => [],
        ],
        'jupiter' => [
            'name' => 'Jupiter',
            'short' => 'JUPITER',
            'normal_total' => 11,
            'full' => [
                'grs' => 'Great Red Spot',
                'bands' => 'Sabuk & Zona Awan',
                'lightning' => 'Badai Petir Jovian',
                'hotspot' => '5-Micron Hot Spot',
                'polar' => 'Siklon Kutub Jupiter',
            ],
        ],
        'saturn' => [
            'name' => 'Saturnus',
            'short' => 'SATURNUS',
            'normal_total' => 11,
            'full' => [
                'hexagon' => 'Hexagon Kutub Utara',
                'storms' => 'Atmosfer & Badai Saturnus',
                'rings' => 'Cincin & Cassini Division',
                'titan' => 'Titan',
                'enceladus' => 'Enceladus',
            ],
        ],
        'uranus' => [
            'name' => 'Uranus',
            'short' => 'URANUS',
            'normal_total' => 11,
            'full' => [
                'methane-winds' => 'Atmosfer Metana & Angin Uranus',
                'polar-seasons' => 'Kutub & Musim Ekstrem Uranus',
                'magnetosphere' => 'Magnetosfer Uranus',
                'rings' => 'Cincin Gelap Uranus',
                'miranda' => 'Miranda',
            ],
        ],
        'neptune' => [
            'name' => 'Neptunus',
            'short' => 'NEPTUNUS',
            'normal_total' => 11,
            'full' => [
                'super-winds' => 'Angin Super Cepat',
                'dark-spot' => 'Great Dark Spot',
                'methane-clouds' => 'Awan Metana Tinggi',
                'rings-arcs' => 'Cincin & Arc Neptunus',
                'triton' => 'Triton',
            ],
        ],
    ];

    return $catalog;
}

function antara_progress_ensure_schema(PDO $pdo): void
{
    try {
        $pdo->query('SELECT 1 FROM user_progress_events LIMIT 1');
        return;
    } catch (PDOException $e) {
        $mysqlCode = (int)($e->errorInfo[1] ?? 0);
        $sqlState = (string)($e->errorInfo[0] ?? $e->getCode());
        if ($mysqlCode !== 1146 && $sqlState !== '42S02') {
            throw $e;
        }
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS user_progress_events (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            planet_code VARCHAR(40) NOT NULL,
            event_type VARCHAR(24) NOT NULL,
            event_key VARCHAR(120) NOT NULL,
            event_label VARCHAR(160) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_user_progress_event (user_id, planet_code, event_type, event_key),
            KEY idx_progress_events_user (user_id),
            KEY idx_progress_events_planet (user_id, planet_code),
            CONSTRAINT fk_progress_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );
}

function antara_progress_event_is_allowed(string $planet, string $type, string $key): bool
{
    $catalog = antara_progress_catalog();
    if (!isset($catalog[$planet])) {
        return false;
    }

    if ($type === 'normal') {
        if (!preg_match('/^topic-(\d+)$/', $key, $match)) {
            return false;
        }
        $index = (int)$match[1];
        return $index >= 0 && $index < (int)$catalog[$planet]['normal_total'];
    }

    if ($type === 'full') {
        return isset($catalog[$planet]['full'][$key]);
    }

    return false;
}

function antara_progress_planet_summary(string $planet, array $definition, array $events): array
{
    $normalVisited = [];
    $fullVisited = [];
    $lastUpdated = null;

    foreach ($events as $event) {
        if (($event['planet_code'] ?? '') !== $planet) {
            continue;
        }

        $type = (string)($event['event_type'] ?? '');
        $key = (string)($event['event_key'] ?? '');
        if (!antara_progress_event_is_allowed($planet, $type, $key)) {
            continue;
        }

        if ($type === 'normal') {
            $normalVisited[$key] = true;
        } elseif ($type === 'full') {
            $fullVisited[$key] = true;
        }

        $createdAt = (string)($event['created_at'] ?? '');
        if ($createdAt !== '' && ($lastUpdated === null || $createdAt > $lastUpdated)) {
            $lastUpdated = $createdAt;
        }
    }

    $normalTotal = (int)$definition['normal_total'];
    $fullTotal = count($definition['full']);
    $normalDone = count($normalVisited);
    $fullDone = count($fullVisited);
    $done = $normalDone + $fullDone;
    $total = $normalTotal + $fullTotal;
    $percent = $total > 0 ? (int)round(($done / $total) * 100) : 0;

    return [
        'planet' => $planet,
        'name' => (string)$definition['name'],
        'short' => (string)$definition['short'],
        'progress' => $percent,
        'completed' => $total > 0 && $done >= $total,
        'started' => $done > 0,
        'completedMilestones' => $done,
        'totalMilestones' => $total,
        'normal' => [
            'completed' => $normalDone,
            'total' => $normalTotal,
        ],
        'full' => [
            'available' => $fullTotal > 0,
            'completed' => $fullDone,
            'total' => $fullTotal,
            'visited' => array_values(array_keys($fullVisited)),
        ],
        'updatedAt' => $lastUpdated,
    ];
}

function antara_progress_summary(PDO $pdo, int $userId): array
{
    $stmt = $pdo->prepare(
        'SELECT planet_code, event_type, event_key, event_label, created_at
         FROM user_progress_events
         WHERE user_id = :user_id
         ORDER BY created_at ASC, id ASC'
    );
    $stmt->execute(['user_id' => $userId]);
    $events = $stmt->fetchAll();

    $planets = [];
    $overallDone = 0;
    $overallTotal = 0;
    $exploredObjects = 0;
    $completedObjects = 0;
    $lastUpdated = null;

    foreach (antara_progress_catalog() as $planet => $definition) {
        $summary = antara_progress_planet_summary($planet, $definition, $events);
        $planets[] = $summary;
        $overallDone += (int)$summary['completedMilestones'];
        $overallTotal += (int)$summary['totalMilestones'];
        if ($summary['started']) {
            $exploredObjects++;
        }
        if ($summary['completed']) {
            $completedObjects++;
        }
        if ($summary['updatedAt'] !== null && ($lastUpdated === null || $summary['updatedAt'] > $lastUpdated)) {
            $lastUpdated = $summary['updatedAt'];
        }
    }

    $overallPercent = $overallTotal > 0 ? (int)round(($overallDone / $overallTotal) * 100) : 0;

    return [
        'overall' => [
            'progress' => $overallPercent,
            'completedMilestones' => $overallDone,
            'totalMilestones' => $overallTotal,
            'exploredObjects' => $exploredObjects,
            'totalObjects' => count($planets),
            'completedObjects' => $completedObjects,
            'updatedAt' => $lastUpdated,
        ],
        'planets' => $planets,
    ];
}

function antara_progress_sync_legacy_summary(PDO $pdo, int $userId, string $planet, int $percent): void
{
    $completed = $percent >= 100 ? 1 : 0;
    $stmt = $pdo->prepare(
        'INSERT INTO user_progress (user_id, planet_code, progress_percent, completed, created_at, updated_at)
         VALUES (:user_id, :planet, :progress, :completed, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           progress_percent = VALUES(progress_percent),
           completed = VALUES(completed),
           updated_at = NOW()'
    );
    $stmt->execute([
        'user_id' => $userId,
        'planet' => $planet,
        'progress' => $percent,
        'completed' => $completed,
    ]);
}

<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/progress/_progress.php';
require_once dirname(__DIR__) . '/leaderboard/_leaderboard.php';
require_once dirname(__DIR__) . '/quiz/_quiz.php';

function antara_achievement_catalog(): array
{
    return [
        'first-step' => ['name'=>'Langkah Pertama','description'=>'Identitas penjelajah ANTARA berhasil dibuat dan perjalananmu resmi dimulai.','icon'=>'assets/achievements/11-langkah-pertama.png','category'=>'special','tier'=>'common','sort'=>10],
        'first-launch' => ['name'=>'Mulai Perjalanan','description'=>'Menekan MULAI PERJALANAN dan memulai peluncuran ANTARA untuk pertama kalinya.','icon'=>'assets/achievements/12-mulai-perjalanan.png','category'=>'special','tier'=>'common','sort'=>20],
        'first-explore' => ['name'=>'Jelajah Pertama','description'=>'Membuka topik Jelajah biasa pertamamu di salah satu objek Tata Surya.','icon'=>'assets/achievements/13-jelajah-pertama.png','category'=>'special','tier'=>'common','sort'=>30],
        'first-full' => ['name'=>'Eksplorasi Penuh','description'=>'Mencatat target Eksplorasi Penuh pertamamu di salah satu planet.','icon'=>'assets/achievements/14-eksplorasi-penuh.png','category'=>'special','tier'=>'rare','sort'=>40],
        'mercury-master' => ['name'=>'Ahli Merkurius','description'=>'Menuntaskan seluruh target Eksplorasi Penuh Merkurius.','icon'=>'assets/achievements/26-ahli-merkurius.svg','category'=>'special','tier'=>'epic','sort'=>50],
        'venus-master' => ['name'=>'Ahli Venus','description'=>'Menuntaskan seluruh target Eksplorasi Penuh Venus.','icon'=>'assets/achievements/15-ahli-venus.png','category'=>'special','tier'=>'epic','sort'=>60],
        'earth-master' => ['name'=>'Ahli Bumi','description'=>'Menuntaskan seluruh target Eksplorasi Penuh Bumi.','icon'=>'assets/achievements/16-ahli-bumi.png','category'=>'special','tier'=>'epic','sort'=>70],
        'mars-master' => ['name'=>'Ahli Mars','description'=>'Menuntaskan seluruh target Eksplorasi Penuh Mars.','icon'=>'assets/achievements/17-ahli-mars.png','category'=>'special','tier'=>'epic','sort'=>80],
        'jupiter-master' => ['name'=>'Ahli Jupiter','description'=>'Menuntaskan seluruh target Eksplorasi Penuh Jupiter.','icon'=>'assets/achievements/27-ahli-jupiter.svg','category'=>'special','tier'=>'epic','sort'=>90],
        'saturn-master' => ['name'=>'Ahli Saturnus','description'=>'Menuntaskan seluruh target Eksplorasi Penuh Saturnus.','icon'=>'assets/achievements/28-ahli-saturnus.svg','category'=>'special','tier'=>'epic','sort'=>100],
        'uranus-master' => ['name'=>'Ahli Uranus','description'=>'Menuntaskan seluruh target Eksplorasi Penuh Uranus.','icon'=>'assets/achievements/29-ahli-uranus.svg','category'=>'special','tier'=>'epic','sort'=>110],
        'neptune-master' => ['name'=>'Ahli Neptunus','description'=>'Menuntaskan seluruh target Eksplorasi Penuh Neptunus.','icon'=>'assets/achievements/30-ahli-neptunus.svg','category'=>'special','tier'=>'epic','sort'=>120],
        'solar-master' => ['name'=>'Tata Surya 100%','description'=>'Menyelesaikan seluruh topik Jelajah dan seluruh target Eksplorasi Penuh yang tersedia di ANTARA.','icon'=>'assets/achievements/18-tata-surya-100.png','category'=>'special','tier'=>'legendary','sort'=>130],
        'top-10' => ['name'=>'Top 10','description'=>'Berhasil masuk 10 besar salah satu leaderboard resmi ANTARA.','icon'=>'assets/achievements/19-top-10.png','category'=>'special','tier'=>'legendary','sort'=>140],
        'rank-1' => ['name'=>'Juara #1','description'=>'Pernah mencapai posisi pertama di salah satu leaderboard resmi ANTARA.','icon'=>'assets/achievements/20-juara-1.png','category'=>'special','tier'=>'legendary','sort'=>150],
        'quiz-first' => ['name'=>'Kuis Pertama','description'=>'Menyelesaikan satu tantangan 15 soal Quiz ANTARA sampai garis akhir.','icon'=>'assets/achievements/21-quiz-pertama.svg','category'=>'special','tier'=>'common','sort'=>160],
        'quiz-streak-5' => ['name'=>'Orbit Streak x5','description'=>'Menjawab benar lima soal berturut-turut dalam satu run kuis.','icon'=>'assets/achievements/22-streak-5.svg','category'=>'special','tier'=>'rare','sort'=>170],
        'quiz-speedster' => ['name'=>'Jawaban Kilat','description'=>'Menjawab benar sedikitnya lima soal dalam tiga detik atau kurang pada satu run.','icon'=>'assets/achievements/23-kilat-quiz.svg','category'=>'special','tier'=>'epic','sort'=>180],
        'quiz-perfect' => ['name'=>'Lintasan Sempurna','description'=>'Menuntaskan satu stack 15 soal dengan seluruh jawaban benar pada percobaan pertama.','icon'=>'assets/achievements/24-sempurna-quiz.svg','category'=>'special','tier'=>'legendary','sort'=>190],
        'quiz-master' => ['name'=>'Komandan Kuis','description'=>'Mencapai skor terverifikasi 5.000 poin atau lebih dalam satu run Quiz ANTARA.','icon'=>'assets/achievements/25-master-quiz.svg','category'=>'special','tier'=>'legendary','sort'=>200],

        'sun-complete' => ['name'=>'Matahari Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Matahari.','icon'=>'assets/achievements/01-matahari.png','category'=>'planet','tier'=>'rare','sort'=>210,'planet'=>'sun'],
        'mercury-complete' => ['name'=>'Merkurius Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Merkurius.','icon'=>'assets/achievements/02-merkurius.png','category'=>'planet','tier'=>'rare','sort'=>220,'planet'=>'mercury'],
        'venus-complete' => ['name'=>'Venus Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Venus.','icon'=>'assets/achievements/03-venus.png','category'=>'planet','tier'=>'rare','sort'=>230,'planet'=>'venus'],
        'earth-complete' => ['name'=>'Bumi Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Bumi.','icon'=>'assets/achievements/04-bumi.png','category'=>'planet','tier'=>'rare','sort'=>240,'planet'=>'earth'],
        'mars-complete' => ['name'=>'Mars Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Mars.','icon'=>'assets/achievements/05-mars.png','category'=>'planet','tier'=>'rare','sort'=>250,'planet'=>'mars'],
        'asteroid-complete' => ['name'=>'Sabuk Asteroid Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Sabuk Asteroid.','icon'=>'assets/achievements/06-asteroid.png','category'=>'planet','tier'=>'rare','sort'=>260,'planet'=>'asteroid-belt'],
        'jupiter-complete' => ['name'=>'Jupiter Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Jupiter.','icon'=>'assets/achievements/07-jupiter.png','category'=>'planet','tier'=>'rare','sort'=>270,'planet'=>'jupiter'],
        'saturn-complete' => ['name'=>'Saturnus Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Saturnus.','icon'=>'assets/achievements/08-saturnus.png','category'=>'planet','tier'=>'rare','sort'=>280,'planet'=>'saturn'],
        'uranus-complete' => ['name'=>'Uranus Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Uranus.','icon'=>'assets/achievements/09-uranus.png','category'=>'planet','tier'=>'rare','sort'=>290,'planet'=>'uranus'],
        'neptune-complete' => ['name'=>'Neptunus Tuntas','description'=>'Menyelesaikan seluruh topik Jelajah Neptunus.','icon'=>'assets/achievements/10-neptunus.png','category'=>'planet','tier'=>'rare','sort'=>300,'planet'=>'neptune'],
    ];
}

function antara_achievements_ensure_schema(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS achievements (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            code VARCHAR(60) NOT NULL,
            name VARCHAR(100) NOT NULL,
            description VARCHAR(255) NOT NULL,
            icon VARCHAR(255) NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_achievements_code (code)
        ) ENGINE=InnoDB'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS user_achievements (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            achievement_id BIGINT UNSIGNED NOT NULL,
            unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            notified_at DATETIME NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_user_achievement (user_id, achievement_id),
            KEY idx_user_achievements_user (user_id),
            CONSTRAINT fk_user_achievements_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_user_achievements_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );
    $notifiedColumn = $pdo->query("SHOW COLUMNS FROM user_achievements LIKE 'notified_at'")->fetch();
    if (!$notifiedColumn) {
        $pdo->exec('ALTER TABLE user_achievements ADD COLUMN notified_at DATETIME NULL AFTER unlocked_at');
        // Existing medals predate toast delivery, so mark them as already announced.
        $pdo->exec('UPDATE user_achievements SET notified_at = unlocked_at WHERE notified_at IS NULL');
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS user_activity_events (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NOT NULL,
            event_key VARCHAR(80) NOT NULL,
            event_label VARCHAR(160) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_user_activity_event (user_id, event_key),
            KEY idx_user_activity_user (user_id),
            CONSTRAINT fk_user_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB'
    );

    $stmt = $pdo->prepare(
        'INSERT INTO achievements (code, name, description, icon)
         VALUES (:code, :name, :description, :icon)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), icon = VALUES(icon)'
    );
    foreach (antara_achievement_catalog() as $code => $def) {
        $stmt->execute([
            'code'=>$code,
            'name'=>$def['name'],
            'description'=>$def['description'],
            'icon'=>$def['icon'],
        ]);
    }
}

function antara_achievement_unlock(PDO $pdo, int $userId, string $code, ?string $unlockedAt = null): void
{
    $stmt = $pdo->prepare(
        'INSERT IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at)
         SELECT :user_id, a.id, COALESCE(:unlocked_at, NOW())
         FROM achievements a WHERE a.code = :code LIMIT 1'
    );
    $stmt->execute(['user_id'=>$userId,'unlocked_at'=>$unlockedAt,'code'=>$code]);
}

function antara_achievement_first_event(PDO $pdo, int $userId, string $type): ?array
{
    $stmt = $pdo->prepare(
        'SELECT created_at, planet_code, event_key FROM user_progress_events
         WHERE user_id = :user_id AND event_type = :event_type
         ORDER BY created_at ASC, id ASC LIMIT 1'
    );
    $stmt->execute(['user_id'=>$userId,'event_type'=>$type]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function antara_achievement_full_count(PDO $pdo, int $userId, string $planet): array
{
    $definition = antara_progress_catalog()[$planet] ?? null;
    $allowed = is_array($definition) ? array_fill_keys(array_keys($definition['full'] ?? []), true) : [];
    if (!$allowed) return ['count'=>0,'lastAt'=>null];

    $stmt = $pdo->prepare(
        "SELECT event_key, created_at
         FROM user_progress_events
         WHERE user_id = :user_id AND planet_code = :planet AND event_type = 'full'
         ORDER BY created_at ASC, id ASC"
    );
    $stmt->execute(['user_id'=>$userId,'planet'=>$planet]);
    $visited=[]; $lastAt=null;
    foreach ($stmt->fetchAll() as $row) {
        $key=(string)($row['event_key'] ?? '');
        if (!isset($allowed[$key])) continue;
        $visited[$key]=true;
        $created=(string)($row['created_at'] ?? '');
        if ($created !== '' && ($lastAt === null || $created > $lastAt)) $lastAt=$created;
    }
    return ['count'=>count($visited),'lastAt'=>$lastAt];
}

function antara_achievement_best_rank(PDO $pdo, int $userId): ?int
{
    $ranks = [];
    $completion = antara_completion_user_rank($pdo, $userId);
    if ($completion && ($completion['eligible'] ?? false) && isset($completion['rank'])) {
        $ranks[] = (int)$completion['rank'];
    }
    $game = antara_verified_game_user_rank($pdo, $userId, ANTARA_QUIZ_GAME_CODE);
    if ($game && isset($game['rank'])) {
        $ranks[] = (int)$game['rank'];
    }
    return $ranks ? min($ranks) : null;
}

function antara_quiz_achievement_stats(PDO $pdo, int $userId): array
{
    antara_quiz_ensure_schema($pdo);
    $stmt = $pdo->prepare(
        'SELECT r.id, r.server_score, r.finished_at,
                COUNT(q.id) AS total_questions,
                SUM(CASE WHEN q.is_correct = 1 THEN 1 ELSE 0 END) AS correct_count,
                COALESCE(MAX(q.streak_after),0) AS best_streak,
                SUM(CASE WHEN q.is_correct = 1 AND q.response_ms <= 3000 THEN 1 ELSE 0 END) AS fast_correct,
                SUM(CASE WHEN q.level = 5 AND q.is_correct = 1 THEN 1 ELSE 0 END) AS expert_correct
         FROM game_runs r
         JOIN quiz_run_questions q ON q.run_id = r.id
         WHERE r.user_id = :user_id AND r.game_code = :game_code AND r.status = \'finished\'
         GROUP BY r.id, r.server_score, r.finished_at
         ORDER BY r.finished_at ASC, r.id ASC'
    );
    $stmt->execute(['user_id'=>$userId,'game_code'=>ANTARA_QUIZ_GAME_CODE]);
    $runs = $stmt->fetchAll();
    $stats = [
        'runs'=>count($runs),'firstFinishedAt'=>null,'bestScore'=>0,'bestStreak'=>0,
        'bestCorrect'=>0,'bestFastCorrect'=>0,'perfect'=>false,'expertPerfect'=>false,
    ];
    foreach ($runs as $row) {
        if ($stats['firstFinishedAt'] === null && !empty($row['finished_at'])) $stats['firstFinishedAt']=(string)$row['finished_at'];
        $stats['bestScore']=max($stats['bestScore'],(int)$row['server_score']);
        $stats['bestStreak']=max($stats['bestStreak'],(int)$row['best_streak']);
        $firstTryStmt = $pdo->prepare(
            'SELECT COALESCE(SUM(first_try_correct),0) FROM quiz_run_questions WHERE run_id = :run_id'
        );
        $firstTryStmt->execute(['run_id'=>(int)$row['id']]);
        $firstTryCorrect=(int)($firstTryStmt->fetchColumn() ?: 0);
        $stats['bestCorrect']=max($stats['bestCorrect'],$firstTryCorrect);
        $stats['bestFastCorrect']=max($stats['bestFastCorrect'],(int)$row['fast_correct']);
        if ($firstTryCorrect >= ANTARA_QUIZ_STACK_SIZE) $stats['perfect']=true;
    }
    return $stats;
}

function antara_achievements_sync(PDO $pdo, int $userId): array
{
    antara_progress_ensure_schema($pdo);
    antara_leaderboard_ensure_schema($pdo);
    antara_achievements_ensure_schema($pdo);

    $summary = antara_progress_summary($pdo, $userId);
    antara_completion_sync($pdo, $userId, $summary);

    $userStmt = $pdo->prepare('SELECT created_at FROM users WHERE id = :user_id LIMIT 1');
    $userStmt->execute(['user_id'=>$userId]);
    $createdAt = $userStmt->fetchColumn();
    antara_achievement_unlock($pdo, $userId, 'first-step', is_string($createdAt) ? $createdAt : null);

    $launchStmt = $pdo->prepare('SELECT created_at FROM user_activity_events WHERE user_id = :user_id AND event_key = \'first-launch\' LIMIT 1');
    $launchStmt->execute(['user_id'=>$userId]);
    $launchAt = $launchStmt->fetchColumn();
    if ($launchAt) antara_achievement_unlock($pdo, $userId, 'first-launch', (string)$launchAt);

    $firstNormal = antara_achievement_first_event($pdo, $userId, 'normal');
    if ($firstNormal) antara_achievement_unlock($pdo, $userId, 'first-explore', (string)$firstNormal['created_at']);
    $firstFull = antara_achievement_first_event($pdo, $userId, 'full');
    if ($firstFull) antara_achievement_unlock($pdo, $userId, 'first-full', (string)$firstFull['created_at']);

    foreach (antara_progress_catalog() as $planet => $definition) {
        $required = count($definition['full'] ?? []);
        if ($required < 1) continue;
        $code = $planet . '-master';
        if (!isset(antara_achievement_catalog()[$code])) continue;
        $data = antara_achievement_full_count($pdo, $userId, $planet);
        if ($data['count'] >= $required) {
            antara_achievement_unlock($pdo, $userId, $code, $data['lastAt'] ? (string)$data['lastAt'] : null);
        }
    }

    $planetsByCode = [];
    foreach ($summary['planets'] as $planet) {
        $planetsByCode[$planet['planet']] = $planet;
        $normal = $planet['normal'] ?? [];
        $normalTotal = (int)($normal['total'] ?? 0);
        $normalCompleted = (int)($normal['completed'] ?? 0);
        if ($normalTotal > 0 && $normalCompleted >= $normalTotal) {
            $code = $planet['planet'] === 'asteroid-belt' ? 'asteroid-complete' : $planet['planet'] . '-complete';
            antara_achievement_unlock($pdo, $userId, $code, $planet['updatedAt'] ?? null);
        }
    }

    if ((int)($summary['overall']['progress'] ?? 0) >= 100) {
        antara_achievement_unlock($pdo, $userId, 'solar-master', $summary['overall']['updatedAt'] ?? null);
    }

    $bestRank = antara_achievement_best_rank($pdo, $userId);
    if ($bestRank !== null && $bestRank <= 10) antara_achievement_unlock($pdo, $userId, 'top-10');
    if ($bestRank === 1) antara_achievement_unlock($pdo, $userId, 'rank-1');

    $quizStats = antara_quiz_achievement_stats($pdo, $userId);
    if ($quizStats['runs'] >= 1) antara_achievement_unlock($pdo, $userId, 'quiz-first', $quizStats['firstFinishedAt']);
    if ($quizStats['bestStreak'] >= 5) antara_achievement_unlock($pdo, $userId, 'quiz-streak-5');
    if ($quizStats['bestFastCorrect'] >= 5) antara_achievement_unlock($pdo, $userId, 'quiz-speedster');
    if ($quizStats['perfect']) antara_achievement_unlock($pdo, $userId, 'quiz-perfect');
    if ($quizStats['bestScore'] >= 5000) antara_achievement_unlock($pdo, $userId, 'quiz-master');

    return ['summary'=>$summary,'planets'=>$planetsByCode,'bestRank'=>$bestRank,'quiz'=>$quizStats];
}

function antara_achievements_payload(PDO $pdo, int $userId): array
{
    $sync = antara_achievements_sync($pdo, $userId);
    $catalog = antara_achievement_catalog();

    $stmt = $pdo->prepare(
        'SELECT a.code, ua.unlocked_at
         FROM user_achievements ua
         JOIN achievements a ON a.id = ua.achievement_id
         WHERE ua.user_id = :user_id'
    );
    $stmt->execute(['user_id'=>$userId]);
    $unlocked = [];
    foreach ($stmt->fetchAll() as $row) $unlocked[(string)$row['code']] = (string)$row['unlocked_at'];

    $normalStmt = $pdo->prepare('SELECT COUNT(*) FROM user_progress_events WHERE user_id = :user_id AND event_type = \'normal\'');
    $normalStmt->execute(['user_id'=>$userId]);
    $normalCount=(int)$normalStmt->fetchColumn();
    $fullStmt = $pdo->prepare('SELECT COUNT(*) FROM user_progress_events WHERE user_id = :user_id AND event_type = \'full\'');
    $fullStmt->execute(['user_id'=>$userId]);
    $fullCount=(int)$fullStmt->fetchColumn();
    $launchStmt=$pdo->prepare('SELECT COUNT(*) FROM user_activity_events WHERE user_id=:user_id AND event_key=\'first-launch\'');
    $launchStmt->execute(['user_id'=>$userId]);
    $launchCount=(int)$launchStmt->fetchColumn();

    $items=[];
    foreach ($catalog as $code=>$def) {
        $current=0; $goal=1; $progressLabel='Belum dimulai';
        if ($code==='first-step') { $current=1; $progressLabel='Identitas aktif'; }
        elseif ($code==='first-launch') { $current=min(1,$launchCount); $progressLabel=$current?'Peluncuran tercatat':'Mulai perjalanan dari kokpit'; }
        elseif ($code==='first-explore') { $current=min(1,$normalCount); $progressLabel=$current?'Jelajah pertama tercatat':'Buka satu topik Jelajah'; }
        elseif ($code==='first-full') { $current=min(1,$fullCount); $progressLabel=$current?'Eksplorasi penuh tercatat':'Masuki satu destinasi penuh'; }
        elseif (str_ends_with($code, '-master') && !in_array($code, ['solar-master','quiz-master'], true)) {
            $planet = substr($code, 0, -7);
            $definition = antara_progress_catalog()[$planet] ?? null;
            $goal = is_array($definition) ? count($definition['full'] ?? []) : 0;
            $data = $goal > 0 ? antara_achievement_full_count($pdo,$userId,$planet) : ['count'=>0,'lastAt'=>null];
            $current = min($goal, (int)$data['count']);
            $progressLabel = $current.' / '.$goal.' target Eksplorasi Penuh';
        }
        elseif ($code==='quiz-first') { $goal=1; $current=min(1,(int)($sync['quiz']['runs'] ?? 0)); $progressLabel=$current?'Run pertama selesai':'Selesaikan satu run kuis'; }
        elseif ($code==='quiz-streak-5') { $goal=5; $current=min($goal,(int)($sync['quiz']['bestStreak'] ?? 0)); $progressLabel=$current.' / '.$goal.' streak'; }
        elseif ($code==='quiz-speedster') { $goal=5; $current=min($goal,(int)($sync['quiz']['bestFastCorrect'] ?? 0)); $progressLabel=$current.' / '.$goal.' jawaban ≤ 3 detik'; }
        elseif ($code==='quiz-perfect') { $goal=ANTARA_QUIZ_QUESTION_COUNT; $current=min($goal,(int)($sync['quiz']['bestCorrect'] ?? 0)); $progressLabel=$current.' / '.$goal.' benar'; }
        elseif ($code==='quiz-master') { $goal=5000; $current=min($goal,(int)($sync['quiz']['bestScore'] ?? 0)); $progressLabel=number_format($current,0,',','.').' / '.number_format($goal,0,',','.').' poin'; }
        elseif ($code==='solar-master') {
            $current=(int)($sync['summary']['overall']['completedMilestones'] ?? 0); $goal=(int)($sync['summary']['overall']['totalMilestones'] ?? array_sum(array_map(static fn($d)=>(int)$d['normal_total']+count($d['full'] ?? []), antara_progress_catalog())));
            $progressLabel=$current.' / '.$goal.' milestone';
        }
        elseif ($code==='top-10') {
            $rank=$sync['bestRank']; $current=($rank!==null && $rank<=10)?1:0; $progressLabel=$rank!==null?'Posisi terbaik #'.$rank:'Belum memiliki posisi leaderboard';
        }
        elseif ($code==='rank-1') {
            $rank=$sync['bestRank']; $current=$rank===1?1:0; $progressLabel=$rank!==null?'Posisi terbaik #'.$rank:'Belum memiliki posisi leaderboard';
        }
        elseif (isset($def['planet'])) {
            $planet=$sync['planets'][$def['planet']] ?? null;
            $normal=is_array($planet) ? ($planet['normal'] ?? []) : [];
            $current=(int)($normal['completed'] ?? 0); $goal=(int)($normal['total'] ?? 0);
            $progressLabel=$current.' / '.$goal.' topik Jelajah';
        }

        $items[]=[
            'code'=>$code,'name'=>$def['name'],'description'=>$def['description'],'icon'=>$def['icon'],
            'category'=>$def['category'],'tier'=>$def['tier'],'sort'=>$def['sort'],
            'unlocked'=>isset($unlocked[$code]),'unlockedAt'=>$unlocked[$code] ?? null,
            'progress'=>['current'=>$current,'goal'=>$goal,'percent'=>$goal>0?(int)round(min(1,$current/$goal)*100):0,'label'=>$progressLabel],
        ];
    }
    usort($items, static fn($a,$b)=>$a['sort']<=>$b['sort']);
    $count=count($unlocked);
    return ['items'=>$items,'summary'=>['unlocked'=>$count,'total'=>count($catalog),'percent'=>(int)round(($count/count($catalog))*100)],'bestRank'=>$sync['bestRank']];
}

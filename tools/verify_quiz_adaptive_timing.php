<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/api/quiz/_quiz.php';

$bank = antara_quiz_bank();
if (count($bank) !== 300) {
    fwrite(STDERR, "FAIL: expected 300 questions, got " . count($bank) . PHP_EOL);
    exit(1);
}

$expectedObserved = [
    1 => [17000, 22000],
    2 => [10000, 15000],
    3 => [10000, 14000],
    4 => [18000, 25000],
    5 => [20000, 28000],
];

$byLevel = [];
foreach ($bank as $id => $question) {
    $level = (int)$question['level'];
    $timeMs = antara_quiz_question_time_ms($question);
    $config = antara_quiz_level_config($level);
    if ($timeMs < (int)$config['minTimeMs'] || $timeMs > (int)$config['maxTimeMs']) {
        fwrite(STDERR, "FAIL: question {$id} has {$timeMs}ms outside level {$level} clamp." . PHP_EOL);
        exit(1);
    }
    if ($timeMs % 1000 !== 0) {
        fwrite(STDERR, "FAIL: question {$id} timer is not rounded to whole seconds." . PHP_EOL);
        exit(1);
    }
    $byLevel[$level][] = $timeMs;
}

foreach ($expectedObserved as $level => [$expectedMin, $expectedMax]) {
    $values = $byLevel[$level] ?? [];
    if (count($values) !== 60) {
        fwrite(STDERR, "FAIL: level {$level} expected 60 questions, got " . count($values) . PHP_EOL);
        exit(1);
    }
    sort($values);
    $min = min($values);
    $max = max($values);
    $avg = array_sum($values) / count($values);
    if ($min !== $expectedMin || $max !== $expectedMax) {
        fwrite(STDERR, "FAIL: level {$level} observed range changed to {$min}-{$max}ms." . PHP_EOL);
        exit(1);
    }
    printf("PASS L%d: %d questions, %d-%ds, avg %.1fs\n", $level, count($values), $min / 1000, $max / 1000, $avg / 1000);
}

$spotChecks = [130 => 10000, 1 => 19000, 192 => 25000, 241 => 27000, 269 => 28000, 300 => 26000];
foreach ($spotChecks as $id => $expected) {
    $actual = antara_quiz_question_time_ms($bank[$id]);
    if ($actual !== $expected) {
        fwrite(STDERR, "FAIL: question {$id} expected {$expected}ms, got {$actual}ms." . PHP_EOL);
        exit(1);
    }
    printf("PASS Q%03d: %.0fs\n", $id, $actual / 1000);
}

echo "PASS: adaptive timing verified for all 300 questions." . PHP_EOL;

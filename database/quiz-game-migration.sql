USE antara;

-- Quiz ANTARA uses the secure game_runs + verified_game_scores tables from leaderboard-migration.sql.
CREATE TABLE IF NOT EXISTS quiz_run_questions (
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
) ENGINE=InnoDB;

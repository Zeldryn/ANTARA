USE antara;

CREATE TABLE IF NOT EXISTS exploration_completions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  completed_at DATETIME NOT NULL,
  completion_event_id BIGINT UNSIGNED NULL,
  first_progress_at DATETIME NULL,
  elapsed_seconds INT UNSIGNED NULL,
  total_milestones SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  eligible TINYINT(1) NOT NULL DEFAULT 0,
  integrity_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_exploration_completion_user (user_id),
  KEY idx_exploration_rank (eligible, completed_at, completion_event_id, id),
  CONSTRAINT fk_exploration_completion_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS game_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  game_code VARCHAR(40) NOT NULL,
  run_token_hash CHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS verified_game_scores (
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
) ENGINE=InnoDB;

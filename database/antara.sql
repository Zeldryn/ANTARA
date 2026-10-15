CREATE DATABASE IF NOT EXISTS antara
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE antara;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(60) NOT NULL,
  username VARCHAR(20) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  bio VARCHAR(280) NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  planet_code VARCHAR(40) NOT NULL,
  progress_percent TINYINT UNSIGNED NOT NULL DEFAULT 0,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_progress_planet (user_id, planet_code),
  KEY idx_user_progress_user (user_id),
  CONSTRAINT fk_user_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_user_progress_percent CHECK (progress_percent BETWEEN 0 AND 100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_progress_events (
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS game_scores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  game_code VARCHAR(40) NOT NULL DEFAULT 'general',
  score BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_scores_game_score (game_code, score),
  KEY idx_scores_user (user_id),
  CONSTRAINT fk_game_scores_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS achievements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_achievements_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_achievements (
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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_activity_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  event_key VARCHAR(80) NOT NULL,
  event_label VARCHAR(160) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_activity_event (user_id, event_key),
  KEY idx_user_activity_user (user_id),
  CONSTRAINT fk_user_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Secure leaderboard: authoritative completion ranking and verified game scores.
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

-- Quiz ANTARA: authoritative per-question timing and scoring.
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
  attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  first_try_correct TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quiz_run_position (run_id, position),
  KEY idx_quiz_run_question (run_id, question_id),
  CONSTRAINT fk_quiz_question_run FOREIGN KEY (run_id) REFERENCES game_runs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

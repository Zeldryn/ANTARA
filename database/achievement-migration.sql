USE antara;

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

-- The achievement catalog is seeded/updated automatically by api/achievements/_achievements.php.

-- Upgrade path for projects that already had achievements before unlock notifications.
SET @has_notified_at := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_achievements' AND COLUMN_NAME = 'notified_at');
SET @add_notified_at := IF(@has_notified_at = 0, 'ALTER TABLE user_achievements ADD COLUMN notified_at DATETIME NULL AFTER unlocked_at', 'SELECT 1');
PREPARE achievement_upgrade_stmt FROM @add_notified_at;
EXECUTE achievement_upgrade_stmt;
DEALLOCATE PREPARE achievement_upgrade_stmt;
SET @seed_notified_at := IF(@has_notified_at = 0, 'UPDATE user_achievements SET notified_at = unlocked_at WHERE notified_at IS NULL', 'SELECT 1');
PREPARE achievement_seed_stmt FROM @seed_notified_at;
EXECUTE achievement_seed_stmt;
DEALLOCATE PREPARE achievement_seed_stmt;

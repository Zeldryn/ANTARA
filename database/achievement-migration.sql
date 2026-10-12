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

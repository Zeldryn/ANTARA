USE antara;

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

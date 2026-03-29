CREATE TABLE notification_channels (
  notification_channel_id VARCHAR(50) PRIMARY KEY,
  channel_code VARCHAR(50) NOT NULL UNIQUE,
  channel_name VARCHAR(100) NOT NULL,
  provider VARCHAR(100),
  channel_type VARCHAR(50),
  status VARCHAR(50) NOT NULL
);

CREATE TABLE notification_preferences (
  notification_preference_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  preference_status VARCHAR(50) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_json TEXT,
  allowed_message_types_json TEXT,
  daily_send_limit INTEGER,
  priority_rule_json TEXT,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_notification_preferences_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_notification_preferences_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_notification_preferences_channel
    FOREIGN KEY (channel_id) REFERENCES notification_channels (notification_channel_id)
);

CREATE TABLE notification_messages (
  notification_message_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  assistant_instance_id VARCHAR(50),
  job_id VARCHAR(50),
  message_type VARCHAR(50) NOT NULL,
  message_subject VARCHAR(255),
  message_body_ref VARCHAR(255),
  delivery_status VARCHAR(50) NOT NULL,
  provider_message_id VARCHAR(255),
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  failed_at TIMESTAMP NULL,
  error_message TEXT,
  CONSTRAINT fk_notification_messages_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_notification_messages_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_notification_messages_channel
    FOREIGN KEY (channel_id) REFERENCES notification_channels (notification_channel_id),
  CONSTRAINT fk_notification_messages_assistant_instance
    FOREIGN KEY (assistant_instance_id) REFERENCES assistant_instances (assistant_instance_id),
  CONSTRAINT fk_notification_messages_job
    FOREIGN KEY (job_id) REFERENCES jobs (job_id)
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences (user_id);
CREATE INDEX idx_notification_messages_user_id ON notification_messages (user_id);

-- Ankyra 第一批 SQL Migration 草稿
-- Date: 2026-03-29
-- Scope: MVP initial schema draft

-- 0001_init_identity

CREATE TABLE organizations (
  organization_id VARCHAR(50) PRIMARY KEY,
  organization_code VARCHAR(50) NOT NULL UNIQUE,
  organization_name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  default_language VARCHAR(20),
  default_timezone VARCHAR(100),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE users (
  user_id VARCHAR(50) PRIMARY KEY,
  user_code VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  preferred_language VARCHAR(20),
  timezone VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  default_organization_id VARCHAR(50),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  last_login_at TIMESTAMP NULL,
  CONSTRAINT fk_users_default_organization
    FOREIGN KEY (default_organization_id) REFERENCES organizations (organization_id)
);

CREATE TABLE memberships (
  membership_id VARCHAR(50) PRIMARY KEY,
  organization_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  membership_status VARCHAR(50) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP NULL,
  CONSTRAINT fk_memberships_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_memberships_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE oauth_identities (
  oauth_identity_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_subject VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  provider_tenant_id VARCHAR(255),
  access_scope_snapshot TEXT,
  linked_at TIMESTAMP NOT NULL,
  last_login_at TIMESTAMP NULL,
  status VARCHAR(50) NOT NULL,
  CONSTRAINT fk_oauth_identities_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT uq_oauth_provider_subject UNIQUE (provider, provider_subject)
);

CREATE INDEX idx_memberships_org ON memberships (organization_id);
CREATE INDEX idx_memberships_user ON memberships (user_id);
CREATE INDEX idx_oauth_user ON oauth_identities (user_id);

-- 0002_init_assistants

CREATE TABLE assistant_definitions (
  assistant_definition_id VARCHAR(50) PRIMARY KEY,
  assistant_code VARCHAR(50) NOT NULL UNIQUE,
  assistant_name VARCHAR(255) NOT NULL,
  assistant_description TEXT,
  work_type VARCHAR(100) NOT NULL,
  capability_level VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  default_visibility VARCHAR(50),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE assistant_versions (
  assistant_version_id VARCHAR(50) PRIMARY KEY,
  assistant_definition_id VARCHAR(50) NOT NULL,
  version_number VARCHAR(50) NOT NULL,
  version_label VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  system_prompt_ref VARCHAR(255),
  developer_prompt_ref VARCHAR(255),
  model_policy_id VARCHAR(50),
  memory_policy_id VARCHAR(50),
  tool_policy_id VARCHAR(50),
  output_policy_id VARCHAR(50),
  approval_policy_id VARCHAR(50),
  pricing_version_id VARCHAR(50),
  effective_from TIMESTAMP NULL,
  effective_to TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL,
  created_by VARCHAR(50),
  CONSTRAINT fk_assistant_versions_definition
    FOREIGN KEY (assistant_definition_id) REFERENCES assistant_definitions (assistant_definition_id)
);

CREATE TABLE assistant_instances (
  assistant_instance_id VARCHAR(50) PRIMARY KEY,
  assistant_definition_id VARCHAR(50) NOT NULL,
  assistant_version_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  instance_name VARCHAR(255),
  instance_status VARCHAR(50) NOT NULL,
  activated_at TIMESTAMP NULL,
  deactivated_at TIMESTAMP NULL,
  last_used_at TIMESTAMP NULL,
  subscription_id VARCHAR(50),
  approval_status VARCHAR(50) NOT NULL,
  approved_by VARCHAR(50),
  approved_at TIMESTAMP NULL,
  CONSTRAINT fk_assistant_instances_definition
    FOREIGN KEY (assistant_definition_id) REFERENCES assistant_definitions (assistant_definition_id),
  CONSTRAINT fk_assistant_instances_version
    FOREIGN KEY (assistant_version_id) REFERENCES assistant_versions (assistant_version_id),
  CONSTRAINT fk_assistant_instances_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_assistant_instances_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
);

CREATE INDEX idx_assistant_versions_definition ON assistant_versions (assistant_definition_id);
CREATE INDEX idx_assistant_instances_user ON assistant_instances (user_id);
CREATE INDEX idx_assistant_instances_org ON assistant_instances (organization_id);

-- 0003_init_conversations

CREATE TABLE conversations (
  conversation_id VARCHAR(50) PRIMARY KEY,
  assistant_instance_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  openai_conversation_id VARCHAR(255),
  channel VARCHAR(50),
  conversation_status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP NULL,
  archived_at TIMESTAMP NULL,
  CONSTRAINT fk_conversations_assistant_instance
    FOREIGN KEY (assistant_instance_id) REFERENCES assistant_instances (assistant_instance_id),
  CONSTRAINT fk_conversations_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_conversations_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
);

CREATE TABLE conversation_events (
  conversation_event_id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_sequence INTEGER NOT NULL,
  actor_type VARCHAR(50) NOT NULL,
  actor_id VARCHAR(50),
  content_json TEXT,
  tool_name VARCHAR(100),
  policy_ref VARCHAR(100),
  trace_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_conversation_events_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id),
  CONSTRAINT uq_conversation_event_sequence UNIQUE (conversation_id, event_sequence)
);

CREATE TABLE conversation_summaries (
  conversation_summary_id VARCHAR(50) PRIMARY KEY,
  conversation_id VARCHAR(50) NOT NULL,
  summary_type VARCHAR(50) NOT NULL,
  summary_text TEXT,
  summary_json TEXT,
  source_event_start_seq INTEGER,
  source_event_end_seq INTEGER,
  generated_at TIMESTAMP NOT NULL,
  generated_by_version_id VARCHAR(50),
  CONSTRAINT fk_conversation_summaries_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id)
);

CREATE INDEX idx_conversations_assistant_instance ON conversations (assistant_instance_id);
CREATE INDEX idx_conversations_user ON conversations (user_id);
CREATE INDEX idx_conversation_events_conversation ON conversation_events (conversation_id);

-- 0004_init_memories

CREATE TABLE memories (
  memory_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  assistant_instance_id VARCHAR(50) NULL,
  conversation_id VARCHAR(50) NULL,
  memory_type VARCHAR(50) NOT NULL,
  memory_scope VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  content_text TEXT,
  content_json TEXT,
  source_type VARCHAR(50),
  confidence_score DECIMAL(5,4),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  expired_at TIMESTAMP NULL,
  CONSTRAINT fk_memories_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_memories_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_memories_assistant_instance
    FOREIGN KEY (assistant_instance_id) REFERENCES assistant_instances (assistant_instance_id),
  CONSTRAINT fk_memories_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id)
);

CREATE INDEX idx_memories_user ON memories (user_id);
CREATE INDEX idx_memories_assistant_instance ON memories (assistant_instance_id);

-- 0005_init_connectors

CREATE TABLE connector_accounts (
  connector_account_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  provider_type VARCHAR(50) NOT NULL,
  external_account_id VARCHAR(255),
  account_email VARCHAR(255),
  account_display_name VARCHAR(255),
  connection_status VARCHAR(50) NOT NULL,
  linked_at TIMESTAMP NOT NULL,
  last_verified_at TIMESTAMP NULL,
  revoked_at TIMESTAMP NULL,
  CONSTRAINT fk_connector_accounts_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_connector_accounts_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
);

CREATE TABLE connector_sync_states (
  connector_sync_state_id VARCHAR(50) PRIMARY KEY,
  connector_account_id VARCHAR(50) NOT NULL,
  sync_target VARCHAR(50) NOT NULL,
  last_sync_at TIMESTAMP NULL,
  last_success_at TIMESTAMP NULL,
  last_sync_cursor TEXT,
  last_sync_status VARCHAR(50),
  last_error_message TEXT,
  next_sync_at TIMESTAMP NULL,
  CONSTRAINT fk_connector_sync_states_account
    FOREIGN KEY (connector_account_id) REFERENCES connector_accounts (connector_account_id)
);

CREATE INDEX idx_connector_accounts_user ON connector_accounts (user_id);
CREATE INDEX idx_connector_sync_states_account ON connector_sync_states (connector_account_id);

-- 0006_init_jobs_and_snapshots

CREATE TABLE jobs (
  job_id VARCHAR(50) PRIMARY KEY,
  schedule_id VARCHAR(50),
  job_type VARCHAR(50) NOT NULL,
  job_status VARCHAR(50) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL,
  assistant_instance_id VARCHAR(50),
  user_id VARCHAR(50),
  organization_id VARCHAR(50),
  input_payload_ref VARCHAR(255),
  output_payload_ref VARCHAR(255),
  started_at TIMESTAMP NULL,
  finished_at TIMESTAMP NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  CONSTRAINT fk_jobs_assistant_instance
    FOREIGN KEY (assistant_instance_id) REFERENCES assistant_instances (assistant_instance_id),
  CONSTRAINT fk_jobs_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_jobs_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
);

CREATE TABLE task_snapshots (
  task_snapshot_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  assistant_instance_id VARCHAR(50) NOT NULL,
  source_job_id VARCHAR(50) NOT NULL,
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(50) NOT NULL,
  content_json TEXT NOT NULL,
  generated_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_task_snapshots_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_task_snapshots_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_task_snapshots_assistant_instance
    FOREIGN KEY (assistant_instance_id) REFERENCES assistant_instances (assistant_instance_id),
  CONSTRAINT fk_task_snapshots_job
    FOREIGN KEY (source_job_id) REFERENCES jobs (job_id)
);

CREATE TABLE briefing_snapshots (
  briefing_snapshot_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  organization_id VARCHAR(50) NOT NULL,
  assistant_instance_id VARCHAR(50) NOT NULL,
  source_job_id VARCHAR(50) NOT NULL,
  briefing_date DATE NOT NULL,
  briefing_type VARCHAR(50) NOT NULL,
  content_text TEXT,
  content_json TEXT,
  generated_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_briefing_snapshots_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_briefing_snapshots_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_briefing_snapshots_assistant_instance
    FOREIGN KEY (assistant_instance_id) REFERENCES assistant_instances (assistant_instance_id),
  CONSTRAINT fk_briefing_snapshots_job
    FOREIGN KEY (source_job_id) REFERENCES jobs (job_id)
);

-- 0007_init_notifications

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

-- 0008_init_governance

CREATE TABLE policies (
  policy_id VARCHAR(50) PRIMARY KEY,
  policy_code VARCHAR(50) NOT NULL UNIQUE,
  policy_name VARCHAR(255) NOT NULL,
  policy_type VARCHAR(50) NOT NULL,
  policy_scope VARCHAR(50) NOT NULL,
  policy_content_json TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  version VARCHAR(50),
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE tool_policies (
  tool_policy_id VARCHAR(50) PRIMARY KEY,
  assistant_version_id VARCHAR(50) NOT NULL,
  tool_code VARCHAR(100) NOT NULL,
  access_mode VARCHAR(50) NOT NULL,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_operations_json TEXT,
  status VARCHAR(50) NOT NULL,
  CONSTRAINT fk_tool_policies_assistant_version
    FOREIGN KEY (assistant_version_id) REFERENCES assistant_versions (assistant_version_id)
);

CREATE TABLE approval_records (
  approval_record_id VARCHAR(50) PRIMARY KEY,
  organization_id VARCHAR(50) NOT NULL,
  request_type VARCHAR(50) NOT NULL,
  request_target_type VARCHAR(50) NOT NULL,
  request_target_id VARCHAR(50) NOT NULL,
  requested_by VARCHAR(50) NOT NULL,
  requested_at TIMESTAMP NOT NULL,
  approval_status VARCHAR(50) NOT NULL,
  approved_by VARCHAR(50),
  approved_at TIMESTAMP NULL,
  rejected_by VARCHAR(50),
  rejected_at TIMESTAMP NULL,
  reason TEXT,
  comments TEXT,
  CONSTRAINT fk_approval_records_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
);

CREATE TABLE audit_logs (
  audit_log_id VARCHAR(50) PRIMARY KEY,
  organization_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50),
  actor_type VARCHAR(50) NOT NULL,
  actor_id VARCHAR(50),
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(100),
  target_id VARCHAR(50),
  result_status VARCHAR(50) NOT NULL,
  reason TEXT,
  trace_id VARCHAR(100),
  metadata_json TEXT,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_audit_logs_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- 0009_init_billing_min

CREATE TABLE plans (
  plan_id VARCHAR(50) PRIMARY KEY,
  plan_code VARCHAR(50) NOT NULL UNIQUE,
  plan_name VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) NOT NULL,
  target_scope VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  default_pricing_version_id VARCHAR(50),
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE subscriptions (
  subscription_id VARCHAR(50) PRIMARY KEY,
  plan_id VARCHAR(50) NOT NULL,
  subscriber_type VARCHAR(50) NOT NULL,
  subscriber_id VARCHAR(50) NOT NULL,
  subscription_status VARCHAR(50) NOT NULL,
  pricing_version_id VARCHAR(50),
  started_at TIMESTAMP NOT NULL,
  trial_ends_at TIMESTAMP NULL,
  current_period_start TIMESTAMP NULL,
  current_period_end TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_subscriptions_plan
    FOREIGN KEY (plan_id) REFERENCES plans (plan_id)
);

CREATE TABLE usage_records (
  usage_record_id VARCHAR(50) PRIMARY KEY,
  subscription_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50),
  organization_id VARCHAR(50),
  assistant_instance_id VARCHAR(50),
  usage_type VARCHAR(50) NOT NULL,
  usage_quantity DECIMAL(18,4) NOT NULL,
  usage_unit VARCHAR(50) NOT NULL,
  usage_period_date DATE NOT NULL,
  source_ref_type VARCHAR(50),
  source_ref_id VARCHAR(50),
  recorded_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_usage_records_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id),
  CONSTRAINT fk_usage_records_user
    FOREIGN KEY (user_id) REFERENCES users (user_id),
  CONSTRAINT fk_usage_records_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (organization_id),
  CONSTRAINT fk_usage_records_assistant_instance
    FOREIGN KEY (assistant_instance_id) REFERENCES assistant_instances (assistant_instance_id)
);

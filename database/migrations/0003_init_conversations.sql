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

CREATE INDEX idx_conversations_user_id ON conversations (user_id);
CREATE INDEX idx_conversations_assistant_instance_id ON conversations (assistant_instance_id);
CREATE INDEX idx_conversation_events_conversation_id ON conversation_events (conversation_id);

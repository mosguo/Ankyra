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

CREATE INDEX idx_memories_user_id ON memories (user_id);
CREATE INDEX idx_memories_assistant_instance_id ON memories (assistant_instance_id);

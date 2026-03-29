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

CREATE INDEX idx_assistant_versions_definition_id ON assistant_versions (assistant_definition_id);
CREATE INDEX idx_assistant_instances_user_id ON assistant_instances (user_id);
CREATE INDEX idx_assistant_instances_organization_id ON assistant_instances (organization_id);

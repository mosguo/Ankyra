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

CREATE INDEX idx_tool_policies_version_id ON tool_policies (assistant_version_id);
CREATE INDEX idx_approval_records_org_status ON approval_records (organization_id, approval_status);
CREATE INDEX idx_audit_logs_org_created_at ON audit_logs (organization_id, created_at);

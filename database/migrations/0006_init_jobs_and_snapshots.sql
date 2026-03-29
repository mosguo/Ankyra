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

CREATE INDEX idx_jobs_user_id ON jobs (user_id);
CREATE INDEX idx_task_snapshots_user_date ON task_snapshots (user_id, snapshot_date);
CREATE INDEX idx_briefing_snapshots_user_date ON briefing_snapshots (user_id, briefing_date);

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

CREATE INDEX idx_subscriptions_plan_id ON subscriptions (plan_id);
CREATE INDEX idx_usage_records_subscription_id ON usage_records (subscription_id);

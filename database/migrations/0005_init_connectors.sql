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

CREATE INDEX idx_connector_accounts_user_id ON connector_accounts (user_id);
CREATE INDEX idx_connector_accounts_organization_id ON connector_accounts (organization_id);
CREATE INDEX idx_connector_sync_states_account_id ON connector_sync_states (connector_account_id);

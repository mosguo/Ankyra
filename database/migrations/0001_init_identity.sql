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

CREATE INDEX idx_memberships_organization_id ON memberships (organization_id);
CREATE INDEX idx_memberships_user_id ON memberships (user_id);
CREATE INDEX idx_oauth_identities_user_id ON oauth_identities (user_id);

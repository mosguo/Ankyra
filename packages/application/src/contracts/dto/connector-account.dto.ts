export interface ConnectorAccountDto {
  connector_account_id: string;
  provider_type: string;
  account_email?: string;
  connection_status: string;
  authorization_mode?: "demo" | "oauth2";
  requires_reconnect?: boolean;
  last_verified_at?: string;
  last_sync_status?: string;
  last_sync_at?: string;
  next_sync_at?: string;
}

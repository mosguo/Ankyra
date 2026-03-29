export interface ConnectorSyncStateEntity {
  connector_sync_state_id: string;
  connector_account_id: string;
  sync_target: string;
  last_sync_status?: string;
}

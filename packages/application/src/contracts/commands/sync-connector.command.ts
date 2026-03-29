export interface SyncConnectorCommand {
  connector_account_id: string;
  operator_id: string;
  source_job_id?: string;
  sync_target?: "mail" | "calendar" | "tasks";
}

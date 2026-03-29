export interface RunJobCommand {
  user_id: string;
  organization_id: string;
  schedule_id?: string;
  connector_account_id?: string;
  job_type: "connector_sync";
  trigger_type?: "manual" | "scheduled";
}

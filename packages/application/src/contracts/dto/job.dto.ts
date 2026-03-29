export interface JobDto {
  job_id: string;
  schedule_id?: string;
  connector_account_id?: string;
  job_type: string;
  job_status: string;
  trigger_type: string;
  started_at?: string;
  finished_at?: string;
  retry_count?: number;
  error_message?: string;
}

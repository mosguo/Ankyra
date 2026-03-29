export interface ScheduleDto {
  schedule_id: string;
  schedule_type: string;
  schedule_name: string;
  timezone: string;
  cron_or_rule: string;
  is_enabled: boolean;
  connector_account_id?: string;
  last_run_at?: string;
  next_run_at?: string;
}

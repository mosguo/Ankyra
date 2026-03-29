export interface CreateScheduleCommand {
  user_id: string;
  organization_id: string;
  connector_account_id?: string;
  assistant_instance_id?: string;
  schedule_type: string;
  schedule_name: string;
  timezone: string;
  cron_or_rule: string;
}

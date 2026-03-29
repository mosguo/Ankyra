export interface UpdateNotificationPreferenceCommand {
  notification_preference_id: string;
  preference_status: string;
  is_default: boolean;
  quiet_hours_json?: unknown;
  allowed_message_types_json?: string[];
  daily_send_limit?: number;
}

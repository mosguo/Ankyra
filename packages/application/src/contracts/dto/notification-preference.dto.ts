export interface NotificationPreferenceDto {
  notification_preference_id: string;
  channel_code: string;
  preference_status: string;
  is_default: boolean;
  quiet_hours?: unknown;
  allowed_message_types?: string[];
  daily_send_limit?: number;
}

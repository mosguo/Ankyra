import { Injectable } from "@nestjs/common";
import { UpdateNotificationPreferenceCommand } from "../contracts/commands/update-notification-preference.command";
import { NotificationPreferenceDto } from "../contracts/dto/notification-preference.dto";
import { ListNotificationPreferencesQuery } from "../contracts/queries/list-notification-preferences.query";
import { NotificationPreferenceRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-preference.repository.impl";

@Injectable()
export class NotificationPreferenceService {
  constructor(
    private readonly notificationPreferenceRepository: NotificationPreferenceRepositoryImpl,
  ) {}

  async listNotificationPreferences(
    query: ListNotificationPreferencesQuery,
  ): Promise<NotificationPreferenceDto[]> {
    const preferences = await this.notificationPreferenceRepository.listByUser(query.user_id);

    if (preferences.length === 0) {
      return [
        {
          notification_preference_id: "notif-pref-line-demo",
          channel_code: "line",
          preference_status: "active",
          is_default: true,
          quiet_hours: { start: "23:00", end: "07:30" },
          allowed_message_types: ["daily_briefing", "standup_summary"],
          daily_send_limit: 5,
        },
      ];
    }

    return preferences.map((preference) => ({
      notification_preference_id: preference.notification_preference_id,
      channel_code: preference.channel.channel_code,
      preference_status: preference.preference_status,
      is_default: preference.is_default,
      quiet_hours: preference.quiet_hours_json
        ? JSON.parse(preference.quiet_hours_json)
        : undefined,
      allowed_message_types: preference.allowed_message_types_json
        ? JSON.parse(preference.allowed_message_types_json)
        : undefined,
      daily_send_limit: preference.daily_send_limit ?? undefined,
    }));
  }

  async updateNotificationPreference(
    command: UpdateNotificationPreferenceCommand & {
      user_id: string;
      organization_id: string;
      channel_id: string;
    },
  ): Promise<NotificationPreferenceDto> {
    const saved = await this.notificationPreferenceRepository.save({
      notification_preference_id: command.notification_preference_id,
      user_id: command.user_id,
      organization_id: command.organization_id,
      channel_id: command.channel_id,
      preference_status: command.preference_status,
      is_default: command.is_default,
      quiet_hours_json: command.quiet_hours_json
        ? JSON.stringify(command.quiet_hours_json)
        : null,
      allowed_message_types_json: command.allowed_message_types_json
        ? JSON.stringify(command.allowed_message_types_json)
        : null,
      daily_send_limit: command.daily_send_limit ?? null,
      priority_rule_json: null,
    });

    return {
      notification_preference_id: saved.notification_preference_id,
      channel_code: saved.channel_id,
      preference_status: saved.preference_status,
      is_default: saved.is_default,
      quiet_hours: command.quiet_hours_json,
      allowed_message_types: command.allowed_message_types_json,
      daily_send_limit: saved.daily_send_limit ?? undefined,
    };
  }
}

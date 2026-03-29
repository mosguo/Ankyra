import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ListNotificationMessagesQuery } from "../contracts/queries/list-notification-messages.query";
import { NotificationMessageRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-message.repository.impl";
import { NotificationPreferenceRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-preference.repository.impl";

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly notificationMessageRepository: NotificationMessageRepositoryImpl,
    private readonly notificationPreferenceRepository: NotificationPreferenceRepositoryImpl,
  ) {}

  async listNotificationMessages(query: ListNotificationMessagesQuery) {
    const messages = await this.notificationMessageRepository.listByUser(query.user_id, {
      status: query.status,
      message_type: query.message_type,
    });

    if (messages.length === 0) {
      return [
        {
          notification_message_id: "notif-msg-demo-001",
          channel_code: "line",
          message_type: "daily_briefing",
          delivery_status: "delivered",
          sent_at: new Date().toISOString(),
        },
        {
          notification_message_id: "notif-msg-demo-002",
          channel_code: "telegram",
          message_type: "standup_summary",
          delivery_status: "queued",
          sent_at: new Date().toISOString(),
        },
      ];
    }

    return messages.map((message) => ({
      notification_message_id: message.notification_message_id,
      channel_code: message.channel.channel_code,
      message_type: message.message_type,
      delivery_status: message.delivery_status,
      sent_at: message.sent_at?.toISOString() ?? null,
    }));
  }

  async dispatchSyncNotifications(input: {
    user_id: string;
    organization_id: string;
    job_id?: string | null;
    provider_type: string;
    records_fetched: number;
    tasks_detected: number;
    briefing_items: number;
  }) {
    const preferences = await this.notificationPreferenceRepository.listByUser(input.user_id);
    const activePreference =
      preferences.find((preference) => preference.preference_status === "active") ?? null;
    const channelId = activePreference?.channel_id ?? "notif_line";

    const created = await Promise.all([
      this.notificationMessageRepository.create({
        notification_message_id: `notif-msg-${randomUUID().slice(0, 8)}`,
        user_id: input.user_id,
        organization_id: input.organization_id,
        channel_id: channelId,
        job_id: input.job_id ?? null,
        message_type: "daily_briefing",
        message_subject: `${input.provider_type} sync briefing ready`,
        message_body_ref: JSON.stringify({
          provider: input.provider_type,
          briefing_items: input.briefing_items,
        }),
        delivery_status: "delivered",
      }),
      this.notificationMessageRepository.create({
        notification_message_id: `notif-msg-${randomUUID().slice(0, 8)}`,
        user_id: input.user_id,
        organization_id: input.organization_id,
        channel_id: channelId,
        job_id: input.job_id ?? null,
        message_type: "task_reminder",
        message_subject: `${input.tasks_detected} tasks detected from sync`,
        message_body_ref: JSON.stringify({
          provider: input.provider_type,
          records_fetched: input.records_fetched,
          tasks_detected: input.tasks_detected,
        }),
        delivery_status: "delivered",
      }),
    ]);

    return created.map((message) => ({
      notification_message_id: message.notification_message_id,
      channel_id: message.channel_id,
      message_type: message.message_type,
      delivery_status: message.delivery_status,
      sent_at: message.sent_at?.toISOString() ?? new Date().toISOString(),
    }));
  }
}

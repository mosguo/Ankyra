import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationPreferenceRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  listByUser(userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { user_id: userId },
      include: {
        channel: true,
      },
      orderBy: [{ is_default: "desc" }, { updated_at: "desc" }],
    });
  }

  save(preference: {
    notification_preference_id: string;
    user_id: string;
    organization_id: string;
    channel_id: string;
    preference_status: string;
    is_default: boolean;
    quiet_hours_json?: string | null;
    allowed_message_types_json?: string | null;
    daily_send_limit?: number | null;
    priority_rule_json?: string | null;
  }) {
    return this.prisma.notificationPreference.upsert({
      where: { notification_preference_id: preference.notification_preference_id },
      update: {
        preference_status: preference.preference_status,
        is_default: preference.is_default,
        quiet_hours_json: preference.quiet_hours_json ?? null,
        allowed_message_types_json: preference.allowed_message_types_json ?? null,
        daily_send_limit: preference.daily_send_limit ?? null,
        priority_rule_json: preference.priority_rule_json ?? null,
        updated_at: new Date(),
      },
      create: {
        notification_preference_id: preference.notification_preference_id,
        user_id: preference.user_id,
        organization_id: preference.organization_id,
        channel_id: preference.channel_id,
        preference_status: preference.preference_status,
        is_default: preference.is_default,
        quiet_hours_json: preference.quiet_hours_json ?? null,
        allowed_message_types_json: preference.allowed_message_types_json ?? null,
        daily_send_limit: preference.daily_send_limit ?? null,
        priority_rule_json: preference.priority_rule_json ?? null,
        updated_at: new Date(),
      },
    });
  }
}

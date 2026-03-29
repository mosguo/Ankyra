import { Body, Controller, Get, Patch, Query } from "@nestjs/common";
import { UpdateNotificationPreferenceCommand } from "@packages/application/src/contracts/commands/update-notification-preference.command";
import { ListNotificationMessagesQuery } from "@packages/application/src/contracts/queries/list-notification-messages.query";
import { ListNotificationPreferencesQuery } from "@packages/application/src/contracts/queries/list-notification-preferences.query";
import { NotificationDispatchService } from "@packages/application/src/notifications/notification-dispatch.service";
import { NotificationPreferenceService } from "@packages/application/src/notifications/notification-preference.service";

@Controller("notifications")
export class NotificationController {
  constructor(
    private readonly notificationPreferenceService: NotificationPreferenceService,
    private readonly notificationDispatchService: NotificationDispatchService,
  ) {}

  @Get("preferences")
  listPreferences(@Query() query: ListNotificationPreferencesQuery) {
    return this.notificationPreferenceService.listNotificationPreferences(query);
  }

  @Patch("preferences")
  updatePreference(
    @Body()
    command: UpdateNotificationPreferenceCommand & {
      user_id: string;
      organization_id: string;
      channel_id: string;
    },
  ) {
    return this.notificationPreferenceService.updateNotificationPreference(command);
  }

  @Get("messages")
  listMessages(@Query() query: ListNotificationMessagesQuery) {
    return this.notificationDispatchService.listNotificationMessages(query);
  }
}

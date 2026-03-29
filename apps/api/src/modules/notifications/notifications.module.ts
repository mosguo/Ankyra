import { Module } from "@nestjs/common";
import { NotificationDispatchService } from "@packages/application/src/notifications/notification-dispatch.service";
import { NotificationPreferenceService } from "@packages/application/src/notifications/notification-preference.service";
import { NotificationMessageRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-message.repository.impl";
import { NotificationPreferenceRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-preference.repository.impl";
import { NotificationController } from "./notification.controller";

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationPreferenceService,
    NotificationDispatchService,
    NotificationPreferenceRepositoryImpl,
    NotificationMessageRepositoryImpl,
  ],
  exports: [NotificationPreferenceService, NotificationDispatchService],
})
export class NotificationsModule {}

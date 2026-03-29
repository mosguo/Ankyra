import { Module } from "@nestjs/common";
import { ConnectorService } from "@packages/application/src/connectors/connector.service";
import { BriefingSnapshotService } from "@packages/application/src/snapshots/briefing-snapshot.service";
import { NotificationDispatchService } from "@packages/application/src/notifications/notification-dispatch.service";
import { TaskSnapshotService } from "@packages/application/src/snapshots/task-snapshot.service";
import { BriefingSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/briefing-snapshot.repository.impl";
import { ConnectorAccountRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-account.repository.impl";
import { ConnectorSyncStateRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-sync-state.repository.impl";
import { ConnectorTokenRefRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-token-ref.repository.impl";
import { NotificationMessageRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-message.repository.impl";
import { NotificationPreferenceRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-preference.repository.impl";
import { TaskSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/task-snapshot.repository.impl";
import { ConnectorController } from "./connector.controller";

@Module({
  controllers: [ConnectorController],
  providers: [
    ConnectorService,
    ConnectorAccountRepositoryImpl,
    ConnectorSyncStateRepositoryImpl,
    ConnectorTokenRefRepositoryImpl,
    TaskSnapshotService,
    BriefingSnapshotService,
    NotificationDispatchService,
    TaskSnapshotRepositoryImpl,
    BriefingSnapshotRepositoryImpl,
    NotificationPreferenceRepositoryImpl,
    NotificationMessageRepositoryImpl,
  ],
  exports: [ConnectorService],
})
export class ConnectorsModule {}

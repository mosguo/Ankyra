import { Module } from "@nestjs/common";
import { ConnectorService } from "@packages/application/src/connectors/connector.service";
import { JobQueueService } from "@packages/application/src/jobs/job-queue.service";
import { JobScheduleService } from "@packages/application/src/jobs/job-schedule.service";
import { NotificationDispatchService } from "@packages/application/src/notifications/notification-dispatch.service";
import { BriefingSnapshotService } from "@packages/application/src/snapshots/briefing-snapshot.service";
import { TaskSnapshotService } from "@packages/application/src/snapshots/task-snapshot.service";
import { PrismaModule } from "@packages/infrastructure/src/prisma/prisma.module";
import { BriefingSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/briefing-snapshot.repository.impl";
import { ConnectorAccountRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-account.repository.impl";
import { ConnectorSyncStateRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-sync-state.repository.impl";
import { ConnectorTokenRefRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-token-ref.repository.impl";
import { JobRepositoryImpl } from "@packages/infrastructure/src/repositories/job.repository.impl";
import { NotificationMessageRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-message.repository.impl";
import { NotificationPreferenceRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-preference.repository.impl";
import { ScheduleRepositoryImpl } from "@packages/infrastructure/src/repositories/schedule.repository.impl";
import { TaskSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/task-snapshot.repository.impl";
import { JobsQueueWorker } from "./jobs-queue.worker";

@Module({
  imports: [PrismaModule],
  providers: [
    JobQueueService,
    JobScheduleService,
    ConnectorService,
    TaskSnapshotService,
    BriefingSnapshotService,
    NotificationDispatchService,
    ScheduleRepositoryImpl,
    JobRepositoryImpl,
    ConnectorAccountRepositoryImpl,
    ConnectorSyncStateRepositoryImpl,
    ConnectorTokenRefRepositoryImpl,
    TaskSnapshotRepositoryImpl,
    BriefingSnapshotRepositoryImpl,
    NotificationPreferenceRepositoryImpl,
    NotificationMessageRepositoryImpl,
    JobsQueueWorker,
  ],
})
export class WorkerModule {}

import { Module } from "@nestjs/common";
import { JobQueueService } from "@packages/application/src/jobs/job-queue.service";
import { JobScheduleService } from "@packages/application/src/jobs/job-schedule.service";
import { BriefingSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/briefing-snapshot.repository.impl";
import { JobRepositoryImpl } from "@packages/infrastructure/src/repositories/job.repository.impl";
import { NotificationMessageRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-message.repository.impl";
import { ScheduleRepositoryImpl } from "@packages/infrastructure/src/repositories/schedule.repository.impl";
import { TaskSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/task-snapshot.repository.impl";
import { ConnectorsModule } from "../connectors/connectors.module";
import { JobsController } from "./jobs.controller";
import { JobsScheduler } from "./jobs.scheduler";

@Module({
  imports: [ConnectorsModule],
  controllers: [JobsController],
  providers: [
    JobQueueService,
    JobScheduleService,
    ScheduleRepositoryImpl,
    JobRepositoryImpl,
    TaskSnapshotRepositoryImpl,
    BriefingSnapshotRepositoryImpl,
    NotificationMessageRepositoryImpl,
    JobsScheduler,
  ],
  exports: [JobQueueService, JobScheduleService, JobsScheduler],
})
export class JobsModule {}

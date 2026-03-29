import { Module } from "@nestjs/common";
import { BriefingSnapshotService } from "@packages/application/src/snapshots/briefing-snapshot.service";
import { TaskSnapshotService } from "@packages/application/src/snapshots/task-snapshot.service";
import { BriefingSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/briefing-snapshot.repository.impl";
import { TaskSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/task-snapshot.repository.impl";
import { SnapshotController } from "./snapshot.controller";

@Module({
  controllers: [SnapshotController],
  providers: [
    TaskSnapshotService,
    BriefingSnapshotService,
    TaskSnapshotRepositoryImpl,
    BriefingSnapshotRepositoryImpl,
  ],
  exports: [TaskSnapshotService, BriefingSnapshotService],
})
export class SnapshotsModule {}

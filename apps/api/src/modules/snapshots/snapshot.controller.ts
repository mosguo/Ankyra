import { Controller, Get, Query } from "@nestjs/common";
import { GetTodayBriefingSnapshotQuery } from "@packages/application/src/contracts/queries/get-today-briefing-snapshot.query";
import { GetTodayTaskSnapshotQuery } from "@packages/application/src/contracts/queries/get-today-task-snapshot.query";
import { BriefingSnapshotService } from "@packages/application/src/snapshots/briefing-snapshot.service";
import { TaskSnapshotService } from "@packages/application/src/snapshots/task-snapshot.service";

@Controller("snapshots")
export class SnapshotController {
  constructor(
    private readonly taskSnapshotService: TaskSnapshotService,
    private readonly briefingSnapshotService: BriefingSnapshotService,
  ) {}

  @Get("tasks/today")
  getTodayTasks(@Query() query: GetTodayTaskSnapshotQuery) {
    return this.taskSnapshotService.getTodayTaskSnapshot(query);
  }

  @Get("briefing/today")
  getTodayBriefing(@Query() query: GetTodayBriefingSnapshotQuery) {
    return this.briefingSnapshotService.getTodayBriefingSnapshot(query);
  }
}

import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { GetTodayTaskSnapshotQuery } from "../contracts/queries/get-today-task-snapshot.query";
import { TaskSnapshotDto } from "../contracts/dto/task-snapshot.dto";
import { TaskSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/task-snapshot.repository.impl";

@Injectable()
export class TaskSnapshotService {
  constructor(private readonly taskSnapshotRepository: TaskSnapshotRepositoryImpl) {}

  async getTodayTaskSnapshot(query: GetTodayTaskSnapshotQuery): Promise<TaskSnapshotDto> {
    const snapshotDate = new Date().toISOString().slice(0, 10);
    const saved = await this.taskSnapshotRepository.findTodayByUser(
      query.user_id,
      query.organization_id,
      snapshotDate,
    );

    if (saved) {
      return {
        task_snapshot_id: saved.task_snapshot_id,
        snapshot_date: saved.snapshot_date,
        snapshot_type: saved.snapshot_type,
        tasks: JSON.parse(saved.content_json),
      };
    }

    return {
      task_snapshot_id: `task-snapshot-${query.user_id}`,
      snapshot_date: snapshotDate,
      snapshot_type: "daily_tasks",
      tasks: [
        {
          priority: "P1",
          title: "Reply to client escalation mail",
          source: "gmail",
          status: "open",
        },
        {
          priority: "P1",
          title: "Update standup blocker for project A",
          source: "conversation",
          status: "open",
        },
        {
          priority: "P2",
          title: "Prepare afternoon sync summary",
          source: "briefing",
          status: "open",
        },
      ],
    };
  }

  async saveGeneratedTaskSnapshot(input: {
    user_id: string;
    organization_id: string;
    assistant_instance_id?: string | null;
    source_job_id?: string | null;
    tasks: Array<{
      priority: string;
      title: string;
      source: string;
      status: string;
    }>;
  }): Promise<TaskSnapshotDto> {
    const snapshotDate = new Date().toISOString().slice(0, 10);
    const saved = await this.taskSnapshotRepository.save({
      task_snapshot_id: `task-snapshot-${randomUUID().slice(0, 8)}`,
      user_id: input.user_id,
      organization_id: input.organization_id,
      assistant_instance_id: input.assistant_instance_id ?? null,
      source_job_id: input.source_job_id ?? null,
      snapshot_date: snapshotDate,
      snapshot_type: "daily_tasks",
      content_json: JSON.stringify(input.tasks),
    });

    return {
      task_snapshot_id: saved.task_snapshot_id,
      snapshot_date: saved.snapshot_date,
      snapshot_type: saved.snapshot_type,
      tasks: JSON.parse(saved.content_json),
    };
  }
}

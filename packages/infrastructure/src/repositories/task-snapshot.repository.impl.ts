import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TaskSnapshotRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findTodayByUser(userId: string, organizationId: string, snapshotDate: string) {
    return this.prisma.taskSnapshot.findUnique({
      where: {
        user_id_organization_id_snapshot_date_snapshot_type: {
          user_id: userId,
          organization_id: organizationId,
          snapshot_date: snapshotDate,
          snapshot_type: "daily_tasks",
        },
      },
    });
  }

  save(snapshot: {
    task_snapshot_id: string;
    user_id: string;
    organization_id: string;
    assistant_instance_id?: string | null;
    source_job_id?: string | null;
    snapshot_date: string;
    snapshot_type: string;
    content_json: string;
  }) {
    return this.prisma.taskSnapshot.upsert({
      where: {
        user_id_organization_id_snapshot_date_snapshot_type: {
          user_id: snapshot.user_id,
          organization_id: snapshot.organization_id,
          snapshot_date: snapshot.snapshot_date,
          snapshot_type: snapshot.snapshot_type,
        },
      },
      update: {
        assistant_instance_id: snapshot.assistant_instance_id ?? null,
        source_job_id: snapshot.source_job_id ?? null,
        content_json: snapshot.content_json,
        generated_at: new Date(),
      },
      create: {
        task_snapshot_id: snapshot.task_snapshot_id,
        user_id: snapshot.user_id,
        organization_id: snapshot.organization_id,
        assistant_instance_id: snapshot.assistant_instance_id ?? null,
        source_job_id: snapshot.source_job_id ?? null,
        snapshot_date: snapshot.snapshot_date,
        snapshot_type: snapshot.snapshot_type,
        content_json: snapshot.content_json,
        generated_at: new Date(),
      },
    });
  }

  listBySourceJob(sourceJobId: string) {
    return this.prisma.taskSnapshot.findMany({
      where: { source_job_id: sourceJobId },
      orderBy: { generated_at: "desc" },
    });
  }
}

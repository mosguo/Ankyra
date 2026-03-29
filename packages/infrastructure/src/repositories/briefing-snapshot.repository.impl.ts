import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BriefingSnapshotRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findTodayByUser(userId: string, organizationId: string, briefingDate: string) {
    return this.prisma.briefingSnapshot.findUnique({
      where: {
        user_id_organization_id_briefing_date_briefing_type: {
          user_id: userId,
          organization_id: organizationId,
          briefing_date: briefingDate,
          briefing_type: "morning_briefing",
        },
      },
    });
  }

  save(snapshot: {
    briefing_snapshot_id: string;
    user_id: string;
    organization_id: string;
    assistant_instance_id?: string | null;
    source_job_id?: string | null;
    briefing_date: string;
    briefing_type: string;
    content_text?: string | null;
    content_json: string;
  }) {
    return this.prisma.briefingSnapshot.upsert({
      where: {
        user_id_organization_id_briefing_date_briefing_type: {
          user_id: snapshot.user_id,
          organization_id: snapshot.organization_id,
          briefing_date: snapshot.briefing_date,
          briefing_type: snapshot.briefing_type,
        },
      },
      update: {
        assistant_instance_id: snapshot.assistant_instance_id ?? null,
        source_job_id: snapshot.source_job_id ?? null,
        content_text: snapshot.content_text ?? null,
        content_json: snapshot.content_json,
        generated_at: new Date(),
      },
      create: {
        briefing_snapshot_id: snapshot.briefing_snapshot_id,
        user_id: snapshot.user_id,
        organization_id: snapshot.organization_id,
        assistant_instance_id: snapshot.assistant_instance_id ?? null,
        source_job_id: snapshot.source_job_id ?? null,
        briefing_date: snapshot.briefing_date,
        briefing_type: snapshot.briefing_type,
        content_text: snapshot.content_text ?? null,
        content_json: snapshot.content_json,
        generated_at: new Date(),
      },
    });
  }

  listBySourceJob(sourceJobId: string) {
    return this.prisma.briefingSnapshot.findMany({
      where: { source_job_id: sourceJobId },
      orderBy: { generated_at: "desc" },
    });
  }
}

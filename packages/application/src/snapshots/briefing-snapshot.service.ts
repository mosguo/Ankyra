import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { BriefingSnapshotDto } from "../contracts/dto/briefing-snapshot.dto";
import { GetTodayBriefingSnapshotQuery } from "../contracts/queries/get-today-briefing-snapshot.query";
import { BriefingSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/briefing-snapshot.repository.impl";

@Injectable()
export class BriefingSnapshotService {
  constructor(
    private readonly briefingSnapshotRepository: BriefingSnapshotRepositoryImpl,
  ) {}

  async getTodayBriefingSnapshot(
    query: GetTodayBriefingSnapshotQuery,
  ): Promise<BriefingSnapshotDto> {
    const briefingDate = new Date().toISOString().slice(0, 10);
    const saved = await this.briefingSnapshotRepository.findTodayByUser(
      query.user_id,
      query.organization_id,
      briefingDate,
    );

    if (saved) {
      return {
        briefing_snapshot_id: saved.briefing_snapshot_id,
        briefing_date: saved.briefing_date,
        briefing_type: saved.briefing_type,
        sections: JSON.parse(saved.content_json),
      };
    }

    return {
      briefing_snapshot_id: `briefing-snapshot-${query.user_id}`,
      briefing_date: briefingDate,
      briefing_type: "morning_briefing",
      sections: [
        {
          title: "Yesterday",
          items: ["Cleared high-priority mail and reviewed pending replies."],
        },
        {
          title: "Today",
          items: [
            "Focus on client escalation response.",
            "Update standup blocker and sync summary.",
          ],
        },
        {
          title: "Risks",
          items: ["Gmail token should be reauthorized soon."],
        },
      ],
    };
  }

  async saveGeneratedBriefingSnapshot(input: {
    user_id: string;
    organization_id: string;
    assistant_instance_id?: string | null;
    source_job_id?: string | null;
    sections: Array<{
      title: string;
      items: string[];
    }>;
  }): Promise<BriefingSnapshotDto> {
    const briefingDate = new Date().toISOString().slice(0, 10);
    const contentText = input.sections
      .map((section) => `${section.title}: ${section.items.join(" ")}`)
      .join("\n");

    const saved = await this.briefingSnapshotRepository.save({
      briefing_snapshot_id: `briefing-snapshot-${randomUUID().slice(0, 8)}`,
      user_id: input.user_id,
      organization_id: input.organization_id,
      assistant_instance_id: input.assistant_instance_id ?? null,
      source_job_id: input.source_job_id ?? null,
      briefing_date: briefingDate,
      briefing_type: "morning_briefing",
      content_text: contentText,
      content_json: JSON.stringify(input.sections),
    });

    return {
      briefing_snapshot_id: saved.briefing_snapshot_id,
      briefing_date: saved.briefing_date,
      briefing_type: saved.briefing_type,
      sections: JSON.parse(saved.content_json),
    };
  }
}

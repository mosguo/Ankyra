import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ScheduleRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  private get client(): PrismaClient {
    return this.prisma as PrismaClient;
  }

  findById(scheduleId: string) {
    return this.client.schedule.findUnique({
      where: { schedule_id: scheduleId },
    });
  }

  listByUser(userId: string, organizationId: string) {
    return this.client.schedule.findMany({
      where: {
        user_id: userId,
        organization_id: organizationId,
      },
      orderBy: { created_at: "desc" },
    });
  }

  listDueSchedules(referenceTime: Date) {
    return this.client.schedule.findMany({
      where: {
        is_enabled: true,
        next_run_at: {
          lte: referenceTime,
        },
      },
      orderBy: { next_run_at: "asc" },
    });
  }

  save(schedule: {
    schedule_id: string;
    user_id: string;
    organization_id: string;
    connector_account_id?: string | null;
    assistant_instance_id?: string | null;
    schedule_type: string;
    schedule_name: string;
    timezone: string;
    cron_or_rule: string;
    is_enabled: boolean;
    last_run_at?: Date | null;
    next_run_at?: Date | null;
  }) {
    return this.client.schedule.upsert({
      where: { schedule_id: schedule.schedule_id },
      update: {
        connector_account_id: schedule.connector_account_id ?? null,
        assistant_instance_id: schedule.assistant_instance_id ?? null,
        schedule_type: schedule.schedule_type,
        schedule_name: schedule.schedule_name,
        timezone: schedule.timezone,
        cron_or_rule: schedule.cron_or_rule,
        is_enabled: schedule.is_enabled,
        last_run_at: schedule.last_run_at ?? null,
        next_run_at: schedule.next_run_at ?? null,
      },
      create: {
        schedule_id: schedule.schedule_id,
        user_id: schedule.user_id,
        organization_id: schedule.organization_id,
        connector_account_id: schedule.connector_account_id ?? null,
        assistant_instance_id: schedule.assistant_instance_id ?? null,
        schedule_type: schedule.schedule_type,
        schedule_name: schedule.schedule_name,
        timezone: schedule.timezone,
        cron_or_rule: schedule.cron_or_rule,
        is_enabled: schedule.is_enabled,
        last_run_at: schedule.last_run_at ?? null,
        next_run_at: schedule.next_run_at ?? null,
        created_at: new Date(),
      },
    });
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "@packages/infrastructure/src/prisma/prisma.service";
import { JobsScheduler } from "../jobs/jobs.scheduler";

@Injectable()
export class HealthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jobsScheduler: JobsScheduler,
  ) {}

  getLiveness() {
    return {
      status: "ok",
      service: "ankyra-api",
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    let database = "down";

    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }

    const scheduler = this.jobsScheduler.getStatus();
    const ready = database === "up";

    return {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      checks: {
        database,
        scheduler: scheduler.enabled ? "enabled" : "disabled",
      },
      scheduler,
    };
  }
}

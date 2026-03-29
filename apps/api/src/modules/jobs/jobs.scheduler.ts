import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { JobScheduleService } from "@packages/application/src/jobs/job-schedule.service";
import { JobQueueService } from "@packages/application/src/jobs/job-queue.service";

@Injectable()
export class JobsScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private enabled = false;
  private intervalMs = 30000;
  private lastTickAt: Date | null = null;
  private lastSuccessAt: Date | null = null;
  private lastRunJobCount = 0;
  private lastErrorMessage: string | null = null;
  private queueCounts: Record<string, number> = {};

  constructor(
    private readonly jobScheduleService: JobScheduleService,
    private readonly jobQueueService: JobQueueService,
  ) {}

  onModuleInit(): void {
    this.enabled = process.env.SCHEDULER_ENABLED !== "false";
    if (!this.enabled) {
      this.logger.log("Background scheduler disabled by env.");
      return;
    }

    this.intervalMs = Number(process.env.SCHEDULER_POLL_MS ?? "30000");
    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMs);

    this.logger.log(`Background scheduler started. Poll interval: ${this.intervalMs}ms`);
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getStatus() {
    return {
      enabled: this.enabled,
      running: this.running,
      interval_ms: this.intervalMs,
      last_tick_at: this.lastTickAt?.toISOString() ?? null,
      last_success_at: this.lastSuccessAt?.toISOString() ?? null,
      last_run_job_count: this.lastRunJobCount,
      last_error_message: this.lastErrorMessage,
      queue_counts: this.queueCounts,
    };
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTickAt = new Date();
    try {
      const jobs = await this.jobScheduleService.runDueSchedules(new Date());
      this.lastRunJobCount = jobs.length;
      this.lastSuccessAt = new Date();
      this.lastErrorMessage = null;
      this.queueCounts = await this.jobQueueService.getQueueCounts();
      if (jobs.length > 0) {
        this.logger.log(`Enqueued ${jobs.length} scheduled job(s).`);
      }
    } catch (error) {
      this.lastErrorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(
        `Scheduler tick failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      this.running = false;
    }
  }
}

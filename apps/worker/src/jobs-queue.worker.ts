import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { JobQueueService } from "@packages/application/src/jobs/job-queue.service";
import { JobScheduleService } from "@packages/application/src/jobs/job-schedule.service";

@Injectable()
export class JobsQueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsQueueWorker.name);
  private readonly connection = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
  });
  private worker: Worker | null = null;

  constructor(
    private readonly jobScheduleService: JobScheduleService,
    private readonly jobQueueService: JobQueueService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      "ankyra-jobs",
      async (job) => {
        if (job.name !== "connector_sync") {
          this.logger.warn(`Skipping unsupported job type: ${job.name}`);
          return;
        }

        await this.jobQueueService.waitForProcessingPermit(String(job.id));
        try {
          await this.jobScheduleService.processQueuedJob(job.data);
        } finally {
          await this.jobQueueService.releaseProcessingPermit(String(job.id));
        }
      },
      {
        connection: this.connection,
      },
    );

    this.worker.on("completed", (job) => {
      this.logger.log(`Worker completed job ${job.id}`);
    });

    this.worker.on("failed", (job, error) => {
      this.logger.error(`Worker failed job ${job?.id ?? "unknown"}: ${error.message}`);
      void this.jobQueueService.enqueueDeadLetterJob({
        source_queue: "ankyra-jobs",
        source_job_id: job?.id ? String(job.id) : undefined,
        name: job?.name ?? "unknown",
        reason: error.message,
        failed_at: new Date().toISOString(),
        payload: (job?.data as Record<string, unknown> | undefined) ?? {},
      });
    });

    this.worker.on("stalled", (jobId) => {
      this.logger.warn(`Worker stalled job ${jobId}`);
      void this.jobQueueService.enqueueDeadLetterJob({
        source_queue: "ankyra-jobs",
        source_job_id: jobId ? String(jobId) : undefined,
        name: "connector_sync",
        reason: "stalled",
        failed_at: new Date().toISOString(),
        payload: {},
      });
    });

    this.logger.log("BullMQ worker started.");
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
    await this.connection.quit();
  }
}

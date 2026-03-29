import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export interface ConnectorSyncQueuePayload {
  job_id: string;
  user_id: string;
  organization_id: string;
  connector_account_id: string;
  schedule_id?: string | null;
  trigger_type: string;
  retry_count?: number;
}

export interface DeadLetterQueuePayload {
  source_queue: string;
  source_job_id?: string;
  name: string;
  reason: string;
  failed_at: string;
  payload?: Record<string, unknown>;
}

export interface QueueControlSettings {
  concurrency: number;
  rate_limit_per_minute: number;
}

@Injectable()
export class JobQueueService implements OnModuleDestroy {
  private readonly connection = new IORedis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null,
  });

  private readonly queue = new Queue<ConnectorSyncQueuePayload>("ankyra-jobs", {
    connection: this.connection,
  });
  private readonly deadLetterQueue = new Queue<DeadLetterQueuePayload>("ankyra-jobs-dlq", {
    connection: this.connection,
  });

  private readonly settingsKey = "ankyra:queue:settings";
  private readonly activeJobsKey = "ankyra:queue:active_jobs";

  async enqueueConnectorSyncJob(payload: ConnectorSyncQueuePayload) {
    await this.queue.add(
      "connector_sync",
      payload,
      {
        jobId: payload.job_id,
        attempts: 3,
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );
  }

  async getQueueCounts() {
    return this.queue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
  }

  async pauseQueue() {
    await this.queue.pause();
    return this.getQueueDashboard();
  }

  async resumeQueue() {
    await this.queue.resume();
    return this.getQueueDashboard();
  }

  async getQueueSettings(): Promise<QueueControlSettings> {
    const defaults = this.getDefaultQueueSettings();
    const raw = await this.connection.get(this.settingsKey);
    if (!raw) {
      return defaults;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<QueueControlSettings>;
      return {
        concurrency: parsed.concurrency && parsed.concurrency > 0 ? parsed.concurrency : defaults.concurrency,
        rate_limit_per_minute:
          parsed.rate_limit_per_minute && parsed.rate_limit_per_minute > 0
            ? parsed.rate_limit_per_minute
            : defaults.rate_limit_per_minute,
      };
    } catch {
      return defaults;
    }
  }

  async updateQueueSettings(input: Partial<QueueControlSettings>) {
    const current = await this.getQueueSettings();
    const next = {
      concurrency:
        input.concurrency && input.concurrency > 0 ? input.concurrency : current.concurrency,
      rate_limit_per_minute:
        input.rate_limit_per_minute && input.rate_limit_per_minute > 0
          ? input.rate_limit_per_minute
          : current.rate_limit_per_minute,
    };
    await this.connection.set(this.settingsKey, JSON.stringify(next));
    return this.getQueueDashboard();
  }

  async waitForProcessingPermit(jobId: string) {
    while (true) {
      const permit = await this.tryAcquireProcessingPermit(jobId);
      if (permit.acquired) {
        return permit;
      }
      await new Promise((resolve) => setTimeout(resolve, permit.wait_ms));
    }
  }

  async releaseProcessingPermit(jobId: string) {
    await this.connection.srem(this.activeJobsKey, jobId);
  }

  async getQueueDashboard() {
    const [counts, jobs, deadLetterCounts, deadLetterJobs, paused, deadLetterPaused, settings, activeCount, currentMinuteCount] = await Promise.all([
      this.getQueueCounts(),
      this.queue.getJobs(["waiting", "active", "completed", "failed", "delayed"], 0, 20, true),
      this.deadLetterQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed"),
      this.deadLetterQueue.getJobs(
        ["waiting", "active", "completed", "failed", "delayed"],
        0,
        20,
        true,
      ),
      this.queue.isPaused(),
      this.deadLetterQueue.isPaused(),
      this.getQueueSettings(),
      this.connection.scard(this.activeJobsKey),
      this.getCurrentMinuteRateCount(),
    ]);

    const timelineBuckets = this.buildTimelineBuckets(jobs, deadLetterJobs);

    return {
      queue_name: "ankyra-jobs",
      paused,
      settings,
      runtime: {
        active_processing: activeCount,
        current_minute_processed: currentMinuteCount,
      },
      counts,
      timeline: timelineBuckets,
      recent_jobs: jobs.map((job) => ({
        id: String(job.id),
        name: job.name,
        state: job.failedReason
          ? "failed"
          : job.finishedOn
            ? "completed"
            : job.processedOn
              ? "active"
              : "waiting",
        attempts_made: job.attemptsMade,
        timestamp: job.timestamp,
        processed_on: job.processedOn ?? null,
        finished_on: job.finishedOn ?? null,
        failed_reason: job.failedReason ?? null,
        data: job.data,
      })),
      dead_letter: {
        queue_name: "ankyra-jobs-dlq",
        paused: deadLetterPaused,
        counts: deadLetterCounts,
        recent_jobs: deadLetterJobs.map((job) => ({
          id: String(job.id),
          name: job.name,
          state: job.failedReason
            ? "failed"
            : job.finishedOn
              ? "completed"
              : job.processedOn
                ? "active"
                : "waiting",
          attempts_made: job.attemptsMade,
          timestamp: job.timestamp,
          processed_on: job.processedOn ?? null,
          finished_on: job.finishedOn ?? null,
          failed_reason: job.failedReason ?? null,
          data: job.data,
        })),
      },
    };
  }

  async enqueueDeadLetterJob(payload: DeadLetterQueuePayload) {
    await this.deadLetterQueue.add(
      "dead_letter",
      payload,
      {
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );
  }

  private buildTimelineBuckets(
    jobs: Awaited<ReturnType<Queue<ConnectorSyncQueuePayload>["getJobs"]>>,
    deadLetterJobs: Awaited<ReturnType<Queue<DeadLetterQueuePayload>["getJobs"]>>,
  ) {
    const bucketMap = new Map<string, { timestamp: string; queued: number; completed: number; failed: number; dead_letter: number }>();

    const ensureBucket = (timestamp: number) => {
      const date = new Date(timestamp);
      date.setMinutes(0, 0, 0);
      const key = date.toISOString();
      if (!bucketMap.has(key)) {
        bucketMap.set(key, {
          timestamp: key,
          queued: 0,
          completed: 0,
          failed: 0,
          dead_letter: 0,
        });
      }
      return bucketMap.get(key)!;
    };

    for (const job of jobs) {
      const bucket = ensureBucket(job.timestamp);
      if (job.failedReason) {
        bucket.failed += 1;
      } else if (job.finishedOn) {
        bucket.completed += 1;
      } else {
        bucket.queued += 1;
      }
    }

    for (const job of deadLetterJobs) {
      const bucket = ensureBucket(job.timestamp);
      bucket.dead_letter += 1;
    }

    return [...bucketMap.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).slice(-12);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.deadLetterQueue.close();
    await this.connection.quit();
  }

  private getDefaultQueueSettings(): QueueControlSettings {
    return {
      concurrency: Number(process.env.QUEUE_MAX_CONCURRENCY ?? "2"),
      rate_limit_per_minute: Number(process.env.QUEUE_RATE_LIMIT_PER_MINUTE ?? "60"),
    };
  }

  private getCurrentMinuteRateKey(referenceTime = new Date()) {
    const year = referenceTime.getUTCFullYear();
    const month = String(referenceTime.getUTCMonth() + 1).padStart(2, "0");
    const date = String(referenceTime.getUTCDate()).padStart(2, "0");
    const hour = String(referenceTime.getUTCHours()).padStart(2, "0");
    const minute = String(referenceTime.getUTCMinutes()).padStart(2, "0");
    return `ankyra:queue:rate:${year}${month}${date}${hour}${minute}`;
  }

  private async getCurrentMinuteRateCount(referenceTime = new Date()) {
    const value = await this.connection.get(this.getCurrentMinuteRateKey(referenceTime));
    return Number(value ?? "0");
  }

  private async tryAcquireProcessingPermit(jobId: string) {
    const settings = await this.getQueueSettings();
    const [activeCount, currentMinuteCount, alreadyActive] = await Promise.all([
      this.connection.scard(this.activeJobsKey),
      this.getCurrentMinuteRateCount(),
      this.connection.sismember(this.activeJobsKey, jobId),
    ]);

    if (alreadyActive) {
      return { acquired: true, wait_ms: 0 };
    }

    if (activeCount >= settings.concurrency) {
      return { acquired: false, reason: "concurrency", wait_ms: 1000 };
    }

    if (currentMinuteCount >= settings.rate_limit_per_minute) {
      return { acquired: false, reason: "rate_limit", wait_ms: 2500 };
    }

    const minuteKey = this.getCurrentMinuteRateKey();
    await this.connection
      .multi()
      .sadd(this.activeJobsKey, jobId)
      .incr(minuteKey)
      .expire(minuteKey, 90)
      .exec();

    return { acquired: true, wait_ms: 0 };
  }
}

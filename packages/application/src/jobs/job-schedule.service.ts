import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { CreateScheduleCommand } from "../contracts/commands/create-schedule.command";
import { RunJobCommand } from "../contracts/commands/run-job.command";
import { JobDto } from "../contracts/dto/job.dto";
import { ScheduleDto } from "../contracts/dto/schedule.dto";
import { ListJobsQuery } from "../contracts/queries/list-jobs.query";
import { ListSchedulesQuery } from "../contracts/queries/list-schedules.query";
import { ConnectorService } from "../connectors/connector.service";
import { JobQueueService } from "./job-queue.service";
import { BriefingSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/briefing-snapshot.repository.impl";
import { JobRepositoryImpl } from "@packages/infrastructure/src/repositories/job.repository.impl";
import { NotificationMessageRepositoryImpl } from "@packages/infrastructure/src/repositories/notification-message.repository.impl";
import { ScheduleRepositoryImpl } from "@packages/infrastructure/src/repositories/schedule.repository.impl";
import { TaskSnapshotRepositoryImpl } from "@packages/infrastructure/src/repositories/task-snapshot.repository.impl";

@Injectable()
export class JobScheduleService {
  constructor(
    private readonly scheduleRepository: ScheduleRepositoryImpl,
    private readonly jobRepository: JobRepositoryImpl,
    private readonly connectorService: ConnectorService,
    private readonly jobQueueService: JobQueueService,
    private readonly taskSnapshotRepository: TaskSnapshotRepositoryImpl,
    private readonly briefingSnapshotRepository: BriefingSnapshotRepositoryImpl,
    private readonly notificationMessageRepository: NotificationMessageRepositoryImpl,
  ) {}

  async listSchedules(query: ListSchedulesQuery): Promise<ScheduleDto[]> {
    const schedules = await this.scheduleRepository.listByUser(
      query.user_id,
      query.organization_id,
    );

    return schedules.map((schedule) => ({
      schedule_id: schedule.schedule_id,
      schedule_type: schedule.schedule_type,
      schedule_name: schedule.schedule_name,
      timezone: schedule.timezone,
      cron_or_rule: schedule.cron_or_rule,
      is_enabled: schedule.is_enabled,
      connector_account_id: schedule.connector_account_id ?? undefined,
      last_run_at: schedule.last_run_at?.toISOString(),
      next_run_at: schedule.next_run_at?.toISOString(),
    }));
  }

  async createSchedule(command: CreateScheduleCommand): Promise<ScheduleDto> {
    const nextRunAt = new Date(Date.now() + 1000 * 60 * 30);
    const saved = await this.scheduleRepository.save({
      schedule_id: `schedule-${randomUUID().slice(0, 8)}`,
      user_id: command.user_id,
      organization_id: command.organization_id,
      connector_account_id: command.connector_account_id ?? null,
      assistant_instance_id: command.assistant_instance_id ?? null,
      schedule_type: command.schedule_type,
      schedule_name: command.schedule_name,
      timezone: command.timezone,
      cron_or_rule: command.cron_or_rule,
      is_enabled: true,
      next_run_at: nextRunAt,
    });

    return {
      schedule_id: saved.schedule_id,
      schedule_type: saved.schedule_type,
      schedule_name: saved.schedule_name,
      timezone: saved.timezone,
      cron_or_rule: saved.cron_or_rule,
      is_enabled: saved.is_enabled,
      connector_account_id: saved.connector_account_id ?? undefined,
      last_run_at: saved.last_run_at?.toISOString(),
      next_run_at: saved.next_run_at?.toISOString(),
    };
  }

  async listJobs(query: ListJobsQuery): Promise<JobDto[]> {
    const jobs = await this.jobRepository.listByUser(query.user_id, query.organization_id, {
      job_status: query.job_status,
      trigger_type: query.trigger_type,
      search: query.search,
    });

    return jobs.map((job) => ({
      job_id: job.job_id,
      schedule_id: job.schedule_id ?? undefined,
      connector_account_id: job.connector_account_id ?? undefined,
      job_type: job.job_type,
      job_status: job.job_status,
      trigger_type: job.trigger_type,
      started_at: job.started_at?.toISOString(),
      finished_at: job.finished_at?.toISOString(),
      retry_count: job.retry_count,
      error_message: job.error_message ?? undefined,
    }));
  }

  async runDueSchedules(referenceTime = new Date()) {
    const dueSchedules = await this.scheduleRepository.listDueSchedules(referenceTime);
    const results: JobDto[] = [];

    for (const schedule of dueSchedules) {
      if (!schedule.connector_account_id) {
        continue;
      }

      const result = await this.runJob({
        user_id: schedule.user_id,
        organization_id: schedule.organization_id,
        schedule_id: schedule.schedule_id,
        connector_account_id: schedule.connector_account_id,
        job_type: "connector_sync",
        trigger_type: "scheduled",
      });
      results.push(result);
    }

    return results;
  }

  async runJob(command: RunJobCommand): Promise<JobDto> {
    const queuedAt = new Date();
    const jobId = `job-${randomUUID().slice(0, 8)}`;

    const queued = await this.jobRepository.save({
      job_id: jobId,
      schedule_id: command.schedule_id ?? null,
      connector_account_id: command.connector_account_id ?? null,
      job_type: command.job_type,
      job_status: "queued",
      trigger_type: command.trigger_type ?? "manual",
      user_id: command.user_id,
      organization_id: command.organization_id,
      started_at: queuedAt,
      input_payload_ref: JSON.stringify(command),
    });

    if (command.job_type === "connector_sync" && command.connector_account_id) {
      await this.jobQueueService.enqueueConnectorSyncJob({
        job_id: queued.job_id,
        user_id: queued.user_id,
        organization_id: queued.organization_id,
        connector_account_id: command.connector_account_id,
        schedule_id: command.schedule_id ?? null,
        trigger_type: queued.trigger_type,
        retry_count: queued.retry_count,
      });
    }

    return {
      job_id: queued.job_id,
      schedule_id: queued.schedule_id ?? undefined,
      connector_account_id: queued.connector_account_id ?? undefined,
      job_type: queued.job_type,
      job_status: queued.job_status,
      trigger_type: queued.trigger_type,
      started_at: queued.started_at?.toISOString(),
      finished_at: queued.finished_at?.toISOString(),
      retry_count: queued.retry_count,
    };
  }

  async processQueuedJob(payload: {
    job_id: string;
    user_id: string;
    organization_id: string;
    connector_account_id: string;
    schedule_id?: string | null;
    trigger_type: string;
    retry_count?: number;
  }): Promise<JobDto> {
    const startedAt = new Date();
    const started = await this.jobRepository.save({
      job_id: payload.job_id,
      schedule_id: payload.schedule_id ?? null,
      connector_account_id: payload.connector_account_id,
      job_type: "connector_sync",
      job_status: "running",
      trigger_type: payload.trigger_type,
      user_id: payload.user_id,
      organization_id: payload.organization_id,
      started_at: startedAt,
      input_payload_ref: JSON.stringify(payload),
      retry_count: payload.retry_count ?? 0,
    });

    try {
      if (payload.connector_account_id) {
        await this.connectorService.syncConnector({
          connector_account_id: payload.connector_account_id,
          operator_id: payload.user_id,
          source_job_id: started.job_id,
          sync_target: "mail",
        });
      }

      const finishedAt = new Date();
      const saved = await this.jobRepository.save({
        job_id: started.job_id,
        schedule_id: started.schedule_id,
        connector_account_id: started.connector_account_id,
        job_type: started.job_type,
        job_status: "completed",
        trigger_type: started.trigger_type,
        user_id: started.user_id,
        organization_id: started.organization_id,
        started_at: started.started_at,
        finished_at: finishedAt,
        input_payload_ref: started.input_payload_ref,
        output_payload_ref: JSON.stringify({ status: "completed" }),
        retry_count: started.retry_count,
      });

      if (payload.schedule_id) {
        const schedule = await this.scheduleRepository.findById(payload.schedule_id!);
        if (schedule) {
          await this.scheduleRepository.save({
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
            last_run_at: finishedAt,
            next_run_at: new Date(finishedAt.getTime() + 1000 * 60 * 30),
          });
        }
      }

      return {
        job_id: saved.job_id,
        schedule_id: saved.schedule_id ?? undefined,
        connector_account_id: saved.connector_account_id ?? undefined,
        job_type: saved.job_type,
        job_status: saved.job_status,
        trigger_type: saved.trigger_type,
        started_at: saved.started_at?.toISOString(),
        finished_at: saved.finished_at?.toISOString(),
        retry_count: saved.retry_count,
      };
    } catch (error) {
      const failedAt = new Date();
      const saved = await this.jobRepository.save({
        job_id: started.job_id,
        schedule_id: started.schedule_id,
        connector_account_id: started.connector_account_id,
        job_type: started.job_type,
        job_status: "failed",
        trigger_type: started.trigger_type,
        user_id: started.user_id,
        organization_id: started.organization_id,
        started_at: started.started_at,
        finished_at: failedAt,
        input_payload_ref: started.input_payload_ref,
        retry_count: started.retry_count,
        error_message: error instanceof Error ? error.message : "Unknown job error",
      });

      return {
        job_id: saved.job_id,
        schedule_id: saved.schedule_id ?? undefined,
        connector_account_id: saved.connector_account_id ?? undefined,
        job_type: saved.job_type,
        job_status: saved.job_status,
        trigger_type: saved.trigger_type,
        started_at: saved.started_at?.toISOString(),
        finished_at: saved.finished_at?.toISOString(),
        retry_count: saved.retry_count,
        error_message: saved.error_message ?? undefined,
      };
    }
  }

  async retryJob(jobId: string): Promise<JobDto> {
    const sourceJob = await this.jobRepository.findById(jobId);
    if (!sourceJob || !sourceJob.connector_account_id) {
      throw new Error("Retry target job not found or connector is missing.");
    }

    return this.enqueueClonedJob(sourceJob, "manual_retry");
  }

  async requeueFailedJob(jobId: string): Promise<JobDto> {
    const sourceJob = await this.jobRepository.findById(jobId);
    if (!sourceJob || !sourceJob.connector_account_id) {
      throw new Error("Requeue target job not found or connector is missing.");
    }
    if (sourceJob.job_status !== "failed") {
      throw new Error("Only failed jobs can be requeued.");
    }

    return this.enqueueClonedJob(sourceJob, "manual_requeue");
  }

  async bulkRequeueFailedJobs(jobIds: string[]): Promise<JobDto[]> {
    const results: JobDto[] = [];
    for (const jobId of jobIds) {
      const sourceJob = await this.jobRepository.findById(jobId);
      if (!sourceJob || !sourceJob.connector_account_id || sourceJob.job_status !== "failed") {
        continue;
      }
      results.push(await this.enqueueClonedJob(sourceJob, "bulk_requeue"));
    }

    return results;
  }

  async getJobRelations(jobId: string) {
    const [job, taskSnapshots, briefingSnapshots, notificationMessages] = await Promise.all([
      this.jobRepository.findById(jobId),
      this.taskSnapshotRepository.listBySourceJob(jobId),
      this.briefingSnapshotRepository.listBySourceJob(jobId),
      this.notificationMessageRepository.listByJobId(jobId),
    ]);

    return {
      job: job
        ? {
            job_id: job.job_id,
            job_type: job.job_type,
            job_status: job.job_status,
            connector_account_id: job.connector_account_id ?? null,
            schedule_id: job.schedule_id ?? null,
            retry_count: job.retry_count ?? 0,
            started_at: job.started_at?.toISOString() ?? null,
            finished_at: job.finished_at?.toISOString() ?? null,
          }
        : null,
      task_snapshots: taskSnapshots.map((snapshot) => ({
        task_snapshot_id: snapshot.task_snapshot_id,
        snapshot_date: snapshot.snapshot_date,
        snapshot_type: snapshot.snapshot_type,
      })),
      briefing_snapshots: briefingSnapshots.map((snapshot) => ({
        briefing_snapshot_id: snapshot.briefing_snapshot_id,
        briefing_date: snapshot.briefing_date,
        briefing_type: snapshot.briefing_type,
      })),
      notification_messages: notificationMessages.map((message) => ({
        notification_message_id: message.notification_message_id,
        channel_code: message.channel.channel_code,
        message_type: message.message_type,
        delivery_status: message.delivery_status,
        sent_at: message.sent_at?.toISOString() ?? null,
      })),
    };
  }

  private async enqueueClonedJob(
    sourceJob: Awaited<ReturnType<JobRepositoryImpl["findById"]>>,
    triggerType: string,
  ): Promise<JobDto> {
    const clonedJobId = `job-${randomUUID().slice(0, 8)}`;
    const queuedAt = new Date();
    const nextRetryCount = (sourceJob?.retry_count ?? 0) + 1;

    const cloned = await this.jobRepository.save({
      job_id: clonedJobId,
      schedule_id: sourceJob?.schedule_id ?? null,
      connector_account_id: sourceJob?.connector_account_id ?? null,
      job_type: sourceJob?.job_type ?? "connector_sync",
      job_status: "queued",
      trigger_type: triggerType,
      assistant_instance_id: sourceJob?.assistant_instance_id ?? null,
      user_id: sourceJob!.user_id,
      organization_id: sourceJob!.organization_id,
      started_at: queuedAt,
      input_payload_ref: sourceJob?.input_payload_ref ?? null,
      retry_count: nextRetryCount,
    });

    await this.jobQueueService.enqueueConnectorSyncJob({
      job_id: cloned.job_id,
      user_id: cloned.user_id,
      organization_id: cloned.organization_id,
      connector_account_id: cloned.connector_account_id!,
      schedule_id: cloned.schedule_id ?? null,
      trigger_type: cloned.trigger_type,
      retry_count: cloned.retry_count,
    });

    return {
      job_id: cloned.job_id,
      schedule_id: cloned.schedule_id ?? undefined,
      connector_account_id: cloned.connector_account_id ?? undefined,
      job_type: cloned.job_type,
      job_status: cloned.job_status,
      trigger_type: cloned.trigger_type,
      started_at: cloned.started_at?.toISOString(),
      finished_at: cloned.finished_at?.toISOString(),
      retry_count: cloned.retry_count,
    };
  }
}

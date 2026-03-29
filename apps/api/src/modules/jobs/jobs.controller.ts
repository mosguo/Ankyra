import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import { CreateScheduleCommand } from "@packages/application/src/contracts/commands/create-schedule.command";
import { RunJobCommand } from "@packages/application/src/contracts/commands/run-job.command";
import { JobQueueService } from "@packages/application/src/jobs/job-queue.service";
import { ListJobsQuery } from "@packages/application/src/contracts/queries/list-jobs.query";
import { ListSchedulesQuery } from "@packages/application/src/contracts/queries/list-schedules.query";
import { JobScheduleService } from "@packages/application/src/jobs/job-schedule.service";
import type { Response } from "express";
import { JobsScheduler } from "./jobs.scheduler";

@Controller("jobs")
export class JobsController {
  constructor(
    private readonly jobScheduleService: JobScheduleService,
    private readonly jobQueueService: JobQueueService,
    private readonly jobsScheduler: JobsScheduler,
  ) {}

  @Get("scheduler-status")
  getSchedulerStatus() {
    return this.jobsScheduler.getStatus();
  }

  @Get("queue-dashboard")
  getQueueDashboard() {
    return this.jobQueueService.getQueueDashboard();
  }

  @Get("queue-settings")
  getQueueSettings() {
    return this.jobQueueService.getQueueSettings();
  }

  @Post("queue/pause")
  pauseQueue() {
    return this.jobQueueService.pauseQueue();
  }

  @Post("queue/resume")
  resumeQueue() {
    return this.jobQueueService.resumeQueue();
  }

  @Post("queue/settings")
  updateQueueSettings(@Body() body: { concurrency?: number; rate_limit_per_minute?: number }) {
    return this.jobQueueService.updateQueueSettings(body);
  }

  @Get("schedules")
  listSchedules(@Query() query: ListSchedulesQuery) {
    return this.jobScheduleService.listSchedules(query);
  }

  @Post("schedules")
  createSchedule(@Body() command: CreateScheduleCommand) {
    return this.jobScheduleService.createSchedule(command);
  }

  @Get()
  listJobs(@Query() query: ListJobsQuery) {
    return this.jobScheduleService.listJobs(query);
  }

  @Get(":job_id/relations")
  getJobRelations(@Param("job_id") jobId: string) {
    return this.jobScheduleService.getJobRelations(jobId);
  }

  @Get("export.csv")
  async exportJobsCsv(@Query() query: ListJobsQuery, @Res() response: Response) {
    const jobs = await this.jobScheduleService.listJobs(query);
    const escapeCell = (value: unknown) => `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
    const rows = [
      [
        "job_id",
        "schedule_id",
        "connector_account_id",
        "job_type",
        "job_status",
        "trigger_type",
        "started_at",
        "finished_at",
        "retry_count",
        "error_message",
      ],
      ...jobs.map((job) => [
        job.job_id,
        job.schedule_id ?? "",
        job.connector_account_id ?? "",
        job.job_type,
        job.job_status,
        job.trigger_type,
        job.started_at ?? "",
        job.finished_at ?? "",
        job.retry_count ?? 0,
        job.error_message ?? "",
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\n");
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", "attachment; filename=\"ankyra-jobs.csv\"");
    response.send(csv);
  }

  @Post("run")
  runJob(@Body() command: RunJobCommand) {
    return this.jobScheduleService.runJob(command);
  }

  @Post(":job_id/retry")
  retryJob(@Param("job_id") jobId: string) {
    return this.jobScheduleService.retryJob(jobId);
  }

  @Post(":job_id/requeue-failed")
  requeueFailedJob(@Param("job_id") jobId: string) {
    return this.jobScheduleService.requeueFailedJob(jobId);
  }

  @Post("requeue-failed-bulk")
  bulkRequeueFailedJobs(@Body() body: { job_ids: string[] }) {
    return this.jobScheduleService.bulkRequeueFailedJobs(body.job_ids ?? []);
  }
}

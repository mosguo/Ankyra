import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class JobRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  private get client(): PrismaClient {
    return this.prisma as PrismaClient;
  }

  findById(jobId: string) {
    return this.client.job.findUnique({
      where: { job_id: jobId },
    });
  }

  listByUser(
    userId: string,
    organizationId: string,
    filters?: {
      job_status?: string;
      trigger_type?: string;
      search?: string;
    },
  ) {
    return this.client.job.findMany({
      where: {
        user_id: userId,
        organization_id: organizationId,
        ...(filters?.job_status ? { job_status: filters.job_status } : {}),
        ...(filters?.trigger_type ? { trigger_type: filters.trigger_type } : {}),
        ...(filters?.search
          ? {
              OR: [
                { job_id: { contains: filters.search, mode: "insensitive" } },
                { job_type: { contains: filters.search, mode: "insensitive" } },
                { error_message: { contains: filters.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ started_at: "desc" }, { job_id: "desc" }],
    });
  }

  save(job: {
    job_id: string;
    schedule_id?: string | null;
    connector_account_id?: string | null;
    job_type: string;
    job_status: string;
    trigger_type: string;
    assistant_instance_id?: string | null;
    user_id: string;
    organization_id: string;
    input_payload_ref?: string | null;
    output_payload_ref?: string | null;
    started_at?: Date | null;
    finished_at?: Date | null;
    retry_count?: number;
    error_message?: string | null;
  }) {
    return this.client.job.upsert({
      where: { job_id: job.job_id },
      update: {
        schedule_id: job.schedule_id ?? null,
        connector_account_id: job.connector_account_id ?? null,
        job_status: job.job_status,
        trigger_type: job.trigger_type,
        assistant_instance_id: job.assistant_instance_id ?? null,
        input_payload_ref: job.input_payload_ref ?? null,
        output_payload_ref: job.output_payload_ref ?? null,
        started_at: job.started_at ?? null,
        finished_at: job.finished_at ?? null,
        retry_count: job.retry_count ?? 0,
        error_message: job.error_message ?? null,
      },
      create: {
        job_id: job.job_id,
        schedule_id: job.schedule_id ?? null,
        connector_account_id: job.connector_account_id ?? null,
        job_type: job.job_type,
        job_status: job.job_status,
        trigger_type: job.trigger_type,
        assistant_instance_id: job.assistant_instance_id ?? null,
        user_id: job.user_id,
        organization_id: job.organization_id,
        input_payload_ref: job.input_payload_ref ?? null,
        output_payload_ref: job.output_payload_ref ?? null,
        started_at: job.started_at ?? null,
        finished_at: job.finished_at ?? null,
        retry_count: job.retry_count ?? 0,
        error_message: job.error_message ?? null,
      },
    });
  }
}

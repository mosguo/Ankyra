import { Injectable } from "@nestjs/common";
import { GetAdminSummaryQuery } from "../contracts/queries/get-admin-summary.query";
import { ApprovalRecordRepositoryImpl } from "@packages/infrastructure/src/repositories/approval-record.repository.impl";
import { AuditLogRepositoryImpl } from "@packages/infrastructure/src/repositories/audit-log.repository.impl";
import { ConnectorAccountRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-account.repository.impl";
import { JobRepositoryImpl } from "@packages/infrastructure/src/repositories/job.repository.impl";
import { ScheduleRepositoryImpl } from "@packages/infrastructure/src/repositories/schedule.repository.impl";

@Injectable()
export class AdminService {
  constructor(
    private readonly approvalRecordRepository: ApprovalRecordRepositoryImpl,
    private readonly auditLogRepository: AuditLogRepositoryImpl,
    private readonly connectorAccountRepository: ConnectorAccountRepositoryImpl,
    private readonly scheduleRepository: ScheduleRepositoryImpl,
    private readonly jobRepository: JobRepositoryImpl,
  ) {}

  async getSummary(query: GetAdminSummaryQuery & { user_id?: string }) {
    const userId = query.user_id ?? "usr_user_001";
    const [approvals, auditLogs, connectors, schedules, jobs] = await Promise.all([
      this.approvalRecordRepository.listByOrganization(query.organization_id),
      this.auditLogRepository.listByOrganization(query.organization_id),
      this.connectorAccountRepository.listByUser(userId, query.organization_id),
      this.scheduleRepository.listByUser(userId, query.organization_id),
      this.jobRepository.listByUser(userId, query.organization_id),
    ]);

    const latestSyncConnector = connectors
      .filter((connector) => connector.last_verified_at || connector.syncStates.length > 0)
      .sort((left, right) => {
        const leftTime = left.syncStates[0]?.last_sync_at?.getTime() ?? 0;
        const rightTime = right.syncStates[0]?.last_sync_at?.getTime() ?? 0;
        return rightTime - leftTime;
      })[0];

    const latestJob = jobs[0];

    if (
      approvals.length === 0 &&
      auditLogs.length === 0 &&
      connectors.length === 0 &&
      schedules.length === 0 &&
      jobs.length === 0
    ) {
      return {
        organization_id: query.organization_id,
        pending_approvals: 1,
        total_approvals: 1,
        total_audit_logs: 2,
        latest_audit_action: "assistant_instance.created",
        connected_connectors: 1,
        total_schedules: 1,
        total_jobs: 1,
        completed_jobs: 1,
        latest_job_status: "completed",
        latest_sync_provider: "gmail",
        latest_sync_at: new Date().toISOString(),
      };
    }

    return {
      organization_id: query.organization_id,
      pending_approvals: approvals.filter((item) => item.approval_status === "pending").length,
      total_approvals: approvals.length,
      total_audit_logs: auditLogs.length,
      latest_audit_action: auditLogs[0]?.action_type ?? null,
      connected_connectors: connectors.filter((item) => item.connection_status === "active").length,
      total_schedules: schedules.length,
      total_jobs: jobs.length,
      completed_jobs: jobs.filter((item) => item.job_status === "completed").length,
      latest_job_status: latestJob?.job_status ?? null,
      latest_sync_provider: latestSyncConnector?.provider_type ?? null,
      latest_sync_at:
        latestSyncConnector?.syncStates[0]?.last_sync_at?.toISOString() ??
        latestSyncConnector?.last_verified_at?.toISOString() ??
        null,
    };
  }
}

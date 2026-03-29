import { Injectable } from "@nestjs/common";
import { AuditLogDto } from "../contracts/dto/audit-log.dto";
import { ListAuditLogsQuery } from "../contracts/queries/list-audit-logs.query";
import { AuditLogRepositoryImpl } from "@packages/infrastructure/src/repositories/audit-log.repository.impl";

@Injectable()
export class AuditService {
  constructor(private readonly auditLogRepository: AuditLogRepositoryImpl) {}

  async listAuditLogs(query: ListAuditLogsQuery): Promise<AuditLogDto[]> {
    const logs = await this.auditLogRepository.listByOrganization(query.organization_id, {
      action_type: query.action_type,
      target_type: query.target_type,
      actor_id: query.actor_id,
    });

    if (logs.length === 0) {
      return [
        {
          audit_log_id: "audit-demo-001",
          action_type: "assistant_instance.created",
          target_type: "assistant_instance",
          target_id: "ast_inst_demo_001",
          result_status: "success",
          created_at: new Date().toISOString(),
        },
        {
          audit_log_id: "audit-demo-002",
          action_type: "connector.authorization.started",
          target_type: "connector_account",
          target_id: "conn_demo_001",
          result_status: "success",
          created_at: new Date().toISOString(),
        },
      ];
    }

    return logs.map((log) => ({
      audit_log_id: log.audit_log_id,
      action_type: log.action_type,
      target_type: log.target_type ?? undefined,
      target_id: log.target_id ?? undefined,
      result_status: log.result_status,
      created_at: log.created_at.toISOString(),
    }));
  }
}

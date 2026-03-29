import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditLogRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  private get client(): PrismaClient {
    return this.prisma as PrismaClient;
  }

  listByOrganization(
    organizationId: string,
    filters?: { action_type?: string; target_type?: string; actor_id?: string },
  ) {
    return this.client.auditLog.findMany({
      where: {
        organization_id: organizationId,
        ...(filters?.action_type ? { action_type: filters.action_type } : {}),
        ...(filters?.target_type ? { target_type: filters.target_type } : {}),
        ...(filters?.actor_id ? { actor_id: filters.actor_id } : {}),
      },
      orderBy: { created_at: "desc" },
    });
  }

  create(log: {
    audit_log_id: string;
    organization_id: string;
    user_id?: string | null;
    actor_type: string;
    actor_id?: string | null;
    action_type: string;
    target_type?: string | null;
    target_id?: string | null;
    result_status: string;
    reason?: string | null;
    trace_id?: string | null;
    metadata_json?: string | null;
  }) {
    return this.client.auditLog.create({
      data: {
        audit_log_id: log.audit_log_id,
        organization_id: log.organization_id,
        user_id: log.user_id ?? null,
        actor_type: log.actor_type,
        actor_id: log.actor_id ?? null,
        action_type: log.action_type,
        target_type: log.target_type ?? null,
        target_id: log.target_id ?? null,
        result_status: log.result_status,
        reason: log.reason ?? null,
        trace_id: log.trace_id ?? null,
        metadata_json: log.metadata_json ?? null,
        created_at: new Date(),
      },
    });
  }
}

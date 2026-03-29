import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ApprovalRecordRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(organizationId: string, filters?: { approval_status?: string }) {
    return this.prisma.approvalRecord.findMany({
      where: {
        organization_id: organizationId,
        ...(filters?.approval_status ? { approval_status: filters.approval_status } : {}),
      },
      orderBy: { requested_at: "desc" },
    });
  }

  findById(approvalRecordId: string) {
    return this.prisma.approvalRecord.findUnique({
      where: { approval_record_id: approvalRecordId },
    });
  }

  save(record: {
    approval_record_id: string;
    organization_id: string;
    request_type: string;
    request_target_type: string;
    request_target_id: string;
    requested_by: string;
    requested_at: Date;
    approval_status: string;
    approved_by?: string | null;
    approved_at?: Date | null;
    rejected_by?: string | null;
    rejected_at?: Date | null;
    reason?: string | null;
    comments?: string | null;
  }) {
    return this.prisma.approvalRecord.upsert({
      where: { approval_record_id: record.approval_record_id },
      update: {
        approval_status: record.approval_status,
        approved_by: record.approved_by ?? null,
        approved_at: record.approved_at ?? null,
        rejected_by: record.rejected_by ?? null,
        rejected_at: record.rejected_at ?? null,
        reason: record.reason ?? null,
        comments: record.comments ?? null,
      },
      create: {
        approval_record_id: record.approval_record_id,
        organization_id: record.organization_id,
        request_type: record.request_type,
        request_target_type: record.request_target_type,
        request_target_id: record.request_target_id,
        requested_by: record.requested_by,
        requested_at: record.requested_at,
        approval_status: record.approval_status,
        approved_by: record.approved_by ?? null,
        approved_at: record.approved_at ?? null,
        rejected_by: record.rejected_by ?? null,
        rejected_at: record.rejected_at ?? null,
        reason: record.reason ?? null,
        comments: record.comments ?? null,
      },
    });
  }
}

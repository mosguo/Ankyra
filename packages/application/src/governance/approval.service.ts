import { Injectable } from "@nestjs/common";
import { ApproveRequestCommand } from "../contracts/commands/approve-request.command";
import { RejectRequestCommand } from "../contracts/commands/reject-request.command";
import { ApprovalRecordDto } from "../contracts/dto/approval-record.dto";
import { ListApprovalsQuery } from "../contracts/queries/list-approvals.query";
import { ApprovalRecordRepositoryImpl } from "@packages/infrastructure/src/repositories/approval-record.repository.impl";

@Injectable()
export class ApprovalService {
  constructor(private readonly approvalRecordRepository: ApprovalRecordRepositoryImpl) {}

  async listApprovals(query: ListApprovalsQuery): Promise<ApprovalRecordDto[]> {
    const approvals = await this.approvalRecordRepository.listByOrganization(
      query.organization_id,
      { approval_status: query.approval_status },
    );

    if (approvals.length === 0) {
      return [
        {
          approval_record_id: "approval-demo-001",
          request_type: "assistant_activation",
          request_target_type: "assistant_instance",
          request_target_id: "ast_inst_demo_001",
          approval_status: "pending",
          requested_at: new Date().toISOString(),
        },
      ];
    }

    return approvals.map((approval) => ({
      approval_record_id: approval.approval_record_id,
      request_type: approval.request_type,
      request_target_type: approval.request_target_type,
      request_target_id: approval.request_target_id,
      approval_status: approval.approval_status,
      requested_at: approval.requested_at.toISOString(),
    }));
  }

  async approveRequest(command: ApproveRequestCommand): Promise<ApprovalRecordDto> {
    const current = await this.approvalRecordRepository.findById(command.approval_record_id);

    if (!current) {
      return {
        approval_record_id: command.approval_record_id,
        request_type: "unknown",
        request_target_type: "unknown",
        request_target_id: "unknown",
        approval_status: "missing",
        requested_at: new Date().toISOString(),
      };
    }

    const saved = await this.approvalRecordRepository.save({
      approval_record_id: current.approval_record_id,
      organization_id: current.organization_id,
      request_type: current.request_type,
      request_target_type: current.request_target_type,
      request_target_id: current.request_target_id,
      requested_by: current.requested_by,
      requested_at: current.requested_at,
      approval_status: "approved",
      approved_by: command.operator_id,
      approved_at: new Date(),
      rejected_by: current.rejected_by,
      rejected_at: current.rejected_at,
      reason: current.reason,
      comments: command.comments ?? null,
    });

    return {
      approval_record_id: saved.approval_record_id,
      request_type: saved.request_type,
      request_target_type: saved.request_target_type,
      request_target_id: saved.request_target_id,
      approval_status: saved.approval_status,
      requested_at: saved.requested_at.toISOString(),
    };
  }

  async rejectRequest(command: RejectRequestCommand): Promise<ApprovalRecordDto> {
    const current = await this.approvalRecordRepository.findById(command.approval_record_id);

    if (!current) {
      return {
        approval_record_id: command.approval_record_id,
        request_type: "unknown",
        request_target_type: "unknown",
        request_target_id: "unknown",
        approval_status: "missing",
        requested_at: new Date().toISOString(),
      };
    }

    const saved = await this.approvalRecordRepository.save({
      approval_record_id: current.approval_record_id,
      organization_id: current.organization_id,
      request_type: current.request_type,
      request_target_type: current.request_target_type,
      request_target_id: current.request_target_id,
      requested_by: current.requested_by,
      requested_at: current.requested_at,
      approval_status: "rejected",
      approved_by: current.approved_by,
      approved_at: current.approved_at,
      rejected_by: command.operator_id,
      rejected_at: new Date(),
      reason: command.reason,
      comments: command.comments ?? null,
    });

    return {
      approval_record_id: saved.approval_record_id,
      request_type: saved.request_type,
      request_target_type: saved.request_target_type,
      request_target_id: saved.request_target_id,
      approval_status: saved.approval_status,
      requested_at: saved.requested_at.toISOString(),
    };
  }
}

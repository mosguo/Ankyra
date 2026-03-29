import { Body, Controller, Get, Patch, Query } from "@nestjs/common";
import { ApproveRequestCommand } from "@packages/application/src/contracts/commands/approve-request.command";
import { RejectRequestCommand } from "@packages/application/src/contracts/commands/reject-request.command";
import { ListApprovalsQuery } from "@packages/application/src/contracts/queries/list-approvals.query";
import { ApprovalService } from "@packages/application/src/governance/approval.service";

@Controller("governance/approvals")
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get()
  list(@Query() query: ListApprovalsQuery) {
    return this.approvalService.listApprovals(query);
  }

  @Patch("approve")
  approve(@Body() command: ApproveRequestCommand) {
    return this.approvalService.approveRequest(command);
  }

  @Patch("reject")
  reject(@Body() command: RejectRequestCommand) {
    return this.approvalService.rejectRequest(command);
  }
}

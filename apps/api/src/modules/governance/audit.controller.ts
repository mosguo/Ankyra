import { Controller, Get, Query } from "@nestjs/common";
import { ListAuditLogsQuery } from "@packages/application/src/contracts/queries/list-audit-logs.query";
import { AuditService } from "@packages/application/src/governance/audit.service";

@Controller("governance/audit-logs")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: ListAuditLogsQuery) {
    return this.auditService.listAuditLogs(query);
  }
}

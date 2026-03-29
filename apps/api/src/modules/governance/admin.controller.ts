import { Controller, Get, Query } from "@nestjs/common";
import { GetAdminSummaryQuery } from "@packages/application/src/contracts/queries/get-admin-summary.query";
import { AdminService } from "@packages/application/src/governance/admin.service";

@Controller("governance/admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("summary")
  getSummary(@Query() query: GetAdminSummaryQuery) {
    return this.adminService.getSummary(query);
  }
}

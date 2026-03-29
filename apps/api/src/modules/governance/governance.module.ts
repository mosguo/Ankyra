import { Module } from "@nestjs/common";
import { AdminService } from "@packages/application/src/governance/admin.service";
import { ApprovalService } from "@packages/application/src/governance/approval.service";
import { AuditService } from "@packages/application/src/governance/audit.service";
import { ApprovalRecordRepositoryImpl } from "@packages/infrastructure/src/repositories/approval-record.repository.impl";
import { AuditLogRepositoryImpl } from "@packages/infrastructure/src/repositories/audit-log.repository.impl";
import { ConnectorAccountRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-account.repository.impl";
import { JobRepositoryImpl } from "@packages/infrastructure/src/repositories/job.repository.impl";
import { ScheduleRepositoryImpl } from "@packages/infrastructure/src/repositories/schedule.repository.impl";
import { AdminController } from "./admin.controller";
import { ApprovalController } from "./approval.controller";
import { AuditController } from "./audit.controller";

@Module({
  controllers: [ApprovalController, AuditController, AdminController],
  providers: [
    ApprovalService,
    AuditService,
    AdminService,
    ApprovalRecordRepositoryImpl,
    AuditLogRepositoryImpl,
    ConnectorAccountRepositoryImpl,
    ScheduleRepositoryImpl,
    JobRepositoryImpl,
  ],
  exports: [ApprovalService, AuditService, AdminService],
})
export class GovernanceModule {}

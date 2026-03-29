import { Module } from "@nestjs/common";
import { IdentityModule } from "./modules/identity/identity.module";
import { AssistantsModule } from "./modules/assistants/assistants.module";
import { ConversationsModule } from "./modules/conversations/conversations.module";
import { ConnectorsModule } from "./modules/connectors/connectors.module";
import { SnapshotsModule } from "./modules/snapshots/snapshots.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { GovernanceModule } from "./modules/governance/governance.module";
import { BillingModule } from "./modules/billing/billing.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "@packages/infrastructure/src/prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    IdentityModule,
    AssistantsModule,
    ConversationsModule,
    ConnectorsModule,
    SnapshotsModule,
    NotificationsModule,
    GovernanceModule,
    BillingModule,
    JobsModule,
    HealthModule,
  ],
})
export class AppModule {}

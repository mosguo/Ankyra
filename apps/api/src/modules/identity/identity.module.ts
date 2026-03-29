import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "@packages/application/src/identity/auth.service";
import { MembershipRepositoryImpl } from "@packages/infrastructure/src/repositories/membership.repository.impl";
import { OAuthIdentityRepositoryImpl } from "@packages/infrastructure/src/repositories/oauth-identity.repository.impl";
import { OrganizationRepositoryImpl } from "@packages/infrastructure/src/repositories/organization.repository.impl";
import { UserRepositoryImpl } from "@packages/infrastructure/src/repositories/user.repository.impl";
import { UserSessionRepositoryImpl } from "@packages/infrastructure/src/repositories/user-session.repository.impl";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepositoryImpl,
    OAuthIdentityRepositoryImpl,
    MembershipRepositoryImpl,
    OrganizationRepositoryImpl,
    UserSessionRepositoryImpl,
  ],
  exports: [AuthService],
})
export class IdentityModule {}

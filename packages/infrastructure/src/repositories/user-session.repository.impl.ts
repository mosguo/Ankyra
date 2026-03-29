import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UserSessionRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByToken(sessionToken: string) {
    return this.prisma.userSession.findFirst({
      where: {
        session_token: sessionToken,
        session_status: "active",
        expires_at: { gt: new Date() },
      },
    });
  }

  save(input: {
    user_session_id: string;
    session_token: string;
    user_id: string;
    organization_id: string;
    session_status: string;
    expires_at: Date;
  }) {
    const now = new Date();

    return this.prisma.userSession.upsert({
      where: { user_session_id: input.user_session_id },
      update: {
        session_token: input.session_token,
        user_id: input.user_id,
        organization_id: input.organization_id,
        session_status: input.session_status,
        expires_at: input.expires_at,
        updated_at: now,
        last_seen_at: now,
      },
      create: {
        user_session_id: input.user_session_id,
        session_token: input.session_token,
        user_id: input.user_id,
        organization_id: input.organization_id,
        session_status: input.session_status,
        created_at: now,
        updated_at: now,
        expires_at: input.expires_at,
        last_seen_at: now,
      },
    });
  }

  touch(sessionToken: string) {
    const now = new Date();

    return this.prisma.userSession.updateMany({
      where: { session_token: sessionToken, session_status: "active" },
      data: { updated_at: now, last_seen_at: now },
    });
  }

  switchOrganization(sessionToken: string, organizationId: string) {
    const now = new Date();

    return this.prisma.userSession.updateMany({
      where: { session_token: sessionToken, session_status: "active" },
      data: {
        organization_id: organizationId,
        updated_at: now,
        last_seen_at: now,
      },
    });
  }

  revoke(sessionToken: string) {
    const now = new Date();

    return this.prisma.userSession.updateMany({
      where: { session_token: sessionToken, session_status: "active" },
      data: {
        session_status: "revoked",
        updated_at: now,
        last_seen_at: now,
      },
    });
  }
}

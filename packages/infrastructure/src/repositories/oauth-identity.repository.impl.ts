import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OAuthIdentityRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findByProviderSubject(provider: string, providerSubject: string) {
    return this.prisma.oAuthIdentity.findUnique({
      where: {
        provider_provider_subject: {
          provider,
          provider_subject: providerSubject,
        },
      },
    });
  }

  save(identity: {
    oauth_identity_id: string;
    user_id: string;
    provider: string;
    provider_subject: string;
    provider_email?: string | null;
    provider_tenant_id?: string | null;
    access_scope_snapshot?: string | null;
    status: string;
  }) {
    return this.prisma.oAuthIdentity.upsert({
      where: {
        provider_provider_subject: {
          provider: identity.provider,
          provider_subject: identity.provider_subject,
        },
      },
      update: {
        user_id: identity.user_id,
        provider_email: identity.provider_email ?? null,
        provider_tenant_id: identity.provider_tenant_id ?? null,
        access_scope_snapshot: identity.access_scope_snapshot ?? null,
        status: identity.status,
        last_login_at: new Date(),
      },
      create: {
        oauth_identity_id: identity.oauth_identity_id,
        user_id: identity.user_id,
        provider: identity.provider,
        provider_subject: identity.provider_subject,
        provider_email: identity.provider_email ?? null,
        provider_tenant_id: identity.provider_tenant_id ?? null,
        access_scope_snapshot: identity.access_scope_snapshot ?? null,
        linked_at: new Date(),
        last_login_at: new Date(),
        status: identity.status,
      },
    });
  }
}

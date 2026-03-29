import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConnectorAccountRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findById(connectorAccountId: string) {
    return this.prisma.connectorAccount.findUnique({
      where: { connector_account_id: connectorAccountId },
      include: {
        tokenRef: true,
        syncStates: true,
      },
    }) as Promise<any>;
  }

  listByUser(userId: string, organizationId: string) {
    return this.prisma.connectorAccount.findMany({
      where: {
        user_id: userId,
        organization_id: organizationId,
      },
      include: {
        tokenRef: true,
        syncStates: true,
      },
      orderBy: { linked_at: "desc" },
    }) as Promise<any>;
  }

  save(account: {
    connector_account_id: string;
    user_id: string;
    organization_id: string;
    provider_type: string;
    external_account_id?: string;
    account_email?: string;
    account_display_name?: string;
    connection_status: string;
    linked_at?: Date;
    last_verified_at?: Date | null;
    revoked_at?: Date | null;
  }) {
    return this.prisma.connectorAccount.upsert({
      where: { connector_account_id: account.connector_account_id },
      update: {
        external_account_id: account.external_account_id ?? null,
        account_email: account.account_email ?? null,
        account_display_name: account.account_display_name ?? null,
        connection_status: account.connection_status,
        last_verified_at: account.last_verified_at ?? null,
        revoked_at: account.revoked_at ?? null,
      },
      create: {
        connector_account_id: account.connector_account_id,
        user_id: account.user_id,
        organization_id: account.organization_id,
        provider_type: account.provider_type,
        external_account_id: account.external_account_id ?? null,
        account_email: account.account_email ?? null,
        account_display_name: account.account_display_name ?? null,
        connection_status: account.connection_status,
        linked_at: account.linked_at ?? new Date(),
        last_verified_at: account.last_verified_at ?? null,
        revoked_at: account.revoked_at ?? null,
      },
    });
  }
}

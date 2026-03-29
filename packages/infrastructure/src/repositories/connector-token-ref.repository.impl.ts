import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConnectorTokenRefRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findByConnectorAccountId(connectorAccountId: string) {
    return this.prisma.connectorTokenRef.findUnique({
      where: { connector_account_id: connectorAccountId },
    }) as Promise<any>;
  }

  save(input: {
    connector_token_ref_id: string;
    connector_account_id: string;
    access_token?: string | null;
    refresh_token?: string | null;
    scope_snapshot?: string | null;
    expires_at?: Date | null;
    token_status: string;
  }) {
    const now = new Date();

    return this.prisma.connectorTokenRef.upsert({
      where: { connector_account_id: input.connector_account_id },
      update: {
        access_token: input.access_token ?? null,
        refresh_token: input.refresh_token ?? null,
        scope_snapshot: input.scope_snapshot ?? null,
        expires_at: input.expires_at ?? null,
        token_status: input.token_status,
        updated_at: now,
      },
      create: {
        connector_token_ref_id: input.connector_token_ref_id,
        connector_account_id: input.connector_account_id,
        access_token: input.access_token ?? null,
        refresh_token: input.refresh_token ?? null,
        scope_snapshot: input.scope_snapshot ?? null,
        expires_at: input.expires_at ?? null,
        token_status: input.token_status,
        created_at: now,
        updated_at: now,
      },
    }) as Promise<any>;
  }
}

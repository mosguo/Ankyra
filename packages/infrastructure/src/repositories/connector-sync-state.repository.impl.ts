import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConnectorSyncStateRepositoryImpl {
  constructor(private readonly prisma: PrismaService) {}

  findByConnectorAccountId(connectorAccountId: string) {
    return this.prisma.connectorSyncState.findMany({
      where: { connector_account_id: connectorAccountId },
      orderBy: { sync_target: "asc" },
    });
  }

  async save(state: {
    connector_account_id: string;
    sync_target: string;
    last_sync_at?: Date | null;
    last_success_at?: Date | null;
    last_sync_cursor?: string | null;
    last_sync_status?: string | null;
    last_error_message?: string | null;
    next_sync_at?: Date | null;
  }) {
    const existing = await this.prisma.connectorSyncState.findFirst({
      where: {
        connector_account_id: state.connector_account_id,
        sync_target: state.sync_target,
      },
    });

    if (existing) {
      return this.prisma.connectorSyncState.update({
        where: { connector_sync_state_id: existing.connector_sync_state_id },
        data: {
          last_sync_at: state.last_sync_at ?? null,
          last_success_at: state.last_success_at ?? null,
          last_sync_cursor: state.last_sync_cursor ?? null,
          last_sync_status: state.last_sync_status ?? null,
          last_error_message: state.last_error_message ?? null,
          next_sync_at: state.next_sync_at ?? null,
        },
      });
    }

    return this.prisma.connectorSyncState.create({
      data: {
        connector_sync_state_id: `sync-${state.connector_account_id}-${state.sync_target}`,
        connector_account_id: state.connector_account_id,
        sync_target: state.sync_target,
        last_sync_at: state.last_sync_at ?? null,
        last_success_at: state.last_success_at ?? null,
        last_sync_cursor: state.last_sync_cursor ?? null,
        last_sync_status: state.last_sync_status ?? null,
        last_error_message: state.last_error_message ?? null,
        next_sync_at: state.next_sync_at ?? null,
      },
    });
  }
}

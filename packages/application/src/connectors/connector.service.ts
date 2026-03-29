import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { URL } from "node:url";
import { BeginConnectorAuthorizationCommand } from "../contracts/commands/begin-connector-authorization.command";
import { RevokeConnectorCommand } from "../contracts/commands/revoke-connector.command";
import { SyncConnectorCommand } from "../contracts/commands/sync-connector.command";
import { ConnectorAccountDto } from "../contracts/dto/connector-account.dto";
import { ListConnectorAccountsQuery } from "../contracts/queries/list-connector-accounts.query";
import { BriefingSnapshotService } from "../snapshots/briefing-snapshot.service";
import { NotificationDispatchService } from "../notifications/notification-dispatch.service";
import { TaskSnapshotService } from "../snapshots/task-snapshot.service";
import { ConnectorAccountRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-account.repository.impl";
import { ConnectorSyncStateRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-sync-state.repository.impl";
import { ConnectorTokenRefRepositoryImpl } from "@packages/infrastructure/src/repositories/connector-token-ref.repository.impl";

type ConnectorProvider = "gmail" | "outlook_mail";

interface ConnectorProviderConfig {
  provider: ConnectorProvider;
  display_name: string;
  mode: "demo" | "oauth2";
  client_id?: string;
  client_secret?: string;
  auth_url?: string;
  token_url?: string;
  scopes: string[];
}

interface ConnectorStatePayload {
  provider: ConnectorProvider;
  user_id: string;
  organization_id: string;
  frontend_redirect_uri: string;
  issued_at: number;
}

@Injectable()
export class ConnectorService {
  constructor(
    private readonly connectorAccountRepository: ConnectorAccountRepositoryImpl,
    private readonly connectorSyncStateRepository: ConnectorSyncStateRepositoryImpl,
    private readonly connectorTokenRefRepository: ConnectorTokenRefRepositoryImpl,
    private readonly taskSnapshotService: TaskSnapshotService,
    private readonly briefingSnapshotService: BriefingSnapshotService,
    private readonly notificationDispatchService: NotificationDispatchService,
  ) {}

  async beginConnectorAuthorization(command: BeginConnectorAuthorizationCommand) {
    const provider = this.normalizeProvider(command.provider);
    const config = this.getProviderConfig(provider);

    if (config.mode === "oauth2" && command.redirect_uri) {
      const state = this.signState({
        provider,
        user_id: command.user_id,
        organization_id: command.organization_id,
        frontend_redirect_uri: command.redirect_uri,
        issued_at: Date.now(),
      });

      const authorizationUrl = new URL(config.auth_url!);
      authorizationUrl.searchParams.set("client_id", config.client_id!);
      authorizationUrl.searchParams.set(
        "redirect_uri",
        this.getConnectorCallbackUrl(provider),
      );
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("scope", config.scopes.join(" "));
      authorizationUrl.searchParams.set("state", state);
      if (provider === "gmail") {
        authorizationUrl.searchParams.set("access_type", "offline");
        authorizationUrl.searchParams.set("prompt", "consent");
      }

      return {
        provider_type: provider,
        authorization_status: "redirect_required",
        authorization_mode: "oauth2" as const,
        authorization_url: authorizationUrl.toString(),
      };
    }

    const saved = await this.connectorAccountRepository.save({
      connector_account_id: `connector-${provider}-${Date.now()}`,
      user_id: command.user_id,
      organization_id: command.organization_id,
      provider_type: provider,
      external_account_id: `${provider}-demo-account`,
      account_email: `${provider}.demo@ankyra.local`,
      account_display_name: `${provider.toUpperCase()} Demo Account`,
      connection_status: "active",
      linked_at: new Date(),
      last_verified_at: new Date(),
      revoked_at: null,
    });

    return {
      connector_account_id: saved.connector_account_id,
      provider_type: saved.provider_type,
      account_email: saved.account_email ?? undefined,
      connection_status: saved.connection_status,
      last_verified_at: saved.last_verified_at?.toISOString(),
      authorization_status: "connected",
      authorization_mode: "demo" as const,
    };
  }

  async handleConnectorOAuthCallback(input: {
    provider: ConnectorProvider;
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }) {
    const fallbackRedirect = this.getDefaultFrontendBaseUrl();

    if (input.error) {
      const redirectUrl = new URL(fallbackRedirect);
      redirectUrl.searchParams.set("connector_error", input.error);
      return { redirect_url: redirectUrl.toString() };
    }

    if (!input.code || !input.state) {
      const redirectUrl = new URL(fallbackRedirect);
      redirectUrl.searchParams.set("connector_error", "missing_code_or_state");
      return { redirect_url: redirectUrl.toString() };
    }

    const state = this.verifyState(input.state);
    const profile = await this.exchangeConnectorCode(input.provider, input.code);
    const connectorAccountId = `connector-${input.provider}-${randomUUID().slice(0, 12)}`;

    const account = await this.connectorAccountRepository.save({
      connector_account_id: connectorAccountId,
      user_id: state.user_id,
      organization_id: state.organization_id,
      provider_type: input.provider,
      external_account_id: profile.external_account_id,
      account_email: profile.account_email ?? undefined,
      account_display_name: profile.account_display_name ?? undefined,
      connection_status: "active",
      linked_at: new Date(),
      last_verified_at: new Date(),
      revoked_at: null,
    });

    await this.connectorTokenRefRepository.save({
      connector_token_ref_id: `connector-token-${connectorAccountId}`,
      connector_account_id: connectorAccountId,
      access_token: profile.access_token,
      refresh_token: profile.refresh_token,
      scope_snapshot: profile.scope,
      expires_at: profile.expires_at,
      token_status: "active",
    });

    const redirectUrl = new URL(state.frontend_redirect_uri || fallbackRedirect);
    redirectUrl.searchParams.set("connector_status", "connected");
    redirectUrl.searchParams.set("connector_provider", input.provider);
    redirectUrl.searchParams.set("connector_account_id", account.connector_account_id);

    return {
      redirect_url: redirectUrl.toString(),
      connector_account_id: account.connector_account_id,
    };
  }

  async syncConnector(command: SyncConnectorCommand) {
    const target = command.sync_target ?? "mail";
    const account = await this.connectorAccountRepository.findById(command.connector_account_id);

    if (!account) {
      return {
        connector_account_id: command.connector_account_id,
        sync_target: target,
        sync_status: "missing",
        records_fetched: 0,
        tasks_detected: 0,
        briefing_items: 0,
      };
    }

    const connectorData = await this.fetchConnectorData(account);
    const now = new Date();
    const nextSyncAt = new Date(now.getTime() + 1000 * 60 * 30);

    await this.connectorSyncStateRepository.save({
      connector_account_id: account.connector_account_id,
      sync_target: target,
      last_sync_at: now,
      last_success_at: now,
      last_sync_cursor: `${target}-cursor-${now.getTime()}`,
      last_sync_status: connectorData.sync_status,
      last_error_message: connectorData.sync_status === "demo_fallback" ? "provider_not_configured" : null,
      next_sync_at: nextSyncAt,
    });

    await Promise.all([
      this.taskSnapshotService.saveGeneratedTaskSnapshot({
        user_id: account.user_id,
        organization_id: account.organization_id,
        source_job_id: (command as SyncConnectorCommand & { source_job_id?: string }).source_job_id ?? null,
        tasks: connectorData.tasks,
      }),
      this.briefingSnapshotService.saveGeneratedBriefingSnapshot({
        user_id: account.user_id,
        organization_id: account.organization_id,
        source_job_id: (command as SyncConnectorCommand & { source_job_id?: string }).source_job_id ?? null,
        sections: connectorData.sections,
      }),
      this.notificationDispatchService.dispatchSyncNotifications({
        user_id: account.user_id,
        organization_id: account.organization_id,
        job_id: (command as SyncConnectorCommand & { source_job_id?: string }).source_job_id ?? null,
        provider_type: account.provider_type,
        records_fetched: connectorData.records_fetched,
        tasks_detected: connectorData.tasks_detected,
        briefing_items: connectorData.briefing_items,
      }),
    ]);

    return {
      connector_account_id: account.connector_account_id,
      provider_type: account.provider_type,
      sync_target: target,
      sync_status: connectorData.sync_status,
      records_fetched: connectorData.records_fetched,
      tasks_detected: connectorData.tasks_detected,
      briefing_items: connectorData.briefing_items,
      synced_at: now.toISOString(),
      next_sync_at: nextSyncAt.toISOString(),
    };
  }

  async listConnectorAccounts(query: ListConnectorAccountsQuery): Promise<ConnectorAccountDto[]> {
    const accounts = await this.connectorAccountRepository.listByUser(
      query.user_id,
      query.organization_id,
    );

    return accounts.map((account) => {
      const mailSync = account.syncStates.find((syncState) => syncState.sync_target === "mail");
      const provider = this.normalizeProvider(account.provider_type);

      return {
        connector_account_id: account.connector_account_id,
        provider_type: account.provider_type,
        account_email: account.account_email ?? undefined,
        connection_status: account.connection_status,
        authorization_mode: this.getProviderConfig(provider).mode,
        requires_reconnect: !account.tokenRef && this.getProviderConfig(provider).mode === "oauth2",
        last_verified_at: account.last_verified_at?.toISOString(),
        last_sync_status: mailSync?.last_sync_status ?? undefined,
        last_sync_at: mailSync?.last_sync_at?.toISOString(),
        next_sync_at: mailSync?.next_sync_at?.toISOString(),
      };
    });
  }

  async revokeConnector(command: RevokeConnectorCommand) {
    const current = await this.connectorAccountRepository.findById(command.connector_account_id);

    if (!current) {
      return {
        connector_account_id: command.connector_account_id,
        revoked: false,
      };
    }

    const saved = await this.connectorAccountRepository.save({
      connector_account_id: current.connector_account_id,
      user_id: current.user_id,
      organization_id: current.organization_id,
      provider_type: current.provider_type,
      external_account_id: current.external_account_id ?? undefined,
      account_email: current.account_email ?? undefined,
      account_display_name: current.account_display_name ?? undefined,
      connection_status: "revoked",
      linked_at: current.linked_at,
      last_verified_at: current.last_verified_at,
      revoked_at: new Date(),
    });

    if (current.tokenRef) {
      await this.connectorTokenRefRepository.save({
        connector_token_ref_id: current.tokenRef.connector_token_ref_id,
        connector_account_id: current.connector_account_id,
        access_token: current.tokenRef.access_token,
        refresh_token: current.tokenRef.refresh_token,
        scope_snapshot: current.tokenRef.scope_snapshot,
        expires_at: current.tokenRef.expires_at,
        token_status: "revoked",
      });
    }

    return {
      connector_account_id: saved.connector_account_id,
      revoked: true,
      connection_status: saved.connection_status,
    };
  }

  private async fetchConnectorData(account: any) {
    const provider = this.normalizeProvider(account.provider_type);
    const token = account.tokenRef?.access_token;

    if (provider === "gmail" && token) {
      try {
        const records = await this.fetchGmailMessages(token);
        return this.mapMessagesToSnapshots(records, "gmail", "success");
      } catch {
        return this.buildDemoSync(account.provider_type, "gmail_api_failed");
      }
    }

    if (provider === "outlook_mail" && token) {
      try {
        const records = await this.fetchOutlookMessages(token);
        return this.mapMessagesToSnapshots(records, "outlook_mail", "success");
      } catch {
        return this.buildDemoSync(account.provider_type, "outlook_api_failed");
      }
    }

    return this.buildDemoSync(account.provider_type, "demo_fallback");
  }

  private async fetchGmailMessages(accessToken: string) {
    const listResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=newer_than:3d",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!listResponse.ok) {
      throw new Error("gmail_list_failed");
    }

    const listPayload = (await listResponse.json()) as {
      messages?: Array<{ id: string }>;
    };
    const ids = listPayload.messages?.map((message) => message.id) ?? [];

    const detailResults = await Promise.all(
      ids.map(async (messageId) => {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!detailResponse.ok) {
          return null;
        }
        const detail = (await detailResponse.json()) as {
          id?: string;
          internalDate?: string;
          payload?: { headers?: Array<{ name: string; value: string }> };
        };
        const headers = detail.payload?.headers ?? [];
        return {
          id: detail.id ?? messageId,
          subject: headers.find((header) => header.name === "Subject")?.value ?? "No subject",
          from: headers.find((header) => header.name === "From")?.value ?? "Unknown sender",
          timestamp: detail.internalDate
            ? new Date(Number(detail.internalDate)).toISOString()
            : new Date().toISOString(),
        };
      }),
    );

    return detailResults.filter(Boolean) as Array<{
      id: string;
      subject: string;
      from: string;
      timestamp: string;
    }>;
  }

  private async fetchOutlookMessages(accessToken: string) {
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/messages?$top=5&$select=id,subject,receivedDateTime,from,isRead",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error("outlook_messages_failed");
    }

    const payload = (await response.json()) as {
      value?: Array<{
        id?: string;
        subject?: string;
        receivedDateTime?: string;
        from?: { emailAddress?: { address?: string } };
      }>;
    };

    return (payload.value ?? []).map((message) => ({
      id: message.id ?? randomUUID(),
      subject: message.subject ?? "No subject",
      from: message.from?.emailAddress?.address ?? "Unknown sender",
      timestamp: message.receivedDateTime ?? new Date().toISOString(),
    }));
  }

  private mapMessagesToSnapshots(
    records: Array<{ id: string; subject: string; from: string; timestamp: string }>,
    source: string,
    syncStatus: string,
  ) {
    const tasks = records.map((record, index) => ({
      priority: index === 0 ? "P1" : "P2",
      title: record.subject,
      source,
      status: "open",
    }));

    const sections = [
      {
        title: "Inbox summary",
        items: records.slice(0, 3).map((record) => `${record.from}: ${record.subject}`),
      },
      {
        title: "Today",
        items: tasks.slice(0, 3).map((task) => task.title),
      },
    ];

    return {
      sync_status: syncStatus,
      records_fetched: records.length,
      tasks_detected: tasks.length,
      briefing_items: sections.reduce((total, section) => total + section.items.length, 0),
      tasks,
      sections,
    };
  }

  private buildDemoSync(providerType: string, syncStatus: string) {
    const tasks = [
      {
        priority: "P1",
        title: `Reply to ${providerType} priority inbox`,
        source: providerType,
        status: "open",
      },
      {
        priority: "P1",
        title: "Prepare standup blockers update",
        source: "connector-sync",
        status: "open",
      },
      {
        priority: "P2",
        title: "Review follow-up messages before noon",
        source: providerType,
        status: "open",
      },
    ];

    const sections = [
      {
        title: "Inbox summary",
        items: [
          `${providerType} sync fetched 12 items.`,
          "High-priority replies were detected for follow-up.",
        ],
      },
      {
        title: "Today",
        items: [
          "Reply to urgent mail threads.",
          "Prepare standup talking points from synced items.",
        ],
      },
      {
        title: "Risks",
        items: ["One pending customer escalation needs response before noon."],
      },
    ];

    return {
      sync_status: syncStatus,
      records_fetched: 12,
      tasks_detected: 4,
      briefing_items: 3,
      tasks,
      sections,
    };
  }

  private async exchangeConnectorCode(provider: ConnectorProvider, code: string) {
    const config = this.getProviderConfig(provider);
    if (config.mode !== "oauth2") {
      return {
        access_token: null,
        refresh_token: null,
        scope: config.scopes.join(" "),
        expires_at: null,
        external_account_id: `${provider}-demo-account`,
        account_email: `${provider}.demo@ankyra.local`,
        account_display_name: `${provider.toUpperCase()} Demo Account`,
      };
    }

    const tokenResponse = await fetch(config.token_url!, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.client_id!,
        client_secret: config.client_secret!,
        code,
        grant_type: "authorization_code",
        redirect_uri: this.getConnectorCallbackUrl(provider),
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`${provider}_token_exchange_failed`);
    }

    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };

    if (!tokenPayload.access_token) {
      throw new Error(`${provider}_access_token_missing`);
    }

    if (provider === "gmail") {
      const profileResponse = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/profile",
        {
          headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
        },
      );
      const profile = profileResponse.ok
        ? ((await profileResponse.json()) as { emailAddress?: string; messagesTotal?: number })
        : {};

      return {
        access_token: tokenPayload.access_token,
        refresh_token: tokenPayload.refresh_token ?? null,
        scope: tokenPayload.scope ?? config.scopes.join(" "),
        expires_at: tokenPayload.expires_in
          ? new Date(Date.now() + tokenPayload.expires_in * 1000)
          : null,
        external_account_id: profile.emailAddress ?? `gmail-${randomUUID().slice(0, 8)}`,
        account_email: profile.emailAddress ?? null,
        account_display_name: profile.emailAddress ?? "Gmail Account",
      };
    }

    const profileResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName",
      {
        headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      },
    );
    const profile = profileResponse.ok
      ? ((await profileResponse.json()) as {
          id?: string;
          displayName?: string;
          mail?: string;
          userPrincipalName?: string;
        })
      : {};

    return {
      access_token: tokenPayload.access_token,
      refresh_token: tokenPayload.refresh_token ?? null,
      scope: tokenPayload.scope ?? config.scopes.join(" "),
      expires_at: tokenPayload.expires_in
        ? new Date(Date.now() + tokenPayload.expires_in * 1000)
        : null,
      external_account_id: profile.id ?? `outlook-${randomUUID().slice(0, 8)}`,
      account_email: profile.mail ?? profile.userPrincipalName ?? null,
      account_display_name: profile.displayName ?? profile.mail ?? "Outlook Account",
    };
  }

  private getProviderConfig(provider: ConnectorProvider): ConnectorProviderConfig {
    const configs: ConnectorProviderConfig[] = [
      {
        provider: "gmail",
        display_name: "Gmail",
        mode:
          process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET ? "oauth2" : "demo",
        client_id: process.env.GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
        token_url: "https://oauth2.googleapis.com/token",
        scopes: [
          "openid",
          "email",
          "profile",
          "https://www.googleapis.com/auth/gmail.readonly",
        ],
      },
      {
        provider: "outlook_mail",
        display_name: "Outlook",
        mode:
          process.env.OUTLOOK_CLIENT_ID && process.env.OUTLOOK_CLIENT_SECRET
            ? "oauth2"
            : "demo",
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        auth_url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        token_url: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        scopes: ["openid", "email", "profile", "offline_access", "Mail.Read", "User.Read"],
      },
    ];

    return configs.find((config) => config.provider === provider)!;
  }

  private normalizeProvider(provider: string): ConnectorProvider {
    return provider === "outlook_mail" ? "outlook_mail" : "gmail";
  }

  private signState(payload: ConnectorStatePayload): string {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${body}.${body.length}`;
  }

  private verifyState(state: string): ConnectorStatePayload {
    const [body] = state.split(".");
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ConnectorStatePayload;
  }

  private getConnectorCallbackUrl(provider: ConnectorProvider) {
    const apiBaseUrl = process.env.APP_API_BASE_URL ?? "http://localhost:3000";
    return `${apiBaseUrl}/api/connectors/oauth/callback/${provider}`;
  }

  private getDefaultFrontendBaseUrl() {
    return process.env.APP_WEB_BASE_URL ?? "http://localhost:5173";
  }
}

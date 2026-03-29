import { Body, Controller, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import { BeginConnectorAuthorizationCommand } from "@packages/application/src/contracts/commands/begin-connector-authorization.command";
import { ListConnectorAccountsQuery } from "@packages/application/src/contracts/queries/list-connector-accounts.query";
import { RevokeConnectorCommand } from "@packages/application/src/contracts/commands/revoke-connector.command";
import { SyncConnectorCommand } from "@packages/application/src/contracts/commands/sync-connector.command";
import { ConnectorService } from "@packages/application/src/connectors/connector.service";

@Controller("connectors")
export class ConnectorController {
  constructor(private readonly connectorService: ConnectorService) {}

  @Get()
  list(@Query() query: ListConnectorAccountsQuery) {
    return this.connectorService.listConnectorAccounts(query);
  }

  @Post("authorize")
  authorize(@Body() command: BeginConnectorAuthorizationCommand) {
    return this.connectorService.beginConnectorAuthorization(command);
  }

  @Get("oauth/callback/:provider")
  async handleConnectorOAuthCallback(
    @Param("provider") provider: "gmail" | "outlook_mail",
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Query("error_description") errorDescription: string | undefined,
    @Res() response: any,
  ) {
    const result = await this.connectorService.handleConnectorOAuthCallback({
      provider,
      code,
      state,
      error,
      error_description: errorDescription,
    });

    return response.redirect(result.redirect_url);
  }

  @Post(":connector_account_id/sync")
  sync(
    @Param("connector_account_id") connectorAccountId: string,
    @Body() command: Omit<SyncConnectorCommand, "connector_account_id">,
  ) {
    return this.connectorService.syncConnector({
      ...command,
      connector_account_id: connectorAccountId,
    });
  }

  @Patch(":connector_account_id/revoke")
  revoke(
    @Param("connector_account_id") connectorAccountId: string,
    @Body() command: Omit<RevokeConnectorCommand, "connector_account_id">,
  ) {
    return this.connectorService.revokeConnector({
      ...command,
      connector_account_id: connectorAccountId,
    });
  }
}

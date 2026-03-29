import { Body, Controller, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import { AuthService } from "@packages/application/src/identity/auth.service";
import { BeginOAuthLoginCommand } from "@packages/application/src/contracts/commands/begin-oauth-login.command";
import { HandleOAuthCallbackCommand } from "@packages/application/src/contracts/commands/handle-oauth-callback.command";
import { LogoutCommand } from "@packages/application/src/contracts/commands/logout.command";
import { GetCurrentAuthContextQuery } from "@packages/application/src/contracts/queries/get-current-auth-context.query";
import { SwitchOrganizationCommand } from "@packages/application/src/contracts/commands/switch-organization.command";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("providers")
  listOAuthProviders() {
    return this.authService.listOAuthProviders();
  }

  @Post("oauth/begin")
  beginOAuthLogin(@Body() command: BeginOAuthLoginCommand) {
    return this.authService.beginOAuthLogin(command);
  }

  @Post("oauth/callback")
  async handleOAuthCallback(
    @Body() command: HandleOAuthCallbackCommand,
    @Res({ passthrough: true }) response: any,
  ) {
    const authContext = await this.authService.handleOAuthCallback(command);
    this.setSessionCookie(response, authContext.session_token);
    return authContext;
  }

  @Get("oauth/callback/:provider")
  async handleOAuthRedirectCallback(
    @Param("provider") provider: "google" | "microsoft" | "wechat" | "twitter",
    @Query("code") code: string | undefined,
    @Query("state") state: string | undefined,
    @Query("error") error: string | undefined,
    @Query("error_description") errorDescription: string | undefined,
    @Res() response: any,
  ) {
    const result = await this.authService.handleOAuthRedirectCallback({
      provider,
      code,
      state,
      error,
      error_description: errorDescription,
    });

    this.setSessionCookie(response, result.authContext?.session_token);
    return response.redirect(result.redirect_url);
  }

  @Get("context")
  getCurrentAuthContext(@Query() query: GetCurrentAuthContextQuery, @Req() request: any) {
    const sessionToken = query.session_token ?? readCookie(request.headers?.cookie, "ankyra_session");
    return this.authService.getCurrentAuthContext({
      ...query,
      session_token: sessionToken,
    });
  }

  @Post("switch-organization")
  async switchOrganization(
    @Body() command: SwitchOrganizationCommand,
    @Res({ passthrough: true }) response: any,
    @Req() request: any,
  ) {
    const authContext = await this.authService.switchOrganization({
      ...command,
      session_token: command.session_token ?? readCookie(request.headers?.cookie, "ankyra_session"),
    });
    this.setSessionCookie(response, authContext.session_token);
    return authContext;
  }

  @Post("logout")
  async logout(
    @Body() command: LogoutCommand,
    @Res({ passthrough: true }) response: any,
    @Req() request: any,
  ) {
    const sessionToken = command.session_token ?? readCookie(request.headers?.cookie, "ankyra_session");
    if (sessionToken) {
      await this.authService.logout({ session_token: sessionToken });
    }
    this.clearSessionCookie(response);
    return { logged_out: true };
  }

  private setSessionCookie(response: any, sessionToken?: string) {
    if (!sessionToken?.length) {
      return;
    }

    response.cookie?.("ankyra_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearSessionCookie(response: any) {
    response.clearCookie?.("ankyra_session", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
  }
}

function readCookie(cookieHeader: string | undefined, key: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const rawCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));

  return rawCookie ? decodeURIComponent(rawCookie.slice(key.length + 1)) : undefined;
}

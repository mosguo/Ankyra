import { Injectable } from "@nestjs/common";
import { createHmac, randomUUID } from "node:crypto";
import { URL } from "node:url";
import { BeginOAuthLoginCommand } from "../contracts/commands/begin-oauth-login.command";
import { HandleOAuthCallbackCommand } from "../contracts/commands/handle-oauth-callback.command";
import { LogoutCommand } from "../contracts/commands/logout.command";
import { SwitchOrganizationCommand } from "../contracts/commands/switch-organization.command";
import { AuthContextDto } from "../contracts/dto/auth-context.dto";
import { GetCurrentAuthContextQuery } from "../contracts/queries/get-current-auth-context.query";
import { MembershipRepositoryImpl } from "@packages/infrastructure/src/repositories/membership.repository.impl";
import { OAuthIdentityRepositoryImpl } from "@packages/infrastructure/src/repositories/oauth-identity.repository.impl";
import { OrganizationRepositoryImpl } from "@packages/infrastructure/src/repositories/organization.repository.impl";
import { UserRepositoryImpl } from "@packages/infrastructure/src/repositories/user.repository.impl";
import { UserSessionRepositoryImpl } from "@packages/infrastructure/src/repositories/user-session.repository.impl";

type ProviderName = "google" | "microsoft" | "wechat" | "twitter";
type AuthorizationMode = "demo" | "oauth2";

interface ProviderProfile {
  subject: string;
  email?: string | null;
  display_name: string;
  tenant_id?: string | null;
}

interface OAuthProviderConfig {
  provider: ProviderName;
  display_name: string;
  mode: AuthorizationMode;
  client_id?: string;
  client_secret?: string;
  auth_url?: string;
  token_url?: string;
  userinfo_url?: string;
  tenant_id?: string;
  scopes?: string[];
}

interface OAuthStatePayload {
  provider: ProviderName;
  frontend_redirect_uri: string;
  issued_at: number;
}

interface SessionTokenPayload {
  session_id: string;
  user_id: string;
  exp: number;
}

export interface AuthorizationUrlResult {
  provider: string;
  state: string;
  authorization_mode: AuthorizationMode;
  authorization_url: string;
}

export interface OAuthProviderDescriptor {
  provider: ProviderName;
  display_name: string;
  enabled: boolean;
  mode: AuthorizationMode;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly oauthIdentityRepository: OAuthIdentityRepositoryImpl,
    private readonly membershipRepository: MembershipRepositoryImpl,
    private readonly organizationRepository: OrganizationRepositoryImpl,
    private readonly userSessionRepository: UserSessionRepositoryImpl,
  ) {}

  listOAuthProviders(): OAuthProviderDescriptor[] {
    return this.getProviderConfigs().map((config) => ({
      provider: config.provider,
      display_name: config.display_name,
      enabled: true,
      mode: config.mode,
    }));
  }

  beginOAuthLogin(command: BeginOAuthLoginCommand): AuthorizationUrlResult {
    const config = this.getProviderConfig(command.provider);
    const state = this.signState({
      provider: command.provider,
      frontend_redirect_uri: command.redirect_uri,
      issued_at: Date.now(),
    });

    if (config.mode === "oauth2" && config.client_id && config.auth_url) {
      const authorizationUrl = new URL(config.auth_url);
      authorizationUrl.searchParams.set("client_id", config.client_id);
      authorizationUrl.searchParams.set(
        "redirect_uri",
        this.getBackendOAuthCallbackUrl(command.provider),
      );
      authorizationUrl.searchParams.set("response_type", "code");
      authorizationUrl.searchParams.set("scope", (config.scopes ?? []).join(" "));
      authorizationUrl.searchParams.set("state", state);
      authorizationUrl.searchParams.set("prompt", "consent");

      return {
        provider: command.provider,
        state,
        authorization_mode: "oauth2",
        authorization_url: authorizationUrl.toString(),
      };
    }

    return {
      provider: command.provider,
      state,
      authorization_mode: "demo",
      authorization_url: `${command.redirect_uri}?provider=${command.provider}&state=${state}&code=demo-${command.provider}`,
    };
  }

  async handleOAuthCallback(command: HandleOAuthCallbackCommand): Promise<AuthContextDto> {
    const state = this.verifyState(command.state);
    const profile = await this.resolveProviderProfile(command.provider, command.code);

    const existingIdentity = await this.oauthIdentityRepository.findByProviderSubject(
      command.provider,
      profile.subject,
    );

    const user =
      (existingIdentity
        ? await this.userRepository.findById(existingIdentity.user_id)
        : null) ??
      (profile.email ? await this.userRepository.findByEmail(profile.email) : null) ??
      (await this.userRepository.save({
        user_id: `usr_${command.provider}_${randomUUID().slice(0, 8)}`,
        user_code: `${command.provider.toUpperCase()}_${randomUUID().slice(0, 6).toUpperCase()}`,
        display_name: profile.display_name,
        email: profile.email ?? undefined,
        status: "active",
        default_organization_id: "org_demo_001",
      }));

    await this.oauthIdentityRepository.save({
      oauth_identity_id:
        existingIdentity?.oauth_identity_id ?? `oauth_${command.provider}_${user.user_id}`,
      user_id: user.user_id,
      provider: command.provider,
      provider_subject: profile.subject,
      provider_email: profile.email ?? null,
      provider_tenant_id: profile.tenant_id ?? null,
      access_scope_snapshot: "openid email profile",
      status: "active",
    });

    const organizationId = user.default_organization_id ?? "org_demo_001";
    const session = await this.createSession(user.user_id, organizationId);

    return this.buildAuthContext(
      user.user_id,
      organizationId,
      session.session_token,
      session.expires_at,
    );
  }

  async handleOAuthRedirectCallback(input: {
    provider: ProviderName;
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  }): Promise<{ authContext?: AuthContextDto; redirect_url: string }> {
    const fallbackRedirect = this.getDefaultFrontendBaseUrl();

    if (input.error) {
      const redirectUrl = new URL(fallbackRedirect);
      redirectUrl.searchParams.set("oauth_error", input.error);
      if (input.error_description) {
        redirectUrl.searchParams.set("oauth_error_description", input.error_description);
      }
      return { redirect_url: redirectUrl.toString() };
    }

    if (!input.code || !input.state) {
      const redirectUrl = new URL(fallbackRedirect);
      redirectUrl.searchParams.set("oauth_error", "missing_code_or_state");
      return { redirect_url: redirectUrl.toString() };
    }

    const parsedState = this.verifyState(input.state);
    const authContext = await this.handleOAuthCallback({
      provider: input.provider,
      code: input.code,
      state: input.state,
    });

    const redirectUrl = new URL(parsedState.frontend_redirect_uri || fallbackRedirect);
    if (authContext.session_token) {
      redirectUrl.searchParams.set("session_token", authContext.session_token);
    }
    redirectUrl.searchParams.set("provider", input.provider);

    return {
      authContext,
      redirect_url: redirectUrl.toString(),
    };
  }

  async getCurrentAuthContext(query: GetCurrentAuthContextQuery): Promise<AuthContextDto> {
    if (query.session_token) {
      const session = await this.findValidSession(query.session_token);
      if (session) {
        await this.userSessionRepository.touch(query.session_token);
        return this.buildAuthContext(
          session.user_id,
          session.organization_id,
          session.session_token,
          session.expires_at,
        );
      }
    }

    const user =
      (query.user_id ? await this.userRepository.findById(query.user_id) : null) ??
      (await this.userRepository.findById("usr_user_001")) ??
      (await this.userRepository.findByEmail("user@demo.local"));

    return this.buildAuthContext(
      user?.user_id ?? "usr_user_001",
      user?.default_organization_id ?? "org_demo_001",
    );
  }

  async switchOrganization(command: SwitchOrganizationCommand): Promise<AuthContextDto> {
    if (command.session_token) {
      await this.userSessionRepository.switchOrganization(
        command.session_token,
        command.organization_id,
      );

      const session = await this.findValidSession(command.session_token);
      if (session) {
        return this.buildAuthContext(
          session.user_id,
          session.organization_id,
          session.session_token,
          session.expires_at,
        );
      }
    }

    return this.buildAuthContext(command.user_id, command.organization_id);
  }

  async logout(command: LogoutCommand): Promise<{ logged_out: boolean }> {
    await this.userSessionRepository.revoke(command.session_token);
    return { logged_out: true };
  }

  private async buildAuthContext(
    userId: string,
    preferredOrganizationId: string,
    sessionToken?: string,
    sessionExpiresAt?: Date,
  ): Promise<AuthContextDto> {
    const user = await this.userRepository.findById(userId);
    const memberships = await this.membershipRepository.findByUserId(userId);
    const targetMembership =
      memberships.find((membership) => membership.organization_id === preferredOrganizationId) ??
      memberships[0];
    const targetOrganizationId =
      targetMembership?.organization_id ?? user?.default_organization_id ?? "org_demo_001";
    const organization = await this.organizationRepository.findById(targetOrganizationId);
    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const membershipOrganization = await this.organizationRepository.findById(
          membership.organization_id,
        );
        return {
          organization_id: membership.organization_id,
          organization_name:
            membershipOrganization?.organization_name ?? membership.organization_id,
        };
      }),
    );

    return {
      session_token: sessionToken,
      session_expires_at: sessionExpiresAt?.toISOString(),
      user_id: user?.user_id ?? userId,
      display_name: user?.display_name ?? "Demo User",
      email: user?.email ?? "user@demo.local",
      current_organization: {
        organization_id: organization?.organization_id ?? targetOrganizationId,
        organization_name: organization?.organization_name ?? "Ankyra Demo Org",
      },
      organizations,
      roles: ["end_user"],
    };
  }

  private async createSession(userId: string, organizationId: string) {
    const userSessionId = `sess_${randomUUID().replace(/-/g, "")}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const sessionToken = this.signSessionToken({
      session_id: userSessionId,
      user_id: userId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    });

    return this.userSessionRepository.save({
      user_session_id: userSessionId,
      session_token: sessionToken,
      user_id: userId,
      organization_id: organizationId,
      session_status: "active",
      expires_at: expiresAt,
    });
  }

  private async findValidSession(sessionToken: string) {
    const payload = this.verifySessionToken(sessionToken);
    if (!payload) {
      return null;
    }
    return this.userSessionRepository.findActiveByToken(sessionToken);
  }

  private getProviderConfigs(): OAuthProviderConfig[] {
    const microsoftTenantId = process.env.MICROSOFT_OAUTH_TENANT_ID ?? "common";

    return [
      {
        provider: "google",
        display_name: "Google",
        mode:
          process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET
            ? "oauth2"
            : "demo",
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        auth_url: "https://accounts.google.com/o/oauth2/v2/auth",
        token_url: "https://oauth2.googleapis.com/token",
        userinfo_url: "https://openidconnect.googleapis.com/v1/userinfo",
        scopes: ["openid", "email", "profile"],
      },
      {
        provider: "microsoft",
        display_name: "Microsoft",
        mode:
          process.env.MICROSOFT_OAUTH_CLIENT_ID && process.env.MICROSOFT_OAUTH_CLIENT_SECRET
            ? "oauth2"
            : "demo",
        client_id: process.env.MICROSOFT_OAUTH_CLIENT_ID,
        client_secret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET,
        tenant_id: microsoftTenantId,
        auth_url: `https://login.microsoftonline.com/${microsoftTenantId}/oauth2/v2.0/authorize`,
        token_url: `https://login.microsoftonline.com/${microsoftTenantId}/oauth2/v2.0/token`,
        userinfo_url: "https://graph.microsoft.com/oidc/userinfo",
        scopes: ["openid", "email", "profile", "User.Read"],
      },
      {
        provider: "wechat",
        display_name: "WeChat",
        mode: "demo",
      },
      {
        provider: "twitter",
        display_name: "Twitter",
        mode: "demo",
      },
    ];
  }

  private getProviderConfig(provider: ProviderName) {
    return this.getProviderConfigs().find((item) => item.provider === provider)!;
  }

  private async resolveProviderProfile(
    provider: ProviderName,
    code: string,
  ): Promise<ProviderProfile> {
    const config = this.getProviderConfig(provider);
    if (config.mode !== "oauth2" || code.startsWith("demo-")) {
      return {
        subject: `${provider}:${code}`,
        email: `${provider}.demo@ankyra.local`,
        display_name: `${capitalize(provider)} Demo User`,
        tenant_id: provider === "microsoft" ? "tenant-demo-microsoft" : null,
      };
    }

    const redirectUri = this.getBackendOAuthCallbackUrl(provider);
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
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`OAuth token exchange failed for ${provider}`);
    }

    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: string;
      id_token?: string;
    };

    if (!tokenPayload.access_token) {
      throw new Error(`OAuth access token missing for ${provider}`);
    }

    const userinfoResponse = await fetch(config.userinfo_url!, {
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
    });

    if (!userinfoResponse.ok) {
      throw new Error(`OAuth userinfo fetch failed for ${provider}`);
    }

    const userinfo = (await userinfoResponse.json()) as Record<string, unknown>;

    if (provider === "google") {
      return {
        subject: String(userinfo.sub ?? ""),
        email: userinfo.email ? String(userinfo.email) : null,
        display_name: String(userinfo.name ?? userinfo.email ?? "Google User"),
        tenant_id: null,
      };
    }

    return {
      subject: String(userinfo.sub ?? userinfo.id ?? ""),
      email: userinfo.email ? String(userinfo.email) : null,
      display_name: String(userinfo.name ?? userinfo.preferred_username ?? "Microsoft User"),
      tenant_id: config.tenant_id ?? null,
    };
  }

  private signState(payload: OAuthStatePayload): string {
    return this.encodeSignedPayload(payload);
  }

  private verifyState(state: string): OAuthStatePayload {
    const payload = this.decodeSignedPayload<OAuthStatePayload>(state);
    if (!payload) {
      throw new Error("Invalid OAuth state");
    }
    return payload;
  }

  private signSessionToken(payload: SessionTokenPayload): string {
    return this.encodeSignedPayload(payload);
  }

  private verifySessionToken(token: string): SessionTokenPayload | null {
    const payload = this.decodeSignedPayload<SessionTokenPayload>(token);
    if (!payload) {
      return null;
    }
    if (payload.exp * 1000 <= Date.now()) {
      return null;
    }
    return payload;
  }

  private encodeSignedPayload(payload: object): string {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", this.getSessionSecret()).update(body).digest("base64url");
    return `${body}.${signature}`;
  }

  private decodeSignedPayload<T>(token: string): T | null {
    const [body, signature] = token.split(".");
    if (!body || !signature) {
      return null;
    }

    const expectedSignature = createHmac("sha256", this.getSessionSecret())
      .update(body)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    try {
      return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
    } catch {
      return null;
    }
  }

  private getSessionSecret(): string {
    return process.env.AUTH_SESSION_SECRET ?? "ankyra-dev-session-secret";
  }

  private getBackendOAuthCallbackUrl(provider: ProviderName): string {
    const apiBaseUrl = process.env.APP_API_BASE_URL ?? "http://localhost:3000";
    return `${apiBaseUrl}/api/auth/oauth/callback/${provider}`;
  }

  private getDefaultFrontendBaseUrl(): string {
    return process.env.APP_WEB_BASE_URL ?? "http://localhost:5173";
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

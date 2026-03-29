export interface BeginConnectorAuthorizationCommand {
  user_id: string;
  organization_id: string;
  provider: string;
  redirect_uri?: string;
}

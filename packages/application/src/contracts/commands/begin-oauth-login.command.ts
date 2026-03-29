export interface BeginOAuthLoginCommand {
  provider: "google" | "microsoft" | "wechat" | "twitter";
  redirect_uri: string;
}

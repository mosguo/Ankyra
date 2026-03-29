export interface HandleOAuthCallbackCommand {
  provider: "google" | "microsoft" | "wechat" | "twitter";
  code: string;
  state: string;
}

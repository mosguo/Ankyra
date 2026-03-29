export interface OAuthIdentityEntity {
  oauth_identity_id: string;
  user_id: string;
  provider: string;
  provider_subject: string;
  provider_email?: string;
  status: string;
}

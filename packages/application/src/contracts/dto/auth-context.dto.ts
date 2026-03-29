export interface AuthContextDto {
  session_token?: string;
  session_expires_at?: string;
  user_id: string;
  display_name: string;
  email?: string;
  current_organization: {
    organization_id: string;
    organization_name: string;
  };
  organizations?: Array<{
    organization_id: string;
    organization_name: string;
  }>;
  roles: string[];
}

export interface UserEntity {
  user_id: string;
  user_code: string;
  display_name: string;
  email?: string;
  preferred_language?: string;
  timezone?: string;
  status: string;
  default_organization_id?: string;
}

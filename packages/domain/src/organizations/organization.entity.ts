export interface OrganizationEntity {
  organization_id: string;
  organization_code: string;
  organization_name: string;
  organization_type: string;
  status: string;
  default_language?: string;
  default_timezone?: string;
}

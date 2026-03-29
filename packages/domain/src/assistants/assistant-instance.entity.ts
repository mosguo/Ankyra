export interface AssistantInstanceEntity {
  assistant_instance_id: string;
  assistant_definition_id: string;
  assistant_version_id: string;
  user_id: string;
  organization_id: string;
  instance_name?: string;
  instance_status: string;
  approval_status: string;
}

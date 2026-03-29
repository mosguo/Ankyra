export interface AssistantInstanceDto {
  assistant_instance_id: string;
  assistant_definition_id: string;
  assistant_version_id: string;
  instance_name?: string;
  instance_status: string;
  approval_status: string;
}

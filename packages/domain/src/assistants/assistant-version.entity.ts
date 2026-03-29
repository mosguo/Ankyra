export interface AssistantVersionEntity {
  assistant_version_id: string;
  assistant_definition_id: string;
  version_number: string;
  version_label?: string;
  status: string;
}

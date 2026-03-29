export interface CreateAssistantInstanceCommand {
  user_id: string;
  organization_id: string;
  assistant_definition_id: string;
  instance_name?: string;
}

export interface UpgradeAssistantInstanceCommand {
  assistant_instance_id: string;
  target_assistant_definition_id: string;
  operator_id: string;
  reason?: string;
}

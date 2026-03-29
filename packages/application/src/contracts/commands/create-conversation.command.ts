export interface CreateConversationCommand {
  user_id: string;
  assistant_instance_id: string;
  channel?: string;
}

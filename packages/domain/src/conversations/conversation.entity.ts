export interface ConversationEntity {
  conversation_id: string;
  assistant_instance_id: string;
  user_id: string;
  organization_id: string;
  openai_conversation_id?: string;
  channel?: string;
  conversation_status: string;
}

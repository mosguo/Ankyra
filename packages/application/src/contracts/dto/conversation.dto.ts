export interface ConversationDto {
  conversation_id: string;
  assistant_instance_id: string;
  conversation_status: string;
  channel?: string;
  last_activity_at?: string;
}

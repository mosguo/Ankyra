export interface ConversationEventEntity {
  conversation_event_id: string;
  conversation_id: string;
  event_type: string;
  event_sequence: number;
  actor_type: string;
}

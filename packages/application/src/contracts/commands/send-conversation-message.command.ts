export interface SendConversationMessageCommand {
  conversation_id: string;
  user_id: string;
  content: string;
}

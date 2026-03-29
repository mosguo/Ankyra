export interface ListConversationsQuery {
  user_id: string;
  assistant_instance_id?: string;
  status?: string;
}

export interface ListAuditLogsQuery {
  organization_id: string;
  action_type?: string;
  target_type?: string;
  actor_id?: string;
}

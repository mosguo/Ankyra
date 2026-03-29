export interface AuditLogDto {
  audit_log_id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  result_status: string;
  created_at: string;
}

export interface AuditLogEntity {
  audit_log_id: string;
  organization_id: string;
  action_type: string;
  result_status: string;
}

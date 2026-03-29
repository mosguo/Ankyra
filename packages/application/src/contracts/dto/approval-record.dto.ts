export interface ApprovalRecordDto {
  approval_record_id: string;
  request_type: string;
  request_target_type: string;
  request_target_id: string;
  approval_status: string;
  requested_at: string;
}

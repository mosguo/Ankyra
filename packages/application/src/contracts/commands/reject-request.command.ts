export interface RejectRequestCommand {
  approval_record_id: string;
  operator_id: string;
  reason: string;
  comments?: string;
}

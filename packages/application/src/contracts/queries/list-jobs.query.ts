export interface ListJobsQuery {
  user_id: string;
  organization_id: string;
  job_status?: string;
  trigger_type?: string;
  search?: string;
}

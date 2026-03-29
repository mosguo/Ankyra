export interface TaskSnapshotDto {
  task_snapshot_id: string;
  snapshot_date: string;
  snapshot_type: string;
  tasks: unknown[];
}

import { demoData, isDemoApiError } from "./demo-data";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export interface AuthContext {
  session_token?: string;
  session_expires_at?: string;
  user_id: string;
  display_name: string;
  email?: string;
  current_organization: {
    organization_id: string;
    organization_name: string;
  };
  organizations?: Array<{
    organization_id: string;
    organization_name: string;
  }>;
  roles: string[];
}

export interface OAuthProvider {
  provider: "google" | "microsoft" | "wechat" | "twitter";
  display_name: string;
  enabled: boolean;
  mode: "demo" | "oauth2";
}

export interface AssistantCatalogItem {
  assistant_definition_id: string;
  assistant_code: string;
  assistant_name: string;
  assistant_description?: string;
  work_type: string;
  capability_level: string;
  active_version_id?: string;
  active_version_number?: string | null;
  active_version_label?: string | null;
  requires_approval?: boolean;
  supports_memory?: boolean;
  supports_tools?: boolean;
}

export interface AssistantInstance {
  assistant_instance_id: string;
  assistant_definition_id: string;
  assistant_version_id: string;
  instance_name?: string;
  instance_status: string;
  approval_status: string;
}

export interface ConversationItem {
  conversation_id: string;
  assistant_instance_id: string;
  conversation_status: string;
  channel?: string;
  last_activity_at?: string;
}

export interface ConversationDetail extends ConversationItem {
  events: Array<{
    conversation_event_id: string;
    event_type: string;
    actor_type: string;
    content_json?: string | null;
    created_at: string;
  }>;
}

export interface TaskSnapshot {
  task_snapshot_id: string;
  snapshot_date: string;
  snapshot_type: string;
  tasks: Array<{
    priority: string;
    title: string;
    source: string;
    status: string;
  }>;
}

export interface BriefingSnapshot {
  briefing_snapshot_id: string;
  briefing_date: string;
  briefing_type: string;
  sections: Array<{
    title: string;
    items: string[];
  }>;
}

export interface ConnectorAccount {
  connector_account_id: string;
  provider_type: string;
  account_email?: string;
  connection_status: string;
  authorization_mode?: "demo" | "oauth2";
  requires_reconnect?: boolean;
  last_verified_at?: string;
  last_sync_status?: string;
  last_sync_at?: string;
  next_sync_at?: string;
}

export interface ConnectorSyncResult {
  connector_account_id: string;
  provider_type?: string;
  sync_target: string;
  sync_status: string;
  records_fetched: number;
  tasks_detected: number;
  briefing_items: number;
  synced_at?: string;
  next_sync_at?: string;
}

export interface NotificationPreference {
  notification_preference_id: string;
  channel_code: string;
  preference_status: string;
  is_default: boolean;
  quiet_hours?: unknown;
  allowed_message_types?: string[];
  daily_send_limit?: number;
}

export interface NotificationMessage {
  notification_message_id: string;
  channel_code: string;
  message_type: string;
  delivery_status: string;
  sent_at?: string | null;
}

export interface ApprovalRecord {
  approval_record_id: string;
  request_type: string;
  request_target_type: string;
  request_target_id: string;
  approval_status: string;
  requested_at: string;
}

export interface AuditLog {
  audit_log_id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  result_status: string;
  created_at: string;
}

export interface AdminSummary {
  organization_id: string;
  pending_approvals: number;
  total_approvals: number;
  total_audit_logs: number;
  latest_audit_action?: string | null;
  connected_connectors: number;
  total_schedules: number;
  total_jobs: number;
  completed_jobs: number;
  latest_job_status?: string | null;
  latest_sync_provider?: string | null;
  latest_sync_at?: string | null;
}

export interface ScheduleItem {
  schedule_id: string;
  schedule_type: string;
  schedule_name: string;
  timezone: string;
  cron_or_rule: string;
  is_enabled: boolean;
  connector_account_id?: string;
  last_run_at?: string;
  next_run_at?: string;
}

export interface JobItem {
  job_id: string;
  schedule_id?: string;
  connector_account_id?: string;
  job_type: string;
  job_status: string;
  trigger_type: string;
  started_at?: string;
  finished_at?: string;
  retry_count?: number;
  error_message?: string;
}

export interface QueueDashboard {
  queue_name: string;
  paused?: boolean;
  settings?: {
    concurrency: number;
    rate_limit_per_minute: number;
  };
  runtime?: {
    active_processing: number;
    current_minute_processed: number;
  };
  counts: Record<string, number>;
  timeline?: Array<{
    timestamp: string;
    queued: number;
    completed: number;
    failed: number;
    dead_letter: number;
  }>;
  recent_jobs: Array<{
    id: string;
    name: string;
    state: string;
    attempts_made: number;
    timestamp: number;
    processed_on?: number | null;
    finished_on?: number | null;
    failed_reason?: string | null;
    data?: Record<string, unknown>;
  }>;
  dead_letter?: {
    queue_name: string;
    paused?: boolean;
    counts: Record<string, number>;
    recent_jobs: Array<{
      id: string;
      name: string;
      state: string;
      attempts_made: number;
      timestamp: number;
      processed_on?: number | null;
      finished_on?: number | null;
      failed_reason?: string | null;
      data?: Record<string, unknown>;
    }>;
  };
}

export interface JobRelations {
  job: {
    job_id: string;
    job_type: string;
    job_status: string;
    connector_account_id?: string | null;
    schedule_id?: string | null;
    retry_count: number;
    started_at?: string | null;
    finished_at?: string | null;
  } | null;
  task_snapshots: Array<{
    task_snapshot_id: string;
    snapshot_date: string;
    snapshot_type: string;
  }>;
  briefing_snapshots: Array<{
    briefing_snapshot_id: string;
    briefing_date: string;
    briefing_type: string;
  }>;
  notification_messages: Array<{
    notification_message_id: string;
    channel_code: string;
    message_type: string;
    delivery_status: string;
    sent_at?: string | null;
  }>;
}

export interface SchedulerStatus {
  enabled: boolean;
  running: boolean;
  interval_ms: number;
  last_tick_at?: string | null;
  last_success_at?: string | null;
  last_run_job_count: number;
  last_error_message?: string | null;
  queue_counts?: Record<string, number>;
}

export interface HealthStatus {
  status: string;
  service?: string;
  timestamp: string;
}

export interface ReadinessStatus {
  status: string;
  timestamp: string;
  checks: {
    database: string;
    scheduler: string;
  };
  scheduler: SchedulerStatus;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.blob();
}

async function withDemoFallback<T>(requestFn: () => Promise<T>, fallbackFn: () => T | Promise<T>) {
  try {
    return await requestFn();
  } catch (error) {
    if (!isDemoApiError(error)) {
      throw error;
    }
    return fallbackFn();
  }
}

export const api = {
  listOAuthProviders() {
    return withDemoFallback(() => request<OAuthProvider[]>("/auth/providers"), () =>
      demoData.listOAuthProviders(),
    );
  },
  getAuthContext(input?: { user_id?: string; session_token?: string }) {
    const params = new URLSearchParams();
    if (input?.user_id) {
      params.set("user_id", input.user_id);
    }
    if (input?.session_token) {
      params.set("session_token", input.session_token);
    }
    return withDemoFallback(
      () => request<AuthContext>(`/auth/context?${params.toString()}`),
      () => demoData.getAuthContext(),
    );
  },
  beginOAuthLogin(input: {
    provider: "google" | "microsoft" | "wechat" | "twitter";
    redirect_uri: string;
  }) {
    return withDemoFallback(
      () =>
        request<{
          provider: string;
          state: string;
          authorization_mode: "demo" | "oauth2";
          authorization_url: string;
        }>("/auth/oauth/begin", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => ({
        provider: input.provider,
        state: `demo-state-${input.provider}`,
        authorization_mode: "demo" as const,
        authorization_url: `${input.redirect_uri}?provider=${input.provider}&state=demo&code=demo-${input.provider}`,
      }),
    );
  },
  handleOAuthCallback(input: {
    provider: "google" | "microsoft" | "wechat" | "twitter";
    code: string;
    state: string;
  }) {
    return withDemoFallback(
      () =>
        request<AuthContext>("/auth/oauth/callback", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => demoData.getAuthContext(),
    );
  },
  logout(sessionToken: string) {
    return withDemoFallback(
      () =>
        request<{ logged_out: boolean }>("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ session_token: sessionToken }),
        }),
      () => ({ logged_out: true }),
    );
  },
  switchOrganization(input: {
    session_token?: string;
    user_id: string;
    organization_id: string;
  }) {
    return withDemoFallback(
      () =>
        request<AuthContext>("/auth/switch-organization", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => demoData.switchOrganization(input.organization_id),
    );
  },
  listAssistantCatalog(userId: string, organizationId: string) {
    return withDemoFallback(
      () =>
        request<AssistantCatalogItem[]>(
          `/assistants/catalog?user_id=${encodeURIComponent(userId)}&organization_id=${encodeURIComponent(
            organizationId,
          )}`,
        ),
      () => demoData.listAssistantCatalog(),
    );
  },
  listAssistantInstances(userId: string) {
    return withDemoFallback(
      () =>
        request<AssistantInstance[]>(
          `/assistant-instances?user_id=${encodeURIComponent(userId)}`,
        ),
      () => demoData.listAssistantInstances(),
    );
  },
  createAssistantInstance(input: {
    user_id: string;
    organization_id: string;
    assistant_definition_id: string;
    instance_name?: string;
  }) {
    return withDemoFallback(
      () =>
        request<AssistantInstance>("/assistant-instances", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => demoData.createAssistantInstance(input.assistant_definition_id),
    );
  },
  listConversations(userId: string, assistantInstanceId?: string) {
    const params = new URLSearchParams({ user_id: userId });
    if (assistantInstanceId) {
      params.set("assistant_instance_id", assistantInstanceId);
    }

    return withDemoFallback(
      () => request<ConversationItem[]>(`/conversations?${params.toString()}`),
      () => demoData.listConversations(assistantInstanceId),
    );
  },
  createConversation(input: {
    user_id: string;
    assistant_instance_id: string;
    channel?: string;
  }) {
    return withDemoFallback(
      () =>
        request<ConversationItem>("/conversations", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => demoData.createConversation(input.assistant_instance_id),
    );
  },
  getConversationDetail(conversationId: string, userId: string) {
    return withDemoFallback(
      () =>
        request<ConversationDetail>(
          `/conversations/${encodeURIComponent(conversationId)}?user_id=${encodeURIComponent(userId)}`,
        ),
      () => demoData.getConversationDetail(conversationId),
    );
  },
  sendConversationMessage(
    conversationId: string,
    input: {
      user_id: string;
      content: string;
    },
  ) {
    return withDemoFallback(
      () =>
        request<{
          conversation_id: string;
          user_message: string;
          assistant_message: string;
          runtime_status: string;
          trace_id: string;
          responded_at: string;
        }>(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => demoData.sendConversationMessage(conversationId, input.content),
    );
  },
  getTodayTaskSnapshot(userId: string, organizationId: string) {
    return withDemoFallback(
      () =>
        request<TaskSnapshot>(
          `/snapshots/tasks/today?user_id=${encodeURIComponent(userId)}&organization_id=${encodeURIComponent(
            organizationId,
          )}`,
        ),
      () => demoData.getTaskSnapshot(),
    );
  },
  getTodayBriefingSnapshot(userId: string, organizationId: string) {
    return withDemoFallback(
      () =>
        request<BriefingSnapshot>(
          `/snapshots/briefing/today?user_id=${encodeURIComponent(
            userId,
          )}&organization_id=${encodeURIComponent(organizationId)}`,
        ),
      () => demoData.getBriefingSnapshot(),
    );
  },
  listConnectorAccounts(userId: string, organizationId: string) {
    return withDemoFallback(
      () =>
        request<ConnectorAccount[]>(
          `/connectors?user_id=${encodeURIComponent(userId)}&organization_id=${encodeURIComponent(
            organizationId,
          )}`,
        ),
      () => demoData.listConnectors(),
    );
  },
  beginConnectorAuthorization(input: {
    user_id: string;
    organization_id: string;
    provider: string;
    redirect_uri?: string;
  }) {
    return withDemoFallback(
      () =>
        request<
          ConnectorAccount & {
            authorization_status: string;
            authorization_mode?: "demo" | "oauth2";
            authorization_url?: string;
          }
        >("/connectors/authorize", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => demoData.authorizeConnector(input.provider),
    );
  },
  revokeConnector(connectorAccountId: string, operatorId: string) {
    return withDemoFallback(
      () =>
        request<{ connector_account_id: string; revoked: boolean; connection_status?: string }>(
          `/connectors/${encodeURIComponent(connectorAccountId)}/revoke`,
          {
            method: "PATCH",
            body: JSON.stringify({ operator_id: operatorId }),
          },
        ),
      () => demoData.revokeConnector(connectorAccountId),
    );
  },
  syncConnector(
    connectorAccountId: string,
    input: { operator_id: string; sync_target?: "mail" | "calendar" | "tasks" },
  ) {
    return withDemoFallback(
      () =>
        request<ConnectorSyncResult>(
          `/connectors/${encodeURIComponent(connectorAccountId)}/sync`,
          {
            method: "POST",
            body: JSON.stringify(input),
          },
        ),
      () => demoData.syncConnector(connectorAccountId),
    );
  },
  listNotificationPreferences(userId: string) {
    return withDemoFallback(
      () =>
        request<NotificationPreference[]>(
          `/notifications/preferences?user_id=${encodeURIComponent(userId)}`,
        ),
      () => demoData.listNotificationPreferences(),
    );
  },
  updateNotificationPreference(input: {
    notification_preference_id: string;
    user_id: string;
    organization_id: string;
    channel_id: string;
    preference_status: string;
    is_default: boolean;
    quiet_hours_json?: unknown;
    allowed_message_types_json?: string[];
    daily_send_limit?: number;
  }) {
    return withDemoFallback(
      () =>
        request<NotificationPreference>("/notifications/preferences", {
          method: "PATCH",
          body: JSON.stringify(input),
        }),
      () => demoData.updateNotificationPreference(),
    );
  },
  listNotificationMessages(userId: string) {
    return withDemoFallback(
      () =>
        request<NotificationMessage[]>(
          `/notifications/messages?user_id=${encodeURIComponent(userId)}`,
        ),
      () => demoData.listNotificationMessages(),
    );
  },
  listApprovals(organizationId: string) {
    return withDemoFallback(
      () =>
        request<ApprovalRecord[]>(
          `/governance/approvals?organization_id=${encodeURIComponent(organizationId)}`,
        ),
      () => demoData.listApprovals(),
    );
  },
  approveRequest(approvalRecordId: string, operatorId: string) {
    return withDemoFallback(
      () =>
        request<ApprovalRecord>("/governance/approvals/approve", {
          method: "PATCH",
          body: JSON.stringify({
            approval_record_id: approvalRecordId,
            operator_id: operatorId,
          }),
        }),
      () => demoData.approveRequest(approvalRecordId),
    );
  },
  rejectRequest(approvalRecordId: string, operatorId: string, reason: string) {
    return withDemoFallback(
      () =>
        request<ApprovalRecord>("/governance/approvals/reject", {
          method: "PATCH",
          body: JSON.stringify({
            approval_record_id: approvalRecordId,
            operator_id: operatorId,
            reason,
          }),
        }),
      () => demoData.rejectRequest(approvalRecordId),
    );
  },
  listAuditLogs(organizationId: string) {
    return withDemoFallback(
      () =>
        request<AuditLog[]>(
          `/governance/audit-logs?organization_id=${encodeURIComponent(organizationId)}`,
        ),
      () => demoData.listAuditLogs(),
    );
  },
  getAdminSummary(organizationId: string, userId?: string) {
    const params = new URLSearchParams({ organization_id: organizationId });
    if (userId) {
      params.set("user_id", userId);
    }
    return withDemoFallback(
      () => request<AdminSummary>(`/governance/admin/summary?${params.toString()}`),
      () => demoData.getAdminSummary(),
    );
  },
  listSchedules(userId: string, organizationId: string) {
    return withDemoFallback(
      () =>
        request<ScheduleItem[]>(
          `/jobs/schedules?user_id=${encodeURIComponent(userId)}&organization_id=${encodeURIComponent(
            organizationId,
          )}`,
        ),
      () => demoData.listSchedules(),
    );
  },
  createSchedule(input: {
    user_id: string;
    organization_id: string;
    connector_account_id?: string;
    assistant_instance_id?: string;
    schedule_type: string;
    schedule_name: string;
    timezone: string;
    cron_or_rule: string;
  }) {
    return withDemoFallback(
      () =>
        request<ScheduleItem>("/jobs/schedules", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => demoData.createSchedule(input),
    );
  },
  listJobs(
    userId: string,
    organizationId: string,
    filters?: { job_status?: string; trigger_type?: string; search?: string },
  ) {
    const params = new URLSearchParams({
      user_id: userId,
      organization_id: organizationId,
    });
    if (filters?.job_status) params.set("job_status", filters.job_status);
    if (filters?.trigger_type) params.set("trigger_type", filters.trigger_type);
    if (filters?.search) params.set("search", filters.search);
    return withDemoFallback(
      () => request<JobItem[]>(`/jobs?${params.toString()}`),
      () => demoData.listJobs(filters),
    );
  },
  exportJobsCsv(
    userId: string,
    organizationId: string,
    filters?: { job_status?: string; trigger_type?: string; search?: string },
  ) {
    const params = new URLSearchParams({
      user_id: userId,
      organization_id: organizationId,
    });
    if (filters?.job_status) params.set("job_status", filters.job_status);
    if (filters?.trigger_type) params.set("trigger_type", filters.trigger_type);
    if (filters?.search) params.set("search", filters.search);
    return withDemoFallback(
      () => requestBlob(`/jobs/export.csv?${params.toString()}`),
      () => demoData.exportJobsCsv(),
    );
  },
  getSchedulerStatus() {
    return withDemoFallback(() => request<SchedulerStatus>("/jobs/scheduler-status"), () =>
      demoData.getSchedulerStatus(),
    );
  },
  getQueueDashboard() {
    return withDemoFallback(() => request<QueueDashboard>("/jobs/queue-dashboard"), () =>
      demoData.getQueueDashboard(),
    );
  },
  getQueueSettings() {
    return withDemoFallback(
      () => request<{ concurrency: number; rate_limit_per_minute: number }>("/jobs/queue-settings"),
      () => demoData.getQueueSettings(),
    );
  },
  pauseQueue() {
    return withDemoFallback(
      () =>
        request<QueueDashboard>("/jobs/queue/pause", {
          method: "POST",
        }),
      () => demoData.pauseQueue(),
    );
  },
  resumeQueue() {
    return withDemoFallback(
      () =>
        request<QueueDashboard>("/jobs/queue/resume", {
          method: "POST",
        }),
      () => demoData.resumeQueue(),
    );
  },
  updateQueueSettings(input: { concurrency?: number; rate_limit_per_minute?: number }) {
    return withDemoFallback(
      () =>
        request<QueueDashboard>("/jobs/queue/settings", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => demoData.updateQueueSettings(input),
    );
  },
  getJobRelations(jobId: string) {
    return withDemoFallback(
      () => request<JobRelations>(`/jobs/${encodeURIComponent(jobId)}/relations`),
      () => demoData.getJobRelations(jobId),
    );
  },
  getHealth() {
    return withDemoFallback(() => request<HealthStatus>("/health"), () => demoData.getHealth());
  },
  getReadiness() {
    return withDemoFallback(() => request<ReadinessStatus>("/ready"), () => demoData.getReadiness());
  },
  runJob(input: {
    user_id: string;
    organization_id: string;
    schedule_id?: string;
    connector_account_id?: string;
    job_type: "connector_sync";
    trigger_type?: "manual" | "scheduled";
  }) {
    return withDemoFallback(
      () =>
        request<JobItem>("/jobs/run", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => demoData.runJob(),
    );
  },
  retryJob(jobId: string) {
    return withDemoFallback(
      () =>
        request<JobItem>(`/jobs/${encodeURIComponent(jobId)}/retry`, {
          method: "POST",
        }),
      () => demoData.retryJob(jobId),
    );
  },
  requeueFailedJob(jobId: string) {
    return withDemoFallback(
      () =>
        request<JobItem>(`/jobs/${encodeURIComponent(jobId)}/requeue-failed`, {
          method: "POST",
        }),
      () => demoData.requeueFailedJob(jobId),
    );
  },
  bulkRequeueFailedJobs(jobIds: string[]) {
    return withDemoFallback(
      () =>
        request<JobItem[]>("/jobs/requeue-failed-bulk", {
          method: "POST",
          body: JSON.stringify({ job_ids: jobIds }),
        }),
      () => demoData.bulkRequeueFailedJobs(jobIds),
    );
  },
  addDemoFailedJob() {
    return Promise.resolve(demoData.addDemoFailedJob());
  },
  addDemoAuditLog() {
    return Promise.resolve(demoData.addDemoAuditLog());
  },
  addDemoNotification() {
    return Promise.resolve(demoData.addDemoNotification());
  },
};

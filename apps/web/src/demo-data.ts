import type {
  AdminSummary,
  ApprovalRecord,
  AssistantCatalogItem,
  AssistantInstance,
  AuditLog,
  AuthContext,
  BriefingSnapshot,
  ConnectorAccount,
  ConnectorSyncResult,
  ConversationDetail,
  ConversationItem,
  HealthStatus,
  JobItem,
  JobRelations,
  NotificationMessage,
  NotificationPreference,
  OAuthProvider,
  QueueDashboard,
  ReadinessStatus,
  ScheduleItem,
  SchedulerStatus,
  TaskSnapshot,
} from "./api";
import type { Locale } from "./i18n";

type DemoState = {
  auth: AuthContext;
  providers: OAuthProvider[];
  catalog: AssistantCatalogItem[];
  instances: AssistantInstance[];
  conversations: ConversationDetail[];
  taskSnapshot: TaskSnapshot;
  briefingSnapshot: BriefingSnapshot;
  connectors: ConnectorAccount[];
  notificationPreferences: NotificationPreference[];
  notificationMessages: NotificationMessage[];
  approvals: ApprovalRecord[];
  auditLogs: AuditLog[];
  adminSummary: AdminSummary;
  schedules: ScheduleItem[];
  jobs: JobItem[];
  queueDashboard: QueueDashboard;
  schedulerStatus: SchedulerStatus;
  health: HealthStatus;
  readiness: ReadinessStatus;
};

let currentLocale: Locale = "zh-Hant";

function t(en: string, zhHant: string, zhHans: string) {
  if (currentLocale === "zh-Hant") return zhHant;
  if (currentLocale === "zh-Hans") return zhHans;
  return en;
}

function nowIso(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function nextId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function createInitialState(): DemoState {
  const auth: AuthContext = {
    session_token: "demo-session-token",
    session_expires_at: nowIso(7 * 24 * 60 * 60 * 1000),
    user_id: "usr_user_001",
    display_name: t("Demo User", "示範使用者", "演示用户"),
    email: "user@demo.local",
    current_organization: {
      organization_id: "org_demo_001",
      organization_name: t("Ankyra Demo Org", "Ankyra 示範組織", "Ankyra 演示组织"),
    },
    organizations: [
      {
        organization_id: "org_demo_001",
        organization_name: t("Ankyra Demo Org", "Ankyra 示範組織", "Ankyra 演示组织"),
      },
      {
        organization_id: "org_demo_002",
        organization_name: t("Ankyra Lab Org", "Ankyra 實驗組織", "Ankyra 实验组织"),
      },
    ],
    roles: ["end_user", "organization_admin"],
  };

  const providers: OAuthProvider[] = [
    { provider: "google", display_name: "Google", enabled: true, mode: "demo" },
    { provider: "microsoft", display_name: "Microsoft", enabled: true, mode: "demo" },
    { provider: "wechat", display_name: "WeChat", enabled: true, mode: "demo" },
    { provider: "twitter", display_name: "Twitter", enabled: true, mode: "demo" },
  ];

  const catalog: AssistantCatalogItem[] = [
    {
      assistant_definition_id: "asst_def_mail_basic",
      assistant_code: "MAIL_BASIC",
      assistant_name: t("Mail Triage Assistant (Basic)", "郵件整理助理（初階）", "邮件整理助理（初阶）"),
      assistant_description: t(
        "Organize inbox highlights, pending replies, and top priorities.",
        "整理信箱重點、待回覆項目與優先順序。",
        "整理邮箱重点、待回复事项与优先顺序。",
      ),
      work_type: "mail_management",
      capability_level: "basic",
      active_version_id: "asst_ver_mail_basic_v1",
      active_version_number: "1.0.0",
      active_version_label: "v1.0",
      requires_approval: false,
      supports_memory: true,
      supports_tools: true,
    },
    {
      assistant_definition_id: "asst_def_tasks_adv",
      assistant_code: "TASKS_ADV",
      assistant_name: t("Daily Task Assistant (Advanced)", "今日待辦助理（進階）", "今日待办助理（进阶）"),
      assistant_description: t(
        "Turn messages and work context into a ranked daily task list.",
        "整合郵件與工作脈絡，產出今日待辦與優先提醒。",
        "整合邮件与工作脉络，产出今日待办与优先提醒。",
      ),
      work_type: "daily_tasking",
      capability_level: "advanced",
      active_version_id: "asst_ver_tasks_adv_v1",
      active_version_number: "1.0.0",
      active_version_label: "v1.0",
      requires_approval: false,
      supports_memory: true,
      supports_tools: true,
    },
    {
      assistant_definition_id: "asst_def_briefing_adv",
      assistant_code: "BRIEFING_ADV",
      assistant_name: t("Standup Briefing Assistant (Advanced)", "晨會摘要助理（進階）", "晨会摘要助理（进阶）"),
      assistant_description: t(
        "Prepare blockers, updates, and morning standup talking points.",
        "整理待辦、阻塞與回報重點，快速生成晨會摘要。",
        "整理待办、阻塞与汇报重点，快速生成晨会摘要。",
      ),
      work_type: "standup_briefing",
      capability_level: "advanced",
      active_version_id: "asst_ver_briefing_adv_v1",
      active_version_number: "1.0.0",
      active_version_label: "v1.0",
      requires_approval: true,
      supports_memory: true,
      supports_tools: true,
    },
  ];

  const instances: AssistantInstance[] = [
    {
      assistant_instance_id: "asst_inst_001",
      assistant_definition_id: "asst_def_mail_basic",
      assistant_version_id: "asst_ver_mail_basic_v1",
      instance_name: t("Demo Mail Assistant", "示範郵件助理", "演示邮件助理"),
      instance_status: "active",
      approval_status: "not_required",
    },
  ];

  const conversations: ConversationDetail[] = [
    {
      conversation_id: "conv_001",
      assistant_instance_id: "asst_inst_001",
      conversation_status: "active",
      channel: "web",
      last_activity_at: nowIso(-10 * 60 * 1000),
      events: [
        {
          conversation_event_id: "evt_001",
          event_type: "user_message",
          actor_type: "user",
          content_json: JSON.stringify({
            text: t(
              "Please prepare a manager-ready summary for today's standup, including blockers and customer follow-ups.",
              "請整理一份主管可直接使用的今日晨會摘要，包含阻塞事項與客戶後續追蹤。",
              "请整理一份主管可直接使用的今日晨会摘要，包含阻塞事项与客户后续跟进。",
            ),
          }),
          created_at: nowIso(-12 * 60 * 1000),
        },
        {
          conversation_event_id: "evt_002",
          event_type: "assistant_message",
          actor_type: "assistant",
          content_json: JSON.stringify({
            text: t(
              "Manager summary: 1) confirm customer escalation owner before 10:00, 2) close procurement blocker for the analytics project, 3) prepare standup update with delivery risks and next actions.",
              "主管摘要：1）上午 10 點前確認客戶升級案件負責人，2）排除分析專案採購阻塞，3）整理晨會更新，聚焦交付風險與下一步行動。",
              "主管摘要：1）上午 10 点前确认客户升级案件负责人，2）排除分析项目采购阻塞，3）整理晨会更新，聚焦交付风险与下一步行动。",
            ),
          }),
          created_at: nowIso(-11 * 60 * 1000),
        },
      ],
    },
  ];

  const taskSnapshot: TaskSnapshot = {
    task_snapshot_id: "task_snap_today",
    snapshot_date: new Date().toISOString().slice(0, 10),
    snapshot_type: "daily_tasks",
    tasks: [
      {
        priority: "P1",
        title: t(
          "Confirm escalation owner for the top customer issue",
          "確認高優先客戶升級案件負責人",
          "确认高优先客户升级案件负责人",
        ),
        source: "gmail",
        status: "open",
      },
      {
        priority: "P1",
        title: t(
          "Update standup blockers for analytics delivery",
          "更新分析專案交付阻塞事項",
          "更新分析项目交付阻塞事项",
        ),
        source: "system",
        status: "open",
      },
      {
        priority: "P2",
        title: t(
          "Review procurement follow-up before noon",
          "中午前確認採購追蹤進度",
          "中午前确认采购跟进进度",
        ),
        source: "outlook_mail",
        status: "open",
      },
    ],
  };

  const briefingSnapshot: BriefingSnapshot = {
    briefing_snapshot_id: "briefing_today",
    briefing_date: new Date().toISOString().slice(0, 10),
    briefing_type: "morning_briefing",
    sections: [
      {
        title: t("Inbox summary", "信箱摘要", "邮箱摘要"),
        items: [
          t(
            "Two customer threads need escalation owner confirmation",
            "有 2 封客戶對話需要確認升級案件負責人",
            "有 2 封客户对话需要确认升级案件负责人",
          ),
          t(
            "One finance approval is blocking procurement handoff",
            "有 1 項財務核准卡住採購交接",
            "有 1 项财务核准卡住采购交接",
          ),
        ],
      },
      {
        title: t("Today", "今日重點", "今日重点"),
        items: [
          t(
            "Review analytics delivery blockers before standup",
            "晨會前先確認分析專案交付阻塞",
            "晨会前先确认分析项目交付阻塞",
          ),
          t(
            "Finalize customer follow-up owner before noon",
            "中午前確認客戶追蹤負責人",
            "中午前确认客户跟进负责人",
          ),
        ],
      },
      {
        title: t("Risks", "風險", "风险"),
        items: [
          t(
            "Cross-team procurement dependency may delay Friday delivery",
            "跨部門採購依賴可能延後本週五交付",
            "跨部门采购依赖可能延后本周五交付",
          ),
        ],
      },
    ],
  };

  const connectors: ConnectorAccount[] = [
    {
      connector_account_id: "connector_gmail_demo",
      provider_type: "gmail",
      account_email: "gmail.demo@ankyra.local",
      connection_status: "active",
      authorization_mode: "demo",
      requires_reconnect: false,
      last_verified_at: nowIso(-60 * 60 * 1000),
      last_sync_status: "demo_fallback",
      last_sync_at: nowIso(-20 * 60 * 1000),
      next_sync_at: nowIso(10 * 60 * 1000),
    },
  ];

  const notificationPreferences: NotificationPreference[] = [
    {
      notification_preference_id: "notif_pref_line",
      channel_code: "line",
      preference_status: "active",
      is_default: true,
      allowed_message_types: ["daily_briefing", "task_reminder"],
      daily_send_limit: 5,
    },
  ];

  const notificationMessages: NotificationMessage[] = [
    {
      notification_message_id: "notif_msg_001",
      channel_code: "line",
      message_type: "daily_briefing",
      delivery_status: "sent",
      sent_at: nowIso(-15 * 60 * 1000),
    },
    {
      notification_message_id: "notif_msg_002",
      channel_code: "telegram",
      message_type: "task_reminder",
      delivery_status: "delivered",
      sent_at: nowIso(-8 * 60 * 1000),
    },
    {
      notification_message_id: "notif_msg_003",
      channel_code: "line",
      message_type: "approval_needed",
      delivery_status: "sent",
      sent_at: nowIso(-5 * 60 * 1000),
    },
  ];

  const approvals: ApprovalRecord[] = [
    {
      approval_record_id: "approval_001",
      request_type: "assistant_upgrade",
      request_target_type: "assistant_instance",
      request_target_id: "asst_inst_001",
      approval_status: "pending",
      requested_at: nowIso(-45 * 60 * 1000),
    },
    {
      approval_record_id: "approval_002",
      request_type: "connector_access",
      request_target_type: "connector_account",
      request_target_id: "connector_gmail_demo",
      approval_status: "approved",
      requested_at: nowIso(-90 * 60 * 1000),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      audit_log_id: "audit_001",
      action_type: "connector_sync",
      target_type: "connector_account",
      target_id: "connector_gmail_demo",
      result_status: "success",
      created_at: nowIso(-20 * 60 * 1000),
    },
    {
      audit_log_id: "audit_002",
      action_type: "notification_dispatch",
      target_type: "notification_message",
      target_id: "notif_msg_001",
      result_status: "success",
      created_at: nowIso(-15 * 60 * 1000),
    },
    {
      audit_log_id: "audit_003",
      action_type: "approval_granted",
      target_type: "approval_record",
      target_id: "approval_002",
      result_status: "success",
      created_at: nowIso(-88 * 60 * 1000),
    },
  ];

  const schedules: ScheduleItem[] = [
    {
      schedule_id: "schedule_001",
      schedule_type: "connector_sync",
      schedule_name: t("Inbox sync every 30 min", "每 30 分鐘同步收件匣", "每 30 分钟同步收件箱"),
      timezone: "Asia/Taipei",
      cron_or_rule: "EVERY_30_MINUTES",
      is_enabled: true,
      connector_account_id: "connector_gmail_demo",
      last_run_at: nowIso(-20 * 60 * 1000),
      next_run_at: nowIso(10 * 60 * 1000),
    },
  ];

  const jobs: JobItem[] = [
    {
      job_id: "job_001",
      schedule_id: "schedule_001",
      connector_account_id: "connector_gmail_demo",
      job_type: "connector_sync",
      job_status: "completed",
      trigger_type: "scheduled",
      started_at: nowIso(-20 * 60 * 1000),
      finished_at: nowIso(-19 * 60 * 1000),
      retry_count: 0,
    },
    {
      job_id: "job_002",
      schedule_id: "schedule_001",
      connector_account_id: "connector_gmail_demo",
      job_type: "connector_sync",
      job_status: "failed",
      trigger_type: "manual",
      started_at: nowIso(-5 * 60 * 1000),
      finished_at: nowIso(-4 * 60 * 1000),
      retry_count: 1,
      error_message: "outlook_api_timeout",
    },
  ];

  const queueDashboard: QueueDashboard = {
    queue_name: "ankyra-jobs",
    paused: false,
    settings: { concurrency: 2, rate_limit_per_minute: 60 },
    runtime: { active_processing: 0, current_minute_processed: 3 },
    counts: { waiting: 1, active: 0, completed: 1, failed: 1, delayed: 0 },
    recent_jobs: [
      {
        id: "queue_job_001",
        name: "connector_sync",
        state: "completed",
        attempts_made: 1,
        timestamp: Date.now() - 20 * 60 * 1000,
        processed_on: Date.now() - 20 * 60 * 1000,
        finished_on: Date.now() - 19 * 60 * 1000,
        data: {
          job_id: "job_001",
          connector_account_id: "connector_gmail_demo",
          schedule_id: "schedule_001",
          user_id: "usr_user_001",
          organization_id: "org_demo_001",
        },
      },
      {
        id: "queue_job_002",
        name: "connector_sync",
        state: "failed",
        attempts_made: 2,
        timestamp: Date.now() - 5 * 60 * 1000,
        processed_on: Date.now() - 5 * 60 * 1000,
        finished_on: Date.now() - 4 * 60 * 1000,
        failed_reason: "outlook_api_timeout",
        data: {
          job_id: "job_002",
          connector_account_id: "connector_gmail_demo",
          schedule_id: "schedule_001",
          user_id: "usr_user_001",
          organization_id: "org_demo_001",
        },
      },
    ],
    timeline: Array.from({ length: 6 }).map((_, index) => ({
      timestamp: new Date(Date.now() - (5 - index) * 60 * 60 * 1000).toISOString(),
      queued: index + 1,
      completed: index,
      failed: index === 4 ? 1 : 0,
      dead_letter: index === 5 ? 1 : 0,
    })),
    dead_letter: {
      queue_name: "ankyra-jobs-dlq",
      paused: false,
      counts: { waiting: 0, active: 0, completed: 0, failed: 1 },
      recent_jobs: [
        {
          id: "dlq_001",
          name: "connector_sync",
          state: "failed",
          attempts_made: 3,
          timestamp: Date.now() - 5 * 60 * 1000,
          failed_reason: "outlook_api_timeout",
          data: {
            job_id: "job_002",
            connector_account_id: "connector_gmail_demo",
          },
        },
      ],
    },
  };

  const schedulerStatus: SchedulerStatus = {
    enabled: true,
    running: true,
    interval_ms: 30000,
    last_tick_at: nowIso(-10 * 1000),
    last_success_at: nowIso(-20 * 60 * 1000),
    last_run_job_count: 1,
    last_error_message: null,
    queue_counts: queueDashboard.counts,
  };

  const health: HealthStatus = {
    status: "degraded-demo",
    service: "ankyra-api",
    timestamp: nowIso(),
  };

  const readiness: ReadinessStatus = {
    status: "degraded-demo",
    timestamp: nowIso(),
    checks: {
      database: "demo_fallback",
      scheduler: "demo_fallback",
    },
    scheduler: schedulerStatus,
  };

  const adminSummary: AdminSummary = {
    organization_id: "org_demo_001",
    pending_approvals: 1,
    total_approvals: approvals.length,
    total_audit_logs: auditLogs.length,
    latest_audit_action: auditLogs[0]?.action_type ?? null,
    connected_connectors: connectors.length,
    total_schedules: schedules.length,
    total_jobs: jobs.length,
    completed_jobs: jobs.filter((job) => job.job_status === "completed").length,
    latest_job_status: jobs[0]?.job_status ?? null,
    latest_sync_provider: connectors[0]?.provider_type ?? null,
    latest_sync_at: connectors[0]?.last_sync_at ?? null,
  };

  return {
    auth,
    providers,
    catalog,
    instances,
    conversations,
    taskSnapshot,
    briefingSnapshot,
    connectors,
    notificationPreferences,
    notificationMessages,
    approvals,
    auditLogs,
    adminSummary,
    schedules,
    jobs,
    queueDashboard,
    schedulerStatus,
    health,
    readiness,
  };
}

let state = createInitialState();

function refreshStateForLocale() {
  state = createInitialState();
}

export function setDemoLocale(locale: Locale) {
  currentLocale = locale;
  refreshStateForLocale();
}

export const demoData = {
  getAuthContext(): AuthContext {
    return structuredClone(state.auth);
  },
  listOAuthProviders(): OAuthProvider[] {
    return structuredClone(state.providers);
  },
  switchOrganization(organizationId: string): AuthContext {
    const org =
      state.auth.organizations?.find((item) => item.organization_id === organizationId) ??
      state.auth.current_organization;
    state.auth.current_organization = structuredClone(org);
    return this.getAuthContext();
  },
  listAssistantCatalog(): AssistantCatalogItem[] {
    return structuredClone(state.catalog);
  },
  listAssistantInstances(): AssistantInstance[] {
    return structuredClone(state.instances);
  },
  createAssistantInstance(assistantDefinitionId: string): AssistantInstance {
    const def =
      state.catalog.find((item) => item.assistant_definition_id === assistantDefinitionId) ??
      state.catalog[0];
    const instance: AssistantInstance = {
      assistant_instance_id: nextId("asst_inst"),
      assistant_definition_id: def.assistant_definition_id,
      assistant_version_id: def.active_version_id ?? nextId("asst_ver"),
      instance_name: `${def.assistant_name} Demo`,
      instance_status: "active",
      approval_status: def.requires_approval ? "pending" : "not_required",
    };
    state.instances.unshift(instance);
    return structuredClone(instance);
  },
  listConversations(assistantInstanceId?: string): ConversationItem[] {
    const list = assistantInstanceId
      ? state.conversations.filter((item) => item.assistant_instance_id === assistantInstanceId)
      : state.conversations;
    return structuredClone(list);
  },
  createConversation(assistantInstanceId: string): ConversationItem {
    const item: ConversationDetail = {
      conversation_id: nextId("conv"),
      assistant_instance_id: assistantInstanceId,
      conversation_status: "active",
      channel: "web",
      last_activity_at: nowIso(),
      events: [],
    };
    state.conversations.unshift(item);
    return structuredClone(item);
  },
  getConversationDetail(conversationId: string): ConversationDetail {
    return structuredClone(
      state.conversations.find((item) => item.conversation_id === conversationId) ??
        state.conversations[0],
    );
  },
  sendConversationMessage(conversationId: string, content: string) {
    const detail = state.conversations.find((item) => item.conversation_id === conversationId);
    if (!detail) throw new Error("conversation_not_found");
    detail.events.push({
      conversation_event_id: nextId("evt"),
      event_type: "user_message",
      actor_type: "user",
      content_json: JSON.stringify({ text: content }),
      created_at: nowIso(),
    });
    const reply = t(
      `Demo assistant processed: ${content}`,
      `示範助理已處理：${content}`,
      `演示助理已处理：${content}`,
    );
    detail.events.push({
      conversation_event_id: nextId("evt"),
      event_type: "assistant_message",
      actor_type: "assistant",
      content_json: JSON.stringify({ text: reply }),
      created_at: nowIso(),
    });
    detail.last_activity_at = nowIso();
    return {
      conversation_id: detail.conversation_id,
      user_message: content,
      assistant_message: reply,
      runtime_status: "demo_fallback",
      trace_id: nextId("trace"),
      responded_at: nowIso(),
    };
  },
  getTaskSnapshot() {
    return structuredClone(state.taskSnapshot);
  },
  getBriefingSnapshot() {
    return structuredClone(state.briefingSnapshot);
  },
  listConnectors() {
    return structuredClone(state.connectors);
  },
  authorizeConnector(provider: string) {
    const connector: ConnectorAccount = {
      connector_account_id: nextId("connector"),
      provider_type: provider,
      account_email: `${provider}.demo@ankyra.local`,
      connection_status: "active",
      authorization_mode: "demo",
      requires_reconnect: false,
      last_verified_at: nowIso(),
      last_sync_status: "never",
    };
    state.connectors.unshift(connector);
    state.adminSummary.connected_connectors = state.connectors.length;
    return {
      ...structuredClone(connector),
      authorization_status: "connected",
      authorization_mode: "demo" as const,
    };
  },
  addDemoFailedJob() {
    const job: JobItem = {
      job_id: nextId("job"),
      schedule_id: state.schedules[0]?.schedule_id,
      connector_account_id: state.connectors[0]?.connector_account_id,
      job_type: "connector_sync",
      job_status: "failed",
      trigger_type: "manual",
      started_at: nowIso(-20 * 1000),
      finished_at: nowIso(),
      retry_count: 0,
      error_message: "mail_provider_rate_limited",
    };
    state.jobs.unshift(job);
    state.queueDashboard.recent_jobs.unshift({
      id: nextId("queue_job"),
      name: "connector_sync",
      state: "failed",
      attempts_made: 1,
      timestamp: Date.now(),
      processed_on: Date.now(),
      finished_on: Date.now(),
      failed_reason: "mail_provider_rate_limited",
      data: {
        job_id: job.job_id,
        connector_account_id: job.connector_account_id,
        schedule_id: job.schedule_id,
        user_id: state.auth.user_id,
        organization_id: state.auth.current_organization.organization_id,
      },
    });
    state.queueDashboard.dead_letter?.recent_jobs.unshift({
      id: nextId("dlq"),
      name: "connector_sync",
      state: "failed",
      attempts_made: 1,
      timestamp: Date.now(),
      failed_reason: "mail_provider_rate_limited",
      data: {
        job_id: job.job_id,
        connector_account_id: job.connector_account_id,
      },
    });
    state.adminSummary.total_jobs = state.jobs.length;
    state.adminSummary.latest_job_status = "failed";
    return structuredClone(job);
  },
  addDemoAuditLog() {
    const log: AuditLog = {
      audit_log_id: nextId("audit"),
      action_type: "approval_review",
      target_type: "approval_record",
      target_id: state.approvals[0]?.approval_record_id ?? nextId("approval"),
      result_status: "success",
      created_at: nowIso(),
    };
    state.auditLogs.unshift(log);
    state.adminSummary.total_audit_logs = state.auditLogs.length;
    state.adminSummary.latest_audit_action = log.action_type;
    return structuredClone(log);
  },
  addDemoNotification() {
    const message: NotificationMessage = {
      notification_message_id: nextId("notif"),
      channel_code: "line",
      message_type: "daily_briefing",
      delivery_status: "queued",
      sent_at: nowIso(),
    };
    state.notificationMessages.unshift(message);
    return structuredClone(message);
  },
  revokeConnector(connectorAccountId: string) {
    const connector = state.connectors.find((item) => item.connector_account_id === connectorAccountId);
    if (connector) connector.connection_status = "revoked";
    return {
      connector_account_id: connectorAccountId,
      revoked: true,
      connection_status: connector?.connection_status,
    };
  },
  syncConnector(connectorAccountId: string): ConnectorSyncResult {
    const connector =
      state.connectors.find((item) => item.connector_account_id === connectorAccountId) ??
      state.connectors[0];
    if (connector) {
      connector.last_sync_status = "demo_fallback";
      connector.last_sync_at = nowIso();
      connector.next_sync_at = nowIso(30 * 60 * 1000);
    }
    state.taskSnapshot.tasks.unshift({
      priority: "P2",
      title: t(
        "Follow up latest synced inbox",
        "追蹤最新同步收件匣內容",
        "跟进最新同步收件箱内容",
      ),
      source: connector?.provider_type ?? "demo",
      status: "open",
    });
    state.briefingSnapshot.sections[0].items.unshift(
      t(
        "Connector sync refreshed the latest inbox digest.",
        "連接器同步已刷新最新收件摘要。",
        "连接器同步已刷新最新收件摘要。",
      ),
    );
    const notification: NotificationMessage = {
      notification_message_id: nextId("notif"),
      channel_code: "line",
      message_type: "task_reminder",
      delivery_status: "sent",
      sent_at: nowIso(),
    };
    state.notificationMessages.unshift(notification);
    const job: JobItem = {
      job_id: nextId("job"),
      schedule_id: state.schedules[0]?.schedule_id,
      connector_account_id: connector?.connector_account_id,
      job_type: "connector_sync",
      job_status: "completed",
      trigger_type: "manual",
      started_at: nowIso(-30 * 1000),
      finished_at: nowIso(),
      retry_count: 0,
    };
    state.jobs.unshift(job);
    state.adminSummary.total_jobs = state.jobs.length;
    state.adminSummary.completed_jobs = state.jobs.filter((item) => item.job_status === "completed").length;
    state.adminSummary.latest_job_status = "completed";
    state.adminSummary.latest_sync_provider = connector?.provider_type ?? null;
    state.adminSummary.latest_sync_at = nowIso();
    state.adminSummary.pending_approvals = state.approvals.filter(
      (item) => item.approval_status === "pending",
    ).length;
    state.auditLogs.unshift({
      audit_log_id: nextId("audit"),
      action_type: "snapshot_refresh",
      target_type: "task_snapshot",
      target_id: state.taskSnapshot.task_snapshot_id,
      result_status: "success",
      created_at: nowIso(),
    });
    state.adminSummary.total_audit_logs = state.auditLogs.length;
    state.adminSummary.latest_audit_action = state.auditLogs[0]?.action_type ?? null;
    return {
      connector_account_id: connector?.connector_account_id ?? connectorAccountId,
      provider_type: connector?.provider_type ?? "gmail",
      sync_target: "mail",
      sync_status: "demo_fallback",
      records_fetched: 12,
      tasks_detected: 4,
      briefing_items: 3,
      synced_at: nowIso(),
      next_sync_at: nowIso(30 * 60 * 1000),
    };
  },
  listNotificationPreferences() {
    return structuredClone(state.notificationPreferences);
  },
  updateNotificationPreference() {
    const pref = state.notificationPreferences[0];
    pref.preference_status = "active";
    pref.is_default = true;
    return structuredClone(pref);
  },
  listNotificationMessages() {
    return structuredClone(state.notificationMessages);
  },
  listApprovals() {
    return structuredClone(state.approvals);
  },
  approveRequest(approvalRecordId: string) {
    const approval = state.approvals.find((item) => item.approval_record_id === approvalRecordId) ?? state.approvals[0];
    approval.approval_status = "approved";
    state.adminSummary.pending_approvals = state.approvals.filter((item) => item.approval_status === "pending").length;
    state.auditLogs.unshift({
      audit_log_id: nextId("audit"),
      action_type: "approval_granted",
      target_type: "approval_record",
      target_id: approval.approval_record_id,
      result_status: "success",
      created_at: nowIso(),
    });
    state.adminSummary.total_audit_logs = state.auditLogs.length;
    state.adminSummary.latest_audit_action = state.auditLogs[0]?.action_type ?? null;
    return structuredClone(approval);
  },
  rejectRequest(approvalRecordId: string) {
    const approval = state.approvals.find((item) => item.approval_record_id === approvalRecordId) ?? state.approvals[0];
    approval.approval_status = "rejected";
    state.adminSummary.pending_approvals = state.approvals.filter((item) => item.approval_status === "pending").length;
    state.auditLogs.unshift({
      audit_log_id: nextId("audit"),
      action_type: "approval_rejected",
      target_type: "approval_record",
      target_id: approval.approval_record_id,
      result_status: "success",
      created_at: nowIso(),
    });
    state.adminSummary.total_audit_logs = state.auditLogs.length;
    state.adminSummary.latest_audit_action = state.auditLogs[0]?.action_type ?? null;
    return structuredClone(approval);
  },
  listAuditLogs() {
    return structuredClone(state.auditLogs);
  },
  getAdminSummary() {
    return structuredClone(state.adminSummary);
  },
  listSchedules() {
    return structuredClone(state.schedules);
  },
  createSchedule(input: { connector_account_id?: string; schedule_name: string; schedule_type: string; timezone: string; cron_or_rule: string }) {
    const schedule: ScheduleItem = {
      schedule_id: nextId("schedule"),
      connector_account_id: input.connector_account_id,
      schedule_name: input.schedule_name,
      schedule_type: input.schedule_type,
      timezone: input.timezone,
      cron_or_rule: input.cron_or_rule,
      is_enabled: true,
      next_run_at: nowIso(30 * 60 * 1000),
    };
    state.schedules.unshift(schedule);
    state.adminSummary.total_schedules = state.schedules.length;
    return structuredClone(schedule);
  },
  listJobs(filters?: { job_status?: string; trigger_type?: string; search?: string }) {
    return structuredClone(
      state.jobs.filter((job) => {
        if (filters?.job_status && job.job_status !== filters.job_status) return false;
        if (filters?.trigger_type && job.trigger_type !== filters.trigger_type) return false;
        if (filters?.search && !`${job.job_id} ${job.job_type} ${job.error_message ?? ""}`.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        return true;
      }),
    );
  },
  exportJobsCsv() {
    const header = "job_id,job_type,job_status,trigger_type,retry_count\n";
    const rows = state.jobs
      .map((job) => `${job.job_id},${job.job_type},${job.job_status},${job.trigger_type},${job.retry_count ?? 0}`)
      .join("\n");
    return new Blob([header + rows], { type: "text/csv;charset=utf-8" });
  },
  getSchedulerStatus() {
    return structuredClone(state.schedulerStatus);
  },
  getQueueDashboard() {
    return structuredClone(state.queueDashboard);
  },
  getQueueSettings() {
    return structuredClone(state.queueDashboard.settings ?? { concurrency: 2, rate_limit_per_minute: 60 });
  },
  pauseQueue() {
    state.queueDashboard.paused = true;
    return structuredClone(state.queueDashboard);
  },
  resumeQueue() {
    state.queueDashboard.paused = false;
    return structuredClone(state.queueDashboard);
  },
  updateQueueSettings(input: { concurrency?: number; rate_limit_per_minute?: number }) {
    state.queueDashboard.settings = {
      concurrency: input.concurrency ?? state.queueDashboard.settings?.concurrency ?? 2,
      rate_limit_per_minute: input.rate_limit_per_minute ?? state.queueDashboard.settings?.rate_limit_per_minute ?? 60,
    };
    return structuredClone(state.queueDashboard);
  },
  getJobRelations(jobId: string): JobRelations {
    return {
      job: {
        job_id: jobId,
        job_type: "connector_sync",
        job_status: "completed",
        connector_account_id: state.connectors[0]?.connector_account_id ?? null,
        schedule_id: state.schedules[0]?.schedule_id ?? null,
        retry_count: 0,
        started_at: nowIso(-60 * 1000),
        finished_at: nowIso(),
      },
      task_snapshots: [
        {
          task_snapshot_id: state.taskSnapshot.task_snapshot_id,
          snapshot_date: state.taskSnapshot.snapshot_date,
          snapshot_type: state.taskSnapshot.snapshot_type,
        },
      ],
      briefing_snapshots: [
        {
          briefing_snapshot_id: state.briefingSnapshot.briefing_snapshot_id,
          briefing_date: state.briefingSnapshot.briefing_date,
          briefing_type: state.briefingSnapshot.briefing_type,
        },
      ],
      notification_messages: state.notificationMessages.slice(0, 2).map((item) => ({
        notification_message_id: item.notification_message_id,
        channel_code: item.channel_code,
        message_type: item.message_type,
        delivery_status: item.delivery_status,
        sent_at: item.sent_at,
      })),
    };
  },
  getHealth() {
    return structuredClone(state.health);
  },
  getReadiness() {
    return structuredClone(state.readiness);
  },
  runJob() {
    const job: JobItem = {
      job_id: nextId("job"),
      connector_account_id: state.connectors[0]?.connector_account_id,
      schedule_id: state.schedules[0]?.schedule_id,
      job_type: "connector_sync",
      job_status: "queued",
      trigger_type: "manual",
      started_at: nowIso(),
      retry_count: 0,
    };
    state.jobs.unshift(job);
    state.adminSummary.total_jobs = state.jobs.length;
    return structuredClone(job);
  },
  retryJob(jobId: string) {
    const job = state.jobs.find((item) => item.job_id === jobId) ?? state.jobs[0];
    job.job_status = "queued";
    job.retry_count = (job.retry_count ?? 0) + 1;
    return structuredClone(job);
  },
  requeueFailedJob(jobId: string) {
    return this.retryJob(jobId);
  },
  bulkRequeueFailedJobs(jobIds: string[]) {
    return structuredClone(jobIds.map((id) => this.retryJob(id)));
  },
};

export function isDemoApiError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("Failed to fetch") ||
    error.message.includes("API request failed: 500") ||
    error.message.includes("API request failed: 502") ||
    error.message.includes("API request failed: 503") ||
    error.message.includes("API request failed: 504")
  );
}

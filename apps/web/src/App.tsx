import { useEffect, useMemo, useState } from "react";
import {
  api,
  type AssistantCatalogItem,
  type AssistantInstance,
  type ApprovalRecord,
  type AdminSummary,
  type AuditLog,
  type AuthContext,
  type BriefingSnapshot,
  type ConnectorAccount,
  type ConnectorSyncResult,
  type ConversationDetail,
  type ConversationItem,
  type JobRelations,
  type JobItem,
  type QueueDashboard,
  type NotificationMessage,
  type NotificationPreference,
  type ReadinessStatus,
  type SchedulerStatus,
  type ScheduleItem,
  type HealthStatus,
  type OAuthProvider,
  type TaskSnapshot,
} from "./api";
import { setDemoLocale } from "./demo-data";
import { localeOptions, localeTagMap, translations, type Locale } from "./i18n";

type ViewKey =
  | "dashboard"
  | "catalog"
  | "assistants"
  | "conversation"
  | "tasks"
  | "briefing"
  | "connectors"
  | "notifications"
  | "admin";

const SESSION_STORAGE_KEY = "ankyra.sessionToken";
const LOCALE_STORAGE_KEY = "ankyra.locale";
const navKeys: ViewKey[] = [
  "dashboard",
  "catalog",
  "assistants",
  "conversation",
  "tasks",
  "briefing",
  "connectors",
  "notifications",
  "admin",
];

function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [locale, setLocale] = useState<Locale>(
    () => (window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null) ?? "zh-Hant",
  );
  const [auth, setAuth] = useState<AuthContext | null>(null);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [catalog, setCatalog] = useState<AssistantCatalogItem[]>([]);
  const [instances, setInstances] = useState<AssistantInstance[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [conversationDetail, setConversationDetail] = useState<ConversationDetail | null>(null);
  const [taskSnapshot, setTaskSnapshot] = useState<TaskSnapshot | null>(null);
  const [briefingSnapshot, setBriefingSnapshot] = useState<BriefingSnapshot | null>(null);
  const [connectors, setConnectors] = useState<ConnectorAccount[]>([]);
  const [lastConnectorSync, setLastConnectorSync] = useState<ConnectorSyncResult | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<
    NotificationPreference[]
  >([]);
  const [notificationMessages, setNotificationMessages] = useState<NotificationMessage[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [queueDashboard, setQueueDashboard] = useState<QueueDashboard | null>(null);
  const [selectedQueueJob, setSelectedQueueJob] = useState<QueueDashboard["recent_jobs"][number] | null>(null);
  const [selectedJobRelations, setSelectedJobRelations] = useState<JobRelations | null>(null);
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("");
  const [jobTriggerFilter, setJobTriggerFilter] = useState("");
  const [selectedFailedJobIds, setSelectedFailedJobIds] = useState<string[]>([]);
  const [queueAutoRefresh, setQueueAutoRefresh] = useState(true);
  const [lastAutoRefreshAt, setLastAutoRefreshAt] = useState<string>("");
  const [queueConcurrencyDraft, setQueueConcurrencyDraft] = useState("2");
  const [queueRateLimitDraft, setQueueRateLimitDraft] = useState("60");
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [readinessStatus, setReadinessStatus] = useState<ReadinessStatus | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const t = translations[locale];
  useEffect(() => {
    setMessageDraft((current) => current || t.summarizeTodayPrompt);
  }, [t.summarizeTodayPrompt]);
  const localizedNavItems = useMemo(
    () =>
      navKeys.map((key) => ({
        key,
        label: t.nav[key].label,
        hint: t.nav[key].hint,
      })),
    [t],
  );

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = localeTagMap[locale];
    setDemoLocale(locale);
  }, [locale]);

  useEffect(() => {
    if (!auth) return;
    void loadCatalog(auth);
    void loadInstances(auth.user_id);
    void loadSnapshots(auth);
    void loadConnectors(auth);
    void loadNotifications(auth);
    void loadJobs(auth);
    void loadGovernance(auth);
  }, [auth]);

  useEffect(() => {
    if (!auth) return;
    void loadCatalog(auth);
    void loadInstances(auth.user_id);
    void loadSnapshots(auth);
    void loadConnectors(auth);
    void loadNotifications(auth);
    void loadJobs(auth);
    void loadGovernance(auth);
  }, [locale]);

  useEffect(() => {
    if (!auth) return;
    void loadJobs(auth);
  }, [auth, jobSearch, jobStatusFilter, jobTriggerFilter]);

  useEffect(() => {
    if (!auth || !queueAutoRefresh) return;
    if (activeView !== "admin" && activeView !== "connectors") return;

    const timer = window.setInterval(() => {
      void loadJobs(auth);
      setLastAutoRefreshAt(new Date().toISOString());
    }, 15000);

    return () => window.clearInterval(timer);
  }, [auth, queueAutoRefresh, activeView, jobSearch, jobStatusFilter, jobTriggerFilter]);

  useEffect(() => {
    if (!auth || !selectedInstanceId) return;
    void loadConversations(auth.user_id, selectedInstanceId);
  }, [auth, selectedInstanceId]);

  useEffect(() => {
    if (!auth || !selectedConversationId) return;
    void loadConversationDetail(selectedConversationId, auth.user_id);
  }, [auth, selectedConversationId]);

  useEffect(() => {
    if (!queueDashboard?.settings) return;
    setQueueConcurrencyDraft(String(queueDashboard.settings.concurrency));
    setQueueRateLimitDraft(String(queueDashboard.settings.rate_limit_per_minute));
  }, [queueDashboard?.settings?.concurrency, queueDashboard?.settings?.rate_limit_per_minute]);

  useEffect(() => {
    if (!selectedQueueJob) {
      setSelectedJobRelations(null);
      return;
    }
    void loadJobRelations(selectedQueueJob.id);
  }, [selectedQueueJob?.id]);

  const activeAssistant = useMemo(
    () => instances.find((item) => item.assistant_instance_id === selectedInstanceId) ?? null,
    [instances, selectedInstanceId],
  );
  const isDemoFallback =
    healthStatus?.status?.includes("degraded") || readinessStatus?.status?.includes("degraded");
  const formatDateTime = (value?: string | number | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString(localeTagMap[locale]);
  };
  const formatTime = (value?: string | number | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleTimeString(localeTagMap[locale]);
  };
  const boolLabel = (value?: boolean | null) => {
    if (value === undefined || value === null) return "-";
    return value ? (locale === "en" ? "Yes" : locale === "zh-Hant" ? "是" : "是") : locale === "en" ? "No" : locale === "zh-Hant" ? "否" : "否";
  };
  const triggerLabel = (value?: string | null) => {
    switch (value) {
      case "manual":
        return t.triggerManual;
      case "scheduled":
        return t.triggerScheduled;
      case "manual_retry":
        return t.triggerManualRetry;
      case "manual_requeue":
        return t.triggerManualRequeue;
      case "bulk_requeue":
        return t.triggerBulkRequeue;
      default:
        return value ?? "-";
    }
  };
  const notificationTypeLabel = (value?: string | null) => {
    switch (value) {
      case "daily_briefing":
        return locale === "en" ? "Daily briefing" : locale === "zh-Hant" ? "每日摘要" : "每日摘要";
      case "task_reminder":
        return locale === "en" ? "Task reminder" : locale === "zh-Hant" ? "待辦提醒" : "待办提醒";
      case "approval_needed":
        return locale === "en" ? "Approval needed" : locale === "zh-Hant" ? "需要審批" : "需要审批";
      case "standup_summary":
        return locale === "en" ? "Standup summary" : locale === "zh-Hant" ? "晨會摘要" : "晨会摘要";
      default:
        return value ?? "-";
    }
  };
  const deliveryStatusLabel = (value?: string | null) => {
    switch (value) {
      case "queued":
        return locale === "en" ? "Queued" : locale === "zh-Hant" ? "待發送" : "待发送";
      case "sent":
        return locale === "en" ? "Sent" : locale === "zh-Hant" ? "已送出" : "已送出";
      case "delivered":
        return locale === "en" ? "Delivered" : locale === "zh-Hant" ? "已送達" : "已送达";
      case "failed":
        return locale === "en" ? "Failed" : locale === "zh-Hant" ? "發送失敗" : "发送失败";
      default:
        return value ?? "-";
    }
  };
  const approvalTypeLabel = (value?: string | null) => {
    switch (value) {
      case "assistant_upgrade":
        return locale === "en" ? "Assistant upgrade" : locale === "zh-Hant" ? "助理升級申請" : "助理升级申请";
      case "connector_access":
        return locale === "en" ? "Connector access" : locale === "zh-Hant" ? "連接器存取申請" : "连接器存取申请";
      case "assistant_activation":
        return locale === "en" ? "Assistant activation" : locale === "zh-Hant" ? "助理開通申請" : "助理开通申请";
      default:
        return value ?? "-";
    }
  };
  const approvalStatusLabel = (value?: string | null) => {
    switch (value) {
      case "pending":
        return locale === "en" ? "Pending" : locale === "zh-Hant" ? "待審批" : "待审批";
      case "approved":
        return locale === "en" ? "Approved" : locale === "zh-Hant" ? "已核准" : "已批准";
      case "rejected":
        return locale === "en" ? "Rejected" : locale === "zh-Hant" ? "已拒絕" : "已拒绝";
      default:
        return value ?? "-";
    }
  };
  const auditActionLabel = (value?: string | null) => {
    switch (value) {
      case "connector_sync":
        return locale === "en" ? "Connector sync completed" : locale === "zh-Hant" ? "連接器同步完成" : "连接器同步完成";
      case "notification_dispatch":
        return locale === "en" ? "Notification dispatched" : locale === "zh-Hant" ? "通知派送完成" : "通知派送完成";
      case "approval_granted":
        return locale === "en" ? "Approval granted" : locale === "zh-Hant" ? "審批已核准" : "审批已批准";
      case "approval_rejected":
        return locale === "en" ? "Approval rejected" : locale === "zh-Hant" ? "審批已拒絕" : "审批已拒绝";
      case "approval_review":
        return locale === "en" ? "Approval reviewed" : locale === "zh-Hant" ? "審批已檢視" : "审批已检视";
      case "snapshot_refresh":
        return locale === "en" ? "Snapshot refreshed" : locale === "zh-Hant" ? "工作快照已刷新" : "工作快照已刷新";
      default:
        return value ?? "-";
    }
  };
  const resultStatusLabel = (value?: string | null) => {
    switch (value) {
      case "success":
        return locale === "en" ? "Success" : locale === "zh-Hant" ? "成功" : "成功";
      case "failed":
        return locale === "en" ? "Failed" : locale === "zh-Hant" ? "失敗" : "失败";
      default:
        return value ?? "-";
    }
  };
  const businessJobLabel = (value?: string | null) => {
    switch (value) {
      case "connector_sync":
        return locale === "en" ? "Inbox sync" : locale === "zh-Hant" ? "信箱同步" : "邮箱同步";
      case "daily_briefing":
        return locale === "en" ? "Briefing generation" : locale === "zh-Hant" ? "摘要生成" : "摘要生成";
      default:
        return value ?? "-";
    }
  };
  const jobStatusLabel = (value?: string | null) => {
    switch (value) {
      case "queued":
        return locale === "en" ? "Queued for processing" : locale === "zh-Hant" ? "等待處理" : "等待处理";
      case "running":
        return locale === "en" ? "Running" : locale === "zh-Hant" ? "執行中" : "执行中";
      case "completed":
        return locale === "en" ? "Completed" : locale === "zh-Hant" ? "已完成" : "已完成";
      case "failed":
        return locale === "en" ? "Needs attention" : locale === "zh-Hant" ? "需處理" : "需处理";
      default:
        return value ?? "-";
    }
  };
  const connectorStatusLabel = (value?: string | null) => {
    switch (value) {
      case "active":
        return locale === "en" ? "Connected" : locale === "zh-Hant" ? "已連接" : "已连接";
      case "revoked":
        return locale === "en" ? "Disconnected" : locale === "zh-Hant" ? "已中斷" : "已中断";
      default:
        return value ?? "-";
    }
  };
  const connectorSyncStatusLabel = (value?: string | null) => {
    switch (value) {
      case "demo_fallback":
        return locale === "en" ? "Demo sync completed" : locale === "zh-Hant" ? "示範同步完成" : "演示同步完成";
      case "never":
        return locale === "en" ? "Not synced yet" : locale === "zh-Hant" ? "尚未同步" : "尚未同步";
      default:
        return value ?? "-";
    }
  };
  const scheduleTypeLabel = (value?: string | null) => {
    switch (value) {
      case "connector_sync":
        return locale === "en" ? "Inbox sync schedule" : locale === "zh-Hant" ? "信箱同步排程" : "邮箱同步计划";
      default:
        return value ?? "-";
    }
  };
  const businessErrorLabel = (value?: string | null) => {
    switch (value) {
      case "outlook_api_timeout":
        return locale === "en"
          ? "Outlook response timed out. Please retry or requeue."
          : locale === "zh-Hant"
            ? "Outlook 回應逾時，建議重試或重新排程。"
            : "Outlook 响应超时，建议重试或重新排程。";
      case "mail_provider_rate_limited":
        return locale === "en"
          ? "Mail provider rate limit reached. Wait a moment and retry."
          : locale === "zh-Hant"
            ? "郵件服務觸發頻率限制，稍後再試。"
            : "邮件服务触发频率限制，稍后再试。";
      default:
        return value ?? "-";
    }
  };
  const adminSummaryHeadline =
    locale === "en"
      ? "Today's manager view"
      : locale === "zh-Hant"
        ? "今日管理摘要"
        : "今日管理摘要";
  const adminSummarySubcopy =
    locale === "en"
      ? "A compact view of approvals, delivery risk, communication load, and sync progress."
      : locale === "zh-Hant"
        ? "集中顯示今日審批壓力、交付風險、通知量與同步進度。"
        : "集中显示今日审批压力、交付风险、通知量与同步进度。";
  const connectorsPanelHint =
    locale === "en"
      ? "This area simulates how team mail sources connect, sync, and refresh downstream work items."
      : locale === "zh-Hant"
        ? "這裡模擬團隊郵件來源如何連接、同步，並更新後續工作項目。"
        : "这里模拟团队邮件来源如何连接、同步，并更新后续工作项目。";
  const notificationsPanelHint =
    locale === "en"
      ? "Notifications show what a manager or project owner would receive after sync, briefing, or approval events."
      : locale === "zh-Hant"
        ? "通知區呈現主管或專案負責人在同步、摘要或審批後會收到的提醒。"
        : "通知区呈现主管或项目负责人在同步、摘要或审批后会收到的提醒。";
  const jobPayloadSummary = (job: QueueDashboard["recent_jobs"][number] | null) => {
    if (!job?.data) return [];
    return [
      {
        label: locale === "en" ? "Business flow" : locale === "zh-Hant" ? "業務流程" : "业务流程",
        value: businessJobLabel(job.name),
      },
      {
        label: locale === "en" ? "Connector account" : locale === "zh-Hant" ? "連接器帳號" : "连接器账号",
        value: String(job.data.connector_account_id ?? "-"),
      },
      {
        label: locale === "en" ? "Schedule source" : locale === "zh-Hant" ? "排程來源" : "排程来源",
        value: String(job.data.schedule_id ?? "-"),
      },
      {
        label: locale === "en" ? "User scope" : locale === "zh-Hant" ? "使用者範圍" : "用户范围",
        value: String(job.data.user_id ?? "-"),
      },
      {
        label: locale === "en" ? "Organization scope" : locale === "zh-Hant" ? "組織範圍" : "组织范围",
        value: String(job.data.organization_id ?? "-"),
      },
    ];
  };
  const walkthroughSteps = [
    t.walkthroughStep1,
    t.walkthroughStep2,
    t.walkthroughStep3,
    t.walkthroughStep4,
    t.walkthroughStep5,
  ];

  async function bootstrap() {
    setLoading(t.loading);
    setError("");
    try {
      const url = new URL(window.location.href);
      const sessionTokenFromUrl = url.searchParams.get("session_token") ?? undefined;
      const oauthError = url.searchParams.get("oauth_error");
      const connectorStatus = url.searchParams.get("connector_status");
      const connectorError = url.searchParams.get("connector_error");
      const sessionToken =
        sessionTokenFromUrl ?? window.localStorage.getItem(SESSION_STORAGE_KEY) ?? undefined;

      if (sessionTokenFromUrl || oauthError || connectorStatus || connectorError) {
        url.searchParams.delete("session_token");
        url.searchParams.delete("provider");
        url.searchParams.delete("oauth_error");
        url.searchParams.delete("oauth_error_description");
        url.searchParams.delete("connector_status");
        url.searchParams.delete("connector_provider");
        url.searchParams.delete("connector_account_id");
        url.searchParams.delete("connector_error");
        window.history.replaceState({}, document.title, url.toString());
      }

      const [providers, context] = await Promise.all([
        api.listOAuthProviders(),
        api.getAuthContext(
          sessionToken ? { session_token: sessionToken } : { user_id: "usr_user_001" },
        ),
      ]);
      setOauthProviders(providers);
      setAuth(context);
      if (context.session_token) {
        persistSession(context.session_token);
      } else if (sessionToken) {
        clearPersistedSession();
      }
      if (oauthError) {
        setError(`OAuth error: ${oauthError}`);
      } else if (connectorError) {
        setError(`Connector OAuth error: ${connectorError}`);
      } else if (connectorStatus === "connected") {
        setLoading(`${t.connectors} ${t.connected}`);
      }
    } catch (caught) {
      clearPersistedSession();
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleOAuthLogin(provider: OAuthProvider) {
    setLoading(`${t.signInWith} ${provider.provider}`);
    setError("");

    try {
      const begin = await api.beginOAuthLogin({
        provider: provider.provider,
        redirect_uri: window.location.origin,
      });
      if (begin.authorization_mode === "oauth2") {
        window.location.assign(begin.authorization_url);
        return;
      }
      const context = await api.handleOAuthCallback({
        provider: provider.provider,
        state: begin.state,
        code: `demo-${provider.provider}`,
      });
      persistSession(context.session_token);
      setAuth(context);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleOrganizationSwitch(organizationId: string) {
    if (!auth || organizationId === auth.current_organization.organization_id) {
      return;
    }

    setLoading(t.switchOrganization);
    setError("");
    try {
      const context = await api.switchOrganization({
        session_token: auth.session_token,
        user_id: auth.user_id,
        organization_id: organizationId,
      });
      persistSession(context.session_token);
      setAuth(context);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function loadCatalog(context: AuthContext) {
    try {
      const data = await api.listAssistantCatalog(
        context.user_id,
        context.current_organization.organization_id,
      );
      setCatalog(data);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function loadInstances(userId: string) {
    try {
      const data = await api.listAssistantInstances(userId);
      setInstances(data);
      if (!selectedInstanceId && data[0]) {
        setSelectedInstanceId(data[0].assistant_instance_id);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function loadSnapshots(context: AuthContext) {
    try {
      const [tasks, briefing] = await Promise.all([
        api.getTodayTaskSnapshot(
          context.user_id,
          context.current_organization.organization_id,
        ),
        api.getTodayBriefingSnapshot(
          context.user_id,
          context.current_organization.organization_id,
        ),
      ]);

      setTaskSnapshot(tasks);
      setBriefingSnapshot(briefing);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function loadConnectors(context: AuthContext) {
    try {
      const accounts = await api.listConnectorAccounts(
        context.user_id,
        context.current_organization.organization_id,
      );
      setConnectors(accounts);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function loadNotifications(context: AuthContext) {
    try {
      const [preferences, messages] = await Promise.all([
        api.listNotificationPreferences(context.user_id),
        api.listNotificationMessages(context.user_id),
      ]);
      setNotificationPreferences(preferences);
      setNotificationMessages(messages);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function loadGovernance(context: AuthContext) {
    try {
      const [summary, approvalList, auditList] = await Promise.all([
        api.getAdminSummary(
          context.current_organization.organization_id,
          context.user_id,
        ),
        api.listApprovals(context.current_organization.organization_id),
        api.listAuditLogs(context.current_organization.organization_id),
      ]);
      setAdminSummary(summary);
      setApprovals(approvalList);
      setAuditLogs(auditList);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function loadJobs(context: AuthContext) {
    try {
      const [scheduleList, jobList, scheduler, queue, health, readiness] = await Promise.all([
        api.listSchedules(context.user_id, context.current_organization.organization_id),
        api.listJobs(context.user_id, context.current_organization.organization_id, {
          job_status: jobStatusFilter || undefined,
          trigger_type: jobTriggerFilter || undefined,
          search: jobSearch || undefined,
        }),
        api.getSchedulerStatus(),
        api.getQueueDashboard(),
        api.getHealth(),
        api.getReadiness(),
      ]);
      setSchedules(scheduleList);
      setJobs(jobList);
      setSchedulerStatus(scheduler);
      setQueueDashboard(queue);
      setSelectedFailedJobIds((current) =>
        current.filter((jobId) => jobList.some((job) => job.job_id === jobId && job.job_status === "failed")),
      );
      setHealthStatus(health);
      setReadinessStatus(readiness);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function loadJobRelations(jobId: string) {
    try {
      const details = await api.getJobRelations(jobId);
      setSelectedJobRelations(details);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function loadConversations(userId: string, assistantInstanceId: string) {
    try {
      const data = await api.listConversations(userId, assistantInstanceId);
      setConversations(data);
      if (data[0]) {
        setSelectedConversationId(data[0].conversation_id);
      } else {
        setSelectedConversationId("");
        setConversationDetail(null);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function loadConversationDetail(conversationId: string, userId: string) {
    try {
      const detail = await api.getConversationDetail(conversationId, userId);
      setConversationDetail(detail);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function handleApplyAssistant(definitionId: string) {
    if (!auth) return;
    setLoading(t.createInstance);
    setError("");

    try {
      const created = await api.createAssistantInstance({
        user_id: auth.user_id,
        organization_id: auth.current_organization.organization_id,
        assistant_definition_id: definitionId,
      });

      await loadInstances(auth.user_id);
      setSelectedInstanceId(created.assistant_instance_id);
      setActiveView("assistants");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleCreateConversation() {
    if (!auth || !selectedInstanceId) return;
    setLoading(t.createConversation);
    setError("");

    try {
      const created = await api.createConversation({
        user_id: auth.user_id,
        assistant_instance_id: selectedInstanceId,
        channel: "web",
      });

      await loadConversations(auth.user_id, selectedInstanceId);
      setSelectedConversationId(created.conversation_id);
      setActiveView("conversation");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleSendMessage() {
    if (!auth || !selectedConversationId || !messageDraft.trim()) return;
    setLoading(t.send);
    setError("");

    try {
      await api.sendConversationMessage(selectedConversationId, {
        user_id: auth.user_id,
        content: messageDraft,
      });
      await loadConversationDetail(selectedConversationId, auth.user_id);
      setMessageDraft(t.summarizeTodayPrompt);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleAuthorizeConnector(provider: string) {
    if (!auth) return;
    setLoading(`${t.connectors}: ${provider}`);
    setError("");

    try {
      const result = await api.beginConnectorAuthorization({
        user_id: auth.user_id,
        organization_id: auth.current_organization.organization_id,
        provider,
        redirect_uri: window.location.origin,
      });
      if (result.authorization_mode === "oauth2" && result.authorization_url) {
        window.location.assign(result.authorization_url);
        return;
      }
      await loadConnectors(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleRevokeConnector(connectorAccountId: string) {
    if (!auth) return;
    setLoading(t.revoke);
    setError("");

    try {
      await api.revokeConnector(connectorAccountId, auth.user_id);
      await loadConnectors(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleSyncConnector(connectorAccountId: string) {
    if (!auth) return;
    setLoading(t.syncNow);
    setError("");

    try {
      const result = await api.syncConnector(connectorAccountId, {
        operator_id: auth.user_id,
        sync_target: "mail",
      });
      setLastConnectorSync(result);
      await Promise.all([
        loadConnectors(auth),
        loadSnapshots(auth),
        loadNotifications(auth),
        loadJobs(auth),
      ]);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleSetLinePreference() {
    if (!auth) return;
    setLoading(t.preferenceAction);
    setError("");
    try {
      await api.updateNotificationPreference({
        notification_preference_id: "notif-pref-line-demo",
        user_id: auth.user_id,
        organization_id: auth.current_organization.organization_id,
        channel_id: "notif_line",
        preference_status: "active",
        is_default: true,
        quiet_hours_json: { start: "23:00", end: "07:30" },
        allowed_message_types_json: ["daily_briefing", "standup_summary"],
        daily_send_limit: 5,
      });
      await loadNotifications(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleApprove(approvalRecordId: string) {
    if (!auth) return;
    setLoading(t.approve);
    setError("");
    try {
      await api.approveRequest(approvalRecordId, auth.user_id);
      await loadGovernance(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleReject(approvalRecordId: string) {
    if (!auth) return;
    setLoading(t.reject);
    setError("");
    try {
      await api.rejectRequest(approvalRecordId, auth.user_id, "Rejected from demo console");
      await loadGovernance(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleCreateSchedule(connectorAccountId: string) {
    if (!auth) return;
    setLoading(t.createSchedule);
    setError("");
    try {
      await api.createSchedule({
        user_id: auth.user_id,
        organization_id: auth.current_organization.organization_id,
        connector_account_id: connectorAccountId,
        schedule_type: "connector_sync",
        schedule_name: t.inboxSyncEvery30Min,
        timezone: "Asia/Taipei",
        cron_or_rule: "EVERY_30_MINUTES",
      });
      await loadJobs(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleRunScheduledJob(scheduleId: string, connectorAccountId?: string) {
    if (!auth || !connectorAccountId) return;
    setLoading(t.runJob);
    setError("");
    try {
      await api.runJob({
        user_id: auth.user_id,
        organization_id: auth.current_organization.organization_id,
        schedule_id: scheduleId,
        connector_account_id: connectorAccountId,
        job_type: "connector_sync",
        trigger_type: "manual",
      });
      await Promise.all([
        loadJobs(auth),
        loadConnectors(auth),
        loadSnapshots(auth),
        loadNotifications(auth),
      ]);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleRetryJob(jobId: string) {
    if (!auth) return;
    setLoading(t.retry);
    setError("");
    try {
      await api.retryJob(jobId);
      await loadJobs(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleRequeueFailedJob(jobId: string) {
    if (!auth) return;
    setLoading(t.requeue);
    setError("");
    try {
      await api.requeueFailedJob(jobId);
      await loadJobs(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleBulkRequeueFailedJobs() {
    if (!auth || selectedFailedJobIds.length === 0) return;
    setLoading(t.bulkRequeueFailed);
    setError("");
    try {
      await api.bulkRequeueFailedJobs(selectedFailedJobIds);
      setSelectedFailedJobIds([]);
      await loadJobs(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  function toggleFailedJobSelection(jobId: string) {
    setSelectedFailedJobIds((current) =>
      current.includes(jobId) ? current.filter((item) => item !== jobId) : [...current, jobId],
    );
  }

  async function handleAddDemoFailedJob() {
    if (!auth) return;
    setLoading(t.addFailedJob);
    setError("");
    try {
      await api.addDemoFailedJob();
      await loadJobs(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleAddDemoAuditLog() {
    if (!auth) return;
    setLoading(t.addAuditLog);
    setError("");
    try {
      await api.addDemoAuditLog();
      await loadGovernance(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleAddDemoNotification() {
    if (!auth) return;
    setLoading(t.addNotification);
    setError("");
    try {
      await api.addDemoNotification();
      await Promise.all([loadNotifications(auth), loadGovernance(auth)]);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleExportJobsCsv() {
    if (!auth) return;
    setLoading(t.exportCsv);
    setError("");
    try {
      const blob = await api.exportJobsCsv(auth.user_id, auth.current_organization.organization_id, {
        job_status: jobStatusFilter || undefined,
        trigger_type: jobTriggerFilter || undefined,
        search: jobSearch || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ankyra-jobs.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  const adminSummaryBars = [
    { label: t.pendingApprovals, value: adminSummary?.pending_approvals ?? 0, tone: "warm" },
    { label: t.completedJobs, value: adminSummary?.completed_jobs ?? 0, tone: "success" },
    { label: t.connectorsCount, value: adminSummary?.connected_connectors ?? 0, tone: "cool" },
    { label: t.notificationCount, value: notificationMessages.length, tone: "dark" },
  ];
  const adminSummaryMax = Math.max(1, ...adminSummaryBars.map((item) => item.value));
  const healthCards = [
    {
      label: t.health,
      value: healthStatus?.status ?? "-",
      tone: healthStatus?.status === "ok" ? "success" : "warning",
      meta: healthStatus?.timestamp ? formatTime(healthStatus.timestamp) : "-",
    },
    {
      label: t.readiness,
      value: readinessStatus?.status ?? "-",
      tone: readinessStatus?.status === "ready" ? "success" : "warning",
      meta: readinessStatus?.timestamp ? formatTime(readinessStatus.timestamp) : "-",
    },
    {
      label: t.database,
      value: readinessStatus?.checks.database ?? "-",
      tone: readinessStatus?.checks.database === "up" ? "cool" : "warning",
      meta: t.readinessCheck,
    },
    {
      label: t.queue,
      value: queueDashboard?.paused ? t.queuePaused : t.queueRunning,
      tone: queueDashboard?.paused ? "dark" : "cool",
      meta: queueDashboard?.queue_name ?? "ankyra-jobs",
    },
  ];
  const jobStatusChart = [
    { label: t.queueWaiting, value: jobs.filter((job) => job.job_status === "queued").length, tone: "warm" },
    { label: t.queueRunning, value: jobs.filter((job) => job.job_status === "running").length, tone: "cool" },
    { label: t.completed, value: jobs.filter((job) => job.job_status === "completed").length, tone: "success" },
    { label: t.failed, value: jobs.filter((job) => job.job_status === "failed").length, tone: "dark" },
  ];
  const jobStatusChartMax = Math.max(1, ...jobStatusChart.map((item) => item.value));
  const operationsChart = [
    { label: t.tasksCount, value: taskSnapshot?.tasks.length ?? 0, tone: "cool" },
    { label: t.briefingSections, value: briefingSnapshot?.sections.length ?? 0, tone: "warm" },
    { label: t.notificationCount, value: notificationMessages.length, tone: "success" },
    { label: t.totalAuditLogs, value: auditLogs.length, tone: "dark" },
  ];
  const operationsChartMax = Math.max(1, ...operationsChart.map((item) => item.value));

  async function handleLogout() {
    setLoading(t.signOut);
    setError("");

    try {
      if (auth?.session_token) {
        await api.logout(auth.session_token);
      }
      clearPersistedSession();
      const fallbackContext = await api.getAuthContext({ user_id: "usr_user_001" });
      setAuth(fallbackContext);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handlePauseQueue() {
    if (!auth) return;
    setLoading(t.pauseQueue);
    setError("");
    try {
      await api.pauseQueue();
      await loadJobs(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleResumeQueue() {
    if (!auth) return;
    setLoading(t.resumeQueue);
    setError("");
    try {
      await api.resumeQueue();
      await loadJobs(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  async function handleUpdateQueueSettings() {
    if (!auth) return;
    setLoading(t.saveQueueSettings);
    setError("");
    try {
      await api.updateQueueSettings({
        concurrency: Number(queueConcurrencyDraft),
        rate_limit_per_minute: Number(queueRateLimitDraft),
      });
      await loadJobs(auth);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading("");
    }
  }

  function handleOpenQueueJobLink(target: "connectors" | "tasks" | "briefing") {
    setActiveView(target);
    setSelectedQueueJob(null);
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-title">Ankyra</div>
            <div className="brand-subtitle">{t.appSubtitle}</div>
          </div>
        </div>

        <div className="org-card">
          <div className="org-label">{t.organization}</div>
          <div className="org-name">
            {auth?.current_organization.organization_name ?? t.loading}
          </div>
          <div className="org-meta">
            {auth?.display_name ?? t.demoUser} | {auth?.email ?? "demo.user@ankyra.local"}
          </div>
          <label className="toggle-line">
            <span>{t.language}</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {(auth?.organizations?.length ?? 0) > 1 && (
            <select
              value={auth?.current_organization.organization_id}
              onChange={(event) => handleOrganizationSwitch(event.target.value)}
            >
              {auth?.organizations?.map((organization) => (
                <option
                  key={organization.organization_id}
                  value={organization.organization_id}
                >
                  {organization.organization_name}
                </option>
              ))}
            </select>
          )}
          <div className="org-meta">
            {t.session}: {auth?.session_token ? t.sessionPersisted : t.demoFallback}
          </div>
          <button className="secondary-btn" onClick={handleLogout}>
            {t.signOut}
          </button>
        </div>

        <nav className="nav">
          {localizedNavItems.map((item) => (
            <button
              key={item.key}
              className={item.key === activeView ? "nav-item active" : "nav-item"}
              onClick={() => setActiveView(item.key)}
            >
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="hero">
          <div>
            <div className="eyebrow">{t.connectedMvp}</div>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroDescription}</p>
            {isDemoFallback && <div className="status-inline">{t.demoModeBanner}</div>}
            {loading && <div className="status-inline">{t.working}: {loading}</div>}
            {error && <div className="status-inline error">{t.error}: {error}</div>}
          </div>
          <div className="hero-stats">
            <div className="stat-card warm">
              <span>{t.statsCatalog}</span>
              <strong>{catalog.length}</strong>
            </div>
            <div className="stat-card cool">
              <span>{t.statsInstances}</span>
              <strong>{instances.length}</strong>
            </div>
            <div className="stat-card dark">
              <span>{t.statsConversations}</span>
              <strong>{conversations.length}</strong>
            </div>
          </div>
        </header>

        {activeView === "dashboard" && (
          <section className="panel-grid">
            <article className="panel feature-panel">
              <div className="panel-title-row">
                <h2>{t.dashboardTitle}</h2>
                <span className="chip">{t.liveApi}</span>
              </div>
              <div className="summary-layout">
                <div className="summary-block">
                  <div className="summary-label">{t.catalogItems}</div>
                  <div className="summary-value">{catalog.length}</div>
                </div>
                <div className="summary-block">
                  <div className="summary-label">{t.tasksCount}</div>
                  <div className="summary-value">{taskSnapshot?.tasks.length ?? 0}</div>
                </div>
                <div className="summary-block">
                  <div className="summary-label">{t.briefingSections}</div>
                  <div className="summary-value">{briefingSnapshot?.sections.length ?? 0}</div>
                </div>
              </div>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.oauthProviders}</h2>
                <span className="chip">{t.demoCallback}</span>
              </div>
              <div className="stack-actions">
                {oauthProviders.map((provider) => (
                  <button
                    key={provider.provider}
                    className="secondary-btn"
                    disabled={!provider.enabled}
                    onClick={() => handleOAuthLogin(provider)}
                  >
                    {t.signInWith} {provider.display_name} ({provider.mode})
                  </button>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.taskPreview}</h2>
                <span className="chip">GET /snapshots/tasks/today</span>
              </div>
              <ul className="list">
                {taskSnapshot?.tasks.map((task) => (
                  <li key={task.title}>
                    {task.priority} | {task.title} | {task.source}
                  </li>
                )) ?? <li>{t.noTasksLoaded}</li>}
              </ul>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.briefingPreview}</h2>
                <span className="chip">GET /snapshots/briefing/today</span>
              </div>
              <ul className="list">
                {briefingSnapshot?.sections.map((section) => (
                  <li key={section.title}>
                    {section.title}: {section.items[0]}
                  </li>
                )) ?? <li>{t.noBriefingLoaded}</li>}
              </ul>
            </article>

            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.liveSystemSummary}</h2>
                <span className="chip">{t.connected}</span>
              </div>
              <div className="summary-layout">
                <div className="summary-block">
                  <div className="summary-label">{t.myAssistants}</div>
                  <div className="summary-value">{instances.length}</div>
                </div>
                <div className="summary-block">
                  <div className="summary-label">{t.conversationThreads}</div>
                  <div className="summary-value">{conversations.length}</div>
                </div>
                <div className="summary-block">
                  <div className="summary-label">{t.schedules}</div>
                  <div className="summary-value">{schedules.length}</div>
                </div>
                <div className="summary-block">
                  <div className="summary-label">{t.jobs}</div>
                  <div className="summary-value">{jobs.length}</div>
                </div>
              </div>
            </article>

            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.walkthroughTitle}</h2>
                <span className="chip">{t.demoFallback}</span>
              </div>
              <p className="muted-copy">{t.walkthroughDescription}</p>
              <ol className="list ordered">
                {walkthroughSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </section>
        )}

        {activeView === "catalog" && (
          <section className="panel-grid">
            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.assistantCatalog}</h2>
                <span className="chip">GET /assistants/catalog</span>
              </div>
              <div className="catalog-grid">
                {catalog.map((assistant) => (
                  <div key={assistant.assistant_definition_id} className="catalog-card">
                    <div className="catalog-top">
                      <div>
                        <h3>{assistant.assistant_name}</h3>
                        <p>{assistant.work_type}</p>
                      </div>
                      <span
                        className={assistant.requires_approval ? "chip warning" : "chip success"}
                      >
                        {assistant.requires_approval ? t.approvalRequired : t.directApply}
                      </span>
                    </div>
                    <div className="meta-grid">
                      <div>
                        <span>{t.level}</span>
                        <strong>{assistant.capability_level}</strong>
                      </div>
                      <div>
                        <span>{t.version}</span>
                        <strong>
                          {assistant.active_version_label ?? assistant.active_version_number ?? "-"}
                        </strong>
                      </div>
                    </div>
                    <button
                      className="primary-btn"
                      onClick={() => handleApplyAssistant(assistant.assistant_definition_id)}
                    >
                      {t.createInstance}
                    </button>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeView === "assistants" && (
          <section className="panel-grid">
            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.myAssistants}</h2>
                <span className="chip">GET /assistant-instances</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.instanceId}</th>
                    <th>{t.definition}</th>
                    <th>{t.status}</th>
                    <th>{t.approval}</th>
                    <th>{t.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map((instance) => (
                    <tr key={instance.assistant_instance_id}>
                      <td>{instance.assistant_instance_id}</td>
                      <td>{instance.assistant_definition_id}</td>
                      <td>{instance.instance_status}</td>
                      <td>{instance.approval_status}</td>
                      <td>
                        <button
                          className="secondary-btn"
                          onClick={() => {
                            setSelectedInstanceId(instance.assistant_instance_id);
                            setActiveView("conversation");
                          }}
                        >
                          {t.openConversation}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>
        )}

        {activeView === "conversation" && (
          <section className="conversation-layout">
            <article className="panel conversation-side">
              <div className="panel-title-row">
                <h2>{t.conversation}</h2>
                <span className="chip">
                  {activeAssistant ? activeAssistant.instance_status : t.noAssistant}
                </span>
              </div>
              <div className="stack-actions">
                <button
                  className="primary-btn"
                  disabled={!selectedInstanceId}
                  onClick={handleCreateConversation}
                >
                  {t.createConversation}
                </button>
              </div>
              <div className="conversation-list">
                {conversations.map((item) => (
                  <button
                    key={item.conversation_id}
                    className={
                      item.conversation_id === selectedConversationId
                        ? "conversation-item active"
                        : "conversation-item"
                    }
                    onClick={() => setSelectedConversationId(item.conversation_id)}
                  >
                    <strong>{item.conversation_id}</strong>
                    <small>{item.last_activity_at ? formatDateTime(item.last_activity_at) : item.conversation_status}</small>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel conversation-main">
              <div className="panel-title-row">
                <h2>{t.jobDetails}</h2>
                <span className="chip success">POST /messages</span>
              </div>
              <div className="timeline">
                {conversationDetail?.events?.map((event) => {
                  let parsedText = event.content_json ?? "";
                  try {
                    parsedText = JSON.parse(event.content_json ?? "{}").text ?? parsedText;
                  } catch {
                    parsedText = event.content_json ?? "";
                  }

                  const roleClass =
                    event.actor_type === "assistant"
                      ? "assistant"
                      : event.actor_type === "user"
                        ? "user"
                        : "system";

                  return (
                    <div key={event.conversation_event_id} className={`bubble ${roleClass}`}>
                      <div className="bubble-meta">
                        <strong>{event.actor_type}</strong>
                        <span>{formatTime(event.created_at)}</span>
                      </div>
                      <p>{parsedText}</p>
                    </div>
                  );
                })}
              </div>
              <div className="composer">
                <input
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                />
                <button
                  className="primary-btn"
                  disabled={!selectedConversationId}
                  onClick={handleSendMessage}
                >
                  {t.send}
                </button>
              </div>
            </article>
          </section>
        )}

        {activeView === "tasks" && (
          <section className="panel-grid">
            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.tasks}</h2>
                <span className="chip">{t.liveSnapshot}</span>
              </div>
              <ul className="task-list">
                {taskSnapshot?.tasks.map((task) => (
                  <li key={task.title}>
                    <strong>{task.priority}</strong> {task.title} | {task.source} | {task.status}
                  </li>
                )) ?? <li>{t.noTaskSnapshotLoaded}</li>}
              </ul>
            </article>
          </section>
        )}

        {activeView === "briefing" && (
          <section className="panel-grid">
            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.briefingSummary}</h2>
                <span className="chip">{t.liveSnapshot}</span>
              </div>
              <div className="briefing-box">
                {briefingSnapshot?.sections.map((section) => (
                  <p key={section.title}>
                    <strong>{section.title}</strong>: {section.items.join(" ")}
                  </p>
                )) ?? <p>{t.noBriefingSnapshotLoaded}</p>}
              </div>
            </article>
          </section>
        )}

        {activeView === "connectors" && (
          <section className="panel-grid">
            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.connectors}</h2>
                <span className="chip">{t.liveApi}</span>
              </div>
              <p className="muted-copy">{connectorsPanelHint}</p>
              <ul className="list">
                {connectors.map((connector) => (
                  <li key={connector.connector_account_id}>
                    {connector.provider_type} | {connectorStatusLabel(connector.connection_status)} |{" "}
                    {connector.account_email ?? t.noEmail} | {t.authMode}=
                    {connector.authorization_mode === "oauth2"
                      ? t.providerModeOauth2
                      : t.providerModeDemo}
                  </li>
                ))}
                {connectors.length === 0 && <li>{t.noConnectorAccount}</li>}
              </ul>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.authorizeProvider}</h2>
                <span className="chip">POST /connectors/authorize</span>
              </div>
              <div className="stack-actions">
                <button className="primary-btn" onClick={() => handleAuthorizeConnector("gmail")}>
                  {t.connectGmail}
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => handleAuthorizeConnector("outlook_mail")}
                >
                  {t.connectOutlook}
                </button>
              </div>
              <div className="status-inline">
                {t.providerCredentialsHint}
              </div>
            </article>

            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.action} / {t.connectors}</h2>
                <span className="chip">POST /sync + PATCH /revoke</span>
              </div>
              <div className="card-row">
                {connectors.map((connector) => (
                  <div key={connector.connector_account_id} className="mini-card">
                    <strong>{connector.provider_type}</strong>
                    <span>{connectorStatusLabel(connector.connection_status)}</span>
                    <small>{connector.account_email ?? t.demoFallback}</small>
                    <small>
                      {t.authMode}=
                      {connector.authorization_mode === "oauth2"
                        ? t.providerModeOauth2
                        : t.providerModeDemo}{" "}
                      | {t.reconnectFlag}=
                      {String(connector.requires_reconnect ?? false)}
                    </small>
                    <small>
                      {t.lastSync}={connectorSyncStatusLabel(connector.last_sync_status)} | {t.nextSyncAt}=
                      {formatTime(connector.next_sync_at)}
                    </small>
                    {connector.requires_reconnect && (
                      <div className="status-inline error">
                        {t.tokenMissingReconnect}
                      </div>
                    )}
                    <button
                      className="primary-btn"
                      onClick={() => handleSyncConnector(connector.connector_account_id)}
                    >
                      {t.syncNow}
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => handleCreateSchedule(connector.connector_account_id)}
                    >
                      {t.createSchedule}
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => handleRevokeConnector(connector.connector_account_id)}
                    >
                      {t.revoke}
                    </button>
                  </div>
                ))}
                {connectors.length === 0 && (
                  <div className="mini-card">
                    <strong>{t.noConnector}</strong>
                    <span>{t.createConnectionFirst}</span>
                  </div>
                )}
              </div>
              {lastConnectorSync && (
                <div className="status-inline">
                  {t.lastSync}: {lastConnectorSync.provider_type ?? t.connector} {t.fetchedRecords}{" "}
                  {lastConnectorSync.records_fetched} {t.records}, {t.detectedTasks}{" "}
                  {lastConnectorSync.tasks_detected} {t.taskItems}, {t.nextSyncAt} {formatTime(lastConnectorSync.next_sync_at)}
                </div>
              )}
            </article>

            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.schedulesAndJobs}</h2>
                <span className="chip">GET /jobs + /jobs/schedules</span>
              </div>
              <div className="card-row">
                <div className="mini-card">
                  <strong>{t.jobs}</strong>
                  <input
                    value={jobSearch}
                    onChange={(event) => setJobSearch(event.target.value)}
                    placeholder={t.searchJobPlaceholder}
                  />
                  <select value={jobStatusFilter} onChange={(event) => setJobStatusFilter(event.target.value)}>
                    <option value="">{t.allStatus}</option>
                    <option value="queued">{t.queueWaiting}</option>
                    <option value="running">{t.queueRunning}</option>
                    <option value="completed">{t.completed}</option>
                    <option value="failed">{t.failed}</option>
                  </select>
                  <select value={jobTriggerFilter} onChange={(event) => setJobTriggerFilter(event.target.value)}>
                    <option value="">{t.allTriggers}</option>
                    <option value="manual">{t.triggerManual}</option>
                    <option value="scheduled">{t.triggerScheduled}</option>
                    <option value="manual_retry">{t.triggerManualRetry}</option>
                    <option value="manual_requeue">{t.triggerManualRequeue}</option>
                    <option value="bulk_requeue">{t.triggerBulkRequeue}</option>
                  </select>
                  <button
                    className="primary-btn"
                    disabled={selectedFailedJobIds.length === 0}
                    onClick={handleBulkRequeueFailedJobs}
                  >
                    {t.bulkRequeueFailed} ({selectedFailedJobIds.length})
                  </button>
                  <button className="secondary-btn" onClick={handleExportJobsCsv}>
                    {t.exportCsv}
                  </button>
                  <label className="toggle-line">
                    <input
                      type="checkbox"
                      checked={queueAutoRefresh}
                      onChange={(event) => setQueueAutoRefresh(event.target.checked)}
                    />
                    {t.autoRefreshQueueJobs}
                  </label>
                  <small>
                    {t.lastAutoRefresh}:{" "}
                    {formatTime(lastAutoRefreshAt)}
                  </small>
                </div>
              </div>
              <div className="card-row">
                {schedules.map((schedule) => (
                  <div key={schedule.schedule_id} className="mini-card">
                    <strong>{schedule.schedule_name}</strong>
                    <span>{scheduleTypeLabel(schedule.schedule_type)}</span>
                    <small>{schedule.cron_or_rule}</small>
                    <small>
                      next={formatTime(schedule.next_run_at)}
                    </small>
                    <button
                      className="primary-btn"
                      onClick={() =>
                        handleRunScheduledJob(
                          schedule.schedule_id,
                          schedule.connector_account_id,
                        )
                      }
                    >
                      {t.runJob}
                    </button>
                  </div>
                ))}
                {schedules.length === 0 && (
                  <div className="mini-card">
                    <strong>{t.noSchedule}</strong>
                    <span>{t.createConnectionFirst}</span>
                  </div>
                )}
              </div>
              <ul className="list">
                {jobs.map((job) => (
                  <li key={job.job_id}>
                    {job.job_status === "failed" && (
                      <input
                        type="checkbox"
                        checked={selectedFailedJobIds.includes(job.job_id)}
                        onChange={() => toggleFailedJobSelection(job.job_id)}
                      />
                    )}{" "}
                    {businessJobLabel(job.job_type)} | {jobStatusLabel(job.job_status)} | {triggerLabel(job.trigger_type)} | {t.retry}=
                    {job.retry_count ?? 0}
                    {job.error_message ? ` | ${businessErrorLabel(job.error_message)}` : ""}
                    {job.job_status === "failed" && (
                      <>
                        {" "}
                        <button
                          className="secondary-btn inline-btn"
                          onClick={() => handleRetryJob(job.job_id)}
                        >
                          {t.retry}
                        </button>
                        <button
                          className="secondary-btn inline-btn"
                          onClick={() => handleRequeueFailedJob(job.job_id)}
                        >
                          {t.requeue}
                        </button>
                      </>
                    )}
                  </li>
                ))}
                {jobs.length === 0 && <li>{t.noJobYet}</li>}
              </ul>
            </article>
          </section>
        )}

        {activeView === "notifications" && (
          <section className="panel-grid">
            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.notifications}</h2>
                <span className="chip">{t.liveApi}</span>
              </div>
              <p className="muted-copy">{notificationsPanelHint}</p>
              <ul className="list">
                {notificationPreferences.map((preference) => (
                  <li key={preference.notification_preference_id}>
                    {preference.channel_code} | {deliveryStatusLabel(preference.preference_status)} | {t.defaultFlag}=
                    {boolLabel(preference.is_default)}
                  </li>
                ))}
                {notificationPreferences.length === 0 && <li>{t.noNotificationPreferenceYet}</li>}
              </ul>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.preferenceAction}</h2>
                <span className="chip">PATCH /notifications/preferences</span>
              </div>
              <div className="stack-actions">
                <button className="primary-btn" onClick={handleSetLinePreference}>
                  {t.setLineDefault}
                </button>
              </div>
            </article>

            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.recentNotificationMessages}</h2>
                <span className="chip">GET /notifications/messages</span>
              </div>
              <ul className="list">
                {notificationMessages.map((message) => (
                  <li key={message.notification_message_id}>
                    {message.channel_code} | {notificationTypeLabel(message.message_type)} | {deliveryStatusLabel(message.delivery_status)}
                  </li>
                ))}
                {notificationMessages.length === 0 && <li>{t.noNotificationMessageYet}</li>}
              </ul>
            </article>
          </section>
        )}

        {activeView === "admin" && (
          <section className="panel-grid">
            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.admin}</h2>
                <span className="chip">{t.liveApi}</span>
              </div>
              <p className="muted-copy">
                <strong>{adminSummaryHeadline}</strong> {adminSummarySubcopy}
              </p>
              <ul className="list">
                <li>{t.pendingApprovals}: {adminSummary?.pending_approvals ?? 0}</li>
                <li>{t.totalApprovals}: {adminSummary?.total_approvals ?? 0}</li>
                <li>{t.totalAuditLogs}: {adminSummary?.total_audit_logs ?? 0}</li>
                <li>{t.connectedConnectors}: {adminSummary?.connected_connectors ?? 0}</li>
                <li>{t.totalSchedules}: {adminSummary?.total_schedules ?? 0}</li>
                <li>{t.totalJobs}: {adminSummary?.total_jobs ?? 0}</li>
                <li>{t.completedJobs}: {adminSummary?.completed_jobs ?? 0}</li>
              </ul>
              <div className="chart-grid">
                {adminSummaryBars.map((item) => (
                  <div key={item.label} className="chart-card">
                    <span>{item.label}</span>
                    <div className="chart-bar-track">
                      <div
                        className={`chart-bar-fill ${item.tone}`}
                        style={{ width: `${(item.value / adminSummaryMax) * 100}%` }}
                      />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.operations}</h2>
                <span className="chip">{t.syncJobSummary}</span>
              </div>
              <div className="health-card-grid">
                {healthCards.map((card) => (
                  <div key={card.label} className={`health-card ${card.tone}`}>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.meta}</small>
                  </div>
                ))}
              </div>
              <div className="stack-actions">
                <button className="secondary-btn" onClick={handleAddDemoFailedJob}>
                  {t.addFailedJob}
                </button>
                <button className="secondary-btn" onClick={handleAddDemoAuditLog}>
                  {t.addAuditLog}
                </button>
                <button className="secondary-btn" onClick={handleAddDemoNotification}>
                  {t.addNotification}
                </button>
              </div>
              <ul className="list">
                <li>{t.latestAuditAction}: {adminSummary?.latest_audit_action ?? "-"}</li>
                <li>{t.latestJobStatus}: {adminSummary?.latest_job_status ?? "-"}</li>
                <li>{t.latestSyncProvider}: {adminSummary?.latest_sync_provider ?? "-"}</li>
                <li>
                  {t.latestSyncAt}:{" "}
                  {formatDateTime(adminSummary?.latest_sync_at)}
                </li>
                <li>{t.schedulerEnabled}: {String(schedulerStatus?.enabled ?? false)}</li>
                <li>{t.schedulerRunning}: {String(schedulerStatus?.running ?? false)}</li>
                <li>{t.schedulerPollMs}: {schedulerStatus?.interval_ms ?? 0}</li>
                <li>{t.health}: {healthStatus?.status ?? "-"}</li>
                <li>{t.readiness}: {readinessStatus?.status ?? "-"}</li>
                <li>{t.databaseCheck}: {readinessStatus?.checks.database ?? "-"}</li>
                <li>{t.schedulerCheck}: {readinessStatus?.checks.scheduler ?? "-"}</li>
                <li>
                  {t.lastTick}:{" "}
                  {formatDateTime(schedulerStatus?.last_tick_at)}
                </li>
                <li>
                  {t.lastSuccess}:{" "}
                  {formatDateTime(schedulerStatus?.last_success_at)}
                </li>
                <li>{t.lastRunJobCount}: {schedulerStatus?.last_run_job_count ?? 0}</li>
                <li>{t.queueWaiting}: {schedulerStatus?.queue_counts?.waiting ?? 0}</li>
                <li>{t.queueActive}: {schedulerStatus?.queue_counts?.active ?? 0}</li>
                <li>{t.queueCompleted}: {schedulerStatus?.queue_counts?.completed ?? 0}</li>
                <li>{t.queueFailed}: {schedulerStatus?.queue_counts?.failed ?? 0}</li>
                <li>{t.lastSchedulerError}: {schedulerStatus?.last_error_message ?? "-"}</li>
              </ul>
            </article>

            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.queueDashboard}</h2>
                <span className="chip">BullMQ</span>
              </div>
              <div className="queue-actions-row">
                <span className={`chip ${queueDashboard?.paused ? "dark" : "success"}`}>
                  {queueDashboard?.paused ? t.queuePaused : t.queueRunning}
                </span>
                <button
                  className="secondary-btn"
                  disabled={queueDashboard?.paused}
                  onClick={handlePauseQueue}
                >
                  {t.pauseQueue}
                </button>
                <button
                  className="secondary-btn"
                  disabled={!queueDashboard?.paused}
                  onClick={handleResumeQueue}
                >
                  {t.resumeQueue}
                </button>
              </div>
              <div className="queue-settings-grid">
                <div className="mini-card">
                  <strong>{t.concurrency}</strong>
                  <input
                    type="number"
                    min={1}
                    value={queueConcurrencyDraft}
                    onChange={(event) => setQueueConcurrencyDraft(event.target.value)}
                  />
                </div>
                <div className="mini-card">
                  <strong>{t.ratePerMinute}</strong>
                  <input
                    type="number"
                    min={1}
                    value={queueRateLimitDraft}
                    onChange={(event) => setQueueRateLimitDraft(event.target.value)}
                  />
                </div>
                <div className="mini-card">
                  <strong>{t.queueRuntime}</strong>
                  <span>{t.queueRuntimeActive}={queueDashboard?.runtime?.active_processing ?? 0}</span>
                  <span>{t.queueRuntimeMinute}={queueDashboard?.runtime?.current_minute_processed ?? 0}</span>
                  <button className="secondary-btn" onClick={handleUpdateQueueSettings}>
                    {t.saveQueueSettings}
                  </button>
                </div>
              </div>
              <ul className="list">
                <li>{t.queue}: {queueDashboard?.queue_name ?? "ankyra-jobs"}</li>
                <li>{t.paused}: {String(queueDashboard?.paused ?? false)}</li>
                <li>{t.concurrency}: {queueDashboard?.settings?.concurrency ?? 0}</li>
                <li>{t.ratePerMinute}: {queueDashboard?.settings?.rate_limit_per_minute ?? 0}</li>
                <li>{t.waiting}: {queueDashboard?.counts?.waiting ?? 0}</li>
                <li>{t.active}: {queueDashboard?.counts?.active ?? 0}</li>
                <li>{t.completed}: {queueDashboard?.counts?.completed ?? 0}</li>
                <li>{t.failed}: {queueDashboard?.counts?.failed ?? 0}</li>
                <li>{t.delayed}: {queueDashboard?.counts?.delayed ?? 0}</li>
              </ul>
              <div className="chart-grid">
                {jobStatusChart.map((item) => (
                  <div key={item.label} className="chart-card">
                    <span>{item.label}</span>
                    <div className="chart-bar-track">
                      <div
                        className={`chart-bar-fill ${item.tone}`}
                        style={{ width: `${(item.value / jobStatusChartMax) * 100}%` }}
                      />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="chart-grid">
                {operationsChart.map((item) => (
                  <div key={item.label} className="chart-card">
                    <span>{item.label}</span>
                    <div className="chart-bar-track">
                      <div
                        className={`chart-bar-fill ${item.tone}`}
                        style={{ width: `${(item.value / operationsChartMax) * 100}%` }}
                      />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <ul className="list">
                {queueDashboard?.recent_jobs?.map((job) => (
                  <li key={job.id}>
                    {job.name} | {job.state} | {t.attempts}={job.attempts_made} | {t.id}={job.id}
                    {job.failed_reason ? ` | ${job.failed_reason}` : ""}
                    <button
                      className="secondary-btn inline-btn"
                      onClick={() => setSelectedQueueJob(job)}
                    >
                      {t.details}
                    </button>
                  </li>
                )) ?? <li>{t.noQueueJobYet}</li>}
              </ul>
              <div className="panel-title-row">
                <h2>{t.queueMetricsTimeline}</h2>
                <span className="chip">{t.hourBuckets}</span>
              </div>
              <ul className="list">
                {queueDashboard?.timeline?.map((bucket) => (
                  <li key={bucket.timestamp}>
                    {formatDateTime(bucket.timestamp)} | {t.queueTimelineQueued}={bucket.queued} |
                    {t.queueTimelineCompleted}={bucket.completed} | {t.queueTimelineFailed}={bucket.failed} | {t.queueTimelineDlq}=
                    {bucket.dead_letter}
                  </li>
                )) ?? <li>{t.noTimelineDataYet}</li>}
              </ul>
              <div className="timeline-chart">
                {queueDashboard?.timeline?.map((bucket) => {
                  const bucketMax = Math.max(
                    1,
                    bucket.queued,
                    bucket.completed,
                    bucket.failed,
                    bucket.dead_letter,
                  );
                  return (
                    <div key={`chart-${bucket.timestamp}`} className="timeline-column">
                      <div className="timeline-bars">
                        <div
                          className="timeline-bar queued"
                          style={{ height: `${(bucket.queued / bucketMax) * 72}px` }}
                          title={`${t.queueTimelineQueued} ${bucket.queued}`}
                        />
                        <div
                          className="timeline-bar completed"
                          style={{ height: `${(bucket.completed / bucketMax) * 72}px` }}
                          title={`${t.queueTimelineCompleted} ${bucket.completed}`}
                        />
                        <div
                          className="timeline-bar failed"
                          style={{ height: `${(bucket.failed / bucketMax) * 72}px` }}
                          title={`${t.queueTimelineFailed} ${bucket.failed}`}
                        />
                        <div
                          className="timeline-bar deadletter"
                          style={{ height: `${(bucket.dead_letter / bucketMax) * 72}px` }}
                          title={`${t.queueTimelineDlq} ${bucket.dead_letter}`}
                        />
                      </div>
                      <small>{formatTime(bucket.timestamp)}</small>
                    </div>
                  );
                }) ?? null}
              </div>
              <ul className="list">
                <li>{t.dlqQueue}: {queueDashboard?.dead_letter?.queue_name ?? "ankyra-jobs-dlq"}</li>
                <li>{t.dlqPaused}: {String(queueDashboard?.dead_letter?.paused ?? false)}</li>
                <li>{t.dlqWaiting}: {queueDashboard?.dead_letter?.counts?.waiting ?? 0}</li>
                <li>{t.dlqFailed}: {queueDashboard?.dead_letter?.counts?.failed ?? 0}</li>
                <li>{t.dlqCompleted}: {queueDashboard?.dead_letter?.counts?.completed ?? 0}</li>
              </ul>
              <ul className="list">
                {queueDashboard?.dead_letter?.recent_jobs?.map((job) => (
                  <li key={`dlq-${job.id}`}>
                    {job.name} | {job.state} | {t.id}={job.id}
                    {job.failed_reason ? ` | ${job.failed_reason}` : ""}
                    <button
                      className="secondary-btn inline-btn"
                      onClick={() => setSelectedQueueJob(job)}
                    >
                      {t.details}
                    </button>
                  </li>
                )) ?? <li>{t.noDeadLetterJobYet}</li>}
              </ul>
            </article>

            <article className="panel">
              <div className="panel-title-row">
                <h2>{t.approvalQueue}</h2>
                <span className="chip">GET /governance/approvals</span>
              </div>
              <div className="stack-actions">
                {approvals.map((approval) => (
                  <div key={approval.approval_record_id} className="mini-card">
                    <strong>{approvalTypeLabel(approval.request_type)}</strong>
                    <span>{approvalStatusLabel(approval.approval_status)}</span>
                    <small>{approval.request_target_id}</small>
                    <small>{formatDateTime(approval.requested_at)}</small>
                    <button
                      className="secondary-btn"
                      onClick={() => handleApprove(approval.approval_record_id)}
                    >
                      {t.approve}
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => handleReject(approval.approval_record_id)}
                    >
                      {t.reject}
                    </button>
                  </div>
                ))}
                {approvals.length === 0 && <div className="mini-card">{t.noApprovalRecordYet}</div>}
              </div>
            </article>

            <article className="panel wide">
              <div className="panel-title-row">
                <h2>{t.auditLogs}</h2>
                <span className="chip">GET /governance/audit-logs</span>
              </div>
              <ul className="list">
                {auditLogs.map((log) => (
                  <li key={log.audit_log_id}>
                    {auditActionLabel(log.action_type)} | {resultStatusLabel(log.result_status)} | {formatDateTime(log.created_at)}
                  </li>
                ))}
                {auditLogs.length === 0 && <li>{t.noAuditLogYet}</li>}
              </ul>
            </article>
          </section>
        )}

        {selectedQueueJob && (
          <section className="drawer-backdrop" onClick={() => setSelectedQueueJob(null)}>
            <article className="job-drawer" onClick={(event) => event.stopPropagation()}>
              <div className="panel-title-row">
                <h2>{t.jobDetails}</h2>
                <button className="secondary-btn inline-btn" onClick={() => setSelectedQueueJob(null)}>
                  {t.close}
                </button>
              </div>
              <ul className="list">
                <li>{t.id}: {selectedQueueJob.id}</li>
                <li>{t.name}: {businessJobLabel(selectedQueueJob.name)}</li>
                <li>{t.state}: {jobStatusLabel(selectedQueueJob.state)}</li>
                <li>{t.attempts}: {selectedQueueJob.attempts_made}</li>
                <li>{t.timestamp}: {new Date(selectedQueueJob.timestamp).toLocaleString(localeTagMap[locale])}</li>
                <li>
                  {t.processed}:{" "}
                  {selectedQueueJob.processed_on
                    ? new Date(selectedQueueJob.processed_on).toLocaleString(localeTagMap[locale])
                    : "-"}
                </li>
                <li>
                  {t.finished}:{" "}
                  {selectedQueueJob.finished_on
                    ? new Date(selectedQueueJob.finished_on).toLocaleString(localeTagMap[locale])
                    : "-"}
                </li>
                <li>{t.failedReason}: {businessErrorLabel(selectedQueueJob.failed_reason)}</li>
              </ul>
              <div className="relations-grid">
                {jobPayloadSummary(selectedQueueJob).map((item) => (
                  <div key={item.label} className="mini-card">
                    <strong>{item.label}</strong>
                    <small>{item.value}</small>
                  </div>
                ))}
              </div>
              <div className="drawer-actions">
                {selectedQueueJob.data?.connector_account_id && (
                  <button
                    className="secondary-btn"
                    onClick={() => handleOpenQueueJobLink("connectors")}
                  >
                    {t.openConnectorView}
                  </button>
                )}
                <button
                  className="secondary-btn"
                  onClick={() => handleOpenQueueJobLink("tasks")}
                >
                  {t.openTaskSnapshot}
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => handleOpenQueueJobLink("briefing")}
                >
                  {t.openBriefingSnapshot}
                </button>
              </div>
              <div className="relations-grid">
                <div className="mini-card">
                  <strong>{t.relatedTaskSnapshots}</strong>
                  {selectedJobRelations?.task_snapshots.length ? (
                    selectedJobRelations.task_snapshots.map((snapshot) => (
                      <small key={snapshot.task_snapshot_id}>
                        {snapshot.snapshot_type} | {snapshot.snapshot_date}
                      </small>
                    ))
                  ) : (
                    <small>{t.noRelatedTaskSnapshot}</small>
                  )}
                </div>
                <div className="mini-card">
                  <strong>{t.relatedBriefingSnapshots}</strong>
                  {selectedJobRelations?.briefing_snapshots.length ? (
                    selectedJobRelations.briefing_snapshots.map((snapshot) => (
                      <small key={snapshot.briefing_snapshot_id}>
                        {snapshot.briefing_type} | {snapshot.briefing_date}
                      </small>
                    ))
                  ) : (
                    <small>{t.noRelatedBriefingSnapshot}</small>
                  )}
                </div>
                <div className="mini-card">
                  <strong>{t.relatedNotifications}</strong>
                  {selectedJobRelations?.notification_messages.length ? (
                    selectedJobRelations.notification_messages.map((message) => (
                      <small key={message.notification_message_id}>
                        {message.channel_code} | {message.message_type} | {message.delivery_status}
                      </small>
                    ))
                  ) : (
                    <small>{t.noRelatedNotification}</small>
                  )}
                </div>
              </div>
              <pre className="job-payload">
                {JSON.stringify(selectedQueueJob.data ?? {}, null, 2)}
              </pre>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}

function persistSession(sessionToken?: string) {
  if (!sessionToken) {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionToken);
}

function clearPersistedSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function errorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "Unknown error";
}

export default App;

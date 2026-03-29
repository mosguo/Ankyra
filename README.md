# Ankyra

Ankyra 是面向工作場景的多用戶 AI 助理 MVP，目前已具備這些主線能力：

- OAuth 登入與 session persistence
- 助理目錄、助理實例、Conversation
- Gmail / Outlook Connector
- Task Snapshot / Briefing Snapshot
- Notification
- Job / Schedule / BullMQ Queue / Worker
- Admin / Health / Readiness

## 技術組成

- Backend: NestJS
- Worker: Nest application context + BullMQ
- Frontend: React + Vite
- ORM: Prisma
- Database: PostgreSQL
- Queue / Cache: Redis

## 開發前需求

1. Node.js 20+
2. npm
3. PostgreSQL
4. Redis
5. 將 [`.env.example`](C:\Users\mos\Documents\GitHub\Ankyra\.env.example) 複製成 [`.env`](C:\Users\mos\Documents\GitHub\Ankyra\.env)

## 本機快速啟動

### 最簡單方式

```powershell
npm install
npm run dev:local
```

`dev:local` 會：

1. 檢查 `.env`
2. 執行 `npm run dev:setup`
3. 同時啟動 API / Worker / Web

### 手動方式

```powershell
npm install
npm run dev:setup
npm run dev:all
```

### 個別服務

```powershell
npm run dev:api
npm run dev:worker
npm run dev:web
```

## 本地主頁測試連結

- 主頁: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3000/api](http://localhost:3000/api)
- Health: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- Readiness: [http://localhost:3000/api/ready](http://localhost:3000/api/ready)

## `dev:setup` 內容

1. `prisma generate`
2. `prisma db push`
3. `seed:demo`

## 重要環境變數

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ankyra?schema=public
REDIS_URL=redis://127.0.0.1:6379
QUEUE_DRIVER=bullmq
APP_API_BASE_URL=http://localhost:3000
APP_WEB_BASE_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api
AUTH_SESSION_SECRET=change-me-for-production
SCHEDULER_ENABLED=true
SCHEDULER_POLL_MS=30000
```

## 真 OAuth 設定

### Google 登入

請在 Google Cloud Console 建立 OAuth Client：

- Authorized JavaScript origins
  - `http://localhost:5173`
- Authorized redirect URIs
  - `http://localhost:3000/api/auth/oauth/callback/google`

設定到 [`.env`](C:\Users\mos\Documents\GitHub\Ankyra\.env)：

```env
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
```

### Microsoft 登入

請在 Azure App Registration 設定：

- Redirect URI
  - `http://localhost:3000/api/auth/oauth/callback/microsoft`

設定到 [`.env`](C:\Users\mos\Documents\GitHub\Ankyra\.env)：

```env
MICROSOFT_OAUTH_CLIENT_ID=your-microsoft-client-id
MICROSOFT_OAUTH_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_OAUTH_TENANT_ID=common
```

### OAuth 模式

- 若 provider 有完整 client id / secret，系統會走 `oauth2`
- 若未設定，系統會回退到 `demo`

## Gmail / Outlook Connector 設定

### Gmail Connector

```env
GMAIL_CLIENT_ID=your-google-client-id
GMAIL_CLIENT_SECRET=your-google-client-secret
```

Callback:

- `http://localhost:3000/api/connectors/oauth/callback/gmail`

建議 scope：

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/gmail.readonly`

### Outlook Connector

```env
OUTLOOK_CLIENT_ID=your-microsoft-client-id
OUTLOOK_CLIENT_SECRET=your-microsoft-client-secret
```

Callback:

- `http://localhost:3000/api/connectors/oauth/callback/outlook_mail`

建議 scope：

- `openid`
- `email`
- `profile`
- `offline_access`
- `Mail.Read`
- `User.Read`

## Redis / BullMQ 設定

### 最低需求

- 本機需有 Redis
- [`.env`](C:\Users\mos\Documents\GitHub\Ankyra\.env) 需有：

```env
QUEUE_DRIVER=bullmq
REDIS_URL=redis://127.0.0.1:6379
```

### Windows 本機常見做法

1. 用 Docker 啟 Redis

```powershell
docker run --name ankyra-redis -p 6379:6379 redis:7
```

2. 或使用既有本機 Redis 服務

### Queue / Worker 架構

目前 scheduler 已改成正式 queue/worker 流程：

`schedule -> enqueue job -> BullMQ queue -> worker -> connector sync -> snapshot -> notification`

對應程序：

- API process：建立 schedule、enqueue job、提供 scheduler 狀態
- Worker process：消費 `ankyra-jobs` queue 並執行 `connector_sync`

### 啟動方式

```powershell
npm run dev:worker
```

或一起啟動：

```powershell
npm run dev:all
```

## Session 策略

目前採混合策略：

- DB session
- 簽名 session token
- HttpOnly cookie
- localStorage 備援

主要 API：

- `GET /api/auth/providers`
- `POST /api/auth/oauth/begin`
- `POST /api/auth/oauth/callback`
- `GET /api/auth/oauth/callback/:provider`
- `GET /api/auth/context`
- `POST /api/auth/switch-organization`
- `POST /api/auth/logout`

## Connector 主線 API

- `GET /api/connectors`
- `POST /api/connectors/authorize`
- `GET /api/connectors/oauth/callback/:provider`
- `POST /api/connectors/:connector_account_id/sync`
- `PATCH /api/connectors/:connector_account_id/revoke`

## Job / Scheduler API

- `GET /api/jobs/scheduler-status`
- `GET /api/jobs/schedules`
- `POST /api/jobs/schedules`
- `GET /api/jobs`
- `POST /api/jobs/run`

## `prisma db push` 權限排查

若執行 `npm run prisma:push` 失敗，請依序確認：

1. PostgreSQL 是否真的已啟動
2. `DATABASE_URL` 是否可連線
3. 使用者是否有建表權限
4. 防毒或企業端點工具是否阻擋 Prisma engine
5. 是否是在受限 sandbox 或權限受限 shell 內執行

建議手動排查：

```powershell
npx prisma generate
npx prisma db push
```

常見錯誤：

- `schema-engine ... can-connect-to-database`
- `spawn EPERM`

若出現 `spawn EPERM`，通常不是 schema 本身有問題，而是：

- 本機資料庫未啟動
- 權限不足
- shell / sandbox 阻擋 Prisma engine 啟動

## Demo Seed

`npm run seed:demo` 會建立：

- demo organization
- demo users
- demo OAuth identities
- assistant definitions / versions / instances
- conversations / events
- connectors / sync states
- task / briefing snapshots
- notification preferences / messages
- approval / audit
- schedules / jobs

## 目前可展示的 MVP 頁面

- Dashboard
- Assistant Catalog
- My Assistants
- Conversation
- Today Tasks
- Briefing
- Connectors
- Notifications
- Admin

## 已知限制

- `prisma db push` 在某些受限 shell 可能因權限被阻擋
- 真 OAuth 與真 Connector sync 需自行提供 provider 憑證
- WeChat / Twitter 目前仍以 demo mode 為主
- queue/worker 已落地，但尚未拆成獨立 deployment 設定

# PSS 場地資料系統交接與轉移文件

最後整理日期：2026-05-22

## 專案位置

- GitHub repo: `https://github.com/a0987081481-lgtm/pss-fishstick.git`
- 正式網站: `https://pssparking.netlify.app/`
- Supabase project ref: `jyfbajronywtvnrygtcu`
- Supabase URL: `https://jyfbajronywtvnrygtcu.supabase.co`

## 目前架構

```text
Netlify 靜態前端
  -> Supabase Auth
  -> Supabase PostgreSQL
  -> Supabase Storage: site-attachments
  -> Supabase Edge Functions
  -> LINE Messaging API
```

## 主要檔案

- `index.html`: 前端畫面
- `styles.css`: 樣式與手機版
- `app.js`: 前端邏輯、Supabase 呼叫、LINE notify 呼叫
- `sw.js`: PWA 快取
- `manifest.webmanifest`: PWA 設定
- `icon.svg`: 手機主畫面 icon
- `logo.svg`: 頁面 LOGO
- `supabase/functions/admin-users/index.ts`: 前台管理使用者
- `supabase/functions/line-webhook/index.ts`: LINE webhook 與取得群組 ID
- `supabase/functions/notify-line/index.ts`: 新增場地後推送 LINE 群組通知
- `sql/*.sql`: 後續欄位變更 SQL
- `scripts/export-supabase.ps1`: 轉移前匯出 Supabase 資料與 Storage 的腳本
- `transfer/SECRETS_TEMPLATE.env`: 新環境需要手動準備的 secrets 清單

## 資料表

目前前端與 functions 會用到：

- `profiles`
- `sites`
- `site_photos`
- `site_files`

注意：Supabase Auth 使用者不只存在 `profiles`，還存在 Supabase Auth 系統表。未來若完全自架登入系統，需要另外規劃使用者密碼重設或重新建立帳號。

## Storage

- Bucket: `site-attachments`
- 路徑格式大致為：
  - `{site_id}/photos/{file_name}`
  - `{site_id}/files/{file_name}`

轉移時需要同時搬：

- SQL 資料表的附件 metadata: `site_photos`, `site_files`
- Storage 實體檔案: `site-attachments`

## Supabase Edge Functions

目前 functions:

- `admin-users`
- `line-webhook`
- `notify-line`

部署指令範例：

```powershell
tools\supabase.exe functions deploy admin-users
tools\supabase.exe functions deploy line-webhook --no-verify-jwt
tools\supabase.exe functions deploy notify-line
```

`line-webhook` 必須使用 `--no-verify-jwt`，因為 LINE 伺服器呼叫 webhook 時不會帶 Supabase 使用者 JWT。

## Secrets

不要把真正的值寫進 GitHub。新環境需要手動設定：

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_GROUP_ID`
- `SUPABASE_SERVICE_ROLE_KEY`，Supabase Edge Function 自動提供或在自架後端改為後端環境變數

LINE webhook URL:

```text
https://jyfbajronywtvnrygtcu.supabase.co/functions/v1/line-webhook
```

若未來搬到自架 API，LINE Developers 的 Webhook URL 也要改成新主機網址。

## 目前已知金鑰安全狀態

- Supabase Access Token `codex-line` 已由使用者刪除。
- LINE Channel access token 曾在聊天中貼出過。建議未來正式長期使用前，到 LINE Developers 重新 Reissue，然後更新 Supabase Secret。

## 完整轉移需要帶走什麼

1. GitHub repo 程式碼
2. Supabase schema dump
3. Supabase data dump
4. Supabase Storage bucket `site-attachments`
5. LINE Secrets
6. Netlify/GitHub 部署權限
7. 新主機的 PostgreSQL / Storage / API 設定

## 建議轉移順序

1. 在新電腦 clone GitHub repo
2. 安裝 Git / Node.js / Supabase CLI / PostgreSQL 工具
3. 先用 `scripts/export-supabase.ps1` 從 Supabase 匯出資料
4. 備份 Storage bucket
5. 在新主機建立 PostgreSQL 和檔案儲存
6. 匯入 schema 和 data
7. 建立後端 API 取代 Supabase API
8. 前端改 API URL
9. LINE webhook URL 改到新主機
10. 測試登入、查詢、新增、上傳、LINE 通知

## 自架建議

短期最穩：

```text
Netlify 前端繼續使用
資料與檔案仍在 Supabase
```

未來自架：

```text
Netlify 或公司內網前端
  -> Node.js API
  -> PostgreSQL
  -> MinIO 或公司主機檔案系統
  -> LINE Messaging API
```

外部連線建議使用：

- Tailscale VPN
- Cloudflare Tunnel
- 公司 VPN

不要直接把 PostgreSQL port 開到外網。

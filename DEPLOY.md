# 場地資料系統部署筆記

## 靜態 PWA 部署

這個專案是純靜態 PWA，可以部署到 Netlify、Vercel 或 Cloudflare Pages。

### Netlify

1. 登入 Netlify。
2. 選 Add new site。
3. 使用 Deploy manually 或連接 Git repository。
4. Publish directory 設定為專案根目錄。
5. 不需要 build command。

### Vercel

1. 登入 Vercel。
2. Import project。
3. Framework Preset 選 Other。
4. Build command 留空。
5. Output directory 留空或設定為 `.`。

### Cloudflare Pages

1. 登入 Cloudflare。
2. Workers & Pages -> Create application -> Pages。
3. 連接 Git repository。
4. Framework preset 選 None。
5. Build command 留空。
6. Build output directory 設定為 `/` 或 `.`。

## Supabase Edge Function

`admin-users` 是用來讓前台管理者新增、管理、移除帳號的後端函式。

Function 檔案位置：

```text
supabase/functions/admin-users/index.ts
```

部署後前台「建立者管理」才會真的能建立 Supabase Auth 帳號。

需要的環境變數通常 Supabase Edge Functions 會自帶：

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

如果用 Supabase CLI：

```bash
supabase functions deploy admin-users --project-ref jyfbajronywtvnrygtcu
```

## 目前容量策略

照片上傳前會自動壓縮：

```text
最大寬度：1600px
JPEG 品質：0.78
```

文件不會壓縮，仍維持單檔 10MB 限制。

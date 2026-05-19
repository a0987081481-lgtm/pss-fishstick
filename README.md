# 場地資料系統

公司內部場地資料共享 PWA。

## 功能

- Supabase 登入
- 場地資料新增、編輯、刪除
- 依建立者分層顯示
- 場地代號/場地名稱模糊搜尋
- 照片與文件上傳
- 附件刪除
- 前台容量估算
- 管理者使用者管理

## 前端部署

此專案是靜態 PWA，可部署到 Netlify、Vercel、Cloudflare Pages。

前台必要檔案：

```text
index.html
app.js
styles.css
manifest.webmanifest
sw.js
icon.svg
netlify.toml
vercel.json
```

## Supabase

Edge Function:

```text
supabase/functions/admin-users/index.ts
```

部署：

```bash
tools/supabase.exe functions deploy admin-users --project-ref jyfbajronywtvnrygtcu
```

# 轉移包說明

這個資料夾放「換電腦或未來轉移資料庫」需要用的交接資料。

## 目前已準備

- `HANDOVER.md`: 專案架構、轉移注意事項、目前 Supabase/LINE 設定摘要
- `SECRETS_TEMPLATE.env`: secrets 清單模板，請在新電腦另存成 `.env` 後填入，勿提交到 GitHub
- `scripts/export-supabase.ps1`: 從 Supabase 匯出 schema/data/storage 的腳本

## 重要限制

目前沒有把線上資料庫資料和 Storage 檔案直接放進這個 repo，原因：

- 需要有效的 Supabase Access Token
- 資料庫 dump 可能需要 Supabase Database Password
- Storage 檔案可能包含公司文件與照片，不適合直接提交到 GitHub

真正要搬家前，請在原電腦或新電腦執行：

```powershell
.\scripts\export-supabase.ps1
```

匯出的資料會放在：

```text
transfer-export/
```

那個資料夾才是含資料與附件的正式搬家包。

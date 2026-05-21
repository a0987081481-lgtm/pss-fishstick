param(
  [string]$OutputRoot = "transfer-export"
)

$ErrorActionPreference = "Stop"

function Require-Env($Name) {
  if (-not [Environment]::GetEnvironmentVariable($Name)) {
    throw "Missing environment variable: $Name"
  }
}

Require-Env "SUPABASE_ACCESS_TOKEN"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$root = Join-Path $OutputRoot $timestamp
$dbDir = Join-Path $root "database"
$storageDir = Join-Path $root "storage"
$metaDir = Join-Path $root "meta"

New-Item -ItemType Directory -Force -Path $dbDir, $storageDir, $metaDir | Out-Null

$supabase = Join-Path (Get-Location) "tools\supabase.exe"
if (-not (Test-Path $supabase)) {
  $supabase = "supabase"
}

Write-Host "Export folder: $root"
Write-Host "Dumping database schema..."
& $supabase db dump --linked --schema public,storage,auth --file (Join-Path $dbDir "schema.sql")

Write-Host "Dumping public data..."
& $supabase db dump --linked --data-only --schema public --file (Join-Path $dbDir "public-data.sql")

Write-Host "Copying Supabase Storage bucket: site-attachments"
& $supabase storage cp -r "ss:///site-attachments" (Join-Path $storageDir "site-attachments")

Write-Host "Writing transfer metadata..."
@"
ExportedAt=$((Get-Date).ToString("o"))
ProjectRef=jyfbajronywtvnrygtcu
Bucket=site-attachments
Tables=profiles,sites,site_photos,site_files
Functions=admin-users,line-webhook,notify-line
"@ | Set-Content -Encoding UTF8 (Join-Path $metaDir "export-info.txt")

Write-Host ""
Write-Host "Done."
Write-Host "Transfer data is in: $root"
Write-Host "Keep this folder private because it may contain company data and files."

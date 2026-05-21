param(
  [string]$OutputRoot = "transfer-package"
)

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$packageDir = Join-Path $OutputRoot $timestamp
$zipPath = "$packageDir.zip"

New-Item -ItemType Directory -Force -Path $packageDir | Out-Null

$excludeDirs = @(".git", "tools", "transfer-package", "transfer-export")
$excludeFiles = @()

function Copy-ProjectItem($Source, $Destination) {
  $item = Get-Item -LiteralPath $Source -Force

  if ($item.PSIsContainer) {
    if ($excludeDirs -contains $item.Name) { return }

    $target = Join-Path $Destination $item.Name
    New-Item -ItemType Directory -Force -Path $target | Out-Null

    Get-ChildItem -LiteralPath $item.FullName -Force | ForEach-Object {
      if ($item.Name -eq "supabase" -and $_.Name -eq ".temp") { return }
      Copy-ProjectItem $_.FullName $target
    }
    return
  }

  if ($excludeFiles -contains $item.Name) { return }
  Copy-Item -LiteralPath $item.FullName -Destination $Destination -Force
}

Get-ChildItem -Force | ForEach-Object {
  Copy-ProjectItem $_.FullName $packageDir
}

Compress-Archive -Path (Join-Path $packageDir "*") -DestinationPath $zipPath -Force

Write-Host "Project package created:"
Write-Host $zipPath
Write-Host ""
Write-Host "Note: This package contains source code and handover docs, not live Supabase data."

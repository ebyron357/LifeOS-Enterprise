$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$obsidian = Join-Path $repo ".obsidian"
$backupRoot = Join-Path $repo ".local-backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = $null

if (-not (Test-Path (Join-Path $repo ".git"))) {
  throw "$repo is not a Git repository. Run this script from the cloned LifeOS-Enterprise repository."
}

Set-Location $repo

Write-Host "Repairing local Obsidian Life OS vault" -ForegroundColor Cyan
Write-Host "Repository: $repo"
Write-Host ""

if (Test-Path $obsidian) {
  New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
  $backup = Join-Path $backupRoot "obsidian-$timestamp"
  Copy-Item $obsidian $backup -Recurse -Force
  Write-Host "PASS: backed up local Obsidian settings to:" -ForegroundColor Green
  Write-Host $backup
} else {
  Write-Host "SKIP: no local .obsidian folder exists yet" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "Pulling main with fast-forward safety..." -ForegroundColor Yellow
git pull --ff-only origin main
if ($LASTEXITCODE -ne 0) {
  if ($backup) {
    throw "Git pull failed. No local settings were deleted. Backup remains at $backup"
  }
  throw "Git pull failed. No local settings were changed."
}

Write-Host "Applying canonical shared defaults without overwriting existing local settings..." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "setup-obsidian.ps1")

Write-Host ""
Write-Host "Repair complete." -ForegroundColor Green
Write-Host "Open this vault: $repo"
Write-Host "Then open: 00 Home\Life OS.md"

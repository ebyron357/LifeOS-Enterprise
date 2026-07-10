$ErrorActionPreference = "Stop"

$repo = Join-Path $env:USERPROFILE "Documents\GitHub\LifeOS-Enterprise"
$obsidian = Join-Path $repo ".obsidian"
$backupRoot = Join-Path $repo ".local-backups"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $backupRoot "obsidian-$timestamp"

if (-not (Test-Path $repo)) {
  throw "LifeOS-Enterprise was not found at $repo"
}

Set-Location $repo

if (-not (Test-Path (Join-Path $repo ".git"))) {
  throw "$repo is not a Git repository."
}

Write-Host "Repairing local LifeOS vault" -ForegroundColor Cyan

if (Test-Path $obsidian) {
  New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
  Copy-Item $obsidian $backup -Recurse -Force
  Write-Host "Backed up local Obsidian settings to:" -ForegroundColor Green
  Write-Host $backup
}

Write-Host "Pulling repaired repository..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
  throw "Git pull failed. No local settings were deleted. Backup remains at $backup"
}

Write-Host "Applying shared defaults without overwriting existing local settings..." -ForegroundColor Yellow
& (Join-Path $repo "scripts\setup-obsidian.ps1")

Write-Host ""
Write-Host "Repair complete." -ForegroundColor Green
Write-Host "Open: $repo"
Write-Host "Then open: Command Center\Daily Command Center.md"

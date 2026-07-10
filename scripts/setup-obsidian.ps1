param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$obsidian = Join-Path $repo ".obsidian"
$config = Join-Path $repo "config\obsidian"

Write-Host "Obsidian Life OS setup" -ForegroundColor Cyan
Write-Host "Repository: $repo"
Write-Host ""

if (-not (Test-Path (Join-Path $repo ".git"))) {
  throw "$repo is not a Git repository. Run this script from the cloned LifeOS-Enterprise repository."
}

$canonicalFolders = @(
  "00 Home",
  "00 Home\Bases",
  "01 Inbox",
  "10 Projects",
  "20 Areas",
  "30 Goals",
  "40 Resources",
  "40 Resources\Attachments",
  "50 People",
  "60 Reviews",
  "60 Reviews\Weekly",
  "60 Reviews\Monthly",
  "70 Journal",
  "70 Journal\Daily",
  "80 SOPs",
  "90 Archive",
  "90 Archive\Projects",
  "99 Templates"
)

foreach ($folder in $canonicalFolders) {
  $path = Join-Path $repo $folder
  New-Item -ItemType Directory -Path $path -Force | Out-Null
}

Write-Host "PASS: canonical folders exist" -ForegroundColor Green

New-Item -ItemType Directory -Path $obsidian -Force | Out-Null

function Install-ConfigFile {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Target,
    [Parameter(Mandatory = $true)][string]$Label
  )

  if (-not (Test-Path $Source)) {
    throw "Missing shared configuration file: $Source"
  }

  $targetDirectory = Split-Path -Parent $Target
  New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null

  if ((Test-Path $Target) -and -not $Force) {
    Write-Host "KEEP: $Label already exists at $Target" -ForegroundColor DarkYellow
    return
  }

  Copy-Item $Source $Target -Force
  Write-Host "PASS: installed $Label" -ForegroundColor Green
}

Install-ConfigFile `
  (Join-Path $config "app.json") `
  (Join-Path $obsidian "app.json") `
  "Files and Links defaults"

Install-ConfigFile `
  (Join-Path $config "templates.json") `
  (Join-Path $obsidian "templates.json") `
  "Templates defaults"

Install-ConfigFile `
  (Join-Path $config "daily-notes.json") `
  (Join-Path $obsidian "daily-notes.json") `
  "Daily Notes defaults"

$homepagePlugin = Join-Path $obsidian "plugins\homepage"
if (Test-Path $homepagePlugin) {
  Install-ConfigFile `
    (Join-Path $config "homepage.json") `
    (Join-Path $homepagePlugin "data.json") `
    "Homepage plugin defaults"
} else {
  Write-Host "SKIP: Homepage community plugin is not installed; use Bookmarks for 00 Home\Life OS.md" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "Running vault audit..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "audit-vault.ps1")

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Open this exact folder as an Obsidian vault:" -ForegroundColor Cyan
Write-Host $repo
Write-Host ""
Write-Host "Then enable these core plugins in Obsidian:" -ForegroundColor Cyan
Write-Host "- Templates"
Write-Host "- Daily notes"
Write-Host "- Properties view"
Write-Host "- Bases"
Write-Host "- Bookmarks"
Write-Host "- Canvas"
Write-Host ""
Write-Host "Success target: 00 Home\Life OS.md"
Write-Host "Use -Force only when you intentionally want to replace local shared settings."

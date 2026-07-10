param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repo = Join-Path $env:USERPROFILE "Documents\GitHub\LifeOS-Enterprise"
$obsidian = Join-Path $repo ".obsidian"
$config = Join-Path $repo "config\obsidian"

Write-Host "LifeOS Obsidian setup" -ForegroundColor Cyan
Write-Host "Repo: $repo"

if (-not (Test-Path $repo)) {
  throw "LifeOS-Enterprise was not found at $repo"
}

Set-Location $repo

if (-not (Test-Path (Join-Path $repo ".git"))) {
  throw "$repo is not a Git repository."
}

New-Item -ItemType Directory -Path $obsidian -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $obsidian "plugins\homepage") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $repo "Resources\Attachments") -Force | Out-Null

function Install-ConfigFile {
  param(
    [string]$Source,
    [string]$Target
  )

  if (-not (Test-Path $Source)) {
    throw "Missing shared config template: $Source"
  }

  if ((Test-Path $Target) -and -not $Force) {
    Write-Host "Keeping existing local setting: $Target" -ForegroundColor DarkYellow
    return
  }

  Copy-Item $Source $Target -Force
  Write-Host "Installed setting: $Target" -ForegroundColor Green
}

Install-ConfigFile (Join-Path $config "app.json") (Join-Path $obsidian "app.json")
Install-ConfigFile (Join-Path $config "templates.json") (Join-Path $obsidian "templates.json")
Install-ConfigFile (Join-Path $config "homepage.json") (Join-Path $obsidian "plugins\homepage\data.json")

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Open this exact folder as an Obsidian vault:"
Write-Host $repo -ForegroundColor Cyan
Write-Host "Homepage target: Command Center\Daily Command Center.md"
Write-Host ""
Write-Host "Notes:"
Write-Host "- .obsidian is local-only and ignored by Git."
Write-Host "- Run again with -Force only when you intentionally want to replace local settings."

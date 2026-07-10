$ErrorActionPreference = "Stop"

$repo = Join-Path $env:USERPROFILE "Documents\GitHub\LifeOS-Enterprise"
$oldVault = Join-Path $env:USERPROFILE "OneDrive\Desktop"
$oldObsidian = Join-Path $oldVault ".obsidian"
$newObsidian = Join-Path $repo ".obsidian"

Write-Host "LifeOS Obsidian setup" -ForegroundColor Cyan
Write-Host "Repo: $repo"

if (-not (Test-Path $repo)) {
  throw "LifeOS-Enterprise was not found at $repo"
}

Set-Location $repo

Write-Host "Pulling latest files from GitHub..." -ForegroundColor Yellow
git pull origin main

if (-not (Test-Path $newObsidian)) {
  New-Item -ItemType Directory -Path $newObsidian | Out-Null
}

if (Test-Path $oldObsidian) {
  Write-Host "Copying installed Obsidian plugins and settings from the old vault..." -ForegroundColor Yellow

  $oldPlugins = Join-Path $oldObsidian "plugins"
  $newPlugins = Join-Path $newObsidian "plugins"

  if (Test-Path $oldPlugins) {
    New-Item -ItemType Directory -Path $newPlugins -Force | Out-Null
    Copy-Item "$oldPlugins\*" $newPlugins -Recurse -Force
  }

  $copyFiles = @(
    "community-plugins.json",
    "core-plugins.json",
    "hotkeys.json",
    "appearance.json"
  )

  foreach ($file in $copyFiles) {
    $source = Join-Path $oldObsidian $file
    $target = Join-Path $newObsidian $file
    if (Test-Path $source) {
      Copy-Item $source $target -Force
    }
  }
}

$appConfig = @'
{
  "newFileLocation": "folder",
  "newFileFolderPath": "Inbox",
  "attachmentFolderPath": "Resources/Attachments",
  "useMarkdownLinks": false,
  "alwaysUpdateLinks": true
}
'@
Set-Content -Path (Join-Path $newObsidian "app.json") -Value $appConfig -Encoding UTF8

$templateConfig = @'
{
  "folder": "templates"
}
'@
Set-Content -Path (Join-Path $newObsidian "templates.json") -Value $templateConfig -Encoding UTF8

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Now open this exact folder as an Obsidian vault:"
Write-Host $repo -ForegroundColor Cyan
Write-Host "Then open: Command Center\Daily Command Center.md"

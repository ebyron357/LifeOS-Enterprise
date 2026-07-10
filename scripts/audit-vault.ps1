$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$requiredFolders = @(
  "00 Home",
  "00 Home/Bases",
  "01 Inbox",
  "10 Projects",
  "20 Areas",
  "30 Goals",
  "40 Resources",
  "50 People",
  "60 Reviews",
  "70 Journal",
  "70 Journal/Daily",
  "80 SOPs",
  "90 Archive",
  "99 Templates"
)

$requiredBases = @(
  "00 Home/Bases/Active Projects.base",
  "00 Home/Bases/Projects Needing Review.base",
  "00 Home/Bases/Goals by Timeframe.base",
  "00 Home/Bases/Areas Overview.base",
  "00 Home/Bases/People to Contact.base",
  "00 Home/Bases/Recently Added Resources.base",
  "00 Home/Bases/Active SOPs.base",
  "00 Home/Bases/Agent Registry.base",
  "00 Home/Bases/Decisions Needing Review.base",
  "00 Home/Bases/Archive.base"
)

$requiredTemplates = @(
  "99 Templates/Daily Note.md",
  "99 Templates/Weekly Review.md",
  "99 Templates/Monthly Review.md",
  "99 Templates/Project.md",
  "99 Templates/Area.md",
  "99 Templates/Goal.md",
  "99 Templates/Meeting.md",
  "99 Templates/Person.md",
  "99 Templates/Decision.md",
  "99 Templates/Resource.md",
  "99 Templates/SOP.md",
  "99 Templates/Agent Specification.md",
  "99 Templates/Experiment.md",
  "99 Templates/Business or Product Idea.md",
  "99 Templates/Content Brief.md",
  "99 Templates/Automation Workflow.md"
)

$requiredFiles = @(
  "README.md",
  "00 Home/Life OS.md",
  "00 Home/Business Dashboard.md",
  "00 Home/Personal Dashboard.md",
  "00 Home/Agentic Work Dashboard.md",
  "01 Inbox/Inbox.md",
  "architecture/METADATA_SCHEMA.md",
  "docs/LifeOS_Specification_v1.md",
  "docs/OBSIDIAN_SETUP.md",
  "config/obsidian/app.json",
  "config/obsidian/templates.json",
  "config/obsidian/daily-notes.json",
  "config/obsidian/homepage.json"
) + $requiredBases + $requiredTemplates

$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Get-RelativePath {
  param([string]$Path)
  return $Path.Substring($repo.Length + 1).Replace("\", "/")
}

function Test-PropertyPresent {
  param(
    [string]$Content,
    [string]$Property
  )
  return $Content -match "(?m)^$([regex]::Escape($Property)):\s*.*$"
}

function Test-PropertyHasValue {
  param(
    [string]$Content,
    [string]$Property
  )
  return $Content -match "(?m)^$([regex]::Escape($Property)):\s*\S.+$"
}

foreach ($folder in $requiredFolders) {
  if (-not (Test-Path (Join-Path $repo $folder))) {
    $errors.Add("Missing canonical folder: $folder")
  }
}

foreach ($file in $requiredFiles) {
  if (-not (Test-Path (Join-Path $repo $file))) {
    $errors.Add("Missing required system file: $file")
  }
}

foreach ($base in $requiredBases) {
  $path = Join-Path $repo $base
  if (-not (Test-Path $path)) { continue }

  $content = Get-Content $path -Raw
  foreach ($marker in @("filters:", "properties:", "views:", "type: table")) {
    if ($content -notmatch [regex]::Escape($marker)) {
      $errors.Add("$base is missing Bases syntax marker: $marker")
    }
  }

  if ($content -match "`t") {
    $errors.Add("$base contains tab indentation; Bases files require YAML-safe spaces")
  }
}

$jsonFiles = @(
  "config/obsidian/app.json",
  "config/obsidian/templates.json",
  "config/obsidian/daily-notes.json",
  "config/obsidian/homepage.json"
)

foreach ($jsonFile in $jsonFiles) {
  $path = Join-Path $repo $jsonFile
  if (-not (Test-Path $path)) { continue }

  try {
    Get-Content $path -Raw | ConvertFrom-Json | Out-Null
  } catch {
    $errors.Add("Invalid JSON: $jsonFile — $($_.Exception.Message)")
  }
}

$templateRequirements = @{
  "99 Templates/Project.md" = @("type: project", "status:", "area:", "goal:", "owner:", "priority:", "review_date:", "next_action:")
  "99 Templates/Area.md" = @("type: area", "status:", "standard:", "review_frequency:")
  "99 Templates/Goal.md" = @("type: goal", "status:", "area:", "target_date:", "metric:", "current_value:", "target_value:")
  "99 Templates/Person.md" = @("type: person", "last_contact:", "next_contact:")
  "99 Templates/SOP.md" = @("type: sop", "owner:", "version:", "last_tested:", "review_date:")
  "99 Templates/Agent Specification.md" = @("type: agent", "risk_level:", "version:", "review_date:")
}

foreach ($template in $templateRequirements.Keys) {
  $path = Join-Path $repo $template
  if (-not (Test-Path $path)) { continue }

  $content = Get-Content $path -Raw
  foreach ($field in $templateRequirements[$template]) {
    if ($content -notmatch [regex]::Escape($field)) {
      $errors.Add("$template is missing required template property: $field")
    }
  }
}

$canonicalProjectFiles = Get-ChildItem (Join-Path $repo "10 Projects") -Filter *.md -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -ne "README.md" }

foreach ($file in $canonicalProjectFiles) {
  $content = Get-Content $file.FullName -Raw
  $relative = Get-RelativePath $file.FullName

  if ($content -notmatch "(?m)^type:\s*project\s*$") {
    $errors.Add("$relative must contain: type: project")
  }

  foreach ($field in @("status", "owner", "priority", "review_date", "next_action")) {
    if (-not (Test-PropertyHasValue $content $field)) {
      $errors.Add("$relative has a blank or missing required project property: $field")
    }
  }
}

$legacyProjectsPath = Join-Path $repo "Projects"
if (Test-Path $legacyProjectsPath) {
  $legacyProjectFiles = Get-ChildItem $legacyProjectsPath -Filter *.md -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne "README.md" }

  foreach ($file in $legacyProjectFiles) {
    $content = Get-Content $file.FullName -Raw
    $relative = Get-RelativePath $file.FullName

    foreach ($field in @("type", "status", "owner", "priority", "review_date", "next_action")) {
      if (-not (Test-PropertyPresent $content $field)) {
        $warnings.Add("Legacy project should be migrated or repaired: $relative missing $field")
      }
    }
  }
} else {
  $legacyProjectFiles = @()
}

$homePath = Join-Path $repo "00 Home/Life OS.md"
if (Test-Path $homePath) {
  $homeContent = Get-Content $homePath -Raw
  $baseEmbeds = [regex]::Matches($homeContent, '!\[\[([^\]]+\.base)\]\]')

  foreach ($embed in $baseEmbeds) {
    $target = $embed.Groups[1].Value
    if (-not (Test-Path (Join-Path $repo $target))) {
      $errors.Add("Home dashboard embeds a missing Base: $target")
    }
  }

  if ($baseEmbeds.Count -lt $requiredBases.Count) {
    $warnings.Add("Home dashboard embeds $($baseEmbeds.Count) Bases; $($requiredBases.Count) canonical Bases exist")
  }
}

Write-Host "Obsidian Life OS Vault Audit" -ForegroundColor Cyan
Write-Host "============================"
Write-Host "Canonical folders checked: $($requiredFolders.Count)"
Write-Host "Required system files checked: $($requiredFiles.Count)"
Write-Host "Bases checked: $($requiredBases.Count)"
Write-Host "Templates checked: $($requiredTemplates.Count)"
Write-Host "Canonical project notes checked: $($canonicalProjectFiles.Count)"
Write-Host "Legacy project notes checked: $($legacyProjectFiles.Count)"
Write-Host ""

if ($warnings.Count -gt 0) {
  Write-Host "Warnings:" -ForegroundColor Yellow
  $warnings | Sort-Object -Unique | ForEach-Object { Write-Host "- $_" }
  Write-Host ""
}

if ($errors.Count -gt 0) {
  Write-Host "Errors:" -ForegroundColor Red
  $errors | Sort-Object -Unique | ForEach-Object { Write-Host "- $_" }
  exit 1
}

Write-Host "PASS: canonical vault structure, templates, Bases, and required metadata are valid." -ForegroundColor Green

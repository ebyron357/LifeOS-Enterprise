$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$requiredFolders = @(
  "AI", "Automations", "Businesses", "Command Center", "Dashboards", "Inbox",
  "Knowledge", "Learning", "People", "Projects", "Resources", "Reviews",
  "SOPs", "Tools", "URLs", "architecture", "docs", "scripts", "templates", "workflows"
)

$requiredFiles = @(
  "Command Center/Daily Command Center.md",
  "Dashboards/Weekly Review.md",
  "Dashboards/Monthly Review.md",
  "architecture/METADATA_SCHEMA.md",
  "docs/LifeOS_Specification_v1.md",
  "templates/project-template.md",
  "templates/business-template.md",
  "templates/knowledge-template.md",
  "templates/sop-template.md",
  "templates/tool-template.md",
  "templates/url-template.md",
  "templates/person-template.md"
)

$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

foreach ($folder in $requiredFolders) {
  if (-not (Test-Path (Join-Path $repo $folder))) {
    $errors.Add("Missing folder: $folder")
  }
}

foreach ($file in $requiredFiles) {
  if (-not (Test-Path (Join-Path $repo $file))) {
    $errors.Add("Missing required file: $file")
  }
}

$projectFiles = Get-ChildItem (Join-Path $repo "Projects") -Filter *.md -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -ne "README.md" }

foreach ($file in $projectFiles) {
  $content = Get-Content $file.FullName -Raw
  foreach ($field in @("type: project", "status:", "priority:", "next_action:", "review_date:")) {
    if ($content -notmatch [regex]::Escape($field)) {
      $errors.Add("$($file.FullName.Replace($repo + '\\','')) missing project metadata: $field")
    }
  }
}

$businessFiles = Get-ChildItem (Join-Path $repo "Businesses") -Filter *.md -File -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -ne "README.md" }

foreach ($file in $businessFiles) {
  $content = Get-Content $file.FullName -Raw
  foreach ($field in @("type: business", "status:", "priority:", "review_date:")) {
    if ($content -notmatch [regex]::Escape($field)) {
      $errors.Add("$($file.FullName.Replace($repo + '\\','')) missing business metadata: $field")
    }
  }
}

$markdownFiles = Get-ChildItem $repo -Recurse -Filter *.md -File |
  Where-Object { $_.FullName -notmatch "\\.git\\" }

foreach ($file in $markdownFiles) {
  $content = Get-Content $file.FullName -Raw
  $matches = [regex]::Matches($content, '\[\[([^\]|#]+)')
  foreach ($match in $matches) {
    $target = $match.Groups[1].Value.Trim()
    if ([string]::IsNullOrWhiteSpace($target)) { continue }
    $candidate = Join-Path $repo ($target + ".md")
    $candidateFolder = Join-Path $repo $target
    if (-not (Test-Path $candidate) -and -not (Test-Path $candidateFolder)) {
      $warnings.Add("Possible unresolved wikilink in $($file.FullName.Replace($repo + '\\','')): [[$target]]")
    }
  }
}

Write-Host "LifeOS Vault Audit" -ForegroundColor Cyan
Write-Host "=================="
Write-Host "Projects checked: $($projectFiles.Count)"
Write-Host "Businesses checked: $($businessFiles.Count)"
Write-Host "Markdown files checked: $($markdownFiles.Count)"
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

Write-Host "PASS: Core vault structure and required metadata are valid." -ForegroundColor Green

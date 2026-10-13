# No Pester, provider, credential or network dependency. Only synthetic records.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$temp = Join-Path ([IO.Path]::GetTempPath()) ('lifeos-content-test-' + [guid]::NewGuid().ToString('N'))
$campaignScript = Join-Path $PSScriptRoot 'New-ContentCampaign.ps1'
$leadScript = Join-Path $PSScriptRoot 'New-LeadProspect.ps1'
$script:passed = 0
function Assert-True { param([bool]$Condition, [string]$Message) if (-not $Condition) { throw $Message } }
function Test-Case {
  param([string]$Name, [scriptblock]$Body)
  & $Body
  $script:passed++
  Write-Host "PASS: $Name"
}
function Assert-Fails {
  param([scriptblock]$Body, [string]$MessagePattern)
  $failure = $null
  try { & $Body | Out-Null } catch { $failure = $_.Exception.Message }
  Assert-True ($null -ne $failure -and $failure -match $MessagePattern) 'Expected a safe validation failure.'
  return $failure
}
$campaign = @{ Title = 'Synthetic: briefing / one'; Client = 'Synthetic "Example" #1'; ContentType = 'article'; PrimaryTopic = 'Source-grounded planning'; SearchIntent = 'informational'; FunnelStage = 'awareness'; ConversionGoal = 'Review a synthetic checklist'; Owner = 'Test operator'; Date = '2026-10-13'; OutputDirectory = (Join-Path $temp 'campaigns') }
$lead = @{ AccountName = 'Synthetic Example'; Website = 'https://example.test'; SourcePlatform = 'synthetic manual test'; SourceUrl = 'https://example.test/about'; ObservedGap = 'Synthetic observation only: no real prospect.'; Owner = 'Test operator'; Date = '2026-10-13'; OutputDirectory = (Join-Path $temp 'prospects') }
try {
  Test-Case 'dry-run creates neither record nor directory' {
    $result = & $campaignScript @campaign -DryRun
    Assert-True (-not $result.Created -and -not (Test-Path -LiteralPath $temp)) 'Dry-run wrote data.'
  }
  Test-Case 'WhatIf creates neither record nor directory' {
    $result = & $leadScript @lead -WhatIf
    Assert-True (-not $result.Created -and -not (Test-Path -LiteralPath $temp)) 'WhatIf wrote data.'
  }
  Test-Case 'campaign uses canonical body, safe filename and quoted original fields' {
    $result = & $campaignScript @campaign
    $text = [IO.File]::ReadAllText($result.Path)
    Assert-True ($result.Created -and (Split-Path -Leaf $result.Path) -eq 'Synthetic- briefing - one.md') 'Unsafe filename.'
    Assert-True ($text.Contains('# ' + $campaign.Title) -and $text.Contains('## Fact-Check Register')) 'Template body or original title lost.'
    $stored = [regex]::Match($text, '(?m)^client: (.+)$').Groups[1].Value | ConvertFrom-Json
    Assert-True ($stored -eq $campaign.Client) 'Original input was not preserved.'
    Assert-True ($text -match 'created: "2026-10-13"' -and $text -match 'review_date: "2026-10-20"') 'ISO dates incorrect.'
    Assert-True ($text -match 'private: true' -and $text -match 'publish: false' -and $text -match 'web_visibility: "private"') 'Privacy flags missing.'
  }
  Test-Case 'overwrite leaves existing bytes unchanged' {
    $file = Get-ChildItem -LiteralPath $campaign.OutputDirectory -File | Select-Object -First 1
    $before = [IO.File]::ReadAllText($file.FullName)
    Assert-Fails { & $campaignScript @campaign } 'overwrite is disabled' | Out-Null
    Assert-True ($before -ceq [IO.File]::ReadAllText($file.FullName)) 'Existing content changed.'
  }
  Test-Case 'lead defaults fail closed without inventing contacts or consent' {
    $result = & $leadScript @lead
    $text = [IO.File]::ReadAllText($result.Path)
    Assert-True ($text -match 'suppression_status: "restricted"' -and $text -match 'email_verification_status: "unknown"') 'Unsafe default.'
    Assert-True ($text -match 'reply_status: "not-contacted"' -and $text -match '(?m)^email:\s*\r?$' -and $text -match '(?m)^contact_name:\s*\r?$') 'Invented contact/action.'
    Assert-True ($text -match 'private: true' -and $text -match 'publish: false' -and $text -match 'no outreach authorized') 'Private or consent boundary missing.'
  }
  Test-Case 'clear suppression needs explicit review evidence' {
    Assert-Fails { & $leadScript @lead -SuppressionStatus clear } 'Clear suppression requires' | Out-Null
  }
  Test-Case 'clear with explicit note remains researching and not contacted' {
    $caseParams = $lead.Clone(); $caseParams.AccountName = 'Synthetic reviewed'; $caseParams.SuppressionStatus = 'clear'; $caseParams.SuppressionReviewNote = 'Synthetic operator reviewed all suppression categories.'
    $result = & $leadScript @args
    $text = [IO.File]::ReadAllText($result.Path)
    Assert-True ($text -match 'suppression_status: "clear"' -and $text -match 'qualification_status: "researching"' -and $text -match 'reply_status: "not-contacted"' -and $text -match 'not consent') 'Clear escalated to contact permission.'
  }
  Test-Case 'opt-out remains suppressed without outreach action' {
    $caseParams = $lead.Clone(); $caseParams.AccountName = 'Synthetic opted out'; $caseParams.SuppressionStatus = 'opted-out'
    $result = & $leadScript @args
    $text = [IO.File]::ReadAllText($result.Path)
    Assert-True ($text -match 'suppression_status: "opted-out"' -and $text -match 'do not contact or export') 'Suppression not preserved.'
  }
  Test-Case 'missing required campaign and prospect fields fail without prompting' {
    $caseParams = $campaign.Clone(); $caseParams.Remove('Owner')
    Assert-Fails { & $campaignScript @args } 'Owner is required' | Out-Null
    $caseParams = $lead.Clone(); $caseParams.ObservedGap = ' '
    Assert-Fails { & $leadScript @args } 'ObservedGap is required' | Out-Null
  }
  Test-Case 'invalid date and earlier review date fail' {
    $caseParams = $lead.Clone(); $caseParams.Date = '2026-02-30'
    Assert-Fails { & $leadScript @args } 'valid ISO date' | Out-Null
    $caseParams = $lead.Clone(); $caseParams.ReviewDate = '2026-10-12'
    Assert-Fails { & $leadScript @args } 'on or after' | Out-Null
  }
  Test-Case 'invalid, credential and non-web URLs fail before writing' {
    foreach ($url in @('not a URL', 'file:///etc/passwd', 'https://user:password@example.test', 'https://example.test/?token=synthetic')) {
      $caseParams = $lead.Clone(); $caseParams.Website = $url
      Assert-Fails { & $leadScript @args } 'URL|credential' | Out-Null
    }
  }
  Test-Case 'control characters cannot inject properties or headings' {
    $caseParams = $campaign.Clone(); $caseParams.Title = "Synthetic`npublish: true"
    Assert-Fails { & $campaignScript @args } 'single line' | Out-Null
  }
  Test-Case 'credential-like input is rejected without reflecting the value' {
    $secret = 'api_key=synthetic-never-a-real-secret'
    $caseParams = $lead.Clone(); $caseParams.ObservedGap = $secret
    $failure = Assert-Fails { & $leadScript @args } 'credential-like material'
    Assert-True (-not $failure.Contains($secret)) 'Validation reflected a credential.'
    Assert-True (-not ((Get-ChildItem -LiteralPath $temp -Recurse -File | ForEach-Object { [IO.File]::ReadAllText($_.FullName) }) -join '').Contains($secret)) 'Credential was persisted.'
  }
  Test-Case 'reserved filenames and traversal characters remain contained' {
    foreach ($title in @('CON', '../Synthetic traversal')) {
      $caseParams = $campaign.Clone(); $caseParams.Title = $title
      $result = & $campaignScript @args
      Assert-True ((Split-Path -Parent $result.Path) -eq $campaign.OutputDirectory) 'Record escaped its destination.'
      Assert-True ((Split-Path -Leaf $result.Path) -ne 'CON.md') 'Reserved filename accepted.'
    }
  }
  Test-Case 'default output is private and ignored; tracked destination rejected' {
    $caseParams = $lead.Clone(); $caseParams.Remove('OutputDirectory'); $caseParams.AccountName = 'Synthetic dry-run only'
    $result = & $leadScript @args -DryRun
    Assert-True ($result.Path -match 'private[/\\]content-services[/\\]prospects') 'Default is not private.'
    $repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $caseParams.OutputDirectory = Join-Path $repo '40 Resources'
    Assert-Fails { & $leadScript @args -DryRun } 'private/content-services' | Out-Null
  }
  Test-Case 'filename collisions after sanitization fail safely' {
    $caseParams = $campaign.Clone(); $caseParams.Title = 'Synthetic collision/one'; & $campaignScript @args | Out-Null
    $caseParams.Title = 'Synthetic collision:one'
    Assert-Fails { & $campaignScript @args } 'overwrite is disabled' | Out-Null
  }
  Test-Case 'creation scripts and helper contain no network or process execution calls' {
    $files = @($campaignScript, $leadScript, (Join-Path $PSScriptRoot 'ContentServiceRecords.psm1'))
    foreach ($file in $files) {
      $tokens = $null; $errors = $null
      $ast = [Management.Automation.Language.Parser]::ParseFile($file, [ref]$tokens, [ref]$errors)
      Assert-True ($errors.Count -eq 0) 'PowerShell parser failed.'
      $commands = $ast.FindAll({ param($node) $node -is [Management.Automation.Language.CommandAst] }, $true) | ForEach-Object { $_.GetCommandName() }
      Assert-True (-not ($commands -match '^(Invoke-WebRequest|Invoke-RestMethod|Invoke-Expression|Start-Process|curl|wget|ssh|git)$')) 'Unexpected network/process command.'
    }
  }
  Write-Host "PASS: $script:passed Content-to-Lead safety cases. Synthetic files removed on exit."
} finally {
  if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}

[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$AccountName, [string]$Website, [string]$SourcePlatform,
  [string]$SourceUrl, [string]$ObservedGap, [string]$Owner,
  [string]$Campaign, [string]$Project, [string]$OutputDirectory,
  [ValidateSet('clear', 'opted-out', 'existing-client', 'partner', 'competitor', 'invalid', 'restricted', 'do-not-contact')]
  [string]$SuppressionStatus = 'restricted',
  [string]$SuppressionReviewNote,
  [string]$Date = [datetime]::UtcNow.ToString('yyyy-MM-dd'),
  [string]$ReviewDate, [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'ContentServiceRecords.psm1') -Force
foreach ($name in @('AccountName', 'SourcePlatform', 'ObservedGap', 'Owner')) {
  Assert-RecordText (Get-Variable -Name $name -ValueOnly) $name
}
Assert-RecordUrl $Website 'Website'
Assert-RecordUrl $SourceUrl 'SourceUrl'
foreach ($name in @('Campaign', 'Project', 'SuppressionReviewNote')) {
  Assert-RecordText (Get-Variable -Name $name -ValueOnly) $name -Optional
}
if ($SuppressionStatus -eq 'clear' -and (-not $PSBoundParameters.ContainsKey('SuppressionStatus') -or $SuppressionReviewNote.Trim().Length -lt 12)) {
  throw 'Clear suppression requires an explicit status and a review note of at least 12 characters; no consent is inferred.'
}
$fields = Get-RecordDates $Date $ReviewDate
$fields.account_name = $AccountName
$fields.website = $Website
$fields.source = $SourceUrl
$fields.source_platform = $SourcePlatform
$fields.source_url = $SourceUrl
$fields.observed_gap = $ObservedGap
$fields.owner = $Owner
$fields.campaign = $Campaign
$fields.project = $Project
$fields.status = 'researching'
$fields.qualification_status = 'researching'
$fields.email_verification_status = 'unknown'
$fields.suppression_status = $SuppressionStatus
$fields.consent_or_lawful_basis_note = $(if ($SuppressionReviewNote) { "Suppression review only (not consent): $SuppressionReviewNote" } else { 'Not established. Suppression review required; no outreach authorized.' })
$fields.reply_status = 'not-contacted'
$fields.opportunity_status = 'none'
$fields.next_action = 'Review source evidence and suppression; do not contact or export until separately approved.'
$fields.private = $true
$fields.publish = $false
$fields.web_visibility = 'private'
$plan = New-RecordPlan -TemplateName 'Lead Prospect.md' -Title $AccountName -TitlePlaceholder '{{account_name}}' -Fields $fields -OutputDirectory $OutputDirectory -Kind 'prospects'
if (-not $DryRun -and $PSCmdlet.ShouldProcess('local private prospect record', 'Create without overwrite')) {
  Write-RecordPlan $plan
} else { [pscustomobject]@{ Created = $false; Path = $plan.Path } }

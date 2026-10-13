[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$Title, [Alias('OperatingContext')][string]$Client,
  [string]$ContentType, [string]$PrimaryTopic, [string]$SearchIntent,
  [string]$FunnelStage, [string]$ConversionGoal, [string]$Owner,
  [string]$Project, [string]$OutputDirectory,
  [string]$Date = [datetime]::UtcNow.ToString('yyyy-MM-dd'),
  [string]$ReviewDate, [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'ContentServiceRecords.psm1') -Force
foreach ($name in @('Title', 'Client', 'ContentType', 'PrimaryTopic', 'SearchIntent', 'FunnelStage', 'ConversionGoal', 'Owner')) {
  Assert-RecordText (Get-Variable -Name $name -ValueOnly) $name
}
Assert-RecordText $Project 'Project' -Optional
$fields = Get-RecordDates $Date $ReviewDate
$fields.client = $Client
$fields.content_type = $ContentType
$fields.primary_topic = $PrimaryTopic
$fields.search_intent = $SearchIntent
$fields.funnel_stage = $FunnelStage
$fields.conversion_goal = $ConversionGoal
$fields.owner = $Owner
$fields.project = $Project
$fields.status = 'ideas'
$fields.evidence_status = 'Unverified'
$fields.next_action = 'Review the brief, source evidence, and conversion goal before drafting.'
$fields.private = $true
$fields.publish = $false
$fields.web_visibility = 'private'
$plan = New-RecordPlan -TemplateName 'Content Campaign.md' -Title $Title -TitlePlaceholder '{{title}}' -Fields $fields -OutputDirectory $OutputDirectory -Kind 'campaigns'
if (-not $DryRun -and $PSCmdlet.ShouldProcess('local private campaign record', 'Create without overwrite')) {
  Write-RecordPlan $plan
} else { [pscustomobject]@{ Created = $false; Path = $plan.Path } }

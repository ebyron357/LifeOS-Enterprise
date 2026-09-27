$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$failures = New-Object System.Collections.Generic.List[string]

function Fail([string]$message) { $failures.Add($message) }

$required = @(
  "MAPS.md",
  "architecture/MAPS_OPERATING_MODEL.md",
  "maps/ai-workforce.md",
  "maps/automations.md",
  "Automations/ROUTINE_REGISTRY.json"
)

foreach ($relative in $required) {
  if (-not (Test-Path (Join-Path $root $relative))) { Fail "Missing required MAPS file: $relative" }
}

$master = Join-Path $root "MAPS.md"
if (Test-Path $master) {
  $text = Get-Content $master -Raw
  $links = [regex]::Matches($text, '\]\(([^)]+)\)')
  foreach ($match in $links) {
    $target = [uri]::UnescapeDataString($match.Groups[1].Value)
    if ($target -match '^(https?://|#)') { continue }
    $candidate = Join-Path $root $target
    if (-not (Test-Path $candidate)) { Fail "Broken master-map route: $target" }
  }
}

$registryPath = Join-Path $root "Automations/ROUTINE_REGISTRY.json"
if (Test-Path $registryPath) {
  try { $registry = Get-Content $registryPath -Raw | ConvertFrom-Json }
  catch { Fail "Routine registry is not valid JSON: $($_.Exception.Message)"; $registry = $null }

  if ($null -ne $registry) {
    $ids = @{}
    foreach ($routine in $registry.routines) {
      foreach ($field in @("id","name","schedule","machine","command","owner","timeout_minutes","failure_cap","evidence_path")) {
        if ($null -eq $routine.$field -or [string]::IsNullOrWhiteSpace([string]$routine.$field)) {
          Fail "Routine missing required field '$field': $($routine.id)"
        }
      }
      if ($ids.ContainsKey($routine.id)) { Fail "Duplicate routine id: $($routine.id)" } else { $ids[$routine.id] = $true }
      $evidence = Join-Path $root $routine.evidence_path
      if (-not (Test-Path $evidence)) { Fail "Missing routine evidence directory: $($routine.evidence_path)" }
    }
  }
}

if ($failures.Count -gt 0) {
  Write-Host "MAPS VALIDATION: FAILED"
  $failures | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "MAPS VALIDATION: PASSED"
Write-Host "Master routing, operating model, routine registry, and evidence paths are structurally valid."
exit 0

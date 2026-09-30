param(
  # Optional. When set, a JSON run record is written to this directory (relative to the repository root)
  # so a scheduled or local run leaves inspectable Pulse evidence.
  [string]$EvidenceDirectory = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$failures = New-Object System.Collections.Generic.List[string]
$startedAt = [DateTime]::UtcNow.ToString("o")

function Fail([string]$message) { $failures.Add($message) }

# Every signpost routed from MAPS.md is required, so deleting any one of them fails validation.
$signposts = @(
  "maps/home.md",
  "maps/projects.md",
  "maps/businesses.md",
  "maps/ai-workforce.md",
  "maps/automations.md",
  "maps/knowledge.md",
  "maps/system.md"
)

$required = @(
  "MAPS.md",
  "architecture/MAPS_OPERATING_MODEL.md",
  "Automations/ROUTINE_REGISTRY.json",
  "Automations/runs"
) + $signposts

foreach ($relative in $required) {
  if (-not (Test-Path (Join-Path $root $relative))) { Fail "Missing required MAPS file: $relative" }
}

# Legacy placeholder folders whose content moved to a canonical numbered folder. Maps must route to the canonical home.
$legacyRoutes = @{
  "SOPs"  = "80 SOPs"
  "Inbox" = "01 Inbox"
}

function Test-MapRoutes([string]$relativeMapPath) {
  $mapPath = Join-Path $root $relativeMapPath
  if (-not (Test-Path $mapPath)) { return }
  $mapDirectory = Split-Path -Parent $mapPath
  $text = Get-Content $mapPath -Raw
  $links = [regex]::Matches($text, '\]\(([^)]+)\)')
  foreach ($match in $links) {
    $target = [uri]::UnescapeDataString($match.Groups[1].Value)
    if ($target -match '^(https?://|#|mailto:)') { continue }
    $candidate = Join-Path $mapDirectory $target
    if (-not (Test-Path $candidate)) {
      Fail "Broken route in ${relativeMapPath}: $target"
      continue
    }
    $resolved = (Resolve-Path $candidate).Path.TrimEnd('\', '/')
    $rootResolved = (Resolve-Path $root).Path.TrimEnd('\', '/')
    foreach ($legacy in $legacyRoutes.Keys) {
      $legacyResolved = (Join-Path $rootResolved $legacy).TrimEnd('\', '/')
      # Match the legacy folder itself or anything beneath it (for example ../SOPs/README.md).
      $isLegacy = $resolved -eq $legacyResolved -or
        $resolved.StartsWith($legacyResolved + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) -or
        $resolved.StartsWith($legacyResolved + '/', [System.StringComparison]::OrdinalIgnoreCase)
      if ($isLegacy) {
        Fail "Stale route in ${relativeMapPath}: $target is in a legacy folder; route to '$($legacyRoutes[$legacy])' instead"
      }
    }
  }
}

Test-MapRoutes "MAPS.md"
foreach ($signpost in $signposts) { Test-MapRoutes $signpost }

$registryPath = Join-Path $root "Automations/ROUTINE_REGISTRY.json"
if (Test-Path $registryPath) {
  $registry = $null
  try { $registry = Get-Content $registryPath -Raw | ConvertFrom-Json }
  catch { Fail "Routine registry is not valid JSON: $($_.Exception.Message)" }

  if ($null -ne $registry) {
    if ($null -eq $registry.PSObject.Properties["schema_version"] -or [string]::IsNullOrWhiteSpace([string]$registry.schema_version)) {
      Fail "Routine registry is missing required 'schema_version'"
    }

    $routinesProperty = $registry.PSObject.Properties["routines"]
    if ($null -eq $routinesProperty -or $null -eq $routinesProperty.Value -or -not ($routinesProperty.Value -is [array])) {
      Fail "Routine registry must contain a 'routines' array"
    }
    else {
      $ids = @{}
      $index = 0
      foreach ($routine in $routinesProperty.Value) {
        $label = if ($null -ne $routine -and $null -ne $routine.id) { [string]$routine.id } else { "routines[$index]" }
        $index++
        if ($null -eq $routine -or -not ($routine -is [System.Management.Automation.PSCustomObject])) {
          Fail "Routine entry is not an object: $label"
          continue
        }
        foreach ($field in @("id","name","schedule","machine","command","owner","timeout_minutes","failure_cap","evidence_path")) {
          if ($null -eq $routine.$field -or [string]::IsNullOrWhiteSpace([string]$routine.$field)) {
            Fail "Routine missing required field '$field': $label"
          }
        }
        if ($null -eq $routine.PSObject.Properties["enabled"] -or -not ($routine.enabled -is [bool])) {
          Fail "Routine 'enabled' must be true or false: $label"
        }
        foreach ($limit in @("timeout_minutes","failure_cap")) {
          $value = $routine.$limit
          if ($null -ne $value -and -not (($value -is [int] -or $value -is [long]) -and $value -gt 0)) {
            Fail "Routine '$limit' must be a positive whole number: $label"
          }
        }
        if ($null -ne $routine.id) {
          if ($ids.ContainsKey($routine.id)) { Fail "Duplicate routine id: $($routine.id)" } else { $ids[$routine.id] = $true }
        }
        if (-not [string]::IsNullOrWhiteSpace([string]$routine.evidence_path)) {
          $evidence = Join-Path $root $routine.evidence_path
          if (-not (Test-Path $evidence -PathType Container)) { Fail "Missing routine evidence directory: $($routine.evidence_path)" }
        }
      }
    }
  }
}

$result = if ($failures.Count -gt 0) { "FAILED" } else { "PASSED" }

if (-not [string]::IsNullOrWhiteSpace($EvidenceDirectory)) {
  $evidenceRoot = if ([System.IO.Path]::IsPathRooted($EvidenceDirectory)) { $EvidenceDirectory } else { Join-Path $root $EvidenceDirectory }
  if (-not (Test-Path $evidenceRoot -PathType Container)) { New-Item -ItemType Directory -Path $evidenceRoot -Force | Out-Null }
  $commit = ""
  try { $commit = (& git -C $root rev-parse HEAD 2>$null) } catch { $commit = "" }
  $record = [ordered]@{
    routine_id   = "maps-integrity-check"
    started_at   = $startedAt
    finished_at  = [DateTime]::UtcNow.ToString("o")
    result       = $result
    commit       = [string]$commit
    failures     = @($failures)
  }
  # Millisecond timestamp plus a random nonce, and never overwrite: concurrent runs each keep their own record.
  $recordPath = $null
  for ($attempt = 0; $attempt -lt 5 -and $null -eq $recordPath; $attempt++) {
    $stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssfffZ")
    $nonce = [guid]::NewGuid().ToString("N").Substring(0, 8)
    $candidatePath = Join-Path $evidenceRoot "run-$stamp-$nonce.json"
    if (-not (Test-Path -LiteralPath $candidatePath)) { $recordPath = $candidatePath }
  }
  if ($null -eq $recordPath) { throw "Could not reserve a unique evidence file name in $evidenceRoot" }
  $json = $record | ConvertTo-Json -Depth 4
  $stream = [System.IO.File]::Open($recordPath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write)
  try {
    $writer = New-Object System.IO.StreamWriter($stream, (New-Object System.Text.UTF8Encoding($false)))
    $writer.Write($json)
    $writer.Flush()
  }
  finally { $stream.Dispose() }
  Write-Host "Evidence written: $recordPath"
}

if ($failures.Count -gt 0) {
  Write-Host "MAPS VALIDATION: FAILED"
  $failures | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "MAPS VALIDATION: PASSED"
Write-Host "Master routing, all seven area signposts, the routine registry, and evidence paths are structurally valid."
exit 0

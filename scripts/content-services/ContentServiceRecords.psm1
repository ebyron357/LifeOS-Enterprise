Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-RecordText {
  param([string]$Value, [string]$Label, [switch]$Optional)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    if ($Optional) { return }
    throw "$Label is required."
  }
  if ($Value.Length -gt 2000 -or $Value -match '[\x00-\x1f\x7f]') {
    throw "$Label must be a single line of at most 2000 characters."
  }
  # Reject common credential material before it reaches a note or dry-run output.
  # This is not a substitute for reviewing free-text input before saving it.
  if ($Value -match '(?i)(api[_-]?key|access[_-]?token|client[_-]?secret|password|authorization)\s*[:=]\s*\S+|bearer\s+\S+|-----BEGIN .*PRIVATE KEY-----|\bsk-[\w-]{16,}|\bgh[pousr]_[\w]{20,}|\bgithub_pat_[\w]{20,}|\bAKIA[A-Z0-9]{16}') {
    throw "$Label contains credential-like material; nothing was written."
  }
}

function Assert-RecordUrl {
  param([string]$Value, [string]$Label)
  Assert-RecordText $Value $Label
  $parsed = $null
  if (-not [Uri]::TryCreate($Value, [UriKind]::Absolute, [ref]$parsed) -or
      $parsed.Scheme -notin @('http', 'https') -or -not $parsed.Host -or $parsed.UserInfo) {
    throw "$Label must be an absolute HTTP(S) URL without credentials."
  }
  if ($parsed.Query -match '(?i)[?&](token|key|secret|password|signature|api_key|access_token)=') {
    throw "$Label must not contain credential query parameters."
  }
}

function Get-RecordDates {
  param([string]$Date, [string]$ReviewDate)
  $parsed = [datetime]::MinValue
  if (-not [datetime]::TryParseExact($Date, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$parsed)) {
    throw 'Date must be a valid ISO date (yyyy-MM-dd).'
  }
  if (-not $ReviewDate) { $ReviewDate = $parsed.AddDays(7).ToString('yyyy-MM-dd') }
  $review = [datetime]::MinValue
  if (-not [datetime]::TryParseExact($ReviewDate, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None, [ref]$review) -or $review -lt $parsed) {
    throw 'ReviewDate must be a valid ISO date on or after Date.'
  }
  return @{ created = $Date; updated = $Date; review_date = $ReviewDate }
}

function New-RecordPlan {
  param([string]$TemplateName, [string]$Title, [string]$TitlePlaceholder,
    [System.Collections.IDictionary]$Fields, [string]$OutputDirectory, [string]$Kind)
  $repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
  $privateRoot = [IO.Path]::GetFullPath((Join-Path $repo 'private/content-services'))
  if (-not $OutputDirectory) { $OutputDirectory = Join-Path $privateRoot $Kind }
  $output = [IO.Path]::GetFullPath($OutputDirectory)
  # Prevent accidental tracked prospect/client data. Custom output is allowed
  # outside Git checkouts; inside this checkout use only the ignored private area.
  $cursor = $output
  while ($cursor) {
    if (Test-Path -LiteralPath $cursor) {
      $item = Get-Item -LiteralPath $cursor -Force
      if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Output path cannot contain symbolic links or reparse points.' }
      if (Test-Path -LiteralPath (Join-Path $cursor '.git')) {
        if ($cursor -ne $repo -or -not ($output + [IO.Path]::DirectorySeparatorChar).StartsWith($privateRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::Ordinal)) {
          throw 'Output inside a Git checkout must use this repository''s private/content-services directory.'
        }
      }
    }
    $parent = Split-Path -Parent $cursor
    if ($parent -eq $cursor) { break }
    $cursor = $parent
  }
  $filename = [regex]::Replace($Title.Normalize(), '[<>:"/\\|?*\x00-\x1f]', '-')
  $filename = $filename.Trim().TrimEnd('.', ' ')
  if ($filename.Length -gt 100) { $filename = $filename.Substring(0, 100).TrimEnd('.', ' ') }
  if (-not $filename -or $filename -match '^\.+$') { throw 'Title does not produce a safe filename.' }
  if ($filename -match '^(?i:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)') { $filename = "record-$filename" }
  $path = Join-Path $output "$filename.md"
  if (Test-Path -LiteralPath $path) { throw 'A record with this filename already exists; overwrite is disabled.' }
  $template = Join-Path (Join-Path $repo '99 Templates') $TemplateName
  $text = [IO.File]::ReadAllText($template)
  $match = [regex]::Match($text, '\A---\r?\n(?<front>[\s\S]*?)\r?\n---(?<body>[\s\S]*)\z')
  if (-not $match.Success) { throw 'Canonical template has invalid frontmatter.' }
  $front = $match.Groups['front'].Value
  foreach ($entry in $Fields.GetEnumerator()) {
    # JSON string syntax is valid YAML; it prevents colons, quotes, hashtags and
    # user input from becoming extra properties. Privacy flags remain booleans.
    $encoded = ConvertTo-Json -InputObject $entry.Value -Compress
    $pattern = '(?m)^' + [regex]::Escape([string]$entry.Key) + ':[^\r\n]*'
    $line = "$($entry.Key): $encoded"
    if ([regex]::IsMatch($front, $pattern)) {
      $literal = $line
      $front = [regex]::Replace($front, $pattern, [Text.RegularExpressions.MatchEvaluator]{ param($m) $literal })
    } elseif ($entry.Key -in @('private', 'publish', 'web_visibility')) {
      $front += "`n$line"
    } else { throw "Canonical template is missing field $($entry.Key)." }
  }
  if (-not $match.Groups['body'].Value.Contains($TitlePlaceholder)) { throw 'Canonical template is missing its title placeholder.' }
  $body = $match.Groups['body'].Value.Replace($TitlePlaceholder, $Title)
  return [pscustomobject]@{ Path = $path; Directory = $output; Content = "---`n$front`n---$body" }
}

function Write-RecordPlan {
  param($Plan)
  [IO.Directory]::CreateDirectory($Plan.Directory) | Out-Null
  # CreateNew makes overwrite prevention atomic even when two commands race.
  $stream = [IO.File]::Open($Plan.Path, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
  try {
    $bytes = (New-Object Text.UTF8Encoding($false)).GetBytes($Plan.Content)
    $stream.Write($bytes, 0, $bytes.Length)
  } finally { $stream.Dispose() }
  return [pscustomobject]@{ Created = $true; Path = $Plan.Path }
}

Export-ModuleMember -Function Assert-RecordText, Assert-RecordUrl, Get-RecordDates, New-RecordPlan, Write-RecordPlan

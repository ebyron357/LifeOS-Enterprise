param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot,
  [Parameter(Mandatory = $true)]
  [AllowEmptyCollection()]
  [System.Collections.Generic.List[string]]$Errors
)

$ErrorActionPreference = "Stop"

function Get-MarkdownWithoutCode {
  param([string]$Content)

  $withoutFencedCode = [regex]::Replace($Content, '(?ms)^```.*?^```\s*', '')
  return [regex]::Replace($withoutFencedCode, '`[^`\r\n]*`', '')
}

function Normalize-VaultPath {
  param([string]$Path)

  $normalized = $Path.Trim().Replace("\\", "/")
  while ($normalized.StartsWith("./")) {
    $normalized = $normalized.Substring(2)
  }
  return $normalized.TrimStart([char]"/")
}

$vaultPaths = @(git -C $RepositoryRoot ls-files --cached --others --exclude-standard)
if ($LASTEXITCODE -ne 0) {
  $Errors.Add("Unable to enumerate tracked and non-ignored vault files")
  return 0
}

$vaultPaths = @(
  $vaultPaths |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    ForEach-Object { Normalize-VaultPath $_ } |
    Where-Object { Test-Path (Join-Path $RepositoryRoot $_) }
)

$targetIndex = @{}
foreach ($relativePath in $vaultPaths) {
  $normalized = $relativePath.ToLowerInvariant()
  $targetIndex[$normalized] = $true

  $extension = [System.IO.Path]::GetExtension($relativePath)
  if ($extension -eq ".md") {
    $withoutExtension = $relativePath.Substring(0, $relativePath.Length - $extension.Length)
    $targetIndex[$withoutExtension.ToLowerInvariant()] = $true
    $targetIndex[[System.IO.Path]::GetFileNameWithoutExtension($relativePath).ToLowerInvariant()] = $true
  } else {
    $targetIndex[[System.IO.Path]::GetFileName($relativePath).ToLowerInvariant()] = $true
  }
}

function Test-VaultTargetExists {
  param([string]$Target)

  $normalized = Normalize-VaultPath $Target
  if ([string]::IsNullOrWhiteSpace($normalized)) { return $true }
  if ($normalized.StartsWith("#") -or $normalized.StartsWith("^")) { return $true }
  if ($normalized -match '^[a-z][a-z0-9+.-]*://') { return $true }

  $candidate = $normalized.ToLowerInvariant()
  if ($targetIndex.ContainsKey($candidate)) { return $true }

  $extension = [System.IO.Path]::GetExtension($normalized)
  if ($extension -eq ".md") {
    $withoutExtension = $normalized.Substring(0, $normalized.Length - $extension.Length).ToLowerInvariant()
    if ($targetIndex.ContainsKey($withoutExtension)) { return $true }
  }

  return $false
}

$markdownPaths = @(
  $vaultPaths |
    Where-Object {
      $_.EndsWith(".md", [System.StringComparison]::OrdinalIgnoreCase) -and
      $_ -notmatch '^(99 Templates|templates)/'
    }
)

foreach ($relativePath in $markdownPaths) {
  $absolutePath = Join-Path $RepositoryRoot $relativePath
  $content = Get-MarkdownWithoutCode (Get-Content $absolutePath -Raw)
  $matches = [regex]::Matches($content, '(?<embed>!)?\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]')

  foreach ($match in $matches) {
    $target = $match.Groups[2].Value.Trim()
    if (-not (Test-VaultTargetExists $target)) {
      $kind = if ($match.Groups["embed"].Success) { "embed" } else { "Wikilink" }
      $Errors.Add("Unresolved $kind in ${relativePath}: [[$target]]")
    }
  }

  if ($content.Contains('\n')) {
    $Errors.Add("Literal \\n escape found in Markdown: $relativePath")
  }
}

return $markdownPaths.Count

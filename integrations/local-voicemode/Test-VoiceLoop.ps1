#Requires -Version 5.1
<#
.SYNOPSIS
    Verifies the LifeOS local voice layer end to end and writes evidence.
.DESCRIPTION
    Non-interactive checks (default):
      - shared runtime, voice client, and agent skill files are installed
      - Parakeet STT and Supertonic TTS tasks run and report healthy
      - both services listen on localhost only
      - privacy: no cloud route can be taken silently
      - silent pipeline: Supertonic speaks a known sentence to a WAV file and
        Parakeet transcribes it back (no speakers or microphone needed)
      - the Git Bash bridge Claude Code uses reaches the voice client
      - the client refuses a non-local service URL
      - memory used by the voice services

    -Interactive adds real hardware turns through the same bridge Claude Code
    uses: you hear prompts and answer out loud. Memory is sampled throughout.

    Starts the two voice tasks if they are registered but stopped; changes nothing else.
.PARAMETER Interactive
    Run the speaker and microphone turns.
.PARAMETER HealthTimeoutSeconds
    How long to wait for the services to become healthy (the first Parakeet
    start downloads and loads its model).
.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\integrations\local-voicemode\Test-VoiceLoop.ps1 -Interactive
#>
[CmdletBinding()]
param(
    [switch]$Interactive,
    [int]$HealthTimeoutSeconds = 600,
    [string]$EvidenceDirectory = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$UserHome = if ($env:USERPROFILE) { $env:USERPROFILE } else { [Environment]::GetFolderPath('UserProfile') }
$LocalAppData = if ($env:LOCALAPPDATA) { $env:LOCALAPPDATA } else { [Environment]::GetFolderPath('LocalApplicationData') }
if (-not $EvidenceDirectory) { $EvidenceDirectory = Join-Path $LocalAppData 'LifeOS\voice\evidence' }
$ConfigDir = Join-Path $UserHome '.config\opencode'
$RuntimeDir = Join-Path $ConfigDir 'skills\talk'
$Client = Join-Path $RuntimeDir 'Invoke-Talk.ps1'
$Bridge = Join-Path $RuntimeDir 'talk-win.sh'
$BridgeCommand = 'bash ~/.config/opencode/skills/talk/talk-win.sh'
$PermissionRule = 'Bash(bash ~/.config/opencode/skills/talk/talk-win.sh *)'
$Services = [ordered]@{
    'Parakeet STT' = [ordered]@{ Task = 'OpenCode-Parakeet-STT'; Port = 5093; Health = 'http://127.0.0.1:5093/health'; ReadyField = 'ready'; Match = 'parakeet' }
    'Supertonic TTS' = [ordered]@{ Task = 'OpenCode-Supertonic'; Port = 8766; Health = 'http://127.0.0.1:8766/health'; ReadyField = 'model_loaded'; Match = 'supertonic' }
}
$TestSentence = 'The local voice loop is working on this computer.'

$checks = New-Object System.Collections.Generic.List[object]
$metrics = [ordered]@{}

function Add-Check {
    param([string]$Name, [ValidateSet('PASS', 'FAIL', 'WARN', 'SKIP', 'INFO')][string]$Status, [string]$Detail)
    $checks.Add([pscustomobject]@{ Name = $Name; Status = $Status; Detail = $Detail })
    $color = @{ PASS = 'Green'; FAIL = 'Red'; WARN = 'Yellow'; SKIP = 'DarkGray'; INFO = 'Gray' }[$Status]
    Write-Host ("  [{0,-4}] {1}: {2}" -f $Status, $Name, $Detail) -ForegroundColor $color
}

function Get-OptionalProperty {
    param($Object, [string]$Name)
    if ($null -eq $Object) { return $null }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) { return $null }
    return $property.Value
}

function Get-WordRecall {
    # Share of expected words that appear in the transcript.
    param([string]$Expected, [string]$Heard)
    $norm = { param($t) @((($t.ToLowerInvariant() -replace "[^\p{L}\p{Nd}' ]", ' ') -split '\s+') | Where-Object { $_ }) }
    $want = @(& $norm $Expected)
    $got = @(& $norm $Heard)
    if ($want.Count -eq 0) { return 0 }
    return [math]::Round((@($want | Where-Object { $got -contains $_ }).Count / $want.Count), 2)
}

function Get-VoiceMemory {
    $result = [ordered]@{ parakeet_mb = 0; supertonic_mb = 0; other_python_mb = 0; system_free_mb = $null }
    try {
        foreach ($p in @(Get-CimInstance Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe'")) {
            $mb = [math]::Round($p.WorkingSetSize / 1MB)
            $line = [string](Get-OptionalProperty $p 'CommandLine')
            if ($line -match 'parakeet') { $result.parakeet_mb += $mb }
            elseif ($line -match 'supertonic') { $result.supertonic_mb += $mb }
            else { $result.other_python_mb += $mb }
        }
        $result.system_free_mb = [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1KB)
    } catch {}
    return $result
}

function ConvertTo-ProcessArgument {
    param([string]$Value)
    if ($Value -eq '') { return '""' }
    if ($Value -notmatch '[\s"]') { return $Value }
    $escaped = $Value -replace '(\\*)"', '$1$1\"'
    $escaped = $escaped -replace '(\\+)$', '$1$1'
    return '"' + $escaped + '"'
}

function Invoke-Captured {
    # Runs a program with stdout and stderr captured separately (the voice client contract depends on that split).
    param([string]$FilePath, [string[]]$Arguments, [hashtable]$Environment = @{})
    $out = [IO.Path]::GetTempFileName()
    $err = [IO.Path]::GetTempFileName()
    $saved = @{}
    foreach ($key in $Environment.Keys) {
        $saved[$key] = [Environment]::GetEnvironmentVariable($key)
        [Environment]::SetEnvironmentVariable($key, $Environment[$key])
    }
    try {
        $timer = [Diagnostics.Stopwatch]::StartNew()
        $line = ($Arguments | ForEach-Object { ConvertTo-ProcessArgument $_ }) -join ' '
        $p = Start-Process -FilePath $FilePath -ArgumentList $line -RedirectStandardOutput $out -RedirectStandardError $err -NoNewWindow -PassThru
        $null = $p.Handle
        $p.WaitForExit()
        return [pscustomobject]@{
            ExitCode = $p.ExitCode
            Stdout = ([IO.File]::ReadAllText($out)).Trim()
            Stderr = ([IO.File]::ReadAllText($err)).Trim()
            Ms = $timer.ElapsedMilliseconds
        }
    } finally {
        foreach ($key in $saved.Keys) { [Environment]::SetEnvironmentVariable($key, $saved[$key]) }
        Remove-Item $out, $err -Force -ErrorAction SilentlyContinue
    }
}

function Find-GitBash {
    if ($env:CLAUDE_CODE_GIT_BASH_PATH -and (Test-Path $env:CLAUDE_CODE_GIT_BASH_PATH)) { return $env:CLAUDE_CODE_GIT_BASH_PATH }
    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        $candidate = Join-Path (Split-Path (Split-Path $git.Source -Parent) -Parent) 'bin\bash.exe'
        if (Test-Path $candidate) { return $candidate }
    }
    foreach ($candidate in 'C:\Program Files\Git\bin\bash.exe', (Join-Path $LocalAppData 'Programs\Git\bin\bash.exe')) {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Invoke-VoiceTurn {
    # Same path Claude Code takes: Git Bash -> talk-win.sh -> Invoke-Talk.ps1. Falls back to the client directly.
    param([string]$Verb, [string]$Text = '')
    $bash = Find-GitBash
    if ($bash) {
        $script = if ($Text) { "$BridgeCommand $Verb '" + $Text.Replace("'", "'\''") + "'" } else { "$BridgeCommand $Verb" }
        return Invoke-Captured $bash @('-c', $script)
    }
    $clientArgs = @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', $Client, $Verb)
    if ($Text) { $clientArgs += $Text }
    return Invoke-Captured 'powershell.exe' $clientArgs
}

Write-Host ''
Write-Host "LifeOS local voice layer - verification$(if ($Interactive) { ' (interactive)' })" -ForegroundColor Cyan

# --- Installed files ------------------------------------------------------------------
$files = [ordered]@{
    'Upstream talk.ps1' = (Join-Path $RuntimeDir 'talk.ps1')
    'Silero VAD recorder' = (Join-Path $RuntimeDir 'vad_recorder.py')
    'Voice Python environment' = (Join-Path $ConfigDir 'tts-venv\Scripts\python.exe')
    'LifeOS voice client' = $Client
    'Git Bash bridge' = $Bridge
}
foreach ($label in $files.Keys) {
    $exists = Test-Path $files[$label]
    Add-Check $label $(if ($exists) { 'PASS' } else { 'FAIL' }) $files[$label]
}
if (Test-Path $Bridge) {
    $hasCr = [IO.File]::ReadAllText($Bridge).Contains("`r")
    Add-Check 'Bridge line endings' $(if ($hasCr) { 'FAIL' } else { 'PASS' }) $(if ($hasCr) { 'CRLF found; rerun Install-VoiceMode.ps1 -SkillsOnly' } else { 'LF' })
}

$skillDirs = [ordered]@{
    claudecode = Join-Path $UserHome '.claude\skills\talk\SKILL.md'
    codex = Join-Path $UserHome '.codex\skills\talk\SKILL.md'
    opencode = Join-Path $RuntimeDir 'SKILL.md'
    hermes = Join-Path $UserHome '.hermes\skills\talk\SKILL.md'
}
$metrics.agent_skills = [ordered]@{}
foreach ($agent in $skillDirs.Keys) {
    $path = $skillDirs[$agent]
    $state = if (-not (Test-Path $path)) { 'absent' } elseif (Select-String -Path $path -SimpleMatch 'lifeos-voice-skill' -Quiet) { 'windows-skill' } else { 'upstream-skill' }
    $metrics.agent_skills[$agent] = $state
    if ($agent -eq 'claudecode') {
        Add-Check 'Claude Code talk skill' $(switch ($state) { 'windows-skill' { 'PASS' } 'absent' { 'FAIL' } default { 'FAIL' } }) "$path ($state)"
    } elseif ($state -eq 'upstream-skill') {
        Add-Check "$agent talk skill" 'WARN' "$path is the upstream macOS-oriented skill; rerun Install-VoiceMode.ps1 -SkillsOnly -Agents `"$agent`""
    } elseif ($state -eq 'windows-skill') {
        Add-Check "$agent talk skill" 'PASS' $path
    }
}

$settingsPath = Join-Path $UserHome '.claude\settings.json'
try {
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    $permissions = Get-OptionalProperty $settings 'permissions'
    $allow = @(Get-OptionalProperty $permissions 'allow')
    Add-Check 'Claude Code permission rule' $(if ($allow -contains $PermissionRule) { 'PASS' } else { 'WARN' }) $(if ($allow -contains $PermissionRule) { $PermissionRule } else { "missing; every voice turn will ask for approval. Add $PermissionRule" })
} catch {
    Add-Check 'Claude Code permission rule' 'WARN' "could not read $settingsPath"
}

# --- Services -------------------------------------------------------------------------
$metrics.services = [ordered]@{}
foreach ($name in $Services.Keys) {
    $svc = $Services[$name]
    $task = $null
    try { $task = Get-ScheduledTask -TaskName $svc.Task -ErrorAction Stop } catch {}
    if (-not $task) {
        Add-Check "$name task" 'FAIL' "$($svc.Task) is not registered; run Install-VoiceMode.ps1"
        continue
    }
    if ("$($task.State)" -ne 'Running') {
        Start-ScheduledTask -TaskName $svc.Task
        Add-Check "$name task" 'INFO' "$($svc.Task) was $($task.State); started it"
    } else {
        Add-Check "$name task" 'PASS' "$($svc.Task) running"
    }
}

foreach ($name in $Services.Keys) {
    $svc = $Services[$name]
    $timer = [Diagnostics.Stopwatch]::StartNew()
    $healthy = $false
    $last = ''
    do {
        try {
            $body = (Invoke-WebRequest -Uri $svc.Health -UseBasicParsing -TimeoutSec 5).Content | ConvertFrom-Json
            $healthy = [bool](Get-OptionalProperty $body $svc.ReadyField)
            $last = "$($svc.ReadyField)=$healthy"
        } catch {
            $last = $_.Exception.Message
        }
        if (-not $healthy) { Start-Sleep -Seconds 2 }
    } while (-not $healthy -and $timer.Elapsed.TotalSeconds -lt $HealthTimeoutSeconds)
    $metrics.services[$name] = [ordered]@{ healthy = $healthy; seconds_to_healthy = [math]::Round($timer.Elapsed.TotalSeconds, 1) }
    Add-Check "$name health" $(if ($healthy) { 'PASS' } else { 'FAIL' }) $(if ($healthy) { "$($svc.Health) ready after $([math]::Round($timer.Elapsed.TotalSeconds, 1)) s" } else { "$($svc.Health) not ready after $HealthTimeoutSeconds s ($last). Log: $ConfigDir\$(if ($name -like 'Parakeet*') { 'parakeet-stt.log' } else { 'supertonic.log' })" })

    try {
        $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $svc.Port -ErrorAction Stop)
        $addresses = @($listeners | ForEach-Object { "$($_.LocalAddress)" } | Select-Object -Unique)
        $public = @($addresses | Where-Object { $_ -notin '127.0.0.1', '::1' })
        Add-Check "$name localhost only" $(if ($public.Count -eq 0) { 'PASS' } else { 'FAIL' }) "port $($svc.Port) bound to $($addresses -join ', ')"
    } catch {
        Add-Check "$name localhost only" 'WARN' "could not read listeners on port $($svc.Port)"
    }
}

# --- Privacy ----------------------------------------------------------------------------
foreach ($scope in 'User', 'Machine') {
    if ([Environment]::GetEnvironmentVariable('XAI_API_KEY', $scope)) {
        Add-Check "xAI key ($scope)" 'WARN' 'XAI_API_KEY is set. The LifeOS client ignores it, but upstream talk.ps1 used on its own would send reply text to xAI if Supertonic fails.'
    }
    if ([Environment]::GetEnvironmentVariable('VOICE_ALLOW_CLOUD', $scope) -eq '1') {
        Add-Check "Cloud opt-in ($scope)" 'WARN' 'VOICE_ALLOW_CLOUD=1 lets cloud voices and remote services be used.'
    }
    foreach ($name in 'STT_URL', 'SUPERTONIC_URL', 'INDEXTTS_URL') {
        $value = [Environment]::GetEnvironmentVariable($name, $scope)
        if ($value) {
            $local = try { ([Uri]$value).IsLoopback } catch { $false }
            Add-Check "$name ($scope)" $(if ($local) { 'PASS' } else { 'FAIL' }) "$value$(if (-not $local) { ' is not local; the client will refuse to run' })"
        }
    }
}
if (Test-Path $Client) {
    $refusal = Invoke-Captured 'powershell.exe' @('-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', $Client, 'listen') @{ STT_URL = 'https://stt.invalid/v1/audio/transcriptions'; VOICE_ALLOW_CLOUD = '0' }
    $ok = $refusal.ExitCode -eq 3 -and -not $refusal.Stdout
    Add-Check 'Client refuses non-local services' $(if ($ok) { 'PASS' } else { 'FAIL' }) "exit $($refusal.ExitCode): $($refusal.Stderr)"
}

# --- Silent pipeline: Supertonic -> WAV -> Parakeet ------------------------------------
$metrics.memory_before = Get-VoiceMemory
$work = Join-Path ([IO.Path]::GetTempPath()) ('lifeos-voice-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $work | Out-Null
try {
    $wav = Join-Path $work 'tts.wav'
    $body = @{ input = $TestSentence; voice = 'F1'; model = 'supertonic'; response_format = 'wav'; stream = $false } | ConvertTo-Json -Compress
    $timer = [Diagnostics.Stopwatch]::StartNew()
    Invoke-WebRequest -Uri 'http://127.0.0.1:8766/v1/audio/speech' -Method Post -ContentType 'application/json' -Body $body -OutFile $wav -UseBasicParsing -TimeoutSec 120
    $ttsMs = $timer.ElapsedMilliseconds
    $bytes = [IO.File]::ReadAllBytes($wav)
    $isWav = $bytes.Length -gt 1000 -and [Text.Encoding]::ASCII.GetString($bytes, 0, 4) -eq 'RIFF'
    Add-Check 'Supertonic synthesis' $(if ($isWav) { 'PASS' } else { 'FAIL' }) "$($bytes.Length) bytes in $ttsMs ms"

    $curl = (Get-Command curl.exe -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
    $sttJson = Join-Path $work 'stt.json'
    $timer = [Diagnostics.Stopwatch]::StartNew()
    $code = Invoke-Captured $curl @('-sS', '-m', '120', '-o', $sttJson, '-w', '%{http_code}', '-F', "file=@$wav", '-F', 'model=parakeet-tdt-0.6b-v3', 'http://127.0.0.1:5093/v1/audio/transcriptions')
    $sttMs = $timer.ElapsedMilliseconds
    $heard = if (Test-Path $sttJson) { "$(([IO.File]::ReadAllText($sttJson) | ConvertFrom-Json).text)" } else { '' }
    $recall = Get-WordRecall $TestSentence $heard
    Add-Check 'Parakeet transcription' $(if ($recall -ge 0.7) { 'PASS' } else { 'FAIL' }) "HTTP $($code.Stdout) in $sttMs ms; heard '$heard' (word recall $recall)"
    $metrics.silent_pipeline = [ordered]@{ tts_ms = $ttsMs; stt_ms = $sttMs; word_recall = $recall }
} catch {
    Add-Check 'Silent pipeline' 'FAIL' $_.Exception.Message
} finally {
    Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
}
$metrics.memory_after_pipeline = Get-VoiceMemory
$m = $metrics.memory_after_pipeline
Add-Check 'Voice service memory' 'INFO' "Parakeet $($m.parakeet_mb) MB, Supertonic $($m.supertonic_mb) MB, system free $($m.system_free_mb) MB"

# --- Bridge used by Claude Code ------------------------------------------------------------
$bash = Find-GitBash
if ($bash -and (Test-Path $Bridge)) {
    $status = Invoke-Captured $bash @('-c', "$BridgeCommand status")
    $running = ([regex]::Matches($status.Stdout, 'RUNNING')).Count
    Add-Check 'Git Bash bridge (talk-win.sh status)' $(if ($status.ExitCode -eq 0 -and $running -ge 2) { 'PASS' } else { 'FAIL' }) "exit $($status.ExitCode), $running/2 services RUNNING in $($status.Ms) ms"
} else {
    Add-Check 'Git Bash bridge' 'WARN' 'Git Bash not found; Claude Code will need its PowerShell tool path from SKILL.md'
}

# --- Interactive hardware turns ------------------------------------------------------------
if ($Interactive) {
    Write-Host ''
    Write-Host 'Interactive check: listen to the prompts and answer out loud. Use headphones if your speakers echo into the microphone.' -ForegroundColor Cyan
    $sampler = Start-Job -ScriptBlock {
        for ($i = 0; $i -lt 900; $i++) {
            $python = 0
            foreach ($p in @(Get-CimInstance Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe'")) { $python += $p.WorkingSetSize }
            $free = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory * 1KB
            [pscustomobject]@{ python_mb = [math]::Round($python / 1MB); free_mb = [math]::Round($free / 1MB) }
            Start-Sleep -Seconds 1
        }
    }
    try {
        $notify = Invoke-VoiceTurn 'notify' 'Voice check, part one. If you can hear this sentence, the speaker path works.'
        Add-Check 'Speaker (notify)' $(if ($notify.ExitCode -eq 0) { 'PASS' } else { 'FAIL' }) "exit $($notify.ExitCode) in $($notify.Ms) ms $($notify.Stderr)"

        $turn1 = Invoke-VoiceTurn 'speak' 'Part two. After the beep, please say: the voice loop is working.'
        $recall = Get-WordRecall 'voice loop working' $turn1.Stdout
        Add-Check 'Speak then listen' $(if ($turn1.ExitCode -eq 0 -and $recall -ge 0.66) { 'PASS' } else { 'FAIL' }) "heard '$($turn1.Stdout)' (recall $recall) in $($turn1.Ms) ms $($turn1.Stderr)"

        $turn2 = Invoke-VoiceTurn 'speak' 'Part three. The microphone should reopen by itself. Say anything to confirm, or say stop talk to test the stop phrase.'
        $ended = $turn2.Stderr -match 'SESSION ENDED'
        Add-Check 'Microphone reopens after reply' $(if ($turn2.ExitCode -eq 0 -and ($turn2.Stdout -or $ended)) { 'PASS' } else { 'FAIL' }) $(if ($ended) { 'stop phrase ended the session' } else { "heard '$($turn2.Stdout)' $($turn2.Stderr)" })

        $null = Invoke-VoiceTurn 'notify' 'Voice check complete.'
        $metrics.interactive = [ordered]@{ notify_ms = $notify.Ms; turn1_ms = $turn1.Ms; turn2_ms = $turn2.Ms }
    } finally {
        Stop-Job $sampler -ErrorAction SilentlyContinue
        $samples = @(Receive-Job $sampler -ErrorAction SilentlyContinue)
        Remove-Job $sampler -Force -ErrorAction SilentlyContinue
        if ($samples.Count -gt 0) {
            $metrics.memory_during_conversation = [ordered]@{
                peak_python_mb = ($samples | Measure-Object -Property python_mb -Maximum).Maximum
                lowest_free_mb = ($samples | Measure-Object -Property free_mb -Minimum).Minimum
                samples = $samples.Count
            }
            Add-Check 'Peak memory during conversation' 'INFO' "all Python processes $($metrics.memory_during_conversation.peak_python_mb) MB; lowest free RAM $($metrics.memory_during_conversation.lowest_free_mb) MB"
        }
    }
} else {
    Add-Check 'Speaker and microphone turns' 'SKIP' 'run again with -Interactive'
}

# --- Evidence -------------------------------------------------------------------------------
$failed = @($checks | Where-Object { $_.Status -eq 'FAIL' })
$verdict = if ($failed.Count -gt 0) { 'FAILED' } elseif ($Interactive) { 'PASSED' } else { 'PASSED_NON_INTERACTIVE' }
$evidence = [ordered]@{
    kind = 'lifeos-voice-verify'
    generated_at = [DateTime]::UtcNow.ToString('o')
    interactive = [bool]$Interactive
    verdict = $verdict
    metrics = $metrics
    checks = $checks.ToArray()
}
try {
    if (-not (Test-Path $EvidenceDirectory)) { New-Item -ItemType Directory -Force -Path $EvidenceDirectory | Out-Null }
    $path = Join-Path $EvidenceDirectory ('verify-{0}.json' -f [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ'))
    $evidence | ConvertTo-Json -Depth 8 | Set-Content -Path $path -Encoding UTF8
    Write-Host "Evidence: $path"
} catch {
    Write-Host "Could not write evidence: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host "Verification: $verdict" -ForegroundColor $(if ($failed.Count -gt 0) { 'Red' } else { 'Green' })
if ($failed.Count -gt 0) { exit 1 }
exit 0

#Requires -Version 5.1
<#
.SYNOPSIS
    Read-only Phase 1 inspection for the LifeOS local voice layer.
.DESCRIPTION
    Inspects this Windows computer before Local VoiceMode LLM is installed and
    reports what is already present, what is missing, and what blocks a
    two-way voice loop with Claude Code.

    This script changes nothing. It installs nothing, edits no settings,
    starts no services, and does not open the microphone.

    The JSON report is written outside the repository by default because it
    contains machine-specific device names and hardware details.
.PARAMETER InstallRoot
    Permanent tools directory the installer will clone into. Used for the
    disk-space check and the "bad location" check.
.PARAMETER EvidenceDirectory
    Where the JSON report is written.
.PARAMETER PassThru
    Return the report object to the caller (used by Install-VoiceMode.ps1).
.PARAMETER Quiet
    Do not print the human-readable report.
.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\integrations\local-voicemode\Test-VoicePrereqs.ps1
#>
[CmdletBinding()]
param(
    [string]$InstallRoot = '',
    [string]$EvidenceDirectory = '',
    [switch]$PassThru,
    [switch]$Quiet
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$UserHome = if ($env:USERPROFILE) { $env:USERPROFILE } else { [Environment]::GetFolderPath('UserProfile') }
$LocalAppData = if ($env:LOCALAPPDATA) { $env:LOCALAPPDATA } else { [Environment]::GetFolderPath('LocalApplicationData') }
if (-not $InstallRoot) { $InstallRoot = Join-Path $UserHome 'dev\tools' }
if (-not $EvidenceDirectory) { $EvidenceDirectory = Join-Path $LocalAppData 'LifeOS\voice\evidence' }

# Ports documented by Local VoiceMode LLM (README "Stage / Port" table and docs/windows.md).
# String keys: an [ordered] dictionary treats an integer index as a position, not a key.
$VoicePorts = [ordered]@{
    '5093' = 'Parakeet STT (required)'
    '8766' = 'Supertonic TTS (required)'
    '7862' = 'VoiceMode dashboard (Docker/Linux only; not started by the native Windows installer)'
    '7863' = 'IndexTTS CUDA (optional; not used by the CPU default)'
}

# Estimates for the CPU-only default stack. Test-VoiceLoop.ps1 measures the real values.
$MinFreeDiskGB = 6
$RecommendedFreeDiskGB = 10
$MinRamGB = 8

$checks = New-Object System.Collections.Generic.List[object]
$facts = [ordered]@{}

function Add-Check {
    param(
        [string]$Area,
        [string]$Name,
        [ValidateSet('OK', 'MISSING', 'WARN', 'BLOCKER', 'INFO')][string]$Status,
        [string]$Detail,
        [string]$Fix = ''
    )
    $checks.Add([pscustomobject]@{ Area = $Area; Name = $Name; Status = $Status; Detail = $Detail; Fix = $Fix })
}

function Get-OptionalProperty {
    param($Object, [string]$Name)
    if ($null -eq $Object) { return $null }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property) { return $null }
    return $property.Value
}

function Invoke-Quiet {
    # Runs a native command and returns its first output line, or $null when it is missing or fails.
    param([string]$FilePath, [string[]]$Arguments)
    try {
        $output = & $FilePath @Arguments 2>$null
        if ($LASTEXITCODE -ne 0) { return $null }
        $line = @($output | Where-Object { $_ -and "$_".Trim() }) | Select-Object -First 1
        if ($null -eq $line) { return $null }
        return "$line".Trim()
    } catch {
        return $null
    }
}

function Test-IsVoiceModeProcess {
    param([int]$ProcessId)
    try {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction Stop
        $commandLine = [string](Get-OptionalProperty $process 'CommandLine')
        return ($commandLine -match 'parakeet|supertonic|opencode')
    } catch {
        return $false
    }
}

function Get-PythonCandidates {
    # PEP 514 registry entries are the most reliable way to find real interpreters without running anything.
    $found = New-Object System.Collections.Generic.List[object]
    foreach ($hive in 'HKCU:', 'HKLM:', 'HKLM:\SOFTWARE\WOW6432Node') {
        $base = if ($hive -like 'HKLM:\SOFTWARE*') { "$hive\Python\PythonCore" } else { "$hive\SOFTWARE\Python\PythonCore" }
        if (-not (Test-Path $base)) { continue }
        foreach ($versionKey in Get-ChildItem $base -ErrorAction SilentlyContinue) {
            $installPath = Join-Path $versionKey.PSPath 'InstallPath'
            $props = Get-ItemProperty $installPath -ErrorAction SilentlyContinue
            $exe = Get-OptionalProperty $props 'ExecutablePath'
            if (-not $exe) {
                $dir = Get-OptionalProperty $props '(default)'
                if ($dir) { $exe = Join-Path $dir 'python.exe' }
            }
            if ($exe -and (Test-Path $exe)) {
                $found.Add([pscustomobject]@{ Tag = $versionKey.PSChildName; Path = $exe })
            }
        }
    }
    return $found
}

# --- 1-4. Windows, CPU, RAM, disk ------------------------------------------------
try {
    $os = Get-CimInstance Win32_OperatingSystem
    $facts.windows = [ordered]@{
        caption = $os.Caption
        version = $os.Version
        build = $os.BuildNumber
        architecture = $os.OSArchitecture
    }
    $build = [int]$os.BuildNumber
    $status = if ($os.OSArchitecture -notmatch '64') { 'BLOCKER' } elseif ($build -lt 17763) { 'WARN' } else { 'OK' }
    Add-Check 'System' 'Windows version' $status "$($os.Caption) $($os.Version) (build $build, $($os.OSArchitecture))" `
        $(if ($status -eq 'BLOCKER') { 'A 64-bit Windows is required for the x64 ONNX Runtime and PyTorch wheels.' } elseif ($status -eq 'WARN') { 'Windows 10 1809 or newer is recommended.' } else { '' })

    $totalRamGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 1)
    $freeRamGB = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
    $facts.memory = [ordered]@{ total_gb = $totalRamGB; free_gb = $freeRamGB }
    $status = if ($totalRamGB -lt $MinRamGB) { 'WARN' } else { 'OK' }
    Add-Check 'System' 'RAM' $status "$totalRamGB GB total, $freeRamGB GB free now" `
        $(if ($status -eq 'WARN') { "Below $MinRamGB GB. Expect roughly 2-3 GB for Parakeet + Supertonic + VAD (estimate); close other heavy apps while talking." } else { '' })
} catch {
    Add-Check 'System' 'Windows version / RAM' 'WARN' "Could not query Win32_OperatingSystem: $($_.Exception.Message)"
}

try {
    $cpus = @(Get-CimInstance Win32_Processor)
    $cpu = $cpus[0]
    $cores = ($cpus | Measure-Object -Property NumberOfCores -Sum).Sum
    $threads = ($cpus | Measure-Object -Property NumberOfLogicalProcessors -Sum).Sum
    $facts.cpu = [ordered]@{ name = $cpu.Name.Trim(); cores = $cores; logical_processors = $threads }
    $status = if ($cores -lt 4) { 'WARN' } else { 'OK' }
    Add-Check 'System' 'CPU' $status "$($cpu.Name.Trim()) - $cores cores / $threads threads" `
        $(if ($status -eq 'WARN') { 'Fewer than 4 cores: CPU speech recognition and synthesis will work but replies will start more slowly.' } else { '' })
} catch {
    Add-Check 'System' 'CPU' 'WARN' "Could not query Win32_Processor: $($_.Exception.Message)"
}

try {
    $gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name })
    $facts.gpus = $gpus
    Add-Check 'System' 'GPU' 'INFO' (($gpus -join '; ') + ' - not used: the default voice stack is CPU-only.')
} catch {}

$diskTargets = [ordered]@{ 'Install root' = $InstallRoot; 'Models and venvs (~\.config\opencode)' = $UserHome }
$facts.disk = [ordered]@{}
foreach ($label in $diskTargets.Keys) {
    try {
        $qualifier = Split-Path -Qualifier $diskTargets[$label]
        $drive = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID = '$qualifier'"
        $freeGB = [math]::Round($drive.FreeSpace / 1GB, 1)
        $facts.disk[$label] = [ordered]@{ drive = $qualifier; free_gb = $freeGB }
        $status = if ($freeGB -lt $MinFreeDiskGB) { 'BLOCKER' } elseif ($freeGB -lt $RecommendedFreeDiskGB) { 'WARN' } else { 'OK' }
        Add-Check 'System' "Disk space: $label" $status "$freeGB GB free on $qualifier" `
            $(if ($status -ne 'OK') { "Need about $MinFreeDiskGB GB (estimate: PyTorch CPU, ONNX Runtime, Parakeet and Supertonic models); $RecommendedFreeDiskGB GB recommended." } else { '' })
    } catch {
        Add-Check 'System' "Disk space: $label" 'WARN' "Could not read free space for $($diskTargets[$label]): $($_.Exception.Message)"
    }
}

$badLocations = @('Desktop', 'Downloads', 'Temp', 'OneDrive')
$hit = $badLocations | Where-Object { $InstallRoot -match [regex]::Escape($_) }
if ($hit) {
    Add-Check 'System' 'Install location' 'WARN' "$InstallRoot is under $($hit -join ', ')" 'Use a permanent tools directory such as %USERPROFILE%\dev\tools.'
} else {
    Add-Check 'System' 'Install location' 'OK' $InstallRoot
}

# --- 5-6. Audio devices and microphone privacy ------------------------------------
$capture = @()
$render = @()
try {
    # MMDevice endpoint IDs encode direction: {0.0.0.00000000} = render (output), {0.0.1.00000000} = capture (input).
    $endpoints = @(Get-PnpDevice -Class AudioEndpoint -ErrorAction Stop)
    $capture = @($endpoints | Where-Object { $_.InstanceId -match '\{0\.0\.1\.00000000\}' })
    $render = @($endpoints | Where-Object { $_.InstanceId -match '\{0\.0\.0\.00000000\}' })
    $facts.microphones = @($capture | ForEach-Object { [ordered]@{ name = $_.FriendlyName; status = "$($_.Status)" } })
    $facts.speakers = @($render | ForEach-Object { [ordered]@{ name = $_.FriendlyName; status = "$($_.Status)" } })

    $activeMics = @($capture | Where-Object { "$($_.Status)" -eq 'OK' })
    $activeOut = @($render | Where-Object { "$($_.Status)" -eq 'OK' })
    if ($activeMics.Count -gt 0) {
        Add-Check 'Audio' 'Microphones' 'OK' (($activeMics | ForEach-Object { $_.FriendlyName }) -join '; ') `
            'The Windows default input is used unless MIC_QUERY names a device. A headset avoids speaker echo.'
    } else {
        Add-Check 'Audio' 'Microphones' 'BLOCKER' 'No active microphone endpoint found.' 'Connect or enable a microphone in Settings > System > Sound > Input.'
    }
    if ($activeOut.Count -gt 0) {
        Add-Check 'Audio' 'Speakers / headphones' 'OK' (($activeOut | ForEach-Object { $_.FriendlyName }) -join '; ')
    } else {
        Add-Check 'Audio' 'Speakers / headphones' 'BLOCKER' 'No active output endpoint found.' 'Connect or enable speakers or headphones in Settings > System > Sound > Output.'
    }
} catch {
    Add-Check 'Audio' 'Audio endpoints' 'WARN' "Could not enumerate audio endpoints: $($_.Exception.Message)" 'Check Settings > System > Sound manually.'
}

$consentRoot = 'Software\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone'
$consent = [ordered]@{
    'Device-wide microphone access' = "HKLM:\$consentRoot"
    'Microphone access for this user' = "HKCU:\$consentRoot"
    'Let desktop apps access your microphone' = "HKCU:\$consentRoot\NonPackaged"
}
$facts.microphone_privacy = [ordered]@{}
foreach ($label in $consent.Keys) {
    $value = Get-OptionalProperty (Get-ItemProperty $consent[$label] -ErrorAction SilentlyContinue) 'Value'
    $facts.microphone_privacy[$label] = if ($value) { $value } else { 'not set (Windows default: Allow)' }
    if ($value -eq 'Deny') {
        Add-Check 'Audio' $label 'BLOCKER' 'Denied' 'Settings > Privacy & security > Microphone: turn on Microphone access and Let desktop apps access your microphone.'
    } else {
        Add-Check 'Audio' $label 'OK' $(if ($value) { $value } else { 'not set (allowed)' })
    }
}

# --- 7-10. Git, Python 3.12, VC++ runtime, FFmpeg ---------------------------------
$winget = Get-Command winget -ErrorAction SilentlyContinue
$facts.winget = if ($winget) { Invoke-Quiet $winget.Source @('--version') } else { $null }
Add-Check 'Dependencies' 'winget' $(if ($winget) { 'OK' } else { 'WARN' }) $(if ($winget) { $facts.winget } else { 'not found' }) `
    $(if (-not $winget) { 'Install "App Installer" from the Microsoft Store, or install the missing prerequisites by hand.' } else { '' })

$git = Get-Command git -ErrorAction SilentlyContinue
$facts.git = if ($git) { [ordered]@{ path = $git.Source; version = (Invoke-Quiet $git.Source @('--version')) } } else { $null }
if ($git) {
    Add-Check 'Dependencies' 'Git' 'OK' "$($facts.git.version) at $($git.Source)"
} else {
    Add-Check 'Dependencies' 'Git' 'MISSING' 'git not on PATH' 'winget install --id Git.Git -e'
}

$pythons = @(Get-PythonCandidates)
$py312 = @($pythons | Where-Object { $_.Tag -match '^3\.12' }) | Select-Object -First 1
$pathPython = Get-Command python -ErrorAction SilentlyContinue
$pathPythonIsStub = $pathPython -and ($pathPython.Source -match '\\WindowsApps\\')
$facts.python = [ordered]@{
    registered = @($pythons | ForEach-Object { [ordered]@{ tag = $_.Tag; path = $_.Path } })
    python_3_12 = if ($py312) { $py312.Path } else { $null }
    python_on_path = if ($pathPython) { $pathPython.Source } else { $null }
    python_on_path_version = if ($pathPython -and -not $pathPythonIsStub) { Invoke-Quiet $pathPython.Source @('--version') } else { $null }
}
if ($py312) {
    Add-Check 'Dependencies' 'Python 3.12' 'OK' $py312.Path
} else {
    $others = ($pythons | ForEach-Object { $_.Tag }) -join ', '
    Add-Check 'Dependencies' 'Python 3.12' 'MISSING' $(if ($others) { "Not found (other versions: $others)" } else { 'Not found' }) 'winget install --id Python.Python.3.12 -e'
}
if ($pathPythonIsStub) {
    Add-Check 'Dependencies' 'python on PATH' 'WARN' "$($pathPython.Source) is the Microsoft Store alias, not a real interpreter." `
        'Install-VoiceMode.ps1 puts Python 3.12 first on PATH for the upstream installer, so this is handled automatically.'
} elseif ($pathPython -and $py312 -and ($pathPython.Source -ne $py312.Path)) {
    Add-Check 'Dependencies' 'python on PATH' 'INFO' "$($facts.python.python_on_path_version) at $($pathPython.Source)" `
        'Install-VoiceMode.ps1 puts Python 3.12 first on PATH for the upstream installer only; your global PATH is unchanged.'
}

$vcKeys = 'HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\VisualStudio\14.0\VC\Runtimes\x64'
$vc = $vcKeys | ForEach-Object { Get-ItemProperty $_ -ErrorAction SilentlyContinue } | Where-Object { (Get-OptionalProperty $_ 'Installed') -eq 1 } | Select-Object -First 1
$facts.vc_runtime_x64 = if ($vc) { Get-OptionalProperty $vc 'Version' } else { $null }
if ($vc) {
    Add-Check 'Dependencies' 'Microsoft VC++ 2015+ x64 runtime' 'OK' (Get-OptionalProperty $vc 'Version')
} else {
    Add-Check 'Dependencies' 'Microsoft VC++ 2015+ x64 runtime' 'MISSING' 'Not installed (ONNX Runtime needs it)' 'winget install --id Microsoft.VCRedist.2015+.x64 -e (asks for administrator approval)'
}

$ffplay = Get-Command ffplay -ErrorAction SilentlyContinue
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
$facts.ffmpeg = [ordered]@{ ffmpeg = if ($ffmpeg) { $ffmpeg.Source } else { $null }; ffplay = if ($ffplay) { $ffplay.Source } else { $null } }
if ($ffplay) {
    Add-Check 'Dependencies' 'FFmpeg (ffplay)' 'OK' $ffplay.Source
} else {
    Add-Check 'Dependencies' 'FFmpeg (ffplay)' 'MISSING' 'ffplay not on PATH (playback falls back to the built-in WAV player)' 'winget install --id Gyan.FFmpeg -e'
}

# --- 11. PowerShell execution policy ----------------------------------------------
try {
    $policies = Get-ExecutionPolicy -List
    $facts.execution_policy = [ordered]@{}
    foreach ($entry in $policies) { $facts.execution_policy["$($entry.Scope)"] = "$($entry.ExecutionPolicy)" }
    $gpo = @($policies | Where-Object { "$($_.Scope)" -in 'MachinePolicy', 'UserPolicy' -and "$($_.ExecutionPolicy)" -notin 'Undefined', 'Bypass', 'Unrestricted' })
    if ($gpo.Count -gt 0) {
        Add-Check 'PowerShell' 'Execution policy' 'BLOCKER' (($gpo | ForEach-Object { "$($_.Scope)=$($_.ExecutionPolicy)" }) -join ', ') `
            'Group Policy overrides -ExecutionPolicy Bypass. Ask your administrator to allow local scripts.'
    } else {
        Add-Check 'PowerShell' 'Execution policy' 'OK' "Effective: $(Get-ExecutionPolicy). All voice scripts run with -ExecutionPolicy Bypass for their own process only."
    }
} catch {
    Add-Check 'PowerShell' 'Execution policy' 'WARN' "Could not read execution policy: $($_.Exception.Message)"
}
$facts.powershell = "$($PSVersionTable.PSVersion)"

# --- 12-13. Claude Code and its configuration locations ---------------------------
$claude = Get-Command claude -ErrorAction SilentlyContinue
$claudeVersion = if ($claude) { Invoke-Quiet $claude.Source @('--version') } else { $null }
$facts.claude_code = [ordered]@{ path = if ($claude) { $claude.Source } else { $null }; version = $claudeVersion }
if ($claude -and $claudeVersion) {
    Add-Check 'Claude Code' 'Claude Code CLI' 'OK' "$claudeVersion at $($claude.Source)"
} elseif ($claude) {
    Add-Check 'Claude Code' 'Claude Code CLI' 'WARN' "Found at $($claude.Source) but 'claude --version' failed" 'Run claude once in a terminal and finish sign-in.'
} else {
    Add-Check 'Claude Code' 'Claude Code CLI' 'BLOCKER' 'claude not on PATH' 'Install Claude Code for Windows (see code.claude.com/docs), then open a new terminal.'
}

$gitBash = $null
if ($env:CLAUDE_CODE_GIT_BASH_PATH -and (Test-Path $env:CLAUDE_CODE_GIT_BASH_PATH)) {
    $gitBash = $env:CLAUDE_CODE_GIT_BASH_PATH
} elseif ($git) {
    $gitRoot = Split-Path (Split-Path $git.Source -Parent) -Parent
    $candidate = Join-Path $gitRoot 'bin\bash.exe'
    if (Test-Path $candidate) { $gitBash = $candidate }
}
$facts.git_bash = $gitBash
if ($gitBash) {
    Add-Check 'Claude Code' 'Git Bash (Claude Code shell on Windows)' 'OK' $gitBash
} elseif (-not $git) {
    Add-Check 'Claude Code' 'Git Bash (Claude Code shell on Windows)' 'MISSING' 'bash.exe not found' 'Installed together with Git for Windows.'
} else {
    Add-Check 'Claude Code' 'Git Bash (Claude Code shell on Windows)' 'WARN' "bash.exe not found next to $($git.Source)" 'Set CLAUDE_CODE_GIT_BASH_PATH to bash.exe, or use the PowerShell command in the talk skill.'
}

$claudeDir = Join-Path $UserHome '.claude'
$userSettings = Join-Path $claudeDir 'settings.json'
$locations = [ordered]@{
    'User config directory' = $claudeDir
    'User settings' = $userSettings
    'User skills directory' = (Join-Path $claudeDir 'skills')
    'Global state file' = (Join-Path $UserHome '.claude.json')
    'Managed settings (Program Files)' = 'C:\Program Files\ClaudeCode\managed-settings.json'
    'Managed settings (ProgramData, legacy)' = 'C:\ProgramData\ClaudeCode\managed-settings.json'
}
$facts.claude_config = [ordered]@{}
foreach ($label in $locations.Keys) {
    $exists = Test-Path $locations[$label]
    $facts.claude_config[$label] = [ordered]@{ path = $locations[$label]; exists = $exists }
}
Add-Check 'Claude Code' 'Configuration locations' 'INFO' (($locations.Keys | ForEach-Object { "$_ = $($locations[$_]) [$(if ($facts.claude_config[$_].exists) { 'present' } else { 'absent' })]" }) -join '; ')

if (Test-Path $userSettings) {
    try {
        Get-Content $userSettings -Raw | ConvertFrom-Json | Out-Null
        Add-Check 'Claude Code' 'User settings.json' 'OK' 'Valid JSON (the installer backs it up before adding the voice permission rule)'
    } catch {
        Add-Check 'Claude Code' 'User settings.json' 'WARN' 'Not valid JSON' 'The installer will not edit it; add the permission rule by hand (see integrations/local-voicemode/README.md).'
    }
}
foreach ($m in 'C:\Program Files\ClaudeCode\managed-settings.json', 'C:\ProgramData\ClaudeCode\managed-settings.json') {
    if (Test-Path $m) {
        Add-Check 'Claude Code' 'Managed settings present' 'WARN' $m 'Managed settings can deny the Bash rule or skills the voice loop needs; review it if prompts keep appearing.'
    }
}

# --- Existing VoiceMode installation ---------------------------------------------
$voiceConfig = Join-Path $UserHome '.config\opencode'
$existing = [ordered]@{
    repo = Join-Path $InstallRoot 'Local-VoiceMode-LLM'
    talk_ps1 = Join-Path $voiceConfig 'skills\talk\talk.ps1'
    claude_skill = Join-Path $claudeDir 'skills\talk\SKILL.md'
}
$facts.existing_voicemode = [ordered]@{}
foreach ($k in $existing.Keys) { $facts.existing_voicemode[$k] = [ordered]@{ path = $existing[$k]; exists = (Test-Path $existing[$k]) } }
$tasks = @()
try { $tasks = @(Get-ScheduledTask -TaskName 'OpenCode-Parakeet-STT', 'OpenCode-Supertonic' -ErrorAction SilentlyContinue) } catch {}
$facts.existing_voicemode.tasks = @($tasks | ForEach-Object { [ordered]@{ name = $_.TaskName; state = "$($_.State)" } })
if ((Test-Path $existing.talk_ps1) -or $tasks.Count -gt 0) {
    Add-Check 'VoiceMode' 'Existing installation' 'INFO' "talk.ps1: $(Test-Path $existing.talk_ps1); tasks: $(($tasks | ForEach-Object { "$($_.TaskName)=$($_.State)" }) -join ', ')" `
        'The installer reuses it (repair mode keeps downloaded models).'
} else {
    Add-Check 'VoiceMode' 'Existing installation' 'INFO' 'None found'
}

# --- 14. Voice software that can compete for the microphone or hotkeys -------------
$knownVoiceApps = [ordered]@{
    'VoiceAccess' = 'Windows Voice Access (listens continuously and may act on what you say)'
    'sapisvr' = 'Windows Speech Recognition'
    'natspeak' = 'Dragon NaturallySpeaking'
    'dragonbar' = 'Dragon NaturallySpeaking'
    'talon' = 'Talon Voice'
    'VoiceAttack' = 'VoiceAttack'
    'Wispr Flow' = 'Wispr Flow dictation'
    'superwhisper' = 'superwhisper dictation'
    'NVIDIA Broadcast' = 'NVIDIA Broadcast (virtual microphone)'
    'krisp' = 'Krisp (virtual microphone)'
    'voicemeeter' = 'Voicemeeter (virtual audio routing)'
    'voicemeeterpro' = 'Voicemeeter Banana (virtual audio routing)'
    'voicemeeter8' = 'Voicemeeter Potato (virtual audio routing)'
}
$running = @()
try { $running = @(Get-Process -ErrorAction SilentlyContinue | ForEach-Object { $_.ProcessName }) } catch {}
$conflicts = @($knownVoiceApps.Keys | Where-Object { $running -contains $_ } | ForEach-Object { $knownVoiceApps[$_] } | Select-Object -Unique)
$facts.voice_software_running = $conflicts
if ($conflicts.Count -gt 0) {
    Add-Check 'Conflicts' 'Other voice software running' 'WARN' ($conflicts -join '; ') `
        'These can hear the assistant or your replies too. Pause them during voice sessions, or select the real microphone with MIC_QUERY.'
} else {
    Add-Check 'Conflicts' 'Other voice software running' 'OK' 'None of the known dictation or voice-control apps are running'
}

# --- 15. TCP ports ------------------------------------------------------------------
$facts.ports = [ordered]@{}
foreach ($port in $VoicePorts.Keys) {
    $listeners = @()
    try {
        $listeners = @(Get-NetTCPConnection -State Listen -LocalPort ([int]$port) -ErrorAction SilentlyContinue)
    } catch {
        $listeners = @()
    }
    if ($listeners.Count -eq 0) {
        $facts.ports["$port"] = 'free'
        Add-Check 'Ports' "TCP $port" 'OK' "free - $($VoicePorts[$port])"
        continue
    }
    $owners = @($listeners | ForEach-Object {
        $owningPid = [int]$_.OwningProcess
        $name = try { (Get-Process -Id $owningPid -ErrorAction Stop).ProcessName } catch { "pid $owningPid" }
        [pscustomobject]@{ Pid = $owningPid; Name = $name; Address = $_.LocalAddress; Ours = (Test-IsVoiceModeProcess $owningPid) }
    })
    $facts.ports["$port"] = @($owners | ForEach-Object { "$($_.Name) (pid $($_.Pid)) on $($_.Address)" })
    $public = @($owners | Where-Object { $_.Address -notin '127.0.0.1', '::1' })
    if (@($owners | Where-Object { -not $_.Ours }).Count -gt 0) {
        $required = $port -in '5093', '8766'
        Add-Check 'Ports' "TCP $port" $(if ($required) { 'BLOCKER' } else { 'WARN' }) "in use by $(($owners | ForEach-Object { "$($_.Name) (pid $($_.Pid))" }) -join ', ') - $($VoicePorts[$port])" `
            $(if ($required) { 'Stop that program, or install with a different port (PARAKEET_PORT / SUPERTONIC_PORT) and set STT_URL / SUPERTONIC_URL to match.' } else { '' })
    } elseif ($public.Count -gt 0) {
        Add-Check 'Ports' "TCP $port" 'WARN' "VoiceMode is listening on $(($public | ForEach-Object { $_.Address }) -join ', '), not only localhost" 'Run Install-VoiceMode.ps1 -Repair to regenerate localhost-only start scripts.'
    } else {
        Add-Check 'Ports' "TCP $port" 'OK' "already used by the VoiceMode service on localhost - $($VoicePorts[$port])"
    }
}

# --- Summary ---------------------------------------------------------------------
$blockers = @($checks | Where-Object { $_.Status -eq 'BLOCKER' })
$missing = @($checks | Where-Object { $_.Status -eq 'MISSING' })
$verdict = if ($blockers.Count -gt 0) { 'BLOCKED' } elseif ($missing.Count -gt 0) { 'READY_AFTER_INSTALL' } else { 'READY' }

$report = [ordered]@{
    kind = 'lifeos-voice-prereqs'
    generated_at = [DateTime]::UtcNow.ToString('o')
    computer = $env:COMPUTERNAME
    install_root = $InstallRoot
    verdict = $verdict
    blockers = @($blockers | ForEach-Object { "$($_.Name): $($_.Detail)" })
    missing = @($missing | ForEach-Object { $_.Name })
    facts = $facts
    checks = $checks.ToArray()
}

$reportPath = $null
try {
    if (-not (Test-Path $EvidenceDirectory)) { New-Item -ItemType Directory -Force -Path $EvidenceDirectory | Out-Null }
    $reportPath = Join-Path $EvidenceDirectory ("prereqs-{0}.json" -f [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ'))
    $report | ConvertTo-Json -Depth 8 | Set-Content -Path $reportPath -Encoding UTF8
} catch {
    $reportPath = $null
}
$report.report_path = $reportPath

if (-not $Quiet) {
    $colors = @{ OK = 'Green'; INFO = 'Gray'; WARN = 'Yellow'; MISSING = 'Cyan'; BLOCKER = 'Red' }
    Write-Host ''
    Write-Host 'LifeOS local voice layer - Phase 1 inspection (read-only)' -ForegroundColor Cyan
    foreach ($area in ($checks | ForEach-Object { $_.Area } | Select-Object -Unique)) {
        Write-Host ''
        Write-Host "== $area ==" -ForegroundColor Cyan
        foreach ($c in ($checks | Where-Object { $_.Area -eq $area })) {
            Write-Host ("  [{0,-7}] {1}: {2}" -f $c.Status, $c.Name, $c.Detail) -ForegroundColor $colors[$c.Status]
            if ($c.Fix -and $c.Status -ne 'OK') { Write-Host "            -> $($c.Fix)" -ForegroundColor DarkGray }
        }
    }
    Write-Host ''
    Write-Host "Verdict: $verdict" -ForegroundColor $(if ($verdict -eq 'BLOCKED') { 'Red' } elseif ($verdict -eq 'READY') { 'Green' } else { 'Cyan' })
    if ($missing.Count -gt 0) { Write-Host "Missing, installed by Install-VoiceMode.ps1 with winget: $(($missing | ForEach-Object { $_.Name }) -join ', ')" }
    if ($reportPath) { Write-Host "Report: $reportPath" }
}

if ($PassThru) { return [pscustomobject]$report }
if ($blockers.Count -gt 0) { exit 1 }
exit 0

#Requires -Version 5.1
<#
.SYNOPSIS
    Installs the LifeOS local voice layer (Local VoiceMode LLM) on Windows.
.DESCRIPTION
    1. Runs the read-only inspection (Test-VoicePrereqs.ps1) and stops on hard blockers.
    2. Installs only the missing prerequisites with winget (Git, Python 3.12,
       VC++ x64 runtime, FFmpeg). Working dependencies are left alone.
    3. Clones Local VoiceMode LLM into a permanent tools directory at a pinned,
       reviewed commit (or updates an existing clean clone).
    4. Runs the upstream native Windows installer (setup.ps1) with Python 3.12
       first on PATH for that child process only. Upstream installs Silero VAD,
       local Parakeet STT on 127.0.0.1:5093, local Supertonic TTS on
       127.0.0.1:8766, and per-user Task Scheduler tasks. No administrator rights
       are needed for that step.
    5. Installs the shared LifeOS voice client (Invoke-Talk.ps1 + talk-win.sh)
       into the shared runtime and the Windows talk skill into each selected agent.
    6. Adds one permission rule to Claude Code user settings (after a backup) so
       each voice turn runs without a keyboard prompt.
    7. Runs Test-VoiceLoop.ps1 (non-interactive checks) and writes evidence.

    Safe to rerun. Existing settings are backed up before any change, downloaded
    models are kept, and a clone with local changes is never overwritten.
.PARAMETER InstallRoot
    Permanent tools directory. The repository goes to <InstallRoot>\Local-VoiceMode-LLM.
.PARAMETER Ref
    Upstream commit, tag, or branch. Defaults to the commit this integration was reviewed against.
.PARAMETER Agents
    Comma-separated agents that get the Windows talk skill: claudecode, codex, opencode, hermes, openclaw.
.PARAMETER Repair
    Pass -Force to upstream setup.ps1 so scheduled tasks and start scripts are regenerated. Models are kept.
.PARAMETER SkillsOnly
    Only reinstall the voice client, agent skills, and Claude Code permission rule.
.PARAMETER SkipPrereqs
    Do not install missing prerequisites with winget.
.PARAMETER NoClaudeSettings
    Do not edit Claude Code settings.json; print the rule to add by hand instead.
.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\integrations\local-voicemode\Install-VoiceMode.ps1
.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\integrations\local-voicemode\Install-VoiceMode.ps1 -Agents "claudecode,codex,opencode,hermes"
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$InstallRoot = '',
    [string]$Ref = 'c3f6ca43580999f546bb5c3de9f70c59d607ac89',
    [string]$Agents = 'claudecode',
    [switch]$Repair,
    [switch]$SkillsOnly,
    [switch]$SkipPrereqs,
    [switch]$NoClaudeSettings,
    [switch]$SkipVerify,
    [string]$EvidenceDirectory = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$UpstreamUrl = 'https://github.com/groxaxo/Local-VoiceMode-LLM.git'
$Here = $PSScriptRoot
$UserHome = if ($env:USERPROFILE) { $env:USERPROFILE } else { [Environment]::GetFolderPath('UserProfile') }
$LocalAppData = if ($env:LOCALAPPDATA) { $env:LOCALAPPDATA } else { [Environment]::GetFolderPath('LocalApplicationData') }
if (-not $InstallRoot) { $InstallRoot = Join-Path $UserHome 'dev\tools' }
if (-not $EvidenceDirectory) { $EvidenceDirectory = Join-Path $LocalAppData 'LifeOS\voice\evidence' }
$RepoDir = Join-Path $InstallRoot 'Local-VoiceMode-LLM'
$ConfigDir = Join-Path $UserHome '.config\opencode'
$RuntimeDir = Join-Path $ConfigDir 'skills\talk'
$BackupDir = Join-Path $LocalAppData 'LifeOS\voice\backups'
$Stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
$PermissionRule = 'Bash(bash ~/.config/opencode/skills/talk/talk-win.sh *)'
$SkillMarker = 'lifeos-voice-skill'

$AgentSkillDirs = [ordered]@{
    claudecode = Join-Path $UserHome '.claude\skills\talk'
    codex = Join-Path $UserHome '.codex\skills\talk'
    opencode = $RuntimeDir
    hermes = Join-Path $UserHome '.hermes\skills\talk'
    openclaw = Join-Path $UserHome '.openclaw\skills\talk'
}
$Prerequisites = [ordered]@{
    'Git' = 'Git.Git'
    'Python 3.12' = 'Python.Python.3.12'
    'Microsoft VC++ 2015+ x64 runtime' = 'Microsoft.VCRedist.2015+.x64'
    'FFmpeg (ffplay)' = 'Gyan.FFmpeg'
}

$record = [ordered]@{
    kind = 'lifeos-voice-install'
    started_at = [DateTime]::UtcNow.ToString('o')
    install_root = $InstallRoot
    repo_dir = $RepoDir
    runtime_dir = $RuntimeDir
    requested_ref = $Ref
    agents = @()
    steps = New-Object System.Collections.Generic.List[object]
}

function Write-Step { param([string]$Message) Write-Host "[voice] $Message" -ForegroundColor Cyan }
function Write-Done { param([string]$Message) Write-Host "[voice] OK: $Message" -ForegroundColor Green }
function Write-Caution { param([string]$Message) Write-Host "[voice] WARNING: $Message" -ForegroundColor Yellow }
function Add-Step {
    param([string]$Name, [string]$Result, [string]$Detail = '')
    $record.steps.Add([ordered]@{ name = $Name; result = $Result; detail = $Detail; at = [DateTime]::UtcNow.ToString('o') })
}

function Invoke-Native {
    param([string]$FilePath, [string[]]$Arguments)
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$FilePath $($Arguments -join ' ') failed with exit code $LASTEXITCODE" }
}

function Update-ProcessPath {
    # winget installs update the registry PATH; pick them up without opening a new window.
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = (@($machine, $user) | Where-Object { $_ }) -join ';'
}

function Save-Evidence {
    param([string]$Result)
    $record.finished_at = [DateTime]::UtcNow.ToString('o')
    $record.result = $Result
    try {
        if (-not (Test-Path $EvidenceDirectory)) { New-Item -ItemType Directory -Force -Path $EvidenceDirectory | Out-Null }
        $path = Join-Path $EvidenceDirectory "install-$Stamp.json"
        $record | ConvertTo-Json -Depth 8 | Set-Content -Path $path -Encoding UTF8
        Write-Host "[voice] Evidence: $path"
    } catch {
        Write-Caution "Could not write evidence: $($_.Exception.Message)"
    }
}

function Backup-File {
    param([string]$Path, [string]$Label)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null }
    $target = Join-Path $BackupDir "$Label-$Stamp$([IO.Path]::GetExtension($Path))"
    Copy-Item -LiteralPath $Path -Destination $target -Force
    return $target
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    [IO.File]::WriteAllText($Path, $Content, (New-Object Text.UTF8Encoding($false)))
}

function Install-AgentSkills {
    $selected = @($Agents.Split(',') | ForEach-Object { $_.Trim().ToLowerInvariant() } | Where-Object { $_ })
    foreach ($agent in $selected) {
        if (-not $AgentSkillDirs.Contains($agent)) { throw "Unknown agent '$agent'. Use: $($AgentSkillDirs.Keys -join ', ')" }
    }
    $record.agents = $selected

    if (-not (Test-Path (Join-Path $RuntimeDir 'talk.ps1'))) {
        throw "Shared runtime not found at $RuntimeDir. Run without -SkillsOnly so upstream setup.ps1 installs it."
    }

    # Shared client: one copy in the shared runtime, used by every agent.
    if ($PSCmdlet.ShouldProcess($RuntimeDir, 'Install LifeOS voice client (Invoke-Talk.ps1, talk-win.sh)')) {
        Copy-Item (Join-Path $Here 'agent\Invoke-Talk.ps1') (Join-Path $RuntimeDir 'Invoke-Talk.ps1') -Force
        # Bash refuses CRLF scripts; write the bridge with LF endings whatever Git did on checkout.
        $bridge = [IO.File]::ReadAllText((Join-Path $Here 'agent\talk-win.sh')) -replace "`r`n", "`n"
        Write-Utf8NoBom (Join-Path $RuntimeDir 'talk-win.sh') $bridge
        Write-Done "Voice client installed in $RuntimeDir"
        Add-Step 'voice-client' 'installed' $RuntimeDir
    }

    $skillSource = Join-Path $Here 'agent\SKILL.md'
    foreach ($agent in $selected) {
        $dir = $AgentSkillDirs[$agent]
        $target = Join-Path $dir 'SKILL.md'
        if (-not $PSCmdlet.ShouldProcess($target, "Install Windows talk skill for $agent")) { continue }
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        if ((Test-Path $target) -and -not (Select-String -Path $target -SimpleMatch $SkillMarker -Quiet)) {
            $saved = Backup-File $target "SKILL-$agent"
            Write-Step "Backed up the previous $agent talk skill to $saved"
        }
        Copy-Item $skillSource $target -Force
        Write-Done "Talk skill installed for $agent ($target)"
        Add-Step "skill-$agent" 'installed' $target
    }
    return $selected
}

function Add-StartMenuLaunchers {
    # Start Menu (not Desktop) shortcuts to the double-click launchers in .\launchers.
    $programs = [Environment]::GetFolderPath('Programs')
    if (-not $programs) { return }
    $folder = Join-Path $programs 'LifeOS Voice'
    if (-not $PSCmdlet.ShouldProcess($folder, 'Create Start Menu shortcuts: Start, Stop, Restart Voice and Voice Status')) { return }
    try {
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
        $shell = New-Object -ComObject WScript.Shell
        foreach ($launcher in Get-ChildItem (Join-Path $Here 'launchers') -Filter '*.cmd') {
            $shortcut = $shell.CreateShortcut((Join-Path $folder ($launcher.BaseName + '.lnk')))
            $shortcut.TargetPath = $launcher.FullName
            $shortcut.WorkingDirectory = $launcher.DirectoryName
            $shortcut.Save()
        }
        Write-Done "Start Menu shortcuts in $folder"
        Add-Step 'start-menu-launchers' 'created' $folder
    } catch {
        Write-Caution "Could not create Start Menu shortcuts ($($_.Exception.Message)). The launchers still work from $(Join-Path $Here 'launchers')."
        Add-Step 'start-menu-launchers' 'skipped' $_.Exception.Message
    }
}

function Add-ClaudePermissionRule {
    $settingsPath = Join-Path $UserHome '.claude\settings.json'
    if ($NoClaudeSettings) {
        Write-Step "Skipped settings.json. To avoid a prompt on every voice turn, add this to permissions.allow in ${settingsPath}: $PermissionRule"
        Add-Step 'claude-permission' 'skipped' 'NoClaudeSettings'
        return
    }
    $settings = $null
    if (Test-Path $settingsPath) {
        try {
            $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
        } catch {
            Write-Caution "$settingsPath is not valid JSON, so it was left untouched. Add this to permissions.allow by hand: $PermissionRule"
            Add-Step 'claude-permission' 'manual' 'settings.json is not valid JSON'
            return
        }
    }
    if ($null -eq $settings) { $settings = [pscustomobject]@{} }
    if ($null -eq $settings.PSObject.Properties['permissions'] -or $null -eq $settings.permissions) {
        $settings | Add-Member -NotePropertyName permissions -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    $allow = @()
    if ($null -ne $settings.permissions.PSObject.Properties['allow'] -and $null -ne $settings.permissions.allow) {
        $allow = @($settings.permissions.allow)
    }
    if ($allow -contains $PermissionRule) {
        Write-Done 'Claude Code permission rule already present'
        Add-Step 'claude-permission' 'present' $settingsPath
        return
    }
    if (-not $PSCmdlet.ShouldProcess($settingsPath, "Add permission rule $PermissionRule")) { return }
    $backup = Backup-File $settingsPath 'claude-settings'
    $settings.permissions | Add-Member -NotePropertyName allow -NotePropertyValue (@($allow) + $PermissionRule) -Force
    New-Item -ItemType Directory -Force -Path (Split-Path $settingsPath -Parent) | Out-Null
    Write-Utf8NoBom $settingsPath (ConvertTo-Json -InputObject $settings -Depth 32)
    Write-Done "Added the voice permission rule to $settingsPath$(if ($backup) { " (backup: $backup)" })"
    Add-Step 'claude-permission' 'added' $settingsPath
}

function Get-Python312 {
    param($Prereqs)
    $path = $Prereqs.facts.python.python_3_12
    if ($path -and (Test-Path $path)) { return $path }
    $launcher = Get-Command py -ErrorAction SilentlyContinue
    if ($launcher) {
        try {
            $resolved = & $launcher.Source -3.12 -c 'import sys; print(sys.executable)' 2>$null
            if ($LASTEXITCODE -eq 0 -and $resolved -and (Test-Path "$resolved".Trim())) { return "$resolved".Trim() }
        } catch {}
    }
    foreach ($candidate in (Join-Path $LocalAppData 'Programs\Python\Python312\python.exe'), 'C:\Program Files\Python312\python.exe') {
        if (Test-Path $candidate) { return $candidate }
    }
    return $null
}

function Sync-UpstreamRepo {
    $git = (Get-Command git -ErrorAction Stop).Source
    if (Test-Path (Join-Path $RepoDir '.git')) {
        $dirty = & $git -C $RepoDir status --porcelain
        if ($LASTEXITCODE -ne 0) { throw "git status failed in $RepoDir" }
        if ($dirty) { throw "$RepoDir has local changes. Commit or stash them, then rerun; the installer will not overwrite them." }
        if ($PSCmdlet.ShouldProcess($RepoDir, "Fetch and check out $Ref")) {
            Invoke-Native $git @('-C', $RepoDir, 'fetch', '--quiet', '--tags', 'origin')
        }
    } elseif (Test-Path $RepoDir) {
        throw "$RepoDir exists but is not a Git clone. Move it aside and rerun."
    } else {
        if ($PSCmdlet.ShouldProcess($RepoDir, "Clone $UpstreamUrl")) {
            New-Item -ItemType Directory -Force -Path $InstallRoot | Out-Null
            Invoke-Native $git @('clone', '--quiet', $UpstreamUrl, $RepoDir)
        }
    }
    if (-not (Test-Path (Join-Path $RepoDir '.git'))) { return $null }  # -WhatIf on a fresh install

    $target = $Ref
    & $git -C $RepoDir rev-parse --verify --quiet "$Ref^{commit}" *> $null
    if ($LASTEXITCODE -ne 0) { $target = "origin/$Ref" }
    if ($PSCmdlet.ShouldProcess($RepoDir, "Check out $target")) {
        Invoke-Native $git @('-C', $RepoDir, 'checkout', '--quiet', '--detach', $target)
    }
    $commit = (& $git -C $RepoDir rev-parse HEAD).Trim()
    $record.upstream_commit = $commit
    Write-Done "Local VoiceMode LLM at $RepoDir (commit $($commit.Substring(0, 12)))"
    Add-Step 'upstream-repo' 'ready' "$RepoDir @ $commit"
    return $commit
}

try {
    Write-Host ''
    Write-Host 'LifeOS local voice layer - install' -ForegroundColor Cyan
    Write-Step "Repository: $RepoDir"
    Write-Step "Shared runtime (fixed by upstream): $ConfigDir"

    if (-not $SkillsOnly) {
        # Phase 1: inspect.
        $pre = & (Join-Path $Here 'Test-VoicePrereqs.ps1') -InstallRoot $InstallRoot -EvidenceDirectory $EvidenceDirectory -PassThru -Quiet
        $record.prereqs_report = $pre.report_path
        $hard = @($pre.checks | Where-Object { $_.Status -eq 'BLOCKER' -and $_.Area -in 'System', 'PowerShell', 'Ports' })
        $soft = @($pre.checks | Where-Object { $_.Status -eq 'BLOCKER' -and $_.Area -notin 'System', 'PowerShell', 'Ports' })
        foreach ($b in $soft) { Write-Caution "$($b.Name): $($b.Detail). $($b.Fix)" }
        if ($hard.Count -gt 0) {
            foreach ($b in $hard) { Write-Host "[voice] BLOCKER: $($b.Name): $($b.Detail). $($b.Fix)" -ForegroundColor Red }
            Add-Step 'inspection' 'blocked' (($hard | ForEach-Object { $_.Name }) -join ', ')
            Save-Evidence 'BLOCKED'
            exit 1
        }
        Add-Step 'inspection' $pre.verdict $pre.report_path

        # Phase 3a: install only what is missing.
        $missing = @($pre.checks | Where-Object { $_.Status -eq 'MISSING' -and $Prerequisites.Contains($_.Name) } | ForEach-Object { $_.Name })
        if ($missing.Count -gt 0 -and -not $SkipPrereqs) {
            if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
                throw "Missing $($missing -join ', ') and winget is not available. Install them by hand (see the report), then rerun."
            }
            foreach ($name in $missing) {
                $id = $Prerequisites[$name]
                if ($PSCmdlet.ShouldProcess($id, 'winget install')) {
                    Write-Step "Installing $name ($id)$(if ($id -like 'Microsoft.VCRedist*') { ' - Windows will ask for administrator approval' })"
                    & winget install --id $id -e --accept-package-agreements --accept-source-agreements --disable-interactivity
                    # winget returns non-zero for "already installed / no upgrade"; the re-inspection below is the real check.
                    Add-Step "prereq-$id" "winget exit $LASTEXITCODE"
                }
            }
            Update-ProcessPath
            $pre = & (Join-Path $Here 'Test-VoicePrereqs.ps1') -InstallRoot $InstallRoot -EvidenceDirectory $EvidenceDirectory -PassThru -Quiet
        } elseif ($missing.Count -gt 0) {
            Write-Caution "Skipping prerequisite installs; still missing: $($missing -join ', ')"
        } else {
            Write-Done 'All prerequisites already present; nothing reinstalled'
        }

        $stillMissing = @($pre.checks | Where-Object { $_.Status -eq 'MISSING' -and $_.Name -in 'Git', 'Python 3.12', 'Microsoft VC++ 2015+ x64 runtime' })
        if ($stillMissing.Count -gt 0 -and -not $WhatIfPreference) {
            throw "Still missing after install: $(($stillMissing | ForEach-Object { $_.Name }) -join ', '). Open a new PowerShell window and rerun, or install them by hand."
        }

        # Phase 3b: upstream repository at a pinned commit.
        $null = Sync-UpstreamRepo

        # Phase 3c/4: upstream native Windows installer with Python 3.12 first on PATH for this run only.
        $python = Get-Python312 $pre
        if (-not $python -and -not $WhatIfPreference) { throw 'Python 3.12 was not found after installation. Open a new PowerShell window and rerun.' }
        $record.python = $python
        $setup = Join-Path $RepoDir 'setup.ps1'
        $setupArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $setup, '-Integrations', 'opencode')
        if ($Repair) { $setupArgs += '-Force' }
        if ($PSCmdlet.ShouldProcess($setup, "Run upstream installer ($($setupArgs[5..($setupArgs.Count - 1)] -join ' '))")) {
            $savedPath = $env:Path
            try {
                $pythonDir = Split-Path $python -Parent
                $env:Path = "$pythonDir;$(Join-Path $pythonDir 'Scripts');$env:Path"
                Write-Step 'Running upstream setup.ps1 (first run downloads PyTorch CPU, ONNX Runtime and the speech models; this can take a while)'
                $timer = [Diagnostics.Stopwatch]::StartNew()
                & powershell.exe @setupArgs
                if ($LASTEXITCODE -ne 0) { throw "Upstream setup.ps1 failed with exit code $LASTEXITCODE. Read the messages above, fix the cause, and rerun with -Repair." }
                Add-Step 'upstream-setup' 'ok' ("{0:n0} s" -f $timer.Elapsed.TotalSeconds)
            } finally {
                $env:Path = $savedPath
            }
        }
    }

    # Phase 5/6: shared client, agent skills, Claude Code permission rule.
    $selected = Install-AgentSkills
    if ($selected -contains 'claudecode') { Add-ClaudePermissionRule }
    Add-StartMenuLaunchers

    if (-not $SkipVerify -and -not $WhatIfPreference) {
        Write-Step 'Running non-interactive verification (Test-VoiceLoop.ps1)'
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Here 'Test-VoiceLoop.ps1') -EvidenceDirectory $EvidenceDirectory
        $record.verify_exit_code = $LASTEXITCODE
        Add-Step 'verify' $(if ($LASTEXITCODE -eq 0) { 'PASSED' } else { 'FAILED' })
    }

    Save-Evidence $(if ($record.Contains('verify_exit_code') -and $record.verify_exit_code -ne 0) { 'INSTALLED_VERIFY_FAILED' } else { 'INSTALLED' })
    Write-Host ''
    Write-Host 'Next steps:' -ForegroundColor Cyan
    Write-Host '  1. Hear and speak test (uses your speakers and microphone):'
    Write-Host "     powershell -NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $Here 'Test-VoiceLoop.ps1')`" -Interactive"
    Write-Host '  Daily use: Start menu > LifeOS Voice > Start Voice / Stop Voice / Restart Voice / Voice Status'
    Write-Host '  2. Open a NEW terminal, start Claude Code with: claude'
    Write-Host '     then type /talk (or say "voice mode"). Say "stop talk" to end.'
} catch {
    Write-Host "[voice] FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Add-Step 'error' 'failed' $_.Exception.Message
    Save-Evidence 'FAILED'
    exit 1
}

#Requires -Version 5.1
<#
.SYNOPSIS
    Start, stop, restart, or check the LifeOS local voice services.
.DESCRIPTION
    Controls the two local speech services that the upstream installer registers
    as per-user Task Scheduler tasks:

      OpenCode-Parakeet-STT  speech-to-text  http://127.0.0.1:5093
      OpenCode-Supertonic    text-to-speech  http://127.0.0.1:8766

    The launchers in .\launchers call this script, so daily use is a double-click.
    Exit code 0 means both services are healthy (start, restart, status) or both
    are stopped (stop).
.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\integrations\local-voicemode\Manage-Voice.ps1 status
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'restart', 'status')]
    [string]$Action = 'status',
    [int]$TimeoutSeconds = 180
)

$ErrorActionPreference = 'Stop'

$Services = [ordered]@{
    'Speech-to-text (Parakeet)' = @{ Task = 'OpenCode-Parakeet-STT'; Port = 5093; Health = 'http://127.0.0.1:5093/health'; Field = 'ready'; Match = 'parakeet' }
    'Text-to-speech (Supertonic)' = @{ Task = 'OpenCode-Supertonic'; Port = 8766; Health = 'http://127.0.0.1:8766/health'; Field = 'model_loaded'; Match = 'supertonic' }
}

function Test-Healthy {
    param($Service)
    try {
        $body = (Invoke-WebRequest -Uri $Service.Health -UseBasicParsing -TimeoutSec 3).Content | ConvertFrom-Json
        return [bool]($body.PSObject.Properties[$Service.Field] -and $body.($Service.Field))
    } catch {
        return $false
    }
}

function Get-ServiceProcesses {
    param($Service)
    try {
        return @(Get-CimInstance Win32_Process -Filter "Name = 'python.exe' OR Name = 'pythonw.exe'" |
            Where-Object { "$($_.CommandLine)" -match $Service.Match -and "$($_.CommandLine)" -match 'opencode' })
    } catch {
        return @()
    }
}

function Get-Listeners {
    param($Service)
    try { return @(Get-NetTCPConnection -State Listen -LocalPort $Service.Port -ErrorAction Stop | ForEach-Object { "$($_.LocalAddress)" } | Select-Object -Unique) }
    catch { return @() }
}

function Get-TaskState {
    param($Service)
    try { return "$((Get-ScheduledTask -TaskName $Service.Task -ErrorAction Stop).State)" } catch { return 'NotInstalled' }
}

function Start-VoiceServices {
    $ok = $true
    foreach ($name in $Services.Keys) {
        $svc = $Services[$name]
        if (Test-Healthy $svc) { Write-Host "  $name is already running." -ForegroundColor Green; continue }
        if ((Get-TaskState $svc) -eq 'NotInstalled') {
            Write-Host "  $name is not installed. Run Install-VoiceMode.ps1." -ForegroundColor Red
            $ok = $false
            continue
        }
        Start-ScheduledTask -TaskName $svc.Task
        Write-Host "  Starting $name ..." -NoNewline
        $timer = [Diagnostics.Stopwatch]::StartNew()
        while (-not (Test-Healthy $svc) -and $timer.Elapsed.TotalSeconds -lt $TimeoutSeconds) { Start-Sleep -Seconds 1 }
        if (Test-Healthy $svc) {
            Write-Host (" ready in {0:n1} s" -f $timer.Elapsed.TotalSeconds) -ForegroundColor Green
        } else {
            Write-Host " not ready after $TimeoutSeconds s. Log: $env:USERPROFILE\.config\opencode\$(if ($svc.Match -eq 'parakeet') { 'parakeet-stt.log' } else { 'supertonic.log' })" -ForegroundColor Red
            $ok = $false
        }
    }
    return $ok
}

function Stop-VoiceServices {
    $ok = $true
    foreach ($name in $Services.Keys) {
        $svc = $Services[$name]
        if ((Get-TaskState $svc) -ne 'NotInstalled') { Stop-ScheduledTask -TaskName $svc.Task -ErrorAction SilentlyContinue }
        # The task's PowerShell wrapper may stop before its Python child; stop leftovers explicitly.
        foreach ($p in (Get-ServiceProcesses $svc)) { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }
        $deadline = (Get-Date).AddSeconds(15)
        while ((Get-Listeners $svc).Count -gt 0 -and (Get-Date) -lt $deadline) { Start-Sleep -Milliseconds 500 }
        if ((Get-Listeners $svc).Count -gt 0) {
            Write-Host "  $name is still listening on port $($svc.Port)." -ForegroundColor Red
            $ok = $false
        } else {
            Write-Host "  $name stopped." -ForegroundColor Green
        }
    }
    return $ok
}

function Show-VoiceStatus {
    $ok = $true
    foreach ($name in $Services.Keys) {
        $svc = $Services[$name]
        $healthy = Test-Healthy $svc
        $listeners = Get-Listeners $svc
        $memory = (Get-ServiceProcesses $svc | Measure-Object -Property WorkingSetSize -Sum).Sum
        $public = @($listeners | Where-Object { $_ -notin '127.0.0.1', '::1' })
        $color = if ($healthy -and $public.Count -eq 0) { 'Green' } else { 'Red' }
        Write-Host "  $name" -ForegroundColor $color
        Write-Host "    Task: $(Get-TaskState $svc)   Health: $(if ($healthy) { 'ready' } else { 'NOT READY' })   Address: $(if ($listeners) { "$($listeners -join ', '):$($svc.Port)" } else { 'not listening' })   Memory: $(if ($memory) { '{0:n0} MB' -f ($memory / 1MB) } else { '-' })"
        if ($public.Count -gt 0) { Write-Host '    WARNING: reachable from other computers; run Install-VoiceMode.ps1 -Repair' -ForegroundColor Red }
        if (-not $healthy) { $ok = $false }
    }
    $cloud = [Environment]::GetEnvironmentVariable('VOICE_ALLOW_CLOUD', 'User') -eq '1' -or [Environment]::GetEnvironmentVariable('VOICE_ALLOW_CLOUD', 'Machine') -eq '1'
    Write-Host "  Privacy: $(if ($cloud) { 'CLOUD ALLOWED (VOICE_ALLOW_CLOUD=1)' } else { 'local only' })" -ForegroundColor $(if ($cloud) { 'Yellow' } else { 'Green' })
    return $ok
}

Write-Host ''
Write-Host "LifeOS voice: $Action" -ForegroundColor Cyan
$result = switch ($Action) {
    'start' { Start-VoiceServices }
    'stop' { Stop-VoiceServices }
    'restart' { $null = Stop-VoiceServices; Start-VoiceServices }
    'status' { Show-VoiceStatus }
}
Write-Host ''
if ($result) { exit 0 }
exit 1

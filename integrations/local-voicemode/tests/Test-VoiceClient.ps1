#Requires -Version 7.0
<#
.SYNOPSIS
    Hardware-free regression tests for the LifeOS voice client and installer logic.
.DESCRIPTION
    Runs Invoke-Talk.ps1 and talk-win.sh against fakes: a fake Silero recorder
    (Python), a fake Parakeet HTTP server (Python), and a fake upstream talk.ps1.
    It exercises the client contract (stdout = user words only), stop phrases,
    retries on empty transcripts, privacy refusal, Markdown-to-speech cleanup,
    chunking, quoting through the Git Bash bridge, paths with spaces, the turn
    log, and the installer's skill + settings.json handling.

    It cannot prove real audio works; Test-VoiceLoop.ps1 -Interactive does that
    on the target Windows computer.

    Requires PowerShell 7, python3, bash, and curl. Runs on Linux, macOS, or Windows.
.EXAMPLE
    pwsh -NoProfile -File integrations/local-voicemode/tests/Test-VoiceClient.ps1
#>
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Root = Split-Path $PSScriptRoot -Parent
$ClientSource = Join-Path $Root 'agent/Invoke-Talk.ps1'
$BridgeSource = Join-Path $Root 'agent/talk-win.sh'
$Pwsh = (Get-Process -Id $PID).Path
$Python = (Get-Command python3 -ErrorAction Stop).Source
$Bash = (Get-Command bash -ErrorAction Stop).Source

$Sandbox = Join-Path ([IO.Path]::GetTempPath()) ("voice client tests " + [guid]::NewGuid().ToString('N').Substring(0, 8))
$Runtime = Join-Path $Sandbox 'run time'
$TempDir = Join-Path $Sandbox 'tmp dir'
$State = Join-Path $Sandbox 'state'
New-Item -ItemType Directory -Force -Path $Runtime, $TempDir, $State | Out-Null

$failures = New-Object System.Collections.Generic.List[string]
$passed = 0
function Assert-True {
    param([bool]$Condition, [string]$Name, [string]$Detail = '')
    if ($Condition) { $script:passed++; Write-Host "  PASS $Name" -ForegroundColor Green }
    else { $failures.Add("$Name $Detail"); Write-Host "  FAIL $Name $Detail" -ForegroundColor Red }
}

# --- Fakes ------------------------------------------------------------------------------
@'
import argparse, json, os, sys, time
p = argparse.ArgumentParser()
p.add_argument("--oneshot", action="store_true")
p.add_argument("--output-dir"); p.add_argument("--output-file")
for a in ("--vad-threshold", "--min-silence-ms", "--ready-delay-ms", "--idle-timeout-s", "--max-duration-s", "--mic-query"):
    p.add_argument(a)
p.add_argument("--list-devices", action="store_true")
args = p.parse_args()
state = os.environ["FAKE_STATE"]
if args.list_devices:
    print("[0] Fake Microphone  inputs=1"); sys.exit(0)
with open(os.path.join(state, "vad-args.json"), "w") as f:
    json.dump(vars(args), f)
mode = open(os.path.join(state, "vad-mode")).read().strip()
def emit(event, **kw):
    print(json.dumps({"event": event, "timestamp": time.time(), **kw}), flush=True)
time.sleep(0.4)  # model load: the beep must not come before "listening"
if mode == "error":
    emit("error", message="No input audio device found"); sys.exit(1)
if mode == "crash":
    print("Traceback: PortAudio error", file=sys.stderr); sys.exit(3)
emit("listening")
time.sleep(0.2)
if mode == "idle":
    emit("idle_timeout", elapsed_s=1.0); sys.exit(0)
wav = os.path.join(args.output_dir, "turn-1.wav")
with open(wav, "wb") as f:
    f.write(b"RIFF" + b"\0" * 2000)
extra = {"reason": "max_duration"} if mode == "maxdur" else {}
emit("speech_end", file=wav, duration_ms=1200, **extra)
'@ | Set-Content (Join-Path $Runtime 'vad_recorder.py')

@'
import http.server, json, os, sys
state = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0)); body = self.rfile.read(length)
        queue = os.path.join(state, "stt-queue.json")
        items = json.load(open(queue))
        text = items.pop(0) if len(items) > 1 else items[0]
        json.dump(items, open(queue, "w"))
        with open(os.path.join(state, "stt-requests.log"), "a") as log:
            log.write(("file" if b'name="file"' in body else "nofile") + ("+model" if b"parakeet-tdt-0.6b-v3" in body else "") + "\n")
        out = json.dumps({"text": text}).encode()
        self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(out)
    def log_message(self, *a): pass
s = http.server.HTTPServer(("127.0.0.1", 0), H)
print(s.server_address[1], flush=True)
s.serve_forever()
'@ | Set-Content (Join-Path $State 'fake_stt.py')

@'
param([Parameter(Position=0)][string]$Command = 'listen', [Parameter(Position=1, ValueFromRemainingArguments)][string[]]$TextArgs = @())
$state = $env:FAKE_STATE
switch ($Command) {
    'speak' {
        Add-Content -Path (Join-Path $state 'tts-calls.log') -Value ("{0}`t{1}`t{2}`t{3}" -f $TextArgs[0], $env:TTS_ENGINE, [bool]$env:XAI_API_KEY, $env:TALK_AUTO_LISTEN) -Encoding utf8
        if ($env:FAKE_TTS_FAIL -eq '1') { Write-Host '[tts] Supertonic failed: connection refused'; Write-Host '[tts] All TTS engines failed' }
    }
    'status' { Write-Host '=== Parakeet STT ==='; Write-Host '  RUNNING - 200'; Write-Host '=== Supertonic ==='; Write-Host '  RUNNING - 200' }
    'devices' { Write-Output '[0] Fake Microphone' }
}
'@ | Set-Content (Join-Path $Runtime 'talk.ps1')

Copy-Item $ClientSource (Join-Path $Runtime 'Invoke-Talk.ps1')
[IO.File]::WriteAllText((Join-Path $Runtime 'talk-win.sh'), ([IO.File]::ReadAllText($BridgeSource) -replace "`r`n", "`n"))

# Git Bash stand-ins: cygpath and powershell.exe.
$FakeBin = Join-Path $Sandbox 'bin'
New-Item -ItemType Directory -Force -Path $FakeBin | Out-Null
"#!/usr/bin/env bash`nshift; printf '%s' `"`$1`"`n" | Set-Content (Join-Path $FakeBin 'cygpath')
"#!/usr/bin/env bash`nexec `"$Pwsh`" `"`$@`"`n" | Set-Content (Join-Path $FakeBin 'powershell.exe')
& chmod +x (Join-Path $FakeBin 'cygpath') (Join-Path $FakeBin 'powershell.exe')

$serverInfo = New-Object Diagnostics.ProcessStartInfo $Python
$serverInfo.ArgumentList.Add((Join-Path $State 'fake_stt.py'))
$serverInfo.ArgumentList.Add($State)
$serverInfo.RedirectStandardOutput = $true
$serverInfo.UseShellExecute = $false
$server = [Diagnostics.Process]::Start($serverInfo)
$Port = $server.StandardOutput.ReadLine().Trim()

$BaseEnv = @{
    USERPROFILE = $Sandbox; LOCALAPPDATA = (Join-Path $Sandbox 'localappdata'); TMPDIR = $TempDir
    VOICE_RUNTIME_DIR = $Runtime; PYTHON = $Python; FAKE_STATE = $State
    STT_URL = "http://127.0.0.1:$Port/v1/audio/transcriptions"; TALK_READY_CUE = '0'
    VOICE_ALLOW_CLOUD = $null; TTS_ENGINE = $null; XAI_API_KEY = $null; FAKE_TTS_FAIL = $null; TALK_STOP_PHRASES = $null
    PATH = "$FakeBin$([IO.Path]::PathSeparator)$env:PATH"
}

function Invoke-Proc {
    # Real argv arrays (no command-line re-parsing) so quoting tests mean what they say.
    param([string]$FilePath, [string[]]$Arguments, [string]$Stdin = $null)
    $psi = New-Object Diagnostics.ProcessStartInfo $FilePath
    foreach ($a in $Arguments) { $psi.ArgumentList.Add($a) }
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.RedirectStandardInput = $true
    $psi.UseShellExecute = $false
    $p = [Diagnostics.Process]::Start($psi)
    if ($Stdin) { $p.StandardInput.Write($Stdin) }
    $p.StandardInput.Close()
    $outTask = $p.StandardOutput.ReadToEndAsync()
    $errTask = $p.StandardError.ReadToEndAsync()
    $p.WaitForExit()
    return [pscustomobject]@{ Exit = $p.ExitCode; Out = $outTask.Result; Err = $errTask.Result }
}

function Invoke-Case {
    param([string]$Mode, [string[]]$SttQueue = @('hello world'), [string[]]$Command, [hashtable]$Env = @{}, [switch]$ViaBridge, [string]$Stdin = $null)
    Set-Content (Join-Path $State 'vad-mode') $Mode
    ConvertTo-Json -InputObject @($SttQueue) | Set-Content (Join-Path $State 'stt-queue.json')
    Remove-Item (Join-Path $State 'tts-calls.log'), (Join-Path $State 'vad-args.json'), (Join-Path $State 'stt-requests.log') -ErrorAction SilentlyContinue
    $merged = @{} + $BaseEnv
    foreach ($k in $Env.Keys) { $merged[$k] = $Env[$k] }
    $saved = @{}
    foreach ($k in $merged.Keys) { $saved[$k] = [Environment]::GetEnvironmentVariable($k); [Environment]::SetEnvironmentVariable($k, $merged[$k]) }
    try {
        if ($ViaBridge) {
            $r = Invoke-Proc $Bash @('-c', ('bash "$VOICE_RUNTIME_DIR/talk-win.sh" ' + ($Command -join ' '))) $Stdin
        } else {
            $r = Invoke-Proc $Pwsh (@('-NoProfile', '-NonInteractive', '-File', (Join-Path $Runtime 'Invoke-Talk.ps1')) + $Command) $Stdin
        }
        $calls = @(Get-Content (Join-Path $State 'tts-calls.log') -Encoding utf8 -ErrorAction SilentlyContinue)
        $vadArgs = if (Test-Path (Join-Path $State 'vad-args.json')) { Get-Content (Join-Path $State 'vad-args.json') -Raw | ConvertFrom-Json } else { $null }
        return [pscustomobject]@{ Exit = $r.Exit; Out = $r.Out; Err = $r.Err; TtsCalls = $calls; VadArgs = $vadArgs }
    } finally {
        foreach ($k in $saved.Keys) { [Environment]::SetEnvironmentVariable($k, $saved[$k]) }
    }
}
function Get-Out { param($r) if ($r.Out) { $r.Out.Trim() } else { '' } }

try {
    Write-Host 'Voice client tests' -ForegroundColor Cyan

    $r = Invoke-Case 'speech' @('hello world') @('listen')
    Assert-True ($r.Exit -eq 0 -and (Get-Out $r) -eq 'hello world') 'listen prints only the transcript' "exit=$($r.Exit) out=[$($r.Out)] err=[$($r.Err)]"
    Assert-True ($r.VadArgs.idle_timeout_s -eq '300' -and $r.VadArgs.max_duration_s -eq '120' -and $r.VadArgs.min_silence_ms -eq '700') 'accessibility defaults reach the recorder' ($r.VadArgs | ConvertTo-Json -Compress)
    Assert-True ($r.VadArgs.output_dir -like "*tmp dir*lifeos-talk-*") 'recording goes to a private temp folder (path with spaces survives)' "$($r.VadArgs.output_dir)"
    Assert-True (-not (Test-Path $r.VadArgs.output_dir)) 'recording folder is deleted after the turn'
    Assert-True ((Get-Content (Join-Path $State 'stt-requests.log')) -eq 'file+model') 'STT request carries the audio file and model'

    $r = Invoke-Case 'speech' @('Sure.') @('speak', '## Result', '**Done**. See `file.txt` and [docs](https://example.com/x).')
    Assert-True ($r.Exit -eq 0 -and (Get-Out $r) -eq 'Sure.') 'speak returns the next user turn' "exit=$($r.Exit) out=[$($r.Out)] err=[$($r.Err)]"
    Assert-True ($r.TtsCalls.Count -eq 1 -and ($r.TtsCalls[0] -split "`t")[0] -eq 'Result Done. See file.txt and docs.') 'Markdown is read as plain speech' "$($r.TtsCalls -join ' || ')"
    Assert-True (($r.TtsCalls[0] -split "`t")[3] -eq '0') 'upstream TTS runs without its own listen (no double recording)'

    $r = Invoke-Case 'speech' @('okay Stop talk now') @('listen')
    Assert-True ($r.Exit -eq 0 -and -not (Get-Out $r) -and $r.Err -match 'SESSION ENDED: the user said a stop phrase') 'stop phrase ends the session with empty stdout' "out=[$($r.Out)] err=[$($r.Err)]"
    $r = Invoke-Case 'speech' @('please stop talking about that') @('listen')
    Assert-True ((Get-Out $r) -eq 'please stop talking about that') 'stop phrase matches whole words only'
    $r = Invoke-Case 'speech' @('end voice mode please') @('listen') @{ TALK_STOP_PHRASES = 'goodbye claude|end voice mode' }
    Assert-True (-not (Get-Out $r) -and $r.Err -match 'stop phrase') 'custom stop phrases are honoured'

    $r = Invoke-Case 'idle' @('unused') @('listen')
    Assert-True ($r.Exit -eq 0 -and -not (Get-Out $r) -and $r.Err -match 'SESSION ENDED: no speech for 300 seconds') 'silence ends the session cleanly' "err=[$($r.Err)]"

    $r = Invoke-Case 'error' @('unused') @('listen')
    Assert-True ($r.Exit -eq 4 -and -not (Get-Out $r) -and $r.Err -match 'No input audio device found') 'missing microphone is an error, not a session end' "exit=$($r.Exit) err=[$($r.Err)]"
    $r = Invoke-Case 'crash' @('unused') @('listen')
    Assert-True ($r.Exit -eq 4 -and $r.Err -match 'PortAudio error') 'recorder crash is reported with its log' "exit=$($r.Exit) err=[$($r.Err)]"

    $r = Invoke-Case 'speech' @('', '', 'third time lucky') @('listen')
    Assert-True ((Get-Out $r) -eq 'third time lucky' -and $r.Err -match 'no words; listening again') 'noise without words does not end the session' "out=[$($r.Out)] err=[$($r.Err)]"
    $r = Invoke-Case 'speech' @('') @('listen')
    Assert-True ($r.Exit -eq 4 -and -not (Get-Out $r)) 'repeated empty transcripts become an error after 3 tries' "exit=$($r.Exit)"

    $r = Invoke-Case 'maxdur' @('a very long turn') @('listen')
    Assert-True ((Get-Out $r) -eq 'a very long turn' -and $r.Err -match '120-second limit') 'turn cut at the time limit is flagged'

    $r = Invoke-Case 'speech' @('x') @('listen') @{ STT_URL = 'https://speech.example.com/v1/audio/transcriptions' }
    Assert-True ($r.Exit -eq 3 -and $r.Err -match 'REFUSED: STT_URL') 'non-local STT is refused' "exit=$($r.Exit) err=[$($r.Err)]"
    $r = Invoke-Case 'speech' @('ok') @('notify', 'hi') @{ TTS_ENGINE = 'xai'; XAI_API_KEY = 'xai-test-not-real' }
    $fields = $r.TtsCalls[0] -split "`t"
    Assert-True ($r.Exit -eq 0 -and $fields[1] -eq 'supertonic' -and $fields[2] -eq 'False') 'cloud TTS engine and xAI key are neutralised' "$($r.TtsCalls -join ' || ') err=[$($r.Err)]"
    $r = Invoke-Case 'speech' @('ok') @('notify', 'hi') @{ TTS_ENGINE = 'xai'; XAI_API_KEY = 'xai-test-not-real'; VOICE_ALLOW_CLOUD = '1' }
    $fields = $r.TtsCalls[0] -split "`t"
    Assert-True ($fields[1] -eq 'xai' -and $fields[2] -eq 'True') 'VOICE_ALLOW_CLOUD=1 is an explicit opt-in'

    $r = Invoke-Case 'speech' @('ok') @('notify', 'hello') @{ FAKE_TTS_FAIL = '1' }
    Assert-True ($r.Exit -eq 5 -and $r.Err -match 'did NOT hear') 'TTS failure is loud for notify' "exit=$($r.Exit) err=[$($r.Err)]"
    $r = Invoke-Case 'speech' @('what did you say') @('speak', 'hello') @{ FAKE_TTS_FAIL = '1' }
    Assert-True ($r.Exit -eq 5 -and (Get-Out $r) -eq 'what did you say' -and $r.Err -match 'did NOT hear your reply') 'TTS failure in speak still listens and warns'

    $long = (1..30 | ForEach-Object { "Sentence number $_ explains one more detail of the change." }) -join ' '
    $r = Invoke-Case 'speech' @('ok') @('notify', $long)
    Assert-True ($r.TtsCalls.Count -ge 4 -and (@($r.TtsCalls | ForEach-Object { ($_ -split "`t")[0].Length }) | Measure-Object -Maximum).Maximum -le 350) 'long replies are chunked at sentence boundaries' "chunks=$($r.TtsCalls.Count)"

    $tricky = "/talk It'\''s `"fine`" `$HOME 100% caf$([char]0xE9) & done"
    $r = Invoke-Case 'speech' @('next') @('speak', "'$tricky'") -ViaBridge
    $expected = "/talk It's `"fine`" `$HOME 100% caf$([char]0xE9) & done"
    $spoken = if ($r.TtsCalls.Count -gt 0) { ($r.TtsCalls[0] -split "`t")[0] } else { '' }
    Assert-True ($r.Exit -eq 0 -and $spoken -eq $expected -and (Get-Out $r) -eq 'next') 'Git Bash bridge passes quotes, slashes, $ and accents unchanged' "spoken=[$spoken] exit=$($r.Exit) err=[$($r.Err)]"
    $r = Invoke-Case 'speech' @('ok') @('notify', "'-5 degrees outside.'") -ViaBridge
    $spoken = if ($r.TtsCalls.Count -gt 0) { ($r.TtsCalls[0] -split "`t")[0] } else { '' }
    Assert-True ($r.Exit -eq 0 -and $spoken -eq '-5 degrees outside.') 'reply text starting with a dash is spoken, not parsed as a parameter' "spoken=[$spoken] err=[$($r.Err)]"
    $r = Invoke-Case 'speech' @('after pipe') @('speak', '-') -ViaBridge -Stdin "Line one. It's piped."
    $spoken = if ($r.TtsCalls.Count -gt 0) { ($r.TtsCalls[0] -split "`t")[0] } else { '' }
    Assert-True ($r.Exit -eq 0 -and $spoken -eq "Line one. It's piped." -and (Get-Out $r) -eq 'after pipe') 'bridge reads reply text from stdin' "spoken=[$spoken] err=[$($r.Err)]"
    $r = Invoke-Case 'speech' @('x') @('status') -ViaBridge
    Assert-True ($r.Exit -eq 0 -and ([regex]::Matches($r.Out, 'RUNNING')).Count -eq 2 -and $r.Out -match 'Privacy: local only') 'bridge status shows services and privacy mode' "out=[$($r.Out)]"
    $r = Invoke-Case 'speech' @('x') @('bogus') -ViaBridge
    Assert-True ($r.Exit -eq 2) 'bridge rejects unknown commands'

    $logs = @(Get-ChildItem (Join-Path (Join-Path $Sandbox 'localappdata') 'LifeOS\voice\logs') -Filter 'turns-*.jsonl')
    $logText = if ($logs.Count) { Get-Content $logs[0].FullName -Raw } else { '' }
    Assert-True ($logText -match '"outcome":"turn"' -and $logText -match '"recorder_ready_ms"' -and $logText -notmatch 'hello world|third time lucky') 'turn log keeps timings, never the words'

    # Installer: skills + settings.json merge, run twice for idempotency.
    Write-Host 'Installer tests' -ForegroundColor Cyan
    $home2 = Join-Path $Sandbox 'home two'
    $fakeRuntime = Join-Path $home2 '.config\opencode/skills\talk'
    $settingsFile = Join-Path $home2 '.claude\settings.json'
    New-Item -ItemType Directory -Force -Path $fakeRuntime, (Split-Path $settingsFile -Parent) | Out-Null
    Set-Content (Join-Path $fakeRuntime 'talk.ps1') '# fake'
    Set-Content (Join-Path $fakeRuntime 'SKILL.md') 'upstream skill'
    '{"model":"opus","permissions":{"allow":["Bash(git status)"],"deny":[]},"env":{"A":"1"}}' | Set-Content $settingsFile
    $saved = @{ USERPROFILE = $env:USERPROFILE; LOCALAPPDATA = $env:LOCALAPPDATA }
    $env:USERPROFILE = $home2; $env:LOCALAPPDATA = Join-Path $home2 'localappdata'
    try {
        foreach ($i in 1, 2) {
            & $Pwsh -NoProfile -File (Join-Path $Root 'Install-VoiceMode.ps1') -SkillsOnly -SkipVerify -Agents 'claudecode,opencode' | Out-Null
            Assert-True ($LASTEXITCODE -eq 0) "installer -SkillsOnly run $i succeeds"
        }
        $settings = Get-Content $settingsFile -Raw | ConvertFrom-Json
        $rule = 'Bash(bash ~/.config/opencode/skills/talk/talk-win.sh *)'
        Assert-True ((@($settings.permissions.allow) -join '|') -eq "Bash(git status)|$rule" -and $settings.model -eq 'opus' -and $settings.env.A -eq '1') 'settings.json keeps existing keys and gains the rule once' (ConvertTo-Json $settings -Compress)
        $bytes = [IO.File]::ReadAllBytes($settingsFile)
        Assert-True (-not ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB)) 'settings.json is written without a BOM'
        $backups = @(Get-ChildItem (Join-Path (Join-Path $home2 'localappdata') 'LifeOS\voice\backups'))
        Assert-True (@($backups | Where-Object Name -like 'claude-settings-*').Count -eq 1 -and @($backups | Where-Object Name -like 'SKILL-opencode-*').Count -eq 1) 'originals are backed up once before changes'
        Assert-True ((Select-String -Path (Join-Path (Join-Path $home2 '.claude\skills\talk') 'SKILL.md') -SimpleMatch 'lifeos-voice-skill' -Quiet)) 'Claude Code receives the Windows talk skill'
        Assert-True (-not ([IO.File]::ReadAllText((Join-Path $fakeRuntime 'talk-win.sh')).Contains("`r"))) 'bridge is installed with LF line endings'

        '{ not json' | Set-Content $settingsFile
        & $Pwsh -NoProfile -File (Join-Path $Root 'Install-VoiceMode.ps1') -SkillsOnly -SkipVerify | Out-Null
        Assert-True ($LASTEXITCODE -eq 0 -and (Get-Content $settingsFile -Raw).Trim() -eq '{ not json') 'invalid settings.json is left untouched'
    } finally {
        $env:USERPROFILE = $saved.USERPROFILE; $env:LOCALAPPDATA = $saved.LOCALAPPDATA
    }
} finally {
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
    Remove-Item -LiteralPath $Sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host ''
if ($failures.Count -gt 0) {
    Write-Host "Voice client tests: $passed passed, $($failures.Count) failed" -ForegroundColor Red
    exit 1
}
Write-Host "Voice client tests: $passed passed" -ForegroundColor Green
exit 0

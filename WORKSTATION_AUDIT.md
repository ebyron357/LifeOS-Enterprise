# Windows AI Development Workstation Audit

## 1. Executive Summary

**This audit did not run on a Windows development workstation.** The execution host is a **Cursor Cloud Agent** container on **Ubuntu 24.04.4 LTS (Linux x86_64)**. Every Windows-specific claim in the prior known-results list was **independently checked and could not be verified here**.

| Area | Verdict |
| --- | --- |
| Overall readiness for a Windows AI + Adobe automation workstation | **BLOCKED** |
| Linux cloud agent coding basics (Git, Node, Python, `gh`) | Present and working on this host |
| Windows system / PowerShell / winget | **Missing** (wrong OS) |
| Adobe Illustrator / Creative Cloud / Acrobat | **Missing** on this host |
| Desktop Cursor / VS Code / Codex CLI | **Missing** as terminal commands; Codex config dir absent |
| GitHub authentication | Authenticated as GitHub account **`cursor`** (integration/cloud principal), **not** `ebyron357` |
| Previously reported Windows versions | **Unable to verify** on this host |

**Tools that are ready (on this Linux cloud host only):** Git 2.43.0, Git LFS 3.7.1, OpenSSH client, GitHub CLI 2.91.0 (HTTPS, logged in as `cursor`), Node.js (PATH resolves to v22.14.0; NVM also has v22.22.2), npm 10.9.7, Corepack 0.34.6, pnpm 10.33.3, Python 3.12.3 + pip 24.0, Rust/Cargo 1.83.0 (optional), OpenJDK 21 (optional).

**Tools that require configuration:** Multiple MCP servers require authentication; Datadog MCP is in error; GitHub token scopes could not be listed; private-repository access could not be proven beyond public repo reads.

**Missing required tools (for the intended Windows Adobe automation environment):** Windows OS, PowerShell 7, winget, Windows Git toolchain matching prior notes, desktop Cursor/VS Code/Codex CLI, Adobe Illustrator production release, Adobe Creative Cloud, Acrobat/Distiller.

**Missing optional tools:** Docker CLI, WSL (N/A on Linux host), Playwright/Pixelmatch as installed globals, monorepo CLIs (turbo/nx/bun).

**Blocking problems:** Wrong operating system for a Windows workstation audit; no Adobe production stack; no PowerShell/winget; Codex CLI not installed/authenticated here; active GitHub identity is not the previously reported human account `ebyron357`.

---

## 2. Audit Scope and Method

| Item | Value |
| --- | --- |
| Audit date/time (UTC) | `2026-07-24T05:25:04Z` through `2026-07-24T05:26:00Z` |
| Shell used | `/bin/bash` (not Windows PowerShell) |
| Hostname / virt | `cursor` / `docker` (`systemd-detect-virt`) |
| Workspace | `/workspace` (cloned GitHub repo present; not modified for tooling) |
| Cloud run | Cursor Cloud Agent run `bc-019f9295-4059-71f7-8727-8fbb471cb1bc` |

### Read-only commands used (representative)

- `uname -a`, `cat /etc/os-release`, `whoami`, `id`, `date -u`, `echo $PATH`
- `git --version`, `git lfs version`, `git config --global --get …`, `git remote -v` (token redacted in notes)
- `gh --version`, `gh auth status` (token redacted), `gh api …`, `gh repo view/list`
- `ssh -V`, `node`/`npm`/`corepack`/`pnpm`/`python3`/`pip3`/`rustc`/`cargo`/`java` version checks
- `command -v` / existence checks for `pwsh`, `powershell`, `winget`, `docker`, `wsl`, `cursor`, `code`, `codex`, `dotnet`
- MCP catalog via Cursor MCP discovery (server status only; no secret values)
- Path probes for Adobe under `/mnt/c/Program Files/Adobe` and `/opt/adobe`

### Checks intentionally skipped

- Any install/uninstall/upgrade (`winget install`, `npm i -g`, package manager updates)
- Git config writes, credential writes, `gh auth login/logout`, PATH edits, shell profile edits
- Opening Adobe apps or Illustrator documents
- Cloning additional repositories, creating branches for project setup, commits/pushes for implementation
- Printing authentication files, tokens, cookies, or API key values
- Interactive sudo password prompts (only non-interactive `sudo -n true` used)

### Limitations

1. **Host mismatch:** This environment is Linux cloud infrastructure, not the local Windows workstation described in the audit brief.
2. **Prior Windows results cannot be confirmed or denied** for the physical/desktop machine from here.
3. GitHub API `user` endpoint returned **403** for this integration token, so **token scopes could not be enumerated**.
4. Private-repo capability was only probed via public repository access; no private-repo success/failure pair was available without guessing private names.
5. Desktop app versions (Cursor GUI, VS Code GUI, Adobe) are not inspectable without a Windows filesystem or WMI/registry access.
6. Codex authentication files were not present; no login state to inspect.

---

## 3. System Environment

| Component | Status | Version or setting | Evidence | Action required |
| --- | --- | --- | --- | --- |
| OS family | **Installed and working** (Linux, not Windows) | Ubuntu 24.04.4 LTS (`noble`) | `/etc/os-release`; `uname -a` → `Linux cursor 6.12.94+ … x86_64` | Re-run audit on Windows host |
| Windows edition | **Missing** | N/A | No Windows kernel; no `winver` | Required for stated workstation |
| Windows version / build | **Unable to verify** / **Missing** | N/A | Wrong OS | Audit Windows machine directly |
| Architecture | **Installed and working** | `x86_64` / `amd64` | `uname -m`; `dpkg --print-architecture` | None for Linux host |
| Current username | **Installed and working** | `ubuntu` (uid 1000) | `whoami`; `id` | None |
| User home | **Installed and working** | `/home/ubuntu` | `$HOME` | None |
| Current shell | **Installed and working** | `/bin/bash` | `$SHELL`; `/bin/bash` present | Use PowerShell 7 on Windows target |
| Elevated session | **Unable to verify** (Windows elevation N/A); passwordless sudo **available** | `sudo -n true` → success | Non-interactive sudo check | Avoid elevating for routine work; Windows UAC unknown |
| Execution policy | **Missing** (PowerShell concept) | N/A | `pwsh`/`powershell` not found | Check on Windows with `Get-ExecutionPolicy -List` |
| Windows PowerShell 5.1 | **Missing** | N/A | `powershell` not found | Optional on Windows; verify there |
| PowerShell 7 | **Missing** | N/A | `pwsh` not found | Required for proposed Windows standard |
| winget | **Missing** | N/A | `winget` not found | Required for Windows package ops |
| Git Bash | **Missing** as named Windows Git Bash | Bash exists as system `/bin/bash` | Linux bash ≠ Git for Windows Bash | Verify on Windows |
| Developer PATH (summary) | **Installed and working** with split Node paths | `/usr/local/cargo/bin`, `/exec-daemon`, `~/.nvm/versions/node/v22.22.2/bin`, `/usr/local/bin`, `/usr/bin` | `$PATH` summarized | Resolve dual Node path on this host if used for JS work |
| Virtualization | **Installed and working** | Docker container | `systemd-detect-virt` → `docker` | Expected for cloud agent |

---

## 4. Git and GitHub

| Component | Status | Version or setting | Evidence | Action required |
| --- | --- | --- | --- | --- |
| Git | **Installed and working** | `git version 2.43.0` (Linux) | `git --version` | Prior Windows `2.49.0.windows.1` **not verified** |
| Git LFS | **Installed and working** | `git-lfs/3.7.1` (linux amd64) | `git lfs version` | Prior `3.6.1` **not verified** |
| Git Credential Manager | **Missing** (as GCM product) | Only stock helpers: `git-credential`, `cache`, `store` | `ls /usr/lib/git-core/git-credential*`; no GCM package | On Windows, verify GCM separately |
| Credential helper config | **Installed but not configured** (global) | No global `credential.helper` | `git config --global --get credential.helper` empty | Cloud uses embedded HTTPS remote auth; do not treat as durable GCM |
| OpenSSH client | **Installed and working** | OpenSSH_9.6p1 Ubuntu-3ubuntu13.16 | `ssh -V` | Prior Windows OpenSSH 9.5p2 **not verified** |
| GitHub CLI | **Installed and working** | `gh version 2.91.0 (2026-04-22)` | `gh --version` | Prior `2.96.0` **not verified** |
| `gh` authentication | **Authentication verified** (as `cursor`) | Logged in to `github.com` account `cursor`; protocol HTTPS | `gh auth status` (token redacted) | Not the previously reported `ebyron357` account |
| Active GitHub account | **Installed and working** (unexpected identity) | `cursor` | `gh auth status`; `hosts.yml` user key | Confirm whether human account auth is needed on Windows |
| Git protocol | **Installed and working** | HTTPS | `gh auth status` → `Git operations protocol: https` | Matches prior note for protocol only |
| Token scopes | **Unable to verify** | API `GET /user` → HTTP 403 “Resource not accessible by integration” | `gh api -i user` | Enumerate scopes on Windows with human token; do not print token |
| Private repo access | **Unable to verify** | Public repo `ebyron357/LifeOS-Enterprise` readable; `gh repo list ebyron357` returned public repos only | `gh repo view` / `gh repo list` | Test a known private repo on the Windows workstation |
| GitHub Actions capability | **Partial / Unable to verify** fully | Can read workflows on public repo (`total_count: 8`) | `gh api repos/ebyron357/LifeOS-Enterprise/actions/workflows` | `workflow` scope unconfirmed for this token |
| Global user.name | **Installed and working** (cloud identity) | `Cursor Agent` | `git config --global --get user.name` | Not a personal workstation identity |
| Global user.email | **Installed and working** (cloud identity) | `cursoragent@cursor.com` | `git config --global --get user.email` | Reset/verify on Windows personal profile |
| `init.defaultBranch` | **Installed but not configured** (global unset) | Unset globally; remote HEAD is `main` | Global get empty; `origin/HEAD -> origin/main` | Prior “default branch main” only confirmed for this remotes HEAD |
| `core.autocrlf` | **Installed but not configured** (global unset) | Unset | Global get empty | Prior `true` **not verified** here |
| `pull.rebase` | **Installed but not configured** (global unset) | Unset | Global get empty | Prior `true` **not verified** here |

**Verification of prior known GitHub results:** account `ebyron357`, CLI 2.96.0, GCM 2.6.1, scopes `repo`+`workflow`, and Windows Git 2.49.0 were **not confirmed** on this host.

---

## 5. JavaScript and Python Toolchain

| Component | Status | Version or setting | Evidence | Action required |
| --- | --- | --- | --- | --- |
| Node.js | **Installed and working** with PATH inconsistency | PATH default: **v22.14.0** (`/exec-daemon/node`); NVM: **v22.22.2** | `type -a node`; version probes | Prior Node **24.18.0** **not verified**; align PATH if using this host |
| npm | **Installed and working** | `10.9.7` (NVM Node tree) | `npm --version` | Prior `11.16.0` **not verified** |
| Corepack | **Installed and working** | `0.34.6` | `corepack --version` | Prior `0.35.0` **not verified** |
| pnpm | **Installed and working** | `10.33.3` | `pnpm --version` | Prior `11.17.0` **not verified** |
| Python | **Installed and working** | CPython `3.12.3` (`python3`); `python` command **Missing** | `python3 --version`; `python` not found | Prior `3.13.14` **not verified** |
| pip | **Installed and working** | `pip 24.0` (Python 3.12) | `pip3 --version` / `pip --version` | None for Linux host |
| Rust / Cargo | **Optional** — installed | `rustc`/`cargo` **1.83.0** | Version commands | Do not treat as required |
| Java | **Optional** — installed | OpenJDK **21.0.10** | `java -version` | Do not treat as required |
| .NET SDK | **Optional** — **Missing** | N/A | `dotnet` not found | Install only if a project requires it |
| Yarn | **Optional** — installed | `1.22.22` | `yarn --version` | Prefer pnpm per proposed standard |
| Playwright / Pixelmatch | **Optional** — **Missing** as globals; not in workspace `package.json` deps | No global packages; no `~/.cache/ms-playwright` | `npm list -g`; package.json scan | Add only when visual/UI tests are in scope |
| Monorepo CLIs (turbo/nx/bun) | **Optional** — **Missing** | Not on PATH | `command -v` | Add only if monorepo tooling is adopted |

---

## 6. Cursor, VS Code, and Codex

### Intended operating lanes

| Lane | Role |
| --- | --- |
| **Cursor** | Interactive editing, navigation, local review, focused implementation, and visual inspection |
| **Codex** | Planned implementation tasks, repository-wide changes, testing, documentation, and controlled execution |
| **GitHub** | Shared source of truth, branch history, pull requests, issues, and CI |
| **Human operator** | Approves scope, reviews output, resolves production decisions, and authorizes release |

| Component | Status | Version or setting | Evidence | Action required |
| --- | --- | --- | --- | --- |
| Cursor desktop install/version | **Unable to verify** | N/A on this Linux cloud host | No Windows app inventory; prior `3.12.30` unchecked | Verify on Windows (`cursor --version` / About) |
| `cursor` terminal command | **Missing** | Not on PATH | `command -v cursor` failed | Install/enable shell command on Windows if desired |
| VS Code install/version | **Unable to verify** | N/A | Prior `1.109.5` unchecked | Verify on Windows |
| `code` terminal command | **Missing** | Not on PATH | `command -v code` failed | Optional |
| Codex CLI install/version | **Missing** | Not on PATH; no `~/.codex` | `command -v codex`; `ls ~/.codex` missing | Prior `0.145.0` / logged-in state **not verified** |
| Codex executable location | **Missing** | N/A | Not found | Install on Windows workstation if Codex lane is required |
| Codex PATH availability | **Missing** | N/A | Not found | Add after install |
| Codex authentication | **Unable to verify** / effectively **Missing** here | No config directory | `~/.codex` absent | Authenticate on Windows; never commit auth files |
| Codex configuration directory | **Missing** | `~/.codex` absent | `ls` failure | Create via normal Codex login on target machine |
| MCP servers (this cloud session) | **Mixed** | Ready: `cursor-cloud`, `Render`, `Twilio-docs`. needsAuth: Apify, Composio, Figma, GitLab, Granola, Heygen, Notion, Posthog, Slack, Supabase, Vercel. error: Datadog. loading at check time: Browser, Browserstack, Firebase, Resend | MCP catalog statuses | Authenticate required servers on the operator’s Cursor desktop; fix Datadog |
| MCP auth errors remaining | **Yes** | Multiple `needsAuth`; Datadog `error` | Same | Resolve before relying on those integrations |

Cloud agent note: this run executes **inside** Cursor Cloud (agent identity available via `cursor-cloud` MCP). That is **not** the same as a verified local Cursor `3.12.30` desktop install.

---

## 7. Adobe Production Environment

**Production automation target policy:** Use the **stable Adobe Illustrator production release** for automation. **Do not** use Illustrator Beta as the production automation target.

| Component | Status | Version or setting | Evidence | Action required |
| --- | --- | --- | --- | --- |
| Adobe Illustrator production | **Missing** (on this host) | Not present | No `/mnt/c/Program Files/Adobe`; no Adobe install roots found | Verify Illustrator 2026 on Windows workstation |
| Adobe Illustrator Beta | **Missing** (on this host) | Not present | Same path probes | If present on Windows, exclude from production automation |
| Adobe Creative Cloud | **Missing** (on this host) | Not present | Same | Verify on Windows |
| Adobe Acrobat | **Missing** (on this host) | Not present | Same | Verify on Windows |
| Acrobat Distiller | **Missing** (on this host) | Not present | Same | Verify on Windows |
| Which Illustrator for automation | **Unable to verify** locally; policy stated | Should be **stable Illustrator production** (reported previously as 2026), **not Beta** | Policy + missing local installs | Confirm production build path on Windows before any automation |

No Illustrator documents were opened, modified, or saved.

---

## 8. Security and Authentication

Statuses only — no credential values.

| Item | Status |
| --- | --- |
| GitHub CLI authentication | **Authentication verified** for account `cursor` over HTTPS |
| Active GitHub principal vs prior note | Prior note claimed `ebyron357`; this host uses `cursor` |
| GitHub token scopes | **Unable to verify** (integration 403 on `/user`) |
| Git Credential Manager | **Missing** on this Linux host |
| Codex authentication | **Missing** / **Unable to verify** (no CLI, no `~/.codex`) |
| Environment-variable risks | Low surface in name scan: `GH_TELEMETRY` observed; no obvious `*_TOKEN` / `*_SECRET` names exported in the scanned set. Remote URL auth material exists for Git HTTPS — treat as secret; never commit or paste. |
| MCP secrets | Not printed. Several MCP servers still require interactive auth. |

### Secret-handling recommendations

1. Never print `gh auth token`, GCM stores, Codex auth files, or Adobe credential stores.
2. Prefer HTTPS + credential manager on Windows; avoid embedding tokens in remote URLs in documentation.
3. Keep `.obsidian` / local IDE state and auth caches out of Git.
4. Rotate any token that may have appeared in terminal transcripts during audits.
5. Authenticate MCP servers in the operator’s desktop Cursor session, not by committing secrets.

---

## 9. Missing and Optional Components

### Required Before Implementation

These are required before treating a **Windows AI + Adobe automation** workstation as ready (based on the audit purpose, not on this Linux container):

1. Confirm audit host is the actual **Windows** development workstation (or re-run there).
2. **PowerShell 7** as primary shell; record execution policies.
3. **Git for Windows** + **Git LFS** + **Git Credential Manager** + **GitHub CLI** authenticated as the intended human account.
4. Verify Git defaults (`init.defaultBranch`, `core.autocrlf`, `pull.rebase`) on that machine.
5. **Node.js / npm / Corepack / pnpm** versions on Windows, with a single coherent PATH.
6. **Cursor** (and optionally VS Code) desktop + shell commands as needed.
7. **Codex CLI** installed, on PATH, and authenticated — if Codex is an operating lane.
8. **Adobe Illustrator production release** identified and selected as automation target; Beta excluded.
9. Creative Cloud / Acrobat / Distiller presence verified if PDF/print workflows are in scope.

### Recommended Soon

1. Authenticate required MCP servers on the desktop Cursor used by the human operator.
2. Repair Datadog MCP connection if that integration is needed.
3. Document the single approved Illustrator executable path for automation scripts.
4. Align Node major version across interactive and agent environments to reduce “works here only” drift.
5. Confirm private GitHub repository access and Actions `workflow` scope with a non-destructive `gh` probe.

### Optional Later

| Item | Classification |
| --- | --- |
| Docker Desktop / Engine | **Optional** — missing here; not required without evidence |
| WSL | **Optional** — N/A on this Linux host; optional on Windows |
| Rust / Cargo | **Optional** — present here; not required for Adobe automation |
| Java / OpenJDK | **Optional** — present here |
| .NET SDK | **Optional** — missing |
| Playwright / Pixelmatch | **Optional** — missing; add when visual regression is specified |
| turbo / nx / bun | **Optional** — missing |

---

## 10. Risks and Configuration Concerns

1. **Wrong audit host:** Prior Windows inventory cannot be trusted from this run; copying those versions would falsify the record.
2. **PATH inconsistency:** `node` resolves to `/exec-daemon/node` (v22.14.0) while npm/pnpm come from NVM v22.22.2 — version skew risk.
3. **Multiple PowerShell versions:** Not observable here; on Windows, PS 5.1 vs 7 execution-policy differences remain a likely concern to check locally.
4. **Multiple Illustrator versions:** Not observable here; if both production and Beta exist on Windows, automation must pin the production binary explicitly.
5. **Shell execution-policy differences:** PowerShell policies unknown because PowerShell is missing on this host.
6. **MCP authentication / startup failures:** Many servers `needsAuth`; Datadog in `error`; some still `loading` at check time.
7. **Global tools tied to version-specific directories:** NVM Node path (`…/v22.22.2/bin`) will break if that version is removed.
8. **Upgrade fragility:** Cloud image tool versions diverge from previously reported Windows versions (Git, Node, npm, pnpm, gh, Python).
9. **Git identity mismatch:** Global Git user is `Cursor Agent` / `cursoragent@cursor.com`; GitHub CLI user is `cursor`, not the previously noted personal account.
10. **Credential channel:** Cloud Git remotes may use short-lived embedded tokens — unsuitable as a model for durable workstation credential setup.

---

## 11. Recommended Workstation Standard

Proposed standard (**not applied** by this audit):

| Layer | Standard |
| --- | --- |
| Primary shell | **PowerShell 7** |
| VCS | **Git** + **GitHub CLI** for repository operations |
| JS package manager | **pnpm** (via Corepack or pinned install) |
| Support scripts | **Python** where appropriate |
| Interactive IDE | **Cursor** |
| Controlled implementation agent | **Codex** |
| Adobe production target | **Illustrator stable production release (e.g., 2026)** |
| Adobe Beta | **Excluded** from production automation |
| Source of truth | **GitHub** (branches, PRs, issues, CI) |
| Human gate | Operator approves scope, reviews output, authorizes release |

---

## 12. Final Readiness Decision

# BLOCKED

**Evidence:**

- OS is **Ubuntu 24.04.4 LTS Linux**, not Windows.
- **PowerShell 7**, **winget**, **Windows Git/GCM**, and **Adobe** applications are **missing** on the audited host.
- **Codex CLI** is **missing**; authentication **not verified**.
- Desktop **Cursor/VS Code** versions from the prior list are **unable to verify**.
- GitHub auth is **`cursor`**, not the previously reported **`ebyron357`**, and **scopes are unverified**.
- Therefore this environment is **not ready** to serve as the documented Windows AI development + Adobe automation workstation, and the prior Windows known-results list remains **unverified**.

Cloud-agent coding tools (Git/Node/Python/`gh`) work for generic Linux repo tasks, but that does **not** satisfy the Windows workstation audit purpose.

---

## 13. Next Single Step

**Re-run this same read-only audit on the actual Windows development workstation in PowerShell 7** (not in Cursor Cloud Linux), capturing live `Get-ComputerInfo` / tool version output there before any project setup begins.

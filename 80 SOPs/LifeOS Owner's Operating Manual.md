---
type: sop
status: active
area: LifeOS
created: 2026-08-11
updated: 2026-09-30
review_date: 2026-10-31
tags:
  - life-os
  - operating-manual
  - owner-guide
  - adhd-friendly
  - tbi-friendly
aliases:
  - LifeOS Owner's Operating Manual
  - LifeOS Guidebook
  - LifeOS Operator Manual
---

# LifeOS Owner's Operating Manual

**Version 2.0 • 30 September 2026**
**Replaces:** Version 1.0 (August 2026). This page is the one owner/operator manual. Do not start a second one.

> [!info] How to read this manual
> - Every numbered step is **one action**. Do the step, then read the next one.
> - 🌐 **Browser** means: do this in Chrome, Edge, or Safari.
> - 🪟 **PowerShell** means: do this in Windows PowerShell on your computer.
> - 🗂️ **Obsidian** means: do this in the Obsidian app.
> - 🔑 **Owner credential** means: only you can do this, because it needs your password, secret, or account.
> - "Success looks like" tells you what you should see. If you see something else, stop and use Part H (Troubleshooting).

---

# 1. If You Forget Everything Else

> [!tip] THE ONE RULE
> **LifeOS (the website) tells you what needs you.** Obsidian is where you read and edit notes. GitHub keeps the permanent, official copy of everything. Nothing becomes official until it is merged on GitHub.

## Your normal day in 5 steps

1. 🌐 Open `https://lifeos-enterprise.vercel.app/`.
2. Read the **Today** card and the **Start here** card.
3. Click **Resume work** (or **Resume this project**) and do the one next action you see.
4. If a thought pops up, click **Capture**, type it, and click **Save to inbox**.
5. At the end of the day, open **Journal**, write two sentences, and click **Save**.

## Where things live

| I want to… | Go to | Where exactly |
|---|---|---|
| See what needs me today | LifeOS website | `https://lifeos-enterprise.vercel.app/` |
| Talk or type to LifeOS | LifeOS website | **Ask LifeOS** (`/conversation`) |
| Read or edit a note | Obsidian | Open the `LifeOS-Enterprise` vault |
| See the official copy / changes / checks | GitHub | `https://github.com/ebyron357/LifeOS-Enterprise` |
| See if the website is healthy / roll back | Vercel | `https://vercel.com/tradeiq/lifeos-enterprise` |
| Work a task board (optional) | ClickUp | Space **LIFE-OS-OPERATIONS** |

---

# 2. Part A — Get to LifeOS in a Browser

## A1. Open LifeOS (desktop)

1. 🌐 Open your web browser (Chrome, Edge, or Safari).
2. Click the address bar at the top.
3. Type exactly: `https://lifeos-enterprise.vercel.app/`
4. Press **Enter**.

**Success looks like:** a page titled **LifeOS** with a greeting, a **Today** card, a **Start here** card, and a left menu with **Home, Ask LifeOS, Projects, Today, Capture, Journal, Learning, Files, Automations, Integrations**.

5. Press **Ctrl + D** (Windows) or **Cmd + D** (Mac) to bookmark it. Name the bookmark `LifeOS`.

## A2. Open LifeOS on your phone

1. 🌐 Open Safari (iPhone) or Chrome (Android).
2. Type `https://lifeos-enterprise.vercel.app/` and tap **Go**.
3. At the bottom you will see a dock with **Home, Ask LifeOS, Projects, Capture, More**.
4. Everything not on the dock (Today, Journal, Learning, Files, Automations, Integrations, Settings) is under **More**.
5. Optional: tap the **Share** button → **Add to Home Screen** → **Add**, so LifeOS opens like an app.

## A3. Do I need to log in?

- **No.** LifeOS has no user accounts and no login page. Anyone who has the web address can **read** the pages (private notes are hidden; see Part G2).
- **Changing official records** (saving a checkpoint, promoting a resource, recording a review decision, approving an agent action) asks for the **Owner write secret** 🔑 each time. That secret is never stored in the browser.
- As of 30 September 2026 those write buttons are **switched off on purpose** because the owner secret and storage are not configured yet (see Part K). Reading, capturing, journaling, voice, widgets, and the game all work without it.

---

# 3. Part B — Get to the Project on GitHub

GitHub holds the official copy of every LifeOS file, every change request ("pull request"), and every automatic check.

## B1. Open the repository

1. 🌐 Go to `https://github.com/login` and sign in as **ebyron357** 🔑.
2. Go to `https://github.com/ebyron357/LifeOS-Enterprise`.
3. Near the top-left, find the branch button. It must say **main**. If it says something else, click it and choose **main**.

**Success looks like:** a file list that includes `00 Home`, `app`, `docs`, `scripts`, `README.md`, and `AGENTS.md`.

## B2. See change requests (pull requests)

1. Click the **Pull requests** tab near the top.
2. Each row is one proposed change. Green check ✓ = automatic checks passed. Red ✗ = something failed.
3. Click a row to open it. Click **Files changed** to see exactly what would change.

## B3. See the automatic checks (GitHub Actions)

1. Click the **Actions** tab (or go to `https://github.com/ebyron357/LifeOS-Enterprise/actions`).
2. The checks you care about:
   - **Dashboard CI → Next.js dashboard validation**: lint, typecheck, unit tests, build, browser tests.
   - **Vault Health → PowerShell vault audit**: vault structure, templates, links, metadata.
   - **MAPS Integrity → MAPS structural validation**: map routes and the routine registry (after PR #74 is merged; also runs every day at 06:17 UTC).
3. Click a run → click the job name → read the red step if it failed.

## B4. Merge an approved change (owner only) 🔑

1. Open the pull request.
2. Scroll to the bottom. Confirm every check shows a green ✓.
3. Click **Files changed** and read the changes.
4. Go back to **Conversation**. Click **Merge pull request** → **Confirm merge**.
5. Vercel then publishes the new version to production automatically (1–5 minutes). Check it with Part G4.

> [!warning] A merge is your approval. Agents never merge for you.

---

# 4. Part C — Open the Project on Your Windows Computer

You only need this if you want to run LifeOS locally, run the checks yourself, or edit the vault in Obsidian.

## C1. One-time check: do you have the tools?

1. 🪟 Click **Start**, type `PowerShell`, and click **Windows PowerShell**.
2. Type `git --version` and press **Enter**.
   - **Success:** `git version 2.x.x`. 
   - **If you see** `'git' is not recognized`: install Git from `https://git-scm.com/download/win`, click **Next** on every screen, then close and reopen PowerShell.
3. Type `node --version` and press **Enter**.
   - **Success:** `v22.x.x` (v20 or newer works; CI uses v22).
   - **If you see** `'node' is not recognized` or a version below v20: install the **LTS** version from `https://nodejs.org/`, then close and reopen PowerShell.

## C2. Get the project folder

The official local copy is recorded in `docs/DEPLOYMENT.md` as `C:\Users\Admin\Desktop\LifeOS-Enterprise`.

1. 🪟 In PowerShell, type this and press **Enter**:
   ```powershell
   Test-Path "C:\Users\Admin\Desktop\LifeOS-Enterprise\.git"
   ```
2. If it prints **True**, the folder already exists. Go to step 4.
3. If it prints **False**, type this and press **Enter** (one time only):
   ```powershell
   git clone https://github.com/ebyron357/LifeOS-Enterprise.git "C:\Users\Admin\Desktop\LifeOS-Enterprise"
   ```
   **Success:** the last line says `Resolving deltas: 100%` (or similar) with no `fatal:` line.
4. Move into the folder:
   ```powershell
   cd "C:\Users\Admin\Desktop\LifeOS-Enterprise"
   ```
5. Make sure you are on `main` and up to date:
   ```powershell
   git checkout main
   git pull --ff-only origin main
   ```
   **Success:** `Already up to date.` or a list of updated files.

> [!warning] Do **not** use a folder named `LifeOS-Enterprise-main` from a ZIP download. It is not connected to GitHub and is not the official copy.

## C3. Install and start LifeOS locally

1. 🪟 In PowerShell, inside `C:\Users\Admin\Desktop\LifeOS-Enterprise`, run:
   ```powershell
   npm ci
   ```
   **Success:** ends with `added ### packages` and `found 0 vulnerabilities`. Takes 1–3 minutes.
2. Start the development server:
   ```powershell
   npm run dev
   ```
   **Success:** you see `Local: http://localhost:3000` and `✓ Ready`.
3. 🌐 Open `http://localhost:3000` in your browser. You see the same LifeOS Command Center as production.
4. To stop the server: click the PowerShell window and press **Ctrl + C**. If asked `Terminate batch job (Y/N)?`, type `Y` and press **Enter**.

> [!info] Optional local settings
> To try the voice console or other optional features locally, copy `.env.example` to `.env.local` (`Copy-Item .env.example .env.local`) and edit only the lines you need. Never put real secrets into any file that is committed to GitHub.

---

# 5. Part D — Open the Vault in Obsidian

1. 🪟 In PowerShell, inside the project folder, run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-obsidian.ps1
   ```
   **Success:** ends with `Setup complete.` and `Success target: 00 Home\Life OS.md`.
2. 🗂️ Open Obsidian.
3. On the vault picker, click **Open folder as vault**.
4. Choose `C:\Users\Admin\Desktop\LifeOS-Enterprise` and click **Select Folder** / **Open**.
5. In the left file list, open `00 Home` → `Life OS`.
6. Click **Settings** (gear, bottom-left) → **Core plugins** → turn on **Templates, Daily notes, Properties view, Bases, Bookmarks, Canvas**.
7. Full detail and screenshots of each setting: `docs/OBSIDIAN_SETUP.md`.

**Success looks like:** `Life OS` shows navigation links and tables (Bases) instead of raw text.

---

# 6. Part E — Command Guide

Every command below is run in 🪟 **PowerShell**, inside the project folder. First run:

```powershell
cd "C:\Users\Admin\Desktop\LifeOS-Enterprise"
```

## E1. Install dependencies — `npm ci`

- **What it does:** installs the exact library versions listed in `package-lock.json`.
- **Command:** `npm ci`
- **Success:** `added ### packages` … `found 0 vulnerabilities`.
- **Failure means:** Node/npm missing, no internet, or the lockfile is out of date.
- **Next:** run `node --version` (Part C1). If Node is fine, run `git pull --ff-only origin main` and try again.

## E2. Start locally for development — `npm run dev`

- **What it does:** runs LifeOS on your computer with live reload.
- **Command:** `npm run dev`
- **Success:** `Local: http://localhost:3000` and `✓ Ready`. Open that address in the browser.
- **Failure means:** port 3000 is busy, or `npm ci` was not run.
- **Next:** close other PowerShell windows running LifeOS, or run `npm run dev -- -p 3001` and open `http://localhost:3001`.

## E3. Production build — `npm run build`, then `npm run start`

- **What it does:** builds the same optimized version Vercel builds, then serves it.
- **Commands:** `npm run build` then `npm run start`
- **Success:** build prints a route table (`/`, `/conversation`, `/dashboard`, …) with no `Error`; start prints `Local: http://localhost:3000`.
- **Failure means:** a code error that would also fail on Vercel.
- **Next:** read the first red `Error:` line. Do not merge anything until this passes.

## E4. Code style check — `npm run lint`

- **What it does:** checks the code for mistakes and style problems.
- **Command:** `npm run lint`
- **Success:** only the header line `> eslint . --max-warnings=0` and no other output.
- **Failure means:** a file breaks a lint rule. The output names the file and line.
- **Next:** fix that line, or ask an agent: "Fix the lint error in <file>:<line>. Do not change anything else."

## E5. Type check — `npm run typecheck`

- **What it does:** confirms the TypeScript types fit together.
- **Command:** `npm run typecheck`
- **Success:** only the header line `> tsc --noEmit` and no other output.
- **Failure means:** a type error. The output shows `file(line,col): error TS…`.
- **Next:** fix the named line or ask an agent to fix exactly that error.

## E6. Unit tests — `npm test`

- **What it does:** runs all automated unit tests (Vitest).
- **Command:** `npm test`
- **Success:** `Test Files  NN passed (NN)` and `Tests  NNN passed (NNN)` with **no** `failed`.
- **Failure means:** a behavior changed or broke. The output names the failing test.
- **Next:** read the first `FAIL` block. Do not merge until every test passes.

## E7. Browser tests — `npm run test:e2e`

- **What it does:** opens real browsers (Chromium and WebKit) at 1440, 1024, and 390 pixels and clicks through LifeOS.
- **One-time setup:** `npx playwright install chromium webkit`
- **Command:** `npm run test:e2e` (it builds and starts LifeOS by itself on port 4173).
- **Success:** ends with `NNN passed` and no `failed`.
- **Failure means:** a page or control does not behave as expected. A report is saved in `playwright-report\index.html`.
- **Next:** open the report: `npx playwright show-report`. Click the failed test to see the screenshot and trace.

## E8. Dependency security check — `npm audit --audit-level=high`

- **What it does:** checks installed libraries against known security advisories.
- **Command:** `npm audit --audit-level=high`
- **Success:** `found 0 vulnerabilities`.
- **Failure means:** a library has a high or critical advisory. CI will be red until fixed.
- **Next:** ask an agent: "Patch the npm audit high/critical advisories with the smallest version bump and prove CI passes."

## E9. Vault audit — `audit-vault.ps1`

- **What it does:** checks the Obsidian vault: required folders, templates, Bases, project/business metadata, and every internal link.
- **Command:**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\audit-vault.ps1
  ```
- **Success:** last line `PASS: canonical vault structure, templates, Bases, metadata, links, and embeds are valid.`
- **Failure means:** an `Errors:` list appears (for example a broken `[[link]]` or a project missing `next_action`).
- **Next:** fix each listed item in Obsidian, save, and run the command again until it passes.

## E10. MAPS validation — `validate-maps.ps1` (after PR #74 merges)

- **What it does:** checks `MAPS.md`, the seven `maps/` signposts, and the routine registry `Automations/ROUTINE_REGISTRY.json`.
- **Command:**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\validate-maps.ps1
  ```
- **Success:** `MAPS VALIDATION: PASSED`.
- **Failure means:** `MAPS VALIDATION: FAILED` followed by lines such as `Broken route in maps/…` or `Routine missing required field …`.
- **Next:** fix the named file or link and run again. To save a run record, add `-EvidenceDirectory Automations/runs/maps-integrity-check`.

## E11. Obsidian setup — `setup-obsidian.ps1`

- **What it does:** creates missing vault folders and installs shared Obsidian defaults **without overwriting your settings**.
- **Command:** `powershell -ExecutionPolicy Bypass -File .\scripts\setup-obsidian.ps1`
- **Success:** `Setup complete.`
- **Failure means:** the folder is not a Git clone (`is not a Git repository`).
- **Next:** use the official folder from Part C2. Only add `-Force` if you intentionally want to replace your local shared settings.

## E12. Repair a broken local vault — `repair-local-vault.ps1`

- **What it does:** backs up your `.obsidian` settings to `.local-backups\`, pulls the latest `main` safely, and re-applies the shared defaults.
- **Command:** `powershell -ExecutionPolicy Bypass -File .\scripts\repair-local-vault.ps1`
- **Success:** `Repair complete.` and `Then open: 00 Home\Life OS.md`.
- **Failure means:** `Git pull failed` — you have local edits that conflict with GitHub.
- **Next:** run `git status`. Copy any notes you care about to a safe folder, then ask an agent to reconcile them. Your backup path is printed on screen.

## E13. Portfolio sync dry-run — `npm run portfolio:sync`

- **What it does:** shows (dry-run) how vault projects would map to the GitHub Project board. It does not change anything by default.
- **Command:** `npm run portfolio:sync`
- **Success:** a printed plan with no error.
- **Live mode:** needs a GitHub token with `project` scope 🔑 and `--live --project-id <id>`. Only add `--apply` when you intend to change the board.

## E14. Get the latest official version — `git pull`

- **Command:** `git checkout main` then `git pull --ff-only origin main`
- **Success:** `Already up to date.` or a list of updated files.
- **Failure:** `Not possible to fast-forward` → you have local edits. Run `git status` and ask an agent to reconcile.

## E15. The full pre-merge checklist (run all, in order)

```powershell
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
powershell -ExecutionPolicy Bypass -File .\scripts\audit-vault.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\validate-maps.ps1
```

**Success:** every command succeeds as described above. GitHub runs the same checks on every pull request.

---

# 7. Part F — How to Use LifeOS (Everyday User Guide)

All steps are 🌐 Browser steps at `https://lifeos-enterprise.vercel.app/`.

## F1. Home (Command Center) — `/`

1. Open LifeOS.
2. Read **Today**: your primary mission and critical outcomes.
3. Read **Start here**: the single most important next action.
4. Read **Where was I**: what you were doing, what is waiting, and what an agent can continue.
5. Click **Resume work** to jump into that work.
6. Optional: under **Where was I**, click **Save checkpoint** to save your place as an official record 🔑 (needs the Owner write secret; switched off until Part K is done).

## F2. Navigate the major areas

- Desktop: use the left menu.
- Phone: use the bottom dock; everything else is under **More**.
- Keyboard: press **Ctrl + K** (or click the search/command button) to open the command palette, type a place such as `journal`, and press **Enter**.

## F3. Capture — `/inbox`

1. Click **Capture** (menu) or the capture button.
2. In **Capture type**, pick Note, Task, Idea, Reminder, or Resource.
3. Type your thought.
4. Click **Save to inbox**.

**Success:** the item appears in the **Saved from you** list.
> [!warning] Captures are saved **only in this browser**. To make one permanent, copy it into Obsidian `01 Inbox`, or (for links/resources) use **Promote a resource to the canonical vault** on the same page 🔑.

## F4. Projects — `/projects`

1. Click **Projects**.
2. Each card shows status, priority, next action, and blockers from the official project note.
3. Click **Resume this project** to open its workspace.
4. To change a project's status or next action, use the **Command Board** on **More → Widget workspace**. Changes are *staged* in the browser, then packaged for approval; they only become official through a draft pull request that you merge.

## F5. Today — `/today`

1. Click **Today** (on phone: **More → Today**).
2. Read today's mission, outcomes, the resume package, and the next action.
3. The **LifeOS Game** card shows your level, XP, and streak; click **Open game loop** to play (see F14).

## F6. Journal — `/journal`

1. Click **Journal**.
2. Under **Quick entry**, type in **Today's journal entry**.
3. Click **Save**.
4. See earlier entries under **Recent entries**.
> Journal drafts saved here stay in this browser. Your permanent journal is `70 Journal/Daily` in Obsidian.

## F7. Learning — `/learning`

1. Click **Learning**.
2. Under **Continue learning**, click **Resume this topic** on the topic you want.
3. To add a topic: type it in **Add a learning topic** and click **Add to my queue**.

## F8. Files and resources — `/files`

1. Click **Files**.
2. Type a word into **Find something** and press **Enter** or click **Search**.
3. Click a result to read the note.
4. For a deeper search: **More → Search vault**.
5. To review captured resources: **More → Resource review** (`/resources/review`). Each resource shows its lane (for example Needs decision, Watch, Completed). Recording a decision uses **Stage review decision PR** 🔑.

## F9. Automations — `/automations`

1. Click **Automations**.
2. Read which automations are configured and which are not. LifeOS never shows a fake "connected" state.
3. Registered recurring routines live in `Automations/ROUTINE_REGISTRY.json`; their run evidence is in GitHub **Actions** (Part B3).

## F10. Integrations — `/integrations`

1. Click **Integrations**.
2. Read each service: **Available/Connected** (working) or **Unavailable** with the exact missing setting.
3. As of 30 Sep 2026: LifeOS vault and GitHub health are working; ClickUp, Slack, n8n, Vercel actions, Hermes, Google, and paid voice are not configured (Part K).

## F11. Ask LifeOS (conversation) — `/conversation`

1. Click **Ask LifeOS**.
2. Type a question in the message box, for example `What needs attention?`, and click **Send**.
3. Watch **Agent activity** for what LifeOS is doing. Read-only work runs immediately.
4. If LifeOS proposes a change, you will see **Approve** and **Reject**. Approving requires the Owner write secret 🔑 and is switched off until Part K is done.
5. To stop the agent: click **Pause agent** or **Stop task**.

## F12. Voice controls — on `/conversation`

1. Open **Ask LifeOS**.
2. Read the privacy note: your speech is turned into text by your browser's speech service; LifeOS does not record audio.
3. Click **Start conversation**. When your browser asks for the microphone, click **Allow**.
4. The state label shows **Listening**, **Thinking**, **Speaking**, **Muted**, or **Error** in words.
5. Speak normally. Your words appear in the transcript.
6. To make LifeOS stop talking right away: click **Interrupt assistant**.
7. To stop the microphone: click **Mute microphone**. To turn it back on: **Unmute microphone**.
8. If continuous listening is unreliable, press and hold **Push to talk** while speaking and release when done.
9. To end: click **Stop conversation**.
10. **Voice settings** panel: choose **Voice**, **Locale**, **Recognition language**, **Response style**, **Speed**, and **Pitch**. Click **Preview voice** to hear it. Click **Reset to default** to undo. Settings are remembered in this browser.
11. If something goes wrong (for example the microphone is blocked), click **Recover** / **Resume conversation**. You do not need to reload the page.

> [!info] Today only the free **browser voice** is active. The higher-quality OpenAI voice turns on only after the owner adds a paid key and a TTS secret (Part K).

## F13. Share your screen — on `/conversation`

1. Click **Share screen**.
2. Pick the window or tab in your browser's picker and click **Share**. LifeOS never starts sharing by itself.
3. To stop: click **Stop sharing** (or your browser's **Stop sharing** bar).

## F14. Widgets and customization — **More → Widget workspace** (`/dashboard`)

1. Open **More** → **Widget workspace**.
2. Desktop: drag a widget by its handle to move it; drag the bottom-right corner to resize it.
3. Click the minimize control on a widget to shrink it; click it again to restore it.
4. Click **Widget Library / Customize** to **Show** / **Hide**, **Add widget** / **Remove widget**, or reorder widgets. Click **Close** when done.
5. Phone: widgets become compact cards with **Move up** / **Move down** buttons; use **Widget Library / Customize** to show or hide.
6. If the layout looks wrong: click **Repair layout**. It fixes broken entries and tells you what it repaired.
7. To start over: click **Restore default layout** and confirm.
8. If one widget crashes, only that widget shows an error box with **Retry widget** and **Repair layout**; the rest of the page keeps working.

## F15. Game and progression — **LifeOS Game Loop** widget on `/dashboard`

1. Set your **Alias** and pick an **avatar**.
2. Click **Daily check-in (+20 XP)** once per day to build your streak.
3. Each quest comes from real LifeOS records: main quests from active projects, side quests from your areas (health, learning, growth, money, relationships, service) when a matching note exists, and boss battles from blocked projects.
4. Finish the real work first. Then click **Complete (attest)** and confirm. XP is added **once**; clicking again or refreshing never adds it twice.
5. Boss battles: click **Mark step** on each smaller step. When all steps are done, click **Complete (attest)**.
6. Missed exactly one day? Click **Recover streak (+10 XP)** on the next day to restore it.
7. Click **End day results** to see what you finished, XP earned, streak, level, and achievements.
8. The bar shows progress to the next level (250 XP per level). Messages announce **+XP**, **Level up!**, and **Achievement unlocked**.

## F16. Prompt library — **More → Prompt Intelligence** (`/prompts`)

1. Type what you are trying to do into **Find a prompt**.
2. Click **Open prompt** and copy it.
3. Official prompts live in `40 Resources/Prompts/`. Edit them in Obsidian.

## F17. Recovery and reset (what is safe)

| Problem | Safe fix | What it deletes |
|---|---|---|
| Widget layout messy | **Repair layout** | Nothing you need; fixes broken entries |
| Want default layout | **Restore default layout** → confirm | Your layout only (in this browser) |
| Game looks wrong | **Repair state** | Nothing you need; fixes broken entries |
| Start the game over | **Reset game** → confirm | Game progress in this browser (a backup copy is kept in the browser first) |
| Voice stuck | **Recover** / **Stop conversation** then **Start conversation** | Nothing |
| Page error box | **Try again** | Nothing |
| Everything in this browser is weird | Browser settings → clear site data for `lifeos-enterprise.vercel.app` | Browser-only captures, journal drafts, layout, game, voice settings. Official vault notes are **not** affected. |

---

# 8. Part G — Owner / Admin Guide

## G1. Admin places (bookmark these)

| Place | URL | Needs |
|---|---|---|
| Production website | `https://lifeos-enterprise.vercel.app/` | Nothing |
| GitHub repository | `https://github.com/ebyron357/LifeOS-Enterprise` | GitHub account **ebyron357** 🔑 |
| GitHub checks | `https://github.com/ebyron357/LifeOS-Enterprise/actions` | same |
| Vercel project | `https://vercel.com/tradeiq/lifeos-enterprise` | Vercel team **tradeiq** member 🔑 |
| Vercel deployments | `https://vercel.com/tradeiq/lifeos-enterprise/deployments` | same |
| Vercel environment variables | `https://vercel.com/tradeiq/lifeos-enterprise/settings/environment-variables` | same |
| Vercel logs | `https://vercel.com/tradeiq/lifeos-enterprise/logs` | same |

## G2. Roles and access

| Role | Who | Can do | How they get in |
|---|---|---|---|
| Viewer | Anyone with the URL | Read non-private vault pages; use browser-only capture, journal drafts, widgets, game, voice | Open the URL. No login. |
| Owner (web) | You | Everything a viewer can, plus approve writes and stage draft PRs | Type the **Owner write secret** 🔑 into the write form each time |
| Repository owner | GitHub **ebyron357** | Merge pull requests (= final approval), change GitHub settings | GitHub login 🔑 |
| Deployment admin | Vercel team **tradeiq** | Redeploy, roll back, change environment variables, read logs | Vercel login 🔑 |

**Privacy:** notes with `private: true`, `publish: false`, or `web_visibility: private`, and folders named `private`, are never shown on the website. Code folders and secrets files are never shown. Full rules: `lib/vault/exclusions.ts` and `docs/WEB_VAULT_PORTAL.md`.
**If you want the whole website private:** that is an owner decision. Vercel offers Deployment Protection (password / Vercel login) under **Settings → Deployment Protection**; some options are paid plans. LifeOS works either way.

## G3. Login and password recovery

- **LifeOS website:** no passwords. Nothing to recover.
- **Owner write secret lost or leaked** 🔑:
  1. Make a new long random secret (for example in PowerShell: `[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")`).
  2. Vercel → **Settings → Environment Variables** → find `LIFEOS_WRITE_SECRET` → **Edit** → paste the new value → **Save**.
  3. Redeploy (G5). The old secret stops working immediately after the new deployment is live.
- **GitHub password:** `https://github.com/password_reset`.
- **Vercel login:** `https://vercel.com/login` (use the same method you signed up with; GitHub or email).

## G4. Verify what is live (do this at the start of every check)

1. 🌐 Open `https://vercel.com/tradeiq/lifeos-enterprise/deployments`.
2. Find the row marked **Production** and **Ready** at the top.
3. Click it. Write down the **Deployment ID** (starts with `dpl_`) and the **commit** (7+ characters).
4. 🌐 Open `https://github.com/ebyron357/LifeOS-Enterprise/commits/main`. The top commit should match the Production commit. If not, a deployment is still building or failed — wait 5 minutes and check again.
5. 🌐 Open these health addresses. Each must show `"ok":true`:
   - `https://lifeos-enterprise.vercel.app/api/lifeos/agent/session` — lists every tool and says which are available
   - `https://lifeos-enterprise.vercel.app/api/lifeos/voice/session` — shows the active voice provider
   - `https://lifeos-enterprise.vercel.app/api/lifeos/resource-intake` — `"configured":true` only after Part K step 1
   - `https://lifeos-enterprise.vercel.app/api/lifeos/continuity/checkpoint` — same
   - `https://lifeos-enterprise.vercel.app/api/lifeos/change-plan` — `"directMainWrites":false` must always be false

Evidence recorded on 30 Sep 2026: production deployment `dpl_CxF6WThSCMDdrftveicnzcN3FCC6` was **Ready** at commit `21b921c` (same as `main`); the health addresses above returned 200; Vercel reported **no runtime errors in the previous 7 days**.

## G5. Restart / redeploy safely

LifeOS runs on Vercel serverless. There is no server to "restart". A redeploy is the restart.

1. Open Vercel **Deployments**.
2. On the current **Production** row, click **⋯** (three dots).
3. Click **Redeploy** → leave **Use existing Build Cache** as is → click **Redeploy**.
4. Wait until the new row says **Ready** (1–5 minutes).
5. Repeat G4 steps 4–5.

You must redeploy after changing any environment variable.

## G6. Roll back

1. Open Vercel **Deployments**.
2. Find the last deployment that you know worked (marked **Ready**, target **Production**).
3. Click **⋯** → **Instant Rollback** (may be labelled **Rollback** or **Promote to Production**).
4. Confirm.
5. Check G4 again and write the deployment ID in your notes.
6. Then fix the cause with a normal pull request (a "revert" PR). Never rewrite `main` history.

## G7. Check logs and failure state

1. Vercel project → **Logs** tab. Filter **Level: Error** and time **Last 24 hours**.
2. Vercel project → **Observability** (or **Runtime errors**) for grouped errors.
3. GitHub → **Actions** for failed checks (Part B3).
4. Website → **Integrations** for which services are missing settings.

## G8. Validate integrations

1. Open `/integrations`. Each unconfigured service lists the exact missing setting.
2. Open `https://lifeos-enterprise.vercel.app/api/lifeos/agent/session`. Each tool shows `"availability":"available"` or `"unavailable"` with `missingRequirements`.
3. After adding settings (Part K), redeploy (G5), then reload both pages. A service only counts as connected when it shows available here **and** a real test action succeeds.

## G9. Backup, export, and recovery

- **The vault is backed up by Git.** Every clone (your computer, GitHub) is a full copy with history.
- **Export everything:** GitHub → **Code** (green button) → **Download ZIP**, or `git clone` (Part C2).
- **Recover a deleted or changed note:** GitHub → open the file → **History** → pick the old version → copy it back through a pull request, or in PowerShell: `git log -- "<path>"` then `git checkout <commit> -- "<path>"`.
- **Browser-only data is NOT backed up**: Capture items, journal drafts, widget layout, game progress, voice settings. Copy anything important into Obsidian.
- **Local Obsidian settings** are backed up by `repair-local-vault.ps1` into `.local-backups\`.

## G10. Environment settings reference

The full list is in `docs/DEPLOYMENT.md` and `.env.example`. Rules:
- Put secrets only in Vercel → **Settings → Environment Variables** (Production), never in files or chat.
- After any change, redeploy (G5).
- Leave `LIFEOS_APPROVAL_STORE` empty in production.

---

# 9. Part H — Troubleshooting

| Symptom | Likely cause | Look here | Fix |
|---|---|---|---|
| Website does not load | Failed or building deployment | Vercel **Deployments** | Wait 5 min; if last deploy **Error**, roll back (G6) |
| Page shows an error box | A page crashed in the browser | The error text on screen | Click **Try again**; if it repeats, note the text and check Vercel **Logs** |
| One widget shows an error box | That widget crashed | Widget error text | Click **Retry widget**, then **Repair layout** |
| Widgets overlap / missing | Old or broken layout saved in the browser | Widget workspace | **Repair layout**, then **Restore default layout** if needed |
| XP did not go up | Quest not attested, or already counted | Game widget message | Click **Complete (attest)** and confirm; XP never counts twice by design |
| Streak reset | Missed more than one day | Game widget | Streak recovery only covers a single missed day |
| Microphone does nothing | Permission blocked, or browser has no speech recognition (Firefox) | Browser address-bar lock icon → Site settings | Allow microphone; use Chrome/Edge/Safari; click **Recover** |
| LifeOS voice sounds robotic | Browser voice fallback in use | Voice settings provider line | Expected until paid TTS is configured (Part K) |
| "Owner write secret" button disabled | Writes not configured | `/api/lifeos/resource-intake` shows `"configured":false` | Complete Part K step 1 |
| Approve fails with "unavailable" | Durable approval storage missing | `/api/lifeos/agent/session` → `missingRequirements` | Complete Part K step 2 |
| Integration says unavailable | Its credentials are missing | `/integrations` | Add the named settings (Part K), redeploy |
| GitHub check red on a PR | A test, lint, audit, or build failed | PR → **Checks** → failed step | Fix the first error; never merge red |
| `npm audit` fails in CI | New security advisory in a library | Actions log `npm audit` step | Patch version bump (E8) |
| Vault audit fails | Broken link or missing metadata | Output `Errors:` list | Fix the note; rerun E9 |
| `git pull` refuses | Local edits conflict | `git status` | Save your notes elsewhere; ask an agent to reconcile |
| Obsidian shows raw code instead of tables | Bases plugin off | Obsidian **Settings → Core plugins** | Turn on **Bases** |

---

# 10. Part I — Ownership and Dependency Register

| Dependency | What LifeOS uses it for | Owner | Status (30 Sep 2026) | If it fails |
|---|---|---|---|---|
| GitHub repo `ebyron357/LifeOS-Enterprise` | Official copy, PRs, checks | Owner (ebyron357) | Working | Nothing official can change; website keeps running |
| GitHub Actions | CI checks and the daily MAPS routine | Owner | Working | PRs cannot be verified |
| Vercel project `tradeiq/lifeos-enterprise` | Hosting production website | Owner (Vercel team tradeiq) | Working, Ready | Roll back (G6) |
| Obsidian (local app) | Reading/editing the vault | Owner | Local only | Website still works |
| Browser speech (Web Speech API) | Free voice in/out | Browser vendor | Working (browser-dependent) | Type instead of speaking |
| OpenAI TTS | Higher-quality voice | Owner 🔑 (paid) | Not configured | Browser voice is used |
| Upstash Redis | Durable approval storage | Owner 🔑 | Not configured | All approvals/writes fail closed (safe) |
| GitHub fine-grained token | Draft-PR writes from the website | Owner 🔑 | Not configured | Writes fail closed (safe) |
| ClickUp / Slack / n8n / Google / Hermes | Optional actions | Owner 🔑 | Not configured | Shown as unavailable |
| ClickUp space LIFE-OS-OPERATIONS | Your optional task board | Owner | Used directly by you | Use LifeOS Home instead |

---

# 11. Part J — Final Acceptance

The full, signable checklist is `docs/OWNER_ACCEPTANCE_WORKBOOK.md`. Use it. The short version:

1. Do G4 and write down the production deployment ID and commit.
2. On desktop, do F1–F11 and confirm each "Success looks like".
3. On desktop, do F12 with a real microphone: start, speak, interrupt, mute/unmute, change voice + speed, preview, reload and confirm settings stayed.
4. On desktop, do F13 (share screen, stop sharing, deny once).
5. On desktop, do F14 and F15 (drag, resize, hide/show, repair, complete one real quest, check-in, end day).
6. On your phone, repeat F1, F3, F12 (steps 3–7), and F14 step 5.
7. Confirm a write button fails safely while writes are off (Part K not done): it must refuse, not pretend.
8. If you completed Part K, do workbook Section G (approvals and draft PRs).
9. Fill in the workbook sign-off and mark **READY TO ACCEPT**, **BLOCKED**, or **NOT READY**.

---

# 12. Part K — Owner-Only Setup (credentials) 🔑

Only you can do these. LifeOS is safe and usable without them; they switch on optional capabilities.

**Step 1 — Turn on governed writes (checkpoints, resource intake, review decisions, change plans)**
1. 🌐 Create a GitHub fine-grained token: `https://github.com/settings/personal-access-tokens/new` → **Repository access: Only select repositories → LifeOS-Enterprise** → **Permissions: Contents: Read and write; Pull requests: Read and write** → **Generate token**. Copy it.
2. 🌐 Vercel → **Settings → Environment Variables** → **Add** (Production):
   - `LIFEOS_GITHUB_TOKEN` = the token
   - `LIFEOS_WRITE_SECRET` = a new long random secret (G3 step 1). Save it in your password manager.
   - `LIFEOS_ALLOWED_ORIGIN` = `https://lifeos-enterprise.vercel.app`
   - Confirm `LIFEOS_WRITE_ENABLED` = `true`
3. Redeploy (G5).
4. **Success:** `https://lifeos-enterprise.vercel.app/api/lifeos/resource-intake` shows `"configured":true`.

**Step 2 — Turn on durable approvals (agent approvals, ClickUp/Slack/n8n/Vercel actions)**
1. 🌐 Create a free or paid Upstash Redis database at `https://console.upstash.com/` → **Create Database** → open it → copy **REST URL** and **REST Token**.
2. Vercel → add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (Production).
3. Redeploy (G5).
4. **Success:** `/api/lifeos/agent/session` no longer lists `UPSTASH_REDIS_REST_URL` under `missingRequirements`.

**Step 3 — Optional paid voice (OpenAI)**
1. 🌐 Create an API key at `https://platform.openai.com/api-keys` (billing decision 🔑).
2. Vercel → add `OPENAI_API_KEY` and `LIFEOS_TTS_SECRET` (or rely on `LIFEOS_WRITE_SECRET`).
3. Redeploy. **Success:** `/api/lifeos/voice/session` shows OpenAI `"configured":true`.

**Step 4 — Optional tools** (only if you want them): `CLICKUP_API_TOKEN` + `CLICKUP_LIST_ID`; `SLACK_BOT_TOKEN` + `SLACK_DEFAULT_CHANNEL`; `N8N_WEBHOOK_URL`; `VERCEL_TOKEN` + `VERCEL_PROJECT_ID`. Redeploy after adding.

---

# 13. Daily and Weekly Operating Cards

## Daily start — 5 minutes
- [ ] Open LifeOS Home.
- [ ] Read **Start here**.
- [ ] Click **Resume work**.
- [ ] Do the one next action.
- [ ] Optional: **Daily check-in** in the game.

## During work
- [ ] If blocked, write the blocker in the project note (Obsidian) or ask LifeOS to stage it.
- [ ] New idea? **Capture** it; do not switch tasks.

## Daily close
- [ ] Journal: two sentences → **Save**.
- [ ] Game: **End day results** (optional).
- [ ] Copy any important browser captures into Obsidian `01 Inbox`.

## Weekly reset
- [ ] Obsidian → `Dashboards/Weekly Review.md`.
- [ ] Process `01 Inbox`.
- [ ] Review blocked and waiting projects on `/projects`.
- [ ] Review open pull requests on GitHub; merge only green, understood ones.
- [ ] Check GitHub **Actions** for any red daily MAPS run.

---

# 14. Prompt Library

Canonical Prompt Intelligence records live under `40 Resources/Prompts/`:

- [[ClickUp Update One Task]]
- [[n8n Controlled Proof]]
- [[GitHub Read-Only Audit]]
- [[Vercel Production Closeout]]

The copy blocks below remain for operator use. They are not a second prompt system.

## Ask an agent to fix one failing check

```text
Repository: ebyron357/LifeOS-Enterprise. Branch: <branch>.
The check "<check name>" failed on commit <sha>.
Reproduce it locally, fix the root cause with the smallest change,
rerun lint, typecheck, tests, build, vault audit, and MAPS validation,
push to the same branch, and report the new commit SHA and results.
Do not skip or disable tests. Do not merge.
```

## ClickUp — update one task

```text
Update the existing task: [TASK NAME]
Do not create a new task.
Current verified state: [FACTS]
Set status to: [STATUS]
Next Action: [ONE ACTION]
Add evidence: [LINK/RESULT]
Do not change any other task or structure.
```

## Read-only audit

```text
Perform a READ-ONLY audit.
Do not modify files.
Return exact file paths and evidence.
Mark unknowns UNKNOWN.
Do not guess.
Give me one next action.
```

---

# 15. Keep the System Clean

- One LifeOS, one Command Center (`/`), one manual (this page), one status document (`docs/CANONICAL_LIVE_STATUS.md`).
- Do not create a new repository, dashboard, or command center to solve a navigation problem.
- Do not treat an open pull request as finished work.
- Do not automate an unstable workflow.
- Do not delete legacy folders until their notes are reviewed.
- Never paste secrets into chat, notes, screenshots, or ClickUp.

---

# 16. Plain-English Glossary

| Term | Meaning |
|---|---|
| Vault | Your Obsidian notes folder. It is also the GitHub repository. |
| Repository (repo) | The GitHub project that holds all files and history. |
| Branch | A safe copy for making changes before they join `main`. |
| `main` | The official version. |
| Pull request (PR) | A request to add a branch's changes to `main`. Merging it is approval. |
| Draft PR | A pull request that is not ready to merge yet; LifeOS writes only these. |
| CI / checks | Automatic tests that run on every PR. |
| Deployment | A published version of the website on Vercel. |
| Rollback | Switching the website back to an earlier deployment. |
| Environment variable | A setting (often a secret) stored in Vercel, not in files. |
| Fail closed | When a setting is missing, the action is refused instead of guessed. |
| Attest | You confirm you really did the work before XP is given. |
| Browser-local | Saved only in this browser on this device. |

---

# 17. One-Page Emergency Card

> [!tip] I AM OVERLOADED. WHAT DO I DO?
> 1. Stop clicking.
> 2. Open `https://lifeos-enterprise.vercel.app/`.
> 3. Read **Start here**.
> 4. Do only that one action.
> 5. If the website is broken: Vercel → Deployments → roll back (G6).
> 6. If you are lost: open this manual, Part H.

## The reset phrase

> **"What is the ONE next action?"**

---

# 18. Source Notes and Canonical References

- Governing status: `docs/CANONICAL_LIVE_STATUS.md`
- Owner acceptance workbook: `docs/OWNER_ACCEPTANCE_WORKBOOK.md`
- Deployment and environment: `docs/DEPLOYMENT.md`, `.env.example`
- Obsidian setup: `docs/OBSIDIAN_SETUP.md`
- Voice: `docs/VOICE_ARCHITECTURE.md`
- Resource Intelligence: `docs/RESOURCE_INTELLIGENCE.md`
- Web portal and privacy: `docs/WEB_VAULT_PORTAL.md`
- Platform blueprint: `docs/MASTER_PLATFORM_OPERATING_BLUEPRINT.md`
- Agent rules: `AGENTS.md`

When a technical runbook and this manual differ on implementation detail, the runbook wins for the technical step, and this manual must be updated.

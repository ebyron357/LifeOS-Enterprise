# Obsidian Life OS Setup

This guide opens the repository as a working Obsidian vault without overwriting local settings.

## Success State

Setup is complete when:

- Obsidian opens `00 Home/Life OS.md`.
- New notes default to `01 Inbox`.
- Daily notes are created in `70 Journal/Daily` using `99 Templates/Daily Note.md`.
- Templates come from `99 Templates`.
- `.base` files in `00 Home/Bases` open as tables.
- Existing legacy notes remain available.

# Desktop Setup

## 1. Get the Repository

Clone or download `ebyron357/LifeOS-Enterprise` to:

```text
C:\Users\<YOUR-WINDOWS-USERNAME>\Documents\GitHub\LifeOS-Enterprise
```

## 2. Run the Safe Setup Script

Open PowerShell in the repository folder and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-obsidian.ps1
```

Success looks like:

```text
PASS: canonical folders exist
PASS: shared settings installed or existing settings preserved
Open this folder as an Obsidian vault: ...\LifeOS-Enterprise
```

The script does not overwrite an existing local setting unless `-Force` is explicitly supplied.

## 3. Open the Vault

1. Open Obsidian.
2. On the vault picker, click **Open folder as vault**.
3. Select the `LifeOS-Enterprise` repository folder.
4. Click **Open**.
5. Open `00 Home/Life OS.md`.

Success: the Life OS dashboard displays navigation links and embedded Base views.

## 4. Enable Core Plugins

1. Click **Settings** in the lower-left corner.
2. Click **Core plugins**.
3. Turn on:
   - Templates
   - Daily notes
   - Properties view
   - Bases
   - Bookmarks
   - Canvas

Success: **Bases** appears in the command palette and `.base` files render as views instead of plain text.

## 5. Configure Templates

1. In **Settings**, click **Templates**.
2. Set **Template folder location** to:

```text
99 Templates
```

3. Set date format to `YYYY-MM-DD`.
4. Set time format to `HH:mm`.

Success: run **Templates: Insert template** and confirm the canonical templates appear.

## 6. Configure Daily Notes

1. In **Settings**, click **Daily notes**.
2. Set **New file location** to:

```text
70 Journal/Daily
```

3. Set **Date format** to:

```text
YYYY-MM-DD
```

4. Set **Template file location** to:

```text
99 Templates/Daily Note
```

Success: click **Open today's daily note**. A dated note is created under `70 Journal/Daily` with the Daily Note sections.

## 7. Configure Files and Links

1. In **Settings**, click **Files and links**.
2. Set **Default location for new notes** to **In the folder specified below**.
3. Set the folder to `01 Inbox`.
4. Turn on **Automatically update internal links**.
5. Turn on **Detect all file extensions**.
6. Keep Wikilinks enabled.
7. Set attachment folder to `40 Resources/Attachments`.

Success: create a blank note and confirm it appears in `01 Inbox`.

## 8. Pin the Main Dashboard

1. Open `00 Home/Life OS.md`.
2. Open the note menu.
3. Choose **Bookmark**.
4. Bookmark `01 Inbox/Inbox.md` and `00 Home/Bases/Active Projects.base` as well.

Success: the three entries are visible in Bookmarks.

## 9. Validate the Vault

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\audit-vault.ps1
```

Success:

```text
PASS: canonical vault structure, templates, Bases, and required metadata are valid.
```

# Mobile Setup

Use Obsidian Sync, Git-based sync, or another file-sync method that preserves Markdown and `.base` files.

1. Install Obsidian on the phone or tablet.
2. Open the synced `LifeOS-Enterprise` folder as a vault.
3. Open **Settings → Core plugins**.
4. Enable Templates, Daily notes, Properties view, Bases, Bookmarks, and Canvas.
5. Confirm Templates points to `99 Templates`.
6. Confirm Daily notes points to `70 Journal/Daily` and uses `99 Templates/Daily Note`.
7. Open `00 Home/Life OS.md`.
8. Add the dashboard to Bookmarks.

Success: the dashboard opens, Base views render, and today’s daily note can be created from the mobile ribbon or command palette.

# Community Plugin Policy

Do not install community plugins during foundation setup.

Add only when a verified limitation appears:

- **Templater** — dynamic file names, prompts, or conditional templates.
- **QuickAdd** — repeated capture commands.
- **Tasks** — recurring tasks and vault-wide task queries.
- **Calendar** — visual daily-note navigation.
- **Dataview** — queries that Bases cannot support.
- **Obsidian Git** — Git operations inside Obsidian after the vault works normally.

# First Operating Cycle

1. Create today’s Daily Note.
2. Capture one item in `01 Inbox`.
3. Create one Project from the Project template.
4. Create or update its Area and Goal links.
5. Confirm it appears in Active Projects.
6. Complete a Weekly Review.
7. Process the Inbox item.
8. Run the audit script.

Do not expand the system until this cycle works without broken links, blank required project properties, or Base errors.

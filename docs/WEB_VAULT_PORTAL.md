# LifeOS Web Vault Portal

The LifeOS Enterprise web application is a read-only portal over the canonical Obsidian Markdown vault. GitHub remains version control; Obsidian Markdown remains the data source; Vercel hosts the interactive interface.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Command Center home (today, next action, blockers, integrations) |
| `/conversation` | Ask LifeOS — typed/voice conversation and approval gate |
| `/projects` | Project workspaces with resume actions |
| `/today` | Today's mission and outcomes |
| `/inbox` | Capture notes, tasks, ideas, reminders |
| `/journal` | Today's journal entry |
| `/learning` | Continue learning or add a topic |
| `/files` | Find notes without browsing folders first |
| `/automations` | n8n / automation status (honest, not rebuilt n8n) |
| `/integrations` | Live integration health |
| `/settings` | Owner posture and where things live |
| `/more` | Advanced / vault browse destinations |
| `/dashboard` | Legacy widget workspace (advanced) |
| `/templates` | Human template catalog (no raw placeholders) |
| `/search` | Advanced vault search |
| `/note/[...slug]` | Note reader; project notes open as workspaces |
| `/attachments/[...path]` | Approved attachment files |
| `/tasks`, `/businesses`, `/growth`, `/intelligence`, `/agents`, `/resources`, `/people`, `/reviews`, `/sops`, `/archive`, `/daily-brief`, `/portfolio` | Advanced / More — capabilities kept, not primary nav |

## Privacy model

Excluded from indexing and all API/UI output:

- `.git/`, `.github/`, `.obsidian/`, `.vercel/`, `node_modules/`
- Environment and credential files (`.env*`, `*.pem`, `*.key`)
- Application source (`app/`, `components/`, `lib/`, `tests/`, `scripts/`, `integrations/`)
- Directories named `private` or `.private`
- Notes with `private: true`, `publish: false`, or `web_visibility: private`
- Wikilinks that target private notes resolve as unresolved (paths are never leaked)
- Attachments are limited to files under `40 Resources/` after path-containment checks
- `robots.txt` disallows crawl indexing by default

Canonical exclusion rules live in `lib/vault/exclusions.ts`. See also `docs/THIRD_PARTY.md`.

## Architecture

```
Markdown vault (Git) → lib/vault/build-index.ts → lib/vault/index.ts → Next.js routes/components
```

The existing dashboard widgets continue to load through `lib/lifeos/vault-data.ts`, which now reads from the shared vault index.

## Validation

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\audit-vault.ps1
```

## Known limitations (v1)

- Read-only: no vault writes from the web app
- Dataview and Obsidian Bases blocks are not executed server-side
- Quick capture remains browser-local storage
- Duplicate basenames resolve to the first indexed match unless a path-qualified wikilink is used

## Attribution

Portal patterns were informed by public architecture discussions in [LifeOS-OSS](https://github.com/kcwoodfield/LifeOS-OSS) and [COG Second Brain](https://github.com/huytieu/COG-second-brain). Implementation is original to LifeOS Enterprise. COG Second Brain is MIT-licensed; no COG source files were copied into this repository. Dependency licenses are listed in `docs/THIRD_PARTY.md`.
